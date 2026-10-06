<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { toast } from 'vue-sonner'
import { Copy, UploadCloud } from '@lucide/vue'
import { DatePicker } from '@mts241alikhlash/ui'
import { Badge } from '@mts241alikhlash/ui/badge'
import { Button } from '@mts241alikhlash/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@mts241alikhlash/ui/card'
import { Input } from '@mts241alikhlash/ui/input'
import { FormControl, FormField } from '@mts241alikhlash/ui/form'
import FloatingField from './AdmissionField.vue'
import { paymentSchema } from '../schemas/applicationFormSchemas'
import { useFormOptions } from '../composables/useFormOptions'
import { PAYMENT_STATUS_LABELS } from '../types'
import type { AdmissionPayment } from '../types'
import type { PaymentForm } from '../composables/useApplicationFormState'
import { formatDate, formatIDR, PAYMENT_STATUS_BADGE_VARIANTS } from '../utils'

const props = defineProps<{
  applicationPayment: AdmissionPayment | null
  editable: boolean
  paymentFile: File | null
  uploadingPayment: boolean
  onFileChange: (event: Event) => void
  onUpload: () => void
}>()

const payment = defineModel<PaymentForm>({ required: true })
const today = new Date().toISOString().slice(0, 10)
const fileError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const { options } = useFormOptions()
const accounts = computed(() => options.value?.bankAccounts ?? [])

const { values, validate, setValues, setFieldValue } = useForm<PaymentForm>({
  validationSchema: toTypedSchema(paymentSchema),
  initialValues: payment.value,
})

watch(payment, (v) => setValues(v, false))
watch(values, (v) => Object.assign(payment.value, v), { deep: true })

const status = computed(() => props.applicationPayment?.status ?? 'UNPAID')

const GUIDANCE: Record<string, string> = {
  UNPAID:
    'Transfer biaya pendaftaran ke salah satu rekening di bawah, lalu unggah bukti transfernya. Pembayaran boleh menyusul setelah formulir dikirim.',
  PENDING:
    'Bukti transfer sedang diperiksa panitia. Jika ada yang keliru, unggah ulang bukti yang benar.',
  REJECTED:
    'Bukti transfer ditolak. Perbaiki sesuai catatan panitia, lalu unggah ulang.',
  VERIFIED: 'Pembayaran sudah diverifikasi. Tidak ada yang perlu dilakukan.',
}

const canUpload = computed(() => props.editable && status.value !== 'VERIFIED')

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} disalin.`)
  } catch {
    toast.error(`Gagal menyalin ${label.toLowerCase()}.`)
  }
}

function pickFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  fileError.value =
    file && !['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)
      ? 'Format berkas harus JPG, PNG, atau PDF.'
      : ''
  if (fileError.value) input.value = ''
  props.onFileChange(event)
  input.value = ''
}

function dropFile(event: DragEvent) {
  if (!fileInput.value || !event.dataTransfer || props.uploadingPayment) return
  fileInput.value.files = event.dataTransfer.files
  fileInput.value.dispatchEvent(new Event('change', { bubbles: true }))
}

async function upload() {
  const { valid } = await validate()
  fileError.value = props.paymentFile ? '' : 'Pilih berkas bukti transfer.'
  if (valid && props.paymentFile) props.onUpload()
}
</script>

<template>
  <div class="space-y-4">
    <Card class="gap-0 overflow-hidden py-0">
      <CardHeader
        class="flex flex-row flex-wrap items-center justify-between gap-3 border-b px-4 py-3"
      >
        <CardTitle class="text-base font-semibold"
          >Pembayaran Pendaftaran</CardTitle
        >
        <Badge :variant="PAYMENT_STATUS_BADGE_VARIANTS[status]">
          {{ PAYMENT_STATUS_LABELS[status] }}
        </Badge>
      </CardHeader>
      <CardContent class="space-y-4 px-4 py-4 text-sm">
        <div class="flex flex-wrap items-center gap-2">
          <span>Biaya pendaftaran</span>
          <strong>{{
            applicationPayment ? formatIDR(applicationPayment.amount) : '-'
          }}</strong>
          <Button
            v-if="applicationPayment"
            variant="ghost"
            size="sm"
            class="h-auto p-1"
            aria-label="Salin nominal"
            @click="copy(String(applicationPayment.amount), 'Nominal')"
          >
            <Copy class="size-4" />
          </Button>
        </div>
        <p class="text-muted-foreground">{{ GUIDANCE[status] }}</p>
        <p
          v-if="status === 'REJECTED' && applicationPayment?.note"
          class="font-medium text-destructive"
        >
          Catatan panitia: {{ applicationPayment.note }}
        </p>
        <div
          v-if="applicationPayment?.proofFile"
          class="space-y-1 border-t pt-4"
          data-test="uploaded-proof"
        >
          <p class="font-medium">Bukti yang sudah diunggah</p>
          <p class="break-all">
            {{ applicationPayment.proofFile.originalName }}
          </p>
          <p
            v-if="applicationPayment.bankAccount"
            class="text-muted-foreground"
          >
            Ke {{ applicationPayment.bankAccount.bankName }}
            {{ applicationPayment.bankAccount.accountNumber }} a.n.
            {{ applicationPayment.bankAccount.accountHolder }}
          </p>
          <p class="text-muted-foreground">
            Dari {{ applicationPayment.bankName }} a.n.
            {{ applicationPayment.senderAccountName }}
            <template v-if="applicationPayment.transferDate">
              · {{ formatDate(applicationPayment.transferDate) }}
            </template>
          </p>
        </div>
      </CardContent>
    </Card>

    <Card
      v-if="canUpload"
      class="gap-0 overflow-hidden py-0"
    >
      <CardHeader class="border-b px-4 py-3">
        <CardTitle class="text-base font-semibold"
          >Unggah Bukti Pembayaran</CardTitle
        >
      </CardHeader>
      <CardContent class="space-y-5 px-4 py-4">
        <FormField
          v-slot="{ errorMessage }"
          name="bankAccountId"
        >
          <fieldset class="space-y-2">
            <legend class="text-sm font-medium">
              Rekening tujuan <span class="text-destructive">*</span>
            </legend>
            <p
              v-if="accounts.length === 0"
              class="text-sm text-muted-foreground"
            >
              Rekening tujuan belum tersedia. Hubungi panitia PSB.
            </p>
            <div
              v-else
              role="radiogroup"
              aria-label="Rekening tujuan"
              class="grid gap-2 sm:grid-cols-2"
            >
              <label
                v-for="account in accounts"
                :key="account.id"
                class="flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="radio"
                  name="bankAccountId"
                  class="mt-1"
                  :value="account.id"
                  :checked="values.bankAccountId === account.id"
                  @change="setFieldValue('bankAccountId', account.id)"
                />
                <span class="min-w-0 flex-1 space-y-0.5">
                  <span class="block font-medium">{{ account.bankName }}</span>
                  <span class="flex flex-wrap items-center gap-1">
                    <span class="font-mono">{{ account.accountNumber }}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      class="h-auto p-1"
                      :aria-label="`Salin nomor rekening ${account.bankName}`"
                      @click.prevent="
                        copy(account.accountNumber, 'Nomor rekening')
                      "
                    >
                      <Copy class="size-4" />
                    </Button>
                  </span>
                  <span class="block text-muted-foreground">
                    a.n. {{ account.accountHolder }}
                  </span>
                </span>
              </label>
            </div>
            <p
              v-if="errorMessage"
              class="text-sm text-destructive"
            >
              {{ errorMessage }}
            </p>
          </fieldset>
        </FormField>

        <div class="grid gap-4 sm:grid-cols-2">
          <FloatingField
            v-slot="{ componentField }"
            name="bankName"
            label="Bank Pengirim"
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
            name="senderAccountName"
            label="Nama Pemilik Rekening Pengirim"
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
            v-slot="{ value, setValue }"
            name="transferDate"
            label="Tanggal Transfer"
            required
            always-float
            class="[&_button]:border-input [&_button]:bg-transparent [&_button:hover]:bg-transparent [&_button:hover]:text-foreground dark:[&_button]:bg-input/30 dark:[&_button:hover]:bg-input/30"
          >
            <FormControl>
              <DatePicker
                :model-value="value ?? ''"
                :max-date="today"
                @update:model-value="setValue"
              />
            </FormControl>
          </FloatingField>
          <div class="space-y-2 sm:col-span-2">
            <p class="text-sm font-medium">
              Bukti Transfer <span class="text-destructive">*</span>
            </p>
            <label
              class="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/25 p-6 text-center transition-colors hover:bg-muted/50 focus-within:ring-2 focus-within:ring-ring"
              @dragover.prevent
              @drop.prevent="dropFile($event)"
            >
              <span class="rounded-full bg-primary/10 p-3 text-primary">
                <UploadCloud class="size-6" />
              </span>
              <span class="text-sm">
                <span class="block font-medium">{{
                  paymentFile?.name || 'Klik atau tarik file ke sini'
                }}</span>
                <span class="mt-1 block text-xs text-muted-foreground"
                  >JPG, PNG, atau PDF, maks. 5 MB</span
                >
              </span>
              <input
                ref="fileInput"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                class="sr-only"
                aria-label="Pilih bukti transfer"
                :aria-invalid="!!fileError"
                :disabled="uploadingPayment"
                @change="pickFile"
              />
            </label>
            <p
              v-if="fileError"
              class="text-sm text-destructive"
            >
              {{ fileError }}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter
        class="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-4"
      >
        <p
          v-if="uploadingPayment"
          role="status"
          class="text-sm"
        >
          Mengunggah bukti pembayaran…
        </p>
        <Button
          :disabled="uploadingPayment || accounts.length === 0"
          @click="upload"
        >
          {{
            uploadingPayment
              ? 'Mengunggah…'
              : applicationPayment?.proofFile
                ? 'Unggah Ulang Bukti'
                : 'Unggah Bukti Pembayaran'
          }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
