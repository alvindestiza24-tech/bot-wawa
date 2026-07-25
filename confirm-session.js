const _sessions = new Map()
const TTL_MS    = 10 * 60 * 1000

export function setConfirmSession(senderNumber, orderId) {
  const existing = _sessions.get(senderNumber)
  if (existing?.timer) clearTimeout(existing.timer)

  const timer = setTimeout(() => _sessions.delete(senderNumber), TTL_MS)
  _sessions.set(senderNumber, { orderId, createdAt: Date.now(), timer })
}

export function getConfirmSession(senderNumber) {
  const s = _sessions.get(senderNumber)
  if (!s) return null
  if (Date.now() - s.createdAt > TTL_MS) {
    clearTimeout(s.timer)
    _sessions.delete(senderNumber)
    return null
  }
  return s.orderId
}

export function clearConfirmSession(senderNumber) {
  const s = _sessions.get(senderNumber)
  if (s?.timer) clearTimeout(s.timer)
  _sessions.delete(senderNumber)
}