/* =====================================================================
   Bausteine für Einheit 12 „Logikrätsel“ (Rätselart logik)
   Bilder, Regeln und Löser: web/kern/logik.js (gleich wie in der Web-App).
   Alle Lösungen kommen vom Löser (werkzeuge/arten/logik.mjs → r.loesung).

     <m-e12-gitter raetsel="e12-a2" [feld="20"] [bild="13"] [kopf="stapel"] [zeige] [loesung="keine"]>
         Logikgitter mit Bildern. Lösung: rote Kreise (Ja) und Kreuze (Nein).
         kopf="stapel": links Bild über dem Wort (schmaler, z. B. für 4 · 4)
         Mit vorgabe: lila Zeichen des Kobolds, in der Lösung das falsche rot umrandet.
         zeige: Lösung immer zeigen (Anleitung)
     <m-e12-hinweise raetsel="e12-a2" [gr="8"] [markiere] [ohne-bilder]>
         Nummerierte Hinweise als Sätze mit kleinen Bildern.
         markiere: in der Lösung „überflüssig“ bzw. „stimmt nicht“ dazuschreiben
     <m-e12-legende [gr="8"]>                       Kreis heißt Ja, Kreuz heißt Nein
     <m-e12-szene raetsel="e12-wf" [gr="34"]>       Bild für „Wahr oder falsch?“ (Tiere mit Mütze und Ding)
     <m-e12-aussagen raetsel="e12-wf" [gr="8"]>     Sätze mit „wahr“ / „falsch“ zum Einkreisen
     <m-e12-bild name="drache" [gr="8"]>            ein Bild aus web/kern/logik.js
     <m-e12-leer [n="3"] [feld="20"]>               leeres Gitter zum Selbermachen (Bilder malen)
     <m-e12-zahl raetsel="…" was="kreise|kreuze|ueberfluessig|falsch" [l="…"] [text]>
         Antwortfeld mit der Zahl aus der Lösung des Lösers (l: zur Kontrolle, text: nur die Zahl im Fließtext)
     <m-e12-anzahl raetsel="…" [ohne="2"] [nur="1,2"] l="…">
         Zahl der Lösungen (im Fließtext, vom Löser gezählt): mit allen Hinweisen, ohne Hinweis 2, nur mit 1 und 2
     <m-e12-loesung raetsel="…" [l="drache=apfel …"]>
         Lösung als Text: „Drache – Apfel, Einhorn – Eis“ (Gitter) oder „wahr, falsch, …“
   ===================================================================== */
(function () {
  'use strict';
  const B = (window.__bausteine = window.__bausteine || {});
  const H = () => window.__hilfen;
  const LG = () => window.WerkstattLogik;
  const istLoesung = (el) => !!el.closest('.loesungsmodus');

  const TINTE = '#1f2340';
  const ROT = '#d1335b';
  const LILA = '#b0408c';      // Farbe des Kobolds (Mütze und Körper im Symbol)
  const KOPF_HELL = '#fff0e3'; // Block C hell

  const CSS = `
m-e12-gitter, m-e12-szene, m-e12-leer { display: inline-block; line-height: 0; vertical-align: top; }
m-e12-gitter svg, m-e12-szene svg, m-e12-leer svg { display: block; }
m-e12-bild, m-e12-legende, m-e12-zahl { display: inline-block; vertical-align: middle; line-height: 1; }
m-e12-bild svg { display: block; }
m-e12-hinweise, m-e12-aussagen { display: block; }
m-e12-loesung, m-e12-anzahl { display: inline; }
.e12-hl { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--abst, 3mm); counter-reset: e12h; }
.e12-hl > li { position: relative; padding-left: 8.5mm; line-height: 1.5; }
.e12-hl > li::before { counter-increment: e12h; content: counter(e12h); position: absolute; left: 0; top: 0.35em; width: 6mm; height: 6mm; border-radius: 50%;
  border: 0.45mm solid var(--akzent); color: var(--akzent); font-family: var(--text); font-weight: 900; font-size: 10.5pt; line-height: 5.1mm; text-align: center; }
.e12-w { white-space: nowrap; }
.e12-w svg { display: inline-block; vertical-align: -0.28em; margin-right: 0.6mm; }
.e12-marke { display: none; }
.loesungsmodus .e12-marke { display: inline; color: var(--rot); font-weight: 700; margin-left: 2mm; }
.loesungsmodus .e12-hl > li.e12-weg > .e12-satz { text-decoration: line-through; text-decoration-color: var(--rot); text-decoration-thickness: 0.5mm; }
.e12-leg { display: inline-flex; align-items: center; gap: 2mm 6mm; flex-wrap: wrap; }
.e12-leg > span { display: inline-flex; align-items: center; gap: 2mm; white-space: nowrap; }
.e12-leg svg { display: block; }
.e12-szene { display: flex; gap: var(--abst, 8mm); justify-content: center; align-items: flex-end; }
.e12-szene > span { display: flex; flex-direction: column; align-items: center; gap: 0.5mm; }
.e12-szene .e12-name { font-size: 14pt; line-height: 1.1; }
.e12-al { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr auto; gap: var(--abst, 2.6mm) 4mm; align-items: center; counter-reset: e12a; }
.e12-al > li { display: contents; }
.e12-al .e12-satz { position: relative; padding-left: 8.5mm; line-height: 1.35; }
.e12-al .e12-satz::before { counter-increment: e12a; content: counter(e12a); position: absolute; left: 0; top: 0.2em; width: 6mm; height: 6mm; border-radius: 50%;
  border: 0.45mm solid var(--akzent); color: var(--akzent); font-family: var(--text); font-weight: 900; font-size: 10.5pt; line-height: 5.1mm; text-align: center; }
.e12-wf { display: inline-flex; gap: 3mm; }
.e12-wf > span { display: inline-flex; align-items: center; justify-content: center; min-width: 17mm; height: 9mm; padding: 0 2mm; border: 0.5mm solid var(--tinte);
  border-radius: 4.5mm; background: white; font-size: 14pt; line-height: 1; }
.loesungsmodus .e12-wf > span.e12-ja { outline: 0.9mm solid var(--rot); outline-offset: 0.8mm; color: var(--rot); font-weight: 700; }
.e12-lsg-text { color: inherit; }
`;
  function stil() {
    if (document.getElementById('e12-stil')) return;
    const st = document.createElement('style');
    st.id = 'e12-stil';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function raetselVon(el, aufgabe) {
    const h = H();
    const id = el.getAttribute('raetsel');
    if (!id) { h.fehler(el, 'raetsel="…" fehlt'); return null; }
    const r = h.DATEN.raetsel[id];
    if (!r) { h.fehler(el, 'Rätsel „' + id + '“ gibt es nicht in raetsel/*.json'); return null; }
    if (r.art !== 'logik') { h.fehler(el, 'Rätsel „' + id + '“ ist kein Logikrätsel (art: ' + r.art + ')'); return null; }
    if (aufgabe && (r.aufgabe || 'gitter') !== aufgabe) { h.fehler(el, 'Rätsel „' + id + '“ ist keine Aufgabe „' + aufgabe + '“'); return null; }
    if (!r.loesung) { h.fehler(el, 'Rätsel „' + id + '“ hat keine Lösung (Löser-Fehler?)'); return null; }
    return r;
  }

  // Satz mit kleinen Bildern (HTML)
  function satzHTML(text, woerter, gr, ohneBilder) {
    const h = H();
    return LG().satz(text, woerter).map((t) => {
      if (t.text !== undefined) return h.esc(t.text);
      if (!t.bild || ohneBilder) return h.esc(t.wort);
      return '<span class="e12-w">' + LG().bild(t.name, gr + 'mm') + h.esc(t.wort) + '</span>';
    }).join('');
  }

  // Zeichen in mm-Koordinaten (Mitte cx, cy, Feldgröße f)
  function kreis(cx, cy, f, farbe, w) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + (f * 0.3) + '" fill="none" stroke="' + farbe + '" stroke-width="' + w + '"/>';
  }
  function kreuz(cx, cy, f, farbe, w) {
    const d = f * 0.24;
    return '<path d="M' + (cx - d) + ' ' + (cy - d) + ' L' + (cx + d) + ' ' + (cy + d) + ' M' + (cx + d) + ' ' + (cy - d) + ' L' + (cx - d) + ' ' + (cy + d) +
      '" fill="none" stroke="' + farbe + '" stroke-width="' + w + '" stroke-linecap="round"/>';
  }
  const r2 = (x) => Math.round(x * 100) / 100;
  // Breite eines Worts in Andika (grob, mm) bei Schriftgröße fs (mm)
  const wortBreite = (w, fs) => Array.from(w).reduce((s, c) => s + (/[mwMW]/.test(c) ? 0.78 : /[iljtfrI]/.test(c) ? 0.32 : /[A-ZÄÖÜ]/.test(c) ? 0.62 : 0.52), 0) * fs;

  // ---------------------------------------------------------------------
  // Gitter (SVG in mm): links die Zeilen (Bild + Wort), oben die Spalten (Bild über Wort)
  // ---------------------------------------------------------------------
  function gitterSVG(o) {
    const { zeilen, spalten, woerter, feld, bg, leer } = o;
    const fs = feld >= 17 ? 4.9 : r2(feld * 0.26);   // auf dem Blatt etwa 14 pt, in der Anleitung kleiner
    const L = LG();
    const n = zeilen.length;
    const wortZ = zeilen.map((a) => (leer ? '' : L.wort(a, woerter)));
    const wortS = spalten.map((x) => (leer ? '' : L.kurz(x, woerter)));
    const stapel = !!o.stapel;            // Zeilen-Kopf: Bild über dem Wort (schmaler)
    const maxWortZ = Math.max(...wortZ.map((w) => wortBreite(w, fs)));
    const kopfB = leer ? feld + 6 : stapel ? r2(Math.max(feld, bg + 4, maxWortZ + 3)) : r2(Math.max(feld, 2.5 + bg + 2 + maxWortZ + 3));
    const kopfH = leer ? feld + 4 : r2(2 + bg + 1.2 + fs + 1.8);
    const W = r2(kopfB + n * feld), Hh = r2(kopfH + n * feld);
    const pad = 0.6;
    let s = '';
    // Kopf-Flächen
    s += '<rect x="0" y="' + kopfH + '" width="' + kopfB + '" height="' + (n * feld) + '" fill="' + KOPF_HELL + '"/>';
    s += '<rect x="' + kopfB + '" y="0" width="' + (n * feld) + '" height="' + kopfH + '" fill="' + KOPF_HELL + '"/>';
    // Spalten-Köpfe
    spalten.forEach((x, j) => {
      const cx = kopfB + j * feld + feld / 2;
      if (leer) {
        s += '<rect x="' + r2(cx - feld / 2 + 2.5) + '" y="2.5" width="' + (feld - 5) + '" height="' + (kopfH - 5) + '" rx="2" fill="white" stroke="#b9bdd3" stroke-width="0.4" stroke-dasharray="1.6 1.2"/>';
        return;
      }
      if (L.hat(x)) s += '<g transform="translate(' + r2(cx - bg / 2) + ' 2) scale(' + r2(bg / 100) + ')">' + L.BILDER[x].svg + '</g>';
      s += '<text x="' + r2(cx) + '" y="' + r2(2 + bg + 1.2 + fs * 0.8) + '" font-family="Andika, sans-serif" font-size="' + fs + '" text-anchor="middle" fill="' + TINTE + '">' + H().esc(wortS[j]) + '</text>';
    });
    // Zeilen-Köpfe
    zeilen.forEach((a, i) => {
      const cy = kopfH + i * feld + feld / 2;
      if (leer) {
        s += '<rect x="2.5" y="' + r2(cy - feld / 2 + 2.5) + '" width="' + (kopfB - 5) + '" height="' + (feld - 5) + '" rx="2" fill="white" stroke="#b9bdd3" stroke-width="0.4" stroke-dasharray="1.6 1.2"/>';
        return;
      }
      if (stapel) {
        const y0 = cy - (bg + 0.8 + fs) / 2;
        if (L.hat(a)) s += '<g transform="translate(' + r2(kopfB / 2 - bg / 2) + ' ' + r2(y0) + ') scale(' + r2(bg / 100) + ')">' + L.BILDER[a].svg + '</g>';
        s += '<text x="' + r2(kopfB / 2) + '" y="' + r2(y0 + bg + 0.8 + fs * 0.78) + '" font-family="Andika, sans-serif" font-size="' + fs + '" text-anchor="middle" fill="' + TINTE + '">' + H().esc(wortZ[i]) + '</text>';
        return;
      }
      let x0 = 2.5;
      if (L.hat(a)) { s += '<g transform="translate(' + x0 + ' ' + r2(cy - bg / 2) + ') scale(' + r2(bg / 100) + ')">' + L.BILDER[a].svg + '</g>'; x0 += bg + 2; }
      s += '<text x="' + r2(x0) + '" y="' + r2(cy + fs * 0.33) + '" font-family="Andika, sans-serif" font-size="' + fs + '" fill="' + TINTE + '">' + H().esc(wortZ[i]) + '</text>';
    });
    // Linien
    for (let i = 0; i <= n; i++) {
      const y = r2(kopfH + i * feld), x = r2(kopfB + i * feld);
      s += '<line x1="' + (i === 0 ? 0 : kopfB) + '" y1="' + y + '" x2="' + W + '" y2="' + y + '" stroke="' + TINTE + '" stroke-width="' + (i === 0 || i === n ? 0.7 : 0.35) + '"/>';
      s += '<line x1="' + x + '" y1="' + (i === 0 ? 0 : kopfH) + '" x2="' + x + '" y2="' + Hh + '" stroke="' + TINTE + '" stroke-width="' + (i === 0 || i === n ? 0.7 : 0.35) + '"/>';
    }
    s += '<line x1="0" y1="' + kopfH + '" x2="0" y2="' + Hh + '" stroke="' + TINTE + '" stroke-width="0.7"/>';
    s += '<line x1="' + kopfB + '" y1="0" x2="' + W + '" y2="0" stroke="' + TINTE + '" stroke-width="0.7"/>';
    // Zeichen
    const mitte = (a, x) => [r2(kopfB + spalten.indexOf(x) * feld + feld / 2), r2(kopfH + zeilen.indexOf(a) * feld + feld / 2)];
    for (const z of o.zeichen || []) {
      const [cx, cy] = mitte(z.a, z.x);
      if (z.ring) s += '<rect x="' + r2(cx - feld / 2 + 1.2) + '" y="' + r2(cy - feld / 2 + 1.2) + '" width="' + r2(feld - 2.4) + '" height="' + r2(feld - 2.4) + '" rx="2" fill="none" stroke="' + ROT + '" stroke-width="0.7" stroke-dasharray="1.8 1.2"/>';
      if (z.art) s += (z.art === 'ja' ? kreis : kreuz)(cx, cy, z.gr || feld, z.farbe, z.w || 1.1);
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + r2(W + pad * 2) + 'mm" height="' + r2(Hh + pad * 2) + 'mm" viewBox="' + (-pad) + ' ' + (-pad) + ' ' + r2(W + pad * 2) + ' ' + r2(Hh + pad * 2) + '" role="img" aria-label="Logikgitter">' + s + '</svg>';
  }

  B['m-e12-gitter'] = function (el) {
    stil();
    const r = raetselVon(el, 'gitter');
    if (!r) return;
    const h = H();
    const l = r.loesung;
    const feld = parseFloat(el.getAttribute('feld') || '20');
    const bg = parseFloat(el.getAttribute('bild') || String(Math.min(13, feld * 0.68)));
    if (!el.hasAttribute('zeige') && feld < 15) h.fehler(el, 'Logikgitter auf dem Blatt: Felder mindestens 15 mm (feld="' + feld + '")');
    const zeigen = el.hasAttribute('zeige') || (istLoesung(el) && el.getAttribute('loesung') !== 'keine');
    if (zeigen && !l.zuordnung) return h.fehler(el, 'Rätsel „' + r.id + '“ hat keine eindeutige Lösung zum Zeigen');
    const zeichen = [];
    const vorgabe = {};
    const v = r.vorgabe || {};
    for (const art of ['ja', 'nein']) for (const [a, x] of v[art] || []) vorgabe[a + '|' + x] = art;
    // lila Zeichen des Kobolds (auf dem Blatt immer, in der Lösung auch)
    for (const [k, art] of Object.entries(vorgabe)) {
      const [a, x] = k.split('|');
      zeichen.push({ a, x, art, farbe: LILA, w: 1.3, gr: feld * 0.92 });
    }
    if (zeigen) {
      for (const a of r.zeilen) for (const x of r.spalten) {
        const soll = l.marken[a + '|' + x];
        const vg = vorgabe[a + '|' + x];
        if (vg === soll) continue;                 // richtiges Kobold-Zeichen: nichts dazu
        zeichen.push({ a, x, art: soll, farbe: ROT, ring: !!vg, w: 1.1, gr: vg ? feld * 0.62 : feld });
      }
    }
    const stapel = el.getAttribute('kopf') === 'stapel';
    if (stapel && bg + 0.8 + 4.9 > feld - 1.5) h.fehler(el, 'kopf="stapel": Bild (' + bg + ' mm) und Wort passen nicht in ein Feld von ' + feld + ' mm');
    el.innerHTML = gitterSVG({ zeilen: r.zeilen, spalten: r.spalten, woerter: r.woerter, feld, bg, zeichen, stapel });
    el.dataset.loesung = l.zuordnung ? r.zeilen.map((a) => a + '=' + l.zuordnung[a]).join(' ') : '';
    el.classList.add('komp', 'geprueft');
  };

  B['m-e12-leer'] = function (el) {
    stil();
    const n = parseInt(el.getAttribute('n') || '3', 10);
    const feld = parseFloat(el.getAttribute('feld') || '20');
    if (!(n >= 2 && n <= 4)) return H().fehler(el, 'n: 2 bis 4');
    const z = Array.from({ length: n }, (_, i) => 'z' + i), s = Array.from({ length: n }, (_, i) => 's' + i);
    el.innerHTML = gitterSVG({ zeilen: z, spalten: s, feld, bg: 0, leer: true });
    el.classList.add('komp');
  };

  B['m-e12-hinweise'] = function (el) {
    stil();
    const r = raetselVon(el, 'gitter');
    if (!r) return;
    const gr = parseFloat(el.getAttribute('gr') || '8');
    const abst = el.getAttribute('abstand');
    const ohneB = el.hasAttribute('ohne-bilder');
    const mark = el.hasAttribute('markiere');
    const l = r.loesung;
    const items = (r.hinweise || []).map((hw, i) => {
      const nr = i + 1;
      let marke = '', cls = '';
      if (mark && (l.ueberfluessig || []).includes(nr)) marke = '<span class="e12-marke">überflüssig</span>';
      if (mark && l.falscherHinweis === nr) { marke = '<span class="e12-marke">stimmt nicht</span>'; cls = ' class="e12-weg"'; }
      return '<li' + cls + '><span class="e12-satz">' + satzHTML(hw.text, r.woerter, gr, ohneB) + '</span>' + marke + '</li>';
    });
    el.innerHTML = '<ol class="e12-hl"' + (abst ? ' style="--abst:' + abst + 'mm"' : '') + '>' + items.join('') + '</ol>';
    el.classList.add('komp', 'geprueft');
  };

  B['m-e12-legende'] = function (el) {
    stil();
    const gr = parseFloat(el.getAttribute('gr') || '8');
    const z = (art) => '<svg xmlns="http://www.w3.org/2000/svg" width="' + gr + 'mm" height="' + gr + 'mm" viewBox="0 0 20 20" aria-hidden="true">' +
      '<rect x="0.4" y="0.4" width="19.2" height="19.2" rx="1.5" fill="white" stroke="' + TINTE + '" stroke-width="0.5"/>' + (art === 'ja' ? kreis : kreuz)(10, 10, 20, TINTE, 1.6) + '</svg>';
    el.innerHTML = '<span class="e12-leg"><span>' + z('ja') + 'heißt Ja.</span><span>' + z('nein') + 'heißt Nein.</span></span>';
    el.classList.add('komp');
  };

  B['m-e12-bild'] = function (el) {
    const name = el.getAttribute('name');
    if (!LG().hat(name)) return H().fehler(el, 'Unbekanntes Bild „' + name + '“ (web/kern/logik.js)');
    el.innerHTML = LG().bild(name, parseFloat(el.getAttribute('gr') || '8') + 'mm');
    el.classList.add('komp');
  };

  B['m-e12-szene'] = function (el) {
    stil();
    const r = raetselVon(el, 'wahrfalsch');
    if (!r) return;
    const gr = parseFloat(el.getAttribute('gr') || '34');
    const abst = el.getAttribute('abstand');
    el.innerHTML = '<span class="e12-szene"' + (abst ? ' style="--abst:' + abst + 'mm"' : '') + '>' + r.szene.map((t) =>
      '<span>' + LG().szeneBild(t.tier, t.hat, gr + 'mm') + '<span class="e12-name">' + H().esc(LG().wort(t.tier)) + '</span></span>').join('') + '</span>';
    el.classList.add('komp');
  };

  B['m-e12-aussagen'] = function (el) {
    stil();
    const r = raetselVon(el, 'wahrfalsch');
    if (!r) return;
    const gr = parseFloat(el.getAttribute('gr') || '8');
    const abst = el.getAttribute('abstand');
    const w = r.loesung.werte;
    el.innerHTML = '<ol class="e12-al"' + (abst ? ' style="--abst:' + abst + 'mm"' : '') + '>' + r.aussagen.map((a, i) =>
      '<li><span class="e12-satz">' + satzHTML(a.text, r.woerter, gr, r.ohneBilder) + '</span>' +
      '<span class="e12-wf"><span' + (w[i] ? ' class="e12-ja"' : '') + '>wahr</span><span' + (!w[i] ? ' class="e12-ja"' : '') + '>falsch</span></span></li>').join('') + '</ol>';
    el.classList.add('komp', 'geprueft');
  };

  B['m-e12-zahl'] = function (el) {
    const h = H();
    const r = raetselVon(el);
    if (!r) return;
    const was = el.getAttribute('was');
    const l = r.loesung;
    let n;
    if (was === 'kreise') n = l.kreise;
    else if (was === 'kreuze') n = l.kreuze;
    else if (was === 'ueberfluessig') {
      if ((l.ueberfluessig || []).length !== 1) return h.fehler(el, 'was="ueberfluessig": der Löser findet ' + (l.ueberfluessig || []).length + ' überflüssige Hinweise (soll genau 1)');
      n = l.ueberfluessig[0];
    } else if (was === 'falsch') {
      if (!l.falscherHinweis) return h.fehler(el, 'was="falsch": Rätsel ohne falschen Hinweis');
      n = l.falscherHinweis;
    } else return h.fehler(el, 'was: kreise, kreuze, ueberfluessig oder falsch');
    if (n === undefined) return h.fehler(el, 'Keine Zahl in der Lösung');
    if (el.hasAttribute('l') && +el.getAttribute('l') !== n) h.fehler(el, 'l="' + el.getAttribute('l') + '", aber der Löser sagt ' + n);
    if (el.hasAttribute('text')) el.textContent = String(n);     // im Fließtext der Anleitung: nur die Zahl
    else el.innerHTML = h.feldHTML(String(n), 'k');
    el.classList.add('komp', 'geprueft');
  };

  B['m-e12-anzahl'] = function (el) {
    const h = H();
    const r = raetselVon(el, 'gitter');
    if (!r) return;
    const nummern = (a) => (el.getAttribute(a) || '').split(/[\s,]+/).filter(Boolean).map((x) => parseInt(x, 10) - 1);
    const opt = {};
    if (el.hasAttribute('ohne')) opt.ohne = nummern('ohne');
    if (el.hasAttribute('nur')) opt.nur = nummern('nur');
    const n = LG().loese(r, opt).anzahl;
    if (!el.hasAttribute('l')) h.fehler(el, 'm-e12-anzahl braucht l="…" (der Löser zählt ' + n + ')');
    else if (+el.getAttribute('l') !== n) h.fehler(el, 'l="' + el.getAttribute('l') + '", aber der Löser zählt ' + n + ' Lösungen');
    el.textContent = String(n);
    el.classList.add('komp', 'geprueft');
  };

  B['m-e12-loesung'] = function (el) {
    const h = H();
    const r = raetselVon(el);
    if (!r) return;
    const l = r.loesung;
    let t;
    if ((r.aufgabe || 'gitter') === 'wahrfalsch') t = l.text.join(', ');
    else {
      if (!l.zuordnung) return h.fehler(el, 'Rätsel „' + r.id + '“ hat keine eindeutige Lösung');
      const soll = el.getAttribute('l');
      const ist = r.zeilen.map((a) => a + '=' + l.zuordnung[a]).join(' ');
      if (soll && soll.trim().split(/\s+/).sort().join(' ') !== ist.split(' ').sort().join(' ')) h.fehler(el, 'l="' + soll + '", aber der Löser sagt ' + ist);
      t = r.zeilen.map((a) => LG().wort(a, r.woerter) + ': ' + LG().wort(l.zuordnung[a], r.woerter)).join(', ');
    }
    el.innerHTML = '<span class="e12-lsg-text">' + h.esc(t) + '</span>';
    el.classList.add('komp', 'geprueft');
  };
})();
