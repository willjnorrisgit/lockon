/**
 * Flight route: a decorative rail running from the top of What We Do to
 * the footer. A dim dashed guide line always shows the full route; a
 * brighter "flown" overlay draws itself in via stroke-dashoffset as the
 * user scrolls through that range, a small plane marker travels along it
 * (rotated to match the path's tangent), and a node per section lights up
 * amber via IntersectionObserver — independently of scroll direction, so
 * scrolling back up un-lights a node exactly like scrolling down lit it.
 *
 * The path geometry is built at runtime (not hardcoded in the SVG) because
 * a static viewBox stretched with preserveAspectRatio="none" to fill a
 * fixed-height rail would scale non-uniformly and turn the node circles
 * into ellipses. Measuring the rail's actual pixel size and building the
 * path in that same coordinate space keeps 1 SVG unit == 1 CSS pixel, so
 * circles stay circular regardless of viewport height.
 */
export function initFlightRoute() {
  const root = document.querySelector(".flight-route");
  if (!root) return;

  const svg = root.querySelector(".flight-route__svg");
  const basePath = root.querySelector(".flight-route__base");
  const progressPath = root.querySelector(".flight-route__progress");
  const plane = root.querySelector(".flight-route__plane");
  const nodeEls = Array.from(root.querySelectorAll(".flight-route__node"));

  const sectionIds = nodeEls.map((el) => el.dataset.target);
  const sections = sectionIds.map((id) => document.getElementById(id));
  const footer = document.querySelector(".site-footer");

  if (sections.some((el) => !el) || !footer) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let totalLength = 0;
  let rangeStart = 0;
  let rangeEnd = 1;
  let nodeFractions = [];

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  /** Smooth vertical path through waypoints, alternating a small horizontal
   * sway left/right so it reads as a route with turns (and so the plane's
   * rotation has something to actually show). Waypoints are the node
   * fractions themselves, so the line visibly kinks at each node. */
  function buildPathD(width, height, fractions) {
    const centerX = width / 2;
    const amplitude = Math.min(centerX - 5, 9);
    const swayPattern = [0, -1, 1, -1, 1, 0];
    const points = [0, ...fractions, 1].map((frac, i) => ({
      x: centerX + swayPattern[i % swayPattern.length] * amplitude,
      y: frac * height,
    }));

    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const midY = (prev.y + curr.y) / 2;
      d += ` C${prev.x},${midY} ${curr.x},${midY} ${curr.x},${curr.y}`;
    }
    return d;
  }

  function measure() {
    const rect = root.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    if (width === 0 || height === 0) return;

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    rangeStart = sections[0].offsetTop;
    rangeEnd = footer.offsetTop;
    const span = Math.max(1, rangeEnd - rangeStart);
    nodeFractions = sections.map((sec) => clamp01((sec.offsetTop - rangeStart) / span));

    const d = buildPathD(width, height, nodeFractions);
    basePath.setAttribute("d", d);
    progressPath.setAttribute("d", d);

    totalLength = progressPath.getTotalLength();
    progressPath.style.strokeDasharray = `${totalLength}`;

    nodeEls.forEach((nodeEl, i) => {
      const pt = progressPath.getPointAtLength(nodeFractions[i] * totalLength);
      nodeEl.querySelectorAll("circle").forEach((c) => {
        c.setAttribute("cx", pt.x);
        c.setAttribute("cy", pt.y);
      });
    });

    if (reducedMotion) {
      progressPath.style.strokeDashoffset = "0";
    }
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

    if (!reducedMotion && totalLength > 0) {
      progressPath.style.strokeDashoffset = `${totalLength * (1 - fraction)}`;

      const len = fraction * totalLength;
      const pt = progressPath.getPointAtLength(len);
      const lookAhead = Math.min(totalLength, len + 1.5);
      const ptAhead = progressPath.getPointAtLength(lookAhead);
      const angle = Math.atan2(ptAhead.y - pt.y, ptAhead.x - pt.x) * (180 / Math.PI);
      plane.setAttribute("transform", `translate(${pt.x} ${pt.y}) rotate(${angle})`);
      plane.style.opacity = fraction > 0.005 ? "1" : "0";
    }

    // A node is "reached" once scroll progress has caught up to it, not
    // just while its section happens to be the active one — so several
    // nodes stay lit as you continue past them (a route trail, not a
    // single active-item highlight, which the dots sidebar already does).
    // Re-evaluated on every tick, so scrolling back up un-lights it again.
    nodeFractions.forEach((nf, i) => {
      nodeEls[i].classList.toggle("is-lit", fraction >= nf - 0.001);
    });
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
  update();

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", () => {
    measure();
    update();
  });
}
