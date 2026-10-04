import { storeToRefs } from 'pinia'
import { waveService } from '../services/waveService'
import { useWaveStore } from '../stores/waveStore'

export function useWaveList() {
  const store = useWaveStore()
  const { waves, academicYears, totalItems, loading, isSaving, listError } =
    storeToRefs(store)

  return {
    waves,
    academicYears,
    totalItems,
    loading,
    isSaving,
    listError,
    fetchWaves: waveService.fetchWaves,
    fetchAcademicYears: waveService.fetchAcademicYears,
    saveWave: waveService.saveWave,
    deleteWave: waveService.deleteWave,
  }
}
