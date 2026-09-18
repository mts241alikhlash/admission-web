<script setup lang="ts">
import { watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { Input } from '@mts241alikhlash/ui/input'
import { FloatingField, FormControl } from '@mts241alikhlash/ui/form'
import { addressSchema } from '../schemas/applicationFormSchemas'
import type { AddressForm } from '../composables/useApplicationFormState'

defineProps<{
  editable: boolean
}>()

const model = defineModel<AddressForm>({ required: true })

const { values, validate, setValues } = useForm<AddressForm>({
  validationSchema: toTypedSchema(addressSchema),
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
      name="street"
      label="Alamat (Jalan)"
      required
      class="sm:col-span-2"
    >
      <FormControl>
        <Input
          v-bind="componentField"
          :disabled="!editable"
        />
      </FormControl>
    </FloatingField>

    <div class="grid grid-cols-2 gap-4">
      <FloatingField
        v-slot="{ componentField }"
        name="rt"
        label="RT"
        required
      >
        <FormControl>
          <Input
            v-bind="componentField"
            maxlength="5"
            :disabled="!editable"
          />
        </FormControl>
      </FloatingField>

      <FloatingField
        v-slot="{ componentField }"
        name="rw"
        label="RW"
        required
      >
        <FormControl>
          <Input
            v-bind="componentField"
            maxlength="5"
            :disabled="!editable"
          />
        </FormControl>
      </FloatingField>
    </div>

    <FloatingField
      v-slot="{ componentField }"
      name="village"
      label="Desa/Kelurahan"
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
      name="district"
      label="Kecamatan"
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
      name="city"
      label="Kota/Kabupaten"
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
      name="province"
      label="Provinsi"
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
      name="postalCode"
      label="Kode Pos"
    >
      <FormControl>
        <Input
          v-bind="componentField"
          maxlength="10"
          :disabled="!editable"
        />
      </FormControl>
    </FloatingField>
  </div>
</template>
