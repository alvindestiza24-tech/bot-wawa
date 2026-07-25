// plugins/group/swgc.js
import { downloadContentFromMessage } from '@kyyinfinite/baileys'

export const config_ = {
  name: 'swgc',
  alias: ['storygc', 'statusgc'],
  category: 'group',
  description: 'Kirim status/story ke grup (admin only)',
  usage: '.swgc <teks> atau reply gambar/video dengan caption .swgc',
  example: '.swgc Hallo semua!',
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  let text = m.args.join(' ').trim()
  const target = m.quoted || m
  const type = target.type || ''

  const isImage = type === 'imageMessage'
  const isVideo = type === 'videoMessage'

  if (!text && !isImage && !isVideo) {
    await m.react('❌')
    return
  }

  try {
    if (isImage || isVideo) {
      const messageType = type.replace('Message', '')
      const stream = await downloadContentFromMessage(target.message[type], messageType)
      let buffer = Buffer.from([])
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
      }
      if (!buffer || buffer.length === 0) {
        await m.react('❌')
        return
      }

      const statusContext = {
        isGroupStatus: true,
        statusSourceType: text ? 'TEXT' : 'MEDIA',
        statusAttributions: [
          {
            type: 'GROUP_STATUS',
            groupStatus: {
              authorJid: m.sender
            }
          }
        ]
      }

      await sock.sendMessage(m.chat, {
        [isImage ? 'image' : 'video']: buffer,
        caption: text || '',
        contextInfo: statusContext
      }, { quoted: m.raw })
    } else {
      const statusMessage = {
        message: {
          extendedTextMessage: {
            text: text,
            textArgb: 4294967295,
            backgroundArgb: 4294937228,
            font: 'SYSTEM',
            previewType: 'NONE',
            contextInfo: {
              isGroupStatus: true,
              statusSourceType: 'TEXT',
              statusAttributions: [
                {
                  type: 'GROUP_STATUS',
                  groupStatus: {
                    authorJid: m.sender
                  }
                }
              ]
            },
            inviteLinkGroupTypeV2: 'DEFAULT'
          }
        }
      }

      await sock.relayMessage(m.chat, { groupStatusMessageV2: statusMessage }, {})
    }

    await m.react('✅')
  } catch (err) {
    console.error('[SWGC]', err)
    await m.react('❌')
  }
}