/**
 * Camera background: one shared jet photo (assets/images/formation.jpg)
 * behind What We Do / Why Us / Team / Contact. A single continuous scroll
 * fraction across that whole range drives a pan+zoom interpolated between
 * per-section keyframes, so the "camera" reads as one fluid move rather
 * than snapping section to section — then fades to black through Contact.
 *
 * The transform math (`translate(Tx,Ty) scale(s)` with transform-origin at
 * the image's top-left) is chosen so it's directly verifiable: scaling
 * happens first (closest to the point in the transform list), so a point
 * at natural-image coordinates (fx*naturalW, fy*naturalH) always lands
 * exactly at (containerW/2, containerH/2), for any scale — see `update()`.
 * Both functions are compositor-only (no layout/paint per frame).
 */
export function initCamera() {
  const root = document.querySelector(".camera-bg");
  if (!root) return;

  const img = root.querySelector(".camera-bg__image");
  const fadeEl = root.querySelector(".camera-bg__fade");

  const sectionIds = ["what-we-do", "why-us", "team", "contact"];
  const sections = sectionIds.map((id) => document.getElementById(id));
  const footer = document.querySelector(".site-footer");
  if (sections.some((el) => !el) || !footer || !img || !fadeEl) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Framing per keyframe: fx/fy = focal point as a fraction of the natural
  // image; zoom = extra zoom on top of the baseline "cover" scale (always
  // >=1 with enough headroom that panning to an off-centre focal point
  // never exposes an edge — verified visually, not just by formula, since
  // the safe minimum depends on viewport aspect ratio too).
  const KEYFRAMES = [
    { fraction: 0, fx: 0.5, fy: 0.56, zoom: 1.1, black: 0 }, // top of What We Do: wide
    { fraction: null, fx: 0.27, fy: 0.58, zoom: 2.4, black: 0 }, // Why Us: nose
    { fraction: null, fx: 0.62, fy: 0.56, zoom: 1.3, black: 0 }, // Team: pulled back, different framing
    { fraction: null, fx: 0.5, fy: 0.5, zoom: 1.55, black: 0 }, // Contact start: begin fade
    { fraction: 1, fx: 0.5, fy: 0.45, zoom: 1.7, black: 1 }, // footer: fully black
  ];

  let rangeStart = 0;
  let rangeEnd = 1;
  let naturalW = 1920;
  let naturalH = 1280;

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  function measure() {
    rangeStart = sections[0].offsetTop;
    // footer.offsetTop is the semantic target ("end at the footer"), but
    // if the footer is shorter than one viewport the page can never
    // actually be scrolled that far (max scrollY tops out below it) — so
    // cap at whatever's really reachable, or fraction would never hit 1
    // and the fade-to-black/final framing would never fully complete.
    const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
    rangeEnd = Math.min(footer.offsetTop, maxScrollY);
    if (img.naturalWidth) {
      naturalW = img.naturalWidth;
      naturalH = img.naturalHeight;
    }
    const span = Math.max(1, rangeEnd - rangeStart);
    KEYFRAMES[1].fraction = clamp01((sections[1].offsetTop - rangeStart) / span); // why-us
    KEYFRAMES[2].fraction = clamp01((sections[2].offsetTop - rangeStart) / span); // team
    KEYFRAMES[3].fraction = clamp01((sections[3].offsetTop - rangeStart) / span); // contact
  }

  function interpolate(fraction) {
    let a = KEYFRAMES[0];
    let b = KEYFRAMES[KEYFRAMES.length - 1];
    for (let i = 0; i < KEYFRAMES.length - 1; i++) {
      if (fraction >= KEYFRAMES[i].fraction && fraction <= KEYFRAMES[i + 1].fraction) {
        a = KEYFRAMES[i];
        b = KEYFRAMES[i + 1];
        break;
      }
    }
    const span = b.fraction - a.fraction;
    const t = span > 0 ? smoothstep(clamp01((fraction - a.fraction) / span)) : 0;
    return {
      fx: a.fx + (b.fx - a.fx) * t,
      fy: a.fy + (b.fy - a.fy) * t,
      zoom: a.zoom + (b.zoom - a.zoom) * t,
      black: a.black + (b.black - a.black) * t,
    };
  }

  function applyFraming(fx, fy, zoom) {
    const containerW = window.innerWidth;
    const containerH = window.innerHeight;
    const coverScale = Math.max(containerW / naturalW, containerH / naturalH);
    const totalScale = coverScale * zoom;
    const translateX = containerW / 2 - fx * naturalW * totalScale;
    const translateY = containerH / 2 - fy * naturalH * totalScale;
    img.style.transform = `translate(${translateX.toFixed(1)}px, ${translateY.toFixed(1)}px) scale(${totalScale.toFixed(4)})`;
  }

  function update() {
    const y = window.scrollY;
    const span = rangeEnd - rangeStart;
    const fraction = clamp01((y - rangeStart) / span);

    const fadeZone = 140;
    let opacity = 1;
    if (y < rangeStart) opacity = clamp01(1 - (rangeStart - y) / fadeZone);
    else if (y > rangeEnd) opacity = clamp01(1 - (y - rangeEnd) / fadeZone);
    root.style.opacity = opacity.toFixed(3);

    const state = interpolate(fraction);
    // The black fade-through-Contact is a simple opacity ramp, not camera
    // movement, so it keeps animating under reduced motion (same reasoning
    // as the flight-route nodes staying live there: a discrete/simple
    // state change isn't what prefers-reduced-motion is asking to disable).
    fadeEl.style.opacity = state.black.toFixed(3);

    if (reducedMotion) return;
    applyFraming(state.fx, state.fy, state.zoom);
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
  if (reducedMotion) {
    // Static, well-framed crop — the "Team" keyframe reads as a clear,
    // representative shot of the aircraft without the Why Us close-up's
    // more dramatic zoom.
    applyFraming(KEYFRAMES[2].fx, KEYFRAMES[2].fy, KEYFRAMES[2].zoom);
  }
  update();

  img.addEventListener("load", () => {
    measure();
    if (reducedMotion) applyFraming(KEYFRAMES[2].fx, KEYFRAMES[2].fy, KEYFRAMES[2].zoom);
    update();
  });

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", () => {
    measure();
    if (reducedMotion) applyFraming(KEYFRAMES[2].fx, KEYFRAMES[2].fy, KEYFRAMES[2].zoom);
    update();
  });
}
