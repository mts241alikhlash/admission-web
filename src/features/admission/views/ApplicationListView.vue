<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { watchDebounced } from '@vueuse/core'
import { DataTable } from '@mts241alikhlash/ui'
import { Button } from '@mts241alikhlash/ui/button'
import { Card, CardHeader, CardTitle } from '@mts241alikhlash/ui/card'
import { FloatingLabelField } from '@mts241alikhlash/ui/form'
import { Input } from '@mts241alikhlash/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mts241alikhlash/ui/select'
import type { ColumnDef } from '@tanstack/vue-table'
import { Plus } from 'lucide-vue-next'
import { useApplicationList } from '../composables/useApplicationList'
import { useAdminRegistration } from '../composables/useAdminRegistration'
import { usePublicAdmission } from '../composables/usePublicAdmission'
import StatusBadge from '../components/StatusBadge.vue'
import RegisterApplicantDialog from '../components/RegisterApplicantDialog.vue'
import AdminApplicationFormDialog from '../components/AdminApplicationFormDialog.vue'
import type {
  ActiveWave,
  AdmissionApplicationListItem,
  AdmissionStatus,
} from '../types'
import { PAYMENT_STATUS_LABELS, STATUS_LABELS } from '../types'
import { formatDateTime } from '../utils'

const router = useRouter()
const route = useRoute()

const { applications, waves, total, loading, fetchApplications, fetchWaves } =
  useApplicationList()
const { fetchActiveWaves } = usePublicAdmission()

const registerOpen = ref(false)
const formOpen = ref(false)
const isRegistering = ref(false)
const registerError = ref<string | null>(null)
const activeWaves = ref<ActiveWave[]>([])

const {
  applicationId,
  credentials,
  registerApplicant,
  clearCredentials,
  reset,
  fetchApplication,
  updateStep,
  uploadDocument,
  uploadPaymentProof,
  submit,
} = useAdminRegistration()

const searchQuery = ref('')
const statusFilter = ref<'ALL' | AdmissionStatus>('ALL')
const waveFilter = ref<string>(
  typeof route.query.wave === 'string' ? route.query.wave : 'ALL',
)
const page = ref(1)
const limit = ref(10)

const columns = computed<ColumnDef<AdmissionApplicationListItem>[]>(() => [
  {
    id: 'no',
    header: 'No',
    cell: ({ row }) => (page.value - 1) * limit.value + row.index + 1,
    enableSorting: false,
  },
  {
    accessorKey: 'registrationNumber',
    header: 'No. Pendaftaran',
  },
  {
    accessorKey: 'fullName',
    header: 'Nama',
  },
  {
    id: 'wave',
    header: 'Gelombang',
    cell: ({ row }) => row.original.wave.code,
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => h(StatusBadge, { status: row.original.status }),
  },
  {
    id: 'payment',
    header: 'Pembayaran',
    cell: ({ row }) =>
      row.original.payment
        ? PAYMENT_STATUS_LABELS[row.original.payment.status]
        : '-',
  },
  {
    id: 'submittedAt',
    header: 'Dikirim',
    cell: ({ row }) => formatDateTime(row.original.submittedAt),
  },
  {
    id: 'actions',
    header: 'Aksi',
    cell: ({ row }) =>
      h(
        Button,
        {
          variant: 'outline',
          size: 'sm',
          onClick: () => router.push(`/admin/applicants/${row.original.id}`),
        },
        () => 'Detail',
      ),
    enableSorting: false,
  },
])

function loadApplications() {
  void fetchApplications({
    page: page.value,
    limit: limit.value,
    search: searchQuery.value.trim() || undefined,
    status: statusFilter.value === 'ALL' ? undefined : statusFilter.value,
    waveId: waveFilter.value === 'ALL' ? undefined : waveFilter.value,
  })
}

onMounted(() => {
  loadApplications()
  void fetchWaves()
})

async function openRegister() {
  registerError.value = null
  isRegistering.value = false
  reset()
  if (activeWaves.value.length === 0) {
    const data = await fetchActiveWaves()
    activeWaves.value = data?.waves ?? []
  }
  registerOpen.value = true
}

async function handleRegister(payload: {
  fullName: string
  email: string
  phone?: string
  password: string
  passwordConfirm: string
  waveId: string
}) {
  isRegistering.value = true
  registerError.value = null
  const result = await registerApplicant(payload)
  isRegistering.value = false
  if (result.success) {
    registerOpen.value = false
    formOpen.value = true
  } else {
    registerError.value = result.error ?? 'Gagal mendaftarkan pendaftar.'
  }
}

function closeForm() {
  formOpen.value = false
  clearCredentials()
  reset()
  loadApplications()
}

watchDebounced(
  searchQuery,
  () => {
    page.value = 1
    loadApplications()
  },
  { debounce: 400 },
)

function onFilterChange() {
  page.value = 1
  loadApplications()
}

const totalPages = computed(() =>
  Math.max(Math.ceil(total.value / limit.value), 1),
)

function goToPage(target: number) {
  page.value = Math.min(Math.max(target, 1), totalPages.value)
  loadApplications()
}

function setPageSize(size: number) {
  limit.value = size
  page.value = 1
  loadApplications()
}
</script>

<template>
  <div class="p-4 sm:p-6">
    <Card
      class="overflow-hidden rounded-2xl shadow-sm shadow-black/5 ring-1 ring-black/4"
    >
      <CardHeader
        class="flex flex-row items-center justify-between border-b px-6 py-5"
      >
        <CardTitle class="text-xl font-bold tracking-tight">
          Daftar Pendaftar
        </CardTitle>
        <Button @click="openRegister">
          <Plus class="size-4 mr-1.5" />
          Daftarkan Pendaftar
        </Button>
      </CardHeader>

      <div class="p-6 pt-1">
        <div class="mb-2 flex flex-wrap items-start gap-3">
          <FloatingLabelField
            label="Status"
            class="w-full sm:w-40"
            floating
          >
            <Select
              v-model="statusFilter"
              @update:model-value="onFilterChange"
            >
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL"> Semua Status </SelectItem>
                <SelectItem
                  v-for="(label, status) in STATUS_LABELS"
                  :key="status"
                  :value="status"
                >
                  {{ label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </FloatingLabelField>
          <FloatingLabelField
            label="Gelombang"
            class="w-full sm:w-48"
            floating
          >
            <Select
              v-model="waveFilter"
              @update:model-value="onFilterChange"
            >
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL"> Semua Gelombang </SelectItem>
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
        </div>

        <DataTable
          :columns="columns"
          :data="applications"
          :is-loading="loading"
          :total-items="total"
          :page="page"
          :page-size="limit"
          item-label="pendaftar"
          @update:page="goToPage"
          @update:page-size="setPageSize"
        >
          <template #header-right>
            <FloatingLabelField
              label="Cari pendaftar"
              class="w-full sm:w-48"
              :floating="!!searchQuery"
            >
              <Input v-model="searchQuery" />
            </FloatingLabelField>
          </template>
        </DataTable>
      </div>
    </Card>

    <RegisterApplicantDialog
      v-model:open="registerOpen"
      :waves="activeWaves"
      :is-submitting="isRegistering"
      :error-message="registerError"
      @submit="handleRegister"
    />

    <AdminApplicationFormDialog
      :open="formOpen"
      :credentials="credentials"
      :application-id="applicationId"
      :fetch-application="fetchApplication"
      :update-step="updateStep"
      :upload-document="uploadDocument"
      :upload-payment-proof="uploadPaymentProof"
      :submit="submit"
      @update:open="(open) => (open ? (formOpen = true) : closeForm())"
      @completed="loadApplications"
    />
  </div>
</template>
