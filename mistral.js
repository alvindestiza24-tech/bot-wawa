// plugins/ai/mistral.js
import { mistral } from '../../src/scrape/mistral.js'
import { parseAIResponse } from '../../src/ai/ai-response-parser.js'
import { AIRich } from '../../src/lib/_build-m.js'
import config from '../../config.js'

const memory = new Map()

export const config_ = {
  name: 'mistral',
  alias: ['mistralai', 'mistralchat'],
  category: 'ai',
  description: 'AI Chat dengan Mistral AI (scraper)',
  usage: '.mistral <pertanyaan> | .mistral clear',
  example: '.mistral apa itu black hole?',
  isOwner: false,
  cooldown: 8,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const input = m.text?.trim() || ''
  if (!input) return m.reply('❌ Masukkan pertanyaan. Contoh: *.mistral apa itu AI?*')

  if (input.toLowerCase() === 'clear') {
    memory.delete(m.sender)
    return m.reply('🧹 Memori percakapan dihapus.')
  }

  let userData = memory.get(m.sender) || {}
  let session = userData.session || null
  let room = userData.room || null

  try {
    const result = await mistral.send(input, session, room)
    memory.set(m.sender, { session: result.session, room: result.room })

    const raw = result.response
    const parsed = parseAIResponse(raw)
    const builder = new AIRich(sock).setTitle('🧠 Mistral AI')
    if (parsed.title) builder.setTitle(parsed.title)
    for (const t of parsed.texts) builder.addText(t)
    for (const c of parsed.codes) builder.addCode(c.lang, c.code)
    for (const t of parsed.tables) builder.addTable(t)
    if (parsed.suggests.length) builder.addSuggest(parsed.suggests)
    await builder.send(m.chat, { quoted: m.raw })
    m.react('✅')
  } catch (err) {
    console.error('[MISTRAL]', err)
    m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}