// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import type { ActiveWave } from '../../types'
import LandingHero from './LandingHero.vue'

describe('LandingHero', () => {
  it('keeps the route to registration information keyboard accessible without nesting controls', () => {
    const wrapper = mount(LandingHero, {
      props: { wave: null, loading: false, error: false },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.find('a[href="#alur"]').exists()).toBe(true)
    expect(wrapper.find('a button').exists()).toBe(false)
  })

  it('leaves full quota and fee details to the wave section', () => {
    const wave = {
      academicYear: '2026/2027',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      registrationFee: 123000,
      remainingQuota: 8,
    } as ActiveWave
    const wrapper = mount(LandingHero, {
      props: { wave, loading: false, error: false },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.text()).not.toContain('Sisa kuota')
    expect(wrapper.text()).not.toContain('Biaya pendaftaran')
    expect(wrapper.find('a[href="#gelombang"]').exists()).toBe(true)
  })
})
