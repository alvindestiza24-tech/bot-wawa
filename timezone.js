import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'timezone',
  alias: ['tz', 'waktu', 'worldclock'],
  category: 'tools',
  description: 'Cek waktu di zona waktu tertentu',
  usage: '.tz <zone>',
  example: '.tz Asia/Jakarta',
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const zone = m.text?.trim()
  if (!zone) return m.reply('❌ Masukkan zona waktu. Contoh: .tz Asia/Jakarta')

  try {
    const res = await axios.get(`https://worldtimeapi.org/api/timezone/${encodeURIComponent(zone)}`, { timeout: 8000 })
    const data = res.data
    const time = new Date(data.utc_datetime)
    const options = { timeZone: zone, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }
    const formatted = time.toLocaleString('id-ID', options)

    await new AIRich(sock)
      .setTitle('🕐 Timezone')
      .addText(`## ${zone}\n**Waktu:** ${formatted}\n**UTC Offset:** ${data.utc_offset}`)
      .addSuggest(['tz Asia/Jakarta', 'tz America/New_York'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Zona tidak ditemukan. Contoh: Asia/Jakarta`)
  }
}