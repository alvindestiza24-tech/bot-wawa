// src/scrape/shinigami-read.js
import axios from 'axios'

const BASE_URL = 'https://api.shngm.io'
const WEB_URL = 'https://g.shinigami.asia'
const TIMEOUT = 30000

const client = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0',
    Accept: 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: `${WEB_URL}/`,
    Origin: WEB_URL,
    'Content-Type': 'application/json',
  },
  validateStatus: () => true,
})

function getUuid(input) {
  const text = String(input || '').trim()
  const uuid = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
  return uuid ? uuid[0] : null
}

function isSeriesUrl(input) {
  return String(input || '').includes('/series/')
}

function isChapterUrl(input) {
  return String(input || '').includes('/chapter/')
}

function makeImages(data) {
  const base = data.base_url || data.base_url_low || null
  const chapter = data.chapter || {}
  const path = chapter.path || ''
  const files = Array.isArray(chapter.data) ? chapter.data : []

  if (!base || !path || !files.length) return []

  return files.map((file) => `${base}${path}${file}`)
}

async function getLatestChapterIdFromSeries(mangaId) {
  const res = await client.get(`/v1/manga/detail/${mangaId}`)
  const json = res.data

  if (!json || json.retcode !== 0 || !json.data) {
    return { ok: false, error: json?.message || 'Gagal mengambil detail manga' }
  }

  return {
    ok: true,
    chapterId: json.data.latest_chapter_id || null,
    mangaTitle: json.data.title || null,
  }
}

async function getChapterDetail(chapterId) {
  const res = await client.get(`/v1/chapter/detail/${chapterId}`)
  return { code: res.status, json: res.data }
}

/**
 * Mendapatkan daftar URL gambar halaman dari sebuah chapter
 * @param {string} input - Bisa berupa chapter_id, URL chapter, atau URL series (mengambil chapter terbaru)
 * @returns {Promise<string[]>} Array URL gambar
 */
export async function getChapterPages(input) {
  const chapterId = getUuid(input)
  if (!chapterId) {
    throw new Error('UUID chapter tidak ditemukan dari input')
  }

  let finalChapterId = chapterId

  // Jika input adalah URL series, ambil chapter terbaru
  if (isSeriesUrl(input)) {
    const latest = await getLatestChapterIdFromSeries(chapterId)
    if (!latest.ok || !latest.chapterId) {
      throw new Error(latest.error || 'Gagal mendapatkan chapter terbaru')
    }
    finalChapterId = latest.chapterId
  }

  const { json } = await getChapterDetail(finalChapterId)
  if (!json || json.retcode !== 0 || !json.data) {
    throw new Error(json?.message || 'Gagal membaca chapter')
  }

  const images = makeImages(json.data)
  return images
}

/**
 * Mendapatkan informasi lengkap chapter (judul, nomor, navigasi, dll)
 * @param {string} input - chapter_id atau URL chapter
 * @returns {Promise<Object>} Detail chapter
 */
export async function getChapterInfo(input) {
  const chapterId = getUuid(input)
  if (!chapterId) throw new Error('UUID chapter tidak ditemukan')

  const { json } = await getChapterDetail(chapterId)
  if (!json || json.retcode !== 0 || !json.data) {
    throw new Error(json?.message || 'Gagal membaca chapter')
  }

  const data = json.data
  return {
    title: data.chapter_title || `Chapter ${data.chapter_number || ''}`,
    number: data.chapter_number,
    mangaId: data.manga_id,
    prevChapterId: data.prev_chapter_id || null,
    nextChapterId: data.next_chapter_id || null,
    thumbnail: data.thumbnail_image_url || null,
    viewCount: data.view_count || 0,
    releaseDate: data.release_date || null,
    totalPages: (data.chapter?.data || []).length,
  }
}