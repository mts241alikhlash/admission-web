import { storeToRefs } from 'pinia'
import { announcementService } from '../services/announcementService'
import { useAnnouncementStore } from '../stores/announcementStore'

export function useAnnouncementList() {
  const store = useAnnouncementStore()
  const { announcements, waves, totalItems, loading, isSaving, listError } =
    storeToRefs(store)

  return {
    announcements,
    waves,
    totalItems,
    loading,
    isSaving,
    listError,
    fetchData: announcementService.fetchData,
    saveAnnouncement: announcementService.saveAnnouncement,
    publishAnnouncement: announcementService.publishAnnouncement,
    deleteAnnouncement: announcementService.deleteAnnouncement,
  }
}
