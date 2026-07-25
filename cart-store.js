// src/lib/cart-store.js
const carts = new Map()
const CART_TTL = 30 * 60 * 1000 // 30 menit

// Bersihkan keranjang kadaluarsa setiap 5 menit
setInterval(() => {
  const now = Date.now()
  for (const [key, cart] of carts) {
    if (now - cart.updatedAt > CART_TTL) carts.delete(key)
  }
}, 5 * 60 * 1000)

export function getCart(sender) {
  const cart = carts.get(sender)
  if (!cart || Date.now() - cart.updatedAt > CART_TTL) return []
  return cart.items
}

export function setCart(sender, items) {
  carts.set(sender, { items, updatedAt: Date.now() })
}

export function addToCart(sender, { categoryKey, itemId, qty = 1 }) {
  const current = getCart(sender)
  const existing = current.find(i => i.categoryKey === categoryKey && i.itemId === itemId)
  if (existing) {
    existing.qty += qty
  } else {
    current.push({ categoryKey, itemId, qty })
  }
  setCart(sender, current)
}

export function removeFromCart(sender, index) {
  const current = getCart(sender)
  if (index >= 0 && index < current.length) current.splice(index, 1)
  setCart(sender, current)
}

export function clearCart(sender) {
  carts.delete(sender)
}

export function getCartSize(sender) {
  return getCart(sender).length
}