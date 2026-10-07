import { AxiosError, AxiosHeaders } from 'axios'
import { expect, it } from 'vitest'
import {
  admissionErrorMessage,
  formatDateRange,
  isWaveClosed,
  jakartaToday,
  presentValue,
} from './utils'

it('keeps zero but names absent and placeholder values', () => {
  expect([null, undefined, '', '   ', '-'].map(presentValue)).toEqual(
    Array(5).fill('Belum diisi'),
  )
  expect(presentValue(0)).toBe('0')
  expect(presentValue('Jalan sangat panjang tanpa spasi')).toBe(
    'Jalan sangat panjang tanpa spasi',
  )
})

function axiosError(status: number, message: unknown) {
  return new AxiosError('failed', String(status), undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { message },
  })
}

it('shows what the admission service says about a refused request', () => {
  expect(
    admissionErrorMessage(
      axiosError(400, 'Data belum lengkap: NIK, Agama'),
      'Gagal mengirim formulir.',
    ),
  ).toBe('Data belum lengkap: NIK, Agama')
  expect(
    admissionErrorMessage(
      axiosError(409, 'Gelombang pendaftaran sudah ditutup'),
      'Gagal mengirim formulir.',
    ),
  ).toBe('Gelombang pendaftaran sudah ditutup')
})

it('falls back for field validation lists and server failures', () => {
  expect(
    admissionErrorMessage(
      axiosError(400, ['phone must be an Indonesian mobile number']),
      'Gagal menyimpan.',
    ),
  ).toBe('Gagal menyimpan.')
  expect(
    admissionErrorMessage(axiosError(500, 'boom'), 'Gagal menyimpan.'),
  ).not.toBe('boom')
})

it('closes a wave the day after its end date, in Jakarta time', () => {
  const lastDay = new Date('2026-02-01T16:59:00Z')
  const nextDay = new Date('2026-02-01T17:00:00Z')

  expect(isWaveClosed('2026-02-01', lastDay)).toBe(false)
  expect(isWaveClosed('2026-02-01T00:00:00.000Z', nextDay)).toBe(true)
  expect(isWaveClosed(null, nextDay)).toBe(false)
})

it('shortens a date range to what actually differs', () => {
  expect(formatDateRange('2026-10-01T12:00:00', '2026-10-31T12:00:00')).toBe(
    '1–31 Oktober 2026',
  )
  expect(formatDateRange('2026-10-01T12:00:00', '2026-11-15T12:00:00')).toBe(
    '1 Oktober – 15 November 2026',
  )
  expect(formatDateRange('2026-12-20T12:00:00', '2027-01-10T12:00:00')).toBe(
    '20 Desember 2026 – 10 Januari 2027',
  )
})

it('reads today in Jakarta, not UTC', () => {
  expect(jakartaToday(new Date('2026-10-07T20:00:00Z'))).toBe('2026-10-08')
})
