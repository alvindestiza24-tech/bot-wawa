// plugins/stalk/stalkroblox.js
import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'stalkroblox',
  alias: ['robloxstalk', 'rblxstalk', 'rbxstalk', 'stalkrbx'],
  category: 'stalk',
  description: 'Cek profil pengguna Roblox (lengkap)',
  usage: '.stalkroblox <username>',
  example: '.stalkroblox Builderman',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

const presenceType = {
  0: 'Offline',
  1: 'Online',
  2: 'In Game',
  3: 'In Studio',
}

async function Roblox(username) {
  try {
    // 1. Cari user
    const searchRes = await axios.get(
      `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10`,
      { timeout: 10000 }
    )

    if (!searchRes.data?.data?.length) {
      return { error: 'User tidak ditemukan' }
    }

    const user = searchRes.data.data[0]
    const userId = user.id

    // 2. Ambil semua data paralel
    const [detail, avatar, followers, following, friends, groups, games, badges, inventory] =
      await Promise.all([
        axios.get(`https://users.roblox.com/v1/users/${userId}`, { timeout: 8000 }),
        axios.get(
          `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png`,
          { timeout: 8000 }
        ),
        axios.get(`https://friends.roblox.com/v1/users/${userId}/followers/count`, { timeout: 8000 }),
        axios.get(`https://friends.roblox.com/v1/users/${userId}/followings/count`, { timeout: 8000 }),
        axios.get(`https://friends.roblox.com/v1/users/${userId}/friends/count`, { timeout: 8000 }),
        axios.get(`https://groups.roblox.com/v2/users/${userId}/groups/roles`, { timeout: 8000 }),
        axios.get(`https://games.roblox.com/v2/users/${userId}/games?limit=50`, { timeout: 8000 }),
        axios.get(`https://badges.roblox.com/v1/users/${userId}/badges?limit=50`, { timeout: 8000 }),
        axios
          .get(
            `https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?limit=50`,
            { timeout: 8000 }
          )
          .catch(() => ({ data: null })),
      ])

    // 3. Presence (POST)
    let presence = null
    try {
      const presRes = await axios.post(
        'https://presence.roblox.com/v1/presence/users',
        { userIds: [userId] },
        { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }
      )
      presence = presRes.data?.userPresences?.[0] || null
    } catch {}

    // 4. Susun hasil
    return {
      id: detail.data.id,
      username: detail.data.name,
      displayName: detail.data.displayName,
      description: detail.data.description || '-',
      created: detail.data.created,
      verified: user.hasVerifiedBadge || false,
      avatar: avatar.data?.data?.[0]?.imageUrl || null,
      social: {
        followers: followers.data?.count || 0,
        following: following.data?.count || 0,
        friends: friends.data?.count || 0,
      },
      groups: groups.data?.data || [],
      games: games.data?.data || [],
      badges: badges.data?.data || [],
      inventory: inventory.data?.data || 'private / tidak tersedia',
      presence,
    }
  } catch (err) {
    console.error('[ROBLOX-STALK]', err)
    return { error: err.message || 'Gagal mengambil data' }
  }
}

export async function handler(m, { sock }) {
  const username = m.args?.[0] || m.text?.trim()
  if (!username) {
    return m.reply(
      `🎮 *Roblox Stalk*\n\n` +
        `Masukkan username Roblox.\n` +
        `Contoh: *.stalkroblox Builderman*`
    )
  }

  await m.react('⏳')

  try {
    const res = await Roblox(username)

    if (res.error) {
      await m.react('❌')
      return m.reply(`❌ ${res.error}`)
    }

    // ─── Format info ──────────────────────────────────────────────
    const topGroups =
      res.groups
        .slice(0, 5)
        .map(
          g =>
            `  ◦ ${g.group.name} (${g.group.memberCount.toLocaleString()} members) — ${g.role.name}`
        )
        .join('\n') || '  ◦ Tidak ada'

    const topGames =
      res.games
        .slice(0, 5)
        .map(g => `  ◦ ${g.name} (${(g.placeVisits || 0).toLocaleString()} visits)`)
        .join('\n') || '  ◦ Tidak ada'

    const topBadges =
      res.badges
        .slice(0, 5)
        .map(b =>
          `  ◦ ${b.name} (${(b.statistics?.awardedCount || 0).toLocaleString()} awarded)`
        )
        .join('\n') || '  ◦ Tidak ada'

    const topInventory = Array.isArray(res.inventory)
      ? res.inventory
          .slice(0, 5)
          .map(
            item =>
              `  ◦ ${item.name} (RAP: ${item.recentAveragePrice?.toLocaleString() || '-'})`
          )
          .join('\n')
      : `  ◦ ${res.inventory}`

    const presInfo = res.presence
      ? `Status: ${presenceType[res.presence.userPresenceType] || res.presence.userPresenceType}\n  Last Location: ${res.presence.lastLocation || '-'}\n  PlaceId: ${res.presence.placeId || '-'}\n  GameId: ${res.presence.gameId || '-'}`
      : 'tidak tersedia'

    const text =
      `## 🎮 Profil Roblox\n` +
      `**ID:** ${res.id}\n` +
      `**Username:** ${res.username}\n` +
      `**Display Name:** ${res.displayName || '-'}\n` +
      `**Verified:** ${res.verified ? '✅ Ya' : '❌ Tidak'}\n` +
      `**Bergabung:** ${res.created ? new Date(res.created).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}\n\n` +
      `👥 **Friends:** ${res.social.friends.toLocaleString()}\n` +
      `👤 **Followers:** ${res.social.followers.toLocaleString()}\n` +
      `➕ **Following:** ${res.social.following.toLocaleString()}\n\n` +
      `*📍 Presence*\n${presInfo}\n\n` +
      `📝 *Bio:*\n${res.description?.substring(0, 300) || '-'}\n\n` +
      `👥 *Groups* (${res.groups.length}):\n${topGroups}\n\n` +
      `🎮 *Games* (${res.games.length}):\n${topGames}\n\n` +
      `🏆 *Badges* (${res.badges.length}):\n${topBadges}\n\n` +
      `🎒 *Inventory*:\n${topInventory}`

    const builder = new AIRich(sock).setTitle('🎮 Roblox Stalker')

    if (res.avatar) {
      builder.addImage(res.avatar)
    }

    builder.addText(text)
    builder.addSuggest(['stalkroblox', 'stalkff', 'stalkml'])

    await builder.send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    console.error('[ROBLOX-STALK]', err)
    await m.react('❌')
    await m.reply(beautifulMessage(`❌ Gagal: ${err.message}`, { pushName: m.pushName }))
  }
}