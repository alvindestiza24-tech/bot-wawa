// plugins/tools/bitly.js
import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'bitly',
  alias: ['shortbitly', 'bitlyshort'],
  category: 'tools',
  description: 'Pendekkan URL menggunakan Bitly',
  usage: '.bitly <url>',
  example: '.bitly https://example.com/very/long/url',
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }


const APIS = [
  async function bitly(url) {
    const token = 'b98ffe4c40a767ca5c56e88b0f3a23d42d86207c' 
    const res = await axios.post('https://api-ssl.bitly.com/v4/shorten',
      { long_url: url },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )
    if (!res.data?.link) throw new Error('Gagal shorten')
    return res.data.link
  },
  async function tinyUrl(url) {
    const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, { timeout: 8000 })
    const short = res.data.trim()
    if (!short || !short.startsWith('http')) throw new Error('Gagal shorten')
    return short
  },
  async function isgd(url) {
    const res = await axios.get(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`, { timeout: 8000 })
    const short = res.data.trim()
    if (!short || !short.startsWith('http')) throw new Error('Gagal shorten')
    return short
  }
]

async function shortenUrl(url) {
  const errors = []
  for (const fn of APIS) {
    try {
      const result = await fn(url)
      if (result) return result
    } catch (err) {
      errors.push(err.message)
    }
  }
  throw new Error(`Gagal memendekkan URL:\n${errors.join('\n')}`)
}

export async function handler(m, { sock }) {
  const url = m.text?.trim()
  if (!url) return m.reply('❌ Masukkan URL. Contoh: .bitly https://example.com')

  await m.react('⏳')
  try {
    const shortUrl = await shortenUrl(url)

    await new AIRich(sock)
      .setTitle('🔗 Bitly Shortener')
      .addText(`## URL Pendek\n${shortUrl}`)
      .addText(`**Original:** ${url}`)
      .addSuggest(['bitly', 'shortlink', 'tinyurl'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}