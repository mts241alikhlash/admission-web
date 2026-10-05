<script setup lang="ts">
import { computed, h, onMounted, ref, useId, useTemplateRef } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import { DataTable, ActionCell, SearchInput } from '@mts241alikhlash/ui'
import { Button } from '@mts241alikhlash/ui/button'
import { Card, CardHeader, CardTitle } from '@mts241alikhlash/ui/card'
import { Badge } from '@mts241alikhlash/ui/badge'
import { Plus } from '@lucide/vue'
import { FloatingLabelField } from '@mts241alikhlash/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mts241alikhlash/ui/select'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@mts241alikhlash/ui/alert-dialog'
import type { ColumnDef } from '@tanstack/vue-table'
import { useWaveList } from '../composables/useWaveList'
import WaveFormDialog from '../components/WaveFormDialog.vue'
import type { AdmissionWaveSummary, WaveSavePayload } from '../types'
import { formatDate, formatIDR } from '../utils'

const search = ref('')
const yearFilter = ref('ALL')
const statusFilter = ref('ALL')
const statusFilterId = useId()
const yearFilterId = useId()

const {
  waves,
  totalItems,
  listError,
  academicYears,
  loading,
  hasNextPage,
  isFetchingNextPage,
  loadMore,
  refresh,
  isSaving,
  fetchAcademicYears,
  saveWave,
  deleteWave,
} = useWaveList(search, yearFilter, statusFilter)

const isFormOpen = ref(false)
const selectedWave = ref<AdmissionWaveSummary | null>(null)
const pendingDeleteId = ref<string | null>(null)
const yearOptions = computed(() =>
  [...academicYears.value].sort((a, b) => b.name.localeCompare(a.name)),
)
const loadMoreButton = useTemplateRef('loadMoreButton')
useIntersectionObserver(loadMoreButton, ([entry]) => {
  if (entry?.isIntersecting) loadMore()
})

const columns = computed<ColumnDef<AdmissionWaveSummary>[]>(() => [
  {
    id: 'no',
    header: 'No',
    cell: ({ row }) => row.index + 1,
    enableSorting: false,
  },
  {
    accessorKey: 'code',
    header: 'Kode',
    meta: { align: 'center' },
  },
  {
    accessorKey: 'name',
    header: 'Nama',
    meta: { align: 'left' },
  },
  {
    id: 'academicYear',
    header: 'Tahun Ajaran',
    meta: { align: 'center' },
    cell: ({ row }) => row.original.academicYear?.name ?? '-',
  },
  {
    id: 'period',
    header: 'Periode',
    meta: { align: 'center' },
    cell: ({ row }) =>
      `${formatDate(row.original.startDate)} – ${formatDate(row.original.endDate)}`,
  },
  {
    id: 'quota',
    header: 'Kuota',
    meta: { align: 'center' },
    cell: ({ row }) =>
      `${row.original._count?.applications ?? 0} / ${row.original.quota}`,
  },
  {
    id: 'fee',
    header: 'Biaya',
    meta: { align: 'center' },
    cell: ({ row }) => formatIDR(Number(row.original.registrationFee)),
  },
  {
    id: 'isActive',
    header: 'Status',
    meta: { align: 'center' },
    cell: ({ row }) =>
      h(
        Badge,
        { variant: row.original.isActive ? 'default' : 'secondary' },
        () => (row.original.isActive ? 'Aktif' : 'Nonaktif'),
      ),
  },
  {
    id: 'actions',
    header: 'Aksi',
    cell: ({ row }) =>
      h(ActionCell, {
        onEdit: () => openEditForm(row.original),
        onDelete: () => {
          pendingDeleteId.value = row.original.id
        },
      }),
    enableSorting: false,
  },
])

onMounted(() => {
  void fetchAcademicYears()
})

function openCreateForm() {
  selectedWave.value = null
  isFormOpen.value = true
}

function openEditForm(wave: AdmissionWaveSummary) {
  selectedWave.value = wave
  isFormOpen.value = true
}

async function handleSave(payload: WaveSavePayload) {
  const result = await saveWave(selectedWave.value?.id ?? null, payload)
  if (result.success) {
    isFormOpen.value = false
    await refresh()
  }
}

async function confirmDelete() {
  const id = pendingDeleteId.value
  if (!id) return
  const result = await deleteWave(id)
  pendingDeleteId.value = null
  if (result.success) {
    await refresh()
  }
}
</script>

<template>
  <div class="p-4 sm:p-6">
    <Card
      class="overflow-hidden rounded-2xl shadow-sm shadow-black/5 ring-1 ring-black/4"
    >
      <CardHeader
        class="flex flex-col items-start justify-between gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:px-6 sm:py-5"
      >
        <CardTitle class="text-xl font-bold tracking-tight">
          Gelombang Pendaftaran
        </CardTitle>
        <Button
          class="min-h-11 w-full sm:min-h-0 sm:w-auto"
          @click="openCreateForm"
        >
          <Plus class="mr-1.5 size-4" />
          Tambah Gelombang
        </Button>
      </CardHeader>

      <div class="space-y-4 p-4 sm:p-6">
        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
            <FloatingLabelField
              label="Status"
              :for="statusFilterId"
              class="w-full sm:w-48"
              floating
            >
              <Select v-model="statusFilter">
                <SelectTrigger
                  :id="statusFilterId"
                  size="sm"
                  class="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua</SelectItem>
                  <SelectItem value="true">Aktif</SelectItem>
                  <SelectItem value="false">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </FloatingLabelField>
            <FloatingLabelField
              label="Tahun Ajaran"
              :for="yearFilterId"
              class="w-full sm:w-48"
              floating
            >
              <Select v-model="yearFilter">
                <SelectTrigger
                  :id="yearFilterId"
                  size="sm"
                  class="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua</SelectItem>
                  <SelectItem
                    v-for="year in yearOptions"
                    :key="year.id"
                    :value="year.id"
                  >
                    {{ year.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </FloatingLabelField>
          </div>
          <SearchInput
            v-model="search"
            label="Cari gelombang"
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
            @click="refresh()"
          >
            Coba lagi
          </Button>
        </div>
        <template v-else>
          <DataTable
            class="hidden md:block"
            :columns="columns"
            :data="waves"
            :total-items="waves.length"
            :is-loading="loading"
            item-label="gelombang"
            hide-per-page
            hide-pagination
          />
          <p
            v-if="!loading && !waves.length"
            class="rounded-md border p-4 text-center text-sm text-muted-foreground md:hidden"
          >
            Tidak ada data.
          </p>
          <ul
            data-test="mobile-waves"
            class="space-y-2 md:hidden"
          >
            <li
              v-for="wave in waves"
              :key="wave.id"
              class="min-w-0 space-y-2 rounded-lg border p-4"
            >
              <p class="break-words font-semibold">{{ wave.name }}</p>
              <p class="text-sm text-muted-foreground">
                Tahun Ajaran {{ wave.academicYear?.name ?? '-' }}
              </p>
              <p class="text-sm">
                {{ formatDate(wave.startDate) }} –
                {{ formatDate(wave.endDate) }}
              </p>
              <p class="text-sm">
                Kuota {{ wave._count?.applications ?? 0 }} / {{ wave.quota }}
              </p>
              <p class="text-sm">
                Biaya {{ formatIDR(Number(wave.registrationFee)) }}
              </p>
              <Badge :variant="wave.isActive ? 'default' : 'secondary'">{{
                wave.isActive ? 'Aktif' : 'Nonaktif'
              }}</Badge>
              <div class="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  class="min-h-11"
                  aria-label="Ubah gelombang"
                  @click="openEditForm(wave)"
                  >Ubah</Button
                >
                <Button
                  variant="outline"
                  class="min-h-11"
                  aria-label="Hapus gelombang"
                  @click="pendingDeleteId = wave.id"
                  >Hapus</Button
                >
              </div>
            </li>
          </ul>
          <div
            v-if="hasNextPage"
            class="flex flex-col items-center gap-2"
          >
            <p class="text-sm text-muted-foreground">
              Menampilkan {{ waves.length }} dari {{ totalItems }} gelombang
            </p>
            <Button
              ref="loadMoreButton"
              variant="outline"
              :disabled="isFetchingNextPage"
              @click="loadMore"
            >
              {{ isFetchingNextPage ? 'Memuat…' : 'Muat lebih banyak' }}
            </Button>
          </div>
        </template>
      </div>
    </Card>

    <WaveFormDialog
      v-model:open="isFormOpen"
      :wave="selectedWave"
      :is-saving="isSaving"
      :academic-years="academicYears"
      @save="handleSave"
    />
    <AlertDialog
      :open="pendingDeleteId !== null"
      @update:open="
        (open) => {
          if (!open) pendingDeleteId = null
        }
      "
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus gelombang?</AlertDialogTitle>
          <AlertDialogDescription
            >Gelombang yang dihapus tidak lagi tersedia di
            daftar.</AlertDialogDescription
          >
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="pendingDeleteId = null"
            >Batal</AlertDialogCancel
          >
          <AlertDialogAction
            data-test="confirm-wave-delete"
            @click="confirmDelete"
            >Hapus</AlertDialogAction
          >
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
