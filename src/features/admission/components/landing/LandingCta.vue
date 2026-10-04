<script setup lang="ts">
import { Button } from '@mts241alikhlash/ui/button'
import { useSignUpDialog } from '../../composables/useSignUpDialog'

const { open } = useSignUpDialog()
</script>

<template>
  <section class="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
    <div
      class="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12 sm:py-18"
    >
      <div class="relative mx-auto max-w-2xl">
        <p class="text-sm font-bold tracking-wider text-white">SIAP MEMULAI?</p>
        <h2 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Buat akun pendaftaran Anda hari ini.
        </h2>
        <p class="mt-4 leading-7 text-white">
          Semua informasi dan perkembangan proses pendaftaran dapat diakses dari
          satu akun.
        </p>
        <Button
          size="lg"
          class="mt-8 bg-white font-bold text-primary shadow-lg hover:bg-slate-100"
          @click="open"
        >
          Daftar Sekarang
        </Button>
      </div>
    </div>
  </section>
</template>
