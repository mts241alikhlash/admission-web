<script setup lang="ts">
import { computed } from 'vue'
import { ChevronDown } from '@lucide/vue'
import { Badge } from '@mts241alikhlash/ui/badge'
import { Button } from '@mts241alikhlash/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@mts241alikhlash/ui/card'
import {
  DOCUMENT_STATUS_LABELS,
  RELATION_LABELS,
  PAYMENT_STATUS_LABELS,
} from '../types'
import type { CompletenessItem } from '../composables/applicationCompleteness'
import type { AdmissionApplication } from '../types'
import { useFormOptions } from '../composables/useFormOptions'
import { formatDate, presentValue } from '../utils'
import type {
  PersonalForm,
  ParentForm,
  AddressForm,
  SchoolForm,
} from '../composables/useApplicationFormState'

const props = defineProps<{
  personal: PersonalForm
  parents: ParentForm[]
  address: AddressForm
  school: SchoolForm
  application: AdmissionApplication
  editable: boolean
  completeness: CompletenessItem[]
  onGoToStep: (step: number) => void
}>()

const { nameOf } = useFormOptions()
const missing = computed(() => props.completeness.filter((item) => !item.done))
const fieldGridClass =
  'grid grid-cols-[minmax(0,40%)_minmax(0,1fr)] gap-x-4 gap-y-2 sm:grid-cols-[minmax(0,20%)_minmax(0,1fr)_minmax(0,20%)_minmax(0,1fr)] [&>dt]:flex [&>dt]:min-w-0 [&>dt]:justify-between [&>dt]:gap-2 [&>dt]:text-muted-foreground [&_dt>span:first-child]:break-words [&>dd]:min-w-0 [&>dd]:break-words'
</script>

<template>
  <div class="space-y-4 text-sm">
    <Card
      v-if="editable"
      class="gap-0 overflow-hidden py-0"
    >
      <CardHeader
        class="flex flex-row flex-wrap items-center justify-between gap-3 border-b px-4 py-3"
      >
        <CardTitle class="text-base font-semibold">Kelengkapan Data</CardTitle>
        <Badge :variant="missing.length ? 'destructive' : 'secondary'">
          {{
            missing.length
              ? `${missing.length} bagian belum lengkap`
              : 'Bagian wajib lengkap'
          }}
        </Badge>
      </CardHeader>
      <CardContent class="px-4 py-2">
        <p
          v-if="!missing.length"
          class="py-3 text-muted-foreground"
        >
          Semua bagian yang wajib sudah lengkap. Periksa juga pembayaran dan
          ringkasan di bawah.
        </p>
        <ul
          v-else
          class="divide-y"
        >
          <li
            v-for="item in missing"
            :key="item.step"
            class="flex flex-wrap items-center gap-x-3 gap-y-1 py-3"
          >
            <span class="min-w-0 flex-1 font-medium">{{ item.label }}</span>
            <Button
              variant="link"
              size="sm"
              class="min-h-11 px-2"
              @click="onGoToStep(item.step)"
            >
              Lengkapi
            </Button>
            <span
              v-if="item.detail"
              class="w-full text-destructive"
            >
              {{ item.detail }}
            </span>
          </li>
        </ul>
      </CardContent>
    </Card>

    <div
      class="grid min-w-0 items-start gap-4 [&>div]:min-w-0 [&>div]:break-words"
    >
      <Card class="gap-0 overflow-hidden py-0">
        <details
          open
          class="group"
        >
          <summary
            class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 border-b px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring marker:content-none"
          >
            <span class="min-w-0 flex-1 font-semibold">Data Diri</span>
            <Button
              v-if="editable"
              variant="link"
              size="sm"
              class="h-auto p-0"
              @click.stop.prevent="onGoToStep(0)"
            >
              Ubah
            </Button>
            <ChevronDown
              class="size-5 shrink-0 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <CardContent class="px-4 py-4">
            <dl :class="fieldGridClass">
              <dt class="flex justify-between gap-2 text-muted-foreground">
                <span>Nama</span><span>:</span>
              </dt>
              <dd class="min-w-0 break-words">
                {{ presentValue(personal.fullName) }}
              </dd>
              <dt><span>Nama panggilan</span><span>:</span></dt>
              <dd>{{ presentValue(personal.nickname) }}</dd>
              <dt class="flex justify-between gap-2 text-muted-foreground">
                <span>Jenis Kelamin</span><span>:</span>
              </dt>
              <dd class="min-w-0 break-words">
                {{
                  personal.gender === 'MALE'
                    ? 'Laki-laki'
                    : personal.gender === 'FEMALE'
                      ? 'Perempuan'
                      : 'Belum diisi'
                }}
              </dd>
              <dt class="flex justify-between gap-2 text-muted-foreground">
                <span>Tempat lahir</span><span>:</span>
              </dt>
              <dd class="min-w-0 break-words">
                {{ presentValue(personal.birthPlace) }}
              </dd>
              <dt class="flex justify-between gap-2 text-muted-foreground">
                <span>Tanggal lahir</span><span>:</span>
              </dt>
              <dd class="min-w-0 break-words">
                {{ presentValue(formatDate(personal.birthDate)) }}
              </dd>
              <dt class="flex justify-between gap-2 text-muted-foreground">
                <span>NIK</span><span>:</span>
              </dt>
              <dd class="min-w-0 break-words">
                {{ presentValue(personal.nik) }}
              </dd>
              <dt class="flex justify-between gap-2 text-muted-foreground">
                <span>NISN</span><span>:</span>
              </dt>
              <dd class="min-w-0 break-words">
                {{ presentValue(personal.nisn) }}
              </dd>
              <dt><span>No. HP</span><span>:</span></dt>
              <dd>{{ presentValue(personal.phone) }}</dd>
              <dt class="flex justify-between gap-2 text-muted-foreground">
                <span>Agama</span><span>:</span>
              </dt>
              <dd class="min-w-0 break-words">
                {{ presentValue(nameOf('religions', personal.religionId)) }}
              </dd>
              <dt class="flex justify-between gap-2 text-muted-foreground">
                <span>Anak ke-</span><span>:</span>
              </dt>
              <dd class="min-w-0 break-words">
                {{ presentValue(personal.childOrder) }}
              </dd>
              <dt class="flex justify-between gap-2 text-muted-foreground">
                <span>Jumlah saudara</span><span>:</span>
              </dt>
              <dd class="min-w-0 break-words">
                {{ presentValue(personal.siblingCount) }}
              </dd>
              <dt class="flex justify-between gap-2 text-muted-foreground">
                <span>Hobi</span><span>:</span>
              </dt>
              <dd class="min-w-0 break-words">
                {{ presentValue(personal.hobby) }}
              </dd>
              <dt class="flex justify-between gap-2 text-muted-foreground">
                <span>Cita-cita</span><span>:</span>
              </dt>
              <dd class="min-w-0 break-words">
                {{ presentValue(personal.aspiration) }}
              </dd>
              <dt class="flex justify-between gap-2 text-muted-foreground">
                <span>Yang membiayai sekolah</span><span>:</span>
              </dt>
              <dd class="min-w-0 break-words">
                {{
                  presentValue(
                    nameOf('financingSources', personal.financingSourceId),
                  )
                }}
              </dd>
              <dt><span>Kebutuhan disabilitas</span><span>:</span></dt>
              <dd>
                {{
                  presentValue(
                    nameOf('disabilityTypes', personal.disabilityTypeId),
                  )
                }}
              </dd>
              <dt><span>Kebutuhan khusus</span><span>:</span></dt>
              <dd>
                {{
                  presentValue(nameOf('specialNeeds', personal.specialNeedId))
                }}
              </dd>
            </dl>
          </CardContent>
        </details>
      </Card>
      <Card class="gap-0 overflow-hidden py-0">
        <details
          open
          class="group"
        >
          <summary
            class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 border-b px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring marker:content-none"
          >
            <span class="min-w-0 flex-1 font-semibold">Orang Tua/Wali</span>
            <Button
              v-if="editable"
              variant="link"
              size="sm"
              class="h-auto p-0"
              @click.stop.prevent="onGoToStep(1)"
            >
              Ubah
            </Button>
            <ChevronDown
              class="size-5 shrink-0 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <CardContent class="px-4 py-4">
            <dl
              v-if="parents.some((p) => p.name)"
              :class="fieldGridClass"
            >
              <template
                v-for="(parent, index) in parents.filter((p) => p.name)"
                :key="index"
              >
                <dt>
                  <span>{{ RELATION_LABELS[parent.relation] }}</span
                  ><span>:</span>
                </dt>
                <dd>
                  {{ presentValue(parent.name) }} ({{
                    presentValue(
                      nameOf('parentLifeStatuses', parent.lifeStatusId),
                    )
                  }}){{ parent.isPrimary ? ' (wali)' : '' }}
                </dd>
                <dt><span>NIK</span><span>:</span></dt>
                <dd>{{ presentValue(parent.nik) }}</dd>
                <dt><span>Pekerjaan</span><span>:</span></dt>
                <dd>
                  {{ presentValue(nameOf('occupations', parent.occupationId)) }}
                </dd>
                <dt><span>Pendidikan</span><span>:</span></dt>
                <dd>
                  {{ presentValue(nameOf('educations', parent.educationId)) }}
                </dd>
                <template v-if="parent.phone">
                  <dt><span>No. HP</span><span>:</span></dt>
                  <dd>{{ parent.phone }}</dd>
                </template>
                <template v-if="!parent.sameAddressAsStudent">
                  <dt><span>Alamat</span><span>:</span></dt>
                  <dd>
                    {{ presentValue(parent.street) }}, RT
                    {{ presentValue(parent.rt) }}/RW
                    {{ presentValue(parent.rw) }}
                  </dd>
                </template>
              </template>
            </dl>
            <p v-else>Belum diisi</p>
          </CardContent>
        </details>
      </Card>
      <Card class="gap-0 overflow-hidden py-0">
        <details
          open
          class="group"
        >
          <summary
            class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 border-b px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring marker:content-none"
          >
            <span class="min-w-0 flex-1 font-semibold">Alamat</span>
            <Button
              v-if="editable"
              variant="link"
              size="sm"
              class="h-auto p-0"
              @click.stop.prevent="onGoToStep(2)"
            >
              Ubah
            </Button>
            <ChevronDown
              class="size-5 shrink-0 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <CardContent class="px-4 py-4">
            <dl :class="fieldGridClass">
              <dt><span>Alamat</span><span>:</span></dt>
              <dd class="sm:col-span-3">
                {{
                  [
                    address.street,
                    application.village,
                    application.district,
                    application.city,
                    application.province,
                  ]
                    .filter(Boolean)
                    .join(', ') || 'Belum diisi'
                }}
              </dd>
              <dt><span>RT/RW</span><span>:</span></dt>
              <dd>
                {{ presentValue(address.rt) }}/{{ presentValue(address.rw) }}
              </dd>
              <dt><span>Kode pos</span><span>:</span></dt>
              <dd>{{ presentValue(address.postalCode) }}</dd>
            </dl>
          </CardContent>
        </details>
      </Card>
      <Card class="gap-0 overflow-hidden py-0">
        <details
          open
          class="group"
        >
          <summary
            class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 border-b px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring marker:content-none"
          >
            <span class="min-w-0 flex-1 font-semibold">Sekolah Asal</span>
            <Button
              v-if="editable"
              variant="link"
              size="sm"
              class="h-auto p-0"
              @click.stop.prevent="onGoToStep(3)"
            >
              Ubah
            </Button>
            <ChevronDown
              class="size-5 shrink-0 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <CardContent class="px-4 py-4">
            <dl :class="fieldGridClass">
              <dt><span>Nama sekolah</span><span>:</span></dt>
              <dd>{{ presentValue(school.previousSchoolName) }}</dd>
              <dt><span>NPSN</span><span>:</span></dt>
              <dd>{{ presentValue(school.previousSchoolNpsn) }}</dd>
              <dt><span>Alamat sekolah</span><span>:</span></dt>
              <dd>{{ presentValue(school.previousSchoolAddress) }}</dd>
              <dt><span>Tahun lulus</span><span>:</span></dt>
              <dd>{{ presentValue(school.graduationYear) }}</dd>
            </dl>
          </CardContent>
        </details>
      </Card>
      <Card class="gap-0 overflow-hidden py-0">
        <details
          open
          class="group"
        >
          <summary
            class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 border-b px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring marker:content-none"
          >
            <span class="min-w-0 flex-1 font-semibold"
              >Tempat Tinggal & Perjalanan</span
            >
            <Button
              v-if="editable"
              variant="link"
              size="sm"
              class="h-auto p-0"
              @click.stop.prevent="onGoToStep(2)"
            >
              Ubah
            </Button>
            <ChevronDown
              class="size-5 shrink-0 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <CardContent class="px-4 py-4">
            <dl :class="fieldGridClass">
              <dt><span>Status</span><span>:</span></dt>
              <dd>
                {{
                  presentValue(
                    nameOf('studentResidences', address.studentResidenceId),
                  )
                }}
              </dd>
              <dt><span>Jarak</span><span>:</span></dt>
              <dd>
                {{
                  presentValue(
                    nameOf('travelDistances', address.travelDistanceId),
                  )
                }}
              </dd>
              <dt><span>Waktu tempuh</span><span>:</span></dt>
              <dd>
                {{ presentValue(nameOf('travelTimes', address.travelTimeId)) }}
              </dd>
              <dt><span>Transportasi</span><span>:</span></dt>
              <dd>
                {{
                  presentValue(
                    nameOf('transportations', address.transportationId),
                  )
                }}
              </dd>
            </dl>
          </CardContent>
        </details>
      </Card>
      <Card class="gap-0 overflow-hidden py-0">
        <details
          open
          class="group"
        >
          <summary
            class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 border-b px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring marker:content-none"
          >
            <span class="min-w-0 flex-1 font-semibold"
              >Prestasi & Beasiswa</span
            >
            <Button
              v-if="editable"
              variant="link"
              size="sm"
              class="h-auto p-0"
              @click.stop.prevent="onGoToStep(4)"
            >
              Ubah
            </Button>
            <ChevronDown
              class="size-5 shrink-0 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <CardContent class="px-4 py-4">
            <dl :class="fieldGridClass">
              <template v-if="(application.achievements ?? []).length === 0">
                <dt><span>Prestasi</span><span>:</span></dt>
                <dd>tidak ada</dd>
              </template>
              <template
                v-for="row in application.achievements ?? []"
                :key="`a-${row.id}`"
              >
                <dt><span>Prestasi</span><span>:</span></dt>
                <dd>{{ row.competitionName }} ({{ row.year }})</dd>
              </template>
              <template v-if="(application.scholarships ?? []).length === 0">
                <dt><span>Beasiswa</span><span>:</span></dt>
                <dd>tidak ada</dd>
              </template>
              <template
                v-for="row in application.scholarships ?? []"
                :key="`s-${row.id}`"
              >
                <dt><span>Beasiswa</span><span>:</span></dt>
                <dd>
                  {{ row.scholarshipName }} ({{ row.year }}){{
                    row.kipNumber ? ` · No. KIP ${row.kipNumber}` : ''
                  }}
                </dd>
              </template>
            </dl>
          </CardContent>
        </details>
      </Card>
      <Card class="gap-0 overflow-hidden py-0">
        <details
          open
          class="group"
        >
          <summary
            class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 border-b px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring marker:content-none"
          >
            <span class="min-w-0 flex-1 font-semibold"
              >Berkas & Pembayaran</span
            >
            <Button
              v-if="editable"
              variant="link"
              size="sm"
              class="h-auto p-0"
              @click.stop.prevent="onGoToStep(5)"
            >
              Ubah
            </Button>
            <ChevronDown
              class="size-5 shrink-0 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <CardContent class="px-4 py-4">
            <dl :class="fieldGridClass">
              <template
                v-for="type in application.documentTypes ?? []"
                :key="type.id"
              >
                <dt>
                  <span
                    >{{ type.name
                    }}{{ type.isRequired ? ' (wajib)' : '' }}</span
                  ><span>:</span>
                </dt>
                <dd>
                  {{
                    (() => {
                      const document = (application.documents ?? []).find(
                        (item) => item.documentTypeId === type.id,
                      )
                      return document
                        ? DOCUMENT_STATUS_LABELS[document.status]
                        : 'Belum diunggah'
                    })()
                  }}
                </dd>
              </template>
              <dt><span>Pembayaran</span><span>:</span></dt>
              <dd>
                {{
                  PAYMENT_STATUS_LABELS[application.payment?.status ?? 'UNPAID']
                }}
                <span
                  v-if="(application.payment?.status ?? 'UNPAID') === 'UNPAID'"
                  class="block text-muted-foreground"
                >
                  Bukti transfer boleh menyusul setelah formulir dikirim.
                </span>
              </dd>
            </dl>
          </CardContent>
        </details>
      </Card>
    </div>

    <div
      v-if="editable"
      class="rounded-md border border-primary/50 bg-primary/5 p-4"
    >
      <p class="font-medium">
        Pastikan seluruh data sudah benar sebelum mengirim.
      </p>
      <p class="text-muted-foreground">
        Setelah dikirim, formulir tidak dapat diubah kecuali admin meminta
        revisi.
      </p>
    </div>
  </div>
</template>
