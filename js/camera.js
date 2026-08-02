/**
 * Camera background, three acts:
 *
 * 1) Jet flyover — spans "What We Do" (start) through part-way into
 *    "Why Us" (JET_EXIT_FRACTION of the way through it). A single scroll
 *    fraction across that specific range drives one continuous move:
 *    assets/images/formation.jpg starts at (just past) the right edge of
 *    the screen and travels the full screen width to past the left edge,
 *    shrinking as it goes. Over the tail of the flight (JET_BLUR_START
 *    onward) it ramps up a CSS blur while fading out, so it dissolves/
 *    smears out of view (heat-haze style) rather than hard-cutting against
 *    the dark backdrop. A second, much-blurrier masked copy of the same
 *    image (.camera-bg__jet-trail) trails behind it (screen-right, since
 *    it's flying left) over that same window, growing and fading like
 *    vapor/exhaust streaming off the rear of the aircraft. Both are parked
 *    off-screen (clamped, not reset) for the rest of the page, so neither
 *    reappears.
 * 2) Position-linked darkening, then a cockpit reveal — the screen doesn't
 *    darken on a separate timer. It's tied directly to the jet's own
 *    horizontal screen position: `darkness` is 0 while the jet's anchor
 *    point is still right of screen-center, then ramps 0->1 as that point
 *    crosses toward (and past) the left edge, reaching exactly 1 at the
 *    same instant the jet finishes exiting — so the grey-to-black shift
 *    reads as one continuous, position-driven transition rather than a
 *    boxy, independently-timed event. A matching vignette deepens in step
 *    with it for a more cinematic frame. assets/images/cockpit.jpg then
 *    fades in from that black — its own opacity ramps up across the whole
 *    reveal span, but the black overlay covering it clears over only the
 *    *first* COCKPIT_BLACK_CLEAR_FRACTION of that span (both eased,
 *    decoupled from each other rather than simple complementary opacities)
 *    so the dark hold reads as brief rather than the image visibly
 *    "fighting through" a slowly-lifting black overlay the whole time —
 *    holds, unanimated, through the rest of Why Us into early Team.
 * 3) A second dark beat partway through Team (TEAM_RUNWAY_START_FRACTION of
 *    its own height): cockpit.jpg fades to black, holds briefly, then
 *    assets/images/runway.jpg fades in from that same black — mirroring
 *    act 2's structure (and its decoupled black-clears-faster-than-the-
 *    image-reveals technique) rather than a plain crossfade between the
 *    two photos, so both dark beats in this file read as one consistent
 *    style. Runway then holds through the remainder of Team and all of
 *    Contact. This whole three-phase beat still fits inside the same
 *    overall span the earlier plain crossfade used — it's a change to the
 *    internal choreography, not the section timing.
 *
 * All three acts are driven by one rAF-throttled scroll handler and only
 * ever write `transform`/`opacity`/`filter:blur()` per frame (compositor-
 * only, no layout/paint). The position math (jet transform + darkness) is
 * computed unconditionally every frame, reduced motion or not — only
 * *applying* it to the jet/trail's visible transform/blur is skipped under
 * reduced motion, so the dark/vignette/cockpit/runway ramps stay tied to
 * the same (hypothetical) jet position either way instead of needing a
 * separate time-based fallback.
 */
export function initCamera() {
  const root = document.querySelector(".camera-bg");
  if (!root) return;

  const jetTrail = root.querySelector(".camera-bg__jet-trail");
  const jet = root.querySelector(".camera-bg__jet");
  const cockpit = root.querySelector(".camera-bg__cockpit");
  const runway = root.querySelector(".camera-bg__runway");
  const vignette = root.querySelector(".camera-bg__vignette");
  const fadeEl = root.querySelector(".camera-bg__fade");

  const whatWeDo = document.getElementById("what-we-do");
  const whyUs = document.getElementById("why-us");
  const team = document.getElementById("team");
  const contact = document.getElementById("contact");
  const footer = document.querySelector(".site-footer");
  if (
    !whatWeDo ||
    !whyUs ||
    !team ||
    !contact ||
    !footer ||
    !jetTrail ||
    !jet ||
    !cockpit ||
    !runway ||
    !vignette ||
    !fadeEl
  )
    return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // How far into "Why Us" the jet has fully exited left (0-1 of that
  // section's own height) — leaves the remainder of Why Us for the
  // darkening/runway-reveal handoff, per the requested choreography.
  const JET_EXIT_FRACTION = 0.4;
  // Where in the jet's own flight (0-1 of jetFraction) the exit blur+fade
  // starts ramping — only the tail of the flight dissolves, not the whole
  // thing, so it still reads as "flying off" before it "smears off".
  const JET_BLUR_START = 0.55;
  const JET_MAX_BLUR_PX = 22;
  // Vapor trail (.camera-bg__jet-trail): trails behind (screen-right of,
  // since the jet flies right-to-left) the jet, growing more offset,
  // larger, blurrier and more transparent as the jet dissolves, then
  // dispersing again before the exit point — JET_TRAIL_PEAK is where in
  // the dissolve (0-1) its opacity peaks before fading back out. A small
  // extra blur/opacity boost tied to `darkness` (below) makes it glow a
  // little more intensely as the screen approaches full black, so the
  // dissolve and the darkening read as one cinematic beat.
  const JET_TRAIL_MAX_OFFSET_PX = 240;
  const JET_TRAIL_GROWTH = 0.35;
  const JET_TRAIL_MAX_BLUR_PX = 55;
  const JET_TRAIL_MAX_OPACITY = 0.4;
  const JET_TRAIL_PEAK = 0.65;
  const JET_TRAIL_DARK_BLUR_BOOST_PX = 16;
  const JET_TRAIL_DARK_GLOW_BOOST = 0.25;
  // How far past the jet's own exit point (0-1 of the remaining Why-Us ->
  // Team span) the cockpit reveal takes to finish — it *starts* the instant
  // darkness hits 1 (no separate constant needed for that: see `update()`).
  // Shortened from 0.5 — combined with COCKPIT_BLACK_CLEAR_FRACTION below,
  // this is the "cockpit should appear sooner" knob.
  const COCKPIT_REVEAL_SPAN_FRACTION = 0.35;
  // The black overlay covering cockpit.jpg clears (eased) over only this
  // fraction of the reveal span above, while cockpit's own opacity ramps
  // across the *entire* span — i.e. the overlay lifts well before the image
  // reaches full brightness, rather than the two ramping down/up together
  // at the same rate. Plain complementary opacities (overlay = 1 - image)
  // compound multiplicatively when one sits on top of the other — the
  // visible result is image_opacity * (1 - overlay_opacity), which for
  // equal linear ramps works out to image_opacity², a curve that looks
  // like it "takes forever" to leave black before suddenly catching up.
  // Clearing the overlay faster than the image finishes fading in breaks
  // that compounding: darkness visibly lifts soon after the reveal starts,
  // then the image keeps gently resolving to full clarity — a shorter-
  // feeling hold that's still a fade, not a cut.
  const COCKPIT_BLACK_CLEAR_FRACTION = 0.5;
  // Peak vignette opacity at full darkness (subtle, not a hard black frame).
  const VIGNETTE_MAX_OPACITY = 0.55;
  // Act 3 — cockpit.jpg -> runway.jpg, both 0-1 of Team's own height
  // (Team.offsetTop -> Contact.offsetTop, mirroring how every other span in
  // this file is measured off the next section's offsetTop rather than a
  // guessed pixel height). Starting a touch before the midpoint means the
  // beat's *center* lands near halfway through Team, matching "cockpit
  // through roughly the first half of Team" — and finishing well short of
  // 1.0 leaves runway settled in for a while before Contact, not resolving
  // right up to the section boundary. Same total span as the plain
  // crossfade this replaced — only the internal choreography changed, via
  // TEAM_FADEOUT_END/HOLD_END/BLACK_CLEAR_END below (all cumulative
  // fractions of this same span, in order: cockpit fades to black by
  // FADEOUT_END, holds black until HOLD_END, then runway fades in from
  // black over the remainder, with the black overlay itself clearing by
  // BLACK_CLEAR_END — same faster-overlay-than-image technique as
  // COCKPIT_BLACK_CLEAR_FRACTION above, for the same reason).
  const TEAM_RUNWAY_START_FRACTION = 0.45;
  const TEAM_RUNWAY_SPAN_FRACTION = 0.25;
  const TEAM_FADEOUT_END = 0.3;
  const TEAM_HOLD_END = 0.45;
  const TEAM_BLACK_CLEAR_END = 0.75;

  const JET_FY = 0.58; // jet's vertical center in formation.jpg (natural-image fraction)
  const JET_FX_START = 0.6; // focal point (within the jet) used as the "jet position" reference for darkness
  // How much of the screen's left side stays plain grey at t=0 — a direct
  // fraction of viewport width, deliberately NOT expressed via a focal
  // point anchored at some multiple of containerW: the image is scaled to
  // *cover the viewport height* (see coverScale below), which on narrow/
  // portrait viewports makes its rendered width many times the viewport's
  // own width — a focal-point anchor that looked right on desktop left
  // almost no grey margin at all on mobile there. Sizing the start gap
  // directly off containerW keeps it consistent across aspect ratios.
  const JET_START_LEFT_GAP_FRACTION = 0.3;
  const JET_ZOOM_START = 1.3; // large, but not so zoomed-in that the gap above collapses on narrow viewports
  const JET_ZOOM_END = 0.75; // shrunk, on its way out

  // Overall layer fade-in/out (top of What We Do / down past the footer) —
  // shared between measure() and update(): measure() needs it to make sure
  // the fade-out zone actually fits inside the reachable scroll range (see
  // rangeEnd below), not just update()'s own opacity ramp.
  const FADE_ZONE = 140;

  let rangeStart = 0; // overall layer fade-in point (top of What We Do)
  let rangeEnd = 1; // overall layer fade-out point (capped at reachable max scroll)
  let jetRangeStart = 0;
  let jetRangeEnd = 1;
  let cockpitRangeStart = 0;
  let cockpitRangeEnd = 1;
  let teamRunwayRangeStart = 0;
  let teamRunwayRangeEnd = 1;
  let jetNaturalW = 1920;
  let jetNaturalH = 1280;
  let jetExitAnchorX = 0; // the focal point's screen X at t=1, cached at measure time

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  function measure() {
    rangeStart = whatWeDo.offsetTop;
    const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
    // Fade-out normally starts at footer.offsetTop and finishes FADE_ZONE
    // past it — but a footer shorter than one viewport (true here; true for
    // almost any compact footer) puts that finish point beyond maxScrollY,
    // which scrollY can physically never reach. Capping rangeEnd at plain
    // maxScrollY in that case (rather than pulling the whole zone back)
    // made `y > rangeEnd` permanently false past the last scroll position —
    // the layer never faded and sat opaque over the footer. Capping the
    // *finish* point at maxScrollY and working FADE_ZONE back from there
    // instead guarantees opacity actually reaches 0 by the max reachable
    // scroll position either way.
    rangeEnd = Math.min(footer.offsetTop, maxScrollY - FADE_ZONE);

    jetRangeStart = whatWeDo.offsetTop;
    jetRangeEnd = whyUs.offsetTop + (team.offsetTop - whyUs.offsetTop) * JET_EXIT_FRACTION;

    // No gap: cockpit starts revealing the instant darkness reaches 1,
    // which by construction happens exactly at jetRangeEnd (see update()).
    cockpitRangeStart = jetRangeEnd;
    cockpitRangeEnd = jetRangeEnd + (team.offsetTop - jetRangeEnd) * COCKPIT_REVEAL_SPAN_FRACTION;

    // Act 3 — see TEAM_RUNWAY_START_FRACTION/SPAN_FRACTION above.
    const teamSpan = contact.offsetTop - team.offsetTop;
    teamRunwayRangeStart = team.offsetTop + teamSpan * TEAM_RUNWAY_START_FRACTION;
    teamRunwayRangeEnd = teamRunwayRangeStart + teamSpan * TEAM_RUNWAY_SPAN_FRACTION;

    if (jet.naturalWidth) {
      jetNaturalW = jet.naturalWidth;
      jetNaturalH = jet.naturalHeight;
    }

    const exit = jetTransformAt(1);
    jetExitAnchorX = exit.translateX + JET_FX_START * jetNaturalW * exit.scale;
  }

  /** translateX/scale for the jet at eased flyover fraction t (0 = start,
   * just past the right edge; 1 = fully exited past the left edge). */
  function jetTransformAt(t) {
    const containerW = window.innerWidth;
    const containerH = window.innerHeight;
    const coverScale = Math.max(containerW / jetNaturalW, containerH / jetNaturalH);

    const scaleStart = coverScale * JET_ZOOM_START;
    const scaleEnd = coverScale * JET_ZOOM_END;
    const scale = scaleStart + (scaleEnd - scaleStart) * t;

    const txStart = containerW * JET_START_LEFT_GAP_FRACTION; // image's own left edge sits this far in — everything left of it is plain background
    const txEnd = -(jetNaturalW * scaleEnd) - 60; // fully past the left edge, plus margin
    const translateX = txStart + (txEnd - txStart) * t;
    const translateY = containerH / 2 - JET_FY * jetNaturalH * scale;

    return { translateX, translateY, scale };
  }

  function applyJetStatic() {
    const { translateX, translateY, scale } = jetTransformAt(0);
    jet.style.transform = `translate(${translateX.toFixed(1)}px, ${translateY.toFixed(1)}px) scale(${scale.toFixed(4)})`;
    jet.style.setProperty("--jet-blur", "0px");
    jet.style.opacity = "1";
    // No vapor trail under reduced motion — it's a continuous dissolve
    // effect, not a static framing choice.
    jetTrail.style.opacity = "0";
  }

  function update() {
    const y = window.scrollY;

    // Overall layer visibility — faded in/out at the very top/bottom of
    // its whole active span so it's invisible over Landing and the footer.
    let layerOpacity = 1;
    if (y < rangeStart) layerOpacity = clamp01(1 - (rangeStart - y) / FADE_ZONE);
    else if (y > rangeEnd) layerOpacity = clamp01(1 - (y - rangeEnd) / FADE_ZONE);
    root.style.opacity = layerOpacity.toFixed(3);

    // Act 1 math — computed unconditionally (cheap: a handful of
    // multiplications) so the darkness derived from it stays position-
    // linked even under reduced motion, where the jet itself just sits at
    // its start pose rather than actually animating through these values.
    const jetSpan = Math.max(1, jetRangeEnd - jetRangeStart);
    const jetFraction = clamp01((y - jetRangeStart) / jetSpan);
    const t = smoothstep(jetFraction);
    const { translateX, translateY, scale } = jetTransformAt(t);
    const dissolve = smoothstep(clamp01((jetFraction - JET_BLUR_START) / (1 - JET_BLUR_START)));

    // Darkness tied directly to the jet's current horizontal position, not
    // scroll time: 0 while its anchor point is right of screen-center,
    // ramping to exactly 1 as that point reaches its (fully-exited) end
    // position — see jetExitAnchorX in measure().
    const containerW = window.innerWidth;
    const anchorX = translateX + JET_FX_START * jetNaturalW * scale;
    const midX = containerW / 2;
    const darkness = smoothstep(clamp01((midX - anchorX) / (midX - jetExitAnchorX)));

    if (!reducedMotion) {
      jet.style.transform = `translate(${translateX.toFixed(1)}px, ${translateY.toFixed(1)}px) scale(${scale.toFixed(4)})`;
      jet.style.setProperty("--jet-blur", `${(dissolve * JET_MAX_BLUR_PX).toFixed(1)}px`);

      // Vapor trail: same base position/scale as the jet, offset further
      // right (rearward) and grown as dissolve increases; opacity rises
      // then falls (JET_TRAIL_PEAK) so it billows out behind the aircraft
      // and disperses again by the time the jet is fully gone. A small
      // extra blur/glow boost tracks `darkness` so it intensifies slightly
      // as the screen approaches full black, tying the two beats together.
      const trailOffset = JET_TRAIL_MAX_OFFSET_PX * dissolve;
      const trailScale = scale * (1 + JET_TRAIL_GROWTH * dissolve);
      jetTrail.style.transform = `translate(${(translateX + trailOffset).toFixed(1)}px, ${translateY.toFixed(1)}px) scale(${trailScale.toFixed(4)})`;
      const trailBlur = dissolve * JET_TRAIL_MAX_BLUR_PX + darkness * JET_TRAIL_DARK_BLUR_BOOST_PX;
      jetTrail.style.setProperty("--jet-trail-blur", `${trailBlur.toFixed(1)}px`);
      const trailRise = smoothstep(clamp01(dissolve / JET_TRAIL_PEAK));
      const trailFall = smoothstep(clamp01((dissolve - JET_TRAIL_PEAK) / (1 - JET_TRAIL_PEAK)));
      const trailOpacity = JET_TRAIL_MAX_OPACITY * trailRise * (1 - trailFall) * (1 + darkness * JET_TRAIL_DARK_GLOW_BOOST);
      jetTrail.style.opacity = trailOpacity.toFixed(3);
    }
    // Once fully dissolved (which lands at/after the exit point, since
    // jetFraction is clamped at 1 past it), hidden for good — it can't
    // drift back into view later.
    jet.style.opacity = reducedMotion ? (jetFraction >= 1 ? "0" : "1") : (1 - dissolve).toFixed(3);

    // Act 2: cockpit.jpg starts fading in the instant darkness reaches 1
    // (which happens exactly at jetRangeEnd) — no added delay — and
    // finishes over COCKPIT_REVEAL_SPAN_FRACTION of the remaining distance
    // to Team. Its own opacity ramps across the whole span; the black
    // overlay on top of it clears faster (COCKPIT_BLACK_CLEAR_FRACTION) so
    // the dark hold reads as brief without the reveal itself feeling
    // instant — see the constant comments above for why these are
    // deliberately decoupled rather than simple complementary opacities.
    const cockpitSpan = Math.max(1, cockpitRangeEnd - cockpitRangeStart);
    const cockpitFraction = clamp01((y - cockpitRangeStart) / cockpitSpan);
    const cockpitRevealFraction = smoothstep(cockpitFraction);
    const cockpitBlackClear = smoothstep(clamp01(cockpitFraction / COCKPIT_BLACK_CLEAR_FRACTION));

    // Black (and the matching vignette) ramp up with position-linked
    // darkness (still 1 throughout this act — the jet's fully exited by
    // now), then back down as the overlay clears, per cockpitBlackClear
    // above rather than 1:1 with cockpit's own reveal.
    const exitBlackOpacity = darkness * (1 - cockpitBlackClear);

    // Act 3: partway through Team, cockpit.jpg fades to black, holds, then
    // runway.jpg fades in from that same black — mirroring act 2's
    // structure/technique instead of a plain crossfade (see header comment
    // and the TEAM_* constants above). `f` is this beat's own 0-1 position
    // across its span, sub-divided into fade-out / hold / reveal phases.
    const teamRunwaySpan = Math.max(1, teamRunwayRangeEnd - teamRunwayRangeStart);
    const f = clamp01((y - teamRunwayRangeStart) / teamRunwaySpan);

    const cockpitFadeOut = smoothstep(clamp01(f / TEAM_FADEOUT_END));
    const runwayReveal = smoothstep(clamp01((f - TEAM_HOLD_END) / (1 - TEAM_HOLD_END)));
    const teamBlackClear = smoothstep(
      clamp01((f - TEAM_HOLD_END) / (TEAM_BLACK_CLEAR_END - TEAM_HOLD_END))
    );
    // 0 at f=0 (nothing's happened yet), ramps to 1 as cockpit fades out
    // (by TEAM_FADEOUT_END), holds at 1 through TEAM_HOLD_END, then ramps
    // back to 0 as teamBlackClear catches up (by TEAM_BLACK_CLEAR_END).
    const teamBlackOpacity = cockpitFadeOut * (1 - teamBlackClear);

    fadeEl.style.opacity = Math.max(exitBlackOpacity, teamBlackOpacity).toFixed(3);
    vignette.style.opacity = (
      Math.max(exitBlackOpacity, teamBlackOpacity) * VIGNETTE_MAX_OPACITY
    ).toFixed(3);

    cockpit.style.opacity = (cockpitRevealFraction * (1 - cockpitFadeOut)).toFixed(3);
    runway.style.opacity = runwayReveal.toFixed(3);
  }

  let ticking = false;
  function onScrollOrResize() {
    if (!ticking) {
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
      ticking = true;
    }
  }

  measure();
  if (reducedMotion) applyJetStatic();
  update();

  jet.addEventListener("load", () => {
    measure();
    if (reducedMotion) applyJetStatic();
    update();
  });

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", () => {
    measure();
    if (reducedMotion) applyJetStatic();
    update();
  });
}
