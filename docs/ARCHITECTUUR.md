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
