<script setup lang="ts">
import { computed, h, onMounted, ref, useId } from 'vue'
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
import FloatingField from '../components/AdmissionField.vue'
import { documentTypeSchema } from '../schemas/applicationFormSchemas'
import { documentTypeService } from '../services/documentTypeService'
import type {
  AdmissionDocumentTypeAdmin,
  DocumentTypeSavePayload,
} from '../types'

const deleteTitle = 'Hapus jenis berkas?'
const deleteDescription =
  'Jenis berkas ini belum pernah diunggah dan akan dihapus permanen.'

const types = ref<AdmissionDocumentTypeAdmin[]>([])
const loading = ref(false)
const listError = ref<string | null>(null)
const isSaving = ref(false)
const reordering = ref(false)
const isFormOpen = ref(false)
const editing = ref<AdmissionDocumentTypeAdmin | null>(null)
const pendingDelete = ref<AdmissionDocumentTypeAdmin | null>(null)
const requiredId = useId()
const activeId = useId()

const { handleSubmit, resetForm, values, setFieldValue } =
  useForm<DocumentTypeSavePayload>({
    validationSchema: toTypedSchema(documentTypeSchema),
  })

const lastIndex = computed(() => types.value.length - 1)

const columns = computed<ColumnDef<AdmissionDocumentTypeAdmin>[]>(() => [
  {
    id: 'order',
    header: 'Urutan',
    cell: ({ row }) =>
      h('div', { class: 'flex gap-1' }, [
        h(
          Button,
          {
            variant: 'outline',
            size: 'icon',
            'aria-label': `Naikkan ${row.original.name}`,
            disabled: reordering.value || row.index === 0,
            onClick: () => move(row.index, -1),
          },
          () => h(ChevronUp, { class: 'size-4' }),
        ),
        h(
          Button,
          {
            variant: 'outline',
            size: 'icon',
            'aria-label': `Turunkan ${row.original.name}`,
            disabled: reordering.value || row.index === lastIndex.value,
            onClick: () => move(row.index, 1),
          },
          () => h(ChevronDown, { class: 'size-4' }),
        ),
      ]),
    enableSorting: false,
  },
  {
    id: 'name',
    header: 'Nama',
    cell: ({ row }) =>
      h('div', { class: 'min-w-0' }, [
        h('p', { class: 'font-medium' }, row.original.name),
        h('p', { class: 'text-xs text-muted-foreground' }, row.original.code),
      ]),
  },
  {
    id: 'isRequired',
    header: 'Wajib',
    cell: ({ row }) =>
      h(
        Badge,
        { variant: row.original.isRequired ? 'default' : 'secondary' },
        () => (row.original.isRequired ? 'Wajib' : 'Opsional'),
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
  { accessorKey: 'documentCount', header: 'Dipakai' },
  {
    id: 'actions',
    header: 'Aksi',
    cell: ({ row }) =>
      h(ActionCell, {
        hideDelete: row.original.documentCount > 0,
        deleteTitle,
        deleteDescription,
        onEdit: () => openForm(row.original),
        onDelete: async ({ closeAlert }: { closeAlert: () => void }) => {
          await remove(row.original)
          closeAlert()
        },
      }),
    enableSorting: false,
  },
])

async function load() {
  loading.value = true
  const result = await documentTypeService.fetchAll()
  listError.value = 'error' in result ? result.error : null
  types.value = 'types' in result ? result.types : []
  loading.value = false
}

async function move(index: number, offset: -1 | 1) {
  const target = index + offset
  if (target < 0 || target >= types.value.length) return
  const ids = types.value.map((type) => type.id)
  ;[ids[index], ids[target]] = [ids[target], ids[index]]
  reordering.value = true
  const result = await documentTypeService.reorder(ids)
  reordering.value = false
  if ('types' in result) types.value = result.types
  else await load()
}

async function remove(type: AdmissionDocumentTypeAdmin) {
  const result = await documentTypeService.remove(type.id)
  if (result.success) await load()
}

async function confirmDelete() {
  if (!pendingDelete.value) return
  const type = pendingDelete.value
  pendingDelete.value = null
  await remove(type)
}

function openForm(type: AdmissionDocumentTypeAdmin | null) {
  editing.value = type
  resetForm({
    values: {
      name: type?.name ?? '',
      isRequired: type?.isRequired ?? true,
      isActive: type?.isActive ?? true,
    },
  })
  isFormOpen.value = true
}

const save = handleSubmit(async (payload) => {
  isSaving.value = true
  const result = await documentTypeService.save(
    editing.value?.id ?? null,
    payload,
  )
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
          Jenis Berkas
        </CardTitle>
        <Button
          class="min-h-11 w-full sm:min-h-0 sm:w-auto"
          @click="openForm(null)"
        >
          <Plus class="mr-1.5 size-4" />
          Tambah Jenis Berkas
        </Button>
      </CardHeader>

      <div class="space-y-4 p-4 sm:p-6">
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
            :data="types"
            :total-items="types.length"
            :is-loading="loading"
            item-label="jenis berkas"
            hide-per-page
            hide-pagination
          />
          <p
            v-if="!loading && !types.length"
            class="rounded-md border p-4 text-center text-sm text-muted-foreground md:hidden"
          >
            Tidak ada data.
          </p>
          <ul
            data-test="mobile-document-types"
            class="space-y-2 md:hidden"
          >
            <li
              v-for="(type, index) in types"
              :key="type.id"
              class="min-w-0 space-y-2 rounded-lg border p-4"
            >
              <p class="break-words font-semibold">{{ type.name }}</p>
              <div class="flex flex-wrap items-center gap-2">
                <Badge :variant="type.isRequired ? 'default' : 'secondary'">{{
                  type.isRequired ? 'Wajib' : 'Opsional'
                }}</Badge>
                <Badge :variant="type.isActive ? 'default' : 'secondary'">{{
                  type.isActive ? 'Aktif' : 'Nonaktif'
                }}</Badge>
                <span class="text-sm text-muted-foreground"
                  >Dipakai {{ type.documentCount }}</span
                >
              </div>
              <div class="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  class="min-h-11"
                  :aria-label="`Naikkan ${type.name}`"
                  :disabled="reordering || index === 0"
                  @click="move(index, -1)"
                >
                  <ChevronUp class="size-4" />
                </Button>
                <Button
                  variant="outline"
                  class="min-h-11"
                  :aria-label="`Turunkan ${type.name}`"
                  :disabled="reordering || index === lastIndex"
                  @click="move(index, 1)"
                >
                  <ChevronDown class="size-4" />
                </Button>
                <Button
                  variant="outline"
                  class="min-h-11"
                  :aria-label="`Ubah ${type.name}`"
                  @click="openForm(type)"
                  >Ubah</Button
                >
                <Button
                  v-if="type.documentCount === 0"
                  variant="outline"
                  class="min-h-11"
                  :aria-label="`Hapus ${type.name}`"
                  @click="pendingDelete = type"
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
            {{ editing ? 'Ubah Jenis Berkas' : 'Tambah Jenis Berkas' }}
          </DialogTitle>
          <DialogDescription class="sr-only">
            Berkas yang diunggah pendaftar saat mengisi formulir.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea class="min-h-0 flex-1">
          <form
            id="document-type-form"
            class="space-y-4 px-6 py-4"
            @submit.prevent="save"
          >
            <FloatingField
              v-slot="{ componentField }"
              name="name"
              label="Nama Jenis Berkas"
              required
            >
              <FormControl>
                <Input
                  v-bind="componentField"
                  maxlength="100"
                />
              </FormControl>
            </FloatingField>
            <div
              class="flex items-center justify-between gap-4 rounded-md border px-3 py-2"
            >
              <label
                :for="requiredId"
                class="text-sm font-medium"
              >
                Wajib diunggah
              </label>
              <Switch
                :id="requiredId"
                :model-value="values.isRequired"
                :disabled="isSaving"
                class="focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                @update:model-value="setFieldValue('isRequired', $event)"
              />
            </div>
            <div
              class="flex items-center justify-between gap-4 rounded-md border px-3 py-2"
            >
              <label
                :for="activeId"
                class="text-sm font-medium"
              >
                Aktif (tampil untuk pendaftar)
              </label>
              <Switch
                :id="activeId"
                :model-value="values.isActive"
                :disabled="isSaving"
                class="focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                @update:model-value="setFieldValue('isActive', $event)"
              />
            </div>
            <p
              v-if="editing && editing.documentCount > 0"
              class="text-xs text-muted-foreground"
            >
              Sudah diunggah {{ editing.documentCount }} kali. Nonaktifkan bila
              tidak dipakai lagi; berkas lama tetap tersimpan.
            </p>
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
            form="document-type-form"
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
