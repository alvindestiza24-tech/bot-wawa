// plugins/tools/currency.js
import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'currency',
  alias: ['kurs', 'converter', 'uang'],
  category: 'tools',
  description: 'Konversi mata uang dengan kurs terkini',
  usage: '.currency <jumlah> <dari> <ke>',
  example: '.currency 100 USD IDR',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

// ─── Multiple API dengan fallback ──────────────────────────────
const APIS = [
  // 1. Exchange Rate API (utama)
  async function exchangeRate(amount, from, to) {
    const res = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from.toUpperCase()}`, { timeout: 8000 })
    const rate = res.data.rates[to.toUpperCase()]
    if (!rate) throw new Error(`Mata uang ${to} tidak ditemukan`)
    return {
      rate,
      converted: amount * rate,
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      amount,
      base: res.data.base
    }
  },
  // 2. Frankfurter API (fallback)
  async function frankfurter(amount, from, to) {
    const res = await axios.get(`https://api.frankfurter.app/latest?from=${from.toUpperCase()}&to=${to.toUpperCase()}`, { timeout: 8000 })
    const rate = res.data.rates[to.toUpperCase()]
    if (!rate) throw new Error(`Mata uang ${to} tidak ditemukan`)
    return {
      rate,
      converted: amount * rate,
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      amount,
      base: res.data.base
    }
  },
  // 3. Currency API (fallback)
  async function currencyApi(amount, from, to) {
    const res = await axios.get(`https://api.currencyapi.com/v3/latest?apikey=YOUR_KEY&base_currency=${from.toUpperCase()}&currencies=${to.toUpperCase()}`, { timeout: 8000 })
    const data = res.data.data[to.toUpperCase()]
    if (!data) throw new Error(`Mata uang ${to} tidak ditemukan`)
    return {
      rate: data.value,
      converted: amount * data.value,
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      amount,
      base: from.toUpperCase()
    }
  }
]

async function convertCurrency(amount, from, to) {
  const errors = []
  for (const fn of APIS) {
    try {
      const result = await fn(amount, from, to)
      if (result?.rate) return result
    } catch (err) {
      errors.push(err.message)
    }
  }
  throw new Error(`Gagal konversi mata uang:\n${errors.join('\n')}`)
}

export async function handler(m, { sock }) {
  const args = m.args
  if (args.length < 3) {
    return m.reply('❌ Format: .currency <jumlah> <dari> <ke>\nContoh: .currency 100 USD IDR')
  }

  const amount = parseFloat(args[0])
  const from = args[1].toUpperCase()
  const to = args[2].toUpperCase()

  if (isNaN(amount) || amount <= 0) {
    return m.reply('❌ Masukkan jumlah yang valid!')
  }

  if (from.length !== 3 || to.length !== 3) {
    return m.reply('❌ Kode mata uang harus 3 huruf (USD, IDR, EUR, dll)')
  }

  await m.react('⏳')
  try {
    const result = await convertCurrency(amount, from, to)

    const text = `## 💱 Konversi Mata Uang\n` +
      `**${amount.toLocaleString()} ${result.from}** =\n` +
      `**${result.converted.toLocaleString()} ${result.to}**\n\n` +
      `📊 **Kurs:** 1 ${result.from} = ${result.rate.toFixed(4)} ${result.to}`

    await new AIRich(sock)
      .setTitle('💵 Currency Converter')
      .addText(text)
      .addSuggest(['currency 100 USD IDR', 'currency 50 EUR JPY'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}