---
'admission-web': patch
---

Polish after the Mira move, on `@mts241alikhlash/ui` 1.10.2.

- Validation messages are Indonesian: an empty field says "Wajib diisi" instead of zod's "Required", with limits and email messages in Indonesian too. Messages written in a schema keep winning.
- Dialogs: the form body scrolls with a plain `overflow-y-auto` area instead of the reka scroll area, so the footer no longer overlaps the content on phones; every dialog footer is the same `justify-between` row, including the filter dialogs.
- Floating labels: the resting label is centered, filled text sits 3 px below the top, and the error label no longer clips the tail of q, g, y, p and j.
