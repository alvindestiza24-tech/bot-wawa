import axios from "axios";

// ── Search ──────────────────────────────────────────────────────────────────
const SEARCH_URL = "https://api-mobi.soundcloud.com/search";

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export async function searchSoundCloud(query) {
  try {
    const res = await axios.get(SEARCH_URL, {
      params: {
        q: query,
        client_id: "KKzJxmw11tYpCs6T24P4uUYhqmjalG6M",
        stage: "",
      },
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.1",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    });

    const items = res.data?.collection || [];

    const results = items.map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.user?.username || null,
      duration_ms: track.duration,
      duration: formatDuration(track.duration),
      url: track.permalink_url,
      artwork: track.artwork_url,
      genre: track.genre || null,
      plays: track.playback_count || 0,
      likes: track.likes_count || 0,
    }));

    return {
      success: true,
      query,
      total: results.length,
      results,
    };
  } catch (err) {
    return {
      success: false,
      query,
      status: err.response?.status || 500,
      message: err.message,
    };
  }
}

// ── Download ────────────────────────────────────────────────────────────────
export async function scdl(url) {
  const base = 'https://convertico.com/';
  const endpoint = base + 'soundcloud-downloader/soundcloud-downloader.php';

  const headers = {
    'accept': '*/*',
    'origin': base,
    'referer': base + 'soundcloud-downloader/',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  try {
    const responseInfo = await axios.post(endpoint, new URLSearchParams({
      action: 'fetch',
      url
    }), { headers });

    const info = responseInfo.data;
    if (!info.status) throw new Error("Gagal mengambil info lagu");

    const responseDl = await axios.post(endpoint, new URLSearchParams({
      action: 'download',
      url,
      quality: '192',
      is_playlist: '0'
    }), { headers });

    const dl = responseDl.data;
    if (!dl.file_url) throw new Error("Gagal generate link download");

    const downloadUrl = base + 'soundcloud-downloader/' + dl.file_url.split('/').map(encodeURIComponent).join('/');

    return {
      title: info.title,
      uploader: info.author,
      duration: `${Math.floor(info.duration / 60)}:${String(info.duration % 60).padStart(2, '0')}`,
      views: info.view_count.toLocaleString(),
      likes: info.like_count.toLocaleString(),
      thumbnail: info.thumbnail,
      size: `${(dl.size / 1024 / 1024).toFixed(2)} MB`,
      format: dl.format,
      download_url: downloadUrl
    };
  } catch (err) {
    throw new Error(err.message);
  }
}