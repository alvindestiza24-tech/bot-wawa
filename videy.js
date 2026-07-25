// plugins/tools/videy.js
import { videy } from '../../src/scrape/videy.js'
import { downloadContentFromMessage } from '@kyyinfinite/baileys'
import { AIRich } from '../../src/lib/_build-m.js'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'videy',
  alias: ['uploadvideo', 'hostvideo'],
  category: 'downloader',
  description: 'Upload video ke Videy.co (hosting gratis)',
  usage: '.videy (reply video)',
  example: '.videy',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 30,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  // Deteksi video dari quoted atau dari pesan itu sendiri
  let videoMessage = null
  let videoType = null

  if (m.quoted && m.quoted.isVideo) {
    videoMessage = m.quoted.message
    videoType = m.quoted.type
  } else if (m.isVideo) {
    videoMessage = m.message
    videoType = m.type
  }

  if (!videoMessage || !videoType) {
    return m.reply(beautifulMessage('❌ Reply atau kirim video dengan caption .videy', { pushName: m.pushName }))
  }

  await m.react('⏳')

  try {
    // Download video
    const stream = await downloadContentFromMessage(videoMessage, videoType)
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }

    if (!buffer || buffer.length === 0) {
      return m.reply(beautifulMessage('❌ Gagal mendownload video.', { pushName: m.pushName }))
    }

    // Upload ke Videy
    const result = await videy(buffer)

    if (result.status !== 'success' || !result.output) {
      return m.reply(beautifulMessage(`❌ Gagal upload: ${result.msg || 'Error tidak diketahui'}`, { pushName: m.pushName }))
    }

    const { id, url, embed_url, size } = result.output

    const text = `## ✅ Video Berhasil Diupload\n` +
      `**Video ID:** ${id}\n` +
      (size ? `**Size:** ${(size / 1024 / 1024).toFixed(2)} MB\n` : '') +
      `**URL:** [${url}](${url})`

    await new AIRich(sock)
      .setTitle('☁️ Videy Uploader')
      .addText(text)
      .addVideo(url)
      .addSuggest([
        'Upload Lagi',
        'Buka Video',
      ])
      .send(m.chat, { quoted: m.raw })

    await m.react('✅')
  } catch (err) {
    console.error('[VIDEY]', err)
    await m.react('❌')
    await m.reply(beautifulMessage(`❌ Gagal upload video: ${err.message}`, { pushName: m.pushName }))
  }
}