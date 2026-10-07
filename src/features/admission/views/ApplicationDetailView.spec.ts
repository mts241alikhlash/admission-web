// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import type { AdmissionApplication } from '../types'
import ApplicationDetailView from './ApplicationDetailView.vue'

const { application, acting, error, fetchDetail, setActing } = vi.hoisted(
  () => ({
    application: { value: null as AdmissionApplication | null },
    acting: { value: false },
    error: { value: null as 'not-found' | 'load-failed' | null },
    fetchDetail: vi.fn(),
    setActing: vi.fn(),
  }),
)

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'app-1' } }),
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('../composables/useApplicationDetail', async () => {
  const { ref } = await import('vue')
  return {
    useApplicationDetail: () => {
      const actingRef = ref(acting.value)
      setActing.mockImplementation((value: boolean) => {
        actingRef.value = value
      })
      return {
        application: ref(application.value),
        loading: ref(false),
        acting: actingRef,
        error: ref(error.value),
        fetchDetail,
        approveDocument: vi.fn(),
        rejectDocument: vi.fn(),
        verifyPaymentApprove: vi.fn(),
        rejectPayment: vi.fn(),
        requestRevision: vi.fn(),
        verifyApplication: vi.fn(),
        accept: vi.fn(),
        reject: vi.fn(),
        enroll: vi.fn(),
      }
    },
  }
})

vi.mock('../composables/useFormOptions', () => ({
  useFormOptions: () => ({
    load: vi.fn().mockResolvedValue(undefined),
    nameOf: () => '-',
  }),
}))

vi.mock('vue-sonner', () => ({ toast: { error: vi.fn() } }))

const card = defineComponent({ template: '<section><slot /></section>' })
const passthrough = defineComponent({ template: '<div><slot /></div>' })
const button = defineComponent({
  props: {
    asChild: Boolean,
    disabled: Boolean,
    variant: String,
    size: String,
  },
  template:
    '<button v-if="!asChild" :disabled="disabled"><slot /></button><slot v-else />',
})
const label = defineComponent({
  template: '<label v-bind="$attrs"><slot /></label>',
})
const input = defineComponent({
  inheritAttrs: false,
  template: '<input v-bind="$attrs" />',
})
const textarea = defineComponent({
  inheritAttrs: false,
  template: '<textarea v-bind="$attrs"></textarea>',
})

const stubs = {
  Card: card,
  CardContent: passthrough,
  CardDescription: passthrough,
  CardHeader: passthrough,
  CardTitle: passthrough,
  Badge: passthrough,
  Button: button,
  Dialog: passthrough,
  DialogContent: passthrough,
  DialogDescription: passthrough,
  DialogFooter: passthrough,
  DialogHeader: passthrough,
  DialogTitle: passthrough,
  ExternalLink: true,
  Input: input,
  Label: label,
  StatusBadge: passthrough,
  Textarea: textarea,
}

const draft: AdmissionApplication = {
  waveIsFull: false,
  id: 'app-1',
  userId: 'user-1',
  waveId: 'wave-1',
  registrationNumber: 'REG-001',
  status: 'DRAFT',
  fullName: 'Contoh Pendaftar',
  nickname: null,
  gender: null,
  birthPlace: null,
  birthDate: null,
  nik: null,
  nisn: null,
  religionId: null,
  phone: null,
  email: 'alamatemailyangpanjangtanpaspasi@example.test',
  childOrder: 0,
  siblingCount: 0,
  street: 'JalanPanjangTanpaSpasi'.repeat(5),
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
    academicYearId: 'year-1',
    academicYear: { id: 'year-1', name: '2026/2027' },
    startDate: '2026-01-01',
    endDate: '2026-02-01',
    quota: 100,
    registrationFee: 100000,
    description: null,
    isActive: true,
    lastRegistrationSeq: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  parents: [],
  documents: [],
  payment: null,
  documentTypes: [],
}

async function mountView() {
  const wrapper = mount(ApplicationDetailView, { global: { stubs } })
  await flushPromises()
  return wrapper
}

async function openTab(
  wrapper: Awaited<ReturnType<typeof mountView>>,
  label: string,
) {
  await wrapper
    .findAll('button')
    .find((node) => node.text() === label)!
    .trigger('mousedown')
  await flushPromises()
}

describe('ApplicationDetailView', () => {
  beforeEach(() => {
    application.value = { ...draft }
    acting.value = false
    error.value = null
    vi.clearAllMocks()
  })

  it('groups draft values, wraps long values, and avoids nested link buttons', async () => {
    const wrapper = await mountView()

    expect(wrapper.text()).not.toContain('Dikirim -')
    expect(wrapper.text()).not.toContain('-, -')
    expect(wrapper.text()).toContain('Belum diisi')
    expect(wrapper.find('a button').exists()).toBe(false)

    const email = wrapper
      .findAll('dd')
      .find((node) => node.text() === draft.email)
    await openTab(wrapper, 'Alamat')
    const street = wrapper
      .findAll('dd')
      .find((node) => node.text() === draft.street)
    expect(email?.classes()).toContain('break-all')
    expect(street?.classes()).toContain('break-words')
  })

  it('lists documents in a table with review actions only for unapproved files', async () => {
    application.value = {
      ...draft,
      documentTypes: [
        { id: 'kk', code: 'KK', name: 'Kartu Keluarga', isRequired: true },
        { id: 'akta', code: 'AKTA', name: 'Akta Kelahiran', isRequired: true },
        { id: 'foto', code: 'FOTO', name: 'Pas Foto', isRequired: false },
      ],
      documents: [
        {
          id: 'doc-kk',
          documentTypeId: 'kk',
          status: 'APPROVED',
          note: null,
          file: { originalName: 'kk.pdf', storageKey: 'files/kk.pdf' },
        },
        {
          id: 'doc-akta',
          documentTypeId: 'akta',
          status: 'REJECTED',
          note: 'Buram',
          file: { originalName: 'akta.pdf', storageKey: 'files/akta.pdf' },
        },
      ],
    } as unknown as AdmissionApplication
    const wrapper = await mountView()
    await openTab(wrapper, 'Berkas')

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(3)
    expect(rows[0].text()).toContain('Disetujui')
    expect(rows[0].text()).not.toContain('Setujui')
    expect(rows[0].find('a').attributes('href')).toContain('files/kk.pdf')
    expect(rows[1].text()).toContain('Ditolak')
    expect(rows[1].text()).toContain('Catatan: Buram')
    expect(rows[1].text()).toContain('Setujui')
    expect(rows[1].text()).toContain('Tolak')
    expect(rows[2].text()).toContain('Belum diunggah')
    expect(rows[2].text()).not.toContain('Wajib')
    expect(rows[2].text()).not.toContain('Setujui')
  })

  it('marks a document of a deactivated type', async () => {
    application.value = {
      ...draft,
      documentTypes: [
        {
          id: 'old',
          code: 'OLD',
          name: 'Berkas Lama',
          isRequired: false,
          isActive: false,
          sortOrder: 9,
        },
      ],
      documents: [
        {
          id: 'doc-old',
          documentTypeId: 'old',
          status: 'PENDING',
          note: null,
          file: { originalName: 'lama.pdf', storageKey: 'files/lama.pdf' },
        },
      ],
    } as unknown as AdmissionApplication
    const wrapper = await mountView()
    await openTab(wrapper, 'Berkas')

    expect(wrapper.text()).toContain('Berkas Lama (nonaktif)')
  })

  it('shows an empty state when the wave has no document types', async () => {
    const wrapper = await mountView()
    await openTab(wrapper, 'Berkas')
    expect(wrapper.text()).toContain('Belum ada jenis berkas')
  })

  it('associates decision fields with labels and disables actions while acting', async () => {
    application.value = { ...draft, status: 'ACCEPTED' }
    acting.value = false
    const wrapper = await mountView()
    await wrapper
      .findAll('button')
      .find((node) => node.text() === 'Proses Jadi Santri')!
      .trigger('click')

    for (const field of wrapper.findAll('input, textarea')) {
      const id = field.attributes('id')
      expect(id).toBeTruthy()
      expect(wrapper.find(`label[for="${id}"]`).exists()).toBe(true)
    }

    setActing(true)
    await nextTick()
    expect(
      wrapper
        .findAll('button')
        .filter((node) => ['Batal', 'Konfirmasi'].includes(node.text()))
        .every((node) => node.attributes('disabled') !== undefined),
    ).toBe(true)
  })

  it('shows retry only for load failures and keeps 404 distinct', async () => {
    application.value = null
    error.value = 'load-failed'
    const wrapper = await mountView()
    expect(wrapper.text()).toContain('Gagal memuat detail pendaftar.')
    const retry = wrapper
      .findAll('button')
      .find((node) => node.text() === 'Coba lagi')
    expect(retry).toBeTruthy()
    fetchDetail.mockClear()
    await retry!.trigger('click')
    expect(fetchDetail).toHaveBeenCalledWith('app-1')

    application.value = null
    error.value = 'not-found'
    const notFound = await mountView()
    expect(notFound.text()).toContain('Pendaftar tidak ditemukan.')
    expect(notFound.text()).not.toContain('Coba lagi')
  })
})
