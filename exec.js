// plugins/owner/exec.js
import { Button, ButtonV2, AIRich, Carousel } from '../../src/lib/_build-m.js'
import config from '../../config.js'
import { serialize } from '../../src/serialize.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'
import child_process from 'child_process'
import axios from 'axios'
import crypto from 'crypto'
import * as cheerio from 'cheerio'
import sharp from 'sharp'
import {
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  generateWAMessage,
  downloadContentFromMessage,
  jidDecode,
  proto,
  getContentType,
  getAggregateVotesInPollMessage,
  getBinaryNodeChild,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  delay,
  generateForwardMessageContent,
} from '@kyyinfinite/baileys'

const execPromise = promisify(child_process.exec)
const EXEC_TIMEOUT = 30000

export const config_ = {
  name: 'exec',
  alias: ['=>', '>', 'eval', 'js', 'run'],
  category: 'owner',
  description: 'Eksekusi kode JavaScript (relay, sendMessage, scrape, dll)',
  usage: '=> <kode_js>',
  example: '=> conn.relayMessage(m.chat, { stickerMessage: { url: "..." } }, {})',
  isOwner: true,
  isEnabled: true,
  prefix: false,
}
export { config_ as config }

export async function handler(m, { sock }) {
  let code = (m.text || '').trim()
  if (!code) {
    return m.reply('❌ Masukkan kode setelah =>\nContoh: => sock.sendMessage(m.chat, { text: "Halo" })')
  }

  code = code.replace(/^```(?:js|javascript)?\n?/, '').replace(/```$/, '').trim()
  if (!code) return m.reply('❌ Kode kosong.')

  const logs = []
  const fakeConsole = {
    log: (...args) => logs.push(args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')),
    warn: (...args) => logs.push('[WARN] ' + args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')),
    error: (...args) => logs.push('[ERROR] ' + args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')),
  }

  // Kumpulkan Promise yang mungkin tidak di-await oleh pengguna
  const pendingPromises = []

  // Bungkus fungsi relay dan sendMessage agar selalu mengumpulkan Promise
  const relayMessage = (...args) => {
    const p = sock.relayMessage(...args)
    pendingPromises.push(p)
    return p
  }
  const sendMessage = (...args) => {
    const p = sock.sendMessage(...args)
    pendingPromises.push(p)
    return p
  }

  const context = {
    sock,
    conn: sock,   // alias
    m,
    config,
    Button,
    ButtonV2,
    AIRich,
    Carousel,
    serialize,
    axios,
    cheerio,
    sharp,
    fs,
    path,
    crypto,
    child_process,
    execPromise,
    baileys: {
      prepareWAMessageMedia,
      generateWAMessageFromContent,
      generateWAMessage,
      downloadContentFromMessage,
      jidDecode,
      proto,
      getContentType,
      getAggregateVotesInPollMessage,
      getBinaryNodeChild,
      makeCacheableSignalKeyStore,
      useMultiFileAuthState,
      DisconnectReason,
      fetchLatestBaileysVersion,
      Browsers,
      delay,
      generateForwardMessageContent,
    },
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateWAMessage,
    downloadContentFromMessage,
    console: fakeConsole,
    reply: async (text) => await sock.sendMessage(m.chat, { text: String(text) }, { quoted: m.raw }),
    sendImage: async (buffer, caption = '') => await sock.sendMessage(m.chat, { image: buffer, caption }, { quoted: m.raw }),
    sendVideo: async (buffer, caption = '') => await sock.sendMessage(m.chat, { video: buffer, caption }, { quoted: m.raw }),
    sendDoc: async (buffer, filename = 'file', mimetype = 'application/octet-stream') =>
      await sock.sendMessage(m.chat, { document: buffer, fileName: filename, mimetype }, { quoted: m.raw }),
    download: async () => {
      if (m.quoted && (m.quoted.isImage || m.quoted.isVideo || m.quoted.isAudio || m.quoted.isDocument)) {
        return await m.quoted.download()
      }
      throw new Error('No media to download')
    },
    fetchJson: async (url, options = {}) => {
      const res = await axios.get(url, { ...options, responseType: 'json' })
      return res.data
    },
    fetchBuffer: async (url, options = {}) => {
      const res = await axios.get(url, { ...options, responseType: 'arraybuffer' })
      return Buffer.from(res.data)
    },
    fetchText: async (url, options = {}) => {
      const res = await axios.get(url, { ...options, responseType: 'text' })
      return res.data
    },
    scrape: async (url, handler) => {
      const html = await axios.get(url).then(r => r.data)
      const $ = cheerio.load(html)
      return handler($)
    },
    // Override penting: gunakan versi yang mengumpulkan Promise
    relayMessage,
    sendMessage,
  }

  const wrappedCode = `(async () => {
${code}
})()`

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('⏱️ Kode melebihi batas waktu eksekusi (' + EXEC_TIMEOUT/1000 + ' detik)')), EXEC_TIMEOUT)
  )

  try {
    const fn = new Function(...Object.keys(context), `return ${wrappedCode}`)
    const execPromise = fn(...Object.values(context))
    const result = await Promise.race([execPromise, timeoutPromise])

    // Tunggu semua Promise yang mungkin belum di-await
    if (pendingPromises.length > 0) {
      await Promise.all(pendingPromises)
    }

    let logOutput = ''
    if (logs.length > 0) {
      logOutput = '```log\n' + logs.join('\n') + '\n```\n'
    }

    if (result === undefined && logs.length === 0) {
      // Jika tidak ada output sama sekali, anggap sukses tapi tetap kirim notifikasi
      await sock.sendMessage(m.chat, { text: '✅ Kode dijalankan (tanpa return).' }, { quoted: m.raw })
      await m.react('✅')
      return
    }

    if (logOutput) {
      await sock.sendMessage(m.chat, { text: logOutput }, { quoted: m.raw })
    }

    if (result === undefined) {
      await m.react('✅')
      return
    }

    if (Buffer.isBuffer(result)) {
      try {
        await sock.sendMessage(m.chat, { image: result, caption: '📎 Hasil Buffer (Gambar)' }, { quoted: m.raw })
      } catch {
        await sock.sendMessage(m.chat, { document: result, fileName: 'hasil', mimetype: 'application/octet-stream', caption: '📎 Hasil Buffer' }, { quoted: m.raw })
      }
    } else if (result && typeof result === 'object' && result.key && result.message) {
      await sock.relayMessage(m.chat, result.message, { messageId: result.key.id })
    } else if (typeof result === 'string') {
      await sock.sendMessage(m.chat, { text: result }, { quoted: m.raw })
    } else {
      const json = JSON.stringify(result, null, 2)
      if (json.length > 3500) {
        const buf = Buffer.from(json, 'utf-8')
        await sock.sendMessage(m.chat, {
          document: buf,
          fileName: 'hasil.json',
          mimetype: 'application/json',
          caption: '📎 Hasil Eksekusi (JSON)',
        }, { quoted: m.raw })
      } else {
        await sock.sendMessage(m.chat, { text: '```json\n' + json + '\n```' }, { quoted: m.raw })
      }
    }
    await m.react('✅')
  } catch (err) {
    console.error('[EXEC]', err)
    const errorMsg = err.stack || err.message
    await sock.sendMessage(m.chat, { text: '❌ Error:\n```\n' + errorMsg.slice(0, 3500) + '\n```' }, { quoted: m.raw })
    await m.react('❌')
  }
}