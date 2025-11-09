const fetch = require('node-fetch');

let handler = async (m, { 
    conn,
    text,
    usedPrefix,
    command
}) => {
    var [from, to] = text.split`|`
    if (!(from && to)) throw `Ex: ${usedPrefix + command} jakarta|bandung`

    try {
        let data = await fetch(`https://api.botcahx.eu.org/api/search/jarak?from=${from}&to=${to}&apikey=${btc}`);
        let json = await data.json();

        if (json.status) {
            let message = json.message;
            let detail = message.detail;
            let asal = message.asal;
            let tujuan = message.tujuan;
            let estimasiBiayaBBM = message.estimasi_biaya_bbm;
            let arahjalan = message.arah_penunjuk_jalan;
            let petaStatis = message.peta_statis;
            let rute = message.rute;

            let responseText = `🛣️ *Jarak*:\n\n` +
                `*Detail Perjalanan:* ${detail}\n` +
                `*Asal:* ${asal.nama}, ${asal.alamat}, ${asal.negara}\n` +
                `*Tujuan:* ${tujuan.nama}, ${tujuan.alamat}, ${tujuan.negara}\n` +
                `*Estimasi Biaya BBM:* ${estimasiBiayaBBM.total_biaya} (Liter: ${estimasiBiayaBBM.total_liter})\n\n` +
                `🗺️ *Arah Penunjuk Jalan:*`;

            arahjalan.forEach(step => {
                responseText += `\n${step.langkah}. ${step.instruksi} - ${step.jarak}`;
            });

            responseText += `\n\n📍 *Peta Statis:* ${petaStatis}\n` +
                `🛤️ *Rute:* ${rute}`;

            let fetch_buff = await fetch(petaStatis);
            let buff = await fetch_buff.buffer();

            await conn.sendFile(m.chat, buff, 'jarak.png', responseText, m);
        } else {
            throw `🚩 *Jarak Tidak Ditemukan*`;
        }
    } catch (error) {
        throw `🚩 *Jarak Tidak Ditemukan*`;
    }
}

handler.command = handler.help = ['jarak'];
handler.tags = ['internet'];
handler.limit = true;

module.exports = handler;
