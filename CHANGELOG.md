
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
- 


ØKTKJØRINGEN:
- Progressbar for hele økta er ferdig før siste øvelse er ferdig
- Ønsker en nedtellingstidtaker både for den enkelte øvelsen (også pausen) og også en nedtellingstidtager for hele økta.
- Når hele økta er ferdig kan "Avslutt og lagre"-knappen erstattes med en "Lagre"-knapp uten bekreftelse.
- knapper for skipping av øvelser. 

LOGG
- Mer fantastisk statistikk og grafer på progresjon
- Må kunne lagre og importere loggen, eventuelt lagre den i en sky.

SPØRSMÅL: HVOR lagres egentlig loggen og øktene jeg lagrer? Kan jeg lagre disse også i skyen?
