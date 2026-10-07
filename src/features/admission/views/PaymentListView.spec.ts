// @vitest-environment happy-dom
import { beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PaymentListView from './PaymentListView.vue'

const service = vi.hoisted(() => ({
  fetchQueue: vi.fn(),
  verify: vi.fn(),
  reject: vi.fn(),
  cancel: vi.fn(),
}))
vi.mock('../services/paymentQueueService', () => ({
  paymentQueueService: service,
}))
vi.mock('../services/applicationService', () => ({
  applicationService: { fetchWaves: vi.fn() },
}))

const access = vi.hoisted(() => ({ granted: new Set<string>() }))
vi.mock('@/features/platform/auth', () => ({
  useRoleGuard: () => ({
    can: (...permissions: string[]) =>
      permissions.some((p) => access.granted.has(p)),
  }),
}))

const route = vi.hoisted(() => ({ query: {} as Record<string, string> }))
vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ replace: vi.fn() }),
}))

const passthrough = { template: '<div><slot /></div>' }
const AddPaymentDialogStub = {
  props: ['open', 'initialApplicationId'],
  template:
    '<div data-test="add-dialog" :data-open="open" :data-applicant="initialApplicationId" />',
}

const ALL = [
  'admission-payments.read',
  'admission-payments.verify',
  'admission-payments.create',
]

const pending = {
  paymentId: 'p1',
  applicationId: 'app1',
  registrationNumber: 'PSB-001',
  applicantName: 'Ahmad Fauzi',
  applicationStatus: 'SUBMITTED',
  waveId: 'w1',
  waveName: 'Gelombang 1',
  amount: 150000,
  status: 'PENDING',
  note: null,
  bankName: 'BSI',
  senderAccountName: 'Budi Santoso',
  transferDate: '2026-10-01T00:00:00.000Z',
  bankAccount: {
    id: 'a1',
    bankName: 'BSI',
    accountNumber: '7123456789',
    accountHolder: 'MTs Al-Ikhlash',
  },
  proofFile: {
    id: 'f1',
    originalName: 'bukti.png',
    mimeType: 'image/png',
    storageKey: 'payments/bukti.png',
  },
  proofUploadedByStaff: false,
  verifiedById: null,
  verifiedAt: null,
  updatedAt: '2026-10-02T00:00:00.000Z',
}
const verified = {
  ...pending,
  paymentId: 'p2',
  applicationId: 'app2',
  status: 'VERIFIED',
}

function page(
  rows: unknown[],
  counts = { pending: 1, verified: 1, rejected: 0 },
) {
  return { rows, total: rows.length, counts }
}

function mountView() {
  return mount(PaymentListView, {
    global: {
      stubs: {
        AddPaymentDialog: AddPaymentDialogStub,
        Dialog: passthrough,
        DialogContent: passthrough,
        DialogHeader: passthrough,
        DialogTitle: passthrough,
        DialogDescription: passthrough,
        DialogFooter: passthrough,
      },
    },
  })
}

function tab(wrapper: ReturnType<typeof mountView>, label: string) {
  return wrapper.findAll('[role="tab"]').find((t) => t.text().includes(label))!
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  access.granted = new Set(ALL)
  route.query = {}
  service.fetchQueue.mockResolvedValue(page([pending]))
})

it('shows the pending tab first with the counts of every tab', async () => {
  const wrapper = mountView()
  await flushPromises()

  expect(service.fetchQueue).toHaveBeenCalledWith(
    expect.objectContaining({ status: 'PENDING', page: 1 }),
  )
  expect(tab(wrapper, 'Menunggu').text()).toContain('1')
  expect(tab(wrapper, 'Terverifikasi').text()).toContain('1')
  const row = wrapper.get('[data-test="payment-row"]')
  expect(row.text()).toContain('Ahmad Fauzi')
  expect(row.text()).toContain('PSB-001')
  expect(row.text()).toContain('Gelombang 1')
  expect(row.text()).toContain('Budi Santoso')
  expect(row.find('a[href$="payments/bukti.png"]').exists()).toBe(true)
})

it('loads another status when its tab is opened', async () => {
  const wrapper = mountView()
  await flushPromises()
  service.fetchQueue.mockResolvedValue(page([verified]))

  await tab(wrapper, 'Terverifikasi').trigger('mousedown')
  await flushPromises()

  expect(service.fetchQueue).toHaveBeenLastCalledWith(
    expect.objectContaining({ status: 'VERIFIED', page: 1 }),
  )
})

it('verifies a pending payment and reloads', async () => {
  service.verify.mockResolvedValue({ success: true })
  const wrapper = mountView()
  await flushPromises()

  await wrapper
    .get('[data-test="payment-row"]')
    .findAll('button')
    .find((b) => b.text() === 'Verifikasi')!
    .trigger('click')
  await flushPromises()

  expect(service.verify).toHaveBeenCalledWith('app1')
  expect(service.fetchQueue).toHaveBeenCalledTimes(2)
})

it('rejects only with a reason', async () => {
  service.reject.mockResolvedValue({ success: true })
  const wrapper = mountView()
  await flushPromises()

  await wrapper
    .get('[data-test="payment-row"]')
    .findAll('button')
    .find((b) => b.text() === 'Tolak')!
    .trigger('click')
  await wrapper.get('[data-test="reason-form"]').trigger('submit')
  await flushPromises()
  expect(service.reject).not.toHaveBeenCalled()
  expect(wrapper.text()).toContain('Alasan wajib diisi')

  await wrapper.get('textarea').setValue('Nominal tidak sesuai')
  await wrapper.get('[data-test="reason-form"]').trigger('submit')
  await flushPromises()

  expect(service.reject).toHaveBeenCalledWith('app1', 'Nominal tidak sesuai')
  expect(service.fetchQueue).toHaveBeenCalledTimes(2)
})

it('cancels a verification only with a reason, and only from the verified tab', async () => {
  service.cancel.mockResolvedValue({ success: true })
  const wrapper = mountView()
  await flushPromises()
  expect(wrapper.text()).not.toContain('Batalkan verifikasi')

  service.fetchQueue.mockResolvedValue(page([verified]))
  await tab(wrapper, 'Terverifikasi').trigger('mousedown')
  await flushPromises()
  await wrapper
    .get('[data-test="payment-row"]')
    .findAll('button')
    .find((b) => b.text() === 'Batalkan verifikasi')!
    .trigger('click')
  await wrapper.get('textarea').setValue('Salah nominal')
  await wrapper.get('[data-test="reason-form"]').trigger('submit')
  await flushPromises()

  expect(service.cancel).toHaveBeenCalledWith('app2', 'Salah nominal')
})

it('keeps the dialog open and the list unchanged when the action is refused', async () => {
  service.reject.mockResolvedValue({ success: false })
  const wrapper = mountView()
  await flushPromises()

  await wrapper
    .get('[data-test="payment-row"]')
    .findAll('button')
    .find((b) => b.text() === 'Tolak')!
    .trigger('click')
  await wrapper.get('textarea').setValue('x')
  await wrapper.get('[data-test="reason-form"]').trigger('submit')
  await flushPromises()

  expect(service.fetchQueue).toHaveBeenCalledTimes(1)
  expect(wrapper.find('[data-test="reason-form"]').exists()).toBe(true)
})

it('shows no action buttons and no add button without the verify and create permissions', async () => {
  access.granted = new Set(['admission-payments.read'])
  const wrapper = mountView()
  await flushPromises()

  const row = wrapper.get('[data-test="payment-row"]')
  expect(row.findAll('button')).toHaveLength(0)
  expect(
    wrapper
      .findAll('button')
      .filter((b) => b.text().includes('Tambah Pembayaran')),
  ).toHaveLength(0)
})

it('shows an empty message and a retry on a load error', async () => {
  service.fetchQueue.mockResolvedValue({ error: 'Gagal memuat pembayaran.' })
  const wrapper = mountView()
  await flushPromises()

  expect(wrapper.text()).toContain('Gagal memuat pembayaran.')
  service.fetchQueue.mockResolvedValue(
    page([], { pending: 0, verified: 0, rejected: 0 }),
  )
  await wrapper
    .findAll('button')
    .find((b) => b.text() === 'Coba lagi')!
    .trigger('click')
  await flushPromises()

  expect(wrapper.text()).toContain('Tidak ada pembayaran')
})

it('opens the add dialog for the applicant named in the address', async () => {
  route.query = { applicationId: 'app9' }
  const wrapper = mountView()
  await flushPromises()

  const dialog = wrapper.get('[data-test="add-dialog"]')
  expect(dialog.attributes('data-open')).toBe('true')
  expect(dialog.attributes('data-applicant')).toBe('app9')
})

it('opens the add dialog from the header button', async () => {
  const wrapper = mountView()
  await flushPromises()

  await wrapper
    .findAll('button')
    .find((b) => b.text().includes('Tambah Pembayaran'))!
    .trigger('click')

  expect(wrapper.get('[data-test="add-dialog"]').attributes('data-open')).toBe(
    'true',
  )
})
