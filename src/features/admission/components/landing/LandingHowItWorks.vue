<script setup lang="ts">
const steps = [
  {
    title: 'Buat akun',
    description:
      'Daftar dengan email aktif, lalu masuk untuk memulai pendaftaran.',
  },
  {
    title: 'Isi formulir',
    description:
      'Lengkapi data diri, orang tua atau wali, alamat, sekolah asal, dan prestasi. Bisa dilanjutkan kapan saja sebelum dikirim.',
  },
  {
    title: 'Unggah berkas',
    description:
      'Foto atau pindai dokumen persyaratan, lalu unggah dari akunmu.',
  },
  {
    title: 'Bayar biaya pendaftaran',
    description:
      'Unggah bukti pembayaran. Kursimu terjamin setelah panitia mengonfirmasinya.',
  },
  {
    title: 'Kirim dan pantau',
    description:
      'Kirim pendaftaran, lalu pantau status dan pengumuman. Jika ada yang perlu diperbaiki, panitia akan memberi catatan.',
  },
]
</script>

<template>
  <section
    class="scroll-mt-14 bg-[#203f73] py-14 text-white sm:py-20 lg:flex lg:min-h-[calc(100svh-3.5rem)] lg:items-center lg:py-8"
  >
    <div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-16">
        <h2
          class="font-[Georgia,serif] text-4xl font-normal leading-[1.1] tracking-tight sm:text-5xl"
        >
          Tahapan pendaftaran
        </h2>
        <p class="max-w-md text-sm leading-7 text-slate-200">
          Lima langkah dari membuat akun sampai pengumuman hasil, semuanya bisa
          diselesaikan dari rumah.
        </p>
      </div>

      <ol
        class="mt-10 grid border-t border-white/30 sm:grid-cols-2 lg:grid-cols-5"
      >
        <li
          v-for="(step, index) in steps"
          :key="step.title"
          class="grid grid-cols-[2.5rem_1fr] gap-x-4 border-b border-white/30 py-6 sm:block sm:pr-8 lg:border-r lg:pl-5 lg:first:pl-0 lg:last:border-r-0"
        >
          <span
            class="row-span-2 block font-[Georgia,serif] text-3xl tabular-nums text-[#e5cc87] sm:text-4xl"
          >
            {{ String(index + 1).padStart(2, '0') }}
          </span>
          <h3 class="font-semibold sm:mt-8">{{ step.title }}</h3>
          <p class="mt-2 text-sm leading-6 text-slate-200">
            {{ step.description }}
          </p>
        </li>
      </ol>
    </div>
  </section>
</template>
