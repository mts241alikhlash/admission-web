import type { Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { refDebounced } from '@vueuse/core'
import { admissionApi } from '../api/admissionApi'
import { applicationService } from '../services/applicationService'
import { useApplicationStore } from '../stores/applicationStore'
import { useInfiniteList } from './useInfiniteList'

export function useApplicationList(
  search: Ref<string>,
  status: Ref<string>,
  waveId: Ref<string>,
) {
  const { waves } = storeToRefs(useApplicationStore())
  const debouncedSearch = refDebounced(search, 300)

  const list = useInfiniteList({
    scope: ['admission', 'applications'],
    filters: { search: debouncedSearch, status, waveId },
    fetchPage: async (page, limit) =>
      (
        await admissionApi.getApplications({
          page,
          limit,
          search: debouncedSearch.value.trim() || undefined,
          status: status.value === 'ALL' ? undefined : status.value,
          waveId: waveId.value === 'ALL' ? undefined : waveId.value,
        })
      ).data,
    errorMessage: 'Gagal memuat daftar pendaftar.',
  })

  return {
    ...list,
    applications: list.items,
    waves,
    fetchWaves: applicationService.fetchWaves,
  }
}
