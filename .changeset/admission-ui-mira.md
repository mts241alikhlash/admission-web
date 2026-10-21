---
'admission-web': minor
---

Move the admin screens to the Mira design on `@mts241alikhlash/ui` 1.10.1.

- New layout: inset page card, full-width top bar with the app switcher (logo and name, centered on phones), a 32 px search button on tablet and desktop, the account menu, and a collapsible sidebar with its toggle in the footer. The breadcrumb no longer starts with "Admin PSB".
- List pages drop the page card and the repeated title. The add button is "Tambah" in the toolbar, filters are joined in one frame with the search, and the footer shows rows per page and the count on the left with the pager centered.
- Dialogs use `size="md"` or `size="xl"` with the standard header, body and footer.
- Numeric fields show their unit while not focused (`Rp. 1.500,-`, `100 orang`, `3 bulan`) with thousands separators for money; the stored value is unchanged. The wave date range uses the shared `DateRangePicker`.
- Table main columns use `meta: { strong: true }`; weights follow 400, 500, 600 and the monospace font is gone.
- Profile tabs keep the underline with `variant="line"`.
