/* =====================================================================
   Werkstatt-Kern: Formen-Quadrate (Einheit 14)
   Gemeinsam für Löser (werkzeuge/arten/formen.mjs), Blätter
   (src/bausteine/e14-formen.js) und Web-App (web/spiele/formen.js):
   - die vier Formen als SVG (Kreis, Dreieck, Quadrat, Stern), damit
     Blatt und App gleich aussehen, und das ganze Quadrat als SVG
   - Vorgabe lesen, ein (fertiges oder halbes) Quadrat prüfen
     (die App bewertet nur das Ergebnis), freundliche Fehler-Texte
   - Backtracking: alle Lösungen zählen (der Löser beweist „genau eine“)
   - Lösen ohne Raten in Stufen (wie ein Kind es macht)
   Ohne Abhängigkeiten. Ergebnis: globalThis.WerkstattFormen

   Formen-Quadrat n · n (n = 2 bis 4): jede Form genau einmal in jeder
   Reihe (waagrecht) und in jeder Spalte (senkrecht).
   Zusatzregeln (Schwerer-Teil):
     diagonale: true   auch auf den zwei Schrägen von Ecke zu Ecke jede Form einmal
     farben: [...]     jedes Feld hat Form UND Farbe: jede Farbe einmal pro Reihe
                       und Spalte, und jede bunte Form (z. B. roter Kreis) nur einmal
   Vorgabe in den Rätsel-Daten (nur für Autoren, nie auf dem Blatt):
     ["KD.", ".QK", "..."]          K Kreis, D Dreieck, Q Quadrat, S Stern, . leer
     ["K:rot . .", ". D:blau ."]    mit Farben: Felder durch Leerzeichen getrennt
   Koordinaten: x nach rechts, y nach unten, Feld (0, 0) links oben.
   ===================================================================== */
(function (g) {
  'use strict';

  const T = '#1f2340';
  const ROT = '#d1335b';
  const FORMEN = ['kreis', 'dreieck', 'quadrat', 'stern'];
  const INFO = {
    kreis: { kurz: 'K', name: 'Kreis', mehrzahl: 'Kreise', farbe: '#e0453a' },
    dreieck: { kurz: 'D', name: 'Dreieck', mehrzahl: 'Dreiecke', farbe: '#3a7be0' },
    quadrat: { kurz: 'Q', name: 'Quadrat', mehrzahl: 'Quadrate', farbe: '#3aa856' },
    stern: { kurz: 'S', name: 'Stern', mehrzahl: 'Sterne', farbe: '#f5c518' },
  };
  const BUCHSTABE = { K: 'kreis', D: 'dreieck', Q: 'quadrat', S: 'stern' };
  const FARBEN = {
    rot: { name: 'rot', wert: '#e0453a' },
    blau: { name: 'blau', wert: '#3a7be0' },
    gelb: { name: 'gelb', wert: '#f5c518' },
    gruen: { name: 'grün', wert: '#3aa856' },
  };
  const FARB_LISTE = ['rot', 'blau', 'gelb', 'gruen'];
  // Hintergrund der zwei Schrägen (Blatt und App gleich): nr 0 von links oben blau, nr 1 von rechts oben gelb
  const SCHRAEGE = ['#c9defc', '#ffe7a3'];
  const MIN_N = 2;
  const MAX_N = 4;

  // ---------------------------------------------------------------------
  // Formen zeichnen: Koordinaten 0 bis 100, keine ids (kommen oft mehrfach vor)
  //   opt.farbe: Füllfarbe (sonst die Farbe der Form)
  //   opt.loesung: nur roter Umriss (so trägt die Lösungsansicht ein)
  //   opt.loesungBunt: Füllfarbe mit rotem Umriss (Lösung bei Farben UND Formen)
  // ---------------------------------------------------------------------
  function sternPunkte(cx, cy, ra, ri) {
    const p = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? ri : ra;
      const w = -Math.PI / 2 + i * Math.PI / 5;
      p.push((cx + r * Math.cos(w)).toFixed(1) + ',' + (cy + r * Math.sin(w)).toFixed(1));
    }
    return p.join(' ');
  }
  const PFAD = {
    kreis: (a) => '<circle cx="50" cy="50" r="33"' + a + '/>',
    dreieck: (a) => '<polygon points="50,13 88,82 12,82"' + a + '/>',
    quadrat: (a) => '<rect x="18" y="18" width="64" height="64" rx="3"' + a + '/>',
    stern: (a) => '<polygon points="' + sternPunkte(50, 53, 41, 17) + '"' + a + '/>',
  };
  function formInhalt(name, opt) {
    const o = opt || {};
    if (!PFAD[name]) throw new Error('Unbekannte Form „' + name + '“ (' + FORMEN.join(', ') + ')');
    let a;
    if (o.loesung) a = ' fill="none" stroke="' + ROT + '" stroke-width="7" stroke-linejoin="round"';
    else if (o.loesungBunt) a = ' fill="' + (o.farbe || INFO[name].farbe) + '" stroke="' + ROT + '" stroke-width="7" stroke-linejoin="round"';
    else a = ' fill="' + (o.farbe || INFO[name].farbe) + '" stroke="' + T + '" stroke-width="' + (o.strich || 4.5) + '" stroke-linejoin="round"';
    return PFAD[name](a);
  }
  function form(name, groesse, opt) {
    const gr = groesse === undefined ? '100%' : String(groesse);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + gr + '" height="' + gr + '" aria-hidden="true">' + formInhalt(name, opt) + '</svg>';
  }

  // ---------------------------------------------------------------------
  // Vorgabe lesen: Zelle = null (leer) oder { f: 'kreis', c: 'rot' | null }
  // ---------------------------------------------------------------------
  function formenVon(r) {
    const n = r.n;
    const f = r.formen || FORMEN.slice(0, n);
    if (f.length !== n) throw new Error('Ein ' + n + ' · ' + n + '-Quadrat braucht genau ' + n + ' Formen, nicht ' + f.length);
    for (const x of f) if (!INFO[x]) throw new Error('Unbekannte Form „' + x + '“');
    if (new Set(f).size !== f.length) throw new Error('Formen doppelt');
    return f;
  }
  function farbenVon(r) {
    if (!r.farben) return null;
    if (!Array.isArray(r.farben) || r.farben.length !== r.n) throw new Error('farben: genau ' + r.n + ' Farben');
    for (const c of r.farben) if (!FARBEN[c]) throw new Error('Unbekannte Farbe „' + c + '“ (' + FARB_LISTE.join(', ') + ')');
    if (new Set(r.farben).size !== r.farben.length) throw new Error('Farben doppelt');
    return r.farben.slice();
  }
  function liesZelle(t, formen, farben) {
    if (t === '.' || t === '' || t === null || t === undefined) return null;
    if (typeof t === 'object') return { f: t.f, c: t.c || null };
    const teile = String(t).split(':');
    const f = BUCHSTABE[teile[0]] || teile[0];
    if (!formen.includes(f)) throw new Error('Form „' + teile[0] + '“ gehört nicht zu diesem Quadrat (' + formen.map((x) => INFO[x].kurz).join(', ') + ')');
    let c = null;
    if (farben) {
      c = teile[1];
      if (!c || !farben.includes(c)) throw new Error('Feld „' + t + '“: Farbe fehlt oder gehört nicht dazu (' + farben.join(', ') + ')');
    } else if (teile.length > 1) throw new Error('Feld „' + t + '“ hat eine Farbe, aber das Rätsel hat keine "farben"');
    return { f, c };
  }
  function lies(r) {
    const n = r.n;
    if (!Number.isInteger(n) || n < MIN_N || n > MAX_N) throw new Error('n muss ' + MIN_N + ' bis ' + MAX_N + ' sein');
    const formen = formenVon(r);
    const farben = farbenVon(r);
    const roh = r.vorgabe || [];
    if (!Array.isArray(roh) || roh.length !== n) throw new Error('vorgabe braucht ' + n + ' Reihen');
    const zellen = roh.map((zeile, y) => {
      const t = Array.isArray(zeile) ? zeile : (/\s/.test(String(zeile).trim()) || farben ? String(zeile).trim().split(/\s+/) : String(zeile).split(''));
      if (t.length !== n) throw new Error('Reihe ' + (y + 1) + ' hat ' + t.length + ' Felder statt ' + n);
      return t.map((z) => liesZelle(z, formen, farben));
    });
    return { n, formen, farben, diagonale: !!r.diagonale, zellen };
  }
  function kopie(zellen) { return zellen.map((z) => z.map((c) => (c ? { f: c.f, c: c.c } : null))); }
  function zelleText(c) { return c ? INFO[c.f].kurz + (c.c ? ':' + c.c : '') : '.'; }
  function alsText(zellen) {
    const bunt = zellen.some((z) => z.some((c) => c && c.c));
    return zellen.map((z) => z.map(zelleText).join(bunt ? ' ' : ''));
  }
  const gleich = (a, b) => (!a && !b) || (!!a && !!b && a.f === b.f && (a.c || null) === (b.c || null));

  // ---------------------------------------------------------------------
  // Linien: alle Reihen, Spalten (und Schrägen), über die die Regel geht
  // ---------------------------------------------------------------------
  function linien(n, diagonale) {
    const L = [];
    for (let y = 0; y < n; y++) L.push({ art: 'reihe', nr: y, felder: Array.from({ length: n }, (_, x) => [x, y]) });
    for (let x = 0; x < n; x++) L.push({ art: 'spalte', nr: x, felder: Array.from({ length: n }, (_, y) => [x, y]) });
    if (diagonale) {
      L.push({ art: 'schraege', nr: 0, felder: Array.from({ length: n }, (_, i) => [i, i]) });
      L.push({ art: 'schraege', nr: 1, felder: Array.from({ length: n }, (_, i) => [n - 1 - i, i]) });
    }
    return L;
  }

  // ---------------------------------------------------------------------
  // Prüfen (App und Löser): was ist doppelt, was ist leer?
  //   r: Rätsel (n, diagonale, farben), zellen: aktueller Stand
  //   Ergebnis: { ok, voll, leer: [[x, y]], doppelt: [{ art, nr, f?, c?, felder }] }
  //   art: reihe, spalte, schraege (Form doppelt), farbe-reihe, farbe-spalte (Farbe doppelt),
  //        karte (dieselbe bunte Form zweimal)
  // ---------------------------------------------------------------------
  function pruefe(r, zellen) {
    const q = typeof r.n === 'number' && r.zellen ? r : { n: r.n, diagonale: !!r.diagonale, farben: r.farben || null };
    const n = q.n;
    const leer = [];
    const doppelt = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!zellen[y][x]) leer.push([x, y]);
    for (const l of linien(n, q.diagonale)) {
      const proForm = {}, proFarbe = {};
      for (const [x, y] of l.felder) {
        const c = zellen[y][x];
        if (!c) continue;
        (proForm[c.f] = proForm[c.f] || []).push([x, y]);
        if (c.c) (proFarbe[c.c] = proFarbe[c.c] || []).push([x, y]);
      }
      for (const [f, felder] of Object.entries(proForm)) if (felder.length > 1) doppelt.push({ art: l.art, nr: l.nr, f, felder });
      if (l.art !== 'schraege') for (const [c, felder] of Object.entries(proFarbe)) if (felder.length > 1) doppelt.push({ art: 'farbe-' + l.art, nr: l.nr, c, felder });
    }
    if (q.farben) {
      const karten = {};
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const c = zellen[y][x];
        if (c && c.c) (karten[c.f + '|' + c.c] = karten[c.f + '|' + c.c] || []).push([x, y]);
      }
      for (const [k, felder] of Object.entries(karten)) if (felder.length > 1) { const [f, c] = k.split('|'); doppelt.push({ art: 'karte', f, c, felder }); }
    }
    return { ok: !leer.length && !doppelt.length, voll: !leer.length, leer, doppelt };
  }

  // Freundliche Sätze für das Kind (App und Anleitung): „In dieser Reihe ist der Kreis zweimal.“
  // Die Schrägen heißen wie auf dem Blatt nach ihrer Farbe (quadratSVG: nr 0 blau, nr 1 gelb).
  function fehlerText(d) {
    const schraege = d.nr === 1 ? 'In den gelben Feldern' : 'In den blauen Feldern';
    const wo = { reihe: 'In dieser Reihe', spalte: 'In dieser Spalte', schraege, 'farbe-reihe': 'In dieser Reihe', 'farbe-spalte': 'In dieser Spalte' }[d.art];
    const anzahl = d.felder.length === 2 ? 'zweimal' : d.felder.length + '-mal';
    const maennlich = d.f === 'kreis' || d.f === 'stern';
    const gross = (t) => t.charAt(0).toUpperCase() + t.slice(1);
    if (d.art === 'karte') return (maennlich ? 'Den ' + FARBEN[d.c].name + 'en ' : 'Das ' + FARBEN[d.c].name + 'e ') + INFO[d.f].name + ' gibt es ' + anzahl + '.';
    if (d.art.indexOf('farbe-') === 0) return wo + ' gibt es ' + gross(FARBEN[d.c].name) + ' ' + anzahl + '.';
    return wo + ' ist ' + (maennlich ? 'der ' : 'das ') + INFO[d.f].name + ' ' + anzahl + '.';
  }

  // ---------------------------------------------------------------------
  // Bewerten (App und Tests): Ist das Level geschafft? Nur nach dem Ergebnis.
  //   level: Rätsel-Daten (n, vorgabe, aufgabe, diagonale, farben), zellen: aktueller Stand
  //   aufgabe "loesen": die vorgegebenen Formen sind unverändert, und das Quadrat ist richtig und voll
  //   aufgabe "kobold": das Quadrat ist richtig, und höchstens ein Feld ist anders als vorher
  //   (der Löser hat bewiesen: dann ist es genau das Kobold-Feld)
  //   Ergebnis: { geschafft, grund, doppelt, leer, geaendert }, grund: ok, leer, doppelt, vorgabe,
  //   keinTausch, zuViele. Dazu passend: bewertungText(ergebnis)
  // ---------------------------------------------------------------------
  function bewerte(level, zellen) {
    const q = lies(level);
    const p = pruefe(q, zellen);
    const geaendert = [];
    for (let y = 0; y < q.n; y++) for (let x = 0; x < q.n; x++) if (q.zellen[y][x] && !gleich(q.zellen[y][x], zellen[y][x])) geaendert.push([x, y]);
    const aus = { geschafft: false, grund: 'ok', doppelt: p.doppelt, leer: p.leer, geaendert };
    if ((level.aufgabe || 'loesen') === 'kobold') {
      if (geaendert.length > 1) aus.grund = 'zuViele';
      else if (p.leer.length) aus.grund = 'leer';
      else if (p.doppelt.length) aus.grund = geaendert.length ? 'doppelt' : 'keinTausch';
      else aus.geschafft = true;
      return aus;
    }
    if (geaendert.length) aus.grund = 'vorgabe';
    else if (p.doppelt.length) aus.grund = 'doppelt';
    else if (p.leer.length) aus.grund = 'leer';
    else aus.geschafft = true;
    return aus;
  }
  function bewertungText(e) {
    if (e.geschafft) return 'Geschafft! Jede Form ist in jeder Reihe und jeder Spalte genau einmal.';
    if (e.grund === 'doppelt') return fehlerText(e.doppelt[0]);
    if (e.grund === 'leer') return e.leer.length === 1 ? 'Ein Feld ist noch leer.' : 'Noch ' + e.leer.length + ' Felder sind leer.';
    if (e.grund === 'vorgabe') return 'Die vorgegebenen Formen bleiben, wie sie sind.';
    if (e.grund === 'keinTausch') return 'Der Kobold ist noch da! Such eine Reihe mit zwei gleichen Formen.';
    if (e.grund === 'zuViele') return 'Der Kobold hat nur eine Form vertauscht. Ändere nur ein Feld.';
    return '';
  }

  // ---------------------------------------------------------------------
  // Was darf in ein leeres Feld? (Form und, bei Farben, Farbe)
  // ---------------------------------------------------------------------
  function werteVon(q) {
    if (!q.farben) return q.formen.map((f) => ({ f, c: null }));
    const w = [];
    for (const f of q.formen) for (const c of q.farben) w.push({ f, c });
    return w;
  }
  function darf(q, zellen, x, y, w, opt) {
    const o = opt || {};
    const n = q.n;
    const diag = q.diagonale && !o.ohneDiagonale;
    for (let i = 0; i < n; i++) {
      const a = zellen[y][i], b = zellen[i][x];
      if (i !== x && a && (a.f === w.f || (w.c && a.c === w.c))) return false;
      if (i !== y && b && (b.f === w.f || (w.c && b.c === w.c))) return false;
    }
    if (diag) {
      if (x === y) for (let i = 0; i < n; i++) { const a = zellen[i][i]; if (i !== x && a && a.f === w.f) return false; }
      if (x === n - 1 - y) for (let i = 0; i < n; i++) { const a = zellen[i][n - 1 - i]; if (i !== y && a && a.f === w.f) return false; }
    }
    if (w.c && !o.ohneKartenRegel) {
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const a = zellen[j][i];
        if ((i !== x || j !== y) && a && a.f === w.f && a.c === w.c) return false;
      }
    }
    return true;
  }
  function kandidaten(q, zellen, x, y, opt) { return werteVon(q).filter((w) => darf(q, zellen, x, y, w, opt)); }

  // ---------------------------------------------------------------------
  // Backtracking: alle Lösungen (höchstens opt.max, Standard 2) zählen
  //   opt.ohneDiagonale, opt.ohneKartenRegel: eine Zusatzregel weglassen (zum Vergleichen)
  //   Ergebnis: { anzahl, loesungen, vollstaendig } (vollstaendig: alle gezählt)
  // ---------------------------------------------------------------------
  function loese(r, opt) {
    const o = opt || {};
    const q = r.zellen ? r : lies(r);
    const max = o.max || 2;
    const z = kopie(q.zellen);
    const n = q.n;
    const loesungen = [];
    let anzahl = 0;
    let abgebrochen = false;
    // die gegebenen Felder müssen schon zusammenpassen
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (z[y][x] && !darf(q, z, x, y, z[y][x], o)) return { anzahl: 0, loesungen: [], vollstaendig: true, widerspruch: true };
    function schritt() {
      if (abgebrochen) return;
      // das leere Feld mit den wenigsten Möglichkeiten zuerst
      let best = null, bk = null;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        if (z[y][x]) continue;
        const k = kandidaten(q, z, x, y, o);
        if (!best || k.length < bk.length) { best = [x, y]; bk = k; if (!k.length) break; }
      }
      if (!best) {
        anzahl++;
        if (loesungen.length < max) loesungen.push(kopie(z));
        if (anzahl >= max) abgebrochen = true;
        return;
      }
      if (!bk.length) return;
      const [x, y] = best;
      for (const w of bk) {
        z[y][x] = w;
        schritt();
        z[y][x] = null;
        if (abgebrochen) return;
      }
    }
    schritt();
    return { anzahl, loesungen, vollstaendig: !abgebrochen };
  }

  // ---------------------------------------------------------------------
  // Lösen ohne Raten, in Stufen (so, wie ein Kind es macht):
  //   1 „Nur eine fehlt“: in einer Reihe oder Spalte ist nur noch ein Feld leer
  //   2 „Reihe und Spalte zusammen“: Reihe und Spalte eines Felds lassen nur eine Form übrig
  //   3 „Wo ist Platz?“: eine Form passt in einer Reihe oder Spalte nur noch in ein Feld
  //   Immer die kleinste Stufe zuerst. Ergebnis: { fertig, stufe (die höchste gebrauchte), schritte }
  // ---------------------------------------------------------------------
  function logikWeg(r) {
    const q = r.zellen ? r : lies(r);
    const n = q.n;
    const z = kopie(q.zellen);
    const schritte = [];
    let stufe = 0;
    const L = linien(n, q.diagonale);
    function setze(x, y, w, s, grund) { z[y][x] = w; schritte.push({ x, y, f: w.f, c: w.c, stufe: s, grund }); stufe = Math.max(stufe, s); }
    for (let runde = 0; runde < n * n; runde++) {
      let gefunden = false;
      // Stufe 1: Linie mit genau einem leeren Feld
      for (const l of L) {
        const leer = l.felder.filter(([x, y]) => !z[y][x]);
        if (leer.length !== 1) continue;
        const [x, y] = leer[0];
        const k = kandidaten(q, z, x, y);
        if (k.length === 1) { setze(x, y, k[0], 1, l.art); gefunden = true; break; }
      }
      if (gefunden) continue;
      // Stufe 2: nur ein Kandidat im Feld
      for (let y = 0; y < n && !gefunden; y++) for (let x = 0; x < n && !gefunden; x++) {
        if (z[y][x]) continue;
        const k = kandidaten(q, z, x, y);
        if (k.length === 1) { setze(x, y, k[0], 2, 'feld'); gefunden = true; }
      }
      if (gefunden) continue;
      // Stufe 3: ein Wert passt in einer Linie nur an eine Stelle
      if (!q.farben) {
        for (const l of L) {
          for (const f of q.formen) {
            if (l.felder.some(([x, y]) => z[y][x] && z[y][x].f === f)) continue;
            const platz = l.felder.filter(([x, y]) => !z[y][x] && darf(q, z, x, y, { f, c: null }));
            if (platz.length === 1) { setze(platz[0][0], platz[0][1], { f, c: null }, 3, l.art); gefunden = true; break; }
          }
          if (gefunden) break;
        }
      }
      if (!gefunden) break;
    }
    const fertig = z.every((zeile) => zeile.every(Boolean));
    return { fertig, stufe, schritte, ende: z };
  }

  // ---------------------------------------------------------------------
  // Das ganze Quadrat als SVG (ein Feld = 100 Einheiten)
  //   opt.breite: Größe des <svg> (z. B. '88mm'); sonst viewBox-Größe
  //   opt.loesung: zellen der Lösung; leere Felder der Vorgabe bekommen sie rot eingetragen
  //   opt.markiert: [[x, y]] rot eingekreiste Felder (Kobold)
  //   opt.schraege: die zwei Schrägen hell hinterlegen
  //   opt.leer: Felder ohne Vorgabe, nur das Gitter (zum Selbermachen)
  // ---------------------------------------------------------------------
  function quadratSVG(q, opt) {
    const o = opt || {};
    const n = q.n;
    const W = n * 100;
    let s = '<rect x="0" y="0" width="' + W + '" height="' + W + '" fill="#ffffff"/>';
    if (o.schraege) {
      for (let i = 0; i < n; i++) {
        s += '<rect x="' + (i * 100) + '" y="' + (i * 100) + '" width="100" height="100" fill="' + SCHRAEGE[0] + '"/>';
        s += '<rect x="' + ((n - 1 - i) * 100) + '" y="' + (i * 100) + '" width="100" height="100" fill="' + SCHRAEGE[1] + '"/>';
      }
    }
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const c = o.leer ? null : q.zellen[y][x];
      const tr = ' transform="translate(' + (x * 100 + 14) + ' ' + (y * 100 + 14) + ') scale(0.72)"';
      if (c) s += '<g' + tr + '>' + formInhalt(c.f, { farbe: c.c ? FARBEN[c.c].wert : undefined }) + '</g>';
      else if (o.loesung && o.loesung[y][x]) {
        const l = o.loesung[y][x];
        s += '<g' + tr + '>' + formInhalt(l.f, l.c ? { loesungBunt: true, farbe: FARBEN[l.c].wert } : { loesung: true }) + '</g>';
      }
    }
    for (let i = 1; i < n; i++) {
      s += '<line x1="' + (i * 100) + '" y1="0" x2="' + (i * 100) + '" y2="' + W + '" stroke="' + T + '" stroke-width="3"/>';
      s += '<line x1="0" y1="' + (i * 100) + '" x2="' + W + '" y2="' + (i * 100) + '" stroke="' + T + '" stroke-width="3"/>';
    }
    s += '<rect x="3" y="3" width="' + (W - 6) + '" height="' + (W - 6) + '" fill="none" stroke="' + T + '" stroke-width="6" rx="4"/>';
    for (const [x, y] of o.markiert || []) s += '<circle cx="' + (x * 100 + 50) + '" cy="' + (y * 100 + 50) + '" r="45" fill="none" stroke="' + ROT + '" stroke-width="8"/>';
    const gr = o.breite ? ' width="' + o.breite + '" height="' + o.breite + '"' : ' width="' + W + '" height="' + W + '"';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + W + '"' + gr + ' role="img" aria-label="Formen-Quadrat">' + s + '</svg>';
  }

  g.WerkstattFormen = {
    FORMEN, INFO, BUCHSTABE, FARBEN, FARB_LISTE, SCHRAEGE, MIN_N, MAX_N, ROT,
    form, formInhalt, formenVon, farbenVon, lies, kopie, alsText, zelleText, gleich,
    linien, pruefe, fehlerText, bewerte, bewertungText, werteVon, darf, kandidaten, loese, logikWeg, quadratSVG,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
