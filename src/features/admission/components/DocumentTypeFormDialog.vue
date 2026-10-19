<script setup lang="ts">
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { Button } from '@mts241alikhlash/ui/button'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mts241alikhlash/ui/select'
import FloatingField from './AdmissionField.vue'
import { documentTypeSchema } from '../schemas/applicationFormSchemas'
import type {
  AdmissionDocumentTypeAdmin,
  DocumentTypeSavePayload,
} from '../types'

const props = defineProps<{
  open: boolean
  documentType: AdmissionDocumentTypeAdmin | null
  isSaving: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'save', payload: DocumentTypeSavePayload): void
}>()

const isEdit = computed(() => !!props.documentType)

const { handleSubmit, resetForm } = useForm<DocumentTypeSavePayload>({
  validationSchema: toTypedSchema(documentTypeSchema),
})

function closeDialog() {
  resetForm()
  emit('update:open', false)
}

watch(
  () => [props.open, props.documentType],
  () => {
    if (!props.open) return
    if (props.documentType) {
      resetForm({
        values: {
          name: props.documentType.name,
          isRequired: props.documentType.isRequired,
          isActive: props.documentType.isActive,
        },
      })
    } else {
      resetForm({
        values: {
          name: '',
          isRequired: true,
          isActive: true,
        },
      })
    }
  },
  { immediate: true },
)

const onSubmit = handleSubmit((formValues) => {
  emit('save', {
    name: formValues.name.trim(),
    isRequired: formValues.isRequired,
    isActive: formValues.isActive,
  })
})
</script>

<template>
  <Dialog
    :open="open"
    @update:open="(val) => (val ? emit('update:open', true) : closeDialog())"
  >
    <DialogContent
      class="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
    >
      <DialogHeader class="shrink-0 border-b bg-muted/20 px-6 py-5">
        <DialogTitle>
          {{ isEdit ? 'Ubah Jenis Berkas' : 'Tambah Jenis Berkas' }}
        </DialogTitle>
        <DialogDescription class="sr-only">
          Berkas yang diunggah pendaftar saat mengisi formulir.
        </DialogDescription>
      </DialogHeader>
      <ScrollArea class="min-h-0 flex-1">
        <form
          id="document-type-form"
          class="space-y-4 px-6 py-4"
          @submit.prevent="onSubmit"
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
                :disabled="isSaving"
              />
            </FormControl>
          </FloatingField>

          <FloatingField
            v-slot="{ value, handleChange }"
            name="isRequired"
            label="Sifat Berkas"
            required
          >
            <Select
              :model-value="String(value)"
              :disabled="isSaving"
              @update:model-value="handleChange($event === 'true')"
            >
              <FormControl>
                <SelectTrigger class="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="true"> Wajib </SelectItem>
                <SelectItem value="false"> Opsional </SelectItem>
              </SelectContent>
            </Select>
          </FloatingField>

          <FloatingField
            v-slot="{ value, handleChange }"
            name="isActive"
            label="Status"
            required
          >
            <Select
              :model-value="String(value)"
              :disabled="isSaving"
              @update:model-value="handleChange($event === 'true')"
            >
              <FormControl>
                <SelectTrigger class="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="true"> Aktif </SelectItem>
                <SelectItem value="false"> Nonaktif </SelectItem>
              </SelectContent>
            </Select>
          </FloatingField>

          <p
            v-if="documentType && documentType.documentCount > 0"
            class="text-xs text-muted-foreground"
          >
            Sudah diunggah {{ documentType.documentCount }} kali. Nonaktifkan
            bila tidak dipakai lagi; berkas lama tetap tersimpan.
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
          @click="closeDialog"
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
</template>
