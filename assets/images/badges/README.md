# Certification badges

The footer (`.site-footer__badges` in `index.html`) has a slot for
certification/membership badge logos from the previous site (ISO
certifications, ADS Group membership, Cyber Essentials, etc. — whatever
Lock On actually displays).

I couldn't pull these automatically: `lockon.ltd` returns 403 to automated
fetches (same issue as the rest of the site's copy — see README.md "Copy
status"), and they weren't shared as attached files the way the hero video
was. Attaching an image inline in chat doesn't reach me as a file; an
`@`-attachment or a direct push to the repo does.

## To add them

1. Drop the badge image files here (SVG or PNG, transparent background,
   reasonably sized — they render at 32px tall).
2. In `index.html`, replace the placeholder note:

   ```html
   <div class="site-footer__badges">
     <p class="site-footer__badges-note">Certification badges — pending</p>
   </div>
   ```

   with `<img>` tags, one per badge:

   ```html
   <div class="site-footer__badges">
     <img src="assets/images/badges/iso-27001.svg" alt="ISO 27001 certified" />
     <img src="assets/images/badges/cyber-essentials.svg" alt="Cyber Essentials certified" />
   </div>
   ```

`css/footer.css` already sizes and desaturates (`--photo-filter`) any
`<img>` dropped in there to match the badges to the rest of the site's
monochrome treatment, so no extra styling should be needed.
