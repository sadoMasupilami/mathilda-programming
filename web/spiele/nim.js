/* =====================================================================
   Spiel-Plugin „nim“ (Einheit 15, Paket e15 „Gewinnen mit Plan“)
   Schnittstelle: Kopf von web/app.js. Gemeinsamer Kern mit Löser und Blättern:
   web/kern/nim.js (Spiel lesen, erlaubte Züge, Ende, Sieger, Roboter, Bilder).

   Strategiespiel gegen den Roboter. In jedem Level kann das Kind mit der
   Gewinn-Strategie sicher gewinnen (vom Löser per Spielbaum geprüft), der
   Roboter spielt gut (WerkstattNim.roboterZug: jeder Gewinnzug, den er bekommt).

   Bedienung (nur Antippen, kein Ziehen):
     Steine-Spiel: Steine antippen (gelber Ring) oder unten „1“, „2“ (, „3“) antippen,
       dann die grüne Taste „Nehmen“. Bei zwei Haufen: Steine aus EINEM Haufen antippen.
     Wer sagt 20?: Unten antippen, was du sagst („5“ oder „5, 6“), dann „Los“:
       Der Drache hüpft Feld für Feld auf dem Zahlen-Weg weiter.
     Der Roboter „überlegt“ kurz, zeigt seine Steine (blauer Ring) und nimmt sie weg.
   Bewertet wird NUR das Ergebnis mit dem Kern: Wer den letzten Stein nimmt (bzw. die
     Zielzahl sagt), gewinnt (beim Kobold-Stein: verliert). Gewinnt das Kind: Stern.
     Gewinnt der Roboter: freundlich „Nochmal?“ und der Tipp des Levels, kein Fehlerton.
   Die App kennt keine Lösung (keine Gewinnzüge, keine Gewinnzahlen in den Daten).
   Ruhig: kein Ton, keine Zeitgrenze, kein Blinken. CSS: web/spiele/nim.css (Präfix nim-).
   ===================================================================== */
(function () {
  'use strict';
  const N = window.WerkstattNim;
  const SPIELE = (window.WerkstattSpiele = window.WerkstattSpiele || {});
  const T = '#1f2340';
  const ROBO = '#2b6fd6';
  const FARBE_DU = '#ffe7a3';       // Zahlen-Weg: Zahlen, die du gesagt hast
  const FARBE_ROBO = '#d6e3fb';     // … die der Roboter gesagt hat
  const PAUSE = 450;                // ms zwischen goldenem Tisch und Geschafft-Fenster
  const PRO_REIHE = 5;              // Steine pro Reihe (wie am Blatt)

  // ---------------------------------------------------------------------
  // Bilder (eigene SVG, keine Schriftzeichen)
  // ---------------------------------------------------------------------
  const ROBOTER = '<svg class="nim-bild" viewBox="0 0 48 48" aria-hidden="true">' +
    '<path d="M24 11 V6" stroke="' + T + '" stroke-width="2.6" stroke-linecap="round"/>' +
    '<circle cx="24" cy="5.2" r="3.2" fill="#f2b705" stroke="' + T + '" stroke-width="2"/>' +
    '<rect x="4.5" y="18" width="5.5" height="11" rx="2.2" fill="#9db8ef" stroke="' + T + '" stroke-width="2"/>' +
    '<rect x="38" y="18" width="5.5" height="11" rx="2.2" fill="#9db8ef" stroke="' + T + '" stroke-width="2"/>' +
    '<rect x="15" y="36" width="18" height="10" rx="3" fill="#9db8ef" stroke="' + T + '" stroke-width="2.2"/>' +
    '<rect x="9" y="11" width="30" height="26" rx="7.5" fill="#dbe6fb" stroke="' + T + '" stroke-width="2.6"/>' +
    '<circle cx="18" cy="21.5" r="4.4" fill="#fff" stroke="' + T + '" stroke-width="2"/><circle cx="18" cy="21.5" r="2.1" fill="' + ROBO + '"/>' +
    '<circle cx="30" cy="21.5" r="4.4" fill="#fff" stroke="' + T + '" stroke-width="2"/><circle cx="30" cy="21.5" r="2.1" fill="' + ROBO + '"/>' +
    '<path d="M17.5 29.5 Q24 34.5 30.5 29.5" fill="none" stroke="' + T + '" stroke-width="2.4" stroke-linecap="round"/>' +
    '</svg>';
  const DU = '<svg class="nim-bild" viewBox="0 0 48 48" aria-hidden="true">' +
    '<circle cx="8.5" cy="22" r="5.6" fill="#a8693a" stroke="' + T + '" stroke-width="2"/>' +
    '<circle cx="39.5" cy="22" r="5.6" fill="#a8693a" stroke="' + T + '" stroke-width="2"/>' +
    '<circle cx="24" cy="26" r="15" fill="#ffdcb8" stroke="' + T + '" stroke-width="2.6"/>' +
    '<path d="M9.6 23 C10 13 16.5 9.5 24 9.5 C31.5 9.5 38 13 38.4 23 C33.5 18 29 16.6 24 17 C19 16.6 14.5 18 9.6 23 Z" fill="#a8693a" stroke="' + T + '" stroke-width="2.2" stroke-linejoin="round"/>' +
    '<circle cx="18.5" cy="26" r="2.1" fill="' + T + '"/><circle cx="29.5" cy="26" r="2.1" fill="' + T + '"/>' +
    '<circle cx="14.8" cy="31" r="2.6" fill="#f7a6c6" opacity="0.85"/><circle cx="33.2" cy="31" r="2.6" fill="#f7a6c6" opacity="0.85"/>' +
    '<path d="M19 32 Q24 37 29 32" fill="none" stroke="' + T + '" stroke-width="2.3" stroke-linecap="round"/>' +
    '</svg>';
  const TIPP = '<svg class="nim-bild" viewBox="0 0 48 48" aria-hidden="true">' +
    '<path d="M24 5 C14.5 5 9.5 12 9.5 18.5 C9.5 25 14.5 28 16.5 33 L31.5 33 C33.5 28 38.5 25 38.5 18.5 C38.5 12 33.5 5 24 5 Z" fill="#fff4cc" stroke="' + T + '" stroke-width="2.6" stroke-linejoin="round"/>' +
    '<path d="M19.5 22 L22 26 L24 21 L26 26 L28.5 22" fill="none" stroke="#e0a000" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M17.5 37.5 H30.5 M19 42.5 H29" stroke="' + T + '" stroke-width="2.8" stroke-linecap="round"/>' +
    '</svg>';
  const steinBild = (nr) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + N.stein(12, 12, 22.6, nr) + '</svg>';
  function miniSteine(k) {
    let s = '';
    for (let i = 0; i < k; i++) s += N.stein(6 + i * 12, 6, 10.6, i * 2);
    return '<svg class="nim-mini" viewBox="0 0 ' + (k * 12) + ' 12" style="--k:' + k + '" aria-hidden="true">' + s + '</svg>';
  }

  // ---------------------------------------------------------------------
  // Texte (kurz, Kinderwörter)
  // ---------------------------------------------------------------------
  const zahlen = (s, k) => { const a = []; for (let i = 1; i <= k; i++) a.push(s + i); return a.join(', '); };
  const steineWort = (k) => k + (k === 1 ? ' Stein' : ' Steine');
  function regelText(v) {
    if (v.form === 'zaehlen') return 'Sag ' + N.nehmenText(v) + ' Zahlen weiter. Wer ' + v.bis + ' sagt, gewinnt!';
    const ende = v.letzter === 'verliert' ? 'verliert!' : 'gewinnt!';
    if (v.nehmen === 'beliebig') return 'Nimm aus einem Haufen, so viele du willst. Wer den letzten nimmt, ' + ende;
    return 'Nimm ' + N.nehmenText(v) + ' Steine. Wer den letzten nimmt, ' + ende;
  }
  // „Neu:“, wenn das Level davor ein anderes Spiel war
  function neuesSpiel(api) {
    const vor = api.nr > 0 ? api.paket.levels[api.nr - 1] : null;
    if (!vor || vor.art !== 'nim') return false;
    try { return N.lies(vor.spiel).text !== api.zustand.v.text; } catch (e) { return false; }
  }
  function regelBild(api, v) {
    if (v.form === 'zaehlen') return api.sym('drache');
    if (v.letzter === 'verliert') return api.sym('kobold');
    return N.iconSVG();
  }
  function siegText(v) {
    if (v.form === 'zaehlen') return 'Du hast ' + v.bis + ' gesagt!';
    if (v.letzter === 'verliert') return 'Der Roboter musste den letzten Stein nehmen!';
    return 'Du hast den letzten Stein genommen!';
  }
  function erlaubtText(v) {
    return v.nehmen === 'beliebig' ? 'Nimm nur aus einem Haufen.' : 'Du darfst nur ' + N.nehmenText(v) + ' Steine nehmen.';
  }

  // ---------------------------------------------------------------------
  // Zustand
  // ---------------------------------------------------------------------
  let aktiv = null;   // api des offenen Levels (für das Neu-Zeichnen beim Drehen)
  const stand = (z) => N.standVon(z.v, z.h);
  function neu(api) {
    const lv = api.lv, z = api.zustand;
    z.v = N.lies(lv.spiel);
    z.zaehlen = z.v.form === 'zaehlen';
    z.h = z.zaehlen ? [z.v.bis - (lv.stand || 0)] : lv.haufen.slice();
    // Steine mit festem Platz (so verschwindet genau der Stein, den man antippt); weg: '', 'du', 'roboter'
    z.steine = z.zaehlen ? [] : z.h.map((n, i) => Array.from({ length: n }, (x, p) => ({ farbe: p + i * 3, weg: '' })));
    z.gesagt = {};          // Wer sagt …?: zu jeder gesagten Zahl, wer sie gesagt hat
    z.wahl = [];            // ausgewählte Steine [{ h, p }] (immer aus einem Haufen)
    z.sag = 0;              // Wer sagt …?: so viele Zahlen sagst du
    z.roboWahl = [];        // die Steine, die der Roboter gleich nimmt
    z.roboSag = 0;
    z.roboLetzt = null;     // letzter Zug des Roboters (für „Jetzt du!“)
    z.phase = lv.dran === 'andere' ? 'roboter' : 'du';   // du | roboter | gewonnen | verloren
    z.laeuft = false;       // der Drache hüpft gerade
    z.pro = 0;              // Wer sagt …?: Felder pro Reihe am Zahlen-Weg (beim ersten Zeichnen)
    z.zugNr = 0;            // Züge bisher (in data-id der Tasten: der Doppeltipp-Schutz gilt nur innerhalb eines Zuges)
  }
  // Die letzten k Steine eines Haufens, die noch liegen
  function letzte(z, hi, k) {
    const a = [];
    const liste = z.steine[hi];
    for (let p = liste.length - 1; p >= 0 && a.length < k; p--) if (!liste[p].weg) a.push({ h: hi, p });
    return a;
  }
  const gewaehlt = (liste, hi, p) => liste.some((w) => w.h === hi && w.p === p);

  // ---------------------------------------------------------------------
  // Zeichnen: Feld (Tisch mit Steinen oder Zahlen-Weg), Spieler, Tasten
  // ---------------------------------------------------------------------
  function zeichneFeld(api) {
    const z = api.zustand;
    if (z.zaehlen) return zeichneWeg(api);
    const sp = Math.max(...z.steine.map((l) => Math.min(PRO_REIHE, l.length)));
    const ze = z.steine.reduce((a, l) => a + Math.ceil(l.length / PRO_REIHE), 0);
    const kann = z.phase === 'du';
    let h = '<div class="nim-tisch' + (z.phase === 'gewonnen' ? ' nim-geschafft' : '') + (z.steine.length > 1 ? ' nim-zwei' : '') +
      '" data-phase="' + z.phase + '" data-haufen="' + z.h.join(',') + '" data-zug="' + z.zugNr + '" style="--sp:' + sp + ';--ze:' + ze + ';--tp:' + z.steine.length + '">';
    z.steine.forEach((liste, i) => {
      h += '<div class="nim-teller' + (z.wahl.length && z.wahl[0].h === i ? ' nim-teller-an' : '') + '" data-h="' + i + '" style="--spt:' + Math.min(PRO_REIHE, liste.length) + '">' +
        '<span class="nim-zahl" aria-label="Noch ' + steineWort(z.h[i]) + '">' + z.h[i] + '</span>';
      liste.forEach((s, p) => {
        if (s.weg) { h += '<span class="nim-loch nim-loch-' + s.weg + '" aria-hidden="true"></span>'; return; }
        const an = gewaehlt(z.wahl, i, p), robo = gewaehlt(z.roboWahl, i, p);
        h += '<button class="nim-stein' + (an ? ' nim-gewaehlt' : '') + (robo ? ' nim-robo' : '') + '" data-aktion="stein" data-umschalter data-id="' + i + '-' + p + '"' +
          ' data-h="' + i + '" data-p="' + p + '" aria-label="Stein" aria-pressed="' + (an ? 'true' : 'false') + '"' + (kann ? '' : ' disabled') + '>' +
          steinBild(s.farbe) + '</button>';
      });
      h += '</div>';
    });
    api.feld.innerHTML = h + '</div>';
  }
  // Zahlen-Weg wie auf dem Blatt (Schlange, Drache, Schatz). Pro Reihe so viele Felder, dass sie am größten sind.
  function proReihe(api, n) {
    const r = api.feld.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0)) return 7;
    let best = 7, bestF = 0;
    for (let pro = 4; pro <= 11; pro++) {
      const ze = Math.ceil(n / pro);
      // 7 pro Reihe wie am Blatt, wenn es nicht viel kleiner wird
      const F = Math.min(r.width / pro, r.height / (ze + (ze - 1) * 0.32)) * (pro === 7 ? 1.2 : 1);
      if (F > bestF) { bestF = F; best = pro; }
    }
    return best;
  }
  function zeichneWeg(api) {
    const z = api.zustand, v = z.v, s = stand(z);
    // einmal pro Spiel (und beim Drehen) festlegen: der Weg springt nicht zwischen den Zügen
    if (!z.pro) z.pro = proReihe(api, v.bis + 1);
    const fuellung = {};
    for (const k of Object.keys(z.gesagt)) fuellung[k] = z.gesagt[k] === 'du' ? FARBE_DU : FARBE_ROBO;
    const vorschau = [];
    const k = z.sag || z.roboSag;
    for (let i = 1; i <= k; i++) vorschau.push(s + i);
    const svg = N.wegSVG(v.bis, {
      feld: 22, proReihe: z.pro, drache: s, masse: false, fuellung,
      markiert: vorschau, ringFarbe: z.roboSag ? ROBO : '#e0a000',
    });
    api.feld.innerHTML = '<div class="nim-weg' + (z.phase === 'gewonnen' ? ' nim-geschafft' : '') + '" data-phase="' + (z.laeuft ? 'laeuft' : z.phase) + '" data-stand="' + s +
      '" data-haufen="' + z.h.join(',') + '" data-zug="' + z.zugNr + '">' + svg + '</div>';
  }

  function zeichneSpieler(api) {
    const z = api.zustand;
    if (z.phase === 'verloren') {
      api.programm.innerHTML = '<div class="nim-tipp"><span class="nim-tipp-bild">' + TIPP + '</span>' +
        '<p><b>Tipp:</b> ' + api.esc(api.lv.tipp || 'Denk an die Gewinnzahlen.') + '</p></div>';
      return;
    }
    const wer = (k, bild, name) => '<div class="nim-wer nim-wer-' + k + (z.phase === (k === 'du' ? 'du' : 'roboter') ? ' nim-dran' : '') +
      (z.phase === 'gewonnen' && k === 'du' ? ' nim-sieger' : '') + '"><span class="nim-gesicht">' + bild + '</span><span class="nim-name">' + name + '</span></div>';
    api.programm.innerHTML = '<div class="nim-spieler" aria-label="' + (z.phase === 'roboter' ? 'Der Roboter ist dran' : 'Du bist dran') + '">' +
      wer('du', DU, 'Du') + wer('rob', ROBOTER, 'Roboter') + '</div>';
  }

  function zeichneTasten(api) {
    const z = api.zustand, v = z.v;
    if (z.phase === 'verloren') {
      api.tasten.innerHTML = '<div class="reihe">' +
        api.taste('nochmal', api.ICON.los + '<span>Nochmal</span>', { cls: 'breit los gross nim-nochmal', label: 'Nochmal von vorne' }) + '</div>';
      api.belegung(api.tasten);
      return;
    }
    const kann = z.phase === 'du' && !z.laeuft;
    let r = '';
    if (z.zaehlen) {
      const s = stand(z);
      for (const k of v.nehmen) {
        if (s + k > v.bis) continue;
        r += api.taste('sag', '<span>' + zahlen(s, k) + '</span>', {
          cls: 'nim-sag' + (z.sag === k ? ' nim-gewaehlt' : ''), daten: 'data-n="' + k + '" data-id="s' + k + '-' + z.zugNr + '" data-umschalter',
          label: 'Ich sage ' + zahlen(s, k), aus: !kann,
        });
      }
    } else if (z.steine.length === 1) {
      for (const k of v.nehmen) {
        r += api.taste('anzahl', '<span class="nim-n">' + k + '</span>' + miniSteine(k), {
          cls: 'nim-anzahl' + (kann && z.wahl.length === k ? ' nim-gewaehlt' : ''), daten: 'data-n="' + k + '" data-id="n' + k + '-' + z.zugNr + '" data-umschalter',
          label: 'Ich nehme ' + steineWort(k), aus: !kann, grau: kann && k > z.h[0],
        });
      }
    }
    const nichts = z.zaehlen ? !z.sag : !z.wahl.length;
    api.tasten.innerHTML = (r ? '<div class="reihe nim-wahl">' + r + '</div>' : '') +
      '<div class="reihe">' +
      api.taste('nochmal', '<span>Nochmal</span>', { cls: 'breit', label: 'Nochmal von vorne' }) +
      api.taste('los', api.ICON.los + '<span>' + (z.zaehlen ? 'Los' : 'Nehmen') + '</span>', { cls: 'breit los nim-los', aus: !kann, grau: kann && nichts }) +
      '</div>';
    api.belegung(api.tasten);
  }
  // Feld zuletzt: dann haben Spieler und Tasten schon ihre Höhe, und der Zahlen-Weg wird richtig groß
  function zeichne(api) { zeichneSpieler(api); zeichneTasten(api); zeichneFeld(api); }

  // ---------------------------------------------------------------------
  // Meldungen
  // ---------------------------------------------------------------------
  function grundMeldung(api) {
    const z = api.zustand, v = z.v;
    if (z.phase === 'verloren') return api.meldung('Der Roboter gewinnt. Nochmal?', 'hinweis', ROBOTER);
    if (z.phase === 'gewonnen') return api.meldung('Geschafft!', 'gut', api.sym('stern'));
    if (z.phase === 'roboter') {
      if (!z.roboLetzt && !Object.keys(z.gesagt).length && !z.steine.some((l) => l.some((s) => s.weg))) {
        return api.meldung((neuesSpiel(api) ? 'Neu: ' : '') + regelText(v) + ' Der Roboter fängt an.', '', regelBild(api, v));
      }
      return api.meldung('Der Roboter überlegt …', '', ROBOTER);
    }
    if (z.roboLetzt) {
      const r = z.roboLetzt;
      return api.meldung(z.zaehlen ? 'Der Roboter hat ' + zahlen(r.von, r.nimm) + ' gesagt. Jetzt du!' : 'Der Roboter hat ' + r.nimm + ' genommen. Jetzt du!', '', DU);
    }
    api.meldung((neuesSpiel(api) ? 'Neu: ' : '') + regelText(v), '', regelBild(api, v));
  }
  function auswahlMeldung(api) {
    const z = api.zustand, v = z.v;
    if (z.zaehlen) {
      if (!z.sag) return grundMeldung(api);
      return api.meldung('Du sagst ' + zahlen(stand(z), z.sag) + '. Tippe auf Los.', '', DU);
    }
    const k = z.wahl.length;
    if (!k) return grundMeldung(api);
    if (!N.zugOk(v, z.h, { haufen: z.wahl[0].h, nimm: k })) {
      return api.meldung(steineWort(k) + ' geht nicht. ' + erlaubtText(v), 'hinweis', N.iconSVG());
    }
    api.meldung('Du nimmst ' + steineWort(k) + '. Tippe auf Nehmen.', '', DU);
  }

  // ---------------------------------------------------------------------
  // Antippen
  // ---------------------------------------------------------------------
  function tippeStein(api, el) {
    const z = api.zustand, v = z.v;
    if (z.phase !== 'du' || z.laeuft) return;
    const hi = +el.dataset.h, p = +el.dataset.p;
    const i = z.wahl.findIndex((w) => w.h === hi && w.p === p);
    if (i >= 0) {
      z.wahl.splice(i, 1);
      zeichneFeld(api); zeichneTasten(api);
      return auswahlMeldung(api);
    }
    if (z.wahl.length && z.wahl[0].h !== hi) {
      // aus dem anderen Haufen: neu anfangen, freundlich sagen warum
      z.wahl = [{ h: hi, p }];
      zeichneFeld(api); zeichneTasten(api);
      return api.meldung('Nimm nur aus einem Haufen. Jetzt nimmst du aus diesem.', 'hinweis', N.iconSVG());
    }
    const max = v.nehmen === 'beliebig' ? z.h[hi] : v.nehmen[v.nehmen.length - 1];
    if (z.wahl.length >= max) return api.meldung(erlaubtText(v), 'hinweis', N.iconSVG());
    z.wahl.push({ h: hi, p });
    zeichneFeld(api); zeichneTasten(api);
    auswahlMeldung(api);
  }
  function waehleAnzahl(api, k) {
    const z = api.zustand;
    if (z.phase !== 'du' || z.laeuft) return;
    if (k > z.h[0]) return api.meldung('Es ' + (z.h[0] === 1 ? 'liegt nur noch 1 Stein.' : 'liegen nur noch ' + z.h[0] + ' Steine.'), 'hinweis', N.iconSVG());
    z.wahl = z.wahl.length === k ? [] : letzte(z, 0, k);
    zeichneFeld(api); zeichneTasten(api);
    auswahlMeldung(api);
  }
  function waehleSag(api, k) {
    const z = api.zustand;
    if (z.phase !== 'du' || z.laeuft) return;
    z.sag = z.sag === k ? 0 : k;
    zeichneFeld(api); zeichneTasten(api);
    auswahlMeldung(api);
  }

  // ---------------------------------------------------------------------
  // Züge: du, dann der Roboter. Nur das Ergebnis zählt (Kern: zugOk, nach, istEnde, siegerNachLetztem).
  // ---------------------------------------------------------------------
  const zeit = (api, f) => Math.round(api.TEMPO * f);
  function los(api) {
    const z = api.zustand, v = z.v;
    if (z.phase !== 'du' || z.laeuft) return;
    let zug;
    if (z.zaehlen) {
      if (!z.sag) return api.meldung('Tippe zuerst unten an, was du sagst.', 'hinweis', api.sym('drache'));
      zug = { haufen: 0, nimm: z.sag };
    } else {
      if (!z.wahl.length) return api.meldung('Tippe zuerst die Steine an, die du nimmst.', 'hinweis', N.iconSVG());
      zug = { haufen: z.wahl[0].h, nimm: z.wahl.length };
    }
    if (!N.zugOk(v, z.h, zug)) return api.meldung(erlaubtText(v), 'hinweis', N.iconSVG());
    ziehe(api, 'du', zug);
  }
  function ziehe(api, wer, zug) {
    const z = api.zustand;
    if (z.zaehlen) return hupfe(api, wer, zug.nimm);
    const liste = wer === 'du' ? z.wahl : z.roboWahl;
    for (const w of liste) z.steine[w.h][w.p].weg = wer;
    z.h = N.nach(z.h, zug);
    z.wahl = []; z.roboWahl = [];
    nachZug(api, wer, zug, null);
  }
  // Wer sagt …?: Der Drache hüpft Feld für Feld (ruhig, ohne Blinken)
  function hupfe(api, wer, k) {
    const z = api.zustand;
    const von = stand(z);
    z.laeuft = true;
    z.sag = 0; z.roboSag = 0;
    if (wer === 'du') api.meldung('Du sagst ' + zahlen(von, k) + '.', '', DU);
    zeichneTasten(api);
    let n = 0;
    const schritt = () => {
      z.gesagt[stand(z) + 1] = wer;
      z.h = [z.h[0] - 1];
      n++;
      zeichneFeld(api);
      if (n < k) api.spaeter(schritt, zeit(api, 0.75));
      else api.spaeter(() => { z.laeuft = false; nachZug(api, wer, { haufen: 0, nimm: k }, von); }, zeit(api, 0.4));
    };
    schritt();
  }
  function nachZug(api, wer, zug, von) {
    const z = api.zustand;
    z.zugNr++;
    if (N.istEnde(z.h)) return ende(api, wer);
    if (wer === 'du') return roboterDran(api, false);
    z.phase = 'du';
    z.roboLetzt = { nimm: zug.nimm, von };
    zeichne(api);
    grundMeldung(api);
  }
  // Der Roboter: kurz überlegen, seine Wahl zeigen (blauer Ring), dann ziehen
  function roboterDran(api, amAnfang) {
    const z = api.zustand;
    z.phase = 'roboter';
    z.wahl = []; z.sag = 0; z.roboWahl = []; z.roboSag = 0;
    zeichne(api);
    if (!amAnfang) grundMeldung(api);
    api.spaeter(() => {
      const zug = N.roboterZug(z.v, z.h);
      if (z.zaehlen) {
        z.roboSag = zug.nimm;
        api.meldung('Der Roboter sagt ' + zahlen(stand(z), zug.nimm) + '.', '', ROBOTER);
      } else {
        z.roboWahl = letzte(z, zug.haufen, zug.nimm);
        api.meldung('Der Roboter nimmt ' + steineWort(zug.nimm) + '.', '', ROBOTER);
      }
      zeichneFeld(api);
      api.spaeter(() => ziehe(api, 'roboter', zug), zeit(api, 1.4));
    }, zeit(api, amAnfang ? 3.5 : 1.6));
  }
  function ende(api, wer) {
    const z = api.zustand;
    z.laeuft = false;
    if (N.siegerNachLetztem(z.v, wer) === 'du') {
      z.phase = 'gewonnen';
      zeichne(api);
      grundMeldung(api);
      // erst kurz den goldenen Tisch zeigen, dann das Fenster (ein Doppeltipp trifft so keine Taste darin)
      api.spaeter(() => api.geschafft({ zusatz: siegText(z.v) }), PAUSE);
      return;
    }
    z.phase = 'verloren';
    zeichne(api);
    grundMeldung(api);
  }

  // ---------------------------------------------------------------------
  // Start, Nochmal
  // ---------------------------------------------------------------------
  function beginne(api) {
    neu(api);
    grundMeldung(api);   // zuerst die Meldung: Ihre Höhe bestimmt den Platz für den Zahlen-Weg
    zeichne(api);
    if (api.zustand.phase === 'roboter') roboterDran(api, true);
  }
  function start(api) {
    aktiv = api;
    // Quer: die Meldung rechts über den Tasten (dann hat links das Spielfeld die ganze Höhe).
    // Hoch bleibt die Reihenfolge Kopf, Feld, Meldung, Spieler, Tasten (order in app.css).
    const m = api.feld.parentNode.querySelector('.meldung');
    if (m && api.programm && api.programm.parentNode) api.programm.parentNode.insertBefore(m, api.programm);
    beginne(api);
    // Ein Doppeltipp auf „Weiter“ oder „Los geht’s“ soll nicht gleich einen Stein im neuen Level treffen
    api.sperren();
  }

  SPIELE.nim = {
    icon() { return N.iconSVG().replace('<svg ', '<svg class="nim-icon" '); },
    start,
    grundMeldung,
    klick(aktion, el, api) {
      if (aktion === 'stein') return tippeStein(api, el);
      if (aktion === 'anzahl') return waehleAnzahl(api, parseInt(el.dataset.n, 10));
      if (aktion === 'sag') return waehleSag(api, parseInt(el.dataset.n, 10));
    },
    los,
    nochmal(api) {
      beginne(api);
      grundMeldung(api);
    },
    stopp() { aktiv = null; },
  };

  // Beim Drehen des Geräts den Zahlen-Weg neu legen (pro Reihe so viele Felder, dass sie groß sind)
  let drehTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(drehTimer);
    drehTimer = setTimeout(() => {
      if (aktiv && aktiv.zustand && aktiv.zustand.zaehlen && aktiv.feld && aktiv.feld.isConnected) { aktiv.zustand.pro = 0; zeichneFeld(aktiv); }
    }, 120);
  });

  // app.js zeichnet die erste Ansicht, bevor die Spiel-Plugins geladen sind (sie stehen in index.html
  // nach app.js). Öffnet man das Paket direkt (QR-Code am Blatt, Neuladen), fehlte sonst das Bild
  // oder das Spiel. Dann einmal neu zeichnen lassen, wie mit einem Tipp auf eine Taste.
  (function neuZeichnen() {
    const app = document.getElementById('app');
    const ans = document.body && document.body.dataset.ansicht;
    const D = window.WERKSTATT_DATEN;
    if (!app || !ans || !D || !D.pakete) return;
    const pakete = D.pakete.filter((p) => p.art === 'nim' || p.levels.some((l) => l.art === 'nim'));
    if (!pakete.length) return;
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    let noetig = false;
    if (ans === 'level') {
      const sp = document.querySelector('.spiel[data-level]');
      noetig = !!sp && !sp.classList.contains('plugin') && pakete.some((p) => p.levels.some((l) => l.id === sp.dataset.level && l.art === 'nim'));
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
