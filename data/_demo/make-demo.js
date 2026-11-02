// Genereert data/_demo/oefeningen.json (voorbeeldoefeningen, minstens 1 per type) voor `node scripts/build.js --demo`.
const E = [];
const base = (id, les, ond, blok, type, extra) => E.push(Object.assign({
  id, les, onderwerp: ond, theorieblok: blok, type,
  uitleg: 'Demo-uitleg: hier staat waarom dit antwoord juist is, in één tot drie zinnen.',
  bronnen: [], moeilijkheid: 1 + (E.length % 3), gewicht: 'gewoon', examen: true,
}, extra));
const GB = 'borden-gevaar-weg', SN = 'snelheden-overzicht-gewest', VR = 'voorrang-rangorde', LI = 'lichten-driekleurig', PL = 'plaats-rechts-rijden',
  SW = 'snelweg-autosnelweg-autoweg', AL = 'gedrag-alcohol-grenzen', RB = 'rijbewijs-traject', OV = 'ongeval-stappenplan', TE = 'techniek-banden';
base('DEMO-01', 1, 'T01', GB, 'meerkeuze', { vraag: 'Wat betekent dit bord?', afbeelding: 'A1a', opties: ['Gevaarlijke bocht naar links', 'Gevaarlijke bocht naar rechts', 'Slecht wegdek'], correct: [0], meerdere: false });
base('DEMO-02', 1, 'T02', VR, 'bord', { vraag: 'Wat betekent dit bord? (typ het antwoord)', afbeelding: 'B1', modus: 'naam', antwoorden: ['voorrang verlenen', 'geef voorrang'] });
base('DEMO-03', 1, 'T03', GB, 'bord', { vraag: 'Wat betekent dit bord?', afbeelding: 'C3', modus: 'naam', opties: ['Verboden toegang in beide richtingen', 'Parkeerverbod', 'Voorrangsweg'], antwoorden: ['Verboden toegang in beide richtingen'] });
base('DEMO-04', 1, 'T01', GB, 'bord', { vraag: 'Tot welke categorie hoort dit bord?', afbeelding: 'A1a', modus: 'categorie', categorie: 'A' });
base('DEMO-05', 1, 'T01', GB, 'hotspot', { vraag: 'Klik op het gebouw.', afbeelding: 'demo-hotspot', zones: [{ id: 'huis', x: 10, y: 25, w: 25, h: 30, correct: true, label: 'Gebouw' }, { id: 'boom', x: 68, y: 25, w: 15, h: 50, correct: false, label: 'Boom' }] });
base('DEMO-06', 1, 'T08', SN, 'invul', { vraag: 'Hoeveel km/u mag je in Vlaanderen buiten de bebouwde kom zonder bord?', antwoorden: ['70'], eenheid: 'km/u' });
base('DEMO-07', 1, 'T08', SN, 'reken', { vraag: 'Je rijdt 90 km/u. Hoeveel meter leg je af in 2 seconden?', gegeven: '1 km/u = 0,2778 m/s', antwoord: 50, tolerantie: 1, eenheid: 'm' });
base('DEMO-08', 1, 'T08', SN, 'tabel', { vraag: 'Vul de snelheden in.', gewicht: 'zwaar', kolommen: ['Wegtype', 'Vlaanderen'], rijen: [{ label: 'Bebouwde kom', cellen: [{ correct: '50' }] }, { label: 'Buiten bebouwde kom', cellen: [{ correct: '70', opties: ['50', '70', '90', '120'] }] }] });
base('DEMO-09', 2, 'T11', VR, 'volgorde', { vraag: 'Zet de rangorde van boven (belangrijkst) naar onder.', items: ['Bevoegde persoon', 'Verkeerslichten', 'Verkeersborden', 'Algemene regels'] });
base('DEMO-10', 2, 'T11', VR, 'situatie', { vraag: 'Welk voertuig mag eerst rijden?', afbeelding: 'demo-kruispunt', modus: 'klik', voertuigen: [{ nr: 1, label: 'Rode auto (zuid)', x: 50, y: 78 }, { nr: 2, label: 'Blauwe auto (west)', x: 19, y: 47 }, { nr: 3, label: 'Gele auto (oost)', x: 83, y: 57 }], correct: 1 });
base('DEMO-11', 2, 'T11', VR, 'situatie', { vraag: 'Zet de voertuigen in volgorde van doorrijden.', afbeelding: 'demo-kruispunt', modus: 'volgorde', voertuigen: [{ nr: 1, label: 'Rode auto' }, { nr: 2, label: 'Blauwe auto' }, { nr: 3, label: 'Gele auto' }], correct: [1, 3, 2] });
base('DEMO-12', 2, 'T15', LI, 'waaronwaar', { stelling: 'Bij oranje licht mag je altijd doorrijden.', juist: false, motivatie: 'Je mag enkel doorrijden als je niet veilig meer kunt stoppen.', foutemotivaties: ['Oranje betekent altijd voorrang.', 'Oranje geldt enkel voor voetgangers.'] });
base('DEMO-13', 2, 'T15', LI, 'koppel', { vraag: 'Koppel het licht aan de betekenis.', paren: [{ links: 'Rood', rechts: 'Stoppen' }, { links: 'Oranje', rechts: 'Stoppen, tenzij onveilig' }, { links: 'Groen', rechts: 'Doorrijden' }] });
base('DEMO-14', 2, 'T15', LI, 'cloze', { tekst: 'Bij {{1}} licht moet je stoppen en bij {{2}} licht mag je rijden.', gaten: [{ opties: ['rood', 'groen'], correct: 0 }, { opties: ['rood', 'groen'], correct: 1 }] });
base('DEMO-15', 2, 'T11', VR, 'meerkeuze', { vraag: 'Welke zaken gaan boven de algemene regels? (meerdere juist)', opties: ['Verkeersborden', 'Verkeerslichten', 'Het weer'], correct: [0, 1], meerdere: true });
base('DEMO-16', 3, 'T23', PL, 'meerkeuze', { vraag: 'Waar rijd je normaal op de rijbaan?', opties: ['Zo rechts mogelijk', 'In het midden', 'Links'], correct: [0] });
base('DEMO-17', 3, 'T23', PL, 'cloze', { tekst: 'Je rijdt op de rijbaan zo {{1}} als mogelijk, behalve bij {{2}}.', gaten: [{ antwoorden: ['rechts'] }, { antwoorden: ['inhalen', 'links afslaan'] }] });
base('DEMO-18', 3, 'T26', SW, 'invul', { vraag: 'Wat is de maximumsnelheid op een autosnelweg in België (zonder bord)?', antwoorden: ['120', '120 km/u'], eenheid: 'km/u' });
base('DEMO-19', 3, 'T26', SW, 'volgorde', { vraag: 'Zet de stappen bij pech op de snelweg in orde.', items: ['Zet de alarmlichten aan', 'Trek je hesje aan', 'Stap uit aan de kant van de berm', 'Bel de hulpdiensten'] });
base('DEMO-20', 3, 'T26', SW, 'reken', { vraag: 'Hoeveel km leg je af in 30 minuten aan 100 km/u?', antwoord: 50, tolerantie: 0, eenheid: 'km' });
base('DEMO-21', 4, 'T29', AL, 'meerkeuze', { vraag: 'Vanaf hoeveel promille ben je strafbaar als gewone bestuurder?', gewicht: 'zwaar', opties: ['0,2', '0,5', '0,8'], correct: [1] });
base('DEMO-22', 4, 'T29', AL, 'invul', { vraag: 'Hoeveel g/l bloed is de grens voor gewone bestuurders?', antwoorden: ['0,5', '0.5'], eenheid: 'g/l' });
base('DEMO-23', 4, 'T36', RB, 'waaronwaar', { stelling: 'Je mag het theorie-examen afleggen vanaf 17 jaar.', juist: true, motivatie: 'Vanaf 17 jaar kan je het theorie-examen afleggen.', foutemotivaties: ['Pas vanaf 21 jaar.', 'Dat kan op elke leeftijd.'] });
base('DEMO-24', 4, 'T34', OV, 'volgorde', { vraag: 'Zet in volgorde bij een ongeval.', items: ['Beveilig de plaats', 'Verwittig de hulpdiensten', 'Verleen eerste hulp'] });
base('DEMO-25', 4, 'T38', TE, 'tabel', { vraag: 'Vul in.', kolommen: ['Onderdeel', 'Juist?'], rijen: [{ label: 'Bandenspanning controleren', cellen: [{ correct: true }] }, { label: 'Rijden met kale banden', cellen: [{ correct: false }] }] });
base('DEMO-26', 4, 'T38', TE, 'koppel', { vraag: 'Koppel het bord aan de categorie.', paren: [{ links: 'Gevaarlijke bocht naar links', rechts: 'Gevaar', linksAfb: 'A1a' }, { links: 'Voorrang verlenen', rechts: 'Voorrang', linksAfb: 'B1' }] });
base('DEMO-M1', 1, 'T01', 'borden-indeling', 'koppel', { mini: true, examen: false, vraag: 'Koppel elk bord aan zijn soort.', paren: [{ links: 'Gevaarlijke bocht naar links', rechts: 'Gevaar', linksAfb: 'A1a' }, { links: 'Voorrang verlenen', rechts: 'Voorrang', linksAfb: 'B1' }, { links: 'Parkeerverbod', rechts: 'Parkeren', linksAfb: 'E1' }] });
base('DEMO-M2', 1, 'T01', 'borden-indeling', 'volgorde', { mini: true, examen: false, vraag: 'Zet de borden van zwaar naar licht: verbod, gevaar, parkeren.', items: ['Verbod', 'Gevaar', 'Parkeren'] });
base('DEMO-M3', 1, 'T01', 'borden-indeling', 'koppel', { mini: true, examen: false, vraag: 'Koppel de borden aan wat ze doen.', paren: [{ links: 'Voorrang verlenen', rechts: 'Eerst laten voorgaan' }, { links: 'Verboden richting', rechts: 'Niet inrijden' }] });
require('fs').writeFileSync(__dirname + '/oefeningen.json', JSON.stringify(E, null, 1));
