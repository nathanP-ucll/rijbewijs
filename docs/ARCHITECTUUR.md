# Architectuur
- Brondata: data/ (JSON). `node scripts/build.js` valideert (curriculum-checklist, bronnen, verificatie) en schrijft site/data/*.js (window.CURSUS = {...}) + HTML-pagina's. Geen fetch -> werkt via file://.
- site/: statische HTML/CSS/vanilla JS, relatieve paden, geen build-server nodig.
- Afbeeldingen: site/img/borden/<code>.svg (bv. B1, C43_50, E9a); schema's site/img/schemas/*.svg (gegenereerd door scripts/schemas/*.js). Credits: data/credits.json.
- Alleen oefeningen met verificatie-status "ok" gaan de site in.
- Kleuren per categorie: A rood, B geel, C rood/wit, D blauw, E blauw, F blauw/wit.

## Boekvorm (wens van de gebruiker)
Elke les is een echt "boek" met pagina's, geen lange scrollpagina:
- Eén pagina tegelijk zichtbaar (theorieblok + bijhorende oefeningen samen op een pagina).
- Onderaan: "Pagina X van Y", knoppen Vorige / Volgende, en een voortgangsbalk.
- Links een vaste inhoudsopgave (punten/hoofdstukken): klik = spring naar die pagina; huidige pagina gemarkeerd, gedane pagina's met vinkje. Op mobiel inklapbaar.
- Vaste volgorde per les: Inleiding (leerdoelen, wat leer je, hoe lang) -> theorie/oefen-pagina's -> samenvatting -> eindtest.
- Ook een algemene cursus-inleiding (hoe werkt de cursus, het examen, hoe gebruik je de site).
- Pijltjestoetsen (links/rechts) bladeren, #pagina-nummer in de URL zodat je terug kunt naar waar je was; laatste pagina per les onthouden in localStorage.

## Herziening interface (feedback gebruiker, 2026-11-03) – GAAT VOOR op eerdere 'Boekvorm'
- GEEN zijbalk. Content volledig scherm, zoals een PDF-reader.
- Onderaan een kleine, zwevende (floating) balk: vorige / "pagina X van Y" / volgende, een inhoud-knop (opent een compact paneel/dropdown om naar een punt te springen) en een dropdown om naar een andere les (Les 1-4, examen) te wisselen.
- Veel simpelere interface, weinig chrome, grote duidelijke knoppen.
- MINDER TEKST: per pagina één onderwerp, grote opsommingen, korte woorden/zinnen, grote bordafbeeldingen, kaders kort (max ~1 zin). Lange uitleg alleen achter een "Meer uitleg"-knop. Geen overflow aan blokken/kaders per pagina; oefeningen op eigen (volgende) pagina in plaats van gepropt onder de theorie.

## Geen bordcodes leren (feedback gebruiker, 2026-11-03)
Bordcodes (B1, C43, E9a, ...) hoef je niet te kennen voor het examen. Dus:
- Toon codes NIET in de leerinhoud (geen kolom 'code', niet in titels/vragen/antwoorden). Hooguit klein en grijs als bestandsreferentie, liefst helemaal niet. Bord = afbeelding + naam/betekenis.
- Geen oefeningen die een code vragen of koppelen (bord-modus 'code' vervalt). Wel: bord -> betekenis, bord -> categorie (gevaar/voorrang/verbod/gebod/parkeren/aanwijzing), betekenis -> bord.
- Gebruik geen jargon als 'artikel 12.3.2' in de cursus; bronnen alleen op de bronnenpagina.

## Mini-oefeningen en bordkaarten (feedback gebruiker, 2026-11-03)
- Na elke theoriepagina (bv. inleiding 'soorten borden') staat ONDERAAN dezelfde pagina meteen een kleine oefening (`mini: true`) over precies die pagina, liefst slepen/koppelen (bv. soort bord <-> betekenis). Grotere oefeningen blijven op eigen pagina's.
- Bordkaarten: links groot bord, rechts korte duidelijke tekst: wat betekent het, wat moet je doen, 'let op' (bv. 'geen voorrang'). Geen code. Borden die op elkaar lijken staan NAAST elkaar met één regel 'het verschil'.
- Aankondigingsborden (bv. voorrangsbord met onderbord afstand): zeg expliciet dat het een AANKONDIGING is en dat het eigenlijke bord nog moet komen, ~afstand VERDERop (de afstand wijst vooruit, niet achteruit), en wat er verschilt met het bord zonder aankondiging.

## Hoofdstukken en nummering (feedback gebruiker, 2026-11-03)
Stijl van een echt studieboek, met nummers die je ook in de inhoudsopgave ziet:
- Hoofdstuk = thema, doorlopend genummerd over de hele cursus, met titel. Lesindeling blijft: Les 1 = H1 Borden, H2 Snelheden en zones; Les 2 = H3 Voorrang en kruispunten, H4 Verkeerslichten en bevoegde personen, H5 Voetgangers en fietsers, H6 Openbaar vervoer; Les 3 = H7 Plaats op de weg, H8 Autosnelweg en autoweg; Les 4 = H9 Gedrag en alcohol, H10 Ongeval en EHBO, H11 Rijbewijs en examen, H12 Techniek en milieu.
- Paragraaf N.M = theorieblok (titelKort), onderdeel N.M.K = elke pagina/kaart/oefening binnen de paragraaf, in leesvolgorde, bv. 3.2.1 theorie, 3.2.2 vergelijking, 3.2.3 mini-oefening 'Oefening'. Dus bv. 1.2.8 kan een oefening zijn over de borden uit 1.2.
- De nummers worden automatisch door de build/engine gegenereerd uit de volgorde in de data (niet handmatig in de JSON), staan in de kop van elke pagina en in de inhoud (uitklapbaar, groep per hoofdstuk), en in 'Mijn fouten' ('fout bij 3.2.4').
- Les-eindtest en samenvatting staan als laatste onderdelen van het les-overzicht (niet genummerd binnen een hoofdstuk, bv. 'Eindtest les 1').

## Echte pagina's (feedback gebruiker, 2026-11-03)
Elke pagina is een goed gevulde, goed opgemaakte boekpagina: niet leeg en niet overladen.
- Vaste opbouw: kop met nummer + titel (bv. '1.2.3 Gevaarsborden'), één inleidende zin, hoofdinhoud (kaarten, opsomming of schema, groot), maximaal één kader (regel/let op/tip), onderaan een mini-oefening of 'onthoud dit'.
- Minimum: elke pagina heeft minstens kop + inleidende zin + 3 inhoudselementen (bv. 3 bordkaarten, of schema + 3 punten) + kader of oefening. Te kleine blokken worden samengevoegd tot één pagina; te grote worden gesplitst (bordkaarten ~6 per pagina).
- Maximum: past op één scherm zonder lange scroll op desktop; op mobiel mag een pagina scrollen maar blijft overzichtelijk.
- Goede, korte, vlotte teksten in gewone taal; consequente stijl, witruimte, uitgelijnd raster; pagina's voelen even 'vol'.
- De pagina-opbouw wordt door de engine automatisch uit de data samengesteld (kort/kaarten/vergelijk/paginas/schema's/kaders/mini), met herbruikbare pagina-sjablonen (bv. 'bordenpagina', 'regelpagina', 'schemapagina', 'vergelijkpagina', 'oefenpagina', 'samenvatting').

## Het boek wordt GESCHREVEN, niet samengesteld (feedback gebruiker, 2026-11-03)
Auto-samenstellen uit de onderzoeksdata (data/theorie) gaf rommel: rangorde, 2027-waarschuwing en borden door elkaar, afgebroken zinnen, 178 'pagina's'. Daarom:
- data/theorie = ruwe feitenbron (alleen lezen voor het boek). Het boek zelf staat in data/boek/h<N>.json, met de hand geschreven per hoofdstuk, in didactische volgorde.
- Doel: ca. 15-25 pagina's per hoofdstuk, ca. 30-40 per les (zo'n 1-2 uur). Elke pagina = één onderwerp met een duidelijke titel; geen onderwerpen mengen.
- Formaat data/boek/h<N>.json:
  { "hoofdstuk": 1, "titel": "Verkeersborden", "les": 1, "intro": { "tekst": "2 zinnen", "doelen": ["Je leert ...", ...] },
    "paragrafen": [ { "nr": "1.1", "titel": "...", "paginas": [ Pagina ] } ],
    "samenvatting": [ "korte punten, max 8" ] }
  Pagina = { "id": "h1-1-1", "titel": "...", "intro": "1 korte zin", "blokken": [ Blok ], "theorieblokken": ["blok-id uit data/theorie"] }
  Blok (één van):
   { "type":"punten", "items":["korte zin", ... max 5] }
   { "type":"kaarten", "items":[{ "afb":"bestandsnaam", "naam":"...", "uitleg":"max 12 woorden", "letop":"optioneel" }] }  // max 6 per pagina, geen code zichtbaar
   { "type":"vergelijk", "titel":"...", "links":{ "afb":"..","tekst":".." }, "rechts":{ "afb":"..","tekst":".." }, "verschil":"1 zin" }
   { "type":"schema", "afb":"schemanaam (uitlegversie)", "bijschrift":"1 zin", "punten":["..."] }
   { "type":"kader", "soort":"regel|letop|zwarefout|tip|gewest", "titel":"...", "tekst":"1 volledige zin", "gewest":{"vlaanderen":"..","wallonie":"..","brussel":".."} }
   { "type":"tabel", "kolommen":[".."], "rijen":[["..",".."]] }   // klein, max 6 rijen
   { "type":"voorbeeld", "tekst":".." }
- De mini-oefeningen en gewone oefeningen worden door de engine gekoppeld via 'theorieblokken': mini's (mini:true) van die theorieblokken komen onderaan de pagina; andere oefeningen komen als aparte oefenpagina's na de paragraaf (nr X.Y.K).
- Regels: alleen feiten uit data/theorie (incl. kort/kaarten/vergelijk); niets uit docs/TE-CONTROLEREN-*.md; geen bordcodes of artikelnummers; korte zinnen, 'je'-vorm, geen afgebroken zinnen; 2027-wijzigingen NIET tussen de gewone pagina's maar enkel op één eigen pagina 'Wat verandert er in 2027?' aan het einde van het hoofdstuk (en alleen als de data dat bevestigt).
