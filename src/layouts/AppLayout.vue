<script setup lang="ts">
import AppSidebar from '@/components/layout/AppSidebar.vue'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@mts241alikhlash/ui/breadcrumb'
import { Button } from '@mts241alikhlash/ui/button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@mts241alikhlash/ui/command'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@mts241alikhlash/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@mts241alikhlash/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@mts241alikhlash/ui/dialog'
import ChangePasswordSection from '@/features/platform/profile/components/ChangePasswordSection.vue'
import { Separator } from '@mts241alikhlash/ui/separator'
import { SidebarProvider, SidebarTrigger } from '@mts241alikhlash/ui/sidebar'
import { TooltipProvider } from '@mts241alikhlash/ui/tooltip'
import { AppSwitcher, useAuthSession } from '@/features/platform/auth'
import { menuSections } from '@/config/menuConfig'
import { KeyRound, LogOut, Search, UserRound } from '@lucide/vue'
import { useRoute, useRouter } from 'vue-router'
import type { BreadcrumbItemType } from '@mts241alikhlash/web-shared/types/breadcrumb.types'
import { provideBreadcrumbs } from '@mts241alikhlash/web-shared/composables/useBreadcrumbs'
import { computed, ref } from 'vue'

const { user, logoutUser } = useAuthSession()
const router = useRouter()
const openSearch = ref(false)

const isPasswordDialogOpen = ref(false)

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrator',
  TEACHER: 'Guru',
  STUDENT: 'Siswa',
}

const displayName = computed(() => {
  const currentUser = user.value
  return (
    currentUser?.profile?.name?.trim() ??
    currentUser?.name?.trim() ??
    'Pengguna'
  )
})

const displayRole = computed(() => {
  const roles = user.value?.roles ?? []
  if (roles.length === 0) return 'Akun'
  return roles.map((r) => ROLE_LABELS[r] ?? r).join(', ')
})

const userData = computed(() => ({
  name: displayName.value,
  email: displayRole.value,
  avatar: user.value?.profile?.avatar ?? '',
}))

const initials = computed(() => {
  return (
    userData.value.name
      .split(' ')
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || '?'
  )
})

function openPasswordDialog() {
  isPasswordDialogOpen.value = true
}

async function handleLogout() {
  await logoutUser()
  await router.push({ name: 'login' })
}

function handleViewProfile() {
  void router.push({ name: 'profile-view' })
}

const props = withDefaults(
  defineProps<{
    breadcrumbs?: BreadcrumbItemType[]
  }>(),
  {
    breadcrumbs: () => [],
  },
)

const route = useRoute()
const breadcrumbOverride = provideBreadcrumbs()

const resolvedBreadcrumbs = computed<BreadcrumbItemType[]>(() =>
  props.breadcrumbs.length > 0
    ? props.breadcrumbs
    : (breadcrumbOverride.value ?? route.meta.breadcrumbs ?? []),
)

const searchGroups = computed(() => {
  return menuSections.flatMap((section) =>
    section.items.map((group) => ({
      heading: group.title,
      items: group.items
        ? group.items.map((item) => ({ title: item.title, url: item.url }))
        : [{ title: group.title, url: group.url }],
    })),
  )
})
</script>

<template>
  <SidebarProvider>
    <TooltipProvider :delay-duration="100">
      <AppSidebar />
      <main
        class="relative flex w-full flex-1 flex-col bg-background overflow-hidden h-svh content-container"
      >
        <header
          class="flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear border-b bg-card"
        >
          <div class="flex items-center gap-2 px-4">
            <SidebarTrigger
              class="-ml-1 size-11 md:size-7 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <Separator
              orientation="vertical"
              class="mr-2 data-[orientation=vertical]:h-4"
            />
            <slot name="breadcrumb">
              <Breadcrumb>
                <BreadcrumbList>
                  <template v-if="resolvedBreadcrumbs.length > 0">
                    <template
                      v-for="(item, index) in resolvedBreadcrumbs"
                      :key="index"
                    >
                      <BreadcrumbItem
                        :class="{
                          'hidden md:block':
                            index < resolvedBreadcrumbs.length - 1,
                        }"
                      >
                        <BreadcrumbPage
                          v-if="index === resolvedBreadcrumbs.length - 1"
                          class="block max-w-48 truncate font-medium text-primary sm:max-w-xs"
                        >
                          {{ item.title }}
                        </BreadcrumbPage>
                        <BreadcrumbLink
                          v-else-if="item.href"
                          :href="item.href"
                          class="block max-w-40 truncate"
                        >
                          {{ item.title }}
                        </BreadcrumbLink>
                        <span v-else>{{ item.title }}</span>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator
                        v-if="index < resolvedBreadcrumbs.length - 1"
                        :class="{
                          'hidden md:block':
                            index < resolvedBreadcrumbs.length - 1,
                        }"
                      />
                    </template>
                  </template>
                </BreadcrumbList>
              </Breadcrumb>
            </slot>
          </div>
          <div class="ml-auto flex items-center gap-4 px-6 lg:px-8">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cari halaman"
              class="relative size-11 md:size-8 rounded-full bg-muted hover:bg-muted/80 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              @click="openSearch = true"
            >
              <Search class="size-4" />
            </Button>

            <CommandDialog v-model:open="openSearch">
              <CommandInput placeholder="Ketik pencarian..." />
              <CommandList>
                <CommandEmpty>Tidak ada hasil yang ditemukan.</CommandEmpty>
                <CommandGroup
                  v-for="group in searchGroups"
                  :key="group.heading"
                  :heading="group.heading"
                >
                  <CommandItem
                    v-for="item in group.items"
                    :key="item.title"
                    :value="item.title"
                    @select="
                      () => {
                        router.push(item.url)
                        openSearch = false
                      }
                    "
                  >
                    {{ item.title }}
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </CommandDialog>

            <AppSwitcher />

            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  variant="ghost"
                  aria-label="Menu akun"
                  class="relative size-11 md:size-8 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Avatar class="h-8 w-8 rounded-full border border-border">
                    <AvatarImage
                      :src="userData.avatar"
                      :alt="userData.name"
                    />
                    <AvatarFallback>{{ initials }}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                class="w-56"
                align="end"
                :side-offset="8"
              >
                <DropdownMenuLabel class="font-normal">
                  <div class="flex flex-col space-y-1">
                    <p class="text-sm font-semibold leading-none">
                      {{ userData.name }}
                    </p>
                    <p class="text-xs leading-none text-muted-foreground">
                      {{ userData.email }}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem @click="handleViewProfile">
                    <UserRound class="size-4 mr-2" />
                    <span>Lihat Profil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="openPasswordDialog">
                    <KeyRound class="size-4 mr-2" />
                    <span>Ganti Password</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  class="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                  @click="handleLogout"
                >
                  <LogOut class="size-4 mr-2" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div class="flex-1 overflow-auto min-w-0">
          <slot><RouterView /></slot>
        </div>
      </main>
    </TooltipProvider>
  </SidebarProvider>

  <Dialog v-model:open="isPasswordDialogOpen">
    <DialogContent class="max-h-[calc(100dvh-2rem)] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Ganti Password</DialogTitle>
        <DialogDescription
          >Masukkan password saat ini dan password baru untuk akun
          Anda.</DialogDescription
        >
      </DialogHeader>

      <ChangePasswordSection v-if="isPasswordDialogOpen" />
    </DialogContent>
  </Dialog>
</template>
