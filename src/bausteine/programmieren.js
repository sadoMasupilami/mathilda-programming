/* =====================================================================
   Bausteine fürs Programmieren (Blätter und Anleitung)
     <m-symbol>       Symbol aus web/kern/symbole.js (vor, links, rechts, drache, schatz …)
     <m-gitter>       Pfeil-Gitter mit Drache, Blickrichtung, Schatz, Hindernissen
     <m-programm>     nummerierte Programm-Reihe (mit Zauber-Kasten, Wenn-dann-Kasten,
                      „bis zum Schatz“ und Zauberspruch-Aufrufen)
     <m-spruch>       ein Zauberspruch (Name mit Siegel und seine Befehle), auch leer zum Ausfüllen
     <m-qr>           QR-Code zum Level-Paket der Web-App (beim Bauen erzeugt)
     <m-linksrechts>  die immer gleichen Hilfen für links und rechts
   Alle Rätsel kommen aus raetsel/*.json und sind beim Bauen schon gelöst
   (werkzeuge/raetsel.mjs). Beschreibung: vorlagen/AUTOREN-LEITFADEN.md
   ===================================================================== */
(function () {
  'use strict';
  const B = (window.__bausteine = window.__bausteine || {});
  const H = () => window.__hilfen;
  const S = () => window.WerkstattSymbole;
  const K = () => window.WerkstattKern;
  const istLoesung = (el) => !!el.closest('.loesungsmodus');

  function raetselVon(el) {
    const id = el.getAttribute('raetsel');
    if (!id) return null;
    const r = H().DATEN.raetsel[id];
    if (!r) { H().fehler(el, 'Rätsel „' + id + '“ gibt es nicht in raetsel/*.json'); return undefined; }
    return r;
  }
  function weltVon(r) {
    const w = {};
    for (const f of ['b', 'h', 'start', 'ziel', 'hindernisse', 'edelsteine', 'zielSymbol']) if (r[f] !== undefined) w[f] = r[f];
    return w;
  }
  // Rätsel mit mehreren Welten ("welten"): welt="2" wählt eine (fehlende Felder aus dem Rätsel)
  function weltVonEl(el, r) {
    if (!r.welten) {
      if (el.hasAttribute('welt') && el.getAttribute('welt') !== '1') { H().fehler(el, 'Rätsel „' + r.id + '“ hat nur eine Welt'); return null; }
      return weltVon(r);
    }
    const n = parseInt(el.getAttribute('welt') || '0', 10);
    if (!(n >= 1 && n <= r.welten.length)) { H().fehler(el, 'Rätsel „' + r.id + '“ hat ' + r.welten.length + ' Welten: welt="1" bis welt="' + r.welten.length + '" angeben'); return null; }
    return Object.assign(weltVon(r), weltVon(r.welten[n - 1]));
  }
  const paar = (s) => s.split(',').map((x) => x.trim());

  // Aussehen der erweiterten Kästen (Wenn-dann, bis zum Schatz, Zaubersprüche). Farben aus web/kern/symbole.js.
  function stil() {
    if (document.getElementById('programmieren-stil')) return;
    const F = S().FARBE;
    const st = document.createElement('style');
    st.id = 'programmieren-stil';
    st.textContent = `
.prog .kasten-w { display: inline-flex; align-items: center; gap: 1.4mm; border: 0.8mm solid ${F.wenn}; background: ${F.wennHell}; border-radius: 3mm; padding: 1.2mm 1.8mm; }
.prog .kasten-w .w-wort { font-family: var(--kind); font-weight: 700; font-size: 16pt; color: ${F.wenn}; line-height: 1; white-space: nowrap; }
.prog .kasten-w .w-wort.w-wenn { margin-right: -0.4mm; }
.prog .platz.bed .box { border-color: ${F.wenn}; overflow: hidden; }
.prog .platz.bed .box svg { width: 100%; height: 100%; }
.prog .platz.ruf .box { border-color: ${F.spruch}; background: ${F.spruchHell}; }
.prog .kasten-bis .mal { gap: 1.2mm; white-space: nowrap; }
.prog .kasten-bis .mal .bis-bild { display: inline-block; width: calc(var(--gr, 14mm) * 0.62); height: calc(var(--gr, 14mm) * 0.62); }
.prog .kasten-bis .mal .bis-bild svg { width: 100%; height: 100%; display: block; }
.prog .kasten-z.markiert, .prog .kasten-w.markiert { outline: 0.9mm dashed var(--rot); outline-offset: 0.6mm; }
.anleitung .prog .kasten-w { padding: 0.8mm 1.2mm; border-width: 0.5mm; border-radius: 2mm; gap: 1mm; }
.anleitung .prog .kasten-w .w-wort { font-size: calc(var(--gr, 14mm) * 0.52); }
.anleitung .prog .kasten-z.kasten-bis .mal { font-size: calc(var(--gr, 14mm) * 0.52); }
.anleitung .loesung-mini .prog .kasten-w { padding: 1.2mm 1.8mm; border-width: 0.8mm; border-radius: 3mm; gap: 1.4mm; }
.anleitung .loesung-mini .prog .kasten-w .w-wort { font-size: 16pt; }
.anleitung .loesung-mini .prog .kasten-z.kasten-bis .mal { font-size: 16pt; }
m-spruch { display: inline-block; vertical-align: middle; line-height: 0; }
.spruch-def { display: inline-flex; align-items: flex-end; gap: 2.5mm; border: 0.8mm solid ${F.spruch}; background: ${F.spruchHell}; border-radius: 3mm; padding: 1.5mm 2.5mm 1.8mm 2mm; line-height: 1; }
.spruch-def .spruch-kopf { display: inline-flex; flex-direction: column; align-items: center; gap: 0.8mm; align-self: center; }
.spruch-def .spruch-siegel { display: block; width: calc(var(--gr, 14mm) * 0.95); height: calc(var(--gr, 14mm) * 0.95); }
.spruch-def .spruch-siegel svg { width: 100%; height: 100%; display: block; }
.spruch-def .spruch-wort { font-family: var(--kind); font-weight: 700; font-size: 14pt; color: ${F.spruch}; white-space: nowrap; }
.anleitung .spruch-def { padding: 0.8mm 1.4mm; border-width: 0.5mm; border-radius: 2mm; gap: 1.4mm; }
.anleitung .spruch-def .spruch-wort { font-size: calc(var(--gr, 14mm) * 0.45); }
.anleitung .spruch-def .spruch-siegel { width: calc(var(--gr, 14mm) * 0.8); height: calc(var(--gr, 14mm) * 0.8); }
.anleitung .loesung-mini .spruch-def { padding: 1.5mm 2.5mm 1.8mm 2mm; border-width: 0.8mm; border-radius: 3mm; gap: 2.5mm; }
.anleitung .loesung-mini .spruch-def .spruch-wort { font-size: 14pt; }
.anleitung .loesung-mini .spruch-def .spruch-siegel { width: calc(var(--gr, 14mm) * 0.95); height: calc(var(--gr, 14mm) * 0.95); }
`;
    document.head.appendChild(st);
  }

  // ---------------------------------------------------------------------
  // <m-symbol name="vor" gr="12">   (gr in mm, Standard 10)
  // ---------------------------------------------------------------------
  B['m-symbol'] = function (el) {
    const name = el.getAttribute('name');
    const gr = parseFloat(el.getAttribute('gr') || '10');
    if (!S().SYMBOLE[name]) return H().fehler(el, 'Unbekanntes Symbol „' + name + '“. Es gibt: ' + Object.keys(S().SYMBOLE).join(', '));
    let svg = S().symbol(name, gr + 'mm');
    const blick = el.getAttribute('blick');
    if (blick) {
      const r = { oben: 0, rechts: 90, unten: 180, links: 270 }[blick];
      if (r === undefined) return H().fehler(el, 'blick: oben, rechts, unten, links');
      svg = svg.replace('aria-hidden="true">', 'aria-hidden="true"><g transform="rotate(' + r + ' 50 50)">').replace(/<\/svg>$/, '</g></svg>');
    }
    el.innerHTML = svg;
    el.classList.add('komp');
  };

  // ---------------------------------------------------------------------
  // <m-gitter raetsel="e2-1" feld="22" [loesung="weg|keine|nach:3|ende"] [ohne-ziel]>
  // <m-gitter deko b="3" h="3" start="0,2,oben" ziel="2,0" hindernisse="1,1;2,2" feld="20">
  // ---------------------------------------------------------------------
  B['m-gitter'] = function (el) {
    const feld = parseFloat(el.getAttribute('feld') || '22');
    if (feld < 20) return H().fehler(el, 'Felder mindestens 20 mm (feld="20")');
    let r = raetselVon(el);
    if (r === undefined) return;
    let w;
    if (r) { w = weltVonEl(el, r); if (!w) return; }
    else {
      if (!el.hasAttribute('deko')) return H().fehler(el, 'm-gitter braucht raetsel="…" (oder deko für Bilder ohne Aufgabe)');
      w = { b: +el.getAttribute('b'), h: +el.getAttribute('h') };
      if (el.getAttribute('start')) { const [x, y, blick] = paar(el.getAttribute('start')); w.start = { x: +x, y: +y, blick: blick || 'oben' }; }
      if (el.getAttribute('ziel')) { const [x, y] = paar(el.getAttribute('ziel')); w.ziel = { x: +x, y: +y }; }
      w.hindernisse = (el.getAttribute('hindernisse') || '').split(';').filter(Boolean).map((p) => paar(p).map(Number));
      w.edelsteine = (el.getAttribute('edelsteine') || '').split(';').filter(Boolean).map((p) => paar(p).map(Number));
      if (el.getAttribute('ziel-symbol')) w.zielSymbol = el.getAttribute('ziel-symbol');
      try { if (w.start) K().welt(w); } catch (e) { return H().fehler(el, e.message); }
    }
    // Ein Feld ist genau feld mm groß (die viewBox hat 6 Einheiten Rand pro Seite)
    const opt = { breite: (feld * (w.b * 100 + 12) / 100).toFixed(2) + 'mm', hoehe: (feld * (w.h * 100 + 12) / 100).toFixed(2) + 'mm', label: r ? 'Gitter ' + r.id : 'Gitter' };
    if (el.hasAttribute('ohne-ziel')) { w = Object.assign({}, w); delete w.ziel; }
    if (el.hasAttribute('ohne-drache')) opt.ohneDrache = true;
    if (!w.start) opt.ohneDrache = true;
    const modus = el.getAttribute('loesung') || 'weg';
    if (istLoesung(el) && r && r.loesung && modus !== 'keine') {
      const L = r.loesung;
      let prog = null;
      let sp = null;
      if (r.art === 'pfad') { prog = L.beispiel || (L.programme && L.programme[0]); sp = L.sprueche; }
      if (r.art === 'lesen') { prog = L.programm; sp = L.sprueche; }
      if (r.art === 'kobold') { prog = L.gemeint; sp = L.gemeintSprueche; }
      if (r.art === 'kuerzer') prog = L.lang;
      if (prog) {
        let e = K().ausfuehren(w, prog, sp ? { sprueche: sp } : undefined);
        let weg = e.schritte.map((s) => s.nachher);
        if (/^nach:\d+$/.test(modus)) weg = weg.slice(0, +modus.split(':')[1]);
        opt.weg = weg;
        opt.geist = true;
        if (modus === 'ende' && weg.length) { opt.weg = []; opt.ohneDrache = true; opt.geist = false; opt.endeGeist = weg[weg.length - 1]; }
      }
    }
    let svg = S().gitter(w, opt);
    if (opt.endeGeist) {
      const e = opt.endeGeist;
      svg = svg.replace(/<\/svg>$/, '<circle cx="' + (e.x * 100 + 50) + '" cy="' + (e.y * 100 + 50) + '" r="46" fill="none" stroke="' + S().FARBE.rot + '" stroke-width="6"/>' +
        S().figur('drache', e.x, e.y, e.blick, ' opacity="0.8"') + '</svg>');
    }
    el.innerHTML = svg;
    el.classList.add('komp');
    if (r) el.classList.add('geprueft');
  };

  // ---------------------------------------------------------------------
  // <m-programm …>  nummerierte Reihe
  //   befehle="vor vor rechts 3[vor]"          fertiges Programm zeigen
  //   raetsel="e2-1" [teil="leer|programm|kurz|lang|zauber"] [plaetze="8"]
  //       leer:     leere Kästchen; Lösung = kürzestes Programm (oder Beispiel)
  //       programm: das Programm aus dem Rätsel (lesen, kobold); bei kobold zeigt die Lösung die Reparatur
  //       lang/kurz: bei „kuerzer“-Rätseln; kurz zeigt leere Kästchen in der Form des kurzen Programms
  //       zauber:   leere Form des kürzesten Programms mit Zauber-Kasten (pfad mit "zauber": true)
  //       form:     leere Form des Beispiels (pfad mit "erlaubt": Kästen, Wenn-Karte, „n-mal“ leer; Lösung rot)
  //       beispiel: das Beispiel-Programm gefüllt (pfad, z. B. für die Anleitung)
  //   leer="6"                                  6 leere Kästchen ohne Lösung (zum Selbererfinden)
  //   Wenn-dann-Kasten (türkis): „wenn“, Wenn-Karte, „dann“, Befehle, „sonst“, Befehle.
  //   „bis zum Schatz“ (lila wie der Zauber-Kasten, Schatz im Kopf). Aufruf @stern: Karte mit Spruch-Siegel.
  //   gr="14"  Kästchengröße in mm;  nummern="nein"
  // ---------------------------------------------------------------------
  function box(inhalt, nr, gr, extraCls, zusatz) {
    // nr === false: ganz ohne Nummernzeile (nummern="nein"); '' = leere Zeile, damit die Reihe bündig bleibt
    const nrHtml = nr === false ? '' : nr ? '<span class="nr">' + nr + '</span>' : '<span class="nr">&nbsp;</span>';
    return '<span class="platz' + (extraCls ? ' ' + extraCls : '') + '">' + nrHtml +
      '<span class="box' + (inhalt ? (inhalt.indexOf('lsg-symbol') >= 0 ? ' leer lsg-box' : '') : ' leer') + '">' + (inhalt || '') + (zusatz || '') + '</span></span>';
  }
  function sym(b) { return S().symbol(b); }
  function lsgSym(b) { return '<span class="lsg-symbol">' + S().symbol(b) + '</span>'; }

  B['m-programm'] = function (el) {
    const h = H();
    let gr = parseFloat(el.getAttribute('gr') || '14');
    const mitNr = el.getAttribute('nummern') !== 'nein';
    let r = raetselVon(el);
    if (r === undefined) return;
    let teile = null;       // anzuzeigendes Programm
    let loesung = null;     // Programm, das in leere Kästchen gehört
    let leer = 0;
    let form = null;        // leere Form (mit Zauber-Kasten)
    let kobold = null;
    try {
      if (el.hasAttribute('befehle')) teile = K().lies(el.getAttribute('befehle'));
      else if (r) {
        const L = r.loesung || {};
        const teil = el.getAttribute('teil') || (r.art === 'pfad' ? 'leer' : r.art === 'kuerzer' ? 'lang' : 'programm');
        if (teil === 'leer') {
          if (r.art !== 'pfad') return h.fehler(el, 'teil="leer" nur bei pfad-Rätseln');
          if (L.erweitert && !(L.beispiel && K().lies(L.beispiel).every((x) => typeof x === 'string' || x.spruch))) return h.fehler(el, 'Bei Rätseln mit Zauber-Kasten oder Wenn-dann-Kasten: teil="form" (leere Form des Beispiels)');
          loesung = K().lies(L.beispiel || L.programme[0]);
          leer = el.hasAttribute('plaetze') ? +el.getAttribute('plaetze') : Math.max(8, loesung.length);
          if (loesung.length > leer) return h.fehler(el, 'Lösung hat ' + loesung.length + ' Befehle, aber nur ' + leer + ' Kästchen');
        } else if (teil === 'programm') {
          if (r.art === 'lesen') teile = K().lies(L.programm);
          else if (r.art === 'kobold') { teile = K().lies(r.programm); kobold = L; }
          else return h.fehler(el, 'teil="programm" nur bei lesen oder kobold');
        } else if (teil === 'lang' || teil === 'kurz') {
          if (r.art !== 'kuerzer') return h.fehler(el, 'teil="' + teil + '" nur bei kuerzer-Rätseln');
          if (teil === 'lang') teile = K().lies(L.lang);
          else if (el.hasAttribute('zeige')) teile = K().lies(L.kurz);
          else form = K().lies(L.kurz);
        } else if (teil === 'zauber') {
          if (r.art !== 'pfad' || !L.zauber) return h.fehler(el, 'teil="zauber" nur bei pfad-Rätseln mit "zauber": true');
          form = K().lies(L.zauber.kuerzeste[0]);
        } else if (teil === 'form' || teil === 'beispiel') {
          if (r.art !== 'pfad' || !L.erweitert || !L.beispiel) return h.fehler(el, 'teil="' + teil + '" nur bei pfad-Rätseln mit "erlaubt" oder "welten"');
          if (teil === 'form') form = K().lies(L.beispiel);
          else teile = K().lies(L.beispiel);
        } else return h.fehler(el, 'Unbekannter teil „' + teil + '“');
      } else if (el.hasAttribute('leer')) leer = +el.getAttribute('leer');
      else return h.fehler(el, 'm-programm braucht befehle="…", raetsel="…" oder leer="…"');
    } catch (e) { return h.fehler(el, e.message); }

    // Wenn-dann, bis zum Schatz, Zaubersprüche (oder Kobold mit Stellen wie "3.dann.1"): eigener Zeichner
    if ((teile && !einfacheTeile(teile)) || (form && !einfacheTeile(form)) || (kobold && kobold.erweitert)) {
      const erg = zeichneErweitert(teile || form, {
        gr, mitNr, form: !!form, L: istLoesung(el), kobold, zielSymbol: r && r.zielSymbol, praefix: '',
      });
      if (erg.boxen > 12) h.fehler(el, erg.boxen + ' Kästchen in einer Programm-Reihe (höchstens 12)');
      if (erg.boxen > 11 && !el.hasAttribute('gr')) gr = 13;
      let html = '<span class="prog" style="--gr:' + gr + 'mm">' + erg.html + '</span>';
      if (kobold && istLoesung(el)) html += '<span class="prog-reparatur">' + h.esc(reparaturText(kobold, teile)) + '</span>';
      el.innerHTML = html;
      el.classList.add('komp');
      if (r) el.classList.add('geprueft');
      return;
    }

    const L = istLoesung(el);
    let html = '';
    let nr = 0;
    let anzahlBoxen = 0;
    const reihe = [];
    if (teile) {
      teile.forEach((t, i) => {
        if (typeof t === 'string') {
          nr++; anzahlBoxen++;
          let cls = '', zusatz = '';
          if (kobold && L) {
            const rp = kobold.reparatur;
            if (rp.art === 'tauschen' && rp.stelle === i + 1) cls = 'markiert';
            if (rp.art === 'loeschen' && (kobold.gleicheStellen || [rp.stelle]).includes(i + 1)) cls = 'markiert';
          }
          let teilHtml = box(sym(t), mitNr ? nr : false, gr, cls, zusatz);
          if (kobold && L) {
            const rp = kobold.reparatur;
            if (rp.art === 'einfuegen' && rp.stelle === i + 1) teilHtml = einfuegeMarke(rp.befehl) + teilHtml;
          }
          reihe.push(teilHtml);
        } else {
          nr++;
          let innen = '';
          t.befehle.forEach((b) => { anzahlBoxen++; innen += box(sym(b), mitNr ? '' : false, gr); });
          reihe.push('<span class="platz">' + (mitNr ? '<span class="nr">' + nr + '</span>' : '') + '<span class="kasten-z"><span class="mal">' + t.wdh + '-mal</span><span class="innen">' + innen + '</span></span></span>');
        }
      });
      if (kobold && L && kobold.reparatur.art === 'einfuegen' && kobold.reparatur.stelle === teile.length + 1) reihe.push(einfuegeMarke(kobold.reparatur.befehl));
    } else if (form) {
      form.forEach((t) => {
        nr++;
        if (typeof t === 'string') { anzahlBoxen++; reihe.push(box(lsgSym(t), mitNr ? nr : false, gr)); }
        else {
          let innen = '';
          t.befehle.forEach((b) => { anzahlBoxen++; innen += box(lsgSym(b), mitNr ? '' : false, gr); });
          reihe.push('<span class="platz">' + (mitNr ? '<span class="nr">' + nr + '</span>' : '') + '<span class="kasten-z"><span class="mal">' + h.feldHTML(String(t.wdh), 'k') + '-mal</span><span class="innen">' + innen + '</span></span></span>');
        }
      });
    } else {
      for (let i = 0; i < leer; i++) {
        anzahlBoxen++;
        const b = loesung && loesung[i];
        reihe.push(box(b ? lsgSym(typeof b === 'string' ? b : S().spruchSymbol(b.spruch)) : '', mitNr ? i + 1 : false, gr));
      }
    }
    if (anzahlBoxen > 12) h.fehler(el, anzahlBoxen + ' Kästchen in einer Programm-Reihe (höchstens 12)');
    // 12 Kästchen à 14 mm sind mit Abständen breiter als ein Blatt: dann automatisch 13 mm
    if (anzahlBoxen > 11 && !el.hasAttribute('gr')) gr = 13;
    html = '<span class="prog" style="--gr:' + gr + 'mm">' + reihe.join('') + '</span>';
    if (kobold && L) {
      const rp = kobold.reparatur;
      const n = { vor: 'vor', links: 'links drehen', rechts: 'rechts drehen' };
      const gleich = (kobold.gleicheStellen || [rp.stelle]);
      const oder = (l) => l.length === 1 ? String(l[0]) : l.slice(0, -1).join(', ') + ' oder ' + l[l.length - 1];
      let t;
      if (rp.art === 'tauschen') t = 'Befehl ' + rp.stelle + ': ' + n[rp.befehl] + ' statt ' + n[teile[rp.stelle - 1]];
      else if (rp.art === 'loeschen') t = 'Befehl ' + oder(gleich) + ' streichen';
      else if (rp.stelle === 1) t = 'am Anfang fehlt ' + n[rp.befehl];
      else if (rp.stelle === teile.length + 1) t = 'am Ende fehlt ' + n[rp.befehl];
      else t = 'zwischen Befehl ' + (rp.stelle - 1) + ' und ' + rp.stelle + ' fehlt ' + n[rp.befehl];
      if (rp.art === 'einfuegen' && gleich.length > 1) t += ' (oder an einer anderen Stelle in derselben Reihe: gleiches Programm)';
      html += '<span class="prog-reparatur">' + h.esc(t) + '</span>';
    }
    el.innerHTML = html;
    el.classList.add('komp');
    if (r) el.classList.add('geprueft');
  };
  function einfuegeMarke(befehl) {
    return '<span class="platz einfuegen-marke" style="width:auto"><span class="nr" style="color:var(--rot)">+</span>' +
      '<span class="box" style="border-color:var(--rot);border-style:dashed">' + S().symbol(befehl) + '</span></span>';
  }

  // ---------------------------------------------------------------------
  // Erweiterte Programme zeichnen (plan/lehrplan.md 7.8)
  //   Nummern: jeder Teil der Reihe bekommt eine (wie am Papier), Kästchen in Kästen keine.
  //   o.form: leere Kästchen mit roter Lösung (Wenn-Karte, Befehle, „n-mal“ leer)
  //   o.kobold: Lösung eines Kobold-Rätsels mit Stellen ("3", "3.dann.1", "@stern.2")
  // ---------------------------------------------------------------------
  function einfacheTeile(l) {
    return l.every((t) => typeof t === 'string' || (t.wdh !== undefined && t.befehle.every((b) => typeof b === 'string')));
  }
  const symName = (t) => (typeof t === 'string' ? t : S().spruchSymbol(t.spruch));
  // leer: Kästchen zum Ausfüllen (mit Inhalt = rote Lösung, nur in der Lösungsansicht sichtbar)
  function platzHTML(inhalt, nr, platzCls, leer) {
    const nrHtml = nr === false ? '' : '<span class="nr">' + (nr === '' ? '&nbsp;' : nr) + '</span>';
    const boxCls = !inhalt ? ' leer' : leer ? ' leer lsg-box' : '';
    return '<span class="platz' + (platzCls ? ' ' + platzCls : '') + '">' + nrHtml + '<span class="box' + boxCls + '">' + inhalt + '</span></span>';
  }
  function zeichneErweitert(teile, o) {
    stil();
    let boxen = 0;
    const rp = o.kobold && o.L ? o.kobold.reparatur : null;
    const st = (x) => String(x);
    const gleich = rp ? (o.kobold.gleicheStellen || [rp.stelle]).map(st) : [];
    const markiert = (stelle, arten) => !!rp && arten.includes(rp.art) &&
      (rp.art === 'loeschen' ? gleich.includes(stelle) : st(rp.stelle) === stelle);
    const marke = (stelle) => (rp && rp.art === 'einfuegen' && st(rp.stelle) === stelle ? einfuegeMarke(symName(K().lies([rp.befehl])[0])) : '');
    function blatt(t, nr, stelle) {
      boxen++;
      const name = symName(t);
      const inhalt = o.form ? '<span class="lsg-symbol">' + S().symbol(name) + '</span>' : S().symbol(name);
      const cls = (typeof t === 'string' || o.form ? '' : 'ruf') + (markiert(stelle, ['tauschen', 'loeschen']) ? ' markiert' : '');
      return platzHTML(inhalt, nr, cls.trim(), o.form);
    }
    function liste(l, praefix, nrArt) {
      // nrArt: 'zaehlen' (Programm: 1, 2, 3 …), 'leer' (im Zauber-Kasten: leere Nummernzeile), false (im Wenn-dann-Kasten)
      let html = '';
      l.forEach((t, i) => {
        const stelle = praefix + (i + 1);
        const nr = nrArt === 'zaehlen' ? (o.mitNr ? i + 1 : false) : nrArt === 'leer' ? (o.mitNr ? '' : false) : false;
        html += marke(stelle) + teil(t, nr, stelle);
      });
      return html + marke(praefix + (l.length + 1));
    }
    function teil(t, nr, stelle) {
      if (typeof t === 'string' || t.spruch) return blatt(t, nr, stelle);
      const nrHtml = nr === false ? '' : '<span class="nr">' + (nr === '' ? '&nbsp;' : nr) + '</span>';
      if (t.wenn) {
        boxen++;
        const bedSym = S().symbol(S().bedingungSymbol(t.wenn));
        const bed = platzHTML(o.form ? '<span class="lsg-symbol">' + bedSym + '</span>' : bedSym, false, 'bed' + (markiert(stelle, ['bedingung']) ? ' markiert' : ''), o.form);
        let innen = '<span class="w-wort w-wenn">wenn</span>' + bed + '<span class="w-wort">dann</span>' + liste(t.dann, stelle + '.dann.', false);
        if (t.sonst.length || (rp && rp.art === 'einfuegen' && st(rp.stelle).indexOf(stelle + '.sonst.') === 0)) innen += '<span class="w-wort">sonst</span>' + liste(t.sonst, stelle + '.sonst.', false);
        return '<span class="platz">' + nrHtml + '<span class="kasten-w">' + innen + '</span></span>';
      }
      let kopf;
      if (t.bis) {
        kopf = '<span class="bis-bild">' + S().symbol(o.zielSymbol || 'schatz') + '</span>bis zum ' + ({ ziel: 'Ziel', stern: 'Stern' }[o.zielSymbol] || 'Schatz');
      } else kopf = (o.form ? H().feldHTML(String(t.wdh), 'k') : t.wdh) + '-mal';
      const cls = 'kasten-z' + (t.bis ? ' kasten-bis' : '') + (markiert(stelle, ['zahl']) ? ' markiert' : '');
      return '<span class="platz">' + nrHtml + '<span class="' + cls + '"><span class="mal">' + kopf + '</span><span class="innen">' + liste(t.befehle, stelle + '.', 'leer') + '</span></span></span>';
    }
    const html = liste(teile, o.praefix || '', 'zaehlen');
    return { html, boxen };
  }

  // Lösungstext eines Kobold-Rätsels mit Stellen (für Mama oder Papa)
  const BED_WORT = { stein: 'Stein vor der Nase', frei: 'frei vor der Nase', 'stein-links': 'Stein links', 'stein-rechts': 'Stein rechts', 'frei-links': 'frei links', 'frei-rechts': 'frei rechts' };
  function befehlWort(b) {
    const n = { vor: 'vor', links: 'links drehen', rechts: 'rechts drehen' };
    return n[b] || (String(b).charAt(0) === '@' ? K().SPRUCH_WORT[String(b).slice(1)] : String(b));
  }
  function stelleWort(stelle) {
    const t = String(stelle).split('.');
    let s = '';
    if (t[0].charAt(0) === '@') s = 'im ' + K().SPRUCH_WORT[t.shift().slice(1)] + ' ';
    s += 'Teil ' + t[0];
    for (let i = 1; i < t.length; i++) {
      if (t[i] === 'dann' || t[i] === 'sonst') { s += ', nach „' + t[i] + '“ Befehl ' + t[i + 1]; i++; }
      else s += ', darin Teil ' + t[i];
    }
    return s;
  }
  function reparaturText(kobold, teile) {
    const rp = kobold.reparatur;
    const oder = (l) => (l.length === 1 ? l[0] : l.slice(0, -1).join(', ') + ' oder ' + l[l.length - 1]);
    let alt = null;
    try {
      const b = { programm: K().lies(kobold.programm || teile), sprueche: K().liesSprueche(kobold.sprueche) };
      const tt = String(rp.stelle).split('.');
      let l = tt[0].charAt(0) === '@' ? b.sprueche[tt.shift().slice(1)] : b.programm;
      for (let i = 0; i < tt.length; i++) {
        const x = l[parseInt(tt[i], 10) - 1];
        if (i === tt.length - 1) { alt = x; break; }
        if (tt[i + 1] === 'dann' || tt[i + 1] === 'sonst') { l = x[tt[i + 1]]; i++; } else l = x.befehle;
      }
    } catch (e) { alt = null; }
    if (rp.art === 'tauschen') return stelleWort(rp.stelle) + ': ' + befehlWort(rp.befehl) + ' statt ' + befehlWort(alt ? K().teilText(alt) : '?');
    if (rp.art === 'loeschen') return oder((kobold.gleicheStellen || [rp.stelle]).map(stelleWort)) + ' streichen';
    if (rp.art === 'einfuegen') return 'Bei ' + stelleWort(rp.stelle) + ' fehlt ' + befehlWort(rp.befehl) + ((kobold.gleicheStellen || []).length > 1 ? ' (oder an einer anderen Stelle in derselben Reihe: gleiches Programm)' : '');
    if (rp.art === 'bedingung') return stelleWort(rp.stelle) + ': Wenn-Karte „' + BED_WORT[rp.bedingung] + '“ statt „' + (alt && alt.wenn ? BED_WORT[alt.wenn] : '?') + '“';
    if (rp.art === 'zahl') return stelleWort(rp.stelle) + ': ' + rp.wdh + '-mal statt ' + (alt && alt.wdh ? alt.wdh : '?') + '-mal';
    return '';
  }

  // ---------------------------------------------------------------------
  // <m-spruch …>  ein Zauberspruch: Siegel und Name links, die Befehle in einer Reihe
  //   name="stern" befehle="vor vor links"     fertigen Spruch zeigen
  //   name="stern" raetsel="e17-p1"            Spruch aus dem Rätsel: vorgegeben ("sprueche") gefüllt;
  //                                            vom Kind zu schreiben ("spruchFrei" bei pfad, "sprueche" bei kuerzer):
  //                                            leere Kästchen, Lösung rot (plaetze="4" oder teil="form"); zeige = gefüllt
  //   name="mond" leer="4"                     leere Kästchen ohne Lösung (eigene Sprüche erfinden)
  //   gr="14"  Kästchengröße in mm;  nummern="nein"
  // ---------------------------------------------------------------------
  B['m-spruch'] = function (el) {
    const h = H();
    stil();
    const name = el.getAttribute('name');
    if (!K().SPRUCH_NAMEN.includes(name)) return h.fehler(el, 'm-spruch braucht name="stern", "mond" oder "krone"');
    let gr = parseFloat(el.getAttribute('gr') || '14');
    const mitNr = el.getAttribute('nummern') !== 'nein';
    const r = raetselVon(el);
    if (r === undefined) return;
    let teile = null, loesung = null, form = null, leer = 0, kobold = null;
    try {
      if (el.hasAttribute('befehle')) teile = K().liesSpruch(el.getAttribute('befehle'), name);
      else if (r) {
        const L = r.loesung || {};
        let text = null, frei = false;
        if (r.art === 'pfad') {
          const ew = L.erweitert || {};
          if (ew.sprueche && ew.sprueche[name]) text = ew.sprueche[name];
          else if (ew.beispielSprueche && ew.beispielSprueche[name]) { text = ew.beispielSprueche[name]; frei = true; }
          else if ((ew.spruchFrei || []).includes(name)) return h.fehler(el, 'Rätsel „' + r.id + '“: Lösung für den ' + K().SPRUCH_WORT[name] + ' fehlt (beispielSprueche)');
        } else if (r.art === 'kuerzer') { text = (L.sprueche || {})[name]; frei = true; }
        else if (r.art === 'kobold') { text = (L.sprueche || {})[name]; if (L.erweitert) kobold = L; }
        else text = (L.sprueche || {})[name];
        if (!text) return h.fehler(el, 'Rätsel „' + r.id + '“ hat keinen ' + K().SPRUCH_WORT[name]);
        const l = K().liesSpruch(text, name);
        if (!frei || el.hasAttribute('zeige')) teile = l;
        else if (el.getAttribute('teil') === 'form' || !l.every((x) => typeof x === 'string')) form = l;
        else {
          loesung = l;
          leer = el.hasAttribute('plaetze') ? +el.getAttribute('plaetze') : Math.max(4, l.length);
          if (l.length > leer) return h.fehler(el, 'Lösung hat ' + l.length + ' Befehle, aber nur ' + leer + ' Kästchen');
        }
      } else if (el.hasAttribute('leer')) leer = +el.getAttribute('leer');
      else return h.fehler(el, 'm-spruch braucht befehle="…", raetsel="…" oder leer="…"');
    } catch (e) { return h.fehler(el, e.message); }
    let html, boxen;
    if (teile || form) {
      const erg = zeichneErweitert(teile || form, { gr, mitNr, form: !!form, L: istLoesung(el), kobold, praefix: '@' + name + '.' });
      html = erg.html; boxen = erg.boxen;
    } else {
      html = '';
      for (let i = 0; i < leer; i++) {
        const b = loesung && loesung[i];
        html += platzHTML(b ? '<span class="lsg-symbol">' + S().symbol(b) + '</span>' : '', mitNr ? i + 1 : false, '', true);
      }
      boxen = leer;
    }
    if (boxen > 12) h.fehler(el, boxen + ' Kästchen in einem Zauberspruch (höchstens 12)');
    if (boxen > 9 && !el.hasAttribute('gr')) gr = 12;
    el.innerHTML = '<span class="spruch-def" style="--gr:' + gr + 'mm"><span class="spruch-kopf"><span class="spruch-siegel">' + S().symbol(S().spruchSymbol(name)) + '</span>' +
      '<span class="spruch-wort">' + h.esc(K().SPRUCH_WORT[name]) + '</span></span><span class="prog" style="--gr:' + gr + 'mm">' + html + '</span></span>';
    el.classList.add('komp');
    if (r) el.classList.add('geprueft');
  };

  // ---------------------------------------------------------------------
  // <m-qr paket="e2">  QR-Code zur Web-App (nur für Mama oder Papa), mindestens 2,5 cm
  // ---------------------------------------------------------------------
  B['m-qr'] = function (el) {
    const p = el.getAttribute('paket');
    const q = H().DATEN.qr[p];
    if (!q) return H().fehler(el, 'Kein QR-Code für Paket „' + p + '“ (gibt es raetsel/' + p + '.json mit "web"?)');
    const gr = parseFloat(el.getAttribute('gr') || '32');
    if (gr < 31) return H().fehler(el, 'QR-Code zu klein (mindestens 31 mm inkl. Ruhezone, damit der Code selbst 2,5 cm breit ist)');
    const svg = q.svg.replace(/width="[^"]*"/, 'width="' + gr + 'mm"').replace(/height="[^"]*"/, 'height="' + gr + 'mm"');
    const pak = H().DATEN.pakete[p];
    el.dataset.url = q.url;
    el.innerHTML = '<span class="qr-box"><span class="qr">' + svg + '</span><span class="klein" style="font-size:8.5pt;font-family:var(--text);color:var(--grau)">Bildschirm-Bonus<br>für Mama oder Papa:<br>Paket ' + pak.einheit + '</span></span>';
    el.classList.add('komp');
  };

  // ---------------------------------------------------------------------
  // <m-linksrechts>  In jeder Gitter-Einheit dieselben Hilfen (AUFTRAG.md Abschnitt 4)
  // ---------------------------------------------------------------------
  B['m-linksrechts'] = function (el) {
    const k = H().KIND;
    el.innerHTML = '<div class="kasten tipp"><div class="kasten-titel">' + H().bildSVG('lupe', 6) + '<span>Hilfen für links und rechts (in jeder Gitter-Einheit gleich)</span></div><ul>' +
      '<li><b>Hinter den Roboter stellen:</b> ' + k + ' stellt sich hinter den Roboter (oder hinter den Drachen am Boden) und schaut in dieselbe Richtung. Dann ist sein Links auch ihr Links.</li>' +
      '<li><b>Rechte Hand markieren:</b> ein Gummiringerl oder Sticker auf ' + k + 's rechter Hand. Die Drachen-Figur hat eine orange rechte Pfote, und der Befehl „rechts drehen“ ist auch orange.</li>' +
      '<li><b>Blatt drehen erlaubt:</b> Am Papier darf ' + k + ' das Blatt drehen, bis die Nase des Drachen nach oben zeigt. Oder sie dreht die ausgeschnittene Drachen-Figur bei jedem Drehbefehl mit.</li>' +
      '<li><b>In Stufen:</b> zuerst Drehungen, wenn der Drache nach oben schaut, dann nach links oder rechts. Erst im Schwerer-Teil, wenn er nach unten schaut. Dann ist sein Links von ' + k + ' aus gesehen rechts.</li>' +
      '</ul></div>';
    el.classList.add('komp');
  };
})();
