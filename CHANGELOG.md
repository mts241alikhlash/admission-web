# admission-web

## 1.3.0

### Minor Changes

- c9ddf86: Sub-pages go back with `BackButton` from `@mts241alikhlash/ui` 1.3.1, left of the card title and labelled with where it leads, and breadcrumbs name the record a page is about instead of "Detail" or "Ubah"; long crumbs truncate. Another user's profile gets a back button and their name in the breadcrumb. The profile and address tabs use floating labels with every field tied to its label, including the birth date picker. The applicant detail page shows its actions and notes once above tabs that follow the form steps, with one aligned label and value list per tab, the payment as a list, and documents as one grouped list on phones with a red asterisk for required ones. Admins fill an applicant's form on its own page, reached from "Isi Formulir" after creating the account or from "Lengkapi Data" on the detail page while the form is a draft or needs revision; the add-applicant dialog then only shows the credentials.

### Patch Changes

- c9ddf86: Badges take `rounded-md` from `@mts241alikhlash/ui` 1.2.1, so the applicant list drops its per-badge overrides. Payment status colours come from one `PAYMENT_STATUS_BADGE_VARIANTS` map shared by the applicant list and the payment step; the list shows status, payment and a view action in centred columns.

## 1.2.1

### Patch Changes

- fc24881: The add-applicant dialog matches the other form dialogs: "Tambah Pendaftar" title with the description kept for screen readers, two-column width, "Simpan" submit, a plain notice when no wave is open, and no fee and quota line under the wave. The list button reads "Tambah Pendaftar", and the follow-up form dialog caps its height like the others.

## 1.2.0

### Minor Changes

- 813a83e: Admin lists share one pattern. Gelombang, Pendaftar and Pengumuman load 20 rows at a time with a "Muat lebih banyak" button that also loads on sight, filter and search on the server, and always render the table with "Tidak ada data." when empty; Rekening filters by status and searches its full list. Every list uses `SearchInput` from `@mts241alikhlash/ui` 1.2.0, the same compact filters, header, padding, add button and error box with "Coba lagi". The dashboard filters by academic year (opening on the active one) and wave. The login and forgot-password identifier reads "Email atau Username" and no longer capitalises the first letter on phones.

## 1.1.0

### Minor Changes

- 61dd60e: Icons come from `@lucide/vue` (replacing the deprecated `lucide-vue-next`), with `@mts241alikhlash/ui` and `web-shared` 1.1.0.

## 1.0.1

### Patch Changes

- 727fb81: Update @mts241alikhlash/ui to 1.0.1.

## 1.0.0

### Major Changes

- First stable release.
