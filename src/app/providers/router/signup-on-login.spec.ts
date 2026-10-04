// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { RouterView } from 'vue-router'
import { authConfig, configureAuth } from '@/features/platform/auth'
import SignUpDialog from '@/features/admission/components/SignUpDialog.vue'
import router from './index'

it('opens registration on login without sending the applicant to the homepage', async () => {
  const previousConfig = authConfig.value
  configureAuth({ signUpUrl: '/register' })
  try {
    const pinia = createPinia()
    setActivePinia(pinia)
    await router.push('/login')
    await router.isReady()
    const wrapper = mount(defineComponent({ render: () => h(RouterView) }), {
      global: { plugins: [pinia, router] },
    })
    await flushPromises()
    await wrapper.get('[data-testid="login-signup-link"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/login')
    expect(wrapper.getComponent(SignUpDialog).props('modelValue')).toBe(true)
    wrapper.unmount()
  } finally {
    authConfig.value = previousConfig
  }
})
