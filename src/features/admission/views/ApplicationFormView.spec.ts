// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import type { AdmissionApplication } from '../types'
import ApplicationFormView from './ApplicationFormView.vue'

const application: AdmissionApplication = {
  id: 'app-1',
  userId: 'user-1',
  waveId: 'wave-1',
  registrationNumber: 'REG-001',
  status: 'DRAFT',
  fullName: 'Budi',
  nickname: null,
  gender: null,
  birthPlace: null,
  birthDate: null,
  nik: null,
  nisn: null,
  religionId: null,
  phone: null,
  email: null,
  childOrder: null,
  siblingCount: null,
  street: null,
  rt: null,
  rw: null,
  village: null,
  district: null,
  city: null,
  province: null,
  postalCode: null,
  previousSchoolName: null,
  previousSchoolNpsn: null,
  previousSchoolAddress: null,
  graduationYear: null,
  submittedAt: null,
  revisionNote: null,
  verifiedAt: null,
  decidedAt: null,
  decisionNote: null,
  enrolledAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  wave: {
    id: 'wave-1',
    name: 'Gelombang 1',
    code: 'W1',
    academicYear: { id: 'year-1', name: '2026/2027' },
    startDate: '2026-01-01',
    endDate: '2026-02-01',
    quota: 100,
    registrationFee: 100000,
  },
  parents: [],
  documents: [],
  payment: null,
}

vi.mock('../composables/useMyApplication', () => ({
  useMyApplication: () => ({
    fetchMyApplication: vi.fn().mockResolvedValue(application),
    updateStep: vi.fn().mockResolvedValue({ success: true }),
    uploadDocument: vi.fn(),
    uploadPaymentProof: vi.fn(),
    submit: vi.fn().mockResolvedValue({ success: true }),
  }),
}))

vi.mock('@/features/platform/auth', () => ({
  useAuthStore: () => ({ user: { roles: [] } }),
}))

vi.mock('vue-sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  RouterLink: defineComponent({ template: '<a><slot /></a>' }),
}))

const passthrough = {
  template: '<div><slot /></div>',
}

const stubs = {
  PersonalDataStep: passthrough,
  ParentsStep: passthrough,
  AddressStep: passthrough,
  SchoolStep: passthrough,
  DocumentsStep: passthrough,
  PaymentStep: passthrough,
  ReviewStep: passthrough,
  StatusBadge: passthrough,
}

async function mountView() {
  const wrapper = mount(ApplicationFormView, { global: { stubs } })
  await flushPromises()
  await wrapper.vm.$nextTick()
  return wrapper
}

describe('ApplicationFormView locked wave field', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the wave name and academic year as plain text', async () => {
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Gelombang Pendaftaran')
    expect(wrapper.text()).toContain('Gelombang 1')
    expect(wrapper.text()).toContain('2026/2027')
  })

  it('never renders the wave as an input or focusable control', async () => {
    const wrapper = await mountView()

    const inputs = wrapper.findAll('input')
    expect(inputs.some((input) => input.element.value === 'Gelombang 1')).toBe(
      false,
    )
    expect(wrapper.find('[tabindex]').exists()).toBe(false)
  })
})
