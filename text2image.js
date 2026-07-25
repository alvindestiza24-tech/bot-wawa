// plugins/ai/text2image.js
import { Txt2Img2 } from '../../src/ai/text2image-client.js'
import { AIRich } from '../../src/lib/_build-m.js'
import config from '../../config.js'

export const config_ = {
  name: 'txt2img',
  alias: ['text2img', 'aiimg', 'generateimg', 'imgai'],
  category: 'ai',
  description: 'Hasilkan gambar dari teks menggunakan AI Flux',
  usage: '.txt2img <prompt>',
  example: '.txt2img a cat wearing sunglasses',
  isOwner: false,
  isPremium: true,    
  isGroup: false,
  isPrivate: false,
  cooldown: 30,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const prompt = m.text?.trim()

  if (!prompt) {
    return m.reply('❌ Masukkan prompt. Contoh: *.txt2img pemandangan matahari terbenam di pantai*')
  }

  await m.react('⏳')

  try {
    const result = await Txt2Img2(prompt)

    if (!result.status) {
      await m.react('❌')
      return m.reply(`❌ Gagal membuat gambar: ${result.error}`)
    }

    // Gunakan AIRich untuk menampilkan gambar dan prompt
    await new AIRich(sock)
      .setTitle('🎨 Hasil Generate Gambar')
      .addImage(result.url, { resolveUrl: false }) // langsung gunakan URL
      .addText(`*Prompt:* ${prompt}`)
      .addSuggest(['txt2img', 'vision', 'ai'])
      .send(m.chat, { quoted: m.raw })

    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Terjadi kesalahan: ${err.message}`)
  }
}