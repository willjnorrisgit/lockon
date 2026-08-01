# Hero video

`hero.mp4` and `hero.webm` are in place — cockpit/sunset flying footage
(1920×1080, 13.6s), compressed down from a 29.4MB `landingvideo.mp4` source
(same encode spec as the previous hero clip; the source file itself isn't
kept in the repo once compressed, same as every other clip below). This
superseded an earlier `landing-video.mp4` source that turned out to be the
wrong export — the re-supplied `landingvideo.mp4` re-encoded to the exact
same `hero.mp4` bytes, so the two sources were effectively identical
footage regardless of the mix-up.

- `hero.mp4` — H.264, 1920×1080, ~5.8MB, `+faststart` (Safari/older-browser fallback)
- `hero.webm` — VP9, 1920×1080, ~3.6MB (primary; smaller at equal quality,
  and what most browsers will actually load)

Both generated with `-an` (audio stripped — the source had a near-silent
AAC track, not worth keeping since the `<video>` element is muted anyway).
`assets/images/hero-poster.jpg` was regenerated from this same file (frame
at ~0.7s — the cockpit-canopy silhouette against the sunset) so the
loading-frame still matches.

This pushed the total a bit over the "well under 4-5MB" guideline below —
that's the resolution/duration trade-off (1080p at ~13-14s vs. a shorter
clip). If you'd rather trim it down further, say so and I'll re-encode at a
higher `-crf` (lower quality) or shorter loop.

The `<video>` element in `index.html` picks whichever of the two files the
browser supports first, so whatever sits at these two exact filenames is
what plays. If a missing/undecodable video should ever occur again, the
landing section falls back to an animated CSS backdrop
(`.landing__fallback` in `css/sections/landing.css`) with the Ken Burns
zoom still applied to it, so the section never looks static or broken
either way.

## To replace with a different clip

```bash
# WebM / VP9 — primary
ffmpeg -i source.mp4 -an -vf "scale=1920:-2" -c:v libvpx-vp9 -b:v 0 -crf 32 \
  -row-mt 1 hero.webm

# MP4 / H.264 — fallback
ffmpeg -i source.mp4 -an -vf "scale=1920:-2" -c:v libx264 -crf 23 \
  -preset slow -movflags +faststart hero.mp4

# Poster frame (grab ~0.7s in; adjust -ss to taste)
ffmpeg -i source.mp4 -ss 0.7 -vframes 1 -q:v 4 ../images/hero-poster.jpg
```

For a portrait source, swap `scale=1920:-2` for e.g. `scale=540:960`. Aim
for well under 4-5MB total for a ~10s clip where resolution allows; raise
`-crf` (lower quality) if it comes out larger than that.

## Other clips in this folder

`13773969_1080_1920_30fps.mp4`, `13794181_1080_1920_30fps.mp4`, and
`15516511_2160_3840_30fps.mp4` are additional stock footage, compressed
in place (same filenames, same `scale=540:960` / crf 23 / `-an` /
`+faststart` treatment as `hero.mp4` above) after the largest of the three
— a 4K/34s clip — landed at 86.84MB and got flagged by GitHub. All three
are now well under any repo/CDN size limit:

| File                              | Before  | After  |
| ---------------------------------- | ------- | ------ |
| `13773969_1080_1920_30fps.mp4`     | 2.55MB  | 0.66MB |
| `13794181_1080_1920_30fps.mp4`     | 11.82MB | 1.97MB |
| `15516511_2160_3840_30fps.mp4`     | 86.84MB | 6.48MB |

None of these three are currently referenced in `index.html` — only
`hero.mp4`/`hero.webm` are wired into the landing section. If one of these
should replace the hero clip or power a different section, say which one and
I'll wire it in (and generate a matching `.webm` + poster frame the same way
`hero.mp4`/`hero.webm` were built).
