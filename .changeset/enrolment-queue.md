---
'admission-web': minor
---

Applicants choose Siswa baru or Pindahan and the grade they join when an account is created (public sign-up and staff registration). New menu Daftar Ulang for staff with `admission-enrolments.read`: a queue of accepted applicants (Siap diproses, Tertahan, Selesai) where staff with `admission-enrolments.nis` preview, compose and lock the NIS of a school year, and staff with `admission-enrolments.process` set missing placements and enrol many applicants at once with a result per applicant. Detail Pendaftar shows the type, grade and NIS, asks only for the number that is missing, and shows Proses Jadi Santri only with `admission-enrolments.process`.
