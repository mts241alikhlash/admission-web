import { toast } from 'vue-sonner'
import { getIndonesianErrorMessage } from '@mts241alikhlash/web-shared/utils/error-handler'
import { admissionApi } from '../api/admissionApi'
import { useApplicationStore } from '../stores/applicationStore'
import { useReferenceList } from '@/features/platform/reference-data'
import { notifyIfOutage } from '@mts241alikhlash/web-shared/utils/notify-outage'

export interface ApplicationListParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  waveId?: string
}

export const applicationService = {
  fetchApplications: async (params: ApplicationListParams) => {
    const store = useApplicationStore()
    const current = ++store.requestId
    store.error = null
    store.loading = true
    try {
      const res = await admissionApi.getApplications(params)
      if (current === store.requestId) {
        store.applications = res.data.data ?? []
        store.total = res.data.meta?.total ?? 0
      }
    } catch (error: unknown) {
      if (current === store.requestId) {
        store.applications = []
        store.total = 0
        store.error = getIndonesianErrorMessage(
          error,
          'Gagal memuat daftar pendaftar.',
        )
        toast.error(store.error)
      }
    } finally {
      if (current === store.requestId) store.loading = false
    }
  },

  fetchWaves: async () => {
    const store = useApplicationStore()
    try {
      store.waves = await useReferenceList().read(
        'admissionWaves',
        async () => {
          const res = await admissionApi.getWaves({ limit: 100 })
          return res.data.data ?? []
        },
      )
    } catch (err) {
      notifyIfOutage(err)
      store.waves = []
    }
  },
}
