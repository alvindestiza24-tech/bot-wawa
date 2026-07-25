// src/scrape/y2mate.js
import axios from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";

const BASE_URL = "https://id-y2mate.com";
const MAX_TOTAL_TIME = 58000;
const POLL_LIMIT = 55;
const POLL_DELAY = 1000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanText(text) {
  return String(text || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function compactAvailable(links) {
  const result = {};
  for (const [type, group] of Object.entries(links || {})) {
    for (const [id, item] of Object.entries(group || {})) {
      const format = item.f || type;
      let quality = item.q || id;
      if (id.includes("@")) {
        quality = id;
      }
      if (format === "m4a" && quality === ".m4a") {
        quality = cleanText(item.q_text).replace(".m4a", "").replace(/[()]/g, "").trim() || "256kbps";
      }
      if (!result[format]) result[format] = [];
      if (!result[format].includes(quality)) result[format].push(quality);
    }
  }
  return result;
}

function pickFormat(links, type, quality) {
  const group = links?.[type];
  if (!group) return null;
  const entries = Object.entries(group).map(([id, data]) => ({ id, ...data }));
  return entries.find(v => v.q === quality || v.id === quality || (v.f === type && v.q === quality)) || 
         entries.find(v => v.q === "auto") || 
         entries[0] || null;
}

function findDownloadUrl(data) {
  if (!data) return null;
  if (typeof data === "string") {
    const match = data.match(/https?:\/\/[^\s"'<>]+/i);
    return match ? match[0].replace(/\\\//g, "/") : null;
  }
  if (typeof data !== "object") return null;
  const keys = ["dlink", "download", "download_url", "url", "link", "result", "result_url", "file", "href"];
  for (const key of keys) {
    if (typeof data[key] === "string" && /^https?:\/\//i.test(data[key])) {
      return data[key].replace(/\\\//g, "/");
    }
  }
  for (const value of Object.values(data)) {
    const found = findDownloadUrl(value);
    if (found) return found;
  }
  return null;
}

/**
 * Fungsi utama untuk mendownload dari y2mate
 * @param {string} url - URL YouTube
 * @param {string} type - 'mp4' atau 'mp3'
 * @param {string} quality - misal '360p', '480p', '720p' untuk mp4; '128kbps', '192kbps' untuk mp3
 * @returns {Promise<{status: boolean, url?: string, title?: string, duration?: string, size?: string, error?: string, available?: object}>}
 */
export async function y2mate(url, type = 'mp4', quality = '360p') {
  const startedAt = Date.now();
  const jar = new CookieJar();
  
  // Jika ada CF_CLEARANCE dari env, set cookie
  if (process.env.CF_CLEARANCE) {
    await jar.setCookie(`cf_clearance=${process.env.CF_CLEARANCE}`, BASE_URL);
  }

  const api = wrapper(axios.create({
    jar,
    withCredentials: true,
    timeout: 20000,
    validateStatus: () => true,
    headers: {
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36",
      "accept": "*/*",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "origin": BASE_URL,
      "referer": `${BASE_URL}/`,
      "x-requested-with": "XMLHttpRequest",
      "sec-ch-ua": `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": `"Android"`
    }
  }));

  function elapsed() { return Date.now() - startedAt; }
  function timeoutReached() { return elapsed() >= MAX_TOTAL_TIME; }

  try {
    // 1. Load home page
    await api.get(`${BASE_URL}/`, {
      timeout: 15000,
      headers: { "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" }
    });

    if (timeoutReached()) throw new Error("Timeout setelah load home");

    // 2. Analyze
    const body = new URLSearchParams({
      k_query: url,
      k_page: "home",
      hl: "en",
      q_auto: "0"
    });
    const analyzeRes = await api.post(`${BASE_URL}/mates/analyzeV2/ajax`, body.toString(), {
      timeout: 20000,
      headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" }
    });

    if (analyzeRes.status !== 200 || analyzeRes.data?.status !== "ok") {
      return { status: false, error: `Gagal analyze: ${analyzeRes.data?.message || analyzeRes.status}` };
    }

    const detail = analyzeRes.data;
    const selected = pickFormat(detail.links, type, quality);
    if (!selected?.k) {
      return {
        status: false,
        error: `Format ${type} ${quality} tidak ditemukan`,
        available: compactAvailable(detail.links)
      };
    }

    // 3. Convert
    const convertBody = new URLSearchParams({
      vid: detail.vid,
      k: selected.k
    });
    const convertRes = await api.post(`${BASE_URL}/mates/convertV2/index`, convertBody.toString(), {
      timeout: 20000,
      headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" }
    });

    let resultUrl = findDownloadUrl(convertRes.data);
    let pollData = null;

    if (!resultUrl && convertRes.data?.b_id && !timeoutReached()) {
      // 4. Polling
      for (let i = 0; i < POLL_LIMIT; i++) {
        if (timeoutReached()) break;
        const pollBody = new URLSearchParams({ b_id: convertRes.data.b_id });
        const pollRes = await api.post(`${BASE_URL}/mates/convertV2/pool`, pollBody.toString(), {
          timeout: 10000,
          headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" }
        });
        const urlFound = findDownloadUrl(pollRes.data);
        if (urlFound) {
          resultUrl = urlFound;
          pollData = pollRes.data;
          break;
        }
        if (pollRes.data?.c_status === "FAILED" || pollRes.data?.status === "error") {
          break;
        }
        await sleep(POLL_DELAY);
      }
    }

    if (!resultUrl) {
      return {
        status: false,
        error: timeoutReached() ? "Timeout: proses terlalu lama" : "Link download tidak ditemukan",
        available: compactAvailable(detail.links)
      };
    }

    return {
      status: true,
      url: resultUrl,
      title: detail.title || null,
      duration: detail.t || null,
      size: selected.size || null,
      format: selected.f || type,
      quality: selected.q || quality,
      available: compactAvailable(detail.links)
    };

  } catch (error) {
    return {
      status: false,
      error: error.message || 'Terjadi kesalahan'
    };
  }
}

// Ekspor default juga
export default y2mate;