// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import type {
  AdmissionApplicationListItem,
  AdmissionWaveSummary,
} from '../types'
import ApplicationListView from './ApplicationListView.vue'

const { rows, waves, fetchApplications, fetchWaves, push } = vi.hoisted(() => ({
  rows: [] as AdmissionApplicationListItem[],
  waves: [] as AdmissionWaveSummary[],
  fetchApplications: vi.fn(),
  fetchWaves: vi.fn(),
  push: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
  useRoute: () => ({ query: {} }),
}))

vi.mock('../composables/useApplicationList', async () => {
  const { ref } = await import('vue')
  return {
    useApplicationList: () => ({
      applications: ref(rows),
      waves: ref(waves),
      total: ref(rows.length),
      loading: ref(false),
      error: ref(null),
      fetchApplications,
      fetchWaves,
    }),
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
const input = defineComponent({
  props: { modelValue: String, id: String },
  emits: ['update:modelValue'],
  template:
    '<input :id="id" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
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
    page: Number,
    pageSize: Number,
  },
  template:
    '<div data-test="desktop-table" :class="$attrs.class"><slot name="header-right" /></div>',
})

const stubs = {
  AdminApplicationFormDialog: passthrough,
  Button: button,
  Card: passthrough,
  CardHeader: passthrough,
  CardTitle: passthrough,
  DataTable: dataTable,
  FloatingLabelField: floatingField,
  Input: input,
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
    vi.useFakeTimers()
    rows.splice(0, rows.length, {
      id: 'app-1',
      fullName: 'Contoh Panjang',
      registrationNumber: 'REG-001',
      status: 'DRAFT',
    } as AdmissionApplicationListItem)
    waves.splice(0, waves.length)
    vi.clearAllMocks()
  })

  afterEach(() => vi.useRealTimers())

  it('shows mobile applicant summary, labels, server filters, and pagination', async () => {
    const wrapper = mount(ApplicationListView, { global: { stubs } })
    await flushPromises()

    const mobile = wrapper.get('[data-test="mobile-applications"]')
    expect(mobile.text()).toContain('Contoh Panjang')
    expect(mobile.text()).toContain('REG-001')
    expect(mobile.text()).toContain('DRAFT')
    expect(mobile.find('button').text()).toBe('Detail')
    expect(wrapper.get('[aria-label="Halaman pendaftar"]').text()).toContain(
      'Halaman 1 dari 1',
    )
    expect(wrapper.get('[data-test="desktop-table"]').classes()).toContain(
      'hidden',
    )

    const search = wrapper.get('input')
    expect(search.attributes('id')).toBeTruthy()
    expect(wrapper.find(`label[for="${search.attributes('id')}"]`).text()).toBe(
      'Cari pendaftar',
    )
    expect(wrapper.find('[data-test="desktop-table"] input').exists()).toBe(
      false,
    )

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
    expect(fetchApplications).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'DRAFT' }),
    )

    await search.setValue('baru')
    await vi.advanceTimersByTimeAsync(500)
    await flushPromises()
    expect(fetchApplications).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'baru', status: 'DRAFT' }),
    )

    await mobile.find('button').trigger('click')
    expect(push).toHaveBeenCalledWith('/admin/applicants/app-1')
  })
})
