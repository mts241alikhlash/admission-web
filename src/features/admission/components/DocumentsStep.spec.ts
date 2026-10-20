// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { expect, it, vi } from 'vitest'
import { TooltipProvider } from '@mts241alikhlash/ui/tooltip'
import DocumentsStep from './DocumentsStep.vue'

const base = { isActive: true, sortOrder: 1, isRequired: false }
const types = [
  {
    ...base,
    id: 'kk',
    code: 'KK',
    name: 'Kartu Keluarga',
    requirement: 'REQUIRED',
    lateDueMonths: null,
  },
  {
    ...base,
    id: 'ijazah',
    code: 'IJAZAH',
    name: 'Ijazah SD',
    requirement: 'LATER',
    lateDueMonths: 3,
    dueDate: '2026-09-30',
  },
  {
    ...base,
    id: 'rapor',
    code: 'RAPOR',
    name: 'Rapor',
    requirement: 'LATER',
    lateDueMonths: 3,
    dueDate: null,
  },
  {
    ...base,
    id: 'prestasi',
    code: 'PRESTASI',
    name: 'Sertifikat prestasi',
    requirement: 'OPTIONAL',
    lateDueMonths: null,
  },
]

function mountStep() {
  return mount(
    defineComponent({
      setup: () => () =>
        h(TooltipProvider, null, () =>
          h(DocumentsStep, {
            documentTypes: types,
            documents: [],
            documentFiles: {},
            uploadingDoc: null,
            editable: true,
            onFileChange: vi.fn(),
            onClearFile: vi.fn(),
            onUpload: vi.fn(),
          } as never),
        ),
    }),
  )
}

it('groups types as Wajib diunggah sekarang, Boleh menyusul and Opsional', async () => {
  const wrapper = mountStep()
  await flushPromises()

  const titles = wrapper.findAll('section h3').map((h3) => h3.text())
  expect(titles).toEqual([
    'Wajib diunggah sekarang',
    'Boleh menyusul',
    'Opsional',
  ])
  expect(wrapper.get('[data-test="group-LATER"]').text()).toContain('Ijazah SD')
  expect(wrapper.get('[data-test="group-REQUIRED"]').text()).not.toContain(
    'Ijazah SD',
  )
})

it('shows "Serahkan ke TU paling lambat <tanggal>" for a susulan row', async () => {
  const wrapper = mountStep()
  await flushPromises()

  expect(wrapper.get('[data-test="group-LATER"]').text()).toContain(
    'Serahkan ke TU paling lambat 30 September 2026',
  )
})

it('shows "sesuai pemberitahuan sekolah" when there is no due date', async () => {
  const wrapper = mountStep()
  await flushPromises()

  expect(wrapper.get('[data-test="group-LATER"]').text()).toContain(
    'sesuai pemberitahuan sekolah',
  )
})
