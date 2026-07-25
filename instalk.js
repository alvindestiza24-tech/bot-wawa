// src/scrape/instalk.js
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar, withCredentials: true }));

const baseHeaders = {
    'host': 'insta-stories-viewer.com',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0',
    'accept': '*/*',
    'accept-language': 'en-US,en;q=0.9',
    'origin': 'https://insta-stories-viewer.com',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
};

export async function instalk(username) {
    const referer = `https://insta-stories-viewer.com/${username}/`;
    const headers = { ...baseHeaders, referer };
    const t = () => `O${Date.now()}${Math.random().toString(36).substring(2, 7)}`;

    try {
        const resHtml = await client.get(`https://insta-stories-viewer.com/${username}/`, {
            headers: {
                ...baseHeaders,
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'sec-fetch-dest': 'document',
                'sec-fetch-mode': 'navigate',
                'upgrade-insecure-requests': '1'
            }
        });
        const html = resHtml.data;

        const getMeta = (regexStr) => {
            const match = html.match(new RegExp(regexStr));
            return match ? match[1].trim() : null;
        };

        const metadata = {
            posts: getMeta('profile__stats-posts">([^<]+)<'),
            followers: getMeta('profile__stats-followers">([^<]+)<'),
            following: getMeta('profile__stats-follows">([^<]+)<'),
            avatar: getMeta('<img class="profile__avatar-pic" src="([^"]+)"')
        };

        const resConnect = await client.get('https://insta-stories-viewer.com/connect/', { headers });
        const token = resConnect.data.token;

        const resPoll1 = await client.get(`https://insta-stories-viewer.com/socket.io/?EIO=4&transport=polling&t=${t()}`, { headers });
        const sidMatch = resPoll1.data.match(/"sid":"([^"]+)"/);
        if (!sidMatch) {
            return { status: "error", code: 500, username, result: { message: "Gagal mendapatkan session ID" } };
        }
        const sid = sidMatch[1];

        await client.post(`https://insta-stories-viewer.com/socket.io/?EIO=4&transport=polling&t=${t()}&sid=${sid}`, '40', {
            headers: { ...headers, 'content-type': 'text/plain;charset=UTF-8' }
        });

        await client.get(`https://insta-stories-viewer.com/socket.io/?EIO=4&transport=polling&t=${t()}&sid=${sid}`, { headers });
        await client.get(`https://insta-stories-viewer.com/socket.io/?EIO=4&transport=polling&t=${t()}&sid=${sid}`, { headers });

        const date = Date.now();
        const payload = `42["search",{"username":"${username}","date":${date},"token":"${token}"}]`;
        await client.post(`https://insta-stories-viewer.com/socket.io/?EIO=4&transport=polling&t=${t()}&sid=${sid}`, payload, {
            headers: { ...headers, 'content-type': 'text/plain;charset=UTF-8' }
        });

        const resPollFinal = await client.get(`https://insta-stories-viewer.com/socket.io/?EIO=4&transport=polling&t=${t()}&sid=${sid}`, { headers });
        const rawData = resPollFinal.data;

        let storiesData = [];
        if (typeof rawData === 'string' && rawData.startsWith('42')) {
            const parsed = JSON.parse(rawData.substring(2));
            if (Array.isArray(parsed) && parsed.length > 1) {
                storiesData = parsed[1];
            }
        }

        return {
            status: "success",
            code: 200,
            username: username,
            result: {
                metadata: metadata,
                stories: storiesData
            }
        };
    } catch (err) {
        return {
            status: "error",
            code: err.response ? err.response.status : 500,
            username: username,
            result: { message: err.message }
        };
    }
}