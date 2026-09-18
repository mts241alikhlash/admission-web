import { createApp, watchEffect } from 'vue'
import '@/style.css'
import App from '@/app/App.vue'
import router from '@/app/providers/router'
import store from '@/app/providers/store'
import type { Component } from 'vue'
import { authService, configureAuth } from '@/features/platform/auth'
import { useSettingsStore, useBranding } from '@/features/platform/settings'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { queryClient } from '@/features/platform/reference-data'
import { publicAdmissionService } from '@/features/admission'
import { i18n, initialLocale, setLocale } from '@/i18n'

configureAuth({
  appKey: 'ADMISSION',
  appTitle: '241 Admission',
  appSubtitle: 'Sistem Penerimaan Santri Baru',
  logoAlt: 'Logo 241 Admission',
  loginTitle: 'Masuk ke 241 Admission',
  homeRoute: '/dashboard',
  signUpUrl: '/register',
  ensureApplicantApplication: publicAdmissionService.ensureMyApplication,
})

void Promise.all([
  authService.restoreSession(),
  setLocale(initialLocale(), false),
]).finally(() => {
  const app = createApp(App as Component)
    .use(store)
    .use(VueQueryPlugin, { queryClient })
    .use(i18n)

  void useSettingsStore().fetchSettings('ADMISSION')

  const { faviconSrc } = useBranding()
  watchEffect(() => {
    const link =
      document.querySelector<HTMLLinkElement>('link[rel="icon"]') ??
      document.head.appendChild(document.createElement('link'))
    link.rel = 'icon'
    link.href = faviconSrc.value
  })

  app.config.errorHandler = (error) => console.error(error)

  app.use(router).mount('#app')
})
