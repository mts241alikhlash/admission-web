<script setup lang="ts">
import { computed, h, onMounted, ref, useId, watch } from 'vue'
import { DataTable, ActionCell, SearchInput } from '@mts241alikhlash/ui'
import { Button } from '@mts241alikhlash/ui/button'
import { Card, CardHeader, CardTitle } from '@mts241alikhlash/ui/card'
import { Badge } from '@mts241alikhlash/ui/badge'
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
import { Filter, Plus } from '@lucide/vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@mts241alikhlash/ui/dialog'
import type { ColumnDef } from '@tanstack/vue-table'
import ServerPager from '../components/ServerPager.vue'
import { useAnnouncementList } from '../composables/useAnnouncementList'
import AnnouncementFormDialog from '../components/AnnouncementFormDialog.vue'
import type { AdmissionAnnouncement, AnnouncementSavePayload } from '../types'
import { formatDateTime } from '../utils'

const search = ref('')
const statusFilter = ref('ALL')
const waveFilter = ref('ALL')
const statusFilterId = useId()
const waveFilterId = useId()
const mobileStatusFilterId = useId()
const mobileWaveFilterId = useId()
const filterOpen = ref(false)
const page = ref(1)
const pageSize = ref(10)

const {
  announcements,
  waves,
  totalItems,
  listError,
  loading,
  filtersPending,
  refresh,
  isSaving,
  fetchWaves,
  saveAnnouncement,
  publishAnnouncement,
  deleteAnnouncement,
} = useAnnouncementList(search, statusFilter, waveFilter, page, pageSize)
watch(
  [search, statusFilter, waveFilter],
  () => {
    page.value = 1
  },
  { flush: 'sync' },
)
watch([totalItems, loading, filtersPending], () => {
  if (loading.value || filtersPending.value) return
  const lastPage = Math.max(1, Math.ceil(totalItems.value / pageSize.value))
  if (page.value > lastPage) page.value = lastPage
})
function goToPage(next: number) {
  page.value = next
}
function changePageSize(size: number) {
  pageSize.value = size
  page.value = 1
}
function resetFilters() {
  statusFilter.value = 'ALL'
  waveFilter.value = 'ALL'
}

const isFormOpen = ref(false)
const selected = ref<AdmissionAnnouncement | null>(null)
const pendingAction = ref<{ kind: 'publish' | 'delete'; id: string } | null>(
  null,
)

const columns = computed<ColumnDef<AdmissionAnnouncement>[]>(() => [
  {
    id: 'no',
    header: 'No',
    cell: ({ row }) => (page.value - 1) * pageSize.value + row.index + 1,
    enableSorting: false,
  },
  { accessorKey: 'title', header: 'Judul' },
  {
    id: 'wave',
    header: 'Gelombang',
    cell: ({ row }) => row.original.wave?.name ?? 'Semua',
  },
  {
    id: 'isPublished',
    header: 'Status',
    cell: ({ row }) =>
      h(
        Badge,
        { variant: row.original.isPublished ? 'default' : 'secondary' },
        () => (row.original.isPublished ? 'Terbit' : 'Draft'),
      ),
  },
  {
    id: 'publishedAt',
    header: 'Terbit',
    cell: ({ row }) => formatDateTime(row.original.publishedAt),
  },
  {
    id: 'publish',
    header: 'Publikasi',
    cell: ({ row }) =>
      row.original.isPublished
        ? '-'
        : h(
            Button,
            {
              size: 'sm',
              variant: 'outline',
              onClick: () => {
                pendingAction.value = { kind: 'publish', id: row.original.id }
              },
            },
            () => 'Terbitkan',
          ),
    enableSorting: false,
  },
  {
    id: 'actions',
    header: 'Aksi',
    cell: ({ row }) =>
      h(ActionCell, {
        onEdit: () => openEditForm(row.original),
        onDelete: () => {
          pendingAction.value = { kind: 'delete', id: row.original.id }
        },
      }),
    enableSorting: false,
  },
])

onMounted(fetchWaves)

function openCreateForm() {
  selected.value = null
  isFormOpen.value = true
}

function openEditForm(announcement: AdmissionAnnouncement) {
  selected.value = announcement
  isFormOpen.value = true
}

async function handleSave(payload: AnnouncementSavePayload) {
  const result = await saveAnnouncement(selected.value?.id ?? null, payload)
  if (result.success) {
    isFormOpen.value = false
    await refresh()
  }
}

async function confirmPendingAction() {
  const action = pendingAction.value
  if (!action) return
  pendingAction.value = null
  const result =
    action.kind === 'publish'
      ? await publishAnnouncement(action.id)
      : await deleteAnnouncement(action.id)
  if (result.success) await refresh()
}
</script>

<template>
  <div class="p-4 sm:p-6">
    <Card
      gap="none"
      class="overflow-hidden rounded-2xl shadow-sm shadow-black/5 ring-1 ring-black/4"
    >
      <CardHeader standard>
        <CardTitle size="lg"> Pengumuman PSB </CardTitle>
        <Button
          class="min-h-11 w-full sm:min-h-0 sm:w-auto"
          @click="openCreateForm"
        >
          <Plus class="mr-1.5 size-4" />
          Buat Pengumuman
        </Button>
      </CardHeader>

      <div class="space-y-4 px-4 py-5 sm:px-6">
        <div
          class="hidden flex-col gap-3 md:flex md:flex-row md:items-end md:justify-between"
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
                  <SelectItem value="true">Terbit</SelectItem>
                  <SelectItem value="false">Draft</SelectItem>
                </SelectContent>
              </Select>
            </FloatingLabelField>
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
          </div>
          <SearchInput
            v-model="search"
            label="Cari pengumuman"
          />
        </div>
        <div class="flex items-center gap-2 md:hidden">
          <SearchInput
            v-model="search"
            label="Cari pengumuman"
            class="min-w-0 flex-1 [&_input]:h-11"
          />
          <Button
            variant="outline"
            class="min-h-11 shrink-0"
            @click="filterOpen = true"
            ><Filter class="mr-1.5 size-4" />Filter</Button
          >
        </div>
        <div
          v-if="statusFilter !== 'ALL' || waveFilter !== 'ALL'"
          class="flex flex-wrap gap-2 md:hidden"
        >
          <Button
            v-if="statusFilter !== 'ALL'"
            variant="outline"
            class="min-h-11"
            @click="statusFilter = 'ALL'"
            >Hapus filter status</Button
          >
          <Button
            v-if="waveFilter !== 'ALL'"
            variant="outline"
            class="min-h-11"
            @click="waveFilter = 'ALL'"
            >Hapus filter gelombang</Button
          >
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
            :data="announcements"
            :page="page"
            :page-size="pageSize"
            :total-items="totalItems"
            :is-loading="loading"
            item-label="pengumuman"
            @update:page="goToPage"
            @update:page-size="changePageSize"
          />
          <p
            v-if="!loading && !filtersPending && !announcements.length"
            class="rounded-md border p-4 text-center text-sm text-muted-foreground md:hidden"
          >
            Tidak ada data.
          </p>
          <p
            v-if="loading || filtersPending"
            class="text-center text-sm text-muted-foreground md:hidden"
          >
            Memuat pengumuman…
          </p>
          <ul
            v-if="!loading && !filtersPending"
            data-test="mobile-announcements"
            class="space-y-2 md:hidden"
          >
            <li
              v-for="item in announcements"
              :key="item.id"
              class="min-w-0 space-y-2 rounded-lg border p-4"
            >
              <p class="break-words font-semibold">{{ item.title }}</p>
              <p class="break-words text-sm">
                {{ item.wave?.name ?? 'Semua Gelombang' }}
              </p>
              <Badge :variant="item.isPublished ? 'default' : 'secondary'">{{
                item.isPublished ? 'Terbit' : 'Draft'
              }}</Badge>
              <p
                v-if="item.publishedAt"
                class="text-sm"
              >
                Terbit {{ formatDateTime(item.publishedAt) }}
              </p>
              <div class="flex flex-wrap gap-2">
                <Button
                  v-if="!item.isPublished"
                  variant="outline"
                  class="min-h-11"
                  aria-label="Terbitkan pengumuman"
                  @click="pendingAction = { kind: 'publish', id: item.id }"
                  >Terbitkan</Button
                >
                <Button
                  variant="outline"
                  class="min-h-11"
                  aria-label="Ubah pengumuman"
                  @click="openEditForm(item)"
                  >Ubah</Button
                >
                <Button
                  variant="outline"
                  class="min-h-11"
                  aria-label="Hapus pengumuman"
                  @click="pendingAction = { kind: 'delete', id: item.id }"
                  >Hapus</Button
                >
              </div>
            </li>
          </ul>
          <ServerPager
            v-if="!loading && !filtersPending && totalItems > 0"
            class="md:hidden"
            :page="page"
            :page-size="pageSize"
            :total="totalItems"
            item-label="pengumuman"
            @update:page="goToPage"
          />
        </template>
      </div>
    </Card>

    <Dialog v-model:open="filterOpen">
      <DialogContent
        class="flex max-h-[calc(100dvh-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <DialogHeader class="shrink-0 border-b px-4 py-4 sm:px-6"
          ><DialogTitle>Filter Pengumuman</DialogTitle
          ><DialogDescription class="sr-only"
            >Pilih status dan gelombang.</DialogDescription
          ></DialogHeader
        >
        <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
          <FloatingLabelField
            label="Status"
            :for="mobileStatusFilterId"
            floating
          >
            <Select v-model="statusFilter"
              ><SelectTrigger
                :id="mobileStatusFilterId"
                class="min-h-11 w-full"
                ><SelectValue /></SelectTrigger
              ><SelectContent
                ><SelectItem value="ALL">Semua</SelectItem
                ><SelectItem value="true">Terbit</SelectItem
                ><SelectItem value="false">Draft</SelectItem></SelectContent
              ></Select
            >
          </FloatingLabelField>
          <FloatingLabelField
            label="Gelombang"
            :for="mobileWaveFilterId"
            floating
          >
            <Select v-model="waveFilter"
              ><SelectTrigger
                :id="mobileWaveFilterId"
                class="min-h-11 w-full"
                ><SelectValue /></SelectTrigger
              ><SelectContent
                ><SelectItem value="ALL">Semua</SelectItem
                ><SelectItem
                  v-for="wave in waves"
                  :key="wave.id"
                  :value="wave.id"
                  >{{ wave.name }}</SelectItem
                ></SelectContent
              ></Select
            >
          </FloatingLabelField>
        </div>
        <DialogFooter class="flex-row gap-2 border-t px-4 py-4 sm:px-6">
          <Button
            variant="outline"
            class="min-h-11 flex-1"
            @click="resetFilters"
            >Atur Ulang</Button
          >
          <Button
            class="min-h-11 flex-1"
            @click="filterOpen = false"
            >Tutup</Button
          >
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AnnouncementFormDialog
      v-model:open="isFormOpen"
      :announcement="selected"
      :is-saving="isSaving"
      :waves="waves"
      @save="handleSave"
    />
    <AlertDialog
      :open="pendingAction !== null"
      @update:open="
        (open) => {
          if (!open) pendingAction = null
        }
      "
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{
            pendingAction?.kind === 'publish'
              ? 'Terbitkan pengumuman?'
              : 'Hapus pengumuman?'
          }}</AlertDialogTitle>
          <AlertDialogDescription>{{
            pendingAction?.kind === 'publish'
              ? 'Pendaftar dalam cakupan pengumuman akan menerima notifikasi.'
              : 'Pengumuman ini akan dihapus.'
          }}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="pendingAction = null"
            >Batal</AlertDialogCancel
          >
          <AlertDialogAction
            data-test="confirm-announcement-action"
            @click="confirmPendingAction"
            >{{
              pendingAction?.kind === 'publish' ? 'Terbitkan' : 'Hapus'
            }}</AlertDialogAction
          >
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
