import { getUserOrders }       from '../../src/lib/store-db.js'
import { renderMyOrders }      from '../../src/lib/store-formatter.js'
import { createFakeQuoted, _mCtx } from '../../src/lib/ctx.js'

export const config_ = {
  name:      'myorder',
  alias:     ['myorders', 'pesananku', 'orderku', 'riwayat'],
  category:  'store',
  description: 'Lihat riwayat pesananmu',
  usage:     '.myorder',
  example:   '.myorder',
  isOwner:   false, isPremium: false, isGroup: false,
  isPrivate: false, prefix: false, cooldown: 5, isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const gid    = m.isGroup ? m.chat : null
  const orders = getUserOrders(m.senderNumber, gid)
  const text   = renderMyOrders(orders, m.pushName || m.senderNumber)

  await sock.sendMessage(
    m.chat,
    { text, contextInfo: _mCtx(m.sender), mentions: [m.sender] },
    { quoted: createFakeQuoted() }
  )
}