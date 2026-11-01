/* =====================================================================
   Bausteine für Einheit 20 „Das große Code-Fest“ (keine neue Rätselart)
   Die Stationen sind Rätsel der früheren Arten (raetsel/e20.json), gelöst und
   geprüft vom Löser ihrer Art. Diese Bausteine zeigen Lösungen aus r.loesung
   (nie von Hand geschrieben) und bauen das Fest-Rätsel.

     <m-e20-gitter raetsel="e20-x-pfad" [welt="2"] [feld="7"] [weg]>
         kleines Gitter NUR für die Anleitung (zum Nachlegen am Boden-Gitter oder
         Muggelstein-Brett). weg: der rote Weg der Lösung des Lösers (pfad: Beispiel
         bzw. kürzestes Programm, lesen: das Programm, kobold: die gemeinte Reparatur).
         Auf einem Blatt ist es verboten (dort m-gitter mit mindestens 20 mm).
     <m-e20-prog raetsel="e20-x-pfad" [teil="loesung|programm"] [gr="6"] [alle [anzahl="2"]]>
         ein Programm als kleine Programm-Reihe (Anleitung):
         loesung   pfad: Beispiel bzw. das (einzige) kürzeste Programm, mit Zauber-Kasten
                   das kürzeste mit Zauber-Kasten; lesen: das Programm; kobold: repariert
         programm  kobold: das kaputte Programm; lesen: das Programm
         alle      pfad: alle Programme mit der kleinsten Zahl (Befehle bzw. Karten), mit anzahl geprüft
     <m-e20-wert raetsel="e20-x-kuchen2" pfad="anzahl" [l="5"]>
         eine Zahl (oder ein Wort) aus der Lösung des Lösers im Fließtext, z. B. pfad="laenge",
         "zauber.minKarten", "erweitert.minKarten", "fragen", "anzahl", "zuordnung.oma".
         Mit l wird geprüft (sonst bricht der Build ab).
     <m-e20-code raetsel="e20-verstecke" [stellen="8"] [beispiel="KASTEN"] [gr="15"]>
         Fest-Rätsel am Blatt: oben Kästchen für die Code-Buchstaben (nummeriert wie die
         Stationen), darunter Kästchen für das Versteck. Lösungsansicht: das Beispiel-Versteck
         rot (Geheimschrift mit der Schlüssel-Zahl des Rätsels, mit web/kern/geheim.js gerechnet).
     <m-e20-verstecke raetsel="e20-verstecke" [spick]>
         Tabelle für die Vorbereitung: wie viele Stationen, Versteck, Code-Buchstaben für die
         Rückseiten der Stationen-Karten (aus dem Löser, zur Probe noch einmal gelesen).
   Eigene Gestaltung: Klassen mit Präfix e20- (CSS hier, einmal pro Dokument).
   ===================================================================== */
(function () {
  'use strict';
  const B = (window.__bausteine = window.__bausteine || {});
  const H = () => window.__hilfen;
  const S = () => window.WerkstattSymbole;
  const K = () => window.WerkstattKern;
  const G = () => window.WerkstattGeheim;
  const istLoesung = (el) => !!el.closest('.loesungsmodus');

  const CSS = `
m-e20-gitter { display: inline-block; vertical-align: middle; line-height: 0; }
m-e20-gitter svg { display: block; }
m-e20-prog { display: inline; }
m-e20-code, m-e20-verstecke { display: block; }
.e20-code { display: grid; grid-template-columns: auto repeat(var(--n, 8), var(--gr, 15mm)); column-gap: 2mm; row-gap: 1.2mm; align-items: center; justify-content: start; }
.e20-code .e20-cl { font-family: var(--kind); font-size: 16pt; line-height: 1.1; padding-right: 2.5mm; white-space: nowrap; }
.e20-code .e20-cnr { font-family: var(--text); font-weight: 900; font-size: 14pt; color: var(--grau); text-align: center; line-height: 1; }
.e20-code .e20-cbox { width: var(--gr, 15mm); height: var(--gr, 15mm); border: 0.6mm solid var(--tinte); border-radius: 2mm; background: white;
  display: flex; align-items: center; justify-content: center; font-family: var(--kind); font-weight: 700; font-size: 22pt; line-height: 1; }
.e20-code .e20-cbox.code { border-color: var(--akzent); background: var(--akzent-hell); }
.e20-code .e20-pfeil { display: flex; justify-content: center; line-height: 0; }
.e20-code .e20-pfeil svg { display: block; }
.loesungsmodus .e20-code .e20-cbox.mit-lsg { border-color: var(--rot); }
table.e20-verstecke .e20-gt { font-family: var(--kind); font-weight: 700; letter-spacing: 0.18em; white-space: nowrap; }
table.e20-verstecke .e20-kl { font-family: var(--kind); font-weight: 700; white-space: nowrap; }
table.tab.e20-verstecke { break-inside: avoid; }
`;
  function stil() {
    if (document.getElementById('e20-stil')) return;
    const st = document.createElement('style');
    st.id = 'e20-stil';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  function raetselVon(el, arten) {
    const id = el.getAttribute('raetsel');
    if (!id) { H().fehler(el, 'raetsel="…" fehlt'); return null; }
    const r = H().DATEN.raetsel[id];
    if (!r) { H().fehler(el, 'Rätsel „' + id + '“ gibt es nicht in raetsel/*.json'); return null; }
    if (arten && !arten.includes(r.art)) { H().fehler(el, 'Rätsel „' + id + '“ hat art „' + r.art + '“, hier geht nur: ' + arten.join(', ')); return null; }
    if (!r.loesung) { H().fehler(el, 'Rätsel „' + id + '“ hat keine Lösung (Löser-Fehler?)'); return null; }
    return r;
  }
  function weltVon(r, el) {
    const w = {};
    const felder = ['b', 'h', 'start', 'ziel', 'hindernisse', 'edelsteine', 'zielSymbol'];
    for (const f of felder) if (r[f] !== undefined) w[f] = r[f];
    if (r.welten) {
      const n = parseInt(el.getAttribute('welt') || '0', 10);
      if (!(n >= 1 && n <= r.welten.length)) { H().fehler(el, 'Rätsel „' + r.id + '“ hat ' + r.welten.length + ' Welten: welt="1" bis welt="' + r.welten.length + '"'); return null; }
      for (const f of felder) if (r.welten[n - 1][f] !== undefined) w[f] = r.welten[n - 1][f];
    } else if (el.hasAttribute('welt') && el.getAttribute('welt') !== '1') { H().fehler(el, 'Rätsel „' + r.id + '“ hat nur eine Welt'); return null; }
    return w;
  }
  // Das Lösungsprogramm aus dem Löser (und die Sprüche dazu)
  function loesungVon(r) {
    const L = r.loesung;
    if (r.art === 'pfad') {
      if (L.zauber) return { prog: L.zauber.kuerzeste[0], sp: null, n: L.zauber.anzahlMin };
      if (L.erweitert) return { prog: L.beispiel, sp: L.sprueche, n: L.erweitert.anzahlMin };
      return { prog: L.beispiel || L.programme[0].join(' '), sp: null, n: L.anzahl };
    }
    if (r.art === 'lesen') return { prog: L.programm, sp: L.sprueche };
    if (r.art === 'kobold') return { prog: Array.isArray(L.gemeint) ? L.gemeint.join(' ') : L.gemeint, sp: L.gemeintSprueche || null };
    return null;
  }

  // ---------------------------------------------------------------------
  // <m-e20-gitter raetsel [welt] [feld="7"] [weg]>
  // ---------------------------------------------------------------------
  B['m-e20-gitter'] = function (el) {
    if (el.closest('.blatt')) return H().fehler(el, 'm-e20-gitter ist nur für die Anleitung (auf Blättern: m-gitter mit feld ≥ 20)');
    const r = raetselVon(el, ['pfad', 'lesen', 'kobold']);
    if (!r) return;
    const w = weltVon(r, el);
    if (!w) return;
    const feld = parseFloat(el.getAttribute('feld') || '7');
    const opt = { breite: (feld * (w.b * 100 + 12) / 100).toFixed(2) + 'mm', hoehe: (feld * (w.h * 100 + 12) / 100).toFixed(2) + 'mm', label: 'Gitter ' + r.id };
    if (el.hasAttribute('weg')) {
      const l = loesungVon(r);
      try {
        const e = K().ausfuehren(w, l.prog, l.sp ? { sprueche: l.sp } : undefined);
        if (r.art !== 'lesen' && !e.geschafft) return H().fehler(el, 'Die Lösung kommt hier nicht an');
        opt.weg = e.schritte.map((s) => s.nachher);
        opt.geist = true;
      } catch (x) { return H().fehler(el, x.message); }
    }
    el.innerHTML = S().gitter(w, opt);
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  // <m-e20-prog raetsel [teil] [gr]>  → eine m-programm-Reihe (wird danach von programmieren.js gezeichnet)
  // ---------------------------------------------------------------------
  B['m-e20-prog'] = function (el) {
    const r = raetselVon(el, ['pfad', 'lesen', 'kobold']);
    if (!r) return;
    const teil = el.getAttribute('teil') || 'loesung';
    let prog;
    if (teil === 'programm') {
      if (r.art === 'pfad') return H().fehler(el, 'teil="programm" nur bei kobold und lesen');
      prog = r.art === 'kobold' ? (Array.isArray(r.loesung.programm) ? r.loesung.programm.join(' ') : r.loesung.programm) : r.loesung.programm;
    } else if (teil === 'loesung') {
      const l = loesungVon(r);
      if (r.art === 'pfad' && r.aufgabe === 'kuerzestes' && l.n !== 1 && !r.mehrereLoesungen) return H().fehler(el, 'Kürzestes Programm nicht eindeutig');
      prog = l.prog;
    } else return H().fehler(el, 'teil: loesung oder programm');
    // alle: bei pfad alle Programme mit der kleinsten Zahl (Befehle bzw. Karten), wie der Löser sie zählt
    let liste = [prog];
    if (el.hasAttribute('alle')) {
      if (r.art !== 'pfad') return H().fehler(el, 'alle nur bei pfad');
      const L = r.loesung;
      liste = L.zauber ? L.zauber.kuerzeste.slice() : L.erweitert ? L.erweitert.kuerzeste.map((k) => k.programm) : L.programme.map((x) => x.join(' '));
      const n = L.zauber ? L.zauber.anzahlMin : L.erweitert ? L.erweitert.anzahlMin : L.anzahl;
      if (liste.length !== n) return H().fehler(el, 'Der Löser hat ' + n + ' Programme gezählt, aufgelistet sind ' + liste.length);
      if (el.hasAttribute('anzahl') && +el.getAttribute('anzahl') !== n) return H().fehler(el, 'anzahl="' + el.getAttribute('anzahl') + '", der Löser zählt ' + n);
    }
    const gr = el.getAttribute('gr') || '6';
    el.innerHTML = '';
    liste.forEach((x, i) => {
      if (i) el.appendChild(document.createTextNode(i === liste.length - 1 ? ' oder ' : ', '));
      const p = document.createElement('m-programm');
      p.setAttribute('befehle', typeof x === 'string' ? x : K().alsText(x));
      p.setAttribute('gr', gr);
      p.setAttribute('nummern', 'nein');
      el.appendChild(p);
    });
    el.classList.add('geprueft');
  };

  // ---------------------------------------------------------------------
  // <m-e20-wert raetsel pfad [l]>
  // ---------------------------------------------------------------------
  B['m-e20-wert'] = function (el) {
    const r = raetselVon(el);
    if (!r) return;
    const pfad = el.getAttribute('pfad');
    if (!pfad) return H().fehler(el, 'pfad="…" fehlt');
    let v = r.loesung;
    for (const t of pfad.split('.')) {
      if (v === null || v === undefined) break;
      v = Array.isArray(v) && /^\d+$/.test(t) ? v[+t] : v[t];
    }
    if (v === null || v === undefined || typeof v === 'object') return H().fehler(el, 'In der Lösung von „' + r.id + '“ gibt es „' + pfad + '“ nicht (als Zahl oder Wort)');
    if (el.hasAttribute('l') && String(v) !== el.getAttribute('l')) return H().fehler(el, 'l="' + el.getAttribute('l') + '", der Löser sagt ' + v);
    el.textContent = String(v);
    el.classList.add('geprueft');
  };

  // ---------------------------------------------------------------------
  // Fest-Rätsel: <m-e20-code raetsel="e20-verstecke" [stellen] [beispiel] [gr]>
  // ---------------------------------------------------------------------
  const PFEIL = (gr) => '<svg viewBox="0 0 40 40" width="' + gr + 'mm" height="' + gr + 'mm" aria-hidden="true"><path d="M20 4 L20 30 M10 21 L20 33 L30 21" fill="none" stroke="#6b6f86" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  B['m-e20-code'] = function (el) {
    stil();
    const r = raetselVon(el, ['geheim']);
    if (!r) return;
    if (r.aufgabe !== 'liste') return H().fehler(el, 'm-e20-code braucht ein geheim-Rätsel mit aufgabe "liste"');
    const k = r.loesung.schluessel;
    const n = parseInt(el.getAttribute('stellen') || '8', 10);
    const gr = parseFloat(el.getAttribute('gr') || '15');
    const bsp = el.getAttribute('beispiel') || '';
    const paar = bsp ? r.loesung.paare.find((p) => p[0] === bsp) : null;
    if (bsp && !paar) return H().fehler(el, 'beispiel „' + bsp + '“ steht nicht in der Liste von „' + r.id + '“');
    if (paar && (G().schreiben(paar[0], k) !== paar[1] || G().lesen(paar[1], k) !== paar[0])) return H().fehler(el, 'Geheimschrift passt nicht');
    if (paar && paar[0].length > n) return H().fehler(el, 'beispiel ist länger als ' + n + ' Stellen');
    const L = istLoesung(el);
    const zelle = (b, cls) => '<span class="e20-cbox ' + cls + (b && L ? ' mit-lsg' : '') + '">' + (b ? '<span class="lsg">' + H().esc(b) + '</span>' : '') + '</span>';
    let html = '<div class="e20-code" style="--n:' + n + ';--gr:' + gr + 'mm"><span></span>';
    for (let i = 0; i < n; i++) html += '<span class="e20-cnr">' + (i + 1) + '</span>';
    html += '<span class="e20-cl">Code-Buchstaben</span>';
    for (let i = 0; i < n; i++) html += zelle(paar ? paar[1][i] : '', 'code');
    html += '<span></span>';
    for (let i = 0; i < n; i++) html += '<span class="e20-pfeil">' + PFEIL(gr * 0.45) + '</span>';
    html += '<span class="e20-cl">Versteck</span>';
    for (let i = 0; i < n; i++) html += zelle(paar ? paar[0][i] : '', 'klar');
    html += '</div>';
    el.innerHTML = html;
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  // <m-e20-verstecke raetsel="e20-verstecke" [spick]>
  // ---------------------------------------------------------------------
  B['m-e20-verstecke'] = function (el) {
    stil();
    const r = raetselVon(el, ['geheim']);
    if (!r) return;
    if (r.aufgabe !== 'liste') return H().fehler(el, 'm-e20-verstecke braucht ein geheim-Rätsel mit aufgabe "liste"');
    const k = r.loesung.schluessel;
    const gruppen = {};
    for (const [klar, geheim] of r.loesung.paare) {
      if (G().lesen(geheim, k) !== klar) return H().fehler(el, 'Probe falsch: ' + geheim + ' gelesen ist nicht ' + klar);
      (gruppen[klar.length] = gruppen[klar.length] || []).push([klar, geheim]);
    }
    const name = (w) => w.charAt(0) + w.slice(1).toLowerCase();
    const laengen = Object.keys(gruppen).map(Number).sort((a, b) => a - b);
    let html;
    if (el.hasAttribute('spick')) {
      // kompakt: eine Zeile pro Stationen-Zahl
      html = '<table class="spick-tab e20-verstecke"><tr><th>Stationen</th><th>Versteck: Code-Buchstaben für die Karten 1, 2, 3 … (Schlüssel-Zahl ' + k + ')</th></tr>';
      for (const len of laengen) {
        html += '<tr><td><b>' + len + '</b>' + (len < 6 ? ' (2. Tag)' : '') + '</td><td>' +
          gruppen[len].map(([klar, geheim]) => '<span class="e20-kl">' + H().esc(name(klar)) + ':</span> <span class="e20-gt">' + Array.from(geheim).join(' ') + '</span>').join(' &nbsp;·&nbsp; ') + '</td></tr>';
      }
      html += '</table>';
    } else {
      html = '<table class="tab e20-verstecke"><tr><th>Stationen</th><th>Versteck</th><th>Code-Buchstaben (Station 1, 2, 3 …)</th></tr>';
      for (const len of laengen) {
        gruppen[len].forEach(([klar, geheim], i) => {
          html += '<tr>' + (i === 0 ? '<td rowspan="' + gruppen[len].length + '"><b>' + len + '</b>' + (len < 6 ? ' (zweiter Fest-Tag)' : '') + '</td>' : '') +
            '<td class="e20-kl">' + H().esc(name(klar)) + '</td><td class="e20-gt">' + Array.from(geheim).join(' ') + '</td></tr>';
        });
      }
      html += '</table>';
    }
    el.innerHTML = html;
    el.classList.add('komp', 'geprueft');
  };
})();
