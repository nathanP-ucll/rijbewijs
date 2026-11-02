'use strict';
// Genereert alle schema's in site/img/schemas/*.svg en data/schemas-index.json
const fs = require('fs');
const path = require('path');
const lib = require('./lib');
for (const m of ['situaties', 'lichten', 'bevoegd', 'plaats', 'verkeer', 'illustraties', 'dashboard']) {
  const p = path.join(__dirname, m + '.js');
  if (fs.existsSync(p)) require(p);
}
const idx = lib.REGISTRY.slice().sort((a, b) => a.naam.localeCompare(b.naam));
fs.writeFileSync(path.join(lib.ROOT, 'data', 'schemas-index.json'), JSON.stringify(idx, null, 1) + '\n');
console.log(idx.length + ' schema\'s geschreven');
