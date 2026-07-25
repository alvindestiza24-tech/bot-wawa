// src/scrape/kompas.js
import axios from 'axios'
import * as cheerio from 'cheerio'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

async function fetchRSS(limit = 10) {
  try {
    const res = await axios.get('https://rss.kompas.com/kompas', {
      headers: { 'User-Agent': UA },
      timeout: 10000,
    })
    const $ = cheerio.load(res.data, { xmlMode: true })
    const articles = []
    $('item').each((i, item) => {
      if (articles.length >= limit) return
      const title = $(item).find('title').text().trim()
      const link = $(item).find('link').text().trim()
      const description = $(item).find('description').text().trim()
      const pubDate = $(item).find('pubDate').text().trim()
      if (title && link) {
        articles.push({
          title,
          url: link,
          thumbnail: null,
          description: description || title,
          time: pubDate,
          author: 'Kompas.com',
          source: 'Kompas.com (RSS)',
        })
      }
    })
    return articles
  } catch (e) {
    console.error('[KOMPAS] RSS error:', e.message)
    return []
  }
}

async function scrapeHTML(query = null, limit = 5) {
  try {
    let url = 'https://www.kompas.com/'
    if (query) {
      url = `https://www.kompas.com/search?q=${encodeURIComponent(query)}`
    }

    const res = await axios.get(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      timeout: 15000,
    })

    const $ = cheerio.load(res.data)
    const articles = []

    // Collect all links that look like article links
    const linkElements = $('a[href*="/read/"], a[href*="/story/"]')
    const seen = new Set()

    for (const el of linkElements) {
      if (articles.length >= limit) break
      const link = $(el).attr('href')
      if (!link || seen.has(link)) continue
      const title = $(el).text().trim()
      if (!title || title.length < 10) continue
      seen.add(link)

      // Try to get thumbnail from parent or img
      let thumbnail = null
      const parent = $(el).closest(
        '.article__item, .article__asset, .articleList__item, .most__item, .headline__item, .latest__item, .post-item'
      )
      const img = parent.find('img').first()
      if (img.length) {
        thumbnail = img.attr('src') || img.attr('data-src') || null
        if (thumbnail && thumbnail.startsWith('//')) thumbnail = 'https:' + thumbnail
      }

      // Description
      let description = ''
      const desc = parent.find('.article__summary, .article__description, .articleList__summary, .headline__description')
      if (desc.length) description = desc.text().trim()

      let time = ''
      const timeEl = parent.find('.article__time, .article__date, .timeago, .post__time')
      if (timeEl.length) time = timeEl.text().trim()

      let author = ''
      const authorEl = parent.find('.article__author, .post__author, .writer')
      if (authorEl.length) author = authorEl.text().trim()

      const fullUrl = link.startsWith('http') ? link : `https://www.kompas.com${link}`

      articles.push({
        title,
        url: fullUrl,
        thumbnail,
        description: description || title,
        time,
        author,
        source: 'Kompas.com',
      })
    }

    return articles
  } catch (e) {
    console.error('[KOMPAS] HTML error:', e.message)
    return []
  }
}

export async function scrapeKompas(query = null, limit = 5) {
 
  if (!query) {
    const rss = await fetchRSS(limit)
    if (rss.length) {
      return {
        success: true,
        articles: rss,
        total: rss.length,
        query: 'terkini',
      }
    }
  }

 
  let articles = await scrapeHTML(query, limit)

  if (query && articles.length === 0) {
    const rssAll = await fetchRSS(20)
    const filtered = rssAll.filter((a) =>
      a.title.toLowerCase().includes(query.toLowerCase())
    )
    if (filtered.length) {
      articles = filtered.slice(0, limit)
    }
  }

  if (articles.length === 0) {
    return {
      success: false,
      articles: [],
      total: 0,
      error: 'Tidak ada berita ditemukan.',
    }
  }

  return {
    success: true,
    articles: articles.slice(0, limit),
    total: articles.length,
    query: query || 'terkini',
  }
}

export async function getKompasTrending(limit = 5) {
  return scrapeKompas(null, limit)
}

export async function searchKompas(query, limit = 5) {
  return scrapeKompas(query, limit)
}