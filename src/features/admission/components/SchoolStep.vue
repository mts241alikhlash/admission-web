<script setup lang="ts">
import { watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { Input } from '@mts241alikhlash/ui/input'
import { FloatingField, FormControl } from '@mts241alikhlash/ui/form'
import { schoolSchema } from '../schemas/applicationFormSchemas'
import type { SchoolForm } from '../composables/useApplicationFormState'

defineProps<{
  editable: boolean
}>()

const model = defineModel<SchoolForm>({ required: true })

const { values, validate, setValues } = useForm<SchoolForm>({
  validationSchema: toTypedSchema(schoolSchema),
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
      name="previousSchoolName"
      label="Nama Sekolah Asal"
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
      name="previousSchoolNpsn"
      label="NPSN (opsional)"
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
      name="previousSchoolAddress"
      label="Alamat Sekolah"
      class="sm:col-span-2"
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
      name="graduationYear"
      label="Tahun Lulus"
    >
      <FormControl>
        <Input
          v-bind="componentField"
          type="number"
          :disabled="!editable"
        />
      </FormControl>
    </FloatingField>
  </div>
</template>
