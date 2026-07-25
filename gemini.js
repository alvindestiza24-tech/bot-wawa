
import axios from 'axios'
import { parseAIResponse } from '../../src/ai/ai-response-parser.js'
import { AIRich } from '../../src/lib/_build-m.js'
import config from '../../config.js'


const memory = new Map()


const BASE_URL = 'https://www.00cc.eu.cc/gemini'

/**
 * Panggil API Gemini (teks saja)
 * @param {string} pesan - Pesan dari pengguna
 * @param {string} sesiId - ID sesi untuk mempertahankan percakapan (opsional)
 * @returns {Promise<string>} Balasan dari AI
 */
async function panggilGemini(pesan, sesiId = '') {
    const url = `${BASE_URL}?sessions=${encodeURIComponent(sesiId)}&message=${encodeURIComponent(pesan)}`

    const response = await axios.get(url, {
        timeout: 60000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    })


    if (typeof response.data === 'string') {
        return response.data
    }


    if (response.data && typeof response.data === 'object') {
        return response.data.response || response.data.text || response.data.message || JSON.stringify(response.data)
    }

    return String(response.data)
}


export const config_ = {
    name: 'gemini',
    alias: ['gmini', 'ai', 'tanya', 'ask'],
    category: 'ai',
    description: 'Chat dengan AI Gemini (teks)',
    usage: '.gemini <pertanyaan>',
    example: '.gemini apa itu black hole?',
    isOwner: false,
    cooldown: 10,
    isEnabled: true,
}
export { config_ as config }


export async function handler(m, { sock }) {
    const input = m.text?.trim() || ''


    if (input.toLowerCase() === 'clear' || input.toLowerCase() === 'reset') {
        memory.delete(m.sender)
        return m.reply('🧹 *Riwayat percakapan berhasil dihapus.*')
    }


    if (!input) {
        return m.reply(
            '❌ *Masukkan pertanyaan.*\n\n' +
            'Contoh:\n' +
            '`.gemini apa itu kecerdasan buatan?`\n' +
            '`.gemini clear` (hapus memori)'
        )
    }


    let memori = memory.get(m.sender) || []


    if (memori.length === 0) {
        memori.push({
            role: 'system',
            content: `Kamu adalah ${config.bot?.name || 'Bot'} asisten AI yang ramah, cerdas, dan membantu. Jawab dengan bahasa Indonesia yang sopan dan informatif.`
        })
    }


    memori.push({ role: 'user', content: input })

    await m.react('⏳')

    try {

        const sesiId = m.sender
        const balasan = await panggilGemini(input, sesiId)


        memori.push({ role: 'assistant', content: balasan })


        if (memori.length > 21) {
            memori = [memori[0], ...memori.slice(-20)]
        }
        memory.set(m.sender, memori)


        const parsed = parseAIResponse(balasan)
        const builder = new AIRich(sock).setTitle('🤖 *Gemini AI*')


        for (const teks of parsed.texts) {
            builder.addText(teks)
        }


        for (const kode of parsed.codes) {
            builder.addCode(kode.lang, kode.code)
        }


        for (const tabel of parsed.tables) {
            builder.addTable(tabel)
        }


        if (parsed.suggests.length > 0) {
            builder.addSuggest(parsed.suggests)
        } else {
            builder.addSuggest([
                'Apa itu AI?',
                'Ceritakan tentang dirimu',
                'Bantu saya belajar coding'
            ])
        }

        await builder.send(m.chat, { quoted: m.raw })
        await m.react('✅')

    } catch (err) {
        console.error('[GEMINI]', err)
        await m.react('❌')
        memori.pop()
        memory.set(m.sender, memori)

        await m.reply(`❌ *Terjadi kesalahan:*\n${err.message}`)
    }
}