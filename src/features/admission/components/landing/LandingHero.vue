<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDays, CircleCheck, UsersRound } from 'lucide-vue-next'
import { Button } from '@mts241alikhlash/ui/button'
import { useSignUpDialog } from '../../composables/useSignUpDialog'
import type { ActiveWave } from '../../types'
import { formatDate, formatIDR } from '../../utils'

const props = defineProps<{
  wave: ActiveWave | null
  loading: boolean
  error: boolean
}>()

const { open } = useSignUpDialog()

const waveDetails = computed(() => {
  if (!props.wave) return null

  const quotaPercentage =
    props.wave.quota > 0
      ? Math.round((props.wave.remainingQuota / props.wave.quota) * 100)
      : 0

  return {
    academicYear: props.wave.academicYear,
    registrationPeriod: `${formatDate(props.wave.startDate)} – ${formatDate(props.wave.endDate)}`,
    registrationFee: formatIDR(props.wave.registrationFee),
    remainingQuota: props.wave.remainingQuota,
    quotaPercentage: Math.min(Math.max(quotaPercentage, 0), 100),
  }
})
</script>

<template>
  <section class="relative isolate overflow-hidden bg-slate-950">
    <img
      src="/bg.webp"
      alt="Kegiatan santri di MTs Persis 241 Al-Ikhlash"
      class="absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-55"
    />
    <div
      class="absolute inset-0 -z-10 bg-linear-to-r from-slate-950 via-slate-950/88 to-slate-950/45"
    />

    <div
      class="mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24"
    >
      <div
        class="max-w-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700"
      >
        <p class="mb-5 text-sm font-semibold text-white">
          Pendaftaran online MTs Persis 241 Al-Ikhlash
        </p>
        <h1
          class="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          Mulai langkah terbaik untuk masa depan putra-putri Anda.
        </h1>
        <p class="mt-6 max-w-xl text-base leading-8 text-slate-200 sm:text-lg">
          Daftar santri baru dengan proses yang jelas, terarah, dan dapat
          dipantau dari satu akun pendaftaran.
        </p>

        <div class="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            class="w-full bg-white font-bold text-slate-950 shadow-lg shadow-black/20 hover:bg-slate-100 sm:w-auto"
            @click="open"
          >
            Daftar Sekarang
          </Button>
          <a href="#alur">
            <Button
              size="lg"
              variant="outline"
              class="w-full border-white/30 bg-white/5 font-semibold text-white hover:bg-white/15 hover:text-white sm:w-auto"
            >
              Lihat Alur Pendaftaran
            </Button>
          </a>
        </div>

        <ul
          class="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-200"
        >
          <li class="flex items-center gap-2">
            <CircleCheck
              class="size-4 text-emerald-400"
              aria-hidden="true"
            />
            Satu akun untuk seluruh proses
          </li>
          <li class="flex items-center gap-2">
            <CircleCheck
              class="size-4 text-emerald-400"
              aria-hidden="true"
            />
            Status dapat dipantau online
          </li>
        </ul>
      </div>

      <aside
        class="relative mx-auto w-full max-w-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6 motion-safe:delay-150 motion-safe:duration-700 lg:mx-0 lg:justify-self-end"
      >
        <div
          class="rounded-3xl border border-white/20 bg-white p-6 shadow-2xl shadow-black/25 sm:p-7"
        >
          <template v-if="loading">
            <div class="h-4 w-32 animate-pulse rounded bg-slate-200" />
            <div class="mt-5 h-8 w-4/5 animate-pulse rounded bg-slate-200" />
            <div class="mt-6 space-y-3">
              <div class="h-14 animate-pulse rounded-xl bg-slate-100" />
              <div class="h-14 animate-pulse rounded-xl bg-slate-100" />
            </div>
          </template>

          <template v-else-if="waveDetails">
            <p class="text-sm font-bold tracking-wide text-primary">
              PENDAFTARAN DIBUKA
            </p>
            <p class="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              Tahun Ajaran {{ waveDetails.academicYear }}
            </p>
            <p
              class="mt-2 flex items-start gap-2 text-sm leading-6 text-slate-600"
            >
              <CalendarDays
                class="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              {{ waveDetails.registrationPeriod }}
            </p>

            <div class="mt-6 rounded-2xl bg-slate-50 p-4">
              <div class="flex items-center justify-between gap-4">
                <div
                  class="flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  <UsersRound
                    class="size-4 text-primary"
                    aria-hidden="true"
                  />
                  Kuota tersedia
                </div>
                <span class="text-sm font-bold text-slate-950">
                  {{ waveDetails.remainingQuota }} kursi
                </span>
              </div>
              <div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  class="h-full rounded-full bg-primary transition-all duration-700"
                  :style="{ width: `${waveDetails.quotaPercentage}%` }"
                />
              </div>
            </div>

            <div
              class="mt-5 flex items-center justify-between border-t border-slate-100 pt-5 text-sm"
            >
              <span class="text-slate-500">Biaya pendaftaran</span>
              <strong class="text-slate-900">{{
                waveDetails.registrationFee
              }}</strong>
            </div>
            <Button
              class="mt-6 w-full font-bold"
              @click="open"
            >
              Mulai Pendaftaran
            </Button>
          </template>

          <template v-else>
            <p class="text-sm font-bold tracking-wide text-primary">
              INFORMASI PENDAFTARAN
            </p>
            <p class="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              {{
                error
                  ? 'Informasi sementara tidak tersedia.'
                  : 'Belum ada gelombang yang dibuka.'
              }}
            </p>
            <p class="mt-3 text-sm leading-6 text-slate-600">
              Kami akan menampilkan detail jadwal, kuota, dan biaya pendaftaran
              di halaman ini saat gelombang dibuka.
            </p>
            <a
              href="#faq"
              class="mt-6 block"
            >
              <Button
                variant="outline"
                class="w-full font-semibold"
              >
                Lihat Pertanyaan Umum
              </Button>
            </a>
          </template>
        </div>
      </aside>
    </div>
  </section>
</template>
