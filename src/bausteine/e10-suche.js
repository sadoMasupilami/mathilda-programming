/* =====================================================================
   Bausteine für Einheit 10 „Sortieren und Suchen“ (Rätselart "suche")
   Zeichnungen und Rechnen kommen aus web/kern/suche.js (dieselben wie in der Web-App),
   die Lösungen aus dem Löser (werkzeuge/arten/suche.mjs → r.loesung).

     <m-e10-netz raetsel="e10-n1" [feld="13"] [abstand="28"] [zeile="22.5"] [masse="50 cm, 60 cm"] [ohne-text] [breite="40mm" | skala="0.3"]>
         Sortier-Netz aus raetsel/e10.json, je nach aufgabe:
         netz        mit start: Zahlen am Start gedruckt, die Kästchen leer.
                     Lösung (rot): alle Zahlen in den Kästchen.
                     ohne start: nur das Netz (Start- und Ziel-Kästchen leer, keine in der Mitte)
         netzKobold  alle Zahlen gedruckt, wie der Kobold sie gelegt hat.
                     Lösung: die falsche Vergleichs-Stelle rot umrandet und ein Satz darunter.
         netzFrage   Start-Kästchen leer (das Kind schreibt die Reihenfolge hinein).
                     Lösung: die eine passende Reihenfolge und alle Zahlen in den Kästchen.
         masse: Maße für den Plan am Boden (Abstand der Bahnen, Abstand der Vergleichs-Stellen)
     <m-e10-punkt art="klein|gross" [gr="5"]>
         kleiner oder großer Punkt einer Vergleichs-Stelle (für Erklärungen)
     <m-e10-halbier raetsel="e10-h1" [feld="10.5"]>
         Halbier-Suche am Blatt (aufgabe naechste): Zahlen-Leiste zum Durchstreichen, für jede
         Frage „Ist deine Zahl größer als __?“ mit der Antwort der Fee, am Ende „Die Zahl ist __“.
         Lösung: die Zahlen der Fragen, alles außer der Zahl rot durchgestrichen, die Zahl umkreist.
     <m-e10-leiter raetsel="e10-l2" [beispiel] [feld="12"] [pfeil="9"] [zahl="rechts|unten|nein"]>
         Halbier-Leiter (aufgabe hoechstens): bis, dann halbieren bis 1, Kästchen leer, dazu
         „Fragen: __“ rechts daneben, darunter oder gar nicht (dann eigenes <m-e10-zahl>).
         beispiel: alles gedruckt (zum Vormachen). Lösung: rote Zahlen.
     <m-e10-alle n="3" [spalten="3"]>
         Alle Reihenfolgen der Zahlen 1 bis n: n! Gruppen leerer Kästchen. Lösung: alle Reihenfolgen.
     <m-e10-zahl raetsel="…" was="fragen|gebraucht|gefunden|wenigsteTausche|reihenfolgen|schlecht" [art="k"] [zeige]>
         Antwortfeld, die Zahl kommt vom Löser (zeige: schon eingetragen, für Beispiele)
     <m-e10-wert raetsel="…" was="…">
         dieselbe Zahl als Text (Anleitung), was wie oben oder leiter, ende, start, antwort
     <m-e10-fragen raetsel="e10-f1">
         Die Fragen eines Kobold-Spiels als Text (Anleitung), die schlechte Frage hervorgehoben
   Eigene Gestaltung: Klassen mit Präfix e10- (CSS hier, einmal pro Dokument).
   ===================================================================== */
(function () {
  'use strict';
  const B = (window.__bausteine = window.__bausteine || {});
  const H = () => window.__hilfen;
  const S = () => window.WerkstattSuche;
  const istLoesung = (el) => !!el.closest('.loesungsmodus');

  const CSS = `
m-e10-netz, m-e10-punkt, m-e10-leiter, m-e10-zahl { display: inline-block; vertical-align: middle; line-height: 0; }
m-e10-halbier, m-e10-alle { display: block; }
m-e10-wert, m-e10-fragen { display: inline; }
m-e10-netz svg, m-e10-punkt svg, m-e10-leiter svg, m-e10-halbier svg { display: block; }
m-e10-punkt svg { display: inline-block; vertical-align: -0.12em; }
.e10-netz { display: inline-flex; flex-direction: column; align-items: flex-start; gap: 1.5mm; line-height: 1.2; }
.e10-lsg { display: none; }
.loesungsmodus .e10-lsg { display: block; color: var(--rot); font-family: var(--kind); font-weight: 700; font-size: 14pt; line-height: 1.2; max-width: 80mm; }
.e10-halbier { display: flex; flex-direction: column; gap: 3mm; line-height: 1.2; }
.e10-halbier .e10-leiste { margin-bottom: 1mm; }
.e10-frage { display: flex; align-items: center; gap: 2.5mm; font-size: 16pt; }
.e10-frage .e10-nr { font-family: var(--text); font-weight: 900; font-size: 14pt; color: var(--grau); width: 5mm; text-align: right; }
.e10-frage .feld { width: 20mm; }
.e10-antwort { display: inline-flex; align-items: center; gap: 1.5mm; margin-left: 3mm; }
.e10-blase { display: inline-block; border: 0.55mm solid var(--akzent); background: var(--akzent-hell); border-radius: 4mm; padding: 0.8mm 3mm; font-weight: 700; font-size: 16pt; line-height: 1.15; position: relative; }
.e10-blase::after { content: ""; position: absolute; right: -2.4mm; top: 50%; margin-top: -1.6mm; border: 1.6mm solid transparent; border-left-color: var(--akzent); border-right: 0; }
.e10-ende { display: flex; align-items: center; gap: 2.5mm; font-size: 16pt; }
.e10-leiter { display: inline-flex; align-items: center; gap: 1mm; line-height: 1; font-family: var(--kind); }
.e10-stufe { min-width: var(--f, 12mm); height: var(--f, 12mm); padding: 0 1.2mm; border: 0.55mm solid var(--tinte); border-radius: 1.6mm; background: white;
  display: inline-flex; align-items: center; justify-content: center; font-size: 18pt; box-sizing: border-box; }
.e10-stufe.e10-voll { background: var(--akzent-hell); }
.e10-stufe .lsg { line-height: 1; }
.e10-zaehl { display: inline-flex; align-items: center; gap: 1.5mm; font-size: 16pt; white-space: nowrap; line-height: 1; font-family: var(--kind); }
.e10-leiter-zeile { display: inline-flex; align-items: center; gap: 5mm; }
.e10-leiter-spalte { display: inline-flex; flex-direction: column; align-items: flex-start; gap: 3mm; }
.e10-alle { display: grid; grid-template-columns: repeat(var(--sp, 3), auto); justify-content: start; gap: 3mm 9mm; line-height: 1; }
.e10-gruppe { display: inline-flex; gap: 1.2mm; }
.e10-gruppe .e10-stufe { --f: 10mm; font-size: 16pt; }
.e10-fragen-text b.e10-schlecht { color: var(--rot); }
`;
  function stil() {
    if (document.getElementById('e10-stil')) return;
    const st = document.createElement('style');
    st.id = 'e10-stil';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function raetselVon(el, aufgaben) {
    const h = H();
    const id = el.getAttribute('raetsel');
    if (!id) { h.fehler(el, 'raetsel="…" fehlt'); return null; }
    const r = h.DATEN.raetsel[id];
    if (!r) { h.fehler(el, 'Rätsel „' + id + '“ gibt es nicht in raetsel/*.json'); return null; }
    if (r.art !== 'suche') { h.fehler(el, 'Rätsel „' + id + '“ ist nicht von der Art suche'); return null; }
    if (aufgaben && !aufgaben.includes(r.aufgabe)) { h.fehler(el, 'Rätsel „' + id + '“: aufgabe ' + r.aufgabe + ' passt hier nicht (' + aufgaben.join(', ') + ')'); return null; }
    if (!r.loesung) { h.fehler(el, 'Rätsel „' + id + '“ hat keine Lösung (Löser-Fehler?)'); return null; }
    return r;
  }
  const zahlAttr = (el, name, def) => (el.hasAttribute(name) ? parseFloat(el.getAttribute(name)) : def);

  // ---------------------------------------------------------------------
  // <m-e10-netz raetsel="…">
  // ---------------------------------------------------------------------
  B['m-e10-netz'] = function (el) {
    stil();
    const h = H();
    const r = raetselVon(el, ['netz', 'netzKobold', 'netzFrage']);
    if (!r) return;
    const l = r.loesung;
    const opt = {
      feld: zahlAttr(el, 'feld', 13), abstand: zahlAttr(el, 'abstand', 28), zeile: zahlAttr(el, 'zeile', 22.5),
      beschriftung: !el.hasAttribute('ohne-text'), titel: 'Sortier-Netz mit ' + r.bahnen + ' Bahnen',
    };
    if (el.hasAttribute('breite')) opt.breite = el.getAttribute('breite');
    if (el.hasAttribute('skala')) opt.breite = Math.round(S().netzLage(r.bahnen, r.vergleiche, opt).w * zahlAttr(el, 'skala', 1) * 10) / 10 + 'mm';
    if (el.hasAttribute('masse')) {
      const m = el.getAttribute('masse').split(',').map((x) => x.trim());
      opt.masse = { quer: m[0] || '', laengs: m[1] || '' };
    }
    let unten = '';
    if (r.aufgabe === 'netz') {
      if (l.start) { opt.start = l.start; opt.loesung = l.werte; }
      else opt.leer = true;
    } else if (r.aufgabe === 'netzKobold') {
      opt.werte = l.gezeigt;
      opt.kreis = l.kobold;
      const st = l.stelle;
      unten = 'Hier! Die ' + st.raus[0] + ' steht am kleinen Punkt, die ' + st.raus[1] + ' am großen. Richtig wäre tauschen, dann am Ziel: ' + l.ende.join(', ') + '.';
    } else {
      opt.loesung = l.werte;
    }
    try {
      el.innerHTML = '<span class="e10-netz">' + S().netzSVG(r.bahnen, r.vergleiche, opt) + (unten ? '<span class="e10-lsg">' + h.esc(unten) + '</span>' : '') + '</span>';
    } catch (e) { return h.fehler(el, e.message); }
    el.classList.add('komp', 'geprueft');
  };

  // <m-e10-punkt art="klein|gross">
  B['m-e10-punkt'] = function (el) {
    stil();
    const art = el.getAttribute('art') || 'klein';
    if (!['klein', 'gross'].includes(art)) return H().fehler(el, 'art="klein" oder art="gross"');
    el.innerHTML = S().punktSVG(art === 'gross', zahlAttr(el, 'gr', 5));
    el.classList.add('komp');
  };

  // ---------------------------------------------------------------------
  // <m-e10-halbier raetsel="e10-h1">  Halbier-Suche am Blatt
  // ---------------------------------------------------------------------
  B['m-e10-halbier'] = function (el) {
    stil();
    const h = H();
    const r = raetselVon(el, ['naechste']);
    if (!r) return;
    const l = r.loesung;
    const feld = zahlAttr(el, 'feld', 10.5);
    const weg = [];
    for (let z = 1; z <= l.bis; z++) if (z !== l.gefunden) weg.push(z);
    const pz = l.bis > 16 ? 16 : l.bis;
    let html = '<div class="e10-halbier"><div class="e10-leiste">' + S().leisteSVG(1, l.bis, { feld, hoehe: feld + 0.5, proZeile: pz, wegLsg: weg, ring: [l.gefunden] }) + '</div>';
    l.schritte.forEach((s, i) => {
      const fertig = i < l.vorgegeben;
      const feldH = fertig ? '<span class="feld"><span>' + s.x + '</span></span>' : h.feldHTML(String(s.x), '');
      html += '<div class="e10-frage"><span class="e10-nr">' + (i + 1) + '</span><span>Ist deine Zahl größer als</span>' + feldH + '<span>?</span>' +
        '<span class="e10-antwort"><span class="e10-blase">' + (s.ja ? 'Ja!' : 'Nein!') + '</span></span></div>';
    });
    html += '<div class="e10-ende"><span>Die Zahl ist</span>' + h.feldHTML(String(l.gefunden), '') + '<span>.</span></div></div>';
    el.innerHTML = html;
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  // <m-e10-leiter raetsel="e10-l2" [beispiel]>  Halbier-Leiter
  // ---------------------------------------------------------------------
  B['m-e10-leiter'] = function (el) {
    stil();
    const h = H();
    const r = raetselVon(el, ['hoechstens', 'raten']);
    if (!r) return;
    const l = r.loesung;
    const feld = zahlAttr(el, 'feld', 12);
    const pfeil = zahlAttr(el, 'pfeil', 9);
    const bsp = el.hasAttribute('beispiel');
    const stufe = (v, voll) => '<span class="e10-stufe' + (voll ? ' e10-voll' : '') + '">' + (voll ? '<span>' + v + '</span>' : '<span class="lsg">' + v + '</span>') + '</span>';
    let html = '<span class="e10-leiter" style="--f:' + feld + 'mm">';  // nur die Leiter, die Fragen-Zahl kommt danach
    l.leiter.forEach((v, i) => {
      if (i) html += S().pfeilSVG(pfeil);
      html += stufe(v, i === 0 || bsp);
    });
    html += '</span>';
    const wo = el.getAttribute('zahl') || 'rechts';
    if (!['rechts', 'unten', 'nein'].includes(wo)) return h.fehler(el, 'zahl="rechts|unten|nein"');
    if (wo !== 'nein') {
      const zahl = bsp ? '<span class="feld k"><span>' + l.fragen + '</span></span>' : h.feldHTML(String(l.fragen), l.fragen >= 10 ? '' : 'k');
      const zaehl = '<span class="e10-zaehl">Fragen:' + zahl + '</span>';
      html = wo === 'unten' ? '<span class="e10-leiter-spalte">' + html + zaehl + '</span>' : '<span class="e10-leiter-zeile">' + html + zaehl + '</span>';
    }
    el.innerHTML = html;
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  // <m-e10-alle n="3">  alle Reihenfolgen
  // ---------------------------------------------------------------------
  B['m-e10-alle'] = function (el) {
    stil();
    const h = H();
    const n = parseInt(el.getAttribute('n') || '3', 10);
    if (!(n >= 2 && n <= 4)) return h.fehler(el, 'n: 2 bis 4');
    const basis = Array.from({ length: n }, (_, i) => i + 1);
    const alle = S().reihenfolgen(basis);
    if (el.hasAttribute('l') && +el.getAttribute('l') !== alle.length) return h.fehler(el, 'Es gibt ' + alle.length + ' Reihenfolgen, nicht ' + el.getAttribute('l'));
    const sp = parseInt(el.getAttribute('spalten') || '3', 10);
    el.innerHTML = '<div class="e10-alle" style="--sp:' + sp + '">' + alle.map((p) => '<span class="e10-gruppe">' +
      p.map((z) => '<span class="e10-stufe"><span class="lsg">' + z + '</span></span>').join('') + '</span>').join('') + '</div>';
    el.dataset.loesung = alle.map((p) => p.join('')).join(' ');
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  // <m-e10-zahl raetsel was>  Antwortfeld, <m-e10-wert raetsel was>  Text
  // ---------------------------------------------------------------------
  function wertVon(el) {
    const h = H();
    const r = raetselVon(el);
    if (!r) return null;
    const was = el.getAttribute('was');
    const l = r.loesung;
    if (!was || !(was in l)) { h.fehler(el, 'was="…": ' + Object.keys(l).filter((k) => typeof l[k] !== 'object' || Array.isArray(l[k])).join(', ')); return null; }
    let v = l[was];
    if (Array.isArray(v)) v = v.join(el.getAttribute('trenner') || ', ');
    if (el.hasAttribute('l') && String(v) !== el.getAttribute('l')) { h.fehler(el, 'Löser sagt ' + v + ', nicht ' + el.getAttribute('l')); return null; }
    return String(v);
  }
  B['m-e10-zahl'] = function (el) {
    const h = H();
    const v = wertVon(el);
    if (v === null) return;
    const art = el.getAttribute('art') || h.feldArt(v, v.length === 1 ? 'k' : '');
    el.innerHTML = el.hasAttribute('zeige') ? '<span class="feld' + (art ? ' ' + art : '') + '"><span>' + h.esc(v) + '</span></span>' : h.feldHTML(v, art);
    el.classList.add('komp', 'geprueft');
  };
  B['m-e10-wert'] = function (el) {
    const v = wertVon(el);
    if (v === null) return;
    el.textContent = v;
    el.classList.add('komp', 'geprueft');
  };

  // <m-e10-fragen raetsel="e10-f1">
  B['m-e10-fragen'] = function (el) {
    stil();
    const h = H();
    const r = raetselVon(el, ['frageKobold', 'naechste']);
    if (!r) return;
    const l = r.loesung;
    el.innerHTML = '<span class="e10-fragen-text">' + l.schritte.map((s, i) => {
      const t = '„größer als ' + s.x + '?“ ' + (s.ja ? 'Ja' : 'Nein');
      return (l.schlecht === i + 1) ? '<b class="e10-schlecht">' + h.esc(t) + '</b>' : h.esc(t);
    }).join(', ') + '</span>';
    el.classList.add('komp', 'geprueft');
  };
})();
