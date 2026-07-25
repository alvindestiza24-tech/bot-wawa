// plugins/owner/setwebhook.js
import { createHmac } from 'crypto';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { getDatabase } from '../../src/database.js';

const WEBHOOK_PATH = join(process.cwd(), 'storage', 'webhook.json');

export const config_ = {
  name: 'setwebhook',
  alias: ['swh'],
  category: 'owner',
  description: 'Atur Discord webhook (owner only)',
  usage: '.setwebhook <url>',
  example: '.setwebhook https://discord.com/api/webhooks/...',
  isOwner: true,
  isEnabled: true,
};
export { config_ as config };

export async function handler(m, { sock }) {
  const arg = m.args[0]?.trim();

  if (!arg || arg === 'off') {
    if (existsSync(WEBHOOK_PATH)) {
      unlinkSync(WEBHOOK_PATH);
      await m.reply('✅ Webhook Discord dinonaktifkan.');
    } else {
      await m.reply('ℹ️ Webhook sudah dalam keadaan mati.');
    }
    return;
  }

  if (!arg.startsWith('https://discord.com/api/webhooks/')) {
    return m.reply('❌ URL tidak valid. Harus webhook Discord.');
  }

  const db = getDatabase();
  let secret = db.setting('webhookSecret');
  if (!secret) {
    // Generate secret if not exists (seharusnya sudah ada dari webhook module)
    const { randomBytes } = await import('crypto');
    secret = randomBytes(16).toString('hex');
    db.setting('webhookSecret', secret);
    db.save('settings');
  }

  const data = { url: arg, enabled: true };
  const payload = JSON.stringify({ url: data.url, enabled: data.enabled });
  data.signature = createHmac('sha256', secret).update(payload).digest('hex');

  writeFileSync(WEBHOOK_PATH, JSON.stringify(data, null, 2));
  await m.reply('✅ Webhook Discord berhasil diaktifkan.');
}