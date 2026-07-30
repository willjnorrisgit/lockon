/**
 * Camera background, two acts:
 *
 * 1) Jet flyover — spans "What We Do" (start) through part-way into
 *    "Why Us" (JET_EXIT_FRACTION of the way through it). A single scroll
 *    fraction across that specific range drives one continuous move:
 *    assets/images/formation.jpg starts large on the right, translates
 *    left while shrinking, and over the tail of the flight (JET_BLUR_START
 *    onward) ramps up a CSS blur while fading out, so it dissolves/smears
 *    out of view (heat-haze style) rather than hard-cutting against the
 *    dark backdrop as a sharp-edged rectangle. A second, much-blurrier
 *    masked copy of the same image (.camera-bg__jet-trail) trails behind
 *    it (screen-right, since it's flying left) over that same window,
 *    growing and fading like vapor/exhaust streaming off the rear of the
 *    aircraft. Both are parked off-screen (clamped, not reset) for the
 *    rest of the page, so neither reappears.
 * 2) Dark transition + runway reveal — from the jet's exit point, the
 *    screen ramps toward black, then assets/images/runway.jpg crossfades
 *    in — starting before the dark ramp finishes (RUNWAY_START_INTO_DARK),
 *    so the reveal overlaps the transition instead of waiting for a beat
 *    of plain black first, and finishing early in Team
 *    (RUNWAY_REVEAL_FRACTION). Runway then stays put, unanimated, through
 *    Team and Contact.
 *
 * Both acts are driven by one rAF-throttled scroll handler and only ever
 * write `transform`/`opacity`/`filter:blur()` per frame (compositor-only,
 * no layout/paint).
 */
export function initCamera() {
  const root = document.querySelector(".camera-bg");
  if (!root) return;

  const jetTrail = root.querySelector(".camera-bg__jet-trail");
  const jet = root.querySelector(".camera-bg__jet");
  const runway = root.querySelector(".camera-bg__runway");
  const fadeEl = root.querySelector(".camera-bg__fade");

  const whatWeDo = document.getElementById("what-we-do");
  const whyUs = document.getElementById("why-us");
  const team = document.getElementById("team");
  const contact = document.getElementById("contact");
  const footer = document.querySelector(".site-footer");
  if (!whatWeDo || !whyUs || !team || !contact || !footer || !jetTrail || !jet || !runway || !fadeEl) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // How far into "Why Us" the jet has fully exited left (0-1 of that
  // section's own height) — leaves the remainder of Why Us as dark
  // transition, per the requested choreography.
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
  // the dissolve (0-1) its opacity peaks before fading back out.
  const JET_TRAIL_MAX_OFFSET_PX = 240;
  const JET_TRAIL_GROWTH = 0.35;
  const JET_TRAIL_MAX_BLUR_PX = 55;
  const JET_TRAIL_MAX_OPACITY = 0.4;
  const JET_TRAIL_PEAK = 0.65;
  // How far *into the dark ramp* (0-1 of the jet-exit -> Team-start span)
  // the runway starts crossfading in, and how far *into Team* (0-1 of
  // Team's own height) it finishes — both brought forward from the dark
  // range's tail so the runway reveal overlaps the dark transition instead
  // of waiting for a plain black screen first.
  const RUNWAY_START_INTO_DARK = 0.75;
  const RUNWAY_REVEAL_FRACTION = 0.12;

  const JET_FY = 0.58; // jet's vertical center in formation.jpg (natural-image fraction)
  const JET_FX_START = 0.6; // focal point (within the jet) framed at the right at t=0
  const JET_ZOOM_START = 1.7; // large
  const JET_ZOOM_END = 0.75; // shrunk, on its way out

  let rangeStart = 0; // overall layer fade-in point (top of What We Do)
  let rangeEnd = 1; // overall layer fade-out point (capped at reachable max scroll)
  let jetRangeStart = 0;
  let jetRangeEnd = 1;
  let darkRangeStart = 0;
  let darkRangeEnd = 1;
  let runwayRangeStart = 0;
  let runwayRangeEnd = 1;
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
    rangeEnd = Math.min(footer.offsetTop, maxScrollY);

    jetRangeStart = whatWeDo.offsetTop;
    jetRangeEnd = whyUs.offsetTop + (team.offsetTop - whyUs.offsetTop) * JET_EXIT_FRACTION;

    darkRangeStart = jetRangeEnd;
    darkRangeEnd = team.offsetTop;

    runwayRangeStart = darkRangeStart + (darkRangeEnd - darkRangeStart) * RUNWAY_START_INTO_DARK;
    runwayRangeEnd = team.offsetTop + (contact.offsetTop - team.offsetTop) * RUNWAY_REVEAL_FRACTION;

    if (jet.naturalWidth) {
      jetNaturalW = jet.naturalWidth;
      jetNaturalH = jet.naturalHeight;
    }
  }

  /** translateX/scale for the jet at eased flyover fraction t (0 = start
   * framing on the right, 1 = fully exited past the left edge). */
  function jetTransformAt(t) {
    const containerW = window.innerWidth;
    const containerH = window.innerHeight;
    const coverScale = Math.max(containerW / jetNaturalW, containerH / jetNaturalH);

    const scaleStart = coverScale * JET_ZOOM_START;
    const scaleEnd = coverScale * JET_ZOOM_END;
    const scale = scaleStart + (scaleEnd - scaleStart) * t;

    const txStart = containerW * 0.72 - JET_FX_START * jetNaturalW * scaleStart;
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

    // Act 1: jet flyover, dissolving into a blur near the exit instead of
    // hard-cutting — the last (1 - JET_BLUR_START) of the flight ramps
    // blur up and opacity down together (smoothstep-eased, so it thickens
    // gradually rather than appearing suddenly), so it smears/dissolves
    // out of view like heat haze rather than popping against the dark
    // backdrop as a hard-edged rectangle.
    const jetSpan = Math.max(1, jetRangeEnd - jetRangeStart);
    const jetFraction = clamp01((y - jetRangeStart) / jetSpan);
    const dissolve = reducedMotion
      ? 0
      : smoothstep(clamp01((jetFraction - JET_BLUR_START) / (1 - JET_BLUR_START)));
    if (!reducedMotion) {
      const t = smoothstep(jetFraction);
      const { translateX, translateY, scale } = jetTransformAt(t);
      jet.style.transform = `translate(${translateX.toFixed(1)}px, ${translateY.toFixed(1)}px) scale(${scale.toFixed(4)})`;
      jet.style.setProperty("--jet-blur", `${(dissolve * JET_MAX_BLUR_PX).toFixed(1)}px`);

      // Vapor trail: same base position/scale as the jet, offset further
      // right (rearward) and grown as dissolve increases; opacity rises
      // then falls (JET_TRAIL_PEAK) so it billows out behind the aircraft
      // and disperses again by the time the jet is fully gone.
      const trailOffset = JET_TRAIL_MAX_OFFSET_PX * dissolve;
      const trailScale = scale * (1 + JET_TRAIL_GROWTH * dissolve);
      jetTrail.style.transform = `translate(${(translateX + trailOffset).toFixed(1)}px, ${translateY.toFixed(1)}px) scale(${trailScale.toFixed(4)})`;
      jetTrail.style.setProperty("--jet-trail-blur", `${(dissolve * JET_TRAIL_MAX_BLUR_PX).toFixed(1)}px`);
      const trailRise = smoothstep(clamp01(dissolve / JET_TRAIL_PEAK));
      const trailFall = smoothstep(clamp01((dissolve - JET_TRAIL_PEAK) / (1 - JET_TRAIL_PEAK)));
      jetTrail.style.opacity = (JET_TRAIL_MAX_OPACITY * trailRise * (1 - trailFall)).toFixed(3);
    }
    // Once fully dissolved (which lands at/after the exit point, since
    // jetFraction is clamped at 1 past it), hidden for good — it can't
    // drift back into view later.
    jet.style.opacity = reducedMotion ? (jetFraction >= 1 ? "0" : "1") : (1 - dissolve).toFixed(3);

    // Act 2: dark transition, then runway reveal. The runway starts
    // crossfading in before the dark ramp finishes (RUNWAY_START_INTO_DARK)
    // so the two overlap — less of a plain black gap — and finishes early
    // in Team (RUNWAY_REVEAL_FRACTION).
    const darkSpan = Math.max(1, darkRangeEnd - darkRangeStart);
    const darkFraction = clamp01((y - darkRangeStart) / darkSpan);

    const runwaySpan = Math.max(1, runwayRangeEnd - runwayRangeStart);
    const runwayFraction = clamp01((y - runwayRangeStart) / runwaySpan);

    // Black ramps up through the dark range, then back down as the
    // runway crossfades in over it.
    const blackOpacity = darkFraction * (1 - runwayFraction);
    fadeEl.style.opacity = blackOpacity.toFixed(3);
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
