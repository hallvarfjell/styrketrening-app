
# Endringslogg
- v0.1.0: Grunnstruktur og eksempler.

Endringer i funksjonalitet og bugfixes som prompt til neste iterasjon
GENERELT:
- Teit navn. Trenger nytt og bedre navn.
- Mer spenstig design? Logo, fonter farger linjer og bokser. Annen layout?
- Føy til tips om fullskjerm (Skjul verktøylinje for fullskjermmodus i landskap på telefon/pad for å maksimere skjermareal).

DASHBOARD:
- På mobilversjonen er det ikke plass til knapper for alle modulene. Ønsker at disse samles i en menyknapp (sånn med tre streker)
- Jeg ønsker at alle økter som er merket som favoritt i øktvelger-modulen vises. Antall av siste økter som vises er tre.


ØKTVELGER
- Det skjer en feil med beskrivelsen når øvelsene importeres. Der beskrivelsen av øvelsen inneholder komma så tolker programmet det som at beskrivelsen er ferdig. Jeg vil at CSV-filene som appen bruker skal være semikolondelt.
- I øktvelger-modulen skal man kunne velge så mange favoritter man vil
- Øktvelgeren må kunne sortere på hvilket utstyr jeg har tilgjengelig.
- Eksport økter støtter tydeligvis ikke Æ, Ø eller Å. Må fikses.
- Import- og eksportfunksjonen for øvelser flyttes til editor-modulen.

- REV02
- Utstyrsfilteret: Fjern boksen for "Nei". Fjern boksen for "Vis kun økter som passer for valgt utstyr". Listen over øvelser under "Filtrer og velg økt" skal til enhver tid bare vise øvelser som enten ikke krever utstyr eller der utstyret som kreves er avmerket. Dersom nytt utstyr blir tatt med når man lager en ny øvelse i Editor må dette utstyret komme med i filteret.
- Det må gå an å slette økter.

- REV03
- Utstyrsfilteret: Fjern boksen for "Nei". JEg har fjernet "Nei" som utstyr i øvelseslista for å unngå forvirring.
- Legg nye økter øverst i lista

- REV04:
-  Filteret for "Utstyr jeg har tilgjengelig" fungerer ikkje særlig bra. Bytt ut check-boksene med en dropdown meny med flervalgsmulighet (der check-boksen slik den fungerer nå er i dropdownmenyen). "Velg alle" skal være ett av alternativene i dropdownmenyen.
-   Under "Filtrer og velg økter" Må man finne igjen alle kategorier som finnes i øktene som er laget. Dersom man for eksempel har laget en økt og definert kategorien "Kontorstyrke" i editoren skal man også kunne finne igjen denne kategorien i dette filteret i øktvelgeren.
-   La boksene for Import og Eksport av økter ligge ved siden av hverandre under filvelgerknappen istedet for stablet på høyre siden.

EDITOR
- Jeg ønsker at import- og eksportfunksjon av øvelser er i Editor-modulen. Jeg ønsker også mulighet for å kunne lage nye øvelser direkte i appen også. Lag et felt over listen over alle øvelsene, med lik utforming som den som bygger økta.
- Jeg ønsker ikke ha progresjonstips som egen kolonne. Dette skal inkluderes i beskrivelsesteksten til øvelsen.
- Fjerne tekst "Kolonner (øvelser): exercise_id,name,description,progression_tips,default_duration_sec,rpe,category,focus_area,equipment, etc" i feltet for "Importer øvelser (CSV) og økter (CSV)".
- Det går ikke an å bruke mellomromstasten i øktnavn i editor.
-
-  REV02:
- Editormodulen består av fire felter, "Øvelsesbibliotek" med Import/Eksport-funksjon, "Legg til ny øvelse", "Filter øvelser" og "Bygg økt".
-   "Filter øvelser"- feltet skal være til venstre på siden. Filteret må inkludere Utstyr, RPE og støynivå i tillegg til kategori og fokusområde. Man skal kunne huke av for alle typer utstyr som finnes i øvelsesbiblioteket. Det skal også være et søkefelt som søker i navn og beskrivelse.
-   Til høyre i editor-modulen skal "Bygg økt" være øverst, under denne kommer "Legg til øvelse", og nederst i høyre kolonne kommer "Øvelsesbibliotek" med import/eksport-funksjon
- "Legg til øvelse"-feltet skal ikke ha forhåndsutfylte tekstbokser slik som Styrke/spenst (Her skal det heller stå "Kategori" i grått, slik som i "Navn" og "Beskrivelse" tekstboksene. Utstyrsteksboksen må gi en drop-down meny der du kan velge utstyr som finnes fra før, men man skal også kunne fylle inn nytt utstyr.
- Spesifikk varighet på en øvelse, slik den er definert i øvelsesbiblioteket, skal brukes. Standard varighet på 1 minutt brukes bare der spesifikk varighet mangler.
- Det må gå an å slette øvelser

- Rev03:
-   Legg nye øvelser øverst i lista
-   Knappen for å slette en øvelse skal virke på selve øvelsen i øvelsesoversikten. Slik den virker nå sletter den bare en øvelse i en økt som er under utarbeidelse.
-   Filter for RPE og lyd skal være en drop-down, der henholdsvis REP og Lydnivå står med grå skrift før verdi er valgt (for at brukeren skal forstå hva han filtrerer på). Verdiene i drop-down menyene skal være de samme som ligger i øvelsesbiblioteket.

-   Rev04:
-  Endringer på "Filter øvelser"-feltet:
-    Jeg vil at alle filter skal være slik som "Fokusområde", dvs en dropdown-meny med alternativer. Dersom filterboksen ikke benyttes skal filternavn og (alle) stå, slik som "Fokus (alle). Verdier for alternativene skal hentes fra øvelseslista (for RPE betyr dette Lett, moderat og hardt og for lydnivå betyr dette Lavt, medium, høyt). Det betyr også at dersom det for eksempel blir lagt til en ny kategori (enten ved import eller ved inntasting i "Legg til øvelse" feltet) skal denne kategorien også kunne filtreres på i dropdown-menyen for kategori. Det samme gjelder for Lydnivå, dersom en øvelse har lydnivå "stille". Filter for RPE må kunne akseptere Tekst. Nå leser den tilsynelatende bare tall. Filter for lydnivå fungerer bra.
-    Filter for RPE og Lydnivå flyttes opp til å ligge under Fokusområde-filteret og Kategori-filteret.
-    Filteret for "Utstyr jeg har tilgjengelig" fungerer ikkje særlig bra. Bytt ut check-boksene med en dropdown meny med flervalgsmulighet. "Velg alle" skal være ett av alternativene i dropdownmenyen. Selve filtreringen fungerer heller ikke. Dersom utstyr ikke er avmerket skal heller ikke øvelsen der dette utstyret er nødvendig vise. Dersom ingen boks er avmerket er det bare kroppsvektøvelser som skal vise. Vis teksten "Tilgjengelig utstyr" på knappen. Dersom intet utstyr er markert: Skriv "kun kroppsvekt" med diskret tekst under. Dersom noe utstyr er valgt skriv navnet på utstyret som er valgt med diskret tekst under, og ikke "kun kroppsvekt"
-    Søkefeltet (Søk (navn/beskrivelse) fungerer bra. Plasser dette under alle dropdown-filtrene (før øvelseslisten)

-   Øvelseslisten:
-     Jeg vil ha en redigeringsknapp på hver øvelse. Ved trykk sendes øvelsen til "Legg til øvelse"-feltet slik at jeg kan redigere øvelsen der.
-     "Slett øvelse" knappen skal slette øvelsen i selve øvelseslista, ikke økten som er under utarbeidelse i "Bygg økt" feltet.
- Endringer i "Bygg økt"-feltet:
-   Kategoriboksen: Skal ikke ha predefinert Styrke/Spenst som nå. Her skal det stå Kategori. Denne skal være dropdown med verdier fra øvelser som ligger i øvelseslisten, men det skal også være mulig å skrive inn en ny kategori.
- Endringer i "Legg til øvelse"-feltet
-   Boks for varighet: Skriv "60 sekund" istedet for "Default varighet (sek), men behold farge.
-   Boks for RPE. Må være dropdown med alternativene Lav, Medium og Høy. Skriv "RPE (medium) med samme grå skrift og la øvelsen få RPE=medium dersom ingen verdi blir valgt.
-   Boks for kategori. Denne skal være dropdown men det skal også være mulig å skrive inn en ny kategori. La teksten som står i tekstboksen være som nå.
-   Boks for Fokusområde: Må være dropdown med alternativene som allerede finnes i øvelseslista. Typiske verdier, som det er per nå er "Hele kroppen", "Overkropp" og "Underkropp". Det skal også være mulig å skrive inn andre verdier, som for eksempel "Skuldre", "Armer", "Legg", etc. Skriv "Fokusområde" med grå skrift når knappen ikke er brukt
-   Boks for utstyr. Må være dropdown med alternativene som allerede finnes i øvelseslista. Det skal også være mulig å skrive inn andre verdier. Skriv "Kun kroppsvekt" med grå skrift når knappen ikke er brukt. Ikke skriv noe på utstyr dersom denne boksen ikke fylles ut.
-   Boks for støynivå. Må være dropdown med alternativene som allerede finnes i øvelseslista. Det skal også være mulig å skrive inn andre verdier. Skriv "Lydnivå" med grå skrift når knappen ikke er brukt. Ikke skriv noe på utstyr dersom denne boksen ikke fylles ut.
- Endringer i "Øvelsesbibliotek"-feltet:
-   La boksene for Import og Eksport av økter ligge ved siden av hverandre under filvelgerknappen istedet for stablet på høyre siden.

ØKTKJØRINGEN:
- Progressbar for hele økta er ferdig før siste øvelse er ferdig
- Ønsker en nedtellingstidtaker både for den enkelte øvelsen (også pausen) og også en nedtellingstidtager for hele økta.
- Når hele økta er ferdig kan "Avslutt og lagre"-knappen erstattes med en "Lagre"-knapp uten bekreftelse.
- knapper for skipping av øvelser.
- På telefonen stopper økta plutselig midt i en øvelse (progressbaren) og lar seg ikke starte igjen. Tida har likevel fortsatt å telle når man ser tidsforbruket i loggen.
- Automatisk start når Startknapp i Øktvelger eller Dashboard trykkes.

LOGG
- Mer fantastisk statistikk og grafer på progresjon
- Må kunne lagre og importere loggen, eventuelt lagre den i en sky.

SPØRSMÅL: HVOR lagres egentlig loggen og øktene jeg lagrer? Kan jeg lagre disse også i skyen?
