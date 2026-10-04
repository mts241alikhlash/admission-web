import { isAxiosError } from 'axios'
import { getIndonesianErrorMessage } from '@mts241alikhlash/web-shared/utils/error-handler'
import type { AdmissionStatus } from './types'

export function formatIDR(value: number) {
  const amount = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
  return `Rp. ${amount}`
}

export function formatThousands(value: string | number | null | undefined) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return ''
  return new Intl.NumberFormat('id-ID').format(Number(digits))
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function presentValue(value: string | number | null | undefined) {
  const text = value == null ? '' : String(value).trim()
  return text === '' || text === '-' ? 'Belum diisi' : text
}

export const STATUS_BADGE_VARIANTS: Record<
  AdmissionStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  DRAFT: 'secondary',
  SUBMITTED: 'outline',
  REVISION_NEEDED: 'destructive',
  VERIFIED: 'default',
  ACCEPTED: 'default',
  REJECTED: 'destructive',
  ENROLLING: 'outline',
  ENROLLED: 'default',
}

export function fileUrl(storageKey: string) {
  const base =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    'http://localhost:3000'
  return `${base}/${storageKey}`
}

export function admissionErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const status = error.response?.status
    const message = (error.response?.data as { message?: unknown } | undefined)
      ?.message
    if (
      (status === 400 || status === 404 || status === 409) &&
      typeof message === 'string'
    ) {
      return message
    }
    if (status === 400 && Array.isArray(message)) return fallback
  }
  return getIndonesianErrorMessage(error, fallback)
}

export function isWaveClosed(
  endDate: string | null | undefined,
  now: Date = new Date(),
) {
  if (!endDate) return false
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
  }).format(now)
  return endDate.slice(0, 10) < today
}
