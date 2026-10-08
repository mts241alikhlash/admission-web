<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbs } from '@mts241alikhlash/web-shared/composables/useBreadcrumbs'
import { BackButton } from '@mts241alikhlash/ui'
import { Badge } from '@mts241alikhlash/ui/badge'
import { Button } from '@mts241alikhlash/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@mts241alikhlash/ui/card'
import { Textarea } from '@mts241alikhlash/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@mts241alikhlash/ui/dialog'
import { Eye } from '@lucide/vue'
import { useRoleGuard } from '@/features/platform/auth'
import FilePreviewDialog from '../components/FilePreviewDialog.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { useFilePreview } from '../composables/useFilePreview'
import { documentReviewService } from '../services/documentReviewService'
import {
  DOCUMENT_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type AdmissionDocumentReview,
  type AdmissionDocumentReviewSlot,
  type AdmissionPaymentStatus,
  type AdmissionStatus,
} from '../types'
import { DOCUMENT_STATUS_BADGE_VARIANTS, formatDate } from '../utils'

const route = useRoute()
const router = useRouter()
const { can } = useRoleGuard()
const preview = useFilePreview()

const applicationId = computed(() => String(route.params.applicationId))
const review = ref<AdmissionDocumentReview | null>(null)
const loading = ref(true)
const error = ref<'not-found' | 'load-failed' | null>(null)
const acting = ref(false)

const rejectSlot = ref<AdmissionDocumentReviewSlot | null>(null)
const rejectNote = ref('')
const rejectError = ref('')
const sendOpen = ref(false)
const noteOpen = ref(false)
const dataNote = ref('')
const noteError = ref('')

const editable = computed(
  () => can('admission-documents.verify') && review.value?.readOnly === false,
)
const undecided = computed(
  () =>
    review.value?.slots.filter(
      (slot) =>
        slot.isRequired &&
        (!slot.document || slot.document.status === 'PENDING'),
    ).length ?? 0,
)
const rejected = computed(
  () =>
    review.value?.slots.filter((slot) => slot.document?.status === 'REJECTED')
      .length ?? 0,
)
const canSend = computed(() => editable.value && undecided.value === 0)

async function fetchReview(showLoading: boolean) {
  if (showLoading) loading.value = true
  const result = await documentReviewService.fetchReview(applicationId.value)
  loading.value = false
  if ('error' in result) {
    error.value = result.error
    review.value = null
    return
  }
  error.value = null
  review.value = result.review
}

async function approve(slot: AdmissionDocumentReviewSlot) {
  if (!slot.document) return
  acting.value = true
  const result = await documentReviewService.decide(
    applicationId.value,
    slot.document.id,
    'APPROVED',
  )
  acting.value = false
  if (result.success) await fetchReview(false)
}

function openReject(slot: AdmissionDocumentReviewSlot) {
  rejectSlot.value = slot
  rejectNote.value = ''
  rejectError.value = ''
}

async function submitReject() {
  const slot = rejectSlot.value
  if (!slot?.document) return
  const note = rejectNote.value.trim()
  if (!note) {
    rejectError.value = 'Alasan wajib diisi'
    return
  }
  acting.value = true
  const result = await documentReviewService.decide(
    applicationId.value,
    slot.document.id,
    'REJECTED',
    note,
  )
  acting.value = false
  if (!result.success) return
  rejectSlot.value = null
  await fetchReview(false)
}

async function send(note?: string) {
  acting.value = true
  const result = await documentReviewService.send(applicationId.value, note)
  acting.value = false
  if (result.success) {
    sendOpen.value = false
    noteOpen.value = false
    await router.push('/admin/document-reviews')
    return
  }
  await fetchReview(false)
}

function openNote() {
  dataNote.value = ''
  noteError.value = ''
  noteOpen.value = true
}

async function submitNote() {
  const note = dataNote.value.trim()
  if (!note) {
    noteError.value = 'Catatan wajib diisi'
    return
  }
  await send(note)
}

useBreadcrumbs(() => {
  const name = review.value?.applicantName
  if (!name) return null
  const trail = route.meta.breadcrumbs ?? []
  return [...trail.slice(0, -1), { title: name }]
})

watch(applicationId, () => fetchReview(true))
onMounted(() => fetchReview(true))
</script>

<template>
  <div class="p-4 sm:p-6">
    <p
      v-if="loading"
      class="text-sm text-muted-foreground"
    >
      Memuat berkas pendaftar…
    </p>

    <div
      v-else-if="error"
      role="alert"
      class="space-y-3 rounded-md border p-4"
    >
      <p class="text-sm">
        {{
          error === 'not-found'
            ? 'Pendaftar tidak ditemukan.'
            : 'Gagal memuat berkas pendaftar.'
        }}
      </p>
      <Button
        v-if="error === 'load-failed'"
        variant="outline"
        class="min-h-11"
        @click="fetchReview(true)"
      >
        Coba lagi
      </Button>
      <Button
        v-else
        variant="outline"
        class="min-h-11"
        @click="router.push('/admin/document-reviews')"
      >
        Kembali ke Verifikasi Berkas
      </Button>
    </div>

    <Card
      v-else-if="review"
      class="overflow-hidden rounded-2xl shadow-sm shadow-black/5 ring-1 ring-black/4"
    >
      <CardHeader class="border-b px-4 py-4 sm:px-6 sm:py-5">
        <div class="flex min-w-0 items-center gap-3">
          <BackButton
            label="Kembali ke Verifikasi Berkas"
            @click="router.push('/admin/document-reviews')"
          />
          <CardTitle class="text-xl font-bold tracking-tight">
            Periksa Berkas
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent class="space-y-4 px-4 py-5 sm:px-6">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="break-words text-base font-semibold">
              {{ review.applicantName }}
            </p>
            <p class="text-sm text-muted-foreground">
              {{ review.registrationNumber }} · {{ review.waveName }}
              <template v-if="review.submittedAt">
                · Dikirim {{ formatDate(review.submittedAt) }}
              </template>
            </p>
            <p
              v-if="review.paymentStatus"
              class="text-sm text-muted-foreground"
            >
              Pembayaran:
              {{
                PAYMENT_STATUS_LABELS[
                  review.paymentStatus as AdmissionPaymentStatus
                ]
              }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <StatusBadge :status="review.status as AdmissionStatus" />
            <Button
              variant="outline"
              size="sm"
              data-test="open-detail"
              @click="router.push(`/admin/applicants/${review.applicationId}`)"
            >
              Lihat detail pendaftar
            </Button>
          </div>
        </div>

        <p
          v-if="review.readOnly"
          class="rounded-md border bg-muted/40 p-3 text-sm"
        >
          Pendaftaran ini sudah tidak menunggu pemeriksaan, sehingga keputusan
          berkas tidak bisa diubah.
        </p>
        <p
          v-if="review.revisionNote"
          class="whitespace-pre-line rounded-md border p-3 text-sm"
        >
          {{ review.revisionNote }}
        </p>

        <ul class="space-y-2">
          <li
            v-for="item in review.slots"
            :key="item.documentTypeId"
            data-test="slot"
            class="min-w-0 space-y-2 rounded-lg border p-4 text-sm"
          >
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="flex min-w-0 flex-wrap items-center gap-2">
                <p class="font-semibold">{{ item.name }}</p>
                <Badge variant="outline">
                  {{ item.isRequired ? 'Wajib' : 'Opsional' }}
                </Badge>
              </div>
              <Badge
                v-if="item.document"
                :variant="DOCUMENT_STATUS_BADGE_VARIANTS[item.document.status]"
              >
                {{ DOCUMENT_STATUS_LABELS[item.document.status] }}
              </Badge>
              <Badge
                v-else
                variant="secondary"
                >Belum diunggah</Badge
              >
            </div>
            <button
              v-if="item.document"
              type="button"
              data-test="open-file"
              class="inline-flex min-h-11 items-center gap-1 break-all text-left text-primary underline-offset-4 hover:underline sm:min-h-0"
              @click="preview.show(item.document.file)"
            >
              {{ item.document.file.originalName }}
              <Eye class="size-3 shrink-0" />
            </button>
            <p
              v-if="item.document?.note"
              class="text-destructive"
            >
              Catatan: {{ item.document.note }}
            </p>
            <div
              v-if="editable && item.document"
              class="flex flex-wrap gap-2"
            >
              <Button
                v-if="item.document.status !== 'REJECTED'"
                variant="destructive"
                class="min-h-11 flex-1 sm:min-h-0 sm:flex-none"
                data-test="reject"
                :disabled="acting"
                @click="openReject(item)"
              >
                Tolak
              </Button>
              <Button
                v-if="item.document.status !== 'APPROVED'"
                class="min-h-11 flex-1 sm:min-h-0 sm:flex-none"
                data-test="approve"
                :disabled="acting"
                @click="approve(item)"
              >
                Setujui
              </Button>
            </div>
          </li>
        </ul>

        <div
          v-if="editable"
          class="space-y-2 border-t pt-4"
        >
          <p
            v-if="undecided > 0"
            class="text-sm text-muted-foreground"
          >
            {{ undecided }} berkas wajib belum diputuskan atau belum diunggah.
            Pakai Minta perbaikan data untuk meminta berkas atau memperbaiki
            data.
          </p>
          <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              class="min-h-11 sm:min-h-0"
              data-test="request-data-fix"
              :disabled="acting"
              @click="openNote"
            >
              Minta perbaikan data
            </Button>
            <Button
              class="min-h-11 sm:min-h-0"
              data-test="send"
              :disabled="acting || !canSend"
              @click="sendOpen = true"
            >
              Kirim hasil
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <Dialog
      :open="rejectSlot !== null"
      @update:open="(open) => !open && (rejectSlot = null)"
    >
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tolak {{ rejectSlot?.name }}</DialogTitle>
          <DialogDescription>
            Alasan disimpan dan dikirim ke pendaftar bersama hasil pemeriksaan.
          </DialogDescription>
        </DialogHeader>
        <form
          data-test="reject-form"
          class="space-y-2"
          @submit.prevent="submitReject"
        >
          <Textarea
            v-model="rejectNote"
            rows="3"
            maxlength="500"
            aria-label="Alasan penolakan"
            placeholder="Alasan penolakan"
          />
          <p
            v-if="rejectError"
            class="text-sm text-destructive"
          >
            {{ rejectError }}
          </p>
          <DialogFooter class="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              :disabled="acting"
              @click="rejectSlot = null"
            >
              Batal
            </Button>
            <Button
              type="submit"
              :disabled="acting"
            >
              {{ acting ? 'Menyimpan…' : 'Simpan' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog
      :open="sendOpen"
      @update:open="(open) => (sendOpen = open)"
    >
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kirim hasil pemeriksaan?</DialogTitle>
          <DialogDescription data-test="send-confirm">
            Pendaftar diberi tahu satu kali dan keputusan berkas tidak bisa
            diubah lagi.
            <template v-if="rejected > 0">
              {{ rejected }} berkas ditolak, formulir dikembalikan ke pendaftar.
            </template>
            <template v-else>
              Semua berkas disetujui; pendaftaran terverifikasi otomatis setelah
              pembayaran terverifikasi.
            </template>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            :disabled="acting"
            @click="sendOpen = false"
          >
            Batal
          </Button>
          <Button
            type="button"
            data-test="confirm-send"
            :disabled="acting"
            @click="send()"
          >
            {{ acting ? 'Mengirim…' : 'Kirim hasil' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog
      :open="noteOpen"
      @update:open="(open) => (noteOpen = open)"
    >
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Minta perbaikan data</DialogTitle>
          <DialogDescription>
            Formulir dikembalikan ke pendaftar dengan catatan ini, bersama
            berkas yang ditolak.
          </DialogDescription>
        </DialogHeader>
        <form
          data-test="note-form"
          class="space-y-2"
          @submit.prevent="submitNote"
        >
          <Textarea
            v-model="dataNote"
            rows="4"
            maxlength="2000"
            aria-label="Catatan perbaikan"
            placeholder="Contoh: NIK ayah salah, mohon unggah ulang KK"
          />
          <p
            v-if="noteError"
            class="text-sm text-destructive"
          >
            {{ noteError }}
          </p>
          <DialogFooter class="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              :disabled="acting"
              @click="noteOpen = false"
            >
              Batal
            </Button>
            <Button
              type="submit"
              :disabled="acting"
            >
              {{ acting ? 'Mengirim…' : 'Kirim' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <FilePreviewDialog
      v-model:open="preview.open.value"
      :file="preview.file.value"
    />
  </div>
</template>
