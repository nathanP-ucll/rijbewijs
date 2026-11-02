// Bouwt data/borden-index.json uit site/img/borden/*.svg + naamtabel (officiele benaming, KB 1 dec 1975;
// bron: Wikipedia NL 'Verkeersborden in België - Serie A-F' + visuele controle).
// [naam, zeker]: zeker=1 -> benaming bevestigd door bron + visuele controle; 0 -> gecontroleerd:false.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'site', 'img', 'borden');

const N = {
  A1a: ['Gevaarlijke bocht naar links', 1], A1b: ['Gevaarlijke bocht naar rechts', 1],
  A1c: ['Dubbele bocht of meer dan twee bochten, de eerste naar links', 1], A1d: ['Dubbele bocht of meer dan twee bochten, de eerste naar rechts', 1],
  A3: ['Gevaarlijke daling', 1], A5: ['Gevaarlijke stijging', 1],
  A7a: ['Rijbaanversmalling (aan beide zijden)', 1], A7b: ['Rijbaanversmalling langs links', 1], A7c: ['Rijbaanversmalling langs rechts', 1],
  A9: ['Beweegbare brug', 1], A11: ['Uitweg op een kaai of oever', 1], A13: ['Overdwarse uitholling of ezelsrug', 1], A14: ['Verhoogde inrichting (verkeersdrempel)', 1],
  A15: ['Glibberige rijbaan (slipgevaar)', 1], A17: ['Kiezelprojectie (losse steenslag)', 1], A19: ['Vallende stenen', 1],
  A21: ['Oversteekplaats voor voetgangers', 1], A23: ['Plaats waar speciaal veel kinderen komen', 1],
  A25: ['Oversteekplaats voor fietsers en tweewielige bromfietsen', 1], A27: ['Doortocht van groot wild', 1], A29: ['Doortocht van vee', 1],
  A31: ['Werken', 1], A33: ['Verkeerslichten', 1], A35: ['Overtocht van vliegtuigen op geringe hoogte', 1], A37: ['Zijwind', 1],
  A39: ['Verkeer in twee richtingen na een deel met eenrichtingsverkeer', 1], A41: ['Overweg met slagbomen', 1], A43: ['Overweg zonder slagbomen', 1],
  A45: ['Overweg voor enkel spoor (Andreaskruis)', 1], A47: ['Overweg voor twee of meer sporen (Andreaskruis)', 1],
  A49: ['Kruising met tramsporen in de rijbaan', 1], A51: ['Ander gevaar (onderbord duidt de aard aan)', 1],
  B1: ['Voorrang verlenen', 1], B3: ['Aankondiging van B1: voorrang verlenen op aangeduide afstand', 1], B5: ['Stoppen en voorrang verlenen (STOP)', 1],
  B7: ['Aankondiging van B5: stop op aangeduide afstand', 1], B9: ['Voorrangsweg', 1], B11: ['Einde van voorrangsweg', 1],
  B13: ['Aankondiging van B11: einde voorrangsweg op aangeduide afstand', 1],
  B15: ['Voorrangsbord bij kruispunt (symbool toont voorrangsweg)', 0], B15a: ['Voorrangsbord bij kruispunt, variant a', 0], B15b: ['Voorrangsbord bij kruispunt, variant b', 0],
  B15c: ['Voorrangsbord bij kruispunt, variant c', 0], B15d: ['Voorrangsbord bij kruispunt, variant d', 0], B15e: ['Voorrangsbord bij kruispunt, variant e', 0],
  B15f: ['Voorrangsbord bij kruispunt, variant f', 0], B15g: ['Voorrangsbord bij kruispunt, variant g', 0],
  B17: ['Kruispunt waar de voorrang van rechts geldt', 1], B19: ['Smalle doorgang: voorrang verlenen aan tegenliggers', 1], B21: ['Smalle doorgang: voorrang op tegenliggers', 1],
  B22: ['Fietsers mogen rood licht voorbijrijden om rechts af te slaan', 1], B23: ['Fietsers mogen rood licht voorbijrijden om rechtdoor te rijden', 1],
  C1: ['Verboden richting voor iedere bestuurder', 1], C3: ['Verboden toegang in beide richtingen voor ieder bestuurder', 1],
  C5: ['Verboden toegang voor motorvoertuigen met meer dan twee wielen', 1], C6: ['Verboden toegang voor vierwielige terreinvoertuigen (quads)', 1],
  C7: ['Verboden toegang voor motorfietsen', 1], C9: ['Verboden toegang voor bromfietsen', 1], C11: ['Verboden toegang voor fietsers', 1],
  C13: ['Verboden toegang voor bestuurders van gespannen', 1], C15: ['Verboden toegang voor ruiters', 1], C17: ['Verboden toegang voor handkarren', 1],
  C19: ['Verboden toegang voor voetgangers', 1], C21_3: ['Verboden toegang voor voertuigen met massa boven 3 ton', 1],
  C21_5: ['Verboden toegang voor voertuigen met massa boven 5 ton', 1], C21_7: ['Verboden toegang voor voertuigen met massa boven 7 ton', 1],
  C22: ['Verboden toegang voor autocars', 1], C23: ['Verboden toegang voor voertuigen voor het vervoer van zaken (vrachtwagens)', 1],
  C24a: ['Verboden toegang voor voertuigen met gevaarlijke goederen', 1], C24b: ['Verboden toegang voor voertuigen met ontvlambare of ontplofbare stoffen', 1],
  C24c: ['Verboden toegang voor voertuigen met verontreinigende stoffen', 1], C25: ['Verboden toegang voor voertuigen langer dan aangeduid', 1],
  C27: ['Verboden toegang voor voertuigen breder dan aangeduid', 1], C29: ['Verboden toegang voor voertuigen hoger dan aangeduid', 1],
  C31a: ['Verbod links af te slaan aan het volgende kruispunt', 1], C31b: ['Verbod rechts af te slaan aan het volgende kruispunt', 1],
  C33: ['Verbod te keren tot het volgende kruispunt', 1], C35: ['Verbod links in te halen met voertuig met meer dan twee wielen', 1],
  C37: ['Einde van het inhaalverbod (C35)', 1], C39: ['Inhaalverbod voor vrachtwagens (meer dan 3500 kg)', 1], C41: ['Einde van het inhaalverbod voor vrachtwagens (C39)', 1],
  C45_50: ['Einde van de snelheidsbeperking (C43)', 1], C46: ['Einde van alle plaatselijke verbodsbepalingen', 1],
  C47: ['Tolpost: verbod voorbij te rijden zonder te stoppen', 1], C48: ['Verbod de cruise control te gebruiken', 1], C49: ['Einde van het verbod op cruise control (C48)', 1],
  D1a: ['Verplichte rijrichting: rechtdoor', 1], D1b_links: ['Verplichte rijrichting: links', 0], D1b_rechts: ['Verplichte rijrichting: rechts', 0],
  D1c: ['Hindernis links voorbijrijden', 1], D1d: ['Hindernis rechts voorbijrijden', 1], D1e: ['Verplichte rijrichting: links afslaan', 1], D1f: ['Verplichte rijrichting: rechts afslaan', 1],
  D3a: ['Verplicht rechtdoor of links', 1], D3b: ['Verplicht rechtdoor of rechts', 1],
  D4_links: ['Gevaarlijke goederen: verplicht links', 1], D4_rechtdoor: ['Gevaarlijke goederen: verplicht rechtdoor', 1], D4_rechts: ['Gevaarlijke goederen: verplicht rechts', 1],
  D5: ['Verplicht rondgaand verkeer (rotonde)', 1], D6: ['Einde van verplicht rondgaand verkeer', 0], D7: ['Verplicht fietspad', 1],
  D9: ['Gemeenschappelijk pad voor fietsers en voetgangers (verplicht)', 0], D9a: ['Pad voor voetgangers en fietsers, fietsers links (verplicht)', 0],
  D9b: ['Pad voor voetgangers en fietsers, fietsers rechts (verplicht)', 0], D10: ['Voetgangers en fietsers (verplicht gedeeld pad)', 0],
  D11: ['Verplichte weg voor voetgangers', 1], D13: ['Verplichte weg voor ruiters', 1],
  E1: ['Parkeerverbod', 1], E3: ['Stilstaan en parkeren verboden', 1], E5: ['Parkeerverbod van de 1e tot de 15e van de maand', 1],
  E7: ['Parkeerverbod van de 16e tot het einde van de maand', 1], E9: ['Parkeren toegelaten', 1], E9a: ['Voorbehouden parkeerplaats (onderbord duidt voor wie)', 0],
  E9a_Handicap: ['Parkeerplaats voorbehouden voor personen met een handicap', 1], E9a_Parkeerschijf: ['Parkeerplaats met parkeerschijf', 1],
  E9b: ["Parkeren uitsluitend voor personenauto's en motorfietsen", 1], E9c: ['Parkeren uitsluitend voor vrachtwagens', 1], E9d: ['Parkeren uitsluitend voor autocars', 1],
  E9e: ['Verplicht parkeren op de berm of het trottoir', 1], E9f: ['Verplicht parkeren deels op de berm of het trottoir', 1], E9g: ['Verplicht parkeren op de rijbaan', 1],
  E9h: ["Parkeren uitsluitend voor kampeerauto's", 1], E9i: ['Parkeren uitsluitend voor motorfietsen', 1], E9j: ['Parkeren in bepaalde tijdsperioden voorbehouden voor specifieke voertuigen', 1],
  E11: ['Halfmaandelijks parkeren in de hele bebouwde kom', 1],
  F1: ['Begin van de bebouwde kom (oud model)', 0], F3: ['Einde van de bebouwde kom (oud model)', 0],
  F1a_horizontaal: ['Begin van de bebouwde kom (liggend)', 1], F1a_verticaal: ['Begin van de bebouwde kom (staand)', 1],
  F1b_horizontaal: ['Begin van de bebouwde kom (liggend, zonder naam)', 1], F1b_verticaal: ['Begin van de bebouwde kom (staand, zonder naam)', 1],
  F3a_horizontaal: ['Einde van de bebouwde kom (liggend)', 1], F3a_verticaal: ['Einde van de bebouwde kom (staand)', 1],
  F3b_horizontaal: ['Einde van de bebouwde kom (liggend, zonder naam)', 1], F3b_verticaal: ['Einde van de bebouwde kom (staand, zonder naam)', 1],
  F4a: ['Begin van een zone 30', 1], F4b: ['Einde van een zone 30', 1], F5: ['Begin van een autosnelweg', 1], F7: ['Einde van een autosnelweg', 1],
  F8: ['Tunnel', 1], F9: ['Autoweg', 1], F11: ['Einde van een autoweg', 1], F12a: ['Begin van een woonerf of erf', 1], F12b: ['Einde van een woonerf of erf', 1],
  F13: ['Aankondiging pijlen op de rijbaan (keuze van rijstrook)', 1], F14: ['Opstelvak voor fietsers en tweewielige bromfietsen', 1],
  F15: ['Aankondiging keuze van richting', 0], F17: ['Busstrook', 1], F18: ['Bijzondere overrijdbare bedding', 1], F19: ['Openbare weg met eenrichtingsverkeer', 1],
  F21: ['Rechts of links voorbijrijden toegelaten', 1], F23a: ['Nummerbord van een gewone weg', 1], F23b: ['Nummerbord van een autosnelweg', 1],
  F23c: ['Nummerbord van een internationale weg', 1], F23d: ['Nummerbord van een ringweg', 1], F25: ['Voorwegwijzer', 1], F27: ['Voorwegwijzer', 1], F29: ['Wegwijzer', 1],
  F31: ['Wegwijzer naar een autosnelweg', 1], F33a: ['Wegwijzer naar een ringweg', 1], F33b: ['Wegwijzer naar vallei of waterloop', 1],
  F33c: ['Wegwijzer naar toeristische attracties of sportcentra', 1], F34a: ['Wegwijzer naar etablissementen van openbaar nut', 1],
  F34b1: ['Wegwijzer voor bepaalde weggebruikers', 1], F34c1: ['Wegwijzer voor bepaalde weggebruikers naar toeristische attracties', 1],
  F35: ['Wegwijzer naar toeristische attracties of sportcentra', 1], F37: ['Wegwijzer naar hotels, motels, restaurants', 1], F39: ['Voorwegwijzer wegomlegging', 1],
  F41: ['Wegomlegging', 1], F43: ['Plaatsnaambord', 1], F45: ['Doodlopende weg', 1], F45b: ['Doodlopende weg, uitgezonderd voetgangers en fietsers', 1],
  F46: ['Einde doodlopende weg', 0], F47: ['Einde van de werken', 1], F49: ['Oversteekplaats voor voetgangers', 1], F50: ['Oversteekplaats voor fietsers', 1],
  F51: ['Ondergrondse of bovengrondse oversteekplaats voor voetgangers', 1], F52: ['Nooduitgang', 1], F53: ['Verplegingsinrichting', 1], F55: ['Hulppost', 1],
  F56: ['Brandblusapparaat', 1], F57: ['Waterloop', 1], F59: ['Aankondiging van een parking', 1], F60: ['Aankondiging van een overdekte parking', 1],
  F61: ['Telefoon', 1], F62: ['Noodtelefoon', 1], F63: ['Tankstation', 1], F63_CNG: ['Tankstation (CNG)', 0], F63_Elektrisch: ['Laadpunt elektrische voertuigen', 0],
  F63_H2: ['Tankstation (waterstof)', 0], F63_LNG: ['Tankstation (LNG)', 0], F63_LPG: ['Tankstation (LPG)', 0],
  F65: ['Hotel of motel', 1], F67: ['Restaurant', 1], F69: ['Drankgelegenheid', 1], F71: ['Kampeerterrein', 1], F73: ['Caravanterrein', 1], F75: ['Jeugdherberg', 1],
  F77: ['Trefpunt toeristische informatie', 1], F79: ['Aankondiging vermindering van rijstroken', 1], F81: ['Aankondiging uitwijking van rijstroken', 1], F83: ['Doorsteek middenberm', 1],
  F85: ['Verkeer toegelaten in beide richtingen op deel met eenrichtingsverkeer', 1], F87: ['Verhoogde inrichting(en)', 1], F89: ['Aankondiging snelheidsbeperking per rijstrook', 1],
  F91: ['Snelheidsbeperking per rijstrook', 1], F93: ['Radio verkeersinformatie', 1], F95: ['Noodstopstrook', 1], F97: ['Versmalling van de weg', 1], F98: ['Vluchthaven', 1],
  F99a: ['Voorbehouden voor voetgangers, fietsers en ruiters', 1], F99b: ['Voorbehouden voor voetgangers en fietsers', 1], F99c: ['Voorbehouden voor landbouwvoertuigen, voetgangers, fietsers en ruiters', 1],
  F101a: ['Einde van F99a', 1], F101b: ['Einde van F99b', 1], F101c: ['Einde van F99c', 1], F103: ['Begin van een voetgangerszone', 1], F105: ['Einde van een voetgangerszone', 1],
  F107: ['Inhaaltoelating (afgeschaft sinds 2019)', 0], F109: ['Einde inhaaltoelating (afgeschaft sinds 2019)', 0],
  F111: ['Begin van een fietsstraat', 1], F113: ['Einde van een fietsstraat', 1], F117: ['Begin van een lage-emissiezone', 1], F118: ['Einde van een lage-emissiezone', 1],
  F119: ['Begin van een luchthavengebied', 1], F120: ['Einde van een luchthavengebied', 1],
  M1: ['Onderbord: enkel fietsers', 1], M2: ['Onderbord: uitgezonderd fietsers', 1], M3: ['Onderbord: uitgezonderd fietsers en bromfietsen klasse A', 1],
  M4: ['Onderbord: fietsers in twee richtingen', 0], M5: ['Onderbord: fietsers en bromfietsen klasse A in twee richtingen', 0], M6: ['Onderbord: bromfietsen klasse B verplicht op het fietspad', 1],
  M7: ['Onderbord: bromfietsen klasse B verboden op het fietspad', 1], M8: ['Onderbord: fietsers en tweewielige bromfietsen', 1],
  M9: ['Onderbord: fietsers in beide richtingen op de dwarsweg', 1], M10: ['Onderbord: fietsers en bromfietsen in beide richtingen op de dwarsweg', 1],
  M11: ['Onderbord: uitgezonderd fietsers en speedpedelecs', 1], M12: ['Onderbord: uitgezonderd fietsers, bromfietsen klasse A en speedpedelecs', 1],
  M13: ['Onderbord: speedpedelecs verplicht op het fietspad', 1], M14: ['Onderbord: bromfietsen klasse B en speedpedelecs verplicht op het fietspad', 1],
  M15: ['Onderbord: speedpedelecs verboden op het fietspad', 1], M16: ['Onderbord: bromfietsen klasse B en speedpedelecs verboden op het fietspad', 1],
  M17: ['Onderbord: speedpedelecs in twee richtingen', 0], M18: ['Onderbord: bromfietsen klasse A en speedpedelecs in twee richtingen', 0],
  M19: ['Onderbord: parkeren voorbehouden voor speedpedelecs', 1], M20: ['Onderbord: parkeren voor fietsen en speedpedelecs', 1],
  M21: ['Onderbord: parkeren voor voortbewegingstoestellen (steps)', 1], M22: ['Onderbord: parkeren voor deelvoortbewegingstoestellen', 1],
  M23: ['Onderbord: parkeren voor deelfietsen', 1], M24: ['Onderbord: parkeren voor deelfietsen en deelvoortbewegingstoestellen', 1],
};

function snelheid(c) {
  const m = c.match(/^C43_(\d+)$/);
  return m ? ['Maximumsnelheid ' + m[1] + ' km/u', 1] : null;
}
function gnaam(c) {
  const code = c.replace(/_.*/, '');
  const t = c.replace(/^G[IVX]+[a-z]?_?/, '').replace(/_/g, ' ');
  const naam = t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
  return ['Aanvullend paneel ' + code + (naam ? ': ' + naam : ''), 0];
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.svg')).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
const idx = {};
const zonder = [];
for (const f of files) {
  const c = f.replace('.svg', '');
  const e = N[c] || snelheid(c) || (c[0] === 'G' ? gnaam(c) : null);
  if (!e) { zonder.push(c); continue; }
  idx[c] = { bestand: 'img/borden/' + f, naam_nl: e[0], categorie: c[0], gecontroleerd: !!e[1] };
}
fs.writeFileSync(path.join(ROOT, 'data', 'borden-index.json'), JSON.stringify(idx, null, 1));
console.log('index:', Object.keys(idx).length, 'zonder naam:', zonder.join(' '));
