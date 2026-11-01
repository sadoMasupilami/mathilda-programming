/* =====================================================================
   Spiel-Plugin „formen“ (Einheit 14, Paket e14 „Formen-Quadrate“)
   Schnittstelle: Kopf von web/app.js. Gemeinsamer Kern mit Löser und Blättern:
   web/kern/formen.js (die vier Formen als SVG, lies, bewerte, fehlerText).

   Bedienung (nur Antippen, kein Ziehen):
     Ein Feld antippen: es ist ausgewählt (gelber Rand). Dann unten eine Form antippen,
     schon steht sie im Feld. Nochmal eine andere Form: sie wird ausgetauscht.
     Die Taste mit dem Kreuz macht das Feld wieder leer. Die vorgegebenen Formen bleiben fest.
   aufgabe "loesen" (Standard): leere Felder füllen. Mit diagonale: die Schrägen sind blau
     und gelb hinterlegt wie auf Blatt 14-3 („In den blauen Feldern jede Form einmal“).
   aufgabe "kobold": alle Felder sind voll, eine Form ist falsch. Jedes Feld lässt sich
     antippen und austauschen, aber nur eines darf anders sein als am Anfang: Ändert
     das Kind ein zweites Feld, ist das erste wieder wie vorher (die App sagt es).
   „Los“ bewertet NUR das Ergebnis mit WerkstattFormen.bewerte (dieselben Regeln wie der
     Löser). Die App kennt keine Lösung. Hinweise statt „falsch“: die Reihe oder Spalte
     mit der doppelten Form bekommt einen Rahmen, die zwei gleichen Formen leuchten,
     leere Felder bekommen einen gestrichelten Rand.
   Geschafft: Das Brett wird golden, kurz danach kommt das Geschafft-Fenster (so trifft der
     zweite Tipp eines Doppeltipps auf „Los“ nicht gleich eine Taste im Fenster).
   Ruhig: kein Ton, keine Zeit, kein Blinken. CSS: web/spiele/formen.css (Präfix formen-).
   ===================================================================== */
(function () {
  'use strict';
  const FQ = window.WerkstattFormen;
  const SPIELE = (window.WerkstattSpiele = window.WerkstattSpiele || {});
  const T = '#1f2340';
  const PAUSE = 450;   // ms zwischen goldenem Brett und Geschafft-Fenster

  // ---------------------------------------------------------------------
  // Bilder
  // ---------------------------------------------------------------------
  // Kleines Formen-Quadrat 3 · 3 (Kachel, Paket-Seite, Meldung)
  function quadratIcon(mitFrage) {
    const q = [['kreis', 'dreieck', 'quadrat'], ['quadrat', 'kreis', 'dreieck'], ['dreieck', 'quadrat', 'kreis']];
    let s = '<svg class="formen-icon" viewBox="0 0 100 100" aria-hidden="true">';
    s += '<rect x="1" y="1" width="98" height="98" rx="12" fill="#ece6d6"/>';
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) {
      const px = 5 + x * 31, py = 5 + y * 31;
      s += '<rect x="' + px + '" y="' + py + '" width="28" height="28" rx="5" fill="#fff" stroke="' + T + '" stroke-width="2.6"/>';
      if (mitFrage && x === 2 && y === 2) {
        s += '<path d="M' + (px + 10) + ' ' + (py + 10) + ' C' + (px + 10) + ' ' + (py + 4) + ' ' + (px + 19) + ' ' + (py + 4) + ' ' + (px + 19) + ' ' + (py + 10) +
          ' C' + (px + 19) + ' ' + (py + 14) + ' ' + (px + 14) + ' ' + (py + 14) + ' ' + (px + 14) + ' ' + (py + 18) + '" fill="none" stroke="#5d6280" stroke-width="3" stroke-linecap="round"/>' +
          '<circle cx="' + (px + 14) + '" cy="' + (py + 23) + '" r="2" fill="#5d6280"/>';
      } else {
        s += '<g transform="translate(' + (px + 2) + ' ' + (py + 2) + ') scale(0.24)">' + FQ.formInhalt(q[y][x], { strich: 6 }) + '</g>';
      }
    }
    return s + '</svg>';
  }
  // Kleines leeres 4 · 4 mit den zwei Schrägen in Blau und Gelb (Meldung zur Schrägen-Regel)
  function schraegenIcon() {
    let s = '<svg class="formen-icon" viewBox="0 0 100 100" aria-hidden="true">';
    s += '<rect x="1" y="1" width="98" height="98" rx="12" fill="#ece6d6"/>';
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const f = x === y ? FQ.SCHRAEGE[0] : x === 3 - y ? FQ.SCHRAEGE[1] : '#fff';
      s += '<rect x="' + (5 + x * 23) + '" y="' + (5 + y * 23) + '" width="21" height="21" rx="4" fill="' + f + '" stroke="' + T + '" stroke-width="2.2"/>';
    }
    return s + '</svg>';
  }
  const formBild = (f) => FQ.form(f, '100%');
  // Kreuz im Kasten wie die App-Taste „Letzten Befehl löschen“: Feld leer machen
  const LEER_ICON = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="8" width="32" height="32" rx="6" fill="#fff" stroke="' + T + '" stroke-width="3.5" stroke-dasharray="6 4"/><path d="M17 17 L31 31 M31 17 L17 31" stroke="#d1335b" stroke-width="5" stroke-linecap="round"/></svg>';

  // ---------------------------------------------------------------------
  // Zustand
  // ---------------------------------------------------------------------
  const istKobold = (lv) => lv.aufgabe === 'kobold';
  function neu(api) {
    const lv = api.lv, z = api.zustand;
    const q = FQ.lies(lv);
    z.q = q;
    z.n = q.n;
    z.start = FQ.kopie(q.zellen);    // so war es am Anfang
    z.zellen = FQ.kopie(q.zellen);   // so ist es jetzt
    z.fest = q.zellen.map((r) => r.map((c) => !!c && !istKobold(lv)));
    z.wahl = null;                   // ausgewähltes Feld [x, y]
    z.markiert = false;              // nach „Los“: Hinweis-Markierung im Brett
    z.fertig = false;
  }
  const schraegeVon = (z, x, y) => {
    if (!z.q.diagonale) return [];
    const a = [];
    if (x === y) a.push(0);
    if (x === z.n - 1 - y) a.push(1);
    return a;
  };
  function geaendert(z) {
    const g = [];
    for (let y = 0; y < z.n; y++) for (let x = 0; x < z.n; x++) if (!FQ.gleich(z.start[y][x], z.zellen[y][x])) g.push([x, y]);
    return g;
  }

  // ---------------------------------------------------------------------
  // Zeichnen
  // ---------------------------------------------------------------------
  function zeichneBrett(api) {
    const z = api.zustand, n = z.n;
    let h = '<div class="formen-brett' + (z.fertig ? ' formen-geschafft' : '') + '" data-n="' + n + '" style="--n:' + n + '">';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      h += '<button class="formen-zelle" data-aktion="zelle" data-umschalter data-id="' + x + '-' + y + '" data-x="' + x + '" data-y="' + y + '" style="grid-column:' + (x + 1) + ';grid-row:' + (y + 1) + '"></button>';
    }
    api.feld.innerHTML = h + '</div>';
    for (const b of api.feld.querySelectorAll('.formen-zelle')) zeichneZelle(api, b);
  }
  function zelleVon(api, x, y) { return api.feld.querySelector('.formen-zelle[data-x="' + x + '"][data-y="' + y + '"]'); }
  function zeichneZelle(api, b) {
    const z = api.zustand;
    const x = +b.dataset.x, y = +b.dataset.y;
    const c = z.zellen[y][x];
    const fest = z.fest[y][x];
    const gewaehlt = !!z.wahl && z.wahl[0] === x && z.wahl[1] === y;
    const anders = istKobold(api.lv) && !FQ.gleich(z.start[y][x], c);
    b.className = 'formen-zelle' + (fest ? ' formen-fest' : ' formen-frei') + (gewaehlt ? ' formen-gewaehlt' : '') + (anders ? ' formen-anders' : '') +
      schraegeVon(z, x, y).map((s) => ' formen-schraege' + s).join('');
    b.dataset.form = c ? c.f : '';
    b.innerHTML = c ? formBild(c.f) : gewaehlt ? '<span class="formen-frage" aria-hidden="true">?</span>' : '';
    const wo = 'Reihe ' + (y + 1) + ', Spalte ' + (x + 1);
    b.setAttribute('aria-label', wo + ': ' + (c ? FQ.INFO[c.f].name : 'leer') + (fest ? ' (vorgegeben)' : ''));
    b.setAttribute('aria-pressed', gewaehlt ? 'true' : 'false');
  }
  function zeichneAlleZellen(api) { for (const b of api.feld.querySelectorAll('.formen-zelle')) zeichneZelle(api, b); }

  function zeichneTasten(api) {
    const z = api.zustand;
    const frei = !!z.wahl && !z.fertig;
    const jetzt = z.wahl ? z.zellen[z.wahl[1]][z.wahl[0]] : null;
    let r = '';
    for (const f of z.q.formen) {
      r += api.taste('form', formBild(f), {
        cls: 'befehl formen-wahl' + (jetzt && jetzt.f === f ? ' formen-an' : ''),
        daten: 'data-form="' + f + '"', label: FQ.INFO[f].name, grau: !frei,
      });
    }
    if (!istKobold(api.lv)) r += api.taste('leeren', LEER_ICON, { cls: 'befehl formen-leeren', label: 'Feld leer machen', grau: !frei || !jetzt });
    api.tasten.innerHTML = '<div class="reihe formen-wahl-reihe">' + r + '</div>' +
      '<div class="reihe">' +
      api.taste('nochmal', '<span>Nochmal</span>', { cls: 'breit', label: istKobold(api.lv) ? 'Nochmal: Kobold-Quadrat wie am Anfang' : 'Nochmal: alle Felder leer' }) +
      api.taste('los', api.ICON.los + '<span>Los</span>', { cls: 'breit los', aus: z.fertig }) +
      '</div>';
  }

  // Hinweis-Markierung nach „Los“ wieder weg (sobald sich etwas ändert)
  function entmarkiere(api) {
    const z = api.zustand;
    if (!z.markiert) return;
    z.markiert = false;
    for (const el of api.feld.querySelectorAll('.formen-band')) el.remove();
    for (const el of api.feld.querySelectorAll('.formen-doppelt, .formen-leer')) el.classList.remove('formen-doppelt', 'formen-leer');
  }
  // Reihe oder Spalte mit einem Rahmen zeigen (Schrägen: nur die Felder)
  function band(api, d) {
    const brett = api.feld.querySelector('.formen-brett');
    if (!brett || (d.art !== 'reihe' && d.art !== 'spalte')) return;
    const el = document.createElement('div');
    el.className = 'formen-band formen-band-' + d.art;
    el.setAttribute('aria-hidden', 'true');
    el.style.gridRow = d.art === 'reihe' ? String(d.nr + 1) : '1 / -1';
    el.style.gridColumn = d.art === 'spalte' ? String(d.nr + 1) : '1 / -1';
    brett.appendChild(el);
  }

  // ---------------------------------------------------------------------
  // Meldungen
  // ---------------------------------------------------------------------
  function vorgaben(z) { let k = 0; for (const r of z.start) for (const c of r) if (c) k++; return k; }
  function erstesVier(api) {
    const i = api.paket.levels.findIndex((l) => l.art === 'formen' && l.n === 4 && !istKobold(l) && !l.diagonale);
    return i === api.nr;
  }
  function grundMeldung(api) {
    const lv = api.lv, z = api.zustand;
    if (istKobold(lv)) return api.meldung('Der Kobold hat eine Form ausgetauscht! Findest du sie?', '', api.sym('kobold'));
    if (api.nr === 0) return api.meldung('Tippe ein leeres Feld an. Dann tippe eine Form an.', '', quadratIcon(true));
    if (z.q.diagonale) return api.meldung('Neu: Die blauen Felder haben jede Form einmal. Die gelben auch!', 'formen-neu', schraegenIcon());
    if (z.n === 4 && erstesVier(api)) return api.meldung('Jetzt mit Stern! Jede Form einmal in jeder Reihe und Spalte.', '', formBild('stern'));
    const k = vorgaben(z);
    if (k <= (z.n === 3 ? 3 : 6)) return api.meldung('Nur ' + k + ' Formen! Schau Reihe und Spalte zusammen an.', '', quadratIcon(true));
    api.meldung('Jede Form genau einmal in jeder Reihe und jeder Spalte!', '', quadratIcon(false));
  }

  // ---------------------------------------------------------------------
  // Antippen
  // ---------------------------------------------------------------------
  function tippeZelle(api, b) {
    const z = api.zustand;
    if (z.fertig) return;
    const x = +b.dataset.x, y = +b.dataset.y;
    if (z.fest[y][x]) {
      if (z.markiert) entmarkiere(api);
      return api.meldung('Diese Form war schon da. Sie bleibt, wie sie ist.', 'hinweis', formBild(z.zellen[y][x].f));
    }
    const alt = z.wahl;
    z.wahl = [x, y];
    if (alt) { const a = zelleVon(api, alt[0], alt[1]); if (a) zeichneZelle(api, a); }
    zeichneZelle(api, b);
    zeichneTasten(api);
    // Ein Hinweis nach „Los“ bleibt stehen (der Rahmen zeigt noch die Reihe), andere Hinweise gehen weg
    if (!z.markiert) grundMeldung(api);
  }

  function setze(api, w) {
    const z = api.zustand;
    if (z.fertig) return;
    if (!z.wahl) {
      return api.meldung(istKobold(api.lv) ? 'Tippe zuerst das Feld an, das du tauschen willst.' : 'Tippe zuerst ein leeres Feld an.', 'hinweis', quadratIcon(true));
    }
    const [x, y] = z.wahl;
    const vorher = z.zellen[y][x];
    if (FQ.gleich(vorher, w)) return;
    z.zellen[y][x] = w;
    let zurueck = null;
    // Kobold: nur ein Feld darf anders sein als am Anfang. Ein zweites? Dann ist das erste wieder wie vorher.
    if (istKobold(api.lv)) {
      for (const [gx, gy] of geaendert(z)) {
        if (gx === x && gy === y) continue;
        z.zellen[gy][gx] = z.start[gy][gx] ? { f: z.start[gy][gx].f, c: z.start[gy][gx].c } : null;
        zurueck = [gx, gy];
      }
    }
    entmarkiere(api);
    zeichneZelle(api, zelleVon(api, x, y));
    if (zurueck) {
      zeichneZelle(api, zelleVon(api, zurueck[0], zurueck[1]));
      api.meldung('Nur ein Feld darf anders sein. Das andere ist wieder wie vorher.', 'hinweis', api.sym('kobold'));
    } else grundMeldung(api);
    zeichneTasten(api);
  }

  // ---------------------------------------------------------------------
  // Los: nur das Ergebnis zählt (WerkstattFormen.bewerte, wie im Löser)
  // ---------------------------------------------------------------------
  function los(api) {
    const z = api.zustand, lv = api.lv;
    if (z.fertig) return;
    entmarkiere(api);
    const e = FQ.bewerte(lv, z.zellen);
    if (e.geschafft) return geschafft(api, e);
    z.markiert = true;
    if (e.grund === 'doppelt') {
      const d = e.doppelt[0];
      band(api, d);
      for (const [x, y] of d.felder) { const b = zelleVon(api, x, y); if (b) b.classList.add('formen-doppelt'); }
      return api.meldung(FQ.fehlerText(d), 'hinweis', formBild(d.f));
    }
    if (e.grund === 'leer') {
      for (const [x, y] of e.leer) { const b = zelleVon(api, x, y); if (b) b.classList.add('formen-leer'); }
      const selbst = geaendert(z).length;
      if (!selbst) return api.meldung('Tippe ein leeres Feld an. Dann tippe eine Form an.', 'hinweis', quadratIcon(true));
      return api.meldung('Keine Form ist doppelt. ' + FQ.bewertungText(e), 'hinweis', quadratIcon(true));
    }
    if (e.grund === 'keinTausch') return api.meldung(FQ.bewertungText(e), 'hinweis', api.sym('kobold'));
    api.meldung(FQ.bewertungText(e), 'hinweis', quadratIcon(false));
  }

  function geschafft(api, e) {
    const z = api.zustand;
    z.fertig = true;
    z.wahl = null;
    zeichneAlleZellen(api);
    const brett = api.feld.querySelector('.formen-brett');
    if (brett) brett.classList.add('formen-geschafft');
    let zusatz = '';
    if (istKobold(api.lv)) {
      for (const [x, y] of e.geaendert) {
        const b = zelleVon(api, x, y);
        if (b) { b.classList.add('formen-kobold'); b.insertAdjacentHTML('beforeend', '<span class="formen-koboldbild" aria-hidden="true">' + api.sym('kobold') + '</span>'); }
      }
      zusatz = 'Du hast den Kobold gefunden!';
    }
    zeichneTasten(api);
    api.meldung('Geschafft!', 'gut', api.sym('stern'));
    api.spaeter(() => api.geschafft({ zusatz }), PAUSE);
  }

  function start(api) {
    neu(api);
    zeichneBrett(api);
    zeichneTasten(api);
    // Ein Doppeltipp auf „Weiter“ oder „Los geht’s“ soll nicht gleich ein Feld im neuen Level treffen
    api.sperren();
  }

  SPIELE.formen = {
    icon() { return quadratIcon(false); },
    start,
    grundMeldung,
    klick(aktion, el, api) {
      if (aktion === 'zelle') return tippeZelle(api, el);
      if (aktion === 'form') return setze(api, { f: el.dataset.form, c: null });
      if (aktion === 'leeren') {
        const z = api.zustand;
        if (z.fertig) return;
        if (!z.wahl) return api.meldung('Tippe zuerst ein Feld an.', 'hinweis', quadratIcon(true));
        if (!z.zellen[z.wahl[1]][z.wahl[0]]) return api.meldung('Das Feld ist schon leer.', 'hinweis', quadratIcon(true));
        return setze(api, null);
      }
    },
    los,
    nochmal(api) {
      neu(api);
      zeichneBrett(api);
      zeichneTasten(api);
      grundMeldung(api);
    },
  };

  // app.js zeichnet die erste Ansicht, bevor die Spiel-Plugins geladen sind (sie stehen in index.html
  // nach app.js). Öffnet man das Paket oder ein Level direkt (QR-Code am Blatt, Neuladen), fehlte sonst
  // das Bild oder das Spiel. Dann einmal neu zeichnen lassen, wie mit einem Tipp auf eine Taste.
  (function neuZeichnen() {
    const app = document.getElementById('app');
    const ans = document.body && document.body.dataset.ansicht;
    const D = window.WERKSTATT_DATEN;
    if (!app || !ans || !D || !D.pakete) return;
    const pakete = D.pakete.filter((p) => p.art === 'formen' || p.levels.some((l) => l.art === 'formen'));
    if (!pakete.length) return;
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    let noetig = false;
    if (ans === 'level') {
      const sp = document.querySelector('.spiel[data-level]');
      noetig = !!sp && !sp.classList.contains('plugin') && pakete.some((p) => p.levels.some((l) => l.id === sp.dataset.level && l.art === 'formen'));
    } else if (ans === 'start' || ans === 'block' || ans === 'paket') {
      noetig = true;
    }
    if (!noetig) return;
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
