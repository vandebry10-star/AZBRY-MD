// plugins/bgl-shop.js
// Shop per-grup: .shop .buy <id> .inv  (pakai BGL per-grup)

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

function getGroupBGL(db, gid) { if (!db[gid]) db[gid] = { users: {}, queue: [] }; return db[gid]; }
function getUserBGL(group, uid) { if (!group.users[uid]) group.users[uid] = { bgl: 0, lastClaim: 0 }; return group.users[uid]; }

function getGroupInv(invdb, gid) { if (!invdb[gid]) invdb[gid] = { users: {} }; return invdb[gid]; }
function getUserInv(ginv, uid) { if (!ginv.users[uid]) ginv.users[uid] = { items: [] }; return ginv.users[uid]; }

const SHOP = [
  { id: 'Rayman Fist', cost: 50 },
  { id: 'Magplant', cost: 35 },
  { id: 'Phoenix Wings', cost: 25 },
  { id: 'Zephyr Wings', cost: 22 },
  { id: 'Dragon Wings', cost: 20 },
  { id: 'Golden Angel Wings', cost: 28 },
  { id: 'Crystal Wings', cost: 24 },
];

let handler = async (m, { conn, command, args }) => {
  const gid = m.chat;
  if (!gid.endsWith('@g.us')) return m.reply('Hanya di grup.');
  const uid = m.sender;

  if (/^shop$/i.test(command)) {
    const lines = SHOP.map((it, i) => `${i+1}. ${it.id} — ${it.cost} BGL`).join('\n');
    return m.reply(
`🛒 *AZBRY SHOP*
${lines}

Beli: *.buy <nomor>*`
    );
  }

  if (/^buy$/i.test(command)) {
    const n = parseInt(args[0]);
    if (isNaN(n) || n < 1 || n > SHOP.length) return m.reply('Format: *.buy <nomor item>*');

    const item = SHOP[n-1];

    const bdb = load(BGL_DB);
    const g   = getGroupBGL(bdb, gid);
    const u   = getUserBGL(g, uid);

    if ((u.bgl||0) < item.cost) return m.reply(`Saldo kurang. Butuh *${item.cost} BGL*. Saldo: *${u.bgl} BGL*`);

    u.bgl -= item.cost;
    save(BGL_DB, bdb);

    const idb = load(INV_DB);
    const ginv = getGroupInv(idb, gid);
    const uinv = getUserInv(ginv, uid);
    uinv.items.push(item.id);
    save(INV_DB, idb);

    return m.reply(`✅ Berhasil beli *${item.id}* (−${item.cost} BGL)\nSaldo: *${u.bgl} BGL*`);
  }

  if (/^inv$/i.test(command)) {
    const idb = load(INV_DB);
    const ginv = getGroupInv(idb, gid);
    const uinv = getUserInv(ginv, uid);
    const list = uinv.items.length ? uinv.items.map((x,i)=>`${i+1}. ${x}`).join('\n') : '—';
    return m.reply(`🎒 *Inventory*\n${list}`);
  }
};

handler.help = ['shop','buy <nomor>','inv'];
handler.tags = ['economy','game'];
handler.command = /^(shop|buy|inv)$/i;
handler.group = true;

module.exports = handler;