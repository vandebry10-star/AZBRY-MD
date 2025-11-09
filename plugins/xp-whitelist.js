// plugins/xp-whitelist.js
// 🎯 Whitelist XP per Grup (aktifkan XP cuma di grup tertentu)
// by FebryWesker — Azbry-MD

const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '..', 'database')
const FILE = path.join(DATA_DIR, 'xp-whitelist.json')

// ensure store
function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({ mode: 'only', groups: [] }, null, 2))
}
function load() { ensure(); try { return JSON.parse(fs.readFileSync(FILE, 'utf-8')) } catch { return { mode: 'only', groups: [] } } }
function save(v){ ensure(); fs.writeFileSync(FILE, JSON.stringify(v, null, 2)) }

// helper publik
function isXPAllowed(jid) {
  const wl = load()
  if (!jid || !jid.endsWith('@g.us')) return false // XP hanya relevan di grup
  if (wl.mode === 'all') return true
  return wl.groups.includes(jid)
}

// pasang ke global untuk mudah dipakai di plugin lain
global.isXPAllowed = isXPAllowed

// cek admin grup
async function isGroupAdmin(conn, chatId, userJid) {
  try {
    const meta = await conn.groupMetadata(chatId)
    const admins = meta.participants.filter(p => p.admin).map(p => p.id)
    return admins.includes(userJid)
  } catch { return false }
}

// ====== GUARD OPSIONAL (menahan XP default berbasis handler.exp) ======
// Banyak base RTXZY/Botcahx ngasih XP dari nilai handler.exp di setiap plugin.
// Hook "before" ini akan nol-kan XP gain kalau grup TIDAK diizinkan.
let guard = m => m
guard.before = async function (m, { conn }) {
  try {
    if (!m.isGroup) return
    if (isXPAllowed(m.chat)) return
    // Tandai agar core tidak menambah EXP (beberapa base baca flag ini)
    m.noXp = true
    // Cadangan: beberapa base baca m.expGain/m.exp → set ke 0
    m.expGain = 0
    m.exp = 0
  } catch {}
}
guard.help = ['xpwl <add|del|list|mode|status>']
guard.tags = ['xp','group']
guard.command = /^(xpwl)$/i

// command handler
guard = Object.assign(async (m, { conn, usedPrefix, args }) => {
  const sub = (args[0] || '').toLowerCase()
  const wl = load()

  // status
  if (!sub || sub === 'status') {
    const modeText = wl.mode === 'all' ? 'semua grup' : 'hanya whitelist'
    return conn.reply(m.chat,
`📊 XP Whitelist
Mode: ${modeText}
Total whitelist: ${wl.groups.length}

Perintah:
${usedPrefix}xpwl add    → tandai grup ini
${usedPrefix}xpwl del    → hapus grup ini
${usedPrefix}xpwl list   → lihat daftar
${usedPrefix}xpwl mode only|all`, m)
  }

  // list
  if (sub === 'list') {
    const txt = wl.groups.length
      ? '📋 XP Whitelist:\n' + wl.groups.map((g,i)=>`${i+1}. ${g}`).join('\n')
      : '📭 Whitelist kosong.'
    return conn.reply(m.chat, txt, m)
  }

  // sisanya harus di grup + admin
  if (!m.isGroup) return conn.reply(m.chat, 'Perintah ini hanya bisa di dalam grup.', m)
  const youAdmin = await isGroupAdmin(conn, m.chat, m.sender)
  const isOwnerBot = (global.owner || []).some(([num]) => m.sender.includes(num))
  if (!youAdmin && !isOwnerBot) return conn.reply(m.chat, 'Hanya admin grup / owner bot yang bisa mengatur whitelist XP.', m)

  if (sub === 'add') {
    if (!wl.groups.includes(m.chat)) wl.groups.push(m.chat)
    save(wl)
    return conn.reply(m.chat, '✅ Grup ini ditambahkan ke whitelist XP.', m)
  }

  if (sub === 'del') {
    const before = wl.groups.length
    wl.groups = wl.groups.filter(x => x !== m.chat)
    save(wl)
    const msg = (wl.groups.length < before) ? '❎ Grup ini dihapus dari whitelist XP.' : 'ℹ️ Grup ini memang belum ada di whitelist.'
    return conn.reply(m.chat, msg, m)
  }

  if (sub === 'mode') {
    const v = (args[1] || '').toLowerCase()
    if (!['only','all'].includes(v)) return conn.reply(m.chat, `Gunakan: ${usedPrefix}xpwl mode only|all`, m)
    wl.mode = v
    save(wl)
    return conn.reply(m.chat, `🔧 Mode diubah ke: ${v === 'all' ? 'semua grup (XP aktif di semua grup)' : 'hanya whitelist'}.`, m)
  }

  return conn.reply(m.chat,
`Format:
• ${usedPrefix}xpwl add
• ${usedPrefix}xpwl del
• ${usedPrefix}xpwl list
• ${usedPrefix}xpwl mode only|all`, m)
}, guard) // gabungkan command + before

guard.group = true
module.exports = guard

// export helper untuk dipakai plugin leveling lain
module.exports.isXPAllowed = isXPAllowed