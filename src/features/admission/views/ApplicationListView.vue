<script setup lang="ts">
import {
  computed,
  h,
  nextTick,
  onMounted,
  ref,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useIntersectionObserver } from '@vueuse/core'
import { DataTable, ActionCell, SearchInput } from '@mts241alikhlash/ui'
import { Button } from '@mts241alikhlash/ui/button'
import { Badge } from '@mts241alikhlash/ui/badge'
import { Card, CardHeader, CardTitle } from '@mts241alikhlash/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@mts241alikhlash/ui/dialog'
import { FloatingLabelField } from '@mts241alikhlash/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mts241alikhlash/ui/select'
import type { ColumnDef } from '@tanstack/vue-table'
import { Filter, Plus } from '@lucide/vue'
import { useApplicationList } from '../composables/useApplicationList'
import { useAdminRegistration } from '../composables/useAdminRegistration'
import { usePublicAdmission } from '../composables/usePublicAdmission'
import { useApplicationStore } from '../stores/applicationStore'
import { useAuthSession } from '@/features/platform/auth'
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
const { user } = useAuthSession()
const applicationStore = useApplicationStore()
if (applicationStore.listContext.ownerId !== user.value?.id)
  applicationStore.resetListContext()
const returning = applicationStore.listContext.returning
const savedContext = { ...applicationStore.listContext }
let restored = false
const requestedPage =
  typeof route.query.page === 'string' &&
  /^[1-9]\d*$/.test(route.query.page) &&
  Number.isSafeInteger(Number(route.query.page))
    ? Number(route.query.page)
    : 1

const searchQuery = ref(returning ? savedContext.search : '')
const statusFilter = ref<'ALL' | AdmissionStatus>(
  returning && savedContext.status in STATUS_LABELS
    ? (savedContext.status as AdmissionStatus)
    : typeof route.query.status === 'string' &&
        route.query.status in STATUS_LABELS
      ? (route.query.status as AdmissionStatus)
      : 'ALL',
)
const waveFilter = ref<string>(
  returning
    ? savedContext.waveId
    : typeof route.query.wave === 'string'
      ? route.query.wave
      : 'ALL',
)
const statusFilterId = useId()
const waveFilterId = useId()
const mobileStatusFilterId = useId()
const mobileWaveFilterId = useId()
const mobilePage = ref(returning ? savedContext.page : requestedPage)
const listStart = ref<HTMLElement | null>(null)
const changingPage = ref(false)
const pageLoadError = ref<string | null>(null)
let filterRevision = 0
const filterOpen = ref(false)
const activeFiltersCount = computed(
  () =>
    Number(statusFilter.value !== 'ALL') + Number(waveFilter.value !== 'ALL'),
)

const {
  applications,
  waves,
  totalItems,
  loading,
  listError,
  hasNextPage,
  isFetchingNextPage,
  isFetching,
  filtersPending,
  loadMore,
  refresh,
  fetchWaves,
} = useApplicationList(searchQuery, statusFilter, waveFilter)
const loadMoreButton = useTemplateRef('loadMoreButton')
useIntersectionObserver(loadMoreButton, ([entry]) => {
  if (entry?.isIntersecting) void loadMore()
})
const mobileApplications = computed(() =>
  applications.value.slice((mobilePage.value - 1) * 10, mobilePage.value * 10),
)
watch(
  [searchQuery, statusFilter, waveFilter],
  () => {
    filterRevision++
    mobilePage.value = 1
    pageLoadError.value = null
  },
  { flush: 'sync' },
)

async function nextMobilePage() {
  if (changingPage.value || filtersPending.value || isFetching.value) return
  const revision = filterRevision
  const from = mobilePage.value
  changingPage.value = true
  pageLoadError.value = null
  try {
    if (from * 10 >= applications.value.length) await loadMore()
    if (
      revision !== filterRevision ||
      from !== mobilePage.value ||
      listError.value
    )
      return
    if (applications.value.length > from * 10) {
      mobilePage.value = from + 1
      await nextTick()
      listStart.value?.scrollIntoView({ block: 'start', behavior: 'auto' })
    }
  } catch {
    if (revision === filterRevision)
      pageLoadError.value = 'Halaman berikutnya gagal dimuat. Coba lagi.'
  } finally {
    changingPage.value = false
  }
}

async function previousMobilePage() {
  mobilePage.value = Math.max(1, mobilePage.value - 1)
  await nextTick()
  listStart.value?.scrollIntoView({ block: 'start', behavior: 'auto' })
}

function resetFilters() {
  statusFilter.value = 'ALL'
  waveFilter.value = 'ALL'
}
function resetAllFilters() {
  resetFilters()
  searchQuery.value = ''
}
function saveListContext() {
  applicationStore.listContext = {
    ownerId: user.value?.id ?? null,
    search: searchQuery.value,
    status: statusFilter.value,
    waveId: waveFilter.value,
    page: mobilePage.value,
    scrollTop: listStart.value?.closest('[data-app-scroll]')?.scrollTop ?? 0,
    returning: true,
  }
}
watch(
  () => user.value?.id,
  (id) => {
    if (applicationStore.listContext.ownerId !== id)
      applicationStore.resetListContext()
  },
)

async function restoreListContext() {
  if (restored || loading.value || filtersPending.value) return
  restored = true
  if (!returning && requestedPage === 1) return
  const target = mobilePage.value
  while (
    applications.value.length < (target - 1) * 10 + 1 &&
    hasNextPage.value &&
    !listError.value
  ) {
    const previous = applications.value.length
    await loadMore()
    if (applications.value.length <= previous) break
  }
  mobilePage.value = Math.min(
    target,
    Math.max(1, Math.ceil(totalItems.value / 10)),
  )
  await nextTick()
  const container = listStart.value?.closest('[data-app-scroll]')
  if (returning && container && typeof container.scrollTo === 'function') {
    container.scrollTo({ top: savedContext.scrollTop, behavior: 'auto' })
  }
  applicationStore.listContext.returning = false
}
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
        onView: () => {
          saveListContext()
          void router.push(`/admin/applicants/${row.original.id}`)
        },
      }),
    enableSorting: false,
  },
])

onMounted(() => {
  void fetchWaves()
})
watch(
  [loading, filtersPending],
  () => {
    void restoreListContext()
  },
  { immediate: true },
)

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

      <div
        ref="listStart"
        class="space-y-4 p-4 sm:p-6"
      >
        <div class="hidden gap-3 md:flex md:items-end md:justify-between">
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
        <div class="flex items-center gap-2 md:hidden">
          <SearchInput
            v-model="searchQuery"
            label="Cari pendaftar"
            class="min-w-0 flex-1 [&_input]:h-11"
          />
          <Button
            variant="outline"
            class="relative min-h-11 shrink-0"
            @click="filterOpen = true"
          >
            <Filter class="mr-1.5 size-4" />
            Filter
            <span
              v-if="activeFiltersCount"
              class="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
            >
              {{ activeFiltersCount }}
            </span>
          </Button>
        </div>
        <div
          v-if="activeFiltersCount"
          class="flex flex-wrap gap-2 text-sm md:hidden"
        >
          <Button
            v-if="statusFilter !== 'ALL'"
            variant="outline"
            class="min-h-11"
            @click="statusFilter = 'ALL'"
          >
            Hapus filter status: {{ STATUS_LABELS[statusFilter] }}
          </Button>
          <Button
            v-if="waveFilter !== 'ALL'"
            variant="outline"
            class="min-h-11"
            @click="waveFilter = 'ALL'"
          >
            Hapus filter gelombang:
            {{
              waves.find((wave) => wave.id === waveFilter)?.name ?? waveFilter
            }}
          </Button>
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
            v-if="loading || filtersPending"
            class="text-center text-sm text-muted-foreground md:hidden"
          >
            Memuat pendaftar…
          </p>
          <div
            v-if="!loading && !filtersPending && !applications.length"
            class="space-y-3 rounded-md border p-4 text-center text-sm text-muted-foreground md:hidden"
          >
            <p>
              {{
                activeFiltersCount || searchQuery
                  ? 'Tidak ada pendaftar yang cocok dengan filter.'
                  : 'Tidak ada data.'
              }}
            </p>
            <Button
              v-if="activeFiltersCount || searchQuery"
              variant="outline"
              class="min-h-11"
              @click="resetAllFilters"
              >Atur Ulang</Button
            >
          </div>
          <ul
            v-if="!loading && !filtersPending && applications.length"
            data-test="mobile-applications"
            class="divide-y rounded-md border md:hidden"
          >
            <li
              v-for="item in mobileApplications"
              :key="item.id"
              class="min-w-0"
            >
              <RouterLink
                :to="`/admin/applicants/${item.id}`"
                class="flex min-h-14 min-w-0 items-center gap-2 px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
                @click="saveListContext"
              >
                <div class="min-w-0 flex-1">
                  <p class="break-words text-sm font-medium">
                    {{ item.fullName }}
                  </p>
                  <p class="break-all text-xs text-muted-foreground">
                    {{ item.registrationNumber }} · Pendaftaran:
                    {{ STATUS_LABELS[item.status] }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    Pembayaran:
                    {{
                      item.payment
                        ? PAYMENT_STATUS_LABELS[item.payment.status]
                        : '-'
                    }}
                  </p>
                </div>
              </RouterLink>
            </li>
          </ul>
          <div
            v-if="!loading && !filtersPending && totalItems > 0"
            class="flex flex-wrap items-center justify-between gap-2 text-sm md:hidden"
          >
            <span class="text-muted-foreground">
              {{ (mobilePage - 1) * 10 + 1 }}–{{
                Math.min(mobilePage * 10, totalItems)
              }}
              dari {{ totalItems }} pendaftar
            </span>
            <div
              v-if="totalItems > 10"
              class="flex flex-wrap gap-2"
            >
              <span class="self-center text-muted-foreground"
                >Halaman {{ mobilePage }} dari
                {{ Math.ceil(totalItems / 10) }}</span
              >
              <Button
                variant="outline"
                class="min-h-11"
                :disabled="mobilePage === 1"
                @click="previousMobilePage"
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                class="min-h-11"
                :disabled="
                  mobilePage * 10 >= totalItems ||
                  isFetchingNextPage ||
                  changingPage ||
                  isFetching ||
                  filtersPending
                "
                @click="nextMobilePage"
              >
                {{ changingPage ? 'Memuat…' : 'Selanjutnya' }}
              </Button>
            </div>
          </div>
          <p
            v-if="pageLoadError"
            role="alert"
            class="text-sm text-destructive md:hidden"
          >
            {{ pageLoadError }}
            <Button
              variant="outline"
              @click="nextMobilePage"
              >Coba lagi</Button
            >
          </p>
          <div
            v-if="hasNextPage"
            class="hidden flex-col items-center gap-2 md:flex"
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

    <Dialog v-model:open="filterOpen">
      <DialogContent class="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader class="border-b px-6 py-5">
          <DialogTitle>Filter Pendaftar</DialogTitle>
          <DialogDescription class="sr-only">
            Pilih status dan gelombang pendaftaran.
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 p-6">
          <FloatingLabelField
            label="Status"
            :for="mobileStatusFilterId"
            floating
          >
            <Select v-model="statusFilter">
              <SelectTrigger
                :id="mobileStatusFilterId"
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
            :for="mobileWaveFilterId"
            floating
          >
            <Select v-model="waveFilter">
              <SelectTrigger
                :id="mobileWaveFilterId"
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
        <DialogFooter class="flex-row gap-2 border-t px-6 py-4">
          <Button
            variant="outline"
            class="min-h-11 flex-1"
            @click="resetFilters"
          >
            Atur Ulang
          </Button>
          <Button
            class="min-h-11 flex-1"
            @click="filterOpen = false"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

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
