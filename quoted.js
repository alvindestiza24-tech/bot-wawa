// plugins/random/quote.js
import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'quote',
  alias: ['kutipan', 'inspirasi'],
  category: 'random',
  description: 'Dapatkan kutipan inspiratif acak',
  usage: '.quote',
  example: '.quote',
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

const APIS = [
  async function quotable() {
    const res = await axios.get('https://api.quotable.io/random')
    return { content: res.data.content, author: res.data.author }
  },
  async function zenQuotes() {
    const res = await axios.get('https://zenquotes.io/api/random')
    const data = res.data[0]
    return { content: data.q, author: data.a }
  },
  async function typeFit() {
    const res = await axios.get('https://type.fit/api/quotes')
    const quotes = res.data
    const random = quotes[Math.floor(Math.random() * quotes.length)]
    return { content: random.text, author: random.author || 'Unknown' }
  },
  async function ninjas() {
    const res = await axios.get('https://api.api-ninjas.com/v1/quotes', {
      headers: { 'X-Api-Key': 'YOUR_API_KEY' } // ganti dengan keymu
    })
    const data = res.data[0]
    return { content: data.quote, author: data.author }
  }
]

async function fetchQuote() {
  const errors = []
  for (const fn of APIS) {
    try {
      const result = await fn()
      if (result?.content) return result
    } catch (err) {
      errors.push(err.message)
    }
  }
  throw new Error(`Semua API gagal:\n${errors.join('\n')}`)
}

export async function handler(m, { sock }) {
  await m.react('⏳')
  try {
    const quote = await fetchQuote()
    const text = `*"${quote.content}"*\n\n— ${quote.author || 'Unknown'}`

    await new AIRich(sock)
      .setTitle('📜 Inspirational Quote')
      .addText(`## ${text}`)
      .addSuggest(['quote', 'fact', 'joke'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal mengambil kutipan: ${err.message}`)
  }
}