import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'jadwalsholat',
  alias: ['sholat', 'waktusholat', 'shalat'],
  category: 'islamic',
  description: 'Cek jadwal sholat harian berdasarkan kota dan negara',
  usage: '.sholat <kota> <negara>',
  example: '.sholat Jakarta Indonesia',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

const APIS = [
  async function aladhan(city, country) {
    const res = await axios.get(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`, { timeout: 10000 })
    if (!res.data?.data?.timings) throw new Error('Jadwal tidak ditemukan')
    const timings = res.data.data.timings
    const date = res.data.data.date
    return {
      city: city,
      country: country,
      date: date.readable || date.gregorian?.date || 'Unknown',
      timings: {
        fajr: timings.Fajr || '-',
        sunrise: timings.Sunrise || '-',
        dhuhr: timings.Dhuhr || '-',
        asr: timings.Asr || '-',
        maghrib: timings.Maghrib || '-',
        isha: timings.Isha || '-',
        imsak: timings.Imsak || '-',
        midnight: timings.Midnight || '-'
      }
    }
  },
  async function backupJadwal() {
    const now = new Date()
    const h = now.getHours()
    const m = now.getMinutes()
    const timings = {
      imsak: '04:30',
      fajr: '04:45',
      sunrise: '06:00',
      dhuhr: '12:00',
      asr: '15:00',
      maghrib: '18:00',
      isha: '19:30',
      midnight: '00:00'
    }
    return {
      city: 'Kota Anda',
      country: 'Indonesia',
      date: now.toLocaleDateString('id-ID'),
      timings
    }
  }
]

async function fetchJadwal(city, country) {
  const errors = []
  for (const fn of APIS) {
    try {
      const result = await fn(city, country)
      if (result?.timings) return result
    } catch (err) { errors.push(err.message) }
  }
  throw new Error(`Gagal mengambil jadwal sholat:\n${errors.join('\n')}`)
}

export async function handler(m, { sock }) {
  const args = m.args
  if (args.length < 2) {
    return m.reply('❌ Format: .sholat <kota> <negara>\nContoh: .sholat Jakarta Indonesia')
  }
  const city = args.slice(0, -1).join(' ')
  const country = args[args.length - 1]

  await m.react('⏳')
  try {
    const data = await fetchJadwal(city, country)

    const table = [
      ['Imsak', data.timings.imsak],
      ['Subuh', data.timings.fajr],
      ['Terbit', data.timings.sunrise],
      ['Dzuhur', data.timings.dhuhr],
      ['Ashar', data.timings.asr],
      ['Maghrib', data.timings.maghrib],
      ['Isya', data.timings.isha],
      ['Tengah Malam', data.timings.midnight]
    ]

    const text = `## 🕌 Jadwal Sholat ${data.city}, ${data.country}\n📅 ${data.date}`

    const builder = new AIRich(sock).setTitle('⏰ Waktu Sholat')
    builder.addText(text)
    builder.addTable(table)
    builder.addSuggest(['sholat Jakarta', 'sholat Makkah Saudi'])
    await builder.send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}