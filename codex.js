import { chatCompletion } from '../../src/ai/groq-client.js'
import { parseAIResponse } from '../../src/ai/ai-response-parser.js'
import { buildSystemPrompt } from '../../src/ai/ai-utils.js'
import { AIRich } from '../../src/lib/_build-m.js'
import config from '../../config.js'

export const config_ = {
  name: 'codex',
  alias: ['cx', 'code'],
  category: 'ai',
  description: 'Coding assistant dengan Groq',
  usage: '.codex <pertanyaan/kode>',
  example: '.codex buatkan fungsi fibonacci di JavaScript',
  isOwner: false,
  isPremium: true,  
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  let input = m.text?.trim() || ''
  // Jika ada dokumen yang direply, ambil teksnya
  if (m.quoted && m.quoted.isDocument) {
    try {
      const buffer = await m.quoted.download()
      input = buffer.toString('utf-8')
    } catch {
      return m.reply('❌ Gagal membaca file.')
    }
  }
  if (!input) return m.reply('❌ Masukkan pertanyaan atau kode. Contoh: *.codex perbaiki kode ini...*')

  const messages = [
    { role: 'system', content: buildSystemPrompt('codex', { botName: config.bot?.name }) },
    { role: 'user', content: input }
  ]

  try {
    const raw = await chatCompletion(messages, { temperature: 0.2, maxTokens: 2048 })
    const parsed = parseAIResponse(raw)
    const builder = new AIRich(sock).setTitle('💻 Codex')
    for (const t of parsed.texts) builder.addText(t)
    for (const c of parsed.codes) builder.addCode(c.lang, c.code)
    if (parsed.suggests.length) builder.addSuggest(parsed.suggests)
    await builder.send(m.chat, { quoted: m.raw })
    m.react('✅')
  } catch (err) {
    m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}