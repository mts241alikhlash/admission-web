import { toast } from 'vue-sonner'
import { admissionApi } from '../api/admissionApi'
import type {
  AdmissionEnrolmentRow,
  AdmissionType,
  EnrolmentQueueQuery,
} from '../types'
import { admissionErrorMessage } from '../utils'

interface QueuePage {
  rows: AdmissionEnrolmentRow[]
  total: number
  counts: { ready: number; held: number; done: number }
  years: {
    academicYearId: string
    academicYearName: string | null
    locked: boolean
    lockedAt: string | null
  }[]
}

function statusOf(error: unknown): number | undefined {
  return (error as { response?: { status?: number } } | null)?.response?.status
}

export const enrolmentService = {
  fetchQueue: async (
    query: EnrolmentQueueQuery,
  ): Promise<QueuePage | { error: string }> => {
    try {
      const body = (await admissionApi.getEnrolmentQueue(query)).data
      return {
        rows: body.data ?? [],
        total: body.meta.total,
        counts: body.meta.counts,
        years: body.meta.years,
      }
    } catch (error: unknown) {
      return {
        error: admissionErrorMessage(error, 'Gagal memuat antrean daftar ulang.'),
      }
    }
  },

  previewNis: async (academicYearId: string) => {
    try {
      return {
        preview: (await admissionApi.getNisPreview(academicYearId)).data.data,
      }
    } catch (error: unknown) {
      return {
        error: admissionErrorMessage(error, 'Gagal memuat pratinjau NIS.'),
      }
    }
  },

  composeNis: async (
    academicYearId: string,
    expectedChanges: number,
    syncStudents?: boolean,
  ) => {
    try {
      const result = (
        await admissionApi.composeNis({
          academicYearId,
          expectedChanges,
          syncStudents,
        })
      ).data.data
      toast.success(`NIS disusun: ${result.created} baru, ${result.changed} berubah.`)
      if (result.failed.length > 0) {
        toast.error(
          `${result.failed.length} santri belum diperbarui NIS-nya. Jalankan sinkronisasi ulang.`,
        )
      }
      return { success: true as const, result }
    } catch (error: unknown) {
      toast.error(admissionErrorMessage(error, 'Gagal menyusun NIS.'))
      return { success: false as const, stale: statusOf(error) === 409 }
    }
  },

  lockNis: async (academicYearId: string) => {
    try {
      await admissionApi.lockNis(academicYearId)
      toast.success('NIS dikunci.')
      return { success: true }
    } catch (error: unknown) {
      toast.error(admissionErrorMessage(error, 'Gagal mengunci NIS.'))
      return { success: false }
    }
  },

  process: async (
    applicationIds: string[],
    nisn: { applicationId: string; nisn: string }[],
  ) => {
    try {
      const results = (
        await admissionApi.processEnrolments({ applicationIds, nisn })
      ).data.data.results
      const enrolled = results.filter((result) => result.outcome === 'ENROLLED').length
      const problems = results.filter((result) => result.outcome !== 'ENROLLED')
      toast.success(`${enrolled} diproses, ${problems.length} bermasalah.`)
      return { success: true as const, enrolled, problems }
    } catch (error: unknown) {
      toast.error(admissionErrorMessage(error, 'Gagal memproses pendaftar.'))
      return { success: false as const }
    }
  },

  setPlacement: async (
    applicationId: string,
    admissionType: AdmissionType,
    targetGradeId: string,
  ) => {
    try {
      await admissionApi.setPlacement(applicationId, {
        admissionType,
        targetGradeId,
      })
      toast.success('Jenis dan tingkat kelas disimpan.')
      return { success: true }
    } catch (error: unknown) {
      toast.error(admissionErrorMessage(error, 'Gagal menyimpan jenis dan tingkat kelas.'))
      return { success: false }
    }
  },
}
