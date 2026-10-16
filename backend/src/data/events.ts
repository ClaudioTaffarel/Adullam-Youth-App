export type CommunityEvent = {
  id: number
  title: string
  category: string
  image: string
  description: string
}

export const events: CommunityEvent[] = [
  {
    id: 1,
    title: 'Kamis, kita kumpul.',
    category: 'KOMSEL',
    image: '/images/memories/1.webp',
    description:
      'Waktu untuk berbagi cerita dan bertumbuh bersama dalam Tuhan. ' +
      'Komsel berlangsung setiap Kamis, pukul 19.00–21.00 WIB.',
  },
  {
    id: 2,
    title: 'Take a moment. Pray.',
    category: 'PRAYER NIGHT',
    image: '/images/memories/2.webp',
    description:
      'Sebulan sekali, pertemuan komsel diganti dengan prayer night. ' +
      'Kita mengambil waktu untuk berdoa bersama.',
  },
  {
    id: 3,
    title: 'Memories from Lembang.',
    category: 'FELLOWSHIP',
    image: '/images/memories/3.webp',
    description:
      'Kenangan perjalanan fellowship ke Lembang selama dua hari satu malam. ' +
      'Waktu bersama untuk semakin mengenal satu sama lain.',
  },
  {
    id: 4,
    title: 'Kamis, kita kumpul.',
    category: 'KOMSEL',
    image: '/images/memories/1.webp',
    description:
      'Waktu untuk berbagi cerita dan bertumbuh bersama dalam Tuhan. ' +
      'Komsel berlangsung setiap Kamis, pukul 19.00–21.00 WIB.',
  },
  {
    id: 5,
    title: 'Take a moment. Pray.',
    category: 'PRAYER NIGHT',
    image: '/images/memories/2.webp',
    description:
      'Sebulan sekali, pertemuan komsel diganti dengan prayer night. ' +
      'Kita mengambil waktu untuk berdoa bersama.',
  },
  {
    id: 6,
    title: 'Memories from Lembang.',
    category: 'FELLOWSHIP',
    image: '/images/memories/3.webp',
    description:
      'Kenangan perjalanan fellowship ke Lembang selama dua hari satu malam. ' +
      'Waktu bersama untuk semakin mengenal satu sama lain.',
  },
]