import { AIRich }    from '../../src/lib/_build-m.js'
import { getOrders } from '../../src/lib/store-db.js'
import { topCustomers, orderStats, fmtPrice, fmtPct, percentOf } from '../../src/lib/math.js'
import { sf, nowTime, nowDate } from '../../src/lib/store-formatter.js'

const BOLD = {
  a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',k:'𝗸',l:'𝗹',m:'𝗺',
  n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',y:'𝘆',z:'𝘇',
  A:'𝗔',B:'𝗕',C:'𝗖',D:'𝗗',E:'𝗘',F:'𝗙',G:'𝗚',H:'𝗛',I:'𝗜',J:'𝗝',K:'𝗞',L:'𝗟',M:'𝗠',
  N:'𝗡',O:'𝗢',P:'𝗣',Q:'𝗤',R:'𝗥',S:'𝗦',T:'𝗧',U:'𝗨',V:'𝗩',W:'𝗪',X:'𝗫',Y:'𝗬',Z:'𝗭',
}
const bf      = t => String(t).split('').map(c => BOLD[c] ?? c).join('')
const MEDALS  = ['🥇','🥈','🥉']
const FLOWERS = ['🌷','🌸','🪷','🌺','🌼','🍀','🪻']
const ACCENTS = ['𓄼','𓈒','𖹭','✿⃘','ε⃘з','𑣿','𓂃','𖥻']
const rnd     = arr => arr[Math.floor(Math.random() * arr.length)]

export const config_ = {
  name:      'topcust',
  alias:     ['topcustomer','topbuyer','leaderboard','topshopper'],
  category:  'store',
  description: 'Top 10 customer terbesar',
  usage:     '.topcust',
  example:   '.topcust',
  isOwner:   false, isPremium: false, isGroup: false,
  isPrivate: false, prefix: false, cooldown: 10, isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const gid        = m.isGroup ? m.chat : null
  const { orders } = getOrders(gid)
  const limit      = Math.min(parseInt(m.args?.[0]) || 10, 20)
  const tops       = topCustomers(orders, limit)
  const stats      = orderStats(orders)

  if (!tops.length) {
    return m.reply(
      `꒰ topcust ꒱\n\n` +
      `─ 𐴲᭡ ${sf('belum ada transaksi selesai')} ✧`
    )
  }

  const f = rnd(FLOWERS)
  const a = rnd(ACCENTS)

  const headerText = [
    `⡔⢤⡀      ⣠⡤⢠`,
    `⠓⣶⣿⠶⢾⡿⠶⠊`,
    `   ⢸⡏    ⢻⡆ㅤ—┈ ${sf('top customer')} .. 👑 ׄ ˖`,
    `  ⠈⢿  ׄ ⸼ 귀여운  ǂ  ${sf('leaderboard belanja')} 𖹭.ᐟ`,
    `ㅤㅤ ㅤㅤ╰┈${sf('store ranking')} .. +44 ⸼`,
    ``,
    `ㅤ   ╭┈ 𐙚 ׄ *${bf('Store Stats')}* ─ׁ┈ ${f} ┈`,
    `ㅤ⸼ ᥴ⃘ᦱ *${sf('time')}* ⦂ ${nowTime()}`,
    `ㅤ⸼ ᥴ⃘ᦱ *${sf('date')}* ⦂ ${nowDate()}`,
    `ㅤ⸼ ᥴ⃘ᦱ *${sf('total revenue')}* ⦂ *${fmtPrice(stats.revenue)}*`,
    `ㅤ⸼ ᥴ⃘ᦱ *${sf('order selesai')}* ⦂ ${stats.completed} (${fmtPct(stats.conversionRate)})`,
    `ㅤ⸼ ᥴ⃘ᦱ *${sf('rata-rata order')}* ⦂ ${fmtPrice(stats.avgOrderValue)}`,
    `  ㅤ ╰┈֪┈──ׁ──┈֪┈──ׁ──┈֪┈──╯`,
  ].join('\n')

  const tableRows = [
    ['𝗥𝗮𝗻𝗸','𝗡𝗮𝗺𝗮','𝗧𝗼𝘁𝗮𝗹 𝗕𝗲𝗹𝗮𝗻𝗷𝗮','𝗢𝗿𝗱𝗲𝗿','𝗦𝗵𝗮𝗿𝗲'],
    ...tops.map((c, i) => [
      MEDALS[i] || `#${i + 1}`,
      sf(c.pushName || c.senderNum).slice(0, 14),
      fmtPrice(c.total),
      `${c.count}x`,
      `${fmtPct(percentOf(c.total, stats.revenue))}`,
    ]),
  ]

  const podiumTable  = tops.slice(0, 3).map((c, i) => [
    MEDALS[i], sf(c.pushName || c.senderNum), String(c.count), fmtPrice(c.total), fmtPct(percentOf(c.total, stats.revenue)),
  ])
  const podiumHeader = ['𝗠𝗲𝗱𝗮𝗹','𝗖𝘂𝘀𝘁𝗼𝗺𝗲𝗿','𝗢𝗿𝗱𝗲𝗿','𝗥𝗲𝘃𝗲𝗻𝘂𝗲','𝗦𝗵𝗮𝗿𝗲']
  const footerText   = [
    `  ۪   ִֶָ ׁ  ּ  ֗  ִ ۫  ִֶָ ִ    ۪ ᳀  ִֶָ ִ  ۫`,
    `ㅤ‹ 𖹭 *${sf(`top ${tops.length} dari ${stats.completed} order`)}*`,
    ` ${a} 사랑 쇼핑 ${f} ♡`,
  ].join('\n')

  try {
    await new AIRich(sock)
      .setTitle(`👑 ${bf('TOP CUSTOMER')}`)
      .addText(headerText)
      .addTip(`${a} ${sf('Ranking berdasarkan total belanja yang sudah selesai')} ${f}`)
      .addTable([podiumHeader, ...podiumTable])
      .addText(`\n## ${bf('Full Leaderboard')}\n`)
      .addTable(tableRows)
      .addText(footerText)
      .addSuggest([`${sf('myorder')}`, `${sf('list')}`, `${sf('buy')}`])
      .send(m.chat, { quoted: m.raw })
    await m.react('👑')
  } catch (err) {
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}