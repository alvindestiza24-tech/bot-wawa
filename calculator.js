import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'calculator',
  alias: ['calc', 'math', 'hitung'],
  category: 'tools',
  description: 'Kalkulator matematika sederhana',
  usage: '.calc <operasi>',
  example: '.calc 10 + 5',
  isOwner: false,
  cooldown: 3,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const input = m.text?.trim()
  if (!input) return m.reply('❌ Masukkan operasi. Contoh: .calc 10 + 5')

  try {
    const result = Function(`"use strict"; return (${input})`)()
    await new AIRich(sock)
      .setTitle('🧮 Kalkulator')
      .addText(`## ${input} = **${result}**`)
      .addSuggest(['calc', 'unit', 'timezone'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Error: ${err.message}`)
  }
}