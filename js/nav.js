/**
 * Top nav: hides on scroll down, reappears on scroll up.
 * A fast upward flick (large negative delta) shows it immediately,
 * even before the throttle would otherwise catch up.
 */
export function initNav() {
  const nav = document.querySelector(".nav");
  if (!nav) return;

  const HIDE_THRESHOLD = 96; // px scrolled down before nav is allowed to hide
  const FAST_SCROLL_DELTA = 40; // px/frame that counts as a "fast" flick

  let lastY = window.scrollY;
  let ticking = false;

  function update() {
    const currentY = window.scrollY;
    const delta = currentY - lastY;
    const scrollingDown = delta > 0;
    const scrollingUpFast = delta <= -FAST_SCROLL_DELTA;

    if (currentY <= HIDE_THRESHOLD) {
      nav.classList.remove("nav--hidden");
    } else if (scrollingUpFast) {
      nav.classList.remove("nav--hidden");
    } else if (scrollingDown) {
      nav.classList.add("nav--hidden");
    } else if (delta < 0) {
      nav.classList.remove("nav--hidden");
    }

    lastY = currentY;
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );
}
