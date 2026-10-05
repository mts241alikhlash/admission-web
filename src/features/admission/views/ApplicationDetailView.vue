<script setup lang="ts">
import { computed, onMounted, ref, useId, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Button } from '@mts241alikhlash/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mts241alikhlash/ui/card'
import { Badge } from '@mts241alikhlash/ui/badge'
import { Input } from '@mts241alikhlash/ui/input'
import { Label } from '@mts241alikhlash/ui/label'
import { Textarea } from '@mts241alikhlash/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@mts241alikhlash/ui/dialog'
import { ExternalLink } from '@lucide/vue'
import { useApplicationDetail } from '../composables/useApplicationDetail'
import { useFormOptions } from '../composables/useFormOptions'
import StatusBadge from '../components/StatusBadge.vue'
import {
  DOCUMENT_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  RELATION_LABELS,
} from '../types'
import {
  fileUrl,
  formatDate,
  formatDateTime,
  formatIDR,
  presentValue,
} from '../utils'

const route = useRoute()
const router = useRouter()
const applicationId = computed(() => String(route.params.id))

const {
  application,
  loading,
  error,
  acting,
  fetchDetail,
  approveDocument,
  rejectDocument,
  verifyPaymentApprove,
  rejectPayment,
  requestRevision,
  verifyApplication,
  accept,
  reject,
  enroll,
} = useApplicationDetail()

type DialogKind =
  | 'revision'
  | 'reject'
  | 'accept'
  | 'enroll'
  | 'reject-doc'
  | 'reject-payment'
  | null
const dialogKind = ref<DialogKind>(null)
const dialogNote = ref('')
const dialogDocId = ref<string | null>(null)
const enrollForm = ref({ nis: '', nisn: '' })
const dialogId = useId()

const status = computed(() => application.value?.status)

const documentRows = computed(() =>
  (application.value?.documentTypes ?? []).map((docType) => ({
    docType,
    doc:
      application.value?.documents?.find(
        (d) => d.documentTypeId === docType.id,
      ) ?? null,
  })),
)

const { load: loadFormOptions, nameOf } = useFormOptions()

onMounted(() => {
  void loadFormOptions().catch(() => undefined)
})

watch(applicationId, (id) => void fetchDetail(id), { immediate: true })

function openDialog(kind: DialogKind, docId?: string) {
  dialogKind.value = kind
  dialogNote.value = ''
  dialogDocId.value = docId ?? null
}

async function handleApproveDocument(docId: string) {
  await approveDocument(applicationId.value, docId)
}

async function handleVerifyPayment() {
  await verifyPaymentApprove(applicationId.value)
}

async function handleVerifyApplication() {
  await verifyApplication(applicationId.value)
}

async function confirmDialog() {
  if (dialogKind.value === 'revision') {
    if (!dialogNote.value.trim()) {
      toast.error('Catatan revisi wajib diisi.')
      return
    }
    const r = await requestRevision(applicationId.value, dialogNote.value)
    if (r.success) dialogKind.value = null
  } else if (dialogKind.value === 'reject') {
    if (!dialogNote.value.trim()) {
      toast.error('Alasan penolakan wajib diisi.')
      return
    }
    const r = await reject(applicationId.value, dialogNote.value)
    if (r.success) dialogKind.value = null
  } else if (dialogKind.value === 'accept') {
    const r = await accept(applicationId.value, dialogNote.value || undefined)
    if (r.success) dialogKind.value = null
  } else if (dialogKind.value === 'enroll') {
    if (!enrollForm.value.nis.trim() || !enrollForm.value.nisn.trim()) {
      toast.error('NIS dan NISN wajib diisi.')
      return
    }
    const r = await enroll(applicationId.value, {
      nis: enrollForm.value.nis.trim(),
      nisn: enrollForm.value.nisn.trim(),
    })
    if (r.success) dialogKind.value = null
  } else if (dialogKind.value === 'reject-doc' && dialogDocId.value) {
    if (!dialogNote.value.trim()) {
      toast.error('Alasan penolakan berkas wajib diisi.')
      return
    }
    const r = await rejectDocument(
      applicationId.value,
      dialogDocId.value,
      dialogNote.value,
    )
    if (r.success) dialogKind.value = null
  } else if (dialogKind.value === 'reject-payment') {
    if (!dialogNote.value.trim()) {
      toast.error('Alasan penolakan pembayaran wajib diisi.')
      return
    }
    const r = await rejectPayment(applicationId.value, dialogNote.value)
    if (r.success) dialogKind.value = null
  }
}

const dialogTitles: Record<Exclude<DialogKind, null>, string> = {
  revision: 'Minta Revisi',
  reject: 'Tolak Pendaftaran',
  accept: 'Terima Pendaftar',
  enroll: 'Proses Jadi Santri',
  'reject-doc': 'Tolak Berkas',
  'reject-payment': 'Tolak Bukti Pembayaran',
}
</script>

<template>
  <div
    v-if="loading"
    class="p-6 text-sm text-muted-foreground"
  >
    Memuat detail pendaftar…
  </div>

  <div
    v-else-if="error === 'not-found'"
    class="space-y-3 p-6"
  >
    <p class="text-sm text-muted-foreground">Pendaftar tidak ditemukan.</p>
    <Button
      variant="outline"
      @click="router.push('/admin/applicants')"
    >
      Kembali ke daftar pendaftar
    </Button>
  </div>

  <div
    v-else-if="error === 'load-failed'"
    class="space-y-3 p-6"
  >
    <p class="text-sm text-muted-foreground">Gagal memuat detail pendaftar.</p>
    <div class="flex flex-wrap gap-2">
      <Button
        variant="outline"
        @click="fetchDetail(applicationId)"
      >
        Coba lagi
      </Button>
      <Button
        variant="ghost"
        @click="router.push('/admin/applicants')"
      >
        Kembali ke daftar pendaftar
      </Button>
    </div>
  </div>

  <div
    v-else-if="application"
    class="space-y-6 p-4 sm:p-6"
  >
    <Card>
      <CardHeader>
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{{ application.fullName }}</CardTitle>
            <CardDescription>
              <span class="font-mono">
                {{ application.registrationNumber }}
              </span>
              · {{ presentValue(application.wave?.name) }} ·
              {{
                application.submittedAt
                  ? formatDateTime(application.submittedAt)
                  : 'Belum dikirim'
              }}
            </CardDescription>
            <p
              v-if="(application.duplicateNikCount ?? 0) > 0"
              class="mt-1 text-sm font-medium text-destructive"
            >
              ⚠ NIK sama dengan {{ application.duplicateNikCount }} pendaftar
              lain.
            </p>
          </div>
          <StatusBadge :status="application.status" />
        </div>
      </CardHeader>
      <CardContent>
        <div class="flex flex-wrap gap-2">
          <Button
            v-if="status === 'SUBMITTED'"
            variant="outline"
            :disabled="acting"
            @click="openDialog('revision')"
          >
            Minta Revisi
          </Button>
          <Button
            v-if="status === 'SUBMITTED'"
            :disabled="acting"
            @click="handleVerifyApplication"
          >
            Verifikasi Aplikasi
          </Button>
          <Button
            v-if="status === 'VERIFIED'"
            :disabled="acting"
            @click="openDialog('accept')"
          >
            Terima
          </Button>
          <Button
            v-if="status === 'SUBMITTED' || status === 'VERIFIED'"
            variant="destructive"
            :disabled="acting"
            @click="openDialog('reject')"
          >
            Tolak
          </Button>
          <Button
            v-if="status === 'ACCEPTED'"
            :disabled="acting"
            @click="openDialog('enroll')"
          >
            Proses Jadi Santri
          </Button>
        </div>
        <p
          v-if="application.revisionNote && status === 'REVISION_NEEDED'"
          class="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm"
        >
          Catatan revisi: {{ application.revisionNote }}
        </p>
        <p
          v-if="application.decisionNote"
          class="mt-3 rounded-md border p-3 text-sm"
        >
          Catatan keputusan: {{ application.decisionNote }}
        </p>
      </CardContent>
    </Card>

    <div class="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identitas</CardTitle>
        </CardHeader>
        <CardContent>
          <dl class="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt class="text-muted-foreground">Jenis kelamin</dt>
              <dd>
                {{
                  presentValue(
                    application.gender === 'MALE'
                      ? 'Laki-laki'
                      : application.gender === 'FEMALE'
                        ? 'Perempuan'
                        : null,
                  )
                }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Tempat lahir</dt>
              <dd class="break-words">
                {{ presentValue(application.birthPlace) }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Tanggal lahir</dt>
              <dd>{{ presentValue(formatDate(application.birthDate)) }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground">NIK</dt>
              <dd>{{ presentValue(application.nik) }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground">NISN</dt>
              <dd>{{ presentValue(application.nisn) }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Nama panggilan</dt>
              <dd>{{ presentValue(application.nickname) }}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Kontak</CardTitle></CardHeader>
        <CardContent>
          <dl class="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt class="text-muted-foreground">Email</dt>
              <dd class="break-all">{{ presentValue(application.email) }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground">No. HP</dt>
              <dd class="break-words">{{ presentValue(application.phone) }}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Alamat</CardTitle></CardHeader>
        <CardContent>
          <dl class="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt class="text-muted-foreground">Jalan</dt>
              <dd class="break-words">
                {{ presentValue(application.street) }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">RT</dt>
              <dd>{{ presentValue(application.rt) }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground">RW</dt>
              <dd>{{ presentValue(application.rw) }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Desa / Kelurahan</dt>
              <dd class="break-words">
                {{ presentValue(application.village) }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Kecamatan</dt>
              <dd class="break-words">
                {{ presentValue(application.district) }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Kota / Kabupaten</dt>
              <dd class="break-words">{{ presentValue(application.city) }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Provinsi</dt>
              <dd class="break-words">
                {{ presentValue(application.province) }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Kode pos</dt>
              <dd>{{ presentValue(application.postalCode) }}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Sekolah Asal</CardTitle></CardHeader>
        <CardContent>
          <dl class="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt class="text-muted-foreground">Nama sekolah</dt>
              <dd class="break-words">
                {{ presentValue(application.previousSchoolName) }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">NPSN</dt>
              <dd>{{ presentValue(application.previousSchoolNpsn) }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Alamat sekolah</dt>
              <dd class="break-words">
                {{ presentValue(application.previousSchoolAddress) }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Tahun lulus</dt>
              <dd>{{ presentValue(application.graduationYear) }}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Data Tambahan</CardTitle></CardHeader>
        <CardContent>
          <dl class="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt class="text-muted-foreground">Agama</dt>
              <dd>{{ presentValue(application.religion?.name) }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Urutan anak</dt>
              <dd>{{ presentValue(application.childOrder) }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Jumlah saudara</dt>
              <dd>{{ presentValue(application.siblingCount) }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Hobi</dt>
              <dd class="break-words">{{ presentValue(application.hobby) }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Cita-cita</dt>
              <dd class="break-words">
                {{ presentValue(application.aspiration) }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Yang membiayai sekolah</dt>
              <dd>
                {{
                  presentValue(
                    nameOf('financingSources', application.financingSourceId),
                  )
                }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Kebutuhan disabilitas</dt>
              <dd>
                {{
                  presentValue(
                    nameOf('disabilityTypes', application.disabilityTypeId),
                  )
                }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Kebutuhan khusus</dt>
              <dd>
                {{
                  presentValue(
                    nameOf('specialNeeds', application.specialNeedId),
                  )
                }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Status tempat tinggal</dt>
              <dd>
                {{
                  presentValue(
                    nameOf('studentResidences', application.studentResidenceId),
                  )
                }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Jarak tempuh</dt>
              <dd>
                {{
                  presentValue(
                    nameOf('travelDistances', application.travelDistanceId),
                  )
                }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Waktu tempuh</dt>
              <dd>
                {{
                  presentValue(nameOf('travelTimes', application.travelTimeId))
                }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Transportasi</dt>
              <dd>
                {{
                  presentValue(
                    nameOf('transportations', application.transportationId),
                  )
                }}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orang Tua / Wali</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3 text-sm">
          <p
            v-if="(application.parents ?? []).length === 0"
            class="text-muted-foreground"
          >
            Belum ada data orang tua atau wali.
          </p>
          <div
            v-for="parent in application.parents ?? []"
            :key="parent.relation"
            class="rounded-md border p-3"
          >
            <p class="font-medium">
              {{ RELATION_LABELS[parent.relation] }}
              <Badge
                v-if="parent.isPrimary"
                variant="secondary"
                class="ml-1"
              >
                Wali
              </Badge>
            </p>
            <dl class="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt class="text-muted-foreground">Nama</dt>
                <dd class="break-words">{{ presentValue(parent.name) }}</dd>
              </div>
              <div>
                <dt class="text-muted-foreground">NIK</dt>
                <dd>{{ presentValue(parent.nik) }}</dd>
              </div>
              <div>
                <dt class="text-muted-foreground">Tempat lahir</dt>
                <dd class="break-words">
                  {{ presentValue(parent.birthPlace) }}
                </dd>
              </div>
              <div>
                <dt class="text-muted-foreground">Tanggal lahir</dt>
                <dd>{{ presentValue(formatDate(parent.birthDate)) }}</dd>
              </div>
              <div>
                <dt class="text-muted-foreground">No. HP</dt>
                <dd>{{ presentValue(parent.phone) }}</dd>
              </div>
              <div>
                <dt class="text-muted-foreground">Status</dt>
                <dd>
                  {{
                    presentValue(
                      nameOf('parentLifeStatuses', parent.lifeStatusId),
                    )
                  }}
                </dd>
              </div>
              <div>
                <dt class="text-muted-foreground">Pendidikan</dt>
                <dd>
                  {{ presentValue(nameOf('educations', parent.educationId)) }}
                </dd>
              </div>
              <div>
                <dt class="text-muted-foreground">Pekerjaan</dt>
                <dd>
                  {{ presentValue(nameOf('occupations', parent.occupationId)) }}
                </dd>
              </div>
              <div>
                <dt class="text-muted-foreground">Penghasilan</dt>
                <dd>
                  {{
                    presentValue(nameOf('incomeRanges', parent.incomeRangeId))
                  }}
                </dd>
              </div>
              <div>
                <dt class="text-muted-foreground">Domisili</dt>
                <dd>
                  {{ presentValue(nameOf('domiciles', parent.domicileId)) }}
                </dd>
              </div>
              <div>
                <dt class="text-muted-foreground">Tempat tinggal</dt>
                <dd>
                  {{
                    presentValue(nameOf('parentResidences', parent.residenceId))
                  }}
                </dd>
              </div>
              <div>
                <dt class="text-muted-foreground">Alamat</dt>
                <dd class="break-words">
                  {{
                    parent.sameAddressAsStudent
                      ? 'Sama dengan alamat wali'
                      : presentValue(
                          [
                            parent.street,
                            parent.village,
                            parent.district,
                            parent.city,
                            parent.province,
                          ]
                            .filter(Boolean)
                            .join(', '),
                        )
                  }}
                </dd>
              </div>
            </dl>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Prestasi & Beasiswa</CardTitle>
      </CardHeader>
      <CardContent class="space-y-3 text-sm">
        <p
          v-if="(application.achievements ?? []).length === 0"
          class="text-muted-foreground"
        >
          Belum ada data prestasi.
        </p>
        <p
          v-if="(application.scholarships ?? []).length === 0"
          class="text-muted-foreground"
        >
          Belum ada data beasiswa.
        </p>
        <div
          v-for="row in application.achievements ?? []"
          :key="row.id"
          class="min-w-0 rounded-md border p-3"
        >
          <p class="font-medium">
            {{ presentValue(row.year) }} ·
            {{ presentValue(row.competitionName) }}
            <span class="text-muted-foreground">
              ({{
                presentValue(
                  nameOf('competitionFields', row.competitionFieldId),
                )
              }},
              {{
                presentValue(
                  nameOf('competitionLevels', row.competitionLevelId),
                )
              }})
            </span>
          </p>
          <p class="text-muted-foreground">
            Penyelenggara: {{ presentValue(row.organizer) }} · Peringkat:
            {{ presentValue(row.rank) }}
            <template v-if="row.file">
              ·
              <a
                :href="fileUrl(row.file.storageKey)"
                target="_blank"
                rel="noopener"
                class="break-all underline"
              >
                {{ presentValue(row.file.originalName) }}
              </a>
            </template>
          </p>
        </div>
        <div
          v-for="row in application.scholarships ?? []"
          :key="row.id"
          class="min-w-0 rounded-md border p-3"
        >
          <p class="font-medium">
            {{ presentValue(row.year) }} ·
            {{ presentValue(row.scholarshipName) }}
            <span class="text-muted-foreground">
              ({{
                presentValue(nameOf('scholarshipCategories', row.categoryId))
              }})
            </span>
          </p>
          <p
            v-if="row.kipNumber"
            class="text-muted-foreground"
          >
            No. KIP: {{ row.kipNumber }}
          </p>
          <p class="text-muted-foreground">
            Pemberi: {{ presentValue(row.providerName) }} ({{
              presentValue(
                nameOf('scholarshipProviderTypes', row.providerTypeId),
              )
            }}) · Jangka waktu: {{ presentValue(row.duration) }} · Jumlah:
            {{ row.amount == null ? 'Belum diisi' : formatIDR(row.amount) }}
            <template v-if="row.file">
              ·
              <a
                :href="fileUrl(row.file.storageKey)"
                target="_blank"
                rel="noopener"
                class="underline"
              >
                {{ presentValue(row.file.originalName) }}
              </a>
            </template>
          </p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Berkas</CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <p
          v-if="(application.documentTypes ?? []).length === 0"
          class="text-sm text-muted-foreground"
        >
          Belum ada jenis berkas.
        </p>
        <div
          v-for="row in documentRows"
          :key="row.docType.id"
          class="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
        >
          <div>
            <p class="font-medium">
              {{ row.docType.name }}
              <Badge
                v-if="!row.docType.isRequired"
                variant="secondary"
                class="ml-1"
              >
                Opsional
              </Badge>
            </p>
            <p
              v-if="row.doc"
              class="text-muted-foreground"
            >
              <span class="break-all">{{
                presentValue(row.doc.file?.originalName)
              }}</span>
              ·
              {{ DOCUMENT_STATUS_LABELS[row.doc.status] }}
              <span
                v-if="row.doc.note"
                class="text-destructive"
              >
                {{ row.doc.note }}
              </span>
            </p>
            <p
              v-else
              class="text-muted-foreground"
            >
              Belum diunggah
            </p>
          </div>
          <div class="flex items-center gap-2">
            <Button
              v-if="row.doc?.file"
              as-child
              variant="outline"
              size="sm"
            >
              <a
                :href="fileUrl(row.doc.file.storageKey)"
                target="_blank"
                rel="noopener"
                class="min-h-11"
              >
                <ExternalLink class="mr-1 h-3 w-3" />
                Lihat
              </a>
            </Button>
            <template v-if="row.doc && row.doc.status !== 'APPROVED'">
              <Button
                size="sm"
                :disabled="acting"
                @click="handleApproveDocument(row.doc.id)"
              >
                Setujui
              </Button>
              <Button
                variant="destructive"
                size="sm"
                :disabled="acting"
                @click="openDialog('reject-doc', row.doc.id)"
              >
                Tolak
              </Button>
            </template>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Pembayaran</CardTitle>
      </CardHeader>
      <CardContent class="text-sm">
        <div
          v-if="application.payment"
          class="flex flex-wrap items-center justify-between gap-3"
        >
          <div>
            <p>
              {{ formatIDR(application.payment.amount) }} ·
              <span class="font-medium">
                {{ PAYMENT_STATUS_LABELS[application.payment.status] }}
              </span>
            </p>
            <p
              v-if="application.payment.bankAccount"
              class="text-muted-foreground"
            >
              Ke rekening: {{ application.payment.bankAccount.bankName }}
              {{ application.payment.bankAccount.accountNumber }} a.n.
              {{ application.payment.bankAccount.accountHolder }}
            </p>
            <p class="text-muted-foreground">
              Bank: {{ presentValue(application.payment.bankName) }} · Pengirim:
              {{ presentValue(application.payment.senderAccountName) }} · Tgl:
              {{ presentValue(formatDate(application.payment.transferDate)) }}
            </p>
            <p
              v-if="application.payment.note"
              class="text-destructive"
            >
              Catatan: {{ application.payment.note }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <Button
              v-if="application.payment.proofFile"
              as-child
              variant="outline"
              size="sm"
            >
              <a
                :href="fileUrl(application.payment.proofFile.storageKey)"
                target="_blank"
                rel="noopener"
                class="min-h-11"
              >
                <ExternalLink class="mr-1 h-3 w-3" />
                Lihat Bukti
              </a>
            </Button>
            <template
              v-if="
                application.payment.status === 'PENDING' ||
                application.payment.status === 'REJECTED'
              "
            >
              <Button
                size="sm"
                :disabled="acting || application.payment.status === 'REJECTED'"
                @click="handleVerifyPayment"
              >
                Verifikasi
              </Button>
              <Button
                v-if="application.payment.status === 'PENDING'"
                variant="destructive"
                size="sm"
                :disabled="acting"
                @click="openDialog('reject-payment')"
              >
                Tolak
              </Button>
            </template>
          </div>
        </div>
        <p
          v-else
          class="text-muted-foreground"
        >
          Data pembayaran tidak tersedia.
        </p>
      </CardContent>
    </Card>

    <Dialog
      :open="dialogKind !== null"
      @update:open="(open) => !open && (dialogKind = null)"
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {{ dialogKind ? dialogTitles[dialogKind] : '' }}
          </DialogTitle>
          <DialogDescription v-if="dialogKind === 'enroll'">
            Masukkan NIS/NISN untuk memproses pendaftar menjadi santri. Akun
            pendaftar akan otomatis menjadi akun santri.
          </DialogDescription>
        </DialogHeader>

        <div
          v-if="dialogKind === 'enroll'"
          class="space-y-4"
        >
          <div class="space-y-2">
            <Label :for="`${dialogId}-nis`">NIS</Label>
            <Input
              :id="`${dialogId}-nis`"
              v-model="enrollForm.nis"
            />
          </div>
          <div class="space-y-2">
            <Label :for="`${dialogId}-nisn`">NISN</Label>
            <Input
              :id="`${dialogId}-nisn`"
              v-model="enrollForm.nisn"
            />
          </div>
        </div>
        <div
          v-else
          class="space-y-2"
        >
          <Label :for="`${dialogId}-note`">
            {{
              dialogKind === 'accept'
                ? 'Catatan (opsional)'
                : 'Catatan / Alasan'
            }}
          </Label>
          <Textarea
            :id="`${dialogId}-note`"
            v-model="dialogNote"
            rows="4"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            :disabled="acting"
            @click="dialogKind = null"
          >
            Batal
          </Button>
          <Button
            :disabled="acting"
            @click="confirmDialog"
          >
            {{ acting ? 'Memproses…' : 'Konfirmasi' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>

  <div
    v-else
    class="p-6"
  >
    <p class="text-sm text-muted-foreground">Data pendaftar belum tersedia.</p>
    <Button
      variant="outline"
      class="mt-3"
      @click="router.push('/admin/applicants')"
    >
      Kembali
    </Button>
  </div>
</template>
