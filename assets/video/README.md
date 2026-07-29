# Hero video

Drop the landing background video here as two files (the `<video>` element
in `index.html` picks whichever the browser supports first):

- `hero.webm` (VP9, preferred — smaller at equal quality)
- `hero.mp4` (H.264, fallback for Safari/older browsers)

Until these exist, the landing section falls back to a lightweight animated
CSS backdrop (`.landing__fallback` in `css/sections/landing.css`), so the
page still looks intentional with no video present.

## Recommended source spec

- 10 seconds, seamless loop (first and last frame should match)
- 1920x1080 (or 2560x1440 if you want extra headroom on large displays) —
  don't go higher, it's a muted, blurred-under-text background, not a hero
  still
- No audio track — strip it, it's dead weight

## Compression (ffmpeg)

```bash
# WebM / VP9 — primary
ffmpeg -i source.mov -an -vf "scale=1920:-2" -c:v libvpx-vp9 -b:v 0 -crf 32 \
  -row-mt 1 hero.webm

# MP4 / H.264 — fallback
ffmpeg -i source.mov -an -vf "scale=1920:-2" -c:v libx264 -crf 23 \
  -preset slow -movflags +faststart hero.mp4
```

Aim for well under 4-5MB total for a 10s clip at this size — check the
result and re-encode at a higher `-crf` (lower quality) if it's larger.
`-movflags +faststart` on the mp4 matters: it lets the browser start
playback before the whole file downloads.

Also add a `poster` frame at `assets/img/hero-poster.jpg` (a single
compressed JPEG/WebP still from the video) — it shows immediately while the
video buffers, avoiding a flash of empty background.
