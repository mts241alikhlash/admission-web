<script setup lang="ts">
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { Button } from '@mts241alikhlash/ui/button'
import { Input } from '@mts241alikhlash/ui/input'
import { Textarea } from '@mts241alikhlash/ui/textarea'
import { ScrollArea } from '@mts241alikhlash/ui/scroll-area'
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
import { FloatingField, FormControl } from '@mts241alikhlash/ui/form'
import { Loader2 } from 'lucide-vue-next'
import type {
  AdmissionAnnouncement,
  AdmissionWaveSummary,
  AnnouncementSavePayload,
} from '../types'

const ALL_WAVES = 'ALL'

const props = defineProps<{
  open: boolean
  announcement: AdmissionAnnouncement | null
  isSaving: boolean
  waves: AdmissionWaveSummary[]
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'save', payload: AnnouncementSavePayload): void
}>()

const isEdit = computed(() => !!props.announcement)

const formSchema = toTypedSchema(
  z.object({
    title: z.string().min(1, 'Judul wajib diisi'),
    content: z.string().min(1, 'Isi pengumuman wajib diisi'),
    waveId: z.string().default(ALL_WAVES),
  }),
)

interface AnnouncementFormValues {
  title: string
  content: string
  waveId: string
}

const { handleSubmit, resetForm } = useForm<AnnouncementFormValues>({
  validationSchema: formSchema,
})

watch(
  () => [props.open, props.announcement],
  () => {
    if (!props.open) return
    resetForm({
      values: {
        title: props.announcement?.title ?? '',
        content: props.announcement?.content ?? '',
        waveId: props.announcement?.waveId ?? ALL_WAVES,
      },
    })
  },
  { immediate: true },
)

const onSubmit = handleSubmit((values) => {
  emit('save', {
    title: values.title.trim(),
    content: values.content.trim(),
    waveId: values.waveId === ALL_WAVES ? undefined : values.waveId,
  })
})
</script>

<template>
  <Dialog
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <DialogContent class="sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden">
      <DialogHeader class="px-6 py-5 border-b shrink-0 bg-muted/20">
        <DialogTitle>
          {{ isEdit ? 'Ubah Pengumuman' : 'Buat Pengumuman' }}
        </DialogTitle>
        <DialogDescription class="sr-only"> </DialogDescription>
      </DialogHeader>

      <ScrollArea class="flex-1 min-h-0">
        <form
          id="announcement-form"
          class="space-y-2 px-6 py-4"
          @submit.prevent="onSubmit"
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
                :disabled="isSaving"
              />
            </FormControl>
          </FloatingField>

          <FloatingField
            v-slot="{ componentField }"
            name="content"
            label="Isi"
            required
          >
            <FormControl>
              <Textarea
                v-bind="componentField"
                class="resize-none min-h-10"
                :disabled="isSaving"
              />
            </FormControl>
          </FloatingField>

          <FloatingField
            v-slot="{ value, handleChange }"
            name="waveId"
            label="Gelombang"
          >
            <Select
              :model-value="value"
              :disabled="isSaving"
              @update:model-value="handleChange"
            >
              <FormControl>
                <SelectTrigger class="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem :value="ALL_WAVES">Semua Gelombang</SelectItem>
                <SelectItem
                  v-for="wave in waves"
                  :key="wave.id"
                  :value="wave.id"
                >
                  {{ wave.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </FloatingField>
        </form>
      </ScrollArea>

      <DialogFooter
        class="px-6 py-4 border-t shrink-0 flex sm:justify-between w-full bg-background"
      >
        <Button
          type="button"
          variant="outline"
          :disabled="isSaving"
          @click="emit('update:open', false)"
        >
          Batal
        </Button>
        <Button
          type="submit"
          form="announcement-form"
          variant="default"
          :disabled="isSaving"
        >
          <Loader2
            v-if="isSaving"
            class="size-4 mr-1.5 animate-spin"
          />
          {{ isSaving ? 'Menyimpan...' : 'Simpan' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
