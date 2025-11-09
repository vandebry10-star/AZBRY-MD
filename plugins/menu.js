// plugins/menu.js
// Azbry-MD • Menu Utama + Banner (1 kolom rapi) — custom ordering

const moment = require('moment-timezone')
process.env.TZ = 'Asia/Makassar'

const BOT_NAME   = '𝑨𝒛𝒃𝒓𝒚-𝑴𝑫'
const DEVELOPER  = '𝑭𝒆𝒃𝒓𝒚𝑾𝒆𝒔𝒌𝒆𝒓'
const BANNER_URL = 'https://lunara.drizznesiasite.biz.id/f/4cXLIx.jpg?key=rCSo1f4LTX-CF0dzCMnHsA'
const SOURCE_URL = 'https://bit.ly/4nnTGjr'

const readMore = String.fromCharCode(8206).repeat(4001)

// urutan “prioritas” dari ATAS ke BAWAH tampilan (info paling bawah)
const PRIORITY_ORDER_TOP_TO_BOTTOM = [
  'tools','stalk','group','github','fun','game','sticker','downloader','ai','info'
]

// fallback daftar kategori default (yang lain “terserah”/ditempatkan di atas blok prioritas)
const DEFAULT_TAGS = [
  'ai','main','downloader','database','sticker','advanced','xp','fun','game',
  'github','group','shortlink','anonymous','info','internet','islam','kerang',
  'maker','news','owner','voice','quotes','store','stalk','tools'
]

function clockString(ms){
  if(isNaN(ms)) return '--:--:--'
  let h=Math.floor(ms/3600000)
  let m=Math.floor(ms/60000)%60
  let s=Math.floor(ms/1000)%60
  return [h,m,s].map(v=>String(v).padStart(2,0)).join(':')
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
│ My Portofolio : ${SOURCE_URL}
│
│ ⏱ Uptime : ${uptime}
│ 📅 Tanggal : ${date}
│ 🕒 Waktu : ${time}
│ ✨ Prefix : [ ${p} ]
╰───────────────────────`
  )
}

// susun daftar kategori dengan prioritas custom:
// - kategori lain (yang tidak ada di PRIORITY_ORDER_TOP_TO_BOTTOM) diletakkan DI ATAS
// - lalu blok prioritas dengan urutan persis seperti array PRIORITY_ORDER_TOP_TO_BOTTOM
function buildOrderedCategories() {
  // ambil semua tag yg ada di plugins biar gak nampilin kategori kosong
  const helps = Object.values(global.plugins || {})
    .filter(pl => !pl.disabled)
    .map(pl => ({
      help: Array.isArray(pl.help) ? pl.help : (pl.help ? [pl.help] : []),
      tags: Array.isArray(pl.tags) ? pl.tags : (pl.tags ? [pl.tags] : [])
    }))

  const tagsInUse = new Set()
  for (const p of helps) {
    for (const t of p.tags) if (t) tagsInUse.add(t)
  }

  // mulai dari default, filter yg memang ada komandonya
  const base = DEFAULT_TAGS.filter(t => tagsInUse.has(t))

  // pecah jadi “others” & “priority”
  const want = PRIORITY_ORDER_TOP_TO_BOTTOM.filter(t => base.includes(t))
  const others = base.filter(t => !want.includes(t))

  // final: others (bagian atas) + want (blok prioritas; info jadi paling bawah)
  return [...others, ...want]
}

let handler = async (m,{conn,usedPrefix:p,args})=>{
  const sub = (args[0]||'').toLowerCase()

  // rakit urutan kategori sesuai permintaan
  const orderedCategories = buildOrderedCategories()

  if(!sub || sub === 'all'){
    const list = orderedCategories.map(cat=>`│ • ${p}menu ${cat}`).join('\n')
    const msg = `${header(p,m)}

────────── ⋆⋅☆⋅⋆ ──────────
   Baca selengkapnya ↓
────────── ⋆⋅☆⋅⋆ ──────────
${readMore}

╭──「 DAFTAR MENU 」──
${list}
╰───────────────────────

╭──「 SEMUA MENU 」──
│ • ${p}menuall
│   *Untuk melihat semua menu*
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

  // render daftar command per kategori
  const help = Object.values(global.plugins).filter(pl => !pl.disabled).map(pl => ({
    help:Array.isArray(pl.help)?pl.help:(pl.help?[pl.help]:[]),
    tags:Array.isArray(pl.tags)?pl.tags:(pl.tags?[pl.tags]:[]),
    prefix:'customPrefix'in pl,limit:pl.limit,premium:pl.premium
  }))

  const label=sub
  const cmds=help.filter(x=>x.tags && x.tags.includes(label) && x.help && x.help.length)
  if(!cmds.length)return m.reply(`Kategori "${label}" tidak tersedia.\n\n💡 Coba ${p}menu untuk daftar kategori.`)

  let out=`╭──「 MENU ${label.toUpperCase()} 」──\n`
  for(const c of cmds) for(const h of c.help) out+=`│ ${c.prefix?h:p+h} ${c.limit?'·(Ⓛ)':''}${c.premium?'·(Ⓟ)':''}\n`
  out+=`╰───────────────────────\nGunakan perintah dengan awalan ${p}`

  return conn.sendMessage(m.chat,{text:out},{quoted:m})
}

handler.help=['menu','help']
handler.tags=['main']
handler.command=/^(menu|help)$/i
handler.exp=3
module.exports=handler