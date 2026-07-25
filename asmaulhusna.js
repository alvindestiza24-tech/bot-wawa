import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'asmaulhusna',
  alias: ['asmanama', '99nama', 'allahnames'],
  category: 'islamic',
  description: 'Tampilkan Asmaul Husna (99 nama Allah) dengan arti, bisa acak atau urut',
  usage: '.asmaulhusna [angka|random]',
  example: '.asmaulhusna 7',
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

const APIS = [
  async function alquranCloud() {
    const res = await axios.get('https://api.alquran.cloud/v1/asmaulhusna', { timeout: 8000 })
    if (!res.data?.data) throw new Error('Data tidak ditemukan')
    return res.data.data
  },
  async function backupAsma() {
    const fallback = [
      { number: 1, name: 'الرَّحْمَنُ', transliteration: 'Ar-Rahman', meaning: 'Yang Maha Pemurah' },
      { number: 2, name: 'الرَّحِيمُ', transliteration: 'Ar-Rahim', meaning: 'Yang Maha Penyayang' },
      { number: 3, name: 'الْمَلِكُ', transliteration: 'Al-Malik', meaning: 'Yang Maha Merajai' },
    ]
    return fallback
  }
]

async function fetchAsma() {
  const errors = []
  for (const fn of APIS) {
    try {
      const result = await fn()
      if (result && Array.isArray(result) && result.length > 0) return result
    } catch (err) { errors.push(err.message) }
  }
  throw new Error(`Gagal mengambil Asmaul Husna:\n${errors.join('\n')}`)
}

export async function handler(m, { sock }) {
  const input = m.text?.trim() || ''

  await m.react('⏳')
  try {
    const list = await fetchAsma()
    let selected = []
    if (/^\d+$/.test(input)) {
      const idx = parseInt(input) - 1
      if (idx < 0 || idx >= list.length) return m.reply('❌ Nomor tidak valid (1-99)')
      selected = [list[idx]]
    } else if (input.toLowerCase() === 'random') {
      const rand = Math.floor(Math.random() * list.length)
      selected = [list[rand]]
    } else {
      selected = list
    }

    const rows = selected.map((item, i) => [
      String(item.number || i + 1),
      item.name || '-',
      item.transliteration || '-',
      item.meaning || '-'
    ])
    const header = ['No', 'Arab', 'Latin', 'Arti']
    const table = [header, ...rows]

    const builder = new AIRich(sock).setTitle('☪️ Asmaul Husna')
    if (selected.length === 1) {
      const s = selected[0]
      builder.addText(`## ${s.number}. ${s.name}\n**Transliterasi:** ${s.transliteration}\n**Arti:** ${s.meaning}`)
    } else {
      builder.addText('99 Nama Allah SWT')
    }
    builder.addTable(table)
    const suggest = ['asmaulhusna 1', 'asmaulhusna 99', 'asmaulhusna random']
    builder.addSuggest(suggest)
    await builder.send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}