# Images

Team portraits live in `assets/team/` and the logo lives at
`assets/lockon-logo.webp` — see the READMEs in `assets/team/` for the
former. This folder is background stills + the hero poster frame.

- `hero-poster.jpg` — done. Grabbed from the hero video source at ~0.7s in,
  shown via the `<video poster>` attribute while the clip buffers. Regenerate
  it (see `assets/video/README.md`) if the hero video is ever replaced.

## Camera background (What We Do / Why Us / Team / Contact)

`formation.jpg` (your F-35 banking shot, weapons bay open) is the single
shared background behind all four of these sections — see the "Camera
background" section in the root `README.md` and `js/camera.js` for how the
scroll-linked pan/zoom works. It replaced the previous one-photo-per-section
setup (`cockpit.jpg` for Why Us, `runway.jpg` for Team) — those two files
are still here, just unreferenced by any CSS/HTML now, in case you want to
reuse them elsewhere rather than delete them.

`sky.jpg` was never added (Contact's low-intensity treatment didn't end up
needing it, and now Contact fades to black through the camera background
instead).

Every image referenced by the site is run through `--photo-filter`
(grayscale + contrast + darken, defined in `css/variables.css`) at render
time, so exact colour grading doesn't matter much.
