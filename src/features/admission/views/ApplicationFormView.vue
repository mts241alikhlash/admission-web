<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { FileText } from '@lucide/vue'
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
  DialogHeader,
  DialogTitle,
} from '@mts241alikhlash/ui/dialog'
import { useMyApplication } from '../composables/useMyApplication'
import { useApplicationFormState } from '../composables/useApplicationFormState'
import { useApplicationUploads } from '../composables/useApplicationUploads'
import { useFormOptions } from '../composables/useFormOptions'
import { useRoleGuard } from '@/features/platform/auth'
import PersonalDataStep from '../components/PersonalDataStep.vue'
import ParentsStep from '../components/ParentsStep.vue'
import AddressStep from '../components/AddressStep.vue'
import SchoolStep from '../components/SchoolStep.vue'
import AchievementsStep from '../components/AchievementsStep.vue'
import DocumentsStep from '../components/DocumentsStep.vue'
import PaymentStep from '../components/PaymentStep.vue'
import ReviewStep from '../components/ReviewStep.vue'
import SubmitConfirmButton from '../components/SubmitConfirmButton.vue'
import { applicationCompleteness } from '../composables/applicationCompleteness'
import AdmissionStepNav from '../components/AdmissionStepNav.vue'
import ApplicationIntro from '../components/ApplicationIntro.vue'
import type { AdmissionApplication } from '../types'
import { isWaveClosed } from '../utils'

const router = useRouter()

const {
  fetchMyApplication,
  formError,
  updateStep,
  uploadAttachment,
  uploadDocument: uploadDocumentReq,
  uploadPaymentProof: uploadPaymentProofReq,
  submit: submitReq,
} = useMyApplication()

const application = ref<AdmissionApplication | null>(null)
const loading = ref(true)
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

const { can } = useRoleGuard()

const isAdmin = computed(() => can('admissions.read'))

const emptyAction = computed(() =>
  isAdmin.value
    ? { to: '/admin/applicants', label: 'Buka Daftar Pendaftar' }
    : { to: '/registration', label: 'Kembali ke Dasbor' },
)

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

const editable = computed(() => {
  const status = application.value?.status
  return status === 'DRAFT' || status === 'REVISION_NEEDED'
})

const paymentEditable = computed(
  () => editable.value || application.value?.status === 'SUBMITTED',
)

const academicYearName = computed(() => {
  const year = application.value?.wave?.academicYear
  if (!year) return null
  return typeof year === 'string' ? year : year.name
})

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
  const data = await fetchMyApplication()
  if (data) {
    application.value = data
    hydrate(data)
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
  uploadDocumentReq,
  uploadPaymentProofReq,
  refresh,
})

onMounted(async () => {
  void loadFormOptions().catch(() => undefined)
  await loadApplication()
})

const showIntro = ref(false)
const introRequiresAgreement = ref(false)

async function loadApplication() {
  loading.value = true
  const data = await fetchMyApplication()
  if (data) {
    application.value = data
    hydrate(data)
    introRequiresAgreement.value = data.status === 'DRAFT' && !data.birthDate
    showIntro.value = true
  }
  loading.value = false
}

function closeIntro() {
  if (introRequiresAgreement.value) {
    void router.push('/registration')
    return
  }
  showIntro.value = false
}

function continueFromIntro() {
  introRequiresAgreement.value = false
  showIntro.value = false
}

async function saveStep(): Promise<boolean> {
  if (!editable.value) return true

  const payload = buildStepPayload(currentStep.value)
  if (!payload) return true

  const result = await updateStep(payload)
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
  const result = await submitReq()
  if (result.success) {
    toast.success('Formulir berhasil dikirim! Menunggu verifikasi admin.')
    await router.push('/registration')
  }
  isSubmitting.value = false
}
</script>

<template>
  <div
    v-if="loading"
    class="p-6 text-sm text-muted-foreground"
  >
    Memuat formulir…
  </div>

  <div
    v-else-if="formError === 'load-failed'"
    class="p-6"
  >
    <p>Formulir gagal dimuat.</p>
    <Button
      class="mt-3"
      @click="loadApplication"
      >Coba lagi</Button
    >
  </div>

  <div
    v-else-if="application"
    class="p-4 sm:p-6"
  >
    <Card
      class="gap-0 overflow-hidden rounded-2xl py-0 shadow-sm shadow-black/5 ring-1 ring-black/4"
    >
      <CardHeader
        class="flex flex-row flex-wrap items-center justify-between gap-2 border-b px-4 py-4 sm:px-6 sm:py-5"
      >
        <CardTitle class="text-xl font-bold tracking-tight"
          >Formulir Pendaftaran</CardTitle
        >
        <Button
          variant="link"
          size="sm"
          class="h-auto p-0"
          @click="showIntro = true"
        >
          Lihat ketentuan
        </Button>
      </CardHeader>
      <CardContent class="space-y-4 px-4 py-6 sm:px-6">
        <AdmissionStepNav
          :steps="steps"
          :current-step="currentStep"
          :disabled="isSaving || isSubmitting"
          @select="goToStep"
        />

        <div
          v-if="application.status === 'REVISION_NEEDED'"
          class="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm"
        >
          <span class="font-medium text-destructive"
            >Catatan revisi admin:</span
          >
          {{ application.revisionNote }}
        </div>
        <div
          v-else-if="!editable"
          class="rounded-md border p-3 text-sm text-muted-foreground"
        >
          Formulir terkunci karena sudah dikirim. Anda tetap dapat melihat
          isiannya.
        </div>

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
      </CardContent>
      <div
        class="flex items-center border-t bg-background px-4 py-4 sm:px-6"
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
          {{ isSaving ? 'Menyimpan…' : 'Selanjutnya' }}
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
    </Card>
    <Dialog
      :open="showIntro"
      @update:open="!$event && closeIntro()"
    >
      <DialogContent
        class="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <DialogHeader class="shrink-0 border-b px-6 py-5 pr-12">
          <DialogTitle>Ketentuan Pendaftaran</DialogTitle>
          <DialogDescription class="sr-only">
            Informasi gelombang dan ketentuan pendaftaran.
          </DialogDescription>
        </DialogHeader>
        <div class="min-h-0 overflow-y-auto px-6 py-5">
          <ApplicationIntro
            :application="application"
            :academic-year-name="academicYearName"
            :requires-agreement="introRequiresAgreement"
            @start="continueFromIntro"
          />
        </div>
      </DialogContent>
    </Dialog>
  </div>

  <div
    v-else
    class="flex min-h-[60vh] items-center justify-center p-6"
  >
    <div
      class="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm"
    >
      <FileText class="mx-auto h-8 w-8 text-muted-foreground" />
      <h2 class="mt-4 text-lg font-semibold tracking-tight">
        Formulir belum tersedia
      </h2>
      <p class="mt-2 text-sm text-muted-foreground text-balance">
        {{
          isAdmin
            ? 'Akun admin tidak memiliki formulir pendaftaran pribadi. Gunakan daftar pendaftar untuk mengelola pengajuan.'
            : 'Belum ada formulir pendaftaran yang terhubung dengan akun ini.'
        }}
      </p>
      <RouterLink
        :to="emptyAction.to"
        class="mt-6 inline-block"
      >
        <Button class="w-full">{{ emptyAction.label }}</Button>
      </RouterLink>
    </div>
  </div>
</template>
