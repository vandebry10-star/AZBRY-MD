// plugins/cocnews.js
// Clash of Clans News Auto-Push (10 menit) — whitelist only
// Sumber prioritas: CoC Official Blog (RSS) -> Supercell Blog (RSS-like) -> Reddit /r/ClashOfClans (RSS)
// by FebryWesker / Azbry-MD

const fs = require('fs')
const path = require('path')

// ====== Safe require (cron & fetch) ======
function safeRequire(name) {
  try { return require(name) } catch (e) {
    console.error(`[cocnews] Module "${name}" belum terpasang? Jalankan: npm i ${name}`)
    return null
  }
}
const cron = safeRequire('node-cron')
const fetch = safeRequire('node-fetch')

// ====== DB ======
const DB_DIR = path.join(__dirname, '..', 'database')
const DB_PATH = path.join(DB_DIR, 'coc_news.json')

function ensureDB() { try { fs.mkdirSync(DB_DIR, { recursive: true }) } catch {} }
function loadDB() {
  ensureDB()
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) } catch {}
  return { on: true, intervalMin: 10, whitelist: [], seen: [], lastFetchAt: 0 }
}
function saveDB(db){ ensureDB(); fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)) }

// ====== Config & Utils ======
const DEFAULT_INTERVAL_MIN = 10
const MAX_SEEN = 500
const SOURCES = [
  // 1) Coba RSS CoC (jika ada)
  'https://www.clashofclans.com/blog/rss',
  // 2) Supercell CoC blog (kadang di-merge): kalau tak ada RSS, beberapa mirror RSS pihak ketiga ada;
  //    kita tetap coba, kalau bukan XML valid akan discakup oleh parser defensif.
  'https://supercell.com/en/games/clashofclans/blog/rss',
  // 3) Community cepat update (fallback stabil)
  'https://www.reddit.com/r/ClashOfClans/.rss'
]

// parser RSS sederhana (tanpa lib), mengembalikan array {title, link, date}
function parseRSS(xml) {
  if (typeof xml !== 'string') return []
  const items = []
  const reItem = /<item\b[\s\S]*?<\/item>/gi
  const reTitle = /<title\b[^>]*>([\s\S]*?)<\/title>/i
  const reLink  = /<link\b[^>]*>([\s\S]*?)<\/link>/i
  const reDate  = /<(?:pubDate|updated|dc:date)\b[^>]*>([\s\S]*?)<\/(?:pubDate|updated|dc:date)>/i
  const blocks = xml.match(reItem) || []
  for (const block of blocks) {
    const title = (reTitle.exec(block)?.[1] || '').trim()
      .replace(/<!\[CDATA\[|\]\]>/g, '')
    const link = (reLink.exec(block)?.[1] || '').trim()
      .replace(/<!\[CDATA\[|\]\]>/g, '')
    const date = (reDate.exec(block)?.[1] || '').trim()
    if (title && link) items.push({ title, link, date })
  }
  return items
}

async function requestText(url, timeoutMs = 15000) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': 'AzbryMD/1.0 (+news fetcher)' },
      signal: controller.signal
    })
    clearTimeout(t)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(t)
  }
}

async function fetchNews() {
  for (const url of SOURCES) {
    try {
      const txt = await requestText(url, 15000)
      const items = parseRSS(txt)
      if (items.length) return items
    } catch (e) {
      // lanjut ke sumber berikutnya
    }
  }
  return []
}

function hashId(item) {
  const base = `${item.title}|${item.link}|${item.date||''}`
  let h = 0
  for (let i=0;i<base.length;i++){ h = ((h<<5)-h) + base.charCodeAt(i); h|=0 }
  return `n${Math.abs(h)}`
}

function fmtShortDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date()
  return d.toLocaleString('id-ID', { hour12:false })
}

async function pushNewsToChats(conn, items) {
  const st = loadDB()
  const targets = st.whitelist.filter(j => j.endsWith('@g.us'))
  if (!targets.length) return

  // Urutkan terbaru dulu (jika ada tanggal)
  items.sort((a,b) => new Date(b.date||0) - new Date(a.date||0))

  // Kirim maksimal 1 pos per siklus agar tidak spam
  const pick = items.find(it => !st.seen.includes(hashId(it)))
  if (!pick) return

  const id = hashId(pick)
  st.seen.unshift(id)
  if (st.seen.length > MAX_SEEN) st.seen = st.seen.slice(0, MAX_SEEN)
  st.lastFetchAt = Date.now()
  saveDB(st)

  const text =
`📢 *CoC News — ${pick.title.trim()}*
🗓️ ${fmtShortDate(pick.date)}

🔗 ${pick.link}`

  for (const gid of targets) {
    try {
      await conn.sendMessage(gid, {
        text,
        contextInfo: {
          externalAdReply: {
            title: 'Clash of Clans — Update',
            body: 'Berita terbaru',
            mediaType: 1,
            showAdAttribution: false,
            thumbnailUrl: 'https://i.imgur.com/9z1v8mR.png', // placeholder aman
            sourceUrl: pick.link
          }
        }
      })
    } catch (e) {
      console.error('[cocnews SEND ERR]', e?.message)
    }
    // kecilkan jeda antar grup
    await new Promise(r=>setTimeout(r, 500))
  }
}

// ====== Scheduler global ======
global.__cocnews_boot = global.__cocnews_boot || false
global.__cocnews_job = global.__cocnews_job || null

async function startScheduler(conn) {
  const st = loadDB()
  const intervalMin = st.intervalMin || DEFAULT_INTERVAL_MIN
  if (!cron) { console.warn('[cocnews] node-cron tidak tersedia.'); return }
  if (global.__cocnews_job) { try { global.__cocnews_job.stop() } catch {} }

  // jadwal: tiap N menit, menit ke 0..59 step N (detik 20 biar miss collision lebih kecil)
  const spec = `20 */${Math.max(1, intervalMin)} * * * *`
  global.__cocnews_job = cron.schedule(spec, async () => {
    try {
      const s = loadDB()
      if (!s.on) return
      if (!s.whitelist?.length) return
      const items = await fetchNews()
      if (items?.length) await pushNewsToChats(conn, items)
    } catch (e) { console.error('[cocnews TICK ERR]', e?.message) }
  })
  console.log(`[cocnews] scheduler start @ every ${intervalMin} min`)
}

// ====== Commands ======
let handler = async (m, { conn, usedPrefix, args }) => {
  const st = loadDB()
  const sub = (args[0] || '').toLowerCase()
  const sub2 = (args[1] || '').toLowerCase()

  if (!sub || sub === 'status') {
    const wl = st.whitelist?.length ? `${st.whitelist.length} grup` : '(kosong)'
    return m.reply(
`📰 *CoC News*
Status: ${st.on ? '🟢 ON' : '🔴 OFF'}
Interval: ${st.intervalMin || DEFAULT_INTERVAL_MIN} menit
Whitelist: ${wl}

Perintah:
${usedPrefix}cocnews on|off [here|all]
${usedPrefix}cocnews add here | del here | list
${usedPrefix}cocnews latest [n]`
    )
  }

  // on/off
  if ((sub === 'on' || sub === 'off') && (sub2 === 'all' || sub2 === 'here' || !sub2)) {
    st.on = (sub === 'on')
    saveDB(st)
    await m.reply(`✅ CoC News ${st.on ? 'AKTIF' : 'NONAKTIF'}.`)
    try { await startScheduler(conn) } catch {}
    return
  }

  // whitelist ops
  if (sub === 'add' && sub2 === 'here') {
    if (!st.whitelist.includes(m.chat)) st.whitelist.push(m.chat)
    saveDB(st); await m.reply('✅ Grup ini ditambahkan ke whitelist CoC News.')
    try { await startScheduler(conn) } catch {}
    return
  }
  if (sub === 'del' && sub2 === 'here') {
    st.whitelist = (st.whitelist||[]).filter(x => x !== m.chat)
    saveDB(st); await m.reply('✅ Grup ini dihapus dari whitelist CoC News.')
    try { await startScheduler(conn) } catch {}
    return
  }
  if (sub === 'list') {
    const list = st.whitelist?.length
      ? st.whitelist.map((j,i)=>`${i+1}. ${j}`).join('\n')
      : '(kosong)'
    return m.reply(`Whitelist CoC News:\n${list}`)
  }

  // latest [n]
  if (sub === 'latest') {
    const n = Math.min(Math.max(parseInt(args[1]||'1',10)||1, 1), 5)
    const items = await fetchNews()
    if (!items?.length) return m.reply('⚠️ Tidak menemukan berita saat ini.')
    const out = items.slice(0,n).map((it,i)=>
`${i+1}. *${it.title}*
🗓️ ${fmtShortDate(it.date)}
🔗 ${it.link}`).join('\n\n')
    return m.reply(`📰 *CoC News Terbaru*\n\n${out}`)
  }

  return m.reply(`Perintah tidak dikenal. Ketik ${usedPrefix}cocnews status`)
}

handler.help = ['cocnews [status|on|off|add here|del here|list|latest]']
handler.tags = ['news','group','auto']
handler.command = /^cocnews$/i
handler.group = true

// auto-boot scheduler
handler.after = async function (m, { conn }) {
  if (!global.__cocnews_boot) {
    global.__cocnews_boot = true
    try { await startScheduler(conn) } catch (e) { console.error('[cocnews boot ERR]', e?.message) }
  }
}

module.exports = handler