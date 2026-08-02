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
 * 2) Position-linked darkening, then a cockpit reveal. Both this and act 3
 *    below are built from four named transitions — jet-exit -> dark,
 *    dark -> cockpit, cockpit -> dark, dark -> runway — that all share one
 *    duration (TRANSITION_SPAN_PX) and the same smoothstep ease, so the
 *    whole sequence reads as one consistent, deliberate rhythm rather than
 *    four different speeds. "Jet-exit -> dark" ends exactly at jetRangeEnd
 *    (the same instant the jet finishes exiting, so the grey-to-black
 *    shift still reads as caused by the jet leaving, not an independently-
 *    timed event) and ramps for TRANSITION_SPAN_PX before that. A matching
 *    vignette deepens in step for a more cinematic frame, and the vapor
 *    trail gets a small extra blur/opacity boost tied to the same value so
 *    it reads as glowing a little more intensely as the screen approaches
 *    full black. "Dark -> cockpit" starts immediately after (no gap) and
 *    fades assets/images/cockpit.jpg in from that black: its own opacity
 *    ramps across the *entire* transition, but the black overlay covering
 *    it clears over only the first COCKPIT_BLACK_CLEAR_FRACTION of it —
 *    deliberately not 1:1 with cockpit's own reveal. Plain complementary
 *    opacities (overlay = 1 - image) compound multiplicatively when one
 *    sits on top of the other: the visible result is image_opacity * (1 -
 *    overlay_opacity), which for two equal ramps works out to
 *    image_opacity², a curve that reads as "stuck in black" for a long
 *    first stretch before suddenly catching up. Clearing the overlay well
 *    ahead of the image breaks that compounding, so cockpit is visibly
 *    present soon after the transition starts, while its own brightness
 *    keeps gently resolving to full across the whole (deliberately long)
 *    transition rather than popping in instantly. Cockpit then holds,
 *    unanimated, through the rest of Why Us into early Team.
 * 3) The other two named transitions, partway through Team
 *    (TEAM_TRANSITION_START_FRACTION of its own height): "cockpit -> dark"
 *    fades assets/images/cockpit.jpg out to black over TRANSITION_SPAN_PX,
 *    then "dark -> runway" immediately fades assets/images/runway.jpg in
 *    from that same black, using the same overlay-clears-faster-than-image
 *    technique as act 2 (RUNWAY_BLACK_CLEAR_FRACTION). Runway then holds
 *    through the remainder of Team and all of Contact.
 *
 * All three acts are driven by one rAF-throttled scroll handler and only
 * ever write `transform`/`opacity`/`filter:blur()` per frame (compositor-
 * only, no layout/paint). The position math (jet transform) is computed
 * unconditionally every frame, reduced motion or not — only *applying* it
 * to the jet/trail's visible transform/blur is skipped under reduced
 * motion, so the dark/vignette/cockpit/runway ramps (all scroll-position-
 * driven, not motion-driven) stay identical either way instead of needing
 * a separate time-based fallback.
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
  // darkening/cockpit-reveal handoff, per the requested choreography.
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

  // Shared duration (scroll px) for EVERY fade transition below: jet-exit
  // -> dark, dark -> cockpit, cockpit -> dark, dark -> runway. One knob,
  // same value for all four, so the whole sequence reads as a single
  // consistent, unhurried rhythm rather than four different speeds. This
  // is deliberately long — roughly 2x this file's previous per-transition
  // spans — per "noticeably slower, not a minor adjustment." Sized against
  // the tightest-fitting viewport measured (desktop: ~540px of Why Us left
  // after the jet exits, ~1700px of Team height), leaving a real hold
  // after "dark -> cockpit" and a real settled buffer after "dark ->
  // runway" before Contact on every viewport checked, not just the
  // roomiest one.
  const TRANSITION_SPAN_PX = 420;
  // Within "dark -> cockpit", the black overlay clears (eased) by this
  // fraction of TRANSITION_SPAN_PX, well before cockpit's own opacity
  // (which ramps across the *entire* transition) finishes fading in — see
  // the file header for why these are deliberately decoupled rather than
  // simple complementary opacities. Well below this file's previous pass
  // (0.5 of a 189px span = ~95px) — "cockpit needs to appear even sooner,
  // still too long" — 0.15 of this transition's now-longer 420px span is
  // ~63px, a clear reduction in absolute scroll distance despite the
  // transition itself taking longer overall.
  const COCKPIT_BLACK_CLEAR_FRACTION = 0.15;
  // Same technique/reasoning, for "dark -> runway".
  const RUNWAY_BLACK_CLEAR_FRACTION = 0.15;
  // Peak vignette opacity at full darkness (subtle, not a hard black frame).
  const VIGNETTE_MAX_OPACITY = 0.55;
  // Where in Team's own height (team.offsetTop -> contact.offsetTop) the
  // "cockpit -> dark -> runway" pair starts — leaves cockpit holding
  // through roughly the first 40% of Team, matching "cockpit through
  // roughly the first half of Team," with both TRANSITION_SPAN_PX-long
  // transitions plus a real settled buffer still fitting before Contact.
  const TEAM_TRANSITION_START_FRACTION = 0.4;

  const JET_FY = 0.58; // jet's vertical center in formation.jpg (natural-image fraction)
  const JET_FX_START = 0.6; // focal point (within the jet) used to frame it — no longer feeds a darkness calculation, see act 2 above
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
  let darknessRangeStart = 0; // jet-exit -> dark
  let cockpitRangeStart = 0; // dark -> cockpit
  let teamDarkRangeStart = 0; // cockpit -> dark
  let teamRunwayRangeStart = 0; // dark -> runway
  let jetNaturalW = 1920;
  let jetNaturalH = 1280;

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

    // Transition 1 (jet-exit -> dark) ends exactly at jetRangeEnd, so full
    // black lands at the same instant the jet finishes exiting.
    darknessRangeStart = jetRangeEnd - TRANSITION_SPAN_PX;
    // Transition 2 (dark -> cockpit) starts immediately after — no gap.
    cockpitRangeStart = jetRangeEnd;

    // Transitions 3-4 (cockpit -> dark -> runway), back to back, partway
    // through Team.
    const teamSpan = contact.offsetTop - team.offsetTop;
    teamDarkRangeStart = team.offsetTop + teamSpan * TEAM_TRANSITION_START_FRACTION;
    teamRunwayRangeStart = teamDarkRangeStart + TRANSITION_SPAN_PX;

    if (jet.naturalWidth) {
      jetNaturalW = jet.naturalWidth;
      jetNaturalH = jet.naturalHeight;
    }
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
    // multiplications) so it stays available for act 2 below even under
    // reduced motion, where the jet itself just sits at its start pose
    // rather than actually animating through these values.
    const jetSpan = Math.max(1, jetRangeEnd - jetRangeStart);
    const jetFraction = clamp01((y - jetRangeStart) / jetSpan);
    const t = smoothstep(jetFraction);
    const { translateX, translateY, scale } = jetTransformAt(t);
    const dissolve = smoothstep(clamp01((jetFraction - JET_BLUR_START) / (1 - JET_BLUR_START)));

    // Transition 1: jet-exit -> dark — a fixed TRANSITION_SPAN_PX ramp
    // ending exactly at jetRangeEnd (see measure()), not tied to the jet's
    // continuous on-screen position the way earlier versions of this file
    // had it — that left this transition's *length* at the mercy of the
    // flyover's own geometry, which fought "make every transition the same
    // length." Runs unconditionally (like the rest of act 1's math above)
    // so it stays scroll-position-driven under reduced motion too.
    const darkness = smoothstep(clamp01((y - darknessRangeStart) / TRANSITION_SPAN_PX));

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

    // Transition 2: dark -> cockpit — see the constant comments above for
    // why the overlay-clear and the image-reveal are deliberately
    // decoupled rather than simple complementary opacities.
    const cockpitFraction = clamp01((y - cockpitRangeStart) / TRANSITION_SPAN_PX);
    const cockpitRevealFraction = smoothstep(cockpitFraction);
    const cockpitBlackClear = smoothstep(clamp01(cockpitFraction / COCKPIT_BLACK_CLEAR_FRACTION));
    const exitBlackOpacity = darkness * (1 - cockpitBlackClear);

    // Transitions 3-4: cockpit -> dark -> runway, back to back, each its
    // own TRANSITION_SPAN_PX. teamDarkFraction (3) ramps 0->1 as cockpit
    // fades out; teamRunwayFraction/runwayReveal (4) then ramp 0->1 as
    // runway fades in, with runwayBlackClear clearing the overlay ahead of
    // that reveal the same way cockpitBlackClear does in transition 2.
    const teamDarkFraction = smoothstep(clamp01((y - teamDarkRangeStart) / TRANSITION_SPAN_PX));
    const teamRunwayFraction = clamp01((y - teamRunwayRangeStart) / TRANSITION_SPAN_PX);
    const runwayReveal = smoothstep(teamRunwayFraction);
    const runwayBlackClear = smoothstep(clamp01(teamRunwayFraction / RUNWAY_BLACK_CLEAR_FRACTION));
    const teamBlackOpacity = teamDarkFraction * (1 - runwayBlackClear);

    const blackOpacity = Math.max(exitBlackOpacity, teamBlackOpacity);
    fadeEl.style.opacity = blackOpacity.toFixed(3);
    vignette.style.opacity = (blackOpacity * VIGNETTE_MAX_OPACITY).toFixed(3);

    cockpit.style.opacity = (cockpitRevealFraction * (1 - teamDarkFraction)).toFixed(3);
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
