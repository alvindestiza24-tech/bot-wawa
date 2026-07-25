import { getCoupons, addCoupon, deleteCoupon } from '../../src/lib/coupon-store.js'
import { AIRich } from '../../src/lib/_build-m.js'
import { sf, fmtPrice } from '../../src/lib/store-formatter.js'
import config from '../../config.js'

export const config_ = {
  name: 'coupon',
  alias: ['kupon', 'voucher'],
  category: 'store',
  description: 'Kelola kupon diskon (owner)',
  usage: '.addcoupon <kode>|<tipe>|<nilai>|<minorder>|<maxdisc>|<maxusage>|<expiry>\n.listcoupon\n.delcoupon <kode>',
  isOwner: true,
    prefix : false,
  cooldown: 2,
  isEnabled: true
}
export { config_ as config }

function parseCouponArgs(text) {
  return text.split('|').map(s => s.trim())
}

export async function handler(m, { sock }) {
  const cmd = m.command?.toLowerCase()
  const text = m.text?.trim() || ''

  if (cmd === 'addcoupon') {
    const parts = parseCouponArgs(text)
    if (parts.length < 3) return m.reply('Format: _.addcoupon <kode>|<tipe: percent/fixed>|<nilai>|<minorder>|<maxdisc>|<maxusage>|<expiry ISO>_')
    const [code, type, value, minOrder = '0', maxDiscount = '0', maxUsage = '0', expiresAt = ''] = parts
    if (!['percent', 'fixed'].includes(type)) return m.reply('Tipe harus *percent* atau *fixed*')
    const result = addCoupon({
      code, type, value: Number(value), minOrder: Number(minOrder),
      maxDiscount: Number(maxDiscount), maxUsage: Number(maxUsage),
      expiresAt: expiresAt || null
    })
    return m.reply(result.success ? `✅ ${result.message}` : `❌ ${result.message}`)
  }

  if (cmd === 'delcoupon') {
    if (!text) return m.reply('Format: _.delcoupon <kode>_')
    const result = deleteCoupon(text)
    return m.reply(result.success ? `✅ ${result.message}` : `❌ ${result.message}`)
  }

  // listcoupon (default)
  const coupons = getCoupons(true) // termasuk expired
  if (!coupons.length) return m.reply('Belum ada kupon.')

  const rows = [
    ['Kode', 'Tipe', 'Nilai', 'Min', 'Max Disc', 'Terpakai', 'Expired']
  ]
  coupons.forEach(c => {
    rows.push([
      c.code,
      c.type,
      c.type === 'percent' ? c.value + '%' : fmtPrice(c.value),
      fmtPrice(c.minOrder),
      c.maxDiscount ? fmtPrice(c.maxDiscount) : '-',
      c.maxUsage ? `${c.used}/${c.maxUsage}` : `${c.used}`,
      c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('id-ID') : 'Selamanya'
    ])
  })

  try {
    await new AIRich(sock)
      .setTitle('🎟️ Daftar Kupon')
      .addText(`Total: ${coupons.length} kupon`)
      .addTable(rows)
      .send(m.chat, { quoted: m.raw })
  } catch (err) {
    await m.reply('Gagal menampilkan daftar kupon.')
  }
}