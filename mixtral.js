import { chatCompletion } from '../../src/ai/groq-client.js'
import { parseAIResponse } from '../../src/ai/ai-response-parser.js'
import { buildSystemPrompt } from '../../src/ai/ai-utils.js'
import { AIRich } from '../../src/lib/_build-m.js'
import config from '../../config.js'

const memory = new Map()

export const config_ = {
  name: 'mixtral',
  alias: ['mix', 'mx', 'mistral'],
  category: 'ai',
  description: 'AI Chat dengan Mixtral 8x7B (Groq) - kuat untuk reasoning kompleks',
  usage: '.mixtral <pertanyaan> | .mixtral clear',
  example: '.mixtral jelaskan teori relativitas',
  isOwner: false,
  cooldown: 8,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const input = m.text?.trim() || ''
  if (!input) return m.reply('❌ Masukkan pertanyaan. Contoh: *.mixtral apa itu black hole?*')

  if (input.toLowerCase() === 'clear') {
    memory.delete(m.sender)
    return m.reply('🧹 Memori percakapan dihapus.')
  }

  let userMemory = memory.get(m.sender) || []
  if (userMemory.length === 0) {
    userMemory.push({ role: 'system', content: buildSystemPrompt('chat', { botName: config.bot?.name }) })
  }
  userMemory.push({ role: 'user', content: input })

  if (userMemory.length > 21) {
    userMemory = [userMemory[0], ...userMemory.slice(-20)]
  }

  try {
    const raw = await chatCompletion(userMemory, { model: 'mixtral-8x7b-32768', temperature: 0.7, maxTokens: 1024 })
    userMemory.push({ role: 'assistant', content: raw })
    memory.set(m.sender, userMemory)

    const parsed = parseAIResponse(raw)
    const builder = new AIRich(sock).setTitle('🌀 Mixtral AI')
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