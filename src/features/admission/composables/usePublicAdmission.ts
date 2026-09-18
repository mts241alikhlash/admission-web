import { publicAdmissionService } from '../services/publicAdmissionService'

export function usePublicAdmission() {
  return {
    fetchActiveWaves: publicAdmissionService.fetchActiveWaves,
    register: publicAdmissionService.register,
    ensureMyApplication: publicAdmissionService.ensureMyApplication,
    fetchAnnouncements: publicAdmissionService.fetchAnnouncements,
  }
}
