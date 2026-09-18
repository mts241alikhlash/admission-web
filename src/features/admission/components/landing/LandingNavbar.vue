<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Menu, X } from 'lucide-vue-next'
import { Button } from '@mts241alikhlash/ui/button'
import { useSignUpDialog } from '../../composables/useSignUpDialog'

const isMenuOpen = ref(false)
const { open } = useSignUpDialog()

const navigationItems = [
  { label: 'Gelombang', href: '#gelombang' },
  { label: 'Alur Daftar', href: '#alur' },
  { label: 'Persyaratan', href: '#persyaratan' },
  { label: 'FAQ', href: '#faq' },
]

function closeMenu() {
  isMenuOpen.value = false
}

function openFromMenu() {
  closeMenu()
  open()
}
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-lg"
  >
    <div
      class="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
    >
      <RouterLink
        to="/"
        class="flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label="PSB 241, kembali ke halaman utama"
      >
        <img
          src="/logo.webp"
          alt="Logo MTs Persis 241 Al-Ikhlash"
          class="h-10 w-10 object-contain"
        />
        <div class="leading-tight">
          <p class="text-sm font-bold tracking-tight text-slate-950">PSB 241</p>
          <p class="text-xs text-slate-500">Penerimaan Santri Baru</p>
        </div>
      </RouterLink>

      <nav
        class="hidden items-center gap-7 lg:flex"
        aria-label="Navigasi utama"
      >
        <a
          v-for="item in navigationItems"
          :key="item.href"
          :href="item.href"
          class="text-sm font-medium text-slate-600 transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none"
        >
          {{ item.label }}
        </a>
      </nav>

      <div class="hidden items-center gap-3 sm:flex">
        <RouterLink to="/login">
          <Button
            variant="ghost"
            class="font-semibold"
            >Masuk</Button
          >
        </RouterLink>
        <Button
          class="font-semibold shadow-sm"
          @click="open"
        >
          Daftar Sekarang
        </Button>
      </div>

      <button
        type="button"
        class="inline-flex size-10 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
        :aria-expanded="isMenuOpen"
        aria-controls="mobile-navigation"
        :aria-label="isMenuOpen ? 'Tutup navigasi' : 'Buka navigasi'"
        @click="isMenuOpen = !isMenuOpen"
      >
        <X
          v-if="isMenuOpen"
          class="size-5"
          aria-hidden="true"
        />
        <Menu
          v-else
          class="size-5"
          aria-hidden="true"
        />
      </button>
    </div>

    <div
      v-if="isMenuOpen"
      id="mobile-navigation"
      class="border-t border-slate-100 bg-white px-4 py-4 shadow-lg lg:hidden"
    >
      <nav
        class="mx-auto grid max-w-7xl gap-1"
        aria-label="Navigasi seluler"
      >
        <a
          v-for="item in navigationItems"
          :key="item.href"
          :href="item.href"
          class="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-primary"
          @click="closeMenu"
        >
          {{ item.label }}
        </a>
        <div class="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
          <RouterLink
            to="/login"
            @click="closeMenu"
          >
            <Button
              variant="outline"
              class="w-full"
              >Masuk</Button
            >
          </RouterLink>
          <Button
            class="w-full"
            @click="openFromMenu"
          >
            Daftar
          </Button>
        </div>
      </nav>
    </div>
  </header>
</template>
