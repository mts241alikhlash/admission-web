<script setup lang="ts">
import {
  ClipboardPenLine,
  CreditCard,
  FileUp,
  SearchCheck,
  UserRoundPlus,
} from 'lucide-vue-next'

const steps = [
  {
    title: 'Buat akun',
    description: 'Gunakan email aktif untuk membuat akun pendaftaran.',
    icon: UserRoundPlus,
  },
  {
    title: 'Lengkapi formulir',
    description: 'Isi data calon santri, orang tua, alamat, dan sekolah asal.',
    icon: ClipboardPenLine,
  },
  {
    title: 'Unggah berkas',
    description: 'Kirim dokumen persyaratan dari akun pendaftaran Anda.',
    icon: FileUp,
  },
  {
    title: 'Bayar & verifikasi',
    description: 'Unggah bukti pembayaran, lalu tunggu pemeriksaan admin.',
    icon: CreditCard,
  },
  {
    title: 'Pantau hasil',
    description: 'Lihat status dan pengumuman langsung dari akun Anda.',
    icon: SearchCheck,
  },
]
</script>

<template>
  <section class="scroll-mt-24 bg-slate-950 py-20 text-white sm:py-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="max-w-2xl">
        <p class="text-sm font-bold tracking-wider text-sky-300">
          ALUR PENDAFTARAN
        </p>
        <h2 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Lima langkah, satu tujuan.
        </h2>
        <p class="mt-4 leading-7 text-slate-300">
          Ikuti proses berikut dari awal hingga pengumuman penerimaan.
        </p>
      </div>

      <ol class="mt-12 grid gap-4 md:grid-cols-5">
        <li
          v-for="(step, index) in steps"
          :key="step.title"
          class="relative rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
        >
          <span
            class="mb-8 flex size-9 items-center justify-center rounded-full bg-sky-300 text-sm font-extrabold text-slate-950"
          >
            {{ index + 1 }}
          </span>
          <component
            :is="step.icon"
            class="size-5 text-sky-300"
            aria-hidden="true"
          />
          <h3 class="mt-4 font-bold">{{ step.title }}</h3>
          <p class="mt-2 text-sm leading-6 text-slate-300">
            {{ step.description }}
          </p>
        </li>
      </ol>
    </div>
  </section>
</template>
