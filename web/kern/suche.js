/* =====================================================================
   Werkstatt-Kern: Sortieren und Suchen (Einheit 10, Rätselart "suche")
   Dieselbe Datei läuft im Rätsel-Löser (Node: import in werkzeuge/arten/suche.mjs),
   beim Bauen der PDFs (Chrome, Bausteine in src/bausteine/e10-suche.js) und in der
   Web-App (web/spiele/suche.js). Keine Abhängigkeiten.
   Ergebnis: globalThis.WerkstattSuche

   1. Sortier-Netz (Kinderwort; Fachwort: Sortiernetzwerk)
      - Es gibt n Bahnen (2 bis 6), von links nach rechts 1 bis n. Oben stehen die Zahlen
        am Start, sie laufen auf ihren Bahnen nach unten zum Ziel.
      - Eine Vergleichs-Stelle verbindet zwei Bahnen a < b: [a, b]. Dort treffen sich zwei
        Zahlen. Die kleinere geht zum kleinen Punkt (Bahn a, links), die größere zum großen
        Punkt (Bahn b, rechts). Stehen sie schon so, bleiben sie, sonst tauschen sie.
      - Die Vergleichs-Stellen laufen in der Reihenfolge der Liste ab. Gezeichnet wird jede
        so weit oben wie möglich (Vergleichs-Stellen ohne gemeinsame Bahn dürfen nebeneinander).
      - Ein Netz sortiert immer, wenn am Ziel bei jeder Start-Reihenfolge links die kleinste
        und rechts die größte Zahl steht. Geprüft wird das mit allen n! Reihenfolgen.
      - Kästchen (Schlüssel für Zahlen in der Zeichnung): "s1".."sn" am Start, "k3a" und
        "k3b" nach Vergleichs-Stelle 3 (a = kleiner Punkt, b = großer Punkt). Ist es die
        letzte Vergleichs-Stelle einer Bahn, steht ihr Kästchen unten in der Ziel-Reihe.
        Bahnen ganz ohne Vergleichs-Stelle bekommen das Ziel-Kästchen "z1".."zn".
   2. Nachbarn tauschen: Zahlen in einer Reihe, man darf nur zwei Nachbarn tauschen.
      Die kleinste Zahl an Tauschen ist die Zahl der Fehlstellen (Paare, bei denen die
      größere Zahl links steht).
   3. Halbier-Suche (Kinderwort; Fachwort: binäre Suche)
      - Gesucht ist eine Zahl von 1 bis N. Erlaubt ist nur die Frage
        „Ist deine Zahl größer als x?“, die Antwort ist Ja oder Nein.
      - Sind nur noch die Zahlen von..bis möglich, teilt die Frage x sie in zwei Teile:
        Nein-Teil von..x und Ja-Teil x+1..bis. Ist x kleiner als von oder mindestens bis,
        weiß man die Antwort schon (unnütze Frage).
      - Wenn nur noch eine Zahl übrig ist, ist sie gefunden (das ist keine Frage mehr).
      - Höchstens nötig sind mit Halbieren hoechstens(N) Fragen: so oft halbieren
        (bei ungerader Zahl die größere Hälfte), bis 1 übrig ist. 8: 3, 16: 4, 32: 5,
        100: 7, 1000: 10. Weniger geht mit keinem Plan (minimax, im Löser bewiesen).
      - Eine Frage ist gut, wenn man danach im schlimmsten Fall nicht mehr Fragen braucht
        als vorher nötig (hoechstens(größerer Teil) = hoechstens(übrig) - 1).
        Genau in der Mitte ist sie, wenn beide Teile gleich groß sind (oder um 1 verschieden).
   Zeichnungen (SVG-Text, Maße in mm, mit opt.breite auch in anderen CSS-Längen):
   netzSVG, leisteSVG, karteSVG, turmSVG, pfeilSVG.
   ===================================================================== */
(function (g) {
  'use strict';

  const T = '#1f2340';
  const GRAU = '#6b6f86';
  const LINIE = '#b9bdd3';
  const ROT = '#d1335b';
  const TUERKIS = '#0f8f87';
  const TUERKIS_HELL = '#e3f6f4';
  const GOLD = '#f2b705';
  const GOLD_HELL = '#fff4cc';
  const SCHRIFT = 'Andika, sans-serif';
  const MIN_BAHNEN = 2;
  const MAX_BAHNEN = 6;

  const r2 = (x) => Math.round(x * 100) / 100;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // ---------------------------------------------------------------------
  // 1. Sortier-Netz
  // ---------------------------------------------------------------------
  function pruefeNetz(bahnen, vergleiche) {
    if (!Number.isInteger(bahnen) || bahnen < MIN_BAHNEN || bahnen > MAX_BAHNEN) throw new Error('bahnen: ' + MIN_BAHNEN + ' bis ' + MAX_BAHNEN + ' (nicht ' + bahnen + ')');
    if (!Array.isArray(vergleiche) || !vergleiche.length) throw new Error('vergleiche: Liste von Paaren [a, b] fehlt');
    vergleiche.forEach((v, i) => {
      if (!Array.isArray(v) || v.length !== 2 || !v.every(Number.isInteger)) throw new Error('Vergleichs-Stelle ' + (i + 1) + ': [a, b] mit zwei Bahn-Nummern');
      const [a, b] = v;
      if (a < 1 || b > bahnen || a >= b) throw new Error('Vergleichs-Stelle ' + (i + 1) + ': [' + a + ', ' + b + '] geht nicht (1 bis ' + bahnen + ', links die kleinere Nummer)');
    });
    return true;
  }
  function pruefeZahlen(zahlen, n, wo) {
    if (!Array.isArray(zahlen) || zahlen.length !== n || !zahlen.every(Number.isInteger)) throw new Error((wo || 'zahlen') + ': ' + n + ' ganze Zahlen');
    if (new Set(zahlen).size !== zahlen.length) throw new Error((wo || 'zahlen') + ': jede Zahl nur einmal');
    if (zahlen.some((z) => z < 0 || z > 999)) throw new Error((wo || 'zahlen') + ': Zahlen von 0 bis 999');
    return zahlen;
  }

  // Lässt die Zahlen durch das Netz laufen. kobold: Nummer (1-basiert) der Vergleichs-Stelle,
  // an der falsch herum sortiert wird (die größere geht zum kleinen Punkt).
  function laufen(bahnen, vergleiche, start, kobold) {
    pruefeNetz(bahnen, vergleiche);
    const s = start.slice();
    const schritte = vergleiche.map(([a, b], i) => {
      const x = s[a - 1], y = s[b - 1];
      const falsch = kobold === i + 1;
      const klein = Math.min(x, y), gross = Math.max(x, y);
      const raus = falsch ? [gross, klein] : [klein, gross];
      s[a - 1] = raus[0];
      s[b - 1] = raus[1];
      return { nr: i + 1, a, b, rein: [x, y], raus, getauscht: raus[0] !== x, kobold: falsch };
    });
    return { schritte, ende: s, sortiert: istSortiert(s), tausche: schritte.filter((x) => x.getauscht).length };
  }

  function istSortiert(z) {
    for (let i = 1; i < z.length; i++) if (z[i - 1] > z[i]) return false;
    return true;
  }

  // Alle Reihenfolgen der Liste (n! Stück, für n bis 6 höchstens 720)
  function reihenfolgen(liste) {
    if (liste.length <= 1) return [liste.slice()];
    const aus = [];
    liste.forEach((x, i) => {
      const rest = liste.slice(0, i).concat(liste.slice(i + 1));
      for (const r of reihenfolgen(rest)) aus.push([x].concat(r));
    });
    return aus;
  }
  // Sortiert das Netz jede Reihenfolge der Zahlen 1..n?
  function pruefeAlle(bahnen, vergleiche) {
    pruefeNetz(bahnen, vergleiche);
    const basis = [];
    for (let i = 1; i <= bahnen; i++) basis.push(i);
    const alle = reihenfolgen(basis);
    const nicht = alle.filter((r) => !laufen(bahnen, vergleiche, r).sortiert);
    return { anzahl: alle.length, nichtSortiert: nicht, immer: nicht.length === 0 };
  }

  // Zeilen der Zeichnung: jede Vergleichs-Stelle so weit oben wie möglich,
  // nach allen früheren auf ihren Bahnen, ohne Überlappung in der Zeile.
  function zeilen(bahnen, vergleiche) {
    pruefeNetz(bahnen, vergleiche);
    const zuletzt = new Array(bahnen + 1).fill(-1);
    const belegt = [];   // pro Zeile: Liste [von, bis]
    return vergleiche.map(([a, b]) => {
      let r = Math.max(zuletzt[a], zuletzt[b]) + 1;
      // Zwischen-Bahnen: eine spätere Vergleichs-Stelle darf nicht über eine frühere rutschen,
      // die auf einer Bahn dazwischen liegt (die Zeichnung soll der Reihenfolge folgen)
      for (let c = a + 1; c < b; c++) r = Math.max(r, zuletzt[c] + 1);
      while ((belegt[r] || []).some(([x, y]) => !(b < x || a > y))) r++;
      (belegt[r] = belegt[r] || []).push([a, b]);
      zuletzt[a] = r;
      zuletzt[b] = r;
      for (let c = a + 1; c < b; c++) zuletzt[c] = Math.max(zuletzt[c], r);
      return r;
    });
  }

  // Lage aller Teile der Zeichnung (mm). Die App kann damit Tasten über die Kästchen legen.
  function netzLage(bahnen, vergleiche, opt) {
    opt = opt || {};
    const abstand = opt.abstand || 28;
    const feld = opt.feld || 13;
    const zeile = Math.max(opt.zeile || 22.5, feld + 9.5);
    const links = opt.beschriftung === false ? 1 : 12;
    const zr = zeilen(bahnen, vergleiche);
    const R = zr.length ? Math.max.apply(null, zr) + 1 : 0;
    const x = (bahn) => r2(links + feld / 2 + (bahn - 1) * abstand);
    const oben = opt.masse ? 8 : 0;      // Platz für die Maße (Plan für den Hof)
    const rechts = opt.masse ? 17 : 0;
    const y0 = r2(1.2 + oben);
    const balkenY = (r) => r2(y0 + feld + 6.5 + r * zeile);
    const zielY = r2(y0 + feld + 6.5 + Math.max(0, R - 1) * zeile + 4.5);
    // letzte Vergleichs-Stelle jeder Bahn
    const letzte = new Array(bahnen + 1).fill(-1);
    vergleiche.forEach(([a, b], i) => { letzte[a] = i; letzte[b] = i; });
    const kaestchen = [];
    for (let i = 1; i <= bahnen; i++) kaestchen.push({ key: 's' + i, bahn: i, x: x(i), y: y0, art: 'start' });
    vergleiche.forEach(([a, b], i) => {
      for (const [bahn, s] of [[a, 'a'], [b, 'b']]) {
        const ziel = letzte[bahn] === i;
        kaestchen.push({ key: 'k' + (i + 1) + s, bahn, x: x(bahn), y: ziel ? zielY : r2(balkenY(zr[i]) + 4.5), art: ziel ? 'ziel' : 'mitte', nr: i + 1 });
      }
    });
    for (let i = 1; i <= bahnen; i++) if (letzte[i] < 0) kaestchen.push({ key: 'z' + i, bahn: i, x: x(i), y: zielY, art: 'ziel' });
    const stellen = vergleiche.map(([a, b], i) => ({ nr: i + 1, a, b, zeile: zr[i], y: balkenY(zr[i]), x1: x(a), x2: x(b) }));
    const w = r2(links + (bahnen - 1) * abstand + feld + 1.2 + rechts);
    const h = r2(zielY + feld + 1.2);
    return { w, h, feld, abstand, zeile, links, y0, zielY, zeilen: R, x, kaestchen, stellen, balkenY };
  }

  // Schlüssel der Kästchen → Zahl, aus einem Lauf
  function werteAusLauf(bahnen, start, lauf) {
    const w = {};
    start.forEach((z, i) => { w['s' + (i + 1)] = z; });
    lauf.schritte.forEach((s) => { w['k' + s.nr + 'a'] = s.raus[0]; w['k' + s.nr + 'b'] = s.raus[1]; });
    for (let i = 1; i <= bahnen; i++) w['z' + i] = lauf.ende[i - 1];
    return w;
  }

  // Zeichnung des Netzes.
  //   opt.start: Zahlen am Start (gedruckt)        opt.werte: { key: Zahl } gedruckt (schwarz)
  //   opt.loesung: { key: Zahl } nur in der Lösungsansicht (rot, class="lsg")
  //   opt.kreis: Nummer einer Vergleichs-Stelle, die in der Lösung rot umrandet wird
  //   opt.aktiv: Nummer einer Vergleichs-Stelle, die hell hinterlegt ist (App)
  //   opt.leer: true = keine Kästchen in der Mitte (Spielplan), opt.beschriftung: Start/Ziel links
  //   opt.masse: { quer: '50 cm', laengs: '60 cm' } Maße für den Plan am Boden (Abstand der Bahnen
  //   oben, Abstand der Vergleichs-Stellen rechts)
  //   opt.breite: CSS-Breite statt mm, opt.titel: aria-label
  function netzSVG(bahnen, vergleiche, opt) {
    opt = opt || {};
    const L = netzLage(bahnen, vergleiche, opt);
    const f = L.feld;
    const werte = Object.assign({}, opt.werte || {});
    if (opt.start) opt.start.forEach((z, i) => { werte['s' + (i + 1)] = z; });
    const lsg = opt.loesung || {};
    let s = '';
    // Beschriftung links
    if (opt.beschriftung !== false) {
      const t = (y, txt) => '<text data-nebenschrift="" x="0.4" y="' + r2(y + f / 2) + '" font-size="3.9" font-weight="700" fill="' + GRAU + '" font-family="' + SCHRIFT + '" dominant-baseline="central">' + txt + '</text>';
      s += t(L.y0, 'Start') + t(L.zielY, 'Ziel');
    }
    // Bahnen
    for (let i = 1; i <= bahnen; i++) s += '<line x1="' + L.x(i) + '" y1="' + r2(L.y0 + f / 2) + '" x2="' + L.x(i) + '" y2="' + r2(L.zielY + f / 2) + '" stroke="' + GRAU + '" stroke-width="0.7" stroke-linecap="round"/>';
    // Vergleichs-Stellen
    for (const st of L.stellen) {
      if (opt.aktiv === st.nr) s += '<rect x="' + r2(st.x1 - 6) + '" y="' + r2(st.y - 5) + '" width="' + r2(st.x2 - st.x1 + 12) + '" height="10" rx="5" fill="' + GOLD_HELL + '" stroke="' + GOLD + '" stroke-width="0.8"/>';
      s += '<line x1="' + st.x1 + '" y1="' + st.y + '" x2="' + st.x2 + '" y2="' + st.y + '" stroke="' + TUERKIS + '" stroke-width="1.3" stroke-linecap="round"/>';
      // Brücke über Bahnen dazwischen
      for (let c = st.a + 1; c < st.b; c++) {
        s += '<line x1="' + L.x(c) + '" y1="' + r2(st.y - 2.2) + '" x2="' + L.x(c) + '" y2="' + r2(st.y + 2.2) + '" stroke="white" stroke-width="2.4"/>' +
          '<path d="M' + r2(L.x(c) - 2.6) + ' ' + st.y + ' Q' + L.x(c) + ' ' + r2(st.y - 3.6) + ' ' + r2(L.x(c) + 2.6) + ' ' + st.y + '" fill="none" stroke="' + TUERKIS + '" stroke-width="1.3"/>' +
          '<line x1="' + L.x(c) + '" y1="' + r2(st.y - 2.2) + '" x2="' + L.x(c) + '" y2="' + r2(st.y + 2.2) + '" stroke="' + GRAU + '" stroke-width="0.7"/>';
      }
      s += '<circle cx="' + st.x1 + '" cy="' + st.y + '" r="1.7" fill="' + TUERKIS + '"/>';
      s += '<circle cx="' + st.x2 + '" cy="' + st.y + '" r="3.3" fill="' + TUERKIS + '"/>';
    }
    // Kästchen
    for (const k of L.kaestchen) {
      if (opt.leer && k.art === 'mitte') continue;
      const x = r2(k.x - f / 2);
      const fill = k.art === 'start' ? TUERKIS_HELL : 'white';
      const rand = k.art === 'ziel' ? GOLD : T;
      s += '<rect x="' + x + '" y="' + k.y + '" width="' + f + '" height="' + f + '" rx="1.8" fill="' + fill + '" stroke="' + rand + '" stroke-width="' + (k.art === 'ziel' ? 0.9 : 0.55) + '"/>';
      const tx = (cls, farbe, v) => '<text class="' + cls + '" x="' + k.x + '" y="' + r2(k.y + f / 2 + 0.2) + '" font-size="' + r2(f * 0.56) + '" text-anchor="middle" dominant-baseline="central" fill="' + farbe + '" font-family="' + SCHRIFT + '"' + (cls ? ' font-weight="700"' : '') + '>' + esc(v) + '</text>';
      if (werte[k.key] !== undefined) s += tx('', T, werte[k.key]);
      else if (lsg[k.key] !== undefined) s += tx('lsg', ROT, lsg[k.key]);
    }
    // Maße für den Plan am Boden
    if (opt.masse) {
      const m = opt.masse;
      const mtext = (x, y, txt, anker) => '<text data-nebenschrift="" x="' + r2(x) + '" y="' + r2(y) + '" font-size="3.6" font-weight="700" fill="' + GRAU + '" font-family="' + SCHRIFT + '" text-anchor="' + (anker || 'middle') + '" dominant-baseline="central">' + esc(txt) + '</text>';
      const pf = (x1, y1, x2, y2) => '<line x1="' + r2(x1) + '" y1="' + r2(y1) + '" x2="' + r2(x2) + '" y2="' + r2(y2) + '" stroke="' + GRAU + '" stroke-width="0.4"/>';
      if (m.quer && bahnen > 1) {
        const y = 3.4, x1 = L.x(1), x2 = L.x(2);
        s += pf(x1, y, x2, y) + pf(x1, y - 1.4, x1, y + 1.4) + pf(x2, y - 1.4, x2, y + 1.4);
        s += '<rect x="' + r2((x1 + x2) / 2 - 7.5) + '" y="' + r2(y - 2.4) + '" width="15" height="4.8" fill="white"/>' + mtext((x1 + x2) / 2, y, m.quer);
      }
      if (m.laengs && L.zeilen > 1) {
        const x = L.x(bahnen) + f / 2 + 3.5, y1 = L.balkenY(0), y2 = L.balkenY(1);
        s += pf(x, y1, x, y2) + pf(x - 1.4, y1, x + 1.4, y1) + pf(x - 1.4, y2, x + 1.4, y2);
        s += mtext(x + 1.8, (y1 + y2) / 2, m.laengs, 'start');
      }
    }
    // Lösung: Vergleichs-Stelle rot umranden
    if (opt.kreis) {
      const st = L.stellen[opt.kreis - 1];
      if (st) s += '<g class="lsg"><rect x="' + r2(st.x1 - f / 2 - 2.2) + '" y="' + r2(st.y - 5.5) + '" width="' + r2(st.x2 - st.x1 + f + 4.4) + '" height="11" rx="5.5" fill="none" stroke="' + ROT + '" stroke-width="1" stroke-dasharray="2.2 1.3"/></g>';
    }
    const groesse = opt.breite ? ' width="' + opt.breite + '"' : ' width="' + L.w + 'mm" height="' + L.h + 'mm"';
    return '<svg xmlns="http://www.w3.org/2000/svg"' + groesse + ' viewBox="0 0 ' + L.w + ' ' + L.h + '" role="img" aria-label="' + esc(opt.titel || 'Sortier-Netz') + '">' + s + '</svg>';
  }

  // Kleiner und großer Punkt (Erklärung „kleinere Zahl zum kleinen Punkt“)
  function punktSVG(gross, gr) {
    gr = gr || 6;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + gr + 'mm" height="' + gr + 'mm" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="' + (gross ? 4.6 : 2.4) + '" fill="' + TUERKIS + '"/></svg>';
  }

  // ---------------------------------------------------------------------
  // 2. Nachbarn tauschen
  // ---------------------------------------------------------------------
  function fehlstellen(z) {
    let n = 0;
    for (let i = 0; i < z.length; i++) for (let j = i + 1; j < z.length; j++) if (z[i] > z[j]) n++;
    return n;
  }
  // Nachbarn an Platz i und i+1 (0-basiert) tauschen, neue Liste
  function tausche(z, i) {
    if (!Number.isInteger(i) || i < 0 || i >= z.length - 1) throw new Error('Tauschen geht nur mit zwei Nachbarn');
    const n = z.slice();
    const t = n[i]; n[i] = n[i + 1]; n[i + 1] = t;
    return n;
  }
  // Ein Weg mit den wenigsten Tauschen: immer von links nach rechts, nur wenn die größere links steht
  function tauschWeg(z) {
    let a = z.slice();
    const weg = [];
    let getauscht = true;
    while (getauscht) {
      getauscht = false;
      for (let i = 0; i < a.length - 1; i++) if (a[i] > a[i + 1]) { a = tausche(a, i); weg.push(i); getauscht = true; }
    }
    return weg;
  }

  // ---------------------------------------------------------------------
  // 3. Halbier-Suche
  // ---------------------------------------------------------------------
  function pruefeBis(n) {
    if (!Number.isInteger(n) || n < 2 || n > 1000000) throw new Error('bis: ganze Zahl von 2 bis 1000000 (nicht ' + n + ')');
    return n;
  }
  // Höchstens so viele Fragen mit Halbieren (aufrunden: kleinste k mit 2^k >= n)
  function hoechstens(n) {
    let k = 0, p = 1;
    while (p < n) { p *= 2; k++; }
    return k;
  }
  // Halbier-Leiter: n, dann die größere Hälfte, … bis 1
  function leiter(n) {
    const l = [n];
    while (n > 1) { n = Math.ceil(n / 2); l.push(n); }
    return l;
  }
  // Antwort auf „Ist deine Zahl größer als x?“
  const antwort = (geheim, x) => geheim > x;
  // Nach der Frage x und der Antwort ja (true) oder nein (false): neuer Bereich
  function nachFrage(von, bis, x, ja) { return ja ? [Math.max(von, x + 1), bis] : [von, Math.min(bis, x)]; }
  // Wie gut ist die Frage x, wenn noch von..bis möglich sind?
  //   unnuetz: Antwort schon bekannt; gut: im schlimmsten Fall nicht mehr Fragen als nötig;
  //   schlecht: danach braucht man im schlimmsten Fall mehr. mitte: beide Teile gleich groß (±1)
  function bewerte(von, bis, x) {
    const m = bis - von + 1;
    if (x < von || x >= bis) return { art: 'unnuetz', nein: x < von ? 0 : m, ja: x < von ? m : 0, mitte: false };
    const nein = x - von + 1, ja = bis - x;
    const gut = hoechstens(Math.max(nein, ja)) === hoechstens(m) - 1;
    return { art: gut ? 'gut' : 'schlecht', nein, ja, mitte: Math.abs(nein - ja) <= 1 };
  }
  // Fragen genau in der Mitte (bei gerader Anzahl genau eine, bei ungerader zwei)
  function mitten(von, bis) {
    const m = bis - von + 1;
    if (m < 2) return [];
    if (m % 2 === 0) return [von + m / 2 - 1];
    return [von + (m - 1) / 2 - 1, von + (m - 1) / 2];
  }
  // Ein Spiel: immer genau in der Mitte fragen (nur wenn die Mitte jedes Mal eindeutig ist)
  function spiel(bis, geheim) {
    pruefeBis(bis);
    if (!Number.isInteger(geheim) || geheim < 1 || geheim > bis) throw new Error('geheim: 1 bis ' + bis);
    let von = 1, hi = bis;
    const schritte = [];
    while (von < hi) {
      const mt = mitten(von, hi);
      const x = mt[0];
      const ja = antwort(geheim, x);
      const neu = nachFrage(von, hi, x, ja);
      schritte.push({ von, bis: hi, x, eindeutig: mt.length === 1, ja, danach: neu });
      von = neu[0]; hi = neu[1];
    }
    return { schritte, gefunden: von, fragen: schritte.length };
  }
  // Fragen eines Spielers nachspielen: Bewertung jeder Frage
  function nachspielen(bis, geheim, fragen) {
    let von = 1, hi = bis;
    const aus = fragen.map((x) => {
      const b = bewerte(von, hi, x);
      const ja = antwort(geheim, x);
      const neu = nachFrage(von, hi, x, ja);
      const r = { von, bis: hi, x, ja, art: b.art, mitte: b.mitte, danach: neu };
      von = neu[0]; hi = neu[1];
      return r;
    });
    return { schritte: aus, von, bis: hi, gefunden: von === hi ? von : null };
  }

  // ---------------------------------------------------------------------
  // Zeichnungen für Halbier-Suche und Tauschen
  // ---------------------------------------------------------------------
  // Zahlen-Leiste von..bis. opt: feld (Breite eines Felds), hoehe, proZeile,
  //   weg: Zahlen grau durchgestrichen (gedruckt), wegLsg: rot durchgestrichen (nur Lösung),
  //   ring: Zahlen rot umkreist (nur Lösung), hell: Zahlen hell hinterlegt (gedruckt)
  function leisteSVG(von, bis, opt) {
    opt = opt || {};
    const fb = opt.feld || 10, fh = opt.hoehe || 11;
    const n = bis - von + 1;
    const pz = opt.proZeile || n;
    const reihen = Math.ceil(n / pz);
    const abst = opt.zeilenAbstand || 3;
    const weg = new Set(opt.weg || []), wegL = new Set(opt.wegLsg || []), ring = new Set(opt.ring || []), hell = new Set(opt.hell || []);
    const w = r2(pz * fb + 1), h = r2(reihen * fh + (reihen - 1) * abst + 1);
    let s = '', l = '';
    for (let z = von; z <= bis; z++) {
      const i = z - von, sp = i % pz, re = Math.floor(i / pz);
      const x = r2(0.5 + sp * fb), y = r2(0.5 + re * (fh + abst));
      const grau = weg.has(z);
      s += '<rect x="' + x + '" y="' + y + '" width="' + fb + '" height="' + fh + '" fill="' + (grau ? '#e4e6ee' : hell.has(z) ? GOLD_HELL : 'white') + '" stroke="' + T + '" stroke-width="0.4"/>';
      s += '<text x="' + r2(x + fb / 2) + '" y="' + r2(y + fh / 2 + 0.2) + '" font-size="' + r2(Math.min(fb, fh) * (z >= 100 ? 0.42 : 0.55)) + '" text-anchor="middle" dominant-baseline="central" fill="' + (grau ? '#9a9fb4' : T) + '" font-family="' + SCHRIFT + '">' + z + '</text>';
      const kreuz = (farbe, bw) => '<path d="M' + r2(x + 1.4) + ' ' + r2(y + 1.4) + ' L' + r2(x + fb - 1.4) + ' ' + r2(y + fh - 1.4) + ' M' + r2(x + fb - 1.4) + ' ' + r2(y + 1.4) + ' L' + r2(x + 1.4) + ' ' + r2(y + fh - 1.4) + '" stroke="' + farbe + '" stroke-width="' + bw + '" stroke-linecap="round"/>';
      if (grau) s += kreuz('#9a9fb4', 0.5);
      if (wegL.has(z)) l += kreuz(ROT, 0.8);
      if (ring.has(z)) l += '<ellipse cx="' + r2(x + fb / 2) + '" cy="' + r2(y + fh / 2) + '" rx="' + r2(fb / 2 + 0.2) + '" ry="' + r2(fh / 2 + 0.2) + '" fill="none" stroke="' + ROT + '" stroke-width="0.9"/>';
    }
    if (l) s += '<g class="lsg">' + l + '</g>';
    const groesse = opt.breite ? ' width="' + opt.breite + '"' : ' width="' + w + 'mm" height="' + h + 'mm"';
    return '<svg xmlns="http://www.w3.org/2000/svg"' + groesse + ' viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Zahlen von ' + von + ' bis ' + bis + '">' + s + '</svg>';
  }

  // Kleiner Bogen-Pfeil nach rechts (Halbier-Leiter: „eine Frage weiter“), mit Fragezeichen
  function pfeilSVG(gr, farbe) {
    gr = gr || 12;
    farbe = farbe || TUERKIS;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + gr + 'mm" height="' + r2(gr * 0.8) + 'mm" viewBox="0 0 20 16" aria-hidden="true">' +
      '<path d="M2.5 13 Q10 -1.5 17 11.5" fill="none" stroke="' + farbe + '" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M12.6 10.6 L17.3 12 L18.2 7.2" fill="none" stroke="' + farbe + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<text data-nebenschrift="" x="9.8" y="14.6" font-size="7.4" font-weight="700" text-anchor="middle" fill="' + farbe + '" font-family="' + SCHRIFT + '">?</text></svg>';
  }

  // Zahlenkarte (Tauschen in der App)
  function karteSVG(n, opt) {
    opt = opt || {};
    const farbe = opt.farbe || TUERKIS;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + (opt.breite || '100%') + '" viewBox="0 0 40 52" aria-label="' + n + '">' +
      '<rect x="1.5" y="1.5" width="37" height="49" rx="5" fill="white" stroke="' + (opt.markiert ? GOLD : T) + '" stroke-width="' + (opt.markiert ? 3 : 1.6) + '"/>' +
      '<rect x="5" y="5" width="30" height="5" rx="2.5" fill="' + farbe + '"/>' +
      '<text x="20" y="31" font-size="' + (n >= 10 ? 19 : 24) + '" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="' + T + '" font-family="' + SCHRIFT + '">' + n + '</text></svg>';
  }
  // Turm aus h Steinen (Sortieren nach Größe, 1 bis 8 Steine)
  const TURMFARBEN = ['#e0453a', '#f39c12', '#f5c518', '#3aa856', '#0f8f87', '#3a7be0', '#7a4fd1', '#c25a9e'];
  function turmSVG(h, opt) {
    opt = opt || {};
    const max = opt.max || 8;
    const st = 10;
    const H = max * st + 4;
    let s = '';
    for (let i = 0; i < h; i++) {
      const y = H - 2 - (i + 1) * st;
      s += '<rect x="4" y="' + y + '" width="32" height="' + (st - 1) + '" rx="2" fill="' + TURMFARBEN[(h - 1) % TURMFARBEN.length] + '" stroke="' + T + '" stroke-width="1.2"/>';
    }
    if (opt.markiert) s = '<rect x="1" y="1" width="38" height="' + (H - 2) + '" rx="4" fill="' + GOLD_HELL + '" stroke="' + GOLD + '" stroke-width="2"/>' + s;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + (opt.breite || '100%') + '" viewBox="0 0 40 ' + H + '" aria-label="Turm aus ' + h + ' Steinen">' + s + '</svg>';
  }

  g.WerkstattSuche = {
    MIN_BAHNEN, MAX_BAHNEN, FARBE: { tinte: T, grau: GRAU, linie: LINIE, rot: ROT, tuerkis: TUERKIS, tuerkisHell: TUERKIS_HELL, gold: GOLD, goldHell: GOLD_HELL },
    // Sortier-Netz
    pruefeNetz, pruefeZahlen, laufen, istSortiert, reihenfolgen, pruefeAlle, zeilen, netzLage, werteAusLauf, netzSVG, punktSVG,
    // Nachbarn tauschen
    fehlstellen, tausche, tauschWeg, karteSVG, turmSVG,
    // Halbier-Suche
    pruefeBis, hoechstens, leiter, antwort, nachFrage, bewerte, mitten, spiel, nachspielen, leisteSVG, pfeilSVG,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
