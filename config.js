global.owner = ['6281510040802', '115414931636252'] // wajib di isi tidak boleh kosong
global.mods  = ['6281510040802', '115414931636252'] // wajib di isi tidak boleh kosong
global.prems = ['6281510040802', '115414931636252'] // wajib di isi tidak boleh kosong
global.nameowner = 'FebryWesker' // wajib di isi tidak boleh kosong
global.numberowner = '6281510040802' // wajib di isi tidak boleh kosong
global.mail = 'support@tioprm.eu.org' // wajib di isi tidak boleh kosong
global.gc = 'https://chat.whatsapp.com/I5RpePh2b5u37OyFjzCNTr' // wajib di isi tidak boleh kosong
global.instagram = 'https://instagram.com/syfebry_' // wajib di isi tidak boleh kosong
global.wm = '© AzbryMD' // isi nama bot atau nama kalian
global.wait = 'Sedang diproses, Mohon tunggu beberapa detik ⏳'
global.eror = '*Gagal memproses perintah!*\nSilakan coba lagi dalam beberapa saat.'
global.stiker_wait = '*Mengonversi media ke format .webp*'
global.packname = 'Made With' // watermark stikcker packname
global.author = 'Azbry-MD ©FebryWesker' // watermark stikcker author
global.maxwarn = '5' // Peringatan maksimum Warn

global.autobio = false // Set true/false untuk mengaktifkan atau mematikan autobio (default: false)
global.antiporn = false // Set true/false untuk Auto delete pesan porno (bot harus admin) (default: false)
global.spam = false // Set true/false untuk anti spam (default: false)
global.gcspam = false // Set true/false untuk menutup grup ketika spam (default: false)
    

// APIKEY INI WAJIB DI ISI! //
global.btc = 'bijikepala67'
global.aksesKey = 'LR9NCSdJ'
// Daftar terlebih dahulu https://api.botcahx.eu.org


// Tidak boleh diganti atau di ubah
global.APIs = {   
  btc: 'https://api.botcahx.eu.org'
}

//Tidak boleh diganti atau di ubah
global.APIKeys = { 
  'https://api.botcahx.eu.org': global.btc
}


let fs = require('fs')
let chalk = require('chalk')
let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  delete require.cache[file]
  require(file)
})
