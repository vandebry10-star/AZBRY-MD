// plugins/_badword-hard.js
// 🔥 Toxic Badword Filter (Hardcore) — soft warning, no kick — WITA
process.env.TZ = 'Asia/Makassar'

const fs = require('fs')
const path = require('path')
const DBFILE = path.join(__dirname, '..', 'database', 'katakasars.json')

// ===== Storage (pakai list hardcore dari kamu) =====
function defaultList () {
  return [
    // Bahasa Indonesia — ekstrem vulgar & hinaan serius
    "kontol","memek","peler","pler","itil","puki","pukimak","pepek","jembut","toket","tetek","nenen",
    "ngentot","ngewe","colmek","colok","ngocok","masturb","kentot","kintil","pentil",
    "burit","pantat","tempek","ewean","setubuh","sange","nafsu","seks","gairah",
    "lonte","pelacur","sundal","jalang","cewek bayaran","gigolo","bajingan","keparat",
    "bangsat","brengsek","kampret","anjing lu","anjing lo","babi lu","babi lo","iblis lu","setan lu",
    "tai","taek","tahi","telek","berak","pantek","panteq","bajeng","ngetot","ngetotlu",
    "fuckyou","fckyou","fuck u","fck u","anjg","kntl","kntol","kntill","pelerlu","kntlmu","memekmu",
    "anjing banget","babi banget","goblok banget","anjing goblok","anjing tolol","babi goblok","anjing babi",
    "bangsat lu","brengsek lu","tolol lu","goblok lu","sinting","sakit jiwa","mental sampah","otak udang",
    "anjing betina","anjing jantan","kontol besar","kontol kecil","puki besar","puki kecil",

    // Bahasa Inggris — full toxic / vulgar / insult level tinggi
    "fuck","fucking","motherfucker","bullshit","shit","dick","dicks","cock","pussy","cunt","bastard",
    "asshole","bitch","slut","whore","skank","hoe","loser","jerk","prick","retard","moron","idiot",
    "stupid fuck","piece of shit","dumbass","son of a bitch","suck my dick","go fuck yourself",
    "fuck off","dumbfuck","retarded","trash","trash talk","stfu","shut the fuck up","cum","cumshot","cumslut",
    "numbnuts","jackass","wanker","bollocks","twat","douchebag","dipshit","craphole","shithead",

    // Latin / Spanyol — vulgar & kasar tinggi
    "puta","puto","mierda","cabron","pendejo","coño","chinga","chingada","hijo de puta","estupido","malparido",

    // Melayu (Malaysia) — yang kasar berat
    "pukimak","pantek","celaka hang","babi kau","anjing kau","kepala hotak","bodoh piang","sundal kau",
    "haram jadah","bangang","keji","binatang kau",

    // bentuk terenskripsi (obfuscation populer)
    "f*ck","sh*t","b*tch","c*nt","p*ssy","d*ck","a**hole","m*therf*cker","f@ck","sh1t","b1tch","f.ck","s.u.c.k",
    "k0nt0l","m3m3k","p3l3r","p3p3k","puk!","puk!m@k","g0bl0k","t0l0l","b@b!","4nj!ng","4nj1ng","k*nt*l","m*m*k"
  ]
}

function loadCfg () {
  try { return JSON.parse(fs.readFileSync(DBFILE, 'utf8')) } catch {}
  // default: ON, cooldown 30 detik, admin bypass ON
  return { on:true, cooldown:30, bypassAdmins:true, list: defaultList() }
}
function saveCfg (cfg) {
  fs.mkdirSync(path.dirname(DBFILE), { recursive:true })
  fs.writeFileSync(DBFILE, JSON.stringify(cfg, null, 2))
}

// ===== Helpers =====
function escapeRegex (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
function norm (s='') { return s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase() }
function getText(m){
  if (m.text) return m.text
  if (m.caption) return m.caption
  const msg = m.msg || m.message || {}
  if (msg.conversation) return msg.conversation
  if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text
  const k = Object.keys(msg)[0]; const inner = k && msg[k]
  if (inner?.caption) return inner.caption
  if (inner?.text) return inner.text
  return ''
}

// cooldown memory
global.__KKS_COOL = global.__KKS_COOL || {}
function hitCooldown (gid, uid, sec) {
  const key = gid + '|' + uid
  const now = Date.now()
  const last = global.__KKS_COOL[key] || 0
  if (now - last < sec * 1000) return true
  global.__KKS_COOL[key] = now
  return false
}

// ===== Teguran Azbry-Style (tajam, bikin mikir, no hina personal) =====
const WARNINGS = [
  "🧠 Kata barusan bikin IQ obrolan turun drastis. Coba ganti dengan kalimat yang bermutu.",
  "🪞 Cek cermin dulu, bener itu representasi dirimu? Aku yakin kamu bisa lebih elegan dari itu.",
  "🧹 Sudah kubersihkan kata toksikmu. Revisi niat, kirim ulang dengan kepala dingin.",
  "🔕 Emosi kamu nyaring, argumenmu nggak kedengeran. Tenangkan, lalu sampaikan dengan jelas.",
  "📉 Kredibilitasmu barusan diskon 90%. Tulis ulang biar balik ke harga normal.",
  "⏸️ Pause sebentar. Ulangi pakai diksi yang bikin dihargai, bukan dihindari.",
  "🧩 Kata kasar itu jalan pintas orang kehabisan logika. Pilih jalur argumen, bukan makian.",
  "🧊 Panasnya sudah ya, pendinginkan otak, reset jari, baru lanjut bicara.",
  "🏷️ Reputasi > pelampiasan. Tadi hampir kamu barter, untung sudah aku buang kata kasarnya.",
  "🚫 Server menolak kebisingan. Kirim ulang pesan yang layak dibaca manusia dewasa.",
  "🧭 Arah percakapanmu melenceng. Balik ke nalar, bukan naluri marah.",
  "🧱 Diksi barusan menutup pintu dialog. Pilih kata yang membuka, bukan menabrak.",
  "📦 Sampah verbal terdeteksi, sudah kuangkut. Simpan energi untuk kalimat yang bernilai.",
  "🛠️ Kritik itu perlu, cacian itu murahan. Upgrade pilihan katanya.",
  "🎯 Mau didengar? Bidik pakai data & logika, bukan amarah musiman.",
  "🔁 Ulangi tanpa racun. Kamu akan kaget seberapa cepat orang mau mendengar.",
  "🧾 Catatan hidupmu lebih panjang dari chat ini. Jangan isi dengan hal yang kamu sesali.",
  "⛔ Batas etika dilewati. Tarik langkah, mundur elegan, lalu masuk lagi dengan sopan.",
  "📡 Sinyal emosimu kuat, tapi pesanmu hilang. Tulis ulang: singkat, tajam, sopan.",
  "🧯 Api kecil padam, percakapan selamat. Terima kasih kalau kamu pilih kata yang lebih baik.",
  "🧠 Orang cerdas menang di pilihan kata. Tunjukkan kecerdasanmu sekarang.",
  "🔍 Yang kamu sampaikan mungkin benar, cara menyampaikannya yang salah. Perbaiki caranya.",
  "🕊️ Tenang. Orang besar diukur dari kontrol diri, bukan volume makian.",
  "📚 Kosakata manusia itu luas. Pilih yang meningkatkan, bukan merendahkan.",
  "⚖️ Marah itu wajar, menghina itu pilihan. Pilih yang tidak bikin kamu menyesal.",
  "🧱 Makian mematikan diskusi. Hargai dirimu, pakai kalimat yang pantas dihormati.",
  "💡 Kamu bisa lebih dari ini. Bukti paling cepat: ganti kata-katamu.",
  "🧾 Nota pengingat: kualitas diri terlihat dari kualitas kalimat.",
]

// =============== COMMAND HANDLER ===============
let handler = async function (m, { conn, args, usedPrefix, command, isAdmin, isOwner }) {
  if (!/^(bw|badword)$/i.test(command)) return
  const sub = (args[0] || '').toLowerCase()
  const cfg = loadCfg()

  const needAdmin = () => {
    if (isOwner || isAdmin) return false
    m.reply('Perintah ini hanya untuk *Admin/Owner*.')
    return true
  }

  if (!sub || sub === 'status') {
    const body = [
      `Status: ${cfg.on ? '🟢 ON' : '🔴 OFF'}`,
      `Cooldown: ${cfg.cooldown || 30}s`,
      `Bypass Admin: ${cfg.bypassAdmins ? 'Ya' : 'Tidak'}`,
      `Kata (${cfg.list.length}): ${cfg.list.slice(0,12).join(', ')} ... (${cfg.list.length} total)`
    ].join('\n')
    return conn.reply(m.chat, body, m)
  }

  if (sub === 'on' || sub === 'off') {
    if (needAdmin()) return
    cfg.on = sub === 'on'
    saveCfg(cfg)
    return m.reply(`Filter kata toxic ${cfg.on ? 'AKTIF' : 'NONAKTIF'}.`)
  }

  if (sub === 'add') {
    if (needAdmin()) return
    const w = (args.slice(1).join(' ') || '').trim()
    if (!w) return m.reply(`Contoh: ${usedPrefix}${command} add goblok`)
    if (!cfg.list.includes(w)) cfg.list.push(w)
    saveCfg(cfg)
    return m.reply(`Ditambah ke daftar: ${w}`)
  }

  if (sub === 'del' || sub === 'rm' || sub === 'hapus') {
    if (needAdmin()) return
    const w = (args.slice(1).join(' ') || '').trim()
    if (!w) return m.reply(`Contoh: ${usedPrefix}${command} del goblok`)
    const i = cfg.list.indexOf(w)
    if (i >= 0) cfg.list.splice(i, 1)
    saveCfg(cfg)
    return m.reply(`Dihapus dari daftar: ${w}`)
  }

  if (sub === 'list') {
    const chunk = (arr, n=80) => {
      const out = []
      for (let i=0;i<arr.length;i+=n) out.push(arr.slice(i,i+n))
      return out
    }
    const pages = chunk(cfg.list, 100).map((part, i) => `Daftar kata (${cfg.list.length}) — Hal ${i+1}:\n- ${part.join('\n- ')}`)
    for (const p of pages) await conn.reply(m.chat, p, m)
    return
  }

  if (sub === 'cooldown') {
    if (needAdmin()) return
    const n = parseInt(args[1])
    if (isNaN(n) || n < 5) return m.reply('Isi angka detik (min 5).')
    cfg.cooldown = n
    saveCfg(cfg)
    return m.reply(`Cooldown di-set: ${n}s`)
  }

  if (sub === 'bypassadmin') {
    if (needAdmin()) return
    cfg.bypassAdmins = !cfg.bypassAdmins
    saveCfg(cfg)
    return m.reply(`Bypass admin: ${cfg.bypassAdmins ? 'Ya' : 'Tidak'}`)
  }

  return m.reply(
    `Pakai:\n` +
    `${usedPrefix}${command} status\n` +
    `${usedPrefix}${command} on|off\n` +
    `${usedPrefix}${command} add <kata>\n` +
    `${usedPrefix}${command} del <kata>\n` +
    `${usedPrefix}${command} list\n` +
    `${usedPrefix}${command} cooldown <detik>\n` +
    `${usedPrefix}${command} bypassadmin`
  )
}

// =============== LISTENER GLOBAL ===============
handler.all = async function (m) {
  const cfg = loadCfg()
  if (!cfg.on) return
  if (!m.chat || !m.chat.endsWith('@g.us')) return
  if (!m.sender) return

  const isOwner = m.isOwner || false
  const isAdmin = m.isAdmin || false
  if (isOwner) return
  if (cfg.bypassAdmins && isAdmin) return

  const raw = getText(m)
  if (!raw) return

  const text = norm(raw)
  const words = (cfg.list || []).map(w => escapeRegex(norm(w))).filter(Boolean)
  if (!words.length) return

  // cari match kata toxic (batas kata & tanda baca umum)
  const re = new RegExp(
    `(?:^|\\b|\\s|[.,!?/\\\\()\\-_"'*])(${words.join('|')})(?=$|\\b|\\s|[.,!?/\\\\()\\-_"'*])`,
    'i'
  )
  if (!re.test(text)) return

  // cooldown per user di grup
  if (hitCooldown(m.chat, m.sender, cfg.cooldown || 30)) return

  // kirim teguran random + mention (soft warning)
  const msg = WARNINGS[Math.floor(Math.random() * WARNINGS.length)]
  try { await this.reply(m.chat, msg, m, { mentions: [m.sender] }) } catch {}
}

handler.help = ['bw','badword']
handler.tags = ['auto','moderation','group']
handler.command = /^(bw|badword)$/i
handler.group = true

module.exports = handler
