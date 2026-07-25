import config from '../../config.js'

function _mQuoted() {
  const botName = config.bot?.name || 'MyBot'
  return {
    key: {
      participant: `0@s.whatsapp.net`,
      remoteJid: `status@broadcast`,
    },
    message: {
      contactMessage: {
        displayName: `🪸 ${botName}`,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${botName}\nitem1.TEL;waid=0:+0\nEND:VCARD`,
        sendEphemeral: true,
      },
    },
  }
}

function _mCtx(sender) {
  const newsJid = config.saluran?.id || '120363400911374213@newsletter'
  const newsName = config.saluran?.name || config.bot?.name || 'MyBot'

  return {
    ...(sender ? { mentionedJid: [sender] } : {}),
    forwardingScore: 9999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: newsJid,
      newsletterName: newsName,
      serverMessageId: 127,
    },
  }
}

function createFakeQuoted() {
  return _mQuoted()
}

function saluranCtx(sender) {
  return _mCtx(sender)
}

function getGameContextInfo(sender) {
  return _mCtx(sender)
}

function getWinnerContextInfo(sender) {
  return _mCtx(sender)
}

function getRpgContextInfo(sender) {
  return _mCtx(sender)
}

export {
  createFakeQuoted,
  saluranCtx,
  getGameContextInfo,
  getWinnerContextInfo,
  getRpgContextInfo,
  _mQuoted,
  _mCtx,
}
