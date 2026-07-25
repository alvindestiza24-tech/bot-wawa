import axios from 'axios'
import config from '../../config.js'

export const config_ = {
  name: 'ssweb',
  alias: ['screenshot', 'ss', 'webss'],
  category: 'tools',
  description: 'Screenshot halaman website',
  usage: '.ssweb <url> [--mobile]',
  example: '.ssweb https://google.com',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 15,
  isEnabled: true,
}
export { config_ as config }

async function ssweb(url, mode = 'desktop') {
  const width = mode === 'mobile' ? 720 : 1920
  const apiUrl = `https://image.thum.io/get/width/${width}/crop/1080/noanimate/${url}`
  const res = await axios.get(apiUrl, {
    responseType: 'arraybuffer',
    timeout: 30000,
  })
  return Buffer.from(res.data)
}

export async function handler(m, { sock }) {
  let text = m.text?.trim() || ''

  if (!text) {
    return m.reply(
      `📸 *SCREENSHOT WEB*\n\n` +
      `Screenshot halaman website.\n\n` +
      `*Contoh:*\n` +
      `.ssweb https://google.com\n` +
      `.ss https://github.com --mobile`
    )
  }

  let mode = 'desktop'
  if (text.includes('--mobile') || text.includes('--hp')) {
    mode = 'mobile'
    text = text.replace(/--mobile|--hp/g, '').trim()
  }

  if (!text.startsWith('http')) {
    text = 'https://' + text
  }

  await m.react('🕕')

  try {
    const imageBuffer = await ssweb(text, mode)

    await sock.sendMessage(m.chat, {
      image: imageBuffer,
      caption: `📸 Screenshot: ${text} (${mode === 'mobile' ? 'Mobile' : 'Desktop'})`,
    }, { quoted: m.raw })

    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal mengambil screenshot: ${err.message}`)
  }
}