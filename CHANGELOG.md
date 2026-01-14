
# Endringslogg
- v0.1.0: Grunnstruktur og eksempler.

Endringer i funksjonalitet og bugfixes som prompt til neste iterasjon

REV01
ØKTVELGER
- Det skjer en feil med beskrivelsen når øvelsene importeres. Der beskrivelsen av øvelsen inneholder komma så tolker programmet det som at beskrivelsen er ferdig. Jeg vil at CSV-filene som appen bruker skal være semikolondelt.
- I øktvelger-modulen skal man kunne velge så mange favoritter man vil
- Øktvelgeren må kunne sortere på hvilket utstyr jeg har tilgjengelig.
- Eksport økter støtter tydeligvis ikke Æ, Ø eller Å. Må fikses.
- Import- og eksportfunksjonen for øvelser flyttes til editor-modulen.

EDITOR
- Jeg ønsker at import- og eksportfunksjon av øvelser er i Editor-modulen. Jeg ønsker også mulighet for å kunne lage nye øvelser direkte i appen også. Lag et felt over listen over alle øvelsene, med lik utforming som den som bygger økta.
- Jeg ønsker ikke ha progresjonstips som egen kolonne. Dette skal inkluderes i beskrivelsesteksten til øvelsen.
- Fjerne tekst "Kolonner (øvelser): exercise_id,name,description,progression_tips,default_duration_sec,rpe,category,focus_area,equipment, etc" i feltet for "Importer øvelser (CSV) og økter (CSV)".
- Det går ikke an å bruke mellomromstasten i øktnavn i editor.

REV02
ØKTVELGER
- Utstyrsfilteret: Fjern boksen for "Nei". Fjern boksen for "Vis kun økter som passer for valgt utstyr". Listen over øvelser under "Filtrer og velg økt" skal til enhver tid bare vise øvelser som enten ikke krever utstyr eller der utstyret som kreves er avmerket. Dersom nytt utstyr blir tatt med når man lager en ny øvelse i Editor må dette utstyret komme med i filteret.
- Det må gå an å slette økter.

EDITOR
- Editormodulen består av fire felter, "Øvelsesbibliotek" med Import/Eksport-funksjon, "Legg til ny øvelse", "Filter øvelser" og "Bygg økt".
-   "Filter øvelser"- feltet skal være til venstre på siden. Filteret må inkludere Utstyr, RPE og støynivå i tillegg til kategori og fokusområde. Man skal kunne huke av for alle typer utstyr som finnes i øvelsesbiblioteket. Det skal også være et søkefelt som søker i navn og beskrivelse.
-   Til høyre i editor-modulen skal "Bygg økt" være øverst, under denne kommer "Legg til øvelse", og nederst i høyre kolonne kommer "Øvelsesbibliotek" med import/eksport-funksjon
- "Legg til øvelse"-feltet skal ikke ha forhåndsutfylte tekstbokser slik som Styrke/spenst (Her skal det heller stå "Kategori" i grått, slik som i "Navn" og "Beskrivelse" tekstboksene. Utstyrsteksboksen må gi en drop-down meny der du kan velge utstyr som finnes fra før, men man skal også kunne fylle inn nytt utstyr.
- Spesifikk varighet på en øvelse, slik den er definert i øvelsesbiblioteket, skal brukes. Standard varighet på 1 minutt brukes bare der spesifikk varighet mangler.
- Det må gå an å slette øvelser

REV03
ØKTVELGER
- Utstyrsfilteret: Fjern boksen for "Nei". JEg har fjernet "Nei" som utstyr i øvelseslista for å unngå forvirring.
- Legg nye økter øverst i lista

EDITOR
-   Legg nye øvelser øverst i lista
-   Knappen for å slette en øvelse skal virke på selve øvelsen i øvelsesoversikten. Slik den virker nå sletter den bare en øvelse i en økt som er under utarbeidelse.
-   Filter for RPE og lyd skal være en drop-down, der henholdsvis REP og Lydnivå står med grå skrift før verdi er valgt (for at brukeren skal forstå hva han filtrerer på). Verdiene i drop-down menyene skal være de samme som ligger i øvelsesbiblioteket.

REV04
ØKTVELGER
-  Filteret for "Utstyr jeg har tilgjengelig" fungerer ikkje særlig bra. Bytt ut check-boksene med en dropdown meny med flervalgsmulighet (der check-boksen slik den fungerer nå er i dropdownmenyen). "Velg alle" skal være ett av alternativene i dropdownmenyen.
-   Under "Filtrer og velg økter" Må man finne igjen alle kategorier som finnes i øktene som er laget. Dersom man for eksempel har laget en økt og definert kategorien "Kontorstyrke" i editoren skal man også kunne finne igjen denne kategorien i dette filteret i øktvelgeren.
-   La boksene for Import og Eksport av økter ligge ved siden av hverandre under filvelgerknappen istedet for stablet på høyre siden.

EDITOR
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

REV05
ØKTVELGER
- "Importer/eksporter økter (CSV)" feltet skal være nederst
- "Tilgjengelig utstyr" trenger ikke ha et eget felt. "Tilgjengelig utstyr"-filterknappen kan være under "Fokusområde"-knappen og "Kategori"-knappen under "Filtrer og velg økter"-feltet.
- Det skal  være et søkefelt som søker i navn
- Jeg ønsker å ha en del predefinerte økter i programmet, som man ikke trenger å importere før man kan ta appen i bruk. Legg inn et område i koden der jeg kan lime inn økter fra en CSV-fil. Jeg ser at økter programmet eksporterer bruker exercise_id for å identifisere øvelser som skal være med i økta. Hvilke implikasjoner kan man få og hvordan kan disse løses? Jeg ønsker også å ha predefinerte øvelser i "Editoren" og disse kan godt samsvare med exercise_id-ene som bruker i de predefinerte øktene.

EDITOR
- Jeg ønsker at feltene bytter side, dvs at felt for #Bygg økt", "Legg til øvelse" og "Øvelsesbibliotek" er til venstre, mens felt for "Filter øvelser" er til høyre.
- Endringer i "Bygg økt" feltet
-   Legg inn mulighet til å sette varighet på pausene mellom øvelsene. Når økta kjører er det denne pauseverdien som gjelder
- Endringer i "Legg til øvelse"-feltet:
-   Boksen for RPE skal ligne på "Kategori"-boksen. Det skal stå "RPE" i grått men det skal bare kunne velges verdier som angitt under rpe i øvelsesbiblioteket, Lav, Medium eller Høy.
-   Boksen for tid skal fungere som i dag, men det skal stå "Varighet (s)"
-   Boksen for Lydnivå skal stå over "Tilgjengelig utstyr".
- Endringer i "Filter øvelser"-feltet:
-   Jeg ønsker som nevnt å ha predefinerte øvelser i "Editoren" og disse kan godt samsvare med exercise_id-ene som bruker i de predefinerte øktene.
-   "Slett øvelse"-knappen som står på hver øvelse i øvelseslista skal slette selve øvelsen som knappen er på, på samme måte som at rediger-knappen redigerer øvelsen knappen står på.

ØKTKJØRINGEN:
- Øktnavn og beskrivelse av neste økt må stå under "Gjør deg klar!" mens pausen pågår.
- Ønsker en nedtellingstidtaker både for den enkelte øvelsen (også pausen) og også en nedtellingstidtager for hele økta.
- Når hele økta er ferdig kan "Avslutt og lagre"-knappen erstattes med en "Lagre"-knapp uten bekreftelse.
- Jeg vil ha knapper for skipping av øvelser. Man skal kunne bruke piltaster for dette som før. Start/Pause skal også aktiveres med "Enter"-tasten i tillegg til mellomromstasten.
- Automatisk start når Startknapp i Øktvelger eller Dashboard trykkes.

REV06
EDITOR:
- I "Bygg økt"-feltet
-   Tekstboksen for Øktnavn bredere enn selve feltet. La den ha like stor avstand til rammen av feltet som de andre boksene.
-   Fjern pausefeltet der det er nå. Jeg ønsker å kunne legge inn pause per øvelse. Skriv "Varighet (mm:ss)" med liten grå skrift over varighet-feltet, og "Pause (s)", med liten grå skrift over et pause-felt ved siden av. Grå, forhåndsutfylt verdi på 10.
- I "Legg til øvelse"-feltet
-   Tekstboksen for Navn bredere enn selve feltet. La den ha like stor avstand til rammen av feltet som de andre boksene.
-   Legg til "Varighet pause" ved siden av boks for varighet øvelse med samme design og funksjon som denne. Default verdi på denne om ingenting fylles inn skal være 10 sekund.
-   Rekkefølgen på etterfølgede bokser er: Fokusområde og Kategori på neste linje, og RPE og Lydnivå på neste. Tilgjengelig utstyr kommer til slutt i feltet slik som nå. Boksen lydnivå skal fungere som RPE, dvs uten fritekstmulighet men bare valg mellom verdier som finnes i øvelsesbiblioteket.
- I "Filter øvelser"-feltet må den grå teksten under filterknappen (der det står "kun kroppsvekt") gjenspeile hvilet utstyr det er huket av på. Nå står det alltid "kun kroppsvekt", selv om det er huket av for utstyr, og dette er feil. "Tilgjengelig utstyr"-knappen i "Legg til øvelse"-feltet fungerer som den skal og kan brukes som mal.
- Jeg vil ikke ha automatisk utfylt verdi på rpe, lydnivå og fokusområde dersom disse verdiene ikke blir angitt når øvelsen lages. Gi feilmelding på hva som mangler dersom Navn, Beskrivelse, rpe, Kategori, Fokusområde og/eller Lydnivå mangler.

DASHBOARD:
- På mobilversjonen er det ikke plass til knapper for alle modulene. Ønsker i slike tilfeller at alle knappene samles i en menyknapp (sånn med tre streker)
- Jeg ønsker at alle økter som er merket som favoritt i øktvelger-modulen vises. Antall av siste økter som vises er tre.
- Autostart av økt når man trykker start økt.

ØKTKJØRING:
- Tekst på startknappen skal være "Pause" når økta er i gang, og "Gjenoppta" når økta er pausa. Legg inn lite grå tekst om at Enter/mellomromstast pauser/gjenopptar økta og at piltaster veksler mellom øvelser.

LOGG
- Jeg vil ha mer statistikk og grafer på progresjon. Gjerne presentert som stolpediagram per dag de siste syv dager. Kom med forslag på hvordan dette kan se ut. Det skal være motiverende.
- 
-------------------------
REVXX
GENERELT:
- Teit navn. Trenger nytt og bedre navn.
- Begrepsopprydning. Store bokstaver der det mangler. Puss.
- Legge inn en del standardøvelser og økter i selve programmet
- Mer spenstig design? Logo, fonter farger linjer og bokser. Annen layout?
- Føy til tips om fullskjerm (Skjul verktøylinje for fullskjermmodus i landskap på telefon/pad for å maksimere skjermareal).
- Rollover med humoristisk tekst, trenings og eller triatlonrelatert.


SPØRSMÅL: HVOR lagres egentlig loggen og øktene jeg lagrer? Kan jeg lagre disse også i skyen?
