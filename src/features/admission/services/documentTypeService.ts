import { toast } from 'vue-sonner'
import { admissionApi } from '../api/admissionApi'
import type {
  AdmissionDocumentTypeAdmin,
  DocumentTypeSavePayload,
} from '../types'
import { admissionErrorMessage } from '../utils'

export const documentTypeService = {
  fetchAll: async (): Promise<
    { types: AdmissionDocumentTypeAdmin[] } | { error: string }
  > => {
    try {
      return { types: (await admissionApi.getDocumentTypes()).data.data ?? [] }
    } catch (error: unknown) {
      return {
        error: admissionErrorMessage(error, 'Gagal memuat jenis berkas.'),
      }
    }
  },

  save: async (id: string | null, payload: DocumentTypeSavePayload) => {
    try {
      if (id) await admissionApi.updateDocumentType(id, payload)
      else await admissionApi.createDocumentType(payload)
      toast.success(
        id ? 'Jenis berkas diperbarui.' : 'Jenis berkas ditambahkan.',
      )
      return { success: true }
    } catch (error: unknown) {
      toast.error(admissionErrorMessage(error, 'Gagal menyimpan jenis berkas.'))
      return { success: false }
    }
  },

  reorder: async (
    ids: string[],
  ): Promise<{ types: AdmissionDocumentTypeAdmin[] } | { error: string }> => {
    try {
      return {
        types: (await admissionApi.reorderDocumentTypes(ids)).data.data ?? [],
      }
    } catch (error: unknown) {
      const message = admissionErrorMessage(
        error,
        'Gagal mengubah urutan jenis berkas.',
      )
      toast.error(message)
      return { error: message }
    }
  },

  remove: async (id: string) => {
    try {
      await admissionApi.deleteDocumentType(id)
      toast.success('Jenis berkas dihapus.')
      return { success: true }
    } catch (error: unknown) {
      toast.error(admissionErrorMessage(error, 'Gagal menghapus jenis berkas.'))
      return { success: false }
    }
  },
}
