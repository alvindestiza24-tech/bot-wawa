// plugins/tools/upload.js
import axios from 'axios'
import FormData from 'form-data'
import { downloadContentFromMessage } from '@kyyinfinite/baileys'
import { beautifulMessage } from '../../src/lib/text-formater.js'
import { Button } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'upload',
  alias: ['host', 'catbox', 'uploadfile', 'gofile'],
  category: 'tools',
  description: 'Upload file ke hosting gratis (Catbox, GoFile, 0x0.st, dll)',
  usage: '.upload (reply file)',
  example: '.upload',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 15,
  isEnabled: true,
}
export { config_ as config }

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
async function uploadCatbox(buffer, filename) {
  const form = new FormData()
  form.append('reqtype', 'fileupload')
  form.append('fileToUpload', buffer, { filename })
  const res = await axios.post('https://catbox.moe/user/api.php', form, {
    headers: {
      ...form.getHeaders(),
      'User-Agent': UA,
      'Accept': '*/*',
    },
    timeout: 60000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  })
  const url = String(res.data).trim()
  if (url.startsWith('https://files.catbox.moe/')) return url
  throw new Error(`Catbox: ${url}`)
}

async function uploadGoFile(buffer, filename) {
  const form = new FormData()
  form.append('file', buffer, { filename })
  const res = await axios.post('https://store1.gofile.io/contents/uploadfile', form, {
    headers: {
      ...form.getHeaders(),
      'User-Agent': UA,
    },
    timeout: 60000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  })
  if (res.data?.status === 'ok' && res.data?.data?.downloadPage) {
    return res.data.data.downloadPage
  }
  throw new Error(`GoFile: ${JSON.stringify(res.data)}`)
}

async function uploadZero(buffer, filename) {
  const form = new FormData()
  form.append('file', buffer, { filename })
  const res = await axios.post('https://0x0.st', form, {
    headers: {
      ...form.getHeaders(),
      'User-Agent': UA,
      'Accept': '*/*',
    },
    timeout: 60000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  })
  const url = String(res.data).trim()
  if (url.startsWith('https://0x0.st/')) return url
  throw new Error(`0x0.st: ${url}`)
}

async function uploadAnonFiles(buffer, filename) {
  const form = new FormData()
  form.append('file', buffer, { filename })
  const res = await axios.post('https://api.anonfiles.com/upload', form, {
    headers: {
      ...form.getHeaders(),
      'User-Agent': UA,
    },
    timeout: 60000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  })
  if (res.data?.status && res.data?.data?.file?.url?.full) {
    return res.data.data.file.url.full
  }
  throw new Error(`AnonFiles: ${res.data?.error?.message || 'gagal'}`)
}

async function uploadLitterbox(buffer, filename) {
  const form = new FormData()
  form.append('reqtype', 'fileupload')
  form.append('time', '1h')
  form.append('fileToUpload', buffer, { filename })
  const res = await axios.post('https://litterbox.catbox.moe/user/api.php', form, {
    headers: {
      ...form.getHeaders(),
      'User-Agent': UA,
    },
    timeout: 60000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  })
  const url = String(res.data).trim()
  if (url.startsWith('https://litterbox.catbox.moe/')) return url
  throw new Error(`Litterbox: ${url}`)
}

async function uploadTelegraph(buffer, filename) {
  const form = new FormData()
  form.append('file', buffer, { filename })
  const res = await axios.post('https://telegra.ph/upload', form, {
    headers: {
      ...form.getHeaders(),
      'User-Agent': UA,
    },
    timeout: 30000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  })
  if (Array.isArray(res.data) && res.data[0]?.src) {
    return `https://telegra.ph${res.data[0].src}`
  }
  throw new Error(`Telegraph: ${JSON.stringify(res.data)}`)
}

const IMGBB_KEY = 'e5b2e8f4b3c9d1a7f6e4d3c2b1a9f8e7'
async function uploadImgBB(buffer, filename) {
  const base64 = buffer.toString('base64')
  const form = new FormData()
  form.append('image', base64)
  form.append('key', IMGBB_KEY)
  form.append('name', filename)
  const res = await axios.post('https://api.imgbb.com/1/upload', form, {
    headers: form.getHeaders(),
    timeout: 30000,
  })
  if (res.data?.success && res.data?.data?.url) {
    return res.data.data.url
  }
  throw new Error(`ImgBB: ${res.data?.error?.message || 'gagal'}`)
}

const HOSTS = [
  { name: 'Catbox', fn: uploadCatbox },
  { name: 'GoFile', fn: uploadGoFile },
  { name: '0x0.st', fn: uploadZero },
  { name: 'AnonFiles', fn: uploadAnonFiles },
  { name: 'Litterbox', fn: uploadLitterbox },
]

const IMAGE_HOSTS = [
  { name: 'Telegra.ph', fn: uploadTelegraph },
  { name: 'ImgBB', fn: uploadImgBB },
]

async function uploadWithFallback(buffer, filename) {
  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(filename)

  let hosts = [...HOSTS]
  if (isImage) {
    hosts = [...IMAGE_HOSTS, ...HOSTS]
  }

  const errors = []
  for (const host of hosts) {
    try {
      const url = await host.fn(buffer, filename)
      if (url) {
        return { success: true, url, host: host.name }
      }
    } catch (err) {
      errors.push(`${host.name}: ${err.message}`)
    }
  }
  throw new Error(`Semua hosting gagal:\n${errors.join('\n')}`)
}

export async function handler(m, { sock }) {
  const quoted = m.quoted
  const isMediaReply = quoted && (
    quoted.type === 'imageMessage' ||
    quoted.type === 'videoMessage' ||
    quoted.type === 'stickerMessage' ||
    quoted.type === 'documentMessage' ||
    quoted.type === 'audioMessage'
  )

  if (!quoted || !isMediaReply) {
    return m.reply(
      beautifulMessage(
        '❌ *Upload File*\n\n' +
        'Reply gambar/video/dokumen yang ingin diupload.\n' +
        'Contoh: .upload (reply ke file)\n\n' +
        'File akan diupload ke hosting gratis dengan fallback otomatis.\n' +
        'Support: Catbox, GoFile, 0x0.st, AnonFiles, Litterbox, Telegra.ph, ImgBB',
        { pushName: m.pushName }
      )
    )
  }

  await m.react('⏳')

  try {
    const messageType = quoted.type.replace('Message', '')
    const stream = await downloadContentFromMessage(quoted.message[quoted.type], messageType)
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }

    if (!buffer || buffer.length === 0) {
      return m.reply(beautifulMessage('❌ Gagal mendownload file.', { pushName: m.pushName }))
    }

    let filename = quoted.fileName || `file_${Date.now()}`
    if (!filename.includes('.')) {
      const extMap = {
        imageMessage: 'jpg',
        videoMessage: 'mp4',
        stickerMessage: 'webp',
        documentMessage: 'bin',
        audioMessage: 'mp3',
      }
      const ext = extMap[quoted.type] || 'bin'
      filename += `.${ext}`
    }

    const result = await uploadWithFallback(buffer, filename)
    const msg = await new Button(sock)
      .setTitle('✅ Upload Berhasil')
      .setSubtitle(`Host: ${result.host}`)
      .setBody(`📁 *File:* ${filename}\n🔗 *URL:* ${result.url}\n\nKlik tombol di bawah untuk menyalin atau membuka.`)
      .setFooter('Powered by multiple hosting services')
      .addCopy('📋 Copy URL', result.url)
      .addUrl('🌐 Buka URL', result.url, false)
      .addReply('📤 Upload Lagi', '.upload')
      .build(m.chat)

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
    await m.react('✅')
  } catch (err) {
    console.error('[UPLOAD]', err)
    await m.react('❌')
    await m.reply(beautifulMessage(`❌ Gagal upload:\n${err.message}`, { pushName: m.pushName }))
  }
}