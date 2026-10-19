<script setup lang="ts">
import { computed, h, onMounted, ref, useId, watch } from 'vue'
import { useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import type { ColumnDef } from '@tanstack/vue-table'
import { ActionCell, DataTable, SearchInput } from '@mts241alikhlash/ui'
import { Button } from '@mts241alikhlash/ui/button'
import { Badge } from '@mts241alikhlash/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@mts241alikhlash/ui/card'
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
import ServerPager from '../components/ServerPager.vue'
import { documentReviewService } from '../services/documentReviewService'
import { useApplicationStore } from '../stores/applicationStore'
import type {
  AdmissionDocumentReviewRow,
  AdmissionStatus,
  DocumentReviewTab,
} from '../types'
import { documentSummaryText, formatDate } from '../utils'

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
const pageSize = ref(10)
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

async function load(resetPage = true) {
  if (resetPage) page.value = 1
  const request = ++latestRequest
  loading.value = true
  const result = await documentReviewService.fetchQueue({
    tab: tab.value,
    search: debouncedSearch.value.trim() || undefined,
    waveId: waveFilter.value === 'ALL' ? undefined : waveFilter.value,
    page: page.value,
    limit: pageSize.value,
  })
  if (request !== latestRequest) return
  loading.value = false
  if ('error' in result) {
    listError.value = result.error
    rows.value = []
    return
  }
  listError.value = null
  total.value = result.total
  counts.value = result.counts
  const lastPage = Math.max(1, Math.ceil(result.total / pageSize.value))
  if (page.value > lastPage) {
    page.value = lastPage
    await load(false)
    return
  }
  rows.value = result.rows
}

function goToPage(next: number) {
  page.value = next
  void load(false)
}

function changePageSize(size: number) {
  pageSize.value = size
  void load()
}

watch([tab, debouncedSearch, waveFilter], () => load())

const columns = computed<ColumnDef<AdmissionDocumentReviewRow>[]>(() => [
  {
    accessorKey: 'registrationNumber',
    header: 'No. Pendaftaran',
    meta: { align: 'center' },
  },
  {
    accessorKey: 'applicantName',
    header: 'Nama Pendaftar',
    meta: { align: 'left' },
  },
  {
    accessorKey: 'waveName',
    header: 'Gelombang',
    meta: { align: 'center' },
  },
  {
    id: 'documents',
    header: () => (tab.value === 'revision' ? 'Catatan Perbaikan' : 'Berkas'),
    meta: { align: tab.value === 'revision' ? 'left' : 'center' },
    cell: ({ row }) => {
      if (tab.value === 'revision') {
        const rejectedCount = row.original.summary.rejected
        return h('div', { class: 'space-y-0.5 min-w-0' }, [
          h(
            'p',
            { class: 'font-semibold text-xs text-destructive' },
            `${rejectedCount} berkas ditolak`,
          ),
          row.original.revisionNote
            ? h(
                'p',
                {
                  class:
                    'text-xs text-muted-foreground line-clamp-2 max-w-md break-words',
                },
                row.original.revisionNote,
              )
            : null,
        ])
      }
      const summary = row.original.summary
      const uploaded = summary.total - summary.missing
      return `${uploaded}/${summary.total} Berkas`
    },
  },
  {
    id: 'actions',
    header: 'Aksi',
    meta: { align: 'center' },
    cell: ({ row }) =>
      h(ActionCell, {
        viewLabel: 'Periksa',
        hideEdit: true,
        hideDelete: true,
        onView: () =>
          router.push(`/admin/document-reviews/${row.original.applicationId}`),
      }),
    enableSorting: false,
  },
])

onMounted(async () => {
  await applicationService.fetchWaves()
  await load()
})
</script>

<template>
  <div class="p-4 sm:p-6">
    <Card
      gap="none"
      class="overflow-hidden rounded-2xl shadow-sm shadow-black/5 ring-1 ring-black/4"
    >
      <CardHeader
        data-test="header"
        class="flex flex-col items-start justify-between gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:px-6 sm:py-5"
      >
        <CardTitle size="lg"> Verifikasi Berkas </CardTitle>
      </CardHeader>

      <div class="space-y-4 px-4 py-5 sm:px-6">
        <Tabs
          v-model="tab"
          variant="line"
          class="min-w-0 gap-0"
        >
          <Card
            gap="none"
            class="overflow-hidden rounded-xl border bg-card shadow-xs"
          >
            <CardHeader class="p-0 shrink-0">
              <TabsList class="w-full bg-muted/30 px-4 sm:px-6">
                <TabsTrigger
                  v-for="item in TABS"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                  <Badge
                    variant="secondary"
                    class="ml-1.5"
                  >
                    {{ item.count() }}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent
              class="space-y-4 px-4 pt-3 pb-4 sm:px-6 sm:pt-3.5 sm:pb-6"
            >
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
                <template v-else>
                  <DataTable
                    class="hidden md:block"
                    :columns="columns"
                    :data="rows"
                    :page="page"
                    :page-size="pageSize"
                    :total-items="total"
                    :is-loading="loading"
                    item-label="pendaftar"
                    @update:page="goToPage"
                    @update:page-size="changePageSize"
                  />
                  <ul class="space-y-2 md:hidden">
                    <li
                      v-for="row in rows"
                      :key="row.applicationId"
                      data-test="review-row"
                      class="min-w-0 space-y-3 rounded-lg border p-4 text-sm"
                    >
                      <div
                        class="flex flex-wrap items-start justify-between gap-2"
                      >
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
                      <div
                        v-if="row.revisionNote"
                        class="rounded-md border border-destructive/20 bg-destructive/10 p-2 text-xs text-destructive"
                      >
                        {{ row.revisionNote }}
                      </div>
                      <div
                        class="flex flex-wrap items-center justify-between gap-2"
                      >
                        <p class="text-muted-foreground">
                          <template v-if="row.submittedAt">
                            Dikirim {{ formatDate(row.submittedAt) }}
                          </template>
                        </p>
                        <Button
                          data-test="open-review"
                          class="min-h-11 w-full sm:min-h-0 sm:w-auto"
                          @click="
                            router.push(
                              `/admin/document-reviews/${row.applicationId}`,
                            )
                          "
                        >
                          Periksa
                        </Button>
                      </div>
                    </li>
                  </ul>
                  <ServerPager
                    class="md:hidden"
                    :page="page"
                    :page-size="pageSize"
                    :total="total"
                    item-label="pendaftar"
                    :disabled="loading"
                    @update:page="goToPage"
                  />
                </template>
              </template>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </Card>
  </div>
</template>
