// plugins/menu.js
// Azbry-MD • Menu Utama (A–Z) + “mata khusus” .menuall di paling bawah

const moment = require('moment-timezone')
process.env.TZ = 'Asia/Makassar'

const BOT_NAME   = '𝑨𝒛𝒃𝒓𝒚-𝑴𝑫'
const DEVELOPER  = '𝑭𝒆𝒃𝒓𝒚𝑾𝒆𝒔𝒌𝒆𝒓'
const BANNER_URL = 'https://lunara.drizznesiasite.biz.id/f/4cXLIx.jpg?key=rCSo1f4LTX-CF0dzCMnHsA'
const SOURCE_URL = 'https://bit.ly/4nnTGjr'

const readMore = String.fromCharCode(8206).repeat(4001)

function clockString(ms){
  if (isNaN(ms)) return '--:--:--'
  let h = Math.floor(ms/3600000)
  let m = Math.floor(ms/60000) % 60
  let s = Math.floor(ms/1000) % 60
  return [h,m,s].map(v => String(v).padStart(2,0)).join(':')
}

function header(p,m){
  const uptime = clockString(process.uptime()*1000)
  const date = moment.tz('Asia/Makassar').format('dddd, DD MMMM YYYY')
  const time = moment.tz('Asia/Makassar').format('HH:mm:ss')
  const name = `@${m.sender.split('@')[0]}`
  return (
`╭──「 ${BOT_NAME} 」──
│ Hai ${name}
│ Created by ${DEVELOPER}
│ Powered with AI & Smart Automation
│ My Portofolio : ${SOURCE_URL}
│
│ ⏱ Uptime : ${uptime}
│ 📅 Tanggal : ${date}
│ 🕒 Waktu : ${time}
│ ✨ Prefix : [ ${p} ]
╰───────────────────────`
  )
}

// ambil semua kategori aktif, urut A–Z
function buildAlphabeticalCategories() {
  const helps = Object.values(global.plugins || {})
    .filter(pl => !pl.disabled)
    .map(pl => ({
      help: Array.isArray(pl.help) ? pl.help : (pl.help ? [pl.help] : []),
      tags: Array.isArray(pl.tags) ? pl.tags : (pl.tags ? [pl.tags] : [])
    }))

  const tags = new Set()
  for (const h of helps) {
    if (!h.help.length) continue
    for (const t of h.tags) if (t) tags.add(t)
  }
  return Array.from(tags).sort((a,b)=>a.localeCompare(b))
}

let handler = async (m,{conn,usedPrefix:p,args})=>{
  const sub = (args[0]||'').toLowerCase()
  const orderedCategories = buildAlphabeticalCategories()

  // tampilan halaman depan .menu
  if (!sub || sub === 'all'){
    const list = orderedCategories.map(cat=>`│ • ${p}menu ${cat}`).join('\n')
    const msg = `${header(p,m)}

────────── ⋆⋅☆⋅⋆ ──────────
   Baca selengkapnya ↓
────────── ⋆⋅☆⋅⋆ ──────────
${readMore}

╭──「 DAFTAR MENU (A–Z) 」──
${list}
╰───────────────────────

╭──「 LIHAT SEMUA MENU 」──
│ • ${p}menuall
│ • ${p}allmenu
│ • ${p}helpall
│   (Tampilkan semua kategori + semua perintah)
╰───────────────────────

Tips: Ketik ${p}menu <kategori> untuk melihat perintahnya.
Contoh: ${p}menu sticker`

    return conn.sendMessage(m.chat, {
      text: msg,
      contextInfo: {
        mentionedJid: [m.sender],
        externalAdReply: {
          title: `${BOT_NAME} — WhatsApp Assistant`,
          body: `Hi @${m.sender.split('@')[0]}`,
          thumbnailUrl: BANNER_URL,
          sourceUrl: SOURCE_URL,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: m })
  }

  // render daftar command per kategori (urut A–Z)
  const helps = Object.values(global.plugins || {})
    .filter(pl => !pl.disabled)
    .map(pl => ({
      help:Array.isArray(pl.help)?pl.help:(pl.help?[pl.help]:[]),
      tags:Array.isArray(pl.tags)?pl.tags:(pl.tags?[pl.tags]:[]),
      prefix:'customPrefix'in pl,
      limit:pl.limit,
      premium:pl.premium
    }))

  const label = sub
  const cmds = helps.filter(x=>x.tags && x.tags.includes(label) && x.help && x.help.length)
  if(!cmds.length) return m.reply(`Kategori "${label}" tidak tersedia.\n\n💡 Coba ${p}menu untuk daftar kategori.`)

  let out = `╭──「 MENU ${label.toUpperCase()} 」──\n`
  // flatten & urutkan berdasarkan nama help
  const rows = []
  for (const c of cmds) for (const h of c.help) {
    if (!h) continue
    rows.push({
      key: h.toLowerCase(),
      line: `${c.prefix ? h : p + h} ${c.limit ? '·(Ⓛ)' : ''}${c.premium ? '·(Ⓟ)' : ''}`
    })
  }
  rows.sort((a,b)=>a.key.localeCompare(b.key))
  for (const r of rows) out += `│ ${r.line}\n`
  out += `╰───────────────────────\nGunakan perintah dengan awalan ${p}`

  return conn.sendMessage(m.chat,{text:out},{quoted:m})
}

handler.help=['menu','help']
handler.tags=['main']
handler.command=/^(menu|help)$/i
handler.exp=3
module.exports=handler