import { AIRich } from '../../src/lib/_build-m.js'
import { sf, bf, div, fl, ac, kr, beautifulMessage } from '../../src/lib/text-formater.js'
import { createFakeQuoted, _mCtx } from '../../src/lib/ctx.js'

export const config_ = {
  name: 'delete',
  alias: ['del', 'hapus', 'd'],
  category: 'group',
  description: 'Hapus pesan dengan reply',
  usage: '.delete (reply pesan)',
  example: '.delete',
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  isAdmin: true,
  isBotAdmin: false,
  cooldown: 3,
  isEnabled: true
}
export { config_ as config }

export async function handler(m, { sock, isOwner, isAdmin, isBotAdmin, groupMeta }) {
  if (!m.quoted) {
    return m.reply(beautifulMessage(
      `⚠️ ${sf('Reply pesan yang ingin dihapus!')}`,
      { pushName: m.pushName, theme: 'minimal' }
    ))
  }

  const quotedSender = m.quoted.sender || m.quoted.key?.participant
  const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
  const isOwnMessage = m.quoted.key?.fromMe || quotedSender === m.sender
  const isBotMessage = quotedSender === botJid || m.quoted.key?.fromMe

  // Cek izin hapus
  if (!isOwnMessage && !isBotMessage) {
    if (!isBotAdmin) {
      return m.reply(beautifulMessage(
        `⚠️ ${sf('Bot harus jadi admin untuk hapus pesan orang lain!')}`,
        { pushName: m.pushName, theme: 'minimal' }
      ))
    }
    if (!isAdmin && !isOwner) {
      return m.reply(beautifulMessage(
        `⚠️ ${sf('Hanya admin yang bisa hapus pesan orang lain!')}`,
        { pushName: m.pushName, theme: 'minimal' }
      ))
    }
  }

  try {
    const key = {
      remoteJid: m.chat,
      id: m.quoted.key.id,
      fromMe: m.quoted.key.fromMe,
      participant: quotedSender
    }

    await sock.sendMessage(m.chat, { delete: key })
    await m.react('✅')

  } catch (err) {
    if (err.message?.includes('not found') || err.message?.includes('forbidden')) {
      await m.reply(beautifulMessage(
        `❌ ${sf('Gagal menghapus!')}\n${sf('Pesan mungkin sudah dihapus atau terlalu lama.')}`,
        { pushName: m.pushName, theme: 'minimal' }
      ))
    } else {
      await m.react('❌')
    }
  }
}