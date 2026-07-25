import { getDatabase }       from '../database.js'
import { generateWelcomeCard } from '../canvas/welcomecard.js'
import { generateGoodbyeCard } from '../canvas/goodbyecard.js'
import config                from '../../config.js'

const DEFAULT_PFP = 'https://i.imgur.com/bGqSIIq.jpg'
const DEFAULT_BG  = 'https://raw.githubusercontent.com/kyyinfinite/kyyinfinite/main/uploads/1782896390119-6283815201912.jpg'
const SLEEP       = ms => new Promise(r => setTimeout(r, ms))

function fmtMsg(template, data) {
  return String(template || '')
    .replace(/@user/g,    `@${data.userId}`)
    .replace(/@group/g,   data.subject || 'Grup')
    .replace(/@subject/g, data.subject || 'Grup')
    .replace(/@total/g,   String(data.total  || '?'))
    .replace(/@date/g,    data.date)
    .replace(/@time/g,    data.time)
    .replace(/@bio/g,     data.bio    || '-')
    .replace(/@owner/g,   config.owner?.name || 'Owner')
    .replace(/@bot/g,     config.bot?.name   || 'Bot')
}

async function getPfp(sock, jid) {
  try {
    return await sock.profilePictureUrl(jid, 'image')
  } catch {
    return DEFAULT_PFP
  }
}

async function getBio(sock, jid) {
  try {
    const res = await sock.fetchStatus(jid)
    return res?.status || '-'
  } catch {
    return '-'
  }
}

// Fungsi baru untuk mengekstrak string JID dari berbagai format peserta
function extractJid(participant) {
  if (typeof participant === 'string') return participant
  if (participant && typeof participant === 'object') {
    return participant.id || participant.jid || participant.user || participant.phoneNumber || ''
  }
  return ''
}

export async function handleGroupParticipantsUpdate(sock, update) {
  const { id: gid, participants, action } = update
  if (!gid || !participants?.length) return
  if (action !== 'add' && action !== 'remove') return

  const db        = getDatabase()
  const groupData = db.getGroup(gid)
  if (!groupData) return

  const w = groupData.welcome
  const g = groupData.goodbye

  if (action === 'add'    && !w?.enabled) return
  if (action === 'remove' && !g?.enabled) return

  const metadata = await sock.groupMetadata(gid).catch(() => ({}))

  if (metadata?.subject && !groupData.subject) {
    db.setGroup(gid, { subject: metadata.subject })
  }

  const now  = new Date()
  const date = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  for (const rawParticipant of participants) {
    try {
      const userJid = extractJid(rawParticipant)
      if (!userJid || !userJid.includes('@')) continue

      const userId = userJid.split('@')[0]

      const [pfpUrl, bio] = await Promise.all([
        getPfp(sock, userJid),
        getBio(sock, userJid),
      ])

      const msgData = {
        userId,
        subject: metadata?.subject || groupData.subject || 'Grup',
        total:   metadata?.participants?.length || '?',
        date,
        time,
        bio,
      }

      if (action === 'add') {
        await sendWelcome(sock, gid, userJid, pfpUrl, w, msgData)
      } else if (action === 'remove') {
        await sendGoodbye(sock, gid, userJid, pfpUrl, g, msgData)
      }

      await SLEEP(1000)
    } catch (err) {
      console.error(`[GROUP-EVENTS] ${action} error:`, err.message)
    }
  }
}

async function sendWelcome(sock, gid, userJid, pfpUrl, w, msgData) {
  const caption = fmtMsg(
    w.message || 'Halo @user! Selamat datang di @group 🎉',
    msgData
  )

  let cardBuffer = null
  try {
    cardBuffer = await generateWelcomeCard({
      profile:       pfpUrl || undefined,
      groupName:     msgData.subject,
      description:   caption,
      backgroundURL: w.background || DEFAULT_BG,
    })
  } catch (err) {
    console.error('[WELCOME-CARD]', err.message)
  }

  const sentMsg = await sock.sendMessage(gid, {
    image:    cardBuffer ?? { url: pfpUrl || DEFAULT_PFP },
    caption,
    mentions: [userJid],
  })

  if (sentMsg?.key && w.autoDelete !== false) {
    setTimeout(async () => {
      try { await sock.sendMessage(gid, { delete: sentMsg.key }) } catch {}
    }, 30000)
  }
}

async function sendGoodbye(sock, gid, userJid, pfpUrl, g, msgData) {
  const caption = fmtMsg(
    g.message || 'Selamat tinggal @user! Semoga sukses selalu 👋',
    msgData
  )

  let cardBuffer = null
  try {
    cardBuffer = await generateGoodbyeCard({
      profile:       pfpUrl || undefined,
      groupName:     msgData.subject,
      description:   caption,
      backgroundURL: g.background || DEFAULT_BG,
    })
  } catch (err) {
    console.error('[GOODBYE-CARD]', err.message)
  }

  await sock.sendMessage(gid, {
    image:    cardBuffer ?? { url: pfpUrl || DEFAULT_PFP },
    caption,
    mentions: [userJid],
  })
}