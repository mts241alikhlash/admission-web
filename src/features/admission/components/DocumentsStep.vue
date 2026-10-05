<script setup lang="ts">
import { computed, h, ref } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { FileText, UploadCloud, XCircle } from '@lucide/vue'
import { ActionCell, DataTable } from '@mts241alikhlash/ui'
import { Badge } from '@mts241alikhlash/ui/badge'
import { Button } from '@mts241alikhlash/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@mts241alikhlash/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@mts241alikhlash/ui/dialog'
import { DOCUMENT_STATUS_LABELS } from '../types'
import type { AdmissionDocument, AdmissionDocumentType } from '../types'

const props = defineProps<{
  documentTypes: AdmissionDocumentType[]
  documents: AdmissionDocument[]
  documentFiles: Record<string, File | null>
  uploadingDoc: string | null
  editable: boolean
  onFileChange: (typeCode: string, event: Event) => void
  onClearFile: (typeCode: string) => void
  onUpload: (typeCode: string) => Promise<boolean>
}>()

const activeDocType = ref<AdmissionDocumentType | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = computed(() =>
  activeDocType.value ? props.documentFiles[activeDocType.value.code] : null,
)

function documentFor(typeId: string) {
  return props.documents.find((d) => d.documentTypeId === typeId)
}

const columns = computed<ColumnDef<AdmissionDocumentType>[]>(() => [
  {
    accessorKey: 'name',
    header: 'Jenis Dokumen',
    cell: ({ row }) =>
      h('span', { class: 'inline-flex flex-wrap items-center gap-2' }, [
        row.original.name,
        row.original.isRequired
          ? h(Badge, { variant: 'outline' }, () => 'Wajib')
          : null,
      ]),
  },
  {
    id: 'file',
    header: 'Berkas',
    cell: ({ row }) => {
      const document = documentFor(row.original.id)
      return h('div', { class: 'min-w-0 space-y-1' }, [
        h('span', { class: 'break-all' }, document?.file?.originalName ?? '-'),
        ...(document?.note
          ? [
              h(
                'p',
                { class: 'text-sm text-destructive' },
                `Catatan: ${document.note}`,
              ),
            ]
          : []),
      ])
    },
  },
  {
    id: 'status',
    header: 'Status',
    meta: { align: 'center' },
    cell: ({ row }) => {
      const document = documentFor(row.original.id)
      const variant = !document?.file
        ? 'outline'
        : document.status === 'REJECTED'
          ? 'destructive'
          : document.status === 'APPROVED'
            ? 'default'
            : 'secondary'
      return h(Badge, { variant }, () =>
        document?.file
          ? DOCUMENT_STATUS_LABELS[document.status]
          : 'Belum diunggah',
      )
    },
  },
  ...(props.editable
    ? [
        {
          id: 'actions',
          header: 'Opsi',
          enableSorting: false,
          cell: ({ row }: { row: { original: AdmissionDocumentType } }) =>
            h(ActionCell, {
              hideDelete: true,
              editLabel: documentFor(row.original.id)?.file
                ? 'Ganti Berkas'
                : 'Unggah Berkas',
              onEdit: () => {
                activeDocType.value = row.original
              },
            }),
        } satisfies ColumnDef<AdmissionDocumentType>,
      ]
    : []),
])

function selectFile(typeCode: string, event: Event) {
  const input = event.target as HTMLInputElement
  props.onFileChange(typeCode, event)
  input.value = ''
}

function dropFile(event: DragEvent) {
  if (!fileInput.value || !event.dataTransfer || props.uploadingDoc) return
  fileInput.value.files = event.dataTransfer.files
  fileInput.value.dispatchEvent(new Event('change', { bubbles: true }))
}

function closeDialog() {
  if (props.uploadingDoc || !activeDocType.value) return
  props.onClearFile(activeDocType.value.code)
  activeDocType.value = null
}

async function upload() {
  const code = activeDocType.value?.code
  if (code && (await props.onUpload(code))) activeDocType.value = null
}
</script>

<template>
  <div>
    <Card class="gap-0 overflow-hidden py-0">
      <CardHeader class="border-b px-4 py-3">
        <CardTitle class="text-base font-semibold"
          >Dokumen Persyaratan</CardTitle
        >
      </CardHeader>
      <CardContent class="px-4 pt-4 pb-4">
        <p
          v-if="!documentTypes.length"
          class="text-sm text-muted-foreground"
        >
          Belum ada jenis berkas yang tersedia.
        </p>
        <DataTable
          v-else
          :columns="columns"
          :data="documentTypes"
          item-label="dokumen"
          hide-per-page
          hide-pagination
          :page-size="Math.max(1, documentTypes.length)"
        />
      </CardContent>
    </Card>

    <Dialog
      :open="!!activeDocType"
      @update:open="!$event && closeDialog()"
    >
      <DialogContent
        class="flex max-h-[calc(100dvh-2rem)] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <DialogHeader class="shrink-0 border-b bg-muted/20 px-6 py-5">
          <DialogTitle>Unggah {{ activeDocType?.name }}</DialogTitle>
          <DialogDescription class="sr-only"
            >Pilih berkas dokumen pendaftaran.</DialogDescription
          >
        </DialogHeader>
        <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <label
            v-if="!selectedFile"
            class="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/25 p-8 text-center transition-colors hover:bg-muted/50 focus-within:ring-2 focus-within:ring-ring"
            @dragover.prevent
            @drop.prevent="dropFile($event)"
          >
            <span class="rounded-full bg-primary/10 p-3 text-primary">
              <UploadCloud class="size-6" />
            </span>
            <span>
              <span class="block text-sm font-medium"
                >Klik atau tarik file ke sini</span
              >
              <span class="mt-1 block text-xs text-muted-foreground"
                >JPG, PNG, atau PDF, maks. 5 MB</span
              >
            </span>
            <input
              ref="fileInput"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              class="sr-only"
              :disabled="!!uploadingDoc"
              :aria-label="`Pilih berkas ${activeDocType?.name}`"
              @change="activeDocType && selectFile(activeDocType.code, $event)"
            />
          </label>
          <div
            v-else
            class="flex min-w-0 items-center gap-3 rounded-xl border bg-muted/30 p-4"
          >
            <span class="shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
              <FileText class="size-5" />
            </span>
            <span class="min-w-0 flex-1 truncate text-sm font-medium">{{
              selectedFile.name
            }}</span>
            <Button
              variant="ghost"
              size="icon"
              class="shrink-0"
              aria-label="Lepas berkas"
              :disabled="!!uploadingDoc"
              @click="activeDocType && onClearFile(activeDocType.code)"
            >
              <XCircle class="size-4" />
            </Button>
          </div>
        </div>
        <DialogFooter class="shrink-0 gap-2 border-t px-6 py-4 sm:justify-end">
          <Button
            variant="outline"
            :disabled="!!uploadingDoc"
            @click="closeDialog"
            >Batal</Button
          >
          <Button
            :disabled="!!uploadingDoc || !selectedFile"
            @click="upload"
          >
            {{ uploadingDoc ? 'Mengunggah…' : 'Unggah' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
