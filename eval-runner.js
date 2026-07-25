// src/lib/eval-runner.js
import { promisify } from 'util';
import child_process from 'child_process';
import axios from 'axios';
import crypto from 'crypto';
import * as cheerio from 'cheerio';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
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
} from '@kyyinfinite/baileys';
import { Button, ButtonV2, AIRich, Carousel } from './_build-m.js';
import { serialize } from '../serialize.js';
import config from '../../config.js';

const execPromise = promisify(child_process.exec);
const EXEC_TIMEOUT = 30000;

export async function runEval(m, ctx) {
  const { sock, config, db, groupMeta, isOwner, isPremium, isGroupAdmin, isBotAdmin } = ctx;

  if (!isOwner) {
    await m.reply('❌ Hanya owner yang dapat menggunakan eval.');
    return;
  }

  let code = (m.text || '').trim();
  if (!code && m.quoted) {
    code = m.quoted.body || m.quoted.text || '';
  }
  if (!code) {
    await m.reply('❌ Masukkan kode setelah command, atau reply ke pesan berisi kode.');
    return;
  }

  // Hapus markdown code block
  code = code.replace(/^```(?:js|javascript)?\n?/, '').replace(/```$/, '').trim();
  if (!code) {
    await m.reply('❌ Kode kosong setelah dibersihkan.');
    return;
  }

  // Deteksi mode: expression (=>) atau statement (>)
  let mode = 'script';
  if (code.startsWith('=> ')) {
    mode = 'expression';
    code = code.slice(3).trim();
  } else if (code.startsWith('> ')) {
    mode = 'statement';
    code = code.slice(2).trim();
  }

  // Tangkap console.log
  const logs = [];
  const fakeConsole = {
    log: (...args) => logs.push(args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')),
    warn: (...args) => logs.push('[WARN] ' + args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')),
    error: (...args) => logs.push('[ERROR] ' + args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')),
  };

  // Kumpulkan Promise yang mungkin tidak di-await
  const pendingPromises = [];
  const relayMessage = (...args) => {
    const p = sock.relayMessage(...args);
    pendingPromises.push(p);
    return p;
  };
  const sendMessage = (...args) => {
    const p = sock.sendMessage(...args);
    pendingPromises.push(p);
    return p;
  };

  const context = {
    sock,
    conn: sock,
    m,
    config,
    db,
    groupMeta,
    isOwner,
    isPremium,
    isGroupAdmin,
    isBotAdmin,
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
        return await m.quoted.download();
      }
      throw new Error('Tidak ada media untuk di-download');
    },
    fetchJson: async (url, options = {}) => {
      const res = await axios.get(url, { ...options, responseType: 'json' });
      return res.data;
    },
    fetchBuffer: async (url, options = {}) => {
      const res = await axios.get(url, { ...options, responseType: 'arraybuffer' });
      return Buffer.from(res.data);
    },
    fetchText: async (url, options = {}) => {
      const res = await axios.get(url, { ...options, responseType: 'text' });
      return res.data;
    },
    scrape: async (url, handler) => {
      const html = await axios.get(url).then(r => r.data);
      const $ = cheerio.load(html);
      return handler($);
    },
    relayMessage,
    sendMessage,
  };

  let wrappedCode;
  if (mode === 'expression') {
    wrappedCode = `return (${code});`;
  } else {
    wrappedCode = code;
  }

  const fullCode = `(async () => {
${wrappedCode}
})()`;

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`⏱️ Kode melebihi batas waktu (${EXEC_TIMEOUT/1000}s)`)), EXEC_TIMEOUT)
  );

  try {
    const fn = new Function(...Object.keys(context), `return ${fullCode}`);
    const execPromiseResult = fn(...Object.values(context));
    const result = await Promise.race([execPromiseResult, timeoutPromise]);

    if (pendingPromises.length) {
      await Promise.allSettled(pendingPromises);
    }

    let output = '';
    if (logs.length) {
      output += '```log\n' + logs.join('\n') + '\n```\n';
    }

    if (result === undefined && logs.length === 0) {
      await sock.sendMessage(m.chat, { text: '✅ Kode dijalankan (tanpa return).' }, { quoted: m.raw });
      await m.react('✅');
      return;
    }

    if (output) {
      await sock.sendMessage(m.chat, { text: output }, { quoted: m.raw });
    }

    if (result !== undefined) {
      if (Buffer.isBuffer(result)) {
        try {
          await sock.sendMessage(m.chat, { image: result, caption: '📎 Hasil Buffer (Gambar)' }, { quoted: m.raw });
        } catch {
          await sock.sendMessage(m.chat, { document: result, fileName: 'hasil', mimetype: 'application/octet-stream', caption: '📎 Hasil Buffer' }, { quoted: m.raw });
        }
      } else if (result && typeof result === 'object' && result.key && result.message) {
        await sock.relayMessage(m.chat, result.message, { messageId: result.key.id });
      } else if (typeof result === 'string') {
        await sock.sendMessage(m.chat, { text: result }, { quoted: m.raw });
      } else {
        const json = JSON.stringify(result, null, 2);
        if (json.length > 3500) {
          const buf = Buffer.from(json, 'utf-8');
          await sock.sendMessage(m.chat, {
            document: buf,
            fileName: 'hasil.json',
            mimetype: 'application/json',
            caption: '📎 Hasil Eksekusi (JSON)',
          }, { quoted: m.raw });
        } else {
          await sock.sendMessage(m.chat, { text: '```json\n' + json + '\n```' }, { quoted: m.raw });
        }
      }
    }

    await m.react('✅');
  } catch (err) {
    console.error('[EVAL]', err);
    const errorMsg = err.stack || err.message;
    await sock.sendMessage(m.chat, { text: '❌ Error:\n```\n' + errorMsg.slice(0, 3500) + '\n```' }, { quoted: m.raw });
    await m.react('❌');
  }
}