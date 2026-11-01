/* =====================================================================
   Bausteine für Einheit 9 „Nur Ja oder Nein“ (Ja/Nein-Zahlen, Rätselart "janein")
   Zeichnungen und Rechnen kommen aus web/kern/janein.js (dieselben wie in der Web-App),
   die Lösungen aus dem Löser (werkzeuge/arten/janein.mjs → r.loesung).

     <m-e9-zahl raetsel="e9-l1" [gr="20"]>
         Ein Rätsel aus raetsel/e9.json, je nach aufgabe und aussehen:
         lesen   Karten (Lampen, Hand, Nullen und Einsen) und ein Antwortfeld
         legen   Zielzahl und leere Karten mit Ankreuz-Kästchen (Lampen zum Anmalen,
                 Kästchen für Nullen und Einsen)
         kobold  Fee mit der gemeinten Zahl und die falsch gelegten Karten
         Lösung (rot): Zahl im Feld und die Rechnung darunter, Kreuze bei den Ja-Karten,
         die falsche Karte rot umrandet mit „umdrehen“.
         gr = Breite einer Karte in mm (Höhe 1,4-mal so viel), bei der Hand: Breite der Hand.
     <m-e9-zeige ja="8 4 1" [aussehen="karten|lampen|finger|ziffern"] [anzahl="5"] [gr="12"]
                 [zahl="13"] [rechnung] [nummern] [farbe="orange"] [markiert="4"]>
         Eine Ja/Nein-Zahl nur zeigen (Anleitung, Beispiele). zahl prüft die Summe,
         rechnung schreibt „8 + 4 + 1 = 13“ dazu (ausgerechnet), nummern: Hand mit Punktzahlen.
     <m-e9-karte wert="16" [farbe="tuerkis|orange"] [ja="nein"] [form="leer"] [gr="36"] [voll] [rahmen="nein"]>
         Eine einzelne Karte (Bastelvorlage: voll = füllt die Karte von <m-karten>, rahmen="nein":
         ohne eigenen Rand, die Schnittlinie ist der Rand).
     <m-e9-feld raetsel="e9-alle" | ja="16 8" | karte="6" | groesste="6" [teil="ziffern"]>
         Antwortfeld, Lösung ausgerechnet: Zahl des Rätsels, Summe, Punkte der größten
         von n Karten, größte Zahl mit n Karten.
     <m-e9-loesung raetsel="e9-w1" [gr="4.5"]>
         Lösung eines Rätsels klein für die Anleitung (Karten und Rechnung, Kobold: falsche Karte rot).
     <m-e9-tabelle von="0" bis="15" anzahl="4" [spalten="2"]>
         Tabelle: Zahl, Ja/Nein-Karten als Punkte (voll = Ja), Nullen und Einsen.
     <m-e9-liste karte="4" [anzahl="5"]>
         Alle Zahlen 1 bis 31, bei denen diese Karte Ja sagt (Gedankenlese-Karte).
   Eigene Gestaltung: Klassen mit Präfix e09- (CSS hier, einmal pro Dokument).
   ===================================================================== */
(function () {
  'use strict';
  const B = (window.__bausteine = window.__bausteine || {});
  const H = () => window.__hilfen;
  const J = () => window.WerkstattJaNein;
  const istLoesung = (el) => !!el.closest('.loesungsmodus');

  const CSS = `
m-e9-zahl, m-e9-zeige, m-e9-karte, m-e9-feld, m-e9-loesung { display: inline-block; vertical-align: middle; line-height: 0; }
m-e9-tabelle { display: block; }
m-e9-liste { display: inline; }
m-e9-karte.e09-voll { display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; }
.e09-zeile { display: inline-flex; align-items: center; gap: 4mm; line-height: 1; font-family: var(--kind); }
.e09-reihe { display: inline-flex; gap: var(--abst, 2.5mm); align-items: flex-start; }
.e09-platz { display: inline-flex; flex-direction: column; align-items: center; gap: 1.6mm; position: relative; }
.e09-platz svg, .e09-hand svg, m-e9-karte svg { display: block; }
.e09-gleich { font-size: 24pt; line-height: 1; }
.e09-wort { font-size: 18pt; line-height: 1; }
.e09-ziel { min-width: 14mm; height: 14mm; border-radius: 7mm; background: var(--akzent-hell); border: 0.7mm solid var(--akzent);
  font-size: 24pt; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; padding: 0 2.5mm; line-height: 1; }
.e09-spalte { display: inline-flex; flex-direction: column; align-items: flex-start; gap: 1.5mm; line-height: 1; }
.e09-spalte.e09-mitte { align-items: center; gap: 2mm; }
.e09-rechnung { font-family: var(--kind); font-size: 14pt; line-height: 1.1; white-space: nowrap; }
.e09-unter { font-family: var(--kind); font-size: 12pt; line-height: 1; white-space: nowrap; }
.e09-rechn-text { font-family: inherit; white-space: nowrap; }
.e09-ziffern { display: inline-flex; gap: 1.6mm; align-items: flex-end; }
.e09-ziffer { display: inline-flex; flex-direction: column; align-items: center; gap: 1mm; }
.e09-ziffer .e09-w.klein { font-family: var(--text); font-weight: 800; font-size: 10pt; color: var(--grau); line-height: 1; }
.e09-ziffer .e09-box { width: var(--zb, 11mm); height: var(--zb, 11mm); border: 0.55mm solid var(--tinte); border-radius: 1.5mm; background: white;
  display: inline-flex; align-items: center; justify-content: center; font-size: calc(var(--zb, 11mm) * 0.72); font-weight: 700; line-height: 1; }
.e09-ziffer .e09-box .lsg { color: var(--rot); }
.e09-fee { display: inline-flex; align-items: center; gap: 1.5mm; }
.e09-blase { position: relative; border: 0.6mm solid var(--tinte); border-radius: 4mm; background: white; padding: 1.5mm 3mm; font-size: 16pt; line-height: 1.1; white-space: nowrap; }
.e09-blase b { font-size: 22pt; }
.e09-hand { display: inline-block; line-height: 0; }
.e09-beschr { font-family: var(--text); font-size: 9pt; color: var(--grau); line-height: 1.1; text-align: center; }
.e09-tabs { display: flex; gap: 6mm; align-items: flex-start; }
table.e09-tab { border-collapse: collapse; font-size: 10pt; }
table.e09-tab th { font-weight: 800; font-size: 9pt; color: var(--grau); padding: 0.6mm 1.6mm; text-align: center; }
table.e09-tab td { padding: 0.5mm 1.6mm; text-align: center; border-top: 0.25mm solid var(--linie); }
table.e09-tab td.e09-z { font-weight: 800; text-align: right; }
table.e09-tab td.e09-bin { font-family: var(--kind); letter-spacing: 0.08em; }
.e09-dot { display: inline-block; width: 3.2mm; height: 3.2mm; border-radius: 50%; border: 0.35mm solid #9a9fb4; background: white; vertical-align: middle; }
.e09-dot.ja { background: #0f8f87; border-color: #0f8f87; }
`;
  function stil() {
    if (document.getElementById('e09-stil')) return;
    const st = document.createElement('style');
    st.id = 'e09-stil';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function raetselVon(el) {
    const h = H();
    const id = el.getAttribute('raetsel');
    const r = id && h.DATEN.raetsel[id];
    if (!r) { h.fehler(el, 'Rätsel „' + id + '“ gibt es nicht in raetsel/*.json'); return null; }
    if (r.art !== 'janein') { h.fehler(el, 'Rätsel „' + id + '“ ist kein janein-Rätsel (art: ' + r.art + ')'); return null; }
    if (!r.loesung) { h.fehler(el, 'Rätsel „' + id + '“ hat keine Lösung (Löser-Fehler?)'); return null; }
    return r;
  }
  function zahlenListe(s) {
    return String(s || '').split(/[\s,]+/).filter(Boolean).map((x) => {
      const n = parseInt(x, 10);
      if (String(n) !== x) throw new Error('„' + x + '“ ist keine Zahl');
      return n;
    });
  }
  const mm = (x) => (Math.round(x * 100) / 100) + 'mm';

  // Ein Bild einer Stelle: Karte, Lampe; zustand true = Ja
  function stelle(aussehen, v, zustand, gr, opt) {
    const j = J();
    const o = Object.assign({ breite: mm(gr), hoehe: mm(gr * 1.4) }, opt || {});
    if (aussehen === 'lampen') return j.lampe(v, Object.assign(o, { an: zustand }));
    return j.karte(v, Object.assign(o, { ja: zustand }));
  }
  function handHTML(ja, gr, opt) {
    const o = Object.assign({ breite: mm(gr), hoehe: mm(gr * ((opt && opt.nummern ? 162 : 140) / 140)) }, opt || {});
    return '<span class="e09-hand">' + J().hand(ja, o) + '</span>';
  }
  function ziffernHTML(ja, werte, zb, form, L) {
    let s = '<span class="e09-ziffern" style="--zb:' + mm(zb) + '">';
    ja.forEach((x, i) => {
      const z = x ? '1' : '0';
      s += '<span class="e09-ziffer"><span class="e09-w klein">' + werte[i] + '</span><span class="e09-box">' +
        (form ? '<span class="lsg">' + z + '</span>' : z) + '</span></span>';
    });
    void L;
    return s + '</span>';
  }
  function feldFuer(z) {
    const s = String(z);
    return H().feldHTML(s, s.length === 1 ? 'k' : s.length >= 3 ? 'b3' : '');
  }

  // ---------------------------------------------------------------------
  // <m-e9-zahl raetsel="…" [gr]>
  // ---------------------------------------------------------------------
  B['m-e9-zahl'] = function (el) {
    stil();
    const h = H(), j = J();
    const r = raetselVon(el);
    if (!r) return;
    const l = r.loesung;
    const L = istLoesung(el);
    const ae = l.aussehen;
    const n = l.anzahl;
    const W = l.werte;
    const gr = parseFloat(h.attr(el, 'gr', ae === 'finger' ? '30' : '20'));
    if (ae !== 'finger' && ae !== 'ziffern' && gr < 12) return h.fehler(el, 'Karten mindestens 12 mm breit');
    let html = '';
    try {
      if (r.aufgabe === 'lesen') {
        let bild;
        if (ae === 'finger') bild = handHTML(l.ja, gr);
        else if (ae === 'ziffern') bild = ziffernHTML(l.ja, W, gr * 0.55 || 11, false, L);
        else bild = '<span class="e09-reihe">' + W.map((v, i) => '<span class="e09-platz">' + stelle(ae, v, l.ja[i], gr) + '</span>').join('') + '</span>';
        const zeichen = ae === 'ziffern' ? '<span class="e09-wort">ist</span>' : '<span class="e09-gleich">=</span>';
        const rechn = l.jaWerte.length > 1 && ae !== 'ziffern' && !el.hasAttribute('ohne-rechnung') ? '<span class="lsg e09-rechnung">' + h.esc(l.rechnung) + '</span>' : '';
        // Hand: Rechnung unter dem Antwortfeld (daneben ist kein Platz), sonst rechts daneben
        html = ae === 'finger'
          ? '<span class="e09-zeile">' + bild + zeichen + '<span class="e09-spalte e09-mitte">' + feldFuer(l.zahl) + rechn + '</span></span>'
          : '<span class="e09-zeile">' + bild + zeichen + feldFuer(l.zahl) + rechn + '</span>';
      } else if (r.aufgabe === 'legen') {
        const ziel = '<span class="e09-ziel">' + l.zahl + '</span>';
        if (ae === 'ziffern') {
          html = '<span class="e09-zeile">' + ziel + ziffernHTML(l.ja, W, gr * 0.55 || 11, true, L) + '</span>';
        } else if (ae === 'finger') {
          // Hand zum Anmalen gibt es am Papier nicht: Lösung als Hand
          html = '<span class="e09-zeile">' + ziel + (L ? handHTML(l.ja, gr) : handHTML([false, false, false, false, false], gr)) + '</span>';
        } else {
          const kb = gr * 0.5;
          const plaetze = W.map((v, i) => {
            const zust = ae === 'lampen' ? (L && l.ja[i]) : true;
            const bild = stelle(ae, v, zust, gr, ae === 'lampen' ? { markiert: L && l.ja[i] } : { form: 'leer', markiert: L && l.ja[i] });
            const box = ae === 'lampen' ? '' : j.kaestchen(L && l.ja[i], { breite: mm(kb), hoehe: mm(kb) });
            return '<span class="e09-platz">' + bild + box + '</span>';
          }).join('');
          html = '<span class="e09-zeile">' + ziel + '<span class="e09-reihe">' + plaetze + '</span>' +
            (el.hasAttribute('ohne-rechnung') ? '' : '<span class="lsg e09-rechnung">' + h.esc(l.rechnung) + '</span>') + '</span>';
        }
      } else if (r.aufgabe === 'kobold') {
        const fee = '<span class="e09-fee">' + (h.bildSVG('fee', gr * 1.1) || '') + '<span class="e09-blase">Das soll <b>' + l.zahl + '</b> sein!</span></span>';
        let reihe;
        if (ae === 'finger') reihe = handHTML(l.gezeigtJa, gr, { markiert: L ? l.falsch : null });
        else if (ae === 'ziffern') reihe = ziffernHTML(l.gezeigtJa, W, gr * 0.55, false, L);
        else reihe = '<span class="e09-reihe">' + W.map((v, i) => '<span class="e09-platz">' + stelle(ae, v, l.gezeigtJa[i], gr, { markiert: L && i === l.falsch }) +
          (i === l.falsch ? '<span class="lsg e09-unter">umdrehen</span>' : '') + '</span>').join('') + '</span>';
        html = '<span class="e09-spalte"><span class="e09-zeile">' + fee + reihe + '</span>' +
          (el.hasAttribute('ohne-rechnung') ? '' : '<span class="lsg e09-rechnung e09-kobold-rechn">Gelegt: ' + h.esc(l.rechnungGezeigt) + '. Richtig: ' + h.esc(l.rechnung) + '</span>') + '</span>';
      }
    } catch (e) { return h.fehler(el, e.message); }
    el.innerHTML = html;
    el.classList.add('komp', 'geprueft');
    void n;
  };

  // ---------------------------------------------------------------------
  // <m-e9-zeige ja="8 4 1" …>
  // ---------------------------------------------------------------------
  B['m-e9-zeige'] = function (el) {
    stil();
    const h = H(), j = J();
    try {
      const n = j.anzahl(el.hasAttribute('anzahl') ? parseInt(el.getAttribute('anzahl'), 10) : undefined);
      const ae = h.attr(el, 'aussehen', 'karten');
      if (!j.AUSSEHEN.includes(ae)) return h.fehler(el, 'aussehen: ' + j.AUSSEHEN.join(', '));
      const ja = j.jaAusWerten(zahlenListe(el.getAttribute('ja')), n);
      const w = j.wert(ja, n);
      if (el.hasAttribute('zahl') && parseInt(el.getAttribute('zahl'), 10) !== w) return h.fehler(el, 'Die Karten zeigen ' + w + ', nicht ' + el.getAttribute('zahl'));
      const gr = parseFloat(h.attr(el, 'gr', ae === 'finger' ? '24' : '10'));
      const W = j.werte(n);
      const mark = el.hasAttribute('markiert') ? W.indexOf(parseInt(el.getAttribute('markiert'), 10)) : -1;
      if (el.hasAttribute('markiert') && mark < 0) return h.fehler(el, 'markiert: eine Karte, die es gibt');
      const farbe = h.attr(el, 'farbe', 'tuerkis');
      let bild;
      if (ae === 'finger') {
        if (n !== 5) return h.fehler(el, 'Finger nur mit 5 Karten');
        if (j.ziffern(ja) === '00100') return h.fehler(el, 'Hand mit nur dem Mittelfinger: bitte eine andere Zahl');
        bild = handHTML(ja, gr, { nummern: el.hasAttribute('nummern'), markiert: mark >= 0 ? mark : null });
      } else if (ae === 'ziffern') bild = ziffernHTML(ja, W, gr, false, false);
      else bild = '<span class="e09-reihe" style="--abst:' + mm(Math.max(1, gr * 0.15)) + '">' + W.map((v, i) => '<span class="e09-platz">' + stelle(ae, v, ja[i], gr, { farbe, markiert: i === mark }) + '</span>').join('') + '</span>';
      let text = '';
      if (el.hasAttribute('rechnung')) text = '<span class="e09-rechn-text">' + h.esc(j.rechnung(ja, n)) + '</span>';
      el.innerHTML = '<span class="e09-zeile" style="gap:' + mm(Math.max(1.5, gr * 0.25)) + '">' + bild + text + '</span>';
      el.dataset.zahl = String(w);
    } catch (e) { return h.fehler(el, e.message); }
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  // <m-e9-karte wert="16" …>
  // ---------------------------------------------------------------------
  B['m-e9-karte'] = function (el) {
    stil();
    const h = H(), j = J();
    const v = parseInt(el.getAttribute('wert'), 10);
    if (!j.istKarte(v, 6)) return h.fehler(el, 'wert: 1, 2, 4, 8, 16 oder 32');
    const voll = el.hasAttribute('voll');
    const gr = parseFloat(h.attr(el, 'gr', '36'));
    const opt = {
      ja: h.attr(el, 'ja', 'ja') !== 'nein',
      form: h.attr(el, 'form', ''),
      farbe: h.attr(el, 'farbe', 'tuerkis'),
      nummer: h.attr(el, 'nummer', 'ja') !== 'nein',
      rahmen: h.attr(el, 'rahmen', 'ja') !== 'nein',
      breite: voll ? '100%' : mm(gr),
      hoehe: voll ? '100%' : mm(gr * 1.4),
    };
    el.innerHTML = j.karte(v, opt);
    if (voll) el.classList.add('e09-voll');
    el.classList.add('komp');
  };

  // ---------------------------------------------------------------------
  // <m-e9-loesung raetsel="…" [gr="4.5"]>  Lösung eines Rätsels für die Anleitung (klein, mit Rechnung)
  // ---------------------------------------------------------------------
  B['m-e9-loesung'] = function (el) {
    stil();
    const h = H();
    const r = raetselVon(el);
    if (!r) return;
    const l = r.loesung;
    const gr = parseFloat(h.attr(el, 'gr', '4.5'));
    try {
      const ae = l.aussehen;
      const bild = (ja, mark) => {
        if (ae === 'finger') return handHTML(ja, gr * 2.2, { markiert: mark >= 0 ? mark : null });
        if (ae === 'ziffern') return ziffernHTML(ja, l.werte, gr * 1.2, false, false);
        return '<span class="e09-reihe" style="--abst:' + mm(Math.max(0.8, gr * 0.15)) + '">' + l.werte.map((v, i) => '<span class="e09-platz">' + stelle(ae, v, ja[i], gr, { markiert: i === mark }) + '</span>').join('') + '</span>';
      };
      let html;
      if (r.aufgabe === 'kobold') {
        html = bild(l.gezeigtJa, l.falsch) + '<span class="e09-rechn-text">gelegt ' + h.esc(l.rechnungGezeigt) + ', die ' + l.falschWert + 'er-Karte ' +
          (l.art === 'zuviel' ? 'muss weg' : 'fehlt') + ': ' + h.esc(l.rechnung) + '</span>';
      } else {
        const t = l.jaWerte.length > 1 ? l.rechnung : String(l.zahl);
        html = bild(l.ja, -1) + '<span class="e09-rechn-text">' + h.esc(t) + (r.wahl ? ' (zur Wahl: ' + r.wahl.join(', ') + ')' : '') + '</span>';
      }
      el.innerHTML = '<span class="e09-zeile" style="gap:2mm">' + html + '</span>';
    } catch (e) { return h.fehler(el, e.message); }
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  // <m-e9-feld raetsel="…" | ja="…" | karte="6" | groesste="6" [teil="ziffern"]>
  // ---------------------------------------------------------------------
  B['m-e9-feld'] = function (el) {
    stil();
    const h = H(), j = J();
    let l;
    try {
      if (el.hasAttribute('raetsel')) {
        const r = raetselVon(el);
        if (!r) return;
        l = el.getAttribute('teil') === 'ziffern' ? r.loesung.ziffern : r.loesung.zahl;
      } else if (el.hasAttribute('ja')) {
        const n = j.anzahl(el.hasAttribute('anzahl') ? parseInt(el.getAttribute('anzahl'), 10) : undefined);
        l = j.wert(j.jaAusWerten(zahlenListe(el.getAttribute('ja')), n), n);
      } else if (el.hasAttribute('karte')) {
        l = j.werte(parseInt(el.getAttribute('karte'), 10))[0];
      } else if (el.hasAttribute('groesste')) {
        l = j.groesste(parseInt(el.getAttribute('groesste'), 10));
      } else return h.fehler(el, 'm-e9-feld braucht raetsel, ja, karte oder groesste');
    } catch (e) { return h.fehler(el, e.message); }
    if (el.hasAttribute('l') && el.getAttribute('l') !== String(l)) return h.fehler(el, 'Lösung ist ' + l + ', nicht ' + el.getAttribute('l'));
    el.innerHTML = feldFuer(l);
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  // <m-e9-tabelle von="0" bis="15" anzahl="4" [spalten="2"]>
  // ---------------------------------------------------------------------
  B['m-e9-tabelle'] = function (el) {
    stil();
    const h = H(), j = J();
    try {
      const n = j.anzahl(parseInt(h.attr(el, 'anzahl', '4'), 10));
      const von = parseInt(h.attr(el, 'von', '0'), 10), bis = parseInt(h.attr(el, 'bis', String(j.groesste(n))), 10);
      j.pruefeZahl(von, n); j.pruefeZahl(bis, n);
      if (bis < von) return h.fehler(el, 'bis kleiner als von');
      const spalten = Math.max(1, parseInt(h.attr(el, 'spalten', '2'), 10));
      const W = j.werte(n);
      const zahlen = [];
      for (let z = von; z <= bis; z++) zahlen.push(z);
      const proSpalte = Math.ceil(zahlen.length / spalten);
      let s = '<div class="e09-tabs">';
      for (let k = 0; k < spalten; k++) {
        const teil = zahlen.slice(k * proSpalte, (k + 1) * proSpalte);
        if (!teil.length) continue;
        s += '<table class="e09-tab"><tr><th>Zahl</th>' + W.map((v) => '<th>' + v + '</th>').join('') + '<th>Nullen und Einsen</th></tr>';
        for (const z of teil) {
          const ja = j.zerlege(z, n);
          s += '<tr><td class="e09-z">' + z + '</td>' + ja.map((x) => '<td><span class="e09-dot' + (x ? ' ja' : '') + '"></span></td>').join('') + '<td class="e09-bin">' + j.ziffern(ja) + '</td></tr>';
        }
        s += '</table>';
      }
      el.innerHTML = s + '</div>';
    } catch (e) { return h.fehler(el, e.message); }
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  // <m-e9-liste karte="4" [anzahl="5"]>
  // ---------------------------------------------------------------------
  B['m-e9-liste'] = function (el) {
    stil();
    const h = H(), j = J();
    try {
      const n = j.anzahl(parseInt(h.attr(el, 'anzahl', '5'), 10));
      const v = parseInt(el.getAttribute('karte'), 10);
      const i = j.werte(n).indexOf(v);
      if (i < 0) return h.fehler(el, 'karte: ' + j.werte(n).join(', '));
      const aus = [];
      for (let z = 1; z <= j.groesste(n); z++) if (j.zerlege(z, n)[i]) aus.push(z);
      el.innerHTML = '<span class="e09-liste">' + aus.join(', ') + '</span>';
      el.dataset.anzahl = String(aus.length);
    } catch (e) { return h.fehler(el, e.message); }
    el.classList.add('komp', 'geprueft');
  };
})();
