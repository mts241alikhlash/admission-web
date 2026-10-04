<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue'
import { DataTable, ActionCell } from '@mts241alikhlash/ui'
import { Button } from '@mts241alikhlash/ui/button'
import { Card, CardHeader, CardTitle } from '@mts241alikhlash/ui/card'
import { Badge } from '@mts241alikhlash/ui/badge'
import { Plus } from 'lucide-vue-next'
import { Input } from '@mts241alikhlash/ui/input'
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

const {
  waves,
  totalItems,
  listError,
  academicYears,
  loading,
  isSaving,
  fetchWaves,
  fetchAcademicYears,
  saveWave,
  deleteWave,
} = useWaveList()

const isFormOpen = ref(false)
const selectedWave = ref<AdmissionWaveSummary | null>(null)
const pendingDeleteId = ref<string | null>(null)
const search = ref('')
const mobilePage = ref(1)
const filteredWaves = computed(() =>
  waves.value.filter((wave) =>
    wave.name
      .toLocaleLowerCase('id')
      .includes(search.value.trim().toLocaleLowerCase('id')),
  ),
)
const mobilePages = computed(() =>
  Math.max(1, Math.ceil(filteredWaves.value.length / 10)),
)
const mobileWaves = computed(() =>
  filteredWaves.value.slice((mobilePage.value - 1) * 10, mobilePage.value * 10),
)
watch(search, () => {
  mobilePage.value = 1
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
  void fetchWaves()
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
    await fetchWaves()
  }
}

async function confirmDelete() {
  const id = pendingDeleteId.value
  if (!id) return
  const result = await deleteWave(id)
  pendingDeleteId.value = null
  if (result.success) {
    await fetchWaves()
  }
}
</script>

<template>
  <div class="p-4 sm:p-6">
    <Card
      class="overflow-hidden rounded-2xl shadow-sm shadow-black/5 ring-1 ring-black/4"
    >
      <CardHeader
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b px-6 py-5 gap-4"
      >
        <CardTitle class="text-xl font-bold tracking-tight">
          Gelombang Pendaftaran
        </CardTitle>
        <Button @click="openCreateForm">
          <Plus class="mr-2 h-4 w-4" />
          Tambah Gelombang
        </Button>
      </CardHeader>

      <div class="space-y-4 p-6">
        <label
          for="wave-search"
          class="block text-sm font-medium"
          >Cari gelombang</label
        >
        <Input
          id="wave-search"
          v-model="search"
          class="max-w-sm"
        />
        <div
          v-if="listError"
          role="alert"
        >
          <p>{{ listError }}</p>
          <Button
            variant="outline"
            @click="fetchWaves()"
            >Coba lagi</Button
          >
        </div>
        <p
          v-else-if="!loading && !filteredWaves.length"
          class="text-sm text-muted-foreground"
        >
          Belum ada gelombang{{
            search
              ? ' yang cocok dengan pencarian.'
              : '. Gunakan Tambah Gelombang untuk membuatnya.'
          }}
        </p>
        <template v-else>
          <DataTable
            class="hidden md:block"
            :columns="columns"
            :data="filteredWaves"
            :is-loading="loading"
            item-label="gelombang"
          />
          <ul
            data-test="mobile-waves"
            class="space-y-2 md:hidden"
          >
            <li
              v-for="wave in mobileWaves"
              :key="wave.id"
              class="min-w-0 space-y-2 rounded-lg border p-4"
            >
              <p class="break-words font-semibold">{{ wave.name }}</p>
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
          <nav
            v-if="mobilePages > 1"
            aria-label="Halaman gelombang"
            class="flex flex-wrap items-center gap-2 md:hidden"
          >
            <Button
              variant="outline"
              :disabled="mobilePage === 1"
              @click="mobilePage--"
              >Sebelumnya</Button
            >
            <span>Halaman {{ mobilePage }} dari {{ mobilePages }}</span>
            <Button
              variant="outline"
              :disabled="mobilePage === mobilePages"
              @click="mobilePage++"
              >Berikutnya</Button
            >
          </nav>
          <p
            v-if="totalItems > waves.length"
            class="text-sm text-muted-foreground"
          >
            Menampilkan {{ waves.length }} dari {{ totalItems }} gelombang.
            Pencarian hanya berlaku pada data yang ditampilkan.
          </p>
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
