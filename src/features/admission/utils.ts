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
  ENROLLED: 'default',
}

export function fileUrl(storageKey: string) {
  const base =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    'http://localhost:3000'
  return `${base}/${storageKey}`
}
