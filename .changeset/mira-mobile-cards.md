---
'admission-web': minor
---

Phone cards, a calmer form and Node.js 24.22.1.

- Every staff list (applicants, waves, announcements, accounts, document types, downloads, payments, document review, decisions, re-enrollment, late documents) uses the `DataTable` phone cards from `ui` 1.11. The hand-made phone markup and the local pager are gone. The NISN field of the re-enrollment queue now lives in the table cell, so it also works on desktop; the re-enrollment queue shows the NIS in every tab, the payment queue shows the wave, and the download order buttons stay on phones.
- The applicant form is one stepper card with the form card inside it. Steps that need a fix after a review (rejected documents, rejected payment) are marked in the stepper, a step is saved only when it changed, the page no longer scrolls on validation errors, and the back button is back.
- Documents step: one table without group headings (required types carry an asterisk), the reviewer note moves into a tooltip on the status badge, and the upload dialog uses the shared drop area. The payment step lists its facts as label and value, opens the proof from its file name for staff, and drops the copy button for the amount.
- Region fields are floating fields with an error per level, shown only after the step was validated. The review step shows the completeness card only when something is missing and drops the warning box.
- Add buttons are labelled "Tambah"; the add button of the achievements and scholarships steps follows.
- Run on Node.js 24.22.1 (security release of October 2026).
