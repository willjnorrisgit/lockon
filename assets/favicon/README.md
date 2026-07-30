# Favicon

Generated from the icon mark inside `assets/lockon-logo.webp` — the
"target rings + jet" mark that sits between "Lock" and "n" in the full
wordmark, cropped out (`crop=100:100:232:0`) and composited onto a solid
`#0A0A0A` backing (not transparent — a pure-white mark on a transparent
background disappears against a light-themed browser tab bar, which is the
common default).

| File | Size | Used for |
| --- | --- | --- |
| `favicon.ico` | 32×32 | Legacy fallback (also copied to the site root) |
| `favicon-16.png` / `favicon-32.png` / `favicon-48.png` | as named | Standard browser tab icons |
| `favicon-192.png` / `favicon-512.png` | as named | Android/PWA home-screen icons |
| `apple-touch-icon.png` | 180×180 | iOS home-screen icon |

## To regenerate (e.g. if the logo changes)

```bash
# 1. Crop the mark out of the wordmark (adjust the crop box if the logo file changes)
ffmpeg -i ../lockon-logo.webp -vf "crop=100:100:232:0" mark-source.png

# 2. Composite onto a solid backing at each size (mark fills ~78% of the canvas)
ffmpeg -f lavfi -i color=c=0x0a0a0a:s=32x32 -i mark-source.png \
  -filter_complex "[1]scale=25:25:flags=lanczos[m];[0][m]overlay=(W-w)/2:(H-h)/2" \
  -frames:v 1 -update 1 favicon-32.png
# repeat for 16/48/192/512 (markSize = size * 0.78)

# 3. Apple touch icon (140px mark on a 180px canvas)
ffmpeg -f lavfi -i color=c=0x0a0a0a:s=180x180 -i mark-source.png \
  -filter_complex "[1]scale=140:140:flags=lanczos[m];[0][m]overlay=(W-w)/2:(H-h)/2" \
  -frames:v 1 -update 1 apple-touch-icon.png

# 4. Legacy .ico from the 32px version
ffmpeg -i favicon-32.png favicon.ico
cp favicon.ico ../../favicon.ico   # also keep one at the site root

rm mark-source.png
```
