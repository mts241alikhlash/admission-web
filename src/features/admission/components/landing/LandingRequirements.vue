<script setup lang="ts">
import { computed } from 'vue'
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
</script>

<template>
  <section class="scroll-mt-24 py-16 sm:py-24">
    <div
      class="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-16 lg:px-8"
    >
      <div>
        <h2
          class="text-3xl font-bold tracking-tight text-[#203f73] sm:text-4xl"
        >
          Berkas yang perlu disiapkan
        </h2>
        <p class="mt-4 max-w-xl leading-7 text-slate-700">
          Persyaratan mengikuti gelombang yang sedang tersedia. Periksa kembali
          daftar ini sebelum mengunggah dokumen.
        </p>
        <div
          class="mt-8 border-t border-[#203f73]/25 pt-5 text-sm leading-6 text-slate-700"
        >
          <p class="font-semibold text-[#203f73]">Sebelum mengunggah</p>
          <p class="mt-1">
            Pastikan setiap dokumen terbaca jelas. Jika ada catatan perbaikan,
            periksa kembali berkas melalui akun Anda.
          </p>
        </div>
      </div>

      <div
        v-if="loading"
        role="status"
        class="space-y-3 border-t border-[#203f73]/25 pt-5"
      >
        <p class="text-sm text-slate-600">Memuat persyaratan berkas...</p>
        <div
          v-for="skeleton in 4"
          :key="skeleton"
          class="h-12 animate-pulse bg-slate-200"
        />
      </div>

      <div
        v-else-if="sortedDocumentTypes.length"
        class="border-t border-[#203f73]/25"
      >
        <article
          v-for="documentType in sortedDocumentTypes"
          :key="documentType.id"
          class="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-[#203f73]/25 py-5"
        >
          <p class="min-w-0 text-sm font-semibold text-[#203f73]">
            {{ documentType.name }}
          </p>
          <p class="text-sm text-slate-700">
            {{ documentType.isRequired ? 'Wajib' : 'Opsional' }}
          </p>
        </article>
      </div>

      <div
        v-else
        class="border-t border-[#203f73]/25 py-8 text-sm leading-6 text-slate-700"
      >
        Daftar berkas akan muncul setelah informasi gelombang tersedia.
      </div>
    </div>
  </section>
</template>
