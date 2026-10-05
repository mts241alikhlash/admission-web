<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Menu, X } from '@lucide/vue'

const isMenuOpen = ref(false)
const menuButton = ref<HTMLButtonElement | null>(null)

const navigationItems = [
  { label: 'Gelombang', href: '#gelombang' },
  { label: 'Alur Daftar', href: '#alur' },
  { label: 'Persyaratan', href: '#persyaratan' },
  { label: 'FAQ', href: '#faq' },
]

function closeMenu() {
  isMenuOpen.value = false
}

function closeMenuOnEscape() {
  if (!isMenuOpen.value) return
  closeMenu()
  menuButton.value?.focus()
}
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95"
    @keydown.esc="closeMenuOnEscape"
  >
    <div
      class="mx-auto grid h-14 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 lg:px-8"
    >
      <button
        ref="menuButton"
        type="button"
        class="inline-flex min-h-11 w-fit items-center gap-2 rounded-md px-1 text-sm font-semibold text-[#203f73] hover:text-[#162d53] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#203f73]"
        :aria-expanded="isMenuOpen"
        aria-controls="mobile-navigation"
        :aria-label="isMenuOpen ? 'Tutup menu' : 'Buka menu'"
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
        <span>Menu</span>
      </button>
      <RouterLink
        to="/"
        class="flex size-11 items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label="PSB 241, kembali ke halaman utama"
        @click="closeMenu"
      >
        <img
          src="/logo.webp"
          alt="Logo MTs Persis 241 Al-Ikhlash"
          class="size-9 object-contain"
        />
      </RouterLink>

      <RouterLink
        to="/login"
        class="inline-flex min-h-11 items-center justify-center justify-self-end border-b-2 border-transparent px-2 text-sm font-semibold text-[#203f73] hover:border-[#836d29] focus-visible:border-[#836d29] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#203f73]"
        @click="closeMenu"
        >Portal</RouterLink
      >
    </div>

    <div
      v-if="isMenuOpen"
      id="mobile-navigation"
      class="absolute inset-x-0 top-full border-b border-slate-200 bg-white px-4 py-3 shadow-lg sm:px-6 lg:px-8"
    >
      <nav
        class="mx-auto grid max-w-7xl gap-1 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Navigasi halaman"
      >
        <a
          v-for="item in navigationItems"
          :key="item.href"
          :href="item.href"
          class="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
          @click="closeMenu"
        >
          {{ item.label }}
        </a>
      </nav>
    </div>
  </header>
</template>
