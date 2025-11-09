let handler = async (m, { conn, command }) => {
    let txt = `╭───────────────⬣
│ 👑 *PREMIUM USER — AZBRY-MD*
│
│ ✦ Benefit Eksklusif:
│   • 💎 Unlimited Limit  
│   • ⚙️ Full Akses Semua cmd dengan logo (p)
│   • 👥 Boleh Invite ke 1 Grup kamu
│
│ 💰 *Harga:* XXxxx / Bulan (hubungi .owner untuk cek harga)
│ 💳 *Pembayaran:* DANA & QRIS  
│
│ ⚡ Bot aktif 24 jam  
│ 🖥️ Dijalankan via Panel (Always ON)
│
│ 📞 *Contact Owner:*  
│ *.owner*
╰───────────────⬣`;

    try {
        await conn.relayMessage(m.chat, {
            requestPaymentMessage: {
                currencyCodeIso4217: 'IDR',
                amount1000: 148 * 1000,
                requestFrom: '0@s.whatsapp.net',
                noteMessage: {
                    extendedTextMessage: {
                        text: txt,
                        contextInfo: {
                            mentionedJid: [m.sender],
                            externalAdReply: {
                                showAdAttribution: false
                            }
                        }
                    }
                }
            }
        }, {});
    } catch (error) {
        console.error(error);
    }
};

handler.help = ['sewabot'];
handler.tags = ['main'];
handler.command = /^(sewa|sewabot)$/i;

module.exports = handler;
