// plugins/ai/claude.js
import { overchatCompletion } from '../../src/ai/overchat-client.js'
import { parseAIResponse } from '../../src/ai/ai-response-parser.js'
import { AIRich } from '../../src/lib/_build-m.js'
import config from '../../config.js'

const memory = new Map()

export const config_ = {
  name: 'claude',
  alias: ['claudeai', 'haiku'],
  category: 'ai',
  description: 'AI Chat dengan Claude (Overchat)',
  usage: '.claude <pertanyaan> | .claude clear',
  example: '.claude apa itu fotosintesis?',
  isOwner: false,
  isPremium: true,  
  cooldown: 8,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const input = m.text?.trim() || ''

  if (input.toLowerCase() === 'clear') {
    memory.delete(m.sender)
    return m.reply('🧹 Memori percakapan dihapus.')
  }

  if (!input) {
    return m.reply('❌ Masukkan pertanyaan. Contoh: *.claude apa itu AI?*')
  }

  let userMemory = memory.get(m.sender) || []
  if (userMemory.length === 0) {
    userMemory.push({
      role: 'system',
      content: `Kamu adalah ${config.bot?.name || 'Bot'} asisten AI berbasis Claude, ramah, informatif, dan kreatif. Jawab dalam Bahasa Indonesia.`,
    })
  }
  userMemory.push({ role: 'user', content: input })

  try {
    const history = userMemory.slice(0, -1) // semua kecuali pesan terakhir (yang baru ditambahkan)
    const answer = await overchatCompletion(input, {
      history: history.filter(m => m.role !== 'system'), // system prompt tidak termasuk history
      temperature: 0.7,
    })

    userMemory.push({ role: 'assistant', content: answer })

    // Batasi memori: simpan 10 pasang percakapan terakhir + system prompt
    if (userMemory.length > 21) {
      userMemory = [userMemory[0], ...userMemory.slice(-20)]
    }
    memory.set(m.sender, userMemory)

    const parsed = parseAIResponse(answer)
    const builder = new AIRich(sock).setTitle('🤖 Claude AI')

    for (const t of parsed.texts) builder.addText(t)
    for (const c of parsed.codes) builder.addCode(c.lang, c.code)
    for (const t of parsed.tables) builder.addTable(t)
    if (parsed.suggests.length) builder.addSuggest(parsed.suggests)

    await builder.send(m.chat, { quoted: m.raw })
    m.react('✅')
  } catch (err) {
    m.react('❌')
    // Hapus pesan user yang gagal agar tidak mengotori memori
    userMemory.pop()
    memory.set(m.sender, userMemory)
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}