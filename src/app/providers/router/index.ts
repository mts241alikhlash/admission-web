import '@mts241alikhlash/web-shared/types/router'
import { authRoutes } from '@/features/platform/auth'
import { profileRoutes } from '@/features/platform/profile'
import { admissionPublicRoutes, admissionRoutes } from '@/features/admission'
import { settingsRoutes, useSettingsStore } from '@/features/platform/settings'
import { createRouter, createWebHistory } from 'vue-router'
import { authSessionService, useAuthStore } from '@/features/platform/auth'
import { menuSections } from '@/config/menuConfig'

function isAdminUser(roles: string[]) {
  return roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')
}

export function resolveHomeRoute(roles: string[]) {
  return isAdminUser(roles) ? '/admin' : '/registration'
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...admissionPublicRoutes,
    ...authRoutes,
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      children: [
        ...admissionRoutes,
        ...profileRoutes,
        ...settingsRoutes,
        {
          path: '/setting/general',
          name: 'setting-general',
          component: () =>
            import('@/features/platform/settings/views/AppSettingsView.vue'),
          props: { appKey: 'ADMISSION', menuSections },
          meta: {
            requiresAuth: true,
            requiredPermission: 'settings.update',
            title: 'Pengaturan Umum',
            breadcrumbs: [{ title: 'Pengaturan Umum' }],
          },
        },
      ],
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      redirect: () => {
        const user = authSessionService.hydrateUser()
        return resolveHomeRoute(user?.roles ?? [])
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/layouts/NotFoundPage.vue'),
      meta: { title: 'Halaman Tidak Ditemukan' },
    },
  ],
})

router.beforeEach((to) => {
  const store = useAuthStore()
  if (!store.user) {
    const user = authSessionService.hydrateUser()
    if (user) {
      store.setUser(user)
    }
  }

  const hasSession = Boolean(store.user)

  const settingsStore = useSettingsStore()
  const isMaintenanceOn = settingsStore.maintenanceMode
  const userRolesForMaintenance = store.user?.roles ?? []
  if (
    isMaintenanceOn &&
    !userRolesForMaintenance.includes('SUPER_ADMIN') &&
    to.name !== 'login' &&
    to.name !== 'maintenance'
  ) {
    return { name: 'maintenance' }
  }

  if (to.meta.requiresAuth && !hasSession) {
    return { name: 'login' }
  }

  if (to.meta.guestOnly && hasSession) {
    return resolveHomeRoute(store.user?.roles ?? [])
  }

  const allowedRoles = to.meta.allowedRoles
  if (allowedRoles && allowedRoles.length > 0) {
    const user = store.user
    if (user) {
      const userRoles = user.roles ?? []
      if (userRoles.includes('SUPER_ADMIN')) return true
      const hasAccess = allowedRoles.some((r: string) => userRoles.includes(r))
      if (!hasAccess) {
        return resolveHomeRoute(userRoles)
      }
    } else {
      return { name: 'login' }
    }
  }

  const requiredPermission = to.meta.requiredPermission
  if (requiredPermission) {
    const user = store.user
    if (!user) return { name: 'login' }
    const userRoles = user.roles ?? []
    const userPermissions = user.permissions ?? []
    if (
      !userRoles.includes('SUPER_ADMIN') &&
      !userPermissions.includes(requiredPermission)
    ) {
      return resolveHomeRoute(userRoles)
    }
  }

  return true
})

router.afterEach((to) => {
  const title = to.meta.title
  if (typeof title === 'string') document.title = title
})

export default router
