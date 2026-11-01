/* =====================================================================
   Bausteine für Einheit 8 „Bilder aus Kästchen“ (Kästchenbilder, Kästchen-Code)
   Logik und Zeichnung der Kästchen: web/kern/kaestchen.js (dieselbe wie in der App).
   Alle Lösungen kommen vom Löser (werkzeuge/arten/kaestchen.mjs → r.loesung).

     <m-e8-bild raetsel="e8-a1" [zelle="10"] [zeige] [nur-bild] [nur-loesung] [ohne-nr]>
         Kästchenbild auf echten 1-cm-Kästchen, links neben jeder Zeile ihr Kästchen-Code.
         malen:     Code links, leere Kästchen rechts. Lösung: das Bild.
         schreiben: leere Code-Teile links (Zahl schreiben, Kästchen anmalen), Bild rechts.
                    Lösung: der Code (rot).
         kobold:    Code mit Kobold-Zeile, leere Kästchen. Lösung: das gemalte Bild mit Fehler,
                    die Nummer der Kobold-Zeile rot eingekreist.
         kuerzer, zaehlen: das fertige Bild mit seinem langen Code (Zeilen im Ausschnitt markiert).
         zeige: Bild auch außerhalb der Lösung gemalt; nur-bild: ohne Code;
         nur-loesung: nur in der Lösungsansicht sichtbar (für Knobel-Antworten)
     <m-e8-code code="3w 2s 3w" | raetsel="…" teil="reparatur|zeile:3|kurz" [leer] [klein]>
         Kästchen-Code einer Zeile als Teile (Zahl und Farb-Kästchen); leer: zum Ausfüllen
     <m-e8-kasten raetsel="e8-z1">   leerer Zauber-Kasten für Zeilen („_-mal“ und leere Teile)
     <m-e8-zahlen raetsel="…" teil="lang|kurz|zeilen|spalten|kuerzester|zeile">  Antwortfeld mit einer Zahl
     <m-e8-text raetsel="…" [zeile="3"] [teil="kaputt|richtig|reparatur"] [code="…"]>
         Code in Worten für die Anleitung: „1 weiß, 4 schwarz, 1 weiß“
     <m-e8-mini raetsel="…" [zelle="3.5"] [spalten]>  kleines Bild und Code in Worten (Anleitung)
     <m-e8-brett b="6" h="6" feld="20">   Muggelstein-Brett mit großen Feldern
     <m-e8-gitter b="6" h="6">           leere 1-cm-Kästchen mit Zeilennummern
   Beschreibung: vorlagen/AUTOREN-LEITFADEN.md
   ===================================================================== */
(function () {
  'use strict';
  const B = (window.__bausteine = window.__bausteine || {});
  const H = () => window.__hilfen;
  const KK = () => window.WerkstattKaestchen;
  const istLoesung = (el) => !!el.closest('.loesungsmodus');

  const CSS = `
m-e8-bild, m-e8-brett, m-e8-gitter { display: inline-block; vertical-align: top; line-height: 1; }
m-e8-mini { display: block; line-height: 1; }
m-e8-code, m-e8-kasten { display: inline-block; vertical-align: middle; line-height: 1; }
m-e8-zahlen, m-e8-text { display: inline; }
m-e8-bild svg, m-e8-brett svg, m-e8-gitter svg, m-e8-mini svg { display: block; }
.e08-block { display: inline-flex; align-items: flex-start; gap: 5mm; }
.e08-links { display: flex; flex-direction: column; padding-top: 0.5mm; }
.e08-zeile { height: var(--z); display: flex; align-items: center; gap: 2.5mm; }
.e08-nr { font-family: var(--text); font-weight: 800; font-size: 14pt; color: var(--grau); width: 6.5mm; height: 7mm; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; flex: none; line-height: 1; }
.loesungsmodus .e08-nr.e08-kreis { border: 0.7mm solid var(--rot); color: var(--rot); }
.e08-code { display: inline-flex; align-items: center; gap: 1.5mm; font-family: var(--kind); line-height: 1; }
.e08-t { display: inline-flex; align-items: center; gap: 0.7mm; border: 0.35mm solid #c9ccdc; border-radius: 1.6mm; background: white; padding: 0.5mm 0.8mm 0.5mm 1mm; height: 7.6mm; box-sizing: border-box; }
.e08-n { font-size: 16pt; font-weight: 700; min-width: 3.2mm; text-align: center; }
.e08-q { width: 4.9mm; height: 4.9mm; display: inline-flex; flex: none; }
.e08-q svg { width: 100%; height: 100%; display: block; }
.e08-leer .e08-t { border: none; padding: 0; background: transparent; height: auto; gap: 0.8mm; }
.e08-leer .e08-n { width: 8mm; height: 8.4mm; border: 0.5mm solid var(--tinte); border-radius: 1.2mm; background: white; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; }
.e08-leer .e08-q { width: 6mm; height: 6mm; position: relative; }
.e08-leer .e08-q .e08-ql { position: absolute; inset: 0; visibility: hidden; }
.loesungsmodus .e08-leer .e08-q .e08-ql { visibility: visible; }
.e08-leer .e08-code { gap: 2.4mm; }
.e08-kz { display: inline-flex; align-items: center; gap: 1.4mm; border: 0.6mm solid var(--zauber); background: var(--zauber-hell); border-radius: 2.2mm; padding: 0.4mm 1.4mm 0.4mm 1.4mm; }
.e08-mal { font-family: var(--kind); font-weight: 700; font-size: 14pt; color: var(--zauber); white-space: nowrap; display: inline-flex; align-items: center; gap: 0.8mm; }
.e08-mal .feld { height: 8mm; min-width: 8mm; width: 8mm; font-size: 16pt; margin: 0; }
.e08-zk { display: flex; align-items: stretch; gap: 2.5mm; }
.e08-zk-nrs { display: flex; flex-direction: column; }
.e08-zk-nrs .e08-nr { height: var(--z); }
.e08-zk-rahmen { display: flex; flex-direction: column; justify-content: center; gap: 1.6mm; border: 0.8mm solid var(--zauber); background: var(--zauber-hell); border-radius: 3mm; padding: 1.4mm 2.2mm; margin: 0.6mm 0; box-sizing: border-box; }
.e08-zk-rahmen .e08-mal { font-size: 16pt; }
.e08-kasten-form { display: inline-flex; align-items: center; gap: 2.5mm; border: 0.8mm solid var(--zauber); background: var(--zauber-hell); border-radius: 3mm; padding: 2mm 3mm; }
.e08-ausschnitt .e08-t { border-color: var(--zauber); border-width: 0.5mm; }
.e08-klein .e08-t { height: 6.8mm; padding: 0.4mm 0.8mm; }
.e08-klein .e08-n { font-size: 14pt; }
.e08-klein .e08-q { width: 4.4mm; height: 4.4mm; }
.e08-nurzahlen .e08-t { padding: 0.6mm 1.6mm; }
.e08-mini { display: flex; align-items: flex-start; gap: 3.5mm; font-family: var(--text); font-size: 9.5pt; line-height: 1.25; }
.e08-mini ol, .e08-mini ul { margin: 0; padding-left: 5.5mm; }
.e08-mini li { margin: 0 0 0.2mm 0; }
.e08-mini > span:last-child { flex: 1; min-width: 0; }
.e08-mini .e08-titel { font-weight: 800; margin: 0 0 0.8mm 0; }
.e08-unsichtbar { visibility: hidden; }
`;
  function stil() {
    if (document.getElementById('e08-stil')) return;
    const st = document.createElement('style');
    st.id = 'e08-stil';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  // ---------------------------------------------------------------------
  // Hilfen
  // ---------------------------------------------------------------------
  function raetselVon(el, arten) {
    const id = el.getAttribute('raetsel');
    if (!id) { H().fehler(el, 'raetsel="…" fehlt'); return null; }
    const r = H().DATEN.raetsel[id];
    if (!r) { H().fehler(el, 'Rätsel „' + id + '“ gibt es nicht in raetsel/*.json'); return null; }
    if (r.art !== 'kaestchen') { H().fehler(el, 'Rätsel „' + id + '“ ist kein Kästchen-Rätsel (art: ' + r.art + ')'); return null; }
    if (arten && !arten.includes(r.aufgabe)) { H().fehler(el, 'Rätsel „' + id + '“ hat aufgabe „' + r.aufgabe + '“, hier geht ' + arten.join(' oder ')); return null; }
    if (!r.loesung) { H().fehler(el, 'Rätsel „' + id + '“ hat keine Lösung (Löser-Fehler?)'); return null; }
    return r;
  }
  const quadrat = (f) => '<span class="e08-q">' + KK().farbSVG(f) + '</span>';
  // Ein Teil „3 weiß“ (gegeben) oder leer zum Ausfüllen (Lösung rot)
  function teilHTML(t, leer, nurZahl) {
    if (!leer) return '<span class="e08-t"><span class="e08-n">' + t.n + '</span>' + (nurZahl ? '' : quadrat(t.f)) + '</span>';
    return '<span class="e08-t"><span class="e08-n"><span class="lsg">' + t.n + '</span></span>' +
      '<span class="e08-q">' + KK().farbSVG('w') + '<span class="e08-ql">' + KK().farbSVG(t.f, { rand: KK().ROT, dick: 10 }) + '</span></span></span>';
  }
  function malHTML(w, leer) {
    return '<span class="e08-mal">' + (leer ? H().feldHTML(String(w), 'k') : w) + '-mal</span>';
  }
  // Code einer Zeile: Teile und Zauber-Kästen in der Zeile
  function zeileHTML(z, leer, nurZahl) {
    const teile = KK().liesZeile(z).teile.map((t) => {
      if (!t.wdh) return teilHTML(t, leer, nurZahl);
      return '<span class="e08-kz">' + malHTML(t.wdh, leer) + '<span class="e08-code">' + t.teile.map((u) => teilHTML(u, leer)).join('') + '</span></span>';
    });
    return '<span class="e08-code">' + teile.join('') + '</span>';
  }
  function nrHTML(n, kreis) { return '<span class="e08-nr' + (kreis ? ' e08-kreis' : '') + '">' + n + '</span>'; }

  // Linke Spalte: Nummer und Code jeder Zeile; Zeilen-Kästen über mehrere Zeilen
  function linksHTML(code, opt) {
    const o = opt || {};
    let nr = 1;
    let html = '';
    for (const e of KK().liesCode(code)) {
      if (KK().istKasten(e)) {
        const n = e.wdh * e.zeilen.length;
        let nrs = '';
        for (let i = 0; i < n; i++) nrs += o.ohneNr ? '' : nrHTML(nr + i, false);
        html += '<div class="e08-zk" style="height:calc(var(--z) * ' + n + ')">' + (o.ohneNr ? '' : '<span class="e08-zk-nrs">' + nrs + '</span>') +
          '<span class="e08-zk-rahmen">' + malHTML(e.wdh, false) + e.zeilen.map((z) => zeileHTML(z, false)).join('') + '</span></div>';
        nr += n;
      } else {
        const aus = o.ausschnitt && nr >= o.ausschnitt[0] && nr <= o.ausschnitt[1];
        html += '<div class="e08-zeile' + (aus ? ' e08-ausschnitt' : '') + '">' + (o.ohneNr ? '' : nrHTML(nr, o.kreis === nr)) + zeileHTML(e, o.leer, o.nurZahl) + '</div>';
        nr++;
      }
    }
    return html;
  }
  function gitterSVG(bild, zeigen, extra) {
    return KK().bildSVG(bild, Object.assign({ zeigen, einheit: 'mm' }, extra || {}));
  }

  // ---------------------------------------------------------------------
  // <m-e8-bild raetsel="…">
  // ---------------------------------------------------------------------
  B['m-e8-bild'] = function (el) {
    stil();
    const r = raetselVon(el);
    if (!r) return;
    const L = r.loesung;
    const lsg = istLoesung(el);
    const z = parseFloat(el.getAttribute('zelle') || '10');
    if (z !== 10 && !el.closest('.anleitung, .spick')) return H().fehler(el, 'Auf den Blättern sind Kästchenbilder echte 1-cm-Kästchen (zelle="10")');
    if (z !== 10 && !el.hasAttribute('nur-bild')) return H().fehler(el, 'zelle="' + z + '" nur mit nur-bild (der Code braucht 1-cm-Zeilen)');
    if (el.hasAttribute('nur-loesung') && !lsg) { el.innerHTML = ''; el.classList.add('komp'); return; }
    const nurBild = el.hasAttribute('nur-bild');
    // nur das Bild (ohne Code): das ist immer das fertige Bild
    const zeige = el.hasAttribute('zeige') || lsg || nurBild;
    const ohneNr = el.hasAttribute('ohne-nr');
    let links = '', svg = '';
    try {
      if (r.aufgabe === 'malen') {
        if (r.richtung === 'spalten' && !nurBild) return H().fehler(el, 'Spalten-Code: nur mit nur-bild (den Code im Text nennen)');
        if (r.format === 'zahlen') {
          links = r.code.map((t, i) => '<div class="e08-zeile e08-nurzahlen">' + (ohneNr ? '' : nrHTML(i + 1)) + '<span class="e08-code">' +
            String(t).trim().split(/\s+/).map((n) => '<span class="e08-t"><span class="e08-n">' + n + '</span></span>').join('') + '</span></div>').join('');
        } else links = linksHTML(r.code, { ohneNr });
        svg = gitterSVG(L.bild, zeige);
      } else if (r.aufgabe === 'schreiben') {
        links = linksHTML(L.code, { leer: true, ohneNr });
        svg = gitterSVG(L.bild, true);
      } else if (r.aufgabe === 'kobold') {
        links = linksHTML(r.code, { ohneNr, kreis: L.zeile });
        if (el.hasAttribute('soll')) svg = gitterSVG(L.bild, true);
        else svg = zeige ? gitterSVG(L.gemalt, true, { b: L.b, ueber: true, rot: lsg ? [L.zeile - 1] : null }) : gitterSVG(null, false, { b: L.b, h: L.h });
      } else if (r.aufgabe === 'kuerzer') {
        links = linksHTML(L.lang, { ohneNr, ausschnitt: L.zeilen });
        svg = gitterSVG(L.bild, true);
      } else {
        links = linksHTML(L.codeZeilen, { ohneNr });
        svg = gitterSVG(L.bild, true);
      }
    } catch (e) { return H().fehler(el, e.message); }
    if (z !== 10) svg = svg.replace(/width="([\d.]+)mm" height="([\d.]+)mm"/, (m, w, h) => 'width="' + (w * z / 10).toFixed(2) + 'mm" height="' + (h * z / 10).toFixed(2) + 'mm"');
    el.innerHTML = nurBild ? svg : '<div class="e08-block" style="--z:' + z + 'mm"><div class="e08-links' + (r.aufgabe === 'schreiben' ? ' e08-leer' : '') + '">' + links + '</div>' + svg + '</div>';
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  // <m-e8-code code="3w 2s 3w"> oder <m-e8-code raetsel="…" teil="reparatur|richtig|kaputt|zeile:3|kurz" [leer] [klein]>
  // ---------------------------------------------------------------------
  B['m-e8-code'] = function (el) {
    stil();
    let zeile;
    const leer = el.hasAttribute('leer');
    try {
      if (el.hasAttribute('code')) zeile = el.getAttribute('code');
      else {
        const r = raetselVon(el);
        if (!r) return;
        const L = r.loesung;
        const teil = el.getAttribute('teil') || '';
        if (teil === 'reparatur' || teil === 'richtig' || teil === 'kaputt') {
          if (r.aufgabe !== 'kobold') return H().fehler(el, 'teil="' + teil + '" nur bei kobold');
          zeile = L[teil];
        } else if (/^zeile:\d+$/.test(teil)) {
          const n = parseInt(teil.slice(6), 10);
          const liste = r.aufgabe === 'malen' ? KK().zeilenListe(r.code).map((x) => KK().zeileText(x.zeile)) : (L.code || L.lang || L.codeZeilen);
          if (!liste[n - 1]) return H().fehler(el, 'Zeile ' + n + ' gibt es nicht');
          zeile = liste[n - 1];
        } else return H().fehler(el, 'teil="reparatur|richtig|kaputt|zeile:N" oder code="…"');
      }
      el.innerHTML = '<span class="' + (leer ? 'e08-leer' : '') + (el.hasAttribute('klein') ? ' e08-klein' : '') + '">' + zeileHTML(zeile, leer) + '</span>';
    } catch (e) { return H().fehler(el, e.message); }
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  // <m-e8-kasten raetsel="e8-z1">  leerer Zeilen-Kasten zum Ausfüllen (aus r.kurz, genau ein Kasten)
  // ---------------------------------------------------------------------
  B['m-e8-kasten'] = function (el) {
    stil();
    const r = raetselVon(el, ['kuerzer']);
    if (!r) return;
    let e;
    try {
      const k = KK().liesCode(r.kurz);
      if (k.length !== 1 || !KK().istKasten(k[0]) || k[0].zeilen.length !== 1) return H().fehler(el, 'm-e8-kasten: kurz muss genau ein Zeilen-Kasten mit einer Zeile sein');
      e = k[0];
    } catch (x) { return H().fehler(el, x.message); }
    el.innerHTML = '<span class="e08-kasten-form e08-leer">' + malHTML(e.wdh, true) + zeileHTML(e.zeilen[0], true) + '</span>';
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  // <m-e8-zahlen raetsel="…" teil="lang|kurz|zeilen|spalten|kuerzester|zeile|zahlen" [l="…"]>
  // ---------------------------------------------------------------------
  B['m-e8-zahlen'] = function (el) {
    const r = raetselVon(el);
    if (!r) return;
    const L = r.loesung;
    const teil = el.getAttribute('teil') || 'zahlen';
    const werte = {
      lang: L.zahlenLang, kurz: L.zahlenKurz, zeilen: L.zeilen && typeof L.zeilen === 'number' ? L.zeilen : undefined,
      spalten: typeof L.spalten === 'number' ? L.spalten : (L.spalten && L.spalten.zahlen),
      kuerzester: L.kuerzester && L.kuerzester.zahlen, zeile: L.zeile, zahlen: L.zahlen,
    };
    const n = werte[teil];
    if (n === undefined || n === null) return H().fehler(el, 'teil="' + teil + '" gibt es bei aufgabe „' + r.aufgabe + '“ nicht');
    if (el.hasAttribute('l') && +el.getAttribute('l') !== n) return H().fehler(el, 'l="' + el.getAttribute('l') + '", aber der Löser sagt ' + n);
    if (el.hasAttribute('nur-zahl')) el.textContent = String(n);
    else el.innerHTML = H().feldHTML(String(n), n >= 10 ? '' : 'k');
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  // <m-e8-text raetsel="…" zeile="3" | teil="kaputt|richtig|reparatur"> oder <m-e8-text code="3[1s 1w] 1s">
  // ---------------------------------------------------------------------
  B['m-e8-text'] = function (el) {
    let z;
    try {
      if (el.hasAttribute('code')) z = el.getAttribute('code');
      else {
        const r = raetselVon(el);
        if (!r) return;
        const L = r.loesung;
        const teil = el.getAttribute('teil');
        if (teil) {
          if (Array.isArray(L[teil]) && L[teil].length === 1 && !/[{}]/.test(L[teil][0])) z = L[teil][0];
          else if (typeof L[teil] === 'string') z = L[teil];
          else return H().fehler(el, 'teil="' + teil + '" gibt es hier nicht (oder hat mehr als eine Zeile)');
        } else {
          const n = parseInt(el.getAttribute('zeile') || '0', 10);
          const liste = r.aufgabe === 'malen' ? KK().zeilenListe(r.code).map((x) => KK().zeileText(x.zeile)) : (L.code || L.lang || L.codeZeilen);
          if (!liste || !liste[n - 1]) return H().fehler(el, 'zeile="' + n + '" gibt es nicht');
          z = liste[n - 1];
        }
      }
      el.textContent = KK().zeileWorte(z);
    } catch (e) { return H().fehler(el, e.message); }
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  // <m-e8-mini raetsel="…" [zelle="3.5"] [ohne-titel]>  kleines Bild + Code in Worten (für die Anleitung)
  // ---------------------------------------------------------------------
  B['m-e8-mini'] = function (el) {
    stil();
    if (!el.closest('.anleitung, .spick')) return H().fehler(el, 'm-e8-mini nur in der Anleitung (auf Blättern echte 1-cm-Kästchen: m-e8-bild)');
    const r = raetselVon(el);
    if (!r) return;
    const L = r.loesung;
    const z = parseFloat(el.getAttribute('zelle') || '3.5');
    const bild = L.bild;
    let zeilen;
    try {
      // Zahl und Farbe bleiben zusammen (kein Umbruch zwischen „1“ und „schwarz“)
      const W = (z) => H().esc(KK().zeileWorte(z)).replace(/(\d) /g, '$1\u00a0').replace(/-mal: /g, '-mal:\u00a0');
      if (r.aufgabe === 'malen' && r.format === 'zahlen') zeilen = r.code.map((t) => H().esc(t));
      else if (r.aufgabe === 'malen') zeilen = KK().liesCode(r.code).map((e) => (KK().istKasten(e) ? e.wdh + '-mal die Zeile: ' + e.zeilen.map(W).join(' / ') : W(e)));
      else if (r.aufgabe === 'kobold') zeilen = r.code.map(W);
      else if (el.hasAttribute('kurz') && L.kurz) zeilen = L.kurz.map((c) => { const e = KK().liesEintrag(c); return KK().istKasten(e) ? e.wdh + '-mal die Zeile' + (e.zeilen.length > 1 ? 'n' : '') + ': ' + e.zeilen.map(W).join(' / ') : W(e); });
      else zeilen = (L.code || L.codeZeilen || L.lang).map(W);
    } catch (e) { return H().fehler(el, e.message); }
    const svg = KK().bildSVG(bild, { zeigen: true }).replace('<svg ', '<svg width="' + (bild[0].length * z + 1).toFixed(1) + 'mm" ');
    const titel = el.hasAttribute('ohne-titel') ? '' : '<p class="e08-titel">' + H().esc(r.titel || '') + '</p>';
    const liste = el.hasAttribute('kurz') ? '<ul>' + zeilen.map((t) => '<li>' + t + '</li>').join('') + '</ul>' : '<ol>' + zeilen.map((t) => '<li>' + t + '</li>').join('') + '</ol>';
    el.innerHTML = '<span class="e08-mini">' + svg + '<span>' + titel + liste + '</span></span>';
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  // <m-e8-brett b="6" h="6" feld="20" [loesung="e8-q2"]>  Muggelstein-Brett: große Felder, Zeilennummern links
  //   loesung: in der Lösungsansicht liegen rote Steine auf den schwarzen Kästchen dieses Rätsels
  // ---------------------------------------------------------------------
  B['m-e8-brett'] = function (el) {
    const b = parseInt(el.getAttribute('b') || '6', 10), h = parseInt(el.getAttribute('h') || '6', 10);
    const f = parseFloat(el.getAttribute('feld') || '20');
    if (f < 18) return H().fehler(el, 'Felder für Muggelsteine mindestens 18 mm');
    let steine = null;
    if (el.hasAttribute('loesung')) {
      const r = H().DATEN.raetsel[el.getAttribute('loesung')];
      if (!r || r.art !== 'kaestchen' || !r.loesung || !r.loesung.bild) return H().fehler(el, 'loesung="…" muss ein gelöstes Kästchen-Rätsel sein');
      const bild = KK().liesBild(r.loesung.bild);
      if (bild.length !== h || bild[0].length !== b) return H().fehler(el, 'Das Lösungsbild hat nicht ' + b + ' · ' + h + ' Kästchen');
      if (istLoesung(el)) steine = bild;
    }
    const links = 9, W = links + b * f + 1, Hh = h * f + 1;
    let s = '<rect x="' + links + '" y="0.5" width="' + (b * f) + '" height="' + (h * f) + '" rx="2" fill="#fbfcff"/>';
    for (let j = 0; j < h; j++) s += '<text x="' + (links - 4.5) + '" y="' + (0.5 + j * f + f / 2 + 0.3) + '" font-size="6.5" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="#6b6f86" font-family="Nunito, sans-serif">' + (j + 1) + '</text>';
    for (let j = 0; j < h; j++) for (let i = 0; i < b; i++) {
      const stein = steine && steine[j][i] !== 'w';
      s += '<circle cx="' + (links + i * f + f / 2) + '" cy="' + (0.5 + j * f + f / 2) + '" r="' + (f * 0.36) + '"' + (stein ? ' fill="#d1335b" stroke="none"' : ' fill="none" stroke="#dfe2ee" stroke-width="0.35"') + '/>';
    }
    for (let i = 0; i <= b; i++) s += '<line x1="' + (links + i * f) + '" y1="0.5" x2="' + (links + i * f) + '" y2="' + (0.5 + h * f) + '" stroke="#1f2340" stroke-width="' + (i === 0 || i === b ? 0.7 : 0.4) + '"/>';
    for (let j = 0; j <= h; j++) s += '<line x1="' + links + '" y1="' + (0.5 + j * f) + '" x2="' + (links + b * f) + '" y2="' + (0.5 + j * f) + '" stroke="#1f2340" stroke-width="' + (j === 0 || j === h ? 0.7 : 0.4) + '"/>';
    el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + 'mm" height="' + Hh + 'mm" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="Muggelstein-Brett">' + s + '</svg>';
    el.classList.add('komp');
    if (el.hasAttribute('loesung')) el.classList.add('geprueft');
  };

  // ---------------------------------------------------------------------
  // <m-e8-gitter b="6" h="6" [ohne-nr]>  leere 1-cm-Kästchen mit Zeilennummern
  // ---------------------------------------------------------------------
  B['m-e8-gitter'] = function (el) {
    const b = parseInt(el.getAttribute('b') || '6', 10), h = parseInt(el.getAttribute('h') || '6', 10);
    if (!(b >= 1 && b <= 16 && h >= 1 && h <= 20)) return H().fehler(el, 'm-e8-gitter: b 1 bis 16, h 1 bis 20');
    el.innerHTML = KK().bildSVG(null, { b, h, nummern: !el.hasAttribute('ohne-nr'), einheit: 'mm' });
    el.classList.add('komp');
  };
})();
