let PhoneNumber = require('awesome-phonenumber')
let levelling = require('../lib/levelling')
const { createHash } = require('crypto')
const axios = require("axios")
const fetch = require("node-fetch")

let handler = async (m, { conn, text, usedPrefix, command }) => {
  function no(number) {
    return number.replace(/\s/g, '').replace(/([@+-])/g, '')
  }

  text = no(text)

  if (isNaN(text)) {
    var number = text.split`@`[1]
  } else if (!isNaN(text)) {
    var number = text
  }

  if (!text && !m.quoted) return conn.reply(m.chat, `*❏ GET NUMBER*\n\n• \`\`\`\Tag user:\`\`\`\ *${usedPrefix}profile @Tag*\n• \`\`\`\Type number:\`\`\`\ *${usedPrefix}profile 6289654360447*\n• \`\`\`\Check my profile:\`\`\`\ *(Balas / Reply Pesan Anda Sendiri)*\n• \`\`\`\Reply user which want in\`\`\`\  _*STALKING*_`, m)
  if (isNaN(number)) return conn.reply(m.chat, `*❏ GET NUMBER*\n\n• \`\`\`\Tag user:\`\`\`\ *${usedPrefix}profile @Tag*\n• \`\`\`\Type number:\`\`\`\ *${usedPrefix}profile 6289654360447*\n• \`\`\`\Check my profile:\`\`\`\ *(Balas / Reply Pesan Anda Sendiri)*\n• \`\`\`\Reply user which want in\`\`\`\  _*STALKING*_`, m)
  if (number.length > 15) return conn.reply(m.chat, `*❏ GET NUMBER*\n\n• \`\`\`\Tag user:\`\`\`\ *${usedPrefix}profile @Tag*\n• \`\`\`\Type number:\`\`\`\ *${usedPrefix}profile 6289654360447*\n• \`\`\`\Check my profile:\`\`\`\ *(Balas / Reply Pesan Anda Sendiri)*\n• \`\`\`\Reply user which want in\`\`\`\  _*STALKING*_`, m)

  let pp = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXIdvC1Q4WL7_zA6cJm3yileyBT2OsWhBb9Q&usqp=CAU'
  try {
    if (text) {
      var who = number + '@s.whatsapp.net'
    } else if (m.quoted.sender) {
      var who = m.quoted.sender
    } else if (m.mentionedJid) {
      var who = number + '@s.whatsapp.net'
    }
    pp = await conn.profilePictureUrl(who, 'image')
  } catch (e) {
    // Handle error
  } finally {
    if (typeof db.data.users[who] == 'undefined') throw 'Pengguna tidak ada didalam data base'
    let groupMetadata = m.isGroup ? await conn.groupMetadata(m.chat) : {}
    let participants = m.isGroup ? groupMetadata.participants : []
    let users = m.isGroup ? participants.find(u => u.jid == who) : {}
    let number = who.split('@')[0]
    let about = (await conn.fetchStatus(who).catch(console.error) || {}).status || ''
    let { name, pasangan, limit, exp, money, bank, lastclaim, premiumDate, premium, registered, regTime, age, level } = global.db.data.users[who]
    
    // Role
    let role = (level <= 2) ? 'Newbie ㋡'
      : (level >= 2 && level <= 4) ? 'Beginner Grade 1 ⚊¹'
      : (level >= 4 && level <= 6) ? 'Beginner Grade 2 ⚊²'
      : (level >= 6 && level <= 8) ? 'Beginner Grade 3 ⚊³'
      : (level >= 8 && level <= 10) ? 'Beginner Grade 4 ⚊⁴'
      : (level >= 10 && level <= 20) ? 'Private Grade 1 ⚌¹'
      : (level >= 20 && level <= 30) ? 'Private Grade 2 ⚌²'
      : (level >= 30 && level <= 40) ? 'Private Grade 3 ⚌³'
      : (level >= 40 && level <= 50) ? 'Private Grade 4 ⚌⁴'
      : (level >= 50 && level <= 60) ? 'Private Grade 5 ⚌⁵'
      : (level >= 60 && level <= 70) ? 'Corporal Grade 1 ☰¹'
      : (level >= 70 && level <= 80) ? 'Corporal Grade 2 ☰²'
      : (level >= 80 && level <= 90) ? 'Corporal Grade 3 ☰³'
      : (level >= 90 && level <= 100) ? 'Corporal Grade 4 ☰⁴'
      : (level >= 100 && level <= 110) ? 'Corporal Grade 5 ☰⁵'
      : (level >= 110 && level <= 120) ? 'Sergeant Grade 1 ≣¹'
      : (level >= 120 && level <= 130) ? 'Sergeant Grade 2 ≣²'
      : (level >= 130 && level <= 140) ? 'Sergeant Grade 3 ≣³'
      : (level >= 140 && level <= 150) ? 'Sergeant Grade 4 ≣⁴'
      : (level >= 150 && level <= 160) ? 'Sergeant Grade 5 ≣⁵'
      : (level >= 160 && level <= 170) ? 'Staff Grade 1 ﹀¹'
      : (level >= 170 && level <= 180) ? 'Staff Grade 2 ﹀²'
      : (level >= 180 && level <= 190) ? 'Staff Grade 3 ﹀³'
      : (level >= 190 && level <= 200) ? 'Staff Grade 4 ﹀⁴'
      : (level >= 200 && level <= 210) ? 'Staff Grade 5 ﹀⁵'
      : (level >= 210 && level <= 220) ? 'Sergeant Grade 1 ︾¹'
      : (level >= 220 && level <= 230) ? 'Sergeant Grade 2 ︾²'
      : (level >= 230 && level <= 240) ? 'Sergeant Grade 3 ︾³'
      : (level >= 240 && level <= 250) ? 'Sergeant Grade 4 ︾⁴'
      : (level >= 250 && level <= 260) ? 'Sergeant Grade 5 ︾⁵'
      : (level >= 260 && level <= 270) ? '2nd Lt. Grade 1 ♢¹'
      : (level >= 270 && level <= 280) ? '2nd Lt. Grade 2 ♢²'
      : (level >= 280 && level <= 290) ? '2nd Lt. Grade 3 ♢³'
      : (level >= 290 && level <= 300) ? '2nd Lt. Grade 4 ♢⁴'
      : (level >= 300 && level <= 310) ? '2nd Lt. Grade 5 ♢⁵'
      : (level >= 310 && level <= 320) ? '1st Lt. Grade 1 ♢♢¹'
      : (level >= 320 && level <= 330) ? '1st Lt. Grade 2 ♢♢²'
      : (level >= 330 && level <= 340) ? '1st Lt. Grade 3 ♢♢³'
      : (level >= 340 && level <= 350) ? '1st Lt. Grade 4 ♢♢⁴'
      : (level >= 350 && level <= 360) ? '1st Lt. Grade 5 ♢♢⁵'
      : (level >= 360 && level <= 370) ? 'Major Grade 1 ✷¹'
      : (level >= 370 && level <= 380) ? 'Major Grade 2 ✷²'
      : (level >= 380 && level <= 390) ? 'Major Grade 3 ✷³'
      : (level >= 390 && level <= 400) ? 'Major Grade 4 ✷⁴'
      : (level >= 400 && level <= 410) ? 'Major Grade 5 ✷⁵'
      : (level >= 410 && level <= 420) ? 'Colonel Grade 1 ✷✷¹'
      : (level >= 420 && level <= 430) ? 'Colonel Grade 2 ✷✷²'
      : (level >= 430 && level <= 440) ? 'Colonel Grade 3 ✷✷³'
      : (level >= 440 && level <= 450) ? 'Colonel Grade 4 ✷✷⁶'
      : (level >= 450 && level <= 460) ? 'Colonel Grade 5 ✷✷⁵'
      : (level >= 460 && level <= 470) ? 'Brigadier Early ✰'
      : (level >= 470 && level <= 480) ? 'Brigadier Silver ✩'
      : (level >= 480 && level <= 490) ? 'Brigadier Gold ✯'
      : (level >= 490 && level <= 500) ? 'Brigadier Platinum ✬'
      : (level >= 500 && level <= 600) ? 'Brigadier Diamond ✪'
      : (level >= 600 && level <= 700) ? 'Legendary 忍'
      : (level >= 700 && level <= 800) ? 'Legendary 忍忍'
      : (level >= 800 && level <= 900) ? 'Legendary 忍忍忍'
      : (level >= 900 && level <= 1000) ? 'Legendary忍忍忍忍'
      : 'Master 숒 × Legendary 숒'

    let now = new Date() * 1
    let { min, xp, max } = levelling.xpRange(level, global.multiplier)
    let username = conn.getName(who)
    let math = max - xp
    let sn = createHash('md5').update(m.sender).digest('hex')
    let prem = global.prems.includes(who.split`@`[0])
    let jodoh = `Berpacaran @${pasangan.split`@`[0]}`
    let str = `
┌─⊷ *PROFILE*
👤 • *Username:* ${username} ${registered ? '(' + name + ') ': ''}(@${who.split`@`[0]})
👥 • *About:* ${about ? '\n: ' + about : ''}
🏷 • *Status:* ${pasangan ? jodoh : 'Jomblo' }
📞 • *Number:* ${PhoneNumber('+' + who.replace('@s.whatsapp.net', '')).getNumber('international')}
🔢 • *Serial Number:* ${sn}
🔗 • *Link:* https://wa.me/${who.split`@`[0]}
👥 • *Umur:* ${registered ? age : ''}
└──────────────

┌─⊷ *PROFILE RPG*
▢ XP: TOTAL ${exp} (${exp - min} / ${xp}) [${math <= 0 ? `Ready to *${usedPrefix}levelup*` : `${math} XP left to levelup`}]
▢ Level: ${level}
▢ Role: *${role}*
▢ Limit: ${limit}
▢ Money: ${money}
└──────────────

┌─⊷ *STATUS*
📑 • *Registered:* ${registered ? 'Yes (' + new Date(regTime) + ')': 'No'}
🌟 • *Premium:* ${premium ? 'Yes' : 'No'}
⏰ • *PremiumTime:* ${(premiumDate - now) > 1 ? msToDate(premiumDate - now) : '*Tidak diatur expired premium!*'}${lastclaim > 0 ? '\nLast Claim: ' + new Date(lastclaim) : ''}
└──────────────
`.trim()
    let mentionedJid = [who]
    conn.sendFile(m.chat, pp, 'pp.jpg', str, m, false, { contextInfo: { mentionedJid: conn.parseMention(str) } })
  }
}

handler.help = ['profile [@user]']
handler.tags = ['info']
handler.command = /^profile$/i
handler.limit = true
handler.register = false
handler.group = true

module.exports = handler

function msToDate(ms) {
  temp = ms
  days = Math.floor(ms / (24 * 60 * 60 * 1000))
  daysms = ms % (24 * 60 * 60 * 1000)
  hours = Math.floor((daysms) / (60 * 60 * 1000))
  hoursms = ms % (60 * 60 * 1000)
  minutes = Math.floor((hoursms) / (60 * 1000))
  minutesms = ms % (60 * 1000)
  sec = Math.floor((minutesms) / (1000))
  return days + " Hari " + hours + " Jam " + minutes + " Menit"
}

const getBuffer = async (url, options) => {
  try {
    options ? options : {}
    const res = await axios({
      method: "get",
      url,
      headers: {
        'DNT': 1,
        'User-Agent': 'GoogleBot',
        'Upgrade-Insecure-Request': 1
      },
      ...options,
      responseType: 'arraybuffer'
    })
    return res.data
  } catch (e) {
    console.log(`Error : ${e}`)
  }
}
