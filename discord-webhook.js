import { createHmac, randomBytes } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getDatabase } from '../database.js';
import config from '../../config.js';

const WEBHOOK_PATH = join(process.cwd(), 'storage', 'webhook.json');
const MAX_QUEUE = 50;
const BASE_DELAY = 10000;          // 10 detik normal
const CLOUDFLARE_COOLDOWN = 300000; // 5 menit jika kena Cloudflare block

let queue = [];
let processing = false;
let consecutive429 = 0;            // hitung berapa kali 429 berturut-turut
let cloudflareBlocked = false;     // flag jika terdeteksi Cloudflare

function getWebhookSecret() {
  const db = getDatabase();
  let secret = db.setting('webhookSecret');
  if (!secret) {
    secret = randomBytes(16).toString('hex');
    db.setting('webhookSecret', secret);
    db.save('settings');
  }
  return secret;
}

function verifySignature(data) {
  if (!data || !data.signature) return false;
  const secret = getWebhookSecret();
  const payload = JSON.stringify({ url: data.url, enabled: data.enabled });
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  return sig === data.signature;
}

function getValidWebhook() {
  try {
    if (!existsSync(WEBHOOK_PATH)) return null;
    const raw = readFileSync(WEBHOOK_PATH, 'utf-8');
    const data = JSON.parse(raw);
    if (!data.enabled || !data.url) return null;
    if (!verifySignature(data)) {
      console.warn('[WEBHOOK] Signature tidak valid, webhook diabaikan.');
      return null;
    }
    return data.url;
  } catch (err) {
    console.error('[WEBHOOK] Gagal membaca konfigurasi:', err.message);
    return null;
  }
}

function sanitize(str, maxLen = 1000) {
  if (!str) return '-';
  let clean = String(str).replace(/<[^>]*>/g, '').trim();
  if (clean.length > maxLen) clean = clean.slice(0, maxLen - 3) + '...';
  return clean;
}

// Cek apakah respon berupa halaman Cloudflare block
function isCloudflareBlock(text) {
  return text && (text.includes('Cloudflare') || text.includes('Access denied'));
}

async function processQueue() {
  if (processing) return;
  processing = true;

  while (queue.length > 0) {
    // Jika sedang di-block Cloudflare, jangan kirim apapun
    if (cloudflareBlocked) {
      console.warn('[WEBHOOK] Cloudflare block aktif, menunggu 5 menit...');
      await new Promise(r => setTimeout(r, CLOUDFLARE_COOLDOWN));
      cloudflareBlocked = false;
      consecutive429 = 0;
    }

    const { embed, url } = queue.shift();

    const botName = sanitize(config.bot?.name || 'WhatsApp Bot', 80);
    const avatarUrl = config.bot?.avatarUrl || '';

    const payload = {
      username: botName,
      avatar_url: avatarUrl,
      embeds: [embed],
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WhatsAppBot/1.0',
        },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });

      // Sukses
      if (res.ok) {
        consecutive429 = 0;
        console.log('[WEBHOOK] ✅ Notifikasi terkirim');
        await new Promise(r => setTimeout(r, BASE_DELAY));
        continue;
      }

      // Rate limit Discord
      if (res.status === 429) {
        consecutive429++;
        const wait = Math.min(15000 * Math.pow(2, consecutive429 - 1), 120000); // 15s, 30s, 60s, 120s
        console.warn(`[WEBHOOK] 429 Rate limit. Menunggu ${wait / 1000}s...`);
        queue.unshift({ embed, url }); // kembalikan ke depan antrian
        await new Promise(r => setTimeout(r, wait));
        continue;
      }

      // Cloudflare block / forbidden
      const text = await res.text().catch(() => '');
      if (res.status === 403 || res.status === 503 || isCloudflareBlock(text)) {
        console.error(`[WEBHOOK] Cloudflare block terdeteksi. Menunggu 5 menit.`);
        cloudflareBlocked = true;
        queue.unshift({ embed, url }); // kembalikan, akan dikirim setelah cooldown
        break; // keluar dari loop, biarkan cooldown di awal loop bekerja
      }

      console.error(`[WEBHOOK] Gagal (${res.status}):`, text.slice(0, 150));
    } catch (err) {
      console.error('[WEBHOOK] Network error:', err.message);
      // error network jangan langsung retry, tunggu BASE_DELAY
      await new Promise(r => setTimeout(r, BASE_DELAY));
    }
  }

  processing = false;
}

function addToQueue(embed) {
  const url = getValidWebhook();
  if (!url) return;

  if (queue.length >= MAX_QUEUE) {
    queue.shift();
    console.warn('[WEBHOOK] Antrian penuh, embed terlama dihapus.');
  }

  queue.push({ embed, url });
  processQueue();
}

export async function notifyConnection(botNumber, botName) {
  const embed = {
    title: '🟢 Bot Connected',
    color: 0x2ecc71,
    fields: [
      { name: 'Nomor Bot', value: sanitize(botNumber, 100), inline: true },
      { name: 'Nama Bot', value: sanitize(botName, 100), inline: true },
      { name: 'Waktu', value: new Date().toLocaleString('id-ID'), inline: false },
    ],
    footer: { text: 'WhatsApp Bot Monitor' },
    timestamp: new Date().toISOString(),
  };
  addToQueue(embed);
}

export async function notifyCommand(senderNumber, pushName, command, args, chatId, isGroup) {
  const embed = {
    title: '⚡ Command Executed',
    color: 0x3498db,
    fields: [
      {
        name: 'Pengirim',
        value: `${sanitize(pushName, 50)}\n\`${sanitize(senderNumber, 30)}\``,
        inline: true,
      },
      { name: 'Command', value: `\`${sanitize(command, 100)}\``, inline: true },
      { name: 'Args', value: sanitize(args.join(' ') || '-', 1000), inline: false },
      {
        name: 'Chat',
        value: isGroup ? `Group: \`${sanitize(chatId, 100)}\`` : 'Private Chat',
        inline: false,
      },
    ],
    footer: { text: 'WhatsApp Bot Monitor' },
    timestamp: new Date().toISOString(),
  };
  addToQueue(embed);
}