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
import { Plus } from '@lucide/vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { useRoleGuard } from '@/features/platform/auth'
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

const { can } = useRoleGuard()
const canCreate = computed(() => can('admission-document-types.create'))
const canUpdate = computed(() => can('admission-document-types.update'))
const canDelete = computed(() => can('admission-document-types.delete'))

const types = ref<AdmissionDocumentTypeAdmin[]>([])
const loading = ref(false)
const listError = ref<string | null>(null)
const isSaving = ref(false)
const isFormOpen = ref(false)
const editing = ref<AdmissionDocumentTypeAdmin | null>(null)
const pendingDelete = ref<AdmissionDocumentTypeAdmin | null>(null)
const switchRows = [
  { field: 'isRequired', id: useId(), label: 'Wajib diunggah' },
  { field: 'isActive', id: useId(), label: 'Aktif' },
] as const

function toggle(field: 'isRequired' | 'isActive') {
  if (isSaving.value) return
  setFieldValue(field, !values[field])
}

const { handleSubmit, resetForm, values, setFieldValue } =
  useForm<DocumentTypeSavePayload>({
    validationSchema: toTypedSchema(documentTypeSchema),
  })

const columns = computed<ColumnDef<AdmissionDocumentTypeAdmin>[]>(() => [
  { accessorKey: 'name', header: 'Nama' },
  {
    accessorKey: 'code',
    header: 'Kode',
    cell: ({ row }) =>
      h('span', { class: 'text-muted-foreground' }, row.original.code),
  },
  {
    id: 'isRequired',
    header: 'Kewajiban',
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
  ...(canUpdate.value || canDelete.value
    ? [
        {
          id: 'actions',
          header: 'Aksi',
          cell: ({ row }) =>
            h(ActionCell, {
              hideEdit: !canUpdate.value,
              hideDelete: !canDelete.value || row.original.documentCount > 0,
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
        } satisfies ColumnDef<AdmissionDocumentTypeAdmin>,
      ]
    : []),
])

async function load() {
  loading.value = true
  const result = await documentTypeService.fetchAll()
  listError.value = 'error' in result ? result.error : null
  types.value = 'types' in result ? result.types : []
  loading.value = false
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
          v-if="canCreate"
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
              v-for="type in types"
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
                  v-if="canUpdate"
                  variant="outline"
                  class="min-h-11"
                  :aria-label="`Ubah ${type.name}`"
                  @click="openForm(type)"
                  >Ubah</Button
                >
                <Button
                  v-if="canDelete && type.documentCount === 0"
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
              v-for="row in switchRows"
              :key="row.field"
              :data-test="`switch-row-${row.field}`"
              class="flex cursor-pointer items-center justify-between gap-4 rounded-md border px-3 py-2"
              @click="toggle(row.field)"
            >
              <span
                :id="row.id"
                data-test="switch-label"
                class="flex-1 text-sm font-medium"
                >{{ row.label }}</span
              >
              <Switch
                :aria-labelledby="row.id"
                :model-value="values[row.field]"
                :disabled="isSaving"
                class="focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                @click.stop
                @update:model-value="setFieldValue(row.field, $event)"
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
