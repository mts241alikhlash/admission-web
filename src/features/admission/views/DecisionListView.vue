<script setup lang="ts">
import { computed, onMounted, ref, useId, watch } from 'vue'
import { useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { SearchInput } from '@mts241alikhlash/ui'
import { Button } from '@mts241alikhlash/ui/button'
import { Badge } from '@mts241alikhlash/ui/badge'
import { Checkbox } from '@mts241alikhlash/ui/checkbox'
import { Card, CardHeader, CardTitle } from '@mts241alikhlash/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@mts241alikhlash/ui/tabs'
import { Textarea } from '@mts241alikhlash/ui/textarea'
import { FloatingLabelField } from '@mts241alikhlash/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mts241alikhlash/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@mts241alikhlash/ui/dialog'
import { useRoleGuard } from '@/features/platform/auth'
import StatusBadge from '../components/StatusBadge.vue'
import { applicationService } from '../services/applicationService'
import { decisionService } from '../services/decisionService'
import { useApplicationStore } from '../stores/applicationStore'
import type {
  AdmissionDecisionRow,
  AdmissionStatus,
  DecisionTab,
} from '../types'
import { documentSummaryText, formatDate } from '../utils'

type ActionKind =
  | 'accept'
  | 'reject'
  | 'accept-many'
  | 'cancel-acceptance'
  | 'cancel-rejection'

const LIMIT = 50

const router = useRouter()
const { can } = useRoleGuard()
const canDecide = computed(() => can('admission-decisions.decide'))
const { waves } = storeToRefs(useApplicationStore())

const tab = ref<DecisionTab>('waiting')
const search = ref('')
const debouncedSearch = refDebounced(search, 300)
const waveFilter = ref('ALL')
const waveFilterId = useId()
const rows = ref<AdmissionDecisionRow[]>([])
const total = ref(0)
const counts = ref({ waiting: 0, accepted: 0, rejected: 0 })
const page = ref(1)
const loading = ref(false)
let latestRequest = 0
const listError = ref<string | null>(null)

const selected = ref<string[]>([])
const actionKind = ref<ActionKind | null>(null)
const actionRow = ref<AdmissionDecisionRow | null>(null)
const note = ref('')
const noteError = ref('')
const acting = ref(false)
const manyResult = ref<{
  accepted: number
  skipped: { name: string; reason: string }[]
} | null>(null)

const TABS: {
  value: DecisionTab
  label: string
  count: () => number
  empty: string
}[] = [
  {
    value: 'waiting',
    label: 'Menunggu keputusan',
    count: () => counts.value.waiting,
    empty: 'Tidak ada pendaftar yang menunggu keputusan.',
  },
  {
    value: 'accepted',
    label: 'Diterima',
    count: () => counts.value.accepted,
    empty: 'Belum ada pendaftar yang diterima.',
  },
  {
    value: 'rejected',
    label: 'Ditolak',
    count: () => counts.value.rejected,
    empty: 'Belum ada pendaftar yang ditolak.',
  },
]

const emptyText = computed(
  () => TABS.find((item) => item.value === tab.value)?.empty ?? '',
)
const allSelected = computed(
  () =>
    rows.value.length > 0 &&
    rows.value.every((row) => selected.value.includes(row.applicationId)),
)
const reasonRequired = computed(
  () =>
    actionKind.value === 'reject' ||
    actionKind.value === 'cancel-acceptance' ||
    actionKind.value === 'cancel-rejection',
)
const DIALOG_TITLES: Record<ActionKind, string> = {
  accept: 'Terima pendaftar',
  reject: 'Tolak pendaftar',
  'accept-many': 'Terima pendaftar terpilih',
  'cancel-acceptance': 'Batalkan penerimaan',
  'cancel-rejection': 'Batalkan penolakan',
}
const DIALOG_HINTS: Record<ActionKind, string> = {
  accept: 'Pendaftar diberi tahu. Catatan boleh dikosongkan.',
  reject: 'Pendaftar diberi tahu beserta alasannya.',
  'accept-many': 'Setiap pendaftar diberi tahu. Catatan boleh dikosongkan.',
  'cancel-acceptance':
    'Pendaftar kembali menunggu keputusan dan diberi tahu beserta alasannya.',
  'cancel-rejection':
    'Pendaftar kembali diperiksa dan diberi tahu beserta alasannya.',
}

async function load(reset = true) {
  if (reset) page.value = 1
  const request = ++latestRequest
  loading.value = true
  const result = await decisionService.fetchQueue({
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
  const visible = new Set(rows.value.map((row) => row.applicationId))
  selected.value = selected.value.filter((id) => visible.has(id))
}

async function loadMore() {
  page.value += 1
  await load(false)
}

function toggle(applicationId: string, checked: boolean | 'indeterminate') {
  selected.value = checked === true
    ? [...new Set([...selected.value, applicationId])]
    : selected.value.filter((id) => id !== applicationId)
}

function toggleAll(checked: boolean | 'indeterminate') {
  selected.value =
    checked === true ? rows.value.map((row) => row.applicationId) : []
}

function open(kind: ActionKind, row: AdmissionDecisionRow | null = null) {
  actionKind.value = kind
  actionRow.value = row
  note.value = ''
  noteError.value = ''
}

function close() {
  actionKind.value = null
  actionRow.value = null
}

async function submit() {
  const kind = actionKind.value
  if (!kind) return
  const text = note.value.trim()
  if (reasonRequired.value && !text) {
    noteError.value = 'Alasan wajib diisi'
    return
  }
  acting.value = true
  const id = actionRow.value?.applicationId ?? ''
  let success = false
  if (kind === 'accept') {
    success = (await decisionService.accept(id, text)).success
  } else if (kind === 'reject') {
    success = (await decisionService.reject(id, text)).success
  } else if (kind === 'cancel-acceptance') {
    success = (await decisionService.cancelAcceptance(id, text)).success
  } else if (kind === 'cancel-rejection') {
    success = (await decisionService.cancelRejection(id, text)).success
  } else {
    const names = new Map(
      rows.value.map((row) => [row.applicationId, row.applicantName]),
    )
    const result = await decisionService.acceptMany(selected.value, text)
    if (result.success) {
      success = true
      selected.value = []
      manyResult.value = {
        accepted: result.accepted,
        skipped: result.skipped.map((item) => ({
          name: names.get(item.applicationId) ?? item.applicationId,
          reason: item.reason,
        })),
      }
    }
  }
  acting.value = false
  if (!success) return
  close()
  if (kind !== 'accept-many') manyResult.value = null
  await load()
}

watch([tab, debouncedSearch, waveFilter], () => {
  selected.value = []
  manyResult.value = null
  void load()
})

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
        <CardTitle class="text-xl font-bold tracking-tight">Keputusan</CardTitle>
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
          v-if="manyResult"
          data-test="many-result"
          class="space-y-1 rounded-md border p-3 text-sm"
        >
          <p class="font-semibold">
            {{ manyResult.accepted }} diterima, {{ manyResult.skipped.length }}
            dilewati.
          </p>
          <ul
            v-if="manyResult.skipped.length"
            class="list-disc pl-5"
          >
            <li
              v-for="item in manyResult.skipped"
              :key="item.name"
            >
              {{ item.name }}: {{ item.reason }}
            </li>
          </ul>
        </div>

        <div
          v-if="canDecide && tab === 'waiting' && rows.length"
          class="flex flex-wrap items-center justify-between gap-2"
        >
          <label
            data-test="select-all"
            class="flex min-h-11 items-center gap-2 text-sm sm:min-h-0"
          >
            <Checkbox
              :model-value="allSelected"
              aria-label="Pilih semua"
              @update:model-value="toggleAll"
            />
            Pilih semua yang dimuat
          </label>
          <div
            v-if="selected.length"
            data-test="selection-bar"
            class="flex flex-wrap items-center gap-2"
          >
            <span class="text-sm">{{ selected.length }} dipilih</span>
            <Button
              class="min-h-11 sm:min-h-0"
              :disabled="acting"
              @click="open('accept-many')"
            >
              Terima terpilih
            </Button>
          </div>
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
            Memuat antrean keputusan…
          </p>
          <p
            v-else-if="!rows.length"
            class="rounded-md border p-4 text-center text-sm text-muted-foreground"
          >
            {{ emptyText }}
          </p>
          <ul
            v-else
            class="space-y-2"
          >
            <li
              v-for="row in rows"
              :key="row.applicationId"
              data-test="decision-row"
              class="min-w-0 space-y-3 rounded-lg border p-4 text-sm"
            >
              <div class="flex items-start gap-3">
                <Checkbox
                  v-if="canDecide && tab === 'waiting'"
                  :model-value="selected.includes(row.applicationId)"
                  :aria-label="`Pilih ${row.applicantName}`"
                  class="mt-1"
                  @update:model-value="(checked) => toggle(row.applicationId, checked)"
                />
                <div class="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-2">
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
              </div>
              <p>{{ documentSummaryText(row.summary) }}</p>
              <p
                v-if="row.decisionNote"
                class="text-muted-foreground"
              >
                Catatan: {{ row.decisionNote }}
              </p>
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="text-muted-foreground">
                  <template v-if="row.decidedAt">
                    Diputuskan {{ formatDate(row.decidedAt) }}
                  </template>
                  <template v-else-if="row.verifiedAt">
                    Terverifikasi {{ formatDate(row.verifiedAt) }}
                  </template>
                </p>
                <div class="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    class="min-h-11 sm:min-h-0"
                    data-test="open-detail"
                    @click="router.push(`/admin/applicants/${row.applicationId}`)"
                  >
                    Lihat detail
                  </Button>
                  <template v-if="canDecide && tab === 'waiting'">
                    <Button
                      variant="destructive"
                      class="min-h-11 sm:min-h-0"
                      :disabled="acting"
                      @click="open('reject', row)"
                    >
                      Tolak
                    </Button>
                    <Button
                      class="min-h-11 sm:min-h-0"
                      :disabled="acting"
                      @click="open('accept', row)"
                    >
                      Terima
                    </Button>
                  </template>
                  <Button
                    v-if="canDecide && row.status === 'ACCEPTED'"
                    variant="outline"
                    class="min-h-11 sm:min-h-0"
                    :disabled="acting"
                    @click="open('cancel-acceptance', row)"
                  >
                    Batalkan penerimaan
                  </Button>
                  <Button
                    v-if="canDecide && row.status === 'REJECTED'"
                    variant="outline"
                    class="min-h-11 sm:min-h-0"
                    :disabled="acting"
                    @click="open('cancel-rejection', row)"
                  >
                    Batalkan penolakan
                  </Button>
                </div>
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

    <Dialog
      :open="actionKind !== null"
      @update:open="(isOpen) => !isOpen && close()"
    >
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ actionKind ? DIALOG_TITLES[actionKind] : '' }}</DialogTitle>
          <DialogDescription>
            <template v-if="actionKind === 'accept-many'">
              {{ selected.length }} pendaftar akan diterima.
            </template>
            <template v-else-if="actionRow">
              {{ actionRow.applicantName }}.
            </template>
            {{ actionKind ? DIALOG_HINTS[actionKind] : '' }}
          </DialogDescription>
        </DialogHeader>
        <form
          data-test="action-form"
          class="space-y-2"
          @submit.prevent="submit"
        >
          <Textarea
            v-model="note"
            rows="3"
            maxlength="1000"
            :aria-label="reasonRequired ? 'Alasan' : 'Catatan (opsional)'"
            :placeholder="reasonRequired ? 'Alasan' : 'Catatan (opsional)'"
          />
          <p
            v-if="noteError"
            class="text-sm text-destructive"
          >
            {{ noteError }}
          </p>
          <DialogFooter class="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              :disabled="acting"
              @click="close"
            >
              Batal
            </Button>
            <Button
              type="submit"
              :disabled="acting"
            >
              {{ acting ? 'Menyimpan…' : 'Simpan' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
