
# Styrketreningsapp – Spesifikasjon (`spec.md`)

## 0. Oversikt
**Formål:**  
En nettbasert app (HTML/JS/CSS) for å sette sammen, gjennomføre og loggføre styrketreningsøkter. Appen støtter import av øvelsesbibliotek fra Excel/CSV, oppretting/redigering av økter, gjennomføring med tidtakere og progresjon, lagring av logg, og eksport (TCX og CSV). Hele prosjektet kan driftes uten installasjon av spesialprogramvare – kun standard Windows, Excel og nettleser. Publisering skjer via GitHub Pages.

**Rammer og prosess (for AI‑vennlig videreutvikling):**
- Kun standard Windows + Excel + nettleser; ingen lokal installasjon kreves.
- GitHub i nettleser anbefales for versjonskontroll, publisering (GitHub Pages), Issues og historikk.
- Tydelig prosjektstruktur og dokumentasjon (`README.md`, `spec.md`, `context-for-ai.md`, `ai-decisions.md`, `CHANGELOG.md`).
- Filene kan lagres i OneDrive. Tilgang fra mobil er ønskelig.
- Kode skal være godt kommentert og forståelig for ikke‑programmerere.

> **Design:** Nøktern, lys og ren art‑deco‑inspirert stil (duse farger, myke kanter). Ingen hint om Ironman.

---

## 1. Mål og ikke‑mål
**Mål (MVP):**
- Dashboard med siste (ulike) gjennomførte økter og favoritter.
- Øktmodul med tidtakere og progressbar; pause 10s (default); snarveier (Space, piltaster).
- Import av øvelsesbibliotek fra CSV via drag‑n‑drop (primær) eller autodeteksjon hvis fil ligger i samme mappe.
- Opprette/redigere økter i editor (drag‑n‑drop, filter, beregninger).
- Logg over gjennomførte økter; eksport til **TCX per dag** (UTC).
- Enkel statistikk (dag, siste 7 dager, totalt).
- Responsiv design (mobil/desktop) – **mobil prioriterer favorittøkter og øktbibliotek**.

**Mobilprioritering:**
- **Høy prioritet:** Dashboard (favoritter), Øktvelger/øktbibliotek, Øktmodul (gjennomføring).
- **Lavere prioritet:** Editor og Logg (tilgjengelig, men enklere på mobil).

**Ikke‑mål (kan komme senere):**
- Backend/serverlagring (alt kjører i klienten).
- Påloggingssystem/brukeradministrasjon.
- Direkte skriving/lesing av `.xlsx` i nettleseren uten ekstra bibliotek.

---

## 2. Anbefalt GitHub-struktur
```
/styrketrening-app
├── index.html
├── app.js
├── style.css
├── /modules/
│   ├── dashboard.js
│   ├── session.js
│   ├── library.js
│   ├── editor.js
│   └── log.js
├── /assets/
│   └── logo.png
├── /docs/
│   ├── sample_exercises.csv
│   ├── sample_workouts.csv
│   ├── sample_exercises.xlsx
│   ├── sample_workouts.xlsx
│   └── tcx_schema.md
├── spec.md
├── README.md
├── context-for-ai.md
├── ai-decisions.md
└── CHANGELOG.md
```

**Publisering:**  
- GitHub Pages → Settings → Pages → Deploy from a branch → main → /

---

## 3. Design og brukeropplevelse
- Lys, ren og nøktern layout; art‑deco‑detaljer; duse farger; myke kanter.
- Sticky toppfelt (ca. 10% høyde) med logo til venstre og modulknapper til høyre. Aktiv knapp utheves. Øktmodulen har ingen aktiv knapp.
- Responsivt oppsett (stack på mobil der nødvendig).
- “Så få trykk som mulig”; lettvekts JS/CSS; micro‑animasjoner.

---

## 4. Moduler og funksjonalitet
### 4.1 Dashboard
- To kolonner (stack på mobil): venstre = 5 siste *ulike* gjennomførte økter; høyre = opptil 5 favorittøkter.
- Klikk på økt åpner Øktmodul.

### 4.2 Øktmodul (gjennomføring)
- Venstre del: status (“Gjør deg klar.” i pauser/før start; “Kjør!” under aktiv øvelse), øvelsesdetaljer, progressbar + tidtaker for øvelse og total økt; knapper Start/Pause, Avslutt og lagre (bekreft), Forkast (bekreft).
- Snarveier: Space (start/pause), Pil venstre/høyre (bytt øvelse). Klikk på øvelse i høyreliste hopper til den.
- Høyre del: liste over øvelser (navn+varighet). Aktiv utheves; i pause utheves neste.
- Pause: default 10s mellom øvelser; skjules i høyreliste.
- Lagring: ved lagring legges økta i logg.

### 4.3 Øktvelger (bibliotek)
- Henter alle økter fra lokalt bibliotek (LocalStorage/JSON). Import fra CSV via drag‑n‑drop eller automatisk hvis fil ligger i samme mappe.
- Sortering/filtrering: Fokusområde (Overkropp/Underkropp/Hele kroppen), Total tid, Kategori (Styrke/Spenst/Balanse/Stabilisering/Mobilitet/Tøying), Utstyr (flervalg), Lydnivå, RPE.
- Favorittmerking (hjerte). Redigeringsknapp ved hver økt.

### 4.4 Økteditor
- Venstre: filter (flervalg) på Kroppsdel, RPE, Kategori, Utstyr; vis liste over øvelser som matcher (navn/forklaring/utstyr).
- Høyre: øktnavn+kategori; dra øvelser inn; per øvelse varighet **mm:ss** (default 01:00), pause **10s** mellom; endre rekkefølge med drag‑n‑drop; lagre til bibliotek.
- Automatisk: total tid (inkl. pauser), utstyr (union), lydnivå (maks), RPE (snitt).

### 4.5 Logg og eksport
- Viser utførte økter (nyeste øverst), gruppert per dag; per økt: navn, varighet, kategori.
- Eksporter **TCX** for alle økter samme dag (UTC, puls default 90 bpm). Enkel statistikk: varighet i dag, siste 7 dager, totalt.

---

## 5. Data og lagring
### 5.1 Lagring
- Primært: `localStorage` for bibliotek og logg.
- Sekundært: import/eksport til/fra CSV (kan redigeres i Excel). OneDrive for manuell filbytte.
- Mobil: full tilgang til favoritter og bibliotek; editor og logg tilgjengelig men enklere.

### 5.2 CSV-skjema (øvelsesbibliotek)
Kolonner: `exercise_id,name,description,progression_tips,default_duration_sec,rpe,category,focus_area,equipment,noise_level`

### 5.3 CSV-skjema (øktbibliotek)
Kolonner: `workout_id,name,category,focus_area,favorite,pause_between_items_sec,items` der `items` er semikolon‑separert: `exercise_id:duration_sec;...`

### 5.4 Loggformat (internt JSON)
Felter per dag: `date`, `sessions`[ `workout_id`, `name`, `start_time_local`, `duration_sec`, `computed_hr_bpm`, `events` ]

### 5.5 TCX-eksport
- En fil per dag; tider i UTC (`Z`); puls default 90 bpm; mapping dokumentert i `docs/tcx_schema.md`.

### 5.6 Excel‑grensesnitt
- Primærløsning: import via drag‑n‑drop av CSV; eksport som nedlastbar CSV. (Excel kan lese/lagre CSV.)
- Valgfri utvidelse: direkte `.xlsx`‑skriving/lesing senere hvis det kan gjøres uten ekstra installasjoner.

---

## 6. Snarveier og bekreftelser
- Space = Start/Pause; Pil venstre/høyre = bytt øvelse; klikk i høyreliste = hopp.
- Bekreftelser: “Avslutte økta?” / “Forkaste økta?”

---

## 7. Standardverdier
- Øvelser: 60s varighet (default). Pause: 10s (skjult i liste). Editor beregner total tid, utstyr, lydnivå, RPE.

---

## 8. Ikke-funksjonelle krav
- Lettvekts JS/CSS; god kontrast; responsivt; godt kommentert kode.
- Dokumentasjon oppdatert i `README.md`, `ai-decisions.md`, `CHANGELOG.md`.

---

## 9. Akseptansekriterier (MVP)
- Dashboard viser 5 siste *ulike* økter + opptil 5 favoritter; klikk åpner Øktmodul; mobil prioriterer favoritter og bibliotek.
- Øktmodul: tidtakere, progressbar, statusfelt, 10s pauser skjult; snarveier og bekreftelser.
- Øktvelger: import via drag‑n‑drop; filtrering; favorittmerking; redigering.
- Editor: dra‑n‑drop; lagring; beregninger.
- Logg: visning, daggruppering, TCX‑eksport (UTC, 90 bpm), statistikk.
- Responsiv og dokumentert.

---

## 10. Vedlikeholdsprosess
- Oppdater `spec.md` ved kravendringer; `CHANGELOG.md` for versjoner; beslutninger i `ai-decisions.md`; hurtigoversikt i `context-for-ai.md`; bruk GitHub Issues.
