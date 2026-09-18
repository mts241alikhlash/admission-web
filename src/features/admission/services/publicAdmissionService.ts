import { getIndonesianErrorMessage } from '@mts241alikhlash/web-shared/utils/error-handler'
import { admissionApi } from '../api/admissionApi'
import type { PublicRegisterPayload } from '../types'
import { notifyIfOutage } from '@mts241alikhlash/web-shared/utils/notify-outage'

function errorStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } } | null)?.response?.status
}

export const publicAdmissionService = {
  fetchActiveWaves: async () => {
    try {
      const res = await admissionApi.getActiveWaves()
      return res.data.data
    } catch (err) {
      notifyIfOutage(err)
      return null
    }
  },

  register: async (payload: PublicRegisterPayload) => {
    try {
      const res = await admissionApi.register(payload)
      return { success: true as const, data: res.data.data }
    } catch (error: unknown) {
      const outage = notifyIfOutage(error)
      return {
        success: false as const,
        status: errorStatus(error),
        outage,
        error: getIndonesianErrorMessage(
          error,
          'Gagal membuat akun pendaftaran.',
        ),
      }
    }
  },

  ensureMyApplication: async () => {
    try {
      const res = await admissionApi.ensureMyApplication()
      return res.data.data
    } catch (err) {
      notifyIfOutage(err)
      return null
    }
  },

  fetchAnnouncements: async () => {
    try {
      const res = await admissionApi.getAnnouncements()
      return res.data.data
    } catch (err) {
      notifyIfOutage(err)
      return []
    }
  },
}
