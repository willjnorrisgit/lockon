/**
 * Meet the Team: desktop reveals bio on hover (pure CSS). This module adds
 * the touch/tap fallback — tapping a card toggles its reveal, tapping
 * elsewhere (or another card) closes it. Keyboard users get the same
 * behaviour via Enter/Space, on top of the CSS :focus-visible reveal.
 */
export function initTeam() {
  const cards = Array.from(document.querySelectorAll(".team-card"));
  if (!cards.length) return;

  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  if (!isTouch) return;

  function closeAll(except) {
    cards.forEach((card) => {
      if (card !== except) card.classList.remove("is-active");
    });
  }

  cards.forEach((card) => {
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");

    card.addEventListener("click", (event) => {
      const alreadyActive = card.classList.contains("is-active");
      closeAll(card);
      card.classList.toggle("is-active", !alreadyActive);
      event.stopPropagation();
    });

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        card.click();
      }
    });
  });

  document.addEventListener("click", () => closeAll(null));
}
