// Genereert data/curriculum.json (checklist begint overal op false)
const t = (id, les, thema, naam) => ({ id, les, thema, naam, theorie:false, oefeningen3:false, afbeelding:false, bron:false });
const list = [
 // Les 1
 t('T01',1,'borden','Gevaarsborden (A)'),
 t('T02',1,'borden','Voorrangsborden (B1, B5, B9, B11, B15…)'),
 t('T03',1,'borden','Verbodsborden (C) en einde verbod'),
 t('T04',1,'borden','Gebodsborden (D)'),
 t('T05',1,'borden','Parkeer- en stilstaanborden (E)'),
 t('T06',1,'borden','Aanwijzingsborden (F) en autosnelweg/autoweg-borden'),
 t('T07',1,'borden','Zone-, G-, Z-borden en aanvullende panelen'),
 t('T08',1,'snelheden','Snelheden per wegtype en gewest'),
 t('T09',1,'snelheden','Zone 30, woonerf, erf, schoolomgeving'),
 t('T10',1,'borden','Wegmarkeringen (strepen, pijlen, gele lijnen, zebrapad)'),
 // Les 2
 t('T11',2,'voorrang','Rangorde van voorrang en voorrang van rechts'),
 t('T12',2,'voorrang','Voorrangsborden op kruispunten, T-kruispunt, uitzonderingen op voorrang van rechts'),
 t('T13',2,'voorrang','Rotonde en verkeersplein'),
 t('T14',2,'voorrang','Linksafslaan, tegenliggers, middenberm/gescheiden rijbanen'),
 t('T15',2,'lichten','Verkeerslichten (3-kleuren, knipperend geel/oranje, pijlen, fietslichten)'),
 t('T16',2,'lichten','Bevoegde personen en hun seinen'),
 t('T17',2,'kwetsbaar','Voetgangers, zebrapad, oversteken'),
 t('T18',2,'kwetsbaar','Fietsers, fietspaden, fietsstraten, bromfietsklasse A/B'),
 t('T19',2,'openbaar','Tram: trambaan, tramlichten, tramhalte, voorrang'),
 t('T20',2,'openbaar','Bus: busstrook, bushalte, voorrang bus, schoolbus'),
 t('T21',2,'openbaar','Overweg (spoorweg) en bijhorende signalisatie'),
 t('T22',2,'voorrang','Voorrangsvoertuigen en bijzondere voertuigen'),
 // Les 3
 t('T23',3,'plaats','Plaats op de weg, rijstroken, rechts rijden'),
 t('T24',3,'plaats','Kruisen en inhalen'),
 t('T25',3,'plaats','Richtingaanwijzers, van rijstrook veranderen, ritsen'),
 t('T26',3,'snelwegen','Autosnelweg en autoweg: regels, op-/afrit, reddingsstrook'),
 t('T27',3,'plaats','Parkeren en stilstaan (afstanden, gele lijnen, zones, verboden plaatsen)'),
 t('T28',3,'plaats','Achteruitrijden, keren, voorsorteren'),
 // Les 4
 t('T29',4,'gedrag','Alcohol (BAC, jonge bestuurder, BOB) en drugs'),
 t('T30',4,'gedrag','Gsm, handsfree, afleiding, vermoeidheid, medicatie'),
 t('T31',4,'gedrag','Gordel, kinderzitjes, vervoer van kinderen en lading'),
 t('T32',4,'gedrag','Lichten van het voertuig, mist, zicht'),
 t('T33',4,'gedrag','Reactietijd, remweg, volgafstand, 2-secondenregel, weersomstandigheden'),
 t('T34',4,'ongeval','Ongeval: veiligheid, alarmnummers, EHBO, gevarendriehoek, hulpverlening'),
 t('T35',4,'ongeval','Europees aanrijdingsformulier, verzekering, vluchtmisdrijf'),
 t('T36',4,'rijbewijs','Rijbewijs B: leerperiode, begeleider, voorlopig rijbewijs, punten, intrekking, vervallenverklaring'),
 t('T37',4,'rijbewijs','Theorie-examen: regels, puntentelling, duur, aantal vragen, wijzigingen'),
 t('T38',4,'techniek','Voertuigtechniek: banden, onderhoud, keuring, verplichte uitrusting'),
 t('T39',4,'techniek','Dashboard: controlelampjes en symbolen'),
 t('T40',4,'techniek','Milieu en zuinig rijden, lage-emissiezones'),
];
require('fs').writeFileSync(__dirname + '/../data/curriculum.json', JSON.stringify(list, null, 1));
console.log(list.length + ' onderwerpen');
