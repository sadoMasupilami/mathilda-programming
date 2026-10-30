/* =====================================================================
   Bausteine für Einheit 3 „Erst das, dann das“ (Ablauf-Karten)
     <m-ablaufbild name="brot" gr="20">
         ein Bild aus web/kern/bilder.js (gr in mm)
     <m-ablaufkarte raetsel="e3-jause" karte="brot" band="Jause" farbe="gelb">
     <m-ablaufkarte leer text="Dein Belag" band="Jause" farbe="gelb">
         Karte zum Ausschneiden (in <m-karten>): Band oben, Bild, Text.
         Lösung: rote Platz-Nummer (fest), „4 oder 5“ oder „überall“.
     <m-ablauf raetsel="e3-ei" [reihe="risse,fliegen,…"] [gr="24"] [breite="32"]>
         Karten nebeneinander mit Nummern-Kästchen zum Eintragen.
         Lösung: rote Nummern; bei mehreren Reihenfolgen ein Hinweis.
     <m-ablauf raetsel="e3-jause" modus="falsch" reihe="…" tausch="3,4">
         Karten in falscher Reihenfolge (zwei vertauscht), Nummern oben.
         Lösung: die zwei Karten rot umrandet. Geprüft: genau ein Tausch repariert.
     <m-ablaufpaar raetsel="e3-anziehen" a="socken" b="hose" [l="egal|a|b"] [ohne-egal] [zeile]>
         Zwei Karten: Was kommt zuerst, oder ist es egal? (ankreuzen)
         zeile: kompakt in einer Zeile, Bild mit dem ersten Wort der Karte
     <m-ablaufanzahl raetsel="e3-belag" [l="6"]>
         Antwortfeld: wie viele Reihenfolgen gibt es? (vom Löser gezählt)
     <m-ablaufzuerst raetsel="e3-ausziehen" zuerst="schuhe" dann="socken" l="Schuhe">
         Antwortfeld (Wort): was kommt zuerst? Geprüft: in jeder Reihenfolge.
   Alle Antworten kommen vom Löser (werkzeuge/raetsel.mjs → ablaufZaehlen).
   Beschreibung: vorlagen/AUTOREN-LEITFADEN.md
   ===================================================================== */
(function () {
  'use strict';
  const B = (window.__bausteine = window.__bausteine || {});
  const H = () => window.__hilfen;
  const BI = () => window.WerkstattBilder;
  const K = () => window.WerkstattKern;
  const istLoesung = (el) => !!el.closest('.loesungsmodus');

  // Eigene Gestaltung (Präfix e03-), einmal pro Dokument
  const CSS = `
m-ablaufbild, m-ablaufpaar, m-ablaufanzahl, m-ablaufzuerst { display: inline-block; vertical-align: middle; line-height: 0; }
m-ablauf { display: block; }
m-ablaufkarte { display: block; width: 100%; height: 100%; }
m-ablaufbild svg, m-ablauf svg, m-ablaufkarte svg, m-ablaufpaar svg { display: block; }
.e03-sk { position: relative; display: flex; flex-direction: column; align-items: center; width: 100%; height: 100%; gap: 1.5mm; padding: 0 1.5mm 1.5mm 1.5mm; }
.e03-band { position: relative; align-self: stretch; margin: 0 -1.5mm; height: 6.5mm; display: flex; align-items: center; justify-content: center; padding: 0 2.5mm;
  font-family: var(--text); font-weight: 800; font-size: 9pt; color: white; letter-spacing: 0.02em; line-height: 1; }
.e03-f-gelb .e03-band { background: #e09a00; }
.e03-f-blau .e03-band { background: #2b6fd6; }
.e03-f-gruen .e03-band { background: #1f9d55; }
.e03-f-lila .e03-band { background: #7a4fd1; }
.e03-sk .e03-bild { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 0; }
.e03-sk .e03-text { font-family: var(--kind); font-size: 14pt; line-height: 1.08; text-align: center; min-height: 2.16em; display: flex; align-items: center; justify-content: center; }
.e03-leer-bild { border: 0.5mm dashed #b9bdd3; border-radius: 2mm; }
.e03-pos { display: none; }
.loesungsmodus .e03-band > span:first-child { visibility: hidden; }
.loesungsmodus .e03-pos { display: inline-flex; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); align-items: center; justify-content: center; min-width: 7mm; height: 7mm; padding: 0 1.5mm; border-radius: 3.5mm;
  background: white; color: var(--rot); font-family: var(--kind); font-weight: 700; font-size: 15pt; line-height: 1; white-space: nowrap; }
.e03-reihe { display: flex; gap: var(--abst, 4mm); justify-content: center; align-items: flex-start; }
.e03-spalte { display: flex; flex-direction: column; align-items: center; gap: 2mm; }
.e03-karte { width: var(--b, 32mm); border: 0.6mm solid var(--tinte); border-radius: 3mm; background: white;
  display: flex; flex-direction: column; align-items: center; gap: 1mm; padding: 2mm 1.2mm 1.6mm 1.2mm; }
.e03-karte .e03-text { font-family: var(--kind); font-size: 14pt; line-height: 1.08; text-align: center; min-height: 2.16em; display: flex; align-items: center; justify-content: center; }
.e03-nr { font-family: var(--text); font-weight: 800; font-size: 14pt; color: var(--grau); line-height: 1; }
.e03-box { width: 13mm; height: 13mm; border: 0.6mm solid var(--tinte); border-radius: 2mm; background: white;
  display: flex; align-items: center; justify-content: center; font-family: var(--kind); font-size: 24pt; line-height: 1; }
.loesungsmodus .e03-box .lsg { color: var(--rot); font-weight: 700; }
.loesungsmodus .e03-tausch .e03-karte { outline: 1.2mm dashed var(--rot); outline-offset: 1mm; }
.e03-lsg { display: none; }
.loesungsmodus .e03-lsg { display: block; margin-top: 2mm; color: var(--rot); font-family: var(--kind); font-weight: 700; font-size: 15pt; line-height: 1.2; text-align: center; }
.e03-paar { display: inline-grid; grid-template-columns: auto auto auto; grid-template-rows: auto auto; column-gap: 2.5mm; row-gap: 2mm; align-items: center; justify-items: center; }
.e03-paar .e03-mitte { grid-row: 1 / span 2; grid-column: 2; display: flex; flex-direction: column; align-items: center; gap: 1.5mm; font-family: var(--kind); font-size: 14pt; line-height: 1; }
.e03-kreuz { width: 11mm; height: 11mm; border: 0.6mm solid var(--tinte); border-radius: 2mm; background: white; display: flex; align-items: center; justify-content: center; }
.e03-kreuz svg { width: 8mm; height: 8mm; }
.e03-pzeile { display: inline-grid; grid-template-columns: auto auto auto auto auto; column-gap: 4mm; align-items: center; }
.e03-pkarte { display: inline-flex; align-items: center; gap: 2mm; border: 0.6mm solid var(--tinte); border-radius: 3mm; background: white; padding: 1mm 3mm 1mm 1.5mm; width: var(--b, 46mm); }
.e03-pkarte .e03-wort { font-family: var(--kind); font-size: 16pt; line-height: 1.1; }
.e03-pmitte { display: inline-flex; align-items: center; gap: 2mm; font-family: var(--kind); font-size: 16pt; line-height: 1; padding: 0 3mm; }
`;
  function stil() {
    if (document.getElementById('e03-stil')) return;
    const st = document.createElement('style');
    st.id = 'e03-stil';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  // ---------------------------------------------------------------------
  // Hilfen
  // ---------------------------------------------------------------------
  function ablaufVon(el) {
    const id = el.getAttribute('raetsel');
    if (!id) { H().fehler(el, 'raetsel="…" fehlt'); return null; }
    const r = H().DATEN.raetsel[id];
    if (!r) { H().fehler(el, 'Rätsel „' + id + '“ gibt es nicht in raetsel/*.json'); return null; }
    if (r.art !== 'ablauf') { H().fehler(el, 'Rätsel „' + id + '“ ist kein Ablauf (art: ' + r.art + ')'); return null; }
    if (!r.loesung || !r.loesung.loesungen) { H().fehler(el, 'Rätsel „' + id + '“ hat keine Lösung (Löser-Fehler?)'); return null; }
    return r;
  }
  function karteVon(el, r, id) {
    const k = r.karten.find((x) => x.id === id);
    if (!k) H().fehler(el, 'Karte „' + id + '“ gibt es in ' + r.id + ' nicht. Es gibt: ' + r.karten.map((x) => x.id).join(', '));
    return k || null;
  }
  function bildHTML(el, name, gr) {
    if (!name) return '';
    if (!BI() || !BI().hat(name)) { H().fehler(el, 'Unbekanntes Bild „' + name + '“ (web/kern/bilder.js)'); return ''; }
    return BI().bild(name, gr + 'mm');
  }
  // Mögliche Plätze (1-basiert) einer Karte über alle gültigen Reihenfolgen
  function plaetze(r, id) {
    const s = new Set(r.loesung.loesungen.map((l) => l.indexOf(id) + 1));
    return Array.from(s).sort((a, b) => a - b);
  }
  function platzText(r, id) {
    const p = plaetze(r, id);
    if (p.length === 1) return String(p[0]);
    if (p.length === r.karten.length) return 'überall';
    if (p.length === 2) return p[0] + ' oder ' + p[1];
    const zusammen = p.every((x, i) => i === 0 || x === p[i - 1] + 1);
    return zusammen ? p[0] + ' bis ' + p[p.length - 1] : p.slice(0, -1).join(', ') + ' oder ' + p[p.length - 1];
  }
  // a vor b in jeder / keiner / manchen Reihenfolge(n)?
  function beziehung(r, a, b) {
    const L = r.loesung.loesungen;
    const vorne = L.filter((l) => l.indexOf(a) < l.indexOf(b)).length;
    if (vorne === L.length) return 'a';
    if (vorne === 0) return 'b';
    return 'egal';
  }
  function reiheVon(el, r) {
    const roh = el.getAttribute('reihe');
    const ids = roh ? roh.split(/[\s,]+/).filter(Boolean) : (r.gemischt || r.karten.map((k) => k.id));
    const alle = r.karten.map((k) => k.id);
    if (ids.length !== alle.length || alle.some((id) => !ids.includes(id))) {
      H().fehler(el, 'reihe muss jede Karte genau einmal enthalten (' + alle.join(', ') + ')');
      return null;
    }
    return ids;
  }
  const KREUZ = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M18 18 L82 82 M82 18 L18 82" fill="none" stroke="#d1335b" stroke-width="16" stroke-linecap="round"/></svg>';
  // Karten ohne Bild (zum Selbermalen) bekommen ein leeres, gestricheltes Feld
  function leerBild(gr) { return '<span class="e03-leer-bild" style="width:' + gr + 'mm;height:' + gr + 'mm;display:block"></span>'; }
  function karteBild(el, k, gr) { return k.bild ? bildHTML(el, k.bild, gr) : leerBild(gr); }
  function karteHTML(el, k, gr, extraCls) {
    return '<span class="e03-karte' + (extraCls ? ' ' + extraCls : '') + '">' + karteBild(el, k, gr) +
      '<span class="e03-text">' + H().esc(k.text) + '</span></span>';
  }

  // ---------------------------------------------------------------------
  // <m-ablaufbild name="brot" gr="20">
  // ---------------------------------------------------------------------
  B['m-ablaufbild'] = function (el) {
    stil();
    const gr = parseFloat(el.getAttribute('gr') || '20');
    const html = bildHTML(el, el.getAttribute('name'), gr);
    if (!html) return;
    el.innerHTML = html;
    el.classList.add('komp');
  };

  // ---------------------------------------------------------------------
  // <m-ablaufkarte raetsel="e3-jause" karte="brot" band="Jause" farbe="gelb" [gr="23"]>
  // ---------------------------------------------------------------------
  B['m-ablaufkarte'] = function (el) {
    stil();
    const gr = parseFloat(el.getAttribute('gr') || '23');
    const farbe = el.getAttribute('farbe') || 'gelb';
    if (!/^(gelb|blau|gruen|lila)$/.test(farbe)) return H().fehler(el, 'farbe: gelb, blau, gruen oder lila');
    const band = H().esc(el.getAttribute('band') || '');
    let bild = '', text = '', pos = '';
    if (el.hasAttribute('leer')) {
      text = el.getAttribute('text') || '';
      bild = leerBild(gr);
      pos = el.getAttribute('loesung') || '';
    } else {
      const r = ablaufVon(el);
      if (!r) return;
      const k = karteVon(el, r, el.getAttribute('karte'));
      if (!k) return;
      text = k.text;
      bild = karteBild(el, k, gr);
      pos = platzText(r, k.id);
      el.classList.add('geprueft');
    }
    el.innerHTML = '<span class="e03-sk e03-f-' + farbe + '"><span class="e03-band"><span>' + band + '</span>' +
      (pos ? '<span class="e03-pos">' + H().esc(pos) + '</span>' : '') + '</span>' +
      '<span class="e03-bild">' + bild + '</span><span class="e03-text">' + H().esc(text) + '</span></span>';
    el.classList.add('komp');
  };

  // ---------------------------------------------------------------------
  // <m-ablauf raetsel="…" [modus="nummern|falsch"] [reihe="…"] [tausch="3,4"] [gr] [breite] [abstand]>
  // ---------------------------------------------------------------------
  B['m-ablauf'] = function (el) {
    stil();
    const h = H();
    const r = ablaufVon(el);
    if (!r) return;
    const reihe = reiheVon(el, r);
    if (!reihe) return;
    const gr = parseFloat(el.getAttribute('gr') || '24');
    const breite = parseFloat(el.getAttribute('breite') || '32');
    const abstand = parseFloat(el.getAttribute('abstand') || '4');
    const modus = el.getAttribute('modus') || 'nummern';
    const L = r.loesung;
    const ok = K().pruefeReihenfolge(r.regeln || [], reihe).ok;
    let html = '<span class="e03-reihe" style="--b:' + breite + 'mm;--abst:' + abstand + 'mm">';
    let lsg = '';
    if (modus === 'nummern') {
      if (ok) h.fehler(el, 'Die gezeigte Reihenfolge ist schon richtig – bitte mischen (reihe="…")');
      const beispiel = L.beispiel;
      reihe.forEach((id) => {
        const k = karteVon(el, r, id);
        if (!k) return;
        html += '<span class="e03-spalte">' + karteHTML(el, k, gr) +
          '<span class="e03-box">' + '<span class="lsg">' + (beispiel.indexOf(id) + 1) + '</span></span></span>';
      });
      if (!L.eindeutig) {
        const egal = L.egal.map(([a, b]) => r.karten.find((k) => k.id === a).text + ' und ' + r.karten.find((k) => k.id === b).text);
        lsg = L.anzahl + ' Reihenfolgen sind richtig, das ist eine davon. Egal ist: ' + egal.join('; ') + '.';
      }
    } else if (modus === 'falsch') {
      if (ok) return h.fehler(el, 'modus="falsch": Die gezeigte Reihenfolge ist richtig, es gibt nichts zu finden');
      // Alle Tausche von zwei Karten, die die Reihenfolge reparieren
      const tausche = [];
      for (let i = 0; i < reihe.length; i++) for (let j = i + 1; j < reihe.length; j++) {
        const neu = reihe.slice();
        [neu[i], neu[j]] = [neu[j], neu[i]];
        if (K().pruefeReihenfolge(r.regeln || [], neu).ok) tausche.push([i + 1, j + 1]);
      }
      if (tausche.length === 0) return h.fehler(el, 'modus="falsch": Kein einzelner Tausch von zwei Karten repariert die Reihenfolge');
      if (tausche.length > 1 && !el.hasAttribute('mehrere')) return h.fehler(el, 'modus="falsch": ' + tausche.length + ' verschiedene Tausche reparieren die Reihenfolge (' + tausche.map((t) => t.join(' und ')).join('; ') + '). Reihe ändern oder mehrere setzen');
      const t = tausche[0];
      const soll = el.getAttribute('tausch');
      if (soll && soll.split(/[\s,]+/).map(Number).join(',') !== t.join(',')) h.fehler(el, 'tausch="' + soll + '", aber der Löser sagt: Karte ' + t[0] + ' und ' + t[1]);
      reihe.forEach((id, i) => {
        const k = karteVon(el, r, id);
        if (!k) return;
        const markiert = t.includes(i + 1);
        html += '<span class="e03-spalte' + (markiert ? ' e03-tausch' : '') + '"><span class="e03-nr">' + (i + 1) + '</span>' + karteHTML(el, k, gr) + '</span>';
      });
      lsg = 'Karte ' + t[0] + ' und Karte ' + t[1] + ' tauschen.';
    } else return h.fehler(el, 'modus: nummern oder falsch');
    html += '</span>';
    if (lsg) html += '<span class="e03-lsg">' + h.esc(lsg) + '</span>';
    el.innerHTML = html;
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  // <m-ablaufpaar raetsel="…" a="socken" b="hose" [l="a|b|egal"] [ohne-egal] [gr] [breite]>
  // ---------------------------------------------------------------------
  B['m-ablaufpaar'] = function (el) {
    stil();
    const h = H();
    const r = ablaufVon(el);
    if (!r) return;
    const a = karteVon(el, r, el.getAttribute('a'));
    const b = karteVon(el, r, el.getAttribute('b'));
    if (!a || !b) return;
    if (a.id === b.id) return h.fehler(el, 'a und b sind dieselbe Karte');
    const gr = parseFloat(el.getAttribute('gr') || '20');
    const breite = parseFloat(el.getAttribute('breite') || '28');
    const w = beziehung(r, a.id, b.id);
    const soll = el.getAttribute('l');
    if (soll && soll !== w) h.fehler(el, 'l="' + soll + '", aber der Löser sagt: ' + (w === 'egal' ? 'egal' : (w === 'a' ? a.id : b.id) + ' zuerst'));
    const ohneEgal = el.hasAttribute('ohne-egal');
    if (ohneEgal && w === 'egal') return h.fehler(el, 'ohne-egal gesetzt, aber die Reihenfolge von ' + a.id + ' und ' + b.id + ' ist egal');
    const kreuz = (ja) => '<span class="e03-kreuz">' + (ja ? '<span class="lsg" style="display:flex">' + KREUZ + '</span>' : '') + '</span>';
    if (el.hasAttribute('zeile')) {
      // Kompakt in einer Zeile: [Bild Wort] [ ]   egal [ ]   [Bild Wort] [ ]   (Wort = erstes Wort der Karte)
      const wort = (k) => h.esc(k.text.split(' ')[0]);
      const pk = (k) => '<span class="e03-pkarte">' + karteBild(el, k, gr) + '<span class="e03-wort">' + wort(k) + '</span></span>';
      el.innerHTML = '<span class="e03-pzeile" style="--b:' + breite + 'mm">' + pk(a) + kreuz(w === 'a') +
        '<span class="e03-pmitte">' + (ohneEgal ? '' : '<span>egal</span>' + kreuz(w === 'egal')) + '</span>' +
        pk(b) + kreuz(w === 'b') + '</span>';
      el.classList.add('komp', 'geprueft');
      return;
    }
    let html = '<span class="e03-paar" style="--b:' + breite + 'mm">' +
      '<span style="grid-row:1;grid-column:1">' + karteHTML(el, a, gr) + '</span>' +
      (ohneEgal ? '<span class="e03-mitte"></span>' : '<span class="e03-mitte"><span>egal</span>' + kreuz(w === 'egal') + '</span>') +
      '<span style="grid-row:1;grid-column:3">' + karteHTML(el, b, gr) + '</span>' +
      '<span style="grid-row:2;grid-column:1">' + kreuz(w === 'a') + '</span>' +
      '<span style="grid-row:2;grid-column:3">' + kreuz(w === 'b') + '</span></span>';
    el.innerHTML = html;
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  // <m-ablaufanzahl raetsel="…" [l="6"]>  Antwortfeld mit der Zahl der Reihenfolgen
  // ---------------------------------------------------------------------
  B['m-ablaufanzahl'] = function (el) {
    const h = H();
    const r = ablaufVon(el);
    if (!r) return;
    const n = r.loesung.anzahl;
    if (el.hasAttribute('l') && +el.getAttribute('l') !== n) h.fehler(el, 'l="' + el.getAttribute('l') + '", aber der Löser zählt ' + n + ' Reihenfolgen');
    el.innerHTML = h.feldHTML(String(n), h.feldArt(n));
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  // <m-ablaufzuerst raetsel="…" zuerst="schuhe" dann="socken" l="Schuhe">  Antwortfeld (Wort)
  // ---------------------------------------------------------------------
  B['m-ablaufzuerst'] = function (el) {
    const h = H();
    const r = ablaufVon(el);
    if (!r) return;
    const a = karteVon(el, r, el.getAttribute('zuerst'));
    const b = karteVon(el, r, el.getAttribute('dann'));
    if (!a || !b) return;
    const w = beziehung(r, a.id, b.id);
    if (w !== 'a') return h.fehler(el, a.id + ' kommt nicht in jeder Reihenfolge vor ' + b.id + ' (Löser: ' + (w === 'egal' ? 'egal' : b.id + ' zuerst') + ')');
    const l = el.getAttribute('l');
    if (!l) return h.fehler(el, 'l="…" (das Wort für die Lösung) fehlt');
    el.innerHTML = h.feldHTML(l, 'text');
    el.classList.add('komp', 'geprueft');
  };
})();
