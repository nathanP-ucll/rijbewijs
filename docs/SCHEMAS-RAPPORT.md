# Rapport schema's

Genereren: `node scripts/schemas/build-all.js` (schrijft site/img/schemas/*.svg en data/schemas-index.json). Bronnen: scripts/schemas/{lib,situaties,lichten,bevoegd,plaats,verkeer,dashboard}.js.

## Technische keuzes
- Borden zijn als base64-data-URI in de SVG ingebed (uit site/img/borden). Reden: een SVG die via `<img src>` geladen wordt mag geen externe bestanden laden; zo werken de schema's overal. Gevolg: bestanden iets groter.
- Situatieschema's bestaan twee keer: `<naam>.svg` (uitleg, met "1e/2e/wacht"-labels, voor de theorie) en `<naam>-oefening.svg` (neutraal, zonder antwoord, voor oefeningen). In schemas-index.json: `type` = uitleg|oefening en `partner`.
- Index-velden: `voertuigen` (nr, label, kleur, x, y in %), `situatie` { juisteVolgorde | juisteVoorrang, moetWachten, voorrangVoor, motivatie }, `hotspots` (x,y,w,h in %). Waar de volgorde niet uniek is (twee voertuigen mogen tegelijk), staat er bewust geen juisteVolgorde maar `moetWachten`.
- Dashboardlampjes: 200x220 viewBox; overige schema's 800x600.
- Alle bronnen-ids en theorieblok-ids in de index zijn gecontroleerd tegen data/bronnen en data/theorie.

## Gemaakt (77 SVG's, 51 unieke schema's)
Situatie (met oefening-variant): voorrang-rechts (3 auto's; volgorde 2,1,3), b1-b5-kruispunt (voorrang auto 1), t-kruispunt (2,1,3), t-kruispunt-b1 (auto 1 wacht), aardeweg, tram-voorrang, linksaf-tegenligger, afslaan-voetgangers, uitrit-parkeerplaats, rotonde (D5+B1), oprit-snelweg.
Zonder antwoord: verkeersplein, voorrangsweg-b9-b11, middenberm, voorrangsvoertuig, bus-verlaat-halte, tramhalte-zonder-vluchtheuvel, tram-inhalen-rechts, overweg-lichten, overweg-file, busstrook-rechtsaf.
Lichten en personen: lichten-3kleuren, -knipperoranje, -pijlen, -fiets, -voetgangers, -rijstrook, -kruispunt, bevoegde-persoon-stop, -armen, werfzeiger-schijf, rangorde-voorrang, rangorde-lichten, opstelvak (met hotspots).
Plaats/afstanden: plaats-rechts-rijden, kruisen, inhalen-links, inhaalverbod-zicht, ritsen, reddingsstrook-2/-3, stilstaanverbod-zebrapad (hotspots), parkeerafstanden, gele-streep, parkeren-rijbaan, parkeren-berm, gevarendriehoek-afstand, zijdelingse-afstand, portier, dode-hoek (schematisch), fietszone, zebrapad.
Dashboard: tech-dashboard-kleuren, -rood, -oranje, -groen-blauw; lampjes met eenduidige kleur: olie (rood), remmen (rood), motor (oranje), grootlicht (blauw), richtingaanwijzer (groen). Lampjes waarvan de kleur per bron verschilt (accu, koelvloeistof, airbag, ABS, bandenspanning; TE-CONTROLEREN-techniek punt 4) zijn bewust in neutrale kleur getekend met de tekst "kleur verschilt per merk".

## Bewust niet gemaakt
- Twee linksafslaande tegenliggers (twijfel, TE-CONTROLEREN-voorrang 1), middenberm als "twee kruispunten" (punt 2), woonerf-voorrang (punt 3).
- Voorrang bij 4 voertuigen elk rechtdoor van alle kanten: kringloop zonder eenduidig antwoord. Verkeersplein heeft geen antwoordsleutel (TE-CONTROLEREN-voorrang 5 vraagt nazicht).
- stopafstand/remweg (remweg-formule twijfelachtig, TE-CONTROLEREN-gedrag 1) en bijhorende reken-schema's.
- Gele doorlopende rand-streep; parkeerverbod bij borden (20 m) en 5 m ná zebrapad (plaats).
- ritsen-twee-geblokkeerd, schema-tramlichten, bob-dambordmarkering, busstrook-onderbroken-streep, overweg-pech (regel of afbeelding in bron onvoldoende duidelijk).
- Niet meer toegekomen aan: volgafstand-2sec, rijstroken-bebouwde-kom, richtingaanwijzers, afslaan-rechts-links, rijstrook-wisselen, keren, achteruitrijden, voorsorteren, parkeerschijf, parkeerstrook-markering, snelweg-verboden, snelweg-rijstroken, pech-snelweg, fietspad-markering, fietsoversteekplaats, rotonde-fiets(pad), voetgangerslichten-schema (kwetsbaar; lichten-voetgangers kan hergebruikt worden), bromfietsklassen, alcohol-grenzen, kinderzitje, lichten-overzicht, aardeweg-uitzondering is wel gedaan; ongeval-stappenplan, EHBO-schema's, aanrijdingsformulier, tech-* behalve dashboard (profielmeter, bandenspanning, motorruimte, keuring, uitrusting, zuinig rijden, euronorm, LEZ, hybride).
- Namen die in de theorie genoemd worden maar nog geen bestand hebben: zie bovenstaande lijst; `schema-voorrang-rechts-4` en `schema-lichten-overzicht` bestaan niet.

## Let op
- De dode-hoek-zones zijn schematisch (de theorie noemt geen afmetingen).
- Gevarendriehoek 30 m / 100 m volgt politie.be (techniek-punt 9), niet Vias.
- Visueel gecontroleerd via Playwright-render van elke SVG (contactsheets); laatste correcties zijn per schema bekeken, maar plaats-/snelwegschema's na de laatste wijzigingen (reddingsstrook, ritsen, parkeerafstanden, gevarendriehoek, parkeren-berm, overweg) zijn niet allemaal opnieuw bekeken.
