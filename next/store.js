// Shopping Man — shared storage layer
//
// Two interchangeable back ends with the same API:
//   FirebaseStore — real shared list (Firestore + anonymous sign-in, offline cache)
//   LocalStore    — demo mode when firebase-config.js is empty (this phone only;
//                   tabs in the same browser still sync, which is handy for testing)
//
// Data layout (same in both):
//   lists/{code}                 { name, createdAt, createdBy }
//   lists/{code}/members/{uid}   { name, joinedAt }
//   lists/{code}/items/{itemId}  { name, norm, qty, status, addedBy, addedAt, ... }
//   lists/{code}/activity/{id}   { type, item, items, by, uid, at }
//
// commit(code, ops) applies a batch of writes. Each op:
//   { col: 'items'|'activity'|'members'|'list', id?: string, data?: object,
//   ('list' writes to the list document itself, e.g. recentTrips)
//     inc?: { field: n }, del?: true }
// An activity op without an id gets an auto id. commit() returns the ids written.

import { firebaseConfig } from './firebase-config.js';

const FB = 'https://www.gstatic.com/firebasejs/10.14.1/';
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I/L

export function makeCode() {
  const pick = () => {
    const a = new Uint32Array(8);
    crypto.getRandomValues(a);
    return Array.from(a, n => CODE_CHARS[n % CODE_CHARS.length]).join('');
  };
  const c = pick();
  return `${c.slice(0, 4)}-${c.slice(4)}`;
}

export function normalizeCode(raw) {
  const c = (raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return c.length === 8 ? `${c.slice(0, 4)}-${c.slice(4)}` : null;
}

function autoId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ------------------------------------------------------------------ */
/* Firebase                                                            */
/* ------------------------------------------------------------------ */

class FirebaseStore {
  constructor() { this.mode = 'firebase'; this.unsubs = []; }

  async ready() {
    const [{ initializeApp }, auth, fs] = await Promise.all([
      import(FB + 'firebase-app.js'),
      import(FB + 'firebase-auth.js'),
      import(FB + 'firebase-firestore.js'),
    ]);
    this.fs = fs;
    const app = initializeApp(firebaseConfig);
    this.db = fs.initializeFirestore(app, {
      localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }),
    });
    this.auth = auth.getAuth(app);

    // Restores the saved anonymous user (works offline); signs in only the first time.
    const user = await new Promise(resolve => {
      const off = auth.onAuthStateChanged(this.auth, u => { off(); resolve(u); });
    });
    this.uid = user ? user.uid : (await auth.signInAnonymously(this.auth)).user.uid;
    return { uid: this.uid };
  }

  ref(code, col, id) {
    const { doc, collection } = this.fs;
    if (!col || col === 'list') return doc(this.db, 'lists', code);
    return id ? doc(this.db, 'lists', code, col, id) : doc(collection(this.db, 'lists', code, col));
  }

  // Needs internet the first time someone joins a list.
  async getList(code) {
    const snap = await this.fs.getDocFromServer(this.ref(code));
    return snap.exists() ? snap.data() : null;
  }

  async createList(name, memberName) {
    const code = makeCode();
    const b = this.fs.writeBatch(this.db);
    b.set(this.ref(code), { name, createdAt: Date.now(), createdBy: this.uid });
    b.set(this.ref(code, 'members', this.uid), { name: memberName, joinedAt: Date.now() });
    await b.commit();
    return code;
  }

  async join(code, memberName) {
    await this.fs.setDoc(this.ref(code, 'members', this.uid),
      { name: memberName, joinedAt: Date.now() }, { merge: true });
  }

  async leave(code) {
    try { await this.fs.deleteDoc(this.ref(code, 'members', this.uid)); } catch (e) { /* offline is fine */ }
  }

  watch(code, { onItems, onActivity, onMembers, onMeta, onStatus }) {
    this.unwatch();
    const { onSnapshot, collection, query, orderBy, limit } = this.fs;
    this.unsubs.push(onSnapshot(this.ref(code), snap => {
      onMeta && onMeta(snap.exists() ? snap.data() : {});
    }, err => console.error('list', err)));
    const col = name => collection(this.db, 'lists', code, name);
    const status = snap => onStatus && onStatus({
      fromCache: snap.metadata.fromCache,
      pending: snap.metadata.hasPendingWrites,
    });
    this.unsubs.push(onSnapshot(col('items'), { includeMetadataChanges: true }, snap => {
      onItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      status(snap);
    }, err => console.error('items', err)));
    this.unsubs.push(onSnapshot(query(col('activity'), orderBy('at', 'desc'), limit(300)), snap => {
      onActivity(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.error('activity', err)));
    this.unsubs.push(onSnapshot(col('members'), snap => {
      onMembers && onMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.error('members', err)));
  }

  unwatch() { this.unsubs.forEach(u => u()); this.unsubs = []; }

  // Drop and re-open the connection (used when the app comes back from the background).
  async refresh() {
    await this.fs.disableNetwork(this.db);
    await this.fs.enableNetwork(this.db);
  }

  commit(code, ops) {
    const { writeBatch, increment, deleteField } = this.fs;
    const b = writeBatch(this.db);
    const ids = [];
    ops.forEach(op => {
      const r = this.ref(code, op.col, op.id);
      ids.push(r.id);
      if (op.del) return b.delete(r);
      const data = { ...(op.data || {}) };
      Object.entries(op.inc || {}).forEach(([k, n]) => { data[k] = increment(n); });
      Object.keys(data).forEach(k => { if (data[k] === undefined) data[k] = deleteField(); });
      b.set(r, data, { merge: true });
    });
    // Don't await: offline, this only resolves once the phone is back online.
    // The change shows up on screen immediately either way.
    b.commit().catch(e => {
      console.error('Write failed', e);
      window.dispatchEvent(new CustomEvent('store-error', { detail: e }));
    });
    return ids;
  }

  async pruneActivity(code, before) {
    const { getDocs, query, collection, where, limit, writeBatch } = this.fs;
    const snap = await getDocs(query(collection(this.db, 'lists', code, 'activity'),
      where('at', '<', before), limit(400)));
    if (snap.empty) return 0;
    const b = writeBatch(this.db);
    snap.docs.forEach(d => b.delete(d.ref));
    b.commit().catch(e => console.error(e));
    return snap.size;
  }
}

/* ------------------------------------------------------------------ */
/* Local (demo mode)                                                   */
/* ------------------------------------------------------------------ */

class LocalStore {
  constructor() {
    this.mode = 'local';
    this.key = 'sm2_demo_db';
    this.watcher = null;
    window.addEventListener('storage', e => { if (e.key === this.key) this.emit(); });
  }

  async ready() {
    // Per-tab id so two tabs act like two different phones.
    let uid = sessionStorage.getItem('sm2_demo_uid');
    if (!uid) { uid = 'demo_' + autoId(); sessionStorage.setItem('sm2_demo_uid', uid); }
    this.uid = uid;
    return { uid };
  }

  load() { try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch (e) { return {}; } }
  save(db) { localStorage.setItem(this.key, JSON.stringify(db)); this.emit(); }
  list(db, code) {
    db[code] = db[code] || { meta: null, items: {}, activity: {}, members: {} };
    return db[code];
  }

  async getList(code) { return this.load()[code]?.meta || null; }

  async createList(name, memberName) {
    const code = makeCode();
    const db = this.load();
    const l = this.list(db, code);
    l.meta = { name, createdAt: Date.now(), createdBy: this.uid };
    l.members[this.uid] = { name: memberName, joinedAt: Date.now() };
    this.save(db);
    return code;
  }

  async join(code, memberName) {
    const db = this.load();
    this.list(db, code).members[this.uid] = { name: memberName, joinedAt: Date.now() };
    this.save(db);
  }

  async leave(code) {
    const db = this.load();
    if (db[code]) { delete db[code].members[this.uid]; this.save(db); }
  }

  watch(code, handlers) { this.watcher = { code, ...handlers }; this.emit(); }
  unwatch() { this.watcher = null; }

  emit() {
    const w = this.watcher;
    if (!w) return;
    const l = this.load()[w.code];
    if (!l) return;
    const rows = obj => Object.entries(obj).map(([id, v]) => ({ id, ...v }));
    setTimeout(() => {
      w.onItems(rows(l.items));
      w.onActivity(rows(l.activity).sort((a, b) => b.at - a.at).slice(0, 300));
      w.onMembers && w.onMembers(rows(l.members));
      w.onMeta && w.onMeta(l.meta || {});
      w.onStatus && w.onStatus({ fromCache: false, pending: false });
    }, 0);
  }

  commit(code, ops) {
    const db = this.load();
    const l = this.list(db, code);
    const ids = [];
    ops.forEach(op => {
      if (op.col === 'list') {
        ids.push(code);
        l.meta = { ...(l.meta || {}), ...(op.data || {}) };
        return;
      }
      const id = op.id || autoId();
      ids.push(id);
      const bucket = l[op.col];
      if (op.del) { delete bucket[id]; return; }
      const cur = { ...(bucket[id] || {}) };
      Object.entries(op.data || {}).forEach(([k, v]) => { if (v === undefined) delete cur[k]; else cur[k] = v; });
      Object.entries(op.inc || {}).forEach(([k, n]) => { cur[k] = (cur[k] || 0) + n; });
      bucket[id] = cur;
    });
    this.save(db);
    return ids;
  }

  async pruneActivity(code, before) {
    const db = this.load();
    const l = db[code];
    if (!l) return 0;
    let n = 0;
    Object.entries(l.activity).forEach(([id, a]) => { if (a.at < before) { delete l.activity[id]; n++; } });
    this.save(db);
    return n;
  }
}

/* ------------------------------------------------------------------ */

const store = firebaseConfig ? new FirebaseStore() : new LocalStore();
window.store = store;
window.storeUtils = { makeCode, normalizeCode };
window.dispatchEvent(new Event('store-loaded'));
