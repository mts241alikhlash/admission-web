// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import AppLayout from './AppLayout.vue'

const { changePassword, legacyChangePassword } = vi.hoisted(() => ({
  changePassword: vi.fn().mockResolvedValue({}),
  legacyChangePassword: vi.fn(),
}))
vi.mock('@/features/platform/auth', () => ({
  useAuthSession: () => ({
    user: ref({ id: 'user-1', name: 'Admin', roles: ['ADMIN'] }),
    logoutUser: vi.fn(),
    changePassword: legacyChangePassword,
  }),
  authApi: { changePassword },
  AppSwitcher: { template: '<div />' },
}))
vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const passthrough = { template: '<div><slot /></div>' }
const router = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
  })
function mountLayout() {
  return mount(AppLayout, {
    global: {
      plugins: [router()],
      stubs: {
        AppSidebar: true,
        RouterView: true,
        Dialog: passthrough,
        DialogContent: passthrough,
        DialogHeader: passthrough,
        DialogTitle: passthrough,
        DialogDescription: passthrough,
        DialogFooter: passthrough,
        DropdownMenu: passthrough,
        DropdownMenuContent: passthrough,
        DropdownMenuGroup: passthrough,
        DropdownMenuTrigger: passthrough,
        DropdownMenuLabel: passthrough,
        DropdownMenuSeparator: true,
        DropdownMenuItem: { template: '<button><slot /></button>' },
      },
    },
  })
}

describe('header controls', () => {
  it('names search and account icon buttons', () => {
    const wrapper = mountLayout()
    expect(wrapper.find('button[aria-label="Cari halaman"]').exists()).toBe(
      true,
    )
    expect(wrapper.find('button[aria-label="Menu akun"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('uses the profile password-change flow, including current password and eight-character validation', async () => {
    const wrapper = mountLayout()
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Ganti Password')!
      .trigger('click')
    expect(wrapper.find('input[name="currentPassword"]').exists()).toBe(true)
    await wrapper.get('input[name="currentPassword"]').setValue('old-password')
    await wrapper.get('input[name="newPassword"]').setValue('short6')
    await wrapper.get('input[name="confirmPassword"]').setValue('short6')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(changePassword).not.toHaveBeenCalled()
    await wrapper.get('input[name="newPassword"]').setValue('new-password')
    await wrapper.get('input[name="confirmPassword"]').setValue('new-password')
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() =>
      expect(changePassword).toHaveBeenCalledWith({
        currentPassword: 'old-password',
        newPassword: 'new-password',
      }),
    )
    expect(legacyChangePassword).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
