// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, ref, type Ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import type {
  AdmissionApplicationListItem,
  AdmissionWaveSummary,
} from '../types'
import ApplicationListView from './ApplicationListView.vue'
import { useApplicationStore } from '../stores/applicationStore'

const { rows, waves, filters, fetchWaves, push } = vi.hoisted(() => ({
  rows: [] as AdmissionApplicationListItem[],
  waves: [] as AdmissionWaveSummary[],
  filters: {} as Record<'search' | 'status' | 'waveId', Ref<string>>,
  fetchWaves: vi.fn(),
  push: vi.fn(),
}))
const listState = {
  applications: ref<AdmissionApplicationListItem[]>([]),
  totalItems: ref(0),
  loading: ref(false),
  listError: ref<string | null>(null),
  hasNextPage: ref(false),
  isFetchingNextPage: ref(false),
  isFetching: ref(false),
  filtersPending: ref(false),
  loadMore: vi.fn(),
}
const sessionUser = ref({ id: 'admin-1' })
vi.mock('@/features/platform/auth', () => ({
  useAuthSession: () => ({ user: sessionUser }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
  useRoute: () => ({ query: {} }),
  RouterLink: defineComponent({
    props: { to: String },
    template: '<a :href="to"><slot /></a>',
  }),
}))

vi.mock('../composables/useApplicationList', async () => {
  const { ref } = await import('vue')
  return {
    useApplicationList: (
      search: Ref<string>,
      status: Ref<string>,
      waveId: Ref<string>,
    ) => {
      Object.assign(filters, { search, status, waveId })
      return {
        applications: listState.applications,
        waves: ref(waves),
        totalItems: listState.totalItems,
        loading: listState.loading,
        listError: listState.listError,
        hasNextPage: listState.hasNextPage,
        isFetchingNextPage: listState.isFetchingNextPage,
        isFetching: listState.isFetching,
        filtersPending: listState.filtersPending,
        loadMore: listState.loadMore,
        refresh: vi.fn(),
        fetchWaves,
      }
    },
  }
})

vi.mock('../composables/useAdminRegistration', () => ({
  useAdminRegistration: () => ({
    applicationId: null,
    credentials: null,
    registerApplicant: vi.fn(),
    clearCredentials: vi.fn(),
    reset: vi.fn(),
    fetchApplication: vi.fn(),
    updateStep: vi.fn(),
    uploadDocument: vi.fn(),
    uploadAttachment: vi.fn(),
    uploadPaymentProof: vi.fn(),
    submit: vi.fn(),
  }),
}))

vi.mock('../composables/usePublicAdmission', () => ({
  usePublicAdmission: () => ({ fetchActiveWaves: vi.fn() }),
}))

const passthrough = defineComponent({ template: '<div><slot /></div>' })
const floatingField = defineComponent({
  props: { label: String, for: String, floating: Boolean },
  template: '<div><label :for="$props.for">{{ label }}</label><slot /></div>',
})
const searchInput = defineComponent({
  props: { modelValue: String, label: String },
  emits: ['update:modelValue'],
  template:
    '<input :aria-label="label" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
})
const button = defineComponent({
  props: { variant: String, disabled: Boolean },
  template: '<button :disabled="disabled"><slot /></button>',
})
const select = defineComponent({
  name: 'SelectStub',
  props: { modelValue: String },
  emits: ['update:modelValue'],
  template: '<div><slot /></div>',
})
const trigger = defineComponent({
  props: { id: String, class: String },
  template: '<button :id="id" type="button"><slot /></button>',
})
const item = defineComponent({
  props: { value: String },
  template: '<option :value="value"><slot /></option>',
})
const dataTable = defineComponent({
  props: {
    columns: Array,
    data: Array,
    isLoading: Boolean,
    totalItems: Number,
  },
  template:
    '<div data-test="desktop-table" :class="$attrs.class"><slot name="header-right" /></div>',
})

const stubs = {
  RouterLink: defineComponent({
    props: { to: String },
    template: '<a :href="to"><slot /></a>',
  }),
  Button: button,
  Card: passthrough,
  CardHeader: passthrough,
  CardTitle: passthrough,
  DataTable: dataTable,
  FloatingLabelField: floatingField,
  SearchInput: searchInput,
  Plus: true,
  RegisterApplicantDialog: passthrough,
  Select: select,
  SelectContent: passthrough,
  SelectItem: item,
  SelectTrigger: trigger,
  SelectValue: passthrough,
  StatusBadge: defineComponent({
    props: { status: String },
    template: '<span>{{ status }}</span>',
  }),
}

describe('ApplicationListView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    rows.splice(0, rows.length, {
      id: 'app-1',
      fullName: 'Contoh Panjang',
      registrationNumber: 'REG-001',
      status: 'DRAFT',
    } as AdmissionApplicationListItem)
    waves.splice(0, waves.length)
    listState.applications.value = [...rows]
    listState.totalItems.value = rows.length
    listState.loading.value = false
    listState.listError.value = null
    listState.hasNextPage.value = false
    listState.isFetchingNextPage.value = false
    listState.isFetching.value = false
    listState.filtersPending.value = false
    vi.clearAllMocks()
  })

  afterEach(() => vi.useRealTimers())

  it('shows mobile applicant summary, labels, and server filters', async () => {
    const wrapper = mount(ApplicationListView, { global: { stubs } })
    await flushPromises()

    const mobile = wrapper.get('[data-test="mobile-applications"]')
    expect(mobile.text()).toContain('Contoh Panjang')
    expect(mobile.text()).toContain('REG-001')
    expect(mobile.text()).toContain('Pendaftaran: Draft')
    expect(mobile.find('a[href="/admin/applicants/app-1"]').exists()).toBe(true)
    expect(wrapper.get('[data-test="desktop-table"]').classes()).toContain(
      'hidden',
    )

    const search = wrapper.get('input[aria-label="Cari pendaftar"]')

    for (const labelText of ['Status', 'Gelombang']) {
      const label = wrapper
        .findAll('label')
        .find((node) => node.text() === labelText)
      expect(label).toBeTruthy()
      expect(label!.attributes('for')).toBeTruthy()
      expect(wrapper.find(`#${label!.attributes('for')}`).exists()).toBe(true)
    }

    const selectors = wrapper.findAllComponents({ name: 'SelectStub' })
    ;(
      selectors[0].vm as { $emit: (event: string, value: unknown) => void }
    ).$emit('update:modelValue', 'DRAFT')
    expect(filters.status.value).toBe('DRAFT')

    await search.setValue('baru')
    expect(filters.search.value).toBe('baru')

    wrapper.unmount()
  })

  it('never advances using a stale fetch after filters change', async () => {
    listState.applications.value = Array.from({ length: 20 }, (_, index) => ({
      ...rows[0],
      id: `app-${index}`,
      fullName: `Nama ${index}`,
    }))
    listState.totalItems.value = 50
    let finish!: () => void
    listState.loadMore.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
    )
    const wrapper = mount(ApplicationListView, { global: { stubs } })
    const next = () =>
      wrapper
        .findAll('button')
        .find((button) => button.text() === 'Selanjutnya')!
    await next().trigger('click')
    expect(wrapper.text()).toContain('11–20')
    await next().trigger('click')
    filters.status.value = 'DRAFT'
    filters.status.value = 'ALL'
    listState.applications.value = Array.from({ length: 20 }, (_, index) => ({
      ...rows[0],
      id: `filtered-${index}`,
      fullName: `Filter Baru ${index}`,
    }))
    listState.totalItems.value = 50
    finish()
    await flushPromises()
    expect(wrapper.text()).toContain('1–10')
    expect(wrapper.get('[data-test="mobile-applications"]').text()).toContain(
      'Filter Baru',
    )
    expect(
      wrapper.get('[data-test="mobile-applications"]').text(),
    ).not.toContain('Nama 10')
    wrapper.unmount()
  })

  it.each([0, 1, 10, 11, 50])(
    'shows at most ten of %i applicants per mobile page',
    (count) => {
      listState.applications.value = Array.from(
        { length: count },
        (_, index) => ({
          ...rows[0],
          id: `app-${index}`,
          fullName: `Nama ${index}`,
        }),
      )
      listState.totalItems.value = count
      const wrapper = mount(ApplicationListView, { global: { stubs } })
      expect(
        wrapper.findAll('[data-test="mobile-applications"] li'),
      ).toHaveLength(Math.min(count, 10))
      if (count > 10) {
        expect(wrapper.text()).toContain(
          `Halaman 1 dari ${Math.ceil(count / 10)}`,
        )
        expect(
          wrapper
            .findAll('button')
            .find((button) => button.text() === 'Sebelumnya')
            ?.attributes('disabled'),
        ).toBeDefined()
      }
      wrapper.unmount()
    },
  )

  it('does not expose old results while filters are pending', async () => {
    const wrapper = mount(ApplicationListView, { global: { stubs } })
    listState.filtersPending.value = true
    await flushPromises()
    expect(wrapper.find('[data-test="mobile-applications"]').exists()).toBe(
      false,
    )
    expect(wrapper.text()).toContain('Memuat pendaftar')
    wrapper.unmount()
  })

  it('keeps search and page when returning from an applicant detail', async () => {
    listState.applications.value = Array.from({ length: 30 }, (_, index) => ({
      ...rows[0],
      id: `app-${index}`,
      fullName: `Nama ${index}`,
    }))
    listState.totalItems.value = 30
    const wrapper = mount(ApplicationListView, { global: { stubs } })
    await wrapper.get('input[aria-label="Cari pendaftar"]').setValue('Budi')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Selanjutnya')!
      .trigger('click')
    await wrapper.get('[data-test="mobile-applications"] a').trigger('click')
    expect(useApplicationStore().listContext.returning).toBe(true)
    wrapper.unmount()
    const returned = mount(ApplicationListView, { global: { stubs } })
    await flushPromises()
    expect(filters.search.value).toBe('Budi')
    expect(returned.text()).toContain('11–20')
    returned.unmount()
  })

  it('waits for fresh results before restoring and clamps a page that no longer exists', async () => {
    useApplicationStore().listContext = {
      ownerId: 'admin-1',
      search: '',
      status: 'ALL',
      waveId: 'ALL',
      page: 3,
      scrollTop: 420,
      returning: true,
    }
    listState.loading.value = true
    listState.applications.value = []
    listState.totalItems.value = 0
    const wrapper = mount(ApplicationListView, { global: { stubs } })
    expect(useApplicationStore().listContext.returning).toBe(true)
    listState.applications.value = Array.from({ length: 11 }, (_, index) => ({
      ...rows[0],
      id: `app-${index}`,
      fullName: `Nama ${index}`,
    }))
    listState.totalItems.value = 11
    listState.loading.value = false
    await flushPromises()
    expect(wrapper.text()).toContain('Halaman 2 dari 2')
    wrapper.unmount()
  })

  it('does not restore another admin’s search', () => {
    useApplicationStore().listContext = {
      ownerId: 'previous-admin',
      search: 'Rahasia',
      status: 'DRAFT',
      waveId: 'wave-1',
      page: 3,
      scrollTop: 420,
      returning: true,
    }
    const wrapper = mount(ApplicationListView, { global: { stubs } })
    expect(filters.search.value).toBe('')
    expect(useApplicationStore().listContext.ownerId).toBe(null)
    wrapper.unmount()
  })

  it('lets an admin remove only the active status filter', async () => {
    const wrapper = mount(ApplicationListView, { global: { stubs } })
    filters.status.value = 'DRAFT'
    filters.waveId.value = 'wave-1'
    await flushPromises()
    const clearStatus = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Hapus filter status'))
    expect(clearStatus).toBeTruthy()
    await clearStatus!.trigger('click')
    expect(filters.status.value).toBe('ALL')
    expect(filters.waveId.value).toBe('wave-1')
    wrapper.unmount()
  })

  it('preserves list context when opening a detail from desktop table', async () => {
    const wrapper = mount(ApplicationListView, { global: { stubs } })
    await wrapper.get('input[aria-label="Cari pendaftar"]').setValue('Nama')
    const columns = wrapper.getComponent(dataTable).props('columns') as {
      id: string
      cell: (context: { row: { original: AdmissionApplicationListItem } }) => {
        props: { onView: () => void }
      }
    }[]
    const action = columns.find((column) => column.id === 'actions')!
    action.cell({ row: { original: rows[0] } }).props.onView()
    expect(useApplicationStore().listContext).toMatchObject({
      search: 'Nama',
      returning: true,
    })
    wrapper.unmount()
  })
})
