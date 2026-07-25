// plugins/tools/ipinfo.js
import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'ipinfo',
  alias: ['ip', 'myip', 'ipcheck'],
  category: 'tools',
  description: 'Cek informasi IP (milik sendiri atau IP tertentu)',
  usage: '.ipinfo [IP]',
  example: '.ipinfo 8.8.8.8',
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }


const APIS = [
  async function ipApi(ip) {
    const url = ip ? `http://ip-api.com/json/${ip}` : 'http://ip-api.com/json'
    const res = await axios.get(url, { timeout: 8000 })
    if (res.data.status === 'fail') throw new Error(res.data.message || 'IP tidak ditemukan')
    return {
      ip: res.data.query || ip,
      country: res.data.country || 'Unknown',
      region: res.data.regionName || res.data.region || '-',
      city: res.data.city || '-',
      isp: res.data.isp || res.data.org || 'Unknown',
      lat: res.data.lat || 0,
      lon: res.data.lon || 0,
      timezone: res.data.timezone || 'Unknown',
      zip: res.data.zip || '-'
    }
  },
  async function ipInfo(ip) {
    const token = 'YOUR_TOKEN' // bisa diisi, atau kosong (limit 50k/hari)
    const url = ip ? `https://ipinfo.io/${ip}/json` : 'https://ipinfo.io/json'
    const res = await axios.get(url, {
      timeout: 8000,
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
    if (res.data.error) throw new Error(res.data.error.message || 'IP tidak ditemukan')
    return {
      ip: res.data.ip || ip,
      country: res.data.country || 'Unknown',
      region: res.data.region || '-',
      city: res.data.city || '-',
      isp: res.data.org || 'Unknown',
      lat: res.data.loc?.split(',')[0] || 0,
      lon: res.data.loc?.split(',')[1] || 0,
      timezone: res.data.timezone || 'Unknown',
      zip: res.data.postal || '-'
    }
  }
]

async function fetchIP(ip = null) {
  const errors = []
  for (const fn of APIS) {
    try {
      const result = await fn(ip)
      if (result?.ip) return result
    } catch (err) {
      errors.push(err.message)
    }
  }
  throw new Error(`Gagal mengambil info IP:\n${errors.join('\n')}`)
}

export async function handler(m, { sock }) {
  const input = m.text?.trim() || null

  await m.react('⏳')
  try {
    const data = await fetchIP(input)

    const text = `## 🌐 Info IP\n` +
      `**IP Address:** ${data.ip}\n` +
      `**Negara:** ${data.country}\n` +
      `**Region:** ${data.region}\n` +
      `**Kota:** ${data.city}\n` +
      `**Provider:** ${data.isp}\n` +
      `**Timezone:** ${data.timezone}\n` +
      `**Kode Pos:** ${data.zip || '-'}\n` +
      `**Koordinat:** ${data.lat}, ${data.lon}`

    await new AIRich(sock)
      .setTitle('📍 IP Checker')
      .addText(text)
      .addSuggest(['ipinfo', 'ping', 'domain'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}