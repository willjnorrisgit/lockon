/**
 * Scroll-driven parallax. Every element carrying `data-parallax-speed`
 * moves relative to its own natural position as it passes through the
 * viewport — speed < 1 lags behind scroll (background), speed > 1 leads
 * it (foreground), speed = 1 is a no-op (stays put, i.e. "pinned").
 *
 * Deliberately not `background-attachment: fixed`: that only affects one
 * background layer, can't vary per element, and is known to be janky on
 * mobile Safari/Chrome. This instead batches every layer's read + write
 * into a single rAF tick per scroll, using getBoundingClientRect (cheap
 * for the handful of layers on this page) rather than tracking document
 * height/offsets by hand.
 */
export function initParallax() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const layers = Array.from(document.querySelectorAll("[data-parallax-speed]"));
  if (!layers.length) return;

  const MOBILE_BREAKPOINT = 768;
  const MOBILE_INTENSITY = 0.4; // fraction of full parallax depth kept on small screens

  let ticking = false;

  function update() {
    const viewportH = window.innerHeight;
    const isSmallScreen = window.innerWidth < MOBILE_BREAKPOINT;

    for (const layer of layers) {
      const baseSpeed = parseFloat(layer.dataset.parallaxSpeed) || 1;
      const speed = isSmallScreen ? 1 + (baseSpeed - 1) * MOBILE_INTENSITY : baseSpeed;

      const rect = layer.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      const distanceFromViewportCenter = elementCenter - viewportH / 2;

      // speed < 1 => lags (background); speed > 1 => leads (foreground)
      const offset = distanceFromViewportCenter * (speed - 1);
      layer.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    }

    ticking = false;
  }

  function onScrollOrResize() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);
  update();
}
