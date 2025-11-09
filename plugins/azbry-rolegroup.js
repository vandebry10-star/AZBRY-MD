// plugins/group-level.js
// Level & XP — 5 Level, XP cuma dari chat & stiker (cooldown 2s), progres rapi
// + Whitelist per-grup via .xp (status|add here|del here|list)

const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '..', 'database')
const DB_FILE  = path.join(DATA_DIR, 'level.json')

// ======= KONFIG =======
const MAX_LEVEL = 5
const SCALE = 1000
const CHAT_XP_RANGE = [5, 6]
const STICKER_XP = 10
const CD_SECONDS = 2

// ======= Utils DB =======
function ensureDB() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ _settings:{ whitelist: [] } }, null, 2), 'utf-8')
}

function sanitizeUser(u) {
  if (!Number.isFinite(u.level) || u.level < 1) u.level = 1
  if (!Number.isFinite(u.xp) || u.xp < 0) u.xp = 0
  if (!u.cd) u.cd = {}
  return u
}

function loadDB() {
  ensureDB()
  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8') || '{}')
    // migrate: clamp abnormal values
    for (const gid of Object.keys(db)) {
      if (gid === '_settings') continue
      const group = db[gid]
      if (!group || typeof group !== 'object') continue
      for (const uid of Object.keys(group)) {
        const u = group[uid]
        if (!u || typeof u !== 'object') continue
        sanitizeUser(u)
      }
    }
    if (!db._settings) db._settings = { whitelist: [] }
    return db
  } catch {
    return { _settings: { whitelist: [] } }
  }
}

function saveDB(db){ ensureDB(); if (!db._settings) db._settings = { whitelist: [] }; fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8') }

function isGroupJid(jid=''){ return jid.endsWith('@g.us') }
function rand(min, max){ return Math.floor(Math.random()*(max-min+1))+min }

function totalXpForLevel(n){ return n <= 0 ? 0 : Math.floor(SCALE * n * (n + 1) / 2) }

function getLevelName(level) {
  if (level <= 1)  return '𝐘𝐚𝐩𝐩𝐢𝐧𝐠'
  if (level === 2) return '𝐊𝐢𝐧𝐠 𝐘𝐚𝐩𝐩𝐢𝐧𝐠'
  if (level === 3) return '𝐃𝐞𝐰𝐚 𝐘𝐚𝐩𝐩𝐢𝐧𝐠'
  if (level === 4) return '𝐘𝐚𝐩𝐩𝐢𝐧𝐠 𝐅𝐢𝐧𝐚𝐥 𝐁𝐨𝐬𝐬'
  return '𝐊𝐢𝐧𝐠 𝐘𝐚𝐩𝐩𝐢𝐧𝐠 𝐅𝐢𝐧𝐚𝐥 𝐁𝐨𝐬𝐬 𝐏𝐫𝐨𝐦𝐚𝐱'
}

function getUser(db, gid, uid, name=''){
  if (!db._settings) db._settings = { whitelist: [] }
  if (!db[gid]) db[gid] = {}
  if (!db[gid][uid]) db[gid][uid] = { xp: 0, level: 1, name: name||'', cd: {} }
  const u = db[gid][uid]
  sanitizeUser(u)
  if (name) u.name = name
  if (!u.cd) u.cd = {}
  return u
}

function inCooldown(user, key, seconds){
  const now = Math.floor(Date.now()/1000)
  const last = user.cd[key] || 0
  if (now - last < seconds) return true
  user.cd[key] = now
  return false
}

function addXP(db, gid, uid, amount){
  const u = getUser(db, gid, uid)
  const before = u.level
  u.xp += amount
  while (u.level < MAX_LEVEL && u.xp >= totalXpForLevel(u.level + 1)) u.level++
  return { leveled: u.level > before, newLevel: u.level }
}

function makeLevelUpText(uid, newLevel) {
  const rank = getLevelName(newLevel)
  return `🎉 *Naik Level!* @${uid.split('@')[0]} sekarang level *${newLevel}* — _${rank}_` +
         `\n\nℹ️ Cek level: *.lvl*\n🏆 Leaderboard: *.leaderboard*`
}

// ======= Whitelist =======
function isXPAllowedHere(db, gid) {
  const wl = db._settings?.whitelist || []
  if (!wl.length) return true
  return wl.includes(gid)
}

// ======= AUTO XP =======
async function autoXP(m, conn){
  const gid = m.chat, uid = m.sender
  if (!isGroupJid(gid) || !uid || m.fromMe) return
  const db = loadDB()
  if (!isXPAllowedHere(db, gid)) return

  const user = getUser(db, gid, uid, m.pushName || uid.split('@')[0])
  let leveledNotice = null
  const text = (m.text || '').trim()
  const isCmd = !!text && /^[.!/#$%^&*?]/.test(text)
  const isSticker = m.mtype === 'stickerMessage'

  if (!isCmd && !isSticker && !inCooldown(user, 'chat', CD_SECONDS)) {
    const gain = rand(...CHAT_XP_RANGE)
    const { leveled, newLevel } = addXP(db, gid, uid, gain)
    if (leveled) leveledNotice = makeLevelUpText(uid, newLevel)
    saveDB(db)
  }

  if (isSticker && !inCooldown(user, 'sticker', CD_SECONDS)) {
    const { leveled, newLevel } = addXP(db, gid, uid, STICKER_XP)
    if (leveled) leveledNotice = makeLevelUpText(uid, newLevel)
    saveDB(db)
  }

  if (leveledNotice) await conn.reply(gid, leveledNotice, m, { mentions: [uid] })
}

// ======= COMMANDS =======
let handler = async (m, { conn, command, usedPrefix, args, isOwner }) => {
  const gid = m.chat, uid = m.sender
  if (!isGroupJid(gid)) return conn.reply(gid, 'Fitur level hanya untuk grup.', m)
  const db = loadDB()
  const user = getUser(db, gid, uid, m.pushName || uid.split('@')[0])

  // ===== Kontrol whitelist =====
  if (/^xp$/i.test(command)) {
    const sub = (args[0] || '').toLowerCase()
    db._settings ??= { whitelist: [] }
    const wl = db._settings.whitelist

    if (!sub || sub === 'status') {
      const mode = wl.length ? `Whitelist ${wl.length} grup` : 'Aktif di semua grup (whitelist kosong)'
      return m.reply(
`⚙️ *XP Settings*
Mode: ${mode}

Perintah:
• ${usedPrefix}xp add here
• ${usedPrefix}xp del here
• ${usedPrefix}xp list`)
    }

    if (sub === 'add' && (args[1] || '').toLowerCase() === 'here') {
      if (!wl.includes(gid)) wl.push(gid)
      saveDB(db)
      return m.reply('✅ Grup ini ditambahkan ke whitelist XP.')
    }

    if (sub === 'del' && (args[1] || '').toLowerCase() === 'here') {
      const i = wl.indexOf(gid)
      if (i >= 0) wl.splice(i, 1)
      saveDB(db)
      return m.reply('✅ Grup ini dihapus dari whitelist XP.')
    }

    if (sub === 'list') {
      if (!wl.length) return m.reply('📭 Whitelist kosong (fitur aktif di semua grup).')
      const teks = wl.map((j, i) => `${i+1}. ${j}`).join('\n')
      return m.reply('📌 *Whitelist XP:*\n' + teks)
    }

    return m.reply(`Format salah.\nGunakan: ${usedPrefix}xp status|add here|del here|list`)
  }

  // ===== .lvl =====
  if (/^lvl$/i.test(command)) {
    if (!isXPAllowedHere(db, gid)) return m.reply('Fitur level tidak aktif di grup ini.')

    const curLevel = user.level
    const curXP = user.xp
    const rank = getLevelName(curLevel)

    const prevLevel = Math.max(curLevel - 1, 0)
    const nextLevel = Math.min(curLevel + 1, MAX_LEVEL)

    const needForThis = totalXpForLevel(prevLevel)
    const needForNext = totalXpForLevel(nextLevel)

    const inLevelXP = Math.max(curXP - needForThis, 0)
    const toNext = (curLevel >= MAX_LEVEL) ? 0 : Math.max(needForNext - curXP, 0)
    const width = Math.max(needForNext - needForThis, 1)
    const progress = `${inLevelXP} / ${width} XP`

    let txt = `╭──「 𝐋𝐄𝐕𝐄𝐋 𝐒𝐓𝐀𝐓 」\n`
    txt += `│ 👤 @${uid.split('@')[0]}\n`
    txt += `│ 🔰 Level : ${curLevel}\n`
    txt += `│ 📈 XP : ${progress}\n`
    txt += `│ 🏅 Rank : ${rank}\n`
    if (curLevel >= MAX_LEVEL) txt += `│ 🔒 MAX LEVEL 🎉\n`
    else txt += `│ 🎯 Next : ${getLevelName(curLevel + 1)} (${toNext} XP lagi)\n`
    txt += `╰──────────────────────`
    return conn.reply(gid, txt, m, { mentions: [uid] })
  }

  // ===== .leaderboard =====
  if (/^leaderboard$/i.test(command)) {
    if (!isXPAllowedHere(db, gid)) return m.reply('Fitur level tidak aktif di grup ini.')
    const group = db[gid] || {}
    const arr = Object.entries(group).map(([jid, v]) => ({
      jid,
      name: v.name || jid.split('@')[0],
      level: v.level || 1,
      xp: v.xp || 0
    }))
    if (!arr.length) return conn.reply(gid, 'Leaderboard masih kosong.', m)
    arr.sort((a, b) => (b.level - a.level) || (b.xp - a.xp))
    const top = arr.slice(0, 10)

    let txt = `╭──「 𝐋𝐄𝐀𝐃𝐄𝐑𝐁𝐎𝐀𝐑𝐃 𝐓𝐎𝐏 𝟏𝟎 」\n`
    for (const [i, u] of top.entries()) {
      txt += `│ ${i+1}. @${u.jid.split('@')[0]} — Lvl ${u.level} (${u.xp} XP)\n`
    }
    txt += `╰──────────────────────`
    return conn.reply(gid, txt, m, { mentions: top.map(u => u.jid) })
  }

  // ===== .givexp =====
  if (/^givexp$/i.test(command)) {
    if (!isOwner) return conn.reply(gid, 'Khusus Owner.', m)
    if (!m.mentionedJid?.length || !args[args.length-1]) return conn.reply(gid, `Contoh: ${usedPrefix}givexp @user 200`, m)
    const amount = parseInt(args[args.length-1])
    if (isNaN(amount)) return conn.reply(gid, 'Jumlah XP tidak valid.', m)
    const targets = m.mentionedJid
    for (const t of targets) { getUser(db, gid, t); addXP(db, gid, t, amount) }
    saveDB(db)
    return conn.reply(gid, `✅ +${amount} XP untuk ${targets.map(j=>`@${j.split('@')[0]}`).join(', ')}`, m, { mentions: targets })
  }
}

handler.help = ['lvl', 'leaderboard', 'givexp @user <jumlah>', 'xp (status|add here|del here|list)']
handler.tags = ['group', 'xp', 'fun', 'azbry']
handler.command = /^(lvl|leaderboard|givexp|xp)$/i
handler.group = true

module.exports = handler
module.exports.before = async function (m) {
  try { await autoXP(m, this) } catch (e) { console.error('[XP AUTO ERR]', e) }
}