import type { RouteRecordRaw } from 'vue-router'

export const admissionPublicRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'landing',
    component: () => import('./views/LandingView.vue'),
    meta: {
      title: 'Penerimaan Santri Baru',
      description: 'Informasi pendaftaran santri baru.',
    },
  },
  {
    path: '/register',
    redirect: { name: 'login', query: { signup: '1' } },
    meta: {
      guestOnly: true,
      title: 'Daftar Akun',
      description: 'Buat akun pendaftaran santri baru.',
    },
  },
]

export const admissionRoutes: RouteRecordRaw[] = [
  {
    path: '/registration',
    name: 'applicant-dashboard',
    component: () => import('./views/ApplicantDashboardView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermission: 'admissions.apply',
      title: 'Status Pendaftaran',
      description: 'Pantau status, notifikasi, dan pengumuman pendaftaran.',
      breadcrumbs: [{ title: 'Status Pendaftaran' }],
    },
  },
  {
    path: '/registration/form',
    name: 'applicant-form',
    component: () => import('./views/ApplicationFormView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermission: 'admissions.apply',
      title: 'Formulir Pendaftaran',
      description: 'Lengkapi formulir pendaftaran santri baru.',
      breadcrumbs: [
        { title: 'Pendaftaran', href: '/registration' },
        { title: 'Formulir' },
      ],
    },
  },

  {
    path: '/admin',
    name: 'admin-stats',
    component: () => import('./views/AdmissionStatsView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermission: 'admissions.read',
      title: 'Dashboard PSB',
      description: 'Statistik penerimaan santri baru.',
      breadcrumbs: [{ title: 'Dashboard PSB' }],
    },
  },
  {
    path: '/admin/applicants',
    name: 'admin-applications',
    component: () => import('./views/ApplicationListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermission: 'admissions.read',
      title: 'Daftar Pendaftar',
      description: 'Kelola dan verifikasi pendaftar santri baru.',
      breadcrumbs: [
        { title: 'Admin PSB', href: '/admin' },
        { title: 'Daftar Pendaftar' },
      ],
    },
  },
  {
    path: '/admin/applicants/:id',
    name: 'admin-application-detail',
    component: () => import('./views/ApplicationDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermission: 'admissions.read',
      title: 'Detail Pendaftar',
      description: 'Verifikasi berkas dan keputusan penerimaan.',
      breadcrumbs: [
        { title: 'Admin PSB', href: '/admin' },
        { title: 'Pendaftar', href: '/admin/applicants' },
        { title: 'Detail' },
      ],
    },
  },
  {
    path: '/admin/applicants/:id/form',
    name: 'admin-application-form',
    component: () => import('./views/ApplicationFormView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermission: 'admissions.create',
      title: 'Formulir Pendaftar',
      description: 'Isi formulir pendaftaran atas nama pendaftar.',
      breadcrumbs: [
        { title: 'Admin PSB', href: '/admin' },
        { title: 'Pendaftar', href: '/admin/applicants' },
        { title: 'Formulir' },
      ],
    },
  },
  {
    path: '/admin/waves',
    name: 'admin-waves',
    component: () => import('./views/WaveListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermission: 'admission-waves.read',
      title: 'Gelombang Pendaftaran',
      description: 'Kelola gelombang penerimaan santri baru.',
      breadcrumbs: [
        { title: 'Admin PSB', href: '/admin' },
        { title: 'Gelombang' },
      ],
    },
  },
  {
    path: '/admin/bank-accounts',
    name: 'admin-bank-accounts',
    component: () => import('./views/BankAccountListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermission: 'admission-bank-accounts.read',
      title: 'Rekening Pembayaran',
      description: 'Kelola rekening tujuan transfer biaya pendaftaran.',
      breadcrumbs: [
        { title: 'Admin PSB', href: '/admin' },
        { title: 'Rekening Pembayaran' },
      ],
    },
  },
  {
    path: '/admin/announcements',
    name: 'admin-announcements',
    component: () => import('./views/AnnouncementListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermission: 'admission-announcements.read',
      title: 'Pengumuman PSB',
      description: 'Kelola pengumuman penerimaan santri baru.',
      breadcrumbs: [
        { title: 'Admin PSB', href: '/admin' },
        { title: 'Pengumuman' },
      ],
    },
  },
]
