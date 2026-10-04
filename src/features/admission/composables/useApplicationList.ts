import { storeToRefs } from 'pinia'
import { applicationService } from '../services/applicationService'
import { useApplicationStore } from '../stores/applicationStore'

export function useApplicationList() {
  const store = useApplicationStore()
  const { applications, waves, total, loading, error } = storeToRefs(store)

  return {
    applications,
    waves,
    total,
    loading,
    error,
    fetchApplications: applicationService.fetchApplications,
    fetchWaves: applicationService.fetchWaves,
  }
}
