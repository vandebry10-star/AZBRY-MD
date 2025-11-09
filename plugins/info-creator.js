var name = global.nameowner
var numberowner = global.numberowner
var gmail = global.mail
const { 
default: 
makeWASocket,
BufferJSON,
WA_DEFAULT_EPHEMERAL, 
generateWAMessageFromContent, 
downloadContentFromMessage, 
downloadHistory, 
proto,
getMessage, 
generateWAMessageContent, 
prepareWAMessageMedia 
} = require("@adiwajshing/baileys");
var handler = async (m, {
conn
}) => {
const vcard = `BEGIN:VCARD
VERSION:3.0
N:Sy;Bot;;;
FN: ${name}
item.ORG: Creator Bot
item1.TEL;waid=${numberowner}:${numberowner}@s.whatsapp.net
item1.X-ABLabel:Nomor Creator Bot 
item2.EMAIL;type=INTERNET:${gmail}
item2.X-ABLabel:Email Owner
item3.ADR:;;🇮🇩 Indonesia;;;;
item3.X-ABADR:ac
item4.EMAIL;type=INTERNET:support@tioprm.eu.org
item4.X-ABLabel:Email Developer 
item3.ADR:;;🇮🇩 Indonesia;;;;
item3.X-ABADR:ac 
item5.URL:${instagram}
item5.X-ABLabel:Website
END:VCARD`
const sentMsg  = await conn.sendMessage(
    m.chat,
    { 
        contacts: { 
            displayName: 'CN', 
            contacts: [{ vcard }] 
        }
    }
)
await conn.reply(m.chat, "⚙️ Azbry-MD Official Contact\nDikembangkan dan dikelola oleh *FebryWesker* 🧠\nGunakan dengan tanggung jawab.\nLaporan bug? Silahkan chat nomor diatas.\nTerimakasih", sentMsg)}
handler.command = handler.help = ['owner', 'creator'];
handler.tags = ['info'];
handler.limit = false;
module.exports = handler;
