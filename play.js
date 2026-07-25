import yts from 'yt-search';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { AIRich } from '../../src/lib/_build-m.js';
import { beautifulMessage } from '../../src/lib/text-formater.js';
import { createFakeQuoted, _mCtx } from '../../src/lib/ctx.js';

export const config_ = {
  name: 'play',
  alias: ['playmusic', 'song', 'ytmp3'],
  category: 'downloader',
  description: 'Cari & download lagu dari YouTube (AI Rich + audio + thumbnail)',
  usage: '.play <judul lagu>',
  example: '.play lemon tang tang',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 15,
  isEnabled: true,
};
export { config_ as config };

const execAsync = promisify(exec);

const ENDPOINTS = [
  'https://api.nexray.eu.cc/downloader/ytmp3',
  'https://api.nexray.eu.cc/downloader/v1/ytmp3',
];

// ─── Target ukuran file (byte) ───
const MAX_SIZE = 8 * 1024 * 1024; // 8MB — kalau di bawah ini, skip kompresi
const BITRATE = '128k';            // 128kbps = kualitas bagus, ukuran kecil

function normalizeUrl(url) {
  const m = String(url || '').match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/?|.*[?&]v=)|youtu\.be\/)([^"&?\/ \s]{11})/);
  return m ? `https://youtu.be/${m[1]}` : url;
}

/**
 * Kompres buffer audio → MP3 128kbps via ffmpeg.
 * Hanya dijalankan kalau ukuran melebihi MAX_SIZE.
 */
async function compressMp3(inputBuf) {
  // Skip kalau sudah kecil
  if (inputBuf.length <= MAX_SIZE) {
    return inputBuf;
  }

  const tmpDir = path.join(process.cwd(), 'storage', '.tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const id = crypto.randomBytes(6).toString('hex');
  const inp = path.join(tmpDir, `play_in_${id}`);
  const out = path.join(tmpDir, `play_out_${id}.mp3`);

  try {
    fs.writeFileSync(inp, inputBuf);

    await execAsync(
      `ffmpeg -y -i "${inp}" -vn -map_metadata -1 ` +
      `-ac 2 -ar 44100 -c:a libmp3lame -b:a ${BITRATE} "${out}"`,
      { timeout: 120000 }
    );

    if (!fs.existsSync(out)) return inputBuf;

    const result = fs.readFileSync(out);
    if (!result.length) return inputBuf;

    const beforeMB = (inputBuf.length / 1024 / 1024).toFixed(1);
    const afterMB = (result.length / 1024 / 1024).toFixed(1);
    console.log(`[PLAY] Compress: ${beforeMB}MB → ${afterMB}MB (${BITRATE})`);

    return result;
  } catch (e) {
    console.error('[PLAY] Compress failed, using original:', e.message);
    return inputBuf;
  } finally {
    try { fs.unlinkSync(inp) } catch {}
    try { fs.unlinkSync(out) } catch {}
  }
}

async function fetchAudioBuffer(url) {
  const errors = [];

  for (const endpoint of ENDPOINTS) {
    try {
      const { data, status } = await axios.get(endpoint, {
        params: { url: normalizeUrl(url) },
        timeout: 30000,
        responseType: 'json',
      });

      if (status !== 200 || !data) {
        errors.push(`${endpoint}: status ${status}`);
        continue;
      }

      const dlUrl =
        data?.result?.download?.url ||
        data?.result?.dl ||
        data?.result?.url ||
        data?.data?.dl ||
        data?.data?.download?.url ||
        data?.data?.url ||
        data?.download?.url ||
        data?.dl ||
        data?.url;

      const title = data?.result?.title || data?.data?.title || data?.title || null;

      if (!dlUrl || typeof dlUrl !== 'string' || !dlUrl.startsWith('http')) {
        errors.push(`${endpoint}: tidak ada URL download`);
        continue;
      }

      const { data: audioData } = await axios.get(dlUrl, {
        responseType: 'arraybuffer',
        timeout: 60000,
        maxRedirects: 15,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Encoding': 'identity',
        },
      });

      const buffer = Buffer.from(audioData);
      if (!buffer || buffer.length < 1024) {
        errors.push(`${endpoint}: buffer kosong (${buffer?.length || 0}B)`);
        continue;
      }

      return { buffer, title, via: endpoint.split('/downloader')[0] };
    } catch (e) {
      errors.push(`${endpoint}: ${e.message}`);
    }
  }

  throw new Error(errors.join(' → '));
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num || 0);
}

export async function handler(m, { sock }) {
  const query = m.args.join(' ').trim();
  if (!query) {
    return m.reply(beautifulMessage('❌ Masukkan judul lagu. Contoh: .play lemon tang tang', { pushName: m.pushName }));
  }

  await m.react('⏳');

  try {
    const search = await yts(query);
    const video = search.videos?.[0];
    if (!video) {
      return m.reply(beautifulMessage('❌ Tidak ditemukan hasil untuk: ' + query, { pushName: m.pushName }));
    }

    const fakeQuoted = createFakeQuoted();

    const title = video.title || 'Unknown Title';
    const author = video.author?.name || 'Unknown';
    const duration = video.timestamp || video.duration?.toString() || '-';
    const views = video.views ? `${formatNumber(video.views)} views` : '';
    const thumbUrl = video.thumbnail;

    // Kirim AI Rich (info lagu)
    const airich = new AIRich(sock)
      .setTitle('🎵 Now Playing')
      .addText(`## ${title}\n**Artist:** ${author}\n**Duration:** ${duration}  |  **Views:** ${views}`)
      .addTable([
        ['🎤 Artist', author],
        ['⏱️ Duration', duration],
        ['👁️ Views', views],
      ]);

    if (thumbUrl) {
      airich.addImage(thumbUrl);
    }

    airich.addSuggest(['🎧 Download Audio', '🔁 Cari Ulang']);

    await airich.send(m.chat, { quoted: fakeQuoted });

    // Download buffer MP3 dari API
    const { buffer: rawBuffer } = await fetchAudioBuffer(video.url);
    if (!rawBuffer || rawBuffer.length === 0) {
      return m.reply(beautifulMessage('❌ Gagal mengunduh audio.', { pushName: m.pushName }));
    }

    // Kompres kalau file terlalu besar (>8MB → 128kbps MP3)
    const mp3Buffer = await compressMp3(rawBuffer);
    if (!mp3Buffer || mp3Buffer.length === 0) {
      return m.reply(beautifulMessage('❌ Gagal memproses audio.', { pushName: m.pushName }));
    }

    // Kirim audio
    await sock.sendMessage(m.chat, {
      audio: mp3Buffer,
      mimetype: 'audio/mpeg',
      fileName: `${title}.mp3`,
      contextInfo: _mCtx(m.sender),
    }, { quoted: fakeQuoted });

    await m.react('✅');
  } catch (err) {
    console.error('[PLAY]', err);
    await m.react('❌');
    await m.reply(beautifulMessage(`❌ Gagal memutar lagu: ${err.message}`, { pushName: m.pushName }));
  }
}