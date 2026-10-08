// @vitest-environment happy-dom
import { beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DocumentReviewListView from './DocumentReviewListView.vue'

const service = vi.hoisted(() => ({ fetchQueue: vi.fn() }))
vi.mock('../services/documentReviewService', () => ({
  documentReviewService: service,
}))
vi.mock('../services/applicationService', () => ({
  applicationService: { fetchWaves: vi.fn() },
}))

const router = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('vue-router', () => ({ useRouter: () => router }))

const row = {
  applicationId: 'app1',
  registrationNumber: 'PSB-001',
  applicantName: 'Ahmad Fauzi',
  waveName: 'Gelombang 1',
  status: 'SUBMITTED',
  submittedAt: '2026-10-01T00:00:00.000Z',
  summary: { approved: 3, rejected: 1, pending: 0, missing: 2, total: 6 },
}

function page(
  rows: unknown[],
  counts = { waiting: 1, revision: 2, done: 3 },
  total = rows.length,
) {
  return { rows, total, counts }
}

function mountView() {
  return mount(DocumentReviewListView)
}

function tab(wrapper: ReturnType<typeof mountView>, label: string) {
  return wrapper.findAll('[role="tab"]').find((t) => t.text().includes(label))!
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  service.fetchQueue.mockResolvedValue(page([row]))
})

it('shows Menunggu first with the counts of every tab and the summary of each applicant', async () => {
  const wrapper = mountView()
  await flushPromises()

  expect(service.fetchQueue).toHaveBeenCalledWith(
    expect.objectContaining({ tab: 'waiting', page: 1, limit: 50 }),
  )
  expect(tab(wrapper, 'Menunggu').text()).toContain('1')
  expect(tab(wrapper, 'Perlu perbaikan').text()).toContain('2')
  expect(tab(wrapper, 'Selesai').text()).toContain('3')
  const item = wrapper.get('[data-test="review-row"]')
  expect(item.text()).toContain('Ahmad Fauzi')
  expect(item.text()).toContain('PSB-001')
  expect(item.text()).toContain('Gelombang 1')
  expect(item.text()).toContain(
    '3 disetujui · 1 ditolak · 2 belum diunggah dari 6 berkas wajib',
  )
})

it('has no primary action in the card header', async () => {
  const wrapper = mountView()
  await flushPromises()

  const header = wrapper.get('[data-test="header"]')
  expect(header.text()).toContain('Verifikasi Berkas')
  expect(header.findAll('button')).toHaveLength(0)
})

it('opens the review page of an applicant', async () => {
  const wrapper = mountView()
  await flushPromises()

  await wrapper.get('[data-test="open-review"]').trigger('click')

  expect(router.push).toHaveBeenCalledWith('/admin/document-reviews/app1')
})

it('loads another tab when it is opened', async () => {
  const wrapper = mountView()
  await flushPromises()
  service.fetchQueue.mockResolvedValue(page([{ ...row, status: 'VERIFIED' }]))

  await tab(wrapper, 'Selesai').trigger('mousedown')
  await flushPromises()

  expect(service.fetchQueue).toHaveBeenLastCalledWith(
    expect.objectContaining({ tab: 'done', page: 1 }),
  )
})

it('says what an empty tab means', async () => {
  service.fetchQueue.mockResolvedValue(
    page([], { waiting: 0, revision: 0, done: 0 }),
  )
  const wrapper = mountView()
  await flushPromises()

  expect(wrapper.text()).toContain(
    'Tidak ada pendaftar yang menunggu pemeriksaan berkas.',
  )
})

it('loads the next page after fifty rows', async () => {
  const rows = Array.from({ length: 50 }, (_, index) => ({
    ...row,
    applicationId: `app${index}`,
  }))
  service.fetchQueue.mockResolvedValue(
    page(rows, { waiting: 60, revision: 0, done: 0 }, 60),
  )
  const wrapper = mountView()
  await flushPromises()
  service.fetchQueue.mockResolvedValue(
    page(
      [{ ...row, applicationId: 'app50' }],
      { waiting: 60, revision: 0, done: 0 },
      60,
    ),
  )

  await wrapper
    .findAll('button')
    .find((b) => b.text() === 'Muat lebih banyak')!
    .trigger('click')
  await flushPromises()

  expect(service.fetchQueue).toHaveBeenLastCalledWith(
    expect.objectContaining({ tab: 'waiting', page: 2 }),
  )
  expect(wrapper.findAll('[data-test="review-row"]')).toHaveLength(51)
})

it('shows the load error with a retry', async () => {
  service.fetchQueue.mockResolvedValue({
    error: 'Gagal memuat antrean berkas.',
  })
  const wrapper = mountView()
  await flushPromises()

  expect(wrapper.text()).toContain('Gagal memuat antrean berkas.')
  service.fetchQueue.mockResolvedValue(page([]))
  await wrapper
    .findAll('button')
    .find((b) => b.text() === 'Coba lagi')!
    .trigger('click')
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
    page([{ ...row, applicantName: 'Siti Aminah' }]),
  )
  await tab(wrapper, 'Selesai').trigger('mousedown')
  await flushPromises()
  release(page([row]))
  await flushPromises()

  expect(wrapper.text()).toContain('Siti Aminah')
  expect(wrapper.text()).not.toContain('Ahmad Fauzi')
})
