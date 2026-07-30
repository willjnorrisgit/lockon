import { initNav } from "./nav.js";
import { initDots } from "./dots.js";
import { initTeam } from "./team.js";
import { initParallax } from "./parallax.js";
import { initReveal } from "./reveal.js";

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initDots();
  initTeam();
  initParallax();
  initReveal();
});
