/**
 * Cinematic section entrance: toggles `.is-visible` on `.reveal` elements
 * as their section crosses into/out of view, driving the mask/fade/rise
 * defined in css/depth.css. Re-triggers each time (class is removed on
 * exit), matching a title-sequence "reveal on arrival" feel rather than
 * a one-shot page-load animation.
 */
export function initReveal() {
  const targets = Array.from(document.querySelectorAll(".reveal"));
  if (!targets.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    },
    { threshold: 0.25 }
  );

  targets.forEach((el) => observer.observe(el));
}
