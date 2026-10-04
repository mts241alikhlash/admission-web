import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  AdmissionApplicationListItem,
  AdmissionWaveSummary,
} from '../types'

export const useApplicationStore = defineStore('admissionApplication', () => {
  const applications = ref<AdmissionApplicationListItem[]>([])
  const waves = ref<AdmissionWaveSummary[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const requestId = ref(0)

  return {
    applications,
    waves,
    total,
    loading,
    error,
    requestId,
  }
})
