// plugins/experimental-selflearn.js
// 🧬 Self-Learning (versi kalem & relevan) — Azbry-MD by FebryWesker
// Default: GLOBAL OFF & GROUP OFF, reply singkat, no cringe, no emoji.

const fs = require('fs')
const path = require('path')

process.env.TZ = 'Asia/Makassar'
const FILE = path.join(__dirname, '..', 'database', 'selflearn.json')

// ===== Utils file =====
function ensure() {
  const dir = path.dirname(FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(FILE)) {
    const seed = {
      on: false,                 // GLOBAL OFF by default
      groups: {},                // { [gid]: { on, mode, tone, chance, cooldown, threshold, window, learned, manual, mentionsOnly } }
      defaults: {
        mode: 'smart',           // 'strict' (manual-only) | 'smart' (auto learn)
        tone: 'neutral',         // 'neutral' | 'brief' | 'minimal'
        chance: 8,               // % kemungkinan nimbrung untuk kata populer (0-100)
        cooldown: 60,            // detik, cooldown per-grup
        threshold: 18,           // min kemunculan kata dalam WINDOW agar dianggap populer
        window: 3600,            // detik, jendela rolling
        mentionsOnly: true       // hanya balas jika pesan mention bot / reply ke bot
      }
    }
    fs.writeFileSync(FILE, JSON.stringify(seed, null, 2))
  }
}
function load() { ensure(); return JSON.parse(fs.readFileSync(FILE, 'utf8')) }
function save(db){ fs.writeFileSync(FILE, JSON.stringify(db, null, 2)) }

// ===== Helpers =====
function nowSec(){ return Math.floor(Date.now()/1000) }
function tokens(s=''){
  // ambil kata ≥4 huruf/angka, buang aksen
  return (s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().match(/\b[a-z0-9\u00C0-\u024f]{4,}\b/g) || [])
}
function wordBoundaryIncludes(text, word){
  // cocokkan di batas kata biar gak false positive
  const re = new RegExp(`(^|\\W)${word.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\$&')}(?=\\W|$)`, 'i')
  return re.test(text)
}
function sample(arr){ return arr[Math.floor(Math.random()*arr.length)] }

// reply builder—netral, pendek, tidak “sok akrab”
const TONES = {
  neutral: (w)=>[
    `Noted soal "${w}".`,
    `Oke, topik "${w}".`,
    `Catat: "${w}".`,
    `Paham, bahas "${w}".`
  ],
  brief: (w)=>[
    `"${w}" diterima.`,
    `Ok "${w}".`,
    `Noted "${w}".`
  ],
  minimal: (w)=>[
    `${w}.`,
    `ok.`,
    `noted.`
  ]
}

const LAST_REPLY = new Map() // gid -> ts

function ensureGroup(db, gid){
  const d = db.defaults
  if (!db.groups[gid]) db.groups[gid] = {
    on: false,               // GROUP OFF by default
    mode: d.mode,
    tone: d.tone,
    chance: d.chance,
    cooldown: d.cooldown,
    threshold: d.threshold,
    window: d.window,
    mentionsOnly: d.mentionsOnly,
    learned: {},             // { word: reply }
    manual: {},              // { trigger: reply }
    log: []                  // [ [word, ts], ... ]
  }
  return db.groups[gid]
}

function pushLog(g, word){
  const ts = nowSec()
  g.log.push([word, ts])
  const cut = ts - g.window
  // bersihkan log out-of-window
  if (g.log.length > 1000) g.log = g.log.filter(([_, t]) => t >= cut)
  else while (g.log.length && g.log[0][1] < cut) g.log.shift()
}

function popularWords(g){
  const freq = Object.create(null)
  for (const [w] of g.log) freq[w] = (freq[w] || 0) + 1
  return Object.entries(freq)
    .filter(([,c]) => c >= g.threshold)
    .sort((a,b)=> b[1]-a[1])
    .map(([w])=>w)
}

function buildReply(word, tone='neutral'){
  const bag = TONES[tone] || TONES.neutral
  return sample(bag(word))
}

async function maybeReply(m, conn){
  if (!m || !m.chat || !m.text) return
  if (!m.isGroup) return
  if (m.fromMe) return

  const db = load()
  if (!db.on) return

  const gid = m.chat
  const g = ensureGroup(db, gid)
  if (!g.on) return

  const text = m.text.toLowerCase()

  // optional: hanya balas kalau mention bot / reply ke bot
  if (g.mentionsOnly) {
    const isReplyBot = !!(m.quoted && m.quoted.isBot)
    const mentionsBot = Array.isArray(m.mentionedJid) && m.mentionedJid.includes(conn?.user?.jid)
    if (!isReplyBot && !mentionsBot) return
  }

  // respect cooldown
  const last = LAST_REPLY.get(gid) || 0
  if (nowSec() - last < g.cooldown) {
    // tetap update log supaya statistik jalan, tapi tidak membalas
    for (const w of tokens(text)) pushLog(g, w)
    save(db)
    return
  }

  // 1) Manual triggers (STRICT)
  const manualKeys = Object.keys(g.manual)
  for (const key of manualKeys) {
    if (wordBoundaryIncludes(text, key.toLowerCase())) {
      LAST_REPLY.set(gid, nowSec())
      await conn.reply(gid, g.manual[key], m)
      return
    }
  }

  // 2) Smart learn (jika mode = smart)
  if (g.mode === 'smart') {
    for (const w of tokens(text)) pushLog(g, w)
    const popular = popularWords(g)

    // assign reply baru untuk kata populer yg belum punya balasan
    for (const w of popular) {
      if (!g.learned[w]) {
        g.learned[w] = buildReply(w, g.tone)
        // batasi 30 entri agar ramping
        const keys = Object.keys(g.learned)
        if (keys.length > 30) delete g.learned[keys[0]]
      }
    }
    save(db)

    // nimbrung hanya jika pesan ini memuat kata populer & lolos chance
    const hit = Object.keys(g.learned).find(w => wordBoundaryIncludes(text, w))
    const chance = Math.max(0, Math.min(100, g.chance))
    if (hit && Math.random()*100 < chance) {
      LAST_REPLY.set(gid, nowSec())
      await conn.reply(gid, g.learned[hit], m)
    }
  }
}

// ===== Commands =====
let handler = async (m, { conn, args, usedPrefix, command }) => {
  const db = load()
  const gid = m.chat
  const g = ensureGroup(db, gid)
  const sub = (args[0]||'').toLowerCase()

  const usage =
`🧬 Self-Learning (kalem)
Global: ${db.on?'🟢 ON':'🔴 OFF'} | Grup: ${g.on?'🟢 ON':'🔴 OFF'}
Mode: ${g.mode} | Tone: ${g.tone}
Chance: ${g.chance}% | Cooldown: ${g.cooldown}s
Threshold: ${g.threshold} | Window: ${g.window}s
MentionsOnly: ${g.mentionsOnly ? 'Ya' : 'Tidak'}
Manual: ${Object.keys(g.manual).length} | Auto: ${Object.keys(g.learned).length}

• ${usedPrefix}sltrain status
• ${usedPrefix}sltrain global on|off
• ${usedPrefix}sltrain on|off
• ${usedPrefix}sltrain mode strict|smart
• ${usedPrefix}sltrain tone neutral|brief|minimal
• ${usedPrefix}sltrain chance <0-100>
• ${usedPrefix}sltrain cooldown <detik>
• ${usedPrefix}sltrain threshold <jumlah>
• ${usedPrefix}sltrain window <detik>
• ${usedPrefix}sltrain mentionsonly on|off
• ${usedPrefix}sltrain add <trigger> | <reply>
• ${usedPrefix}sltrain del <trigger>
• ${usedPrefix}sltrain list
• ${usedPrefix}sltrain reset (auto|manual|all)`

  if (!sub || sub === 'status') return m.reply(usage)

  if (sub === 'global') {
    const v = (args[1]||'').toLowerCase()
    if (!['on','off'].includes(v)) return m.reply(`Pakai: ${usedPrefix}sltrain global on/off`)
    db.on = v === 'on'; save(db)
    return m.reply(`✅ Global ${v.toUpperCase()}`)
  }

  if (sub === 'on' || sub === 'off') {
    g.on = sub === 'on'; save(db)
    return m.reply(`✅ Grup ${sub.toUpperCase()}`)
  }

  if (sub === 'mode') {
    const v = (args[1]||'').toLowerCase()
    if (!['strict','smart'].includes(v)) return m.reply(`Pakai: ${usedPrefix}sltrain mode strict|smart`)
    g.mode = v; save(db); return m.reply(`✅ Mode: ${v}`)
  }

  if (sub === 'tone') {
    const v = (args[1]||'').toLowerCase()
    if (!['neutral','brief','minimal'].includes(v)) return m.reply(`Pakai: ${usedPrefix}sltrain tone neutral|brief|minimal`)
    g.tone = v; save(db); return m.reply(`✅ Tone: ${v}`)
  }

  if (sub === 'chance') {
    const n = Number(args[1]); if (isNaN(n)) return m.reply('Isi angka 0-100.')
    g.chance = Math.max(0, Math.min(100, Math.round(n))); save(db)
    return m.reply(`✅ Chance: ${g.chance}%`)
  }

  if (sub === 'cooldown') {
    const n = Number(args[1]); if (isNaN(n) || n < 10) return m.reply('Minimal 10 detik.')
    g.cooldown = Math.round(n); save(db)
    return m.reply(`✅ Cooldown: ${g.cooldown}s`)
  }

  if (sub === 'threshold') {
    const n = Number(args[1]); if (isNaN(n) || n < 5) return m.reply('Minimal 5.')
    g.threshold = Math.round(n); save(db)
    return m.reply(`✅ Threshold: ${g.threshold}`)
  }

  if (sub === 'window') {
    const n = Number(args[1]); if (isNaN(n) || n < 300) return m.reply('Minimal 300 detik (5 menit).')
    g.window = Math.round(n); save(db)
    return m.reply(`✅ Window: ${g.window}s`)
  }

  if (sub === 'mentionsonly') {
    const v = (args[1]||'').toLowerCase()
    if (!['on','off'].includes(v)) return m.reply(`Pakai: ${usedPrefix}sltrain mentionsonly on/off`)
    g.mentionsOnly = v === 'on'; save(db)
    return m.reply(`✅ MentionsOnly: ${g.mentionsOnly ? 'ON' : 'OFF'}`)
  }

  if (sub === 'add') {
    const rest = args.slice(1).join(' ')
    const sp = rest.split('|')
    if (sp.length < 2) return m.reply(`Format: ${usedPrefix}sltrain add <trigger> | <reply>`)
    const key = sp[0].trim().toLowerCase()
    const val = sp.slice(1).join('|').trim()
    if (key.length < 3 || !val) return m.reply('Trigger minimal 3 huruf & reply tidak kosong.')
    g.manual[key] = val; save(db)
    return m.reply(`✅ Ditambahkan: "${key}" → "${val}"`)
  }

  if (sub === 'del') {
    const key = (args.slice(1).join(' ')||'').trim().toLowerCase()
    if (!key) return m.reply(`Pakai: ${usedPrefix}sltrain del <trigger>`)
    if (g.manual[key]) { delete g.manual[key]; save(db); return m.reply('✅ Dihapus (manual).') }
    if (g.learned[key]) { delete g.learned[key]; save(db); return m.reply('✅ Dihapus (auto).') }
    return m.reply('Tidak ditemukan.')
  }

  if (sub === 'list') {
    const L = Object.entries(g.learned).map(([k,v])=>`• ${k} → ${v}`)
    const M = Object.entries(g.manual).map(([k,v])=>`• ${k} → ${v}`)
    const txt = `🧬 *Self-Learning List*\n\n*Auto:*\n${L.length?L.join('\n'):'(kosong)'}\n\n*Manual:*\n${M.length?M.join('\n'):'(kosong)'}`
    return conn.reply(gid, txt, m)
  }

  if (sub === 'reset') {
    const which = (args[1]||'all').toLowerCase()
    if (which === 'auto' || which === 'all') g.learned = {}
    if (which === 'manual' || which === 'all') g.manual = {}
    if (!['auto','manual','all'].includes(which)) return m.reply(`Pakai: ${usedPrefix}sltrain reset (auto|manual|all)`)
    save(db)
    return m.reply(`✅ Reset ${which.toUpperCase()}`)
  }

  return m.reply(usage)
}

handler.help = ['sltrain [status|global on/off|on/off|mode|tone|chance|cooldown|threshold|window|mentionsonly|add|del|list|reset]']
handler.tags = ['experimental','fun']
handler.command = /^sltrain$/i
handler.group = true
handler.owner = true

module.exports = handler
module.exports.before = async function (m) { try { await maybeReply(m, this) } catch {} }