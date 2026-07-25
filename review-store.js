// src/lib/review-store.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', '..', 'storage', 'data', 'store', 'reviews.json')

function ensureDir() {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function read() {
  ensureDir()
  try {
    if (!fs.existsSync(DB_PATH)) return []
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
  } catch { return [] }
}

function write(data) {
  ensureDir()
  fs.writeFileSync(DB_PATH + '.tmp', JSON.stringify(data, null, 2))
  fs.renameSync(DB_PATH + '.tmp', DB_PATH)
}

export function addReview({ sender, pushName, categoryKey, itemId, orderId, rating, comment }) {
  const reviews = read()
  if (reviews.find(r => r.orderId === orderId)) return { success: false, message: 'Order sudah direview' }
  reviews.push({
    sender,
    pushName,
    categoryKey,
    itemId,
    orderId,
    rating: Math.min(5, Math.max(1, Number(rating))),
    comment: String(comment || '').trim(),
    createdAt: new Date().toISOString()
  })
  write(reviews)
  return { success: true }
}

export function getItemReviews(categoryKey, itemId) {
  return read().filter(r => r.categoryKey === categoryKey && r.itemId === itemId)
}

export function getAverageRating(categoryKey, itemId) {
  const revs = getItemReviews(categoryKey, itemId)
  if (!revs.length) return 0
  return Math.round(revs.reduce((s, r) => s + r.rating, 0) / revs.length * 10) / 10
}