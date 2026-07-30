# Lock On — Website Rebuild

Static, single-page, scroll-driven site for Lock On (aerospace &amp; defence
consultancy). Plain HTML/CSS/JS — no framework, no build step, no backend.

Visual direction is cinematic/layered: real photography and footage with
scroll-driven parallax depth, a Ken Burns hero, and masked team cutouts,
rather than flat colour blocks.

## Structure

```
index.html                 All markup, in section order
css/
  variables.css             Design tokens (colour, type scale, spacing, easing)
  base.css                  Reset + shared section scaffolding + scroll-snap
  depth.css                 Background/foreground layering, section-entrance
                             reveal, and photography treatment shared by every
                             section except Landing
  nav.css                   Top nav bar
  dots.css                  Scroll-progress dot sidebar
  sections/
    landing.css              01 — hero video/fallback, Ken Burns, logo, tagline
    what-we-do.css           02 — capability cards over a parallax backdrop
    why-us.css                03 — differentiator grid over a parallax backdrop
    team.css                   04 — masked team cutouts + hover/tap reveal
    contact.css                 05 — contact block, low-intensity backdrop
js/
  main.js                   Entry point, wires everything up on load
  nav.js                    Hide-on-scroll-down / show-on-scroll-up nav
  dots.js                   IntersectionObserver-driven active dot + click-to-scroll
  team.js                   Touch/tap fallback for the team hover reveal
  parallax.js               rAF-throttled scroll-parallax engine
  reveal.js                 IntersectionObserver-driven section entrance (mask/fade)
assets/
  lockon-logo.png            Logo (nav + landing) — see below
  video/                    Hero background video (see its README)
  img/                      Poster frame + background stills (see its README)
  team/                     Team portraits (see its README)
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

## Asset status

- **Hero video** — done. `assets/video/hero.mp4` / `.webm` are the 8-second
  clip you provided (compressed from the original 1080×1920/2.6MB down to
  ~540×960, 688KB/262KB — see `assets/video/README.md` for the exact ffmpeg
  commands used). Whatever sits at those exact filenames is what plays as
  primary — if you send a different clip later, replace those two files and
  regenerate `assets/img/hero-poster.jpg` the same way.
- **Team photos** — not yet placed. `index.html` (`#team`) already has Guy
  Lockwood and Jamie Norris in the right order (Guy first, Jamie second) with
  correct roles pending confirmation; it expects
  `assets/team/guy-lockwood.jpg` and `assets/team/jamie-norris.jpg`. I can see
  the two portraits you shared in chat, but images pasted inline in the
  conversation don't reach me as files the way the video did (that arrived
  via an `@`-attached path) — could you push them to the repo directly, or
  resend the same way you sent the video? Once those two files exist at
  those paths, the masked-cutout treatment picks them up automatically, no
  markup changes needed.
- **Background stills** (formation/cockpit/runway/sky, used as the parallax
  backdrops for What We Do / Why Us / Team / Contact) — also not yet placed;
  same situation, same fix. Expected paths and fallback behaviour are in
  `assets/img/README.md`.
- **Logo** — `assets/lockon-logo.png` doesn't exist yet either; nav and
  landing both fall back to the reticle mark + "Lock On" wordmark until it's
  added (same load/fallback pattern, see below).

Every real-asset reference in this build follows the same rule: if the file
isn't there, something sensible (a themed gradient, the reticle mark, or the
initials-on-dark placeholder) shows instead — nothing ever renders as a
broken image or empty box. That's deliberate so you can hand this over
mid-build and it never looks unfinished.

## Design system

- **Palette** — monochrome base (tokens in `css/variables.css`): `#0A0A0A`
  background, `#1A1A1A` alt background, `#FFFFFF` headings, `#A0A0A0` body
  text, `#2E2E2E` dividers, `#E5E5E5` active/hover state. Photography carries
  the visual weight now rather than flat colour blocks, but stays inside this
  palette — every real photo/video is run through `--photo-filter`
  (`grayscale(55%) contrast(1.08) brightness(0.85)`) so colour footage still
  reads as part of the same restrained system instead of introducing hue.
- **Type**: Inter (Google Fonts, with a system-font fallback stack). Headings
  are bold, uppercase, wide letter-spacing; body copy is light-weight,
  sentence case, grey. Sizes are driven by shared `clamp()` tokens so the
  scale stays consistent across every section.
- **Easing** — no default `ease`/`linear` anywhere. `--ease` (emphasized
  deceleration) drives continuous/large motion (nav, scroll reveals,
  parallax-adjacent transitions); `--ease-settle` (slight overshoot into
  place) drives discrete UI feedback — dot activation, team-card hover lift,
  the contact email nudge — so interaction feels considered rather than
  mechanical.

## Depth &amp; motion system

- **Scroll parallax** (`js/parallax.js`) — any element with
  `data-parallax-speed="N"` moves relative to its own natural position as it
  crosses the viewport: `N < 1` lags behind scroll (backgrounds), `N > 1`
  leads it (foreground accents), `N = 1` is inert ("pinned"). Implemented
  with `getBoundingClientRect` + a single `requestAnimationFrame`-batched
  write per scroll/resize tick — deliberately not
  `background-attachment: fixed`, which only covers one layer and is known to
  jank on mobile. Parallax intensity is cut to ~40% under 768px, since scroll
  performance is more fragile on small/low-power devices, and it's disabled
  outright when `prefers-reduced-motion: reduce` is set.
- **Ken Burns** (landing only) — `.landing__zoom` (css/sections/landing.css)
  runs a slow 26s scale+drift, `alternate` direction so the loop has no
  snap-back, gated behind `@media (prefers-reduced-motion: no-preference)`.
- **Section entrance** (`js/reveal.js` + `.reveal` in `css/depth.css`) — an
  `IntersectionObserver` toggles `.is-visible` on each section's content as it
  crosses into/out of view, driving a `clip-path` + opacity + translateY
  reveal rather than a hard cut. Re-triggers each time you arrive at a
  section (not a one-shot page-load animation).
- **Team cutouts** (`css/sections/team.css`) — the photo/fallback sits behind
  a `mask-image: radial-gradient(...)`, fading the rectangular edges out so
  it reads as an isolated subject over the shared background rather than a
  pasted-on photo. Hover/tap ("character reveal") scales + lifts the cutout
  with `--ease-settle` while the bio panel fades in underneath.
- **Reduced motion** — `prefers-reduced-motion: reduce` disables parallax
  transforms, Ken Burns, and eases section reveals down to a plain opacity
  fade with no clip-path/translate. This is enforced in both CSS (belt) and
  JS (suspenders: `parallax.js`/`reveal.js` bail out entirely rather than
  relying on the CSS override).

## Interaction notes

- **Scroll-progress dots** (`js/dots.js`) use one `IntersectionObserver`
  watching all five `<section>`s; whichever is ≥50% in view gets the active
  dot. Clicking a dot calls `scrollIntoView({ behavior: "smooth" })`.
- **Nav hide/show** (`js/nav.js`) tracks scroll delta per animation frame:
  scrolling down past 96px hides it, scrolling up (or a fast upward flick)
  shows it immediately. Below 640px the link list is dropped (it wrapped and
  collided with the logo) — the dot sidebar covers section-jumping there.
- **Team hover/tap** — desktop reveal is pure CSS (`:hover` / `:focus-visible`
  in `css/sections/team.css`, gated to `(hover: hover) and (pointer: fine)`).
  `js/team.js` only runs on touch devices, toggling an `.is-active` class on
  tap (and closing others / closing on outside-tap), so mobile gets the same
  reveal without needing hover.
- **Smooth scroll** — `scroll-snap-type: y proximity` on the page plus
  `scroll-behavior: smooth`, so wheel/trackpad scrolling settles on section
  boundaries without feeling "trapped" the way `mandatory` snapping can.

## Performance

Tested with Chrome DevTools CPU throttling at 4x (simulates a low-power
device) while scripting a full-page scroll sweep: average frame time ~16.6ms,
max ~25.6ms, zero frames over the 32ms (dropped-frame) threshold. Every
parallax/Ken-Burns layer carries `will-change: transform` so the browser can
promote it to its own compositor layer ahead of time.

## Deployment

No build step — deploy the repo root as-is to Netlify, Vercel, or Cloudflare
Pages (static site, publish directory `/`, no build command needed).
