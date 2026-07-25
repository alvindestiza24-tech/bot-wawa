// plugins/search/spotify.js
import { getSpotifyClient } from '../../src/scrape/spotify.js'
import { spotifyDl } from '../../src/scrape/spotify-dl.js'
import { AIRich } from '../../src/lib/_build-m.js'

const sessions = new Map()
const SESSION_TTL = 5 * 60 * 1000

export const config_ = {
  name: 'spotify',
  alias: ['spt', 'spot'],
  category: 'search',
  description: 'Cari lagu di Spotify dan putar',
  usage: '.spotify <query> / .spotify <nomor>',
  example: '.spotify Blinding Lights\n.spotify 1',
  isOwner: false, isPremium: false, isGroup: false, prefix: false,
  isPrivate: false, cooldown: 8, isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const text = m.text?.trim() || ''
  if (!text) {
    return m.reply('❌ Masukkan query pencarian.\nContoh: .spotify Blinding Lights')
  }

  // Jika input adalah angka (1-10), coba putar dari sesi sebelumnya
  if (/^\d+$/.test(text)) {
    const index = parseInt(text) - 1
    const session = sessions.get(m.senderNumber)
    if (!session || Date.now() > session.expires) {
      sessions.delete(m.senderNumber)
      return m.reply('⌛ Sesi pencarian sudah habis. Silakan cari lagi dengan .spotify <judul>')
    }
    if (index < 0 || index >= session.tracks.length) {
      return m.reply('❌ Nomor tidak valid.')
    }

    const track = session.tracks[index]
    await m.react('⏳')

    try {
      const res = await spotifyDl(track.url)
      if (!res.status || !res.dl) throw new Error(res.error || 'Gagal download')
      await sock.sendMessage(m.chat, {
        audio: { url: res.dl },
        mimetype: 'audio/mpeg',
        fileName: `${res.title || track.name}.mp3`,
        caption: `🎵 ${res.title || track.name} — ${res.author || track.artists?.map(a => a.name).join(', ')}`,
      }, { quoted: m.raw })
      await m.react('✅')
    } catch (e) {
      console.error('[SPOTIFY DOWNLOAD]', e)
      await m.react('❌')
      await m.reply(`❌ Gagal mengunduh: ${e.message}`)
    }
    return
  }

  // Pencarian baru
  await m.react('🔍')
  try {
    const sp = getSpotifyClient()
    const result = await sp.search(text)
    if (!result?.tracks?.length) {
      await m.react('😔')
      return m.reply('❌ Tidak ada lagu ditemukan.')
    }

    const tracks = result.tracks.slice(0, 10)

    // Simpan session
    sessions.set(m.senderNumber, {
      tracks,
      expires: Date.now() + SESSION_TTL,
    })

    // Format produk untuk AIRich
    const products = tracks.map((t, i) => ({
      title: `${i + 1}. ${t.name}`,
      brand: t.artists?.map(a => a.name).join(', ') || 'Unknown',
      price: t.duration_ms ? `${Math.floor(t.duration_ms / 60000)}:${Math.floor((t.duration_ms % 60000) / 1000).toString().padStart(2, '0')}` : '',
      url: t.url || '',
      image_url: t.album?.images?.[0]?.url || t.images?.[0]?.url || '',
      product_url: t.url || '',
    }))

    // Kirim dengan AIRich
    await new AIRich(sock)
      .setTitle(`🎵 Spotify Search: "${text}"`)
      .addText(`Balas dengan *.spotify <nomor>* (1-${tracks.length}) untuk memutar.`)
      .addProduct(products)
      .addSuggest(tracks.slice(0, 5).map((_, i) => `spotify ${i + 1}`))
      .send(m.chat, { quoted: m.raw })

    await m.react('✅')
  } catch (e) {
    console.error('[SPOTIFY]', e)
    await m.react('❌')
    await m.reply(`❌ Terjadi kesalahan: ${e.message}`)
  }
}