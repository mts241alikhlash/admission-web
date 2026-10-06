---
'admission-web': patch
---

Badges take `rounded-md` from `@mts241alikhlash/ui` 1.2.1, so the applicant list drops its per-badge overrides. Payment status colours come from one `PAYMENT_STATUS_BADGE_VARIANTS` map shared by the applicant list and the payment step; the list shows status, payment and a view action in centred columns.
