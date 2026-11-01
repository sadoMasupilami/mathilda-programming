/* =====================================================================
   Spiel-Plugin „logik“ (Einheit 12, Paket e12 „Logikrätsel“)
   Schnittstelle: Kopf von web/app.js. Gemeinsamer Kern mit Löser und Blättern:
   web/kern/logik.js (Bilder, Sätze mit Bildern, Regeln, pruefeGitter).

   aufgabe "gitter" (Standard): Logikgitter n · n mit Bildern wie am Blatt.
     Feld antippen: leer, dann Kreuz (Nein), dann Kreis (Ja), dann wieder leer.
     Level mit vorgabe: lila Zeichen des Kobolds sind schon gesetzt, eines stimmt nicht.
     „Los“ prüft NUR das Ergebnis mit WerkstattLogik.pruefeGitter: ein Kreis pro Reihe
     und Spalte, jeder Hinweis wahr. Die Kreuze sind nur eine Denkhilfe.
     Freundliche Hinweise: gelb markierte Reihe/Spalte oder Hinweis-Nummer.
   aufgabe "wahrfalsch": Bild mit Tieren (Mütze und Ding) und Sätzen.
     Satz-Taste antippen: wahr, nochmal: falsch, nochmal: wahr …
     „Los“ rechnet jeden Satz mit WerkstattLogik.wert am Bild aus. Die App sagt nur,
     wie viele Sätze noch nicht passen, nicht welche (sonst wäre es nur Raten).
   Keine gespeicherten Lösungen: Die App kennt nur Rätsel und Regeln.
   Ruhig: kein Ton, keine Zeit, kein Blinken. CSS: web/spiele/logik.css (Präfix logik-).
   ===================================================================== */
(function () {
  'use strict';
  const LG = window.WerkstattLogik;
  const SPIELE = (window.WerkstattSpiele = window.WerkstattSpiele || {});
  const T = '#1f2340';
  const LILA = '#b0408c';          // Farbe des Kobolds (wie auf dem Blatt)
  const BLASS = '#b9bdd3';         // Kreuze, die die App nach dem Lösen ergänzt
  const FOLGE = ['', 'nein', 'ja'];
  const NAME = { '': 'leer', nein: 'Kreuz', ja: 'Kreis' };

  // ---------------------------------------------------------------------
  // Kleine Bilder (SVG)
  // ---------------------------------------------------------------------
  function zeichen(wert, farbe) {
    if (!wert) return '';
    return LG.zeichen(wert, farbe || T, wert === 'ja' ? 10 : 11);
  }
  // Daumen: hoch heißt wahr, runter heißt falsch (Daumen-Regel der Einheit)
  function daumen(hoch) {
    const f = hoch ? '#c9ecd5' : '#fcd9b8';
    return '<svg viewBox="0 0 48 48" aria-hidden="true"><g' + (hoch ? '' : ' transform="rotate(180 24 24)"') + '>' +
      '<path d="M11 23 C11 21 12 20 14 20 L17 20 C19 15 21 10 22 6 C23 3 28 3 28 8 L27 19 L37 19 C40 19 42 21 42 24 C42 26 41 27 40 27.5 C42 28.5 42 32 40 33 C42 34 42 37.5 39.5 38.5 C41 39.5 40.5 43 37.5 43 L14 43 C12 43 11 42 11 40 Z" fill="' + f + '" stroke="' + T + '" stroke-width="2.8" stroke-linejoin="round"/>' +
      '<path d="M29 27.5 H39.5 M29 33 H39.5 M29 38.5 H38" fill="none" stroke="' + T + '" stroke-width="2.2" stroke-linecap="round"/>' +
      '</g></svg>';
  }
  // Kleines Gitter ohne Bilder (Meldung): Kreis und Kreuze
  function kleinesGitter() {
    let s = '<svg viewBox="0 0 48 48" aria-hidden="true">';
    [[0, 0, 'ja'], [1, 0, 'nein'], [0, 1, 'nein'], [1, 1, 'ja']].forEach(([i, j, w]) => {
      const x = 3 + i * 22, y = 3 + j * 22, m = x + 10, n = y + 10;
      s += '<rect x="' + x + '" y="' + y + '" width="20" height="20" rx="4" fill="' + (w === 'ja' ? '#fff4cc' : '#ffffff') + '" stroke="' + T + '" stroke-width="2.4"/>';
      s += w === 'ja'
        ? '<circle cx="' + m + '" cy="' + n + '" r="5.5" fill="none" stroke="' + T + '" stroke-width="2.6"/>'
        : '<path d="M' + (m - 4.5) + ' ' + (n - 4.5) + ' L' + (m + 4.5) + ' ' + (n + 4.5) + ' M' + (m + 4.5) + ' ' + (n - 4.5) + ' L' + (m - 4.5) + ' ' + (n + 4.5) + '" stroke="' + T + '" stroke-width="2.6" stroke-linecap="round"/>';
    });
    return s + '</svg>';
  }
  // Mini-Gitter für Kachel, Paket-Seite und Meldung
  function gitterIcon() {
    const tiere = ['drache', 'katze', 'eule'], dinge = ['apfel', 'eis', 'fisch'];
    const ja = { 0: 1, 1: 2, 2: 0 };
    const k = 22, c = 26;
    let s = '<svg class="logik-icon" viewBox="0 0 100 100" aria-hidden="true">';
    s += '<rect x="1" y="1" width="98" height="98" rx="10" fill="#ffffff"/>';
    s += '<rect x="1" y="' + (k + 1) + '" width="' + (k - 1) + '" height="' + (3 * c - 2) + '" rx="4" fill="#fff0e3"/>';
    s += '<rect x="' + (k + 1) + '" y="1" width="' + (3 * c - 2) + '" height="' + (k - 1) + '" rx="4" fill="#fff0e3"/>';
    for (let i = 0; i < 3; i++) {
      s += '<g transform="translate(' + (k + i * c + 4) + ' 2) scale(0.19)">' + LG.BILDER[dinge[i]].svg + '</g>';
      s += '<g transform="translate(2 ' + (k + i * c + 4) + ') scale(0.19)">' + LG.BILDER[tiere[i]].svg + '</g>';
      for (let j = 0; j < 3; j++) {
        const x = k + j * c, y = k + i * c;
        s += '<rect x="' + (x + 1.5) + '" y="' + (y + 1.5) + '" width="' + (c - 3) + '" height="' + (c - 3) + '" rx="4" fill="' + (ja[i] === j ? '#fff4cc' : '#ffffff') + '" stroke="' + T + '" stroke-width="2.4"/>';
        const m = x + c / 2, n = y + c / 2;
        s += ja[i] === j
          ? '<circle cx="' + m + '" cy="' + n + '" r="7" fill="none" stroke="' + T + '" stroke-width="3.2"/>'
          : '<path d="M' + (m - 5.5) + ' ' + (n - 5.5) + ' L' + (m + 5.5) + ' ' + (n + 5.5) + ' M' + (m + 5.5) + ' ' + (n - 5.5) + ' L' + (m - 5.5) + ' ' + (n + 5.5) + '" stroke="' + T + '" stroke-width="3.2" stroke-linecap="round"/>';
      }
    }
    return s + '</svg>';
  }

  // Satz mit kleinen Bildern: "Der {drache} mag kein {eis}."
  function satzHTML(api, text, woerter) {
    return LG.satz(text, woerter).map((t) => {
      if (t.text !== undefined) return api.esc(t.text);
      if (!t.bild) return api.esc(t.wort);
      return '<span class="logik-w">' + LG.bild(t.name, '1.4em') + api.esc(t.wort) + '</span>';
    }).join('');
  }
  const istWF = (lv) => lv.aufgabe === 'wahrfalsch';
  const schluessel = (a, x) => a + '|' + x;

  // ---------------------------------------------------------------------
  // Logikgitter
  // ---------------------------------------------------------------------
  function kopf(api, name, art) {
    const lv = api.lv;
    const w = art === 'spalte' ? LG.kurz(name, lv.woerter) : LG.wort(name, lv.woerter);
    return '<div class="logik-kopf logik-' + art + '" data-' + (art === 'spalte' ? 's' : 'z') + '="' + api.esc(name) + '">' +
      (LG.hat(name) ? '<span class="logik-kbild">' + LG.bild(name, '100%') + '</span>' : '') +
      '<span class="logik-kwort">' + api.esc(w) + '</span></div>';
  }

  function startGitter(api) {
    const lv = api.lv, z = api.zustand;
    const n = lv.zeilen.length;
    z.wert = {};
    z.lila = {};
    const v = lv.vorgabe || {};
    for (const art of ['ja', 'nein']) {
      for (const [a, x] of v[art] || []) { z.wert[schluessel(a, x)] = art; z.lila[schluessel(a, x)] = true; }
    }
    z.geprueft = false;
    z.fertig = false;

    let h = '<div class="logik-gitter" data-n="' + n + '" style="--n:' + n + '">';
    h += '<div class="logik-ecke" aria-hidden="true"><span>' + zeichen('ja') + 'Ja</span><span>' + zeichen('nein') + 'Nein</span></div>';
    for (const x of lv.spalten) h += kopf(api, x, 'spalte');
    lv.zeilen.forEach((a, i) => {
      h += kopf(api, a, 'zeile');
      lv.spalten.forEach((x, j) => {
        h += '<button class="logik-zelle" data-aktion="zelle" data-umschalter data-id="' + i + '-' + j + '" data-z="' + api.esc(a) + '" data-s="' + api.esc(x) + '"></button>';
      });
    });
    api.feld.innerHTML = h + '</div>';
    api.programm.innerHTML = '<ol class="logik-hinweise" data-anzahl="' + lv.hinweise.length + '">' + lv.hinweise.map((hw, i) =>
      '<li data-h="' + i + '"><span class="logik-nr">' + (i + 1) + '</span><span class="logik-satz">' + satzHTML(api, hw.text, lv.woerter) + '</span></li>').join('') + '</ol>';
    tastenUnten(api);
    for (const b of api.feld.querySelectorAll('.logik-zelle')) zeichneZelle(api, b);
  }

  function zeichneZelle(api, b) {
    const z = api.zustand;
    const k = schluessel(b.dataset.z, b.dataset.s);
    const w = z.wert[k] || '';
    b.dataset.wert = w;
    b.classList.toggle('logik-lila', !!z.lila[k]);
    b.innerHTML = zeichen(w, z.lila[k] ? LILA : T);
    b.setAttribute('aria-label', LG.wort(b.dataset.z, api.lv.woerter) + ' und ' + LG.wort(b.dataset.s, api.lv.woerter) + ': ' + NAME[w]);
  }

  function entmarkiere(api, auchHinweise) {
    for (const el of api.feld.querySelectorAll('.logik-markiert')) el.classList.remove('logik-markiert');
    if (auchHinweise) for (const el of api.programm.querySelectorAll('.logik-markiert')) el.classList.remove('logik-markiert');
  }
  // Reihe (Tier) oder Spalte (Ding) gelb markieren: Kopf und alle Felder
  function markiere(api, name, art) {
    const sel = art === 'zeile' ? '[data-z="' + name + '"]' : '[data-s="' + name + '"]';
    for (const el of api.feld.querySelectorAll('.logik-kopf' + sel + ', .logik-zelle' + sel)) el.classList.add('logik-markiert');
  }

  function tippeZelle(api, b) {
    const z = api.zustand;
    if (z.fertig) return;
    const k = schluessel(b.dataset.z, b.dataset.s);
    z.wert[k] = FOLGE[(FOLGE.indexOf(z.wert[k] || '') + 1) % FOLGE.length];
    delete z.lila[k];
    if (z.geprueft) { entmarkiere(api, false); z.geprueft = false; }
    zeichneZelle(api, b);
  }

  // Welcher Hinweis ist überflüssig? (nur für die Profi-Frage, mit dem Kern ausgerechnet)
  function hatUeberfluessige(lv) {
    if (lv.hinweise.length < 2) return false;
    return lv.hinweise.some((h, i) => LG.loese(lv, { ohne: [i], max: 2 }).anzahl === 1);
  }

  function losGitter(api) {
    const lv = api.lv, z = api.zustand;
    if (z.fertig) return;
    entmarkiere(api, true);
    const ja = Object.keys(z.wert).filter((k) => z.wert[k] === 'ja').map((k) => k.split('|'));
    if (!ja.length) {
      z.geprueft = true;
      return api.meldung('Noch kein Kreis da. Tippe ein Feld zweimal an.', 'hinweis', zeichen('ja'));
    }
    const e = LG.pruefeGitter(lv, ja);
    z.geprueft = true;
    if (e.ok) return geschafftGitter(api, ja);
    const reihe = e.doppelt.find((d) => lv.zeilen.includes(d));
    const spalte = e.doppelt.find((d) => lv.spalten.includes(d));
    if (reihe) {
      markiere(api, reihe, 'zeile');
      return api.meldung('Zwei Kreise in einer Reihe? In jede Reihe kommt nur ein Kreis.', 'hinweis', zeichen('ja'));
    }
    if (spalte) {
      markiere(api, spalte, 'spalte');
      return api.meldung('Zwei Kreise in einer Spalte? In jede Spalte kommt nur ein Kreis.', 'hinweis', zeichen('ja'));
    }
    if (e.ohneJa.length) {
      for (const a of e.ohneJa) markiere(api, a, 'zeile');
      return api.meldung(e.ohneJa.length === 1 ? 'In der gelben Reihe fehlt noch ein Kreis.' : 'In den gelben Reihen fehlt noch ein Kreis.', 'hinweis', zeichen('ja'));
    }
    for (const i of e.verletzt) {
      const li = api.programm.querySelector('[data-h="' + i + '"]');
      if (li) li.classList.add('logik-markiert');
    }
    const nr = e.verletzt.map((i) => i + 1);
    const text = nr.length === 1
      ? 'Hinweis ' + nr[0] + ' passt noch nicht. Lies ihn nochmal genau!'
      : 'Hinweis ' + nr.slice(0, -1).join(', ') + ' und ' + nr[nr.length - 1] + ' passen noch nicht.';
    api.meldung(text, 'hinweis', kleinesGitter());
  }

  function geschafftGitter(api, ja) {
    const lv = api.lv, z = api.zustand;
    z.fertig = true;
    const zu = {};
    for (const [a, x] of ja) zu[a] = x;
    // Leere Felder bekommen blasse Kreuze: So sieht das fertige Gitter aus wie am Papier
    for (const b of api.feld.querySelectorAll('.logik-zelle')) {
      if (!b.dataset.wert) { b.innerHTML = zeichen('nein', BLASS); b.classList.add('logik-auto'); }
    }
    // Kobold-Level: das lila Zeichen, das nicht zum Ergebnis passt, bekommt den Kobold
    let zusatz = '';
    const v = lv.vorgabe;
    if (v) {
      const falsch = [];
      for (const [a, x] of v.ja || []) if (zu[a] !== x) falsch.push([a, x]);
      for (const [a, x] of v.nein || []) if (zu[a] === x) falsch.push([a, x]);
      for (const [a, x] of falsch) {
        const b = api.feld.querySelector('.logik-zelle[data-z="' + a + '"][data-s="' + x + '"]');
        if (b) { b.classList.add('logik-kobold'); b.insertAdjacentHTML('beforeend', '<span class="logik-koboldbild">' + api.sym('kobold') + '</span>'); }
      }
      if (falsch.length) zusatz = 'Du hast das lila Zeichen vom Kobold gefunden!';
    }
    if (!zusatz && hatUeberfluessige(lv)) zusatz = 'Profi-Frage: Welchen Hinweis hast du nie gebraucht?';
    api.geschafft({ zusatz });
  }

  // ---------------------------------------------------------------------
  // Wahr oder falsch?
  // ---------------------------------------------------------------------
  function wfTaste(api, i) {
    const w = api.zustand.antwort[i];
    const inhalt = w ? daumen(w === 'wahr') + '<span>' + w + '</span>' : '<span class="logik-offen">?</span>';
    return api.taste('wf', inhalt, {
      cls: 'logik-wf' + (w ? ' logik-' + w : ''),
      daten: 'data-umschalter data-id="wf-' + i + '" data-i="' + i + '" data-wert="' + w + '"',
      label: 'Satz ' + (i + 1) + ': ' + (w || 'noch offen'),
    });
  }

  function startWF(api) {
    const lv = api.lv, z = api.zustand;
    z.antwort = lv.aussagen.map(() => '');
    z.geprueft = false;
    z.fertig = false;
    api.feld.innerHTML = '<div class="logik-szene" data-n="' + lv.szene.length + '">' + lv.szene.map((t) =>
      '<div class="logik-figur"><span class="logik-fbild">' + LG.szeneBild(t.tier, t.hat, '100%') + '</span>' +
      '<span class="logik-fname">' + api.esc(LG.wort(t.tier, lv.woerter)) + '</span></div>').join('') + '</div>';
    api.programm.innerHTML = '<ol class="logik-saetze" data-anzahl="' + lv.aussagen.length + '">' + lv.aussagen.map((a, i) =>
      '<li data-h="' + i + '"><span class="logik-nr">' + (i + 1) + '</span><span class="logik-satz">' + satzHTML(api, a.text, lv.woerter) + '</span>' +
      wfTaste(api, i) + '</li>').join('') + '</ol>';
    tastenUnten(api);
  }

  function tippeWF(api, b) {
    const z = api.zustand;
    if (z.fertig) return;
    const i = parseInt(b.dataset.i, 10);
    z.antwort[i] = z.antwort[i] === 'wahr' ? 'falsch' : 'wahr';
    if (z.geprueft) { entmarkiere(api, true); z.geprueft = false; }
    b.outerHTML = wfTaste(api, i);
  }

  function losWF(api) {
    const lv = api.lv, z = api.zustand;
    if (z.fertig) return;
    entmarkiere(api, true);
    z.geprueft = true;
    const offen = z.antwort.findIndex((a) => !a);
    if (offen >= 0) {
      const li = api.programm.querySelector('[data-h="' + offen + '"]');
      if (li) li.classList.add('logik-markiert');
      return api.meldung('Bei Satz ' + (offen + 1) + ' fehlt noch wahr oder falsch.', 'hinweis', daumen(true));
    }
    const hatFn = LG.szeneHat(lv.szene);
    const daneben = lv.aussagen.filter((a, i) => (z.antwort[i] === 'wahr') !== LG.wert(LG.liesRegel(a.regel), hatFn)).length;
    if (!daneben) {
      z.fertig = true;
      return api.geschafft({});
    }
    api.meldung((daneben === 1 ? 'Ein Satz passt' : daneben + ' Sätze passen') + ' noch nicht. Zeig es mit den Daumen!', 'hinweis', daumen(true));
  }

  // ---------------------------------------------------------------------
  // Gemeinsam
  // ---------------------------------------------------------------------
  function tastenUnten(api) {
    api.tasten.innerHTML = '<div class="reihe">' +
      api.taste('nochmal', '<span>Nochmal</span>', { cls: 'breit', label: 'Nochmal: alles leer' }) +
      api.taste('los', api.ICON.los + '<span>Los</span>', { cls: 'breit los' }) +
      '</div>';
  }

  function grundMeldung(api) {
    const lv = api.lv;
    if (istWF(lv)) return api.meldung('Schau das Bild an. Ist der Satz wahr oder falsch?', '', daumen(true));
    if (lv.vorgabe) return api.meldung('Ein lila Zeichen vom Kobold stimmt nicht! Welches?', '', api.sym('kobold'));
    if (api.nr === 0) return api.meldung('Feld antippen: Kreuz. Nochmal: Kreis. Dann „Los“!', '', kleinesGitter());
    if (hatUeberfluessige(lv)) return api.meldung('Profi: Ein Hinweis ist überflüssig. Welcher?', '', kleinesGitter());
    if (lv.hinweise.some((h) => h.regel.includes('|'))) return api.meldung('Bei „oder“ reicht ein Daumen oben.', '', daumen(true));
    if (lv.zeilen.length >= 4) return api.meldung('Das Profi-Gitter! Lies jeden Hinweis genau.', '', kleinesGitter());
    const muetzen = lv.spalten.every((x) => LG.hat(x) && LG.BILDER[x].istMuetze);
    api.meldung(muetzen ? 'Wer hat welche Mütze? Lies die Hinweise.' : 'Wer mag was? Lies die Hinweise.', '', kleinesGitter());
  }

  SPIELE.logik = {
    icon() { return gitterIcon(); },
    start(api) {
      const sp = api.feld.closest('.spiel');
      if (sp) sp.dataset.logik = istWF(api.lv) ? 'wahrfalsch' : 'gitter';
      if (istWF(api.lv)) startWF(api);
      else startGitter(api);
    },
    grundMeldung,
    klick(aktion, el, api) {
      if (aktion === 'zelle') return tippeZelle(api, el);
      if (aktion === 'wf') return tippeWF(api, el);
    },
    los(api) {
      if (istWF(api.lv)) return losWF(api);
      return losGitter(api);
    },
  };

  // Die Spiel-Skripte stehen in index.html hinter app.js. Öffnet jemand ein Level direkt (Link, neu laden,
  // Safari holt die Seite zurück), hat app.js die erste Ansicht schon ohne dieses Plugin gezeichnet:
  // dann einmal neu zeichnen (Hash kurz wechseln, ohne Eintrag im Verlauf, und hashchange melden).
  // Lädt index.html die Spiele einmal vor app.js, tut dieser Teil nichts mehr.
  (function neuZeichnen() {
    const ansicht = document.body && document.body.dataset.ansicht;
    const D = window.WERKSTATT_DATEN;
    if (!ansicht || !D || !D.pakete) return;
    const pakete = D.pakete.filter((p) => p.levels.some((l) => l.art === 'logik'));
    if (!pakete.length) return;
    let noetig = false;
    if (ansicht === 'level') {
      const sp = document.querySelector('.spiel[data-level]');
      noetig = !!sp && !sp.classList.contains('plugin') && pakete.some((p) => p.levels.some((l) => l.id === sp.dataset.level && l.art === 'logik'));
    } else if (ansicht === 'paket' || ansicht === 'start' || ansicht === 'block') {
      noetig = pakete.some((p) => document.querySelector('[data-paket="' + p.paket + '"]') || location.hash === '#' + p.paket);
    }
    if (!noetig) return;
    try {
      const url = location.href;
      history.replaceState(history.state, '', url.split('#')[0] + '#logik-neu');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      history.replaceState(history.state, '', url);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } catch (e) { /* dann bleibt die Ansicht, ein Tipp auf „Heim“ hilft */ }
  })();
})();
