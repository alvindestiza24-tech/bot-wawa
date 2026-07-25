// plugins/tools/ping.js
import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'cekwebsite',
  alias: ['cekwebsite', 'websitecheck'],
  category: 'tools',
  description: 'Cek status dan respon website',
  usage: '.cekwebsite <url>',
  example: '.cekwebsite https://google.com',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  let url = m.text?.trim()
  if (!url) return m.reply('❌ Masukkan URL. Contoh: .ping https://google.com')

  // Tambahkan https jika tidak ada
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url
  }

  await m.react('⏳')
  try {
    const start = Date.now()
    const res = await axios.get(url, {
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: () => true
    })
    const latency = Date.now() - start

    const statusText = res.status >= 200 && res.status < 300 ? '✅ Online' : '⚠️ Gangguan'
    const emoji = res.status >= 200 && res.status < 300 ? '🟢' : res.status >= 400 ? '🔴' : '🟡'

    const text = `## ${emoji} Status Website\n` +
      `**URL:** ${url}\n` +
      `**Status:** ${res.status} ${res.statusText}\n` +
      `**Kondisi:** ${statusText}\n` +
      `**Response Time:** ${latency}ms\n` +
      `**Content-Type:** ${res.headers['content-type']?.split(';')[0] || 'Unknown'}\n` +
      `**Server:** ${res.headers['server'] || 'Unknown'}`

    await new AIRich(sock)
      .setTitle('📡 Ping Checker')
      .addText(text)
      .addSuggest(['ping', 'ipinfo', 'domain'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal ping: ${err.message}`)
  }
}