// src/lib/wishlist-store.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', '..', 'storage', 'data', 'store', 'wishlists.json')

function ensureDir() {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function read() {
  ensureDir()
  try {
    if (!fs.existsSync(DB_PATH)) return {}
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
  } catch { return {} }
}

function write(data) {
  ensureDir()
  fs.writeFileSync(DB_PATH + '.tmp', JSON.stringify(data, null, 2))
  fs.renameSync(DB_PATH + '.tmp', DB_PATH)
}

export function addToWishlist(sender, { categoryKey, itemId }) {
  const data = read()
  if (!data[sender]) data[sender] = []
  if (data[sender].find(i => i.categoryKey === categoryKey && i.itemId === itemId))
    return { success: false, message: 'Sudah di wishlist' }
  data[sender].push({ categoryKey, itemId, addedAt: new Date().toISOString() })
  write(data)
  return { success: true }
}

export function removeFromWishlist(sender, categoryKey, itemId) {
  const data = read()
  if (!data[sender]) return { success: false, message: 'Wishlist kosong' }
  const idx = data[sender].findIndex(i => i.categoryKey === categoryKey && i.itemId === itemId)
  if (idx === -1) return { success: false, message: 'Tidak ditemukan' }
  data[sender].splice(idx, 1)
  write(data)
  return { success: true }
}

export function getWishlist(sender) {
  return (read()[sender] || [])
}

export function clearWishlist(sender) {
  const data = read()
  delete data[sender]
  write(data)
}