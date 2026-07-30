# Team portraits

`index.html` (`#team`) expects:

- `guy-lockwood.jpg` — displayed first
- `jamie-norris.jpg` — displayed second

Both are flight-suit portraits with a jet in frame, per the brief. I can see
the two photos you shared in the chat and have matched names/order
correctly, but images pasted inline in a message don't reach me as files
the way the video did (that arrived via an `@`-attached path, which lands in
an uploads folder I can read). Push these two to the repo at the paths
above, or resend them the same way you sent the video, and the masked-cutout
treatment (`css/sections/team.css`) picks them up automatically — no markup
changes needed. Until then, the initials-on-dark placeholder shows in the
same mask/vignette treatment, so the layout and hover/tap interaction are
already fully testable.

Framing: each card is a 3:4 portrait crop with a radial mask that fades the
edges out (see `.team-card__cutout` in `css/sections/team.css`) — keep the
subject roughly centred and upper-frame, since the mask is weighted toward
the top (`50% 38%`) to leave room for the name/role/bio panel that slides up
from the bottom on hover/tap.
