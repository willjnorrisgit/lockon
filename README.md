# Lock On — Website Rebuild

Static, single-page, scroll-driven site for Lock On (aerospace &amp; defence
consultancy). Plain HTML/CSS/JS — no framework, no build step, no backend.

Visual direction is cinematic/layered: real photography and footage with
scroll-driven parallax depth, a Ken Burns hero, and masked team cutouts,
rather than flat colour blocks.

## Structure

```
index.html                 All markup: nav, dots, 5 sections, footer
privacy.html                Placeholder legal page (see "Legal pages" below)
terms.html                   ditto
cookies.html                  ditto
css/
  variables.css             Design tokens (colour, type scale, spacing, easing)
  base.css                  Reset + shared section scaffolding + scroll-snap
  depth.css                 Background/foreground layering, section-entrance
                             crossfade, and photography treatment shared by
                             every section except Landing
  nav.css                   Top nav bar
  dots.css                  Scroll-progress dot sidebar
  footer.css                Legal/registration footer (outside the scroll-snap flow)
  legal.css                 Chrome shared by privacy/terms/cookies.html
  sections/
    landing.css              01 — hero video/fallback, Ken Burns, tagline
    what-we-do.css           02 — capability cards over a parallax backdrop
    why-us.css                03 — differentiator grid over a parallax backdrop
    team.css                   04 — 12-tile masked cutout grid, click-to-open
    contact.css                 05 — contact block, low-intensity backdrop
js/
  main.js                   Entry point, wires everything up on load
  nav.js                    Hide-on-scroll-down / show-on-scroll-up nav
  dots.js                   IntersectionObserver-driven active dot + click-to-scroll
  team.js                   Click/tap/keyboard open-in-place for team tiles
  parallax.js               rAF-throttled scroll-parallax engine
  reveal.js                 Continuous IntersectionObserver-ratio crossfade
assets/
  lockon-logo.webp           Logo (nav only) — full wordmark lockup
  video/                    Hero background video + other stock clips (see its README)
  images/                   Background parallax stills, hero poster, cert badges
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

- **Hero video** — done. `assets/video/hero.mp4` / `.webm` are your
  landscape (1920×1080, 12.9s) export, compressed from 11.1MB down to
  ~5.2MB/3.4MB (see `assets/video/README.md`). The poster frame
  (`assets/images/hero-poster.jpg`) was regenerated from this same clip.
  Landing shows only the nav logo now — the larger logo lockup that used to
  sit above the headline was removed.
- **Team photos** — done. `assets/team/guy-lockwood.jpg` and
  `jamie-norris.jpg` render through the masked-cutout treatment across a
  12-tile placeholder grid (Guy's tile ×8, Jamie's ×4 — only 2 real team
  members exist, this is filler until more people/photos are confirmed).
- **Background stills** — 3 of 4 done (`assets/images/formation.jpg`,
  `cockpit.jpg`, `runway.jpg` — see `assets/images/README.md` for how each
  was matched to its section). `sky.jpg` (Contact) is deliberately unset;
  the brief calls for low-intensity there and the calm gradient covers it.
- **Logo** — done. `assets/lockon-logo.webp`, the real "LockOn" wordmark
  lockup, used in the nav only.
- **Certification badges** — not placed. Mentioned as coming "from the old
  website," but that site 403s automated fetches and the badges weren't
  shared as attached files (same limitation as the rest of this list) — see
  `assets/images/badges/README.md`.

Every real-asset reference in this build follows the same rule: if a file
isn't there, something sensible (a themed gradient, the reticle mark, or the
initials-on-dark placeholder) shows instead — nothing ever renders as a
broken image or empty box. That's deliberate so you can hand this over
mid-build and it never looks unfinished.

## Copy status

`lockon.ltd` returns 403 to automated fetches, so none of this is scraped —
it's assembled from search-engine-indexed snippets of the live site plus
Companies House's public register. Confirmed facts, now used verbatim or
close to it:

- Founded 2018 (Companies House: incorporated 29 March 2018)
- UK office: The Officers' Mess, Royston Road, Duxford, England, CB22 4QH
  (`#contact`)
- Email: `info@lockon.ltd`
- Consultants "have flown 4th and 5th Generation platforms," with
  "combat experience as fast jet instructor pilots" and backgrounds in
  "strategy, capability development and operational delivery" (`#why-us`)
- Services centre on "development of operating procedures," "specialist
  aerospace advice," and "a premium on information security" (`#what-we-do`)
- "A diverse portfolio of aerospace projects" for UK/US/European/Middle
  Eastern clients (`#why-us` — the client geography was already given to me
  in the original brief, not independently re-verified here)

Not confirmed anywhere public: Jamie Norris's and Guy Lockwood's individual
titles and bios (`#team`). Per your steer, those are reasonable filler
copy — built from the same public company-level language above (fast-jet
instructor pilot, capability development, operational delivery) rather than
invented from nothing, but the specific title/bio pairing per person isn't
sourced. Guy's tile now says "Co-Founder" per your instruction; that one
detail *is* a direct instruction, not a guess. Easy to swap — every
role/bio pairing is isolated in its own `.team-card__role` / `.team-card__bio`
elements in `index.html`.

The footer's registration line ("Registered in England No. 11282660") is
independently confirmed via Companies House, same as the founding year and
address above.

## Design system

- **Palette** — monochrome base (tokens in `css/variables.css`): `#0A0A0A`
  background, `#1A1A1A` alt background, `#FFFFFF` headings, `#A0A0A0` body
  text, `#2E2E2E` dividers, `#E5E5E5` neutral active/hover state. Photography
  carries the visual weight now rather than flat colour blocks, but stays
  inside this palette — every real photo/video is run through
  `--photo-filter` (`grayscale(55%) contrast(1.08) brightness(0.85)`) so
  colour footage still reads as part of the same restrained system instead
  of introducing hue.
- **Accent** — one teal/blue hue, `--color-accent` (`#3fb8c9`), used
  sparingly for interactive/active affordances only: the active nav dot,
  nav-link hover underline, contact-email hover, capability-card hover
  border, the Why Us divider rule, and the open/focus states on team tiles.
  It does not appear on body text, headings, or anywhere decorative — the
  rest of the site stays monochrome by design.
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
- **Section crossfade** (`js/reveal.js` + `.reveal` in `css/depth.css`) — an
  `IntersectionObserver` with a 41-step threshold array drives each
  section's opacity/translateY *continuously* from its own live
  intersection ratio, rather than toggling a single on/off class. That
  means the outgoing section visibly dims at the same time the incoming one
  brightens — a real crossfade, not just a fade-in on arrival. Full opacity
  is reached at 60% intersection (`FADE_COMPLETE_AT` in `reveal.js`), so the
  handoff reads as a deliberate, fairly quick crossfade rather than a slow
  wash spread across the whole scroll distance. Landing's content
  participates too (fades out on the way to What We Do), even though it
  doesn't need a fade-in on first load.
- **Team cutouts** (`css/sections/team.css`) — the photo/fallback sits behind
  a `mask-image: radial-gradient(...)`, fading the rectangular edges out so
  it reads as an isolated subject over the shared background rather than a
  pasted-on photo. Clicking/tapping/keyboard-activating a tile ("character
  reveal") scales + lifts the cutout with `--ease-settle` while the info
  panel fades in underneath, inside that same tile — see `js/team.js`.
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
- **Team tiles** — click, tap, and keyboard (Enter/Space) all open the same
  in-tile info panel via `js/team.js` (no separate hover state — closed
  tiles show only the photo + a small "+" affordance). Opening a tile closes
  any other open one; clicking outside the grid or pressing Escape closes
  whatever's open. `aria-expanded` reflects state for assistive tech.
- **Smooth scroll** — `scroll-snap-type: y proximity` on the page plus
  `scroll-behavior: smooth`, so wheel/trackpad scrolling settles on section
  boundaries without feeling "trapped" the way `mandatory` snapping can.

## Legal pages &amp; footer

`css/footer.css` + the `<footer>` in `index.html` carry the registration
line ("LockOn™, © 2026 Lock-On Ltd., Registered in England No. 11282660" —
the company number is independently confirmed via Companies House), the
contact email, and links to three placeholder pages: `privacy.html`,
`terms.html`, `cookies.html` (styled via `css/legal.css`). None of the three
contain real policy text — I'm not going to fabricate legal copy — each just
explains what it's a placeholder for and links back to the site. Replace
them with real policies (or link out to hosted ones) before launch. The
footer sits outside `<main class="scroll-container">`, so it isn't a sixth
full-viewport slide and doesn't get a dot — it's site chrome, not a section.

## Performance

Tested with Chrome DevTools CPU throttling at 4x (simulates a low-power
device) while scripting a full-page scroll sweep: average frame time
~16-20ms, the vast majority under the 32ms (dropped-frame) threshold. (The
continuous crossfade in `reveal.js` and the larger 1080p hero video both add
a little decode/paint cost over the previous build's ~16.6ms/zero-drops
baseline — still comfortably smooth, just noted here in case it's worth
revisiting if more full-bleed video gets added later.) Every parallax/Ken
Burns layer carries `will-change: transform` so the browser can promote it
to its own compositor layer ahead of time.

## Deployment

No build step — deploy the repo root as-is to Netlify, Vercel, or Cloudflare
Pages (static site, publish directory `/`, no build command needed).
