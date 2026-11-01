/* =====================================================================
   Bausteine für Einheit 15 „Gewinnen mit Plan“ (Strategiespiele, Rätselart nim)
   Alle Antworten kommen aus dem Löser (werkzeuge/arten/nim.mjs, r.loesung) bzw.
   aus demselben Spielbaum im Kern (web/kern/nim.js). Lösungsansicht: rot.

     <m-e15-steine n="7" [gr="9"] [pro="5"] [versatz="0"]>
         Muggelsteine als Bild (Reihen zu 5), gr = Durchmesser in mm
     <m-e15-stellung raetsel="e15-s1" [gr="7"] [pro="5"]>
         „Wer gewinnt hier?“: Wer ist dran, Steine, ankreuzen Du / Drache.
         Lösung: Kreuz beim Gewinner, darunter der Gewinnzug („nimm 1“).
     <m-e15-weg raetsel="e15-g20" [feld="22"] [pro="7"] [gold="20"]>
         Zahlen-Weg 0 … 20 für „Wer sagt 20?“ (Start mit Drache, Schatz am Ende).
         gold: Felder schon gelb (Beispiel). Lösung: rote Ringe um alle Gewinnzahlen.
     <m-e15-zahlen raetsel="e15-g20" [vorgabe="20,17"] [ordnung="ab|auf"] [form="kasten|kreis"] [gr]>
         Kästchen für die Gewinnzahlen (vorgegebene schon eingetragen). Lösung: rote Zahlen.
     <m-e15-antwort raetsel="…" was="erster|kleinste|nimm|anfangen">
         ein Antwortfeld: erste Gewinnzahl beim Anfangen, kleinste Gewinnzahl, Gewinnzug (nimm),
         „Willst du anfangen?“ (ja / nein zum Ankreuzen)
     <m-e15-regeln raetsel="e15-r1" [modus="ausfuellen|kobold"]>
         Wenn-dann-Regeln „Wenn noch 4 Steine liegen, dann nimm 1.“ Ausfüllen: Kästchen für „nimm“.
         Kobold: alle ausgefüllt, eine falsch. Lösung: falsche Regel rot durchgestrichen, richtige Zahl rot.
     <m-e15-baum raetsel="e15-b4" [knoten="9"] [dx="12"] [dy="15"] [links="du,Mama/Papa"]>
         Spielbaum (Anleitung), Gewinnzahlen gold
     <m-e15-zugtabelle spiel="steine 1-2" bis="10">
         kleine Tabelle: bei 1 … 10 Steinen nimmt man … (oder „Pech“), aus dem Spielbaum
     <m-e15-text raetsel="e15-w10" was="zug|gz|gzab|partie">
         Text aus der Lösung: Gewinnzug, Gewinnzahlen, Beispiel-Partie gegen den Roboter
     <m-e15-stimmt spiel="steine 1-2" haufen="4" dran="du" gewinner="du" nimm="1">Text</m-e15-stimmt>
         prüft eine Aussage im Text mit dem Spielbaum (der Text bleibt, wie er ist).
         Attribute: spiel, haufen ("4" oder "3,5") oder stand, dran (du|andere), gewinner (du|andere),
         nimm / sag (einziger Gewinnzug), gegner (immer1|immer2), anfangen (zuerst|zweiter, vom Start),
         gz (die Zahlen im Text sind genau die Gewinnzahlen bis zur größten), gz="teil" (jede Zahl im
         Text ist eine Gewinnzahl), gz="keine" (keine Zahl im Text ist eine Gewinnzahl)
   ===================================================================== */
(function () {
  'use strict';
  const B = (window.__bausteine = window.__bausteine || {});
  const H = () => window.__hilfen;
  const N = () => window.WerkstattNim;
  const S = () => window.WerkstattSymbole;
  const istLoesung = (el) => !!el.closest('.loesungsmodus');

  const CSS = `
m-e15-steine, m-e15-antwort { display: inline-block; vertical-align: middle; line-height: 0; }
m-e15-stellung, m-e15-weg, m-e15-zahlen, m-e15-regeln, m-e15-baum { display: block; }
m-e15-stellung > .e15-st { height: 100%; }
m-e15-steine svg, m-e15-weg svg, m-e15-baum svg, m-e15-stellung svg { display: block; }
.e15-st { display: flex; flex-direction: column; align-items: center; gap: 2.5mm; border: 0.6mm solid var(--linie); border-radius: 3mm; padding: 2.5mm 2mm 3mm 2mm; background: white; }
.e15-st-dran { display: flex; align-items: center; justify-content: center; gap: 1.5mm; font-size: 15pt; line-height: 1.1; min-height: 12mm; text-align: center; }
.e15-st-dran b { font-weight: 700; }
.e15-st-steine { min-height: 16mm; display: flex; align-items: center; }
.e15-st-wer { display: flex; flex-direction: column; gap: 1.6mm; align-self: center; }
.e15-wahl { display: inline-flex; align-items: center; gap: 2mm; font-size: 15pt; line-height: 1; }
.e15-box { width: 8mm; height: 8mm; border: 0.55mm solid var(--tinte); border-radius: 1.5mm; background: white; display: inline-flex; align-items: center; justify-content: center; flex: none; }
.e15-box svg { width: 6mm; height: 6mm; }
.e15-kreuz { visibility: hidden; display: inline-flex; }
.loesungsmodus .e15-kreuz { visibility: visible; }
.e15-st-lsg { display: none; }
.loesungsmodus .e15-st-lsg { display: block; color: var(--rot); font-family: var(--kind); font-weight: 700; font-size: 13pt; line-height: 1.15; text-align: center; }
.e15-zahlen { display: flex; flex-wrap: wrap; align-items: center; gap: 2.5mm 2mm; }
.e15-zahlen .e15-komma { font-size: 18pt; line-height: 1; margin-left: -1mm; }
.e15-zahlen .feld.e15-vorgabe { border-color: var(--grau); background-image: none; }
m-e15-zugtabelle { display: block; }
table.e15-zt td { text-align: center; }
.e15-kreis { display: inline-flex; align-items: center; justify-content: center; width: var(--gr, 11mm); height: var(--gr, 11mm); border-radius: 50%; border: 0.55mm solid var(--tinte); background: white; font-family: var(--kind); font-size: 15pt; line-height: 1; }
.e15-kreis.e15-vorgabe { background: var(--gold-hell); border-color: var(--gold); font-weight: 700; }
.e15-janein { display: inline-flex; align-items: center; gap: 4mm; font-size: 16pt; line-height: 1; }
.e15-janein > span { display: inline-flex; align-items: center; gap: 1.5mm; }
.e15-regeln { display: flex; flex-direction: column; gap: 3mm; }
.e15-regel { position: relative; display: flex; align-items: center; flex-wrap: wrap; gap: 1.5mm; font-size: 16pt; line-height: 1.2; }
.e15-regel .e15-n { display: inline-flex; align-items: center; justify-content: center; min-width: 9mm; height: 9mm; padding: 0 1.2mm; border-radius: 2mm; background: var(--akzent-hell); font-weight: 700; }
.e15-regel .e15-n.e15-dann { background: var(--gold-hell); }
.e15-regel .e15-vorgabe-text { color: var(--grau); }
.e15-punkt { display: inline-flex; align-items: center; gap: 0.6mm; }
.e15-strich { display: none; }
.loesungsmodus .e15-strich { display: block; position: absolute; left: -1mm; right: -1mm; top: 50%; height: 0; border-top: 0.9mm solid var(--rot); transform: rotate(-1.2deg); }
.e15-richtig { display: none; }
.loesungsmodus .e15-richtig { display: inline; color: var(--rot); font-weight: 700; }
`;
  function stil() {
    if (document.getElementById('e15-stil')) return;
    const st = document.createElement('style');
    st.id = 'e15-stil';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  const KREUZ = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M18 18 L82 82 M82 18 L18 82" fill="none" stroke="#d1335b" stroke-width="16" stroke-linecap="round"/></svg>';
  const box = (ja) => '<span class="e15-box">' + (ja ? '<span class="e15-kreuz">' + KREUZ + '</span>' : '') + '</span>';
  const drache = (gr) => S().symbol('drache', gr + 'mm');

  function raetselVon(el, aufgaben) {
    const id = el.getAttribute('raetsel');
    if (!id) { H().fehler(el, 'raetsel="…" fehlt'); return null; }
    const r = H().DATEN.raetsel[id];
    if (!r) { H().fehler(el, 'Rätsel „' + id + '“ gibt es nicht in raetsel/*.json'); return null; }
    if (r.art !== 'nim') { H().fehler(el, 'Rätsel „' + id + '“ ist keine Rätselart nim'); return null; }
    if (aufgaben && !aufgaben.includes(r.aufgabe)) { H().fehler(el, 'Rätsel „' + id + '“ hat aufgabe ' + r.aufgabe + ', erwartet: ' + aufgaben.join(' oder ')); return null; }
    if (!r.loesung) { H().fehler(el, 'Rätsel „' + id + '“ hat keine Lösung (Löser-Fehler?)'); return null; }
    return r;
  }
  const zahlenListe = (s) => String(s || '').split(/[\s,]+/).filter(Boolean).map(Number);

  // ---------------------------------------------------------------------
  B['m-e15-steine'] = function (el) {
    stil();
    const n = parseInt(el.getAttribute('n'), 10);
    if (!(n >= 0 && n <= 30)) return H().fehler(el, 'n muss 0 bis 30 sein');
    el.innerHTML = N().steineSVG(n, { gr: parseFloat(el.getAttribute('gr') || '9'), proReihe: parseInt(el.getAttribute('pro') || '5', 10), versatz: parseInt(el.getAttribute('versatz') || '0', 10) });
    el.classList.add('komp');
  };

  // ---------------------------------------------------------------------
  B['m-e15-stellung'] = function (el) {
    stil();
    const r = raetselVon(el, ['stellung']);
    if (!r) return;
    const l = r.loesung;
    if (l.haufen.length !== 1 || l.stand !== null) return H().fehler(el, 'm-e15-stellung: nur Steine-Spiel mit einem Haufen');
    const n = l.haufen[0];
    const gr = parseFloat(el.getAttribute('gr') || '7');
    const dran = l.dran === 'du' ? '<span><b>Du</b> bist dran.</span>' : drache(8) + '<span><b>Der Drache</b> ist dran.</span>';
    let lsg = '';
    if (l.dran === 'du' && l.gewinner === 'du') lsg = l.zugText ? l.zugText.replace(/^nimm/, 'Nimm') + ', dann bleiben ' + l.nachher[0] + '.' : '';
    else if (l.dran === 'du') lsg = 'Der Drache nimmt dann den Rest.';
    else lsg = l.zugText ? 'Der Drache: ' + l.zugText + '.' : '';
    if (l.dran === 'andere' && l.gewinner === 'du') {
      // welche Gewinnzahl bleibt nach dem Drachen-Zug und dem eigenen Zug? (aus dem Spielbaum)
      const v = N().lies(l.spiel);
      const ziele = new Set();
      for (const z of N().zuege(v, l.haufen)) {
        const x = N().nach(l.haufen, z);
        for (const y of N().gewinnZuege(v, x)) ziele.add(N().nach(x, y)[0]);
      }
      lsg = 'Du lässt dann ' + Array.from(ziele).sort((a, b) => a - b).join(' oder ') + ' liegen.';
    }
    el.innerHTML = '<div class="e15-st"><div class="e15-st-dran">' + dran + '</div>' +
      '<div class="e15-st-steine">' + N().steineSVG(n, { gr, proReihe: parseInt(el.getAttribute('pro') || '5', 10), versatz: n }) + '</div>' +
      '<div class="e15-st-wer"><span class="e15-wahl">' + box(l.gewinner === 'du') + 'Du</span>' +
      '<span class="e15-wahl">' + box(l.gewinner === 'andere') + 'Drache</span></div>' +
      (lsg ? '<div class="e15-st-lsg">' + H().esc(lsg) + '</div>' : '') + '</div>';
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  B['m-e15-weg'] = function (el) {
    stil();
    const r = raetselVon(el, ['gewinnzahlen', 'spiel']);
    if (!r) return;
    const v = N().lies(r.spiel);
    if (v.form !== 'zaehlen') return H().fehler(el, 'm-e15-weg nur für „Wer sagt …?“');
    const gz = r.loesung.gewinnzahlen;
    const gold = zahlenListe(el.getAttribute('gold'));
    for (const x of gold) if (!gz.includes(x)) H().fehler(el, 'gold: ' + x + ' ist keine Gewinnzahl');
    el.innerHTML = N().wegSVG(v.bis, {
      feld: parseFloat(el.getAttribute('feld') || '22'), proReihe: parseInt(el.getAttribute('pro') || '7', 10),
      gold, markiert: istLoesung(el) ? gz : [],
    });
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  B['m-e15-zahlen'] = function (el) {
    stil();
    const h = H();
    const r = raetselVon(el, ['gewinnzahlen', 'spiel']);
    if (!r) return;
    const v = N().lies(r.spiel);
    let gz = r.loesung.gewinnzahlen.slice();
    if (el.hasAttribute('bis')) gz = gz.filter((x) => x <= +el.getAttribute('bis'));
    const ordnung = el.getAttribute('ordnung') || (v.form === 'zaehlen' ? 'ab' : 'auf');
    if (ordnung === 'ab') gz.reverse();
    const vorgabe = zahlenListe(el.getAttribute('vorgabe'));
    for (const x of vorgabe) if (!gz.includes(x)) h.fehler(el, 'vorgabe: ' + x + ' ist keine Gewinnzahl');
    const form = el.getAttribute('form') || 'kasten';
    const gr = parseFloat(el.getAttribute('gr') || '11');
    const teile = gz.map((x) => {
      const da = vorgabe.includes(x);
      if (form === 'kreis') return '<span class="e15-kreis' + (da ? ' e15-vorgabe' : '') + '" style="--gr:' + gr + 'mm">' + (da ? x : '<span class="lsg">' + x + '</span>') + '</span>';
      return da ? '<span class="feld e15-vorgabe">' + x + '</span>' : h.feldHTML(String(x), '');
    });
    el.innerHTML = '<span class="e15-zahlen">' + teile.join(form === 'kreis' ? '' : '<span class="e15-komma">,</span>') + '</span>';
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  B['m-e15-antwort'] = function (el) {
    stil();
    const h = H();
    const r = raetselVon(el);
    if (!r) return;
    const l = r.loesung;
    const was = el.getAttribute('was');
    const v = N().lies(r.spiel);
    let wert = null;
    if (was === 'erster') {
      if (v.form !== 'zaehlen') return h.fehler(el, 'was="erster" nur bei „Wer sagt …?“');
      const gz = N().gewinnZuege(v, [v.bis]);
      if (gz.length !== 1) return h.fehler(el, 'Wer anfängt, hat ' + (gz.length ? gz.length + ' Gewinnzüge' : 'keinen Gewinnzug'));
      wert = gz[0].nimm;   // vom Stand 0 aus: so weit zählt man
    } else if (was === 'kleinste') {
      if (!l.gewinnzahlen) return h.fehler(el, 'Keine Gewinnzahlen im Rätsel');
      wert = l.gewinnzahlen[0];
    } else if (was === 'nimm') {
      if (!l.zug) return h.fehler(el, 'was="nimm": Rätsel ohne zug');
      wert = l.zug.nimm;
    } else if (was === 'anfangen') {
      if (l.ersterGewinnt === undefined) return h.fehler(el, 'was="anfangen": nur bei gewinnzahlen mit Start');
      el.innerHTML = '<span class="e15-janein"><span>' + box(l.ersterGewinnt) + 'ja</span><span>' + box(!l.ersterGewinnt) + 'nein</span></span>';
      el.classList.add('komp', 'geprueft');
      return;
    } else return h.fehler(el, 'was: erster, kleinste, nimm oder anfangen');
    if (el.hasAttribute('l') && +el.getAttribute('l') !== wert) h.fehler(el, 'l="' + el.getAttribute('l') + '", aber der Spielbaum sagt ' + wert);
    el.innerHTML = h.feldHTML(String(wert), wert >= 10 ? '' : 'k');
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  B['m-e15-regeln'] = function (el) {
    stil();
    const h = H();
    const r = raetselVon(el, ['regeln']);
    if (!r) return;
    const modus = el.getAttribute('modus') || (r.kobold ? 'kobold' : 'ausfuellen');
    if (modus === 'kobold' && !r.kobold) return h.fehler(el, 'modus="kobold", aber das Rätsel hat keine Kobold-Regel');
    if (modus === 'ausfuellen' && r.kobold) return h.fehler(el, 'Kobold-Regeln kann man nicht ausfüllen (modus="kobold")');
    const zeilen = r.loesung.regeln.map((g) => {
      const wenn = '<span>Wenn noch</span><span class="e15-n">' + g.wenn + '</span><span>' + (g.wenn === 1 ? 'Stein liegt,' : 'Steine liegen,') + '</span>';
      if (modus === 'kobold') {
        return '<div class="e15-regel">' + wenn + '<span>dann nimm</span><span class="e15-punkt"><span class="e15-n e15-dann">' + g.dann + '</span>.</span>' +
          (g.kobold ? '<span class="e15-strich"></span><span class="e15-richtig">Richtig: nimm ' + g.richtig.join(' oder ') + '.</span>' : '') + '</div>';
      }
      const dann = g.vorgabe ? '<span class="e15-n e15-dann">' + g.dann + '</span>' : h.feldHTML(String(g.dann), 'k');
      return '<div class="e15-regel' + (g.vorgabe ? ' e15-vorgabe-text' : '') + '">' + wenn + '<span>dann nimm</span><span class="e15-punkt">' + dann + '.</span></div>';
    });
    el.innerHTML = '<div class="e15-regeln">' + zeilen.join('') + '</div>';
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  B['m-e15-baum'] = function (el) {
    stil();
    const r = raetselVon(el, ['baum']);
    if (!r) return;
    const v = N().lies(r.spiel);
    try {
      el.innerHTML = N().baumSVG(v, r.loesung.haufen, {
        knoten: parseFloat(el.getAttribute('knoten') || '9'), dx: parseFloat(el.getAttribute('dx') || '12'), dy: parseFloat(el.getAttribute('dy') || '15'),
        links: el.hasAttribute('links') ? el.getAttribute('links').split(',') : null, linksBreite: parseFloat(el.getAttribute('links-breite') || '24'),
      });
    } catch (e) { return H().fehler(el, e.message); }
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  // <m-e15-zugtabelle spiel="steine 1-2" bis="10" [klasse="spick-tab"]>
  //   Tabelle: Es liegen 1 … bis Steine, wer dran ist, nimmt … (oder „Pech“), aus dem Spielbaum
  B['m-e15-zugtabelle'] = function (el) {
    const h = H();
    let v;
    try { v = N().lies(el.getAttribute('spiel') || 'steine 1-2'); } catch (e) { return h.fehler(el, e.message); }
    if (v.form !== 'steine' || v.nehmen === 'beliebig') return h.fehler(el, 'Zugtabelle nur für das Steine-Spiel mit einem Haufen');
    const bis = parseInt(el.getAttribute('bis') || '10', 10);
    if (!(bis >= 2 && bis <= 15)) return h.fehler(el, 'bis: 2 bis 15');
    let oben = '<th>' + h.esc(el.getAttribute('kopf1') || 'Es liegen') + '</th>', unten = '<th>' + h.esc(el.getAttribute('kopf2') || 'Wer dran ist, nimmt') + '</th>';
    for (let n = 1; n <= bis; n++) {
      const gz = N().gewinnZuege(v, [n]);
      if (gz.length > 1) return h.fehler(el, 'Bei ' + n + ' gibt es mehrere Gewinnzüge');
      oben += '<td>' + n + '</td>';
      unten += gz.length ? '<td>' + gz[0].nimm + '</td>' : '<td><b>Pech</b></td>';
    }
    el.innerHTML = '<table class="' + h.esc(el.getAttribute('klasse') || 'spick-tab') + ' e15-zt"><tr>' + oben + '</tr><tr>' + unten + '</tr></table>';
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  // Text aus der Lösung (Anleitung, Lösungen): was="zug" (Gewinnzüge), "gz" (Gewinnzahlen aufsteigend),
  // "gzab" (absteigend), "partie" (Beispiel-Partie: deine Züge und die des Roboters)
  B['m-e15-text'] = function (el) {
    const r = raetselVon(el);
    if (!r) return;
    const l = r.loesung;
    const was = el.getAttribute('was') || 'zug';
    let t = '';
    if (was === 'zug') {
      if (!l.gewinnZuegeText || !l.gewinnZuegeText.length) return H().fehler(el, 'Keine Gewinnzüge für „du“ in ' + r.id);
      t = l.gewinnZuegeText.join(' oder ');
    } else if (was === 'gz' || was === 'gzab') {
      if (!l.gewinnzahlen) return H().fehler(el, 'Keine Gewinnzahlen in ' + r.id);
      const gz = l.gewinnzahlen.slice();
      if (was === 'gzab') gz.reverse();
      t = gz.length > 1 ? gz.slice(0, -1).join(', ') + ' und ' + gz[gz.length - 1] : String(gz[0]);
    } else if (was === 'partie') {
      if (!l.partie) return H().fehler(el, 'Keine Beispiel-Partie in ' + r.id);
      // „du 1, Roboter 2, du 1“ bzw. bei zwei Haufen „du 2 vom Haufen 2, …“, bei Wer sagt …? die gesagten Zahlen
      const v = N().lies(r.spiel);
      const zwei = (l.haufen || []).length > 1;
      t = l.partie.map((p) => {
        const wer = p.wer === 'du' ? 'du ' : 'Roboter ';
        if (v.form === 'zaehlen') return wer + (v.bis - p.nachher[0]);
        return wer + p.zug.nimm + (zwei ? ' vom Haufen ' + (p.zug.haufen + 1) : '');
      }).join(', ');
    } else return H().fehler(el, 'was: zug, gz, gzab oder partie');
    el.textContent = t;
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  // Aussage im Text prüfen (der Text bleibt stehen)
  B['m-e15-stimmt'] = function (el) {
    const h = H();
    const F = (m) => h.fehler(el, 'Aussage stimmt nicht: ' + m);
    let v;
    try { v = N().lies(el.getAttribute('spiel')); } catch (e) { return F(e.message); }
    const hat = (a) => el.hasAttribute(a);
    let st = null;
    if (hat('haufen') || hat('stand')) {
      try { st = N().stellung(v, hat('stand') ? { stand: +el.getAttribute('stand') } : { haufen: zahlenListe(el.getAttribute('haufen')) }); } catch (e) { return F(e.message); }
    }
    const dran = el.getAttribute('dran') || 'du';
    if (hat('gewinner')) {
      if (!st) return F('gewinner braucht haufen oder stand');
      const gegner = el.getAttribute('gegner') || 'gut';
      let gew;
      if (gegner === 'gut') gew = N().gewinnt(v, st) ? dran : (dran === 'du' ? 'andere' : 'du');
      else { try { gew = N().kannGewinnen(v, st, dran === 'du' ? 'du' : 'roboter', gegner) ? 'du' : 'andere'; } catch (e) { return F(e.message); } }
      if (gew !== el.getAttribute('gewinner')) F('Der Spielbaum sagt: Es gewinnt ' + gew + ' (dran: ' + dran + (gegner !== 'gut' ? ', gegen ' + gegner : '') + ')');
    }
    if (hat('nimm') || hat('sag')) {
      if (!st) return F('nimm/sag braucht haufen oder stand');
      const k = hat('sag') ? +el.getAttribute('sag') - N().standVon(v, st) : +el.getAttribute('nimm');
      const gz = N().gewinnZuege(v, st);
      const haufenNr = hat('aus') ? +el.getAttribute('aus') - 1 : 0;
      if (!gz.some((z) => z.nimm === k && z.haufen === haufenNr)) F('Kein Gewinnzug: ' + k + ' (Gewinnzüge: ' + (gz.map((z) => (st.length > 1 ? 'H' + (z.haufen + 1) + ':' : '') + z.nimm).join(', ') || 'keine') + ')');
      else if (gz.length > 1 && !hat('mehrere')) F('Es gibt ' + gz.length + ' Gewinnzüge – „mehrere“ setzen oder anders formulieren');
    }
    if (hat('anfangen')) {
      const start = v.form === 'zaehlen' ? [v.bis] : (st || null);
      if (!start) return F('anfangen braucht bei Steinen haufen');
      const soll = N().gewinnt(v, start) ? 'zuerst' : 'zweiter';
      if (soll !== el.getAttribute('anfangen')) F('Vom Start aus gewinnt ' + (soll === 'zuerst' ? 'wer anfängt' : 'wer als Zweiter dran ist'));
    }
    if (hat('gz')) {
      const art = el.getAttribute('gz') || 'genau';
      const zahlen = (el.textContent.match(/\d+/g) || []).map(Number);
      if (!zahlen.length) return F('gz: keine Zahl im Text');
      const ist = (x) => N().istGewinnzahl(v, x);
      if (art === 'teil') { for (const x of zahlen) if (!ist(x)) F(x + ' ist keine Gewinnzahl'); }
      else if (art === 'keine') { for (const x of zahlen) if (ist(x)) F(x + ' ist eine Gewinnzahl'); }
      else {
        const bis = v.form === 'zaehlen' ? v.bis : Math.max(...zahlen);
        const soll = N().gewinnzahlen(v, bis);
        const sortiert = Array.from(new Set(zahlen)).sort((a, b) => a - b);
        if (sortiert.join(',') !== soll.join(',')) F('Gewinnzahlen bis ' + bis + ' sind ' + soll.join(', ') + ' (im Text: ' + sortiert.join(', ') + ')');
      }
    }
    el.classList.add('geprueft');
  };
})();
