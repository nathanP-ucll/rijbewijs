# Architectuur
- Brondata: data/ (JSON). `node scripts/build.js` valideert (curriculum-checklist, bronnen, verificatie) en schrijft site/data/*.js (window.CURSUS = {...}) + HTML-pagina's. Geen fetch -> werkt via file://.
- site/: statische HTML/CSS/vanilla JS, relatieve paden, geen build-server nodig.
- Afbeeldingen: site/img/borden/<code>.svg (bv. B1, C43_50, E9a); schema's site/img/schemas/*.svg (gegenereerd door scripts/schemas/*.js). Credits: data/credits.json.
- Alleen oefeningen met verificatie-status "ok" gaan de site in.
- Kleuren per categorie: A rood, B geel, C rood/wit, D blauw, E blauw, F blauw/wit.
