<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDays, UsersRound, WalletCards } from 'lucide-vue-next'
import { Badge } from '@mts241alikhlash/ui/badge'
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
  <section class="scroll-mt-24 py-20 sm:py-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div class="max-w-2xl">
          <p class="text-sm font-bold tracking-wider text-primary">
            PENDAFTARAN
          </p>
          <h2
            class="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
          >
            Gelombang pendaftaran yang sedang dibuka
          </h2>
          <p class="mt-4 leading-7 text-slate-600">
            Sistem menempatkan akun baru pada gelombang yang sedang dibuka.
            Lihat jadwal, kuota, dan biaya pendaftaran sebelum membuat akun.
          </p>
        </div>
        <Button
          variant="outline"
          class="hidden shrink-0 font-semibold sm:inline-flex"
          @click="open"
        >
          Mulai Pendaftaran
        </Button>
      </div>

      <div
        v-if="loading"
        class="mt-10 grid gap-5 lg:grid-cols-2"
      >
        <div
          v-for="skeleton in 2"
          :key="skeleton"
          class="h-72 animate-pulse rounded-2xl bg-slate-200"
        />
      </div>

      <div
        v-else-if="waveCards.length === 0"
        class="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"
      >
        <CalendarDays
          class="mx-auto size-8 text-slate-400"
          aria-hidden="true"
        />
        <h3 class="mt-4 text-lg font-bold text-slate-900">
          Belum ada gelombang yang dibuka
        </h3>
        <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          Informasi jadwal pendaftaran akan tersedia di halaman ini ketika
          gelombang baru dibuka.
        </p>
      </div>

      <div
        v-else
        class="mt-10 grid gap-5 lg:grid-cols-2"
      >
        <article
          v-for="wave in waveCards"
          :key="wave.id"
          class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-950/8 sm:p-7"
        >
          <div class="relative">
            <div class="flex items-start justify-between gap-4">
              <div>
                <Badge
                  class="bg-primary/10 font-bold text-primary hover:bg-primary/10"
                >
                  {{ wave.code }}
                </Badge>
                <h3 class="mt-3 text-xl font-bold text-slate-950">
                  {{ wave.name }}
                </h3>
                <p class="mt-1 text-sm text-slate-500">
                  Tahun Ajaran {{ wave.academicYear }}
                </p>
              </div>
              <div
                class="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"
              >
                DIBUKA
              </div>
            </div>

            <p
              v-if="wave.description"
              class="mt-5 line-clamp-2 text-sm leading-6 text-slate-600"
            >
              {{ wave.description }}
            </p>

            <dl class="mt-6 grid gap-3 sm:grid-cols-3">
              <div class="rounded-xl bg-slate-50 p-3">
                <dt
                  class="flex items-center gap-1.5 text-xs font-medium text-slate-500"
                >
                  <CalendarDays
                    class="size-3.5 text-primary"
                    aria-hidden="true"
                  />
                  Periode
                </dt>
                <dd class="mt-1.5 text-xs font-bold leading-5 text-slate-800">
                  {{ wave.dateRange }}
                </dd>
              </div>
              <div class="rounded-xl bg-slate-50 p-3">
                <dt
                  class="flex items-center gap-1.5 text-xs font-medium text-slate-500"
                >
                  <UsersRound
                    class="size-3.5 text-primary"
                    aria-hidden="true"
                  />
                  Sisa kuota
                </dt>
                <dd class="mt-1.5 text-sm font-bold text-slate-800">
                  {{ wave.remainingQuota }}
                  <span class="text-xs font-medium text-slate-500">
                    dari {{ wave.quota }}
                  </span>
                </dd>
              </div>
              <div class="rounded-xl bg-slate-50 p-3">
                <dt
                  class="flex items-center gap-1.5 text-xs font-medium text-slate-500"
                >
                  <WalletCards
                    class="size-3.5 text-primary"
                    aria-hidden="true"
                  />
                  Biaya
                </dt>
                <dd class="mt-1.5 text-sm font-bold text-slate-800">
                  {{ wave.registrationFeeLabel }}
                </dd>
              </div>
            </dl>

            <Button
              class="mt-6 w-full font-bold"
              @click="open"
            >
              Daftar Sekarang
            </Button>
          </div>
        </article>
      </div>

      <Button
        variant="outline"
        class="mt-6 w-full font-semibold sm:hidden"
        @click="open"
      >
        Mulai Pendaftaran
      </Button>
    </div>
  </section>
</template>
