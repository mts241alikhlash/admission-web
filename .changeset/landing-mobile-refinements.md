---
'admission-web': minor
---

Halaman depan PPDB tampil lebih baik di ponsel (bagian "PPDB" baru dengan slide, hero, persyaratan, dan gelombang yang dirapikan). Halaman staf memakai standar `@mts241alikhlash/ui` 1.8: header card, judul, dan isi seragam; field memakai `FloatingField` dengan pesan validasi di label; footer memakai `CardFooter standard`.

Pembayaran oleh staf pindah ke halaman sendiri (`/admin/payments/new`). Linimasa pendaftaran memakai kartu langkah baru dan Jenis Berkas memakai dialog form sendiri.

Daftar Pendaftar, Gelombang, Pengumuman, Pembayaran, Keputusan, Verifikasi Berkas, dan Daftar Ulang memakai paginasi dari server (10 baris, bisa 5 sampai 100) menggantikan "Muat lebih banyak". Pilih semua di Keputusan dan Daftar Ulang berlaku untuk halaman yang tampil.
