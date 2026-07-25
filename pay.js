// plugins/store/pay.js
import { Button } from '../../src/lib/_build-m.js'
import config from '../../config.js'
import crypto from 'crypto'
import { Dugong } from "@kyyinfinite/baileys";

export const config_ = {
  name: 'pay',
  alias: ['order', 'payment'],
  category: 'store',
  description: 'Buat invoice pembayaran',
  usage: '.pay <namaBarang>|<harga>|<jumlah>',
  example: '.pay Ikan cupang|50000|5',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const text = m.text?.trim() || ''
  
  if (!text || !text.includes('|')) {
    return m.reply(`❌ Format: .pay <namaBarang>|<harga>|<jumlah>\nContoh: .pay Ikan cupang|50000|5`)
  }

  let [namaBarang, hargaBarang, jumlahBarang] = text.split('|')

  if (!namaBarang || !hargaBarang || !jumlahBarang) {
    return m.reply('❌ Data barang tidak lengkap')
  }

  let nama = namaBarang.trim()
  let harga = parseInt(hargaBarang.trim())
  let jumlah = parseInt(jumlahBarang.trim())
  
  if (isNaN(harga) || isNaN(jumlah)) {
    return m.reply('❌ Harga dan jumlah harus berupa angka')
  }

  let totalHarga = harga * jumlah
  let valHarga = harga * 100
  let valTotalHarga = totalHarga * 100

  try {
    await sock.relayMessage(
      m.chat,
      {
        interactiveMessage: {
          header: {
            title: "Detail Pesanan Kamu 🛒",
            subtitle: "Silakan cek pesanan di bawah",
            hasMediaAttachment: false
          },
          body: {
            text: `Berikut adalah detail pesanan untuk *${nama}*. Klik tombol di bawah untuk melihat rincian dan melakukan pembayaran.`
          },
          footer: {
            text: `© ${config.bot?.name || 'Store'}`
          },
          nativeFlowMessage: {
            buttons: [
              {
                name: "review_and_pay",
                buttonParamsJson: JSON.stringify({
                  currency: "IDR",
                  payment_configuration: "",
                  payment_type: "",
                  transaction_id: "",
                  total_amount: {
                    value: valTotalHarga,
                    offset: 100
                  },
                  reference_id: "order_" + Math.floor(Math.random() * 1000000),
                  order_request_id: crypto.randomUUID(),
                  type: "digital-goods",
                  payment_method: "",
                  payment_status: "pending",
                  payment_timestamp: Math.floor(Date.now() / 1000),
                  order: {
                    status: "pending",
                    description: `Pesanan: ${nama}`,
                    subtotal: {
                      value: valTotalHarga,
                      offset: 100
                    },
                    tax: { value: 0, offset: 100 },
                    discount: { value: 0, offset: 100 },
                    shipping: { value: 0, offset: 100 },
                    order_type: "ORDER",
                    items: [
                      {
                        retailer_id: "item_" + Math.floor(Math.random() * 10000),
                        name: nama,
                        amount: {
                          value: valHarga,
                          offset: 100
                        },
                        quantity: jumlah
                      }
                    ]
                  },
                  additional_note: "Silakan segera selesaikan pembayaran.",
                  native_payment_methods: [
                    "{\"name\":\"PIX\",\"enabled\":false}"
                  ],
                  share_payment_status: true,
                  is_soft_deleted: false
                })
              }
            ],
            messageParamsJson: "{}"
          },
          contextInfo: {
            mentionedJid: [m.sender]
          }
        }
      },
      {
        additionalNodes: [
          {
            tag: "biz",
            attrs: {
              native_flow_name: "order_details"
            }
          }
        ]
      }
    )
    await m.react('✅')
  } catch (err) {
    console.error('[PAY]', err)
    await m.reply(`❌ Gagal membuat invoice: ${err.message}`)
  }
}