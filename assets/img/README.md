# Images

- `hero-poster.jpg` — a single still frame from the hero video, compressed
  (~100-200KB), used as the `<video poster>` while the clip loads.
- Team photos — the "Meet the Team" cards currently render initials on a
  plain dark background instead of photos (see `index.html`, `.team-card__photo`).
  To swap in real photography, replace the `<span class="team-card__initials">`
  with an `<img>` (e.g. `<img src="assets/img/team/james-whitfield.jpg" alt="" />`)
  sized/cropped to a 3:4 ratio to match `.team-card`'s aspect-ratio.
