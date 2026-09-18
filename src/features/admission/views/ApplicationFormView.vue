<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { FileText } from 'lucide-vue-next'
import { Button } from '@mts241alikhlash/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mts241alikhlash/ui/card'
import { useMyApplication } from '../composables/useMyApplication'
import { useApplicationFormState } from '../composables/useApplicationFormState'
import { useApplicationUploads } from '../composables/useApplicationUploads'
import { useAuthStore } from '@/features/platform/auth'
import StatusBadge from '../components/StatusBadge.vue'
import PersonalDataStep from '../components/PersonalDataStep.vue'
import ParentsStep from '../components/ParentsStep.vue'
import AddressStep from '../components/AddressStep.vue'
import SchoolStep from '../components/SchoolStep.vue'
import DocumentsStep from '../components/DocumentsStep.vue'
import PaymentStep from '../components/PaymentStep.vue'
import ReviewStep from '../components/ReviewStep.vue'
import type { AdmissionApplication } from '../types'

const router = useRouter()

const {
  fetchMyApplication,
  updateStep,
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

const stepValidators: Record<number, () => StepValidator | null> = {
  0: () => personalStepRef.value,
  1: () => parentsStepRef.value,
  2: () => addressStepRef.value,
  3: () => schoolStepRef.value,
}

const authStore = useAuthStore()

const isAdmin = computed(() => {
  const roles = authStore.user?.roles ?? []
  return roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')
})

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
  'Berkas',
  'Pembayaran',
  'Review & Kirim',
]

const editable = computed(() => {
  const status = application.value?.status
  return status === 'DRAFT' || status === 'REVISION_NEEDED'
})

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
  payment,
  hydrate,
  addParent,
  removeParent,
  buildStepPayload,
} = useApplicationFormState()

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
  const data = await fetchMyApplication()
  if (data) {
    application.value = data
    hydrate(data)
  }
  loading.value = false
})

async function saveStep(): Promise<boolean> {
  if (!editable.value) return true

  const payload = buildStepPayload(currentStep.value)
  if (!payload) return true

  isSaving.value = true
  const result = await updateStep(payload)
  if (result.success && result.data) {
    application.value = result.data
    hydrate(result.data)
  }
  isSaving.value = false
  return result.success
}

async function nextStep() {
  const validator = stepValidators[currentStep.value]?.()
  if (validator) {
    const { valid } = await validator.validate()
    if (!valid) return
  }
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
    v-else-if="application"
    class="space-y-4 p-4 sm:p-6"
  >
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h1 class="text-xl font-semibold">Formulir Pendaftaran</h1>
        <p class="text-sm text-muted-foreground">
          {{ application.registrationNumber }} · {{ application.wave.name }}
        </p>
      </div>
      <StatusBadge :status="application.status" />
    </div>

    <div class="rounded-md border bg-muted p-3 text-sm">
      <p class="text-xs font-medium text-muted-foreground">
        Gelombang Pendaftaran
      </p>
      <p class="mt-1 font-medium break-words">{{ application.wave.name }}</p>
      <p
        v-if="academicYearName"
        class="text-muted-foreground break-words"
      >
        {{ academicYearName }}
      </p>
    </div>

    <div
      v-if="application.status === 'REVISION_NEEDED'"
      class="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm"
    >
      <span class="font-medium text-destructive">Catatan revisi admin:</span>
      {{ application.revisionNote }}
    </div>
    <div
      v-else-if="!editable"
      class="rounded-md border p-3 text-sm text-muted-foreground"
    >
      Formulir terkunci karena sudah dikirim. Anda tetap dapat melihat isiannya.
    </div>

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

    <Card>
      <CardHeader>
        <CardTitle>{{ steps[currentStep] }}</CardTitle>
        <CardDescription v-if="editable">
          Isian tersimpan otomatis setiap berpindah langkah.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PersonalDataStep
          v-if="currentStep === 0"
          ref="personalStepRef"
          v-model="personal"
          :editable="editable"
        />

        <ParentsStep
          v-else-if="currentStep === 1"
          ref="parentsStepRef"
          v-model="parents"
          :editable="editable"
          :on-add="addParent"
          :on-remove="removeParent"
        />

        <AddressStep
          v-else-if="currentStep === 2"
          ref="addressStepRef"
          v-model="address"
          :editable="editable"
        />

        <SchoolStep
          v-else-if="currentStep === 3"
          ref="schoolStepRef"
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

        <div class="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            :disabled="currentStep === 0"
            @click="previousStep"
          >
            Sebelumnya
          </Button>
          <Button
            v-if="currentStep < steps.length - 1"
            :disabled="isSaving"
            @click="nextStep"
          >
            {{ isSaving ? 'Menyimpan…' : 'Simpan & Lanjut' }}
          </Button>
        </div>
      </CardContent>
    </Card>
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
