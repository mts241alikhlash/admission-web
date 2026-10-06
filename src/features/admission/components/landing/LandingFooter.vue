<script setup lang="ts">
import { RouterLink } from 'vue-router'

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-[#203f73]/20 bg-[#f5f2e9]">
    <div
      class="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-9 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8"
    >
      <div class="flex items-center gap-3">
        <img
          src="/logo.webp"
          alt="Logo MTs Persis 241 Al-Ikhlash"
          class="h-10 w-10 object-contain"
        />
        <div>
          <p class="text-sm font-bold text-[#203f73]">
            MTs Persis 241 Al-Ikhlash
          </p>
          <p class="text-xs text-slate-700">Penerimaan Santri Baru</p>
        </div>
      </div>
      <div
        class="flex flex-wrap items-center gap-x-6 text-sm font-medium text-[#203f73]"
      >
        <a
          href="#gelombang"
          class="inline-flex min-h-11 items-center hover:underline focus-visible:outline-2 focus-visible:outline-[#203f73]"
          >Gelombang</a
        >
        <a
          href="#persyaratan"
          class="inline-flex min-h-11 items-center hover:underline focus-visible:outline-2 focus-visible:outline-[#203f73]"
          >Persyaratan</a
        >
        <a
          href="#faq"
          class="inline-flex min-h-11 items-center hover:underline focus-visible:outline-2 focus-visible:outline-[#203f73]"
          >FAQ</a
        >
        <RouterLink
          to="/login"
          class="inline-flex min-h-11 items-center hover:underline focus-visible:outline-2 focus-visible:outline-[#203f73]"
          >Masuk</RouterLink
        >
      </div>
      <p class="text-xs text-slate-700">
        © {{ currentYear }} MTs Persis 241 Al-Ikhlash
      </p>
    </div>
  </footer>
</template>
