<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { AlertCircle, ArrowRight, RefreshCw } from 'lucide-vue-next'
import { Button } from '@mts241alikhlash/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@mts241alikhlash/ui/card'
import { Skeleton } from '@mts241alikhlash/ui/skeleton'
import { useAdmissionStats } from '../composables/useAdmissionStats'
import { STATUS_LABELS } from '../types'
import type { AdmissionStatus } from '../types'

const { stats, loading, error, fetchStats } = useAdmissionStats()

const STATUS_ORDER: AdmissionStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'REVISION_NEEDED',
  'VERIFIED',
  'ACCEPTED',
  'REJECTED',
  'ENROLLED',
]

const ATTENTION: AdmissionStatus[] = ['SUBMITTED', 'REVISION_NEEDED']

const counts = computed(() =>
  STATUS_ORDER.map((status) => stats.value?.byStatus[status] ?? 0),
)

const maxCount = computed(() => Math.max(...counts.value, 1))

const needsAction = computed(() =>
  ATTENTION.reduce(
    (sum, status) => sum + (stats.value?.byStatus[status] ?? 0),
    0,
  ),
)

const hasWaves = computed(() => (stats.value?.waves.length ?? 0) > 0)

function countOf(status: AdmissionStatus) {
  return stats.value?.byStatus[status] ?? 0
}

function barWidth(status: AdmissionStatus) {
  return `${Math.round((countOf(status) / maxCount.value) * 100)}%`
}

function isAttention(status: AdmissionStatus) {
  return ATTENTION.includes(status)
}

function wavePercent(fillRate: number) {
  return Math.round(fillRate * 100)
}

onMounted(() => {
  void fetchStats()
})
</script>

<template>
  <div class="p-4 sm:p-6">
    <Card
      class="overflow-hidden rounded-2xl shadow-sm shadow-black/5 ring-1 ring-black/4"
    >
      <CardHeader class="border-b px-6 py-5">
        <CardTitle class="text-xl font-bold tracking-tight">
          Penerimaan Santri Baru
        </CardTitle>
      </CardHeader>

      <CardContent class="space-y-4 px-6 pb-6">
        <template v-if="loading">
          <div class="grid gap-4 lg:grid-cols-3">
            <Skeleton class="h-44 rounded-xl lg:col-span-2" />
            <Skeleton class="h-44 rounded-xl" />
          </div>
          <Skeleton class="h-40 rounded-xl" />
          <Skeleton class="h-44 rounded-xl" />
        </template>

        <Card
          v-else-if="error"
          class="gap-0 border-destructive/40 bg-destructive/5 p-6"
        >
          <div class="flex items-center gap-2 text-destructive">
            <AlertCircle class="size-4 shrink-0" />
            <p class="text-sm font-medium">Statistik gagal dimuat</p>
          </div>
          <p class="mt-2 text-sm text-muted-foreground">{{ error }}</p>
          <Button
            variant="outline"
            size="sm"
            class="mt-3 w-fit"
            @click="fetchStats()"
          >
            <RefreshCw class="mr-2 size-3.5" />
            Coba lagi
          </Button>
        </Card>

        <template v-else-if="stats">
          <div class="grid gap-4 lg:grid-cols-3">
            <Card
              class="gap-0 border-primary bg-primary p-6 text-primary-foreground lg:col-span-2"
            >
              <p class="text-sm font-medium text-primary-foreground">
                Total pendaftar
              </p>
              <p
                class="mt-2 text-5xl font-semibold tabular-nums tracking-tight sm:text-6xl"
              >
                {{ stats.total }}
              </p>
              <p class="mt-2 text-sm text-primary-foreground">
                Semua gelombang
              </p>
            </Card>

            <Card class="gap-0 p-6">
              <p class="text-sm font-medium text-muted-foreground">
                Perlu tindakan
              </p>
              <p
                class="mt-2 text-5xl font-semibold tabular-nums tracking-tight"
                :class="needsAction > 0 ? 'text-amber-700' : ''"
              >
                {{ needsAction }}
              </p>
              <p
                class="mt-2 text-sm"
                :class="
                  needsAction > 0 ? 'text-amber-700' : 'text-muted-foreground'
                "
              >
                {{
                  needsAction > 0
                    ? 'Menunggu verifikasi atau revisi'
                    : 'Tidak ada yang menunggu'
                }}
              </p>
            </Card>
          </div>

          <Card>
            <CardHeader class="border-b px-6 py-5">
              <CardTitle class="text-base">Status pendaftar</CardTitle>
            </CardHeader>
            <CardContent class="pb-6">
              <div
                class="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-4 lg:grid-cols-7"
              >
                <div
                  v-for="status in STATUS_ORDER"
                  :key="status"
                  class="bg-card p-4"
                >
                  <p class="text-xs font-medium text-muted-foreground">
                    {{ STATUS_LABELS[status] }}
                  </p>
                  <p
                    class="mt-1 text-2xl font-semibold tabular-nums tracking-tight"
                  >
                    {{ countOf(status) }}
                  </p>
                  <div class="mt-3 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      class="h-full rounded-full transition-all"
                      :class="
                        isAttention(status) ? 'bg-amber-700' : 'bg-primary'
                      "
                      :style="{ width: barWidth(status) }"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              class="flex flex-row items-center justify-between gap-3 border-b px-6 py-5"
            >
              <CardTitle class="text-base">Keterisian kuota</CardTitle>
              <RouterLink
                v-if="hasWaves"
                :to="{ name: 'admin-applications' }"
                class="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Lihat semua pendaftar
                <ArrowRight class="size-3.5" />
              </RouterLink>
            </CardHeader>
            <CardContent class="pb-6">
              <p
                v-if="!hasWaves"
                class="text-sm text-muted-foreground"
              >
                Belum ada gelombang yang dibuka.
              </p>
              <ul
                v-else
                class="divide-y"
              >
                <li
                  v-for="wave in stats.waves"
                  :key="wave.id"
                >
                  <RouterLink
                    :to="{
                      name: 'admin-applications',
                      query: { wave: wave.id },
                    }"
                    class="block py-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div class="flex items-end justify-between gap-4">
                      <div class="min-w-0">
                        <p class="truncate font-medium">{{ wave.name }}</p>
                        <p class="text-xs text-muted-foreground">
                          {{ wave.code }}
                        </p>
                      </div>
                      <div class="shrink-0 text-right">
                        <p
                          class="text-2xl font-semibold tabular-nums leading-none"
                        >
                          {{ wave.accepted }}
                          <span
                            class="text-sm font-normal text-muted-foreground"
                            >/ {{ wave.quota }} diterima</span
                          >
                        </p>
                        <p
                          class="pt-1 text-xs font-medium"
                          :class="
                            wavePercent(wave.quotaFillRate) >= 100
                              ? 'text-amber-700'
                              : 'text-muted-foreground'
                          "
                        >
                          {{ wavePercent(wave.quotaFillRate) }}%
                          <template
                            v-if="wavePercent(wave.quotaFillRate) >= 100"
                          >
                            kuota penuh
                          </template>
                        </p>
                      </div>
                    </div>
                    <div
                      class="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        class="h-full rounded-full transition-all"
                        :class="
                          wavePercent(wave.quotaFillRate) >= 100
                            ? 'bg-amber-700'
                            : 'bg-primary'
                        "
                        :style="{
                          width: `${Math.min(wavePercent(wave.quotaFillRate), 100)}%`,
                        }"
                      />
                    </div>
                  </RouterLink>
                </li>
              </ul>
            </CardContent>
          </Card>
        </template>
      </CardContent>
    </Card>
  </div>
</template>
