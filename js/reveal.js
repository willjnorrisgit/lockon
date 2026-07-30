/**
 * Cinematic crossfade between sections: each `.reveal` element's
 * opacity/rise is driven continuously by its own IntersectionObserver
 * ratio, not toggled as a single on/off class. Two consequences that
 * matter here: (1) the outgoing section visibly dims as it scrolls away
 * at the same time the incoming one brightens — a real crossfade, not
 * just a fade-in on arrival — and (2) full opacity is reached well before
 * a section is entirely in view (see FADE_COMPLETE_AT), so the handoff
 * reads as a deliberate, fairly quick crossfade rather than a slow wash
 * spread across the whole scroll distance.
 */
export function initReveal() {
  const targets = Array.from(document.querySelectorAll(".reveal"));
  if (!targets.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    targets.forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    return;
  }

  const FADE_COMPLETE_AT = 0.6; // intersection ratio at which opacity hits 1
  const RISE_DISTANCE = 48; // px translateY at opacity 0

  function apply(entry) {
    const strength = Math.min(entry.intersectionRatio / FADE_COMPLETE_AT, 1);
    entry.target.style.opacity = strength.toFixed(3);
    entry.target.style.transform = `translateY(${((1 - strength) * RISE_DISTANCE).toFixed(1)}px)`;
  }

  const thresholds = Array.from({ length: 41 }, (_, i) => i / 40);
  const observer = new IntersectionObserver((entries) => entries.forEach(apply), {
    threshold: thresholds,
  });

  targets.forEach((el) => observer.observe(el));
}
