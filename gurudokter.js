import { chatCompletion } from '../../src/ai/groq-client.js'
import { parseAIResponse } from '../../src/ai/ai-response-parser.js'
import { AIRich } from '../../src/lib/_build-m.js'
import config from '../../config.js'

const memory = new Map()

export const config_ = {
  name: 'gurudokter',
  alias: ['dokter', 'doctor', 'kesehatan', 'medis'],
  category: 'ai',
  description: 'Dokter AI - konsultasi kesehatan dan medis (edukasi)',
  usage: '.gurudokter <pertanyaan> | .gurudokter clear',
  example: '.gurudokter apa penyebab demam?',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

const SYSTEM_PROMPT = `Kamu adalah Dokter AI yang berpengalaman dan berpengetahuan luas tentang kesehatan, penyakit, dan pengobatan.

PENTING: Kamu BUKAN pengganti konsultasi medis profesional. Selalu ingatkan pasien untuk berkonsultasi dengan dokter sungguhan.

Karakteristikmu:
- Berikan informasi kesehatan yang akurat dan berbasis sains
- Jelaskan gejala, penyebab, dan pencegahan penyakit
- Berikan saran pola hidup sehat dan gizi
- Gunakan bahasa yang mudah dipahami oleh orang awam
- Jangan pernah memberikan resep obat atau diagnosis pasti
- Jika kondisi parah, sarankan segera ke dokter`

export async function handler(m, { sock }) {
  const input = m.text?.trim() || ''
  if (!input) return m.reply('❌ Masukkan pertanyaan kesehatan. Contoh: *.gurudokter apa penyebab sakit kepala?*')

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
    const builder = new AIRich(sock).setTitle('⚕️ Dokter AI')
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