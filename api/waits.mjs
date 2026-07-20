/* /api/waits — borderalarm bekleme sürelerini SUNUCUDA canlı çeker (CORS derdi yok)
 * ve ~2 dk CDN önbelleğiyle döndürür → hem taze hem borderalarm'a nazik. */

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

export default async function handler(req, res) {
  const out = { updated: Math.floor(Date.now() / 1000), source: 'borderalarm.com', gates: {} };
  await Promise.all(GATES.map(async (g) => {
    const [i, o] = await Promise.all([waitOf(g.in), waitOf(g.out)]);
    if (i || o) out.gates[g.id] = { in: i, out: o, url: `https://borderalarm.com/bottlenecks/${g.in}/` };
  }));
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
  res.status(200).send(JSON.stringify(out));
}
