import { getStatus } from '../../src/ai/groq-client.js'
import { AIRich } from '../../src/lib/_build-m.js'
import config from '../../config.js'
import { getDatabase } from '../../src/database.js'

export const config_ = {
  name: 'aimodel',
  alias: ['aimodels', 'aikey'],
  category: 'ai',
  description: 'Lihat/ganti model AI & status key (owner)',
  usage: '.aimodel [nama model]',
  example: '.aimodel llama-3.1-8b-instant',
  isOwner: true,
  cooldown: 3,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const db = getDatabase()
  const input = m.text?.trim() || ''

  if (!input || input === 'status') {
    const status = getStatus()
    const models = config.groq.fallbackModels || []
    const currentModel = db.setting('aiModel') || models[0]

    const text = [
      `🔧 *Status AI*`,
      `Model aktif: *${currentModel}*`,
      `Daftar model: ${models.join(', ')}`,
      ``,
      `🔑 *Key Status*:`,
      ...status.keys.map(k => `Key ${k.index}: ${k.cooldown}`)
    ].join('\n')

    await new AIRich(sock)
      .setTitle('🧠 AI Configuration')
      .addText(text)
      .addSuggest(models.slice(0, 4).map(m => `aimodel ${m}`))
      .send(m.chat, { quoted: m.raw })
  } else {
    // Ganti model
    const models = config.groq.fallbackModels || []
    if (!models.includes(input)) {
      return m.reply(`❌ Model tidak tersedia. Pilih: ${models.join(', ')}`)
    }
    db.setting('aiModel', input)
    await m.reply(`✅ Model diubah ke *${input}*`)
  }
}