<script setup lang="ts">
import { ref, useId, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Check, Copy } from '@lucide/vue'
import { Button } from '@mts241alikhlash/ui/button'
import { Input } from '@mts241alikhlash/ui/input'
import { FloatingLabelField } from '@mts241alikhlash/ui/form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@mts241alikhlash/ui/dialog'
import type { ApplicantCredentials } from '../composables/useAdminRegistration'

const props = defineProps<{
  open: boolean
  credentials: ApplicantCredentials | null
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  fill: []
}>()

const copied = ref(false)
const registrationId = useId()
const emailId = useId()
const passwordId = useId()

watch(
  () => props.open,
  (open) => {
    if (open) copied.value = false
  },
)

async function copyCredentials() {
  if (!props.credentials) return
  const text = `No. Pendaftaran: ${props.credentials.registrationNumber}\nEmail: ${props.credentials.email}\nKata Sandi: ${props.credentials.password}`
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    toast.success('Kredensial disalin.')
  } catch {
    toast.error('Tidak dapat menyalin. Salin secara manual.')
  }
}
</script>

<template>
  <Dialog
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <DialogContent
      class="sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden max-h-[calc(100dvh-2rem)]"
    >
      <DialogHeader class="px-6 py-5 border-b shrink-0 bg-muted/20">
        <DialogTitle>Akun Pendaftar Dibuat</DialogTitle>
        <DialogDescription class="sr-only">
          Kredensial akun pendaftar yang baru dibuat.
        </DialogDescription>
      </DialogHeader>

      <div
        v-if="credentials"
        class="min-h-0 space-y-4 overflow-y-auto px-6 py-4"
      >
        <p class="text-sm text-muted-foreground">
          Serahkan kredensial berikut kepada pendaftar. Kata sandi hanya
          ditampilkan sekali.
        </p>
        <div class="space-y-2">
          <FloatingLabelField
            label="Nomor Pendaftaran"
            :for="registrationId"
            floating
          >
            <Input
              :id="registrationId"
              :model-value="credentials.registrationNumber"
              readonly
              class="font-mono"
            />
          </FloatingLabelField>
          <FloatingLabelField
            label="Email"
            :for="emailId"
            floating
          >
            <Input
              :id="emailId"
              :model-value="credentials.email"
              readonly
            />
          </FloatingLabelField>
          <FloatingLabelField
            label="Kata Sandi"
            :for="passwordId"
            floating
          >
            <Input
              :id="passwordId"
              :model-value="credentials.password"
              readonly
            />
          </FloatingLabelField>
        </div>
        <Button
          type="button"
          variant="outline"
          class="w-full"
          @click="copyCredentials"
        >
          <component
            :is="copied ? Check : Copy"
            class="size-4 mr-1.5"
          />
          {{ copied ? 'Tersalin' : 'Salin semua kredensial' }}
        </Button>
      </div>

      <DialogFooter
        class="px-6 py-4 border-t shrink-0 flex sm:justify-between w-full bg-background"
      >
        <Button
          type="button"
          variant="outline"
          @click="emit('update:open', false)"
        >
          Nanti Saja
        </Button>
        <Button
          type="button"
          @click="emit('fill')"
        >
          Isi Formulir
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
