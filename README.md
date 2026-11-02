# Theorie rijbewijs B – Vlaanderen (statische cursus)

Gratis online cursus voor het theorie-examen. Vier lessen als boek (één onderwerp per pagina, volledig scherm, zwevende balk met vorige/volgende, inhoud en lesmenu), proefexamen, oefenbank, mijn fouten, spiekbrief en een bronnenpagina. Geen backend, geen tracking. Voortgang staat enkel in `localStorage`.

## Openen
- Gewoon `site/index.html` openen in een browser (werkt via `file://`), of
- `cd site && python3 -m http.server 8000` (of `npx serve site`) en open http://localhost:8000. Alle paden zijn relatief, dus het werkt ook onder een subpad (bv. GitHub Pages `/repo-naam/`).

## Bouwen
Alle inhoud staat als JSON in `data/`. De build (Node, geen dependencies) schrijft `site/data/cursus.js` en de HTML-pagina's:

```
node scripts/build.js                  # strikt: faalt (exit 1) als de curriculum-checklist niet groen is
node scripts/build.js --lenient        # waarschuwt enkel; schrijft de vinkjes in data/curriculum.json bij
node scripts/build.js --demo           # bouwt mee met data/_demo (voorbeeldoefeningen, alle types); impliceert --lenient
node scripts/build.js --allow-unverified   # ook oefeningen zonder 'ok' in data/verificatie.json
```
- Alleen oefeningen met status `ok` in `data/verificatie.json` (of `data/verificatie/*.json`) komen in de site. Bestaat die niet, dan worden alle oefeningen opgenomen (enkel gelogd).
- De checklist per onderwerp: theorie, >= 3 oefeningen, afbeelding en bron.
- `data/_demo/make-demo.js` genereert de demo-oefeningen. Draai na een demo-build altijd weer een gewone build voor je commit.
- Data-schema's en engine-aanvullingen: `schemas/README.md`. Ontwerp en boekvorm: `docs/ARCHITECTUUR.md`.

## Testen (Playwright, Chromium)
```
node scripts/build.js --demo
QA_SHOTS=/pad/naar/map node scripts/qa/flow.js     # alle oefeningtypes, paginering, balk, eindtest, proefexamen, localStorage geblokkeerd
QA_SHOTS=/pad/naar/map node scripts/qa/shots.js    # screenshots desktop 1440 en mobiel 390 + console-errors
```
Playwright wordt lokaal of globaal gezocht (`npm i -g playwright`).
