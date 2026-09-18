import { computed } from 'vue'
import { useSettingsStore } from '../stores/settingsStore'
import { authConfig } from '../../auth/config'

export function useBranding() {
  const store = useSettingsStore()

  const logoSrc = computed(() => store.settings?.logoUrl ?? '/logo.webp')

  const faviconSrc = computed(() => store.settings?.faviconUrl ?? '/vite.svg')

  const appTitle = computed(
    () => store.settings?.appTitle ?? authConfig.value.appTitle,
  )

  return { logoSrc, faviconSrc, appTitle }
}
