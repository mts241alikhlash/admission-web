import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'vue-sonner'
import { admissionApi } from '../api/admissionApi'
import { documentTypeService } from './documentTypeService'

vi.mock('../api/admissionApi', () => ({
  admissionApi: { deleteDocumentType: vi.fn() },
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
})
