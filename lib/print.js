// lib/print.js
// Versi simple: 1 baris log per pesan, anti spam

const chalk = require('chalk')
const fs = require('fs')

module.exports = async function printMessage(m, conn = { user: {} }) {
  try {
    if (!m || !m.key) return

    // waktu pesan
    const ts = m.messageTimestamp
      ? new Date(1000 * (m.messageTimestamp.low || m.messageTimestamp))
      : new Date()
    const timeStr = ts.toTimeString().split(' ')[0] // HH:MM:SS

    // id chat & sender
    const jid = m.key.remoteJid || m.chat
    const senderJid = m.key.participant || m.sender || jid
    const isGroup = jid.endsWith('@g.us')

    // nama chat & pengirim
    let chatName = jid
    let senderName = senderJid

    try {
      chatName = await conn.getName(jid)
    } catch {}

    try {
      senderName = await conn.getName(senderJid)
    } catch {}

    // tipe pesan
    const mtype = m.mtype || (m.message ? Object.keys(m.message)[0] : 'unknown')
    const isCmd = m.isCommand || false

    // teks ringkas (maks 80 char)
    let text =
      typeof m.text === 'string'
        ? m.text.replace(/\s+/g, ' ').trim()
        : ''

    if (text.length > 80) text = text.slice(0, 77) + '...'
    if (!text) text = `[${mtype}]`

    // format log 1 baris
    const line =
      `${chalk.gray(timeStr)} ` +
      `${isGroup ? chalk.cyan('[GC]') : chalk.magenta('[PV]')} ` +
      `${chalk.green(senderName)} ` +
      `${chalk.yellow('→')} ` +
      `${chalk.blue(chatName)} ` +
      `${isCmd ? chalk.red('(CMD)') : ''} ` +
      `${chalk.white('-')} ${text}`

    console.log(line)
  } catch (e) {
    // kalau mau lihat error print.js, boleh hidupkan:
    // console.error('[PRINT ERROR]', e)
  }
}

// hot reload untuk development
let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright("Update 'lib/print.js'"))
  delete require.cache[file]
})
