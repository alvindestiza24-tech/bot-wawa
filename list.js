import { getAllCategories } from '../../src/lib/store-db.js'
import { renderCatalog }   from '../../src/lib/store-formatter.js'
import { createFakeQuoted, _mCtx } from '../../src/lib/ctx.js'
import config from '../../config.js'

export const config_ = {
  name:      'list',
  alias:     ['katalog', 'catalog', 'produk'],
  category:  'store',
  description: 'Tampilkan semua kategori produk',
  usage:     'list',
  example:   'list',
  isOwner:   false, isPremium: false, isGroup: false,
  isPrivate: false, prefix: false, cooldown: 5, isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const gid  = m.isGroup ? m.chat : null
  const cats = getAllCategories(gid)
  const keys = Object.keys(cats)

  if (!keys.length) {
    return m.reply(
      `꒰ ${config.bot.name} ꒱\n\n` +
      `Belum ada produk yang tersedia.\n` +
      `Hubungi owner untuk info lebih lanjut.`
    )
  }

  const prefix = Array.isArray(config.command?.prefix)
    ? config.command.prefix[0] : config.command?.prefix || '.'

  const items = keys.map(k => cats[k].name || k)

  const text = renderCatalog({
    pushName: m.pushName || m.senderNumber,
    items,
    catEmoji: '🩰',
    catName:  'list',
    note: [
      `${prefix === '.' ? '' : prefix}ketik 1 nama produk diatas yang dicari`,
      `semua transaksi only admin`,
      `sebelum tf wajib bertanya`,
      `no chat/call bot ini!`,
    ],
  })

  await sock.sendMessage(
    m.chat,
    { text, contextInfo: _mCtx(m.sender), mentions: [m.sender] },
    { quoted: createFakeQuoted() }
  )
}