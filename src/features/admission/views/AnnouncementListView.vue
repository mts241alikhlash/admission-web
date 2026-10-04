<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue'
import { DataTable, ActionCell } from '@mts241alikhlash/ui'
import { Button } from '@mts241alikhlash/ui/button'
import { Card, CardHeader, CardTitle } from '@mts241alikhlash/ui/card'
import { Badge } from '@mts241alikhlash/ui/badge'
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
import { Plus } from 'lucide-vue-next'
import type { ColumnDef } from '@tanstack/vue-table'
import { useAnnouncementList } from '../composables/useAnnouncementList'
import AnnouncementFormDialog from '../components/AnnouncementFormDialog.vue'
import type { AdmissionAnnouncement, AnnouncementSavePayload } from '../types'
import { formatDateTime } from '../utils'

const {
  announcements,
  waves,
  totalItems,
  listError,
  loading,
  isSaving,
  fetchData,
  saveAnnouncement,
  publishAnnouncement,
  deleteAnnouncement,
} = useAnnouncementList()

const isFormOpen = ref(false)
const selected = ref<AdmissionAnnouncement | null>(null)
const pendingAction = ref<{ kind: 'publish' | 'delete'; id: string } | null>(
  null,
)
const search = ref('')
const mobilePage = ref(1)
const filteredAnnouncements = computed(() =>
  announcements.value.filter((item) =>
    item.title
      .toLocaleLowerCase('id')
      .includes(search.value.trim().toLocaleLowerCase('id')),
  ),
)
const mobilePages = computed(() =>
  Math.max(1, Math.ceil(filteredAnnouncements.value.length / 10)),
)
const mobileAnnouncements = computed(() =>
  filteredAnnouncements.value.slice(
    (mobilePage.value - 1) * 10,
    mobilePage.value * 10,
  ),
)
watch(search, () => {
  mobilePage.value = 1
})

const columns = computed<ColumnDef<AdmissionAnnouncement>[]>(() => [
  {
    id: 'no',
    header: 'No',
    cell: ({ row }) => row.index + 1,
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

onMounted(fetchData)

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
    await fetchData()
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
  if (result.success) await fetchData()
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
          Pengumuman PSB
        </CardTitle>
        <Button @click="openCreateForm">
          <Plus class="mr-2 h-4 w-4" />
          Buat Pengumuman
        </Button>
      </CardHeader>

      <div class="space-y-4 p-4 sm:p-6">
        <label
          for="announcement-search"
          class="block text-sm font-medium"
          >Cari pengumuman</label
        >
        <Input
          id="announcement-search"
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
            @click="fetchData()"
            >Coba lagi</Button
          >
        </div>
        <p
          v-else-if="loading"
          role="status"
          class="text-sm text-muted-foreground"
        >
          Memuat pengumuman…
        </p>
        <p
          v-else-if="!filteredAnnouncements.length"
          class="text-sm text-muted-foreground"
        >
          Belum ada pengumuman{{
            search
              ? ' yang cocok dengan pencarian.'
              : '. Gunakan Buat Pengumuman untuk membuatnya.'
          }}
        </p>
        <template v-else>
          <DataTable
            class="hidden md:block"
            :columns="columns"
            :data="filteredAnnouncements"
            :is-loading="loading"
            item-label="pengumuman"
          />
          <ul
            data-test="mobile-announcements"
            class="space-y-2 md:hidden"
          >
            <li
              v-for="item in mobileAnnouncements"
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
          <nav
            v-if="mobilePages > 1"
            aria-label="Halaman pengumuman"
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
            v-if="totalItems > announcements.length"
            class="text-sm text-muted-foreground"
          >
            Menampilkan {{ announcements.length }} dari
            {{ totalItems }} pengumuman. Pencarian hanya berlaku pada data yang
            ditampilkan.
          </p>
        </template>
      </div>
    </Card>

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
