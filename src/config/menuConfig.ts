import {
  LayoutDashboard,
  FileText,
  FileStack,
  FileCheck,
  Banknote,
  Landmark,
  Megaphone,
  Users,
  Waves,
  Settings,
} from '@lucide/vue'

export type {
  SubMenuItem,
  MenuItem,
  MenuSection,
} from '@mts241alikhlash/web-shared/types/menu.types'
import type { MenuSection } from '@mts241alikhlash/web-shared/types/menu.types'

export const menuSections: MenuSection[] = [
  {
    key: 'applicant',
    label: 'menu.section.registration',
    requiredPermission: 'admissions.apply',
    items: [
      {
        title: 'menu.registrationStatus',
        url: '/registration',
        icon: LayoutDashboard,
      },
      {
        title: 'menu.form',
        url: '/registration/form',
        icon: FileText,
      },
    ],
  },

  {
    key: 'admin-psb',
    label: 'menu.section.admission',
    requiredPermission: 'admissions.read',
    items: [
      {
        title: 'menu.dashboard',
        url: '/admin',
        icon: LayoutDashboard,
      },
      {
        title: 'menu.applicant',
        url: '/admin/applicants',
        icon: Users,
      },
      {
        title: 'menu.wave',
        url: '/admin/waves',
        icon: Waves,
        requiredPermission: 'admission-waves.read',
      },
      {
        title: 'menu.announcement',
        url: '/admin/announcements',
        icon: Megaphone,
        requiredPermission: 'admission-announcements.read',
      },
      {
        title: 'menu.bankAccount',
        url: '/admin/bank-accounts',
        icon: Landmark,
        requiredPermission: 'admission-bank-accounts.read',
      },
      {
        title: 'menu.documentType',
        url: '/admin/document-types',
        icon: FileStack,
        requiredPermission: 'admission-document-types.read',
      },
      {
        title: 'menu.documentReview',
        url: '/admin/document-reviews',
        icon: FileCheck,
        requiredPermission: 'admission-documents.read',
      },
      {
        title: 'menu.payment',
        url: '/admin/payments',
        icon: Banknote,
        requiredPermission: 'admission-payments.read',
      },
    ],
  },
  {
    key: 'settings',
    label: 'menu.section.settings',
    requiredPermission: 'profiles.read',
    items: [
      {
        key: 'settings-system',
        title: 'menu.system',
        url: '#',
        icon: Settings,
        items: [
          {
            title: 'menu.myProfile',
            url: '/profile',
          },
        ],
      },
    ],
  },
]
