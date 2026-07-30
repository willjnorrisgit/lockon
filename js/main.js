import { initNav } from "./nav.js";
import { initTeam } from "./team.js";
import { initParallax } from "./parallax.js";
import { initReveal } from "./reveal.js";
import { initFlightRoute } from "./flight-route.js";
import { initCamera } from "./camera.js";

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initTeam();
  initParallax();
  initReveal();
  initFlightRoute();
  initCamera();
});
