/* =====================================================================
   Bausteine für Einheit 13 „Ja-Nein-Bäume“ (Rätselart baum)
   Zeichnung und Logik aus web/kern/baum.js (dieselbe Datei wie in der App),
   Lösungen aus dem Löser (werkzeuge/arten/baum.mjs → r.loesung).
     <m-e13-baum raetsel="e13-wesen" modus="leer|voll|frage|kobold" [nummern] [namen] [kurz] [pille="5"]
                 [blatt-b="30"] [blatt-h="26"] [frage-b="42"] [frage-h="15"] [bild="20"] [ebene="26"] [luft="4"]
                 [schrift="4.9"] [name-schrift="4.6"]>
         Der Ja-Nein-Baum als SVG (Maße in mm).
         leer:   Antworten leer (mit nummern: Platz-Nummern). Lösung: Bilder an den Plätzen, rot umrandet.
         voll:   alles sichtbar (auch in der Lösung gleich).
         frage:  eine Frage fehlt („?“). Lösung: die passende Frage in Rot.
         kobold: Lösung: die Frage mit vertauschtem Ja und Nein rot eingekreist.
     <m-e13-reihe raetsel="e13-wesen" reihe="einhorn,fee,…" [gr="17"] [kreis-tiefe="3"]>
         Wesen mit Bild, Name und Antwortfeld „Platz“. Lösung: Platz-Nummer; mit kreis-tiefe
         werden die Wesen rot eingekreist, für die der Baum so viele Fragen braucht.
     <m-e13-weg raetsel="e13-wesen" nr="1">   Antworten als Ja-/Nein-Schilder, Feld mit der Platz-Nummer
         (Lösung: Nummer im Feld, dahinter rot der Name, wer dort wohnt)
     <m-e13-fragen raetsel="e13-wesen" ding="drache" [l="2"]>   Feld: wie viele Fragen bis zu diesem Ding
     <m-e13-optionen raetsel="e13-frage">     Frage-Karten zum Ankreuzen (Lösung: rotes Kreuz)
     <m-e13-landet raetsel="e13-neu">         Feld (Wort): bei wem landet das neue Ding?
     <m-e13-trennen raetsel="e13-neu" [ohne-linie]>  Schreiblinie; Lösung: Beispiele für eine neue Frage
     <m-e13-bild name="einhorn" gr="20">      ein Bild aus web/kern/baum.js
     <m-e13-fragekarte raetsel="e13-drachen" frage="gruen">  Frage-Karte mit Ja- und Nein-Ecke (Bastelvorlage)
     <m-e13-pille seite="ja|nein">            Ja- oder Nein-Schild im Text
     <m-e13-tabelle raetsel="e13-kobold e13-frage" dinge="eule,ente,…" fragen="beine,fliegen,…">
         Merkmals-Tabelle für die Anleitung aus den Rätsel-Daten. Kommt ein Ding in mehreren Rätseln vor,
         müssen die Antworten übereinstimmen (sonst Fehler). Strich: Frage kommt bei diesem Ding nicht vor.
     <m-e13-zahl raetsel="e13-kette" was="summe|max|karten|anzahl|min|tiefe" [ding] [l] [feld]>
         Zahl aus dem Löser im Fließtext der Anleitung (mit l geprüft); mit feld als Antwortfeld
   ===================================================================== */
(function () {
  'use strict';
  const B = (window.__bausteine = window.__bausteine || {});
  const H = () => window.__hilfen;
  const W = () => window.WerkstattBaum;
  const istLoesung = (el) => !!el.closest('.loesungsmodus');

  const CSS = `
m-e13-baum, m-e13-bild, m-e13-pille, m-e13-fragen, m-e13-landet, m-e13-zahl { display: inline-block; vertical-align: middle; line-height: 0; }
m-e13-reihe, m-e13-optionen, m-e13-trennen { display: block; }
m-e13-weg { display: inline-block; vertical-align: middle; }
m-e13-zahl { line-height: inherit; vertical-align: baseline; }
m-e13-baum svg, m-e13-bild svg { display: block; }
.e13-pille { display: inline-flex; align-items: center; justify-content: center; min-width: 11mm; height: 7.5mm; padding: 0 2.5mm; border-radius: 3.75mm;
  color: white; font-family: var(--kind); font-weight: 700; font-size: 14pt; line-height: 1; vertical-align: middle; }
.e13-pille.ja { background: #1f9d55; }
.e13-pille.nein { background: #e8731a; }
.anleitung m-e13-pille .e13-pille, .spick m-e13-pille .e13-pille { height: 4.6mm; min-width: 7mm; padding: 0 1.4mm; font-size: 8.5pt; font-family: var(--text); font-weight: 800; border-radius: 2.3mm; }
.e13-reihe { display: flex; justify-content: space-between; gap: 2mm; }
.e13-wesen { position: relative; display: flex; flex-direction: column; align-items: center; gap: 0.5mm; width: var(--b, 32mm); }
.e13-wz { display: flex; align-items: center; gap: 2mm; }
.e13-wesen .e13-name { font-family: var(--kind); font-size: 14pt; line-height: 1.1; text-align: center; white-space: nowrap; }
.e13-wesen .e13-platz { display: flex; align-items: center; gap: 1.5mm; font-size: 14pt; color: var(--grau); }
.e13-kreis { display: none; }
.loesungsmodus .e13-kreis { display: block; position: absolute; left: -3mm; right: -3mm; top: -2mm; bottom: -2.5mm; border: 0.9mm solid var(--rot); border-radius: 50%; }
.e13-weg { position: relative; display: inline-flex; align-items: center; gap: 2mm; }
.e13-weg .e13-pfeil { width: 6mm; height: 4mm; }
.e13-wer { display: none; }
/* Name nur in der Lösung, unter dem Feld: verschiebt nichts */
.loesungsmodus .e13-wer { display: block; position: absolute; right: 0; top: 100%; margin-top: 0.8mm; white-space: nowrap; color: var(--rot); font-family: var(--kind); font-weight: 700; font-size: 14pt; line-height: 1; }
.e13-optionen { display: flex; flex-direction: column; gap: 3mm; }
.e13-option { display: flex; align-items: center; gap: 3mm; border: 0.6mm solid var(--tinte); border-radius: 2.5mm; background: #fff4cc; padding: 2mm 3mm; font-family: var(--kind); font-weight: 700; font-size: 15pt; line-height: 1.15; }
.e13-kaestchen { flex: none; width: 9mm; height: 9mm; border: 0.6mm solid var(--tinte); border-radius: 1.6mm; background: white; display: flex; align-items: center; justify-content: center; }
.e13-kaestchen svg { width: 7mm; height: 7mm; }
.e13-trennen .e13-linie { border-bottom: 0.4mm solid var(--tinte); height: 10mm; }
.e13-trennen .lsg { display: none; }
.loesungsmodus .e13-trennen .lsg { display: block; font-family: var(--kind); font-size: 13pt; line-height: 1.2; padding-top: 1mm; }
.e13-fk { display: flex; flex-direction: column; justify-content: space-between; width: 100%; height: 100%; padding: 1.8mm 2.8mm 2.2mm 2.8mm; }
.e13-fk-oben { display: flex; align-items: center; justify-content: center; gap: 1.2mm; flex: 1; }
.e13-fk-text { font-family: var(--kind); font-weight: 700; font-size: 14pt; line-height: 1.05; text-align: left; }
.e13-fk-unten { display: flex; justify-content: space-between; }
.e13-fk-unten .e13-pille { height: 5.5mm; min-width: 9mm; font-size: 11pt; padding: 0 2mm; }
`;
  function stil() {
    if (document.getElementById('e13-stil')) return;
    const st = document.createElement('style');
    st.id = 'e13-stil';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  function raetselVon(el, aufgaben) {
    const id = el.getAttribute('raetsel');
    if (!id) { H().fehler(el, 'raetsel="…" fehlt'); return null; }
    const r = H().DATEN.raetsel[id];
    if (!r) { H().fehler(el, 'Rätsel „' + id + '“ gibt es nicht in raetsel/*.json'); return null; }
    if (r.art !== 'baum') { H().fehler(el, 'Rätsel „' + id + '“ ist kein Ja-Nein-Baum (art: ' + r.art + ')'); return null; }
    if (!r.loesung) { H().fehler(el, 'Rätsel „' + id + '“ hat keine Lösung (Löser-Fehler?)'); return null; }
    if (aufgaben && !aufgaben.includes(r.aufgabe)) { H().fehler(el, 'Rätsel „' + id + '“ hat aufgabe ' + r.aufgabe + ', erwartet: ' + aufgaben.join(' oder ')); return null; }
    return r;
  }
  const dingVon = (r, id) => r.dinge.find((d) => d.id === id);
  const zahlAttr = (el, name, def) => (el.hasAttribute(name) ? parseFloat(el.getAttribute(name)) : def);
  const KREUZ = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M18 18 L82 82 M82 18 L18 82" fill="none" stroke="#d1335b" stroke-width="16" stroke-linecap="round"/></svg>';
  const pille = (seite) => '<span class="e13-pille ' + seite + '">' + (seite === 'ja' ? 'Ja' : 'Nein') + '</span>';

  // ---------------------------------------------------------------------
  B['m-e13-baum'] = function (el) {
    stil();
    const r = raetselVon(el);
    if (!r) return;
    const L = istLoesung(el);
    const modus = el.getAttribute('modus') || 'voll';
    const opt = {
      fragen: r.fragen, dinge: r.dinge, nummern: el.hasAttribute('nummern'), namen: el.hasAttribute('namen'), kurz: el.hasAttribute('kurz'),
      blattB: zahlAttr(el, 'blatt-b', 26), blattH: zahlAttr(el, 'blatt-h', 28), frageB: zahlAttr(el, 'frage-b', 42),
      bildGr: zahlAttr(el, 'bild', 18), ebene: zahlAttr(el, 'ebene', 26), luft: zahlAttr(el, 'luft', 4),
      schrift: zahlAttr(el, 'schrift', 4.9), frageH: zahlAttr(el, 'frage-h', 15), nameSchrift: zahlAttr(el, 'name-schrift', 4.6),
    };
    if (el.hasAttribute('pille')) opt.pille = zahlAttr(el, 'pille', 0);
    const baum = r.baum;
    // Auf den Blättern des Kindes: große Felder und jede Schrift im Baum ab 14 pt (4,94 mm): Fragen
    // (auch nach dem Umbrechen), Ja/Nein-Schilder, Platz-Nummern und Namen unter den Bildern
    if (el.closest('.blatt') && !L) {
      const MIN = 4.94;
      const lay = W().layout(baum, opt);
      const zuKlein = [];
      if (opt.blattB < 18 || opt.bildGr < 14) zuKlein.push('Plätze mindestens 18 mm, Bilder mindestens 14 mm');
      if ((opt.pille || opt.schrift * 0.9) < MIN) zuKlein.push('Ja/Nein und Nummern (pille="5")');
      for (const k of lay.fragen) {
        if (k.f === '?') continue;
        const g = W().umbrechen(W().frageText(r.fragen, k.f, opt.kurz), k.b - 3, opt.schrift).gr;
        if (g < MIN) zuKlein.push('Frage „' + k.f + '“ (' + (g / 0.3528).toFixed(1) + ' pt)');
      }
      if (opt.namen) {
        for (const b of lay.blaetter) {
          const d = b.inhalt && dingVon(r, b.inhalt);
          if (!d) continue;
          const g = Math.min(opt.nameSchrift, (opt.blattB - 2) / W().textBreite(d.name, 1));
          if (g < MIN) zuKlein.push('Name „' + d.name + '“ (' + (g / 0.3528).toFixed(1) + ' pt)');
        }
      }
      if (zuKlein.length) return H().fehler(el, 'Auf dem Blatt ist im Baum etwas zu klein (mindestens 14 pt): ' + zuKlein.join(', '));
    }
    if (modus === 'leer') {
      if (!['einsortieren', 'folgen', 'zeigen', 'bauen'].includes(r.aufgabe)) return H().fehler(el, 'modus="leer" passt nicht zu aufgabe ' + r.aufgabe);
      if (L) opt.rot = W().blaetter(baum).map((b) => b.pfad);
      else opt.leer = true;
    } else if (modus === 'frage') {
      if (r.aufgabe !== 'frage') return H().fehler(el, 'modus="frage" braucht aufgabe "frage"');
      if (L) opt.luecke = { text: r.loesung.text, rot: true };
    } else if (modus === 'kobold') {
      if (r.aufgabe !== 'kobold') return H().fehler(el, 'modus="kobold" braucht aufgabe "kobold"');
      if (L) opt.kreis = r.loesung.knoten;
    } else if (modus !== 'voll') return H().fehler(el, 'modus: leer, voll, frage oder kobold');
    let svg;
    try { svg = W().svg(baum, opt); } catch (e) { return H().fehler(el, e.message); }
    el.innerHTML = svg;
    el.dataset.breite = W().layout(baum, opt).breite;
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  B['m-e13-reihe'] = function (el) {
    stil();
    const h = H();
    const r = raetselVon(el, ['einsortieren', 'folgen', 'zeigen']);
    if (!r) return;
    const ids = (el.getAttribute('reihe') || r.dinge.map((d) => d.id).join(',')).split(/[\s,]+/).filter(Boolean);
    const gr = zahlAttr(el, 'gr', 17);
    const kt = el.hasAttribute('kreis-tiefe') ? +el.getAttribute('kreis-tiefe') : null;
    let html = '<div class="e13-reihe">';
    for (const id of ids) {
      const d = dingVon(r, id);
      if (!d) return h.fehler(el, 'Ding „' + id + '“ gibt es nicht');
      const nr = r.loesung.plaetze[id];
      const kreis = kt !== null && r.loesung.tiefen[id] === kt;
      html += '<div class="e13-wesen">' + (kreis ? '<span class="e13-kreis"></span>' : '') + '<span class="e13-wz">' + W().bild(d.bild, gr + 'mm') +
        h.feldHTML(String(nr), 'k') + '</span><span class="e13-name">' + h.esc(d.name) + '</span></div>';
    }
    html += '</div>';
    if (kt !== null && !ids.some((id) => r.loesung.tiefen[id] === kt)) h.fehler(el, 'Kein Ding braucht ' + kt + ' Fragen');
    el.innerHTML = html;
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  B['m-e13-weg'] = function (el) {
    stil();
    const h = H();
    const r = raetselVon(el);
    if (!r) return;
    const nr = +(el.getAttribute('nr') || '1');
    const w = (r.loesung.wege || [])[nr - 1];
    if (!w) return h.fehler(el, 'Weg ' + nr + ' gibt es nicht (wege in ' + r.id + ')');
    const pfeil = '<svg class="e13-pfeil" viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg"><path d="M4 20 H46 M34 8 L50 20 L34 32" fill="none" stroke="#6b6f86" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const wer = dingVon(r, w.ding);
    if (!wer) return h.fehler(el, 'Weg ' + nr + ' endet an keinem Ding');
    el.innerHTML = '<span class="e13-weg">' + w.weg.map(pille).join('') + pfeil + 'Platz ' + h.feldHTML(String(w.nr), 'k') + '<span class="e13-wer">' + h.esc(wer.name) + '</span></span>';
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  B['m-e13-fragen'] = function (el) {
    const h = H();
    const r = raetselVon(el);
    if (!r) return;
    const id = el.getAttribute('ding');
    const n = r.loesung.tiefen && r.loesung.tiefen[id];
    if (n === undefined) return h.fehler(el, 'Ding „' + id + '“ steht nicht im Baum');
    if (el.hasAttribute('l') && +el.getAttribute('l') !== n) return h.fehler(el, 'l="' + el.getAttribute('l') + '", aber der Löser zählt ' + n + ' Fragen');
    el.innerHTML = h.feldHTML(String(n), 'k');
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  B['m-e13-optionen'] = function (el) {
    stil();
    const h = H();
    const r = raetselVon(el, ['frage']);
    if (!r) return;
    const L = istLoesung(el);
    let html = '<div class="e13-optionen">';
    for (const o of r.optionen) {
      html += '<div class="e13-option"><span class="e13-kaestchen">' + (L && o === r.loesung.frage ? KREUZ : '') + '</span><span>' + h.esc(W().frageText(r.fragen, o)) + '</span></div>';
    }
    el.innerHTML = html + '</div>';
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  B['m-e13-landet'] = function (el) {
    const h = H();
    const r = raetselVon(el, ['neu']);
    if (!r) return;
    const d = dingVon(r, r.loesung.landetBei);
    el.innerHTML = h.feldHTML(d.name, 'text');
    el.classList.add('komp', 'geprueft');
  };

  B['m-e13-trennen'] = function (el) {
    stil();
    const h = H();
    const r = raetselVon(el, ['neu']);
    if (!r) return;
    const name = (id) => dingVon(r, id).name;
    const bsp = r.loesung.trennen.slice(0, 3).map((t) => '„' + t.text + '“ (Ja: ' + name(t.ja) + ', Nein: ' + name(t.nein) + ')');
    el.innerHTML = '<div class="e13-trennen">' + (el.hasAttribute('ohne-linie') ? '' : '<div class="e13-linie"></div>') + '<span class="lsg">Mehrere Lösungen möglich, z. B. ' + h.esc(bsp.join(' oder ')) + '</span></div>';
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  B['m-e13-bild'] = function (el) {
    const name = el.getAttribute('name');
    if (!W().hat(name)) return H().fehler(el, 'Unbekanntes Bild „' + name + '“ (web/kern/baum.js)');
    el.innerHTML = W().bild(name, zahlAttr(el, 'gr', 20) + 'mm');
    el.classList.add('komp');
  };

  B['m-e13-pille'] = function (el) {
    stil();
    const s = el.getAttribute('seite');
    if (s !== 'ja' && s !== 'nein') return H().fehler(el, 'seite="ja" oder seite="nein"');
    el.innerHTML = pille(s);
    el.classList.add('komp');
  };

  B['m-e13-fragekarte'] = function (el) {
    stil();
    const h = H();
    const r = raetselVon(el);
    if (!r) return;
    const f = el.getAttribute('frage');
    if (!r.fragen[f]) return h.fehler(el, 'Frage „' + f + '“ gibt es nicht in ' + r.id);
    const zeichen = W().hat('zeichen-' + f) ? '<span style="flex:none;line-height:0">' + W().bild('zeichen-' + f, '5.5mm') + '</span>' : '';
    el.innerHTML = '<span class="e13-fk"><span class="e13-fk-oben">' + zeichen + '<span class="e13-fk-text">' + h.esc(W().frageText(r.fragen, f)) + '</span></span>' +
      '<span class="e13-fk-unten">' + pille('ja') + pille('nein') + '</span></span>';
    el.style.cssText = 'display:block;width:100%;height:100%';
    el.classList.add('komp');
  };

  // ---------------------------------------------------------------------
  B['m-e13-tabelle'] = function (el) {
    const h = H();
    const ids = (el.getAttribute('raetsel') || '').split(/[\s,]+/).filter(Boolean);
    const rs = [];
    for (const id of ids) {
      const r = h.DATEN.raetsel[id];
      if (!r || r.art !== 'baum') return h.fehler(el, 'Rätsel „' + id + '“ ist kein Ja-Nein-Baum');
      rs.push(r);
    }
    const dinge = (el.getAttribute('dinge') || '').split(/[\s,]+/).filter(Boolean);
    const fragen = (el.getAttribute('fragen') || '').split(/[\s,]+/).filter(Boolean);
    if (!rs.length || !dinge.length || !fragen.length) return h.fehler(el, 'm-e13-tabelle braucht raetsel, dinge und fragen');
    const namen = {}, texte = {};
    let html = '<table class="tab darf-brechen e13-tab e13-merkmale"><tr><th>Frage</th>';
    for (const d of dinge) {
      for (const r of rs) { const x = dingVon(r, d); if (x) namen[d] = x.name; }
      if (!namen[d]) return h.fehler(el, 'Ding „' + d + '“ kommt in keinem der Rätsel vor');
      html += '<th>' + h.esc(namen[d]) + '</th>';
    }
    html += '</tr>';
    for (const f of fragen) {
      for (const r of rs) if (r.fragen[f]) texte[f] = W().frageText(r.fragen, f);
      if (!texte[f]) return h.fehler(el, 'Frage „' + f + '“ kommt in keinem der Rätsel vor');
      html += '<tr><td>' + h.esc(texte[f]) + '</td>';
      for (const d of dinge) {
        const antworten = new Set();
        for (const r of rs) { const x = dingVon(r, d); if (x && r.fragen[f]) antworten.add(W().antwort(x, f)); }
        if (antworten.size > 1) h.fehler(el, 'Widerspruch: „' + d + '“ beantwortet „' + f + '“ in verschiedenen Rätseln verschieden');
        html += '<td>' + (antworten.size ? ([...antworten][0] ? 'Ja' : 'Nein') : '–') + '</td>';
      }
      html += '</tr>';
    }
    el.innerHTML = html + '</table>';
    el.style.display = 'block';
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  B['m-e13-zahl'] = function (el) {
    const h = H();
    const r = raetselVon(el);
    if (!r) return;
    const was = el.getAttribute('was');
    const l = r.loesung;
    const werte = { summe: l.summe, max: l.max, karten: l.frageKarten, anzahl: l.anzahlBaeume, min: l.minFragen };
    let n;
    if (was === 'tiefe') n = l.tiefen && l.tiefen[el.getAttribute('ding')];
    else n = werte[was];
    if (n === undefined || n === null) return h.fehler(el, 'm-e13-zahl: „' + was + '“ gibt es für ' + r.id + ' nicht');
    if (el.hasAttribute('l') && +el.getAttribute('l') !== n) return h.fehler(el, 'l="' + el.getAttribute('l') + '", aber der Löser sagt ' + n);
    if (el.hasAttribute('feld')) { el.style.lineHeight = '0'; el.style.verticalAlign = 'middle'; el.innerHTML = h.feldHTML(String(n), 'k'); }
    else el.textContent = String(n);
    el.classList.add('komp', 'geprueft');
  };
})();
