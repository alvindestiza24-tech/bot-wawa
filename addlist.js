// plugins/store/addlist.js
import {
  addCategory, editCategory, deleteCategory,
  addItem, editItem, deleteItem, setStock,
  getAllCategories, getCategory,
  saveCategoryImage,
} from '../../src/lib/store-db.js'
import { fmtPrice } from '../../src/lib/store-formatter.js'
import { postNewProduct, postStockUpdate } from '../../src/lib/channel-notify.js'
import { downloadContentFromMessage } from '@kyyinfinite/baileys'

export const config_ = {
  name:      'addcat',
  alias:     ['additem','edititem','delitem','delcat','setstock','listcat','listitem','editcat'],
  category:  'store',
  description: 'Kelola produk store (owner)',
  usage:     '.addcat <id>|<nama>|<emoji>|<desk>\n.additem <cat>|<nama>|<desk>|<harga>|<stok>',
  example:   '.addcat netflix|Netflix|🎬|Akun Netflix sharing\n.additem netflix|2u1d shar|2 user 1 hari|1800|10',
  isOwner:   true, isPremium: false, isGroup: false,
  isPrivate: false, prefix: false, cooldown: 2, isEnabled: true,
}
export { config_ as config }

function parsePipe(text) { return text.split('|').map(s => s.trim()) }
function numFmt(str)     { return parseInt(String(str).replace(/[.,\s]/g, '')) || 0 }
function normKey(str)    { return String(str || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '') }

export async function handler(m, { sock }) {
  const gid  = m.isGroup ? m.chat : null
  const cmd  = m.command.toLowerCase()
  const text = m.text?.trim() || ''

  if (cmd === 'listcat') {
    const cats = getAllCategories(gid)
    const keys = Object.keys(cats)
    if (!keys.length) return m.reply('꒰ store ꒱\n\nBelum ada kategori.')

    let out = `꒰ store ꒱ *LIST KATEGORI* (${keys.length})\n\n`
    keys.forEach((k, i) => {
      const c = cats[k]
      out += `${i + 1}. *${c.name}* [\`${c.id}\`] ${c.emoji || ''}\n`
      out += `   Items: ${c.items?.length || 0} | Terjual: ${c.sold || 0}\n`
      if (c.description) out += `   ${c.description}\n`
      out += '\n'
    })
    return m.reply(out.trimEnd())
  }

  if (cmd === 'listitem') {
    const catKey = text.split(/\s+/)[0]
    if (!catKey) return m.reply('Format: *.listitem <kategori>*')
    const cat = getCategory(catKey, gid)
    if (!cat) return m.reply(`❌ Kategori *${catKey}* tidak ditemukan.`)
    if (!cat.items?.length) return m.reply(`꒰ ${cat.name} ꒱\n\nBelum ada item.`)

    let out = `꒰ ${cat.name} ꒱ *DAFTAR ITEM* (${cat.items.length})\n\n`
    cat.items.forEach(item => {
      out += `[*${item.id}*] ${item.name}\n`
      out += `  Harga : ${fmtPrice(item.price)}\n`
      out += `  Stok  : ${item.stock}\n`
      out += `  Terjual: ${item.sold || 0}\n`
      if (item.description) out += `  Desk  : ${item.description}\n`
      out += '\n'
    })
    return m.reply(out.trimEnd())
  }

  if (cmd === 'addcat') {
    const parts = parsePipe(text)
    if (parts.length < 2) {
      return m.reply(
        '꒰ addcat ꒱\n\n' +
        'Format: *.addcat <id>|<nama>|<emoji>|<deskripsi>*\n' +
        'Contoh: *.addcat netflix|Netflix|🎬|Akun Netflix sharing*\n\n' +
        'Reply gambar untuk thumbnail kategori (opsional)'
      )
    }
    const [id, name, emoji = '🛒', description = ''] = parts
    const catId = normKey(id)

    // ─── Cek apakah ada quoted gambar ──────────────────────────────
    let imagePath = ''
    if (m.quoted && m.quoted.type === 'imageMessage') {
      try {
        const stream = await downloadContentFromMessage(
          m.quoted.message[m.quoted.type],
          m.quoted.type.replace('Message', '')
        )
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk])
        }
        if (buffer.length) {
          imagePath = saveCategoryImage(catId, buffer)
        }
      } catch (err) {
        console.error('[ADDCAT] Gagal download gambar:', err)
      }
    }

    const result = addCategory(id, { name, emoji, description, image: imagePath }, gid)
    return m.reply(result.success
      ? `✅ ${result.message}\nID: \`${result.category.id}\`\n${imagePath ? '🖼️ Thumbnail tersimpan' : ''}`
      : `❌ ${result.message}`)
  }

  if (cmd === 'editcat') {
    const parts = parsePipe(text)
    if (parts.length < 3) {
      return m.reply('Format: *.editcat <id>|<field>|<nilai>*\nField: name | emoji | description')
    }
    const [catId, field, ...valParts] = parts
    const val     = valParts.join('|')
    const allowed = ['name', 'emoji', 'description']
    if (!allowed.includes(field)) return m.reply(`❌ Field harus salah satu dari: ${allowed.join(', ')}`)
    const result = editCategory(catId, { [field]: val }, gid)
    return m.reply(result.success ? `✅ ${result.message}` : `❌ ${result.message}`)
  }

  if (cmd === 'delcat') {
    const catId = text.split(/\s+/)[0]
    if (!catId) return m.reply('Format: *.delcat <kategori>*')
    const cat = getCategory(catId, gid)
    if (!cat) return m.reply(`❌ Kategori *${catId}* tidak ditemukan.`)
    const result = deleteCategory(catId, gid)
    return m.reply(result.success ? `✅ ${result.message}` : `❌ ${result.message}`)
  }

  if (cmd === 'additem') {
    const parts = parsePipe(text)
    if (parts.length < 4) {
      return m.reply(
        '꒰ additem ꒱\n\n' +
        'Format: *.additem <kategori>|<nama>|<deskripsi>|<harga>|<stok>*\n' +
        'Contoh: *.additem netflix|2u1d shar|2 user 1 hari sharing|1800|10*\n\n' +
        'Harga dalam Rupiah (tanpa Rp)'
      )
    }
    const [catId, name, description, priceStr, stockStr = '0'] = parts
    const price  = numFmt(priceStr)
    const stock  = numFmt(stockStr)
    const result = addItem(catId, { name, description, price, stock }, gid)
    if (!result.success) return m.reply(`❌ ${result.message}`)

    const cat = getCategory(catId, gid)

    await m.reply(
      `✅ ${result.message}\n\n` +
      `[*${result.item.id}*] ${result.item.name}\n` +
      `Harga : ${fmtPrice(result.item.price)}\n` +
      `Stok  : ${result.item.stock}`
    )

    if (config_.isEnabled && sock && cat) {
      postNewProduct(sock, cat.name, cat.emoji || '🛒', name, price, stock, description).catch(() => {})
    }

    return
  }

  if (cmd === 'edititem') {
    const parts = text.split(/\s+/)
    if (parts.length < 4) {
      return m.reply(
        'Format: *.edititem <kategori> <id> <field> <nilai>*\n' +
        'Field: name | desc | price | stock\n' +
        'Contoh: *.edititem netflix 1 price 2500*'
      )
    }
    const [catId, itemId, field, ...valParts] = parts
    const valStr = valParts.join(' ')

    const fieldMap = {
      name: 'name', desc: 'description', description: 'description',
      price: 'price', stock: 'stock', stok: 'stock', harga: 'price',
    }
    const realField = fieldMap[field.toLowerCase()]
    if (!realField) return m.reply(`❌ Field tidak valid. Gunakan: name, desc, price, stock`)

    const val    = (realField === 'price' || realField === 'stock') ? numFmt(valStr) : valStr
    const result = editItem(catId, itemId, { [realField]: val }, gid)
    return m.reply(result.success
      ? `✅ ${result.message}\nNilai baru: *${val}*`
      : `❌ ${result.message}`)
  }

  if (cmd === 'delitem') {
    const [catId, itemId] = text.split(/\s+/)
    if (!catId || !itemId) return m.reply('Format: *.delitem <kategori> <id>*')
    const result = deleteItem(catId, itemId, gid)
    return m.reply(result.success ? `✅ ${result.message}` : `❌ ${result.message}`)
  }

  if (cmd === 'setstock') {
    const [catId, itemId, qtyStr] = text.split(/\s+/)
    if (!catId || !itemId || !qtyStr) {
      return m.reply(
        'Format: *.setstock <kategori> <id> <jumlah>*\n' +
        'Contoh: *.setstock netflix 1 +5*  (tambah 5)\n' +
        '        *.setstock netflix 1 -3*  (kurang 3)\n' +
        '        *.setstock netflix 1 20*  (set ke 20)'
      )
    }

    const cat      = getCategory(catId, gid)
    const item     = cat?.items?.find(i => i.id === parseInt(itemId))
    const oldStock = item?.stock ?? 0

    let mode = 'set', qty = 0
    if (qtyStr.startsWith('+'))      { mode = 'add'; qty = parseInt(qtyStr.slice(1)) }
    else if (qtyStr.startsWith('-')) { mode = 'sub'; qty = parseInt(qtyStr.slice(1)) }
    else                             { qty = parseInt(qtyStr) }

    const result = setStock(catId, itemId, qty, mode, gid)
    if (!result.success) return m.reply(`❌ ${result.message}`)

    await m.reply(`✅ ${result.message}\nStok sekarang: *${result.item.stock}*`)

    if (sock && cat && item) {
      postStockUpdate(sock, cat.name, item.name, oldStock, result.item.stock).catch(() => {})
    }

    return
  }

  return m.reply(`꒰ store ꒱\n\nCommand tidak dikenali: *${cmd}*`)
}