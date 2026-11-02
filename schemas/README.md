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
