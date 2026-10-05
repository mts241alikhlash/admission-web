<script setup lang="ts">
import { computed, h, onMounted, ref, useId } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { DataTable, ActionCell, SearchInput } from '@mts241alikhlash/ui'
import { Button } from '@mts241alikhlash/ui/button'
import { Card, CardHeader, CardTitle } from '@mts241alikhlash/ui/card'
import { Badge } from '@mts241alikhlash/ui/badge'
import { Switch } from '@mts241alikhlash/ui/switch'
import { Input } from '@mts241alikhlash/ui/input'
import { ScrollArea } from '@mts241alikhlash/ui/scroll-area'
import { FloatingLabelField, FormControl } from '@mts241alikhlash/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mts241alikhlash/ui/select'
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
const listError = ref<string | null>(null)
const isSaving = ref(false)
const isFormOpen = ref(false)
const editing = ref<AdmissionBankAccount | null>(null)
const pendingDelete = ref<AdmissionBankAccount | null>(null)
const search = ref('')
const statusFilter = ref('ALL')
const statusFilterId = useId()
const activeId = useId()
const filteredAccounts = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase('id')
  return accounts.value.filter(
    (account) =>
      (statusFilter.value === 'ALL' ||
        String(account.isActive) === statusFilter.value) &&
      [account.bankName, account.accountNumber, account.accountHolder].some(
        (value) => value.toLocaleLowerCase('id').includes(keyword),
      ),
  )
})

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
  const result = await bankAccountService.fetchAll()
  listError.value = 'error' in result ? result.error : null
  accounts.value = 'accounts' in result ? result.accounts : []
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
        class="flex flex-col items-start justify-between gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:px-6 sm:py-5"
      >
        <CardTitle class="text-xl font-bold tracking-tight">
          Rekening Pembayaran
        </CardTitle>
        <Button
          class="min-h-11 w-full sm:min-h-0 sm:w-auto"
          @click="openForm(null)"
        >
          <Plus class="mr-1.5 size-4" />
          Tambah Rekening
        </Button>
      </CardHeader>

      <div class="space-y-4 p-4 sm:p-6">
        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        >
          <FloatingLabelField
            label="Status"
            :for="statusFilterId"
            class="w-full sm:w-48"
            floating
          >
            <Select v-model="statusFilter">
              <SelectTrigger
                :id="statusFilterId"
                size="sm"
                class="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua</SelectItem>
                <SelectItem value="true">Aktif</SelectItem>
                <SelectItem value="false">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </FloatingLabelField>
          <SearchInput
            v-model="search"
            label="Cari rekening"
          />
        </div>
        <div
          v-if="listError"
          class="space-y-3 rounded-md border p-4"
          role="alert"
        >
          <p class="text-sm">{{ listError }}</p>
          <Button
            variant="outline"
            class="min-h-11"
            @click="load()"
          >
            Coba lagi
          </Button>
        </div>
        <template v-else>
          <DataTable
            class="hidden md:block"
            :columns="columns"
            :data="filteredAccounts"
            :total-items="filteredAccounts.length"
            :is-loading="loading"
            item-label="rekening"
            hide-per-page
            hide-pagination
          />
          <p
            v-if="!loading && !filteredAccounts.length"
            class="rounded-md border p-4 text-center text-sm text-muted-foreground md:hidden"
          >
            Tidak ada data.
          </p>
          <ul
            data-test="mobile-bank-accounts"
            class="space-y-2 md:hidden"
          >
            <li
              v-for="account in filteredAccounts"
              :key="account.id"
              class="min-w-0 space-y-2 rounded-lg border p-4"
            >
              <p class="break-words font-semibold">{{ account.bankName }}</p>
              <p class="text-sm">{{ account.accountNumber }}</p>
              <p class="text-sm">a.n. {{ account.accountHolder }}</p>
              <Badge :variant="account.isActive ? 'default' : 'secondary'">{{
                account.isActive ? 'Aktif' : 'Nonaktif'
              }}</Badge>
              <div class="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  class="min-h-11"
                  aria-label="Ubah rekening"
                  @click="openForm(account)"
                  >Ubah</Button
                >
                <Button
                  variant="outline"
                  class="min-h-11"
                  aria-label="Hapus rekening"
                  @click="pendingDelete = account"
                  >Hapus</Button
                >
              </div>
            </li>
          </ul>
        </template>
      </div>
    </Card>

    <Dialog v-model:open="isFormOpen">
      <DialogContent
        class="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <DialogHeader class="shrink-0 border-b bg-muted/20 px-6 py-5">
          <DialogTitle>
            {{ editing ? 'Ubah Rekening' : 'Tambah Rekening' }}
          </DialogTitle>
          <DialogDescription class="sr-only">
            Pendaftar mentransfer biaya pendaftaran ke rekening ini.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea class="min-h-0 flex-1">
          <form
            id="bank-account-form"
            class="space-y-4 px-6 py-4"
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
            <div
              class="flex items-center justify-between gap-4 rounded-md border px-3 py-2"
            >
              <label
                :for="activeId"
                class="text-sm font-medium"
              >
                Aktif (tampil untuk pendaftar)
              </label>
              <Switch
                :id="activeId"
                :model-value="values.isActive"
                :disabled="isSaving"
                class="focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                @update:model-value="setFieldValue('isActive', $event)"
              />
            </div>
          </form>
        </ScrollArea>
        <DialogFooter
          class="w-full shrink-0 border-t bg-background px-6 py-4 sm:justify-between"
        >
          <Button
            type="button"
            variant="outline"
            :disabled="isSaving"
            @click="isFormOpen = false"
          >
            Batal
          </Button>
          <Button
            type="submit"
            form="bank-account-form"
            :disabled="isSaving"
          >
            {{ isSaving ? 'Menyimpan…' : 'Simpan' }}
          </Button>
        </DialogFooter>
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
