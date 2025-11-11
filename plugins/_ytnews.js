// plugins/ytnews.js
// Notifikasi otomatis YouTube (video & shorts) multi-channel
// - FebryWesker (update bot)  → 2 grup
// - Bang Maul (COC News)      → 2 grup
//
// • Auto polling RSS tiap 2 menit + command manual per channel
// • Log detail ke console
// • State per-channel: database/ytnews_<CHANNEL_ID>.json

const fs    = require('fs')
const path  = require('path')
const axios = require('axios')

process.env.TZ = 'Asia/Makassar'

// ====== KONFIGURASI CHANNELS ======
const CHANNELS = [
  {
    key: 'febry',
    name: 'FebryWesker',
    channelId: 'UCxPxRTBB6PvPUs9T_T2VRBg',
    targets: [
      '120363422223291218@g.us', // update bot grup 1
      '120363422222111867@g.us', // update bot grup 2
    ],
    // builder pesan khusus
    buildMessage(item) {
      const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })
      return [
        `🆕 *Update Baru dari ${this.name}*`,
        ``,
        `📝 *Judul*: ${item.title || '(tanpa judul)'} `,
        ``,
        `🕒 *Waktu*: ${now}`,
        ``,
        `🎯 *Bantu support ya!*`,
        `• Like & komentar = bikin video naik performa`,
        `• Subscribe biar gak ketinggalan update bot`,
        ``,
        `🔗 ${item.link}`
      ].join('\n')
    }
  },
  {
    key: 'maul',
    name: 'Bang Maul (Clash of Clans)',
    channelId: 'UC9KuWm1dhShW6fm8yQmS5Lg',
    targets: [
      '120363404465538964@g.us', // COC news grup 1
      '120363422222111867@g.us', // COC news grup 2
    ],
    buildMessage(item) {
      const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })
      return [
        `🗞️*BERITA CLASH OF CLANS*`,
        ``,
        `📝 *Judul*: ${item.title || '(tanpa judul)'} `,
        ``,
        `🕒 *Waktu*: ${now}`,
        ``,
        `Berita terbaru dari Bang Maul tentang Update dan Event Clash of Clans`,
        ``,
        `🔗 ${item.link}`
      ].join('\n')
    }
  }
]

// ====== PENGATURAN LAIN ======
const FETCH_EVERY_MS = 5 * 60 * 1000 // 2 menit
const DEBUG = false

const UA_LIST = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Mobile Safari/537.36'
]
const pickUA = () => UA_LIST[Math.floor(Math.random()*UA_LIST.length)]

// ====== UTIL DB PER-CHANNEL ======
function dbFileFor(channelId){
  return path.join(__dirname, '..', 'database', `ytnews_${channelId}.json`)
}
function ensureDB(channelId){
  const file = dbFileFor(channelId)
  const dir = path.dirname(file)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({
    lastVideoId: null,
    lastPub: null,
    lastCheck: 0,
    lastSend: 0,
    lastError: null
  }, null, 2))
}
function loadDB(channelId){
  ensureDB(channelId)
  return JSON.parse(fs.readFileSync(dbFileFor(channelId),'utf8'))
}
function saveDB(channelId, db){
  fs.writeFileSync(dbFileFor(channelId), JSON.stringify(db, null, 2))
}

// ====== HTTP + PARSER RSS ======
async function httpGet(url){
  const ua = pickUA()
  if (DEBUG) console.log('[ytnews] GET', url, 'UA:', ua.slice(0, 25)+'...')
  return axios.get(url, {
    headers:{ 'User-Agent': ua, 'Accept': 'application/rss+xml, application/xml;q=0.9, */*;q=0.8' },
    timeout: 20000,
    validateStatus: s => s >= 200 && s < 400
  })
}

function parseLatestFromRSS(xml){
  const entry = xml.match(/<entry>[\s\S]*?<\/entry>/)
  if (!entry) throw new Error('RSS: entry tidak ditemukan')
  const block = entry[0]

  const idMatch   = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)
  const linkMatch = block.match(/<link[^>]+href="([^"]+)"/)
  const titleMatch= block.match(/<title>([\s\S]*?)<\/title>/)
  const pubMatch  = block.match(/<published>([^<]+)<\/published>/)

  const id    = idMatch && idMatch[1]
  const link  = linkMatch && linkMatch[1]
  const title = titleMatch && titleMatch[1].trim()
  const published = pubMatch && pubMatch[1]

  if (!id || !link) throw new Error('RSS: videoId/link tidak ditemukan')

  const thumb = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
  return { id, link, title, published, thumb }
}

// ====== KIRIM DENGAN JEDA & RETRY ======
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
async function sendToTargets(conn, item, targets, titleForPreview){
  const text = titleForPreview(item) // builder sudah mengembalikan string pesan
  for (const raw of targets) {
    const jid = String(raw||'').trim()
    if (!jid) continue
    let ok = false, err = null
    for (let attempt=1; attempt<=2 && !ok; attempt++){
      try{
        await conn.sendMessage(jid, {
          text,
          contextInfo: {
            externalAdReply: {
              title: item.title || 'Video baru!',
              body: 'Klik untuk nonton di YouTube',
              thumbnailUrl: item.thumb,
              mediaType: 1,
              sourceUrl: item.link,
              renderLargerThumbnail: true
            }
          }
        })
        if (DEBUG) console.log('[ytnews] sent to', jid, `(try ${attempt})`, '→', item.id)
        ok = true
      }catch(e){
        err = e
        console.error('[ytnews] send fail', jid, `(try ${attempt})`, e?.message)
        await sleep(1200)
      }
    }
    await sleep(800)
    if (!ok && err) console.error('[ytnews] give up', jid, err?.message)
  }
}

// ====== FETCH LATEST PER-CHANNEL ======
async function fetchLatest(channelId){
  const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
  let lastErr = null
  for (let i=0;i<2;i++){
    try{
      const r = await httpGet(FEED_URL)
      const xml = r.data || ''
      if (DEBUG) console.log('[ytnews] fetch OK (len=', String(xml).length, ') for', channelId)
      return parseLatestFromRSS(xml)
    }catch(e){
      lastErr = e
      if (DEBUG) console.warn('[ytnews] fetch try', i+1, 'fail:', e?.message, 'for', channelId)
      await sleep(1500)
    }
  }
  throw lastErr || new Error('Gagal fetch RSS')
}

// ====== TICK PER-CHANNEL ======
async function tickChannel(conn, cfg, reason='auto'){
  const { channelId } = cfg
  const db = loadDB(channelId)
  db.lastCheck = Date.now()
  saveDB(channelId, db)

  if (DEBUG) console.log(`[ytnews:${cfg.key}] tick (${reason}) start`)
  try{
    const item = await fetchLatest(channelId)
    if (DEBUG) console.log(`[ytnews:${cfg.key}] latest:`, item.id, '|', item.title)

    if (db.lastVideoId !== item.id){
      if (DEBUG) console.log(`[ytnews:${cfg.key}] NEW video → broadcasting...`)
      await sendToTargets(conn, item, cfg.targets, cfg.buildMessage.bind(cfg))
      db.lastVideoId = item.id
      db.lastPub  = item.published || null
      db.lastSend = Date.now()
      db.lastError = null
      saveDB(channelId, db)
    } else {
      if (DEBUG) console.log(`[ytnews:${cfg.key}] no new video (same id).`)
    }
  }catch(e){
    console.error(`[ytnews:${cfg.key}] tick error:`, e?.message)
    const latest = loadDB(channelId)
    latest.lastError = e?.message || String(e)
    saveDB(channelId, latest)
  }
}

// ====== AUTO LOOP (mulai setelah koneksi siap) ======
if (!global.__YTNEWS_LOOP_MULTI__) {
  global.__YTNEWS_LOOP_MULTI__ = true
  setTimeout(() => {
    const arm = async () => {
      if (!global.conn) return
      // boot pertama: cek semua channel
      for (const cfg of CHANNELS) await tickChannel(global.conn, cfg, 'boot')
      // interval rutin
      setInterval(async () => {
        for (const cfg of CHANNELS) await tickChannel(global.conn, cfg, 'interval')
      }, FETCH_EVERY_MS)
      if (DEBUG) console.log('[ytnews] multi-channel loop armed @', new Date().toISOString())
    }
    let tries = 0
    const intv = setInterval(async () => {
      if (global.conn) { clearInterval(intv); arm().catch(()=>{}) }
      if (++tries > 15) clearInterval(intv)
    }, 2000)
  }, 5000)
}

// ====== COMMANDS ======
// .ytnews [check|latest|status] [febry|maul|all]
let handler = async (m, { conn, usedPrefix, command, args }) => {
  const sub = (args[0] || '').toLowerCase()
  const which = (args[1] || 'all').toLowerCase()
  const pick = (which === 'all') ? CHANNELS : CHANNELS.filter(c => c.key === which)

  if (!['check','latest','status',''].includes(sub)) {
    return m.reply(
`ytnews usage:
• ${usedPrefix}${command} check [febry|maul|all]
• ${usedPrefix}${command} latest [febry|maul]
• ${usedPrefix}${command} status [febry|maul|all]`
    )
  }

  if (sub === 'check' || sub === '') {
    await m.reply('🔍 Mengecek feed YouTube secara manual...')
    for (const cfg of pick) await tickChannel(conn, cfg, `manual-check(${which})`)
    // tampilkan ringkas error terakhir per channel
    const lines = pick.map(cfg => {
      const db = loadDB(cfg.channelId)
      return `• ${cfg.key}: ${db.lastError ? '❌ ' + db.lastError : '✅ OK'}`
    })
    return m.reply(lines.join('\n'))
  }

  if (sub === 'latest') {
    if (which === 'all') return m.reply('Gunakan: latest [febry|maul] (bukan all)')
    await m.reply('⏳ Ambil item terbaru (paksa kirim)...')
    const cfg = CHANNELS.find(c => c.key === which)
    if (!cfg) return m.reply('Channel tidak dikenal.')
    try{
      const item = await fetchLatest(cfg.channelId)
      await sendToTargets(conn, item, cfg.targets, cfg.buildMessage.bind(cfg))
      const db = loadDB(cfg.channelId)
      db.lastVideoId = item.id
      db.lastPub  = item.published || null
      db.lastSend = Date.now()
      db.lastError = null
      saveDB(cfg.channelId, db)
      return m.reply(`✅ Terbaru dari ${cfg.name} sudah dikirim.`)
    }catch(e){
      return m.reply(`⚠️ Tidak bisa ambil item terbaru (${cfg.key}): ${e?.message}`)
    }
  }

  if (sub === 'status') {
    const fmt = (t) => t ? new Date(t).toLocaleString('id-ID', { timeZone:'Asia/Makassar' }) : '-'
    const lines = pick.map(cfg => {
      const db = loadDB(cfg.channelId)
      return [
        `📺 *${cfg.name}* — https://youtube.com/channel/${cfg.channelId}`,
        `• lastVideoId: ${db.lastVideoId || '-'}`,
        `• lastPub: ${db.lastPub || '-'}`,
        `• lastCheck: ${fmt(db.lastCheck)}`,
        `• lastSend: ${fmt(db.lastSend)}`,
        `• lastError: ${db.lastError || '(tidak ada)'}`,
        `• targets: ${cfg.targets.join(', ')}`,
        ''
      ].join('\n')
    }).join('\n')
    return m.reply(lines + `Interval: ${Math.floor(FETCH_EVERY_MS/60000)} menit`)
  }
}

handler.help = ['ytnews [check|latest|status] [febry|maul|all]']
handler.tags = ['news']
handler.command = /^ytnews$/i

module.exports = handler