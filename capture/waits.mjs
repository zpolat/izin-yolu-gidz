/* Bekleme süreleri — borderalarm.com'dan kazıma (topluluk bildirimli).
 * Her kapı için iki yön: 'in' = Türkiye yönü (gidiş), 'out' = dönüş.
 * Sayfa başlığındaki "Waiting time: X" ayıklanır, Blob'a waits.json yazılır.
 * Kaynak uygulamada açıkça belirtilir + linklenir. */

import { put } from '@vercel/blob';

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

const GATES = [
  { id: 'horgos',   in: 'roszke-horgos',             out: 'horgos-roszke' },
  { id: 'kelebija', in: 'tompa-kelebija',            out: 'kelebija-tompa' },
  { id: 'batrovci', in: 'bajakovo-batrovci',         out: 'batrovci-bajakovo' },
  { id: 'gradina',  in: 'dragina-kalotina',          out: 'kalotina-dragina' },
  { id: 'kapikule', in: 'kapitan-andreewo-kapikule', out: 'kapikule-kapitan-andreewo' },
];

async function waitOf(slug) {
  try {
    const r = await fetch(`https://borderalarm.com/bottlenecks/${slug}/`, { headers: { 'user-agent': UA } });
    if (!r.ok) return null;
    const html = await r.text();
    const m = html.match(/Waiting time:\s*([^"<\n]+)/i);
    return m ? m[1].trim() : null;
  } catch { return null; }
}

const out = { updated: Math.floor(Date.now() / 1000), source: 'borderalarm.com', gates: {} };
for (const g of GATES) {
  const [i, o] = await Promise.all([waitOf(g.in), waitOf(g.out)]);
  if (i || o) out.gates[g.id] = { in: i, out: o, url: `https://borderalarm.com/bottlenecks/${g.in}/` };
}

await put('history/waits.json', JSON.stringify(out), {
  access: 'public', token: TOKEN, contentType: 'application/json',
  addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60,
});
console.log('waits:', JSON.stringify(out.gates));
