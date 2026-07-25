// src/scrape/tiktoksearch.js
import axios from 'axios';

const API = 'https://tikwm.com/api/feed/search';

export async function tiktokSearch(keywords, count = 12) {
  if (!keywords) return { success: false, message: 'KEYWORDS_REQUIRED' };

  try {
    const payload = new URLSearchParams({
      keywords,
      count,
      cursor: 0,
      HD: 1
    });

    const { data } = await axios({
      method: 'POST',
      url: API,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': 'current_language=en'
      },
      data: payload.toString()
    });

    const videos = data?.data?.videos;
    if (!videos || videos.length === 0) {
      return { success: false, message: 'NO_VIDEOS_FOUND' };
    }

    const fixUrl = (url) => {
      if (!url) return '';
      if (url.startsWith('http')) return url;
      return `https://tikwm.com${url}`;
    };

    const results = videos.map(v => ({
      id: v.video_id,
      region: v.region,
      title: v.title || 'No Title',
      cover: fixUrl(v.cover),
      duration: v.duration,
      media: {
        no_watermark: fixUrl(v.play),
        watermark: fixUrl(v.wmplay),
        hd_video: fixUrl(v.hdplay),
        music: fixUrl(v.music)
      },
      stats: {
        play_count: v.play_count,
        digg_count: v.digg_count,
        comment_count: v.comment_count,
        share_count: v.share_count
      },
      author: {
        id: v.author.id,
        unique_id: v.author.unique_id,
        nickname: v.author.nickname,
        avatar: fixUrl(v.author.avatar)
      }
    }));

    return {
      success: true,
      total: results.length,
      query: keywords,
      videos: results
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}