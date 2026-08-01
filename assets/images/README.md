# Images

Team portraits live in `assets/team/` and the logo lives at
`assets/lockon-logo.webp` — see the READMEs in `assets/team/` for the
former. This folder is background stills + the hero poster frame.

- `hero-poster.jpg` — done. Grabbed from the hero video source at ~0.7s in,
  shown via the `<video poster>` attribute while the clip buffers. Regenerate
  it (see `assets/video/README.md`) if the hero video is ever replaced.
- `placeholder-man.png` — a generic silhouette avatar, used by the Team
  grid's 10 placeholder tiles (`#team` in `index.html`) standing in for
  team members not yet confirmed. Runs through the same masked-cutout +
  `--photo-filter` treatment as the real team photos.
- `afc_logo_grey.webp`, `CE+Plus.webp`, `Joscar-Regsistered-Resized.webp` —
  certification/membership badges (Armed Forces Covenant, Cyber Essentials
  Plus, JOSCAR Registered) shown in the footer's `.site-footer__badges`
  (see `css/footer.css`).

## Camera background (What We Do / Why Us / Team / Contact)

Two images, two acts — see the "Camera background" section in the root
`README.md` and `js/camera.js` for the full choreography:

- `formation.jpg` (the F-35 banking shot, weapons bay open) flies across the
  screen right-to-left, shrinking, from the top of What We Do until it
  exits fully off the left edge partway into Why Us.
- `runway.jpg` (the F-22 nose-on in a hangar) crossfades in after a dark
  transition and is the static background for Team and Contact.

`cockpit.jpg` (an earlier per-section still from before this system existed)
is still here, just unreferenced by any CSS/HTML now, in case you want to
reuse it elsewhere rather than delete it. `sky.jpg` was never added
(Contact's low-intensity treatment didn't end up needing it, and Contact is
covered by the runway background instead now).

Every image referenced by the site is run through `--photo-filter`
(grayscale + contrast + darken, defined in `css/variables.css`) at render
time, so exact colour grading doesn't matter much.
