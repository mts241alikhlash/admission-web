<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { DataTable, ActionCell } from '@mts241alikhlash/ui'
import { Button } from '@mts241alikhlash/ui/button'
import { Card, CardHeader, CardTitle } from '@mts241alikhlash/ui/card'
import { Badge } from '@mts241alikhlash/ui/badge'
import { Checkbox } from '@mts241alikhlash/ui/checkbox'
import { Input } from '@mts241alikhlash/ui/input'
import { FormControl } from '@mts241alikhlash/ui/form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@mts241alikhlash/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@mts241alikhlash/ui/alert-dialog'
import { Plus } from '@lucide/vue'
import type { ColumnDef } from '@tanstack/vue-table'
import FloatingField from '../components/AdmissionField.vue'
import { bankAccountSchema } from '../schemas/applicationFormSchemas'
import { bankAccountService } from '../services/bankAccountService'
import type { AdmissionBankAccount, BankAccountSavePayload } from '../types'
import { vDigits } from '../vDigits'

const accounts = ref<AdmissionBankAccount[]>([])
const loading = ref(false)
const isSaving = ref(false)
const isFormOpen = ref(false)
const editing = ref<AdmissionBankAccount | null>(null)
const pendingDelete = ref<AdmissionBankAccount | null>(null)

const { handleSubmit, resetForm, values, setFieldValue } =
  useForm<BankAccountSavePayload>({
    validationSchema: toTypedSchema(bankAccountSchema),
  })

const columns = computed<ColumnDef<AdmissionBankAccount>[]>(() => [
  {
    id: 'no',
    header: 'No',
    cell: ({ row }) => row.index + 1,
    enableSorting: false,
  },
  { accessorKey: 'bankName', header: 'Bank' },
  { accessorKey: 'accountNumber', header: 'No. Rekening' },
  { accessorKey: 'accountHolder', header: 'Atas Nama' },
  {
    id: 'isActive',
    header: 'Status',
    meta: { align: 'center' },
    cell: ({ row }) =>
      h(
        Badge,
        { variant: row.original.isActive ? 'default' : 'secondary' },
        () => (row.original.isActive ? 'Aktif' : 'Nonaktif'),
      ),
  },
  {
    id: 'actions',
    header: 'Aksi',
    cell: ({ row }) =>
      h(ActionCell, {
        onEdit: () => openForm(row.original),
        onDelete: () => {
          pendingDelete.value = row.original
        },
      }),
    enableSorting: false,
  },
])

async function load() {
  loading.value = true
  accounts.value = await bankAccountService.fetchAll()
  loading.value = false
}

function openForm(account: AdmissionBankAccount | null) {
  editing.value = account
  resetForm({
    values: {
      bankName: account?.bankName ?? '',
      accountNumber: account?.accountNumber ?? '',
      accountHolder: account?.accountHolder ?? '',
      isActive: account?.isActive ?? true,
    },
  })
  isFormOpen.value = true
}

const save = handleSubmit(async (payload) => {
  isSaving.value = true
  const result = await bankAccountService.save(
    editing.value?.id ?? null,
    payload,
  )
  isSaving.value = false
  if (!result.success) return
  isFormOpen.value = false
  await load()
})

async function confirmDelete() {
  if (!pendingDelete.value) return
  const result = await bankAccountService.remove(pendingDelete.value.id)
  pendingDelete.value = null
  if (result.success) await load()
}

onMounted(load)
</script>

<template>
  <div class="p-4 sm:p-6">
    <Card
      class="overflow-hidden rounded-2xl shadow-sm shadow-black/5 ring-1 ring-black/4"
    >
      <CardHeader
        class="flex flex-col items-start justify-between gap-4 border-b px-6 py-5 sm:flex-row sm:items-center"
      >
        <div>
          <CardTitle class="text-xl font-bold tracking-tight">
            Rekening Pembayaran
          </CardTitle>
          <p class="text-sm text-muted-foreground">
            Rekening aktif tampil di langkah Pembayaran pendaftar.
          </p>
        </div>
        <Button @click="openForm(null)">
          <Plus class="mr-2 h-4 w-4" />
          Tambah Rekening
        </Button>
      </CardHeader>

      <div class="space-y-4 p-6">
        <p
          v-if="!loading && accounts.length === 0"
          class="text-sm text-muted-foreground"
        >
          Belum ada rekening. Pendaftar belum bisa melihat tujuan transfer.
        </p>
        <DataTable
          v-else
          :columns="columns"
          :data="accounts"
          :is-loading="loading"
          item-label="rekening"
          hide-per-page
        />
      </div>
    </Card>

    <Dialog v-model:open="isFormOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {{ editing ? 'Ubah Rekening' : 'Tambah Rekening' }}
          </DialogTitle>
          <DialogDescription>
            Pendaftar mentransfer biaya pendaftaran ke rekening ini.
          </DialogDescription>
        </DialogHeader>
        <form
          class="space-y-4"
          @submit.prevent="save"
        >
          <FloatingField
            v-slot="{ componentField }"
            name="bankName"
            label="Nama Bank"
            required
          >
            <FormControl>
              <Input
                v-bind="componentField"
                maxlength="100"
              />
            </FormControl>
          </FloatingField>
          <FloatingField
            v-slot="{ componentField }"
            name="accountNumber"
            label="Nomor Rekening"
            required
          >
            <FormControl>
              <Input
                v-digits
                v-bind="componentField"
                inputmode="numeric"
                maxlength="30"
              />
            </FormControl>
          </FloatingField>
          <FloatingField
            v-slot="{ componentField }"
            name="accountHolder"
            label="Atas Nama"
            required
          >
            <FormControl>
              <Input
                v-bind="componentField"
                maxlength="100"
              />
            </FormControl>
          </FloatingField>
          <label class="flex items-center gap-2 text-sm">
            <Checkbox
              :model-value="values.isActive"
              @update:model-value="setFieldValue('isActive', $event === true)"
            />
            Aktif (tampil untuk pendaftar)
          </label>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              @click="isFormOpen = false"
            >
              Batal
            </Button>
            <Button
              type="submit"
              :disabled="isSaving"
            >
              {{ isSaving ? 'Menyimpan…' : 'Simpan' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog
      :open="pendingDelete !== null"
      @update:open="
        (open) => {
          if (!open) pendingDelete = null
        }
      "
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus rekening?</AlertDialogTitle>
          <AlertDialogDescription>
            Rekening tidak lagi tampil untuk pendaftar. Pembayaran yang sudah
            memilihnya tetap mencatatnya.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction @click="confirmDelete">Hapus</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
