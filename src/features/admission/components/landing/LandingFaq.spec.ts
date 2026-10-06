// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import LandingFaq from './LandingFaq.vue'
import LandingHero from './LandingHero.vue'

describe('LandingFaq', () => {
  it('names the actual registration action shown in the hero', () => {
    const hero = mount(LandingHero, {
      props: { wave: null, loading: false, error: false },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    const faq = mount(LandingFaq)
    const registrationButton = hero.getComponent(RouterLinkStub).text()

    expect(faq.text()).toContain(registrationButton)
  })
})
