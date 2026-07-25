// plugins/owner/settelegram.js
import { createHmac } from 'crypto';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { getDatabase } from '../../src/database.js';

const TELEGRAM_PATH = join(process.cwd(), 'storage', 'telegram.json');

export const config_ = {
  name: 'settelegram',
  alias: ['stg'],
  category: 'owner',
  description: 'Atur notifikasi Telegram (owner only)',
  usage: '.settelegram <token> <chatId>',
  example: '.settelegram 123456:ABC-DEF 987654321',
  isOwner: true,
  isEnabled: true,
};
export { config_ as config };

export async function handler(m, { sock }) {
  const token = m.args[0]?.trim();
  const chatId = m.args[1]?.trim();

  if (!token || token === 'off') {
    // Matikan
    if (existsSync(TELEGRAM_PATH)) {
      unlinkSync(TELEGRAM_PATH);
      await m.reply('✅ Notifikasi Telegram dinonaktifkan.');
    } else {
      await m.reply('ℹ️ Notifikasi Telegram sudah dalam keadaan mati.');
    }
    return;
  }

  if (!chatId || isNaN(chatId)) {
    return m.reply('❌ Format: .settelegram <token> <chatId>\nContoh: .settelegram 123456:ABC-DEF 987654321');
  }

  const db = getDatabase();
  let secret = db.setting('webhookSecret');
  if (!secret) {
    const { randomBytes } = await import('crypto');
    secret = randomBytes(16).toString('hex');
    db.setting('webhookSecret', secret);
    db.save('settings');
  }

  const data = { token, chatId, enabled: true };
  const payload = JSON.stringify({ token: data.token, chatId: data.chatId, enabled: data.enabled });
  data.signature = createHmac('sha256', secret).update(payload).digest('hex');

  writeFileSync(TELEGRAM_PATH, JSON.stringify(data, null, 2));
  await m.reply('✅ Notifikasi Telegram berhasil diaktifkan.');
}