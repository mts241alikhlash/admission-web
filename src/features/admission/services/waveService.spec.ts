import { beforeEach, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { admissionApi } from '../api/admissionApi'
import { useWaveStore } from '../stores/waveStore'
import { waveService } from './waveService'

vi.mock('vue-sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock('../api/admissionApi', () => ({ admissionApi: { getWaves: vi.fn() } }))

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

it('clears stale waves on failure and recovers on retry', async () => {
  const store = useWaveStore()
  store.waves = [{ id: 'old', name: 'Lama' }] as typeof store.waves
  store.totalItems = 1
  vi.mocked(admissionApi.getWaves).mockRejectedValueOnce(new Error('offline'))
  await waveService.fetchWaves()
  expect(store.waves).toEqual([])
  expect(store.totalItems).toBe(0)
  expect(store.listError).toBeTruthy()
  vi.mocked(admissionApi.getWaves).mockResolvedValueOnce({
    data: { data: [{ id: 'new', name: 'Baru' }], meta: { total: 1 } },
  } as never)
  await waveService.fetchWaves()
  expect(store.listError).toBeNull()
  expect(store.waves[0].id).toBe('new')
})
