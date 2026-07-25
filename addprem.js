import { addPremium, removePremium, getPremiumList, getPremiumInfo } from '../../src/lib/role-db.js'
import { normalizeNumber } from '../../src/lib/function.js'

export const config_ = {
  name:        'addprem',
  alias:       ['addpremium', 'delprem', 'delpremium', 'listprem', 'infoprem'],
  category:    'owner',
  description: 'Kelola premium users',
  usage:       '.addprem <nomor/@tag> [hari]\n.delprem <nomor/@tag>\n.listprem\n.infoprem <nomor>',
  example:     '.addprem 6281234567890 30',
  isOwner:     true,
  isPremium:   false,
  isGroup:     false,
  isPrivate:   false,
  cooldown:    3,
  isEnabled:   true,
}
export { config_ as config }

function extractTarget(m) {
  if (m.quoted)                return m.quoted.sender?.replace(/[^0-9]/g, '') || ''
  if (m.mentionedJid?.length)  return m.mentionedJid[0]?.replace(/[^0-9]/g, '') || ''
  if (m.args?.length)          return m.args[0].replace(/[^0-9]/g, '')
  return ''
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function remainingDays(isoStr) {
  const diff = new Date(isoStr) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export async function handler(m) {
  const cmd   = m.command.toLowerCase()
  const isAdd  = ['addprem', 'addpremium'].includes(cmd)
  const isDel  = ['delprem', 'delpremium'].includes(cmd)
  const isList = cmd === 'listprem'
  const isInfo = cmd === 'infoprem'

  if (isList) {
    const list = getPremiumList()
    if (!list.length) return m.reply('💎 Belum ada user premium.')

    let txt = `💎 *DAFTAR PREMIUM* (${list.length} user)\n\n`
    list.forEach((p, i) => {
      const num   = p.number || p.jid || p
      const sisa  = p.expiredAt ? `${remainingDays(p.expiredAt)}h` : 'Permanent'
      const exp   = p.expiredAt ? fmtDate(p.expiredAt) : '-'
      txt += `${i + 1}. \`${num}\`\n`
      txt += `   └ Sisa: *${sisa}* | Exp: ${exp}\n`
    })
    return m.reply(txt)
  }

  if (isInfo) {
    const raw = extractTarget(m)
    if (!raw) return m.reply(`❌ Masukkan nomor atau tag user\n\`Contoh: ${m.prefix}infoprem 6281234\``)
    const num  = normalizeNumber(raw)
    const info = getPremiumInfo(num)
    if (!info) return m.reply(`❌ \`${num}\` bukan user premium.`)

    const sisa = info.expiredAt ? `${remainingDays(info.expiredAt)} hari` : 'Permanent'
    return m.reply(
      `💎 *INFO PREMIUM*\n\n` +
      `📱 Nomor: \`${num}\`\n` +
      `📅 Daftar: ${info.addedAt ? fmtDate(info.addedAt) : '-'}\n` +
      `⏳ Sisa: *${sisa}*\n` +
      `🗓️ Expired: ${info.expiredAt ? fmtDate(info.expiredAt) : '-'}`
    )
  }

  const raw = extractTarget(m)
  if (!raw) {
    const act = isAdd ? 'ADD' : 'DEL'
    return m.reply(
      `💎 *${act} PREMIUM*\n\n` +
      `Masukkan nomor atau tag user\n\`Contoh: ${m.prefix}${cmd} 6281234567890${isAdd ? ' 30' : ''}\``
    )
  }

  const num = normalizeNumber(raw)
  if (num.length < 10 || num.length > 15) return m.reply('❌ Format nomor tidak valid.')

  if (isAdd) {
    const days    = parseInt(m.args?.find(a => /^\d+$/.test(a) && a.length <= 4)) || 30
    const pushNm  = m.pushName || 'User'
    const result  = addPremium(num, days, pushNm)

    await m.react('💎')
    return m.reply(
      `✅ *${result.message}*\n\n` +
      `📱 Nomor: \`${num}\`\n` +
      `⏳ Durasi: *${days} hari*\n` +
      `🗓️ Expired: *${fmtDate(result.expiredAt)}*`
    )
  }

  if (isDel) {
    const result = removePremium(num)
    if (!result.success) return m.reply(`❌ ${result.message}`)
    await m.react('✅')
    return m.reply(`✅ Berhasil menghapus \`${num}\` dari premium.`)
  }
}