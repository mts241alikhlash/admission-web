<script setup lang="ts">
import { useBreadcrumbs } from '@mts241alikhlash/web-shared/composables/useBreadcrumbs'
import { computed, h, onMounted, ref, useId, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import type { ColumnDef } from '@tanstack/vue-table'
import { DataTable, BackButton } from '@mts241alikhlash/ui'
import { Badge } from '@mts241alikhlash/ui/badge'
import { Button } from '@mts241alikhlash/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@mts241alikhlash/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@mts241alikhlash/ui/tabs'
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
import { ExternalLink, Info, SquarePen, TriangleAlert } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@mts241alikhlash/ui/alert'
import { useApplicationDetail } from '../composables/useApplicationDetail'
import { useFormOptions } from '../composables/useFormOptions'
import DetailItem from '../components/DetailItem.vue'
import { addressOwnerOf } from '../schemas/applicationFormSchemas'
import {
  DOCUMENT_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  RELATION_LABELS,
  STATUS_LABELS,
} from '../types'
import type {
  AdmissionApplicationParent,
  AdmissionDocument,
  AdmissionDocumentType,
} from '../types'
import {
  DOCUMENT_STATUS_BADGE_VARIANTS,
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
const activeTab = ref('personal')
const tabClass =
  'min-h-11 flex-none rounded-none border-0 border-b-2 border-transparent px-3 text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none dark:data-[state=active]:bg-transparent'

const status = computed(() => application.value?.status)
const editable = computed(
  () => status.value === 'DRAFT' || status.value === 'REVISION_NEEDED',
)
const hasActions = computed(
  () =>
    status.value === 'SUBMITTED' ||
    status.value === 'VERIFIED' ||
    status.value === 'ACCEPTED',
)

const documentRows = computed(() =>
  (application.value?.documentTypes ?? []).map((docType) => ({
    docType,
    doc:
      application.value?.documents?.find(
        (d) => d.documentTypeId === docType.id,
      ) ?? null,
  })),
)

interface DocumentRow {
  docType: AdmissionDocumentType
  doc: AdmissionDocument | null
}

const documentColumns = computed<ColumnDef<DocumentRow>[]>(() => [
  {
    id: 'name',
    header: 'Jenis Dokumen',
    cell: ({ row }) =>
      h('span', [
        row.original.docType.name,
        row.original.docType.isRequired
          ? h(
              'span',
              { class: 'text-destructive', 'aria-label': 'wajib' },
              ' *',
            )
          : null,
      ]),
  },
  {
    id: 'file',
    header: 'Berkas',
    cell: ({ row }) => {
      const { doc } = row.original
      return h('div', { class: 'min-w-0 space-y-1' }, [
        doc?.file
          ? h(
              'a',
              {
                href: fileUrl(doc.file.storageKey),
                target: '_blank',
                rel: 'noopener',
                class:
                  'inline-flex items-center gap-1 break-all text-primary underline-offset-4 hover:underline',
              },
              [
                presentValue(doc.file.originalName),
                h(ExternalLink, { class: 'size-3 shrink-0' }),
              ],
            )
          : h('span', { class: 'text-muted-foreground' }, '-'),
        doc?.note
          ? h(
              'p',
              { class: 'text-sm text-destructive' },
              `Catatan: ${doc.note}`,
            )
          : null,
      ])
    },
  },
  {
    id: 'status',
    header: 'Status',
    meta: { align: 'center' },
    cell: ({ row }) => {
      const { doc } = row.original
      return h(
        Badge,
        {
          variant: doc?.file
            ? DOCUMENT_STATUS_BADGE_VARIANTS[doc.status]
            : 'outline',
        },
        () =>
          doc?.file ? DOCUMENT_STATUS_LABELS[doc.status] : 'Belum diunggah',
      )
    },
  },
  ...(documentRows.value.some(({ doc }) => needsReview(doc))
    ? [actionColumn]
    : []),
])

function needsReview(doc: AdmissionDocument | null): doc is AdmissionDocument {
  return !!doc?.file && doc.status !== 'APPROVED'
}

const actionColumn: ColumnDef<DocumentRow> = {
  id: 'actions',
  header: 'Aksi',
  meta: { align: 'center' },
  cell: ({ row }) => {
    const { doc } = row.original
    if (!needsReview(doc)) return null
    return h('div', { class: 'flex justify-center gap-2' }, [
      h(
        Button,
        {
          size: 'sm',
          disabled: acting.value,
          onClick: () => handleApproveDocument(doc.id),
        },
        () => 'Setujui',
      ),
      h(
        Button,
        {
          variant: 'destructive',
          size: 'sm',
          disabled: acting.value,
          onClick: () => openDialog('reject-doc', doc.id),
        },
        () => 'Tolak',
      ),
    ])
  },
}

const { load: loadFormOptions, nameOf, listOf } = useFormOptions()

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Laki-laki',
  FEMALE: 'Perempuan',
}

function placeAndDate(place?: string | null, date?: string | null) {
  return (
    [place?.trim(), date ? formatDate(date) : ''].filter(Boolean).join(', ') ||
    null
  )
}

function rtRw(rt?: string | null, rw?: string | null) {
  return rt || rw ? `${rt || '-'}/${rw || '-'}` : null
}

function fullAddress(parent: AdmissionApplicationParent) {
  const neighbourhood = rtRw(parent.rt, parent.rw)
  return (
    [
      parent.street,
      neighbourhood && `RT/RW ${neighbourhood}`,
      parent.village,
      parent.district,
      parent.city,
      parent.province,
      parent.postalCode,
    ]
      .filter(Boolean)
      .join(', ') || null
  )
}

const addressOwner = computed(() =>
  addressOwnerOf(
    (application.value?.parents ?? []).map((parent) => ({
      ...parent,
      lifeStatusId: parent.lifeStatusId ?? '',
    })),
    listOf('parentLifeStatuses'),
  ),
)

function parentTitle(parent: AdmissionApplicationParent) {
  return parent.relation === 'GUARDIAN'
    ? 'Wali Santri'
    : `${RELATION_LABELS[parent.relation]} Kandung`
}

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

useBreadcrumbs(() => {
  const name = application.value?.fullName
  if (!name) return null
  const trail = route.meta.breadcrumbs ?? []
  return [...trail.slice(0, -1), { title: name }]
})
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
    <Card
      class="gap-0 overflow-hidden rounded-2xl py-0 shadow-sm shadow-black/5 ring-1 ring-black/4"
    >
      <CardHeader
        class="flex flex-col items-start justify-between gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:px-6 sm:py-5"
      >
        <div class="flex min-w-0 items-center gap-3">
          <BackButton
            label="Kembali ke daftar pendaftar"
            @click="router.push('/admin/applicants')"
          />
          <CardTitle class="text-xl font-bold tracking-tight">
            Detail Pendaftar
          </CardTitle>
        </div>
        <Button
          v-if="editable"
          class="min-h-11 w-full sm:min-h-0 sm:w-auto"
          @click="
            router.push({
              name: 'admin-application-form',
              params: { id: applicationId },
            })
          "
        >
          <SquarePen class="mr-1.5 size-4" />
          Lengkapi Data
        </Button>
      </CardHeader>
      <CardContent class="space-y-4 px-4 py-5 sm:px-6">
        <div
          v-if="hasActions"
          class="flex flex-wrap gap-2 sm:justify-end"
        >
          <Button
            v-if="status === 'SUBMITTED'"
            variant="outline"
            :disabled="acting"
            @click="openDialog('revision')"
          >
            Minta Revisi
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
            v-if="status === 'ACCEPTED'"
            :disabled="acting"
            @click="openDialog('enroll')"
          >
            Proses Jadi Santri
          </Button>
        </div>
        <Alert
          v-if="(application.duplicateNikCount ?? 0) > 0"
          variant="destructive"
        >
          <TriangleAlert />
          <AlertTitle>NIK ganda</AlertTitle>
          <AlertDescription>
            NIK ini sama dengan {{ application.duplicateNikCount }} pendaftar
            lain.
          </AlertDescription>
        </Alert>
        <Alert
          v-if="application.revisionNote && status === 'REVISION_NEEDED'"
          variant="destructive"
        >
          <TriangleAlert />
          <AlertTitle>Catatan revisi</AlertTitle>
          <AlertDescription>{{ application.revisionNote }}</AlertDescription>
        </Alert>
        <Alert v-if="application.decisionNote">
          <Info />
          <AlertTitle>Catatan keputusan</AlertTitle>
          <AlertDescription>{{ application.decisionNote }}</AlertDescription>
        </Alert>

        <Tabs
          v-model="activeTab"
          class="min-w-0 gap-0"
        >
          <div
            class="-mx-4 overflow-x-auto overflow-y-hidden border-b px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
          >
            <TabsList
              class="-mb-px h-auto w-max gap-0 rounded-none bg-transparent p-0"
            >
              <TabsTrigger
                value="personal"
                :class="tabClass"
              >
                Data Diri
              </TabsTrigger>
              <TabsTrigger
                value="parents"
                :class="tabClass"
              >
                Orang Tua/Wali
              </TabsTrigger>
              <TabsTrigger
                value="address"
                :class="tabClass"
              >
                Alamat
              </TabsTrigger>
              <TabsTrigger
                value="school"
                :class="tabClass"
              >
                Sekolah Asal
              </TabsTrigger>
              <TabsTrigger
                value="achievements"
                :class="tabClass"
              >
                Prestasi & Beasiswa
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                :class="tabClass"
              >
                Berkas
              </TabsTrigger>
              <TabsTrigger
                value="payment"
                :class="tabClass"
              >
                Pembayaran
              </TabsTrigger>
            </TabsList>
          </div>
          <p class="pt-2 text-xs text-muted-foreground sm:hidden">
            Geser untuk melihat bagian lain
          </p>

          <TabsContent
            value="personal"
            class="space-y-6 pt-5 text-sm"
          >
            <section class="space-y-3">
              <h3 class="font-semibold">Pendaftaran</h3>
              <dl class="grid gap-x-8 gap-y-3 xl:grid-cols-2">
                <DetailItem
                  label="No. Pendaftaran"
                  :value="application.registrationNumber"
                  wrap="all"
                />
                <DetailItem
                  label="Gelombang"
                  :value="application.wave?.name"
                />
                <DetailItem
                  label="Status"
                  :value="STATUS_LABELS[application.status]"
                />
                <DetailItem
                  label="Dikirim"
                  :value="
                    application.submittedAt
                      ? formatDateTime(application.submittedAt)
                      : 'Belum dikirim'
                  "
                />
              </dl>
            </section>
            <section class="space-y-3">
              <h3 class="font-semibold">Identitas</h3>
              <dl class="grid gap-x-8 gap-y-3 xl:grid-cols-2">
                <DetailItem
                  label="Nama Lengkap"
                  :value="application.fullName"
                />
                <DetailItem
                  label="Nama Panggilan"
                  :value="application.nickname"
                />
                <DetailItem
                  label="Tempat, Tanggal Lahir"
                  :value="
                    placeAndDate(application.birthPlace, application.birthDate)
                  "
                />
                <DetailItem
                  label="Jenis Kelamin"
                  :value="
                    application.gender
                      ? GENDER_LABELS[application.gender]
                      : null
                  "
                />
                <DetailItem
                  label="NIK"
                  :value="application.nik"
                />
                <DetailItem
                  label="NISN"
                  :value="application.nisn"
                />
                <DetailItem
                  label="Agama"
                  :value="application.religion?.name"
                />
                <DetailItem
                  label="Anak ke-"
                  :value="application.childOrder"
                />
                <DetailItem
                  label="Jumlah Saudara"
                  :value="application.siblingCount"
                />
                <DetailItem
                  label="Email"
                  :value="application.email"
                  wrap="all"
                />
                <DetailItem
                  label="No. HP"
                  :value="application.phone"
                />
                <DetailItem
                  label="Hobi"
                  :value="application.hobby"
                />
                <DetailItem
                  label="Cita-cita"
                  :value="application.aspiration"
                />
                <DetailItem
                  label="Yang Membiayai Sekolah"
                  :value="
                    nameOf('financingSources', application.financingSourceId)
                  "
                />
                <DetailItem
                  label="Kebutuhan Disabilitas"
                  :value="
                    nameOf('disabilityTypes', application.disabilityTypeId)
                  "
                />
                <DetailItem
                  label="Kebutuhan Khusus"
                  :value="nameOf('specialNeeds', application.specialNeedId)"
                />
              </dl>
            </section>
          </TabsContent>

          <TabsContent
            value="parents"
            class="space-y-3 pt-5 text-sm"
          >
            <p
              v-if="(application.parents ?? []).length === 0"
              class="text-muted-foreground"
            >
              Belum ada data orang tua atau wali.
            </p>
            <section
              v-for="parent in application.parents ?? []"
              :key="parent.relation"
              class="rounded-md border p-4"
            >
              <h3 class="flex flex-wrap items-center gap-2 font-semibold">
                {{ parentTitle(parent) }}
                <Badge
                  v-if="parent.isPrimary"
                  variant="secondary"
                >
                  Wali
                </Badge>
              </h3>
              <dl class="mt-3 grid gap-x-8 gap-y-3 xl:grid-cols-2">
                <DetailItem
                  label="Nama Lengkap"
                  :value="parent.name"
                />
                <DetailItem
                  label="NIK"
                  :value="parent.nik"
                />
                <DetailItem
                  label="Tempat, Tanggal Lahir"
                  :value="placeAndDate(parent.birthPlace, parent.birthDate)"
                />
                <DetailItem
                  label="No. HP"
                  :value="parent.phone"
                />
                <DetailItem
                  label="Status Hidup"
                  :value="nameOf('parentLifeStatuses', parent.lifeStatusId)"
                />
                <DetailItem
                  label="Pendidikan"
                  :value="nameOf('educations', parent.educationId)"
                />
                <DetailItem
                  label="Pekerjaan"
                  :value="nameOf('occupations', parent.occupationId)"
                />
                <DetailItem
                  label="Penghasilan"
                  :value="nameOf('incomeRanges', parent.incomeRangeId)"
                />
                <DetailItem
                  label="Domisili"
                  :value="nameOf('domiciles', parent.domicileId)"
                />
                <DetailItem
                  label="Status Tempat Tinggal"
                  :value="nameOf('parentResidences', parent.residenceId)"
                />
                <DetailItem
                  label="Alamat"
                  :value="
                    parent.sameAddressAsStudent &&
                    parent.relation !== addressOwner
                      ? `Sama dengan alamat ${RELATION_LABELS[addressOwner].toLowerCase()}`
                      : fullAddress(parent)
                  "
                />
              </dl>
            </section>
          </TabsContent>

          <TabsContent
            value="address"
            class="pt-5"
          >
            <dl class="grid gap-x-8 gap-y-3 text-sm xl:grid-cols-2">
              <DetailItem
                label="Alamat (Jalan)"
                :value="application.street"
              />
              <DetailItem
                label="RT/RW"
                :value="rtRw(application.rt, application.rw)"
              />
              <DetailItem
                label="Desa/Kelurahan"
                :value="application.village"
              />
              <DetailItem
                label="Kecamatan"
                :value="application.district"
              />
              <DetailItem
                label="Kota/Kabupaten"
                :value="application.city"
              />
              <DetailItem
                label="Provinsi"
                :value="application.province"
              />
              <DetailItem
                label="Kode Pos"
                :value="application.postalCode"
              />
              <DetailItem
                label="Status Tempat Tinggal"
                :value="
                  nameOf('studentResidences', application.studentResidenceId)
                "
              />
              <DetailItem
                label="Transportasi ke Madrasah"
                :value="nameOf('transportations', application.transportationId)"
              />
              <DetailItem
                label="Jarak ke Madrasah"
                :value="nameOf('travelDistances', application.travelDistanceId)"
              />
              <DetailItem
                label="Waktu Tempuh ke Madrasah"
                :value="nameOf('travelTimes', application.travelTimeId)"
              />
            </dl>
          </TabsContent>

          <TabsContent
            value="school"
            class="pt-5"
          >
            <dl class="grid gap-x-8 gap-y-3 text-sm xl:grid-cols-2">
              <DetailItem
                label="Nama Sekolah Asal"
                :value="application.previousSchoolName"
              />
              <DetailItem
                label="NPSN"
                :value="application.previousSchoolNpsn"
              />
              <DetailItem
                label="Alamat Sekolah"
                :value="application.previousSchoolAddress"
              />
              <DetailItem
                label="Tahun Lulus"
                :value="application.graduationYear"
              />
            </dl>
          </TabsContent>

          <TabsContent
            value="achievements"
            class="space-y-6 pt-5 text-sm"
          >
            <section class="space-y-3">
              <h3 class="font-semibold">Prestasi</h3>
              <p
                v-if="(application.achievements ?? []).length === 0"
                class="text-muted-foreground"
              >
                Belum ada data prestasi.
              </p>
              <article
                v-for="row in application.achievements ?? []"
                :key="row.id"
                class="min-w-0 rounded-md border p-4"
              >
                <h4 class="break-words font-medium">
                  {{ presentValue(row.competitionName) }}
                </h4>
                <dl class="mt-3 grid gap-x-8 gap-y-3 xl:grid-cols-2">
                  <DetailItem
                    label="Tahun"
                    :value="row.year"
                  />
                  <DetailItem
                    label="Bidang"
                    :value="nameOf('competitionFields', row.competitionFieldId)"
                  />
                  <DetailItem
                    label="Tingkat"
                    :value="nameOf('competitionLevels', row.competitionLevelId)"
                  />
                  <DetailItem
                    label="Peringkat"
                    :value="row.rank"
                  />
                  <DetailItem
                    label="Penyelenggara"
                    :value="row.organizer"
                  />
                  <DetailItem
                    label="Lampiran"
                    :value="row.file?.originalName"
                  >
                    <a
                      v-if="row.file"
                      :href="fileUrl(row.file.storageKey)"
                      target="_blank"
                      rel="noopener"
                      class="inline-flex items-center gap-1 break-all text-primary underline-offset-4 hover:underline"
                    >
                      {{ presentValue(row.file.originalName) }}
                      <ExternalLink class="size-3 shrink-0" />
                    </a>
                    <span
                      v-else
                      class="text-muted-foreground"
                    >
                      Tidak ada
                    </span>
                  </DetailItem>
                </dl>
              </article>
            </section>

            <section class="space-y-3">
              <h3 class="font-semibold">Beasiswa & Bantuan</h3>
              <p
                v-if="(application.scholarships ?? []).length === 0"
                class="text-muted-foreground"
              >
                Belum ada data beasiswa.
              </p>
              <article
                v-for="row in application.scholarships ?? []"
                :key="row.id"
                class="min-w-0 rounded-md border p-4"
              >
                <h4 class="break-words font-medium">
                  {{ presentValue(row.scholarshipName) }}
                </h4>
                <dl class="mt-3 grid gap-x-8 gap-y-3 xl:grid-cols-2">
                  <DetailItem
                    label="Tahun"
                    :value="row.year"
                  />
                  <DetailItem
                    label="Kategori"
                    :value="nameOf('scholarshipCategories', row.categoryId)"
                  />
                  <DetailItem
                    label="Instansi Pemberi"
                    :value="row.providerName"
                  />
                  <DetailItem
                    label="Jenis Instansi"
                    :value="
                      nameOf('scholarshipProviderTypes', row.providerTypeId)
                    "
                  />
                  <DetailItem
                    label="Jangka Waktu"
                    :value="row.duration"
                  />
                  <DetailItem
                    label="Jumlah"
                    :value="row.amount == null ? null : formatIDR(row.amount)"
                  />
                  <DetailItem
                    v-if="row.kipNumber"
                    label="No. KIP"
                    :value="row.kipNumber"
                  />
                  <DetailItem
                    label="Lampiran"
                    :value="row.file?.originalName"
                  >
                    <a
                      v-if="row.file"
                      :href="fileUrl(row.file.storageKey)"
                      target="_blank"
                      rel="noopener"
                      class="inline-flex items-center gap-1 break-all text-primary underline-offset-4 hover:underline"
                    >
                      {{ presentValue(row.file.originalName) }}
                      <ExternalLink class="size-3 shrink-0" />
                    </a>
                    <span
                      v-else
                      class="text-muted-foreground"
                    >
                      Tidak ada
                    </span>
                  </DetailItem>
                </dl>
              </article>
            </section>
          </TabsContent>

          <TabsContent
            value="documents"
            class="pt-5"
          >
            <p
              v-if="documentRows.length === 0"
              class="text-sm text-muted-foreground"
            >
              Belum ada jenis berkas.
            </p>
            <template v-else>
              <DataTable
                class="hidden md:block"
                :columns="documentColumns"
                :data="documentRows"
                item-label="dokumen"
                hide-per-page
                hide-pagination
                :page-size="Math.max(1, documentRows.length)"
              />
              <ul
                data-test="mobile-documents"
                class="divide-y rounded-lg border md:hidden"
              >
                <li
                  v-for="{ docType, doc } in documentRows"
                  :key="docType.id"
                  class="min-w-0 space-y-3 p-4 text-sm"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="break-words font-medium">
                        {{ docType.name
                        }}<span
                          v-if="docType.isRequired"
                          class="text-destructive"
                          aria-label="wajib"
                        >
                          *</span
                        >
                      </p>
                    </div>
                    <Badge
                      class="shrink-0"
                      :variant="
                        doc?.file
                          ? DOCUMENT_STATUS_BADGE_VARIANTS[doc.status]
                          : 'outline'
                      "
                    >
                      {{
                        doc?.file
                          ? DOCUMENT_STATUS_LABELS[doc.status]
                          : 'Belum diunggah'
                      }}
                    </Badge>
                  </div>
                  <a
                    v-if="doc?.file"
                    :href="fileUrl(doc.file.storageKey)"
                    target="_blank"
                    rel="noopener"
                    class="inline-flex items-center gap-1 break-all text-primary underline-offset-4 hover:underline"
                  >
                    {{ presentValue(doc.file.originalName) }}
                    <ExternalLink class="size-3 shrink-0" />
                  </a>
                  <p
                    v-if="doc?.note"
                    class="text-destructive"
                  >
                    Catatan: {{ doc.note }}
                  </p>
                  <div
                    v-if="needsReview(doc)"
                    class="grid grid-cols-2 gap-2"
                  >
                    <Button
                      variant="destructive"
                      class="min-h-11"
                      :disabled="acting"
                      @click="openDialog('reject-doc', doc.id)"
                    >
                      Tolak
                    </Button>
                    <Button
                      class="min-h-11"
                      :disabled="acting"
                      @click="handleApproveDocument(doc.id)"
                    >
                      Setujui
                    </Button>
                  </div>
                </li>
              </ul>
            </template>
          </TabsContent>

          <TabsContent
            value="payment"
            class="space-y-4 pt-5 text-sm"
          >
            <Alert
              v-if="application.waveIsFull"
              variant="destructive"
            >
              <TriangleAlert />
              <AlertTitle>Gelombang penuh</AlertTitle>
              <AlertDescription>
                Belum ada gelombang tujuan; pembayaran pendaftar ini belum dapat
                diverifikasi.
              </AlertDescription>
            </Alert>
            <template v-if="application.payment">
              <dl class="grid gap-x-8 gap-y-3 xl:grid-cols-2">
                <DetailItem
                  label="Status"
                  :value="PAYMENT_STATUS_LABELS[application.payment.status]"
                />
                <DetailItem
                  label="Nominal"
                  :value="formatIDR(application.payment.amount)"
                />
                <DetailItem
                  label="Rekening Tujuan"
                  :value="
                    application.payment.bankAccount
                      ? `${application.payment.bankAccount.bankName} ${application.payment.bankAccount.accountNumber} a.n. ${application.payment.bankAccount.accountHolder}`
                      : null
                  "
                />
                <DetailItem
                  label="Bank Pengirim"
                  :value="application.payment.bankName"
                />
                <DetailItem
                  label="Nama Pemilik Rekening Pengirim"
                  :value="application.payment.senderAccountName"
                />
                <DetailItem
                  label="Tanggal Transfer"
                  :value="
                    application.payment.transferDate
                      ? formatDate(application.payment.transferDate)
                      : null
                  "
                />
                <DetailItem
                  v-if="application.payment.note"
                  label="Catatan"
                  :value="application.payment.note"
                />
              </dl>
              <div class="flex flex-wrap items-center gap-2">
                <Button
                  v-if="application.payment.proofFile"
                  as-child
                  variant="outline"
                >
                  <a
                    :href="fileUrl(application.payment.proofFile.storageKey)"
                    target="_blank"
                    rel="noopener"
                  >
                    <ExternalLink class="mr-1.5 size-4" />
                    Lihat Bukti Transfer
                  </a>
                </Button>
                <Button
                  v-if="application.payment.status === 'PENDING'"
                  variant="destructive"
                  :disabled="acting"
                  @click="openDialog('reject-payment')"
                >
                  Tolak
                </Button>
                <Button
                  v-if="application.payment.status === 'PENDING'"
                  :disabled="acting"
                  @click="handleVerifyPayment"
                >
                  Verifikasi Pembayaran
                </Button>
              </div>
            </template>
            <p
              v-else
              class="text-muted-foreground"
            >
              Data pembayaran tidak tersedia.
            </p>
          </TabsContent>
        </Tabs>
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
