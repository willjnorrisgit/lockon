# Hero video

`hero.mp4` and `hero.webm` are in place — the 8-second portrait clip you
provided, compressed down from the 2.6MB/1080×1920 source:

- `hero.mp4` — H.264, 540×960, ~688KB, `+faststart` (Safari/older-browser fallback)
- `hero.webm` — VP9, 540×960, ~262KB (primary; smaller at equal quality)

Both were generated with `-an` (audio stripped — the source had none anyway).
The `<video>` element in `index.html` picks whichever the browser supports
first, so whatever sits at these two exact filenames is what plays. If a
missing/undecodable video should ever occur again, the landing section falls
back to an animated CSS backdrop (`.landing__fallback` in
`css/sections/landing.css`) with the Ken Burns zoom still applied to it, so
the section never looks static or broken either way.

Note the source is portrait (9:16). `object-fit: cover` crops it to fill the
landscape hero on wide screens — that's expected and looks fine, but if you
get a proper landscape (16:9) clip later, it'll fill more naturally with less
cropping. Same commands below apply either way.

## To replace with a different clip

```bash
# WebM / VP9 — primary
ffmpeg -i source.mp4 -an -vf "scale=540:960" -c:v libvpx-vp9 -b:v 0 -crf 32 \
  -row-mt 1 hero.webm

# MP4 / H.264 — fallback
ffmpeg -i source.mp4 -an -vf "scale=540:960" -c:v libx264 -crf 23 \
  -preset slow -movflags +faststart hero.mp4

# Poster frame (grab ~0.7s in; adjust -ss to taste)
ffmpeg -i source.mp4 -ss 0.7 -vframes 1 -q:v 4 ../img/hero-poster.jpg
```

For a landscape source, swap `scale=540:960` for e.g. `scale=1920:-2`. Aim
for well under 4-5MB total for a ~10s clip; raise `-crf` (lower quality) if
it comes out larger than that.

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
