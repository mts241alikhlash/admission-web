<script setup lang="ts">
import { watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { Badge } from '@mts241alikhlash/ui/badge'
import { Button } from '@mts241alikhlash/ui/button'
import { Input } from '@mts241alikhlash/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mts241alikhlash/ui/select'
import {
  FloatingField,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@mts241alikhlash/ui/form'
import { RELATION_LABELS } from '../types'
import { parentsSchema } from '../schemas/applicationFormSchemas'
import type { ParentForm } from '../composables/useApplicationFormState'

defineProps<{
  editable: boolean
  onAdd: () => void
  onRemove: (index: number) => void
}>()

const parents = defineModel<ParentForm[]>({ required: true })

const { values, validate, setValues } = useForm<{ parents: ParentForm[] }>({
  validationSchema: toTypedSchema(parentsSchema),
  initialValues: { parents: parents.value },
})

watch(parents, (v) => setValues({ parents: v }, false))
watch(
  values,
  (v) => {
    if (v.parents) parents.value.splice(0, parents.value.length, ...v.parents)
  },
  { deep: true },
)

defineExpose({ validate })
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="(parent, index) in parents"
      :key="index"
      class="rounded-md border p-4"
    >
      <div class="mb-3 flex items-center justify-between">
        <p class="font-medium">
          {{ RELATION_LABELS[parent.relation] }}
          <Badge
            v-if="parent.isPrimary"
            variant="secondary"
            class="ml-2"
          >
            Kontak Utama
          </Badge>
        </p>
        <Button
          v-if="editable && parents.length > 1"
          variant="ghost"
          size="sm"
          @click="onRemove(index)"
        >
          Hapus
        </Button>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <FloatingField
          v-slot="{ value, handleChange }"
          :name="`parents[${index}].relation`"
          label="Hubungan"
          required
        >
          <Select
            :model-value="value"
            :disabled="!editable"
            @update:model-value="handleChange"
          >
            <FormControl>
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="FATHER">Ayah</SelectItem>
              <SelectItem value="MOTHER">Ibu</SelectItem>
              <SelectItem value="GUARDIAN">Wali</SelectItem>
            </SelectContent>
          </Select>
        </FloatingField>

        <FloatingField
          v-slot="{ componentField }"
          :name="`parents[${index}].name`"
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
          :name="`parents[${index}].nik`"
          label="NIK"
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
          :name="`parents[${index}].phone`"
          label="No. HP"
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
          :name="`parents[${index}].birthPlace`"
          label="Tempat Lahir"
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
          :name="`parents[${index}].birthDate`"
          label="Tanggal Lahir"
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
      </div>
    </div>
    <Button
      v-if="editable"
      variant="outline"
      @click="onAdd"
    >
      + Tambah Orang Tua/Wali
    </Button>

    <FormField name="parents">
      <FormItem>
        <FormMessage />
      </FormItem>
    </FormField>
  </div>
</template>
