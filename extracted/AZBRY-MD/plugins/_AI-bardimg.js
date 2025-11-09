const fetch = require('node-fetch');
const uploader = require('../lib/uploadImage');
const uploadFile = require('../lib/uploadFile');

let handler = async (m, { conn, text, command, usedPrefix }) => {
  if (!text) throw `Reply media with text\nExample: ${usedPrefix + command} what is this?`;
  
  let q = m.quoted ? m.quoted : m;
  let mime = (q.msg || q).mimetype || q.mediaType || '';
  let media, baseUrl;
  
  await m.reply(wait);
  
  try {
    if (/image/g.test(mime) && !/webp/g.test(mime)) {
      let buffer = await q.download();
      media = await uploader(buffer);
      baseUrl = `https://api.botcahx.eu.org/api/search/bard-img?url=${media}&text=${text}&apikey=${btc}`;
    } 
    else if (/video/g.test(mime)) {
      if (q.seconds > 60) throw 'Maximum video duration is 60 seconds!';
      let buffer = await q.download();
      media = await uploadFile(buffer);
      baseUrl = `https://api.botcahx.eu.org/api/search/bard-video?url=${media}&text=${text}&apikey=${btc}`;
    }
    else if (/audio/g.test(mime)) {
      let buffer = await q.download();
      media = await uploadFile(buffer);
      baseUrl = `https://api.botcahx.eu.org/api/search/bard-audio?url=${media}&text=${text}&apikey=${btc}`;
    }
    else {
      throw `Reply image/video/audio with command ${usedPrefix + command} pertanyaan`;
    }

    let json = await (await fetch(baseUrl)).json();
    if (json.status && json.result) {
      conn.sendMessage(m.chat, { text: json.result }, { quoted: m });
    } else {
      throw 'Failed to get response from Gemini!';
    }
    
  } catch (err) {
    console.error(err);
    throw eror
  }
}

handler.help = ['bardimg', 'bardimage', 'bardvideo', 'bardaudio', 'geminiimg', 'geminiimage', 'geminivideo', 'geminiaudio'];
handler.tags = ['ai'];
handler.command = /^(bardimg|bardimage|bardvideo|bardaudio|geminiimg|geminiimage|geminivideo|geminiaudio)$/i;

handler.limit = true;

module.exports = handler;
