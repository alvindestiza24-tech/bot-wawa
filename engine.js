/**
 * engine.js — Pusat kendali (engine) bot WhatsApp
 * Menyatukan semua layanan internal dan menyediakan wrapper pendek
 * untuk pembuatan pesan interaktif via baileys-mbuilder v4.6
 */

import { getDatabase } from '../database.js';
import * as storeDb from './store-db.js';
import { hasLink } from './anti-link.js';
import { isOwnerDb, isPremiumDb, isBannedDb, addBanned, removeBanned } from './role-db.js';
import { beautifulMessage, renderMainMenu, renderCategoryMenu } from './text-formater.js';
import { resolveAnyLidToJid } from './lid.js';
import { fmtDuration } from './function.js';
import { getHotReloader } from './hot-reload.js';
import { analyzeText } from '../ai/toxic-detector.js';
import { analyzeImage } from '../ai/nsfw-detector.js';

/* ================================================================
   Lazy-loader baileys-mbuilder
   ================================================================ */

let _MB = null;

async function _loadMB() {
  if (_MB) return _MB;
  try {
    const mod = await import('baileys-mbuilder');
    _MB = mod.default;
    return _MB;
  } catch (e) {
    console.error(`[engine] Gagal memuat baileys-mbuilder: ${e.message}`);
    throw new Error(`[engine] Gagal memuat baileys-mbuilder: ${e.message}. Pastikan "npm install baileys-mbuilder" sudah dijalankan.`);
  }
}

/* ================================================================
   Internal: cooldown store
   ================================================================ */

const _cooldowns = new Map();

/* ================================================================
   Internal: utilitas format lokal
   ================================================================ */

const _fmtRupiah = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`;

const _fmtAngka = (n) => Number(n).toLocaleString('id-ID');

const _fmtTanggal = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return String(iso);
  }
};

const _fmtWaktu = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return String(iso);
  }
};

const _jidNum = (jid) => {
  if (!jid) return '';
  return String(jid).split(':')[0].split('@')[0].replace(/[^0-9]/g, '');
};

const _escapeHTML = (text) =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

/* ================================================================
   Engine (singleton)
   ================================================================ */

const engine = {

  /* ────────────────────────────────────────────
     USER
     ──────────────────────────────────────────── */

  user: {
    get(jid) {
      try { return getDatabase().getUser(jid); } catch { return null; }
    },

    set(jid, data) {
      try { getDatabase().setUser(jid, data); } catch { /* silent */ }
    },

    addExp(jid, amount) {
      try { getDatabase().updateExp(jid, amount); } catch { /* silent */ }
    },

    addKoin(jid, amount) {
      try { getDatabase().updateKoin(jid, amount); } catch { /* silent */ }
    },

    ban(jid, reason) {
      try { addBanned(jid, reason); } catch { /* silent */ }
    },

    unban(jid) {
      try { removeBanned(jid); } catch { /* silent */ }
    },

    isOwner(jid) {
      try { return isOwnerDb(jid); } catch { return false; }
    },

    isPremium(jid) {
      try { return isPremiumDb(jid); } catch { return false; }
    },

    isBanned(jid) {
      try { return isBannedDb(jid); } catch { return false; }
    },
  },

  /* ────────────────────────────────────────────
     GROUP
     ──────────────────────────────────────────── */

  group: {
    get(jid) {
      try { return getDatabase().getGroup(jid); } catch { return null; }
    },

    set(jid, data) {
      try { getDatabase().setGroup(jid, data); } catch { /* silent */ }
    },

    isAdmin(senderJid, groupMeta) {
      try {
        if (!groupMeta?.participants) return false;
        const num = _jidNum(senderJid);
        return groupMeta.participants.some(
          (p) => _jidNum(p.id || p.jid) === num && (p.admin === 'admin' || p.admin === 'superadmin'),
        );
      } catch { return false; }
    },

    isBotAdmin(sock, groupMeta) {
      try {
        if (!groupMeta?.participants || !sock?.user?.id) return false;
        const botNum = _jidNum(sock.user.id);
        return groupMeta.participants.some(
          (p) => _jidNum(p.id || p.jid) === botNum && (p.admin === 'admin' || p.admin === 'superadmin'),
        );
      } catch { return false; }
    },

    async fetchMeta(sock, chatId) {
      try { return await sock.groupMetadata(chatId); } catch { return null; }
    },
  },

  /* ────────────────────────────────────────────
     STORE
     ──────────────────────────────────────────── */

  store: {
    getStats() {
      try { return storeDb.getStoreStats(); } catch { return null; }
    },

    getCatalog() {
      try { return storeDb.getAllCategories(); } catch { return null; }
    },

    createOrder(...args) {
      try { return storeDb.createOrder(...args); } catch { return null; }
    },

    confirmOrder(id) {
      try { return storeDb.confirmOrder(id); } catch { return null; }
    },

    completeOrder(id) {
      try { return storeDb.completeOrder(id); } catch { return null; }
    },

    cancelOrder(id, reason) {
      try {
        if (typeof storeDb.cancelOrder === 'function') {
          return storeDb.cancelOrder(id, reason);
        }
        return null;
      } catch { return null; }
    },
  },

  /* ────────────────────────────────────────────
     ANTI
     ──────────────────────────────────────────── */

  anti: {
    hasLink(text) {
      try { return hasLink(text); } catch { return false; }
    },

    async isToxic(text) {
      try {
        const result = await analyzeText(text);
        if (typeof result === 'boolean') return result;
        return !!result?.isToxic;
      } catch { return false; }
    },

    async isNSFW(buffer) {
      try {
        const result = await analyzeImage(buffer);
        if (typeof result === 'boolean') return result;
        return !!result?.isNSFW;
      } catch { return false; }
    },
  },

  /* ────────────────────────────────────────────
     UTIL
     ──────────────────────────────────────────── */

  util: {
    rupiah: _fmtRupiah,
    angka: _fmtAngka,
    tanggal: _fmtTanggal,
    waktu: _fmtWaktu,
    durasi: fmtDuration,
    jidNum: _jidNum,
    escapeHTML: _escapeHTML,

    async resolveLid(lid, participants) {
      try { return resolveAnyLidToJid(lid, participants); } catch { return lid; }
    },
  },

  /* ────────────────────────────────────────────
     MSG
     ──────────────────────────────────────────── */

  msg: {
    beautiful(content, opts) {
      try { return beautifulMessage(content, opts); } catch { return String(content); }
    },

    menu(categories, opts) {
      try { return renderMainMenu(categories, opts); } catch { return String(categories); }
    },

    category(catName, commands, opts) {
      try { return renderCategoryMenu(catName, commands, opts); } catch { return String(commands); }
    },
  },

  /* ────────────────────────────────────────────
     COOLDOWN
     ──────────────────────────────────────────── */

  cooldown: {
    check(sender, command, seconds) {
      const key = `${sender}:${command}`;
      const entry = _cooldowns.get(key);
      if (!entry) return false;
      return (Date.now() - entry) / 1000 < seconds;
    },

    set(sender, command) {
      _cooldowns.set(`${sender}:${command}`, Date.now());
    },

    remaining(sender, command, seconds) {
      const key = `${sender}:${command}`;
      const entry = _cooldowns.get(key);
      if (!entry) return 0;
      const left = seconds - (Date.now() - entry) / 1000;
      return left > 0 ? Math.ceil(left) : 0;
    },
  },

  /* ────────────────────────────────────────────
     RELOAD
     ──────────────────────────────────────────── */

  reloadPlugins() {
    try {
      const reloader = getHotReloader();
      reloader?.reloadAllPlugins?.('plugins');
    } catch { /* silent */ }
  },

  /* ────────────────────────────────────────────
     BAILEYS-MBUILDER
     ──────────────────────────────────────────── */

  async button(sock, text, buttons, footer, header) {
    const MB = await _loadMB();
    const builder = MB.Button(sock).text(text);
    for (const [label, id] of buttons) builder.button(label, id);
    if (footer) builder.footer(footer);
    if (header) builder.header(header);
    const result = builder.build();
    return { message: result.message, key: result.key };
  },

  async carousel(sock, cards) {
    const MB = await _loadMB();
    const builder = MB.Carousel(sock);
    for (const card of cards) {
      builder.card((c) => {
        if (card.image) c.image(card.image);
        if (card.title) c.title(card.title);
        if (card.text) c.text(card.text);
        if (card.buttons) {
          for (const [label, id] of card.buttons) c.button(label, id);
        }
      });
    }
    const result = builder.build();
    return { message: result.message, key: result.key };
  },

  async flow(sock, cfg) {
    const MB = await _loadMB();
    const builder = MB.NativeFlow(sock).text(cfg.text);
    if (cfg.title) builder.title(cfg.title);
    if (cfg.subtitle) builder.subtitle(cfg.subtitle);
    for (const btn of cfg.buttons) {
      switch (btn.type) {
        case 'url': builder.addUrl(btn.label, btn.url, btn.webview); break;
        case 'copy': builder.addCopy(btn.label, btn.code); break;
        case 'address': builder.addAddress(btn.label, btn.address); break;
        case 'phone': builder.addPhone(btn.label, btn.phone ?? btn.phoneNumber); break;
      }
    }
    const result = builder.build(cfg.jid);
    return {
      message: result.message,
      key: result.key,
      additionalNodes: result.additionalNodes,
    };
  },

  async airich(sock, text, options = {}) {
    const MB = await _loadMB();
    const builder = MB.AIRich(sock).text(text);
    if (options.table) builder.addTable(options.table.title, options.table.rows);
    if (options.citations) {
      for (const citation of options.citations) builder.addCitation(citation);
    }
    const result = builder.build(options.jid);
    return { message: result.message, key: result.key };
  },
};

export default engine;