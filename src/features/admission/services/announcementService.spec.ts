import { beforeEach, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { announcementService } from './announcementService'
import { admissionApi } from '../api/admissionApi'
import { useAnnouncementStore } from '../stores/announcementStore'

vi.mock('../api/admissionApi', () => ({
  admissionApi: { getManageAnnouncements: vi.fn(), getWaves: vi.fn() },
}))
vi.mock('@/features/platform/reference-data', () => ({
  useReferenceList: () => ({
    read: (_key: string, loader: () => Promise<unknown>) => loader(),
  }),
}))
vi.mock('vue-sonner', () => ({ toast: { error: vi.fn() } }))

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

it('clears stale announcements on failure and recovers on retry', async () => {
  const store = useAnnouncementStore()
  store.announcements = [{ id: 'old' }] as typeof store.announcements
  store.totalItems = 1
  vi.mocked(admissionApi.getManageAnnouncements).mockRejectedValueOnce(
    new Error('offline'),
  )
  vi.mocked(admissionApi.getWaves).mockResolvedValue({
    data: { data: [] },
  } as never)
  await announcementService.fetchData()
  expect(store.announcements).toEqual([])
  expect(store.totalItems).toBe(0)
  expect(store.listError).toBeTruthy()
  expect(store.loading).toBe(false)
  vi.mocked(admissionApi.getManageAnnouncements).mockResolvedValueOnce({
    data: { data: [{ id: 'new' }], meta: { total: 1 } },
  } as never)
  await announcementService.fetchData()
  expect(store.announcements[0]?.id).toBe('new')
  expect(store.listError).toBeNull()
})
