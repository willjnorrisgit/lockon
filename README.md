# Lock On — Website Rebuild

Static, single-page, scroll-driven site for Lock On (aerospace &amp; defence
consultancy). Plain HTML/CSS/JS — no framework, no build step, no backend.

## Structure

```
index.html                 All markup, in section order
css/
  variables.css             Design tokens (colour, type scale, spacing)
  base.css                  Reset + shared section scaffolding + scroll-snap
  nav.css                   Top nav bar
  dots.css                  Scroll-progress dot sidebar
  sections/
    landing.css              01 — hero video/fallback, logo, tagline
    what-we-do.css           02 — capability list
    why-us.css                03 — differentiator grid
    team.css                   04 — team card grid + hover/tap reveal
    contact.css                 05 — contact block
js/
  main.js                   Entry point, wires everything up on load
  nav.js                    Hide-on-scroll-down / show-on-scroll-up nav
  dots.js                   IntersectionObserver-driven active dot + click-to-scroll
  team.js                   Touch/tap fallback for the team hover reveal
assets/
  video/                    Hero background video goes here (see its README)
  img/                      Poster frame + team photos go here (see its README)
```

Each section's markup lives in one clearly-commented block in `index.html`,
and its styling is fully isolated to its own file in `css/sections/`, so you
can hand over one section at a time without touching the others.

## Running locally

ES modules (`js/main.js`) won't load over `file://` in most browsers — serve
the folder instead:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open the printed localhost URL.

## Placeholder content to confirm before launch

Real copy/assets weren't available to pull in automatically (lockon.ltd
blocks automated fetches), so the following are placeholders and should be
swapped for the real thing:

- **Hero video** — `assets/video/hero.mp4` / `.webm` don't exist yet; see
  `assets/video/README.md` for spec + ffmpeg compression commands. The page
  degrades gracefully to an animated fallback backdrop until they're added.
- **Team roster** — the four cards in the "Meet the Team" section
  (`index.html`, `#team`) use placeholder names/roles/bios. Replace with the
  real team, and swap the initials-on-dark-background placeholder for actual
  photography (see `assets/img/README.md`).
- **Contact details** — `info@lockon.ltd` and "London, United Kingdom" in the
  `#contact` section are placeholders; confirm the real inbox and registered
  address.

## Design system

- **Palette** (monochrome, no accent hue — tokens in `css/variables.css`):
  `#0A0A0A` background, `#1A1A1A` alternate section background, `#FFFFFF`
  headings, `#A0A0A0` body text, `#2E2E2E` dividers, `#E5E5E5` active/hover
  state. Sections alternate background between the two blacks for separation
  without introducing colour.
- **Type**: Inter (Google Fonts, with a system-font fallback stack). Headings
  are bold, uppercase, wide letter-spacing; body copy is light-weight,
  sentence case, grey. Sizes are driven by shared `clamp()` tokens
  (`--fs-hero`, `--fs-h2`, `--fs-h3`, `--fs-body`) so the scale stays
  consistent across every section.

## Interaction notes

- **Scroll-progress dots** (`js/dots.js`) use one `IntersectionObserver`
  watching all five `<section>`s; whichever is ≥50% in view gets the active
  dot. Clicking a dot calls `scrollIntoView({ behavior: "smooth" })`.
- **Nav hide/show** (`js/nav.js`) tracks scroll delta per animation frame:
  scrolling down past 96px hides it, scrolling up (or a fast upward flick)
  shows it immediately.
- **Team hover/tap** — desktop reveal is pure CSS (`:hover` / `:focus-visible`
  in `css/sections/team.css`, gated to `(hover: hover) and (pointer: fine)`).
  `js/team.js` only runs on touch devices, toggling an `.is-active` class on
  tap (and closing others / closing on outside-tap), so mobile gets the same
  reveal without needing hover.
- **Smooth scroll** — `scroll-snap-type: y proximity` on the page plus
  `scroll-behavior: smooth`, so wheel/trackpad scrolling settles on section
  boundaries without feeling "trapped" the way `mandatory` snapping can.

## Deployment

No build step — deploy the repo root as-is to Netlify, Vercel, or Cloudflare
Pages (static site, publish directory `/`, no build command needed).
