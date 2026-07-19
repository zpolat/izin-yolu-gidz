/* İzin Yolu Gidz — saatlik ekran görüntüsü yakalama.
 * GitHub Actions'ta saatlik çalışır: her kapıdan 1 kare alır (foto: wsrv,
 * video: ffmpeg), Vercel Blob'a yükler, index.json'u günceller, eskiyi siler. */

import { put, del } from '@vercel/blob';
import { spawn } from 'node:child_process';

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const BASE = 'https://kaimajvv9hct8hsj.public.blob.vercel-storage.com';
const KEEP_DAYS = 14;

// Kapı başına 1 kamera — Türkiye'ye doğru olan kuyruk yönü.
const GATES = [
  { id: 'horgos',   type: 'hls', src: ['https://kamere.amss.org.rs/horgos1/horgos1.m3u8', 'https://kamere.mup.gov.rs:4443/Horgos/horgos1.m3u8'] },
  { id: 'kelebija', type: 'hls', src: ['https://kamere.mup.gov.rs:4443/Kelebija/kelebija1.m3u8'] },
  { id: 'batrovci', type: 'hls', src: ['https://kamere.amss.org.rs/batrovci1/batrovci1.m3u8', 'https://kamere.mup.gov.rs:4443/Batrovci/batrovci1.m3u8'] },
  { id: 'ilok',     type: 'img', src: ['www.hak.hr/info/kamere/417.jpg'] },
  { id: 'gradina',  type: 'hls', src: ['https://kamere.amss.org.rs/gradina2/gradina2.m3u8', 'https://kamere.mup.gov.rs:4443/Gradina/gradina2.m3u8'] },
  { id: 'kapikule', type: 'img', src: ['trakya.iscoz.com/kapikule/yolcugiris.jpg'] },
];

function grabImg(src) {
  // Cache-buster (%3F_%3D=ts) op de bron zodat wsrv én de origin een VERS beeld
  // geven — anders levert wsrv elk uur dezelfde gecachete foto.
  const url = `https://wsrv.nl/?url=${src}%3F_%3D${Date.now()}&w=640&output=jpg`;
  return fetch(url).then(async (r) => {
    if (!r.ok) throw new Error('img ' + r.status);
    return Buffer.from(await r.arrayBuffer());
  });
}

function grabHls(url) {
  return new Promise((resolve, reject) => {
    const args = ['-y', '-loglevel', 'error', '-i', url, '-frames:v', '1', '-vf', 'scale=640:-1', '-q:v', '5', '-f', 'image2', 'pipe:1'];
    const p = spawn(FFMPEG, args, { timeout: 30000 });
    const out = []; const err = [];
    p.stdout.on('data', (d) => out.push(d));
    p.stderr.on('data', (d) => err.push(d));
    p.on('error', reject);
    p.on('close', (code) => {
      const buf = Buffer.concat(out);
      if (code === 0 && buf.length > 1000) resolve(buf);
      else reject(new Error('ffmpeg ' + code + ' ' + Buffer.concat(err).toString().slice(0, 120)));
    });
  });
}

async function grab(gate) {
  let lastErr;
  for (const s of gate.src) {
    try { return gate.type === 'img' ? await grabImg(s) : await grabHls(s); }
    catch (e) { lastErr = e; }
  }
  throw lastErr;
}

async function loadIndex() {
  try {
    const r = await fetch(`${BASE}/history/index.json?t=${Date.now()}`);
    if (r.ok) return await r.json();
  } catch { /* eerste run: nog geen index */ }
  return { updated: 0, gates: {} };
}

const pad = (n) => String(n).padStart(2, '0');
const now = new Date();
const key = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}-${pad(now.getUTCHours())}`;
const nowSec = Math.floor(Date.now() / 1000);

const index = await loadIndex();
if (!index.gates) index.gates = {};

for (const gate of GATES) {
  try {
    const buf = await grab(gate);
    const blob = await put(`history/${gate.id}/${key}.jpg`, buf, {
      access: 'public', token: TOKEN, contentType: 'image/jpeg',
      addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 31536000,
    });
    if (!index.gates[gate.id]) index.gates[gate.id] = [];
    // zelfde uur = overschrijven (voorkomt dubbele entries bij herstart)
    index.gates[gate.id] = index.gates[gate.id].filter((e) => e.url !== blob.url);
    index.gates[gate.id].push({ ts: nowSec, url: blob.url });
    console.log(`OK   ${gate.id} ${key} (${buf.length}b)`);
  } catch (e) {
    console.log(`FAIL ${gate.id}: ${e.message}`);
  }
}

// Ouder dan KEEP_DAYS opruimen (entry + blob).
const cutoff = nowSec - KEEP_DAYS * 86400;
for (const id of Object.keys(index.gates)) {
  const keep = []; const drop = [];
  for (const e of index.gates[id]) (e.ts >= cutoff ? keep : drop).push(e);
  index.gates[id] = keep;
  for (const e of drop) { try { await del(e.url, { token: TOKEN }); } catch { /* ignore */ } }
}

index.updated = nowSec;
await put('history/index.json', JSON.stringify(index), {
  access: 'public', token: TOKEN, contentType: 'application/json',
  addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60,
});
console.log('index güncellendi:', Object.fromEntries(Object.entries(index.gates).map(([k, v]) => [k, v.length])));
