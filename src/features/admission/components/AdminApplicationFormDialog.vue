<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@mts241alikhlash/ui/button'
import { Input } from '@mts241alikhlash/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@mts241alikhlash/ui/dialog'
import { ScrollArea } from '@mts241alikhlash/ui/scroll-area'
import { FloatingLabelField } from '@mts241alikhlash/ui/form'
import { Check, Copy, Loader2 } from 'lucide-vue-next'
import { useApplicationFormState } from '../composables/useApplicationFormState'
import { useApplicationUploads } from '../composables/useApplicationUploads'
import type { ApplicantCredentials } from '../composables/useAdminRegistration'
import PersonalDataStep from './PersonalDataStep.vue'
import ParentsStep from './ParentsStep.vue'
import AddressStep from './AddressStep.vue'
import SchoolStep from './SchoolStep.vue'
import DocumentsStep from './DocumentsStep.vue'
import PaymentStep from './PaymentStep.vue'
import ReviewStep from './ReviewStep.vue'
import type { AdmissionApplication, UpdateApplicationPayload } from '../types'

const props = defineProps<{
  open: boolean
  credentials: ApplicantCredentials | null
  applicationId: string | null
  fetchApplication: () => Promise<AdmissionApplication | null>
  updateStep: (
    payload: UpdateApplicationPayload,
  ) => Promise<{ success: boolean; data?: AdmissionApplication }>
  uploadDocument: (
    typeCode: string,
    file: File,
  ) => Promise<{ success: boolean }>
  uploadPaymentProof: (
    payload: {
      bankName: string
      senderAccountName: string
      transferDate?: string
    },
    file: File,
  ) => Promise<{ success: boolean }>
  submit: () => Promise<{ success: boolean }>
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'completed'): void
}>()

const steps = [
  'Data Diri',
  'Orang Tua/Wali',
  'Alamat',
  'Sekolah Asal',
  'Berkas',
  'Pembayaran',
  'Review & Kirim',
]

const application = ref<AdmissionApplication | null>(null)
const loading = ref(false)
const isSaving = ref(false)
const isSubmitting = ref(false)
const currentStep = ref(0)
const finished = ref(false)
const copied = ref(false)

const editable = computed(() => {
  const status = application.value?.status
  return status === 'DRAFT' || status === 'REVISION_NEEDED'
})

const {
  personal,
  parents,
  address,
  school,
  payment,
  hydrate,
  addParent,
  removeParent,
  buildStepPayload,
} = useApplicationFormState()

async function refresh() {
  const data = await props.fetchApplication()
  if (data) {
    application.value = data
    hydrate(data)
  }
}

const {
  documentFiles,
  uploadingDoc,
  onDocumentFileChange,
  uploadDocument,
  paymentFile,
  uploadingPayment,
  onPaymentFileChange,
  uploadPayment,
} = useApplicationUploads({
  payment,
  uploadDocumentReq: props.uploadDocument,
  uploadPaymentProofReq: props.uploadPaymentProof,
  refresh,
})

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    currentStep.value = 0
    finished.value = false
    copied.value = false
    loading.value = true
    await refresh()
    loading.value = false
  },
)

async function saveStep(): Promise<boolean> {
  if (!editable.value) return true

  const payload = buildStepPayload(currentStep.value)
  if (!payload) return true

  isSaving.value = true
  const result = await props.updateStep(payload)
  if (result.success && result.data) {
    application.value = result.data
    hydrate(result.data)
  }
  isSaving.value = false
  return result.success
}

async function nextStep() {
  const saved = await saveStep()
  if (saved && currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

function previousStep() {
  if (currentStep.value > 0) currentStep.value--
}

async function submitApplication() {
  isSubmitting.value = true
  const result = await props.submit()
  isSubmitting.value = false
  if (result.success) {
    finished.value = true
    emit('completed')
  }
}

async function copyCredentials() {
  if (!props.credentials) return
  const text = `No. Pendaftaran: ${props.credentials.registrationNumber}\nEmail: ${props.credentials.email}\nKata Sandi: ${props.credentials.password}`
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    toast.success('Kredensial disalin.')
  } catch {
    toast.error('Tidak dapat menyalin. Salin secara manual.')
  }
}

function handleOpenChange(open: boolean) {
  if (!open && (isSaving.value || isSubmitting.value)) return
  emit('update:open', open)
}
</script>

<template>
  <Dialog
    :open="open"
    @update:open="handleOpenChange"
  >
    <DialogContent
      class="sm:max-w-3xl flex flex-col gap-0 p-0 overflow-hidden max-h-[90vh]"
    >
      <DialogHeader class="px-6 py-5 border-b shrink-0 bg-muted/20">
        <DialogTitle>Formulir Pendaftar</DialogTitle>
        <DialogDescription>
          <template v-if="credentials">
            No. Pendaftaran
            <span class="font-mono font-medium">
              {{ credentials.registrationNumber }}
            </span>
            · Diisi atas nama pendaftar.
          </template>
        </DialogDescription>
      </DialogHeader>

      <div
        v-if="loading"
        class="p-6 text-sm text-muted-foreground"
      >
        Memuat formulir…
      </div>

      <div
        v-else-if="finished && credentials"
        class="space-y-4 px-6 py-6"
      >
        <div
          class="rounded-md border border-primary/50 bg-primary/10 p-4 text-sm"
        >
          <p class="font-semibold text-primary">
            Pendaftaran berhasil dikirim.
          </p>
          <p class="mt-1 text-muted-foreground">
            Serahkan kredensial berikut kepada pendaftar. Kata sandi hanya
            ditampilkan sekali.
          </p>
        </div>

        <div class="space-y-2">
          <FloatingLabelField
            label="Nomor Pendaftaran"
            floating
          >
            <div class="flex gap-2">
              <Input
                :model-value="credentials.registrationNumber"
                readonly
                class="font-mono"
              />
            </div>
          </FloatingLabelField>
          <FloatingLabelField
            label="Email"
            floating
          >
            <Input
              :model-value="credentials.email"
              readonly
            />
          </FloatingLabelField>
          <FloatingLabelField
            label="Kata Sandi"
            floating
          >
            <Input
              :model-value="credentials.password"
              readonly
            />
          </FloatingLabelField>
        </div>

        <Button
          type="button"
          variant="outline"
          class="w-full"
          @click="copyCredentials"
        >
          <component
            :is="copied ? Check : Copy"
            class="size-4 mr-1.5"
          />
          {{ copied ? 'Tersalin' : 'Salin semua kredensial' }}
        </Button>
      </div>

      <template v-else-if="application">
        <ScrollArea class="flex-1 min-h-0">
          <div class="px-6 pt-4">
            <ol class="flex flex-wrap gap-2">
              <li
                v-for="(step, index) in steps"
                :key="step"
              >
                <button
                  type="button"
                  class="rounded-full border px-3 py-1 text-xs"
                  :class="
                    index === currentStep
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:border-primary'
                  "
                  @click="currentStep = index"
                >
                  {{ index + 1 }}. {{ step }}
                </button>
              </li>
            </ol>
          </div>

          <div class="px-6 py-4">
            <PersonalDataStep
              v-if="currentStep === 0"
              v-model="personal"
              :editable="editable"
            />

            <ParentsStep
              v-else-if="currentStep === 1"
              v-model="parents"
              :editable="editable"
              :on-add="addParent"
              :on-remove="removeParent"
            />

            <AddressStep
              v-else-if="currentStep === 2"
              v-model="address"
              :editable="editable"
            />

            <SchoolStep
              v-else-if="currentStep === 3"
              v-model="school"
              :editable="editable"
            />

            <DocumentsStep
              v-else-if="currentStep === 4"
              :document-types="application.documentTypes ?? []"
              :documents="application.documents"
              :document-files="documentFiles"
              :uploading-doc="uploadingDoc"
              :editable="editable"
              :on-file-change="onDocumentFileChange"
              :on-upload="uploadDocument"
            />

            <PaymentStep
              v-else-if="currentStep === 5"
              v-model="payment"
              :application-payment="application.payment"
              :editable="editable"
              :payment-file="paymentFile"
              :uploading-payment="uploadingPayment"
              :on-file-change="onPaymentFileChange"
              :on-upload="uploadPayment"
            />

            <ReviewStep
              v-else
              :personal="personal"
              :parents="parents"
              :address="address"
              :application="application"
              :editable="editable"
              :is-submitting="isSubmitting"
              :on-submit="submitApplication"
            />
          </div>
        </ScrollArea>

        <div
          class="flex items-center justify-between gap-2 px-6 py-4 border-t shrink-0 bg-background"
        >
          <Button
            variant="outline"
            :disabled="currentStep === 0 || isSaving || isSubmitting"
            @click="previousStep"
          >
            Sebelumnya
          </Button>
          <Button
            v-if="currentStep < steps.length - 1"
            :disabled="isSaving"
            @click="nextStep"
          >
            <Loader2
              v-if="isSaving"
              class="size-4 mr-1.5 animate-spin"
            />
            {{ isSaving ? 'Menyimpan...' : 'Simpan & Lanjut' }}
          </Button>
        </div>
      </template>

      <div
        v-else
        class="px-6 py-6 text-sm text-muted-foreground"
      >
        Data pendaftar tidak ditemukan.
      </div>
    </DialogContent>
  </Dialog>
</template>
