/* =====================================================================
   Werkstatt-Kern: der Ausführer
   Führt Drachen-Programme im Gitter aus und prüft Ablauf-Reihenfolgen.
   Dieselbe Datei läuft in der Web-App (<script>), beim Bauen der PDFs
   (Chrome) und im Rätsel-Löser (Node: import). Keine Abhängigkeiten.
   Ergebnis: globalThis.WerkstattKern

   Gitter-Regeln (plan/lehrplan.md 7.5):
   - x wächst nach rechts, y nach unten, Feld (0, 0) ist links oben
   - Blickrichtung: oben, rechts, unten, links (ohne Angabe: oben)
   - Befehle: vor, links (= links drehen), rechts (= rechts drehen)
   - Wiederhol-Zauber: { wdh: 3, befehle: ['vor'] }, im Text "3[vor]" (2- bis 5-mal, 1 bis 3 Teile)
   - Stößt der Drache an den Rand oder an ein Hindernis, bleibt er stehen
     und das Programm hört auf (der Kobold hat zugeschlagen).
   - Geschafft: Am Ende des Programms steht der Drache auf dem Ziel und
     hat alle Edelsteine eingesammelt (falls es welche gibt).

   Erweiterte Befehle (plan/lehrplan.md 7.8, ab Block C):
   - Wenn-dann-Kasten:  "wenn[stein: rechts sonst vor]"
                        { wenn: 'stein', dann: ['rechts'], sonst: ['vor'] }
       Bedingungen: stein, frei (vor der Nase), stein-links, stein-rechts,
       frei-links, frei-rechts (neben dem Drachen, von ihm aus gesehen).
       Der Rand zählt wie ein Stein. dann: 1 bis 3, sonst: 0 bis 3 Teile
       (nur Befehle und Zauberspruch-Aufrufe).
   - Wiederhol-Zauber „bis zum Schatz“: "bis[vor]"  { bis: 'schatz', befehle: ['vor'] }
       wiederholt, bis der Drache auf dem Ziel steht (geprüft vor dem Start
       und nach jedem ausgeführten Befehl, dann hört der Kasten sofort auf).
   - Zauberspruch-Aufruf: "@stern"  { spruch: 'stern' }   (stern, mond, krone)
       Die Sprüche kommen von außen: ausfuehren(welt, prog, { sprueche: { stern: 'vor vor links' } })
       Ein Spruch hat 1 bis 4 Teile (Befehle, Zauber-Kasten, Wenn-dann-Kasten), kein Spruch im Spruch.
   - Zauber-Kasten (Zahl oder bis) darf Befehle, Wenn-dann-Kästen und Aufrufe enthalten
     (höchstens 3 Teile), aber keinen Zauber-Kasten.
   - Höchstens 60 ausgeführte Befehle (MAX_SCHRITTE), sonst: zuLang
     („Der Drache läuft im Kreis. Er findet den Schatz so nicht.“).
   ===================================================================== */
(function (g) {
  'use strict';

  const RICHTUNGEN = ['oben', 'rechts', 'unten', 'links'];
  const DX = [0, 1, 0, -1];
  const DY = [-1, 0, 1, 0];
  const BEFEHLE = ['vor', 'links', 'rechts'];
  const WDH_MIN = 2;
  const WDH_MAX = 5;
  const MAX_INNEN = 3;   // höchstens 3 Teile in einem Zauber-Kasten (Papier, Löser und App gleich)
  // Erweiterte Befehle (plan/lehrplan.md 7.8)
  const BEDINGUNGEN = ['stein', 'frei', 'stein-links', 'stein-rechts', 'frei-links', 'frei-rechts'];
  const SPRUCH_NAMEN = ['stern', 'mond', 'krone'];
  const SPRUCH_WORT = { stern: 'Stern-Spruch', mond: 'Mond-Spruch', krone: 'Kronen-Spruch' };
  const MAX_DANN = 3;    // Befehle nach „dann“ (mindestens 1)
  const MAX_SONST = 3;   // Befehle nach „sonst“ (0 = ohne sonst)
  const MAX_SPRUCH = 4;  // Teile in einem Zauberspruch
  const MAX_SCHRITTE = 60;  // ausgeführte Befehle pro Programm, dann läuft der Drache im Kreis

  function richtung(name) {
    if (name === undefined || name === null || name === '') return 0;
    const i = RICHTUNGEN.indexOf(name);
    if (i < 0) throw new Error('Unbekannte Blickrichtung „' + name + '“');
    return i;
  }

  // ---------------------------------------------------------------------
  // Programme lesen und schreiben
  //   Text:   "vor vor rechts 3[vor links] bis[wenn[stein: rechts sonst vor]] @stern"
  //   Daten:  ['vor', 'vor', 'rechts', { wdh: 3, befehle: ['vor', 'links'] },
  //            { bis: 'schatz', befehle: [{ wenn: 'stein', dann: ['rechts'], sonst: ['vor'] }] },
  //            { spruch: 'stern' }]
  // ---------------------------------------------------------------------
  function zerlege(text) {
    const re = /\s*(?:(\d+)|@([a-zäöü]*)|([a-zäöü]+(?:-[a-zäöü]+)*)|([[\]:]))\s*/y;
    const aus = [];
    let pos = 0;
    while (pos < text.length) {
      re.lastIndex = pos;
      const m = re.exec(text);
      if (!m || re.lastIndex === pos) throw new Error('Programm nicht lesbar ab „' + text.slice(pos) + '“');
      if (m[1] !== undefined) aus.push({ zahl: parseInt(m[1], 10), pos });
      else if (m[2] !== undefined) aus.push({ ruf: m[2], pos });
      else if (m[3] !== undefined) aus.push({ wort: m[3], pos });
      else aus.push({ zeichen: m[4], pos });
      pos = re.lastIndex;
    }
    return aus;
  }
  function liesText(text) {
    const tk = zerlege(text);
    let i = 0;
    const ab = () => (i < tk.length ? ' ab „' + text.slice(tk[i].pos) + '“' : ' am Ende');
    const ist = (z) => i < tk.length && tk[i].zeichen === z;
    const erwarte = (z, was) => { if (!ist(z)) throw new Error('„' + z + '“ fehlt' + (was ? ' ' + was : '') + ab()); i++; };
    const ende = () => i >= tk.length || ist(']') || (tk[i].wort === 'sonst');
    function liste() { const l = []; while (!ende()) l.push(teil()); return l; }
    function teil() {
      const x = tk[i];
      if (x.zahl !== undefined) {
        i++; erwarte('[', 'nach ' + x.zahl);
        const inhalt = liste(); erwarte(']', 'am Ende des Zauber-Kastens');
        return { wdh: x.zahl, befehle: inhalt };
      }
      if (x.ruf !== undefined) { i++; return { spruch: x.ruf }; }
      if (x.wort === 'bis') {
        i++; erwarte('[', 'nach bis');
        const inhalt = liste(); erwarte(']', 'am Ende des Zauber-Kastens „bis zum Schatz“');
        return { bis: 'schatz', befehle: inhalt };
      }
      if (x.wort === 'wenn') {
        i++; erwarte('[', 'nach wenn');
        const b = tk[i];
        if (!b || b.wort === undefined) throw new Error('Nach „wenn[“ fehlt die Bedingung (' + BEDINGUNGEN.join(', ') + ')' + ab());
        i++; erwarte(':', 'nach der Bedingung');
        const dann = liste();
        let sonst = [];
        if (i < tk.length && tk[i].wort === 'sonst') { i++; sonst = liste(); }
        erwarte(']', 'am Ende des Wenn-dann-Kastens');
        return { wenn: b.wort, dann, sonst };
      }
      if (x.wort !== undefined) { i++; return x.wort; }
      throw new Error('Programm nicht lesbar' + ab());
    }
    const prog = [];
    while (i < tk.length) {
      if (ist(']')) throw new Error('„]“ ohne „[“' + ab());
      if (tk[i].wort === 'sonst') throw new Error('„sonst“ ohne „wenn[“' + ab());
      prog.push(teil());
    }
    return prog;
  }

  // Wo ein Teil steht: programm | kasten (Zauber-Kasten) | zweig (dann/sonst) | spruch,
  // im Spruch mit Vorsilbe: spruch-kasten, spruch-zweig
  function pruefeListe(l, ort) {
    if (!Array.isArray(l)) throw new Error('Programmteile müssen eine Liste sein');
    return l.map((t) => pruefeTeil(t, ort));
  }
  function pruefeTeil(t, ort) {
    ort = ort || 'programm';
    const imSpruch = ort.indexOf('spruch') === 0;
    const imZweig = /zweig$/.test(ort);
    const imKasten = /kasten$/.test(ort);
    if (typeof t === 'string') {
      if (t.charAt(0) === '@') return pruefeTeil({ spruch: t.slice(1) }, ort);
      if (!BEFEHLE.includes(t)) throw new Error('Unbekannter Befehl „' + t + '“ (erlaubt: vor, links, rechts)');
      return t;
    }
    if (!t || typeof t !== 'object') throw new Error('Unbekannter Programmteil ' + JSON.stringify(t));
    if (t.spruch !== undefined) {
      if (!SPRUCH_NAMEN.includes(t.spruch)) throw new Error('Unbekannter Zauberspruch „@' + t.spruch + '“ (es gibt: ' + SPRUCH_NAMEN.map((n) => '@' + n).join(', ') + ')');
      if (imSpruch) throw new Error('Kein Zauberspruch in einem Zauberspruch');
      return { spruch: t.spruch };
    }
    if (t.wenn !== undefined) {
      if (!BEDINGUNGEN.includes(t.wenn)) throw new Error('Unbekannte Bedingung „' + t.wenn + '“ (erlaubt: ' + BEDINGUNGEN.join(', ') + ')');
      if (imZweig) throw new Error('Kein Wenn-dann-Kasten in einem Wenn-dann-Kasten');
      const zo = imSpruch ? 'spruch-zweig' : 'zweig';
      const dann = pruefeListe(t.dann || [], zo);
      const sonst = pruefeListe(t.sonst || [], zo);
      if (dann.length < 1) throw new Error('Wenn-dann-Kasten: nach „dann“ fehlt ein Befehl');
      if (dann.length > MAX_DANN) throw new Error('Wenn-dann-Kasten: nach „dann“ höchstens ' + MAX_DANN + ' Befehle');
      if (sonst.length > MAX_SONST) throw new Error('Wenn-dann-Kasten: nach „sonst“ höchstens ' + MAX_SONST + ' Befehle');
      return { wenn: t.wenn, dann, sonst };
    }
    const istBis = t.bis !== undefined;
    if (Array.isArray(t.befehle) && (istBis || t.wdh !== undefined)) {
      if (istBis && t.bis !== 'schatz' && t.bis !== true) throw new Error('Zauber-Kasten „bis zum Schatz“: bis muss "schatz" sein');
      if (!istBis) {
        if (!Number.isInteger(t.wdh)) throw new Error('Wiederhol-Zauber: Zahl fehlt');
        if (t.wdh < WDH_MIN || t.wdh > WDH_MAX) throw new Error('Wiederhol-Zauber: ' + t.wdh + '-mal geht nicht (2 bis 5)');
      }
      if (imKasten) throw new Error('Kein Zauber-Kasten im Zauber-Kasten');
      if (imZweig) throw new Error('Im Wenn-dann-Kasten stehen nur Befehle und Zaubersprüche, kein Zauber-Kasten');
      if (!t.befehle.length) throw new Error('Leerer Zauber-Kasten');
      const inhalt = pruefeListe(t.befehle, imSpruch ? 'spruch-kasten' : 'kasten');
      if (inhalt.length > MAX_INNEN) {
        throw new Error('Höchstens ' + MAX_INNEN + (inhalt.every((x) => typeof x === 'string') ? ' Befehle' : ' Teile') + ' in einem Zauber-Kasten');
      }
      return istBis ? { bis: 'schatz', befehle: inhalt } : { wdh: t.wdh, befehle: inhalt };
    }
    throw new Error('Unbekannter Programmteil ' + JSON.stringify(t));
  }
  function lies(p) {
    if (Array.isArray(p)) return pruefeListe(p, 'programm');
    if (typeof p !== 'string') throw new Error('Programm muss Text oder Liste sein');
    return pruefeListe(liesText(p.trim()), 'programm');
  }
  // Ein Zauberspruch: 1 bis 4 Teile (Befehle, Zauber-Kasten, Wenn-dann-Kasten), kein Aufruf
  function liesSpruch(p, name) {
    const wer = name ? SPRUCH_WORT[name] || name : 'Zauberspruch';
    let l;
    try {
      l = pruefeListe(Array.isArray(p) ? p : typeof p === 'string' ? liesText(p.trim()) : null, 'spruch');
    } catch (e) { throw new Error(wer + ': ' + e.message); }
    if (!l.length) throw new Error(wer + ': leer');
    if (l.length > MAX_SPRUCH) throw new Error(wer + ': höchstens ' + MAX_SPRUCH + ' Teile');
    return l;
  }
  // { stern: 'vor vor links', mond: [...] } → { stern: [...], mond: [...] }
  function liesSprueche(sp) {
    const aus = {};
    if (sp === undefined || sp === null) return aus;
    if (typeof sp !== 'object' || Array.isArray(sp)) throw new Error('sprueche muss ein Objekt sein, z. B. { "stern": "vor vor links" }');
    for (const [name, p] of Object.entries(sp)) {
      if (!SPRUCH_NAMEN.includes(name)) throw new Error('Unbekannter Zauberspruch „' + name + '“ (es gibt: ' + SPRUCH_NAMEN.join(', ') + ')');
      aus[name] = liesSpruch(p, name);
    }
    return aus;
  }
  function teilText(t) {
    if (typeof t === 'string') return t;
    if (t.spruch) return '@' + t.spruch;
    if (t.wenn) return 'wenn[' + t.wenn + ': ' + t.dann.map(teilText).join(' ') + (t.sonst.length ? ' sonst ' + t.sonst.map(teilText).join(' ') : '') + ']';
    return (t.bis ? 'bis' : t.wdh) + '[' + t.befehle.map(teilText).join(' ') + ']';
  }
  function alsText(prog) {
    return lies(prog).map(teilText).join(' ');
  }
  function spruecheText(sp) {
    const aus = {};
    for (const [n, l] of Object.entries(liesSprueche(sp))) aus[n] = l.map(teilText).join(' ');
    return aus;
  }

  // Karten zählen (plan/lehrplan.md 7.5 Regel 10 und 7.8):
  //   Befehl, Zauberspruch-Aufruf = 1 Karte; Zauber-Kasten = 1 Karte plus sein Inhalt;
  //   Wenn-dann-Kasten = 1 Karte (die Wenn-Karte) plus die Befehle nach „dann“ und „sonst“.
  //   Mit sprueche: jeder übergebene Spruch zählt einmal dazu (1 Karte für den Namen plus sein Inhalt).
  function teilKarten(t) {
    if (typeof t === 'string' || t.spruch) return 1;
    if (t.wenn) return 1 + t.dann.length + t.sonst.length;
    return 1 + t.befehle.reduce((s, x) => s + teilKarten(x), 0);
  }
  function karten(prog, sprueche) {
    let n = lies(prog).reduce((s, t) => s + teilKarten(t), 0);
    if (sprueche) for (const l of Object.values(liesSprueche(sprueche))) n += 1 + l.reduce((s, t) => s + teilKarten(t), 0);
    return n;
  }
  // Welche Bausteine ein Programm (samt aufgerufener Sprüche) benutzt
  function verwendet(prog, sprueche) {
    const sp = liesSprueche(sprueche);
    const v = { zauber: false, bis: false, wenn: false, spruch: false, bedingungen: [], aufrufe: [] };
    const bed = new Set(), auf = new Set();
    const geh = (l) => l.forEach((t) => {
      if (typeof t === 'string') return;
      if (t.spruch) { v.spruch = true; if (!auf.has(t.spruch)) { auf.add(t.spruch); if (sp[t.spruch]) geh(sp[t.spruch]); } return; }
      if (t.wenn) { v.wenn = true; bed.add(t.wenn); geh(t.dann); geh(t.sonst); return; }
      if (t.bis) v.bis = true; else v.zauber = true;
      geh(t.befehle);
    });
    geh(lies(prog));
    v.bedingungen = Array.from(bed);
    v.aufrufe = Array.from(auf);
    return v;
  }
  // Nur Befehle und Zauber-Kästen mit Zahl, ohne Wenn-dann, „bis“ und Zaubersprüche
  function einfach(prog) {
    const v = verwendet(prog);
    return !v.bis && !v.wenn && !v.spruch;
  }

  // Wo ein Befehl steht: pfad = [{ in: 'programm', i }, { in: 'kasten', i, runde, bis? },
  //   { in: 'dann'|'sonst', i }, { in: 'spruch', name, i }, …] von außen nach innen.
  // Dazu die kurzen Felder wie früher: teil (Teil im Programm), innen und runde (im Zauber-Kasten),
  // zweig (dann/sonst) mit zweigI, spruch (Name) mit spruchI (Teil im Spruch) – jeweils der innerste.
  function ortVon(pfad) {
    const o = { teil: pfad.length ? pfad[0].i : null, innen: null, runde: null, zweig: null, zweigI: null, spruch: null, spruchI: null, pfad };
    if (pfad[1] && pfad[1].in === 'kasten') { o.innen = pfad[1].i; o.runde = pfad[1].runde; }
    for (const p of pfad) {
      if (p.in === 'dann' || p.in === 'sonst') { o.zweig = p.in; o.zweigI = p.i; }
      if (p.in === 'spruch') { o.spruch = p.name; o.spruchI = p.i; }
    }
    return o;
  }

  // Befehle, die der Drache wirklich ausführt (Wiederhol-Zauber und Zaubersprüche ausgerollt).
  // Geht nur ohne Wenn-dann-Kasten und ohne „bis zum Schatz“ (was dann passiert, hängt vom Gitter ab:
  // dafür ausfuehren(welt, prog)). Zaubersprüche über opt.sprueche.
  function ausrollen(prog, opt) {
    const sp = liesSprueche(opt && opt.sprueche);
    const aus = [];
    const rein = (t, pfad) => {
      if (typeof t === 'string') { aus.push(Object.assign({ befehl: t }, ortVon(pfad))); return; }
      if (t.wenn || t.bis) throw new Error('ausrollen geht nicht mit Wenn-dann-Kasten oder „bis zum Schatz“ (das hängt vom Gitter ab): dafür ausfuehren(welt, prog)');
      if (t.spruch) {
        if (!sp[t.spruch]) throw new Error('Den ' + SPRUCH_WORT[t.spruch] + ' gibt es hier nicht (sprueche fehlt)');
        sp[t.spruch].forEach((x, i) => rein(x, pfad.concat([{ in: 'spruch', name: t.spruch, i }])));
        return;
      }
      for (let r = 0; r < t.wdh; r++) t.befehle.forEach((x, j) => rein(x, pfad.concat([{ in: 'kasten', i: j, runde: r }])));
    };
    lies(prog).forEach((t, i) => rein(t, [{ in: 'programm', i }]));
    return aus;
  }

  // ---------------------------------------------------------------------
  // Welt: { b, h, start: {x, y, blick}, ziel: {x, y}, hindernisse: [[x, y]], edelsteine: [[x, y]] }
  // ---------------------------------------------------------------------
  function welt(w) {
    if (!w || !Number.isInteger(w.b) || !Number.isInteger(w.h) || w.b < 1 || w.h < 1) throw new Error('Gitter braucht b und h');
    const imGitter = (x, y) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < w.b && y < w.h;
    const s = w.start || {};
    if (!imGitter(s.x, s.y)) throw new Error('Startfeld liegt nicht im Gitter');
    const hind = new Set();
    for (const [x, y] of w.hindernisse || []) {
      if (!imGitter(x, y)) throw new Error('Hindernis ' + x + ',' + y + ' liegt nicht im Gitter');
      hind.add(x + ',' + y);
    }
    if (hind.has(s.x + ',' + s.y)) throw new Error('Hindernis auf dem Startfeld');
    let ziel = null;
    if (w.ziel) {
      if (!imGitter(w.ziel.x, w.ziel.y)) throw new Error('Ziel liegt nicht im Gitter');
      if (hind.has(w.ziel.x + ',' + w.ziel.y)) throw new Error('Hindernis auf dem Ziel');
      ziel = { x: w.ziel.x, y: w.ziel.y };
    }
    const edel = (w.edelsteine || []).map(([x, y]) => {
      if (!imGitter(x, y) || hind.has(x + ',' + y)) throw new Error('Edelstein ' + x + ',' + y + ' liegt nicht frei im Gitter');
      if (x === s.x && y === s.y) throw new Error('Edelstein auf dem Startfeld');
      return x + ',' + y;
    });
    if (new Set(edel).size !== edel.length) throw new Error('Zwei Edelsteine im selben Feld');
    return {
      b: w.b, h: w.h,
      start: { x: s.x, y: s.y, r: richtung(s.blick) },
      ziel, hindernisse: hind, edelsteine: edel, imGitter,
      frei: (x, y) => imGitter(x, y) && !hind.has(x + ',' + y),
    };
  }

  // Ein einzelner Befehl: neuer Zustand oder { stoss: 'rand' | 'hindernis' }
  function schritt(W, z, befehl) {
    if (befehl === 'links') return { x: z.x, y: z.y, r: (z.r + 3) % 4 };
    if (befehl === 'rechts') return { x: z.x, y: z.y, r: (z.r + 1) % 4 };
    const nx = z.x + DX[z.r], ny = z.y + DY[z.r];
    if (!W.imGitter(nx, ny)) return { stoss: 'rand' };
    if (W.hindernisse.has(nx + ',' + ny)) return { stoss: 'hindernis' };
    return { x: nx, y: ny, r: z.r };
  }

  // Bedingung des Wenn-dann-Kastens: Welches Feld schaut der Drache an? (vor der Nase, links oder rechts neben ihm)
  function bedingungFeld(W, z, name) {
    if (!BEDINGUNGEN.includes(name)) throw new Error('Unbekannte Bedingung „' + name + '“');
    const seite = name.split('-')[1];
    const r = seite === 'links' ? (z.r + 3) % 4 : seite === 'rechts' ? (z.r + 1) % 4 : z.r;
    return { x: z.x + DX[r], y: z.y + DY[r] };
  }
  // true, wenn die Bedingung stimmt. Der Rand zählt wie ein Stein. Der Drache schaut nur, er stößt nie an.
  function bedingung(weltDaten, z, name) {
    const W = weltDaten && weltDaten.imGitter ? weltDaten : welt(weltDaten);
    const zz = { x: z.x, y: z.y, r: typeof z.r === 'number' ? z.r : richtung(z.blick) };
    const f = bedingungFeld(W, zz, name);
    const stein = !W.frei(f.x, f.y);
    return name.indexOf('stein') === 0 ? stein : !stein;
  }

  // ---------------------------------------------------------------------
  // Programm ausführen
  //   opt.sprueche: { stern: 'vor vor links', … }   Zaubersprüche für @stern …
  //   opt.max:      höchstens so viele Befehle (Standard MAX_SCHRITTE = 60); mehr: zuLang
  // Ergebnis:
  //   schritte: [{ nr, befehl, teil, innen, runde, zweig, zweigI, spruch, spruchI, pfad, vorher, nachher }]
  //             nur ausgeführte Befehle (vor, links, rechts); nr zählt sie (0-basiert)
  //   stoss:    null | { nr, art: 'rand'|'hindernis', befehl, teil, innen, runde, …, pfad, vorher }
  //   zuLang:   true, wenn mehr als opt.max Befehle nötig wären (oder ein „bis zum Schatz“-Kasten
  //             eine Runde ohne Befehl dreht und so nie fertig würde)
  //   ende:     { x, y, blick }
  //   gesammelt: Anzahl eingesammelter Edelsteine
  //   geschafft: true, wenn am Ende auf dem Ziel, alles eingesammelt, kein Stoß und nicht zu lang
  //   ereignisse: Reihenfolge zum Anzeigen: { art: 'befehl', schritt } | { art: 'wenn', bedingung,
  //             wahr, zustand, feld, …ort } | { art: 'spruch', name, …ort } | { art: 'stoss' } | { art: 'zuLang' }
  // ---------------------------------------------------------------------
  const WEITER = 0, HALT = 1, BIS_ENDE = 2;
  function ausfuehren(weltDaten, prog, opt) {
    opt = opt || {};
    const W = weltDaten && weltDaten.imGitter ? weltDaten : welt(weltDaten);
    const teile = lies(prog);
    const sp = liesSprueche(opt.sprueche);
    const max = opt.max !== undefined && opt.max !== null ? opt.max : MAX_SCHRITTE;
    let z = { x: W.start.x, y: W.start.y, r: W.start.r };
    const offen = new Set(W.edelsteine);
    const schritte = [];
    const ereignisse = [];
    let stoss = null;
    let zuLang = false;
    let bisTiefe = 0;
    let arbeit = 0;
    const aufZiel = () => !!W.ziel && z.x === W.ziel.x && z.y === W.ziel.y;
    const zuLangMelden = () => { if (!zuLang) { zuLang = true; ereignisse.push({ art: 'zuLang' }); } return HALT; };

    function befehl(b, pfad) {
      if (schritte.length >= max) return zuLangMelden();
      const n = schritt(W, z, b);
      const ort = ortVon(pfad);
      if (n.stoss) {
        stoss = Object.assign({ nr: schritte.length, art: n.stoss, befehl: b }, ort, { vorher: zustand(z) });
        ereignisse.push({ art: 'stoss' });
        return HALT;
      }
      schritte.push(Object.assign({ nr: schritte.length, befehl: b }, ort, { vorher: zustand(z), nachher: zustand(n) }));
      ereignisse.push({ art: 'befehl', schritt: schritte.length - 1 });
      z = n;
      offen.delete(z.x + ',' + z.y);
      return bisTiefe > 0 && aufZiel() ? BIS_ENDE : WEITER;
    }
    function liste(l, pfad, rahmen) {
      for (let i = 0; i < l.length; i++) {
        const e = teil(l[i], pfad.concat([Object.assign({}, rahmen, { i })]));
        if (e !== WEITER) return e;
      }
      return WEITER;
    }
    function teil(t, pfad) {
      if (++arbeit > 20000) return zuLangMelden();   // Schutz, kommt bei gültigen Programmen nicht vor
      if (typeof t === 'string') return befehl(t, pfad);
      if (t.spruch) {
        const l = sp[t.spruch];
        if (!l) throw new Error('Den ' + SPRUCH_WORT[t.spruch] + ' gibt es hier nicht (sprueche: ' + (Object.keys(sp).join(', ') || 'keine') + ')');
        ereignisse.push(Object.assign({ art: 'spruch', name: t.spruch }, ortVon(pfad)));
        return liste(l, pfad, { in: 'spruch', name: t.spruch });
      }
      if (t.wenn) {
        const ja = bedingung(W, z, t.wenn);
        ereignisse.push(Object.assign({ art: 'wenn', bedingung: t.wenn, wahr: ja, zustand: zustand(z), feld: bedingungFeld(W, z, t.wenn) }, ortVon(pfad)));
        return liste(ja ? t.dann : t.sonst, pfad, { in: ja ? 'dann' : 'sonst' });
      }
      if (t.bis) {
        if (aufZiel()) return WEITER;          // schon beim Schatz: der Kasten macht nichts
        bisTiefe++;
        let e = WEITER;
        for (let runde = 0; ; runde++) {
          const vorher = schritte.length;
          e = liste(t.befehle, pfad, { in: 'kasten', runde, bis: true });
          if (e !== WEITER) break;
          if (schritte.length === vorher) { e = zuLangMelden(); break; }   // Runde ohne Befehl: hört nie auf
        }
        bisTiefe--;
        if (e === BIS_ENDE) return bisTiefe > 0 ? BIS_ENDE : WEITER;
        return e;
      }
      for (let runde = 0; runde < t.wdh; runde++) {
        const e = liste(t.befehle, pfad, { in: 'kasten', runde });
        if (e !== WEITER) return e;
      }
      return WEITER;
    }
    liste(teile, [], { in: 'programm' });
    const amZiel = aufZiel();
    return {
      schritte, stoss, zuLang, ende: zustand(z),
      gesammelt: W.edelsteine.length - offen.size,
      geschafft: !stoss && !zuLang && amZiel && offen.size === 0,
      amZiel,
      ereignisse,
    };
  }
  function zustand(z) { return { x: z.x, y: z.y, blick: RICHTUNGEN[z.r] }; }

  // Wo steht der Drache nach n Befehlen? (n zählt ausgeführte Befehle: Wiederhol-Zauber ausgerollt,
  // Wenn-dann und Zaubersprüche wie ausgeführt). null, wenn es Befehl n nicht gibt (Stoß, Programm kürzer).
  function standNach(weltDaten, prog, n, opt) {
    if (n === 0) return zustand((weltDaten && weltDaten.imGitter ? weltDaten : welt(weltDaten)).start);
    const e = ausfuehren(weltDaten, prog, Object.assign({}, opt || {}, { max: n }));
    if (e.stoss && e.stoss.nr < n) return null;
    return e.schritte[n - 1] ? e.schritte[n - 1].nachher : null;
  }

  // ---------------------------------------------------------------------
  // Ablauf-Karten: Regeln [[a, b], …] heißen „a kommt vor b“
  // ---------------------------------------------------------------------
  function pruefeReihenfolge(regeln, reihenfolge) {
    const pos = {};
    reihenfolge.forEach((id, i) => { pos[id] = i; });
    const verletzt = [];
    for (const [a, b] of regeln) {
      if (pos[a] === undefined || pos[b] === undefined) continue;
      if (pos[a] > pos[b]) verletzt.push([a, b]);
    }
    return { ok: verletzt.length === 0, verletzt };
  }

  g.WerkstattKern = {
    RICHTUNGEN, BEFEHLE, WDH_MIN, WDH_MAX, MAX_INNEN,
    BEDINGUNGEN, SPRUCH_NAMEN, SPRUCH_WORT, MAX_DANN, MAX_SONST, MAX_SPRUCH, MAX_SCHRITTE,
    lies, liesSpruch, liesSprueche, alsText, teilText, spruecheText, karten, teilKarten, verwendet, einfach, ausrollen,
    welt, schritt, bedingung, bedingungFeld, ausfuehren, standNach, pruefeReihenfolge,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
