// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import LandingFaq from './LandingFaq.vue'
import LandingHero from './LandingHero.vue'

describe('LandingFaq', () => {
  it('names the actual registration action shown in the hero', () => {
    const hero = mount(LandingHero, {
      props: { wave: null, loading: false, error: false },
    })
    const faq = mount(LandingFaq)
    const registrationButton = hero.get('button').text()

    expect(faq.text()).toContain(registrationButton)
  })
})
