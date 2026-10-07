// @vitest-environment happy-dom
import { expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import DocumentTypeListView from './DocumentTypeListView.vue'

const service = vi.hoisted(() => ({
  fetchAll: vi.fn(),
  save: vi.fn(),
  reorder: vi.fn(),
  remove: vi.fn(),
}))
vi.mock('../services/documentTypeService', () => ({
  documentTypeService: service,
}))

const passthrough = { template: '<div><slot /></div>' }
const types = [
  {
    id: 't1',
    code: 'FAMILY_CARD',
    name: 'Kartu Keluarga',
    isRequired: true,
    isActive: true,
    sortOrder: 1,
    documentCount: 4,
  },
  {
    id: 't2',
    code: 'PHOTO',
    name: 'Pas Foto',
    isRequired: true,
    isActive: true,
    sortOrder: 2,
    documentCount: 0,
  },
  {
    id: 't3',
    code: 'REPORT_CARD',
    name: 'Rapor',
    isRequired: false,
    isActive: false,
    sortOrder: 3,
    documentCount: 0,
  },
]

function mountView() {
  return mount(DocumentTypeListView, {
    global: {
      stubs: {
        DataTable: true,
        ActionCell: true,
        Dialog: passthrough,
        DialogContent: passthrough,
        DialogHeader: passthrough,
        DialogTitle: passthrough,
        DialogDescription: passthrough,
        DialogFooter: passthrough,
        AlertDialog: passthrough,
        AlertDialogContent: passthrough,
        AlertDialogHeader: passthrough,
        AlertDialogTitle: passthrough,
        AlertDialogDescription: passthrough,
        AlertDialogFooter: passthrough,
        AlertDialogCancel: { template: '<button><slot /></button>' },
        AlertDialogAction: { template: '<button><slot /></button>' },
      },
    },
  })
}

it('adds a type and reloads the list', async () => {
  service.fetchAll.mockResolvedValue({ types: [] })
  service.save.mockResolvedValue({ success: true })
  const wrapper = mountView()
  await flushPromises()

  await wrapper
    .findAll('button')
    .find((b) => b.text().includes('Tambah Jenis Berkas'))!
    .trigger('click')
  await wrapper.get('input[name="name"]').setValue('Surat Keterangan Sehat')
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  await vi.waitFor(() => expect(service.save).toHaveBeenCalled())

  expect(service.save).toHaveBeenCalledWith(null, {
    name: 'Surat Keterangan Sehat',
    isRequired: true,
    isActive: true,
  })
  expect(service.fetchAll).toHaveBeenCalledTimes(2)
})

it('moves a type down and sends the whole order', async () => {
  service.fetchAll.mockResolvedValue({ types })
  service.reorder.mockResolvedValue({ types: [types[1], types[0], types[2]] })
  const wrapper = mountView()
  await flushPromises()

  const mobile = wrapper.get('[data-test="mobile-document-types"]')
  const first = mobile.findAll('li')[0]
  expect(
    first
      .get('button[aria-label="Naikkan Kartu Keluarga"]')
      .attributes('disabled'),
  ).toBeDefined()
  await first
    .get('button[aria-label="Turunkan Kartu Keluarga"]')
    .trigger('click')
  await flushPromises()

  expect(service.reorder).toHaveBeenCalledWith(['t2', 't1', 't3'])
  expect(
    mobile
      .findAll('li')[2]
      .get('button[aria-label="Turunkan Rapor"]')
      .attributes('disabled'),
  ).toBeDefined()
})

it('offers delete only for an unused type', async () => {
  service.fetchAll.mockResolvedValue({ types })
  const wrapper = mountView()
  await flushPromises()

  const items = wrapper.get('[data-test="mobile-document-types"]').findAll('li')
  expect(
    items[0].find('button[aria-label="Hapus Kartu Keluarga"]').exists(),
  ).toBe(false)
  expect(items[0].text()).toContain('Dipakai 4')
  expect(items[1].find('button[aria-label="Hapus Pas Foto"]').exists()).toBe(
    true,
  )
  expect(items[2].text()).toContain('Nonaktif')
  expect(items[2].text()).toContain('Opsional')
})
