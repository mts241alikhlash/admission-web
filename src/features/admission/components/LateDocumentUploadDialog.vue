<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button } from '@mts241alikhlash/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@mts241alikhlash/ui/dialog'
import type { LateDocumentRow } from '../types'

const props = defineProps<{
  row: LateDocumentRow | null
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'update:row', value: null): void
  (e: 'upload', file: File): void
}>()

const file = ref<File | null>(null)

watch(
  () => props.row,
  () => {
    file.value = null
  },
)

function pick(event: Event) {
  file.value = (event.target as HTMLInputElement).files?.[0] ?? null
}
</script>

<template>
  <Dialog
    :open="!!row"
    @update:open="(open) => !open && emit('update:row', null)"
  >
    <DialogContent
      class="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
    >
      <DialogHeader class="shrink-0 border-b bg-muted/20 px-6 py-5">
        <DialogTitle>Unggah {{ row?.documentTypeName }}</DialogTitle>
        <DialogDescription>
          {{ row?.applicantName }} · {{ row?.registrationNumber }}
        </DialogDescription>
      </DialogHeader>
      <form
        data-test="upload-form"
        class="flex flex-1 flex-col justify-between"
        @submit.prevent="file && emit('upload', file)"
      >
        <div class="space-y-2 px-6 py-5">
          <label
            class="text-sm font-medium"
            for="late-document-file"
          >
            Berkas (JPG, PNG atau PDF)
          </label>
          <input
            id="late-document-file"
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            class="block w-full text-sm"
            :disabled="saving"
            @change="pick"
          />
        </div>
        <DialogFooter
          class="w-full shrink-0 border-t bg-background px-6 py-4 sm:justify-between"
        >
          <Button
            type="button"
            variant="outline"
            :disabled="saving"
            @click="emit('update:row', null)"
          >
            Batal
          </Button>
          <Button
            type="submit"
            :disabled="saving || !file"
          >
            {{ saving ? 'Mengunggah…' : 'Unggah' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
