
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

REV07
DASHBOARD
- Tre-strekersmenyen (Hamburgermenyen) skal være i det øverste feltet, på linje med logoen, ikke under i dashboardmodulen. Tilstedeværelsen av denne menyknappen er dynamisk og skal kun komme som erstatning for de andre modulknappene når det ikke er plass til disse på skjermen appen vises på. Endringe må kanskje gjøres i index.html?
- Fjern overskriften "Dashboard". Det står jo allerede i menyen.

ØKTKJØRING (SESSION)
- Legg til en "Lagre"-knapp. Bekreftelse "Stoppe og lagre økta" dersom denne trykkes før økta er ferdig.
- Bedre nedtellingstidtaker.
- GJØR DENNE DELEN MER SEXY. DET ER JO TROSS ALT DENNE SOM ER MEST SYNLIG.

ØKTVELGER
- Gi favorittknappen en annen farge når den er valgt. Gjerne rosa.
- Legg inn en økt i koden
- "Fokusområde (alle)"-knappen skal være dropdown (som i dag) men inkludere alle verdier for fokusområde fra øvelser som ligger i øvelseslisten (under kolonnen focus_area)

EDITOR
I "Bygg økt"-feltet:
-   Tekstboksen for Øktnavn bredere enn selve feltet. Juster slik at teksboksen passer.
-   Bytt plass på Kategori-boksen og Fokusområde-boksen. La fokusområde-boksen se ut på samme måte som Kategori-boksen, dvs at "Fokusområde" står med grå skrift, og når man trykker på den kommer alternativene i dropdownmenyen (med alle verdier for fokusområde slik de er i øktbiblioteket) opp.
-   Drag/drop funksjonalitet for å endre rekkefølge på øvelser.
I "Legg til øvelse"-feltet:
- I dropdownmenyen til Lydnivå skal verdiene være i rekkefølgen Lavt-Medium-Høyt
- Bytt ut "RPE" med Intensitet overalt. Valgalternativene skal være Lav-Middels-Høy. Jeg endrer tilsvarende i CSV-filene.
- Tekstboksen for Navn og BEskrivelse er bredere enn selve feltet. Juster slik at teksboksene passer.
I "Filter øvelser"-feltet:
- I dropdownmenyen til "Lydnivå (alle)" skal verdiene være i rekkefølgen Lavt-Medium-Høyt
- Eksportere og importere per‑øvelse pause i exercices.CSV også (ekstra felt)
  
LOGG
- Progresjonsgrafen må angi verdi på antall minutter på loddrett akse. Den skaleres for god visuell presentasjon. De siste syv ukedager på den horisontale aksen angis i formatet "Ukedag DATO, eksempelvis "Onsdag 14.
- Sett inn klokkeslett for når økta ble kjørt før øktnavnet i loggfeltet.

REV08:
- Generelt: Jeg vil bytte ut knapper med tekst til fordel for knapper med ikoner. Like knapper skal ha like ikoner mellom de ulike modulene. De forskjellige ikonene må ha samme formuttrykk.
- Index:
-   Hamburgermenyen har veldig små streker når den vises på mobiltelefon/ipad. Kan du gjøre den mer mobilvennlig?
- Dashboard
-   Jeg ønsker "Start igjen" og "Start" knappene til å være et start-ikon, på samme høyde som Øktnavnet. Start-ikonet skal være en grønn pil (trekant) som peker til høyre. Dersom det ikke er plass til både øvelsesnavnet og pila (start-ikonet) på samme linje skal teksten brytes før pila (start-ikonet)
- Øktvelger
-   Jeg ønsker at knappene endres til ikoner. Start-knappen skal være lik som startknappen på Dashboard. Favorittknappen skal være en stjerne (uten tekst). Når den ikke er aktivert skal den ha svart ramme uten fyll. Når den er aktivert skal den ha svart ramme med gult fyll. Ikke endre annen funksjonalitet. Plasser stjernen etter "Slett"-knappen. Rediger-knappen skal ha blyant-ikon og slett-knappen skal ha et søppelspann-ikon. Alle ikoner skal ha samme stil. Tilpass størrelsen slik at den er omtrent som høyden til dagens knapper.
-   "Eksporter økter"-knappen virker ikke. "Importer økter"-knappen fungerer som den skal.
- Session
-   Erstatt teksten "Gjør deg klar"! og "Kjør!" med henholdsvis Neste: [Øvelsesnavn], og "Øvelse: [Øvelsesnavn]. Samme skriftstørrelse som det dagens "Gjør deg klar!" og "Kjør!" har.
-   La bakgrunnsfargen når øvelsen er i gang være grønn. I pausen kan den være grønn.
-   Jeg ønsker at knappene endres til ikoner. Start/pause-knappen skal være en start/pause-knapp, med samme uttrykk som startknappen på Dashboard. "Pauseknappen" skal være et pausesymbol, "Forrige" og "Neste" skal ha dobbel pil (trekant) ikon. Lagre-knappen skal ha diskett-ikon og Forkast-knappen skal ha søppelbøtte ikon. 
- Editor
-   Alle felt skal ha samme bredde. Feltbredden skal være dynamisk og tilpasses skjermen.
-   Tekstboksene for øktnavn og beskrivelse er fortsatt bredere enn feltet boksene er inni. Tilpass boksene slik at de får plass inni feltene de er inni.
-  I feltet "Bygg økt"
-    Legg til hjelpetekst under teksten "Bygg økt": "Bruk PLUSSIKON for å legge til øvelse". Endre rekkefølge med dra-og-slipp. Der jeg har skrevet PLUSSIKON legger du inn selve pluss-ikonet.
-   Ikke ha forhåndsutfylt verdi i fokusområde
-   Gi feilmelding dersom økt blir forsøkt lagret uten at alle verdier (Øktnavn, Fokusområde, Kategori og øvelser) er utfylt. Inkluder i feilmeldingen hvilke verdier som mangler.
-   Tydeliggjør at rekkefølgen på øvelser i økta kan endres ved å dra i dem.
-  I feltet "Legg til øvelse"
-     Endre tekst "Legg til øvelse" til "Lag/rediger øvelse".
-     Boksene "Varighet" og "Varighet pause" sidestilles
-     Boksene "Fokusområde" og "Kategori" sidestilles
-     Boksene "Intensitet" og "Lydnivå" sidestilles
-  I feltet "Øvelsesbibliotek"
-   "Eksporter øvelser"-knappen virker ikke. "Importer øvelser"-knappen fungerer som den skal.
-   I feltet med øvelseslista:
-     Endre teksten "Filter øvelser" til "Øvelser"
-     Endre knappene "Legg til i økt", "Rediger" og "Slett" til ikoner, henholdsvis med pluss-ikon, blyant-ikon og søppelbøtte-ikon, like som på resten av siden.
- Logg
-   Fjern overskriftene i feltene.
-   Endre datoformatet i stolpediagramet til å inkludere et punktum etter datoen, altså "Onsdag 14." istedet for "Onsdag 14)
-   Fjern ordet "Minutter" fra den loddrette aksen. Øk tekststørrelsen på tallene på den loddrette aksen for bedre synlighet (spesielt for telefonskjermer. Fjern antall minutter over stolpene.

XXXXX
Kjøring av REV08 med Copilot gikk ikke bra. Alt ble seende dritt ut. Jeg gav følgende prompt:
"Hva skjedde med designet her? Alt ble seende veldig basic ut. Alle rammene forsvant. Nesten alle fargene forsvant.
Gjør et forsøk på å løse oppgaven en gang til. Ta utgangspunkt i filene slik de var før mine forrige endringsønsker. Se bort fra mitt ønske om mobilvennlighet inntil videre. Gi meg eksempler på ikonsett jeg kan velge fra før implementering. Gi til slutt en komplett versjon av alle filer jeg skal gjøre endringer i."

Han gav meg en del ikonsett å velge mellom, men han satte også i gang med å lage nytt sett med filer, reversert en versjon. Så feilet kjøringen og jeg gav han promptet en gang til, med litt justering: "Noe veldig galt skjedde med utseendet her. Ta utgangspunkt i filene slik de var før mine forrige endringsønsker og gjør et forsøk på å løse oppgaven en gang til. Bruk ikonsett "Phosphor icons". Gi komplette versjon av alle filer jeg skal gjøre endringer i."

XXXXX

REV09:
Generelt: Alle søppelspann-ikon skal være røde.
INDEX: Legg til hamburgermeny dersom skjermen appen vises på er for liten til å ha knapper
DASHBOARD: Ingen endringer.
ØKTVELGER: Filterknappen for valg av tilgjengelig utstyr har forsvunnet. Legg denne inn på nytt med samme funksjonalitet som før.
SESSIONS:
- Feltene skal stables, dvs at listen over øvelser skal være under selve øktkjøringsfeltet. Rammen rundt Øktkjøringsfeltet skal være tykk grønn når øvelsen pågår, og normal når det er pause. Legg inn et "Ding" som lydsignal ved øvergang mellom øvelse og pause
EDITOR:
- Feltbreddene er fortsatt alt for brede. Dessuten har feltet for "Bygg økt", "Legg til øvelse" og "Øvelsesbibbliotek" mye større bredde enn feltet me "Filter øvelser". Juster feltbreddene slik at de er like brede, og dersom det ikke er plass til to felt i bredden (Slik som på en mobiltelefon) skal feltene stables.
- I "Bygg økt"-feltet skal "Fjern"-knappen erstattes med søppelkasse-ikonet. Videre skal pilen som indikerer at øvelsen kan flyttes være tydeligere og flyttes til lengst til høyre på høyde med øvelsesnavnet. "Lagre-økt" boksen skal erstattes med diskett-ikon.
- "Legg til øvelse"-feltet skal de seks egenskapene (Varighet, Varighet pause, Fokusområde, Kategori, Intensitet og lydnivå) stå i to kolonner og på tre rader, istedetfor at alle står i en kolonne og seks rader. Feltet for inntasting av utstyr er borte, legg denne inn på nytt. Legg denne inn på nytt med samme funksjonalitet som før dvs at når man står i boksen skal alle verdier av utstyr som finnes i øvelseslista kunne velges.
- I "Filter øvelser" feltet har filterknappen for valg av tilgjengelig utstyr har forsvunnet. Legg denne inn på nytt med samme funksjonalitet som før.
LOGG:
- Det forsvant en del gøy statistikk fra loggen i forrige revisjon, for eksempel Streak og Beste dag (med varighet og dato) Legg inn dette på nytt.
- Teksten "Minutter" legger seg oppå verdiene på den loddrette aksen på stolpediagrammet. Dette gjør det vanskelig å lese. Endre dette.

REV10 - Vi er back on track
INDEX
- Juster plasseringen av burgermenyikonet. Denne skal stå til høyre på skjermen.
- La logen også være en hyperlink til Dashboardmodulen.
EDITOR:
- Feltbreddene for "Bygg økt", "Legg til øvelse" og "Øvelsesbibbliotek" fortsatt større  enn feltet med "Filter øvelser". Juster feltbreddene slik at de er like brede. Behold stablefunksjonalitet dersom det ikke er plass til to felt i bredden (Slik som på en mobiltelefon) som den er.
- I "Bygg økt"-feltet: Fjern den forhåndsdefinerte verdien fra boksen "Fokusområde".
SESSION:
- Progressbar og timer for hele økta resettes når man skipper mellom øvelser. Dette må endres. Progressbar og timer må gjenspeile hvor mye tid som gjenstår dersom resten av økta går uavbrutt.
- Jeg vil endre på teksten Neste/Øvelse: [Øktnavn]. Fonten skal være tre ganger så stor. Linjeskift etter Neste/Øvelse. Øvelsesnavn i fet skrift.
- Det er ingen Ding (lyd) når jeg kjører økta på mobilen.
LOGG:
- Formatet på tid for snitt per dag skal være mm:ss uten desimaler.
- Fjern teksten "minutter" på Y-aksen.

REV11
Index.html: Jeg har lagt inn følgende kode i <head> for å få inn favicon i appen: 

--------------------
--------------------
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Styrketreningsapp</title>
  <link rel="stylesheet" href="style.css"/>

  <!-- Favicon linker -->
<link rel="icon" type="image/png" href="assets/favicon/favicon-96x96.png" sizes="96x96" />
<link rel="icon" type="image/svg+xml" href="assets/favicon/favicon.svg" />
<link rel="shortcut icon" href="assets/favicon/favicon.ico" />
<link rel="apple-touch-icon" sizes="180x180" href="assets/favicon/apple-touch-icon.png" />
<meta name="apple-mobile-web-app-title" content="Styrke" />
<link rel="manifest" href="assets/favicon/site.webmanifest" />

</head>
<body>
--------------------
--------------------

SESSION:
- Gi feilmelding dersom man prøver å navigere seg bort fra modulen før den er ferdig (Det skal ikke være mulig å navigere seg bort uten å ha lagret eller forkastet økta først): "Økt kjører. Avslutt økta først."
- Jeg liker den grønne ramma når øvelsen er i gang. Jeg ønsker også at øvelsesfeltet har bakgrunnsfarge lik som rammen men med 80% gjennomsiktighet. Jeg ønsker den samme for pausene, bare med gul-oransj farge. Knappene for start, forrige, neste, lagre og slett skal ikke ha bakgrunnsfarge. Heller ikke feltene for nedtellingstidtakerene.
- Jeg ønsker mye høyere lyd i faseoverganger, og gjerne en lyd som høres ut som en bjelle. Det er vikrigere at dette fungerer på en mobil enn på PCen.
- Skriftstørrelser:
-   Reduser skriftstørrelse på "Neste" og "Øvelse" til en tredjedel.
-   Øk skriftstørrelsen på beskrivelsen av økta til det doble

EDITOR 
I "Bygg økt" feltet
- Etter teksten "Ingen øvelser i økta ennå": Skriv "Legg til med [PLUSS-IKON] i øvelseslista". Der jeg har skrevet [PLUSS-IKON] skal du sette inn selve ikonet. Juster størrelsen på ikonet slik at det passer med teksten.
- Flytt søppelspann-ikonet opp på høyde med boksene for tid og varighet. Det skal stå til høyre disse.
- Legg til en knapp under siste øvelse som kopierer hele serien av øvelsene som  er lagt til, og legger dem til på nytt under, som en ny serie.
ENDRINGER I LOGG
- Loggen skal angi den faktiske tida som er brukt i øvelsen. Nå logges økte bare med den teoretiske varigheten uavhengig om man har skippa alle øvelsene, avbrutt økta, eller gjort øvelser på nytt. Statistikken gjenspeiler det samme.

REV12
LOGG:
- Fjern overskriftene "Statistikk", "Progresjon (7 dager)" og "Logg (per dag)"
- Legg inn Mulighet for eksport og import, slik som økter og øvelser, i feltet for dagslogger. Legg den øverst. Filnavn for eksport: [dato]_logg. [dato] skal være i formatet ååmmdd.
- Jeg vil at der alle dagens økter er logget skal også varighet av disse stå. Det skal stå på samme linje som dagen det gjelder, lengst til høyre i feltet.
- TCX-fila skal kodes som dette eksempelet:
-   <?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase
  xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd"
  xmlns:ns5="http://www.garmin.com/xmlschemas/ActivityGoals/v1"
  xmlns:ns3="http://www.garmin.com/xmlschemas/ActivityExtension/v2"
  xmlns:ns2="http://www.garmin.com/xmlschemas/UserProfile/v2"
  xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ns4="http://www.garmin.com/xmlschemas/ProfileExtension/v1">
  <Activities>
    <Activity Sport="Other">
      <Id>2026-01-20T13:00:14.000Z</Id>
      <Lap StartTime="2026-01-20T13:00:14.000Z">
        <TotalTimeSeconds>606.694</TotalTimeSeconds>
        <DistanceMeters>0.0</DistanceMeters>
        <Calories>39</Calories>
        <AverageHeartRateBpm>
          <Value>75</Value>
        </AverageHeartRateBpm>
        <MaximumHeartRateBpm>
          <Value>107</Value>
        </MaximumHeartRateBpm>
        <Intensity>Active</Intensity>
        <TriggerMethod>Manual</TriggerMethod>
        <Track>
          <Trackpoint>
            <Time>2026-01-20T13:00:14.000Z</Time>
            <DistanceMeters>0.0</DistanceMeters>
            <HeartRateBpm>
              <Value>61</Value>
            </HeartRateBpm>
            <Extensions>
              <ns3:TPX/>
            </Extensions>
          </Trackpoint>
 
 [...]
          <Trackpoint>
            <Time>2026-01-20T13:28:03.000Z</Time>
            <DistanceMeters>0.0</DistanceMeters>
            <HeartRateBpm>
              <Value>69</Value>
            </HeartRateBpm>
            <Extensions>
              <ns3:TPX/>
            </Extensions>
          </Trackpoint>
        </Track>
        <Extensions>
          <ns3:LX/>
        </Extensions>
      </Lap>
      <Creator xsi:type="Device_t">
        <Name>Styrketreningsapp</Name>
        <UnitId>3477229470</UnitId>
        <ProductID>4376</ProductID>
        <Version>
          <VersionMajor>23</VersionMajor>
          <VersionMinor>48</VersionMinor>
          <BuildMajor>0</BuildMajor>
          <BuildMinor>0</BuildMinor>
        </Version>
      </Creator>
    </Activity>
  </Activities>
  <Author xsi:type="Application_t">
    <Name>Connect Api</Name>
    <Build>
      <Version>
        <VersionMajor>25</VersionMajor>
        <VersionMinor>24</VersionMinor>
        <BuildMajor>0</BuildMajor>
        <BuildMinor>0</BuildMinor>
      </Version>
    </Build>
    <LangID>en</LangID>
    <PartNumber>006-D2449-00</PartNumber>
  </Author>
</TrainingCenterDatabase>

- Mulighet for å slette øvelser som er logget (Søppelspann) 
SESSION
- Justere skriftstørrelser?
- Legge inn en markør midt på progressbar for øvelsen, for å vite når man er halvvegs i øvelsen (relevant dersom mena skal bytte fot halvvegs).

ETTERJUSTERING AV REV12 DA DEN IKKE GIKK 100%:


REVXX
NY MODUL!
Intervalltidtakar. Predefinerte intervaller (6x6, 30x45/15 etc). Også mulighet for å sette noko opp on the fly på få sekunder. Lagre nye timere, etc.

GENERELT:
- Rette opp skrivefeil her og der
- Teit navn. Trenger nytt og bedre navn.
- Begrepsopprydning. Store bokstaver der det mangler. Puss.
- Legge inn en del standardøvelser og økter i selve programmet
- Mer spenstig design? Logo, fonter farger linjer og bokser. Annen layout? (be om å oppdatere style.css)
- Føy til tips om fullskjerm (Skjul verktøylinje for fullskjermmodus i landskap på telefon/pad for å maksimere skjermareal).
- Rollover med humoristisk tekst, trenings og eller triatlonrelatert. Evt motiverande sitat frå gamle trenarar og idrettshelter ruller over skjermen nederst på dashboard (feks). Kanskje begge men på ulike steder i appen. (Motiverende tekst på dashboard, og humor i logg.
EDITOR
- Omdøpe "Øvelser" til "Øvelsesfilter"? Omdøpe "Øvelsesbibliotek" til Importer/Eksporter Øvelsesbibliotek.
- Mulighet for å minimere Lag/rediger øvelse.
README
Lage ny README med bruksanvinsning og/eller FAQ 
- Always on display funker ikke enda
- Lag fullskjerm selv
- Legg til på hjem skjerm
- Forklaring eksportfunksjon
- Forklaring på hvordan verdier du kan sortere på må være lagt inn i øvelser og økter.  
- Forslag på kategorier av økter, og øvelser. Det er ikkje sikkert det ska være det samme. Kan ha fleire kategorier av øvelser i ei økt. Kanskje kontorstyrke,  svømmestyrke, løpsstyrke, plyo, yoga 🧘 (?!) kqn være kurante øktkategorier?
- Muskelgrupper kan være kurante fokusområder

EDITOR:
Mulighet til å legge inn flere sett. Kopieringsfunksjon av øvelser og hele sett og mulighet for å legge inn seriepause.
I øktbyggeren kommer ikke alle alternativer for kategori opp (pga plassmangel) når kategori skal skrives inn. Dette åpner for muligheten til å bruke forskjellige begreper til det som egentlig skulle vært sortert under samme kategori. Dette gir utfordringer når man skal sortere på øvelser når økter skal settes sammen. Eksempel: MAn kan lagre spensthopp og burpees under både "Spenst" og "plyo", men man mener egentlig det samme. (Gjelder spesielt dersom det er flere brukere.
SESSION:
Rakett 🚀, fyrverkeri og/eller motivasjonstekst (Bra jobba!) når økta er ferdig? (Nå står det jo for så vidt "Ferdig!" som kan være motiverende nok i seg selv.

Be Copilot lage et master-prompt

Videre arbeid:
- Tilkobling pulsbelte
- Skylagring av økter/Øvelser/Logg?
- Forhåndsdefinerte kategorier?
- Ha appen i skya slik at økter, øvelser og favoritter er felles mellom pc/tablet/tlf. (Kan vel ikke ha telefonlagring)
- Ulempe: Må være på nett for å kjøre økt fra github/lsok.
- SPØRSMÅL: HVOR lagres egentlig loggen og øktene jeg lagrer? Kan jeg lagre disse også i skyen?
- Skjerm kan ikkje gå i svart 
