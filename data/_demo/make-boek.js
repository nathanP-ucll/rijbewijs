// Genereert data/_demo/boek/*.json: korte voorbeeldpagina's (alle bloktypes) om de engine te testen.
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'boek'); fs.mkdirSync(dir, { recursive: true });
const kader = (soort, titel, tekst) => ({ type: 'kader', soort, titel, tekst });
const pg = (id, titel, intro, blokken, theorieblokken) => ({ id, titel, intro, blokken, theorieblokken });
const h1 = {
  hoofdstuk: 1, titel: 'Verkeersborden', les: 1,
  intro: { tekst: 'Borden vertellen je wat je moet doen. Hier leer je de zes soorten kennen.', doelen: ['Je kent de zes soorten borden.', 'Je ziet het verschil tussen gevaar, voorrang en verbod.'] },
  paragrafen: [
    { nr: '1.1', titel: 'Soorten borden', paginas: [
      pg('h1-1-1', 'De zes soorten borden', 'Elk soort bord heeft een eigen vorm en kleur.', [
        { type: 'punten', items: ['Gevaarsborden waarschuwen je.', 'Voorrangsborden regelen wie eerst rijdt.', 'Verbodsborden verbieden iets.'] },
        { type: 'kaarten', items: [{ afb: 'A1a', naam: 'Gevaarlijke bocht naar links', uitleg: 'Rij trager en blijf rechts.' }, { afb: 'B1', naam: 'Voorrang verlenen', uitleg: 'Laat het kruisend verkeer eerst door.', letop: 'Je hebt hier geen voorrang.' }, { afb: 'C1', naam: 'Verboden richting', uitleg: 'Je mag hier niet in rijden.' }] },
        kader('regel', 'Vorm en kleur', 'Elke soort bord heeft een vaste vorm en kleur.')], ['borden-indeling']),
      pg('h1-1-2', 'Twee voorrangsborden', 'Deze twee borden lijken op elkaar.', [
        { type: 'punten', items: ['Beide borden gaan over voorrang.', 'Het ene vraagt een stop, het andere niet.'] },
        { type: 'vergelijk', titel: 'Voorrang verlenen of stoppen', links: { afb: 'B1', tekst: 'Laat voorrang, stop enkel als het nodig is.' }, rechts: { afb: 'B5', tekst: 'Stop altijd volledig en laat voorrang.' }, verschil: 'Bij het tweede bord moet je altijd stoppen.' },
        kader('letop', 'Stoppen', 'Een stopbord betekent echt volledig stilstaan.')], ['borden-gevaar-weg']),
      pg('h1-1-3', 'Schema en tabel', 'Een schema en een tabel op één pagina.', [
        { type: 'schema', afb: 'demo-kruispunt', bijschrift: 'Drie voertuigen bij een kruispunt.', punten: ['Kijk eerst naar rechts.', 'Voertuigen van rechts hebben voorrang.'] },
        { type: 'tabel', kolommen: ['Soort', 'Kleur'], rijen: [['Gevaar', 'Rode rand'], ['Gebod', 'Blauw']] },
        { type: 'voorbeeld', tekst: 'Je nadert een kruispunt zonder borden: dan geldt voorrang van rechts.' }], []),
    ] },
    { nr: '1.2', titel: 'Snelheden', paginas: [
      pg('h1-2-1', 'Snelheid in Vlaanderen', 'Zonder bord geldt een standaardsnelheid.', [
        { type: 'punten', items: ['In de bebouwde kom is het 50 km/u.', 'Buiten de bebouwde kom is het 70 km/u.', 'Op een autosnelweg is het 120 km/u.'] },
        { type: 'kader', soort: 'gewest', titel: 'Buiten de bebouwde kom', tekst: 'De gewesten verschillen buiten de bebouwde kom.', gewest: { vlaanderen: 'Meestal 70 km/u.', wallonie: 'Meestal 90 km/u.', brussel: 'Meestal 70 km/u.' } },
        { type: 'voorbeeld', tekst: 'Een bord met een cijfer en een rode rand geeft de maximumsnelheid.' }], ['snelheden-overzicht-gewest']),
    ] },
  ],
  samenvatting: ['Er zijn zes soorten borden.', 'Voorrangsborden regelen wie eerst rijdt.', 'Zonder bord geldt een standaardsnelheid.'],
};
const mk = (hn, les, titel, nr, bl) => ({ hoofdstuk: hn, titel, les, intro: { tekst: 'Een korte inleiding.', doelen: ['Je kent de basis.'] },
  paragrafen: [{ nr: hn + '.1', titel, paginas: bl.map((b, i) => pg('h' + hn + '-1-' + (i + 1), b[0], 'Kort en duidelijk.', [{ type: 'punten', items: ['Eerste punt.', 'Tweede punt.'] }, kader('regel', 'Regel', 'Dit is de belangrijkste regel van de pagina.'), { type: 'voorbeeld', tekst: 'Een kort voorbeeld uit het verkeer.' }], b[1])) }],
  samenvatting: ['Dit onthoud je van dit hoofdstuk.'] });
const files = {
  h1, h3: mk(3, 2, 'Voorrang en kruispunten', '3', [['Rangorde', ['voorrang-rangorde']], ['Verkeerslichten', ['lichten-driekleurig']]]),
  h7: mk(7, 3, 'Plaats op de weg', '7', [['Rechts rijden', ['plaats-rechts-rijden']], ['Autosnelweg', ['snelweg-autosnelweg-autoweg']]]),
  h9: mk(9, 4, 'Gedrag en alcohol', '9', [['Alcohol', ['gedrag-alcohol-grenzen']], ['Rijbewijs', ['rijbewijs-traject']], ['Ongeval', ['ongeval-stappenplan']], ['Banden', ['techniek-banden']]]),
};
for (const [n, d] of Object.entries(files)) fs.writeFileSync(path.join(dir, n + '.json'), JSON.stringify(d, null, 1));
