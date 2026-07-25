// src/scrape/shinigami-search.js
import axios from 'axios'

const BASE_URL = 'https://api.shngm.io'
const WEB_URL  = 'https://g.shinigami.asia'
const TIMEOUT  = 15000

function makeSlug(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function pickTaxonomy(taxonomy, key) {
  if (!taxonomy || !Array.isArray(taxonomy[key])) return []
  return taxonomy[key].map(v => v.name).filter(Boolean)
}

async function directRequest(query, page, pageSize) {
  return await axios.get(`${BASE_URL}/v1/manga/list`, {
    timeout: TIMEOUT,
    params: { page, page_size: pageSize, q: query },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': `${WEB_URL}/`,
      'Origin': WEB_URL,
      'Content-Type': 'application/json'
    },
    validateStatus: () => true,
  })
}

async function proxyRequest(query, page, pageSize) {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
    `${BASE_URL}/v1/manga/list?page=${page}&page_size=${pageSize}&q=${encodeURIComponent(query)}`
  )}`
  return await axios.get(proxyUrl, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0',
    },
    validateStatus: () => true,
  })
}

export async function searchManga(query, page = 1, pageSize = 5) {
  let res

  // Coba langsung
  try {
    res = await directRequest(query, page, pageSize)
    if (res.data && res.data.retcode === 0 && Array.isArray(res.data.data)) {
      return res.data.data.map(item => ({
        title:            item.title || 'No Title',
        slug:             makeSlug(item.title),
        url:              item.manga_id ? `${WEB_URL}/series/${item.manga_id}` : null,
        mangaId:          item.manga_id || null,
        alternativeTitle: item.alternative_title || null,
        description:      item.description || null,
        releaseYear:      item.release_year || null,
        country:          item.country_id || null,
        status:           item.status ?? null,
        rating:           item.user_rate ?? null,
        viewCount:        item.view_count ?? null,
        bookmarkCount:    item.bookmark_count ?? null,
        latestChapter:    item.latest_chapter_number ?? null,
        latestChapterId:  item.latest_chapter_id || null,
        latestChapterTime:item.latest_chapter_time || null,
        cover:            item.cover_image_url || null,
        coverPortrait:    item.cover_portrait_url || null,
        author:           pickTaxonomy(item.taxonomy, 'Author'),
        artist:           pickTaxonomy(item.taxonomy, 'Artist'),
        format:           pickTaxonomy(item.taxonomy, 'Format'),
        genre:            pickTaxonomy(item.taxonomy, 'Genre'),
        type:             pickTaxonomy(item.taxonomy, 'Type'),
        updatedAt:        item.updated_at || null,
        createdAt:        item.created_at || null,
      }))
    }
  } catch (err) {
    console.error('[SHINIGAMI SEARCH] Direct request error:', err.message)
  }

  // Fallback proxy 1
  try {
    res = await proxyRequest(query, page, pageSize)
    const data = JSON.parse(res.data)
    if (data && data.retcode === 0 && Array.isArray(data.data)) {
      return data.data.map(item => ({
        title:            item.title || 'No Title',
        slug:             makeSlug(item.title),
        url:              item.manga_id ? `${WEB_URL}/series/${item.manga_id}` : null,
        mangaId:          item.manga_id || null,
        alternativeTitle: item.alternative_title || null,
        description:      item.description || null,
        releaseYear:      item.release_year || null,
        country:          item.country_id || null,
        status:           item.status ?? null,
        rating:           item.user_rate ?? null,
        viewCount:        item.view_count ?? null,
        bookmarkCount:    item.bookmark_count ?? null,
        latestChapter:    item.latest_chapter_number ?? null,
        latestChapterId:  item.latest_chapter_id || null,
        latestChapterTime:item.latest_chapter_time || null,
        cover:            item.cover_image_url || null,
        coverPortrait:    item.cover_portrait_url || null,
        author:           pickTaxonomy(item.taxonomy, 'Author'),
        artist:           pickTaxonomy(item.taxonomy, 'Artist'),
        format:           pickTaxonomy(item.taxonomy, 'Format'),
        genre:            pickTaxonomy(item.taxonomy, 'Genre'),
        type:             pickTaxonomy(item.taxonomy, 'Type'),
        updatedAt:        item.updated_at || null,
        createdAt:        item.created_at || null,
      }))
    }
  } catch (err) {
    console.error('[SHINIGAMI SEARCH] Proxy fallback error:', err.message)
  }

  return []
}