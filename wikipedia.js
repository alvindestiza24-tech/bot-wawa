// src/scrape/wikipedia.js
import axios from 'axios'
import * as cheerio from 'cheerio'

const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36'

function decodeHtml(text) {
  return String(text || '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function cleanText(text) {
  return decodeHtml(text)
    .replace(/<\/?[^>]+>/g, '')
    .replace(/\[\d+\]/g, '')
    .replace(/\[[a-z]\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanBlock(text) {
  return decodeHtml(text)
    .replace(/<\/?[^>]+>/g, '')
    .replace(/\[\d+\]/g, '')
    .replace(/\[[a-z]\]/gi, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function fixUrl(url, base) {
  if (!url) return null
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) return `${base}${url}`
  return url
}

function uniqueBy(array, key) {
  return array.filter((item, index, self) => self.findIndex(x => x[key] === item[key]) === index)
}

export async function searchWikipedia(query, lang = 'id', limit = 5) {
  const BASE = `https://${lang}.wikipedia.org`
  const API = `${BASE}/w/api.php`

  const { data, status } = await axios.get(API, {
    params: {
      action: 'query',
      list: 'search',
      srsearch: query,
      srlimit: limit,
      format: 'json',
      origin: '*',
    },
    headers: {
      'user-agent': UA,
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  })

  return {
    code: status,
    results: data?.query?.search || [],
    baseUrl: BASE,
  }
}

export async function getFullArticle(title, lang = 'id') {
  const BASE = `https://${lang}.wikipedia.org`
  const pagePath = `/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`
  const pageUrl = `${BASE}${pagePath}`

  const { data, status } = await axios.get(pageUrl, {
    headers: {
      'user-agent': UA,
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      referer: 'https://www.wikipedia.org/',
    },
  })

  const $ = cheerio.load(data)

  // Remove unnecessary elements
  $('script, style, noscript, sup.reference, .mw-editsection, .navbox, .metadata, .ambox, .hatnote, .toc, #toc, table.vertical-navbox').remove()

  const pageTitle = cleanText($('#firstHeading').text()) || title
  const description = cleanText($('.tagline').first().text()) || null

  // Extract intro paragraphs
  const introParagraphs = []
  $('.mw-parser-output > section').first().find('p').each((_, el) => {
    const text = cleanBlock($(el).text())
    if (text.length > 40) introParagraphs.push(text)
  })

  if (!introParagraphs.length) {
    $('.mw-parser-output > p').each((_, el) => {
      const text = cleanBlock($(el).text())
      if (text.length > 40) introParagraphs.push(text)
    })
  }

  // Extract sections
  const sections = []
  $('.mw-parser-output > section').each((_, section) => {
    const heading = cleanText($(section).find('h2, h3').first().text())
    if (!heading || heading.toLowerCase() === 'daftar isi') return

    const texts = []
    $(section).find('p, ul, ol').each((_, el) => {
      const text = cleanBlock($(el).text())
      if (text.length > 40) texts.push(text)
    })

    if (texts.length) {
      sections.push({
        title: heading,
        text: texts.join('\n\n'),
      })
    }
  })

  // Extract infobox
  const infobox = {}
  $('.infobox tr').each((_, tr) => {
    const key = cleanText($(tr).find('th').first().text())
    const value = cleanText($(tr).find('td').first().text())
    if (key && value && key.length < 100) {
      infobox[key] = value
    }
  })

  // Extract images
  const images = []
  $('.mw-parser-output img').each((_, img) => {
    const src = fixUrl($(img).attr('src'), BASE)
    const alt = cleanText($(img).attr('alt'))
    if (!src) return
    if (src.includes('static/images')) return
    if (src.includes('Semi-protection')) return
    if (src.includes('OOjs_UI')) return

    images.push({
      alt: alt || null,
      url: src,
    })
  })

  return {
    code: status,
    article: {
      title: pageTitle,
      description,
      url: pageUrl,
      extract: introParagraphs.join('\n\n') || null,
      sections,
      infobox,
      images: uniqueBy(images, 'url'),
    },
  }
}