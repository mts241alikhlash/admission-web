<script setup lang="ts">
const steps = [
  {
    title: 'Buat akun',
    description: 'Gunakan email aktif untuk membuat akun pendaftaran.',
  },
  {
    title: 'Lengkapi formulir',
    description: 'Isi data calon santri, orang tua, alamat, dan sekolah asal.',
  },
  {
    title: 'Unggah berkas',
    description: 'Kirim dokumen persyaratan dari akun pendaftaran Anda.',
  },
  {
    title: 'Bayar & verifikasi',
    description: 'Unggah bukti pembayaran, lalu tunggu pemeriksaan admin.',
  },
  {
    title: 'Pantau hasil',
    description: 'Lihat status dan pengumuman langsung dari akun Anda.',
  },
]
</script>

<template>
  <section class="scroll-mt-24 bg-[#203f73] py-16 text-white sm:py-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="max-w-2xl">
        <h2 class="text-3xl font-bold tracking-tight sm:text-4xl">
          Tahapan pendaftaran
        </h2>
        <p class="mt-4 leading-7 text-slate-300">
          Mulai dengan membuat akun, lalu ikuti setiap tahap hingga pengumuman.
        </p>
      </div>

      <ol
        class="mt-10 grid border-t border-white/30 sm:grid-cols-2 lg:grid-cols-5"
      >
        <li
          v-for="(step, index) in steps"
          :key="step.title"
          class="border-b border-white/30 py-6 sm:pr-8 lg:border-r lg:pl-5 lg:first:pl-0 lg:last:border-r-0"
        >
          <span
            class="block font-mono text-4xl font-semibold tabular-nums text-[#ebd990]"
          >
            {{ String(index + 1).padStart(2, '0') }}
          </span>
          <h3 class="mt-8 font-bold">{{ step.title }}</h3>
          <p class="mt-2 text-sm leading-6 text-slate-300">
            {{ step.description }}
          </p>
        </li>
      </ol>
    </div>
  </section>
</template>
