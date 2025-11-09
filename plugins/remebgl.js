// plugins/bgl-core.js
// BGL Wallet per-grup: .bgl .claimbgl .topbgl .addbgl (owner)
// + Tampilkan item yang dimiliki (from bgl_inv.json)

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'database');
const BGL_DB = path.join(DATA_DIR, 'bgl.json');
const INV_DB = path.join(DATA_DIR, 'bgl_inv.json');

function ensure() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(BGL_DB)) fs.writeFileSync(BGL_DB, JSON.stringify({}), 'utf8');
  if (!fs.existsSync(INV_DB)) fs.writeFileSync(INV_DB, JSON.stringify({}), 'utf8');
}
function load(file) { ensure(); try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return {}; } }
function save(file, data) { ensure(); fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

function getGroup(db, gid) {
  if (!db[gid]) db[gid] = { users: {}, queue: [] };
  return db[gid];
}
function getUser(group, uid) {
  if (!group.users[uid]) group.users[uid] = { bgl: 0, lastClaim: 0 };
  return group.users[uid];
}
function getInv(invdb, gid, uid) {
  if (!invdb[gid]) invdb[gid] = { users: {} };
  if (!invdb[gid].users[uid]) invdb[gid].users[uid] = { items: [] };
  return invdb[gid].users[uid];
}

const CLAIM_PER_DAY = 7;         // 7 BGL / hari
const DAY_MS = 24 * 60 * 60 * 1000;

let handler = async (m, { conn, command, args, usedPrefix, isOwner }) => {
  const gid = m.chat;
  if (!gid.endsWith('@g.us')) return m.reply('Hanya di grup.');

  const uid = m.sender;
  const bdb = load(BGL_DB);
  const g = getGroup(bdb, gid);
  const u = getUser(g, uid);

  // .bgl -> saldo + item dimiliki
  if (/^bgl$/i.test(command)) {
    const idName = '@' + uid.split('@')[0];
    const invdb = load(INV_DB);
    const inv = getInv(invdb, gid, uid);
    const items = inv.items && inv.items.length ? inv.items.map((it, i) => `${i+1}. ${it}`).join('\n') : '—';
    const txt =
`💼 *Dompet BGL*
• User : ${idName}
• Saldo: ${u.bgl} BGL

🎒 *Item Dimiliki*
${items}`;
    return conn.reply(gid, txt, m, { mentions: [uid] });
  }

  // .claimbgl -> +7 per 24 jam, per grup
  if (/^claimbgl$/i.test(command)) {
    const now = Date.now();
    if (now - u.lastClaim < DAY_MS) {
      const sisa = Math.ceil((DAY_MS - (now - u.lastClaim)) / 1000);
      const hh = String(Math.floor(sisa / 3600)).padStart(2, '0');
      const mm = String(Math.floor((sisa % 3600) / 60)).padStart(2, '0');
      const ss = String(sisa % 60).padStart(2, '0');
      return m.reply(`⏳ Udah klaim. Coba lagi dalam *${hh}:${mm}:${ss}*.`);
    }
    u.bgl += CLAIM_PER_DAY;
    u.lastClaim = now;
    save(BGL_DB, bdb);
    return m.reply(`✅ *Klaim Berhasil!* +${CLAIM_PER_DAY} BGL\nSaldo: *${u.bgl} BGL*`);
  }

  // .topbgl -> top 10 per grup (dengan mention)
  if (/^topbgl$/i.test(command)) {
    const arr = Object.entries(g.users).map(([jid, v]) => ({ jid, bgl: v.bgl||0 }));
    if (!arr.length) return m.reply('📭 Belum ada data.');
    arr.sort((a,b)=> b.bgl - a.bgl);
    const top = arr.slice(0, 10);
    const lines = top.map((x, i) => `${i+1}. @${x.jid.split('@')[0]} — ${x.bgl} BGL`).join('\n');
    const txt = `💎 *TOP BLUE GEM LOCK*\n────────────────────\n${lines}\n────────────────────`;
    return conn.reply(gid, txt, m, { mentions: top.map(x=>x.jid) });
  }

  // .addbgl @user <jumlah> (owner)
  if (/^addbgl$/i.test(command)) {
    if (!isOwner) return m.reply('Khusus Owner.');
    if (!m.mentionedJid?.length || !args[args.length-1]) {
      return m.reply(`Contoh: ${usedPrefix}addbgl @user 5`);
    }
    const amt = parseInt(args[args.length-1]);
    if (isNaN(amt) || amt === 0) return m.reply('Jumlah tidak valid.');
    const targets = m.mentionedJid;
    for (const t of targets) {
      const ut = getUser(g, t);
      ut.bgl += amt;
    }
    save(BGL_DB, bdb);
    return conn.reply(gid, `✅ Tambah *${amt} BGL* ke ${targets.map(j=>`@${j.split('@')[0]}`).join(', ')}`, m, { mentions: targets });
  }
};

handler.help = ['bgl','claimbgl','topbgl','addbgl @user <jumlah>'];
handler.tags = ['economy','game'];
handler.command = /^(bgl|claimbgl|topbgl|addbgl)$/i;
handler.group = true;

module.exports = handler;