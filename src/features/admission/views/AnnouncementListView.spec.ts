// @vitest-environment happy-dom
import { expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import AnnouncementListView from './AnnouncementListView.vue'

const state = vi.hoisted(() => ({
  announcements: [] as unknown[],
  error: null as string | null,
  loading: false,
  publish: vi.fn(),
  remove: vi.fn(),
  fetch: vi.fn(),
}))
vi.mock('../composables/useAnnouncementList', async () => {
  const { computed, ref } = await import('vue')
  return {
    useAnnouncementList: () => ({
      announcements: computed(() => state.announcements),
      waves: ref([]),
      totalItems: ref(1),
      listError: computed(() => state.error),
      loading: computed(() => state.loading),
      isSaving: ref(false),
      fetchData: state.fetch,
      saveAnnouncement: vi.fn(),
      publishAnnouncement: state.publish,
      deleteAnnouncement: state.remove,
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
  state.fetch.mockReset()
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
  expect(state.fetch).toHaveBeenCalledTimes(2)
  await mobile.get('button[aria-label="Hapus pengumuman"]').trigger('click')
  expect(wrapper.text()).toContain('Pengumuman ini akan dihapus')
  expect(state.remove).not.toHaveBeenCalled()
  await wrapper
    .get('[data-test="confirm-announcement-action"]')
    .trigger('click')
  await flushPromises()
  expect(state.remove).toHaveBeenCalledExactlyOnceWith('a-1')
})

it('distinguishes empty results from failed loads and shares search with mobile', async () => {
  state.announcements = []
  state.error = null
  expect(mountView().text()).toContain('Belum ada pengumuman')
  state.error = 'offline'
  const failed = mountView()
  expect(failed.text()).not.toContain('Belum ada pengumuman')
  await failed
    .findAll('button')
    .find((button) => button.text() === 'Coba lagi')!
    .trigger('click')
  expect(state.fetch).toHaveBeenCalled()
  state.error = null
  state.announcements = [
    { id: 'a-1', title: 'Informasi', isPublished: true, wave: null },
  ]
  const wrapper = mountView()
  expect(wrapper.get('label[for="announcement-search"]').text()).toContain(
    'Cari',
  )
  await wrapper.get('#announcement-search').setValue('tidak cocok')
  expect(wrapper.text()).toContain('Belum ada pengumuman')
})

it('announces loading instead of showing stale mobile rows', () => {
  state.error = null
  state.loading = true
  state.announcements = [{ id: 'old', title: 'Lama', isPublished: false }]
  const wrapper = mountView()
  expect(wrapper.get('[role="status"]').text()).toContain('Memuat pengumuman')
  expect(wrapper.find('[data-test="mobile-announcements"]').exists()).toBe(
    false,
  )
  state.loading = false
})
