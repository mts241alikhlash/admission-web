<script setup lang="ts">
import { computed, onMounted, ref, useId, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { SearchInput } from '@mts241alikhlash/ui'
import { Button } from '@mts241alikhlash/ui/button'
import { Badge } from '@mts241alikhlash/ui/badge'
import { Checkbox } from '@mts241alikhlash/ui/checkbox'
import { Input } from '@mts241alikhlash/ui/input'
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
import { enrolmentService } from '../services/enrolmentService'
import { publicAdmissionService } from '../services/publicAdmissionService'
import { useApplicationStore } from '../stores/applicationStore'
import {
  ADMISSION_TYPE_LABELS,
  type AdmissionEnrolmentRow,
  type AdmissionGrade,
  type AdmissionNisPreview,
  type AdmissionStatus,
  type AdmissionType,
  type EnrolmentTab,
} from '../types'

const LIMIT = 50

const { can } = useRoleGuard()
const canProcess = computed(() => can('admission-enrolments.process'))
const canCompose = computed(() => can('admission-enrolments.nis'))
const { waves } = storeToRefs(useApplicationStore())

const tab = ref<EnrolmentTab>('ready')
const search = ref('')
const debouncedSearch = refDebounced(search, 300)
const waveFilter = ref('ALL')
const waveFilterId = useId()
const rows = ref<AdmissionEnrolmentRow[]>([])
const total = ref(0)
const counts = ref({ ready: 0, held: 0, done: 0 })
const years = ref<
  {
    academicYearId: string
    academicYearName: string | null
    locked: boolean
    lockedAt: string | null
  }[]
>([])
const yearId = ref('')
const page = ref(1)
const loading = ref(false)
let latestRequest = 0
const listError = ref<string | null>(null)

const grades = ref<AdmissionGrade[]>([])
const selected = ref<string[]>([])
const nisnInput = ref<Record<string, string>>({})
const processOpen = ref(false)
const processResult = ref<{
  enrolled: number
  problems: { name: string; reason: string }[]
} | null>(null)
const acting = ref(false)

const placementRow = ref<AdmissionEnrolmentRow | null>(null)
const placementType = ref('')
const placementGrade = ref('')
const placementError = ref('')

const nisOpen = ref(false)
const nisPreview = ref<AdmissionNisPreview | null>(null)
const nisError = ref('')
const nisLoading = ref(false)
const lockOpen = ref(false)
const syncPending = ref(0)
const MAX_PROCESS = 50
const nisnError = ref('')
const NISN_PATTERN = /^\d{10}$/

const TABS: {
  value: EnrolmentTab
  label: string
  count: () => number
  empty: string
}[] = [
  {
    value: 'ready',
    label: 'Siap diproses',
    count: () => counts.value.ready,
    empty: 'Tidak ada pendaftar yang siap diproses.',
  },
  {
    value: 'held',
    label: 'Tertahan',
    count: () => counts.value.held,
    empty: 'Tidak ada pendaftar yang tertahan.',
  },
  {
    value: 'done',
    label: 'Selesai',
    count: () => counts.value.done,
    empty: 'Belum ada pendaftar yang menjadi santri.',
  },
]

const emptyText = computed(
  () => TABS.find((item) => item.value === tab.value)?.empty ?? '',
)
const currentYear = computed(() =>
  years.value.find((year) => year.academicYearId === yearId.value),
)
const selectable = computed(() => tab.value !== 'done')
const allSelected = computed(
  () =>
    rows.value.length > 0 &&
    rows.value.every((row) => selected.value.includes(row.applicationId)),
)
const typedNisn = computed(() =>
  selected.value.flatMap((applicationId) => {
    const nisn = nisnInput.value[applicationId]?.trim()
    return nisn ? [{ applicationId, nisn }] : []
  }),
)

function gradeLabel(row: AdmissionEnrolmentRow) {
  const grade = grades.value.find((item) => item.level === row.targetGradeLevel)
  return grade?.name ?? `Kelas ${row.targetGradeLevel}`
}

async function load(reset = true) {
  if (reset) page.value = 1
  const request = ++latestRequest
  loading.value = true
  const result = await enrolmentService.fetchQueue({
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
  years.value = result.years
  if (!years.value.some((year) => year.academicYearId === yearId.value)) {
    yearId.value = years.value[0]?.academicYearId ?? ''
  }
  const visible = new Set(rows.value.map((row) => row.applicationId))
  selected.value = selected.value.filter((id) => visible.has(id))
}

async function loadMore() {
  page.value += 1
  await load(false)
}

function toggle(applicationId: string, checked: boolean | 'indeterminate') {
  selected.value =
    checked === true
      ? [...new Set([...selected.value, applicationId])]
      : selected.value.filter((id) => id !== applicationId)
}

function toggleAll(checked: boolean | 'indeterminate') {
  selected.value =
    checked === true ? rows.value.map((row) => row.applicationId) : []
}

async function submitProcess() {
  nisnError.value = ''
  if (typedNisn.value.some((item) => !NISN_PATTERN.test(item.nisn))) {
    nisnError.value = 'NISN harus 10 digit angka'
    return
  }
  acting.value = true
  const names = new Map(
    rows.value.map((row) => [row.applicationId, row.applicantName]),
  )
  const result = await enrolmentService.process(selected.value, typedNisn.value)
  acting.value = false
  if (!result.success) return
  processOpen.value = false
  selected.value = []
  processResult.value = {
    enrolled: result.enrolled,
    problems: result.problems.map((problem) => ({
      name: names.get(problem.applicationId) ?? problem.applicationId,
      reason: problem.reason ?? 'Bermasalah',
    })),
  }
  await load()
}

function openPlacement(row: AdmissionEnrolmentRow) {
  placementRow.value = row
  placementType.value = row.admissionType ?? ''
  placementGrade.value =
    grades.value.find((grade) => grade.level === row.targetGradeLevel)?.id ?? ''
  placementError.value = ''
}

async function submitPlacement() {
  const row = placementRow.value
  if (!row) return
  if (!placementType.value || !placementGrade.value) {
    placementError.value = 'Jenis dan tingkat kelas wajib dipilih'
    return
  }
  acting.value = true
  const result = await enrolmentService.setPlacement(
    row.applicationId,
    placementType.value as AdmissionType,
    placementGrade.value,
  )
  acting.value = false
  if (!result.success) return
  placementRow.value = null
  await load()
}

async function loadPreview() {
  nisLoading.value = true
  nisError.value = ''
  const result = await enrolmentService.previewNis(yearId.value)
  nisLoading.value = false
  if ('error' in result) {
    nisPreview.value = null
    nisError.value = result.error
    return
  }
  nisPreview.value = result.preview
}

async function openNis() {
  nisOpen.value = true
  nisPreview.value = null
  await loadPreview()
}

async function submitNis() {
  if (!nisPreview.value) return
  acting.value = true
  const result = await enrolmentService.composeNis(
    yearId.value,
    nisPreview.value.changes,
    false,
  )
  acting.value = false
  if (!result.success) {
    if (result.stale) await loadPreview()
    return
  }
  nisOpen.value = false
  syncPending.value = result.result.failed.length
  await load()
}

async function syncStudents() {
  acting.value = true
  const result = await enrolmentService.composeNis(yearId.value, 0, true)
  acting.value = false
  if (result.success) syncPending.value = result.result.failed.length
  await load()
}

async function submitLock() {
  acting.value = true
  const result = await enrolmentService.lockNis(yearId.value)
  acting.value = false
  if (!result.success) return
  lockOpen.value = false
  await load()
}

watch([tab, debouncedSearch, waveFilter], () => {
  selected.value = []
  processResult.value = null
  void load()
})

onMounted(async () => {
  const [, loaded] = await Promise.all([
    applicationService.fetchWaves(),
    publicAdmissionService.fetchGrades(),
  ])
  grades.value = loaded ?? []
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
          Daftar Ulang
        </CardTitle>
      </CardHeader>

      <div class="space-y-4 p-4 sm:p-6">
        <div
          v-if="canCompose && currentYear"
          data-test="nis-panel"
          class="space-y-2 rounded-md border p-3 text-sm"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="font-semibold">
              NIS tahun ajaran {{ currentYear.academicYearName ?? '-' }}
            </p>
            <Badge
              v-if="currentYear.locked"
              variant="secondary"
              >NIS dikunci</Badge
            >
          </div>
          <div
            v-if="years.length > 1"
            class="max-w-xs"
          >
            <Select v-model="yearId">
              <SelectTrigger
                size="sm"
                class="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="year in years"
                  :key="year.academicYearId"
                  :value="year.academicYearId"
                >
                  {{ year.academicYearName ?? year.academicYearId }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p
            v-if="syncPending > 0"
            class="text-destructive"
          >
            {{ syncPending }} santri belum diperbarui NIS-nya.
          </p>
          <div class="flex flex-wrap gap-2">
            <Button
              variant="outline"
              class="min-h-11 sm:min-h-0"
              :disabled="acting"
              @click="openNis"
            >
              Susun NIS
            </Button>
            <Button
              variant="outline"
              class="min-h-11 sm:min-h-0"
              :disabled="acting"
              @click="syncStudents"
            >
              Sinkronkan ulang
            </Button>
            <Button
              v-if="!currentYear.locked"
              variant="outline"
              class="min-h-11 sm:min-h-0"
              :disabled="acting"
              @click="lockOpen = true"
            >
              Kunci NIS
            </Button>
          </div>
        </div>

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
          v-if="processResult"
          data-test="process-result"
          class="space-y-1 rounded-md border p-3 text-sm"
        >
          <p class="font-semibold">
            {{ processResult.enrolled }} diproses,
            {{ processResult.problems.length }} bermasalah.
          </p>
          <ul
            v-if="processResult.problems.length"
            class="list-disc pl-5"
          >
            <li
              v-for="problem in processResult.problems"
              :key="problem.name + problem.reason"
            >
              {{ problem.name }}: {{ problem.reason }}
            </li>
          </ul>
        </div>

        <div
          v-if="canProcess && selectable && rows.length"
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
            <span
              v-if="selected.length > MAX_PROCESS"
              class="text-sm text-destructive"
            >
              Maksimal {{ MAX_PROCESS }} pendaftar sekali proses
            </span>
            <Button
              class="min-h-11 sm:min-h-0"
              :disabled="acting || selected.length > MAX_PROCESS"
              @click="processOpen = true"
            >
              Proses terpilih
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
            Memuat antrean daftar ulang…
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
              data-test="enrolment-row"
              class="min-w-0 space-y-3 rounded-lg border p-4 text-sm"
            >
              <div class="flex items-start gap-3">
                <Checkbox
                  v-if="canProcess && selectable"
                  :model-value="selected.includes(row.applicationId)"
                  :aria-label="`Pilih ${row.applicantName}`"
                  class="mt-1"
                  @update:model-value="
                    (checked) => toggle(row.applicationId, checked)
                  "
                />
                <div
                  class="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-2"
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
              </div>
              <dl class="grid gap-x-8 gap-y-1 sm:grid-cols-2">
                <div>
                  <dt class="text-muted-foreground">Jenis dan tingkat</dt>
                  <dd>
                    <template v-if="row.admissionType && row.targetGradeLevel">
                      {{ ADMISSION_TYPE_LABELS[row.admissionType] }} ·
                      {{ gradeLabel(row) }}
                    </template>
                    <template v-else>Jenis dan tingkat belum diisi</template>
                  </dd>
                </div>
                <div>
                  <dt class="text-muted-foreground">NIS</dt>
                  <dd>{{ row.nis ?? 'NIS belum disusun' }}</dd>
                </div>
                <div>
                  <dt class="text-muted-foreground">NISN</dt>
                  <dd>
                    <Input
                      v-if="canProcess && selectable && !row.nisn"
                      v-model="nisnInput[row.applicationId]"
                      data-test="nisn-input"
                      inputmode="numeric"
                      maxlength="20"
                      placeholder="Isi NISN"
                      :aria-label="`NISN ${row.applicantName}`"
                    />
                    <template v-else>{{ row.nisn ?? '-' }}</template>
                  </dd>
                </div>
              </dl>
              <div
                v-if="canProcess && row.status === 'ACCEPTED'"
                class="flex flex-wrap justify-end gap-2"
              >
                <Button
                  variant="outline"
                  class="min-h-11 sm:min-h-0"
                  :disabled="acting"
                  @click="openPlacement(row)"
                >
                  Atur jenis dan kelas
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

    <Dialog
      :open="processOpen"
      @update:open="(isOpen) => (processOpen = isOpen)"
    >
      <DialogContent class="sm:max-w-md">
        <form
          data-test="process-form"
          class="space-y-4"
          @submit.prevent="submitProcess"
        >
          <DialogHeader>
            <DialogTitle>Proses jadi santri</DialogTitle>
            <DialogDescription>
              {{ selected.length }} pendaftar akan diproses menjadi santri dan
              akunnya menjadi akun santri.
            </DialogDescription>
          </DialogHeader>
          <p
            v-if="nisnError"
            role="alert"
            class="text-sm text-destructive"
          >
            {{ nisnError }}
          </p>
          <DialogFooter class="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              :disabled="acting"
              @click="processOpen = false"
            >
              Batal
            </Button>
            <Button
              type="submit"
              :disabled="acting"
            >
              {{ acting ? 'Memproses…' : 'Proses' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog
      :open="placementRow !== null"
      @update:open="(isOpen) => !isOpen && (placementRow = null)"
    >
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Jenis dan tingkat kelas</DialogTitle>
          <DialogDescription>
            {{ placementRow?.applicantName }}. Tingkat kelas menentukan dua
            digit tengah NIS.
          </DialogDescription>
        </DialogHeader>
        <form
          data-test="placement-form"
          class="space-y-3"
          @submit.prevent="submitPlacement"
        >
          <Select v-model="placementType">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Jenis pendaftaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="(label, type) in ADMISSION_TYPE_LABELS"
                :key="type"
                :value="type"
              >
                {{ label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select v-model="placementGrade">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Tingkat kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="grade in grades"
                :key="grade.id"
                :value="grade.id"
              >
                {{ grade.name ?? `Kelas ${grade.level}` }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p
            v-if="placementError"
            class="text-sm text-destructive"
          >
            {{ placementError }}
          </p>
          <DialogFooter class="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              :disabled="acting"
              @click="placementRow = null"
            >
              Batal
            </Button>
            <Button
              type="submit"
              :disabled="acting"
            >
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog
      :open="nisOpen"
      @update:open="(isOpen) => (nisOpen = isOpen)"
    >
      <DialogContent
        data-test="nis-dialog"
        class="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>Susun NIS</DialogTitle>
          <DialogDescription>
            Urutan abjad menurut nama, satu urutan untuk seluruh tingkat kelas
            di tahun ajaran ini.
          </DialogDescription>
        </DialogHeader>
        <p
          v-if="nisLoading"
          class="text-sm text-muted-foreground"
        >
          Memuat pratinjau…
        </p>
        <p
          v-else-if="nisError"
          role="alert"
          class="text-sm text-destructive"
        >
          {{ nisError }}
        </p>
        <div
          v-else-if="nisPreview"
          class="space-y-3 text-sm"
        >
          <p>
            <strong>{{ nisPreview.changes }} NIS berubah</strong>,
            {{ nisPreview.created }} NIS baru.
          </p>
          <ul
            v-if="nisPreview.rows.length"
            class="max-h-48 list-disc space-y-1 overflow-y-auto pl-5"
          >
            <li
              v-for="item in nisPreview.rows"
              :key="item.applicationId"
            >
              {{ item.applicantName }}:
              <template v-if="item.previous">
                {{ item.previous }} → {{ item.nis }}
              </template>
              <template v-else>{{ item.nis }} (baru)</template>
            </li>
          </ul>
          <div v-if="nisPreview.skipped.length">
            <p class="font-semibold">Dilewati</p>
            <ul class="list-disc pl-5">
              <li
                v-for="item in nisPreview.skipped"
                :key="item.applicationId"
              >
                {{ item.applicantName }}: {{ item.reason }}
              </li>
            </ul>
          </div>
        </div>
        <DialogFooter class="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            :disabled="acting"
            @click="nisOpen = false"
          >
            Batal
          </Button>
          <Button
            type="button"
            :disabled="acting || nisLoading || !nisPreview"
            @click="submitNis"
          >
            {{ acting ? 'Menyusun…' : 'Susun' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog
      :open="lockOpen"
      @update:open="(isOpen) => (lockOpen = isOpen)"
    >
      <DialogContent
        data-test="lock-dialog"
        class="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle>Kunci NIS</DialogTitle>
          <DialogDescription>
            Setelah dikunci, NIS tahun ajaran ini tidak bisa disusun ulang dan
            pendaftar yang diterima kemudian mendapat nomor berikutnya. Ini
            tidak bisa dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            :disabled="acting"
            @click="lockOpen = false"
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            :disabled="acting"
            @click="submitLock"
          >
            Kunci
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
