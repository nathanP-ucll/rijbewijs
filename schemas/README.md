# Schema's (afspraken voor alle workers)

Alle data is UTF-8 JSON, Nederlands (Vlaams), eigen woorden. Geen kopieerwerk.

## data/theorie/<thema>.json
{ "thema": "voorrang", "les": 2, "blokken": [ Blok ] }

Blok = {
 "id": "voorrang-rangorde",            // uniek, kebab-case, = anker op de pagina
 "curriculum": ["T07","T08"],          // ids uit data/curriculum.json
 "titel": "...",
 "uitleg": "korte uitleg (markdown-light: **vet**, lijstjes met '- ')",
 "regels": [ { "kolom1": "...", "kolom2": "..." } ],   // optioneel regeltabel
 "kaders": [ { "type": "regel|letop|zwarefout|tip|gewest", "titel": "...", "tekst": "...",
               "gewest": {"vlaanderen":"..","wallonie":"..","brussel":".."} } ],  // gewest enkel bij type gewest
 "uitzonderingen": ["..."],
 "afbeeldingen": ["B1", "schema-voorrang-rechts"],      // bestandsnamen zonder extensie in site/img
 "bronnen": ["S001","S014"]                              // ids uit data/bronnen.json
}

## data/bronnen.json
{ "S001": { "url": "https://...", "titel": "...", "uitgever": "...", "type": "officieel|betrouwbaar", "opgehaald": "2026-11-02", "feiten": ["korte beschrijving van wat hier bevestigd wordt"] } }
Workers schrijven naar data/bronnen/<thema>.json (eigen id-prefix, bv. BORD-001) zodat er geen merge-conflicten zijn; build voegt samen.

## data/oefeningen/<les|thema>.json  -> array van Oefening
Gemeenschappelijk: id ("L1-007"), les (1-4), onderwerp (curriculum-id), theorieblok (blok-id),
 type (zie onder), vraag, afbeelding (optioneel bestandsnaam zonder ext), uitleg (1-3 zinnen),
 bronnen[], moeilijkheid (1-3), gewicht ("gewoon"|"zwaar"), examen (bool: mag in proefexamen/eindtest)
Typen en antwoordsleutel:
 - "meerkeuze":   opties[], correct[] (indices), meerdere (bool)
 - "invul":       antwoorden[] (geaccepteerde varianten, lowercase), eenheid (optioneel)
 - "cloze":       tekst met {{1}}{{2}} gaten, gaten[{ opties[] (leeg = vrij invullen), correct | antwoorden[] }]
 - "koppel":      paren[{ links, rechts, linksAfb? }]
 - "volgorde":    items[] in juiste volgorde (UI schudt)
 - "waaronwaar":  stelling, juist (bool), motivatie (de juiste verklaring), foutemotivaties[] (twee foute verklaringen)
 - "situatie":    afbeelding (SVG kruispunt), voertuigen[{nr,label}], modus ("volgorde"|"klik"), correct (volgorde[] of nr)
 - "hotspot":     afbeelding, zones[{ id, x,y,w,h (in % van de afbeelding), correct (bool) }]
 - "tabel":       kolommen[], rijen[{ label, cellen[{ correct, opties? }] }]
 - "bord":        afbeelding (bordcode), modus ("code"|"naam"|"categorie"), antwoorden[], categorie ("A".."F")
 - "reken":       gegeven, antwoord (getal), tolerantie, eenheid

## data/curriculum.json
Lijst onderwerpen met id, les, naam, thema, en checklist-vlaggen: theorie, oefeningen3, afbeelding, bron (false/true). Build faalt als iets niet true is.

## data/verificatie.json
{ "<oefening-id>": { "status": "ok|twijfel|fout", "opmerking": "...", "bronnen": ["url"] } }

## Oefeningenmix (wens van de gebruiker)
Voelt als een schoolboek, niet als een quiz. Per les een mix van: koppelen/verbinden (bord <-> betekenis, vaak met echte bordafbeeldingen), aankruisen (meerdere juiste antwoorden), invullen/aanvullen (invulvraag en cloze), en gewone meerkeuze (ook met afbeelding). Daarnaast de overige types als afwisseling. Richtlijn per les (25-40 oefeningen): ca. 25% koppel, 20% aankruisen/meerkeuze meerdere juist, 20% invullen/cloze, 15% gewone meerkeuze, rest situatie/hotspot/volgorde/waar-onwaar/tabel/bord. Elk theorieblok krijgt minstens 1-2 oefeningen direct erna.

## Engine-aanvullingen (door de bouw-worker; allemaal optioneel)

### Theorieblok (data/theorie/*.json)
- `kort`: array korte opsommingen (korte woorden/zinnen, **vet** toegestaan). Wordt GROOT getoond bovenaan de pagina. Als `kort` ontbreekt, leidt de engine een korte weergave af uit `uitleg` (lijstitems, anders de eerste 3 zinnen).
- `uitleg`: lange uitleg. Staat altijd achter de knop 'Meer uitleg' (samen met de volledige kadertekst en `uitzonderingen`).
- `kaders[].tekst`: op de pagina zelf wordt enkel de eerste zin getoond (max ~170 tekens); de rest zit achter 'Meer uitleg'. Schrijf dus een volledige, korte eerste zin.
- `regels`: wordt NIET als tabel getoond maar als kaartjes, over meerdere pagina's verdeeld (6 borden per pagina; 4 kaartjes per pagina bij andere rijen; <= 3 rijen zonder bord staan op de hoofdpagina). Kolomnamen zijn vrij; sleutel `naam` (anders de eerste sleutel) is de kaarttitel; sleutels `vlaanderen`, `wallonie`, `brussel` krijgen een gewestbadge.
- `code` (of `bord`) in een regelrij is enkel een interne bestandsverwijzing naar `site/img/borden/<code>.svg`. De code wordt nooit getoond. Zet de betekenis in `naam`/`betekenis`.
- Zichtbare tekst wordt door de engine gefilterd: lijstjes met bordcodes tussen haakjes (bv. `(B1, B5, B9...)`) en artikelverwijzingen (`art. 12.3.2`) worden weggehaald. Losse codes in lopende zinnen blijven staan: schrijf ze dus niet in de tekst.
- Inkort-velden (optioneel): blok `titelKort` (max 4 woorden), blok `kort` (3-6 korte punten), `kaders[].kort` (1 korte zin) en blok `paginas` ([{ "titel", "rijen": [indices in regels] }], ~6 rijen per pagina) voor de verdeling van grote regeltabellen.

### Oefeningen
- `bord`: enkel modus `naam` en `categorie` (modus `code` wordt door de build geweigerd). Bij `naam` mag je `opties[]` toevoegen: dan wordt het meerkeuze (juist = optie die in `antwoorden` staat); zonder `opties` typt de gebruiker het antwoord.
- `categorie` is een letter A-F maar wordt getoond als Gevaar, Voorrang, Verbod, Gebod, Parkeren, Aanwijzing.
- `situatie.voertuigen[]` mag `x`,`y` (in %) hebben: dan komen er genummerde knoppen op de afbeelding. Zonder x/y staan de voertuigen als knoppen onder de afbeelding.
- `hotspot.zones[].label`: toegankelijke naam voor een zone. `hotspot.alt`: alt-tekst.
- `koppel.paren[].linksAfb`: afbeeldingsnaam (bord) links van het label; geef het label dan de betekenis, niet de code.
- `tabel.rijen[].cellen[].correct` mag een string, een array varianten of een boolean (checkbox) zijn; `opties` maakt er een dropdown van.
- Elke oefening komt op een eigen lespagina, direct na de theoriepagina(s) van haar `theorieblok`.
- Bordkaarten (optioneel, op borden-blokken): `kaarten` [{ "afb" (bordbestand zonder .svg, gecontroleerd), "naam", "uitleg", "letop"? , "groep"? }] en `vergelijk` [{ "titel", "afbs": [..], "verschil" }] voor borden die op elkaar lijken.

## Visuele vragen (wens gebruiker: eindtest zo visueel mogelijk)
- Meerkeuze/aankruisen: optioneel veld "optiesAfb": array even lang als "opties" (bestandsnaam of null per optie; borden uit site/img/borden, schema's uit site/img/schemas). De optie toont de afbeelding groot met de tekst eronder (of alleen de afbeelding als de tekst leeg is).
- "afbeelding" (bij de vraag) mag ook een lijst zijn: "afbeeldingen": [..] voor 2-3 beelden naast elkaar.
- Voorkeur in de eindtest: 'welk bord betekent...', 'wat betekent dit bord/deze markering/dit licht', situatie en hotspot waar er een schema is, koppel met borden aan beide kanten.
- Geen verklappende tekst in de afbeelding; geen bordcodes in zichtbare tekst.

### Boekpagina's (data/boek/h<N>.json) – engine-details
- Alle blokken worden door de engine in een 12-koloms raster gelegd: `punten` (7 kolommen) + `kader` of `voorbeeld` (5 kolommen) komen naast elkaar; `kaarten`, `vergelijk`, `schema`, `tabel` krijgen de volle breedte.
- `punten.genummerd: true` toont grote cijfercirkels (stappen); `schema.punten` worden altijd als genummerde stappen naast het schema getoond.
- `vergelijk.midden` ({afb, tekst}, optioneel) maakt er een kaart met 3 kolommen van; de balk 'Het verschil' staat eronder.
- `kader.soort: "tip"` wordt als markeerstift-tekst getoond (geen balk, geen afgeronde hoeken).
- Elke pagina krijgt automatisch: kopband in de hoofdstukkleur, nummer N.M.K, een 'Onthoud dit'-balk (uit het eerste `punten`-blok) als er geen mini-oefening is.
- `data/hoofdstukken.json`: volgorde = hoofdstuknummer; titels en lestitels staan daar.
- Build-controles (fout in strikte modus): onbekende afbeelding, onbekend bloktype, zinnen die niet op . ? ! ) eindigen of op 'bv.' of ':' eindigen. Waarschuwing: < 3 blokken, > 1 kader, > 5 punten, > 6 kaarten, bordcode of artikelnummer in tekst.

### Boekpagina's – nieuwe paginaspec (H1; blokken `grid`, `tekst`, `tip`, `oefening`, paragraaf-`intro`)
- Paragraaf: `{ "nr": "1.2", "titel": "Gevaarsborden", "intro": "1-3 korte zinnen, eindigt netjes", "paginas": [...] }`. De engine voegt de pagina's van een paragraaf samen tot één lange pagina: bovenaan de paragraafkop `N.M.0` (klein, licht) met de titel groot en daaronder `intro`; daaronder onder elkaar de secties `N.M.1`, `N.M.2`, ... (elke bestaande `pagina` wordt een sectie met eigen kop). `intro` is optioneel voor oude hoofdstukken, wordt gecontroleerd als het er is (niet leeg, eindigt netjes).
- Pagina/sectie: `{ "id", "titel", "blokken": [...], "theorieblokken": [...] }`. Het veld `intro` (1 zin) op paginaniveau is bij de nieuwe spec weggelaten en blijft optioneel. Een pagina met een `oefening`-blok mag minstens 2 blokken hebben (anders 3-6); `kader` en `tip` samen maximaal 1 per pagina.
- `{ "type": "grid", "kolommen": 3, "items": [ { "afb", "naam", "uitleg" } ] }`: vlak raster met alleen binnenlijnen (geen kaarten, schaduw of afgeronde hoeken). Per cel: afbeelding (bord uit `site/img/borden`), daaronder de naam vet, daaronder klein de uitleg (max ~12 woorden). Maximaal 9 items. `kolommen` is een suggestie (2-4); zonder waarde kiest de engine zelf. Geen codes zichtbaar.
- `{ "type": "tekst", "alineas": ["...", "..."] }`: gewone alinea's in normale lettergrootte, volle breedte, onder het grid.
- `{ "type": "tip", "titel": "...", "tekst": "1-2 volledige zinnen" }`: gemarkeerde sectie over de volle breedte (lichte markeerkleur, randloos, rechte hoeken). Telt als het ene kader van de pagina.
- `{ "type": "oefening", "ids": ["L1-M40"] }`: onder de titel 'Al eens oefenen' staat de oefening gewoon op de pagina (geen nummerbolletje, geen type-label, geen dubbele rand). Eén id = één oefening. Meerdere ids (bv. de grote bord-oefening `L1-B01`-`L1-B20` en de slottest `L1-K01`-`L1-K03`) = een reeks die de engine na elkaar toont (één vraag tegelijk, met voortgang). De ids verwijzen naar `data/oefeningen/les*.json`.
- De engine hoort bij een pagina met een `oefening`-blok enkel de daar vermelde oefeningen te tonen en NIET bovendien alle mini-oefeningen van de `theorieblokken` (anders staan er dubbele oefeningen). `theorieblokken` blijft de verwijzing naar de feitenbron; niet-mini oefeningen van die blokken (examen/eindtest) blijven voor proefexamen en eindtest.
- Nieuwe oefeningen voor H1 hebben `nieuw: true` en `gewijzigd: false` en moeten nog in `data/verificatie` een status `ok` krijgen voordat ze op de site verschijnen. Bord-vragen `L1-B01`-`L1-B20` zijn gewone meerkeuze (`afbeelding` = bordbestand, 4 opties, 1 juist, afleiders zijn andere borden uit dezelfde soort); `L1-K01`-`L1-K03` zijn koppel-oefeningen met `linksAfb`.
- Bestaande blokken (`punten`, `tabel`, `schema`, `kader`) blijven bruikbaar naast de nieuwe, bv. een `tabel` of `schema` tussen `tekst` en `tip`.
