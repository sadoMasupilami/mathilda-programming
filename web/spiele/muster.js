/* =====================================================================
   Spiel-Plugin „muster“ (Einheit 6 „Muster-Detektivin“)
   Drei Aufgaben, alles nur Antippen:
   - fortsetzen: leere Plätze (Lücken und Plätze am Ende) mit Perlen aus der Auswahl füllen.
       Der Platz, der dran ist, hat einen goldenen Rand; jeder Platz lässt sich antippen und ändern.
   - kobold:     die falsche Perle antippen, dann die richtige aus der Auswahl. Es ist immer nur eine
       Perle getauscht: Wer eine andere antippt, bekommt die erste wieder wie vorher.
   - zauber:     einen Zauber-Kasten bauen (Zahl 2 bis 5, 1 bis 3 Perlen). Bei „Los“ malt der Kasten
       das Armband Perle für Perle unter das gezeigte und bleibt dort stehen, wo es nicht passt.
   Bewertet wird nur nach dem Ergebnis, mit web/kern/muster.js wie im Löser:
   fortsetzen mit WerkstattMuster.fortsetzung (aus dem Kern der sichtbaren Perlen gerechnet),
   kobold mit WerkstattMuster.istSauber, zauber mit WerkstattMuster.ausrollen. Keine Lösungen in den Daten.
   Ruhig: kein Ton, keine Zeitgrenze, kein Blinken. Freundliche Hinweise statt „falsch“.
   Layout: Feld oben bzw. links (Perlen in Reihen, Größe nach dem Platz), Auswahl und Tasten unten bzw. rechts.
   Die Tasten-Belegung bleibt in einem Level immer gleich (nichts springt beim Antippen).
   ===================================================================== */
(function () {
  'use strict';
  const M = window.WerkstattMuster;
  const SPIELE = (window.WerkstattSpiele = window.WerkstattSpiele || {});
  if (!M) return;

  const T = '#1f2340';
  const LUPE = '<svg viewBox="0 0 100 100" aria-hidden="true">' +
    '<path d="M60 60 L88 88" stroke="' + T + '" stroke-width="15" stroke-linecap="round"/>' +
    '<path d="M62 62 L86 86" stroke="#b86b2c" stroke-width="8" stroke-linecap="round"/>' +
    '<circle cx="40" cy="40" r="29" fill="#e9f4ff" stroke="' + T + '" stroke-width="8"/>' +
    '<path d="M24 34 C 27 26, 33 21, 41 20" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/></svg>';
  const KASTEN = '<svg viewBox="0 0 100 100" aria-hidden="true">' +
    '<rect x="6" y="14" width="88" height="72" rx="12" fill="#f1ebff" stroke="#7a4fd1" stroke-width="7"/>' +
    '<path d="M6 38 H94" stroke="#7a4fd1" stroke-width="5"/>' +
    '<circle cx="28" cy="61" r="11" fill="#e0453a" stroke="' + T + '" stroke-width="4"/>' +
    '<rect x="42" y="50" width="22" height="22" rx="3" fill="#3a7be0" stroke="' + T + '" stroke-width="4"/>' +
    '<rect x="72" y="50" width="16" height="22" rx="3" fill="none" stroke="#7a4fd1" stroke-width="3" stroke-dasharray="4 3"/></svg>';

  // Ein Element (Perle, Hand, Fuß, Finger) als Bild an Stelle x, y (für das Paket-Bild)
  const perleBei = (n, x, y, gr) => M.svg(n).replace('<svg ', '<svg x="' + x + '" y="' + y + '" width="' + gr + '" height="' + gr + '" ');
  function paketBild() {
    // Ein Armband (3-mal: rot, gelb, blau) und die Lupe der Detektivin
    let s = '<svg class="muster-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true">' +
      '<circle cx="50" cy="50" r="36" fill="none" stroke="#9a9db0" stroke-width="3.5"/>';
    const folge = ['rot', 'gelb', 'blau', 'rot', 'gelb', 'blau', 'rot', 'gelb', 'blau'];
    folge.forEach((n, i) => {
      const w = -Math.PI / 2 + (i * 2 * Math.PI) / folge.length;
      s += perleBei(n, (50 + 36 * Math.cos(w) - 11).toFixed(1), (50 + 36 * Math.sin(w) - 11).toFixed(1), 22);
    });
    s += '<g transform="translate(29 29) scale(0.48)">' + LUPE.replace(/^<svg[^>]*>/, '').replace('</svg>', '') + '</g></svg>';
    return s;
  }

  // ---------------------------------------------------------------------
  // Hilfen
  // ---------------------------------------------------------------------
  const istBewegung = (f) => f.some((x) => x && M.gruppe(x) === 'bewegung');
  const W = (z) => (z.bewegung
    ? { viele: 'Bewegungen', eine: 'Bewegung', malt: 'macht', ding: 'Klatsch-Muster', die: 'die richtige Bewegung', falsche: 'die falsche Bewegung' }
    : { viele: 'Perlen', eine: 'Perle', malt: 'malt', ding: 'Armband', die: 'die richtige Perle', falsche: 'die falsche Perle' });
  const leerePlaetze = (z) => z.offen.filter((i) => z.werte[i] === null);
  function naechsterLeerer(z, ab) {
    const leer = leerePlaetze(z);
    if (!leer.length) return null;
    const nach = leer.find((i) => i > ab);
    return nach !== undefined ? nach : leer[0];
  }

  // Wie viele Reihen, wie viele Perlen pro Reihe, wie groß? Möglichst wenige Reihen (so sieht man das Muster
  // am besten), aber die Perlen mindestens min groß (zum Antippen 48 px) und nicht viel kleiner als es ginge.
  // paare: zwei Reihen pro Zeile (gezeigtes Armband und darunter das gemalte).
  function raster(Wb, Hb, n, o) {
    const moegl = [];
    for (let r = 1; r <= n; r++) {
      const c = Math.ceil(n / r);
      if (r > 1 && Math.ceil(n / (r - 1)) === c) continue;
      const rr = Math.ceil(n / c);
      const hoch = o.paare ? (Hb - (rr - 1) * o.zg - rr * o.pg) / (2 * rr) : (Hb - (rr - 1) * o.zg) / rr;
      moegl.push({ r: rr, c, s: Math.floor(Math.min((Wb - (c - 1) * o.g) / c, hoch, o.max)) });
    }
    const best = Math.max(...moegl.map((x) => x.s));
    const gut = moegl.find((x) => x.s >= o.min && x.s >= 0.75 * best);
    if (gut) return gut;
    const x = moegl.find((y) => y.s === best) || { r: 1, c: n, s: o.min };
    if (o.tippen && x.s < o.min) x.s = o.min;
    return x;
  }

  // ---------------------------------------------------------------------
  // Zustand
  // ---------------------------------------------------------------------
  function neu(api) {
    const lv = api.lv;
    const z = api.zustand;
    for (const k of Object.keys(z)) if (k !== 'beob' && k !== 'masse') delete z[k];
    z.aufgabe = lv.aufgabe;
    z.folge = lv.folge.slice();
    z.palette = (lv.palette || []).slice();
    z.bewegung = istBewegung(z.folge);
    z.fertig = false;
    z.band = null;
    if (z.aufgabe === 'fortsetzen') {
      z.weiter = lv.weiter || 0;
      z.werte = z.folge.concat(new Array(z.weiter).fill(null));
      z.offen = z.werte.map((x, i) => (x === null ? i : -1)).filter((i) => i >= 0);
      z.dran = z.offen.length ? z.offen[0] : null;
      z.falsch = null;
    } else if (z.aufgabe === 'kobold') {
      z.werte = z.folge.slice();
      z.wahl = null;
    } else {
      z.wdh = null;
      z.teile = [];
      z.gemalt = [];
      z.mark = null;
      z.warn = false;
      z.aktiv = null;
      z.runde = null;
      z.laeuft = false;
    }
  }

  // ---------------------------------------------------------------------
  // Zeichnen: Feld (Perlen-Reihen)
  // ---------------------------------------------------------------------
  function bild(n) { return n ? M.svg(n) : ''; }
  function bandKlasse(z, i) {
    if (!z.band) return '';
    const b = Math.floor(i / z.band);
    const n = z.aufgabe === 'zauber' ? z.folge.length : z.werte.length;
    return ' muster-band muster-band-' + (b % 2 ? 'b' : 'a') + (i % z.band === 0 ? ' muster-band-start' : '') +
      ((i + 1) % z.band === 0 || i === n - 1 ? ' muster-band-ende' : '');
  }
  function elementFortsetzen(z, i) {
    const x = z.werte[i];
    if (!z.offen.includes(i)) return '<span class="muster-p muster-fest' + bandKlasse(z, i) + '">' + bild(x) + '</span>';
    const cls = ' muster-platz' + (x === null ? ' muster-leer' : ' muster-voll') + (z.dran === i && !z.fertig ? ' muster-dran' : '') +
      (z.falsch === i ? ' muster-falsch' : '') + bandKlasse(z, i);
    return '<button class="muster-p' + cls + '" data-aktion="muster-platz" data-i="' + i + '" data-umschalter aria-label="Platz ' + (i + 1) + (x ? ': ' + M.wort(x) : ', leer') + '"' +
      (z.fertig ? ' disabled' : '') + '>' + bild(x) + '</button>';
  }
  function elementKobold(api, z, i) {
    const x = z.werte[i];
    const getauscht = x !== z.folge[i];
    const cls = (z.wahl === i ? ' muster-wahl' : '') + (getauscht ? ' muster-getauscht' : '') + bandKlasse(z, i);
    return '<button class="muster-p muster-perle' + cls + '" data-aktion="muster-perle" data-i="' + i + '" data-umschalter aria-label="' + (z.bewegung ? 'Bewegung ' : 'Perle ') + (i + 1) + ': ' + M.wort(x) + '"' +
      (z.fertig ? ' disabled' : '') + '>' + bild(x) + (getauscht ? '<span class="muster-tausch" aria-hidden="true">' + api.ICON.tauschen + '</span>' : '') + '</button>';
  }

  function zeichneFeld(api) {
    const z = api.zustand;
    const feld = api.feld;
    if (!feld) return;
    const wb = feld.clientWidth, hb = feld.clientHeight;
    if (wb < 10 || hb < 10) return;
    const gross = Math.min(window.innerWidth, window.innerHeight) >= 700;
    const g = gross ? 12 : 8;
    const n = z.aufgabe === 'zauber' ? z.folge.length : z.werte.length;
    const o = { g, zg: gross ? 22 : 14, pg: gross ? 8 : 5, max: gross ? 92 : 66, min: z.aufgabe === 'zauber' ? 34 : 48, tippen: z.aufgabe !== 'zauber', paare: z.aufgabe === 'zauber' };
    const m = raster(wb - 8, hb - 8, n, o);
    z.masse = { wb, hb, r: m.r, c: m.c, s: m.s };
    let html = '';
    for (let a = 0; a < n; a += m.c) {
      const idx = [];
      for (let i = a; i < Math.min(n, a + m.c); i++) idx.push(i);
      if (z.aufgabe === 'fortsetzen') html += '<div class="muster-zeile' + (z.bewegung ? '' : ' muster-schnur') + '">' + idx.map((i) => elementFortsetzen(z, i)).join('') + '</div>';
      else if (z.aufgabe === 'kobold') html += '<div class="muster-zeile' + (z.bewegung ? '' : ' muster-schnur') + '">' + idx.map((i) => elementKobold(api, z, i)).join('') + '</div>';
      else {
        const oben = idx.map((i) => '<span class="muster-p muster-fest' + (z.mark === i ? ' muster-falsch' : '') + '" data-j="' + i + '">' + bild(z.folge[i]) + '</span>').join('');
        const unten = idx.map((i) => {
          const x = z.gemalt[i];
          const cls = x ? ' muster-gemalt' : ' muster-frei';
          return '<span class="muster-p muster-erg' + cls + (z.mark === i ? ' muster-falsch' : '') + (z.laeuft && i === z.gemalt.length - 1 ? ' muster-jetzt' : '') + (x ? bandKlasse(z, i) : '') + '" data-j="' + i + '">' + bild(x) + '</span>';
        }).join('');
        html += '<div class="muster-paar"><div class="muster-zeile' + (z.bewegung ? '' : ' muster-schnur') + '">' + oben + '</div>' +
          '<div class="muster-zeile muster-unten' + (z.bewegung || !z.gemalt.length ? '' : ' muster-schnur') + '">' + unten + '</div></div>';
      }
    }
    feld.innerHTML = '<div class="muster-feld muster-' + z.aufgabe + '" style="--s:' + m.s + 'px;--g:' + g + 'px;--zg:' + o.zg + 'px;--pg:' + o.pg + 'px">' +
      '<div class="muster-block">' + html + '</div></div>';
  }

  // ---------------------------------------------------------------------
  // Zeichnen: Zauber-Kasten (Programm) und Tasten
  // ---------------------------------------------------------------------
  function zeichneProgramm(api) {
    const z = api.zustand;
    const box = api.programm;
    if (!box) return;
    if (z.aufgabe !== 'zauber') { box.innerHTML = ''; return; }
    let innen = '';
    for (let j = 0; j < M.MAX_INNEN; j++) {
      const x = z.teile[j];
      innen += '<span class="muster-k' + (x ? ' muster-k-voll' : '') + (z.aktiv === j ? ' muster-k-aktiv' : '') + '">' + bild(x) + '</span>';
    }
    const zahl = z.wdh ? '<b class="muster-zahl-anz">' + z.wdh + '</b>' : '<b class="muster-zahl-anz muster-zahl-leer">?</b>';
    box.innerHTML = '<div class="muster-prog">' +
      '<div class="muster-kasten' + (z.laeuft ? ' muster-kasten-laeuft' : '') + '" aria-label="Zauber-Kasten">' +
      '<div class="muster-mal' + (z.warn ? ' muster-warn' : '') + '">' + zahl + '<span>-mal</span>' +
      (z.runde !== null ? '<span class="muster-runde">Runde ' + (z.runde + 1) + '</span>' : '') + '</div>' +
      '<div class="muster-innen">' + innen + '</div></div>' +
      api.taste('muster-weg', api.ICON.weg, { cls: 'befehl', label: 'Letzte ' + W(z).eine + ' aus dem Kasten', aus: z.laeuft || !z.teile.length || z.fertig }) +
      '</div>';
  }

  function paletteHTML(api, opt) {
    const z = api.zustand;
    let r = '';
    for (const x of z.palette) {
      r += api.taste('muster-el', bild(x), { cls: 'befehl muster-el', daten: 'data-el="' + x + '"', label: M.wort(x), aus: opt.aus || (opt.ausEl && opt.ausEl(x)), grau: opt.grau });
    }
    return '<div class="muster-palette" data-n="' + z.palette.length + '">' + r + '</div>';
  }
  function losReihe(api, losGrau, aus) {
    return '<div class="reihe">' +
      api.taste('nochmal', '<span>Nochmal</span>', { cls: 'breit', label: 'Nochmal: alles wie am Anfang' }) +
      api.taste('los', api.ICON.los + '<span>Los</span>', { cls: 'breit los', grau: losGrau, aus }) +
      '</div>';
  }
  function zeichneTasten(api) {
    const z = api.zustand;
    const box = api.tasten;
    if (!box) return;
    if (z.aufgabe === 'fortsetzen') {
      box.innerHTML = paletteHTML(api, { aus: z.fertig, grau: z.dran === null }) + losReihe(api, leerePlaetze(z).length > 0, z.fertig);
    } else if (z.aufgabe === 'kobold') {
      const ist = z.wahl !== null ? z.werte[z.wahl] : null;
      box.innerHTML = paletteHTML(api, { aus: z.fertig, grau: z.wahl === null, ausEl: (x) => x === ist }) +
        losReihe(api, z.werte.every((x, i) => x === z.folge[i]), z.fertig);
    } else {
      let zahlen = '';
      for (let w = M.WDH_MIN; w <= M.WDH_MAX; w++) {
        zahlen += api.taste('muster-zahl', '<span>' + w + '</span>', { cls: 'befehl zahl muster-zahl' + (z.wdh === w ? ' muster-gewaehlt' : ''), daten: 'data-zahl="' + w + '" data-i="' + w + '" data-umschalter', label: w + '-mal', aus: z.laeuft || z.fertig });
      }
      box.innerHTML = '<div class="muster-zahlen">' + zahlen + '</div>' +
        paletteHTML(api, { aus: z.laeuft || z.fertig, grau: z.teile.length >= M.MAX_INNEN }) +
        losReihe(api, !z.wdh || !z.teile.length, z.laeuft || z.fertig);
    }
  }

  function zeichne(api) {
    zeichneProgramm(api);
    zeichneTasten(api);
    zeichneFeld(api);
  }

  // ---------------------------------------------------------------------
  // Meldungen
  // ---------------------------------------------------------------------
  function grundMeldung(api) {
    const z = api.zustand;
    const w = W(z);
    if (z.aufgabe === 'fortsetzen') {
      const luecken = z.folge.filter((x) => x === null).length;
      let t;
      if (luecken && z.weiter) t = (luecken > 1 ? 'Füll die Lücken' : 'Füll die Lücke') + ' und mach weiter!';
      else if (luecken) t = luecken > 1 ? 'Füll die Lücken!' : 'Füll die Lücke!';
      else t = z.bewegung ? 'Wie geht das Klatsch-Muster weiter?' : 'Wie geht das Muster weiter?';
      return api.meldung(t + ' Tippe an, was kommt.', '', LUPE);
    }
    if (z.aufgabe === 'kobold') return api.meldung('Der Kobold hat ' + (z.bewegung ? 'eine Bewegung' : 'eine Perle') + ' vertauscht! Tippe sie an.', '', api.sym('kobold'));
    return api.meldung('Bau den Zauber-Kasten: Wie oft? Was kommt hinein?', 'zauber-meldung', KASTEN);
  }

  // ---------------------------------------------------------------------
  // Fortsetzen
  // ---------------------------------------------------------------------
  function fortsetzenWahl(api, x) {
    const z = api.zustand;
    if (z.dran === null) return api.meldung('Alles voll! Tippe einen Platz an, um ihn zu ändern.', 'hinweis', LUPE);
    const i = z.dran;
    z.werte[i] = x;
    if (z.falsch === i) z.falsch = null;
    z.dran = naechsterLeerer(z, i);
    zeichne(api);
    if (z.dran === null) api.meldung('Fertig? Dann tippe auf „Los“!', 'hinweis', LUPE);
    else if (z.falsch !== null) api.meldung('Schau dir die markierte Stelle an.', 'hinweis', LUPE);
    else grundMeldung(api);
  }
  function fortsetzenPlatz(api, i) {
    const z = api.zustand;
    if (z.fertig) return;
    z.dran = i;
    zeichne(api);
    api.meldung('Was kommt hierher? Tippe es an.', 'hinweis', LUPE);
  }
  function fortsetzenLos(api) {
    const z = api.zustand;
    if (leerePlaetze(z).length) {
      z.dran = leerePlaetze(z)[0];
      zeichne(api);
      return api.meldung('Es sind noch Plätze leer.', 'hinweis', LUPE);
    }
    // Aus den sichtbaren Perlen gerechnet (Muster-Kern), nie gespeichert
    const f = M.fortsetzung(z.folge, z.weiter);
    const soll = z.folge.slice();
    f.luecken.forEach((u) => { soll[u.i] = u.el; });
    const voll = soll.concat(f.weiter);
    const falsch = z.offen.find((i) => z.werte[i] !== voll[i]);
    if (falsch === undefined) {
      z.fertig = true;
      z.dran = null;
      z.falsch = null;
      z.band = M.kern(z.werte).laenge;
      zeichne(api);
      return api.geschafft({ zusatz: 'Der Muster-Kern hat ' + z.band + ' ' + (z.band === 1 ? W(z).eine : W(z).viele) + '.' });
    }
    z.falsch = falsch;
    z.dran = falsch;
    zeichne(api);
    api.meldung('Fast! Hier passt es noch nicht. Was wiederholt sich?', 'hinweis', LUPE);
  }

  // ---------------------------------------------------------------------
  // Kobold: genau eine Perle tauschen
  // ---------------------------------------------------------------------
  function koboldPerle(api, i) {
    const z = api.zustand;
    if (z.fertig) return;
    const vorher = z.werte.findIndex((x, j) => x !== z.folge[j]);
    let zurueck = false;
    if (vorher >= 0 && vorher !== i) { z.werte[vorher] = z.folge[vorher]; zurueck = true; }
    z.wahl = z.wahl === i ? null : i;
    zeichne(api);
    if (z.wahl === null) return grundMeldung(api);
    if (zurueck) return api.meldung('Nur eine ist falsch: Die andere ist wieder wie vorher.', 'hinweis', api.sym('kobold'));
    api.meldung('Was gehört hierher? Tippe ' + W(z).die + ' an.', 'hinweis', api.sym('kobold'));
  }
  function koboldWahl(api, x) {
    const z = api.zustand;
    if (z.wahl === null) return api.meldung('Tippe zuerst ' + W(z).falsche + ' im Muster an.', 'hinweis', api.sym('kobold'));
    z.werte[z.wahl] = x;
    z.wahl = null;
    zeichne(api);
    if (z.werte.every((y, j) => y === z.folge[j])) return grundMeldung(api);
    api.meldung('Getauscht! Tippe auf „Los“.', 'hinweis', api.sym('kobold'));
  }
  function koboldLos(api) {
    const z = api.zustand;
    const anders = z.werte.filter((x, j) => x !== z.folge[j]).length;
    if (!anders) return api.meldung('Tippe zuerst ' + W(z).falsche + ' an.', 'hinweis', api.sym('kobold'));
    if (anders === 1 && M.istSauber(z.werte)) {
      z.fertig = true;
      z.wahl = null;
      z.band = M.kern(z.werte).laenge;
      zeichne(api);
      return api.geschafft({ zusatz: 'Kobold erwischt! Der Muster-Kern hat ' + z.band + ' ' + W(z).viele + '.' });
    }
    z.wahl = null;
    zeichne(api);
    api.meldung('Noch kein sauberes Muster. Such den Kobold nochmal!', 'hinweis', api.sym('kobold'));
  }

  // ---------------------------------------------------------------------
  // Zauber-Kasten: bauen und malen lassen
  // ---------------------------------------------------------------------
  function zauberAenderung(api) {
    const z = api.zustand;
    if (z.laeuft || z.fertig) return false;
    z.gemalt = []; z.mark = null; z.warn = false; z.aktiv = null; z.runde = null;
    return true;
  }
  function zauberHinweis(api) {
    const z = api.zustand;
    if (!z.wdh) return api.meldung('Wie oft? Tippe eine Zahl an.', 'zauber-meldung', KASTEN);
    if (!z.teile.length) return api.meldung('Was kommt in den Kasten? Tippe es an.', 'zauber-meldung', KASTEN);
    if (z.teile.length < M.MAX_INNEN) return api.meldung('Noch etwas hinein? Sonst tippe auf „Los“.', 'zauber-meldung', KASTEN);
    api.meldung('Der Kasten ist voll. Tippe auf „Los“.', 'zauber-meldung', KASTEN);
  }
  function zauberZahl(api, w) {
    const z = api.zustand;
    if (!zauberAenderung(api)) return;
    z.wdh = w;
    zeichne(api);
    zauberHinweis(api);
  }
  function zauberWahl(api, x) {
    const z = api.zustand;
    if (z.laeuft || z.fertig) return;
    if (z.teile.length >= M.MAX_INNEN) return api.meldung('Der Kasten ist voll: Höchstens ' + M.MAX_INNEN + ' passen hinein.', 'hinweis', KASTEN);
    zauberAenderung(api);
    z.teile.push(x);
    zeichne(api);
    zauberHinweis(api);
  }
  function zauberWeg(api) {
    const z = api.zustand;
    if (!zauberAenderung(api)) return;
    z.teile.pop();
    zeichne(api);
    zauberHinweis(api);
  }
  function zauberLos(api) {
    const z = api.zustand;
    if (z.laeuft || z.fertig) return;
    if (!z.wdh || !z.teile.length) return zauberHinweis(api);
    zauberAenderung(api);
    const aus = M.ausrollen([{ wdh: z.wdh, teile: z.teile.slice() }]);
    const n = z.folge.length, k = z.teile.length;
    const w = W(z);
    z.laeuft = true;
    api.laeuft(true);
    zeichne(api);
    api.meldung('Der Zauber-Kasten ' + w.malt + ' …', 'laeuft', KASTEN);
    const tempo = Math.max(20, Math.round(api.TEMPO * 0.6));
    let j = 0;
    const ende = (text) => {
      z.laeuft = false;
      api.laeuft(false);
      z.aktiv = null;
      zeichne(api);
      if (text) api.meldung(text, 'hinweis', KASTEN);
    };
    const schritt = () => {
      if (j < aus.length && j < n) {
        z.gemalt[j] = aus[j];
        z.aktiv = j % k;
        z.runde = Math.floor(j / k);
        if (aus[j] !== z.folge[j]) {
          z.mark = j;
          return ende('Hier passt es nicht! Schau dir den Kasten nochmal an.');
        }
        j++;
        zeichne(api);
        api.spaeter(schritt, tempo);
        return;
      }
      if (aus.length > n) { z.warn = true; return ende('Zu viel: Dein Kasten ' + w.malt + ' ' + aus.length + ' ' + w.viele + ', hier sind nur ' + n + '.'); }
      if (aus.length < n) { z.warn = true; return ende('Zu wenig: Dein Kasten ' + w.malt + ' ' + aus.length + ' ' + w.viele + ', hier sind ' + n + '.'); }
      z.fertig = true;
      z.band = k;
      ende('');
      api.geschafft({ zusatz: 'Nur ' + (1 + k) + ' Karten statt ' + n + '!' });
    };
    api.spaeter(schritt, Math.min(250, api.TEMPO));
  }

  // ---------------------------------------------------------------------
  // Plugin
  // ---------------------------------------------------------------------
  function start(api) {
    neu(api);
    const sp = api.feld && api.feld.closest('.spiel');
    if (sp) sp.classList.add('muster-' + api.lv.aufgabe);
    zeichne(api);
    // Neu zeichnen, wenn sich der Platz ändert (Drehen, längere Meldung): Perlen-Größe und Reihen anpassen
    const z = api.zustand;
    if (window.ResizeObserver && api.feld) {
      let geplant = false;
      z.beob = new ResizeObserver(() => {
        if (geplant) return;
        geplant = true;
        requestAnimationFrame(() => {
          geplant = false;
          const m = z.masse;
          if (!api.feld.isConnected) return;
          if (!m || Math.abs(api.feld.clientWidth - m.wb) > 1 || Math.abs(api.feld.clientHeight - m.hb) > 1) zeichneFeld(api);
        });
      });
      z.beob.observe(api.feld);
    }
  }
  function stopp(api) {
    const z = api.zustand;
    if (z && z.beob) { z.beob.disconnect(); z.beob = null; }
  }

  SPIELE.muster = {
    icon: () => paketBild(),
    start,
    grundMeldung,
    klick(aktion, el, api) {
      const z = api.zustand;
      const i = parseInt(el.dataset.i, 10);
      if (aktion === 'muster-platz') return fortsetzenPlatz(api, i);
      if (aktion === 'muster-perle') return koboldPerle(api, i);
      if (aktion === 'muster-el') {
        const x = el.dataset.el;
        if (z.aufgabe === 'fortsetzen') return z.fertig ? undefined : fortsetzenWahl(api, x);
        if (z.aufgabe === 'kobold') return z.fertig ? undefined : koboldWahl(api, x);
        return zauberWahl(api, x);
      }
      if (aktion === 'muster-zahl') return zauberZahl(api, parseInt(el.dataset.zahl, 10));
      if (aktion === 'muster-weg') return zauberWeg(api);
    },
    los(api) {
      const z = api.zustand;
      if (z.fertig) return;
      if (z.aufgabe === 'fortsetzen') return fortsetzenLos(api);
      if (z.aufgabe === 'kobold') return koboldLos(api);
      return zauberLos(api);
    },
    nochmal(api) {
      neu(api);
      api.laeuft(false);
      zeichne(api);
      grundMeldung(api);
    },
    stopp,
  };

  // app.js zeichnet die erste Ansicht, bevor die Spiel-Plugins geladen sind (sie stehen in index.html
  // nach app.js). Öffnet man ein Paket oder Level direkt (QR-Code am Blatt, Neuladen), fehlte sonst das
  // Paket-Bild oder das Spiel. Dann einmal neu zeichnen lassen, wie mit einem Tipp auf eine Taste.
  (function neuZeichnen() {
    const app = document.getElementById('app');
    const ans = document.body && document.body.dataset.ansicht;
    const DATEN = window.WERKSTATT_DATEN;
    if (!app || !ans || !DATEN || !['start', 'block', 'paket', 'level'].includes(ans)) return;
    if (!DATEN.pakete.some((p) => p.art === 'muster' || p.levels.some((l) => l.art === 'muster'))) return;
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    const b = document.createElement('button');
    b.hidden = true;
    let m;
    if (!h) b.dataset.aktion = 'heim';
    else if ((m = /^block-([a-d])$/i.exec(h))) { b.dataset.aktion = 'block'; b.dataset.block = m[1].toLowerCase(); }
    else if ((m = /^(e\d+)$/i.exec(h))) { b.dataset.aktion = 'paket'; b.dataset.paket = m[1].toLowerCase(); }
    else if ((m = /^(e\d+)\/(\d+)$/i.exec(h))) { b.dataset.aktion = 'level'; b.dataset.paket = m[1].toLowerCase(); b.dataset.i = String(parseInt(m[2], 10) - 1); }
    else return;
    app.appendChild(b);
    b.click();
    if (b.isConnected) b.remove();
  })();
})();
