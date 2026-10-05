import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AdmissionWaveSummary } from '../types'

export const useApplicationStore = defineStore('admissionApplication', () => {
  const waves = ref<AdmissionWaveSummary[]>([])

  return { waves }
})
