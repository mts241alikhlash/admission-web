// @vitest-environment happy-dom
import { expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import WaveListView from './WaveListView.vue'

const state = vi.hoisted(() => ({
  waves: [] as unknown[],
  error: null as string | null,
  deleteWave: vi.fn(),
  refresh: vi.fn(),
}))
vi.mock('../composables/useWaveList', async () => {
  const { computed, ref } = await import('vue')
  return {
    useWaveList: () => ({
      waves: computed(() => state.waves),
      listError: computed(() => state.error),
      totalItems: ref(1),
      academicYears: ref([]),
      loading: ref(false),
      hasNextPage: ref(false),
      isFetchingNextPage: ref(false),
      loadMore: vi.fn(),
      refresh: state.refresh,
      isSaving: ref(false),
      fetchAcademicYears: vi.fn(),
      saveWave: vi.fn(),
      deleteWave: state.deleteWave,
    }),
  }
})
const stubs = Object.fromEntries(
  [
    'Card',
    'CardHeader',
    'CardTitle',
    'AlertDialog',
    'AlertDialogContent',
    'AlertDialogHeader',
    'AlertDialogTitle',
    'AlertDialogDescription',
    'AlertDialogFooter',
    'AlertDialogAction',
    'AlertDialogCancel',
  ].map((name) => [name, { template: '<div><slot /></div>' }]),
)
stubs.AlertDialogAction = {
  template: '<button data-test="confirm-wave-delete"><slot /></button>',
}
stubs.AlertDialogCancel = { template: '<button><slot /></button>' }
const mountView = () =>
  mount(WaveListView, {
    global: {
      stubs: {
        ...stubs,
        WaveFormDialog: true,
        DataTable: true,
        ActionCell: true,
      },
    },
  })

it('shows essential mobile wave information and confirms deletion', async () => {
  state.waves = [
    {
      id: 'w-1',
      name: 'Gelombang Satu',
      code: 'G1',
      startDate: '2026-01-01',
      endDate: '2026-02-01',
      quota: 30,
      registrationFee: 50000,
      isActive: true,
      _count: { applications: 2 },
    },
  ]
  state.error = null
  state.deleteWave.mockReset().mockResolvedValue({ success: true })
  const wrapper = mountView()
  const mobile = wrapper.get('[data-test="mobile-waves"]')
  expect(mobile.text()).toContain('Gelombang Satu')
  expect(mobile.text()).toContain('Aktif')
  expect(mobile.text()).toContain('30')
  expect(mobile.text()).toContain('50.000')
  expect(mobile.text()).toContain('2026')
  await mobile.get('button[aria-label="Hapus gelombang"]').trigger('click')
  expect(state.deleteWave).not.toHaveBeenCalled()
  expect(wrapper.text()).toContain('Hapus gelombang?')
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Batal')!
    .trigger('click')
  expect(state.deleteWave).not.toHaveBeenCalled()
  await mobile.get('button[aria-label="Hapus gelombang"]').trigger('click')
  await wrapper.get('[data-test="confirm-wave-delete"]').trigger('click')
  await flushPromises()
  expect(state.deleteWave).toHaveBeenCalledOnce()
  expect(state.deleteWave).toHaveBeenCalledWith('w-1')
})

it('distinguishes empty waves from failed load', async () => {
  state.waves = []
  state.error = null
  expect(mountView().text()).toContain('Tidak ada data.')
  state.error = 'offline'
  const wrapper = mountView()
  expect(wrapper.text()).not.toContain('Tidak ada data.')
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Coba lagi')!
    .trigger('click')
  expect(state.refresh).toHaveBeenCalled()
})
