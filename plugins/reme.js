// plugins/reme.js
// Taruhan per-grup: .reme <jumlah>
// Matchmaking antrean per grup, angka 0..36 acak, jackpot (0,19,28) bonus x3

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'database');
const BGL_DB = path.join(DATA_DIR, 'bgl.json');

function ensure() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(BGL_DB)) fs.writeFileSync(BGL_DB, JSON.stringify({}), 'utf8');
}
function load() { ensure(); try { return JSON.parse(fs.readFileSync(BGL_DB, 'utf8')); } catch { return {}; } }
function save(db) { ensure(); fs.writeFileSync(BGL_DB, JSON.stringify(db, null, 2)); }

function getGroup(db, gid) {
  if (!db[gid]) db[gid] = { users: {}, queue: [] };
  return db[gid];
}
function getUser(group, uid) {
  if (!group.users[uid]) group.users[uid] = { bgl: 0, lastClaim: 0 };
  return group.users[uid];
}

const JACKPOTS = new Set([0, 19, 28]);

function rollNum() {
  return Math.floor(Math.random() * 37); // 0..36
}
function points(n) {
  if (n < 10) return n;
  const s = String(n);
  const a = parseInt(s[0]), b = parseInt(s[1]);
  const p = (a + b) % 10;     // sum digit -> 0..9
  return p;
}

let handler = async (m, { conn, args }) => {
  const gid = m.chat;
  if (!gid.endsWith('@g.us')) return m.reply('Hanya di grup.');

  const stake = parseInt(args[0]);
  if (isNaN(stake) || stake < 1) return m.reply('Minimal taruhan 1 BGL.');

  const db = load();
  const g = getGroup(db, gid);
  const me = getUser(g, m.sender);

  if ((me.bgl||0) < stake) return m.reply(`Saldo kurang. Saldo: *${me.bgl} BGL*`);

  // Cari lawan di antrean *dengan nominal sama* (biar fair)
  const idx = g.queue.findIndex(q => q.amount === stake && q.uid !== m.sender);
  if (idx === -1) {
    // masuk antrean
    g.queue.push({ uid: m.sender, amount: stake, at: Date.now() });
    save(db);
    return m.reply(`🕹️ Menunggu lawan untuk taruhan *${stake} BGL*...\nKetik lagi *.reme ${stake}* di chat ini untuk bergabung jadi lawan.`);
  }

  // Match ketemu
  const opp = g.queue.splice(idx, 1)[0];
  const you = m.sender;
  const enemy = opp.uid;

  const u1 = getUser(g, you);
  const u2 = getUser(g, enemy);

  // Pastikan saldo cukup saat match
  if (u2.bgl < stake) {
    save(db);
    return m.reply('Lawan saldo-nya kurang, match dibatalkan. Coba lagi.');
  }
  if (u1.bgl < stake) {
    save(db);
    return m.reply('Saldo kamu kurang, match dibatalkan.');
  }

  // Kunci stake
  u1.bgl -= stake;
  u2.bgl -= stake;

  // Lempar angka
  const n1 = rollNum();
  const n2 = rollNum();

  const p1 = points(n1);
  const p2 = points(n2);

  // Penentuan menang:
  // - poin 0 adalah tertinggi (override)
  // - selain itu, poin terkecil KALAH (jadi semakin besar poin, semakin bagus)
  //   => kita bikin pembanding: rank = (p===0 ? +Infinity : p)
  const r1 = (p1 === 0 ? Infinity : p1);
  const r2 = (p2 === 0 ? Infinity : p2);

  let resultText = '';
  let mentions = [you, enemy];

  if (r1 === r2) {
    // SERI -> refund
    u1.bgl += stake;
    u2.bgl += stake;
    resultText =
`🎲 *TARUHAN SELESAI!*
────────────────
🎮 Kamu: ${n1}
🎮 Lawan (@${enemy.split('@')[0]}): ${n2}
⚖️ Seri!

💰 Saldo kamu: ${u1.bgl} BGL
────────────────`;
  } else {
    // tentukan pemenang
    const youWin = r1 > r2; // yang "lebih besar" menang (karena Infinity untuk jackpot)
    const winner = youWin ? u1 : u2;
    const loser  = youWin ? u2 : u1;
    const winnerJid = youWin ? you : enemy;

    // hadiah normal: ambil stake lawan (pot 2*stake -> net +stake)
    let gain = stake;

    // jackpot bonus x3 jika ANGKA milik pemenang ada di JACKPOTS (0,19,28)
    const winNumber = youWin ? n1 : n2;
    if (JACKPOTS.has(winNumber)) {
      gain = stake * 3;
    }

    winner.bgl += (stake + gain); // kembalikan stake sendiri + profit
    // loser sudah dipotong stake di awal

    const youName   = '@' + you.split('@')[0];
    const enemyName = '@' + enemy.split('@')[0];
    const judul = youWin ? 'Kamu MENANG!' : 'Kamu KALAH.';
    const lineWin = youWin ? `${youName}` : `${enemyName}`;

    resultText =
`🎲 *TARUHAN SELESAI!*
────────────────
🎮 Kamu: ${n1}
🎮 Lawan (${enemyName}): ${n2}
🏁 Pemenang: ${lineWin}${JACKPOTS.has(winNumber) ? ' (JACKPOT x3)' : ''}

💰 Saldo kamu: ${u1.bgl} BGL
────────────────`;
  }

  save(db);
  return conn.reply(gid, resultText, m, { mentions });
};

handler.help = ['reme <jumlah>'];
handler.tags = ['economy','game'];
handler.command = /^reme$/i;
handler.group = true;

module.exports = handler;