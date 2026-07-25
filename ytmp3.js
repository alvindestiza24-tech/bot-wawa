import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const YOUTUBE_ID_REGEX = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
const run = promisify(exec);

function extractVideoId(url) {
  return String(url || '').match(YOUTUBE_ID_REGEX)?.[1] || null;
}

// Fallback: download MP3 via akuari.my.id
async function akuariYtmp3(url) {
  try {
    const { data } = await axios.get(`https://api.akuari.my.id/downloader/ytmp3`, {
      params: { link: url },
      timeout: 30000,
      maxRedirects: 5,
    });
    if (data?.status && data?.hasil?.url) {
      return {
        status: true,
        title: data.hasil.title || 'YouTube Audio',
        dl: data.hasil.url,
      };
    }
    return { status: false, mess: 'Gagal mendapatkan audio dari akuari' };
  } catch (err) {
    return { status: false, mess: 'Akuari error: ' + err.message };
  }
}

// Fallback ke MP3 buffer dari URL
async function fallbackToMp3Buffer(url) {
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const id = crypto.randomBytes(6).toString('hex');
  const inputPath = path.join(tempDir, `ytfb_${id}.bin`);
  const outputPath = path.join(tempDir, `ytfb_${id}.mp3`);

  try {
    const { data } = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60000,
      maxRedirects: 10,
    });

    const buffer = Buffer.from(data);
    if (!buffer.length) throw new Error('Audio fallback kosong');
    fs.writeFileSync(inputPath, buffer);

    await run(
      `ffmpeg -y -i "${inputPath}" -vn -map_metadata -1 -ac 2 -ar 44100 -c:a libmp3lame -b:a 192k "${outputPath}"`,
      { timeout: 120000 }
    );

    const mp3Buffer = fs.readFileSync(outputPath);
    if (!mp3Buffer.length) throw new Error('Konversi fallback ke MP3 gagal');
    return mp3Buffer;
  } finally {
    try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
  }
}

async function ytdl(url, format = 'mp3') {
  try {
    const videoId = extractVideoId(url);
    if (!videoId) {
      // Coba fallback ke akuari
      return await akuariYtmp3(url);
    }

    const normalizedFormat = String(format || 'mp3').toLowerCase() === 'mp4' ? 'mp4' : 'mp3';

    const client = axios.create({
      timeout: 60000,
      maxRedirects: 10,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 16; NX729J) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7271.123 Mobile Safari/537.36',
        Referer: 'https://id.ytmp3.mobi/',
      },
    });

    const { data: init } = await client.get('https://d.ymcdn.org/api/v1/init', {
      params: { p: 'y', 23: '1llum1n471', _: Math.random() },
    });

    if (!init?.convertURL) {
      // Fallback ke akuari
      return await akuariYtmp3(url);
    }

    const { data: convert } = await client.get(init.convertURL, {
      params: { v: videoId, f: normalizedFormat, _: Math.random() },
    });

    if (!convert?.progressURL || !convert?.downloadURL) {
      // Fallback ke akuari
      return await akuariYtmp3(url);
    }

    let progress = 0;
    let title = convert.title || '';
    let attempts = 0;
    const maxAttempts = 20;

    while (progress < 3 && attempts < maxAttempts) {
      const { data } = await client.get(convert.progressURL);
      if ((data?.error || 0) > 0) {
        return { status: false, mess: `Error dari server: ${data.error}` };
      }
      progress = Number(data?.progress || 0);
      title = data?.title || title;
      if (progress < 3) {
        attempts += 1;
        await new Promise(resolve => setTimeout(resolve, 250));
      }
    }

    if (attempts >= maxAttempts && progress < 3) {
      return { status: false, mess: 'Request timeout (proses terlalu lama).' };
    }

    return { status: true, title, dl: convert.downloadURL };
  } catch (e) {
    return { status: false, mess: `System Error: ${e.message}` };
  }
}

export { ytdl, fallbackToMp3Buffer };