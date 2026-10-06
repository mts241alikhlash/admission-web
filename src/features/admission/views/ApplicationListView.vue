<script setup lang="ts">
import { computed, h, onMounted, ref, useId, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIntersectionObserver } from '@vueuse/core'
import { DataTable, ActionCell, SearchInput } from '@mts241alikhlash/ui'
import { Button } from '@mts241alikhlash/ui/button'
import { Badge } from '@mts241alikhlash/ui/badge'
import { Card, CardHeader, CardTitle } from '@mts241alikhlash/ui/card'
import { FloatingLabelField } from '@mts241alikhlash/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mts241alikhlash/ui/select'
import type { ColumnDef } from '@tanstack/vue-table'
import { Plus } from '@lucide/vue'
import { useApplicationList } from '../composables/useApplicationList'
import { useAdminRegistration } from '../composables/useAdminRegistration'
import { usePublicAdmission } from '../composables/usePublicAdmission'
import StatusBadge from '../components/StatusBadge.vue'
import RegisterApplicantDialog from '../components/RegisterApplicantDialog.vue'
import ApplicantCredentialsDialog from '../components/ApplicantCredentialsDialog.vue'
import type {
  ActiveWave,
  AdmissionApplicationListItem,
  AdmissionStatus,
} from '../types'
import { PAYMENT_STATUS_LABELS, STATUS_LABELS } from '../types'
import { formatDateTime, PAYMENT_STATUS_BADGE_VARIANTS } from '../utils'

const router = useRouter()
const route = useRoute()

const searchQuery = ref('')
const statusFilter = ref<'ALL' | AdmissionStatus>('ALL')
const waveFilter = ref<string>(
  typeof route.query.wave === 'string' ? route.query.wave : 'ALL',
)
const statusFilterId = useId()
const waveFilterId = useId()

const {
  applications,
  waves,
  totalItems,
  loading,
  listError,
  hasNextPage,
  isFetchingNextPage,
  loadMore,
  refresh,
  fetchWaves,
} = useApplicationList(searchQuery, statusFilter, waveFilter)
const loadMoreButton = useTemplateRef('loadMoreButton')
useIntersectionObserver(loadMoreButton, ([entry]) => {
  if (entry?.isIntersecting) loadMore()
})
const { fetchActiveWaves } = usePublicAdmission()

const registerOpen = ref(false)
const credentialsOpen = ref(false)
const isRegistering = ref(false)
const registerError = ref<string | null>(null)
const activeWaves = ref<ActiveWave[]>([])

const {
  applicationId,
  credentials,
  registerApplicant,
  clearCredentials,
  reset,
} = useAdminRegistration()

const columns = computed<ColumnDef<AdmissionApplicationListItem>[]>(() => [
  {
    id: 'no',
    header: 'No',
    cell: ({ row }) => row.index + 1,
    enableSorting: false,
  },
  {
    accessorKey: 'registrationNumber',
    header: 'No. Pendaftaran',
    meta: { align: 'center' },
  },
  {
    accessorKey: 'fullName',
    header: 'Nama',
    meta: { align: 'left' },
  },
  {
    id: 'wave',
    header: 'Gelombang',
    meta: { align: 'center' },
    cell: ({ row }) => row.original.wave?.code ?? '-',
  },
  {
    id: 'status',
    header: 'Status',
    meta: { align: 'center' },
    cell: ({ row }) => h(StatusBadge, { status: row.original.status }),
  },
  {
    id: 'payment',
    header: 'Pembayaran',
    meta: { align: 'center' },
    cell: ({ row }) => {
      const status = row.original.payment?.status
      return status
        ? h(
            Badge,
            { variant: PAYMENT_STATUS_BADGE_VARIANTS[status] },
            () => PAYMENT_STATUS_LABELS[status],
          )
        : '-'
    },
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
      h(ActionCell, {
        viewLabel: 'Lihat detail',
        hideEdit: true,
        hideDelete: true,
        onView: () => router.push(`/admin/applicants/${row.original.id}`),
      }),
    enableSorting: false,
  },
])

onMounted(() => {
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
    credentialsOpen.value = true
    void refresh()
  } else {
    registerError.value = result.error ?? 'Gagal mendaftarkan pendaftar.'
  }
}

function closeCredentials() {
  credentialsOpen.value = false
  clearCredentials()
  reset()
}

function fillForm() {
  const id = applicationId.value
  closeCredentials()
  if (id) void router.push({ name: 'admin-application-form', params: { id } })
}
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
          Daftar Pendaftar
        </CardTitle>
        <Button
          class="min-h-11 w-full sm:min-h-0 sm:w-auto"
          @click="openRegister"
        >
          <Plus class="mr-1.5 size-4" />
          Tambah Pendaftar
        </Button>
      </CardHeader>

      <div class="space-y-4 p-4 sm:p-6">
        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
            <FloatingLabelField
              label="Status"
              :for="statusFilterId"
              class="w-full sm:w-48"
              floating
            >
              <Select v-model="statusFilter">
                <SelectTrigger
                  :id="statusFilterId"
                  size="sm"
                  class="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua</SelectItem>
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
          </div>
          <SearchInput
            v-model="searchQuery"
            label="Cari pendaftar"
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
            @click="refresh()"
          >
            Coba lagi
          </Button>
        </div>
        <template v-else>
          <DataTable
            class="hidden md:block"
            :columns="columns"
            :data="applications"
            :total-items="applications.length"
            :is-loading="loading"
            item-label="pendaftar"
            hide-per-page
            hide-pagination
          />
          <p
            v-if="!loading && !applications.length"
            class="rounded-md border p-4 text-center text-sm text-muted-foreground md:hidden"
          >
            Tidak ada data.
          </p>
          <ul
            data-test="mobile-applications"
            class="space-y-2 md:hidden"
          >
            <li
              v-for="item in applications"
              :key="item.id"
              class="min-w-0 space-y-2 rounded-lg border p-4"
            >
              <p class="break-words font-medium">{{ item.fullName }}</p>
              <p class="break-all text-sm text-muted-foreground">
                {{ item.registrationNumber }}
              </p>
              <StatusBadge :status="item.status" />
              <Button
                variant="outline"
                class="min-h-11 w-full sm:w-auto"
                @click="router.push(`/admin/applicants/${item.id}`)"
              >
                Detail
              </Button>
            </li>
          </ul>
          <div
            v-if="hasNextPage"
            class="flex flex-col items-center gap-2"
          >
            <p class="text-sm text-muted-foreground">
              Menampilkan {{ applications.length }} dari
              {{ totalItems }} pendaftar
            </p>
            <Button
              ref="loadMoreButton"
              variant="outline"
              :disabled="isFetchingNextPage"
              @click="loadMore"
            >
              {{ isFetchingNextPage ? 'Memuat…' : 'Muat lebih banyak' }}
            </Button>
          </div>
        </template>
      </div>
    </Card>

    <RegisterApplicantDialog
      v-model:open="registerOpen"
      :waves="activeWaves"
      :is-submitting="isRegistering"
      :error-message="registerError"
      @submit="handleRegister"
    />

    <ApplicantCredentialsDialog
      :open="credentialsOpen"
      :credentials="credentials"
      @update:open="(open) => !open && closeCredentials()"
      @fill="fillForm"
    />
  </div>
</template>
