/**
 * Camera background, two acts:
 *
 * 1) Jet flyover — spans "What We Do" (start) through part-way into
 *    "Why Us" (JET_EXIT_FRACTION of the way through it). A single scroll
 *    fraction across that specific range drives one continuous move:
 *    assets/images/formation.jpg starts large on the right, translates
 *    left while shrinking, and by the exit point has moved fully past the
 *    left edge. It's parked off-screen (clamped, not reset) for the rest
 *    of the page, so it never reappears.
 * 2) Dark transition + runway reveal — from the jet's exit point through
 *    early "Team", the screen ramps to full black (no jet, no runway:
 *    just the layer's own dark backdrop deepening), then assets/images/
 *    runway.jpg crossfades in as the black recedes. Runway then stays put,
 *    unanimated, through Team and Contact.
 *
 * Both acts are driven by one rAF-throttled scroll handler and only ever
 * write `transform`/`opacity` per frame (compositor-only, no layout/paint).
 */
export function initCamera() {
  const root = document.querySelector(".camera-bg");
  if (!root) return;

  const jet = root.querySelector(".camera-bg__jet");
  const runway = root.querySelector(".camera-bg__runway");
  const fadeEl = root.querySelector(".camera-bg__fade");

  const whatWeDo = document.getElementById("what-we-do");
  const whyUs = document.getElementById("why-us");
  const team = document.getElementById("team");
  const contact = document.getElementById("contact");
  const footer = document.querySelector(".site-footer");
  if (!whatWeDo || !whyUs || !team || !contact || !footer || !jet || !runway || !fadeEl) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // How far into "Why Us" the jet has fully exited left (0-1 of that
  // section's own height) — leaves the remainder of Why Us as dark
  // transition, per the requested choreography.
  const JET_EXIT_FRACTION = 0.4;
  // How far into "Team" the runway reveal completes (0-1 of Team's own
  // height) — the crossfade finishes early so "Team through Contact"
  // reads as runway being the settled background.
  const RUNWAY_REVEAL_FRACTION = 0.25;

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
    jet.style.opacity = "1";
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

    // Act 1: jet flyover.
    const jetSpan = Math.max(1, jetRangeEnd - jetRangeStart);
    const jetFraction = clamp01((y - jetRangeStart) / jetSpan);
    if (!reducedMotion) {
      const t = smoothstep(jetFraction);
      const { translateX, translateY, scale } = jetTransformAt(t);
      jet.style.transform = `translate(${translateX.toFixed(1)}px, ${translateY.toFixed(1)}px) scale(${scale.toFixed(4)})`;
    }
    // Once fully exited, hidden for good — jetFraction is clamped at 1 so
    // it stays parked off-screen and this stays 0 for the rest of scroll.
    jet.style.opacity = jetFraction >= 1 ? "0" : "1";

    // Act 2: dark transition, then runway reveal.
    const darkSpan = Math.max(1, darkRangeEnd - darkRangeStart);
    const darkFraction = clamp01((y - darkRangeStart) / darkSpan);

    const runwaySpan = Math.max(1, runwayRangeEnd - darkRangeEnd);
    const runwayFraction = clamp01((y - darkRangeEnd) / runwaySpan);

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
