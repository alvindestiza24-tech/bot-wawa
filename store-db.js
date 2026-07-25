// src/lib/store-db.js
import fs   from 'fs'
import path  from 'path'
import { fileURLToPath } from 'url'
import { calcTotal } from './math.js'
import { getDatabase } from '../database.js'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const STORE_DIR  = path.join(__dirname, '..', '..', 'storage', 'data', 'store')
const IMAGE_DIR  = path.join(STORE_DIR, 'images') // <--- FIX: di dalam storage/data/store/images

const CACHE_TTL  = 5_000
const _cacheMap  = new Map()

function _getCache(dir) {
  if (!_cacheMap.has(dir)) {
    _cacheMap.set(dir, {
      products: null, orders: null,
      ts: { products: 0, orders: 0 },
    })
  }
  return _cacheMap.get(dir)
}

function _invalidate(dir, key) {
  const c = _cacheMap.get(dir)
  if (!c) return
  c[key]    = null
  c.ts[key] = 0
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function ensureImageDir() {
  if (!fs.existsSync(IMAGE_DIR)) {
    fs.mkdirSync(IMAGE_DIR, { recursive: true })
  }
}

export function getStoreDir(gid) {
  if (!gid) return STORE_DIR
  const db    = getDatabase()
  const group = db.getGroup(gid)
  if (group?.storeMode === 'grup') {
    const dir = path.join(STORE_DIR, String(gid))
    ensureDir(dir)
    return dir
  }
  return STORE_DIR
}

function _fp(key, dir) {
  const names = { products: 'products.json', orders: 'orders.json' }
  return path.join(dir, names[key])
}

function readJson(key, fallback, gid = null) {
  const dir = getStoreDir(gid)
  const c   = _getCache(dir)
  const now = Date.now()
  if (c[key] && now - c.ts[key] < CACHE_TTL) return c[key]

  ensureDir(dir)
  const fp = _fp(key, dir)
  try {
    if (!fs.existsSync(fp)) {
      writeJson(key, JSON.parse(JSON.stringify(fallback)), gid)
      c[key]    = JSON.parse(JSON.stringify(fallback))
      c.ts[key] = now
      return c[key]
    }
    const data = JSON.parse(fs.readFileSync(fp, 'utf-8'))
    c[key]    = data
    c.ts[key] = now
    return data
  } catch {
    return JSON.parse(JSON.stringify(fallback))
  }
}

function writeJson(key, data, gid = null) {
  const dir = getStoreDir(gid)
  ensureDir(dir)
  data.updatedAt = new Date().toISOString()
  const fp  = _fp(key, dir)
  const tmp = fp + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, fp)
  const c   = _getCache(dir)
  c[key]    = data
  c.ts[key] = Date.now()
}

function normKey(str) {
  return String(str || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '')
}

const PROD_DEFAULT = { categories: {}, updatedAt: null }

export function getProducts(gid = null)      { return readJson('products', PROD_DEFAULT, gid) }
export function getAllCategories(gid = null)  { return getProducts(gid).categories || {} }
export function getCategory(name, gid = null) { return getAllCategories(gid)[normKey(name)] || null }

export function saveCategoryImage(categoryId, buffer) {
  ensureImageDir()
  const filename = `cat_${categoryId}.jpg`
  const filepath = path.join(IMAGE_DIR, filename)
  fs.writeFileSync(filepath, buffer)
  // Simpan path relatif dari root proyek: storage/data/store/images/cat_xxx.jpg
  return path.join('storage', 'data', 'store', 'images', filename)
}

export function getCategoryImagePath(categoryId) {
  const filename = `cat_${categoryId}.jpg`
  const filepath = path.join(IMAGE_DIR, filename)
  if (fs.existsSync(filepath)) return filepath
  return null
}

export function addCategory(key, data, gid = null) {
  const id = normKey(key)
  if (!id) return { success: false, message: 'ID tidak valid' }
  const db = getProducts(gid)
  if (db.categories[id]) return { success: false, message: `Kategori "${id}" sudah ada` }
  db.categories[id] = {
    id,
    name:        data.name || key,
    emoji:       data.emoji || '🛒',
    description: data.description || '',
    image:       data.image || '',
    discountPct: Number(data.discountPct) || 0,
    taxPct:      Number(data.taxPct) || 0,
    visible:     data.visible !== false,
    items:       [],
    sold:        0,
    addedAt:     new Date().toISOString(),
  }
  writeJson('products', db, gid)
  return { success: true, message: `Kategori "${id}" ditambah`, category: db.categories[id] }
}

export function editCategory(key, data, gid = null) {
  const id = normKey(key)
  const db = getProducts(gid)
  if (!db.categories[id]) return { success: false, message: `Kategori "${id}" tidak ditemukan` }
  if (data.discountPct !== undefined) data.discountPct = Number(data.discountPct)
  if (data.taxPct      !== undefined) data.taxPct      = Number(data.taxPct)
  Object.assign(db.categories[id], data)
  writeJson('products', db, gid)
  return { success: true, message: `Kategori "${id}" diperbarui` }
}

export function deleteCategory(key, gid = null) {
  const id = normKey(key)
  const db = getProducts(gid)
  if (!db.categories[id]) return { success: false, message: `Kategori "${id}" tidak ditemukan` }
  delete db.categories[id]
  writeJson('products', db, gid)
  return { success: true, message: `Kategori "${id}" dihapus` }
}

export function addItem(categoryKey, item, gid = null) {
  const id = normKey(categoryKey)
  const db = getProducts(gid)
  if (!db.categories[id]) return { success: false, message: `Kategori "${id}" tidak ditemukan` }

  const items   = db.categories[id].items
  const newId   = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1
  const cat     = db.categories[id]
  const price   = Number(item.price) || 0
  const discPct = Number(item.discountPct ?? cat.discountPct) || 0
  const taxPct  = Number(item.taxPct  ?? cat.taxPct)  || 0
  const calc    = calcTotal({ price, qty: 1, discountPct: discPct, taxPct })

  const newItem = {
    id:            newId,
    name:          String(item.name || '').trim(),
    description:   String(item.description || '').trim(),
    sku:           String(item.sku || '').trim(),
    image:         String(item.image || '').trim(),
    originalPrice: price,
    price:         calc.afterDiscount,
    discountPct:   discPct,
    taxPct,
    taxAmount:     calc.taxAmount,
    stock:         Number(item.stock) || 0,
    sold:          0,
    visible:       item.visible !== false,
    addedAt:       new Date().toISOString(),
  }

  if (!newItem.name) return { success: false, message: 'Nama item tidak boleh kosong' }
  if (price < 0)     return { success: false, message: 'Harga tidak valid' }

  items.push(newItem)
  writeJson('products', db, gid)
  return { success: true, message: `Item #${newId} ditambah ke "${id}"`, item: newItem }
}

export function editItem(categoryKey, itemId, data, gid = null) {
  const id  = normKey(categoryKey)
  const db  = getProducts(gid)
  if (!db.categories[id]) return { success: false, message: `Kategori "${id}" tidak ditemukan` }
  const idx = db.categories[id].items.findIndex(i => i.id === Number(itemId))
  if (idx === -1) return { success: false, message: `Item #${itemId} tidak ditemukan` }

  const item    = db.categories[id].items[idx]
  const cat     = db.categories[id]

  if (data.price !== undefined || data.discountPct !== undefined || data.taxPct !== undefined) {
    const price   = Number(data.price ?? item.originalPrice) || 0
    const discPct = Number(data.discountPct ?? item.discountPct ?? cat.discountPct) || 0
    const taxPct  = Number(data.taxPct  ?? item.taxPct  ?? cat.taxPct)  || 0
    const calc    = calcTotal({ price, qty: 1, discountPct: discPct, taxPct })
    data.originalPrice = price
    data.price         = calc.afterDiscount
    data.discountPct   = discPct
    data.taxPct        = taxPct
    data.taxAmount     = calc.taxAmount
  }
  if (data.stock !== undefined) data.stock = Number(data.stock)

  Object.assign(item, data)
  writeJson('products', db, gid)
  return { success: true, message: `Item #${itemId} diperbarui`, item }
}

export function deleteItem(categoryKey, itemId, gid = null) {
  const id  = normKey(categoryKey)
  const db  = getProducts(gid)
  if (!db.categories[id]) return { success: false, message: `Kategori "${id}" tidak ditemukan` }
  const before = db.categories[id].items.length
  db.categories[id].items = db.categories[id].items.filter(i => i.id !== Number(itemId))
  if (db.categories[id].items.length === before) return { success: false, message: `Item #${itemId} tidak ditemukan` }
  writeJson('products', db, gid)
  return { success: true, message: `Item #${itemId} dihapus dari "${id}"` }
}

export function setStock(categoryKey, itemId, qty, mode = 'set', gid = null) {
  const id   = normKey(categoryKey)
  const db   = getProducts(gid)
  if (!db.categories[id]) return { success: false, message: `Kategori "${id}" tidak ditemukan` }
  const item = db.categories[id].items.find(i => i.id === Number(itemId))
  if (!item) return { success: false, message: `Item #${itemId} tidak ditemukan` }
  const q = Number(qty)
  if (mode === 'add')      item.stock = Math.max(0, item.stock + q)
  else if (mode === 'sub') item.stock = Math.max(0, item.stock - q)
  else                     item.stock = Math.max(0, q)
  writeJson('products', db, gid)
  return { success: true, message: `Stok #${itemId} → ${item.stock}`, item }
}

const ORD_DEFAULT = { orders: [], counter: 0, updatedAt: null }

export function getOrders(gid = null)             { return readJson('orders', ORD_DEFAULT, gid) }
export function getOrderById(orderId, gid = null)  {
  const all = getOrders(gid).orders.find(o => o.orderId === orderId)
  if (all) return all
  if (gid !== null) return getOrders(null).orders.find(o => o.orderId === orderId) || null
  return null
}
export function getPendingOrders(gid = null)       { return getOrders(gid).orders.filter(o => o.status === 'pending_owner') }
export function getUserOrders(num, gid = null)     { return getOrders(gid).orders.filter(o => o.senderNum === num) }

export function createOrder({ senderNum, pushName, categoryKey, itemId, qty = 1, gid = null }) {
  const catId = normKey(categoryKey)
  const db    = getProducts(gid)
  const cat   = db.categories[catId]
  if (!cat) return { success: false, message: `Kategori "${catId}" tidak ditemukan` }

  const item = cat.items.find(i => i.id === Number(itemId))
  if (!item)            return { success: false, message: `Item #${itemId} tidak ditemukan` }
  if (item.stock < qty) return { success: false, message: `Stok tidak cukup. Tersedia: ${item.stock}` }

  const orders   = getOrders(gid)
  orders.counter = (orders.counter || 0) + 1
  const pad      = String(orders.counter).padStart(4, '0')
  const today    = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const orderId  = `INV-${today}-${pad}`

  const calc = calcTotal({
    price:       item.originalPrice || item.price,
    qty,
    discountPct: item.discountPct || 0,
    taxPct:      item.taxPct      || 0,
  })

  const order = {
    orderId,
    gid:            gid || null,
    senderNum,
    pushName:       pushName || 'User',
    categoryKey:    catId,
    categoryName:   cat.name,
    itemId:         item.id,
    itemName:       item.name,
    sku:            item.sku    || '',
    description:    item.description || '',
    originalPrice:  item.originalPrice || item.price,
    price:          item.price,
    discountPct:    item.discountPct || 0,
    discountAmount: calc.discountAmount,
    taxPct:         item.taxPct || 0,
    taxAmount:      calc.taxAmount,
    qty,
    subtotal:       calc.subtotal,
    total:          calc.total,
    status:         'pending_user',
    paymentMethod:  '',
    note:           '',
    createdAt:      new Date().toISOString(),
    confirmedAt:    null,
    completedAt:    null,
    cancelledAt:    null,
    cancelReason:   '',
  }

  orders.orders.push(order)
  writeJson('orders', orders, gid)
  return { success: true, order }
}

export function confirmOrder(orderId, gid = null) {
  const resolvedGid = gid
  const orders = getOrders(resolvedGid)
  const order  = orders.orders.find(o => o.orderId === orderId)
  if (!order) return { success: false, message: `Order ${orderId} tidak ditemukan` }
  if (order.status !== 'pending_user') return { success: false, message: `Order sudah: ${order.status}` }

  const orderGid = resolvedGid ?? order.gid ?? null
  const db  = getProducts(orderGid)
  const cat = db.categories[order.categoryKey]
  if (cat) {
    const item = cat.items.find(i => i.id === order.itemId)
    if (item) {
      item.stock = Math.max(0, item.stock - order.qty)
      item.sold  = (item.sold  || 0) + order.qty
      cat.sold   = (cat.sold   || 0) + order.qty
    }
  }
  writeJson('products', db, orderGid)
  _invalidate(getStoreDir(orderGid), 'products')

  order.status      = 'pending_owner'
  order.confirmedAt = new Date().toISOString()
  writeJson('orders', orders, resolvedGid)
  return { success: true, order }
}

export function completeOrder(orderId, note = '', gid = null) {
  const orders = getOrders(gid)
  const order  = orders.orders.find(o => o.orderId === orderId)
  if (!order)                      return { success: false, message: `Order ${orderId} tidak ditemukan` }
  if (order.status === 'completed') return { success: false, message: 'Order sudah selesai' }
  if (order.status === 'cancelled') return { success: false, message: 'Order sudah dibatalkan' }
  order.status      = 'completed'
  order.completedAt = new Date().toISOString()
  order.note        = note || ''
  writeJson('orders', orders, gid)
  return { success: true, order }
}

export function cancelOrder(orderId, reason = '', gid = null) {
  const orders = getOrders(gid)
  const order  = orders.orders.find(o => o.orderId === orderId)
  if (!order)                      return { success: false, message: `Order ${orderId} tidak ditemukan` }
  if (order.status === 'completed') return { success: false, message: 'Order sudah selesai' }
  if (order.status === 'cancelled') return { success: false, message: 'Order sudah dibatalkan' }

  const orderGid = gid ?? order.gid ?? null
  if (order.status === 'pending_owner') {
    const db  = getProducts(orderGid)
    const cat = db.categories[order.categoryKey]
    if (cat) {
      const item = cat.items.find(i => i.id === order.itemId)
      if (item) {
        item.stock = (item.stock || 0) + order.qty
        item.sold  = Math.max(0, (item.sold || 0) - order.qty)
        cat.sold   = Math.max(0, (cat.sold  || 0) - order.qty)
      }
    }
    writeJson('products', db, orderGid)
    _invalidate(getStoreDir(orderGid), 'products')
  }

  order.status       = 'cancelled'
  order.cancelledAt  = new Date().toISOString()
  order.cancelReason = reason || ''
  order.note         = reason || ''
  writeJson('orders', orders, gid)
  return { success: true, order }
}

export function getStoreStats(gid = null) {
  const db     = getProducts(gid)
  const orders = getOrders(gid)
  const cats   = Object.values(db.categories || {})
  const ords   = orders.orders || []

  const totalItems    = cats.reduce((s, c) => s + (c.items?.length || 0), 0)
  const totalStock    = cats.reduce((s, c) => s + c.items.reduce((ss, i) => ss + i.stock, 0), 0)
  const totalStockVal = cats.reduce((s, c) => s + c.items.reduce((ss, i) => ss + (i.originalPrice || i.price) * i.stock, 0), 0)
  const completed     = ords.filter(o => o.status === 'completed')
  const totalRevenue  = completed.reduce((s, o) => s + o.total, 0)
  const pending       = ords.filter(o => o.status === 'pending_owner').length

  return {
    totalCategories: cats.length,
    totalItems,
    totalStock,
    totalStockValue: totalStockVal,
    totalOrders:     ords.length,
    pendingOrders:   pending,
    completedOrders: completed.length,
    totalRevenue,
  }
}

export function createOrderMulti({ senderNum, pushName, items, coupon = null, gid = null }) {
  const db         = getProducts(gid)
  const orderItems = []
  let subtotal     = 0

  for (const ci of items) {
    const cat = db.categories[ci.categoryKey]
    if (!cat) return { success: false, message: `Kategori ${ci.categoryKey} tidak ditemukan` }
    const item = cat.items.find(i => i.id === ci.itemId)
    if (!item) return { success: false, message: `Item #${ci.itemId} tidak ditemukan` }
    if (item.stock < ci.qty) return { success: false, message: `Stok ${item.name} tidak cukup. Tersedia: ${item.stock}` }

    const calc = calcTotal({ price: item.price, qty: ci.qty, discountPct: item.discountPct || 0, taxPct: item.taxPct || 0 })
    orderItems.push({
      categoryKey:    ci.categoryKey,
      categoryName:   cat.name,
      itemId:         item.id,
      itemName:       item.name,
      sku:            item.sku || '',
      description:    item.description || '',
      originalPrice:  item.originalPrice || item.price,
      price:          item.price,
      discountPct:    item.discountPct || 0,
      discountAmount: calc.discountAmount,
      taxPct:         item.taxPct || 0,
      taxAmount:      calc.taxAmount,
      qty:            ci.qty,
      subtotal:       calc.subtotal,
      total:          calc.total,
    })
    subtotal += calc.total
  }

  let discount   = 0
  let couponCode = null
  if (coupon) {
    discount   = coupon.discount || 0
    couponCode = coupon.code
    subtotal   = Math.max(0, subtotal - discount)
  }

  const orders   = getOrders(gid)
  orders.counter = (orders.counter || 0) + 1
  const pad      = String(orders.counter).padStart(4, '0')
  const today    = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const orderId  = `INV-${today}-${pad}`

  const order = {
    orderId,
    gid:           gid || null,
    senderNum,
    pushName:      pushName || 'User',
    items:         orderItems,
    subtotal:      subtotal + discount,
    discount,
    total:         subtotal,
    couponCode,
    status:        'pending_user',
    paymentMethod: '',
    note:          '',
    createdAt:     new Date().toISOString(),
    confirmedAt:   null,
    completedAt:   null,
    cancelledAt:   null,
    cancelReason:  '',
  }

  orders.orders.push(order)
  writeJson('orders', orders, gid)
  return { success: true, order }
}

export function confirmOrderMulti(orderId, gid = null) {
  const orders = getOrders(gid)
  const order  = orders.orders.find(o => o.orderId === orderId)
  if (!order) return { success: false, message: `Order ${orderId} tidak ditemukan` }
  if (order.status !== 'pending_user') return { success: false, message: `Order sudah ${order.status}` }

  const orderGid = gid ?? order.gid ?? null
  const db = getProducts(orderGid)
  for (const ci of order.items) {
    const cat = db.categories[ci.categoryKey]
    if (cat) {
      const item = cat.items.find(i => i.id === ci.itemId)
      if (item) {
        item.stock = Math.max(0, item.stock - ci.qty)
        item.sold  = (item.sold || 0) + ci.qty
        cat.sold   = (cat.sold || 0) + ci.qty
      }
    }
  }
  writeJson('products', db, orderGid)
  _invalidate(getStoreDir(orderGid), 'products')

  order.status      = 'pending_owner'
  order.confirmedAt = new Date().toISOString()
  writeJson('orders', orders, gid)
  return { success: true, order }
}

export function completeOrderMulti(orderId, note = '', gid = null) {
  const orders = getOrders(gid)
  const order  = orders.orders.find(o => o.orderId === orderId)
  if (!order)                      return { success: false, message: `Order ${orderId} tidak ditemukan` }
  if (order.status === 'completed') return { success: false, message: 'Order sudah selesai' }
  if (order.status === 'cancelled') return { success: false, message: 'Order sudah dibatalkan' }
  order.status      = 'completed'
  order.completedAt = new Date().toISOString()
  order.note        = note || ''
  writeJson('orders', orders, gid)
  return { success: true, order }
}

export function cancelOrderMulti(orderId, reason = '', gid = null) {
  const orders = getOrders(gid)
  const order  = orders.orders.find(o => o.orderId === orderId)
  if (!order)                      return { success: false, message: `Order ${orderId} tidak ditemukan` }
  if (order.status === 'completed') return { success: false, message: 'Order sudah selesai' }
  if (order.status === 'cancelled') return { success: false, message: 'Order sudah dibatalkan' }

  const orderGid = gid ?? order.gid ?? null
  if (order.status === 'pending_owner') {
    const db = getProducts(orderGid)
    for (const ci of order.items) {
      const cat = db.categories[ci.categoryKey]
      if (cat) {
        const item = cat.items.find(i => i.id === ci.itemId)
        if (item) {
          item.stock = (item.stock || 0) + ci.qty
          item.sold  = Math.max(0, (item.sold || 0) - ci.qty)
          cat.sold   = Math.max(0, (cat.sold  || 0) - ci.qty)
        }
      }
    }
    writeJson('products', db, orderGid)
    _invalidate(getStoreDir(orderGid), 'products')
  }

  order.status       = 'cancelled'
  order.cancelledAt  = new Date().toISOString()
  order.cancelReason = reason || ''
  order.note         = reason || ''
  writeJson('orders', orders, gid)
  return { success: true, order }
}

export function getInvoice(orderId, gid = null)          { return getOrderById(orderId, gid) }
export async function processInvoice(orderId, gid = null) { const r = completeOrder(orderId, '', gid); return r.success ? r.order : null }
export async function cancelInvoice(orderId, gid = null)  { const r = cancelOrder(orderId, 'Dibatalkan', gid); return r.success ? r.order : null }

export function getStoreModeLabel(gid) {
  if (!gid) return 'global'
  const db    = getDatabase()
  const group = db.getGroup(gid)
  return group?.storeMode === 'grup' ? 'grup' : 'global'
}

export default {
  getProducts, getAllCategories, getCategory, getStoreDir, getStoreModeLabel,
  saveCategoryImage, getCategoryImagePath,
  addCategory, editCategory, deleteCategory,
  addItem, editItem, deleteItem, setStock,
  getOrders, getOrderById, getPendingOrders, getUserOrders,
  createOrder, confirmOrder, completeOrder, cancelOrder,
  createOrderMulti, confirmOrderMulti, completeOrderMulti, cancelOrderMulti,
  getStoreStats, getInvoice, processInvoice, cancelInvoice,
}