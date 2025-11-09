// plugins/experimental-selflearn.js
// 🧬 Self-Learning Trigger — by FebryWesker (Azbry-MD)

const fs = require('fs')
const path = require('path')

process.env.TZ = 'Asia/Makassar'
const TZ = 'Asia/Makassar'
const FILE = path.join(__dirname, '..', 'database', 'selflearn.json')

function ensure(){ const d = path.dirname(FILE); if(!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true})
  if(!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({on:true, groups:{}}, null, 2))
}
function load(){ ensure(); return JSON.parse(fs.readFileSync(FILE,'utf-8')) }
function save(db){ fs.writeFileSync(FILE, JSON.stringify(db,null,2)) }

function tok(s=''){ return (s.toLowerCase().match(/\b[a-z0-9\u00C0-\u024f]{4,}\b/g)||[]) }
function nowSec(){ return Math.floor(Date.now()/1000) }
function chance(p=0.2){ return Math.random()<p }

const COOLDOWN_CHAT = 40      // detik, per grup (anti spam)
const THRESHOLD = 12          // sebuah kata jadi “populer” jika muncul ≥ ini (rolling)
const WINDOW = 3600           // jendela 1 jam (rolling)
const MAX_AUTO = 25           // max auto trigger tersimpan per grup

const LAST_REPLY = new Map()  // key: gid, val: ts

function ensureGroup(db, gid){
  if (!db.groups[gid]) db.groups[gid] = { on:true, learned:{}, manual:{}, log:[] }
  return db.groups[gid]
}

function pushLog(g, word){
  const ts = nowSec()
  g.log.push([word, ts])
  // bersihkan log lebih lama dari WINDOW
  g.log = g.log.filter(([,t]) => ts - t <= WINDOW)
}

function popularWords(g){
  const freq = {}
  for (const [w] of g.log) freq[w] = (freq[w]||0)+1
  return Object.entries(freq).filter(([,c])=>c>=THRESHOLD).sort((a,b)=>b[1]-a[1]).map(([w])=>w)
}

function buildReply(word){
  // gaya nimbrung ringan
  const templates = [
    w=>`anjayy ${w} lagi rame 😆`,
    w=>`iya, ${w} emang topik panas nih 🔥`,
    w=>`${w} tuh, setuju gak?`,
    w=>`bahas ${w} lagi kah?`,
    w=>`${w} detected 🤖`
  ]
  return templates[Math.floor(Math.random()*templates.length)](word)
}

async function maybeReply(m, conn){
  if (!m.isGroup || !m.text || m.fromMe) return
  const gid = m.chat
  const txt = m.text.toLowerCase()

  const db = load()
  if (!db.on) return
  const g = ensureGroup(db, gid)
  if (!g.on) return

  // manual triggers
  for (const [key, val] of Object.entries(g.manual)) {
    if (txt.includes(key.toLowerCase())) {
      const last = LAST_REPLY.get(gid) || 0
      if (nowSec() - last >= COOLDOWN_CHAT) {
        LAST_REPLY.set(gid, nowSec())
        await conn.reply(gid, val, m)
      }
      return
    }
  }

  // learning
  for (const w of tok(txt)) pushLog(g, w)
  const picks = popularWords(g)
  for (const w of picks) {
    if (!g.learned[w]) {
      g.learned[w] = buildReply(w)
      // batasi
      const keys = Object.keys(g.learned)
      if (keys.length > MAX_AUTO) {
        delete g.learned[keys[0]]
      }
    }
  }
  save(db)

  // nimbrung sesekali (20%) saat kata populer muncul, hormati cooldown
  const hit = Object.keys(g.learned).find(k => txt.includes(k))
  if (hit && chance(0.2)) {
    const last = LAST_REPLY.get(gid) || 0
    if (nowSec() - last >= COOLDOWN_CHAT) {
      LAST_REPLY.set(gid, nowSec())
      await conn.reply(gid, g.learned[hit], m)
    }
  }
}

// ===== commands =====
let handler = async (m, { conn, args, usedPrefix }) => {
  const db = load()
  const sub = (args[0]||'').toLowerCase()
  const gid = m.chat
  const g = ensureGroup(db, gid)

  // .sltrain (status)
  if (!sub || sub === 'status') {
    const learned = Object.keys(g.learned).length
    const manual = Object.keys(g.manual).length
    return m.reply(
`🧬 Self-Learning Trigger
Global: ${db.on?'🟢 ON':'🔴 OFF'} | Grup: ${g.on?'🟢 ON':'🔴 OFF'}
Auto learned: ${learned} | Manual: ${manual}

• ${usedPrefix}sltrain on/off
• ${usedPrefix}sltrain global on/off
• ${usedPrefix}sltrain add <trigger> | <reply>
• ${usedPrefix}sltrain del <trigger>
• ${usedPrefix}sltrain list`)
  }

  if (sub === 'global') {
    const v = (args[1]||'').toLowerCase()
    if (!['on','off'].includes(v)) return m.reply(`Pakai: ${usedPrefix}sltrain global on/off`)
    db.on = v === 'on'; save(db)
    return m.reply(`✅ Self-Learning GLOBAL ${v.toUpperCase()}`)
  }

  if (sub === 'on' || sub === 'off') {
    g.on = sub === 'on'; save(db)
    return m.reply(`✅ Self-Learning GRUP ${sub.toUpperCase()}`)
  }

  if (sub === 'add') {
    const rest = args.slice(1).join(' ')
    const sp = rest.split('|')
    if (sp.length < 2) return m.reply(`Format: ${usedPrefix}sltrain add <trigger> | <reply>`)
    const key = sp[0].trim().toLowerCase()
    const val = sp.slice(1).join('|').trim()
    if (key.length < 3 || !val) return m.reply('Trigger minimal 3 huruf dan reply tidak boleh kosong.')
    g.manual[key] = val; save(db)
    return m.reply(`✅ Ditambahkan: "${key}" → "${val}"`)
  }

  if (sub === 'del') {
    const key = (args.slice(1).join(' ')||'').trim().toLowerCase()
    if (!key) return m.reply(`Pakai: ${usedPrefix}sltrain del <trigger>`)
    if (g.manual[key]) { delete g.manual[key]; save(db); return m.reply('✅ Dihapus.') }
    if (g.learned[key]) { delete g.learned[key]; save(db); return m.reply('✅ Dihapus (auto).') }
    return m.reply('Tidak ditemukan.')
  }

  if (sub === 'list') {
    const L = Object.entries(g.learned).map(([k,v])=>`• ${k} → ${v}`)
    const M = Object.entries(g.manual).map(([k,v])=>`• ${k} → ${v}`)
    const txt = `🧬 *Self-Learning List*\n\n*Auto learned:*\n${L.length?L.join('\n'):'(kosong)'}\n\n*Manual:*\n${M.length?M.join('\n'):'(kosong)'}`
    return conn.reply(gid, txt, m)
  }

  return m.reply(`Pakai:\n• ${usedPrefix}sltrain on/off\n• ${usedPrefix}sltrain global on/off\n• ${usedPrefix}sltrain add <trigger> | <reply>\n• ${usedPrefix}sltrain del <trigger>\n• ${usedPrefix}sltrain list`)
}

handler.help = ['sltrain [on/off/global on|off/add|del|list|status]']
handler.tags = ['experimental','fun']
handler.command = /^sltrain$/i
handler.group = true

module.exports = handler
module.exports.before = async function(m, ctx){ try { await maybeReply(m, this) } catch{} }