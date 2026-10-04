<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'

const questions = [
  {
    question: 'Bagaimana cara memulai pendaftaran?',
    answer:
      'Pilih Mulai pendaftaran, lalu buat akun dengan email aktif. Periksa detail gelombang sebelum mengisi formulir.',
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
  <section class="scroll-mt-24 bg-white py-16 sm:py-24">
    <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <div>
        <h2
          class="text-3xl font-bold tracking-tight text-[#203f73] sm:text-4xl"
        >
          Pertanyaan seputar pendaftaran
        </h2>
        <p class="mt-4 leading-7 text-slate-600">
          Jawaban singkat untuk hal yang sering ditanyakan orang tua.
        </p>
      </div>

      <div class="mt-10 divide-y divide-slate-300 border-y border-slate-300">
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
              class="size-5 shrink-0 text-slate-500 transition-transform duration-200 group-open:rotate-180"
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
