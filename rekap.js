import { getAllCategories, getOrders, getStoreStats } from '../../src/lib/store-db.js'
import { generateRekapExcel } from '../../src/lib/rekap-excel.js'
import { beautifulMessage }   from '../../src/lib/text-formater.js'

export const config_ = {
  name:      'rekap',
  alias:     ['export', 'excel', 'laporan'],
  category:  'store',
  description: 'Export rekap toko ke file Excel',
  usage:     '.rekap',
  example:   '.rekap',
  isOwner:   true, isPremium: false, isGroup: false,
  isPrivate: false, prefix: false, cooldown: 10, isEnabled: true,
}
export { config_ as config }

function fmtP(n) { return Number(n).toLocaleString('id-ID') }

export async function handler(m, { sock }) {
  const gid  = m.isGroup ? m.chat : null
  await m.react('⏳')
  try {
    const cats = getAllCategories(gid)
    const ord  = getOrders(gid)
    const stat = getStoreStats(gid)
    const { filePath, filename, buffer } = await generateRekapExcel(cats, ord, stat)
    await m.react('✅')
    await sock.sendMessage(m.chat, {
      document: buffer,
      fileName: filename,
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      caption:
        `📊 *Rekap Toko*\n\n` +
        `╭─── Statistik\n` +
        `│ Kategori   : ${stat.totalCategories}\n` +
        `│ Total Item : ${stat.totalItems}\n` +
        `│ Stok       : ${stat.totalStock}\n` +
        `│ Revenue    : Rp ${fmtP(stat.totalRevenue)}\n` +
        `╰───\n` +
        `_${new Date().toLocaleString('id-ID')}_`,
    }, { quoted: m.raw })
    const fs = await import('fs')
    fs.default.unlinkSync(filePath)
  } catch (err) {
    await m.react('❌')
    await m.reply(beautifulMessage(`❌ Gagal generate Excel: ${err.message}`, { pushName: m.pushName }))
  }
}