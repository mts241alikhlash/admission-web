import type { LandingStory } from '../types'

export const landingStories: LandingStory[] = [
  {
    id: 'alumni',
    kind: 'Cerita alumni',
    quote:
      'Di MTs Persis 241 Al-Ikhlash saya belajar bahwa ilmu bukan hanya untuk dihafal, tetapi untuk diamalkan. Kebiasaan baik yang ditanamkan guru-guru di sini masih saya bawa sampai sekarang.',
    name: 'Nama alumni',
    position: 'Posisi atau profesi saat ini',
    tags: ['Alumni · Lulus 20XX'],
    placeholder: true,
  },
  {
    id: 'orang-tua-aktif',
    kind: 'Cerita orang tua',
    quote:
      'Anak kami berangkat sekolah dengan senang dan pulang membawa banyak cerita. Kami melihat sendiri ia tumbuh lebih mandiri, rajin beribadah, dan percaya diri.',
    name: 'Nama orang tua',
    position: 'Pekerjaan atau profesi saat ini',
    tags: ['Orang tua santri aktif · Kelas 7'],
    placeholder: true,
  },
  {
    id: 'orang-tua-alumni',
    kind: 'Cerita orang tua',
    quote:
      'Dulu saya belajar di sini, dan sekarang saya mempercayakan anak saya di tempat yang sama. Nilai-nilai yang saya terima dulu masih terjaga, dan itu membuat kami tenang.',
    name: 'Nama orang tua',
    position: 'Pekerjaan atau profesi saat ini',
    tags: ['Alumni · Lulus 20XX', 'Orang tua santri aktif'],
    placeholder: true,
  },
]
