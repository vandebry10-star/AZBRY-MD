let handler = async (m, { conn }) => {
let ye = `@${m.sender.split`@`[0]}`
let esce = `
👋 *Hai ${ye}!*  
Bot ini berjalan menggunakan *Azbry-MD System*  

🔎 *Source Script:*  
https://github.com/vandebry10-star/Azbry-MD  

🗞️ *Portofolio Developer:* 
https://bit.ly/4nnTGjr  

✨ Powered by *FebryWesker | Azbry-MD*`
m.reply(esce)
}
handler.help = ['sc', 'sourcecode']
handler.tags = ['info']
handler.command = /^(sc|sourcecode)$/i

module.exports = handler