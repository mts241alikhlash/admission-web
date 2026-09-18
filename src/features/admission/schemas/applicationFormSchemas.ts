import * as z from 'zod'

const nikSchema = z
  .string()
  .optional()
  .default('')
  .refine((v) => !v || /^\d{16}$/.test(v), 'NIK harus 16 digit angka')

const phoneSchema = z
  .string()
  .max(15)
  .optional()
  .default('')
  .refine((v) => !v || /^[0-9+\-\s]{6,15}$/.test(v), 'Nomor HP tidak valid')

export const personalSchema = z.object({
  fullName: z.string().trim().min(1, 'Nama lengkap wajib diisi').max(100),
  nickname: z.string().max(50).optional().default(''),
  gender: z.string().min(1, 'Jenis kelamin wajib dipilih'),
  birthPlace: z.string().trim().min(1, 'Tempat lahir wajib diisi').max(100),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi'),
  nik: nikSchema,
  nisn: z.string().max(20).optional().default(''),
  phone: phoneSchema,
})

const parentEntrySchema = z.object({
  relation: z.string(),
  name: z.string().trim().min(1, 'Nama wajib diisi').max(100),
  nik: nikSchema,
  birthPlace: z.string().max(100).optional().default(''),
  birthDate: z.string().optional().default(''),
  phone: phoneSchema,
  isPrimary: z.boolean(),
})

export const parentsSchema = z.object({
  parents: z.array(parentEntrySchema).min(1, 'Minimal satu orang tua/wali'),
})

export const addressSchema = z.object({
  street: z.string().trim().min(1, 'Alamat wajib diisi').max(255),
  rt: z.string().trim().min(1, 'RT wajib diisi').max(5),
  rw: z.string().trim().min(1, 'RW wajib diisi').max(5),
  village: z.string().trim().min(1, 'Desa/Kelurahan wajib diisi').max(100),
  district: z.string().trim().min(1, 'Kecamatan wajib diisi').max(100),
  city: z.string().trim().min(1, 'Kota/Kabupaten wajib diisi').max(100),
  province: z.string().trim().min(1, 'Provinsi wajib diisi').max(100),
  postalCode: z
    .string()
    .max(10)
    .optional()
    .default('')
    .refine((v) => !v || /^\d{4,10}$/.test(v), 'Kode pos tidak valid'),
})

export const schoolSchema = z.object({
  previousSchoolName: z.string().max(200).optional().default(''),
  previousSchoolNpsn: z.string().max(20).optional().default(''),
  previousSchoolAddress: z.string().max(255).optional().default(''),
  graduationYear: z
    .string()
    .optional()
    .default('')
    .refine(
      (v) => !v || (Number(v) >= 1990 && Number(v) <= 2100),
      'Tahun lulus tidak valid',
    ),
})
