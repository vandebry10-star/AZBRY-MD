// plugins/_suggest.js
// DidYouMean versi clean by FebryWesker / Azbry-MD

const didyoumean = require('didyoumean')
const similarity = require('similarity')

const THRESHOLD = 0.75          // tingkat kemiripan minimal
const COOLDOWN_MS = 20_000      // cooldown per chat biar gak spam

let lastSuggestAt = new Map()

let handler = m => m

handler.before = function (m, { match }) {
  const usedPrefix = (match[0] || '')[0]
  if (!usedPrefix || !m.text) return

  const noPrefix = m.text.slice(usedPrefix.length).trim()
  if (!noPrefix || noPrefix.length < 2 || noPrefix.length > 48) return

  const alias = Object.values(global.plugins)
    .filter(p => p && p.help && !p.disabled)
    .flatMap(p => Array.isArray(p.help) ? p.help : [p.help])
    .map(s => String(s).trim())
    .filter(Boolean)

  if (alias.includes(noPrefix)) return

  const mean = didyoumean(noPrefix, alias)
  if (!mean) return

  const sim = similarity(noPrefix, mean)
  if (sim < THRESHOLD) return

  const now = Date.now()
  const last = lastSuggestAt.get(m.chat) || 0
  if (now - last < COOLDOWN_MS) return
  lastSuggestAt.set(m.chat, now)

  const msg =
`*Perintah tidak ditemukan...*

Mungkin maksudmu *${usedPrefix + mean}*  
(tingkat kemiripan: ${Math.round(sim * 100)}%)

💡 Coba ketik ulang pakai perintah itu`

  return this.reply(m.chat, msg, m)
}

module.exports = handler