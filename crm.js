// plugins/owner/crm.js
import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'crm',
  alias: ['rm', 'relay', 'reversemsg', 'convrelay'],
  category: 'owner',
  description: 'CRM — relay pesan apapun, tampilkan kode relay, atau konversi raw JSON ke relay',
  usage: '.crm (reply) | .crm snip | .crm show | .crm json | .crm payload | .crm raw <json>',
  example: '.crm\n.crm snip\n.crm raw {"extendedTextMessage":{"text":"Halo"}}',
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  isEnabled: true,
}
export { config_ as config }

const AIRICH_PAYLOAD_LIMIT = 3500

function detectType(rawMsg) {
  if (!rawMsg) return 'unknown'
  if (rawMsg.botForwardedMessage) return 'botForwardedMessage'
  const skip = new Set(['senderKeyDistributionMessage', 'messageContextInfo'])
  return Object.keys(rawMsg).find(k => !skip.has(k)) || Object.keys(rawMsg)[0] || 'unknown'
}

function buildRelayCode(rawMsg) {
  const json = JSON.stringify(rawMsg, null, 2)
  const indented = json.split('\n').map((l, i) => i === 0 ? l : '  ' + l).join('\n')
  return `=> conn.relayMessage(\n  m.chat,\n  ${indented},\n  {}\n)`
}

function buildPayload(rawMsg) {
  const clean = { ...rawMsg }
  delete clean.senderKeyDistributionMessage
  return clean
}

function getIcon(type) {
  const ICONS = {
    conversation: '💬', extendedTextMessage: '💬', imageMessage: '🖼️', videoMessage: '🎬',
    audioMessage: '🎵', documentMessage: '📄', stickerMessage: '🎭', interactiveMessage: '🔘',
    buttonsMessage: '🔘', listMessage: '📋', pollCreationMessage: '📊', contactMessage: '👤',
    locationMessage: '📍', liveLocationMessage: '📍', reactionMessage: '👍',
    requestPaymentMessage: '💳', templateMessage: '📝', viewOnceMessage: '⏱️',
    botForwardedMessage: '🤖', default: '📦',
  }
  return ICONS[type] || ICONS.default
}

export async function handler(m, { sock }) {
  const args = m.args || []
  const mode = args[0]?.toLowerCase().replace(/^-/, '').trim() || ''
  const tmpDir = join(process.cwd(), 'storage', '.tmp')
  if (!existsSync(tmpDir)) await mkdir(tmpDir, { recursive: true })

  if (mode === 'raw') {
    const rawText = m.text?.trim() || ''
    if (!rawText) return m.reply('❌ Masukkan JSON mentah setelah .crm raw')
    let rawMsg
    try { rawMsg = JSON.parse(rawText) } catch { return m.reply('❌ Format JSON tidak valid.') }
    try {
      await sock.relayMessage(m.chat, rawMsg, {})
      await m.react('✅')
    } catch (err) {
      await m.react('❌')
      await m.reply(`❌ Relay gagal: \`${err.message}\``)
    }
    return
  }

  if (!m.quoted) {
    return m.reply(
      `❌ *Reply pesan* yang ingin di-relay dengan *.crm*\n\n` +
      `Mode:\n` +
      `• *.crm*         — relay pesan langsung\n` +
      `• *.crm snip*    — tampilkan kode relay + relay\n` +
      `• *.crm show*    — tampilkan kode relay saja (codeblock)\n` +
      `• *.crm json*    — kirim struktur JSON mentah sebagai file\n` +
      `• *.crm payload* — tampilkan payload mentah relay\n` +
      `• *.crm raw <json> — relay dari JSON teks`
    )
  }

  const rawMsg = m.quoted.message || m.quoted.raw?.message
  if (!rawMsg) return m.reply('❌ Pesan tidak memiliki struktur yang bisa di-relay.')

  await m.react('⏳')

  const type = detectType(rawMsg)
  const icon = getIcon(type)
  const code = buildRelayCode(rawMsg)
  const payload = buildPayload(rawMsg)

  if (mode === 'json') {
    const jsonStr = JSON.stringify(rawMsg, null, 2)
    const fname = `crm_${Date.now()}.json`
    const fp = join(tmpDir, fname)
    await writeFile(fp, jsonStr, 'utf-8')
    await sock.sendMessage(m.chat, {
      document: Buffer.from(jsonStr),
      fileName: fname,
      mimetype: 'application/json',
      caption: `📦 Raw JSON — \`${type}\``,
    }, { quoted: m.raw })
    setTimeout(() => unlink(fp).catch(() => {}), 15000)
    await m.react('✅')
    return
  }

  if (mode === 'payload') {
    const payloadStr = JSON.stringify(payload, null, 2)
    if (payloadStr.length > AIRICH_PAYLOAD_LIMIT) {
      const fname = `crm_payload_${Date.now()}.json`
      const fp = join(tmpDir, fname)
      await writeFile(fp, payloadStr, 'utf-8')
      await sock.sendMessage(m.chat, {
        document: Buffer.from(payloadStr),
        fileName: fname,
        mimetype: 'application/json',
        caption: `🧩 Payload — \`${type}\` (terlalu besar, dikirim sebagai file)`,
      }, { quoted: m.raw })
      setTimeout(() => unlink(fp).catch(() => {}), 15000)
    } else {
      try {
        await new AIRich(sock)
          .setTitle(`${icon} CRM Payload`)
          .addCode('json', payloadStr)
          .addText(`Type: \`${type}\``)
          .send(m.chat, { quoted: m.raw })
      } catch {
        await sock.sendMessage(m.chat, {
          text: `${icon} *CRM Payload — \`${type}\`*\n\n\`\`\`json\n${payloadStr.slice(0, 3000)}\n\`\`\``,
        }, { quoted: m.raw })
      }
    }
    await m.react('✅')
    return
  }

  if (mode === 'show') {
    if (code.length > AIRICH_PAYLOAD_LIMIT) {
      const fname = `crm_code_${Date.now()}.txt`
      const fp = join(tmpDir, fname)
      await writeFile(fp, code, 'utf-8')
      await sock.sendMessage(m.chat, {
        document: Buffer.from(code),
        fileName: fname,
        mimetype: 'text/javascript',
        caption: `${icon} CRM Code — \`${type}\` (terlalu besar)`,
      }, { quoted: m.raw })
      setTimeout(() => unlink(fp).catch(() => {}), 15000)
    } else {
      try {
        await new AIRich(sock)
          .setTitle(`${icon} CRM Relay Code (Show)`)
          .addCode('javascript', code)
          .addText(`Type: \`${type}\``)
          .addSuggest(['.crm', '.crm snip', '.crm json'])
          .send(m.chat, { quoted: m.raw })
      } catch {
        await sock.sendMessage(m.chat, {
          text: `${icon} *CRM — \`${type}\`*\n\n\`\`\`\n${code.slice(0, 3000)}\n\`\`\``,
        }, { quoted: m.raw })
      }
    }
    await m.react('✅')
    return
  }

  if (mode === 'snip') {
    if (code.length > AIRICH_PAYLOAD_LIMIT) {
      const fname = `crm_code_${Date.now()}.txt`
      const fp = join(tmpDir, fname)
      await writeFile(fp, code, 'utf-8')
      await sock.sendMessage(m.chat, {
        document: Buffer.from(code),
        fileName: fname,
        mimetype: 'text/javascript',
        caption: `${icon} CRM Code — \`${type}\` (terlalu besar, relay akan tetap dijalankan)`,
      }, { quoted: m.raw })
      setTimeout(() => unlink(fp).catch(() => {}), 15000)
    } else {
      try {
        await new AIRich(sock)
          .setTitle(`${icon} CRM Relay Code (Snip)`)
          .addCode('javascript', code)
          .addText(`Type: \`${type}\` — relay akan dikirim setelah ini.`)
          .addSuggest(['.crm show', '.crm json'])
          .send(m.chat, { quoted: m.raw })
      } catch {
        await sock.sendMessage(m.chat, {
          text: `${icon} *CRM Relay — \`${type}\`*\n\n\`\`\`\n${code.slice(0, 3000)}\n\`\`\``,
        }, { quoted: m.raw })
      }
    }
  }

  try {
    await sock.relayMessage(m.chat, rawMsg, {})
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Relay gagal: \`${err.message}\`\n\nGunakan *.crm json* untuk lihat struktur raw-nya.`)
  }
}