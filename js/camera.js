/**
 * Camera background, two acts:
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
 * 2) Position-linked darkening, then an immediate runway reveal — the
 *    screen doesn't darken on a separate timer. It's tied directly to the
 *    jet's own horizontal screen position: `darkness` is 0 while the jet's
 *    anchor point is still right of screen-center, then ramps 0->1 as that
 *    point crosses toward (and past) the left edge, reaching exactly 1 at
 *    the same instant the jet finishes exiting — so the grey-to-black
 *    shift reads as one continuous, position-driven transition rather
 *    than a boxy, independently-timed event. A matching vignette deepens
 *    in step with it for a more cinematic frame. The instant darkness
 *    hits 1, assets/images/runway.jpg starts crossfading in — no further
 *    delay — and stays put, unanimated, through Team and Contact.
 *
 * Both acts are driven by one rAF-throttled scroll handler and only ever
 * write `transform`/`opacity`/`filter:blur()` per frame (compositor-only,
 * no layout/paint). The position math (jet transform + darkness) is
 * computed unconditionally every frame, reduced motion or not — only
 * *applying* it to the jet/trail's visible transform/blur is skipped under
 * reduced motion, so the dark/vignette/runway ramp stays tied to the same
 * (hypothetical) jet position either way instead of needing a separate
 * time-based fallback.
 */
export function initCamera() {
  const root = document.querySelector(".camera-bg");
  if (!root) return;

  const jetTrail = root.querySelector(".camera-bg__jet-trail");
  const jet = root.querySelector(".camera-bg__jet");
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
  // Team span) the runway reveal takes to finish — it *starts* the instant
  // darkness hits 1 (no separate constant needed for that: see `update()`).
  const RUNWAY_REVEAL_SPAN_FRACTION = 0.5;
  // Peak vignette opacity at full darkness (subtle, not a hard black frame).
  const VIGNETTE_MAX_OPACITY = 0.55;

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

  let rangeStart = 0; // overall layer fade-in point (top of What We Do)
  let rangeEnd = 1; // overall layer fade-out point (capped at reachable max scroll)
  let jetRangeStart = 0;
  let jetRangeEnd = 1;
  let runwayRangeStart = 0;
  let runwayRangeEnd = 1;
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
    rangeEnd = Math.min(footer.offsetTop, maxScrollY);

    jetRangeStart = whatWeDo.offsetTop;
    jetRangeEnd = whyUs.offsetTop + (team.offsetTop - whyUs.offsetTop) * JET_EXIT_FRACTION;

    // No gap: the runway starts revealing the instant darkness reaches 1,
    // which by construction happens exactly at jetRangeEnd (see update()).
    runwayRangeStart = jetRangeEnd;
    runwayRangeEnd = jetRangeEnd + (team.offsetTop - jetRangeEnd) * RUNWAY_REVEAL_SPAN_FRACTION;

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
    const fadeZone = 140;
    let layerOpacity = 1;
    if (y < rangeStart) layerOpacity = clamp01(1 - (rangeStart - y) / fadeZone);
    else if (y > rangeEnd) layerOpacity = clamp01(1 - (y - rangeEnd) / fadeZone);
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

    // Act 2: the runway starts crossfading in the instant darkness
    // reaches 1 (which happens exactly at jetRangeEnd) — no added delay —
    // and finishes over RUNWAY_REVEAL_SPAN_FRACTION of the remaining
    // distance to Team.
    const runwaySpan = Math.max(1, runwayRangeEnd - runwayRangeStart);
    const runwayFraction = clamp01((y - runwayRangeStart) / runwaySpan);

    // Black (and the matching vignette) ramp up with position-linked
    // darkness, then back down together as the runway crossfades in.
    const blackOpacity = darkness * (1 - runwayFraction);
    fadeEl.style.opacity = blackOpacity.toFixed(3);
    vignette.style.opacity = (blackOpacity * VIGNETTE_MAX_OPACITY).toFixed(3);
    runway.style.opacity = runwayFraction.toFixed(3);
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
