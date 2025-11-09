// plugins/_group-sholat.js
// 🕌 Sholat Reminders — cron + audio adzan + watchdog + daily refresh

const path = require('path')
const fs = require('fs')

// === safe require for node-cron ===
function safeRequire(name) {
  try { return require(name) } catch (e) {
    console.error(`[sholat] Module "${name}" belum terpasang? Jalankan: npm i ${name}`)
    return null
  }
}
let cron = safeRequire('node-cron')

// === DB helpers ===
const DB_DIR = path.join(__dirname, '..', 'database')
const DB_PATH = path.join(DB_DIR, 'autosholat.json')
function ensureDir(p) { try { fs.mkdirSync(p, { recursive: true }) } catch {} }
function load() { try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) } catch { return {} } }
function save(x) { try { ensureDir(DB_DIR); fs.writeFileSync(DB_PATH, JSON.stringify(x, null, 2)) } catch (e) { console.error('[sholat save ERR]', e?.message) } }

// ==== STATE ====
global.__sholat_boot = global.__sholat_boot || false
global.__sholat_conn = global.__sholat_conn || null
global._sholatJobs = global._sholatJobs || []
global.__sholat_watch = global.__sholat_watch || null

// ==== Helper: rencana aktif dari DB ====
function getPlansFromState(st) {
  return [
    { slot:'subuh',   time: st.times?.subuh,   text:'🕟 *Waktu Sholat Subuh telah tiba.*\nMari awali hari dengan doa dan semangat baru 🌅' },
    { slot:'dzuhur',  time: st.times?.dzuhur,  text:'🕛 *Waktu Sholat Dzuhur telah tiba.*\nTinggalkan sejenak urusan dunia, yuk tunaikan sholat 🙏' },
    { slot:'ashar',   time: st.times?.ashar,   text:'🕞 *Waktu Sholat Ashar telah tiba.*\nLuangkan waktu sejenak untuk beribadah sore ini 🌤️' },
    { slot:'maghrib', time: st.times?.maghrib, text:'🕕 *Waktu Sholat Maghrib telah tiba.*\nJangan tunda kebaikan, mari sholat berjamaah 🌇' },
    { slot:'isya',    time: st.times?.isya,    text:'🕖 *Waktu Sholat Isya telah tiba.*\nAkhiri harimu dengan ibadah dan ketenangan hati 🌙' },
  ].filter(p => p.time && /^\d{2}:\d{2}$/.test(p.time))
}

// ==== UTIL ====
function zoneToTZ(z) {
  z = String(z || '').toUpperCase()
  if (z === 'WIB') return 'Asia/Jakarta'
  if (z === 'WITA') return 'Asia/Makassar'
  if (z === 'WIT')  return 'Asia/Jayapura'
  return null
}

function toDailyCron(hhmm) {
  const [H, M] = (String(hhmm).split(':').map(x => parseInt(x, 10)))
  const h = Number.isFinite(H) ? Math.max(0, Math.min(23, H)) : 0
  const m = Number.isFinite(M) ? Math.max(0, Math.min(59, M)) : 0
  const expr = `${m} ${h} * * *`
  if (cron && cron.validate && !cron.validate(expr))
    throw new Error(`Cron tidak valid: ${hhmm}`)
  return expr
}

async function getTargetGroupJids(conn) {
  const st = load()
  if (Array.isArray(st.whitelist) && st.whitelist.length)
    return st.whitelist.map(j => j.endsWith('@g.us') ? j : `${j}@g.us`)
  try {
    const all = await (conn.groupFetchAllParticipating ? conn.groupFetchAllParticipating() : {})
    return Object.keys(all || {}).filter(j => j.endsWith('@g.us'))
  } catch { return [] }
}

function normalizeGroupJid(jid) {
  return jid.endsWith('@g.us') ? jid : (jid.includes('@') ? jid : `${jid}@g.us`)
}

async function safeSend(conn, jid, text) {
  try {
    const target = normalizeGroupJid(jid)
    await conn.sendMessage(target, { text })
    console.log('[sholat OK]', target)
  } catch (e) { console.error('[sholat SEND ERR]', jid, e?.message) }
}

// === Kirim audio adzan ===
async function sendAdzanAudio(conn, jid, slot) {
  try {
    const filename = (slot === 'subuh') ? 'subuh.mp3' : 'adzan.mp3'
    const candidates = [
      path.join(__dirname, '..', 'media', 'adzan', filename),
      path.resolve(process.cwd(), 'media', 'adzan', filename),
      path.resolve('media', 'adzan', filename)
    ]

    let file = candidates.find(p => fs.existsSync(p))
    if (!file) return console.warn('[sholat AUDIO] file tidak ditemukan:', candidates)

    const target = normalizeGroupJid(jid)
    const buf = fs.readFileSync(file)
    await conn.sendMessage(target, {
      audio: buf,
      mimetype: 'audio/mpeg',
      ptt: false,
      fileName: path.basename(file)
    })
    console.log('[sholat AUDIO OK]', path.basename(file))
  } catch (e) {
    console.error('[sholat AUDIO ERR]', e?.message)
  }
}

// ==== REGISTRASI JOB ====
global._registerSholatSchedules = global._registerSholatSchedules || (async function (conn) {
  if (!cron) { console.warn('[sholat] cron tidak aktif (node-cron tidak tersedia).'); return }
  if (!conn) { console.warn('[sholat] tidak ada conn saat register jadwal'); return }

  global.__sholat_conn = conn

  // stop job lama
  try { global._sholatJobs.forEach(j => j.stop && j.stop()) } catch {}
  global._sholatJobs = []

  const st = load()
  st.on ??= true
  st.zone ??= 'WITA'
  st.whitelist = Array.isArray(st.whitelist) ? st.whitelist : []
  st.times ??= { subuh:'04:30', dzuhur:'12:00', ashar:'15:30', maghrib:'18:00', isya:'19:30' }
  save(st)

  if (!st.on) { console.log('[sholat] disabled'); return }

  const tz = zoneToTZ(st.zone) || 'Asia/Makassar'
  const plans = getPlansFromState(st)

  for (const p of plans) {
    const exp = toDailyCron(p.time)
    try {
      const job = cron.schedule(exp, async () => {
        try {
          console.log(`[sholat RUN] ${p.slot} @ ${new Date().toISOString()} (${tz})`)
          const targets = await getTargetGroupJids(conn)
          for (const jid of targets) {
            await safeSend(conn, jid, p.text)
            await sendAdzanAudio(conn, jid, p.slot)
          }
        } catch (e) { console.error('[sholat SEND ERR]', e?.message) }
      }, { timezone: tz, scheduled: true })
      global._sholatJobs.push(job)
      console.log('[sholat] job terpasang:', p.slot, p.time, tz)
    } catch (e) { console.error('[sholat CRON ERR]', p.slot, p.time, e?.message) }
  }

  const targetsCount = (await getTargetGroupJids(conn)).length
  console.log('[sholat] scheduled:', plans.map(p => `${p.slot} ${p.time}`).join(', '), `(${tz}) ; groups=${targetsCount}, jobs=${global._sholatJobs.length}`)
})

// ==== WATCHDOG (cek tiap 5 menit; re-register kalau job hilang) ====
function startSholatWatchdog(conn) {
  if (global.__sholat_watch) return
  global.__sholat_watch = setInterval(async () => {
    try {
      if (!cron) return
      const st = load()
      if (!st.on) return

      // sync conn jika reconnect
      if (!global.__sholat_conn || global.__sholat_conn !== conn)
        global.__sholat_conn = conn

      const expected = getPlansFromState(st).length
      const alive = (global._sholatJobs || []).length
      if (alive < expected) {
        console.log(`[sholat watchdog] jobs hilang (${alive}/${expected}) → re-register`)
        await global._registerSholatSchedules(global.__sholat_conn)
      }
    } catch (e) { console.error('[sholat watchdog ERR]', e?.message) }
  }, 5 * 60 * 1000)
  console.log('[sholat] watchdog aktif (cek tiap 5 menit)')
}

// ==== REFRESH HARIAN (00:01 WITA) ====
if (cron) {
  cron.schedule('1 0 * * *', async () => {
    try {
      console.log('[sholat daily refresh]')
      await global._registerSholatSchedules(global.__sholat_conn)
    } catch (e) { console.error('[sholat daily ERR]', e?.message) }
  }, { timezone: 'Asia/Makassar' })
}

// ==== COMMAND ====
let handler = async (m, { conn, usedPrefix, args }) => {
  const st = load()
  st.on ??= true
  st.zone ??= 'WITA'
  st.whitelist = Array.isArray(st.whitelist) ? st.whitelist : []
  st.times ??= { subuh:'04:30', dzuhur:'12:00', ashar:'15:30', maghrib:'18:00', isya:'19:30' }

  const sub = (args[0]||'').toLowerCase()
  const sub2 = (args[1]||'').toLowerCase()

  if (!sub || sub==='status') {
    const onoff = st.on ? '🟢 ON' : '🔴 OFF'
    const wl = st.whitelist.length ? `${st.whitelist.length} grup` : 'semua grup'
    const t = st.times
    return m.reply(
`🕌 *Sholat Reminder* ${onoff}
Whitelist: ${wl}
Jadwal: 
• Subuh   ${t.subuh}
• Dzuhur  ${t.dzuhur}
• Ashar   ${t.ashar}
• Maghrib ${t.maghrib}
• Isya    ${t.isya}

Perintah:
${usedPrefix}sholat on|off [here|all]
${usedPrefix}sholat add here | del here | list
${usedPrefix}sholat set <subuh|dzuhur|ashar|maghrib|isya> <HH:MM>
${usedPrefix}sholat test <slot>
${usedPrefix}sholat run <slot>`)
  }

  if ((sub==='on'||sub==='off') && sub2==='all') {
    st.on = (sub==='on'); save(st)
    await m.reply(`✅ Pengingat Sholat ${sub.toUpperCase()} untuk *semua grup*.`)
    await global._registerSholatSchedules(conn); return
  }

  if ((sub==='on'||sub==='off') && (sub2==='here'||!sub2)) {
    const id = m.chat
    const idx = st.whitelist.indexOf(id)
    if (sub==='on'){ if(!st.whitelist.includes(id)) st.whitelist.push(id); st.on=true; save(st); await m.reply('✅ Pengingat Sholat diaktifkan untuk grup ini.') }
    else { if(idx>=0) st.whitelist.splice(idx,1); save(st); await m.reply('✅ Pengingat Sholat dimatikan untuk grup ini.') }
    await global._registerSholatSchedules(conn); return
  }

  if (sub==='add' && args[1]==='here'){ if(!st.whitelist.includes(m.chat)) st.whitelist.push(m.chat); save(st); await m.reply('✅ Grup ini ditambahkan ke whitelist.'); await global._registerSholatSchedules(conn); return }
  if (sub==='del' && args[1]==='here'){ st.whitelist = st.whitelist.filter(x=>x!==m.chat); save(st); await m.reply('✅ Grup ini dihapus dari whitelist.'); await global._registerSholatSchedules(conn); return }
  if (sub==='list'){ const list = st.whitelist.length ? st.whitelist.map((j,i)=>`${i+1}. ${j}`).join('\n') : '(kosong → semua grup aktif saat ON)'; return m.reply('Whitelist Sholat:\n'+list) }

  // SET TIME
  if (sub === 'set') {
    const slot = (args[1]||'').toLowerCase()
    const hhmm = (args[2]||'')
    if (!/^(subuh|dzuhur|ashar|maghrib|isya)$/.test(slot))
      return m.reply(`Format: ${usedPrefix}sholat set <subuh|dzuhur|ashar|maghrib|isya> <HH:MM>`)
    if (!/^\d{2}:\d{2}$/.test(hhmm))
      return m.reply('Format jam salah. Contoh: 04:30')

    st.times[slot] = hhmm
    save(st)
    await m.reply(`✅ Jam sholat *${slot}* diubah ke *${hhmm}*.`)
    await global._registerSholatSchedules(conn)
    return
  }

  if (sub==='test'){
    const slot = (args[1]||'').toLowerCase()
    if (!/^(subuh|dzuhur|ashar|maghrib|isya)$/.test(slot))
      return m.reply(`Format: ${usedPrefix}sholat test <subuh|dzuhur|ashar|maghrib|isya>`)
    if (typeof global.sendSholatReminder === 'function'){
      await global.sendSholatReminder(conn, m.chat, slot, { test:true })
      return m.reply(`✅ Test pengingat sholat *${slot}* dikirim (dengan audio).`)
    }
    return m.reply('✅ Test terpicu, tapi fungsi audio belum aktif.')
  }

  if (sub==='run'){
    const slot = (args[1]||'').toLowerCase()
    if (!/^(subuh|dzuhur|ashar|maghrib|isya)$/.test(slot)) return m.reply(`Format: ${usedPrefix}sholat run <subuh|dzuhur|ashar|maghrib|isya>`)
    const targets = await getTargetGroupJids(conn)
    for (const jid of targets) await safeSend(conn, jid, `🔔 *Pengingat Sholat ${slot} (manual)*`)
    return m.reply(`✅ Dikirim manual ke ${targets.length} grup.`)
  }

  return m.reply(`Perintah tidak dikenal. Ketik ${usedPrefix}sholat status`)
}

handler.help = ['sholat [status|on|off] (here|all) | add here | del here | list | set <slot> <HH:MM> | test <slot> | run <slot>']
handler.tags = ['auto','group']
handler.command = /^sholat$/i
handler.owner = true

// BOOTSTRAP: aktifkan scheduler & watchdog saat ada pesan apa pun
handler.all = async function (m, { conn }) {
  if (!global.__sholat_boot) {
    global.__sholat_boot = true
    global.__sholat_conn = conn
    try {
      await global._registerSholatSchedules(conn)
      startSholatWatchdog(conn)
    } catch (e) { console.error('[sholat BOOT ERR]', e?.message) }
  }
}

module.exports = handler