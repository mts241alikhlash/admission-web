import { computed, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { refDebounced } from '@vueuse/core'
import { admissionApi } from '../api/admissionApi'
import { announcementService } from '../services/announcementService'
import { useAnnouncementStore } from '../stores/announcementStore'
import { useInfiniteList } from './useInfiniteList'

export function useAnnouncementList(
  search: Ref<string>,
  isPublished: Ref<string>,
  waveId: Ref<string>,
) {
  const { waves, isSaving } = storeToRefs(useAnnouncementStore())
  const debouncedSearch = refDebounced(search, 300)

  const list = useInfiniteList({
    scope: ['admission', 'announcements'],
    filters: { search: debouncedSearch, isPublished, waveId },
    fetchPage: async (page, limit) =>
      (
        await admissionApi.getManageAnnouncements({
          page,
          limit,
          search: debouncedSearch.value.trim() || undefined,
          isPublished:
            isPublished.value === 'ALL' ? undefined : isPublished.value,
          waveId: waveId.value === 'ALL' ? undefined : waveId.value,
        })
      ).data,
    errorMessage: 'Gagal memuat pengumuman.',
  })

  return {
    ...list,
    filtersPending: computed(
      () =>
        search.value !== debouncedSearch.value || list.isPlaceholderData.value,
    ),
    announcements: list.items,
    waves,
    isSaving,
    fetchWaves: announcementService.fetchWaves,
    saveAnnouncement: announcementService.saveAnnouncement,
    publishAnnouncement: announcementService.publishAnnouncement,
    deleteAnnouncement: announcementService.deleteAnnouncement,
  }
}
