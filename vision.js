import { chatCompletion } from '../../src/ai/groq-client.js'
import { parseAIResponse } from '../../src/ai/ai-response-parser.js'
import { buildSystemPrompt } from '../../src/ai/ai-utils.js'
import { AIRich, Toolkit } from '../../src/lib/_build-m.js'
import config from '../../config.js'

export const config_ = {
  name: 'vision',
  alias: ['aiimg', 'aiv'],
  category: 'ai',
  description: 'Analisis gambar dengan AI Vision',
  usage: '.vision (reply gambar)',
  example: '.vision apa yang ada di gambar ini?',
  isOwner: false,
  isPremium: true,  
  cooldown: 12,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  if (!m.quoted) {
    return m.reply('❌ Reply sebuah gambar untuk dianalisis.')
  }

  // Cek tipe pesan yang di‑reply adalah gambar
  const isImage = m.quoted.type === 'imageMessage' ||
                  m.quoted.type === 'image' ||
                  !!m.quoted.message?.imageMessage ||
                  m.quoted.isImage === true

  if (!isImage) {
    return m.reply('❌ Pesan yang direply bukan gambar.')
  }

  try {
    // Gunakan m.quoted.download() yang sudah diperbaiki di serialize.js
    const media = await m.quoted.download()
    const base64 = media.toString('base64')

    const userMessage = {
      role: 'user',
      content: [
        {
          type: 'text',
          text: m.text?.trim() || 'Deskripsikan gambar ini secara detail.'
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${base64}`
          }
        }
      ]
    }

    const messages = [
      {
        role: 'system',
        content: buildSystemPrompt('vision', { botName: config.bot?.name })
      },
      userMessage
    ]

    const raw = await chatCompletion(messages, {
      model: 'llama-3.2-11b-vision-preview',
      temperature: 0.5,
      maxTokens: 1024
    })

    const parsed = parseAIResponse(raw)

    // Upload gambar ke WA untuk ditampilkan di AIRich
    let imageUrl = null
    try {
      imageUrl = await Toolkit.toUrl(sock, media, 'image')
    } catch {}

    const builder = new AIRich(sock)
      .setTitle('🖼️ Vision Analysis')

    if (imageUrl) {
      builder.addImage(imageUrl, { resolveUrl: false })
    }
    builder.addText(parsed.texts.join('\n\n') || 'Tidak ada deskripsi.')

    await builder.send(m.chat, { quoted: m.raw })
    m.react('✅')
  } catch (err) {
    m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}