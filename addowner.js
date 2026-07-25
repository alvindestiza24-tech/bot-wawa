// plugins/owner/addowner.js
import { addOwner, removeOwner, getOwnerList } from '../../src/lib/role-db.js'
import { norm } from '../../src/lib/role-db.js'  // ← pastikan role-db.js mengekspor norm

export const config_ = {
  name:        'addowner',
  alias:       ['delowner', 'listowner'],
  category:    'owner',
  description: 'Kelola owner tambahan (tersimpan di database)',
  usage:       '.addowner <nomor/@tag>\n.delowner <nomor/@tag>\n.listowner',
  example:     '.addowner 6281234567890',
  isOwner:     true,
  isPremium:   false,
  isGroup:     false,
  isPrivate:   false,
  cooldown:    3,
  isEnabled:   true,
}
export { config_ as config }

function resolveTarget(m) {
  let raw = ''
  if (m.quoted)                raw = m.quoted.sender || ''
  else if (m.mentionedJid?.length) raw = m.mentionedJid[0] || ''
  else if (m.args[0])          raw = m.args[0]
  // Gunakan norm langsung dari role-db (hanya digit)
  return norm(raw || '')
}

export async function handler(m) {
  const cmd    = m.command.toLowerCase()
  const isAdd  = cmd === 'addowner'
  const isDel  = cmd === 'delowner'
  const isList = cmd === 'listowner'

  if (isList) {
    const list = getOwnerList()
    if (!list.length) return m.reply('👑 Belum ada owner tambahan di database.')
    let txt = `👑 *DAFTAR OWNER DATABASE* (${list.length})\n\n`
    list.forEach((o, i) => {
      const num  = typeof o === 'string' ? o : o.number
      const name = typeof o === 'object' ? o.name || '-' : '-'
      txt += `${i + 1}. \`${num}\` — ${name}\n`
    })
    txt += `\n_Catatan: Owner hardcoded di config.js tidak tampil di sini._`
    return m.reply(txt)
  }

  const num = resolveTarget(m)
  if (!num || num.length < 10 || num.length > 15) {
    return m.reply(
      `👑 *${isAdd ? 'ADD' : 'DEL'} OWNER*\n\n` +
      `Masukkan nomor atau tag user\n\`Contoh: ${m.prefix}${cmd} 6281234567890\``
    )
  }

  try {
    if (isAdd) {
      const pushNm = m.text?.split(' ').slice(1).join(' ') || m.pushName || 'Owner'
      const result = addOwner(num, pushNm)
      if (!result.success) return m.reply(`❌ ${result.message}`)
      await m.react('👑')
      console.log(`[OWNER] ${num} ditambahkan sebagai owner`)
      return m.reply(`✅ \`${num}\` berhasil ditambah sebagai owner.`)
    }

    if (isDel) {
      const result = removeOwner(num)
      if (!result.success) return m.reply(`❌ ${result.message}`)
      await m.react('✅')
      console.log(`[OWNER] ${num} dihapus dari owner`)
      return m.reply(`✅ \`${num}\` berhasil dihapus dari owner.`)
    }
  } catch (err) {
    console.error('[OWNER]', err)
    return m.reply('❌ Gagal mengubah data owner. Periksa console log.')
  }
}