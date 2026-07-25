import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'unitconverter',
  alias: ['unit', 'converter', 'satuan'],
  category: 'tools',
  description: 'Konversi satuan (panjang, berat, suhu)',
  usage: '.unit <nilai> <dari> <ke>',
  example: '.unit 100 cm m',
  isOwner: false,
  cooldown: 3,
  isEnabled: true,
}
export { config_ as config }

const UNITS = {
  m: 1, cm: 0.01, km: 1000, mm: 0.001,
  kg: 1, g: 0.001, mg: 0.000001,
  c: 1, f: 1.8, k: 1
}

export async function handler(m, { sock }) {
  const args = m.args
  if (args.length < 3) return m.reply('❌ Format: .unit <nilai> <dari> <ke>\nContoh: .unit 100 cm m')

  const value = parseFloat(args[0])
  const from = args[1].toLowerCase()
  const to = args[2].toLowerCase()

  if (isNaN(value)) return m.reply('❌ Nilai harus angka')
  if (!UNITS[from] || !UNITS[to]) return m.reply('❌ Satuan tidak didukung.')

  let result
  if (from === 'c' && to === 'f') result = value * 1.8 + 32
  else if (from === 'c' && to === 'k') result = value + 273.15
  else if (from === 'f' && to === 'c') result = (value - 32) / 1.8
  else if (from === 'f' && to === 'k') result = (value + 459.67) * 5 / 9
  else if (from === 'k' && to === 'c') result = value - 273.15
  else if (from === 'k' && to === 'f') result = value * 9 / 5 - 459.67
  else result = value * UNITS[from] / UNITS[to]

  await new AIRich(sock)
    .setTitle('📐 Konverter Satuan')
    .addText(`## ${value} ${from} = ${result.toFixed(4)} ${to}`)
    .addSuggest(['unit', 'calc', 'timezone'])
    .send(m.chat, { quoted: m.raw })
  await m.react('✅')
}