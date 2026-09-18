<script setup lang="ts">
import { computed } from 'vue'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { Button } from '@mts241alikhlash/ui/button'
import { Input } from '@mts241alikhlash/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@mts241alikhlash/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mts241alikhlash/ui/select'
import { FloatingField, FormControl } from '@mts241alikhlash/ui/form'
import { Loader2 } from 'lucide-vue-next'
import type { ActiveWave } from '../types'
import { formatIDR } from '../utils'

const props = defineProps<{
  open: boolean
  waves: ActiveWave[]
  isSubmitting: boolean
  errorMessage: string | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (
    e: 'submit',
    payload: {
      fullName: string
      email: string
      phone?: string
      password: string
      passwordConfirm: string
      waveId: string
    },
  ): void
}>()

const formSchema = toTypedSchema(
  z
    .object({
      fullName: z
        .string()
        .min(1, 'Nama lengkap wajib diisi')
        .min(3, 'Nama lengkap minimal 3 karakter'),
      email: z
        .string()
        .min(1, 'Email wajib diisi')
        .email('Format email tidak valid'),
      phone: z
        .string()
        .max(15, 'Nomor HP maksimal 15 karakter')
        .optional()
        .default(''),
      password: z.string().min(8, 'Kata sandi minimal 8 karakter'),
      passwordConfirm: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
      waveId: z.string().min(1, 'Gelombang wajib dipilih'),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: 'Konfirmasi kata sandi tidak cocok.',
      path: ['passwordConfirm'],
    }),
)

interface AccountFormValues {
  fullName: string
  email: string
  phone: string
  password: string
  passwordConfirm: string
  waveId: string
}

const { handleSubmit, resetForm, values } = useForm<AccountFormValues>({
  validationSchema: formSchema,
  initialValues: {
    fullName: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
    waveId: '',
  },
})

const selectedWave = computed(() =>
  props.waves.find((w) => w.id === values.waveId),
)

const onSubmit = handleSubmit((formValues) => {
  emit('submit', {
    fullName: formValues.fullName.trim(),
    email: formValues.email.trim(),
    phone: formValues.phone?.trim() || undefined,
    password: formValues.password,
    passwordConfirm: formValues.passwordConfirm,
    waveId: formValues.waveId,
  })
})

function handleOpenChange(open: boolean) {
  if (!open && !props.isSubmitting) {
    resetForm()
  }
  emit('update:open', open)
}
</script>

<template>
  <Dialog
    :open="open"
    @update:open="handleOpenChange"
  >
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Daftarkan Pendaftar</DialogTitle>
        <DialogDescription>
          Buat akun untuk calon santri. Setelah akun dibuat, Anda akan
          melanjutkan ke pengisian formulir.
        </DialogDescription>
      </DialogHeader>

      <form
        id="register-applicant-form"
        class="grid grid-cols-1 items-start gap-x-4 gap-y-2 sm:grid-cols-2"
        @submit.prevent="onSubmit"
      >
        <FloatingField
          v-slot="{ componentField }"
          name="fullName"
          label="Nama Lengkap Calon Santri"
          required
          class="sm:col-span-2"
        >
          <FormControl>
            <Input
              v-bind="componentField"
              :disabled="isSubmitting"
            />
          </FormControl>
        </FloatingField>

        <FloatingField
          v-slot="{ componentField }"
          name="email"
          label="Email"
          required
        >
          <FormControl>
            <Input
              v-bind="componentField"
              type="email"
              :disabled="isSubmitting"
            />
          </FormControl>
        </FloatingField>

        <FloatingField
          v-slot="{ componentField }"
          name="phone"
          label="No. HP (opsional)"
        >
          <FormControl>
            <Input
              v-bind="componentField"
              :disabled="isSubmitting"
            />
          </FormControl>
        </FloatingField>

        <FloatingField
          v-slot="{ componentField }"
          name="password"
          label="Kata Sandi"
          required
        >
          <FormControl>
            <Input
              v-bind="componentField"
              type="password"
              autocomplete="new-password"
              :disabled="isSubmitting"
            />
          </FormControl>
        </FloatingField>

        <FloatingField
          v-slot="{ componentField }"
          name="passwordConfirm"
          label="Konfirmasi Kata Sandi"
          required
        >
          <FormControl>
            <Input
              v-bind="componentField"
              type="password"
              autocomplete="new-password"
              :disabled="isSubmitting"
            />
          </FormControl>
        </FloatingField>

        <FloatingField
          v-slot="{ value, handleChange }"
          name="waveId"
          label="Gelombang Pendaftaran"
          required
          class="sm:col-span-2"
        >
          <Select
            :model-value="value"
            :disabled="isSubmitting || waves.length === 0"
            @update:model-value="handleChange"
          >
            <FormControl>
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem
                v-for="wave in waves"
                :key="wave.id"
                :value="wave.id"
              >
                {{ wave.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </FloatingField>

        <p
          v-if="selectedWave"
          class="text-xs text-muted-foreground sm:col-span-2"
        >
          Biaya pendaftaran:
          {{ formatIDR(selectedWave.registrationFee) }} · Sisa kuota:
          {{ selectedWave.remainingQuota }}
        </p>

        <div
          v-if="waves.length === 0"
          class="rounded-md border border-dashed p-3 text-sm text-muted-foreground sm:col-span-2"
        >
          Tidak ada gelombang yang dibuka saat ini.
        </div>

        <p
          v-if="errorMessage"
          class="text-sm text-destructive sm:col-span-2"
        >
          {{ errorMessage }}
        </p>
      </form>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          :disabled="isSubmitting"
          @click="handleOpenChange(false)"
        >
          Batal
        </Button>
        <Button
          type="submit"
          form="register-applicant-form"
          :disabled="isSubmitting || waves.length === 0"
        >
          <Loader2
            v-if="isSubmitting"
            class="size-4 mr-1.5 animate-spin"
          />
          {{ isSubmitting ? 'Memproses...' : 'Buat Akun' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
