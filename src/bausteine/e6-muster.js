/* =====================================================================
   Bausteine für Einheit 6 „Muster-Detektivin“ (Rätselart muster)
   Zeichnungen und Logik aus web/kern/muster.js (gleich wie in der App),
   Lösungen aus dem Löser (werkzeuge/arten/muster.mjs → r.loesung).

     <m-e6-el name="rot" gr="6">
         ein Element (Perle, Hand, Fuß, Finger), gr in mm
     <m-e6-folge folge="rot blau rot blau" gr="5">   oder   raetsel="e6-f1" [teil="voll"]
         eine Folge ohne Kästchen (für die Anleitung); teil="voll": mit Lösung (Lücken gefüllt, weiter)
     <m-e6-reihe raetsel="e6-f1" [gr="12"] [abst="2"] [kern]>
         fortsetzen: Perlen auf der Schnur, Lücken und leere Plätze zum Malen.
                     Lösung: gefüllte Plätze rot umrandet; mit kern: Muster-Kern rot eingekreist
         kobold:     die Folge mit Platz darunter. Lösung: falsche Perle rot eingekreist, richtige darunter
         lesen:      so viele leere Plätze, wie das Programm malt. Lösung: die Perlen
         wachsend:   die Folge und leere Plätze. Lösung: wie es weitergeht
         zauber:     nur die Folge (der Zauber-Kasten kommt mit m-e6-zauber)
     <m-e6-zauber raetsel="e6-z1" [gr="12"] [zeige]>
         zauber: leerer Zauber-Kasten (Zahl und so viele Plätze wie der Kern). Lösung: ausgefüllt
         lesen:  der Zauber-Kasten des Programms (immer ausgefüllt)
     <m-e6-programm programm="3[rot blau blau] rot" gr="6">
         fertiges Muster-Programm (Anleitung, Beispiele)
     <m-e6-wert raetsel="e6-k1" wert="stelle" [l="5"] [feld]>
         eine Zahl aus der Lösung als Text (oder Antwortfeld mit feld): stelle, laenge (Kern),
         ganz, karten, anzahl, n (Länge der Folge), wdh, zaehle:<element> (wie oft in der fertigen Folge)
     <m-e6-janein raetsel="e6-g1">
         „ja“ / „nein“ zum Ankreuzen: Malt ein einzelner Zauber-Kasten das Muster? (zauber: ja, wachsend: nein)
   ===================================================================== */
(function () {
  'use strict';
  const B = (window.__bausteine = window.__bausteine || {});
  const H = () => window.__hilfen;
  const M = () => window.WerkstattMuster;

  const CSS = `
m-e6-el, m-e6-folge, m-e6-programm, m-e6-janein { display: inline-block; vertical-align: middle; line-height: 0; }
m-e6-wert { display: inline; }
m-e6-reihe { display: block; line-height: 0; }
m-e6-zauber { display: inline-block; vertical-align: middle; line-height: 1; }
.e06-r { position: relative; display: inline-flex; align-items: center; gap: var(--abst, 1.6mm); }
.e06-r.e06-schnur::before { content: ""; position: absolute; left: -2.5mm; right: -2.5mm; top: 50%; border-top: 0.6mm solid #9a9db0; transform: translateY(-50%); }
.e06-p { position: relative; flex: none; width: var(--gr, 12mm); height: var(--gr, 12mm); display: flex; align-items: center; justify-content: center; }
.e06-p > svg { width: 100%; height: 100%; display: block; position: relative; }
.e06-p.e06-leer { border: 0.5mm dashed #6b6f86; border-radius: 2mm; background: white; }
.e06-p.e06-leer > .e06-lsg { visibility: hidden; width: 80%; height: 80%; display: flex; }
.e06-p.e06-leer > .e06-lsg > svg { width: 100%; height: 100%; display: block; }
.loesungsmodus .e06-p.e06-leer { border: 0.6mm solid var(--rot); }
.loesungsmodus .e06-p.e06-leer > .e06-lsg { visibility: visible; }
.e06-ring { display: none; position: absolute; border: 0.75mm solid var(--rot); pointer-events: none; }
.loesungsmodus .e06-ring { display: block; }
.e06-kobold { display: inline-flex; flex-direction: column; gap: 1.5mm; }
.e06-unter { display: flex; gap: var(--abst, 1.6mm); height: var(--gr, 12mm); }
.e06-unter > span { flex: none; width: var(--gr, 12mm); height: var(--gr, 12mm); }
.e06-unter .e06-p.e06-leer { visibility: hidden; }
.loesungsmodus .e06-unter .e06-p.e06-leer { visibility: visible; }
.e06-mini { display: inline-flex; align-items: center; gap: 0.6mm; vertical-align: middle; }
.e06-mini > span { display: inline-flex; width: var(--gr, 5mm); height: var(--gr, 5mm); }
.e06-mini > span > svg { width: 100%; height: 100%; display: block; }
.e06-mini > .e06-luecke { border: 0.35mm dashed #6b6f86; border-radius: 1mm; box-sizing: border-box; }
.e06-mini > .e06-neu { outline: 0.4mm solid var(--rot); outline-offset: 0.3mm; border-radius: 0.8mm; }
.prog.e06-prog .platz .box svg { width: 78%; height: 78%; }
/* Muster-Programm im Fließtext der Anleitung: klein, ohne Kästchen um die Perlen */
.prog.e06-text { gap: 0.8mm; vertical-align: middle; align-items: center; }
.prog.e06-text .platz .box { border: none; background: transparent; border-radius: 0; }
.prog.e06-text .platz .box svg { width: 100%; height: 100%; }
.prog.e06-text .kasten-z { border-width: 0.5mm; border-radius: 1.6mm; padding: 0.5mm 1.2mm 0.9mm 1.2mm; gap: 0.4mm; }
.prog.e06-text .kasten-z .mal { font-size: 8.5pt; }
.prog.e06-text .kasten-z .innen { gap: 0.8mm; }
.e06-jn { display: inline-flex; gap: 6mm; align-items: center; font-family: var(--kind); font-size: 16pt; line-height: 1; }
.e06-jn > span { display: inline-flex; align-items: center; gap: 2mm; }
.e06-jn .e06-kreuz { width: 9mm; height: 9mm; border: 0.55mm solid var(--tinte); border-radius: 1.5mm; background: white; display: inline-flex; align-items: center; justify-content: center; }
.e06-jn .e06-kreuz svg { width: 7mm; height: 7mm; visibility: hidden; }
.loesungsmodus .e06-jn .e06-ja svg { visibility: visible; }
`;
  function stil() {
    if (document.getElementById('e06-stil')) return;
    const st = document.createElement('style');
    st.id = 'e06-stil';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  const KREUZ = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M18 18 L82 82 M82 18 L18 82" fill="none" stroke="#d1335b" stroke-width="16" stroke-linecap="round"/></svg>';

  function raetselVon(el) {
    const id = el.getAttribute('raetsel');
    if (!id) { H().fehler(el, 'raetsel="…" fehlt'); return null; }
    const r = H().DATEN.raetsel[id];
    if (!r) { H().fehler(el, 'Rätsel „' + id + '“ gibt es nicht in raetsel/*.json'); return null; }
    if (r.art !== 'muster') { H().fehler(el, 'Rätsel „' + id + '“ ist kein Muster (art: ' + r.art + ')'); return null; }
    if (!r.loesung) { H().fehler(el, 'Rätsel „' + id + '“ hat keine Lösung (Löser-Fehler?)'); return null; }
    return r;
  }
  const grVon = (el, def) => parseFloat(el.getAttribute('gr') || def);
  const abstVon = (el, gr) => parseFloat(el.getAttribute('abst') || String(Math.max(1.2, Math.round(gr * 1.4) / 10)));

  // Plätze: Element (sichtbar), leer (Lösung rot darin), Abstandhalter
  const platz = (n) => '<span class="e06-p">' + M().svg(n) + '</span>';
  const leer = (n) => '<span class="e06-p e06-leer"><span class="e06-lsg">' + (n ? M().svg(n) : '') + '</span></span>';
  function reiheHTML(inhalt, gr, abst, schnur, extra) {
    return '<span class="e06-r' + (schnur ? ' e06-schnur' : '') + '" style="--gr:' + gr + 'mm;--abst:' + abst + 'mm">' + inhalt + (extra || '') + '</span>';
  }
  // Ring (Lösung) um die Plätze a … b (0-basiert) einer Reihe
  function ring(a, b, gr, abst, rund) {
    const pad = 1.3;
    const left = a * (gr + abst) - pad, w = (b - a + 1) * gr + (b - a) * abst + 2 * pad;
    return '<span class="e06-ring" style="left:' + left + 'mm;top:' + (-pad) + 'mm;width:' + w + 'mm;height:' + (gr + 2 * pad) + 'mm;border-radius:' + (rund ? '50%' : (gr / 2 + pad) + 'mm') + '"></span>';
  }
  const istBewegung = (f) => f.some((x) => x && M().gruppe(x) === 'bewegung');

  // ---------------------------------------------------------------------
  B['m-e6-el'] = function (el) {
    stil();
    const gr = grVon(el, '6');
    try {
      el.innerHTML = '<span class="e06-mini" style="--gr:' + gr + 'mm"><span>' + M().svg(el.getAttribute('name')) + '</span></span>';
    } catch (e) { return H().fehler(el, e.message); }
    el.classList.add('komp');
  };

  B['m-e6-folge'] = function (el) {
    stil();
    const gr = grVon(el, '5');
    let teile;
    try {
      if (el.hasAttribute('folge')) teile = M().lies(el.getAttribute('folge')).map((x) => ({ x }));
      else {
        const r = raetselVon(el);
        if (!r) return;
        const l = r.loesung;
        const teil = el.getAttribute('teil') || 'folge';
        if (r.aufgabe === 'kobold') {
          teile = (teil === 'voll' ? l.repariert : M().lies(r.folge)).map((x, i) => ({ x, neu: teil === 'voll' && i === l.stelle - 1 }));
        } else if (r.aufgabe === 'lesen' || r.aufgabe === 'wachsend') {
          teile = l.folge.map((x) => ({ x })).concat(teil === 'voll' ? (l.weiter || []).map((x) => ({ x, neu: true })) : []);
        } else if (r.aufgabe === 'fortsetzen') {
          const f = M().lies(r.folge);
          teile = f.map((x, i) => (x !== null ? { x } : teil === 'voll' ? { x: l.luecken.find((u) => u.i === i).el, neu: true } : { luecke: true }));
          if (teil === 'voll') teile = teile.concat(l.weiter.map((x) => ({ x, neu: true })));
        } else teile = M().lies(r.folge).map((x) => ({ x }));
      }
    } catch (e) { return H().fehler(el, e.message); }
    el.innerHTML = '<span class="e06-mini" style="--gr:' + gr + 'mm">' + teile.map((t) => t.luecke ? '<span class="e06-luecke"></span>' : '<span' + (t.neu ? ' class="e06-neu"' : '') + '>' + M().svg(t.x) + '</span>').join('') + '</span>';
    el.classList.add('komp', 'geprueft');
  };

  B['m-e6-reihe'] = function (el) {
    stil();
    const r = raetselVon(el);
    if (!r) return;
    const l = r.loesung;
    const gr = grVon(el, '12');
    const abst = abstVon(el, gr);
    try {
      if (r.aufgabe === 'fortsetzen') {
        const f = M().lies(r.folge);
        const fuell = {};
        l.luecken.forEach((u) => { fuell[u.i] = u.el; });
        let s = f.map((x, i) => (x === null ? leer(fuell[i]) : platz(x))).join('');
        s += l.weiter.map((x) => leer(x)).join('');
        el.innerHTML = reiheHTML(s, gr, abst, !istBewegung(f), el.hasAttribute('kern') ? ring(0, l.laenge - 1, gr, abst) : '');
      } else if (r.aufgabe === 'kobold') {
        const f = M().lies(r.folge);
        const i0 = l.stelle - 1;
        const oben = reiheHTML(f.map(platz).join(''), gr, abst, !istBewegung(f), ring(i0, i0, gr, abst, true));
        const unten = '<span class="e06-unter" style="--gr:' + gr + 'mm;--abst:' + abst + 'mm">' + f.map((x, i) => (i === i0 ? leer(l.richtig) : '<span></span>')).join('') + '</span>';
        el.innerHTML = '<span class="e06-kobold">' + oben + unten + '</span>';
      } else if (r.aufgabe === 'lesen') {
        el.innerHTML = reiheHTML(l.folge.map((x) => leer(x)).join(''), gr, abst, !istBewegung(l.folge));
      } else if (r.aufgabe === 'wachsend') {
        el.innerHTML = reiheHTML(l.folge.map(platz).join('') + l.weiter.map((x) => leer(x)).join(''), gr, abst, !istBewegung(l.folge));
      } else {
        const f = M().lies(r.folge);
        el.innerHTML = reiheHTML(f.map(platz).join(''), gr, abst, !istBewegung(f));
      }
    } catch (e) { return H().fehler(el, e.message); }
    el.dataset.loesung = JSON.stringify(l).slice(0, 200);
    el.classList.add('komp', 'geprueft');
  };

  // Zauber-Kasten mit Elementen; form: Zahl als Antwortfeld, Elemente als leere Plätze
  function programmHTML(prog, gr, form, text) {
    const h = H();
    const box = (x) => (form
      ? '<span class="platz"><span class="box leer lsg-box"><span class="lsg-symbol">' + M().svg(x) + '</span></span></span>'
      : '<span class="platz"><span class="box">' + M().svg(x) + '</span></span>');
    const teile = prog.map((t) => {
      if (typeof t === 'string') return box(t);
      const mal = form ? h.feldHTML(String(t.wdh), 'k') + '-mal' : t.wdh + '-mal';
      return '<span class="platz"><span class="kasten-z"><span class="mal">' + mal + '</span><span class="innen">' + t.teile.map(box).join('') + '</span></span></span>';
    });
    return '<span class="prog e06-prog' + (text ? ' e06-text' : '') + '" style="--gr:' + gr + 'mm">' + teile.join('') + '</span>';
  }

  B['m-e6-zauber'] = function (el) {
    stil();
    const r = raetselVon(el);
    if (!r) return;
    const gr = grVon(el, '12');
    try {
      if (r.aufgabe === 'zauber') el.innerHTML = programmHTML(M().liesProgramm(r.loesung.programm), gr, !el.hasAttribute('zeige'));
      else if (r.aufgabe === 'lesen') el.innerHTML = programmHTML(M().liesProgramm(r.loesung.programm), gr, false);
      else return H().fehler(el, 'm-e6-zauber braucht ein Rätsel mit aufgabe zauber oder lesen');
    } catch (e) { return H().fehler(el, e.message); }
    el.classList.add('komp', 'geprueft');
  };

  B['m-e6-programm'] = function (el) {
    stil();
    try {
      el.innerHTML = programmHTML(M().liesProgramm(el.getAttribute('programm')), grVon(el, '4.5'), false, true);
    } catch (e) { return H().fehler(el, e.message); }
    el.classList.add('komp');
  };

  B['m-e6-wert'] = function (el) {
    stil();
    const r = raetselVon(el);
    if (!r) return;
    const l = r.loesung;
    const w = el.getAttribute('wert') || '';
    let n;
    if (w === 'stelle') n = l.stelle;
    else if (w === 'laenge') n = l.laenge;
    else if (w === 'ganz') n = l.ganz;
    else if (w === 'karten') n = l.karten;
    else if (w === 'anzahl') n = l.anzahl;
    else if (w === 'wdh') n = l.wdh;
    else if (w === 'n') n = (l.voll || l.repariert || l.folge || M().lies(r.folge)).length;
    else if (w.startsWith('zaehle:')) {
      const x = M().norm(w.slice(7));
      const f = l.voll || l.repariert || (l.folge ? l.folge.concat(l.weiter || []) : M().lies(r.folge));
      n = f.filter((y) => y === x).length;
    } else return H().fehler(el, 'wert: stelle, laenge, ganz, karten, anzahl, wdh, n, zaehle:<element>');
    if (n === undefined || n === null) return H().fehler(el, 'Wert „' + w + '“ gibt es bei aufgabe ' + r.aufgabe + ' nicht');
    if (el.hasAttribute('l') && +el.getAttribute('l') !== n) return H().fehler(el, w + ' ist ' + n + ', nicht ' + el.getAttribute('l'));
    el.innerHTML = el.hasAttribute('feld') ? H().feldHTML(String(n), n >= 10 ? '' : 'k') : String(n);
    el.classList.add('komp', 'geprueft');
  };

  B['m-e6-janein'] = function (el) {
    stil();
    const r = raetselVon(el);
    if (!r) return;
    let ja;
    if (r.aufgabe === 'zauber') ja = true;
    else if (r.aufgabe === 'wachsend') ja = false;   // vom Löser bewiesen: kein einzelner Zauber-Kasten
    else return H().fehler(el, 'm-e6-janein: aufgabe zauber oder wachsend');
    const k = (an) => '<span class="e06-kreuz' + (an ? ' e06-ja' : '') + '">' + KREUZ + '</span>';
    el.innerHTML = '<span class="e06-jn"><span>' + k(ja) + 'ja</span><span>' + k(!ja) + 'nein</span></span>';
    el.classList.add('komp', 'geprueft');
  };
})();
