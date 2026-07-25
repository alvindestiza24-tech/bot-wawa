import { hdvideo } from '../../src/scrape/hdvideo.js'
import { downloadContentFromMessage } from '@kyyinfinite/baileys'
import { beautifulMessage } from '../../src/lib/text-formater.js'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'hdvideo',
  alias: ['enhancevideo', 'videohd', 'upscalevideo'],
  category: 'tools',
  description: 'Tingkatkan kualitas video menjadi HD/2K (kirim via AI Rich)',
  usage: '.hdvideo (reply video)',
  example: '.hdvideo',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 60,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const target = m.quoted || m
  const type = target.type || ''

  const isVideo = type === 'videoMessage'

  if (!isVideo) {
    return m.reply(beautifulMessage('❌ Reply atau kirim video dengan caption .hdvideo', { pushName: m.pushName }))
  }

  await m.react('⏳')

  try {
    const messageType = type.replace('Message', '')
    const stream = await downloadContentFromMessage(target.message[type], messageType)
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }

    if (!buffer || buffer.length === 0) {
      return m.reply(beautifulMessage('❌ Gagal mendownload video.', { pushName: m.pushName }))
    }

    // Beri tahu user bahwa proses sedang berjalan
    await m.reply(beautifulMessage('⏳ Video sedang diproses, tunggu beberapa menit...', { pushName: m.pushName }))

    const outputUrl = await hdvideo(buffer)

    // Kirim video sebagai AI Rich Response (kartu video interaktif)
    await new AIRich(sock)
      .addVideo(outputUrl)
      .send(m.chat, { quoted: m.raw })

    await m.react('✅')
  } catch (err) {
    console.error('[HDVIDEO]', err)
    await m.react('❌')
    await m.reply(beautifulMessage(`❌ Gagal memproses video: ${err.message}`, { pushName: m.pushName }))
  }
}