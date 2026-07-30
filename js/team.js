/**
 * Meet the Team: click/tap/keyboard opens an info panel inside that tile's
 * own square (no separate hover state — same behaviour on every input
 * method). Opening a tile closes any other open tile; clicking outside the
 * grid, or Escape, closes whatever's open.
 */
export function initTeam() {
  const cards = Array.from(document.querySelectorAll(".team-card"));
  if (!cards.length) return;

  function closeAll(except) {
    cards.forEach((card) => {
      if (card !== except) {
        card.classList.remove("is-open");
        card.setAttribute("aria-expanded", "false");
      }
    });
  }

  cards.forEach((card) => {
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-expanded", "false");

    card.addEventListener("click", (event) => {
      const alreadyOpen = card.classList.contains("is-open");
      closeAll(card);
      card.classList.toggle("is-open", !alreadyOpen);
      card.setAttribute("aria-expanded", String(!alreadyOpen));
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
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAll(null);
  });
}
