<script setup lang="ts">
import { computed, onMounted, ref, useId, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { SearchInput } from '@mts241alikhlash/ui'
import { Button } from '@mts241alikhlash/ui/button'
import { Badge } from '@mts241alikhlash/ui/badge'
import { Card, CardHeader, CardTitle } from '@mts241alikhlash/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@mts241alikhlash/ui/tabs'
import { Textarea } from '@mts241alikhlash/ui/textarea'
import { FloatingLabelField } from '@mts241alikhlash/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mts241alikhlash/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@mts241alikhlash/ui/dialog'
import { Eye, Plus } from '@lucide/vue'
import { useRoleGuard } from '@/features/platform/auth'
import AddPaymentDialog from '../components/AddPaymentDialog.vue'
import FilePreviewDialog from '../components/FilePreviewDialog.vue'
import { useFilePreview } from '../composables/useFilePreview'
import { applicationService } from '../services/applicationService'
import { paymentQueueService } from '../services/paymentQueueService'
import { useApplicationStore } from '../stores/applicationStore'
import {
  PAYMENT_STATUS_LABELS,
  type AdmissionPaymentQueueRow,
  type PaymentQueueStatus,
} from '../types'
import { formatDate, formatIDR, PAYMENT_STATUS_BADGE_VARIANTS } from '../utils'

const LIMIT = 50

const route = useRoute()
const router = useRouter()
const { can } = useRoleGuard()
const preview = useFilePreview()
const canVerify = computed(() => can('admission-payments.verify'))
const canCreate = computed(() => can('admission-payments.create'))
const { waves } = storeToRefs(useApplicationStore())

const tab = ref<PaymentQueueStatus>('PENDING')
const search = ref('')
const debouncedSearch = refDebounced(search, 300)
const waveFilter = ref('ALL')
const waveFilterId = useId()
const rows = ref<AdmissionPaymentQueueRow[]>([])
const total = ref(0)
const counts = ref({ pending: 0, verified: 0, rejected: 0 })
const page = ref(1)
const loading = ref(false)
let latestRequest = 0
const listError = ref<string | null>(null)

const addOpen = ref(false)
const addApplicantId = ref<string | null>(null)

const reasonKind = ref<'reject' | 'cancel' | null>(null)
const reasonRow = ref<AdmissionPaymentQueueRow | null>(null)
const reason = ref('')
const reasonError = ref('')
const acting = ref(false)

const TABS: {
  value: PaymentQueueStatus
  label: string
  count: () => number
}[] = [
  { value: 'PENDING', label: 'Menunggu', count: () => counts.value.pending },
  {
    value: 'VERIFIED',
    label: 'Terverifikasi',
    count: () => counts.value.verified,
  },
  { value: 'REJECTED', label: 'Ditolak', count: () => counts.value.rejected },
]

async function load(reset = true) {
  if (reset) page.value = 1
  const request = ++latestRequest
  loading.value = true
  const result = await paymentQueueService.fetchQueue({
    status: tab.value,
    search: debouncedSearch.value.trim() || undefined,
    waveId: waveFilter.value === 'ALL' ? undefined : waveFilter.value,
    page: page.value,
    limit: LIMIT,
  })
  if (request !== latestRequest) return
  loading.value = false
  if ('error' in result) {
    listError.value = result.error
    if (reset) rows.value = []
    else page.value -= 1
    return
  }
  listError.value = null
  rows.value = reset ? result.rows : [...rows.value, ...result.rows]
  total.value = result.total
  counts.value = result.counts
}

async function loadMore() {
  page.value += 1
  await load(false)
}

async function verify(row: AdmissionPaymentQueueRow) {
  acting.value = true
  const result = await paymentQueueService.verify(row.applicationId)
  acting.value = false
  if (result.success) await load()
}

function openReason(kind: 'reject' | 'cancel', row: AdmissionPaymentQueueRow) {
  reasonKind.value = kind
  reasonRow.value = row
  reason.value = ''
  reasonError.value = ''
}

async function submitReason() {
  const row = reasonRow.value
  if (!row || !reasonKind.value) return
  if (!reason.value.trim()) {
    reasonError.value = 'Alasan wajib diisi'
    return
  }
  acting.value = true
  const note = reason.value.trim()
  const result =
    reasonKind.value === 'reject'
      ? await paymentQueueService.reject(row.applicationId, note)
      : await paymentQueueService.cancel(row.applicationId, note)
  acting.value = false
  if (!result.success) return
  reasonKind.value = null
  await load()
}

function openAdd(applicationId: string | null) {
  addApplicantId.value = applicationId
  addOpen.value = true
  if (route.query.applicationId) void router.replace({ query: {} })
}

async function onAddOpen(open: boolean) {
  addOpen.value = open
  if (open) return
  addApplicantId.value = null
  await load()
}

async function onAdded() {
  addOpen.value = false
  addApplicantId.value = null
  await load()
}

watch([tab, debouncedSearch, waveFilter], () => load())

onMounted(async () => {
  await applicationService.fetchWaves()
  await load()
  const fromRoute = route.query.applicationId
  if (typeof fromRoute === 'string' && canCreate.value) openAdd(fromRoute)
})
</script>

<template>
  <div class="p-4 sm:p-6">
    <Card
      class="overflow-hidden rounded-2xl shadow-sm shadow-black/5 ring-1 ring-black/4"
    >
      <CardHeader
        class="flex flex-col items-start justify-between gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:px-6 sm:py-5"
      >
        <CardTitle class="text-xl font-bold tracking-tight">
          Pembayaran
        </CardTitle>
        <Button
          v-if="canCreate"
          class="min-h-11 w-full sm:min-h-0 sm:w-auto"
          @click="openAdd(null)"
        >
          <Plus class="mr-1.5 size-4" />
          Tambah Pembayaran
        </Button>
      </CardHeader>

      <div class="space-y-4 p-4 sm:p-6">
        <Tabs
          v-model="tab"
          variant="line"
        >
          <TabsList>
            <TabsTrigger
              v-for="item in TABS"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
              <Badge
                variant="secondary"
                class="ml-1.5"
                >{{ item.count() }}</Badge
              >
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        >
          <FloatingLabelField
            label="Gelombang"
            :for="waveFilterId"
            class="w-full sm:w-48"
            floating
          >
            <Select v-model="waveFilter">
              <SelectTrigger
                :id="waveFilterId"
                size="sm"
                class="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua</SelectItem>
                <SelectItem
                  v-for="wave in waves"
                  :key="wave.id"
                  :value="wave.id"
                >
                  {{ wave.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </FloatingLabelField>
          <SearchInput
            v-model="search"
            label="Cari nama atau no. pendaftaran"
          />
        </div>

        <div
          v-if="listError"
          class="space-y-3 rounded-md border p-4"
          role="alert"
        >
          <p class="text-sm">{{ listError }}</p>
          <Button
            variant="outline"
            class="min-h-11"
            @click="load()"
          >
            Coba lagi
          </Button>
        </div>
        <template v-else>
          <p
            v-if="loading && !rows.length"
            class="text-center text-sm text-muted-foreground"
          >
            Memuat pembayaran…
          </p>
          <p
            v-else-if="!rows.length"
            class="rounded-md border p-4 text-center text-sm text-muted-foreground"
          >
            Tidak ada pembayaran.
          </p>
          <ul
            v-else
            class="space-y-2"
          >
            <li
              v-for="row in rows"
              :key="row.paymentId"
              data-test="payment-row"
              class="min-w-0 space-y-3 rounded-lg border p-4 text-sm"
            >
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="break-words font-semibold">
                    {{ row.applicantName }}
                  </p>
                  <p class="text-muted-foreground">
                    {{ row.registrationNumber }} · {{ row.waveName }}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <Badge
                    v-if="row.proofUploadedByStaff"
                    variant="outline"
                    >Diunggah staf</Badge
                  >
                  <Badge :variant="PAYMENT_STATUS_BADGE_VARIANTS[row.status]">
                    {{ PAYMENT_STATUS_LABELS[row.status] }}
                  </Badge>
                </div>
              </div>
              <dl class="grid gap-x-8 gap-y-1 sm:grid-cols-2">
                <div>
                  <dt class="text-muted-foreground">Jumlah</dt>
                  <dd>{{ formatIDR(row.amount) }}</dd>
                </div>
                <div>
                  <dt class="text-muted-foreground">Tanggal transfer</dt>
                  <dd>{{ formatDate(row.transferDate) }}</dd>
                </div>
                <div>
                  <dt class="text-muted-foreground">Pengirim</dt>
                  <dd>
                    {{ row.senderAccountName ?? '-' }}
                    <span v-if="row.bankName">({{ row.bankName }})</span>
                  </dd>
                </div>
                <div>
                  <dt class="text-muted-foreground">Rekening tujuan</dt>
                  <dd>
                    <template v-if="row.bankAccount">
                      {{ row.bankAccount.bankName }}
                      {{ row.bankAccount.accountNumber }}
                    </template>
                    <template v-else>-</template>
                  </dd>
                </div>
              </dl>
              <p
                v-if="row.note"
                class="text-muted-foreground"
              >
                Catatan: {{ row.note }}
              </p>
              <div class="flex flex-wrap items-center gap-2">
                <Button
                  v-if="row.proofFile"
                  variant="outline"
                  class="min-h-11 sm:min-h-0"
                  data-test="open-file"
                  @click="preview.show(row.proofFile)"
                >
                  <Eye class="mr-1.5 size-4" />
                  Lihat bukti
                </Button>
                <template v-if="canVerify && row.status === 'PENDING'">
                  <Button
                    variant="destructive"
                    class="min-h-11 sm:min-h-0"
                    :disabled="acting"
                    @click="openReason('reject', row)"
                    >Tolak</Button
                  >
                  <Button
                    class="min-h-11 sm:min-h-0"
                    :disabled="acting"
                    @click="verify(row)"
                    >Verifikasi</Button
                  >
                </template>
                <Button
                  v-if="canVerify && row.status === 'VERIFIED'"
                  variant="outline"
                  class="min-h-11 sm:min-h-0"
                  :disabled="acting"
                  @click="openReason('cancel', row)"
                  >Batalkan verifikasi</Button
                >
              </div>
            </li>
          </ul>
          <Button
            v-if="rows.length < total"
            variant="outline"
            class="min-h-11 w-full"
            :disabled="loading"
            @click="loadMore"
          >
            Muat lebih banyak
          </Button>
        </template>
      </div>
    </Card>

    <Dialog
      :open="reasonKind !== null"
      @update:open="(open) => !open && (reasonKind = null)"
    >
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {{
              reasonKind === 'cancel'
                ? 'Batalkan Verifikasi Pembayaran'
                : 'Tolak Bukti Pembayaran'
            }}
          </DialogTitle>
          <DialogDescription>
            {{
              reasonKind === 'cancel'
                ? 'Pembayaran kembali ke Menunggu dan pendaftar diberi tahu.'
                : 'Pendaftar diminta mengunggah ulang bukti yang sesuai.'
            }}
          </DialogDescription>
        </DialogHeader>
        <form
          data-test="reason-form"
          class="space-y-2"
          @submit.prevent="submitReason"
        >
          <Textarea
            v-model="reason"
            rows="3"
            maxlength="500"
            aria-label="Alasan"
            placeholder="Alasan"
          />
          <p
            v-if="reasonError"
            class="text-sm text-destructive"
          >
            {{ reasonError }}
          </p>
          <DialogFooter class="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              :disabled="acting"
              @click="reasonKind = null"
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

    <AddPaymentDialog
      :open="addOpen"
      :initial-application-id="addApplicantId"
      @update:open="onAddOpen"
      @saved="onAdded"
    />

    <FilePreviewDialog
      v-model:open="preview.open.value"
      :file="preview.file.value"
    />
  </div>
</template>
