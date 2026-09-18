<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'

const questions = [
  {
    question: 'Bagaimana cara memulai pendaftaran?',
    answer:
      'Pilih tombol Daftar Sekarang, lalu buat akun menggunakan email aktif. Sistem menempatkan Anda pada gelombang pendaftaran yang sedang dibuka.',
  },
  {
    question: 'Apakah saya bisa menyimpan formulir sebelum selesai?',
    answer:
      'Ya. Lengkapi formulir secara bertahap dari akun pendaftaran Anda, lalu lanjutkan kembali saat data atau berkas sudah siap.',
  },
  {
    question: 'Bagaimana cara mengetahui status pendaftaran?',
    answer:
      'Masuk ke akun pendaftaran untuk melihat perkembangan formulir, berkas, pembayaran, dan pengumuman penerimaan.',
  },
  {
    question: 'Apa yang terjadi jika berkas saya perlu diperbaiki?',
    answer:
      'Admin akan menandai berkas yang perlu direvisi. Periksa catatan pada akun Anda, unggah kembali berkas yang benar, lalu kirim untuk diperiksa ulang.',
  },
]
</script>

<template>
  <section class="scroll-mt-24 bg-slate-100 py-20 sm:py-24">
    <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <div class="text-center">
        <p class="text-sm font-bold tracking-wider text-primary">
          PERTANYAAN UMUM
        </p>
        <h2
          class="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
        >
          Yang sering ditanyakan
        </h2>
        <p class="mt-4 leading-7 text-slate-600">
          Temukan jawaban singkat sebelum memulai pendaftaran.
        </p>
      </div>

      <div
        class="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5 shadow-sm sm:px-6"
      >
        <details
          v-for="item in questions"
          :key="item.question"
          class="group py-1"
        >
          <summary
            class="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-left font-bold text-slate-900 marker:content-none"
          >
            {{ item.question }}
            <ChevronDown
              class="size-5 shrink-0 text-slate-500 transition-transform duration-200 group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <p class="pb-5 pr-8 text-sm leading-7 text-slate-600">
            {{ item.answer }}
          </p>
        </details>
      </div>
    </div>
  </section>
</template>
