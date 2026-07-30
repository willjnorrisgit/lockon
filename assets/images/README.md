# Images

Team portraits live in `assets/team/` and background parallax stills live in
`assets/images/` — see the READMEs in those folders.

- `hero-poster.jpg` — done. Grabbed from the hero video source at ~0.7s in,
  shown via the `<video poster>` attribute while the clip buffers. Regenerate
  it (see `assets/video/README.md`) if the hero video is ever replaced.

## Background stills

Parallax backdrops for the four non-landing sections. Each is referenced as
a CSS `background-image` with a themed gradient layered right behind it in
`css/depth.css` — if the file below is missing, the gradient shows instead
(no broken-image state, no markup changes needed once you add the real
file).

| File            | Used in         | Suggested subject                          |
| ---------------- | ---------------- | ------------------------------------------- |
| `formation.jpg`  | What We Do      | Aircraft formation / dynamic ops shot        |
| `cockpit.jpg`    | Why Us          | Cockpit or instrument-panel close-up         |
| `runway.jpg`     | Meet the Team   | Runway/tarmac backdrop behind the two cutouts |
| `sky.jpg`        | Contact Us      | Open sky — kept low-intensity/calm for the close |

Each image is run through `--photo-filter` (grayscale + contrast + darken,
defined in `css/variables.css`) at render time, so exact colour grading
doesn't matter much — pick for composition/subject, the site desaturates it
to match the palette. Aim for ~1920px wide, compressed (JPEG quality
~75-80 or WebP) to keep page weight down, since each one is a full-bleed
parallax layer.