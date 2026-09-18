<script setup lang="ts">
import { RouterLink } from 'vue-router'

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-slate-200 bg-white">
    <div
      class="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8"
    >
      <div class="flex items-center gap-3">
        <img
          src="/logo.webp"
          alt="Logo MTs Persis 241 Al-Ikhlash"
          class="h-10 w-10 object-contain"
        />
        <div>
          <p class="text-sm font-bold text-slate-950">
            MTs Persis 241 Al-Ikhlash
          </p>
          <p class="text-xs text-slate-500">Penerimaan Santri Baru</p>
        </div>
      </div>
      <div
        class="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-600"
      >
        <a
          href="#gelombang"
          class="transition-colors hover:text-primary"
          >Gelombang</a
        >
        <a
          href="#persyaratan"
          class="transition-colors hover:text-primary"
          >Persyaratan</a
        >
        <a
          href="#faq"
          class="transition-colors hover:text-primary"
          >FAQ</a
        >
        <RouterLink
          to="/login"
          class="transition-colors hover:text-primary"
          >Masuk</RouterLink
        >
      </div>
      <p class="text-xs text-slate-500">
        © {{ currentYear }} MTs Persis 241 Al-Ikhlash
      </p>
    </div>
  </footer>
</template>
