// src/lib/notifyme-store.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', '..', 'storage', 'data', 'store', 'restock-notif.json')

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

export function addNotification({ sender, categoryKey, itemId }) {
  const data = read()
  const key = `${categoryKey}:${itemId}`
  if (!data[key]) data[key] = []
  if (data[key].includes(sender)) return { success: false, message: 'Kamu sudah dalam antrian notifikasi' }
  data[key].push(sender)
  write(data)
  return { success: true }
}

export function getAndRemoveNotificationsForItem(categoryKey, itemId) {
  const data = read()
  const key = `${categoryKey}:${itemId}`
  const senders = data[key] || []
  delete data[key]
  write(data)
  return senders
}