import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'vue-sonner'
import { admissionApi } from '../api/admissionApi'
import { documentTypeService } from './documentTypeService'

vi.mock('../api/admissionApi', () => ({
  admissionApi: {
    deleteDocumentType: vi.fn(),
    reorderDocumentTypes: vi.fn(),
  },
}))
vi.mock('vue-sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

function conflict(message: string) {
  return { isAxiosError: true, response: { status: 409, data: { message } } }
}

describe('documentTypeService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the 409 message when a used type cannot be deleted', async () => {
    vi.mocked(admissionApi.deleteDocumentType).mockRejectedValueOnce(
      conflict('Jenis berkas sudah dipakai, nonaktifkan saja'),
    )

    await expect(documentTypeService.remove('t1')).resolves.toEqual({
      success: false,
    })
    expect(toast.error).toHaveBeenCalledWith(
      'Jenis berkas sudah dipakai, nonaktifkan saja',
    )
  })

  it('returns the error and toasts when the order is refused', async () => {
    vi.mocked(admissionApi.reorderDocumentTypes).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 400,
        data: { message: 'Urutan jenis berkas tidak lengkap' },
      },
    })

    await expect(documentTypeService.reorder(['t1'])).resolves.toEqual({
      error: 'Urutan jenis berkas tidak lengkap',
    })
    expect(toast.error).toHaveBeenCalledWith(
      'Urutan jenis berkas tidak lengkap',
    )
  })
})
