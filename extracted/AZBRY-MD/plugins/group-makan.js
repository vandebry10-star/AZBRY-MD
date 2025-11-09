// plugins/_group-makan.js
// 🍽️ Makan Reminders — cron + watchdog + daily refresh + diag

const path = require('path')
const fs = require('fs')

// === safe require for node-cron ===
function safeRequire(name) {
  try { return require(name) } catch (e) {
    console.error(`[makan] Module "${name}" belum terpasang? Jalankan: npm i ${name}`)
    return null
  }
}
let cron = safeRequire('node-cron')

// === DB helpers ===
const DB_DIR = path.join(__dirname, '..', 'database')
const DB_PATH = path.join(DB_DIR, 'automakan.json')
function ensureDir(p) { try { fs.mkdirSync(p, { recursive: true }) } catch {} }
function load() { try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) } catch { return {} } }
function save(x) { try { ensureDir(DB_DIR); fs.writeFileSync(DB_PATH, JSON.stringify(x, null, 2)) } catch (e) { console.error('[makan save ERR]', e?.message) } }

// ==== STATE ====
global.__makan_boot = global.__makan_boot || false
global.__makan_conn = global.__makan_conn || null
global._makanJobs = global._makanJobs || []
global.__makan_watch = global.__makan_watch || null

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
function normalizeGroupJid(jid) {
  return jid.endsWith('@g.us') ? jid : (jid.includes('@') ? jid : `${jid}@g.us`)
}
async function getTargetGroupJids(conn) {
  const st = load()
  if (Array.isArray(st.whitelist) && st.whitelist.length)
    return st.whitelist.map(normalizeGroupJid)
  try {
    const all = await (conn.groupFetchAllParticipating ? conn.groupFetchAllParticipating() : {})
    return Object.keys(all || {}).filter(j => j.endsWith('@g.us'))
  } catch { return [] }
}
async function safeSend(conn, jid, text) {
  try {
    const target = normalizeGroupJid(jid)
    await conn.sendMessage(target, { text })
    console.log('[makan OK]', target)
  } catch (e) { console.error('[makan SEND ERR]', jid, e?.message) }
}

// ==== RENCANA AKTIF ====
function getPlansFromState(st) {
  return [
    { slot:'sarapan', time: st.times?.sarapan, text:'🍞 *Waktunya sarapan!* Isi energi untuk memulai hari 💪' },
    { slot:'siang',   time: st.times?.siang,   text:'🍛 *Waktunya makan siang!* Jangan lupa istirahat & makan bergizi 🍽️' },
    { slot:'malam',   time: st.times?.malam,   text:'🍚 *Waktunya makan malam!* Secukupnya saja biar tidur nyenyak 😴' },
  ].filter(p => p.time && /^\d{2}:\d{2}$/.test(p.time))
}

// ==== REGISTER JOB ====
global._registerMakanSchedules = global._registerMakanSchedules || (async function (conn) {
  try {
    if (!cron) { console.warn('[makan] cron tidak aktif (node-cron tidak tersedia).'); return }
    if (!conn) { console.warn('[makan] tidak ada conn saat register jadwal'); return }

    global.__makan_conn = conn

    try { global._makanJobs.forEach(j => j.stop && j.stop()) } catch {}
    global._makanJobs = []

    const st = load()
    st.on ??= true
    st.zone ??= 'WITA'
    st.whitelist = Array.isArray(st.whitelist) ? st.whitelist.map(normalizeGroupJid) : []
    st.times ??= { sarapan:'06:30', siang:'12:15', malam:'20:00' }
    save(st)

    if (!st.on) { console.log('[makan] disabled'); return }

    const tz = zoneToTZ(st.zone) || 'Asia/Makassar'
    const plans = getPlansFromState(st)

    for (const p of plans) {
      const exp = toDailyCron(p.time)
      try {
        const job = cron.schedule(exp, async () => {
          try {
            console.log(`[makan RUN] ${p.slot} @ ${new Date().toISOString()} (${tz})`)
            const targets = await getTargetGroupJids(conn)
            for (const jid of targets) await safeSend(conn, jid, p.text)
          } catch (e) { console.error('[makan SEND ERR]', e?.message) }
        }, { timezone: tz, scheduled: true })
        global._makanJobs.push(job)
        console.log('[makan] job terpasang:', p.slot, p.time, tz)
      } catch (e) { console.error('[makan CRON ERR]', p.slot, p.time, e?.message) }
    }

    const targetsCount = (await getTargetGroupJids(conn)).length
    console.log('[makan] scheduled:', plans.map(p => `${p.slot} ${p.time}`).join(', '), `(${tz}) ; groups=${targetsCount}, jobs=${global._makanJobs.length}`)
  } catch (e) {
    console.error('[makan REGISTER ERR]', e?.stack || e?.message)
  }
})

// ==== WATCHDOG ====
function startMakanWatchdog(conn) {
  if (global.__makan_watch) return
  global.__makan_watch = setInterval(async () => {
    try {
      if (!cron) return
      const st = load()
      if (!st.on) return

      if (!global.__makan_conn || global.__makan_conn !== conn)
        global.__makan_conn = conn

      const expected = getPlansFromState(st).length
      const alive = (global._makanJobs || []).length
      if (alive < expected) {
        console.log(`[makan watchdog] jobs hilang (${alive}/${expected}) → re-register`)
        await global._registerMakanSchedules(global.__makan_conn)
      }
    } catch (e) { console.error('[makan watchdog ERR]', e?.message) }
  }, 5 * 60 * 1000)
  console.log('[makan] watchdog aktif (cek tiap 5 menit)')
}

// ==== REFRESH HARIAN ====
if (cron) {
  cron.schedule('1 0 * * *', async () => {
    try {
      console.log('[makan daily refresh]')
      await global._registerMakanSchedules(global.__makan_conn)
    } catch (e) { console.error('[makan daily ERR]', e?.message) }
  }, { timezone: 'Asia/Makassar' })
}

// ==== COMMAND ====
let handler = async (m, { conn, usedPrefix, args }) => {
  const st = load()
  st.on ??= true
  st.zone ??= 'WITA'
  st.whitelist = Array.isArray(st.whitelist) ? st.whitelist.map(normalizeGroupJid) : []
  st.times ??= { sarapan:'06:30', siang:'12:15', malam:'20:00' }

  const sub  = (args[0]||'').toLowerCase()
  const sub2 = (args[1]||'').toLowerCase()

  if (!sub || sub==='status') {
    const onoff = st.on ? '🟢 ON' : '🔴 OFF'
    const wl = st.whitelist.length ? `${st.whitelist.length} grup` : 'semua grup'
    const t = st.times
    return m.reply(
`🍽️ *Makan Reminder* ${onoff}
Whitelist: ${wl}
Jadwal:
• Sarapan ${t.sarapan}
• Siang   ${t.siang}
• Malam   ${t.malam}

Perintah:
${usedPrefix}makan on|off [here|all]
${usedPrefix}makan add here | del here | list
${usedPrefix}makan set <sarapan|siang|malam> <HH:MM>
${usedPrefix}makan test <slot>
${usedPrefix}makan run <slot>
${usedPrefix}makan diag`)
  }

  if ((sub==='on'||sub==='off') && sub2==='all') {
    st.on = (sub==='on'); save(st)
    await m.reply(`✅ Pengingat Makan ${sub.toUpperCase()} untuk *semua grup*.`)
    await global._registerMakanSchedules(conn); return
  }

  if ((sub==='on'||sub==='off') && (sub2==='here'||!sub2)) {
    const id = normalizeGroupJid(m.chat)
    const idx = st.whitelist.indexOf(id)
    if (sub==='on'){ if(idx<0) st.whitelist.push(id); st.on=true; save(st); await m.reply('✅ Pengingat Makan diaktifkan untuk grup ini.') }
    else { if(idx>=0) st.whitelist.splice(idx,1); save(st); await m.reply('✅ Pengingat Makan dimatikan untuk grup ini.') }
    await global._registerMakanSchedules(conn); return
  }

  if (sub==='add' && args[1]==='here'){ const id = normalizeGroupJid(m.chat); if(!st.whitelist.includes(id)) st.whitelist.push(id); save(st); await m.reply('✅ Grup ini ditambahkan ke whitelist.'); await global._registerMakanSchedules(conn); return }
  if (sub==='del' && args[1]==='here'){ const id = normalizeGroupJid(m.chat); st.whitelist = st.whitelist.filter(x=>x!==id); save(st); await m.reply('✅ Grup ini dihapus dari whitelist.'); await global._registerMakanSchedules(conn); return }
  if (sub==='list'){ const list = st.whitelist.length ? st.whitelist.map((j,i)=>`${i+1}. ${j}`).join('\n') : '(kosong → semua grup aktif saat ON)'; return m.reply('Whitelist Makan:\n'+list) }

  if (sub === 'set') {
    const slot = (args[1]||'').toLowerCase()
    const hhmm = (args[2]||'')
    if (!/^(sarapan|siang|malam)$/.test(slot))
      return m.reply(`Format: ${usedPrefix}makan set <sarapan|siang|malam> <HH:MM>`)
    if (!/^\d{2}:\d{2}$/.test(hhmm))
      return m.reply('Format jam salah. Contoh: 06:30')

    st.times[slot] = hhmm
    save(st)
    await m.reply(`✅ Jam makan *${slot}* diubah ke *${hhmm}*.`)
    await global._registerMakanSchedules(conn)
    return
  }

  if (sub==='test'){
    const slot = (args[1]||'').toLowerCase()
    if (!/^(sarapan|siang|malam)$/.test(slot))
      return m.reply(`Format: ${usedPrefix}makan test <sarapan|siang|malam>`)
    await safeSend(conn, m.chat, `✅ *TEST* Pengingat makan *${slot}*`)
    return
  }

  if (sub==='run'){
    const slot = (args[1]||'').toLowerCase()
    if (!/^(sarapan|siang|malam)$/.test(slot)) return m.reply(`Format: ${usedPrefix}makan run <sarapan|siang|malam>`)
    const targets = await getTargetGroupJids(conn)
    for (const jid of targets) await safeSend(conn, jid, `🔔 *Pengingat makan ${slot} (manual)*`)
    return m.reply(`✅ Dikirim manual ke ${targets.length} grup.`)
  }

  if (sub==='diag') {
    const st2 = load()
    const plans = getPlansFromState(st2)
    const jobs = (global._makanJobs || []).length
    const tz = zoneToTZ(st2.zone) || 'Asia/Makassar'
    const cronOK = !!cron
    const targets = await getTargetGroupJids(conn)
    return m.reply(
`🔧 *Makan Diag*
• cron loaded : ${cronOK ? 'YES' : 'NO'}
• on          : ${st2.on ? 'YES' : 'NO'}
• zone        : ${st2.zone} (${tz})
• whitelist   : ${st2.whitelist?.length||0} grup
• plans       : ${plans.map(p=>`${p.slot} ${p.time}`).join(', ') || '(none)'}
• jobs alive  : ${jobs}
• targets now : ${targets.length}`)
  }

  return m.reply(`Perintah tidak dikenal. Ketik ${usedPrefix}makan status`)
}

handler.help = ['makan [status|on|off] (here|all) | add here | del here | list | set <slot> <HH:MM> | test <slot> | run <slot> | diag']
handler.tags = ['auto','group']
handler.command = /^makan$/i
handler.owner = true

// BOOTSTRAP
handler.all = async function (m, { conn }) {
  if (!global.__makan_boot) {
    global.__makan_boot = true
    global.__makan_conn = conn
    try {
      await global._registerMakanSchedules(conn)
      startMakanWatchdog(conn)
    } catch (e) { console.error('[makan BOOT ERR]', e?.stack || e?.message) }
  }
}

module.exports = handler