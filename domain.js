// plugins/tools/domain.js
import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'domain',
  alias: ['domaininfo', 'whois'],
  category: 'tools',
  description: 'Cek informasi domain (whois)',
  usage: '.domain <domain>',
  example: '.domain google.com',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

const APIS = [
  async function whoisApi(domain) {
    const res = await axios.get(`https://api.whois.vu/?q=${encodeURIComponent(domain)}&lang=en&format=json`, { timeout: 10000 })
    if (!res.data || res.data.error) throw new Error(res.data?.error || 'Domain tidak ditemukan')
    const data = res.data
    return {
      domain: data.domain || domain,
      registrar: data.registrar || 'Unknown',
      created: data.created || 'Unknown',
      expires: data.expires || 'Unknown',
      updated: data.updated || 'Unknown',
      nameServers: data.nameServers?.join(', ') || '-',
      status: data.status || 'Unknown'
    }
  },
  async function domainApi(domain) {
    const res = await axios.get(`https://domain-api.com/api/whois?domain=${encodeURIComponent(domain)}`, { timeout: 10000 })
    const data = res.data
    if (!data || !data.domain) throw new Error('Domain tidak ditemukan')
    return {
      domain: data.domain || domain,
      registrar: data.registrar || 'Unknown',
      created: data.created_date || 'Unknown',
      expires: data.expiration_date || 'Unknown',
      updated: data.updated_date || 'Unknown',
      nameServers: data.name_servers?.join(', ') || '-',
      status: data.status || 'Unknown'
    }
  }
]

async function fetchDomain(domain) {
  const errors = []
  for (const fn of APIS) {
    try {
      const result = await fn(domain)
      if (result?.domain) return result
    } catch (err) {
      errors.push(err.message)
    }
  }
  throw new Error(`Gagal mengambil info domain:\n${errors.join('\n')}`)
}

export async function handler(m, { sock }) {
  const domain = m.text?.trim()
  if (!domain) return m.reply('❌ Masukkan domain. Contoh: .domain google.com')

  await m.react('⏳')
  try {
    const data = await fetchDomain(domain)

    const text = `## 🌐 Info Domain\n` +
      `**Domain:** ${data.domain}\n` +
      `**Registrar:** ${data.registrar}\n` +
      `**Dibuat:** ${data.created}\n` +
      `**Kadaluarsa:** ${data.expires}\n` +
      `**Diupdate:** ${data.updated}\n` +
      `**Name Servers:** ${data.nameServers}\n` +
      `**Status:** ${data.status}`

    await new AIRich(sock)
      .setTitle('📋 Domain Info')
      .addText(text)
      .addSuggest(['domain', 'ping', 'ipinfo'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}