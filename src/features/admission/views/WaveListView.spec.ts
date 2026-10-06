// @vitest-environment happy-dom
import { beforeEach, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import WaveListView from './WaveListView.vue'
const filtersPending = ref(false)
beforeEach(() => {
  filtersPending.value = false
})

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
      totalItems: computed(() => state.waves.length),
      academicYears: ref([]),
      loading: ref(false),
      hasNextPage: ref(false),
      isFetchingNextPage: ref(false),
      isFetching: ref(false),
      filtersPending,
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
      filledCount: 30,
    },
  ]
  state.error = null
  state.deleteWave.mockReset().mockResolvedValue({ success: true })
  const wrapper = mountView()
  const mobile = wrapper.get('[data-test="mobile-waves"]')
  expect(mobile.text()).toContain('Kuota 30 / 30 · Penuh')
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

it('shows ten waves per mobile page with filters reachable from a dialog', async () => {
  state.error = null
  filtersPending.value = false
  state.waves = Array.from({ length: 11 }, (_, index) => ({
    id: `w-${index}`,
    name: `Gelombang ${index}`,
    code: `G${index}`,
    startDate: '2026-01-01',
    endDate: '2026-02-01',
    quota: 30,
    registrationFee: 0,
    isActive: true,
  }))
  const wrapper = mountView()
  expect(wrapper.findAll('[data-test="mobile-waves"] li')).toHaveLength(10)
  expect(
    wrapper.findAll('button').some((button) => button.text() === 'Filter'),
  ).toBe(true)
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Selanjutnya')!
    .trigger('click')
  expect(wrapper.get('[data-test="mobile-waves"]').text()).toContain(
    'Gelombang 10',
  )
  wrapper.unmount()
})

it('hides old mobile wave rows while a filter request is pending', async () => {
  state.error = null
  filtersPending.value = false
  state.waves = [
    {
      id: 'old',
      name: 'Old Wave',
      startDate: '2026-01-01',
      endDate: '2026-02-01',
      quota: 1,
      registrationFee: 0,
      isActive: true,
    },
  ]
  const wrapper = mountView()
  filtersPending.value = true
  await flushPromises()
  expect(wrapper.find('[data-test="mobile-waves"]').exists()).toBe(false)
  expect(wrapper.text()).toContain('Memuat gelombang')
  wrapper.unmount()
})
