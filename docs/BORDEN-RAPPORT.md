# Rapport verkeersborden (Wikimedia Commons)

Gegenereerd door `scripts/download-borden.js` (download), `scripts/contactsheet-borden.js` (visuele controle) en `scripts/build-borden-index.js` (index).

## Resultaat
- **312 SVG's** in `site/img/borden/` (bestandsnaam = bordcode), allemaal visueel gecontroleerd via contactsheets (Playwright/Chromium).
- `data/credits.json`: 312 rijen (bestand, bordcode, auteur, licentie, bron_url, opmerking). Licenties: 301 x Public domain, 11 x CC BY-SA 4.0 (auteur Userc11). Geen enkel bestand met niet-vrije licentie opgenomen. Bij CC BY-SA moet de site naamsvermelding (auteur + licentie) tonen.
- `data/borden-index.json`: code -> {bestand, naam_nl, categorie, gecontroleerd}. 229 x `gecontroleerd:true`, 83 x `false` (naam of exacte code onzeker).
- Categorieen: A 32, B 20, C 44, D 21, E 18, F 101, G 52 (aanvullende panelen), M 24 (onderborden). Z: 0.

## Keuze nummeringssysteem (belangrijk)
Op Commons staan twee reeksen: het **huidige systeem** (KB 1 dec 1975, nog geldig tot de nieuwe Code van de openbare weg in werking treedt op 1 juni 2027; oude borden blijven geldig) en de **nieuwe nummering** (bestanden "KB-AR 03-06-2024", bv. C31 = kampeerwagens, C32a/b = afslaan verboden). Alleen het huidige systeem is gedownload: de cursus/examens van 2026 volgen dat. De 2024-bestanden zijn bewust overgeslagen (anders zouden codes als C31, A8, A16, D8 een andere betekenis hebben). Namen komen uit Wikipedia NL "Verkeersborden in België - Serie A-F" (KB 1975) en zijn visueel vergeleken met het plaatje.

## Snelheden en varianten
- C43 (maximumsnelheid): `C43_20, _30, _50, _60, _70, _80, _90, _100, _110, _120` (alle gevraagde 30/50/70/90/120 aanwezig).
- C45 (einde snelheidsbeperking): enkel `C45_50` (generiek voor het type).
- C21 (massa): `C21_3, C21_5, C21_7`. C47 = tolpost (NL-versie "TOL").
- D1: `D1a` (rechtdoor), `D1b_links`/`D1b_rechts` (pijl), `D1c`/`D1d` (hindernis voorbij), `D1e`/`D1f` (afslaan). D4 in drie varianten.
- F1/F3 (oud model, afgeschaft 2015) plus F1a/b en F3a/b liggend/staand.

## Afgekeurd na visuele controle (verwijderd, in `AFGEKEURD` in het script)
- C21 (zonder getal, vreemde "5 t 5"), C21_5_5 (idem), C24 (dubbel/onbekend model), C43 en C45 zonder waarde (kleine duplicaten), C31d/C31g (kleine duplicaten van C31a/C31b), D1b (duplicaat van D1e), D2a/D2b/D2c/D3 (lichtblauwe varianten zonder bevestigde benaming), D4 (variant met "B"-plaatje), F33 (duplicaat), F51a/F51b, F52a/F52b, F59a/F59b, F34b2/F34c2 (duplicaten/alternatief formaat).
- Uitgesloten bij selectie: B0, B4 (douane), A15a, A50, C48 plain "road sign"-variant niet nodig (wel `C48` van "traffic sign"), E0a-d, D1 ld/lo/rb/rd/ro/ru, S1-S36 (spoorwegseinen, niet relevant voor B-theorie).
- Alle 2024-reeks bestanden (zie boven).

## Codes uit de opdracht die ontbreken
Dit zijn codes die niet bestaan in het huidige reglement (andere nummering/foute code in de lijst) of waarvoor Commons geen vrij bestand heeft:
- **Z-borden (Z1, Z3, Z5 ...)**: geen enkel Belgisch Z-bord gevonden op Commons (alleen `ZE1`/`ZF111` = zonebord varianten, niet opgenomen). Een tekenaar moet deze maken als ze nodig zijn.
- **B9a/b/c**: bestaan niet; B9 (voorrangsweg) is aanwezig.
- **C29a, C51, C53, C55, C57, C59**: bestaan niet in het reglement (C-reeks eindigt bij C49). C29 (hoogte) aanwezig.
- **C45 met 30/70/90/100**: enkel als 2024-bestand; in het huidige systeem is C45 generiek -> `C45_50` aanwezig als voorbeeld.
- **F10, F20, F22, F24, F26, F66, F68** en andere nummers uit de lijst die niet in KB 1975 staan: geen bord met die code op Commons; naastgelegen echte codes (F9, F11, F19, F21, F23a-d, F25, F27, F65, F67, F69) zijn aanwezig.
- **G1, G3, G5 ...**: de Belgische aanvullende panelen heten `GI ... GXII` (Romeins) en `M1 ... M24` (onderborden fiets). Die zijn opgenomen als `G...`/`M...`.
- **A-borden**: alles uit de lijst aanwezig (A1a-A51, ook A14). A45/A47 zijn Andreaskruisen.
- Niet beschikbaar maar niet essentieel: F2/F6 e.d. (bestaan niet), D8, D9-nieuwe varianten (enkel 2024).

Er ontbreken geen essentiële borden voor lessen 1-4 in het huidige systeem (voorrang, verbod, gebod, parkeren, aanwijzing, gevaar).

## Twijfelgevallen (`gecontroleerd:false`)
- B15, B15a-g (naamgeving voorrangssymbool onzeker), D1b_links/rechts, D6, D9/D9a/D9b/D10 (exacte benaming gedeeld/gescheiden pad), E9a (generiek), F1/F3 (oud model), F15, F46, F63_* (brandstofvarianten), F107/F109 (afgeschaft), M4/M5/M17/M18, alle G-panelen (naam = tekst op het paneel; officiele code in Romeins cijfer niet extern bevestigd).
Gebruik in de bordenquiz bij voorkeur `gecontroleerd:true`.

## Technische notities
- Alle SVG's zijn onbewerkt (originele Commons-bestanden); geen scripts of externe verwijzingen aangetroffen.
- Totale grootte ca. 9 MB (enkele SVG's zijn groot; eventueel later minifyen).
- Niet gecommit.
