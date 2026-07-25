import { chatCompletion } from '../../src/ai/groq-client.js'
import { parseAIResponse } from '../../src/ai/ai-response-parser.js'
import { AIRich } from '../../src/lib/_build-m.js'
import config from '../../config.js'

const memory = new Map()

export const config_ = {
  name: 'gurubahasa',
  alias: ['bahasa', 'language', 'linguistik'],
  category: 'ai',
  description: 'Guru Bahasa AI - ahli bahasa Indonesia, Inggris, dan tata bahasa',
  usage: '.gurubahasa <pertanyaan> | .gurubahasa clear',
  example: '.gurubahasa jelaskan perbedaan simple past dan present perfect',
  isOwner: false,
  cooldown: 8,
  isEnabled: true,
}
export { config_ as config }

const SYSTEM_PROMPT = `Kamu adalah Guru Bahasa yang ahli dalam bahasa Indonesia, bahasa Inggris, tata bahasa (grammar), sastra, dan linguistik.

Karakteristikmu:
- Jelaskan aturan tata bahasa dengan contoh yang jelas
- Bantu koreksi kesalahan penulisan dan tata bahasa
- Jelaskan perbedaan penggunaan kata dan frasa
- Berikan tips menulis yang baik dan efektif
- Jika diminta, terjemahkan dengan akurat dan natural
- Sabar dalam menjelaskan aturan bahasa yang rumit`

export async function handler(m, { sock }) {
  const input = m.text?.trim() || ''
  if (!input) return m.reply('❌ Masukkan pertanyaan bahasa. Contoh: *.gurubahasa jelaskan perbedaan "a" dan "an"*')

  if (input.toLowerCase() === 'clear') {
    memory.delete(m.sender)
    return m.reply('🧹 Memori percakapan dihapus.')
  }

  let userMemory = memory.get(m.sender) || []
  if (userMemory.length === 0) {
    userMemory.push({ role: 'system', content: SYSTEM_PROMPT })
  }
  userMemory.push({ role: 'user', content: input })

  if (userMemory.length > 21) {
    userMemory = [userMemory[0], ...userMemory.slice(-20)]
  }

  try {
    const raw = await chatCompletion(userMemory, { temperature: 0.5, maxTokens: 2048 })
    userMemory.push({ role: 'assistant', content: raw })
    memory.set(m.sender, userMemory)

    const parsed = parseAIResponse(raw)
    const builder = new AIRich(sock).setTitle('📖 Guru Bahasa')
    if (parsed.title) builder.setTitle(parsed.title)
    for (const t of parsed.texts) builder.addText(t)
    for (const c of parsed.codes) builder.addCode(c.lang, c.code)
    for (const t of parsed.tables) builder.addTable(t)
    if (parsed.suggests.length) builder.addSuggest(parsed.suggests)
    await builder.send(m.chat, { quoted: m.raw })
    m.react('✅')
  } catch (err) {
    m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}