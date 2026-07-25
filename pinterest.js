// src/scrape/pinterest.js
import axios from 'axios'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// ─── Fungsi untuk mendapatkan cookies dari Pinterest ──────────────
async function getCookies() {
    try {
        const response = await axios.get('https://www.pinterest.com/csrf_error/', {
            timeout: 10000,
            headers: { 'User-Agent': UA }
        });
        const setCookieHeaders = response.headers['set-cookie'];
        if (setCookieHeaders) {
            const cookies = setCookieHeaders.map(cookieString => {
                const cookieParts = cookieString.split(';');
                const cookieKeyValue = cookieParts[0].trim();
                return cookieKeyValue;
            });
            return cookies.join('; ');
        } else {
            console.warn('No set-cookie headers found in the response.');
            return null;
        }
    } catch (error) {
        console.error('Error fetching cookies:', error);
        return null;
    }
}

// ─── Fungsi internal untuk mencari di Pinterest dengan metode baru ──
async function pinterestSearch(query) {
    try {
        const cookies = await getCookies();
        if (!cookies) {
            console.log('Failed to retrieve cookies. Exiting.');
            return [];
        }

        const url = 'https://www.pinterest.com/resource/BaseSearchResource/get/';
        const params = {
            source_url: `/search/pins/?q=${query}`,
            data: JSON.stringify({
                "options": {
                    "isPrefetch": false,
                    "query": query,
                    "scope": "pins",
                    "no_fetch_context_on_resource": false
                },
                "context": {}
            }),
            _: Date.now()
        };

        const headers = {
            'accept': 'application/json, text/javascript, */*, q=0.01',
            'accept-encoding': 'gzip, deflate',
            'accept-language': 'en-US,en;q=0.9',
            'cookie': cookies,
            'dnt': '1',
            'referer': 'https://www.pinterest.com/',
            'sec-ch-ua': '"Not(A:Brand";v="99", "Microsoft Edge";v="133", "Chromium";v="133"',
            'sec-ch-ua-full-version-list': '"Not(A:Brand";v="99.0.0.0", "Microsoft Edge";v="133.0.3065.92", "Chromium";v="133.0.6943.142"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-model': '""',
            'sec-ch-ua-platform': '"Windows"',
            'sec-ch-ua-platform-version': '"10.0.0"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0',
            'x-app-version': 'c056fb7',
            'x-pinterest-appstate': 'active',
            'x-pinterest-pws-handler': 'www/[username]/[slug].js',
            'x-pinterest-source-url': '/hargr003/cat-pictures/',
            'x-requested-with': 'XMLHttpRequest'
        };

        const { data } = await axios.get(url, {
            headers: headers,
            params: params,
            timeout: 15000
        });

        const container = [];
        const results = data.resource_response?.data?.results || [];
        results.forEach((result) => {
            if (result.images?.orig) {
                container.push({
                    upload_by: result.pinner?.username || '',
                    fullname: result.pinner?.full_name || '',
                    followers: result.pinner?.follower_count || 0,
                    caption: result.grid_title || '',
                    image: result.images.orig.url,
                    source: "https://id.pinterest.com/pin/" + result.id,
                });
            }
        });

        return container;
    } catch (error) {
        console.error('pinterestSearch error:', error);
        return [];
    }
}

// ─── Fungsi ekspor yang sudah ada, dengan implementasi baru ───

export async function scrapePinterestAPI(query, limit = 6) {
    try {
        const results = await pinterestSearch(query);
        const images = results.map(item => item.image).filter(url => url && url.startsWith('https://i.pinimg.com'));
        return images.slice(0, limit);
    } catch (error) {
        console.error('scrapePinterestAPI error:', error);
        return [];
    }
}

// Fungsi lama lainnya tetap seperti sebelumnya (tidak diubah)
export async function scrapePinterestHTML(query, limit = 6) {
    try {
        const res = await axios.get(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`, {
            headers: { 
                'User-Agent': UA,
                'Accept': 'text/html,*/*'
            },
            timeout: 15000,
        })
        const html = res.data
        const images = []
        const patterns = [
            /\"orig\":\{\"url\":\"(https:\/\/i\.pinimg\.com\/originals\/[^"]+\.(?:jpg|png|webp))\"/g,
            /\"736x\":\{\"url\":\"(https:\/\/i\.pinimg\.com\/[^"]+\.(?:jpg|png|webp))\"/g,
        ]
        for (const re of patterns) {
            let match
            while ((match = re.exec(html)) !== null && images.length < limit) {
                if (!images.includes(match[1])) images.push(match[1])
            }
            if (images.length >= limit) break
        }
        return images
    } catch { return [] }
}

export async function scrapeBingImages(query, limit = 5) {
    try {
        const res = await axios.get(
            `https://www.bing.com/images/search?q=${encodeURIComponent(query + ' pinterest')}&form=HDRSC2&first=1`,
            {
                headers: {
                    'User-Agent': UA,
                    'Accept': 'text/html,*/*',
                    'Accept-Language': 'id-ID,id;q=0.9',
                },
                timeout: 12000,
            }
        )
        const html = res.data
        const regex = /murl&quot;:&quot;(https?:\/\/[^&"]+\.(?:jpg|png|jpeg))&quot;/g
        const images = []
        let match
        while ((match = regex.exec(html)) !== null && images.length < limit) {
            const url = match[1]
            if (!url.includes('bing.com') && !images.includes(url)) images.push(url)
        }
        return images
    } catch { return [] }
}

export async function downloadImageBuffer(url) {
    // Coba langsung dengan beberapa variasi header
    const headersList = [
        {
            'User-Agent': UA,
            'Referer': 'https://www.pinterest.com/',
        },
        {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
            'Referer': 'https://www.pinterest.com/',
        },
        {
            'User-Agent': UA,
            'Origin': 'https://www.pinterest.com',
        }
    ]

    // 1. Coba axios dengan header berbeda
    for (const headers of headersList) {
        try {
            const res = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 15000,
                headers,
            })
            return Buffer.from(res.data)
        } catch (e) {
            if (e.response?.status !== 403) throw e
        }
    }

    // 2. Fallback fetch Node.js
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': UA,
                'Referer': 'https://www.pinterest.com/',
            }
        })
        if (res.ok) {
            const arrayBuffer = await res.arrayBuffer()
            return Buffer.from(arrayBuffer)
        }
    } catch {}

    // 3. Fallback proxy CORS (sebagai upaya terakhir)
    try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
        const res = await axios.get(proxyUrl, {
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: { 'User-Agent': UA }
        })
        return Buffer.from(res.data)
    } catch {}

    // 4. Fallback proxy kedua
    try {
        const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(url)}`
        const res = await axios.get(proxyUrl2, {
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: { 'User-Agent': UA }
        })
        return Buffer.from(res.data)
    } catch {}

    throw new Error('Gagal download gambar setelah semua cara')
}

// Fungsi gabungan untuk mendapatkan banyak gambar dari multi sumber
export async function scrapeImagesForPack(query, limit = 10) {
    let images = []
    // 1. Pinterest API (metode baru)
    images.push(...await scrapePinterestAPI(query, limit))
    if (images.length >= limit) return images.slice(0, limit)
    // 2. Pinterest HTML
    const html = await scrapePinterestHTML(query, limit - images.length)
    images.push(...html.filter(url => !images.includes(url)))
    if (images.length >= limit) return images.slice(0, limit)
    // 3. Bing
    const bing = await scrapeBingImages(query, limit - images.length)
    images.push(...bing.filter(url => !images.includes(url)))
    return images.slice(0, limit)
}

/**
 * Fungsi publik untuk mencari gambar di Pinterest
 * @param {string} query - Kata kunci pencarian
 * @param {number} limit - Jumlah hasil maksimal (default 10)
 * @returns {Promise<Array<{image: string, caption: string, upload_by: string, followers: number, source: string}>>}
 */
export async function searchPinterest(query, limit = 10) {
    const results = await pinterestSearch(query);
    return results.slice(0, limit);
}