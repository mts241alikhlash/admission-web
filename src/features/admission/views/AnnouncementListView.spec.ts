// @vitest-environment happy-dom
import { beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import AnnouncementListView from './AnnouncementListView.vue'
const filtersPending = ref(false)
beforeEach(() => {
  filtersPending.value = false
})

const state = vi.hoisted(() => ({
  announcements: [] as unknown[],
  error: null as string | null,
  loading: false,
  publish: vi.fn(),
  remove: vi.fn(),
  refresh: vi.fn(),
  search: null as { value: string } | null,
}))
vi.mock('../composables/useAnnouncementList', async () => {
  const { computed, ref } = await import('vue')
  return {
    useAnnouncementList: (search: { value: string }) => {
      state.search = search
      return {
        announcements: computed(() => state.announcements),
        waves: ref([]),
        totalItems: computed(() => state.announcements.length),
        listError: computed(() => state.error),
        loading: computed(() => state.loading),
        hasNextPage: ref(false),
        isFetchingNextPage: ref(false),
        isFetching: ref(false),
        filtersPending,
        loadMore: vi.fn(),
        refresh: state.refresh,
        isSaving: ref(false),
        fetchWaves: vi.fn(),
        saveAnnouncement: vi.fn(),
        publishAnnouncement: state.publish,
        deleteAnnouncement: state.remove,
      }
    },
  }
})

it('paginates mobile announcements and exposes filters behind one button', async () => {
  state.error = null
  filtersPending.value = false
  state.announcements = Array.from({ length: 11 }, (_, index) => ({
    id: `a-${index}`,
    title: `Pengumuman ${index}`,
    isPublished: false,
    wave: null,
    publishedAt: null,
  }))
  const wrapper = mountView()
  expect(wrapper.findAll('[data-test="mobile-announcements"] li')).toHaveLength(
    10,
  )
  expect(
    wrapper.findAll('button').some((button) => button.text() === 'Filter'),
  ).toBe(true)
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Selanjutnya')!
    .trigger('click')
  expect(wrapper.get('[data-test="mobile-announcements"]').text()).toContain(
    'Pengumuman 10',
  )
  wrapper.unmount()
})

it('hides old mobile announcements while filtering', async () => {
  state.error = null
  filtersPending.value = false
  state.announcements = [
    { id: 'old', title: 'Old Announcement', isPublished: false, wave: null },
  ]
  const wrapper = mountView()
  filtersPending.value = true
  await flushPromises()
  expect(wrapper.find('[data-test="mobile-announcements"]').exists()).toBe(
    false,
  )
  expect(wrapper.text()).toContain('Memuat pengumuman')
  wrapper.unmount()
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
  ].map((name) => [name, { template: '<div><slot /></div>' }]),
)
const mountView = () =>
  mount(AnnouncementListView, {
    global: {
      stubs: {
        ...stubs,
        AlertDialogAction: {
          template:
            '<button data-test="confirm-announcement-action"><slot /></button>',
        },
        AlertDialogCancel: { template: '<button><slot /></button>' },
        AnnouncementFormDialog: true,
        DataTable: true,
        ActionCell: true,
      },
    },
  })

it('shows mobile draft and waits for confirmation before publishing or deleting', async () => {
  state.announcements = [
    {
      id: 'a-1',
      title: 'Pengumuman Uji',
      wave: { name: 'Gelombang Satu' },
      isPublished: false,
      publishedAt: null,
    },
  ]
  state.error = null
  state.refresh.mockReset()
  state.publish.mockReset().mockResolvedValue({ success: true })
  state.remove.mockReset().mockResolvedValue({ success: true })
  const wrapper = mountView()
  const mobile = wrapper.get('[data-test="mobile-announcements"]')
  expect(mobile.text()).toContain('Pengumuman Uji')
  expect(mobile.text()).toContain('Gelombang Satu')
  expect(mobile.text()).toContain('Draft')
  await mobile.get('button[aria-label="Terbitkan pengumuman"]').trigger('click')
  expect(state.publish).not.toHaveBeenCalled()
  expect(wrapper.text()).toContain('akan menerima notifikasi')
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Batal')!
    .trigger('click')
  expect(state.publish).not.toHaveBeenCalled()
  await mobile.get('button[aria-label="Terbitkan pengumuman"]').trigger('click')
  await wrapper
    .get('[data-test="confirm-announcement-action"]')
    .trigger('click')
  await flushPromises()
  expect(state.publish).toHaveBeenCalledExactlyOnceWith('a-1')
  expect(state.refresh).toHaveBeenCalledOnce()
  await mobile.get('button[aria-label="Hapus pengumuman"]').trigger('click')
  expect(wrapper.text()).toContain('Pengumuman ini akan dihapus')
  expect(state.remove).not.toHaveBeenCalled()
  await wrapper
    .get('[data-test="confirm-announcement-action"]')
    .trigger('click')
  await flushPromises()
  expect(state.remove).toHaveBeenCalledExactlyOnceWith('a-1')
})

it('distinguishes empty results from failed loads and sends search to the list', async () => {
  state.announcements = []
  state.error = null
  expect(mountView().text()).toContain('Tidak ada data.')
  state.error = 'offline'
  const failed = mountView()
  expect(failed.text()).not.toContain('Tidak ada data.')
  await failed
    .findAll('button')
    .find((button) => button.text() === 'Coba lagi')!
    .trigger('click')
  expect(state.refresh).toHaveBeenCalled()
  state.error = null
  state.announcements = [
    { id: 'a-1', title: 'Informasi', isPublished: true, wave: null },
  ]
  const wrapper = mountView()
  await wrapper
    .get('input[aria-label="Cari pengumuman"]')
    .setValue('tidak cocok')
  expect(state.search?.value).toBe('tidak cocok')
})
