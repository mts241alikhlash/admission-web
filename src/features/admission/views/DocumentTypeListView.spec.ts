// @vitest-environment happy-dom
import { beforeEach, expect, it, vi } from 'vitest'
import { defineComponent, h, type PropType, type VNode } from 'vue'
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

const access = vi.hoisted(() => ({ granted: new Set<string>() }))
vi.mock('@/features/platform/auth', () => ({
  useRoleGuard: () => ({
    can: (...permissions: string[]) =>
      permissions.some((p) => access.granted.has(p)),
  }),
}))

const ALL = [
  'admission-document-types.create',
  'admission-document-types.update',
  'admission-document-types.delete',
]

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

type Row = (typeof types)[number]
interface Column {
  accessorKey?: keyof Row
  cell?: (context: { row: { original: Row; index: number } }) => VNode
}

const DataTableStub = defineComponent({
  props: {
    columns: { type: Array as PropType<Column[]>, required: true },
    data: { type: Array as PropType<Row[]>, required: true },
  },
  setup: (props) => () =>
    h(
      'div',
      { 'data-test': 'desktop-document-types' },
      props.data.map((original, index) =>
        h(
          'div',
          { class: 'row' },
          props.columns.map((column) =>
            column.cell
              ? column.cell({ row: { original, index } })
              : String(original[column.accessorKey!]),
          ),
        ),
      ),
    ),
})
const ActionCellStub = defineComponent({
  props: { hideDelete: Boolean, hideEdit: Boolean },
  setup: (props) => () =>
    h('span', {
      'data-test': 'actions',
      'data-hide-delete': String(props.hideDelete),
      'data-hide-edit': String(props.hideEdit),
    }),
})

beforeEach(() => {
  vi.clearAllMocks()
  access.granted = new Set(ALL)
})

function mountView() {
  return mount(DocumentTypeListView, {
    global: {
      stubs: {
        DataTable: DataTableStub,
        ActionCell: ActionCellStub,
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
      .attributes('aria-disabled'),
  ).toBe('true')
  await first
    .get('button[aria-label="Turunkan Kartu Keluarga"]')
    .trigger('click')
  await flushPromises()

  expect(service.reorder).toHaveBeenCalledWith(['t2', 't1', 't3'])
  expect(
    mobile
      .findAll('li')[2]
      .get('button[aria-label="Turunkan Rapor"]')
      .attributes('aria-disabled'),
  ).toBe('true')
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

it('ignores a second move while the first order is being saved', async () => {
  service.fetchAll.mockResolvedValue({ types })
  let finish: (value: unknown) => void = vi.fn()
  service.reorder.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve
    }),
  )
  const wrapper = mountView()
  await flushPromises()
  const mobile = wrapper.get('[data-test="mobile-document-types"]')
  const down = mobile
    .findAll('li')[0]
    .get('button[aria-label="Turunkan Kartu Keluarga"]')

  await down.trigger('click')
  await down.trigger('click')
  expect(service.reorder).toHaveBeenCalledTimes(1)
  expect(down.attributes('aria-disabled')).toBe('true')

  finish({ types: [types[1], types[0], types[2]] })
  await flushPromises()
  expect(
    mobile
      .findAll('li')[1]
      .get('button[aria-label="Turunkan Kartu Keluarga"]')
      .attributes('aria-disabled'),
  ).toBe('false')
})

it('reloads the list when the order is refused', async () => {
  service.fetchAll.mockResolvedValue({ types })
  service.reorder.mockResolvedValue({
    error: 'Urutan jenis berkas tidak lengkap',
  })
  const wrapper = mountView()
  await flushPromises()

  await wrapper
    .get('[data-test="mobile-document-types"]')
    .findAll('li')[0]
    .get('button[aria-label="Turunkan Kartu Keluarga"]')
    .trigger('click')
  await flushPromises()

  expect(service.fetchAll).toHaveBeenCalledTimes(2)
})

it('hides delete in the desktop actions of a used type', async () => {
  service.fetchAll.mockResolvedValue({ types })
  const wrapper = mountView()
  await flushPromises()

  const actions = wrapper
    .get('[data-test="desktop-document-types"]')
    .findAll('[data-test="actions"]')
  expect(actions.map((a) => a.attributes('data-hide-delete'))).toEqual([
    'true',
    'false',
    'false',
  ])
})

it('refuses a blank name and shows the reason', async () => {
  service.fetchAll.mockResolvedValue({ types: [] })
  const wrapper = mountView()
  await flushPromises()

  await wrapper
    .findAll('button')
    .find((b) => b.text().includes('Tambah Jenis Berkas'))!
    .trigger('click')
  await wrapper.get('input[name="name"]').setValue('   ')
  await wrapper.get('form').trigger('submit')
  await flushPromises()

  await vi.waitFor(() =>
    expect(wrapper.text()).toContain('Nama jenis berkas wajib diisi'),
  )
  expect(service.save).not.toHaveBeenCalled()
})

it('suggests deactivating when editing a type that has uploads', async () => {
  service.fetchAll.mockResolvedValue({ types })
  const wrapper = mountView()
  await flushPromises()

  await wrapper
    .get('[data-test="mobile-document-types"]')
    .get('button[aria-label="Ubah Kartu Keluarga"]')
    .trigger('click')
  await flushPromises()

  expect(wrapper.text()).toContain('Sudah diunggah 4 kali')
})

it('offers nothing to change without create, update or delete rights', async () => {
  access.granted = new Set()
  service.fetchAll.mockResolvedValue({ types })
  const wrapper = mountView()
  await flushPromises()

  const items = wrapper.get('[data-test="mobile-document-types"]').findAll('li')
  expect(items).toHaveLength(3)
  expect(items[1].findAll('button')).toHaveLength(0)
  expect(
    wrapper.findAll('button').filter((b) => b.text().includes('Tambah')),
  ).toHaveLength(0)
  expect(wrapper.find('[data-test="actions"]').exists()).toBe(false)
  expect(
    wrapper.get('[data-test="desktop-document-types"]').findAll('button'),
  ).toHaveLength(0)
})

it('lets a user who may only update reorder and edit but not delete', async () => {
  access.granted = new Set(['admission-document-types.update'])
  service.fetchAll.mockResolvedValue({ types })
  const wrapper = mountView()
  await flushPromises()

  const second = wrapper
    .get('[data-test="mobile-document-types"]')
    .findAll('li')[1]
  expect(second.find('button[aria-label="Naikkan Pas Foto"]').exists()).toBe(
    true,
  )
  expect(second.find('button[aria-label="Ubah Pas Foto"]').exists()).toBe(true)
  expect(second.find('button[aria-label="Hapus Pas Foto"]').exists()).toBe(
    false,
  )
})
