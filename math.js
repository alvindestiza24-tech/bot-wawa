import { fileURLToPath } from 'url'

export function fmtPrice(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID')
}

export function fmtPct(n) {
  return Number(n || 0).toFixed(1).replace('.0', '') + '%'
}

export function fmtNum(n) {
  return Number(n || 0).toLocaleString('id-ID')
}

export function roundTo(n, nearest = 100) {
  return Math.round(Number(n) / nearest) * nearest
}

export function calcDiscount(price, pct) {
  const p      = Number(price)  || 0
  const d      = Math.min(Math.max(Number(pct) || 0, 0), 100)
  const amount = Math.round(p * d / 100)
  return { original: p, pct: d, amount, final: p - amount }
}

export function calcTax(price, pct) {
  const p      = Number(price) || 0
  const t      = Math.min(Math.max(Number(pct) || 0, 0), 100)
  const amount = Math.round(p * t / 100)
  return { base: p, pct: t, amount, total: p + amount }
}

export function calcTotal({ price, qty = 1, discountPct = 0, taxPct = 0 }) {
  const p        = Number(price) || 0
  const q        = Math.max(Number(qty) || 1, 1)
  const subtotal = p * q
  const disc     = calcDiscount(subtotal, discountPct)
  const tax      = calcTax(disc.final, taxPct)
  return {
    price, qty: q,
    subtotal,
    discountPct,
    discountAmount: disc.amount,
    afterDiscount:  disc.final,
    taxPct,
    taxAmount:      tax.amount,
    total:          tax.total,
  }
}

export function calcCommission(total, pct) {
  const t   = Number(total) || 0
  const p   = Math.min(Math.max(Number(pct) || 0, 0), 100)
  const com = Math.round(t * p / 100)
  return { total: t, pct: p, commission: com, net: t - com }
}

export function splitBill(total, n) {
  const t    = Number(total) || 0
  const num  = Math.max(Number(n) || 1, 1)
  const each = Math.floor(t / num)
  const rem  = t - each * num
  return { total: t, per: num, each, remainder: rem, perWithRem: each + rem }
}

export function percentOf(val, total) {
  const v = Number(val)   || 0
  const t = Number(total) || 0
  if (!t) return 0
  return Math.round((v / t) * 10000) / 100
}

export function compareGrowth(now, prev) {
  const n = Number(now)  || 0
  const p = Number(prev) || 0
  if (!p) return { pct: 0, direction: 'flat', diff: n }
  const diff = n - p
  const pct  = Math.round((diff / p) * 10000) / 100
  return {
    pct,
    direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat',
    diff,
    arrow: pct > 0 ? '↑' : pct < 0 ? '↓' : '→',
  }
}

export function calcStockValue(items) {
  return (items || []).reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.stock) || 0), 0)
}

export function calcRevenue(orders, status = 'completed') {
  return (orders || [])
    .filter(o => o.status === status)
    .reduce((s, o) => s + (Number(o.total) || 0), 0)
}

export function topCustomers(orders, limit = 10) {
  const map = new Map()
  for (const o of (orders || [])) {
    if (o.status !== 'completed') continue
    const k = o.senderNum
    if (!map.has(k)) map.set(k, { senderNum: k, pushName: o.pushName, total: 0, count: 0 })
    const e = map.get(k)
    e.total += Number(o.total) || 0
    e.count += 1
  }
  return [...map.values()].sort((a, b) => b.total - a.total).slice(0, limit)
}

export function orderStats(orders) {
  const all   = orders || []
  const done  = all.filter(o => o.status === 'completed')
  const pend  = all.filter(o => o.status === 'pending_owner')
  const pUser = all.filter(o => o.status === 'pending_user')
  const can   = all.filter(o => o.status === 'cancelled')
  const rev   = done.reduce((s, o) => s + (Number(o.total) || 0), 0)
  const avg   = done.length ? Math.round(rev / done.length) : 0

  return {
    total:          all.length,
    completed:      done.length,
    pendingOwner:   pend.length,
    pendingUser:    pUser.length,
    cancelled:      can.length,
    revenue:        rev,
    avgOrderValue:  avg,
    conversionRate: percentOf(done.length, all.length),
    cancelRate:     percentOf(can.length, all.length),
  }
}
