<script setup lang="ts">
import { computed, ref, watch, useId } from 'vue'
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
import { useFormOptions } from '../composables/useFormOptions'
import type { ApplicantCredentials } from '../composables/useAdminRegistration'
import PersonalDataStep from './PersonalDataStep.vue'
import ParentsStep from './ParentsStep.vue'
import AddressStep from './AddressStep.vue'
import SchoolStep from './SchoolStep.vue'
import AchievementsStep from './AchievementsStep.vue'
import DocumentsStep from './DocumentsStep.vue'
import PaymentStep from './PaymentStep.vue'
import ReviewStep from './ReviewStep.vue'
import SubmitConfirmButton from './SubmitConfirmButton.vue'
import { applicationCompleteness } from '../composables/applicationCompleteness'
import AdmissionStepNav from './AdmissionStepNav.vue'
import type {
  AdmissionApplication,
  AdmissionApplicationForm,
  UpdateApplicationPayload,
} from '../types'
import { isWaveClosed } from '../utils'

const props = defineProps<{
  open: boolean
  credentials: ApplicantCredentials | null
  applicationId: string | null
  fetchError: 'not-found' | 'load-failed' | null
  fetchApplication: () => Promise<AdmissionApplication | null>
  updateStep: (
    payload: UpdateApplicationPayload,
  ) => Promise<{ success: boolean; data?: AdmissionApplicationForm }>
  uploadDocument: (
    typeCode: string,
    file: File,
  ) => Promise<{ success: boolean }>
  uploadAttachment: (file: File) => Promise<{ id: string } | null>
  uploadPaymentProof: (
    payload: {
      bankName: string
      bankAccountId: string
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
  'Prestasi & Beasiswa',
  'Berkas',
  'Pembayaran',
  'Review & Kirim',
]

const application = ref<AdmissionApplication | null>(null)
const loading = ref(false)
const isSaving = ref(false)
const isSubmitting = ref(false)
const currentStep = ref(0)

interface StepValidator {
  validate: () => Promise<{ valid: boolean }>
}

const personalStepRef = ref<StepValidator | null>(null)
const parentsStepRef = ref<StepValidator | null>(null)
const addressStepRef = ref<StepValidator | null>(null)
const schoolStepRef = ref<StepValidator | null>(null)
const achievementsStepRef = ref<StepValidator | null>(null)

const stepValidators: Record<number, () => StepValidator | null> = {
  0: () => personalStepRef.value,
  1: () => parentsStepRef.value,
  2: () => addressStepRef.value,
  3: () => schoolStepRef.value,
  4: () => achievementsStepRef.value,
}

const finished = ref(false)
const copied = ref(false)
const registrationId = useId()
const emailId = useId()
const passwordId = useId()

const editable = computed(() => {
  const status = application.value?.status
  return status === 'DRAFT' || status === 'REVISION_NEEDED'
})

const paymentEditable = computed(
  () => editable.value || application.value?.status === 'SUBMITTED',
)

const {
  personal,
  parents,
  address,
  school,
  achievements,
  scholarships,
  payment,
  hydrate,
  guardianRelation,
  setGuardian,
  buildStepPayload,
} = useApplicationFormState()

const { load: loadFormOptions, listOf } = useFormOptions()
const completeness = computed(() =>
  application.value
    ? applicationCompleteness({
        personal: personal.value,
        parents: parents.value,
        address: address.value,
        school: school.value,
        achievements: achievements.value,
        scholarships: scholarships.value,
        lifeStatuses: listOf('parentLifeStatuses'),
        scholarshipCategories: listOf('scholarshipCategories'),
        documentTypes: application.value.documentTypes ?? [],
        documents: application.value.documents ?? [],
      })
    : [],
)
const waveClosed = computed(() =>
  isWaveClosed(application.value?.wave?.endDate),
)
const canSubmit = computed(
  () => !waveClosed.value && completeness.value.every((item) => item.done),
)

async function refresh() {
  const data = await props.fetchApplication()
  if (data) {
    application.value = data
    hydrate(data)
  }
}

async function retryInitialFetch() {
  application.value = null
  loading.value = true
  try {
    await refresh()
  } finally {
    loading.value = false
  }
}

const {
  documentFiles,
  uploadingDoc,
  onDocumentFileChange,
  clearDocumentFile,
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
  () => [props.open, props.applicationId] as const,
  async ([open], _old, onCleanup) => {
    if (!open) return
    let active = true
    onCleanup(() => {
      active = false
    })
    application.value = null
    currentStep.value = 0
    finished.value = false
    copied.value = false
    loading.value = true
    void loadFormOptions().catch(() => undefined)
    const data = await props.fetchApplication()
    if (active) {
      if (data) {
        application.value = data
        hydrate(data)
      }
      loading.value = false
    }
  },
)

async function saveStep(): Promise<boolean> {
  if (!editable.value) return true

  const payload = buildStepPayload(currentStep.value)
  if (!payload) return true

  const result = await props.updateStep(payload)
  if (result.success && result.data && application.value) {
    application.value = { ...application.value, ...result.data }
    hydrate(application.value)
  }
  return result.success
}

async function goToStep(index: number) {
  if (
    index === currentStep.value ||
    index < 0 ||
    index >= steps.length ||
    isSaving.value ||
    isSubmitting.value
  ) {
    return
  }

  isSaving.value = true
  try {
    if (editable.value && index > currentStep.value) {
      const validator = stepValidators[currentStep.value]?.()
      if (validator) {
        const { valid } = await validator.validate()
        if (!valid) return
      }
    }
    if (await saveStep()) currentStep.value = index
  } finally {
    isSaving.value = false
  }
}

function nextStep() {
  return goToStep(currentStep.value + 1)
}

function previousStep() {
  return goToStep(currentStep.value - 1)
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
            :for="registrationId"
            floating
          >
            <div class="flex gap-2">
              <Input
                :id="registrationId"
                :model-value="credentials.registrationNumber"
                readonly
                class="font-mono"
              />
            </div>
          </FloatingLabelField>
          <FloatingLabelField
            label="Email"
            :for="emailId"
            floating
          >
            <Input
              :id="emailId"
              :model-value="credentials.email"
              readonly
            />
          </FloatingLabelField>
          <FloatingLabelField
            label="Kata Sandi"
            :for="passwordId"
            floating
          >
            <Input
              :id="passwordId"
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
            <AdmissionStepNav
              :steps="steps"
              :current-step="currentStep"
              :disabled="isSaving || isSubmitting"
              @select="goToStep"
            />
          </div>

          <div class="px-6 py-4">
            <PersonalDataStep
              v-if="currentStep === 0"
              ref="personalStepRef"
              v-model="personal"
              :editable="editable && !isSaving && !isSubmitting"
            />

            <ParentsStep
              v-else-if="currentStep === 1"
              ref="parentsStepRef"
              v-model="parents"
              :editable="editable && !isSaving && !isSubmitting"
              :guardian-relation="guardianRelation"
              :on-choose-guardian="setGuardian"
            />

            <AddressStep
              v-else-if="currentStep === 2"
              ref="addressStepRef"
              v-model="address"
              v-model:parents="parents"
              :editable="editable && !isSaving && !isSubmitting"
            />

            <SchoolStep
              v-else-if="currentStep === 3"
              ref="schoolStepRef"
              v-model="school"
              :editable="editable && !isSaving && !isSubmitting"
            />

            <AchievementsStep
              v-else-if="currentStep === 4"
              ref="achievementsStepRef"
              v-model:achievements="achievements"
              v-model:scholarships="scholarships"
              :editable="editable && !isSaving && !isSubmitting"
              :upload-attachment="uploadAttachment"
            />

            <DocumentsStep
              v-else-if="currentStep === 5"
              :document-types="application.documentTypes ?? []"
              :documents="application.documents ?? []"
              :document-files="documentFiles"
              :uploading-doc="uploadingDoc"
              :editable="editable"
              :on-file-change="onDocumentFileChange"
              :on-clear-file="clearDocumentFile"
              :on-upload="uploadDocument"
            />

            <PaymentStep
              v-else-if="currentStep === 6"
              v-model="payment"
              :application-payment="application.payment ?? null"
              :editable="paymentEditable"
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
              :school="school"
              :application="application"
              :editable="editable"
              :completeness="completeness"
              :on-go-to-step="goToStep"
            />
          </div>
        </ScrollArea>

        <div
          class="flex items-center gap-2 px-6 py-4 border-t shrink-0 bg-background"
          :class="currentStep === 0 ? 'justify-end' : 'justify-between'"
        >
          <Button
            v-if="currentStep > 0"
            variant="outline"
            :disabled="isSaving || isSubmitting"
            @click="previousStep"
          >
            Sebelumnya
          </Button>
          <Button
            v-if="currentStep < steps.length - 1"
            :disabled="isSaving || isSubmitting"
            @click="nextStep"
          >
            <Loader2
              v-if="isSaving"
              class="size-4 mr-1.5 animate-spin"
            />
            {{ isSaving ? 'Menyimpan...' : 'Selanjutnya' }}
          </Button>
          <span
            v-else-if="editable && waveClosed"
            class="text-sm text-destructive"
          >
            Gelombang ini sudah ditutup; formulir tidak dapat dikirim.
          </span>
          <SubmitConfirmButton
            v-else-if="editable"
            :disabled="!canSubmit"
            :submitting="isSubmitting"
            @confirm="submitApplication"
          />
        </div>
      </template>

      <div
        v-else-if="fetchError === 'load-failed'"
        class="space-y-3 px-6 py-6 text-sm"
      >
        <p>Gagal memuat formulir pendaftar.</p>
        <Button
          type="button"
          variant="outline"
          @click="retryInitialFetch"
          >Coba lagi</Button
        >
      </div>
      <div
        v-else-if="fetchError === 'not-found'"
        class="px-6 py-6 text-sm text-muted-foreground"
      >
        Data pendaftar tidak ditemukan.
      </div>
      <div
        v-else
        class="px-6 py-6 text-sm text-muted-foreground"
      >
        Formulir belum tersedia.
      </div>
    </DialogContent>
  </Dialog>
</template>
