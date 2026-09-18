<script setup lang="ts">
import { watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { Input } from '@mts241alikhlash/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mts241alikhlash/ui/select'
import { FloatingField, FormControl } from '@mts241alikhlash/ui/form'
import { personalSchema } from '../schemas/applicationFormSchemas'
import type { PersonalForm } from '../composables/useApplicationFormState'

defineProps<{
  editable: boolean
}>()

const model = defineModel<PersonalForm>({ required: true })

const { values, validate, setValues } = useForm<PersonalForm>({
  validationSchema: toTypedSchema(personalSchema),
  initialValues: model.value,
})

watch(model, (v) => setValues(v, false))
watch(values, (v) => Object.assign(model.value, v), { deep: true })

defineExpose({ validate })
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <FloatingField
      v-slot="{ componentField }"
      name="fullName"
      label="Nama Lengkap"
      required
    >
      <FormControl>
        <Input
          v-bind="componentField"
          :disabled="!editable"
        />
      </FormControl>
    </FloatingField>

    <FloatingField
      v-slot="{ componentField }"
      name="nickname"
      label="Nama Panggilan"
    >
      <FormControl>
        <Input
          v-bind="componentField"
          :disabled="!editable"
        />
      </FormControl>
    </FloatingField>

    <FloatingField
      v-slot="{ value, handleChange }"
      name="gender"
      label="Jenis Kelamin"
      required
    >
      <Select
        :model-value="value"
        :disabled="!editable"
        @update:model-value="handleChange"
      >
        <FormControl>
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Pilih" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="MALE">Laki-laki</SelectItem>
          <SelectItem value="FEMALE">Perempuan</SelectItem>
        </SelectContent>
      </Select>
    </FloatingField>

    <FloatingField
      v-slot="{ componentField }"
      name="birthPlace"
      label="Tempat Lahir"
      required
    >
      <FormControl>
        <Input
          v-bind="componentField"
          :disabled="!editable"
        />
      </FormControl>
    </FloatingField>

    <FloatingField
      v-slot="{ componentField }"
      name="birthDate"
      label="Tanggal Lahir"
      required
      always-float
    >
      <FormControl>
        <Input
          v-bind="componentField"
          type="date"
          :disabled="!editable"
        />
      </FormControl>
    </FloatingField>

    <FloatingField
      v-slot="{ componentField }"
      name="nik"
      label="NIK (16 digit)"
    >
      <FormControl>
        <Input
          v-bind="componentField"
          maxlength="16"
          :disabled="!editable"
        />
      </FormControl>
    </FloatingField>

    <FloatingField
      v-slot="{ componentField }"
      name="nisn"
      label="NISN (opsional)"
    >
      <FormControl>
        <Input
          v-bind="componentField"
          :disabled="!editable"
        />
      </FormControl>
    </FloatingField>

    <FloatingField
      v-slot="{ componentField }"
      name="phone"
      label="No. HP"
    >
      <FormControl>
        <Input
          v-bind="componentField"
          :disabled="!editable"
        />
      </FormControl>
    </FloatingField>
  </div>
</template>
