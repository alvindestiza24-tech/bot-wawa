import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'tebaklagu',
  alias: ['tebaklagu', 'guesssong'],
  category: 'game',
  description: 'Tebak judul lagu dari lirik (AI)',
  usage: '.tebaklagu',
  example: '.tebaklagu',
  isOwner: false,
  cooldown: 15,
  isEnabled: true,
}
export { config_ as config }

const sessions = new Map()

async function getRandomLyric() {
  try {
    const res = await axios.get('https://api.lyrics.ovh/suggest/random', { timeout: 8000 })
    return res.data.data?.[0] || null
  } catch {
    const fallback = [
      { title: 'Bohemian Rhapsody', artist: 'Queen', lyrics: 'Is this the real life? Is this just fantasy?' },
      { title: 'Shape of You', artist: 'Ed Sheeran', lyrics: "I'm in love with the shape of you" },
      { title: 'Someone Like You', artist: 'Adele', lyrics: 'Never mind, I\'ll find someone like you' }
    ]
    return fallback[Math.floor(Math.random() * fallback.length)]
  }
}

export async function handler(m, { sock }) {
  if (sessions.has(m.chat)) {
    return m.reply('⏳ Masih ada game berjalan di grup ini. Selesaikan dulu!')
  }

  const song = await getRandomLyric()
  if (!song) return m.reply('❌ Gagal mengambil lagu.')

  const clue = song.lyrics.split(' ').slice(0, 10).join(' ') + '...'
  sessions.set(m.chat, { song, start: Date.now(), attempts: 0 })

  await new AIRich(sock)
    .setTitle('🎵 Tebak Lagu')
    .addText(`## Tebak judul lagu dari lirik ini:\n${clue}\n\nTulis jawaban kamu.\n⏳ Waktu: 30 detik`)
    .addSuggest(['...'])
    .send(m.chat, { quoted: m.raw })

  setTimeout(() => {
    if (sessions.has(m.chat)) {
      const data = sessions.get(m.chat)
      if (data.attempts < 1) {
        m.reply(`⏰ Waktu habis! Jawabannya: *${data.song.title} - ${data.song.artist}*`)
      }
      sessions.delete(m.chat)
    }
  }, 30000)

  // Handler untuk jawaban (akan diproses di messageHandler)
  // Karena kita tidak bisa pasang handler dinamis, kita gunakan global
  global._gameSessions = global._gameSessions || new Map()
  global._gameSessions.set(m.chat, {
    type: 'tebaklagu',
    song,
    callback: (answer) => {
      if (answer.toLowerCase().includes(song.title.toLowerCase())) {
        sessions.delete(m.chat)
        return '🎉 Benar!'
      } else {
        return '❌ Salah, coba lagi!'
      }
    }
  })

  await m.react('✅')
}