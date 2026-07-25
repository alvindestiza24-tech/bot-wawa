// src/scrape/shinigami-detail.js
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

function pickTaxonomy(taxonomy, key) {
  if (!taxonomy || !Array.isArray(taxonomy[key])) return []
  return taxonomy[key].map(v => v.name).filter(Boolean)
}

function formatDetail(item) {
  return {
    title: item.title || null,
    mangaId: item.manga_id || null,
    alternativeTitle: item.alternative_title || null,
    description: item.description || null,
    releaseYear: item.release_year || null,
    country: item.country_id || null,
    status: item.status ?? null,
    rating: item.user_rate ?? null,
    viewCount: item.view_count ?? null,
    bookmarkCount: item.bookmark_count ?? null,
    cover: item.cover_image_url || null,
    coverPortrait: item.cover_portrait_url || null,
    author: pickTaxonomy(item.taxonomy, 'Author'),
    artist: pickTaxonomy(item.taxonomy, 'Artist'),
    format: pickTaxonomy(item.taxonomy, 'Format'),
    genre: pickTaxonomy(item.taxonomy, 'Genre'),
    type: pickTaxonomy(item.taxonomy, 'Type'),
    latestChapter: item.latest_chapter_number ?? null,
    latestChapterId: item.latest_chapter_id || null,
    latestChapterTime: item.latest_chapter_time || null,
    updatedAt: item.updated_at || null,
    url: item.manga_id ? `${WEB_URL}/series/${item.manga_id}` : null,
  }
}

function formatChapter(item) {
  return {
    chapterId: item.chapter_id || null,
    title: item.chapter_title || '',
    number: item.chapter_number ?? null,
    url: item.chapter_id ? `${WEB_URL}/chapter/${item.chapter_id}` : null,
    thumbnail: item.thumbnail_image_url || null,
    viewCount: item.view_count ?? null,
    releaseDate: item.release_date || null,
  }
}

/**
 * Mendapatkan detail manga dan daftar chapter
 * @param {string} mangaId - UUID manga
 * @param {number} chapterPage - Halaman chapter (default 1)
 * @param {number} chapterPageSize - Jumlah chapter per halaman (default 24)
 * @returns {Promise<Object|null>}
 */
export async function getMangaDetail(mangaId, chapterPage = 1, chapterPageSize = 24) {
  try {
    const [detailRes, chapterRes] = await Promise.all([
      client.get(`/v1/manga/detail/${mangaId}`),
      client.get(`/v1/chapter/${mangaId}/list`, {
        params: {
          page: chapterPage,
          page_size: chapterPageSize,
          sort_by: 'chapter_number',
          sort_order: 'desc',
        },
      }),
    ])

    const detailJson = detailRes.data
    const chapterJson = chapterRes.data

    if (!detailJson || detailJson.retcode !== 0 || !detailJson.data) {
      return null
    }

    const detail = formatDetail(detailJson.data)
    const chapters = (chapterJson?.data || []).map(formatChapter)

    return {
      ...detail,
      chapters,
      totalChapters: chapterJson?.meta?.total_record || chapters.length,
    }
  } catch {
    return null
  }
}