import { ref } from 'vue'
import type { AppKey } from '../settings/types/app-setting.types'

interface AuthConfig {
  appKey: AppKey
  appTitle: string
  appSubtitle: string
  logoAlt: string
  loginTitle: string
  homeRoute: string
  signUpUrl: string | null
  signUpLabel: string
  ensureApplicantApplication: () => Promise<unknown>
}

export const authConfig = ref<AuthConfig>({
  appKey: 'ACADEMIC',
  appTitle: '241 Apps',
  appSubtitle: 'Sistem Informasi Akademik',
  logoAlt: '241 Apps Logo',
  loginTitle: 'Masuk ke 241 Apps',
  homeRoute: '/',
  signUpUrl: null,
  signUpLabel: 'Belum punya akun?',
  ensureApplicantApplication: () => Promise.resolve(null),
})

export function configureAuth(config: Partial<typeof authConfig.value>) {
  authConfig.value = { ...authConfig.value, ...config }
}
