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
