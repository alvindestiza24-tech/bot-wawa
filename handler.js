// src/handler.js
import { serialize } from './serialize.js'
import { getDatabase } from './database.js'
import config from '../config.js'
import { pluginStore } from './plugins.js'
import { getAfk, deleteAfk } from './lib/afk-store.js'
import { notifyCommand as tgNotify } from './lib/telegram-notify.js'
import logger from './lib/logger.js'
import { notifyCommand as dcNotify } from './lib/discord-webhook.js'
import { analyzeImage, shouldBlock } from './ai/nsfw-detector.js'
import { handleCSAI } from './ai/cs-ai/index.js'
import { analyzeText, shouldBlock as shouldBlockToxic } from './ai/toxic-detector.js'
import {
  cacheParticipantLids,
  resolveAnyLidToJid,
  isLid,
  isLidConverted,
} from './lib/lid.js'
import { hasLink, linkType } from './lib/anti-link.js'
import { fmtDuration }        from './lib/function.js'
import { getAllCategories }    from './lib/store-db.js'
import { getSession as getGameSession, processGameMessage } from './lib/game/asahotak.js'

const cooldownMap      = new Map()
const nsfwCooldownMap  = new Map()
const toxicCooldownMap = new Map()
const linkCooldownMap  = new Map()
const groupMetaCache   = new Map()
const GROUP_META_TTL   = 30_000

function cooldownKey(sender, command) { return `${sender}:${command}` }

function isOnCooldown(sender, command, seconds) {
  const last = cooldownMap.get(cooldownKey(sender, command))
  return last ? Date.now() - last < seconds * 1000 : false
}

function setCooldown(sender, command) {
  cooldownMap.set(cooldownKey(sender, command), Date.now())
}

function remainingCooldown(sender, command, seconds) {
  const last = cooldownMap.get(cooldownKey(sender, command))
  if (!last) return 0
  return Math.ceil((seconds * 1000 - (Date.now() - last)) / 1000)
}

function isNsfwOnCooldown(groupJid, seconds = 5) {
  const last = nsfwCooldownMap.get(groupJid)
  return last ? Date.now() - last < seconds * 1000 : false
}

function setNsfwCooldown(groupJid) {
  nsfwCooldownMap.set(groupJid, Date.now())
}

function isToxicOnCooldown(groupJid, seconds = 5) {
  const last = toxicCooldownMap.get(groupJid)
  return last ? Date.now() - last < seconds * 1000 : false
}

function setToxicCooldown(groupJid) {
  toxicCooldownMap.set(groupJid, Date.now())
}

function isLinkOnCooldown(groupJid, seconds = 3) {
  const last = linkCooldownMap.get(groupJid)
  return last ? Date.now() - last < seconds * 1000 : false
}

function setLinkCooldown(groupJid) {
  linkCooldownMap.set(groupJid, Date.now())
}

function jidNorm(jid) {
  if (!jid) return ''
  return String(jid).split(':')[0].split('@')[0]
}

function jidMatch(jidA, jidB, participants = []) {
  if (!jidA || !jidB) return false

  const normA = jidNorm(jidA)
  const normB = jidNorm(jidB)

  if (normA === normB) return true

  const resolvedA = resolveAnyLidToJid(jidA, participants)
  const resolvedB = resolveAnyLidToJid(jidB, participants)

  if (jidNorm(resolvedA) === jidNorm(resolvedB)) return true
  if (jidNorm(resolvedA) === normB) return true
  if (normA === jidNorm(resolvedB)) return true

  return false
}

async function checkAfk(m) {
  const myAfk = getAfk(m.sender)
  if (myAfk) {
    if (m.isCommand && m.command?.toLowerCase() === 'afk') return
    deleteAfk(m.sender)
    await m.reply(
      `👋 *ᴀꜰᴋ ʙᴇʀᴀᴋʜɪʀ*\n\n` +
      `\`\`\`@${m.senderNumber} sudah kembali!\`\`\`\n` +
      `🍀 \`Durasi AFK:\` *${fmtDuration(Date.now() - myAfk.time)}*`,
      { mentions: [m.sender] }
    )
  }

  if (m.isGroup && m.mentionedJid?.length) {
    for (const jid of m.mentionedJid) {
      const data = getAfk(jid)
      if (!data) continue
      await m.reply(
        `💤 *ᴜsᴇʀ ᴀꜰᴋ*\n\n` +
        `\`Hustt!\` \`@${jid.split('@')[0]}\` lagi AFK\n` +
        `🍀 \`Alasan:\` *${data.reason}*\n` +
        `⏱️ \`Sudah:\` *${fmtDuration(Date.now() - data.time)}*`,
        { mentions: [jid] }
      )
    }
  }
}

async function fetchGroupMeta(sock, chat) {
  const now    = Date.now()
  const cached = groupMetaCache.get(chat)
  if (cached && (now - cached.ts) < GROUP_META_TTL) return cached.meta

  try {
    const meta = await sock.groupMetadata(chat)
    if (meta?.participants?.length) {
      cacheParticipantLids(meta.participants)
      groupMetaCache.set(chat, { meta, ts: now })
      return meta
    }
  } catch (err) {
    logger.warn('HANDLER', `groupMetadata gagal: ${err.message}`)
    if (cached) return cached.meta
  }
  return null
}

function invalidateGroupMeta(chat) {
  groupMetaCache.delete(chat)
}

function checkIsBotAdmin(sock, groupMeta) {
  if (!groupMeta?.participants?.length) return false
  const participants = groupMeta.participants
  const botJid = sock.user?.id || ''

  return participants.some(p => {
    if (p.admin !== 'admin' && p.admin !== 'superadmin') return false
    return jidMatch(p.id, botJid, participants) ||
           jidMatch(p.lid || '', botJid, participants)
  })
}

function checkIsGroupAdmin(senderJid, groupMeta) {
  if (!groupMeta?.participants?.length) return false
  const participants = groupMeta.participants

  return participants.some(p => {
    if (p.admin !== 'admin' && p.admin !== 'superadmin') return false
    return jidMatch(p.id, senderJid, participants) ||
           jidMatch(p.lid || '', senderJid, participants)
  })
}

async function getBotAdminStatus(sock, chat) {
  const groupMeta  = await fetchGroupMeta(sock, chat)
  const isBotAdmin = checkIsBotAdmin(sock, groupMeta)
  return { groupMeta, isBotAdmin }
}

export async function messageHandler(rawMsg, sock) {
  if (!rawMsg.message) return;

  const m = serialize(rawMsg, sock);
  if (!m || !m.from) return;

  const msgType = Object.keys(rawMsg.message || {})[0];
  if (msgType === 'protocolMessage' || msgType === 'senderKeyDistributionMessage') return;

  if (config.isBanned(m.sender)) return;

  if (config.mode === 'self' && !config.isOwner(m.sender) && !m.fromMe) {
    return;
  }

  await checkAfk(m);

  // ─── BOT DETECTOR ────────────────────────────────────────────────────────
  // Hanya jalankan untuk pesan dari luar (bukan owner, bukan fromMe).
  // Untuk pesan GRUP: hanya aktif jika groupData.botDetection === true (opt-in).
  // Untuk pesan PRIVATE: selalu aktif selama config.security.botDetection.enabled = true.
  if (!m.fromMe && !config.isOwner(m.sender)) {
    const bdCfg = config.security?.botDetection
    if (bdCfg?.enabled !== false) {
      // Per-group toggle: cek flag botDetection di database grup
      let runDetector = true
      if (m.isGroup) {
        const _gData = getDatabase().getGroup(m.chat)
        runDetector  = _gData?.botDetection === true  // default OFF untuk grup (opt-in)
      }

      if (runDetector) {
        const { analyzeMessage, canWarn, logSecurity } = await import('./lib/bot-detector.js')
        const analysis = analyzeMessage(m, sock, rawMsg, bdCfg)

      if (analysis.suspicious) {
        const { score, reasons } = analysis
        const thr     = bdCfg.thresholds || {}
        const actions = bdCfg.actions    || {}

        // ── Log ke console dan file ────────────────────────────────────────
        logger.warn('BOT-DETECTOR',
          `Score ${score} | ${m.senderNumber} (${m.pushName || '-'}) | ${m.isGroup ? 'Grup' : 'Private'}`
        )
        if (actions.log !== false) {
          logSecurity({
            sender:    m.senderNumber,
            pushName:  m.pushName  || '-',
            chat:      m.chat,
            isGroup:   m.isGroup,
            score,
            reasons,
            deviceId:        analysis.deviceId,
            forwardingScore: analysis.forwardingScore,
          })
        }

        // ── Ban permanen (skor tertinggi, diproses duluan) ─────────────────
        if (score >= (thr.ban ?? 80) && actions.banUser !== false) {
          try {
            const { addBanned } = await import('./lib/role-db.js')
            addBanned(
              m.sender,
              `[AutoBan] Score ${score}/100 — ${reasons.slice(0, 3).join('; ')}`
            )
            logger.warn('BOT-DETECTOR', `AutoBan: ${m.senderNumber} (score ${score})`)
          } catch {}
        }

        // ── Tendang dari grup ──────────────────────────────────────────────
        if (score >= (thr.kick ?? 60) && m.isGroup && actions.kickFromGroup !== false) {
          try {
            await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
            logger.warn('BOT-DETECTOR', `AutoKick: ${m.senderNumber} dari ${m.chat}`)
          } catch {}
        }

        // ── Hapus pesan ───────────────────────────────────────────────────
        if (score >= (thr.delete ?? 40) && actions.deleteMessage !== false) {
          try {
            await sock.sendMessage(m.chat, { delete: m.key })
          } catch {}
        }

        // ── Peringatan ke user (hanya jika belum kena cooldown warn) ──────
        if (score >= (thr.warn ?? 20) && score < (thr.delete ?? 40) && actions.warnUser !== false) {
          const warnCdMs = bdCfg.cooldown?.warnCooldown ?? 5 * 60 * 1000
          if (canWarn(m.sender, warnCdMs)) {
            const warnText =
              `⚠️ *Peringatan Keamanan*\n\n` +
              `Sistem mendeteksi aktivitas tidak biasa dari akunmu.\n` +
              `*Skor risiko:* ${score}/100\n\n` +
              `_Jika ini keliru, abaikan pesan ini._`
            try {
              await m.reply(warnText)
            } catch {}
          }
        }

        // ── Notifikasi ke owner (hanya untuk skor tinggi, non-blocking) ───
        if (score >= (thr.delete ?? 40) && actions.notifyOwner !== false) {
          const ownerNumber = config.owner.number?.[0]
          if (ownerNumber) {
            const ownerJid  = ownerNumber.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
            const notifText =
              `🚨 *[BOT-DETECTOR] Alert*\n\n` +
              `📱 *Pengirim:* @${m.senderNumber}\n` +
              `👤 *Nama:* ${m.pushName || '-'}\n` +
              `💬 *Chat:* ${m.isGroup ? `Grup (${m.chat})` : 'Private'}\n` +
              `📊 *Skor:* ${score}/100\n\n` +
              `📋 *Alasan Deteksi:*\n${reasons.map(r => `  • ${r}`).join('\n')}`
            sock.sendMessage(ownerJid, { text: notifText, mentions: [m.sender] }).catch(() => {})
          }
        }

        // ── Hentikan pemrosesan jika skor >= delete threshold ─────────────
        if (score >= (thr.delete ?? 40)) return
      }
      }   // end if (runDetector)
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const rawText = (m.text || m.body || '').trim();
  const evalTriggers = ['=>', '>', 'js', 'run'];
  if (rawText) {
    const match = evalTriggers.find(trigger => rawText.startsWith(trigger + ' ') || rawText === trigger);
    if (match) {
      if (!config.isOwner(m.sender)) {
        await m.reply('❌ Hanya owner yang dapat menggunakan eval.');
        return;
      }
      let code = rawText.slice(match.length).trim();
      if (!code && m.quoted) {
        code = m.quoted.body || m.quoted.text || '';
      }
      if (!code) {
        await m.reply('❌ Masukkan kode setelah command, atau reply ke pesan berisi kode.');
        return;
      }
      m.text = code;
      const { runEval } = await import('./lib/eval-runner.js');
      await runEval(m, {
        sock,
        config,
        db: getDatabase(),
        groupMeta: null, 
        isOwner: true,
        isPremium: config.isPremium(m.sender),
        isGroupAdmin: false,
        isBotAdmin: false,
      });
      return;
    }
  }


  let earlyGroupMeta = null

  if (m.isGroup) {
    const db        = getDatabase()
    let groupData   = db.getGroup(m.chat)

    // Auto-daftar grup ke database jika belum ada
    if (!groupData) {
      groupData = db.setGroup(m.chat, {
        antinsfw: false,
        antitoxic: false,
        antilink: false,
        onlyAdmin: false,
        warnings: {},
        maxWarnings: 3
      })
    }

    // Ambil metadata grup lebih awal untuk keperluan onlyAdmin
    earlyGroupMeta = await fetchGroupMeta(sock, m.chat)

    // --- ONLY ADMIN CHECK ---
    if (groupData.onlyAdmin) {
      const isSenderAdmin = earlyGroupMeta ? checkIsGroupAdmin(m.sender, earlyGroupMeta) : false
      if (!isSenderAdmin && !config.isOwner(m.sender)) {
        return // non-admin tidak direspons sama sekali
      }
    }

// ─── ANTI-BOT ──────────────────────────────────────
if (groupData?.antiBot) {
  // Cek apakah pengirim atau device-nya trusted
  const { isTrusted, analyzeBotMessage, getDeviceType } = await import('./lib/antiBot.js')
  if (!isTrusted(m, groupData)) {
    const botCheck = analyzeBotMessage(m)
    if (botCheck.isBot) {
      const senderJid = m.sender
      // Jangan tindak admin grup
      const isSenderAdmin = groupMeta
        ? groupMeta.participants.some(p => (p.id || p.jid) === senderJid && (p.admin === 'admin' || p.admin === 'superadmin'))
        : false
      if (!isSenderAdmin) {
        // Hapus pesan
        try {
          await sock.sendMessage(m.chat, { delete: m.key })
        } catch {}
        // Kick
        try {
          await sock.groupParticipantsUpdate(m.chat, [senderJid], 'remove')
        } catch {}
        await sock.sendMessage(m.chat, {
          text: `🤖 *AntiBot* — @${senderJid.split('@')[0]} terdeteksi sebagai bot dan di-kick.`,
          mentions: [senderJid],
        })
        return
      }
    }
  }
}

    const MEDIA_TYPES = ['imageMessage', 'videoMessage', 'stickerMessage']
    if (MEDIA_TYPES.includes(m.type) && groupData?.antinsfw && !isNsfwOnCooldown(m.chat)) {
      setNsfwCooldown(m.chat)
      try {
        const mimeType    = m.type === 'videoMessage' ? 'video/mp4' : 'image/jpeg'
        const mediaBuffer = await m.download()
        if (mediaBuffer) {
          const result = await analyzeImage(mediaBuffer, mimeType)
          if (shouldBlock(result)) {
            const { isBotAdmin } = await getBotAdminStatus(sock, m.chat)
            if (isBotAdmin) await sock.sendMessage(m.chat, { delete: m.key })
            await sock.sendMessage(
              m.chat,
              {
                text:
                  `⚠️ *Konten tidak pantas terdeteksi!*\n\n` +
                  `📛 Alasan: ${result.reason || result.label}\n` +
                  `🔒 Keyakinan: ${(result.confidence * 100).toFixed(0)}%\n\n` +
                  `Konten telah dihapus. Mohon jaga etika.`
              },
              { quoted: m.raw }
            )
            logger.info('NSFW', `Diblokir — ${m.senderNumber} di ${m.chat}`)
            return
          }
        }
      } catch (err) {
        logger.error('NSFW', `Error analisis: ${err.message}`)
      }
    }

    const TEXT_TYPES = ['conversation', 'extendedTextMessage']
    if (TEXT_TYPES.includes(m.type) && m.body && !m.isCommand && groupData?.antitoxic && !isToxicOnCooldown(m.chat)) {
      setToxicCooldown(m.chat)
      try {
        const result = await analyzeText(m.body)
        if (shouldBlockToxic(result)) {
          const { isBotAdmin } = await getBotAdminStatus(sock, m.chat)
          if (isBotAdmin) await sock.sendMessage(m.chat, { delete: m.key })
          await sock.sendMessage(
            m.chat,
            {
              text:
                `⚠️ *Komentar tidak pantas terdeteksi!*\n\n` +
                `📛 Kategori: ${result.label}\n` +
                `🔒 Keyakinan: ${(result.confidence * 100).toFixed(0)}%\n\n` +
                `Pesan telah dihapus. Mohon jaga etika.`
            },
            { quoted: m.raw }
          )
          logger.info('TOXIC', `Diblokir dari ${m.senderNumber} di ${m.chat}: "${m.body.slice(0, 80)}"`)
          return
        }
      } catch (err) {
        logger.error('TOXIC', `Error analisis: ${err.message}`)
      }
    }

    // ANTI‑LINK (GRUP + TEKS)
    if (TEXT_TYPES.includes(m.type) && m.body && !m.isCommand && groupData?.antilink && !isLinkOnCooldown(m.chat)) {
      setLinkCooldown(m.chat)
      if (hasLink(m.body)) {
        try {
          const { isBotAdmin } = await getBotAdminStatus(sock, m.chat)
          if (isBotAdmin) await sock.sendMessage(m.chat, { delete: m.key })
          const linkLabel = linkType(m.body)
          await sock.sendMessage(
            m.chat,
            {
              text:
                `⚠️ *Link terdeteksi!*\n\n` +
                `📛 Tipe: ${linkLabel}\n` +
                `🚫 Link telah dihapus. Dilarang mengirim link di grup ini.`
            },
            { quoted: m.raw }
          )
          logger.info('ANTILINK', `Diblokir dari ${m.senderNumber} di ${m.chat} (${linkLabel})`)
          return
        } catch (err) {
          logger.error('ANTILINK', `Error: ${err.message}`)
        }
      }
    }
  }

  let plugin          = null
  let resolvedCommand = ''

  if (m.isCommand && m.command) {
    plugin = pluginStore.get(m.command)
    if (plugin) resolvedCommand = m.command
  }

  if (!plugin && m.rawCommand) {
    const candidate = pluginStore.get(m.rawCommand)
    if (candidate?.config?.prefix === false) {
      plugin          = candidate
      resolvedCommand = m.rawCommand
      m.command       = m.rawCommand
      m.args          = m.rawArgs || []
      m.text          = m.rawText || ''
      m.isCommand     = true
    }
  }

  if (!plugin && m.rawCommand) {
    try {
      const cats     = getAllCategories()
      const matchKey = Object.keys(cats).find(
        k => k === m.rawCommand ||
             (cats[k].name || '').toLowerCase() === m.rawCommand
      )
      if (matchKey) {
        const { handler: prodHandler, config: prodCfg } = await import('../plugins/store/product.js')
        plugin          = { config: prodCfg, handler: (msg, ctx) => prodHandler(msg, ctx, matchKey) }
        resolvedCommand = matchKey
        m.command       = matchKey
        m.args          = m.rawArgs || []
        m.text          = m.rawText || ''
        m.isCommand     = true
      }
    } catch {}
  }

  if (!plugin && m.rawCommand?.endsWith('menu') && m.rawCommand !== 'menu') {
    const menuPlugin = pluginStore.get('menu')
    if (menuPlugin?.config?.prefix === false) {
      plugin          = menuPlugin
      resolvedCommand = 'menu'
      m.command       = 'menu'
      m.args          = [m.rawCommand]
      m.text          = m.rawCommand
      m.isCommand     = true
    }
  }

  // --- GAME ASAH OTAK: cek jawaban langsung ---
  if (!plugin && m.isGroup && m.body && !m.isCommand) {
    try {
      if (getGameSession(m.chat)) {
        await processGameMessage(m.chat, m.body, m, sock)
        return
      }
    } catch {}
  }

  // --- CS AI ---
  if (!m.isCommand && m.body?.trim()) {
    try {
      const handled = await handleCSAI(m, sock)
      if (handled) return
    } catch {}
  }

  // --- PLUGIN MANAGER SESSION ---
  if (!plugin) {
    try {
      const pm = await import('../plugins/owner/pluginmanager.js')
      if (pm.hasSession && pm.hasSession(m.sender)) {
        await pm.handler(m, { sock })
        return
      }
    } catch {}
  }


  if (!plugin) return

  const { config: pCfg, handler } = plugin

  if (!pCfg || typeof handler !== 'function') return

  if (pCfg.isEnabled === false) {
    return m.reply(config.messages?.commandDisabled || '❌ Fitur ini sedang dinonaktifkan.')
  }

  const isOwner   = config.isOwner(m.sender)
  const isPremium = isOwner || config.isPremium(m.sender)

  if (pCfg.isOwner && !isOwner) {
    return m.reply(config.messages?.ownerOnly || '❌ *Akses Ditolak*\n\n> Hanya owner yang dapat menggunakan fitur ini.')
  }

  if (pCfg.isPremium && !isPremium) {
    return m.reply(config.messages?.premiumOnly || '❌ *Akses Ditolak*\n\n> Hanya member premium yang dapat menggunakan fitur ini.')
  }

  if (pCfg.isGroup && !m.isGroup) {
    return m.reply(config.messages?.groupOnly || '❌ Fitur ini hanya dapat digunakan di dalam grup.')
  }

  if (pCfg.isPrivate && m.isGroup) {
    return m.reply(config.messages?.privateOnly || '❌ Fitur ini hanya dapat digunakan di chat pribadi.')
  }

  // --- INISIALISASI GROUP META (gunakan earlyGroupMeta jika sudah ada) ---
  let groupMeta   = earlyGroupMeta || null
  let isGroupAdmin = false
  let isBotAdmin   = false

  if (m.isGroup) {
    if (!groupMeta) {
      groupMeta = await fetchGroupMeta(sock, m.chat)
    }
    isGroupAdmin = checkIsGroupAdmin(m.sender, groupMeta)
    isBotAdmin   = checkIsBotAdmin(sock, groupMeta)
  }

  if (m.isGroup && pCfg.isAdmin && !isGroupAdmin && !isOwner) {
    return m.reply(config.messages?.adminOnly || '❌ Hanya admin grup yang dapat menggunakan fitur ini.')
  }

  if (pCfg.isBotAdmin && !isBotAdmin) {
    return m.reply(config.messages?.botAdminRequired || '❌ *Bot Bukan Admin!* Jadikan bot sebagai admin grup terlebih dahulu.')
  }

  // --- COOLDOWN ---
  const cooldownSec = pCfg.cooldown ?? config.cooldown?.default ?? 3
  if (!isOwner && isOnCooldown(m.sender, m.command, cooldownSec)) {
    const rem = remainingCooldown(m.sender, m.command, cooldownSec)
    const cooldownMsg = typeof config.messages?.cooldown === 'function'
      ? config.messages.cooldown(rem)
      : `⏳ Tunggu *${rem}* detik lagi untuk menggunakan command ini.`
    return m.reply(cooldownMsg)
  }
  setCooldown(m.sender, m.command)

  const db        = getDatabase()
  const expResult = db.updateExp(m.sender, 50)

  // Trigger level-up canvas notifikasi (non-blocking)
  if (expResult?.leveledUp) {
    import('./lib/levelup-handler.js')
      .then(({ handleLevelUp }) => handleLevelUp(m, sock, expResult))
      .catch(() => {})
  }

  try {
    await handler(m, { sock, db, config, isOwner, isPremium, isGroupAdmin, isBotAdmin, groupMeta })
    dcNotify(m.senderNumber, m.pushName, m.command, m.args, m.chat, m.isGroup).catch(() => {})
    tgNotify(m.senderNumber, m.pushName, m.command, m.args, m.chat, m.isGroup).catch(() => {})
  } catch (err) {
    logger.error('HANDLER', `${m.command}: ${err.message}`)
    const errMsg = typeof config.messages?.handlerError === 'function'
      ? config.messages.handlerError(m.command, err)
      : `❌ Terjadi error: ${err.message}`
    await m.reply(errMsg)
  }
}