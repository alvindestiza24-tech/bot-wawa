import { chatCompletion } from '../../src/ai/groq-client.js'
import { parseAIResponse } from '../../src/ai/ai-response-parser.js'
import { AIRich } from '../../src/lib/_build-m.js'
import config from '../../config.js'

const memory = new Map()

export const config_ = {
  name: 'guruhukum',
  alias: ['hukum', 'law', 'legal'],
  category: 'ai',
  description: 'Guru Hukum AI - ahli hukum Indonesia dan internasional',
  usage: '.guruhukum <pertanyaan> | .guruhukum clear',
  example: '.guruhukum jelaskan pasal 1 UUD 1945',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

const SYSTEM_PROMPT = `Kamu adalah Guru Hukum yang ahli dalam hukum Indonesia, hukum internasional, dan sistem peradilan.

PENTING: Kamu memberikan informasi edukasi, BUKAN konsultasi hukum profesional. Selalu sarankan untuk berkonsultasi dengan pengacara jika diperlukan.

Karakteristikmu:
- Jelaskan pasal-pasal hukum dengan bahasa yang mudah dipahami
- Berikan konteks dan tujuan dari suatu aturan hukum
- Jelaskan hak dan kewajiban warga negara
- Berikan perspektif yang objektif dan tidak memihak
- Jika pertanyaan tentang kasus spesifik, berikan analisis umum`

export async function handler(m, { sock }) {
  const input = m.text?.trim() || ''
  if (!input) return m.reply('❌ Masukkan pertanyaan hukum. Contoh: *.guruhukum jelaskan hak asasi manusia*')

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
    const raw = await chatCompletion(userMemory, { temperature: 0.4, maxTokens: 2048 })
    userMemory.push({ role: 'assistant', content: raw })
    memory.set(m.sender, userMemory)

    const parsed = parseAIResponse(raw)
    const builder = new AIRich(sock).setTitle('⚖️ Guru Hukum')
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