# Lock On — Website Rebuild

Static, single-page, scroll-driven site for Lock On (aerospace &amp; defence
consultancy). Plain HTML/CSS/JS — no framework, no build step, no backend.

Visual direction is cinematic/layered: real photography and footage with
scroll-driven parallax depth, a Ken Burns hero, and masked team cutouts,
rather than flat colour blocks.

## Structure

```
index.html                 All markup: nav, flight-route, camera bg, 5 sections, footer
privacy.html                Placeholder legal page (see "Legal pages" below)
terms.html                   ditto
cookies.html                  ditto
favicon.ico                 Copy of assets/favicon/favicon.ico at the site
                             root (some browsers check /favicon.ico directly)
css/
  variables.css             Design tokens (colour, type scale, spacing, easing)
  base.css                  Reset + shared section scaffolding + scroll-snap
  depth.css                 Section-entrance crossfade + text-legibility
                             treatment shared by every section except Landing
  nav.css                   Top nav bar
  flight-route.css          Decorative scroll-linked route rail (right edge)
  camera-bg.css             Jet flyover + dark transition + runway background (4 sections)
  footer.css                Legal/registration footer (outside the scroll-snap flow)
  legal.css                 Chrome shared by privacy/terms/cookies.html
  sections/
    landing.css              01 — hero video/fallback, Ken Burns, tagline
    what-we-do.css           02 — capability cards over the jet flyover
    why-us.css                03 — differentiator grid over the jet flyover/dark transition
    team.css                   04 — 12-tile masked cutout grid, over the runway background
    contact.css                 05 — contact block, over the runway background
js/
  main.js                   Entry point, wires everything up on load
  nav.js                    Hide-on-scroll-down / show-on-scroll-up nav
  team.js                   Click/tap/keyboard open-in-place for team tiles
  parallax.js               rAF-throttled scroll-parallax engine (foreground depth only now — see below)
  reveal.js                 Continuous IntersectionObserver-ratio crossfade
  flight-route.js           Scroll-linked route line, plane marker, node lighting
  camera.js                 Scroll-linked jet flyover, dark transition, runway reveal
assets/
  lockon-logo.webp           Logo (nav only) — full wordmark lockup
  favicon/                  Favicon set, cropped from the logo mark (see its README)
  video/                    Hero background video + other stock clips (see its README)
  images/                   Camera background photos (jet + runway), hero poster, unused legacy stills, cert badges
  team/                     Team portraits (see its README)
```

There's no dot-sidebar nav control anymore (removed — the flight-route rail
is now the only scroll-progress indicator, and it's intentionally decorative
rather than clickable). Section-jumping is still available via the top nav
links.

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
- **Camera background** — done. `assets/images/formation.jpg` (your F-35
  banking shot) flies across What We Do into early Why Us, then
  `assets/images/runway.jpg` takes over as the background for Team and
  Contact after a dark transition — see "Camera background" below and
  `assets/images/README.md`.
- **Logo** — done. `assets/lockon-logo.webp`, the real "LockOn" wordmark
  lockup, used in the nav only.
- **Favicon** — done. `assets/favicon/` has the full size set (16/32/48/192/512
  PNG, `apple-touch-icon.png`, `favicon.ico`), cropped from the target-rings
  + jet mark inside the logo wordmark and composited on a solid `#0A0A0A`
  backing (a transparent version would disappear on a light-themed browser
  tab bar) — see `assets/favicon/README.md` for the exact crop/regenerate
  steps.
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

- **Palette** — black/white/grey only, no accent hue anywhere (tokens in
  `css/variables.css`): `#0A0A0A` background, `#1A1A1A` alt background,
  `#FFFFFF` headings, `#A0A0A0` body text, `#2E2E2E` dividers, `#E5E5E5`
  (`--color-active`) for every hover/active/focus affordance — nav-link
  hover underline, contact-email hover, capability-card hover border,
  team-tile focus ring. Feedback comes from brightness
  contrast, not colour. Photography carries the visual weight rather than
  flat colour blocks, but stays inside this palette too — every real
  photo/video runs through `--photo-filter`
  (`grayscale(55%) contrast(1.08) brightness(0.85)`) so colour footage
  still reads as part of the same restrained system. (An earlier pass added
  a teal/blue accent for these same states; it's been fully removed per
  feedback — `--color-accent` no longer exists anywhere in the CSS.)
- **Type**: Inter (Google Fonts, with a system-font fallback stack). Headings
  are bold, uppercase, wide letter-spacing; body copy is light-weight,
  sentence case, grey. Sizes are driven by shared `clamp()` tokens so the
  scale stays consistent across every section.
- **Easing** — no default `ease`/`linear` anywhere. `--ease` (emphasized
  deceleration) drives continuous/large motion (nav, scroll reveals,
  parallax-adjacent transitions); `--ease-settle` (slight overshoot into
  place) drives discrete UI feedback — flight-route node lighting, team-card
  hover lift, the contact email nudge — so interaction feels considered
  rather than mechanical.

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
  pasted-on photo. Two-stage "character reveal": hovering (mouse only)
  lifts the cutout slightly and shows a brief name/role summary; clicking,
  tapping, or activating via keyboard lifts it further and opens the full
  profile (role, name, bio, one extra placeholder detail line) in the same
  spot, stepping the summary aside. Touch has no hover, so a tap goes
  straight to the full profile rather than requiring a double-tap.
- **Reduced motion** — `prefers-reduced-motion: reduce` disables parallax
  transforms, Ken Burns, and eases section reveals down to a plain opacity
  fade with no clip-path/translate. This is enforced in both CSS (belt) and
  JS (suspenders: `parallax.js`/`reveal.js` bail out entirely rather than
  relying on the CSS override).

## Camera background

`css/camera-bg.css` + `js/camera.js`, a `position: fixed` full-bleed layer
(`z-index: 1`, behind `.section__inner`'s `z-index: 2`) behind What We Do,
Why Us, Team, and Contact. Two acts, both driven by one scroll-fraction
calculation per `requestAnimationFrame` tick:

1. **Jet flyover** (What We Do → 40% into Why Us) — `assets/images/
   formation.jpg` (`.camera-bg__jet`) starts at the top of What We Do with
   its own left edge positioned `JET_START_LEFT_GAP_FRACTION` (30%) of the
   way across the screen — i.e. just past the right edge, with the left
   ~30% of the screen genuinely plain background, not the image at all —
   then a single scroll fraction across that specific range drives a
   continuous `translate(Tx,Ty) scale(s)` move the *entire* remaining width
   of the screen, past the left edge (`jetTransformAt()` interpolates
   translateX/scale from that start framing to a fully-exited one with a
   `smoothstep` ease). That start gap is sized directly off the viewport's
   own width rather than via a focal-point-at-some-multiple-of-containerW
   anchor — cover-scaling the image to fill viewport *height* makes its
   rendered width many multiples of viewport width on narrow/portrait
   screens, so a focal-point anchor tuned to look right on desktop left
   almost no gap at all on mobile; sizing the gap directly off `containerW`
   keeps it consistent across aspect ratios (verified at 1440px, 390px, and
   1920px-wide viewports). Over the tail of the flight (`JET_BLUR_START`
   onward, 55% through) it dissolves rather than hard-cutting: blur and
   opacity ramp together (`--jet-blur`, a CSS custom property so JS only
   ever touches one thing per frame), and a second, much-blurrier, masked
   copy of the same photo (`.camera-bg__jet-trail`) trails behind it —
   screen-right, since the jet is flying left — growing, blurring and
   fading in a rise-then-fall hump (`JET_TRAIL_PEAK`) so it billows like
   vapor/exhaust off the rear of the aircraft and disperses again by the
   exit point. Past the exit point both fractions are clamped at `1`, so
   both layers stay parked off-screen/invisible and can't drift back into
   view later.
2. **Position-linked darkening, then an immediate runway reveal** — the
   screen doesn't darken on a scroll-time schedule; `darkness` in
   `update()` is computed directly from the jet's own current horizontal
   screen position (the same `JET_FX_START` anchor point tracked
   throughout the flight): `0` while that point is still right of
   screen-center, ramping up as it crosses toward the left edge, and
   reaching exactly `1` at the same instant the jet finishes exiting
   (`jetExitAnchorX`, cached at measure time, *is* that instant — the ramp
   is a clamped rescale of `(midX - anchorX) / (midX - jetExitAnchorX)`,
   so it can't help but hit exactly `1` there). A matching
   `.camera-bg__vignette` deepens in step with it (same `blackOpacity`
   value, just scaled down and shaped as a radial edge-darken instead of a
   flat overlay) for a more cinematic frame, and the vapor trail gets a
   small extra blur/opacity boost tied to the same value
   (`JET_TRAIL_DARK_BLUR_BOOST_PX`/`JET_TRAIL_DARK_GLOW_BOOST`) so it reads
   as glowing a little more intensely as the screen approaches full black
   — tying the dissolve and the darkening into one continuous beat instead
   of two independently-timed ones. The instant darkness reaches `1`,
   `assets/images/runway.jpg` (`.camera-bg__runway`) starts crossfading
   in — `runwayRangeStart` is set to exactly `jetRangeEnd` in `measure()`,
   the same pixel point darkness is guaranteed to hit `1` at, so there's no
   added delay — finishing over `RUNWAY_REVEAL_SPAN_FRACTION` (50%) of the
   remaining distance to Team. Runway doesn't move or zoom — it's a plain
   `object-fit: cover`, no transform math needed since nothing animates but
   its opacity.

All layers' transforms/opacity/blur are recomputed every scroll tick from
pixel ranges measured off each section's actual `offsetTop` (`measure()`)
or from the jet's own live position (`darkness`), not hardcoded — the
constants at the top of `initCamera()` (`JET_EXIT_FRACTION`,
`JET_BLUR_START`, `JET_START_LEFT_GAP_FRACTION`,
`RUNWAY_REVEAL_SPAN_FRACTION`, `VIGNETTE_MAX_OPACITY`, etc.) are the
tunable knobs if you want any of these beats to take more/less of their
range.

- **The position math runs unconditionally, reduced motion or not.** The
  jet's transform (`translateX`/`translateY`/`scale`) and the `darkness`
  derived from it are computed every frame regardless of
  `prefers-reduced-motion` — only *applying* the result to the jet/trail's
  visible transform/blur is skipped under reduced motion. That keeps the
  dark/vignette/runway ramp genuinely tied to the same (hypothetical) jet
  position either way, rather than needing a separate scroll-time fallback
  formula just for reduced motion.
- **Transform math is compositor-only.** Every scroll tick only ever writes
  `transform`/`opacity`/`filter: blur()` — never `width`/`height`/`top`/
  `left`/`background-position` — so there's no layout/paint cost per frame,
  just compositing. The jet and its trail use `transform-origin: 0 0` with
  pixel-based `translate`/`scale` (not the min-width/height:100% cover
  trick, which fights this kind of arbitrary continuously-changing
  framing). Deliberately no CSS `transition` on any of these layers'
  opacity/filter — JS sets a new value every frame, and a transition would
  fight that, lagging the crossfade behind the actual scroll position
  instead of tracking it exactly.
- **The trail is a masked duplicate, not a distinct asset.** `.camera-bg__
  jet-trail` reuses `formation.jpg` rather than a bespoke smoke/vapor
  graphic, offset to the jet's rear and given a heavy `blur()` plus a
  `mask-image: linear-gradient(...)` that fades out the half of the copy
  nearest the jet — so it reads as diffuse haze trailing off the airframe
  rather than a second, recognisable aircraft riding alongside it.
- **A bug worth knowing about if you touch this file.** The global `img {
  max-width: 100% }` reset in `css/base.css` silently caps an `<img>`'s
  rendered box below its true natural size unless overridden — the jet's
  transform math assumes its untransformed box is exactly `naturalWidth x
  naturalHeight`, so `.camera-bg__jet`/`.camera-bg__jet-trail` override
  with `max-width: none; width: auto; height: auto;` in `camera-bg.css`
  (the runway image doesn't need this override since it's sized via
  `width/height: 100%` + `object-fit: cover`, not natural-size transform
  math).
- **Reduced motion** — no camera movement, no dissolve, no trail:
  `camera.js` applies the jet's start framing once as a static crop and
  never updates its transform/blur again, only toggling its opacity off
  once scroll passes the (still measured) exit point; the trail layer's
  opacity is held at `0` throughout, since it's purely a continuous-motion
  effect with no sensible static equivalent. The darkening/vignette/runway
  crossfade still animates, since it's a simple opacity ramp (driven by
  the still-computed, just-not-visually-applied jet position) rather than
  continuous camera motion — same reasoning as the flight route's node
  lighting staying live under reduced motion.
- **Legibility** — `.camera-bg__scrim` is a constant dark gradient overlay
  present at every scroll position (`--scrim-strong`, `variables.css`),
  independent of the dark-transition layer. All images run through the
  same `--photo-filter` (grayscale/contrast/darken) as every other photo on
  the site.
- `cockpit.jpg` (an earlier per-section still this replaced) is still in
  `assets/images/` but unreferenced by any CSS/HTML — see
  `assets/images/README.md`.

## Flight route

A decorative rail on the right edge (`css/flight-route.css` +
`js/flight-route.js`), separate from the hero and not a nav control. Runs
from the top of What We Do to the footer; hidden on Landing and below 900px
width.

- **Line draw** — a dim dashed grey guide (`.flight-route__base`) always
  shows the full route. A brighter overlay with identical path geometry
  (`.flight-route__progress`) reveals itself via `stroke-dashoffset` tied
  directly to scroll position within that range (0 at the top of What We
  Do, 1 at the footer) — not a class toggle, a continuous value recomputed
  every scroll tick.
- **Path geometry is built at runtime, not hardcoded.** A static SVG
  `viewBox` stretched with `preserveAspectRatio="none"` to fill a
  fixed-height rail would scale non-uniformly and turn the node circles
  into ellipses. `flight-route.js` measures the rail's actual rendered
  pixel size instead and builds the path's `d` attribute in that same
  coordinate space (1 SVG unit == 1 CSS px), so circles stay circular at
  any viewport height. The path waypoints are the node fractions
  themselves (plus start/end), with a small alternating left/right sway
  between them — partly for a "flight route with turns" look, partly so
  the plane marker's rotation actually has something to show.
- **Plane marker** — a small arrow/dart positioned via
  `path.getPointAtLength()` at the current scroll fraction, rotated to the
  path's tangent angle at that point (`Math.atan2` between two nearby
  points on the path). Stays monochrome (`--color-active`) — amber is
  reserved for the nodes only.
- **Node lighting is cumulative and position-based, not a single active-item
  highlight.** A node lights up amber once scroll progress has reached its
  fraction of the route (`fraction >= nodeFraction`), and *stays* lit as you
  scroll past it — several nodes can be lit at once, like waypoints already
  flown, rather than a single current-section indicator. It's recomputed
  every scroll tick rather than using an `IntersectionObserver`, so
  scrolling back up un-lights a node the moment you pass back above its
  point — no separate enter/exit event wiring needed.
- **Glow** — an SVG `<filter>` (`feGaussianBlur`, `stdDeviation="2.5"`) on a
  slightly larger circle behind each node's dot, faded in/out by opacity
  rather than a hard toggle. `--color-amber` / `--color-amber-glow` are the
  one deliberate colour accent in the entire system, scoped to this feature
  only (see the comment above them in `variables.css`) — everything else
  stays black/white/grey.
- **Reduced motion** — the progress path renders fully drawn (static, no
  scroll-tied reveal) and the plane is hidden entirely; node lighting still
  updates (it's a discrete position check, not continuous motion), same
  reasoning as the camera background's fade-to-black staying live under
  reduced motion.

## Interaction notes

- **Nav hide/show** (`js/nav.js`) tracks scroll delta per animation frame:
  scrolling down past 96px hides it, scrolling up (or a fast upward flick)
  shows it immediately. Below 640px the link list is dropped (it wrapped and
  collided with the logo) — there's no dot-sidebar fallback for
  section-jumping at that width anymore, just the nav links above it and
  ordinary scrolling.
- **Team tiles** — hover (mouse) shows a brief name/role summary, pure CSS;
  click/tap/keyboard (Enter/Space, via `js/team.js`) opens the full profile
  in the same tile, replacing the summary. Opening a tile closes any other
  open one; clicking outside the grid or pressing Escape closes whatever's
  open. `aria-expanded` reflects state for assistive tech. Closed tiles show
  only the photo + a small "+" affordance.
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
device) while scripting a full-page scroll sweep: average frame time has
crept up as scroll-tied effects have stacked — ~16.6ms with none of them,
~20.5ms once the flight route was added, ~22.8ms with the camera background
on top of that too (15/120 sampled frames over the 32ms dropped-frame
threshold). Untethered from throttling it's ~22.5ms average, with most
frames past the stricter 17ms/60fps budget but only 13/150 actually dropped
frames. Still comfortably smooth in practice — three independent
`requestAnimationFrame`-throttled scroll listeners (`parallax.js`,
`flight-route.js`, `camera.js`) is real, additive cost, though. Each does
the minimum necessary work per tick (parallax/camera: pure transform math;
flight-route: `SVGPathElement.getPointAtLength()` calls, which are
unavoidable for position-on-path), so the numbers reflect the actual
feature cost rather than an implementation inefficiency — worth knowing if
more scroll-tied effects get added later, since the budget isn't infinite.
Every parallax/Ken Burns/camera layer carries `will-change: transform` so
the browser can promote it to its own compositor layer ahead of time.

## Deployment

No build step — deploy the repo root as-is to Netlify, Vercel, or Cloudflare
Pages (static site, publish directory `/`, no build command needed).
