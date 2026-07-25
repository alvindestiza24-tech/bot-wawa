// src/lib/coupon-store.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', '..', 'storage', 'data', 'store', 'coupons.json')

let _cache = null
const CACHE_TTL = 15_000
let cacheTs = 0

function ensureDir() {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function readCoupons() {
  ensureDir()
  const now = Date.now()
  if (_cache && now - cacheTs < CACHE_TTL) return _cache
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeCoupons({ coupons: [] })
      return { coupons: [] }
    }
    _cache = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
    cacheTs = now
    return _cache
  } catch {
    return { coupons: [] }
  }
}

function writeCoupons(data) {
  ensureDir()
  const tmp = DB_PATH + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, DB_PATH)
  _cache = data
  cacheTs = Date.now()
}

export function getCoupons(includeExpired = false) {
  const { coupons } = readCoupons()
  const now = new Date()
  return includeExpired ? coupons : coupons.filter(c => {
    if (c.expiresAt && new Date(c.expiresAt) < now) return false
    if (c.maxUsage && c.used >= c.maxUsage) return false
    return c.enabled
  })
}

export function getCoupon(code) {
  return getCoupons().find(c => c.code === code.toUpperCase()) || null
}

export function addCoupon(data) {
  const db = readCoupons()
  if (db.coupons.find(c => c.code === data.code.toUpperCase())) return { success: false, message: 'Kode sudah ada' }
  db.coupons.push({
    code: data.code.toUpperCase(),
    type: data.type, // 'percent' | 'fixed'
    value: Number(data.value),
    minOrder: Number(data.minOrder) || 0,
    maxDiscount: Number(data.maxDiscount) || 0,
    expiresAt: data.expiresAt || null,
    maxUsage: Number(data.maxUsage) || 0,
    used: 0,
    enabled: true,
    createdAt: new Date().toISOString()
  })
  writeCoupons(db)
  return { success: true, message: `Kupon ${data.code} ditambahkan` }
}

export function deleteCoupon(code) {
  const db = readCoupons()
  const idx = db.coupons.findIndex(c => c.code === code.toUpperCase())
  if (idx === -1) return { success: false, message: 'Kupon tidak ditemukan' }
  db.coupons.splice(idx, 1)
  writeCoupons(db)
  return { success: true, message: 'Kupon dihapus' }
}

export function useCoupon(code, orderTotal) {
  const db = readCoupons()
  const coupon = db.coupons.find(c => c.code === code.toUpperCase())
  if (!coupon || !coupon.enabled) return { success: false, message: 'Kupon tidak valid' }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return { success: false, message: 'Kupon kadaluarsa' }
  if (coupon.maxUsage && coupon.used >= coupon.maxUsage) return { success: false, message: 'Kuota kupon habis' }
  if (orderTotal < coupon.minOrder) return { success: false, message: `Minimal order Rp ${coupon.minOrder.toLocaleString('id-ID')}` }

  let discount = 0
  if (coupon.type === 'percent') {
    discount = Math.round(orderTotal * coupon.value / 100)
    if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount
  } else {
    discount = Math.min(coupon.value, orderTotal)
  }

  coupon.used++
  writeCoupons(db)
  return { success: true, discount, coupon }
}