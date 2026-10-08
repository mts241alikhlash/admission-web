// @vitest-environment happy-dom
import { beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DecisionListView from './DecisionListView.vue'

const service = vi.hoisted(() => ({
  fetchQueue: vi.fn(),
  accept: vi.fn(),
  reject: vi.fn(),
  acceptMany: vi.fn(),
  cancelAcceptance: vi.fn(),
  cancelRejection: vi.fn(),
}))
vi.mock('../services/decisionService', () => ({ decisionService: service }))
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

const router = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('vue-router', () => ({ useRouter: () => router }))

const passthrough = { template: '<div><slot /></div>' }

const row = (id: string, name: string, status = 'VERIFIED') => ({
  applicationId: id,
  registrationNumber: `PSB-${id}`,
  applicantName: name,
  waveName: 'Gelombang 1',
  status,
  submittedAt: '2026-10-01T00:00:00.000Z',
  verifiedAt: '2026-10-02T00:00:00.000Z',
  decidedAt: status === 'VERIFIED' ? null : '2026-10-03T00:00:00.000Z',
  decisionNote: null,
  paymentStatus: 'VERIFIED',
  summary: { approved: 3, rejected: 0, pending: 0, missing: 0, total: 3 },
})

const COUNTS = { waiting: 2, accepted: 1, rejected: 1 }

function page(rows: unknown[], counts = COUNTS, total = rows.length) {
  return { rows, total, counts }
}

function mountView() {
  return mount(DecisionListView, {
    global: {
      stubs: {
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

const tab = (wrapper: ReturnType<typeof mountView>, label: string) =>
  wrapper.findAll('[role="tab"]').find((t) => t.text().includes(label))!
const rowOf = (wrapper: ReturnType<typeof mountView>, index = 0) =>
  wrapper.findAll('[data-test="decision-row"]')[index]
const buttonOf = (parent: Pick<VueWrapper, 'findAll'>, text: string) =>
  parent.findAll('button').find((b) => b.text() === text)!

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
  access.granted = new Set([
    'admission-decisions.read',
    'admission-decisions.decide',
  ])
  service.fetchQueue.mockResolvedValue(
    page([row('a1', 'Ahmad Fauzi'), row('a2', 'Siti Aminah')]),
  )
  service.accept.mockResolvedValue({ success: true })
  service.reject.mockResolvedValue({ success: true })
  service.cancelAcceptance.mockResolvedValue({ success: true })
  service.cancelRejection.mockResolvedValue({ success: true })
  service.acceptMany.mockResolvedValue({
    success: true,
    accepted: 2,
    skipped: [],
  })
})

it('shows Menunggu keputusan first with the counts of every tab and each summary', async () => {
  const wrapper = mountView()
  await flushPromises()

  expect(service.fetchQueue).toHaveBeenCalledWith(
    expect.objectContaining({ tab: 'waiting', page: 1, limit: 50 }),
  )
  expect(tab(wrapper, 'Menunggu keputusan').text()).toContain('2')
  expect(tab(wrapper, 'Diterima').text()).toContain('1')
  expect(tab(wrapper, 'Ditolak').text()).toContain('1')
  expect(rowOf(wrapper).text()).toContain('Ahmad Fauzi')
  expect(rowOf(wrapper).text()).toContain('PSB-a1')
  expect(rowOf(wrapper).text()).toContain('3 disetujui dari 3 berkas wajib')
})

it('has no primary action in the card header', async () => {
  const wrapper = mountView()
  await flushPromises()

  expect(wrapper.get('[data-test="header"]').findAll('button')).toHaveLength(0)
})

it('opens the applicant detail', async () => {
  const wrapper = mountView()
  await flushPromises()

  await rowOf(wrapper).get('[data-test="open-detail"]').trigger('click')

  expect(router.push).toHaveBeenCalledWith('/admin/applicants/a1')
})

it('accepts one applicant with an optional note', async () => {
  const wrapper = mountView()
  await flushPromises()

  await buttonOf(rowOf(wrapper), 'Terima').trigger('click')
  await wrapper
    .get('[data-test="action-form"] textarea')
    .setValue('Selamat bergabung')
  await wrapper.get('[data-test="action-form"]').trigger('submit')
  await flushPromises()

  expect(service.accept).toHaveBeenCalledWith('a1', 'Selamat bergabung')
  expect(service.fetchQueue).toHaveBeenCalledTimes(2)
})

it('accepts without a note', async () => {
  const wrapper = mountView()
  await flushPromises()

  await buttonOf(rowOf(wrapper), 'Terima').trigger('click')
  await wrapper.get('[data-test="action-form"]').trigger('submit')
  await flushPromises()

  expect(service.accept).toHaveBeenCalledWith('a1', '')
})

it('rejects only with a reason', async () => {
  const wrapper = mountView()
  await flushPromises()

  await buttonOf(rowOf(wrapper), 'Tolak').trigger('click')
  await wrapper.get('[data-test="action-form"]').trigger('submit')
  await flushPromises()
  expect(service.reject).not.toHaveBeenCalled()
  expect(wrapper.text()).toContain('Alasan wajib diisi')

  await wrapper
    .get('[data-test="action-form"] textarea')
    .setValue('Kuota penuh')
  await wrapper.get('[data-test="action-form"]').trigger('submit')
  await flushPromises()

  expect(service.reject).toHaveBeenCalledWith('a1', 'Kuota penuh')
  expect(service.fetchQueue).toHaveBeenCalledTimes(2)
})

it('keeps the dialog open and the list unchanged when the action is refused', async () => {
  service.accept.mockResolvedValue({ success: false })
  const wrapper = mountView()
  await flushPromises()

  await buttonOf(rowOf(wrapper), 'Terima').trigger('click')
  await wrapper.get('[data-test="action-form"]').trigger('submit')
  await flushPromises()

  expect(service.fetchQueue).toHaveBeenCalledTimes(1)
  expect(wrapper.find('[data-test="action-form"]').exists()).toBe(true)
})

it('accepts the selected applicants after a confirmation with the count', async () => {
  const wrapper = mountView()
  await flushPromises()

  await rowOf(wrapper, 0).get('[role="checkbox"]').trigger('click')
  await rowOf(wrapper, 1).get('[role="checkbox"]').trigger('click')
  expect(wrapper.get('[data-test="selection-bar"]').text()).toContain(
    '2 dipilih',
  )

  await buttonOf(
    wrapper.get('[data-test="selection-bar"]'),
    'Terima terpilih',
  ).trigger('click')
  expect(wrapper.text()).toContain('2 pendaftar')
  await wrapper.get('[data-test="action-form"]').trigger('submit')
  await flushPromises()

  expect(service.acceptMany).toHaveBeenCalledWith(['a1', 'a2'], '')
  expect(service.fetchQueue).toHaveBeenCalledTimes(2)
  expect(wrapper.find('[data-test="selection-bar"]').exists()).toBe(false)
})

it('selects every loaded row at once', async () => {
  const wrapper = mountView()
  await flushPromises()

  await wrapper
    .get('[data-test="select-all"] [role="checkbox"]')
    .trigger('click')

  expect(wrapper.get('[data-test="selection-bar"]').text()).toContain(
    '2 dipilih',
  )
})

it('lists the skipped applicants with their reason after a mass accept', async () => {
  service.acceptMany.mockResolvedValue({
    success: true,
    accepted: 1,
    skipped: [
      { applicationId: 'a2', reason: 'Status pendaftar sudah berubah' },
    ],
  })
  const wrapper = mountView()
  await flushPromises()
  await wrapper
    .get('[data-test="select-all"] [role="checkbox"]')
    .trigger('click')
  await buttonOf(
    wrapper.get('[data-test="selection-bar"]'),
    'Terima terpilih',
  ).trigger('click')
  await wrapper.get('[data-test="action-form"]').trigger('submit')
  await flushPromises()

  const result = wrapper.get('[data-test="many-result"]')
  expect(result.text()).toContain('1 diterima, 1 dilewati')
  expect(result.text()).toContain('Siti Aminah')
  expect(result.text()).toContain('Status pendaftar sudah berubah')
})

it('forgets selected applicants that are no longer in the tab', async () => {
  const wrapper = mountView()
  await flushPromises()
  await rowOf(wrapper, 1).get('[role="checkbox"]').trigger('click')

  service.fetchQueue.mockResolvedValue(page([row('a1', 'Ahmad Fauzi')]))
  await buttonOf(rowOf(wrapper), 'Terima').trigger('click')
  await wrapper.get('[data-test="action-form"]').trigger('submit')
  await flushPromises()

  expect(wrapper.find('[data-test="selection-bar"]').exists()).toBe(false)
})

it('cancels an acceptance with a reason, except once enrolment started', async () => {
  service.fetchQueue.mockResolvedValue(
    page([
      row('a3', 'Budi', 'ACCEPTED'),
      row('a4', 'Dewi', 'ENROLLING'),
      row('a5', 'Eko', 'ENROLLED'),
    ]),
  )
  const wrapper = mountView()
  await flushPromises()
  await tab(wrapper, 'Diterima').trigger('mousedown')
  await flushPromises()

  expect(rowOf(wrapper, 1).text()).not.toContain('Batalkan penerimaan')
  expect(rowOf(wrapper, 2).text()).not.toContain('Batalkan penerimaan')
  expect(service.fetchQueue).toHaveBeenLastCalledWith(
    expect.objectContaining({ tab: 'accepted' }),
  )

  await buttonOf(rowOf(wrapper, 0), 'Batalkan penerimaan').trigger('click')
  await wrapper.get('[data-test="action-form"]').trigger('submit')
  await flushPromises()
  expect(service.cancelAcceptance).not.toHaveBeenCalled()

  await wrapper.get('[data-test="action-form"] textarea').setValue('Salah klik')
  await wrapper.get('[data-test="action-form"]').trigger('submit')
  await flushPromises()
  expect(service.cancelAcceptance).toHaveBeenCalledWith('a3', 'Salah klik')
})

it('cancels a rejection with a reason from the Ditolak tab', async () => {
  service.fetchQueue.mockResolvedValue(page([row('a6', 'Fajar', 'REJECTED')]))
  const wrapper = mountView()
  await flushPromises()
  await tab(wrapper, 'Ditolak').trigger('mousedown')
  await flushPromises()

  await buttonOf(rowOf(wrapper), 'Batalkan penolakan').trigger('click')
  await wrapper
    .get('[data-test="action-form"] textarea')
    .setValue('Banding diterima')
  await wrapper.get('[data-test="action-form"]').trigger('submit')
  await flushPromises()

  expect(service.cancelRejection).toHaveBeenCalledWith('a6', 'Banding diterima')
})

it('hides every action without the decide permission', async () => {
  access.granted = new Set(['admission-decisions.read'])
  const wrapper = mountView()
  await flushPromises()

  expect(wrapper.findAll('[role="checkbox"]')).toHaveLength(0)
  expect(wrapper.find('[data-test="selection-bar"]').exists()).toBe(false)
  expect(
    rowOf(wrapper)
      .findAll('button')
      .map((b) => b.text()),
  ).toEqual(['Lihat detail'])
})

it('says what an empty tab means', async () => {
  service.fetchQueue.mockResolvedValue(
    page([], { waiting: 0, accepted: 0, rejected: 0 }),
  )
  const wrapper = mountView()
  await flushPromises()

  expect(wrapper.text()).toContain(
    'Tidak ada pendaftar yang menunggu keputusan.',
  )
})

it('shows the load error with a retry', async () => {
  service.fetchQueue.mockResolvedValue({
    error: 'Gagal memuat antrean keputusan.',
  })
  const wrapper = mountView()
  await flushPromises()

  expect(wrapper.text()).toContain('Gagal memuat antrean keputusan.')
  service.fetchQueue.mockResolvedValue(page([]))
  await buttonOf(wrapper, 'Coba lagi').trigger('click')
  await flushPromises()

  expect(wrapper.find('[role="alert"]').exists()).toBe(false)
})

it('ignores a slow response from a tab that is no longer shown', async () => {
  let release: (value: unknown) => void = () => undefined
  service.fetchQueue.mockReturnValueOnce(
    new Promise((resolve) => (release = resolve)),
  )
  const wrapper = mountView()
  await flushPromises()

  service.fetchQueue.mockResolvedValue(
    page([row('a9', 'Siti Aminah', 'REJECTED')]),
  )
  await tab(wrapper, 'Ditolak').trigger('mousedown')
  await flushPromises()
  release(page([row('a1', 'Ahmad Fauzi')]))
  await flushPromises()

  expect(wrapper.text()).toContain('Siti Aminah')
  expect(wrapper.text()).not.toContain('Ahmad Fauzi')
})
