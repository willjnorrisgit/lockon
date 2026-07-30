# Images

Team portraits live in `assets/team/` and the logo lives at
`assets/lockon-logo.webp` — see the READMEs in `assets/team/` for the
former. This folder is background parallax stills + the hero poster frame.

- `hero-poster.jpg` — done. Grabbed from the hero video source at ~0.7s in,
  shown via the `<video poster>` attribute while the clip buffers. Regenerate
  it (see `assets/video/README.md`) if the hero video is ever replaced.

## Background stills

Parallax backdrops for three of the four non-landing sections. Each is
referenced as a CSS `background-image` with a themed gradient layered right
behind it in `css/depth.css` — if a file is missing, the gradient shows
instead (no broken-image state, no markup changes needed).

| File           | Used in       | Source                                              | Status |
| -------------- | ------------- | ---------------------------------------------------- | ------ |
| `formation.jpg`| What We Do    | your F-35 banking shot (weapons bay open)             | done   |
| `cockpit.jpg`  | Why Us        | your open-canopy cockpit shot                         | done   |
| `runway.jpg`   | Meet the Team | your F-22-in-hangar shot (dramatic runway line)       | done   |
| `sky.jpg`      | Contact Us    | —                                                      | not set — see below |

Each was downscaled from its ~5000-8000px-wide source to 1920px and
recompressed (JPEG, `-q:v 4`) — originals were 1.1-3MB each; these are now
45-136KB. None of the three source subjects were literally "formation" /
"runway" shots — the filenames are just the CSS slot names from
`css/depth.css`, matched by which composition suited each section's tone
best (dynamic/technical → What We Do, cockpit → Why Us, dramatic/moody →
Team, since it sits behind the two portrait cutouts).

`sky.jpg` (Contact) was deliberately left unset — the brief calls for a
"low intensity" treatment there anyway, and the existing calm vertical
gradient already serves that without needing a fourth photo. Add one if you
want a literal sky shot behind Contact; otherwise there's nothing to fix.

Every image is run through `--photo-filter` (grayscale + contrast + darken,
defined in `css/variables.css`) at render time, so exact colour grading
doesn't matter much going forward.
