<script setup lang="ts">
import { computed } from 'vue'
import { FileText } from '@lucide/vue'
import { useInView } from '../../composables/useInView'
import type { AdmissionDocumentType } from '../../types'

const props = defineProps<{
  documentTypes: AdmissionDocumentType[]
  loading: boolean
}>()

const sortedDocumentTypes = computed(() =>
  [...props.documentTypes].sort(
    (first, second) => first.sortOrder - second.sortOrder,
  ),
)

const groups = computed(() => {
  const required = sortedDocumentTypes.value.filter((type) => type.isRequired)
  const optional = sortedDocumentTypes.value.filter((type) => !type.isRequired)
  return [
    { key: 'required', label: 'Wajib', items: required, primary: true },
    { key: 'optional', label: 'Opsional', items: optional, primary: false },
  ].filter((group) => group.items.length)
})

const { target, visible } = useInView()
</script>

<template>
  <section
    :ref="target"
    class="scroll-mt-14 bg-white py-14 sm:py-20 lg:flex lg:min-h-[calc(100svh-3.5rem)] lg:items-center lg:py-8"
  >
    <div
      class="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-16 lg:px-8"
    >
      <div>
        <h2
          class="font-[Georgia,serif] text-4xl font-normal leading-[1.1] tracking-tight text-[#203f73] sm:text-5xl"
        >
          Berkas yang perlu disiapkan
        </h2>
        <p class="mt-5 max-w-xl text-sm leading-7 text-slate-700">
          Siapkan berkas berikut sebelum mulai mendaftar. Berkas yang berlabel
          Wajib harus diunggah agar pendaftaranmu lengkap.
        </p>
        <div
          class="mt-8 max-w-md rounded-2xl bg-[#f5f2e9] p-5 text-sm leading-6 text-slate-700"
        >
          <p class="font-semibold text-[#203f73]">Tips menyiapkan berkas</p>
          <p class="mt-1">
            Foto atau pindai berkasmu sampai tulisannya terbaca jelas, lalu
            simpan sebagai JPG, PNG, atau PDF dengan ukuran di bawah 5 MB.
            Tenang, kalau ada yang perlu diperbaiki, panitia akan memberi tahu
            lewat akunmu.
          </p>
        </div>
      </div>

      <div
        v-if="loading"
        role="status"
        class="space-y-3 border-t border-[#203f73]/25 pt-5"
      >
        <p class="text-sm text-slate-600">Memuat daftar berkas...</p>
        <div
          v-for="skeleton in 4"
          :key="skeleton"
          class="h-12 animate-pulse bg-slate-200"
        />
      </div>

      <div
        v-else-if="sortedDocumentTypes.length"
        class="grid content-start gap-8"
        :class="groups.length > 1 && 'sm:grid-cols-2'"
      >
        <section
          v-for="group in groups"
          :key="group.key"
          :aria-label="`Berkas ${group.label.toLowerCase()}`"
        >
          <p class="flex items-center gap-2 text-xs font-semibold">
            <span
              class="rounded-full px-3 py-1"
              :class="
                group.primary
                  ? 'bg-[#203f73] text-white'
                  : 'bg-[#203f73]/10 text-[#203f73]'
              "
            >
              {{ group.label }}
            </span>
            <span class="text-slate-600">{{ group.items.length }} berkas</span>
          </p>
          <ul class="mt-4 grid gap-3">
            <li
              v-for="(documentType, index) in group.items"
              :key="documentType.id"
              class="flex items-center gap-4 rounded-2xl bg-[#f5f2e9] px-4 py-4 transition duration-500 ease-out motion-reduce:transition-none"
              :class="
                visible
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-4 opacity-0'
              "
              :style="{ transitionDelay: `${Math.min(index, 8) * 70}ms` }"
            >
              <span
                class="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#203f73]"
              >
                <FileText
                  class="size-5"
                  aria-hidden="true"
                />
              </span>
              <p class="min-w-0 flex-1 text-sm font-semibold text-[#203f73]">
                {{ documentType.name }}
              </p>
            </li>
          </ul>
        </section>
      </div>

      <div
        v-else
        class="border-t border-[#203f73]/25 py-8 text-sm leading-6 text-slate-700"
      >
        Daftar berkas belum tersedia. Silakan cek kembali nanti.
      </div>
    </div>
  </section>
</template>
