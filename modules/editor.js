
// Editor: venstre = Filter øvelser. Høyre (øverst→nederst) = Bygg økt, Legg til øvelse, Øvelsesbibliotek (import/eksport).
// Filter inkluderer: utstyr (dynamisk), RPE, støy (noise), kategori, fokus, søk.
// Legg til øvelse: kun placeholders, utstyr med autocomplete (datalist) + mulighet for nye.
// Når øvelse legges i økt → bruk default_duration_sec fra øvelsesbiblioteket (ellers 60).
// Slett øvelse fra bibliotek støttes.

const Editor = {
  render(existing=null){
    const w = existing || { workout_id:`WK${Date.now()}`, name:'', category:'Styrke/Spenst', focus_area:'Hele kroppen', favorite:false, pause_between_items_sec:10, items:[] };

    // Dynamisk utstyrs-union (for filter og autocomplete)
    const equipmentSet = new Set();
    (AppState.exercises || []).forEach(e => (e.equipment || []).forEach(eq => { if (eq) equipmentSet.add(eq); }));
    const allEquipment = Array.from(equipmentSet).sort(); // inkl. 'nei'

    render(`
      <div class="grid-2">
        <!-- VENSTRE KOLONNE: FILTER ØVELSER -->
        <div>
          <div class="card">
            <h3>Filter øvelser</h3>
            <div class="flex">
              <select id="fFocus" class="input"><option value="">Fokus (alle)</option><option>Overkropp</option><option>Underkropp</option><option>Hele kroppen</option></select>
              <input id="fCat" class="input" placeholder="Kategori (f.eks. Styrke/Spenst)" />
            </div>
            <div class="flex">
              <input id="fSearch" class="input" placeholder="Søk (navn/beskrivelse)" />
            </div>
            <div>
              <div class="small" style="margin-top:8px;">Utstyr (velg alle som er relevante):</div>
              <div class="flex" id="fEquip">
                ${allEquipment.map(eq => `
                  <label><input type="checkbox" class="f-eq" value="${eq}"> ${eq}</label>
                `).join(' ')}
              </div>
            </div>
            <div class="flex" style="margin-top:8px;">
              <input id="fRpeMin" type="number" min="1" max="9" class="input" placeholder="RPE min (1-9)" />
              <input id="fRpeMax" type="number" min="1" max="9" class="input" placeholder="RPE max (1-9)" />
            </div>
            <div class="flex">
              <label><input type="checkbox" class="f-noise" value="Low"> Low</label>
              <label><input type="checkbox" class="f-noise" value="Medium"> Medium</label>
              <label><input type="checkbox" class="f-noise" value="High"> High</label>
            </div>
            <div id="exlist" style="margin-top:12px;"></div>
          </div>
        </div>

        <!-- HØYRE KOLONNE -->
        <div>
          <!-- Øverst: BYGG ØKT -->
          <div class="card">
            <h3>Bygg økt</h3>
            <input id="name" class="input" placeholder="Øktnavn" value="${w.name}" />
            <div class="flex">
              <input id="cat"   class="input" placeholder="Kategori" value="${w.category}" />
              <select id="focus" class="input"><option>Hele kroppen</option><option>Overkropp</option><option>Underkropp</option></select>
            </div>
            <div id="items"></div>
            <div class="flex">
              <button class="button" id="save">Lagre økt</button>
            </div>
          </div>

          <!-- Under: LEGG TIL ØVELSE (kun placeholders + autocomplete for utstyr) -->
          <div class="card">
            <h3>Legg til øvelse</h3>
            <input id="new_name"        class="input" placeholder="Navn" />
            <textarea id="new_desc"     class="input" placeholder="Beskrivelse (inkl. progresjonstips om ønsket)"></textarea>
            <div class="flex">
              <input id="new_duration"  class="input" placeholder="Default varighet (sek)" />
              <input id="new_rpe"       class="input" placeholder="RPE (1-9)" />
            </div>
            <div class="flex">
              <input id="new_cat"   class="input" placeholder="Kategori" />
              <select id="new_focus" class="input"><option>Hele kroppen</option><option>Overkropp</option><option>Underkropp</option></select>
            </div>
            <div class="flex">
              <input id="new_equip" class="input" placeholder="Utstyr (kommaseparert)" list="equipmentList" />
              <datalist id="equipmentList">
                ${allEquipment.map(eq => `<option value="${eq}">`).join('')}
              </datalist>
              <select id="new_noise" class="input"><option>Low</option><option>Medium</option><option>High</option></select>
            </div>
            <button class="button" id="addExercise">Legg til øvelse</button>
          </div>

          <!-- Nederst: ØVELSESBIBLIOTEK IMPORT/EKSPORT -->
          <div class="card">
            <h3>Øvelsesbibliotek</h3>
            <div class="flex">
              <input type="file" id="excsv" accept=".csv" />
              <div style="margin-left:auto">
                <button class="button" id="eximport">Importer øvelser (CSV)</button>
                <button class="button secondary" id="exportEx">Eksporter øvelser (CSV)</button>
              </div>
            </div>
            <div class="small">CSV er <strong>semikolondelt</strong>. Hvis kolonnen <code>progression_tips</code> finnes, appendes den til <code>description</code>.</div>
          </div>
        </div>
      </div>
    `);

    document.getElementById('focus').value = w.focus_area;

    // --- Import øvelser (CSV semikolon) ---
    document.getElementById('eximport').onclick = () => {
      const file = document.getElementById('excsv').files[0];
      if (!file) return alert('Velg øvelses-CSV');
      const reader = new FileReader();
