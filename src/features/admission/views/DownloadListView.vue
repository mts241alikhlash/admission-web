<script setup lang="ts">
import { computed, h, nextTick, onMounted, ref, useId } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { DataTable, ActionCell } from '@mts241alikhlash/ui'
import { Button } from '@mts241alikhlash/ui/button'
import { Card, CardHeader, CardTitle } from '@mts241alikhlash/ui/card'
import { Badge } from '@mts241alikhlash/ui/badge'
import { Switch } from '@mts241alikhlash/ui/switch'
import { Input } from '@mts241alikhlash/ui/input'
import { ScrollArea } from '@mts241alikhlash/ui/scroll-area'
import { FormControl } from '@mts241alikhlash/ui/form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@mts241alikhlash/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@mts241alikhlash/ui/alert-dialog'
import { ChevronDown, ChevronUp, Plus } from '@lucide/vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { useRoleGuard } from '@/features/platform/auth'
import FloatingField from '../components/AdmissionField.vue'
import { downloadSchema } from '../schemas/applicationFormSchemas'
import { downloadService } from '../services/downloadService'
import type { AdmissionDownloadAdmin, DownloadSavePayload } from '../types'
import { formatFileSize, pdfFileError } from '../utils'

const deleteTitle = 'Hapus berkas?'
const deleteDescription =
  'Berkas ini akan dihapus permanen dan tidak bisa diunduh lagi dari halaman depan.'

const { can } = useRoleGuard()
const canCreate = computed(() => can('admission-downloads.create'))
const canUpdate = computed(() => can('admission-downloads.update'))
const canDelete = computed(() => can('admission-downloads.delete'))

const downloads = ref<AdmissionDownloadAdmin[]>([])
const loading = ref(false)
const listError = ref<string | null>(null)
const isSaving = ref(false)
const isFormOpen = ref(false)
const editing = ref<AdmissionDownloadAdmin | null>(null)
const pendingDelete = ref<AdmissionDownloadAdmin | null>(null)
const pickedFile = ref<File | null>(null)
const fileError = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const fileInputId = useId()
const fileHintId = useId()
const activeId = useId()

const { handleSubmit, resetForm, values, setFieldValue } = useForm<
  Omit<DownloadSavePayload, 'file'>
>({
  validationSchema: toTypedSchema(downloadSchema),
})

function toggleActive() {
  if (isSaving.value) return
  setFieldValue('isActive', !values.isActive)
}

function moveButtons(download: AdmissionDownloadAdmin, index: number) {
  return [
    {
      label: `Naikkan ${download.title}`,
      icon: ChevronUp,
      disabled: index === 0,
      step: -1,
    },
    {
      label: `Turunkan ${download.title}`,
      icon: ChevronDown,
      disabled: index === downloads.value.length - 1,
      step: 1,
    },
  ]
}

const columns = computed<ColumnDef<AdmissionDownloadAdmin>[]>(() => [
  ...(canUpdate.value
    ? [
        {
          id: 'order',
          header: 'Urutan',
          enableSorting: false,
          cell: ({ row }) =>
            h(
              'div',
              { class: 'flex gap-1' },
              moveButtons(row.original, row.index).map((button) =>
                h(
                  Button,
                  {
                    variant: 'outline',
                    size: 'icon',
                    class: 'size-9',
                    disabled: button.disabled,
                    'aria-label': button.label,
                    onClick: () => move(row.index, button.step),
                  },
                  () => h(button.icon, { class: 'size-4' }),
                ),
              ),
            ),
        } satisfies ColumnDef<AdmissionDownloadAdmin>,
      ]
    : []),
  {
    accessorKey: 'title',
    header: 'Judul',
    cell: ({ row }) =>
      h('div', { class: 'space-y-0.5' }, [
        h('p', { class: 'font-medium' }, row.original.title),
        row.original.description
          ? h(
              'p',
              { class: 'text-xs text-muted-foreground' },
              row.original.description,
            )
          : null,
      ]),
  },
  {
    id: 'file',
    header: 'Berkas',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted-foreground' },
        `${row.original.fileName} · ${formatFileSize(row.original.sizeBytes)}`,
      ),
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
  ...(canUpdate.value || canDelete.value
    ? [
        {
          id: 'actions',
          header: 'Aksi',
          cell: ({ row }) =>
            h(ActionCell, {
              hideEdit: !canUpdate.value,
              hideDelete: !canDelete.value,
              deleteTitle,
              deleteDescription,
              onEdit: () => openForm(row.original),
              onDelete: async ({
                closeAlert,
                setLoading,
              }: {
                closeAlert: () => void
                setLoading: (state: boolean) => void
              }) => {
                setLoading(true)
                await remove(row.original)
                setLoading(false)
                closeAlert()
              },
            }),
          enableSorting: false,
        } satisfies ColumnDef<AdmissionDownloadAdmin>,
      ]
    : []),
])

async function load() {
  loading.value = true
  const result = await downloadService.fetchAll()
  listError.value = 'error' in result ? result.error : null
  downloads.value = 'downloads' in result ? result.downloads : []
  loading.value = false
}

async function move(index: number, step: number) {
  const ids = downloads.value.map((download) => download.id)
  const target = index + step
  if (target < 0 || target >= ids.length) return
  ;[ids[index], ids[target]] = [ids[target], ids[index]]
  const result = await downloadService.reorder(ids)
  if (result.success) await load()
}

async function remove(download: AdmissionDownloadAdmin) {
  const result = await downloadService.remove(download.id)
  if (result.success) await load()
}

async function confirmDelete() {
  if (!pendingDelete.value) return
  const download = pendingDelete.value
  pendingDelete.value = null
  await remove(download)
}

function openForm(download: AdmissionDownloadAdmin | null) {
  editing.value = download
  pickedFile.value = null
  fileError.value = null
  resetForm({
    values: {
      title: download?.title ?? '',
      description: download?.description ?? '',
      isActive: download?.isActive ?? true,
    },
  })
  isFormOpen.value = true
  void nextTick(() => {
    if (fileInput.value) fileInput.value.value = ''
  })
}

function onFileChange(event: Event) {
  const picked = (event.target as HTMLInputElement).files?.[0] ?? null
  const problem = picked ? pdfFileError(picked) : null
  fileError.value = problem
  pickedFile.value = problem ? null : picked
}

const save = handleSubmit(async (payload) => {
  if (fileError.value) return
  if (!editing.value && !pickedFile.value) {
    fileError.value = 'Pilih berkas PDF.'
    return
  }
  isSaving.value = true
  const result = await downloadService.save(editing.value?.id ?? null, {
    ...payload,
    file: pickedFile.value,
  })
  isSaving.value = false
  if (!result.success) return
  isFormOpen.value = false
  await load()
})

onMounted(load)
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
          Unduhan
        </CardTitle>
        <Button
          v-if="canCreate"
          class="min-h-11 w-full sm:min-h-0 sm:w-auto"
          @click="openForm(null)"
        >
          <Plus class="mr-1.5 size-4" />
          Tambah Berkas
        </Button>
      </CardHeader>

      <div class="space-y-4 p-4 sm:p-6">
        <p class="text-sm text-muted-foreground">
          Berkas PDF yang bisa diunduh calon pendaftar dari halaman depan,
          misalnya brosur dan formulir kosong. Hanya berkas yang aktif yang
          tampil.
        </p>
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
          <DataTable
            class="hidden md:block"
            :columns="columns"
            :data="downloads"
            :total-items="downloads.length"
            :is-loading="loading"
            item-label="berkas"
            hide-per-page
            hide-pagination
          />
          <p
            v-if="!loading && !downloads.length"
            class="rounded-md border p-4 text-center text-sm text-muted-foreground md:hidden"
          >
            Belum ada berkas.
          </p>
          <ul
            data-test="mobile-downloads"
            class="space-y-2 md:hidden"
          >
            <li
              v-for="(download, index) in downloads"
              :key="download.id"
              class="min-w-0 space-y-2 rounded-lg border p-4"
            >
              <p class="break-words font-semibold">{{ download.title }}</p>
              <p
                v-if="download.description"
                class="break-words text-sm text-muted-foreground"
              >
                {{ download.description }}
              </p>
              <div class="flex flex-wrap items-center gap-2">
                <Badge :variant="download.isActive ? 'default' : 'secondary'">{{
                  download.isActive ? 'Aktif' : 'Nonaktif'
                }}</Badge>
                <span class="break-all text-sm text-muted-foreground"
                  >{{ download.fileName }} ·
                  {{ formatFileSize(download.sizeBytes) }}</span
                >
              </div>
              <div class="flex flex-wrap gap-2">
                <template v-if="canUpdate">
                  <Button
                    v-for="button in moveButtons(download, index)"
                    :key="button.label"
                    variant="outline"
                    size="icon"
                    class="size-11"
                    :disabled="button.disabled"
                    :aria-label="button.label"
                    @click="move(index, button.step)"
                  >
                    <component
                      :is="button.icon"
                      class="size-4"
                    />
                  </Button>
                </template>
                <Button
                  v-if="canUpdate"
                  variant="outline"
                  class="min-h-11"
                  :aria-label="`Ubah ${download.title}`"
                  @click="openForm(download)"
                  >Ubah</Button
                >
                <Button
                  v-if="canDelete"
                  variant="outline"
                  class="min-h-11"
                  :aria-label="`Hapus ${download.title}`"
                  @click="pendingDelete = download"
                  >Hapus</Button
                >
              </div>
            </li>
          </ul>
        </template>
      </div>
    </Card>

    <Dialog v-model:open="isFormOpen">
      <DialogContent
        class="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <DialogHeader class="shrink-0 border-b bg-muted/20 px-6 py-5">
          <DialogTitle>
            {{ editing ? 'Ubah Berkas' : 'Tambah Berkas' }}
          </DialogTitle>
          <DialogDescription class="sr-only">
            Berkas PDF yang bisa diunduh dari halaman depan pendaftaran.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea class="min-h-0 flex-1">
          <form
            id="download-form"
            class="space-y-4 px-6 py-4"
            @submit.prevent="save"
          >
            <FloatingField
              v-slot="{ componentField }"
              name="title"
              label="Judul"
              required
            >
              <FormControl>
                <Input
                  v-bind="componentField"
                  maxlength="100"
                />
              </FormControl>
            </FloatingField>
            <FloatingField
              v-slot="{ componentField }"
              name="description"
              label="Keterangan (opsional)"
            >
              <FormControl>
                <Input
                  v-bind="componentField"
                  maxlength="255"
                />
              </FormControl>
            </FloatingField>
            <div class="space-y-1.5">
              <label
                :for="fileInputId"
                class="text-sm font-medium"
                >Berkas PDF<span
                  v-if="!editing"
                  class="text-destructive"
                >
                  *</span
                ></label
              >
              <input
                :id="fileInputId"
                ref="fileInput"
                type="file"
                accept="application/pdf,.pdf"
                :aria-describedby="fileHintId"
                class="block min-h-11 w-full cursor-pointer rounded-md border bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm file:font-medium"
                @change="onFileChange"
              />
              <p
                :id="fileHintId"
                class="text-xs text-muted-foreground"
              >
                PDF, maksimal 5 MB.
                <template v-if="editing">
                  Kosongkan bila berkas tidak diganti. Saat ini:
                  {{ editing.fileName }} ({{
                    formatFileSize(editing.sizeBytes)
                  }}).
                </template>
              </p>
              <p
                v-if="fileError"
                role="alert"
                class="text-xs text-destructive"
              >
                {{ fileError }}
              </p>
            </div>
            <div
              data-test="switch-row-isActive"
              class="flex cursor-pointer items-center justify-between gap-4 rounded-md border px-3 py-2"
              @click="toggleActive"
            >
              <span
                :id="activeId"
                class="flex-1 text-sm font-medium"
                >Aktif (tampil di halaman depan)</span
              >
              <Switch
                :aria-labelledby="activeId"
                :model-value="values.isActive"
                :disabled="isSaving"
                class="focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                @click.stop
                @update:model-value="setFieldValue('isActive', $event)"
              />
            </div>
          </form>
        </ScrollArea>
        <DialogFooter
          class="w-full shrink-0 border-t bg-background px-6 py-4 sm:justify-between"
        >
          <Button
            type="button"
            variant="outline"
            :disabled="isSaving"
            @click="isFormOpen = false"
          >
            Batal
          </Button>
          <Button
            type="submit"
            form="download-form"
            :disabled="isSaving"
          >
            {{ isSaving ? 'Menyimpan…' : 'Simpan' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog
      :open="pendingDelete !== null"
      @update:open="
        (open) => {
          if (!open) pendingDelete = null
        }
      "
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ deleteTitle }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ deleteDescription }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction @click="confirmDelete">Hapus</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
