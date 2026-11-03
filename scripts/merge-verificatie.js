// Voegt alle data/verificatie/*.json (per-oefening-resultaten) samen tot data/verificatie.json.
// Volgorde = prioriteit: latere bestanden overschrijven eerdere (nieuwste controle wint).
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'data', 'verificatie');
const volgorde = (f) => {
  if (/^les\d-[abc]\.json$/.test(f)) return 1;
  if (/^herverificatie/.test(f)) return 2;
  if (/^nieuw-les1/.test(f)) return 3;
  if (/^derde/.test(f)) return 4;
  if (/^hoofdstuk3/.test(f)) return 5;
  if (/^vierde|^laatste/.test(f)) return 6;
  return 9;
};
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && !/^boek/.test(f)).sort((a, b) => volgorde(a) - volgorde(b) || a.localeCompare(b));
const out = {};
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  for (const [id, v] of Object.entries(d)) {
    if (id.startsWith('_') || !v || !v.status) continue;
    out[id] = Object.assign({}, v, { bestand: f });
  }
}
fs.writeFileSync(path.join(__dirname, '..', 'data', 'verificatie.json'), JSON.stringify(out, null, 1));
const c = {};
Object.values(out).forEach((v) => (c[v.status] = (c[v.status] || 0) + 1));
console.log(Object.keys(out).length + ' oefeningen', c, '(' + files.length + ' bestanden)');
