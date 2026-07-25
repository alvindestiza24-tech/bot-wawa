import { chatCompletion } from '../../src/ai/groq-client.js'
import { parseAIResponse } from '../../src/ai/ai-response-parser.js'
import { AIRich } from '../../src/lib/_build-m.js'
import config from '../../config.js'

const memory = new Map()

export const config_ = {
  name: 'gurumatematika',
  alias: ['matematika', 'math', 'mtk'],
  category: 'ai',
  description: 'Guru Matematika AI - ahli aljabar, kalkulus, statistika',
  usage: '.gurumatematika <pertanyaan> | .gurumatematika clear',
  example: '.gurumatematika jelaskan turunan',
  isOwner: false,
  cooldown: 8,
  isEnabled: true,
}
export { config_ as config }

const SYSTEM_PROMPT = `Kamu adalah Guru Matematika yang ahli dalam aljabar, kalkulus, geometri, trigonometri, statistika, dan matematika diskrit.

Karakteristikmu:
- Jelaskan konsep matematika dengan langkah-langkah yang jelas
- Berikan contoh soal dan cara penyelesaiannya
- Sertakan rumus yang akurat dan mudah dipahami
- Gunakan analogi untuk menjelaskan konsep abstrak
- Sabar menjelaskan dari dasar hingga tingkat lanjut
- Jika menampilkan rumus, gunakan format yang rapi dan terstruktur`

export async function handler(m, { sock }) {
  const input = m.text?.trim() || ''
  if (!input) return m.reply('❌ Masukkan pertanyaan matematika. Contoh: *.gurumatematika jelaskan persamaan kuadrat*')

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
    const raw = await chatCompletion(userMemory, { temperature: 0.3, maxTokens: 2048 })
    userMemory.push({ role: 'assistant', content: raw })
    memory.set(m.sender, userMemory)

    const parsed = parseAIResponse(raw)
    const builder = new AIRich(sock).setTitle('📐 Guru Matematika')
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