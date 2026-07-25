// plugins/random/pap.js
import axios from 'axios'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'pap',
  alias: ['paptt', 'paprandom'],
  category: 'random',
  description: 'Kirim gambar PAP (Pasangan Asik Putus) random',
  usage: '.pap',
  example: '.pap',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

const PAP_IMAGES = [
  'https://files.catbox.moe/2t3sdw.jpg',
  'https://files.catbox.moe/zja8v0.jpg',
  'https://files.catbox.moe/fanj0s.jpg',
  'https://files.catbox.moe/fxwjo6.jpg',
  'https://files.catbox.moe/dtx00l.jpg',
  'https://files.catbox.moe/038u56.jpg',
  'https://files.catbox.moe/yuhpig.jpg',
  'https://files.catbox.moe/d42eoo.jpg',
  'https://files.catbox.moe/1flisg.jpg',
  'https://files.catbox.moe/n95hn1.jpg',
  'https://files.catbox.moe/75n7h0.jpg',
  'https://files.catbox.moe/49ecs4.jpg',
  'https://files.catbox.moe/r9zxil.jpg',
  'https://files.catbox.moe/824tih.jpg',
  'https://files.catbox.moe/i8a2dz.jpg',
  'https://files.catbox.moe/8m1qgn.jpg',
  'https://files.catbox.moe/ab9b5o.jpg',
]

export async function handler(m, { sock }) {
  await m.react('⏳')

  try {
    const randomUrl = PAP_IMAGES[Math.floor(Math.random() * PAP_IMAGES.length)]

    
    const response = await axios.get(randomUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
    })

    const buffer = Buffer.from(response.data)

    await sock.sendMessage(m.chat, {
      image: buffer,
      caption: '📸 *PAP Random*',
    }, { quoted: m.raw })

    await m.react('✅')
  } catch (err) {
    console.error('[PAP]', err)
    await m.react('❌')
    await m.reply(beautifulMessage(`❌ Gagal mengambil gambar PAP: ${err.message}`, { pushName: m.pushName }))
  }
}