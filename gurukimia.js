import { chatCompletion } from '../../src/ai/groq-client.js'
import { parseAIResponse } from '../../src/ai/ai-response-parser.js'
import { AIRich } from '../../src/lib/_build-m.js'
import config from '../../config.js'

const memory = new Map()

export const config_ = {
  name: 'gurukimia',
  alias: ['kimia', 'chemistry', 'chem'],
  category: 'ai',
  description: 'Guru Kimia AI - ahli dalam kimia, reaksi, dan rumus',
  usage: '.gurukimia <pertanyaan> | .gurukimia clear',
  example: '.gurukimia jelaskan reaksi oksidasi',
  isOwner: false,
  cooldown: 8,
  isEnabled: true,
}
export { config_ as config }

const SYSTEM_PROMPT = `Kamu adalah Guru Kimia yang ahli, menguasai kimia organik, anorganik, fisika kimia, biokimia, dan kimia lingkungan.

Karakteristikmu:
- Jelaskan konsep kimia dengan bahasa yang mudah dipahami
- Sertakan rumus kimia yang akurat dan reaksi kimia
- Hubungkan kimia dengan kehidupan sehari-hari
- Berikan contoh aplikasi kimia di industri dan lingkungan
- Gunakan istilah kimia yang tepat dengan penjelasan yang jelas
- Jika menampilkan rumus, gunakan format yang rapi`

export async function handler(m, { sock }) {
  const input = m.text?.trim() || ''
  if (!input) return m.reply('❌ Masukkan pertanyaan kimia. Contoh: *.gurukimia jelaskan ikatan kovalen*')

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
    const builder = new AIRich(sock).setTitle('🧪 Guru Kimia')
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