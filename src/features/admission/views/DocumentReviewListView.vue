<script setup lang="ts">
import { onMounted, ref, useId, watch } from 'vue'
import { useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { SearchInput } from '@mts241alikhlash/ui'
import { Button } from '@mts241alikhlash/ui/button'
import { Badge } from '@mts241alikhlash/ui/badge'
import { Card, CardHeader, CardTitle } from '@mts241alikhlash/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@mts241alikhlash/ui/tabs'
import { FloatingLabelField } from '@mts241alikhlash/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mts241alikhlash/ui/select'
import StatusBadge from '../components/StatusBadge.vue'
import { applicationService } from '../services/applicationService'
import { documentReviewService } from '../services/documentReviewService'
import { useApplicationStore } from '../stores/applicationStore'
import type {
  AdmissionDocumentReviewRow,
  AdmissionStatus,
  DocumentReviewTab,
} from '../types'
import { documentSummaryText, formatDate } from '../utils'

const LIMIT = 50

const router = useRouter()
const { waves } = storeToRefs(useApplicationStore())

const tab = ref<DocumentReviewTab>('waiting')
const search = ref('')
const debouncedSearch = refDebounced(search, 300)
const waveFilter = ref('ALL')
const waveFilterId = useId()
const rows = ref<AdmissionDocumentReviewRow[]>([])
const total = ref(0)
const counts = ref({ waiting: 0, revision: 0, done: 0 })
const page = ref(1)
const loading = ref(false)
let latestRequest = 0
const listError = ref<string | null>(null)

const TABS: {
  value: DocumentReviewTab
  label: string
  count: () => number
  empty: string
}[] = [
  {
    value: 'waiting',
    label: 'Menunggu',
    count: () => counts.value.waiting,
    empty: 'Tidak ada pendaftar yang menunggu pemeriksaan berkas.',
  },
  {
    value: 'revision',
    label: 'Perlu perbaikan',
    count: () => counts.value.revision,
    empty: 'Tidak ada pendaftar yang sedang memperbaiki formulir.',
  },
  {
    value: 'done',
    label: 'Selesai',
    count: () => counts.value.done,
    empty: 'Belum ada pendaftar yang selesai diperiksa.',
  },
]

function emptyText() {
  return TABS.find((item) => item.value === tab.value)?.empty ?? ''
}

async function load(reset = true) {
  if (reset) page.value = 1
  const request = ++latestRequest
  loading.value = true
  const result = await documentReviewService.fetchQueue({
    tab: tab.value,
    search: debouncedSearch.value.trim() || undefined,
    waveId: waveFilter.value === 'ALL' ? undefined : waveFilter.value,
    page: page.value,
    limit: LIMIT,
  })
  if (request !== latestRequest) return
  loading.value = false
  if ('error' in result) {
    listError.value = result.error
    if (reset) rows.value = []
    else page.value -= 1
    return
  }
  listError.value = null
  rows.value = reset ? result.rows : [...rows.value, ...result.rows]
  total.value = result.total
  counts.value = result.counts
}

async function loadMore() {
  page.value += 1
  await load(false)
}

watch([tab, debouncedSearch, waveFilter], () => load())

onMounted(async () => {
  await applicationService.fetchWaves()
  await load()
})
</script>

<template>
  <div class="p-4 sm:p-6">
    <Card
      class="overflow-hidden rounded-2xl shadow-sm shadow-black/5 ring-1 ring-black/4"
    >
      <CardHeader
        data-test="header"
        class="flex flex-col items-start justify-between gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:px-6 sm:py-5"
      >
        <CardTitle class="text-xl font-bold tracking-tight">
          Verifikasi Berkas
        </CardTitle>
      </CardHeader>

      <div class="space-y-4 p-4 sm:p-6">
        <Tabs
          v-model="tab"
          variant="line"
        >
          <TabsList>
            <TabsTrigger
              v-for="item in TABS"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
              <Badge
                variant="secondary"
                class="ml-1.5"
                >{{ item.count() }}</Badge
              >
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        >
          <FloatingLabelField
            label="Gelombang"
            :for="waveFilterId"
            class="w-full sm:w-48"
            floating
          >
            <Select v-model="waveFilter">
              <SelectTrigger
                :id="waveFilterId"
                size="sm"
                class="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua</SelectItem>
                <SelectItem
                  v-for="wave in waves"
                  :key="wave.id"
                  :value="wave.id"
                >
                  {{ wave.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </FloatingLabelField>
          <SearchInput
            v-model="search"
            label="Cari nama atau no. pendaftaran"
          />
        </div>

        <div
          v-if="listError"
          class="space-y-3 rounded-md border p-4"
          role="alert"
        >
          <p class="text-sm">{{ listError }}</p>
          <Button
            variant="outline"
            class="min-h-11"
            @click="load()"
          >
            Coba lagi
          </Button>
        </div>
        <template v-else>
          <p
            v-if="loading && !rows.length"
            class="text-center text-sm text-muted-foreground"
          >
            Memuat antrean berkas…
          </p>
          <p
            v-else-if="!rows.length"
            class="rounded-md border p-4 text-center text-sm text-muted-foreground"
          >
            {{ emptyText() }}
          </p>
          <ul
            v-else
            class="space-y-2"
          >
            <li
              v-for="row in rows"
              :key="row.applicationId"
              data-test="review-row"
              class="min-w-0 space-y-3 rounded-lg border p-4 text-sm"
            >
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="break-words font-semibold">
                    {{ row.applicantName }}
                  </p>
                  <p class="text-muted-foreground">
                    {{ row.registrationNumber }} · {{ row.waveName }}
                  </p>
                </div>
                <StatusBadge :status="row.status as AdmissionStatus" />
              </div>
              <p>{{ documentSummaryText(row.summary) }}</p>
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="text-muted-foreground">
                  <template v-if="row.submittedAt">
                    Dikirim {{ formatDate(row.submittedAt) }}
                  </template>
                </p>
                <Button
                  data-test="open-review"
                  class="min-h-11 w-full sm:min-h-0 sm:w-auto"
                  @click="
                    router.push(`/admin/document-reviews/${row.applicationId}`)
                  "
                >
                  Periksa
                </Button>
              </div>
            </li>
          </ul>
          <Button
            v-if="rows.length < total"
            variant="outline"
            class="min-h-11 w-full"
            :disabled="loading"
            @click="loadMore"
          >
            Muat lebih banyak
          </Button>
        </template>
      </div>
    </Card>
  </div>
</template>
