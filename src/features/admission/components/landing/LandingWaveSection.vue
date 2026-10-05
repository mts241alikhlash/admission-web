<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDays } from '@lucide/vue'
import { Button } from '@mts241alikhlash/ui/button'
import { useSignUpDialog } from '../../composables/useSignUpDialog'
import type { ActiveWave } from '../../types'
import { formatDate, formatIDR } from '../../utils'

const props = defineProps<{
  waves: ActiveWave[]
  loading: boolean
}>()

const { open } = useSignUpDialog()

const waveCards = computed(() =>
  props.waves.map((wave) => ({
    ...wave,
    dateRange: `${formatDate(wave.startDate)} – ${formatDate(wave.endDate)}`,
    registrationFeeLabel: formatIDR(wave.registrationFee),
  })),
)
</script>

<template>
  <section class="scroll-mt-24 bg-white py-16 sm:py-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="max-w-2xl">
        <h2
          class="text-3xl font-bold tracking-tight text-[#203f73] sm:text-4xl"
        >
          Jadwal dan biaya pendaftaran
        </h2>
        <p class="mt-4 leading-7 text-slate-700">
          Periksa gelombang yang tersedia, termasuk periode, kuota, dan biaya,
          sebelum membuat akun.
        </p>
      </div>

      <div
        v-if="loading"
        role="status"
        class="mt-10 space-y-4 border-t border-[#203f73]/25 pt-6"
      >
        <p class="text-sm text-slate-600">Memuat gelombang pendaftaran...</p>
        <div
          v-for="skeleton in 2"
          :key="skeleton"
          class="h-14 animate-pulse bg-slate-100"
        />
      </div>

      <div
        v-else-if="waveCards.length === 0"
        class="mt-10 border-t border-[#203f73]/25 py-10"
      >
        <CalendarDays
          class="size-7 text-[#203f73]"
          aria-hidden="true"
        />
        <h3 class="mt-4 text-lg font-bold text-[#203f73]">
          Belum ada gelombang yang dibuka
        </h3>
        <p class="mt-2 max-w-md text-sm leading-6 text-slate-700">
          Jadwal gelombang berikutnya akan ditampilkan di halaman ini setelah
          tersedia.
        </p>
      </div>

      <div
        v-else
        class="mt-10 border-t border-[#203f73]/25"
      >
        <article
          v-for="wave in waveCards"
          :key="wave.id"
          class="grid gap-7 border-b border-[#203f73]/25 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] lg:items-start lg:gap-10"
        >
          <div>
            <p class="text-xs font-bold text-[#203f73]">
              {{ wave.code }} · Pendaftaran dibuka
            </p>
            <h3 class="mt-3 text-2xl font-bold text-[#203f73]">
              {{ wave.name }}
            </h3>
            <p class="mt-1 text-sm text-slate-600">
              Tahun Ajaran {{ wave.academicYear }}
            </p>
            <p
              v-if="wave.description"
              class="mt-5 max-w-sm text-sm leading-6 text-slate-600"
            >
              {{ wave.description }}
            </p>
          </div>

          <dl class="grid gap-5 sm:grid-cols-3">
            <div>
              <dt class="text-sm text-slate-600">Periode</dt>
              <dd class="mt-2 text-sm font-bold leading-6 text-[#203f73]">
                {{ wave.dateRange }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-slate-600">Sisa kuota</dt>
              <dd class="mt-2 text-sm font-bold text-[#203f73]">
                {{ wave.remainingQuota }}
                <span class="font-medium text-slate-600">
                  dari {{ wave.quota }}
                </span>
              </dd>
            </div>
            <div>
              <dt class="text-sm text-slate-600">Biaya</dt>
              <dd class="mt-2 text-sm font-bold text-[#203f73]">
                {{ wave.registrationFeeLabel }}
              </dd>
            </div>
          </dl>

          <Button
            class="min-h-11 bg-[#203f73] font-bold text-white hover:bg-[#162d53]"
            @click="open"
          >
            Mulai pendaftaran
          </Button>
        </article>
      </div>
    </div>
  </section>
</template>
