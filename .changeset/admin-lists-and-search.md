---
'admission-web': minor
---

Admin lists share one pattern. Gelombang, Pendaftar and Pengumuman load 20 rows at a time with a "Muat lebih banyak" button that also loads on sight, filter and search on the server, and always render the table with "Tidak ada data." when empty; Rekening filters by status and searches its full list. Every list uses `SearchInput` from `@mts241alikhlash/ui` 1.2.0, the same compact filters, header, padding, add button and error box with "Coba lagi". The dashboard filters by academic year (opening on the active one) and wave. The login and forgot-password identifier reads "Email atau Username" and no longer capitalises the first letter on phones.
