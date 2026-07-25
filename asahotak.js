import { startSession, nextSoal, checkAnswer, endSession, getHint, getSession, processGameMessage } from '../../src/lib/game/asahotak.js'
import { getDatabase } from '../../src/database.js'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'asahotak',
  alias: ['asah', 'kuis'],
  category: 'game',
  description: 'Game asah otak - tebak kata',
  usage: '.asahotak | langsung jawab soal',
  example: '.asahotak',
  isOwner: false,
  isPremium: false,
  isGroup: true,
  prefix: false,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const chatId = m.chat
  const text = m.text?.trim() || ''
  const command = m.command?.toLowerCase()
  const db = getDatabase()

  // --- Mulai game ---
  if (command === 'asahotak' || command === 'asah' || command === 'kuis') {
    if (getSession(chatId)) {
      return sendInteractive(m, sock, '🎮 Game sedang berlangsung! Jawab langsung atau .skip .hint')
    }

    const result = startSession(chatId, 5)
    if (result?.finished || !result) {
      return sendInteractive(m, sock, '❌ Tidak ada soal tersedia.')
    }
    const { soal, round, total } = result
    const body = `🧠 *ASAH OTAK*\n\nSoal ke-${round} dari ${total}\n\n📝 *${soal}*\n\nKetik jawabannya langsung!`
    await sendInteractive(m, sock, body, ['hint', 'skip'])
  }

  // --- Skip ---
  else if (command === 'skip' || command === 'lewati') {
    if (!getSession(chatId)) return sendInteractive(m, sock, '❌ Tidak ada game.')
    const next = nextSoal(chatId)
    if (!next) return sendInteractive(m, sock, '❌ Gagal melanjutkan.')
    if (next.finished) {
      const msg = `🏁 *GAME SELESAI*\n\nSkor: ${next.score}/${next.total}`
      return sendInteractive(m, sock, msg)
    }
    const { soal, round, total } = next
    const body = `⏭️ Soal dilewati.\n\nSoal ke-${round} dari ${total}\n\n📝 *${soal}*`
    await sendInteractive(m, sock, body, ['hint', 'skip'])
  }

  // --- Hint ---
  else if (command === 'hint' || command === 'petunjuk') {
    if (!getSession(chatId)) return sendInteractive(m, sock, '❌ Tidak ada game.')
    const hint = getHint(chatId)
    if (!hint) return sendInteractive(m, sock, '❌ Tidak ada soal.')
    await sendInteractive(m, sock, `💡 Petunjuk: *${hint}*`)
  }

  // --- Stop ---
  else if (command === 'berhenti' || command === 'stop') {
    const result = endSession(chatId)
    if (!result) return sendInteractive(m, sock, '❌ Tidak ada game.')
    await sendInteractive(m, sock, `🏁 *GAME DIHENTIKAN*\nSkor: ${result.score}/${result.total}`)
  }
}

// Fungsi bantu kirim AIRich
async function sendInteractive(m, sock, text, suggests = []) {
  try {
    const builder = new AIRich(sock)
      .setTitle('🧠 Asah Otak')
      .addText(text)
    if (suggests.length) builder.addSuggest(suggests)
    await builder.send(m.chat, { quoted: m.raw })
  } catch {
    await m.reply(text)
  }
}
