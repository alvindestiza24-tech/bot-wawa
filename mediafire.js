// plugins/downloader/mediafire.js
import axios from 'axios'
import * as cheerio from 'cheerio'

export const config_ = {
  name: 'mediafire',
  alias: ['mf', 'mediafiredl'],
  category: 'downloader',
  description: 'Download file dari Mediafire',
  usage: '.mediafire <url>',
  example: '.mediafire https://www.mediafire.com/file/xxx/file.zip',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 15,
  isEnabled: true,
}
export { config_ as config }

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

const MIME_MAP = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  mkv: 'video/x-matroska',
  avi: 'video/x-msvideo',
  mov: 'video/quicktime',
  webm: 'video/webm',
  '3gp': 'video/3gpp',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
  aac: 'audio/aac',
  m4a: 'audio/mp4',
  opus: 'audio/opus',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
  rar: 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  txt: 'text/plain',
  csv: 'text/csv',
  json: 'application/json',
  xml: 'application/xml',
  apk: 'application/vnd.android.package-archive',
  exe: 'application/x-msdownload',
  iso: 'application/x-iso9660-image',
}

function getFileType(ext) {
  const image = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']
  const video = ['mp4', 'mkv', 'avi', 'mov', 'webm', '3gp']
  const audio = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus']
  const archive = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz']
  const app = ['apk', 'exe', 'msi', 'dmg', 'deb', 'rpm']

  if (image.includes(ext)) return 'image'
  if (video.includes(ext)) return 'video'
  if (audio.includes(ext)) return 'audio'
  if (archive.includes(ext)) return 'archive'
  if (app.includes(ext)) return 'app'
  if (ext === 'pdf') return 'pdf'
  if (['doc', 'docx'].includes(ext)) return 'word'
  if (['xls', 'xlsx'].includes(ext)) return 'excel'
  if (['ppt', 'pptx'].includes(ext)) return 'powerpoint'
  if (['txt', 'csv', 'json', 'xml'].includes(ext)) return 'text'
  return 'other'
}

function getTypeEmoji(type) {
  const map = {
    image: '🖼️',
    video: '🎬',
    audio: '🎵',
    archive: '📦',
    app: '📱',
    pdf: '📕',
    word: '📝',
    excel: '📊',
    powerpoint: '📽️',
    text: '📄',
    other: '📄',
  }
  return map[type] || '📄'
}

export async function handler(m, { sock }) {
  let url = m.args[0]

  if (!url && m.quoted?.body) {
    const quotedText = m.quoted.body
    const match = quotedText.match(/(https?:\/\/(?:www\.)?mediafire\.com\/[^\s]+)/)
    if (match) url = match[1]
  }

  if (!url) {
    return m.reply(
      '📁 *Mediafire Downloader*\n\n' +
        '> Download file dari Mediafire\n\n' +
        '*Cara pakai:*\n' +
        '`.mediafire https://www.mediafire.com/file/xxx/file.zip`\n\n' +
        '*Alias:* `.mf`, `.mediafiredl`'
    )
  }

  if (!/mediafire\.com/i.test(url)) {
    return m.reply('❌ *Link tidak valid!*\n\n> Masukkan link Mediafire yang benar.')
  }

  await m.react('⏳')

  try {
    const pageRes = await axios.get(url.trim(), {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        Referer: 'https://www.mediafire.com/',
      },
      timeout: 30000,
    })

    const $ = cheerio.load(pageRes.data)

    let downloadUrl =
      $('a#downloadButton').attr('href') ||
      $('a.input.popsok').attr('href') ||
      ''

    if (!downloadUrl) {
      const match1 = pageRes.data.match(/href="(https?:\/\/download[^"]+)"/i)
      if (match1) downloadUrl = match1[1]
    }
    if (!downloadUrl) {
      const match2 = pageRes.data.match(/kNO\s*=\s*"(https?:\/\/[^"]+)"/i)
      if (match2) downloadUrl = match2[1]
    }

    if (!downloadUrl) {
      await m.react('❌')
      return m.reply('❌ *Gagal!*\n\n> Tidak dapat menemukan link download.\n> Pastikan link valid dan file tidak dihapus.')
    }


    const fileName =
      $('.dl-btn-label').first().text().trim() ||
      $('.filename').first().text().trim() ||
      $('div.fileName').first().text().trim() ||
      downloadUrl.split('/').pop().split('?')[0] ||
      'unknown_file'

    const fileSize =
      $('.dl-info span.details span').first().text().trim() ||
      $('.details span:first-child').first().text().trim() ||
      $('span.file_size').first().text().trim() ||
      (() => {
        const match = pageRes.data.match(/(\d+(?:\.\d+)?\s*(?:KB|MB|GB|TB|bytes))/i)
        return match ? match[1] : 'Unknown'
      })()

    const uploadDate =
      $('.dl-info span.details span:nth-child(3)').text().trim() ||
      $('span.details:contains("Uploaded")').text().replace('Uploaded', '').trim() ||
      'Unknown'

    const ext = fileName.split('.').pop().toLowerCase()
    const fileType = getFileType(ext)
    const typeEmoji = getTypeEmoji(fileType)
    const mimeType = MIME_MAP[ext] || 'application/octet-stream'

    const fileRes = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': UA,
        Referer: 'https://www.mediafire.com/',
      },
      timeout: 120000,
      maxContentLength: 200 * 1024 * 1024,
      maxBodyLength: 200 * 1024 * 1024,
    })

    const buffer = Buffer.from(fileRes.data)
    const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2)

    const caption =
      `📁 *Mediafire Downloader*\n\n` +
      `╭┈┈⬡「 📋 *File Info* 」\n` +
      `┃ • Nama: *${fileName}*\n` +
      `┃ • Tipe: *${typeEmoji} ${fileType.toUpperCase()}*\n` +
      `┃ • Format: *${ext.toUpperCase()}*\n` +
      `┃ • Ukuran: *${sizeMB} MB* (${fileSize})\n` +
      `┃ • Upload: *${uploadDate}*\n` +
      `╰┈┈┈┈┈┈┈┈⬡`

    const isImage = ['image'].includes(fileType)
    const isVideo = ['video'].includes(fileType)
    const isAudio = ['audio'].includes(fileType)

    if (isImage && buffer.length < 16 * 1024 * 1024) {
      await sock.sendMessage(
        m.chat,
        {
          image: buffer,
          caption,
          mimetype: mimeType,
        },
        { quoted: m.raw }
      )
    } else if (isVideo && buffer.length < 100 * 1024 * 1024) {
      await sock.sendMessage(
        m.chat,
        {
          video: buffer,
          caption,
          mimetype: mimeType,
        },
        { quoted: m.raw }
      )
    } else if (isAudio && buffer.length < 16 * 1024 * 1024) {
      await sock.sendMessage(
        m.chat,
        {
          audio: buffer,
          mimetype: mimeType,
          fileName,
        },
        { quoted: m.raw }
      )
      // Kirim caption terpisah karena audio tidak support caption
      await m.reply(caption)
    } else {
      // Document (fallback untuk semua file)
      await sock.sendMessage(
        m.chat,
        {
          document: buffer,
          mimetype: mimeType,
          fileName,
          caption,
        },
        { quoted: m.raw }
      )
    }

    await m.react('✅')
  } catch (err) {
    console.error('[MEDIAFIRE]', err)
    await m.react('❌')

    let msg = err.message
    if (err.response?.status === 404) msg = 'File tidak ditemukan atau sudah dihapus.'
    else if (err.response?.status === 403) msg = 'Akses ditolak. File mungkin private.'
    else if (err.code === 'ECONNABORTED') msg = 'Timeout! File terlalu besar atau koneksi lambat.'
    else if (err.code === 'ERR_BAD_RESPONSE') msg = 'Server Mediafire tidak merespon.'
    else if (msg.length > 200) msg = msg.slice(0, 200)

    await m.reply(`❌ *Error Mediafire*\n\n> ${msg}`)
  }
}