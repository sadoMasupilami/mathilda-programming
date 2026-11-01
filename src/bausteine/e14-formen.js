/* =====================================================================
   Bausteine für Einheit 14 „Formen-Quadrate“
     <m-e14-quadrat raetsel="e14-a1" [feld="24"] [loesung="keine"] [zeige] [mit-loesung]>
         Formen-Quadrat aus raetsel/e14.json (Art formen). Leere Felder zum Einzeichnen.
         Lösungsansicht: fehlende Formen als roter Umriss (bei Farben: bunt mit rotem Rand),
         beim Kobold-Quadrat (aufgabe "kobold") ein roter Kreis um das falsche Feld.
         zeige: gleich das fertige Quadrat (z. B. als Beispiel in der Anleitung)
         mit-loesung: immer mit roter Lösung (Anleitung, Lösungsteil)
         Bei Rätseln mit Schrägen-Regel sind die zwei Schrägen hell hinterlegt.
     <m-e14-quadrat leer n="4" [feld="20"] [beispiel="e14-e4"] [schraege]>
         leeres Quadrat zum Selbermachen; beispiel: in der Lösungsansicht die Vorgabe
         dieses Rätsels rot eingetragen („so könnte es gehen“)
     <m-e14-form name="kreis" [gr="6"] [farbe="blau"] [leer]>
         eine Form (für Text, Formen-Leiste und Anleitung); leer: weiß, nur Umriss
     <m-e14-linie art="reihe|spalte" formen="K D Q" [feld="14"]>
         ein Streifen (Reihe waagrecht, Spalte senkrecht) zum Zeigen der Regel
     <m-e14-antwort raetsel="e14-k1" [gr="20"]>
         Kästchen für die richtige Form beim Kobold-Quadrat (Lösung: die Form rot)
   Alle Lösungen kommen vom Löser (werkzeuge/arten/formen.mjs), die Formen aus
   web/kern/formen.js (dieselben wie in der Web-App). Felder auf Blättern mindestens 20 mm.
   ===================================================================== */
(function () {
  'use strict';
  const B = (window.__bausteine = window.__bausteine || {});
  const H = () => window.__hilfen;
  const FQ = () => window.WerkstattFormen;
  const istLoesung = (el) => !!el.closest('.loesungsmodus');
  const aufBlatt = (el) => !!el.closest('.blatt');

  const CSS = `
m-e14-quadrat, m-e14-linie, m-e14-antwort { display: inline-block; vertical-align: middle; line-height: 0; }
m-e14-form { display: inline-block; vertical-align: middle; line-height: 0; }
m-e14-quadrat svg, m-e14-linie svg, m-e14-antwort svg, m-e14-form svg { display: block; }
.e14-box { display: flex; align-items: center; justify-content: center; box-sizing: border-box; border: 0.6mm solid var(--tinte); border-radius: 2mm; background: white; }
.e14-box svg { width: 72%; height: 72%; }
`;
  function stil() {
    if (document.getElementById('e14-stil')) return;
    const st = document.createElement('style');
    st.id = 'e14-stil';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function raetselVon(el, attr) {
    const id = el.getAttribute(attr || 'raetsel');
    if (!id) { H().fehler(el, (attr || 'raetsel') + '="…" fehlt'); return null; }
    const r = H().DATEN.raetsel[id];
    if (!r) { H().fehler(el, 'Rätsel „' + id + '“ gibt es nicht in raetsel/*.json'); return null; }
    if (r.art !== 'formen') { H().fehler(el, 'Rätsel „' + id + '“ ist kein Formen-Quadrat (art: ' + r.art + ')'); return null; }
    if (!r.loesung) { H().fehler(el, 'Rätsel „' + id + '“ hat keine Lösung (Löser-Fehler?)'); return null; }
    return r;
  }
  function feldVon(el, def) {
    const feld = parseFloat(el.getAttribute('feld') || def);
    if (aufBlatt(el) && feld < 20) { H().fehler(el, 'Felder auf dem Blatt mindestens 20 mm (feld="20")'); return null; }
    return feld;
  }
  // Lösung als Zellen (aus den Text-Reihen des Lösers)
  function loesungZellen(r) {
    const l = r.loesung;
    return FQ().lies({ n: l.n, formen: l.formen, farben: l.farben || undefined, vorgabe: l.quadrat }).zellen;
  }

  // ---------------------------------------------------------------------
  // <m-e14-quadrat>
  // ---------------------------------------------------------------------
  B['m-e14-quadrat'] = function (el) {
    stil();
    const h = H();
    const L = istLoesung(el) || el.hasAttribute('mit-loesung');
    try {
      if (el.hasAttribute('leer')) {
        const n = parseInt(el.getAttribute('n') || '4', 10);
        if (n < 2 || n > 4) return h.fehler(el, 'n="2" bis n="4"');
        const feld = feldVon(el, '20');
        if (!feld) return;
        let q = { n, zellen: Array.from({ length: n }, () => new Array(n).fill(null)) };
        const opt = { breite: (n * feld) + 'mm', schraege: el.hasAttribute('schraege') };
        if (el.hasAttribute('beispiel')) {
          const b = raetselVon(el, 'beispiel');
          if (!b) return;
          if (b.loesung.n !== n) return h.fehler(el, 'beispiel hat ' + b.loesung.n + ' · ' + b.loesung.n + ' Felder, nicht ' + n);
          if (L) opt.loesung = FQ().lies(b).zellen;
          el.dataset.loesung = FQ().alsText(FQ().lies(b).zellen).join(' ');
        }
        el.innerHTML = FQ().quadratSVG(q, opt);
        el.classList.add('komp', 'geprueft');
        return;
      }
      const r = raetselVon(el);
      if (!r) return;
      const aufgabe = r.aufgabe || 'loesen';
      if (aufgabe !== 'loesen' && aufgabe !== 'kobold') return h.fehler(el, 'm-e14-quadrat zeigt nur Rätsel mit aufgabe loesen oder kobold');
      const feld = feldVon(el, '22');
      if (!feld) return;
      const q = FQ().lies(r);
      const opt = { breite: (q.n * feld) + 'mm', schraege: q.diagonale };
      const modus = el.getAttribute('loesung') || 'ja';
      if (aufgabe === 'kobold') {
        if (L && modus !== 'keine') opt.markiert = [r.loesung.feld];
        el.innerHTML = FQ().quadratSVG(q, opt);
        el.dataset.loesung = 'Kobold bei ' + r.loesung.feld.join(',') + ': ' + r.loesung.richtig;
      } else if (el.hasAttribute('zeige')) {
        el.innerHTML = FQ().quadratSVG({ n: q.n, zellen: loesungZellen(r) }, opt);
      } else {
        if (L && modus !== 'keine') opt.loesung = loesungZellen(r);
        el.innerHTML = FQ().quadratSVG(q, opt);
        el.dataset.loesung = r.loesung.quadrat.join(' ');
      }
      el.classList.add('komp', 'geprueft');
    } catch (e) { return h.fehler(el, e.message); }
  };

  // ---------------------------------------------------------------------
  // <m-e14-form name="kreis" gr="6" [farbe="blau"]>
  // ---------------------------------------------------------------------
  B['m-e14-form'] = function (el) {
    stil();
    const name = FQ().BUCHSTABE[el.getAttribute('name')] || el.getAttribute('name');
    const gr = parseFloat(el.getAttribute('gr') || '6');
    const farbe = el.getAttribute('farbe');
    if (!FQ().INFO[name]) return H().fehler(el, 'Unbekannte Form „' + name + '“ (kreis, dreieck, quadrat, stern)');
    if (farbe && !FQ().FARBEN[farbe]) return H().fehler(el, 'Unbekannte Farbe „' + farbe + '“ (rot, blau, gelb, gruen)');
    const opt = el.hasAttribute('leer') ? { farbe: '#ffffff' } : farbe ? { farbe: FQ().FARBEN[farbe].wert } : undefined;
    el.innerHTML = FQ().form(name, gr + 'mm', opt);
    el.classList.add('komp');
  };

  // ---------------------------------------------------------------------
  // <m-e14-linie art="reihe" formen="K D Q" feld="14">
  // ---------------------------------------------------------------------
  B['m-e14-linie'] = function (el) {
    stil();
    const art = el.getAttribute('art') || 'reihe';
    if (art !== 'reihe' && art !== 'spalte') return H().fehler(el, 'art="reihe" oder art="spalte"');
    const feld = parseFloat(el.getAttribute('feld') || '14');
    const formen = (el.getAttribute('formen') || 'K D Q').trim().split(/\s+/).map((b) => FQ().BUCHSTABE[b] || b);
    for (const f of formen) if (!FQ().INFO[f]) return H().fehler(el, 'Unbekannte Form „' + f + '“');
    const n = formen.length;
    const T = '#1f2340';
    let s = '';
    formen.forEach((f, i) => {
      const x = art === 'reihe' ? i * 100 : 0, y = art === 'reihe' ? 0 : i * 100;
      s += '<g transform="translate(' + (x + 14) + ' ' + (y + 14) + ') scale(0.72)">' + FQ().formInhalt(f) + '</g>';
      if (i) s += art === 'reihe' ? '<line x1="' + x + '" y1="0" x2="' + x + '" y2="100" stroke="' + T + '" stroke-width="3"/>' : '<line x1="0" y1="' + y + '" x2="100" y2="' + y + '" stroke="' + T + '" stroke-width="3"/>';
    });
    const w = art === 'reihe' ? n * 100 : 100, hh = art === 'reihe' ? 100 : n * 100;
    s = '<rect x="0" y="0" width="' + w + '" height="' + hh + '" fill="#fff4cc"/>' + s + '<rect x="3" y="3" width="' + (w - 6) + '" height="' + (hh - 6) + '" fill="none" stroke="' + T + '" stroke-width="6" rx="4"/>';
    el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + hh + '" width="' + (w * feld / 100) + 'mm" height="' + (hh * feld / 100) + 'mm" role="img" aria-label="' + (art === 'reihe' ? 'Reihe' : 'Spalte') + '">' + s + '</svg>';
    el.classList.add('komp');
  };

  // ---------------------------------------------------------------------
  // <m-e14-antwort raetsel="e14-k1" gr="20">
  // ---------------------------------------------------------------------
  B['m-e14-antwort'] = function (el) {
    stil();
    const r = raetselVon(el);
    if (!r) return;
    if ((r.aufgabe || 'loesen') !== 'kobold') return H().fehler(el, 'm-e14-antwort braucht ein Kobold-Quadrat');
    const gr = parseFloat(el.getAttribute('gr') || '20');
    if (aufBlatt(el) && gr < 20) return H().fehler(el, 'Antwort-Kästchen mindestens 20 mm');
    const innen = istLoesung(el) ? FQ().form(r.loesung.richtig, '100%', { loesung: true }) : '';
    el.innerHTML = '<span class="e14-box" style="width:' + gr + 'mm;height:' + gr + 'mm">' + innen + '</span>';
    el.dataset.loesung = r.loesung.richtig;
    el.classList.add('komp', 'geprueft');
  };
})();
