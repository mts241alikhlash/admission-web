// @vitest-environment happy-dom
import { beforeEach, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AdmissionStatsView from './AdmissionStatsView.vue'

const state = vi.hoisted(() => {
  const initial: {
    stats: unknown
    error: string | null
    fetchStats: ReturnType<typeof vi.fn>
  } = { stats: null, error: null, fetchStats: vi.fn() }
  return initial
})
vi.mock('../composables/useAdmissionStats', async () => {
  const { computed, ref } = await import('vue')
  return {
    useAdmissionStats: () => ({
      stats: computed(() => state.stats),
      error: computed(() => state.error),
      loading: ref(false),
      fetchStats: state.fetchStats,
    }),
  }
})

const stubs = Object.fromEntries(
  ['Card', 'CardHeader', 'CardContent', 'CardTitle'].map((name) => [
    name,
    { template: '<div><slot /></div>' },
  ]),
)

beforeEach(() => {
  state.error = null
  state.stats = null
  state.fetchStats.mockClear()
})

it('counts admin-actionable statuses and includes enrolling', () => {
  state.stats = {
    total: 18,
    byStatus: {
      SUBMITTED: 2,
      VERIFIED: 3,
      ACCEPTED: 4,
      REVISION_NEEDED: 8,
      ENROLLING: 1,
    },
    waves: [],
  }
  const wrapper = mount(AdmissionStatsView, {
    global: { stubs: { ...stubs, RouterLink: true } },
  })
  expect(wrapper.text()).toContain('Sedang Didaftarkan')
  expect(
    wrapper
      .findAll('p')
      .find((p) => p.text() === 'Perlu tindakan')
      ?.element.nextElementSibling?.textContent?.trim(),
  ).toBe('9')
  expect(wrapper.text()).toContain('Belum ada gelombang')
})

it('offers retry on failed statistics', async () => {
  state.error = 'offline'
  const wrapper = mount(AdmissionStatsView, { global: { stubs } })
  await wrapper.get('button').trigger('click')
  expect(state.fetchStats).toHaveBeenCalledTimes(2)
})
