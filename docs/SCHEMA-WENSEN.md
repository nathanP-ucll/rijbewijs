
## Thema lichten (les 2, T15/T16)
- schema-lichten-3kleuren – driekleurig licht (rood boven, oranje midden, groen onder) met volgorde groen-oranje-rood-groen
- schema-lichten-knipperoranje – knipperend oranje licht, met voorrangsbord erbij (voorrang blijft)
- schema-lichten-pijlen – rood/oranje/groene pijlen en groene pijl naast rood; ontruimingspijl links
- schema-lichten-fiets – fietslicht, fietslicht met pijltjes, combinatie fiets-voetganger, knipperende oranje pijl met fietsje, opstelvak
- schema-lichten-voetgangers – rood stilstaand en groen stappend mannetje (met pijltjes-variant)
- schema-lichten-rijstrook – rood kruis, groene pijl naar onder, oranje schuine pijl boven drie rijstroken
- schema-lichten-kruispunt – kruispunt met lichten, auto op het kruispunt en rood licht rechts op de weg die hij neemt
- schema-bevoegde-persoon-stop – agent met arm rechtop
- schema-bevoegde-persoon-armen – agent met armen horizontaal, voertuigen voor/achter en opzij gemarkeerd
- schema-werfzeiger-schijf – werfopzichter/signaalgever met C3-schijf
- schema-rangorde-lichten – trap: bevoegde persoon > verkeerstekens (lichten/borden) > verkeersregels

## openbaar (worker OPEN)
- Regeltabellen hebben vrije kolomnamen (bv. licht/betekenis, voertuig/toegang); build moet kolomkoppen uit de sleutels afleiden.
- Kader type "gewest" gebruikt in openbaar-overweg-signalisatie; verwacht dat de build vlaanderen/wallonie/brussel toont.
- Afbeeldingen nodig: A41, A43, A45, A47, A49, D9, F17, F18, schoolvervoer-bord, schema-tramlichten, schema-tram-inhalen-rechts, schema-tramhalte-zonder-vluchtheuvel, schema-bob-dambordmarkering, schema-busstrook-onderbroken-streep, schema-busstrook-rechtsaf, schema-bus-verlaat-halte, schema-overweg-lichten, schema-overweg-file, schema-overweg-pech.

## techniek (worker TECH)
- SVG-set dashboardlampjes: één SVG per symbool (olie, rem, accu, koelvloeistof, airbag, motor, ABS, ESP, dieselfilter, bandenspanning, gloeibougie, grootlicht...) in site/img, met kleurvariant rood/oranje/groen/blauw; blokken verwijzen naar tech-dashboard-rood/oranje/groen-blauw (overzichtsplaten).
- Afbeeldingen gevraagd: tech-profielmeter, tech-bandenspanning-slijtage, tech-motorruimte, tech-keuring-tijdlijn, tech-uitrusting, tech-dashboard-kleuren, tech-zuinig-rijden, tech-euronorm, tech-lez-bord, tech-lez-kaart, tech-hybride-soorten.
- Regeltabellen in techniek.json gebruiken per blok eigen kolomnamen (bv. grootheid/waarde); renderer moet generiek kolommen uit de sleutels afleiden.
- Oefeningtype "koppel" met symboolafbeelding links (linksAfb) nodig voor lampjes -> betekenis; "hotspot" op dashboardfoto.
- Tijdgebonden regels (keuring 2026, LEZ-normen): veld "geldigVanaf"/"controleerOp" per blok om verouderde info te kunnen markeren.

## ongeval (worker ongeval)
- Regeltabellen hebben vrije kolomnamen per blok; graag in de UI de sleutels generiek renderen (eerste sleutel = rijkop).
- Blok mag meerdere curriculum-ids hebben (ongeval-hulpverlening-blijven: T34 + T35); build moet dat toestaan.
- Afbeeldingen die nog gemaakt moeten worden: schema-ongeval-stappenplan, schema-gevarendriehoek-afstand, schema-vier-stappen-eerste-hulp, schema-stabiele-zijligging, schema-reanimatie-aed, schema-aanrijdingsformulier.
- Wens: optioneel veld "geldigVanaf"/"geldigTot" bij kaders voor regels die na 1 juni 2027 wijzigen (nieuwe wegcode).

## kwetsbaar (worker KWET)
- Regeltabellen hebben vrije kolomnamen per blok (bv. "volgorde"/"deel van de weg", "bord"/"betekenis"); renderer moet kolomkoppen uit de sleutels van de eerste rij halen.
- Afbeeldingen die nog gemaakt moeten worden: schema-zebrapad, schema-voetgangerslichten, schema-fietsoversteekplaats, schema-afslaan-voetgangers, schema-dode-hoek, schema-zijdelingse-afstand, schema-portier, schema-fietspad, schema-rotonde-fiets, schema-opstelvak, schema-fietszone, schema-bromfietsklassen.
- Borden (SVG): A21, A23, A25, B1, B22, B23, C3, C15, D7, D9, D10, D11, D13, F4a, F12a, F12b, F49, F50, F50bis, F99a, F101a, F103, F105, F111, F113.
- Kader type "gewest" gebruikt voor de nieuwe codes (1 juni 2027) in blok inhalen-fietser-afstand.
- schema-rangorde-voorrang – trap: bevoegde persoon > verkeerslichten > borden > voorrang van rechts, met mini-icoontjes.
- schema-voorrang-rechts – kruispunt zonder borden, 3 auto's (onder, rechts, links), pijlen tonen voorrang van rechts.
- schema-uitrit-parkeerplaats – auto rijdt uit oprit/parkeerplaats/tankstation over trottoir/fietspad naar rijbaan; voetganger, fietser, auto op rijbaan met voorrangspijlen.
- schema-aardeweg – aardeweg mondt uit op verharde weg; auto op aardeweg wijkt voor verkeer op de verharde weg, ook van links.
- schema-tram-voorrang – kruispunt met tramspoor, tram en auto; pijl: tram heeft voorrang.
- schema-b1-b5-kruispunt – kruispunt, zijtak met B1 (variant B5); verkeer op de andere weg heeft voorrang.
- schema-voorrangsweg-b9-b11 – weg met B9 bij start, kruispunten, B11 bij einde; pijlen tonen voorrang.
- schema-t-kruispunt – T-kruispunt met 3 auto's; varianten zonder borden en met B1 op de zijtak.
- schema-rotonde – rotonde met D5, vier toegangen met B1; auto op ring heeft voorrang, oprijdende auto wijkt; rechter richtingaanwijzer bij afrit.
- schema-verkeersplein – rond plein zonder D5/B1/B5, auto's: voorrang van rechts.
- schema-rotonde-fietspad – rotonde met fietspad errond, haaientanden; auto verlaat rotonde, fietser op fietspad.
- schema-linksaf-tegenligger – kruispunt, auto A slaat links af, auto B komt tegen rechtdoor; B voorrang.
- schema-middenberm – weg met middenberm, auto wacht erop; smalle versus voldoende brede berm.
- schema-voorrangsvoertuig – ziekenwagen met blauw licht en sirene, auto's maken doorgang vrij.
- schema-bus-halte – bus aan halte met richtingaanwijzer, auto erachter vertraagt.

## Thema plaats + snelwegen (les 3, T23-T28)
- Regeltabellen hebben vrije kolomnamen per blok (bv. situatie/plaats, bord/betekenis); de UI moet kolomkoppen uit de sleutels afleiden.
- Kader type "letop" wordt ook gebruikt voor "toekomstige wijziging 1 juni 2027"; eventueel apart type "toekomst".
- Afbeeldingen schema's: schema-plaats-rechts-rijden, schema-rijstroken-bebouwde-kom, schema-fietspad-markering, schema-reddingsstrook-2, schema-reddingsstrook-3, schema-kruisen, schema-inhalen-links, schema-inhaalverbod-zicht, schema-richtingaanwijzers, schema-afslaan-rechts-links, schema-rijstrook-wisselen, schema-ritsen, schema-ritsen-twee-geblokkeerd, schema-parkeren-rijbaan, schema-parkeren-berm, schema-parkeerafstanden, schema-stilstaanverbod-zebrapad, schema-gele-streep, schema-parkeerstrook-markering, schema-parkeerschijf, schema-keren, schema-achteruitrijden, schema-voorsorteren, schema-snelweg-verboden, schema-oprit-snelweg, schema-snelweg-rijstroken, schema-pech-snelweg
- Borden: C35, C37, C39, C41, C43, E1, E3, E5, E7, E9a, E9b, E11, F5, F7, F9, F11, F13, F15, F17, F18, D7, D9, B1

## gedrag (worker GEDR)
- Regeltabellen hebben vrije kolomnamen per blok (bv. "snelheid (km/u)"/"reactieafstand (m)"); renderer moet kolomkoppen uit de sleutels afleiden, ook met haakjes en spaties.
- Afbeeldingen nodig: schema-alcohol-grenzen, schema-kinderzitje-regels, schema-lichten-overzicht (dimlicht/grootlicht/mist/parkeer), schema-stopafstand (reactie + remweg, snelheden 30-120), schema-volgafstand-2sec.
- Blok mag meerdere curriculum-ids hebben (gedrag-weer-mist: T33 + T32).
- Kader type "gewest" wordt ook gebruikt om "vanaf 1 juni 2027" te tonen; veld "geldigVanaf" per kader gewenst (zie ongeval).
- Oefentype "reken" nodig voor stopafstand/reactieafstand (tolerantie 0); "tabel" voor kinderzitje-regels.
