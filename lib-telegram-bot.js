// src/lib/lib-telegram-bot.js  (replaces the old 77KB file)
// ──────────────────────────────────────────────────────────────
// This file is now a lightweight bootstrap.
// ALL store UI logic lives in src/lib/telegram/.
// The existing admin/monitoring functionality (telegram-bot.js)
// remains untouched in its own file.
// ──────────────────────────────────────────────────────────────
import * as Telegram from './telegram/index.js'
import logger        from './logger.js'
import config        from '../../config.js'

export async function startTelegramStoreBot() {
  if (!config.telegram?.enabled || !config.telegram?.botToken) {
    logger.warn('TELEGRAM', 'Store bot disabled or token missing — skipping')
    return
  }

  logger.info('TELEGRAM', 'Starting Telegram Store Bot...')

  // Run in background — crash here must NOT kill WhatsApp
  Telegram.start().catch(err => {
    logger.error(err)
    logger.warn('TELEGRAM', 'Store bot crashed — will NOT restart automatically')
  })
}
