/* =====================================================================
   Bausteine nur für Einheit 4 (Der Fehler-Kobold)
     <m-e4-blick raetsel="e4-l1" nach="3" [gr="15"]>
         vier Drachen zum Einkreisen: Wohin schaut der Drache nach Befehl n?
         Lösung aus dem Rätsel-Löser (art "lesen" mit "fragen": [n]).
     <m-e4-befehl raetsel="e4-k1" [gr="13"]>
         die drei Befehle zum Einkreisen: Welcher Befehl gehört an die
         kaputte Stelle? (art "kobold", Reparatur "tauschen" oder "einfuegen")
     <m-e4-art raetsel="e4-k5">
         drei Kärtchen: Ein Befehl ist falsch / fehlt / ist zu viel.
         Lösung = Art der gemeinten Reparatur.
   Die Lösungsansicht kreist das Richtige rot ein.
   Aussehen: <style> in src/einheiten/04-der-fehler-kobold.html (.e04-…)
   ===================================================================== */
(function () {
  'use strict';
  const B = (window.__bausteine = window.__bausteine || {});
  const H = () => window.__hilfen;
  const S = () => window.WerkstattSymbole;
  const RICHTUNGEN = ['oben', 'rechts', 'unten', 'links'];
  const DREH = { oben: 0, rechts: 90, unten: 180, links: 270 };

  function raetsel(el, art) {
    const h = H();
    const id = el.getAttribute('raetsel');
    const r = id && h.DATEN.raetsel[id];
    if (!r) { h.fehler(el, 'Rätsel „' + id + '“ gibt es nicht in raetsel/*.json'); return null; }
    if (r.art !== art || !r.loesung) { h.fehler(el, 'Rätsel „' + id + '“ muss art "' + art + '" sein (und gelöst)'); return null; }
    return r;
  }
  function drache(blick, gr) {
    const svg = S().symbol('drache', gr + 'mm');
    return svg.replace('aria-hidden="true">', 'aria-hidden="true"><g transform="rotate(' + DREH[blick] + ' 50 50)">').replace(/<\/svg>$/, '</g></svg>');
  }
  function fertig(el, html) {
    el.innerHTML = html;
    el.classList.add('komp', 'geprueft');
  }

  B['m-e4-blick'] = function (el) {
    const h = H();
    const r = raetsel(el, 'lesen');
    if (!r) return;
    const n = el.getAttribute('nach');
    const stand = n && r.loesung.nach && r.loesung.nach[n];
    if (!stand) return h.fehler(el, 'nach="' + n + '": im Rätsel fehlt "fragen": [' + n + ']');
    const gr = parseFloat(h.attr(el, 'gr', '15'));
    let html = '<span class="e04-wahl">';
    for (const b of RICHTUNGEN) {
      html += '<span class="e04-opt' + (b === stand.blick ? ' e04-richtig' : '') + '" style="width:' + (gr + 3) + 'mm;height:' + (gr + 3) + 'mm">' + drache(b, gr) + '</span>';
    }
    fertig(el, html + '</span>');
  };

  B['m-e4-befehl'] = function (el) {
    const h = H();
    const r = raetsel(el, 'kobold');
    if (!r) return;
    const rp = r.loesung.reparatur;
    if (rp.art === 'loeschen') return h.fehler(el, 'Bei „Befehl zu viel“ gibt es keinen Befehl zum Einkreisen');
    const gr = parseFloat(h.attr(el, 'gr', '13'));
    let html = '<span class="e04-wahl">';
    for (const b of ['vor', 'links', 'rechts']) {
      html += '<span class="e04-opt e04-befehl' + (b === rp.befehl ? ' e04-richtig' : '') + '" style="width:' + (gr + 3) + 'mm;height:' + (gr + 3) + 'mm">' +
        '<span class="e04-box" style="width:' + gr + 'mm;height:' + gr + 'mm">' + S().symbol(b, '82%') + '</span></span>';
    }
    fertig(el, html + '</span>');
  };

  B['m-e4-art'] = function (el) {
    const r = raetsel(el, 'kobold');
    if (!r) return;
    const art = r.loesung.reparatur.art;
    // Reparatur „tauschen“ = ein Befehl ist falsch, „einfuegen“ = einer fehlt, „loeschen“ = einer ist zu viel
    const karten = [['tauschen', 'Ein Befehl ist falsch.'], ['einfuegen', 'Ein Befehl fehlt.'], ['loeschen', 'Ein Befehl ist zu viel.']];
    let html = '<span class="e04-arten">';
    for (const [a, text] of karten) html += '<span class="e04-opt e04-art' + (a === art ? ' e04-richtig' : '') + '">' + H().esc(text) + '</span>';
    fertig(el, html + '</span>');
  };
})();
