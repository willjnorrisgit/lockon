/**
 * Scroll-progress dot sidebar: highlights the dot for whichever section
 * is currently in view, and scrolls to a section when its dot is clicked.
 */
export function initDots() {
  const sections = Array.from(document.querySelectorAll(".section[id]"));
  const dotItems = Array.from(document.querySelectorAll(".dots__item"));
  if (!sections.length || !dotItems.length) return;

  const dotsByTarget = new Map(dotItems.map((item) => [item.dataset.target, item]));

  function setActive(id) {
    dotItems.forEach((item) => {
      item.setAttribute("aria-current", item.dataset.target === id ? "true" : "false");
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    },
    { threshold: 0.5 }
  );

  sections.forEach((section) => observer.observe(section));

  dotItems.forEach((item) => {
    item.addEventListener("click", () => {
      const target = document.getElementById(item.dataset.target);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // Set an initial active dot on load
  if (sections[0]) setActive(sections[0].id);
}
