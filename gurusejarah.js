import { chatCompletion } from '../../src/ai/groq-client.js'
import { parseAIResponse } from '../../src/ai/ai-response-parser.js'
import { AIRich } from '../../src/lib/_build-m.js'
import config from '../../config.js'

const memory = new Map()

export const config_ = {
  name: 'gurusejarah',
  alias: ['sejarah', 'history', 'historiku'],
  category: 'ai',
  description: 'Guru Sejarah AI - ahli sejarah dunia dan Indonesia',
  usage: '.gurusejarah <pertanyaan> | .gurusejarah clear',
  example: '.gurusejarah jelaskan perang Diponegoro',
  isOwner: false,
  cooldown: 8,
  isEnabled: true,
}
export { config_ as config }

const SYSTEM_PROMPT = `Kamu adalah Guru Sejarah yang ahli, berpengetahuan luas tentang sejarah dunia, sejarah Indonesia, peradaban kuno, tokoh-tokoh sejarah, dan peristiwa penting. 
Karakteristikmu:
- Jelaskan dengan narasi yang menarik dan mudah dipahami
- Sertakan tanggal, nama tokoh, dan konteks yang akurat
- Hubungkan peristiwa sejarah dengan dampaknya masa kini
- Jawab dengan bahasa Indonesia yang sopan dan terstruktur
- Jika ditanya tentang sejarah lokal, berikan perspektif yang objektif`

export async function handler(m, { sock }) {
  const input = m.text?.trim() || ''
  if (!input) return m.reply('❌ Masukkan pertanyaan sejarah. Contoh: *.gurusejarah jelaskan kerajaan Majapahit*')

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
    const builder = new AIRich(sock).setTitle('📜 Guru Sejarah')
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