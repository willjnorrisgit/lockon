# Certification badges

Done — see `assets/images/README.md` and `css/footer.css`. The three badge
files (`afc_logo_grey.webp`, `CE+Plus.webp`,
`Joscar-Regsistered-Resized.webp`) live directly in `assets/images/`, not in
this folder — they were added there, not here, so `index.html` points at
`assets/images/...` for each. This directory is unused; left in place only
so this note is easy to find if badges ever need revisiting.

`css/footer.css` sizes and desaturates (`--photo-filter`) any `<img>`
dropped into `.site-footer__badges` to match the rest of the site's
monochrome treatment — no extra styling needed for new badges either.
