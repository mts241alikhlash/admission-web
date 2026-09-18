<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { parseDate } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import type { DateRange } from 'reka-ui'
import { cn } from '@mts241alikhlash/web-shared/utils/utils'
import { RangeCalendar } from '@mts241alikhlash/ui/range-calendar'
import { Checkbox } from '@mts241alikhlash/ui/checkbox'
import { Button } from '@mts241alikhlash/ui/button'
import { Input } from '@mts241alikhlash/ui/input'
import { Textarea } from '@mts241alikhlash/ui/textarea'
import { ScrollArea } from '@mts241alikhlash/ui/scroll-area'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@mts241alikhlash/ui/popover'
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
import {
  FloatingField,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@mts241alikhlash/ui/form'
import { CalendarIcon, Loader2 } from 'lucide-vue-next'
import CurrencyInput from './CurrencyInput.vue'
import type {
  AdmissionAcademicYear,
  AdmissionWaveSummary,
  WaveSavePayload,
} from '../types'

const props = defineProps<{
  open: boolean
  wave: AdmissionWaveSummary | null
  isSaving: boolean
  academicYears: AdmissionAcademicYear[]
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'save', payload: WaveSavePayload): void
}>()

const isEdit = computed(() => !!props.wave)

const formSchema = toTypedSchema(
  z
    .object({
      name: z.string().min(1, 'Nama gelombang wajib diisi'),
      code: z.string().min(1, 'Kode wajib diisi'),
      academicYearId: z.string().min(1, 'Tahun ajaran wajib dipilih'),
      startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
      endDate: z.string().min(1, 'Tanggal selesai wajib diisi'),
      quota: z.coerce.number().min(1, 'Kuota minimal 1'),
      registrationFee: z.coerce.number().min(0, 'Biaya tidak boleh negatif'),
      description: z.string().optional().default(''),
      isActive: z.boolean().default(true),
    })
    .refine(
      (data) =>
        !data.startDate || !data.endDate || data.endDate > data.startDate,
      {
        message: 'Tanggal selesai harus setelah tanggal mulai.',
        path: ['endDate'],
      },
    ),
)

interface WaveFormValues {
  name: string
  code: string
  academicYearId: string
  startDate: string
  endDate: string
  quota: number
  registrationFee: number
  description: string
  isActive: boolean
}

const { handleSubmit, resetForm, values, setFieldValue } =
  useForm<WaveFormValues>({
    validationSchema: formSchema,
  })

const dateRangeOpen = ref(false)

const dateRangeValue = computed<DateRange>({
  get() {
    const s = values.startDate ?? ''
    const e = values.endDate ?? ''
    return {
      start: s ? parseDate(s.split('T')[0]) : undefined,
      end: e ? parseDate(e.split('T')[0]) : undefined,
    }
  },
  set(val: DateRange) {
    setFieldValue('startDate', val.start ? val.start.toString() : '')
    setFieldValue('endDate', val.end ? val.end.toString() : '')
  },
})

function handleRangeUpdate(val: DateRange) {
  dateRangeValue.value = val
  if (val.start && val.end) dateRangeOpen.value = false
}

function formatDateLabel(dv?: DateValue): string {
  if (!dv) return ''
  return format(new Date(dv.toString()), 'dd MMM yyyy', { locale: idLocale })
}

const dateRangeLabel = computed(() => {
  const s = dateRangeValue.value.start
  const e = dateRangeValue.value.end
  if (!s && !e) return ''
  if (s && !e) return formatDateLabel(s)
  if (s && e) return `${formatDateLabel(s)} – ${formatDateLabel(e)}`
  return ''
})

function resolveAcademicYearId(wave: AdmissionWaveSummary | null): string {
  if (wave) {
    if (typeof wave.academicYear === 'object' && wave.academicYear) {
      return wave.academicYear.id
    }
    if (typeof wave.academicYear === 'string' && wave.academicYear) {
      return wave.academicYear
    }
  }
  return props.academicYears.find((y) => y.isActive)?.id ?? ''
}

watch(
  () => [props.open, props.wave],
  () => {
    if (!props.open) return
    if (props.wave) {
      resetForm({
        values: {
          name: props.wave.name,
          code: props.wave.code,
          academicYearId: resolveAcademicYearId(props.wave),
          startDate: props.wave.startDate.slice(0, 10),
          endDate: props.wave.endDate.slice(0, 10),
          quota: Number(props.wave.quota),
          registrationFee: Number(props.wave.registrationFee),
          description: props.wave.description ?? '',
          isActive: props.wave.isActive ?? true,
        },
      })
    } else {
      resetForm({
        values: {
          name: '',
          code: '',
          academicYearId: resolveAcademicYearId(null),
          startDate: '',
          endDate: '',
          quota: 100,
          registrationFee: 250000,
          description: '',
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
    code: formValues.code.trim(),
    academicYearId: formValues.academicYearId,
    startDate: formValues.startDate,
    endDate: formValues.endDate,
    quota: formValues.quota,
    registrationFee: formValues.registrationFee,
    description: formValues.description || undefined,
    isActive: formValues.isActive,
  })
})
</script>

<template>
  <Dialog
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <DialogContent class="sm:max-w-2xl flex flex-col gap-0 p-0 overflow-hidden">
      <DialogHeader class="px-6 py-5 border-b shrink-0 bg-muted/20">
        <DialogTitle>
          {{ isEdit ? 'Ubah Gelombang' : 'Tambah Gelombang' }}
        </DialogTitle>
        <DialogDescription class="sr-only"> </DialogDescription>
      </DialogHeader>

      <ScrollArea class="flex-1 min-h-0">
        <form
          id="wave-form"
          class="space-y-2 px-6 py-4"
          @submit.prevent="onSubmit"
        >
          <div
            class="grid grid-cols-1 items-start gap-x-4 gap-y-2 sm:grid-cols-2"
          >
            <FloatingField
              v-slot="{ componentField }"
              name="code"
              label="Kode"
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
              name="name"
              label="Nama Gelombang"
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
              v-slot="{ value, handleChange }"
              name="academicYearId"
              label="Tahun Ajaran"
              required
            >
              <Select
                :model-value="value"
                :disabled="isSaving || isEdit"
                @update:model-value="handleChange"
              >
                <FormControl>
                  <SelectTrigger class="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem
                    v-for="year in academicYears"
                    :key="year.id"
                    :value="year.id"
                  >
                    {{ year.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </FloatingField>

            <FloatingField
              name="startDate"
              label="Rentang Tanggal"
              required
              always-float
            >
              <Popover v-model:open="dateRangeOpen">
                <PopoverTrigger as-child>
                  <FormControl>
                    <Button
                      variant="outline"
                      :disabled="isSaving"
                      :class="
                        cn(
                          'h-10 w-full justify-start text-left font-normal',
                          !dateRangeLabel && 'text-muted-foreground',
                        )
                      "
                    >
                      {{ dateRangeLabel || 'Pilih rentang tanggal' }}
                      <CalendarIcon
                        class="ml-auto size-4 shrink-0 text-muted-foreground"
                      />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  class="w-auto p-0"
                  align="start"
                >
                  <RangeCalendar
                    :model-value="dateRangeValue"
                    locale="id-ID"
                    initial-focus
                    @update:model-value="handleRangeUpdate"
                  />
                </PopoverContent>
              </Popover>
            </FloatingField>

            <FloatingField
              v-slot="{ componentField }"
              name="quota"
              label="Kuota"
              required
            >
              <FormControl>
                <div class="relative">
                  <Input
                    v-bind="componentField"
                    type="number"
                    min="1"
                    class="pr-20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    :disabled="isSaving"
                  />
                  <span
                    class="pointer-events-none absolute inset-y-0 right-0 flex items-center border-l border-input px-3 text-sm text-muted-foreground"
                  >
                    Orang
                  </span>
                </div>
              </FormControl>
            </FloatingField>

            <FloatingField
              v-slot="{ value, setValue }"
              name="registrationFee"
              label="Biaya Pendaftaran"
              required
            >
              <FormControl>
                <div class="relative">
                  <CurrencyInput
                    :model-value="value ?? 0"
                    class="pr-20"
                    :disabled="isSaving"
                    @update:model-value="setValue"
                  />
                  <span
                    class="pointer-events-none absolute inset-y-0 right-0 flex items-center border-l border-input px-3 text-sm text-muted-foreground"
                  >
                    Rupiah
                  </span>
                </div>
              </FormControl>
            </FloatingField>

            <FloatingField
              v-slot="{ componentField }"
              name="description"
              label="Deskripsi"
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
              name="isActive"
              label="Status"
              hide-label
            >
              <FormControl>
                <div
                  role="button"
                  tabindex="0"
                  class="flex h-10 w-full items-center gap-2 rounded-md bg-transparent px-3 py-1 text-sm transition-colors hover:bg-accent/50 cursor-pointer select-none"
                  :class="{ 'opacity-50 pointer-events-none': isSaving }"
                  @click="handleChange(!value)"
                  @keydown.enter.prevent="handleChange(!value)"
                  @keydown.space.prevent="handleChange(!value)"
                >
                  <Checkbox
                    :model-value="Boolean(value)"
                    :disabled="isSaving"
                    class="pointer-events-none"
                  />
                  <span class="text-sm font-medium">Aktifkan</span>
                </div>
              </FormControl>
            </FloatingField>
          </div>

          <FormField name="endDate">
            <FormItem class="hidden">
              <FormMessage />
            </FormItem>
          </FormField>
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
          form="wave-form"
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
