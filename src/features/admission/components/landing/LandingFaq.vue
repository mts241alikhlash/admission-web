<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'

const questions = [
  {
    question: 'Bagaimana cara memulai pendaftaran?',
    answer:
      'Pilih Mulai pendaftaran untuk menuju halaman login. Masuk dengan akun Anda, atau pilih Daftar untuk membuat akun dengan email aktif.',
  },
  {
    question: 'Apakah saya bisa menyimpan formulir sebelum selesai?',
    answer:
      'Ya. Anda dapat melanjutkan pengisian formulir dari akun pendaftaran saat data dan berkas sudah siap.',
  },
  {
    question: 'Bagaimana cara mengetahui status pendaftaran?',
    answer:
      'Masuk ke akun Anda untuk memeriksa status formulir, berkas, pembayaran, dan pengumuman.',
  },
  {
    question: 'Apa yang terjadi jika berkas saya perlu diperbaiki?',
    answer:
      'Periksa catatan perbaikan di akun Anda, lalu unggah kembali berkas yang diminta.',
  },
]
</script>

<template>
  <section class="scroll-mt-24 bg-white py-14 sm:py-20">
    <div
      class="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-8"
    >
      <div>
        <h2
          class="max-w-md font-[Georgia,serif] text-4xl font-normal leading-[1.1] tracking-tight text-[#203f73] sm:text-5xl"
        >
          Pertanyaan seputar pendaftaran
        </h2>
        <p class="mt-5 max-w-sm text-sm leading-7 text-slate-600">
          Jawaban singkat untuk hal yang sering ditanyakan orang tua.
        </p>
      </div>

      <div class="divide-y divide-slate-300 border-y border-slate-300">
        <details
          v-for="item in questions"
          :key="item.question"
          class="group py-1"
        >
          <summary
            class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-5 py-5 text-left font-semibold text-[#203f73] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#203f73] marker:content-none"
          >
            {{ item.question }}
            <ChevronDown
              class="size-5 shrink-0 text-slate-500 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </summary>
          <p class="max-w-2xl pb-6 pr-8 text-sm leading-7 text-slate-700">
            {{ item.answer }}
          </p>
        </details>
      </div>
    </div>
  </section>
</template>
