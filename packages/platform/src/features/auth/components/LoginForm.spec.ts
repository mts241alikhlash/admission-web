// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { defineComponent } from 'vue'

import { authConfig, configureAuth } from '../config'
import LoginForm from './LoginForm.vue'

const routerLinkStub = defineComponent({
  props: { to: { type: [String, Object], required: false } },
  template: "<a :href=\"typeof to === 'string' ? to : '#'\"><slot /></a>",
})

const buttonStub = { template: '<button><slot /></button>' }
const inputStub = {
  props: ['modelValue'],
  template: '<input />',
}

function mountForm() {
  return mount(LoginForm, {
    global: {
      plugins: [createPinia()],
      stubs: {
        RouterLink: routerLinkStub,
        Button: buttonStub,
        Input: inputStub,
        FloatingField: { template: '<div><slot :componentField="{}" /></div>' },
        FormControl: { template: '<div><slot /></div>' },
      },
    },
  })
}

describe('LoginForm sign-up entry point', () => {
  beforeEach(() => {
    configureAuth({
      signUpUrl: null,
      signUpLabel: 'Belum punya akun?',
    })
  })

  it('renders no sign-up link when the app has not configured one', () => {
    const wrapper = mountForm()

    expect(wrapper.find('[data-testid="login-signup-link"]').exists()).toBe(
      false,
    )
    expect(wrapper.text()).not.toContain('Belum punya akun?')
  })

  it('renders the sign-up link pointing at the configured URL', () => {
    configureAuth({ signUpUrl: '/register' })
    const wrapper = mountForm()

    const link = wrapper.find('[data-testid="login-signup-link"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/register')
    expect(link.text()).toBe('Daftar')
    expect(wrapper.text()).toContain('Belum punya akun?')
  })

  it('honours a configured label', () => {
    configureAuth({ signUpUrl: '/register', signUpLabel: 'Baru di sini?' })
    const wrapper = mountForm()

    expect(wrapper.text()).toContain('Baru di sini?')
    expect(authConfig.value.signUpUrl).toBe('/register')
  })
})
