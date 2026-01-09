
# Endringslogg
- v0.1.0: Grunnstruktur og eksempler.

Endringer i funksjonalitet og bugfixes som prompt til neste iterasjon
GENERELT:
- Teit navn. Trenger nytt og bedre navn.
- Mer spenstig design? Logo, fonter farger linjer og bokser. Annen layout?
- Føy til tips om fullskjerm (Skjul verktøylinje for fullskjermmodus i landskap på telefon/pad for å maksimere skjermareal).

DASHBOARD:
- På mobilversjonen er det ikke plass til knapper for alle modulene. Ønsker at disse samles i en menyknapp (sånn med tre streker)
- Endre logo (Jeg gjør dette selv etterpå)

ØKTVELGER
- Øktvelgeren må kunne sortere på hvilket utstyr jeg har tilgjengelig.
- Eksport økter støtter tydeligvis ikke Æ, Ø eller Å. Må fikses.
- Eksport øvelser er unødvendig da det ikke går an å redigere øvelser i appen.
- Filteret i øktvelgeren finner ikke igjen alle eksempeløktene, men den filtrerer korrekt på øktene jeg selv har laget. Sannsynligvis feil i eksempeløktene.

ØKTEDITOR
- Jeg ønsker at modulen "Editor" kalles for Økteditor (Jeg kan sannsynligvis fikse dette selv i koden)
- Det skjer en feil med beskrivelsen når øvelsene importeres. Der beskrivelsen av øvelsen inneholder komma så tolker programmet det som at beskrivelsen er ferdig.
- Drag-n-drop på økt og øvelsesimporten virker ikke
- Tekst med kolonnenavn (exercise_id, name… etc) i økt- og øvelsesimporten er unødvendig. Fjern det.
- Det går ikke an å bruke mellomromstasten i øktnavn i editor. Det går an å lime inn et mellomrom men dette er tungvint.

ØKTKJØRINGEN:
- Progressbar for hele økta er ferdig før siste øvelse er ferdig
- Ønsker en nedtellingstidtaker både for den enkelte øvelsen (også pausen) og også en nedtellingstidtager for hele økta.
- Når hele økta er ferdig kan "Avslutt og lagre"-knappen erstattes med en "Lagre"-knapp uten bekreftelse.

LOGG
- Mer fantastisk statistikk og grafer på progresjon
- Må kunne lagre og importere loggen, eventuelt lagre den i en sky.

SPØRSMÅL: HVOR lagres egentlig loggen og øktene jeg lagrer? Kan jeg lagre disse også i skyen?
