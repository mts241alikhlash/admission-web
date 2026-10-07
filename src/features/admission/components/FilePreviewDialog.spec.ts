// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { admissionApi } from '../api/admissionApi'
import FilePreviewDialog from './FilePreviewDialog.vue'

vi.mock('../api/admissionApi', () => ({
  admissionApi: { getFile: vi.fn() },
}))
vi.mock('vue-sonner', () => ({ toast: { error: vi.fn() } }))

const passthrough = { template: '<div><slot /></div>' }
const pdf = { id: 'f1', originalName: 'kk.pdf', mimeType: 'application/pdf' }
const image = { id: 'f2', originalName: 'foto.png', mimeType: 'image/png' }
const sheet = {
  id: 'f3',
  originalName: 'data.xlsx',
  mimeType: 'application/vnd.ms-excel',
}

function mountDialog(file: typeof pdf | null, open = true) {
  return mount(FilePreviewDialog, {
    props: { open, file },
    global: {
      stubs: {
        Dialog: passthrough,
        DialogContent: passthrough,
        DialogHeader: passthrough,
        DialogTitle: passthrough,
        DialogDescription: passthrough,
        DialogFooter: passthrough,
      },
    },
  })
}

const reply = () => ({ data: new Blob(['x']) }) as never

const revokeObjectURL = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  let counter = 0
  URL.createObjectURL = vi.fn(() => `blob:preview-${++counter}`)
  URL.revokeObjectURL = revokeObjectURL
  vi.mocked(admissionApi.getFile).mockResolvedValue(reply())
})

describe('FilePreviewDialog', () => {
  it('shows a PDF in an iframe loaded through the authenticated client', async () => {
    const wrapper = mountDialog(pdf)
    await flushPromises()

    expect(admissionApi.getFile).toHaveBeenCalledWith('f1')
    expect(wrapper.get('iframe').attributes('src')).toBe('blob:preview-1')
    expect(wrapper.get('iframe').attributes('title')).toBe('kk.pdf')
    expect(wrapper.text()).toContain('kk.pdf')
  })

  it('shows an image in an img', async () => {
    const wrapper = mountDialog(image)
    await flushPromises()

    expect(wrapper.get('img').attributes('src')).toBe('blob:preview-1')
    expect(wrapper.get('img').attributes('alt')).toBe('foto.png')
    expect(wrapper.find('iframe').exists()).toBe(false)
  })

  it('offers only the download for a type it cannot show', async () => {
    const wrapper = mountDialog(sheet)
    await flushPromises()

    expect(admissionApi.getFile).not.toHaveBeenCalled()
    expect(wrapper.find('iframe').exists()).toBe(false)
    expect(wrapper.text()).toContain('Pratinjau tidak tersedia')
    expect(wrapper.text()).toContain('Unduh')
  })

  it('shows an error with a retry and recovers', async () => {
    vi.mocked(admissionApi.getFile).mockRejectedValueOnce(new Error('offline'))
    const wrapper = mountDialog(pdf)
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'Gagal memuat berkas.',
    )

    await wrapper.get('[role="alert"]').get('button').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.find('iframe').exists()).toBe(true)
  })

  it('releases the object URL when it closes and when another file opens', async () => {
    const wrapper = mountDialog(pdf)
    await flushPromises()

    await wrapper.setProps({ file: image })
    await flushPromises()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-1')
    expect(wrapper.get('img').attributes('src')).toBe('blob:preview-2')

    await wrapper.setProps({ open: false })
    await flushPromises()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-2')
  })

  it('never lets a slow answer for the previous file replace the current one', async () => {
    let resolveFirst: (value: unknown) => void = vi.fn()
    vi.mocked(admissionApi.getFile)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirst = resolve
        }) as never,
      )
      .mockResolvedValueOnce(reply())
    const wrapper = mountDialog(pdf)
    await wrapper.setProps({ file: image })
    await flushPromises()

    resolveFirst(reply())
    await flushPromises()

    expect(wrapper.get('img').attributes('src')).toBe('blob:preview-1')
    expect(wrapper.find('iframe').exists()).toBe(false)
  })

  it('downloads through the same client', async () => {
    const wrapper = mountDialog(pdf)
    await flushPromises()
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(vi.fn())

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Unduh'))!
      .trigger('click')
    await flushPromises()

    expect(admissionApi.getFile).toHaveBeenLastCalledWith('f1', true)
    expect(click).toHaveBeenCalledTimes(1)
  })
})
