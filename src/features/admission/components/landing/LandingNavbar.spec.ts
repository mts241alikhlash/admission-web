// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import LandingNavbar from './LandingNavbar.vue'

describe('LandingNavbar', () => {
  it('uses the school logo as the labeled home link without extra header copy or nested controls', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/login', component: { template: '<div />' } },
      ],
    })
    await router.push('/')
    await router.isReady()
    const wrapper = mount(LandingNavbar, {
      attachTo: document.body,
      global: { plugins: [router] },
    })

    expect(
      wrapper
        .get('a[aria-label="PSB 241, kembali ke halaman utama"] img')
        .attributes('alt'),
    ).toBe('Logo MTs Persis 241 Al-Ikhlash')
    expect(wrapper.text()).not.toContain('Penerimaan Santri Baru')
    expect(wrapper.find('a button').exists()).toBe(false)
    expect(wrapper.get('a[href="/login"]').text()).toBe('Portal')
    expect(wrapper.findAll('a[href="/login"]')).toHaveLength(1)
    expect(
      wrapper.get('button[aria-controls="mobile-navigation"]').text(),
    ).toContain('Menu')
    await wrapper
      .get('button[aria-controls="mobile-navigation"]')
      .trigger('click')
    expect(
      wrapper.get('nav[aria-label="Navigasi halaman"] a[href="#alur"]').text(),
    ).toBe('Alur Daftar')
    const menuLink = wrapper.get('nav a[href="#alur"]').element as HTMLElement
    menuLink.focus()
    await wrapper.get('nav a[href="#alur"]').trigger('keydown.esc')
    expect(wrapper.find('nav[aria-label="Navigasi halaman"]').exists()).toBe(
      false,
    )
    expect(document.activeElement).toBe(
      wrapper.get('button[aria-controls="mobile-navigation"]').element,
    )
    wrapper.unmount()
  })
})
