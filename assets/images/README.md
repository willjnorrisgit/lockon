# Background stills

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

You mentioned a few stock jet stills already (F-22 in a hangar at night,
F-22 in flight, an F-35 banking) — those weren't reachable as files the way
the video was (pasted inline in chat rather than `@`-attached), so I
couldn't save them here directly. Push them to the repo at the paths above,
or resend them the same way you sent the video, and they'll take over from
the gradients automatically.

Each image is run through `--photo-filter` (grayscale + contrast + darken,
defined in `css/variables.css`) at render time, so exact colour grading
doesn't matter much — pick for composition/subject, the site desaturates it
to match the palette. Aim for ~1920px wide, compressed (JPEG quality
~75-80 or WebP) to keep page weight down, since each one is a full-bleed
parallax layer.
