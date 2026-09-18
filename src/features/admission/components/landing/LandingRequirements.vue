<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2, FileText } from 'lucide-vue-next'
import { Badge } from '@mts241alikhlash/ui/badge'
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
  <section class="scroll-mt-24 py-20 sm:py-24">
    <div
      class="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:px-8"
    >
      <div>
        <p class="text-sm font-bold tracking-wider text-primary">PERSYARATAN</p>
        <h2
          class="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
        >
          Siapkan berkas sejak awal
        </h2>
        <p class="mt-4 max-w-xl leading-7 text-slate-600">
          Daftar persyaratan di bawah mengikuti ketentuan gelombang pendaftaran
          yang sedang tersedia.
        </p>
        <div
          class="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"
        >
          <p class="font-bold">Catatan penting</p>
          <p class="mt-1">
            Pastikan dokumen terbaca jelas sebelum diunggah. Admin dapat meminta
            perbaikan berkas melalui akun pendaftaran.
          </p>
        </div>
      </div>

      <div
        v-if="loading"
        class="grid gap-3 sm:grid-cols-2"
      >
        <div
          v-for="skeleton in 4"
          :key="skeleton"
          class="h-20 animate-pulse rounded-xl bg-slate-200"
        />
      </div>

      <div
        v-else-if="sortedDocumentTypes.length"
        class="grid gap-3 sm:grid-cols-2"
      >
        <article
          v-for="documentType in sortedDocumentTypes"
          :key="documentType.id"
          class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-lg"
            :class="
              documentType.isRequired
                ? 'bg-primary/10 text-primary'
                : 'bg-slate-100 text-slate-500'
            "
          >
            <CheckCircle2
              v-if="documentType.isRequired"
              class="size-5"
              aria-hidden="true"
            />
            <FileText
              v-else
              class="size-5"
              aria-hidden="true"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold text-slate-900">
              {{ documentType.name }}
            </p>
            <Badge
              v-if="!documentType.isRequired"
              variant="secondary"
              class="mt-1 text-[10px] font-bold"
            >
              OPSIONAL
            </Badge>
            <p
              v-else
              class="mt-1 text-xs font-medium text-primary"
            >
              WAJIB DIUNGGAH
            </p>
          </div>
        </article>
      </div>

      <div
        v-else
        class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm leading-6 text-slate-600"
      >
        Persyaratan berkas akan ditampilkan saat informasi pendaftaran tersedia.
      </div>
    </div>
  </section>
</template>
