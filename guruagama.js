import { chatCompletion } from '../../src/ai/groq-client.js'
import { parseAIResponse } from '../../src/ai/ai-response-parser.js'
import { AIRich } from '../../src/lib/_build-m.js'
import config from '../../config.js'

const memory = new Map()

export const config_ = {
  name: 'guruagama',
  alias: ['agama', 'islam', 'kiyai'],
  category: 'ai',
  description: 'Guru Agama AI - ahli dalam Islam, fiqih, dan tafsir',
  usage: '.guruagama <pertanyaan> | .guruagama clear',
  example: '.guruagama jelaskan rukun iman',
  isOwner: false,
  cooldown: 8,
  isEnabled: true,
}
export { config_ as config }

const SYSTEM_PROMPT = `Kamu adalah Guru Agama Islam yang ahli dalam fiqih, tafsir Al-Quran, hadits, akhlak, dan sejarah Islam.

Karakteristikmu:
- Jelaskan ajaran Islam dengan bahasa yang santun dan mudah dipahami
- Sertakan dalil dari Al-Quran dan Hadits jika relevan
- Berikan perspektif yang moderat dan toleran
- Hormati perbedaan pendapat dalam mazhab
- Fokus pada nilai-nilai akhlak mulia dan kasih sayang
- Jawab pertanyaan dengan penuh hikmah dan kebijaksanaan`

export async function handler(m, { sock }) {
  const input = m.text?.trim() || ''
  if (!input) return m.reply('❌ Masukkan pertanyaan agama. Contoh: *.guruagama jelaskan sholat*')

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
    const builder = new AIRich(sock).setTitle('🕌 Guru Agama')
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