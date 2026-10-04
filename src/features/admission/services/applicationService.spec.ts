import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { admissionApi } from '../api/admissionApi'
import { useApplicationStore } from '../stores/applicationStore'
import { applicationService } from './applicationService'

vi.mock('../api/admissionApi', () => ({
  admissionApi: { getApplications: vi.fn(), getWaves: vi.fn() },
}))

vi.mock('vue-sonner', () => ({ toast: { error: vi.fn() } }))
vi.mock('@/features/platform/reference-data', () => ({
  useReferenceList: () => ({ read: vi.fn() }),
}))
vi.mock('@mts241alikhlash/web-shared/utils/notify-outage', () => ({
  notifyIfOutage: vi.fn(),
}))

describe('applicationService.fetchApplications', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('keeps newest results when requests resolve out of order', async () => {
    type ApplicationsResponse = Awaited<
      ReturnType<typeof admissionApi.getApplications>
    >
    const releases: ((value: ApplicationsResponse) => void)[] = []
    vi.mocked(admissionApi.getApplications).mockImplementation(
      () => new Promise((resolve) => releases.push(resolve)),
    )

    const older = applicationService.fetchApplications({ search: 'lama' })
    const newer = applicationService.fetchApplications({ search: 'baru' })
    releases[1]({
      data: { data: [{ id: 'new' }], meta: { total: 1 } },
    } as never)
    await newer
    releases[0]({
      data: { data: [{ id: 'old' }], meta: { total: 9 } },
    } as never)
    await older

    const store = useApplicationStore()
    expect(store.applications[0].id).toBe('new')
    expect(store.total).toBe(1)
    expect(store.loading).toBe(false)
  })

  it('clears stale rows and exposes a retryable error', async () => {
    const store = useApplicationStore()
    store.applications = [{ id: 'old' } as never]
    store.total = 8
    vi.mocked(admissionApi.getApplications)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({
        data: { data: [{ id: 'fresh' }], meta: { total: 1 } },
      } as never)

    await applicationService.fetchApplications({ page: 1 })
    expect(store.applications).toEqual([])
    expect(store.total).toBe(0)
    expect(store.error).toBeTruthy()
    expect(store.loading).toBe(false)

    await applicationService.fetchApplications({ page: 1 })
    expect(store.applications[0].id).toBe('fresh')
    expect(store.error).toBeNull()
  })
})
