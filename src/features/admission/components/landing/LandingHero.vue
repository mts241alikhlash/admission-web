<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@mts241alikhlash/ui/button'
import { useSignUpDialog } from '../../composables/useSignUpDialog'
import type { ActiveWave } from '../../types'

const props = defineProps<{
  wave: ActiveWave | null
  loading: boolean
  error: boolean
}>()

const { open } = useSignUpDialog()

const waveDetails = computed(() => {
  if (!props.wave) return null

  return {
    academicYear: props.wave.academicYear,
    name: props.wave.name,
  }
})
</script>

<template>
  <section class="bg-[#203f73] text-white">
    <div
      class="mx-auto grid max-w-7xl lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
    >
      <div
        class="order-2 flex flex-col justify-center px-5 py-10 sm:px-8 sm:py-16 lg:order-1 lg:py-20 lg:pr-12"
      >
        <p class="text-sm font-semibold text-[#ebd990]">
          MTs Persis 241 Al-Ikhlash
        </p>
        <h1
          class="mt-5 max-w-xl text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]"
        >
          Pendaftaran santri baru.
        </h1>
        <p class="mt-6 max-w-lg text-base leading-7 text-slate-100">
          Cek gelombang yang dibuka, siapkan berkas, lalu mulai pendaftaran
          melalui akun Anda.
        </p>
        <div class="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
          <Button
            size="lg"
            class="min-h-11 bg-[#b7aa73] font-bold text-[#162d53] hover:bg-[#d5c693]"
            @click="open"
          >
            Mulai pendaftaran
          </Button>
          <a
            href="#alur"
            class="inline-flex min-h-11 items-center border-b border-[#d5c693] font-semibold text-white transition-colors hover:text-[#ebd990] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Lihat cara mendaftar
          </a>
        </div>
      </div>

      <figure
        class="relative order-1 min-h-64 overflow-hidden sm:min-h-96 lg:order-2 lg:min-h-[540px]"
      >
        <img
          src="/bg.webp"
          alt="Kegiatan santri di lingkungan MTs Persis 241 Al-Ikhlash"
          class="absolute inset-0 h-full w-full object-cover object-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700"
          fetchpriority="high"
        />
      </figure>
    </div>

    <div class="border-t border-white/20 bg-[#19345f]">
      <div
        class="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between"
      >
        <div
          v-if="loading"
          role="status"
          class="text-sm text-white"
        >
          Memuat informasi gelombang pendaftaran...
        </div>
        <template v-else-if="waveDetails">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-[#ebd990]">
              Gelombang pendaftaran dibuka
            </p>
            <p class="mt-1 text-lg font-semibold">
              {{ waveDetails.name }} · Tahun Ajaran
              {{ waveDetails.academicYear }}
            </p>
          </div>
          <a
            href="#gelombang"
            class="inline-flex min-h-11 shrink-0 items-center self-start border-b border-[#d5c693] font-semibold text-white hover:text-[#ebd990] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >Lihat jadwal dan biaya</a
          >
        </template>
        <p
          v-else
          class="text-sm leading-6 text-white"
        >
          {{
            error
              ? 'Informasi gelombang belum dapat dimuat. Coba lagi melalui tombol di bawah.'
              : 'Belum ada gelombang yang dibuka. Periksa halaman ini kembali untuk jadwal berikutnya.'
          }}
        </p>
      </div>
    </div>
  </section>
</template>
