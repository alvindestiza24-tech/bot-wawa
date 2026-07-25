import { getDatabase }                  from '../../src/database.js'
import { getStoreDir, getStoreModeLabel } from '../../src/lib/store-db.js'
import { AIRich }                       from '../../src/lib/_build-m.js'

export const config_ = {
  name:        'setstoremode',
  alias:       ['storemode', 'setstore'],
  category:    'group',
  description: 'Atur mode store grup: global (bersama) atau grup (toko sendiri)',
  usage:       '.setstoremode global|grup',
  example:     '.setstoremode grup',
  isOwner:     false,
  isPremium:   false,
  isGroup:     true,
  isAdmin:     true,
  isBotAdmin:  false,
  cooldown:    5,
  isEnabled:   true,
}
export { config_ as config }

export async function handler(m, { sock, isOwner }) {
  const arg  = (m.args[0] || '').toLowerCase().trim()
  const db   = getDatabase()
  const gid  = m.chat

  const current = getStoreModeLabel(gid)

  if (!arg) {
    return new AIRich(sock)
      .setTitle('🏪 Store Mode')
      .addText(
        `Mode store saat ini: *${current}*\n\n` +
        `• *global* — semua grup pakai produk & pesanan bersama\n` +
        `• *grup*   — grup ini punya toko sendiri yang terpisah`
      )
      .addSuggest(['.setstoremode global', '.setstoremode grup'])
      .send(m.chat, { quoted: m.raw })
  }

  if (!['global', 'grup'].includes(arg)) {
    return m.reply('❌ Mode tidak valid. Gunakan: `.setstoremode global` atau `.setstoremode grup`')
  }

  if (arg === current) {
    return m.reply(`ℹ️ Mode store sudah *${current}*, tidak ada perubahan.`)
  }

  const group = db.getGroup(gid) || {}
  group.storeMode = arg
  db.setGroup(gid, group)

  if (arg === 'grup') {
    const dir = getStoreDir(gid)
    await new AIRich(sock)
      .setTitle('🏪 Store Mode → Grup')
      .addText(
        `✅ Mode store diubah ke *grup*.\n\n` +
        `Grup ini sekarang punya toko sendiri yang terpisah.\n` +
        `Data toko disimpan di: \`${dir.split('storage/data/store/')[1] || dir}\`\n\n` +
        `⚠️ Produk dan pesanan dari mode global *tidak* dipindahkan secara otomatis.`
      )
      .addTip('Gunakan .addcat untuk menambah kategori produk di toko grup ini.')
      .send(m.chat, { quoted: m.raw })
  } else {
    await new AIRich(sock)
      .setTitle('🏪 Store Mode → Global')
      .addText(
        `✅ Mode store diubah ke *global*.\n\n` +
        `Grup ini sekarang menggunakan toko bersama (global).\n` +
        `Data toko lokal grup tidak dihapus, hanya tidak aktif.`
      )
      .send(m.chat, { quoted: m.raw })
  }
}