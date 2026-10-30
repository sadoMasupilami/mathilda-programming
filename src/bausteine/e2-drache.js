/* =====================================================================
   Einheit 2: großer Drache zum Anmalen (Bastelvorlage Blatt 2-3)
     <m-e2-ausmal gr="70"></m-e2-ausmal>
   Derselbe Drache wie im Gitter (web/kern/symbole.js, Ansicht von oben,
   Nase = Blickrichtung), aber weiß zum Anmalen. Nur die rechte Pfote
   bleibt orange, wie auf den Figuren und beim Befehl „rechts drehen“.
   ===================================================================== */
(function () {
  'use strict';
  const B = (window.__bausteine = window.__bausteine || {});

  B['m-e2-ausmal'] = function (el) {
    const H = window.__hilfen;
    const S = window.WerkstattSymbole;
    const gr = parseFloat(el.getAttribute('gr') || '70');
    if (!(gr >= 30 && gr <= 150)) return H.fehler(el, 'gr (mm) zwischen 30 und 150');
    const F = S.FARBE;
    let inhalt = S.inhalt('drache');
    // Alle Füllfarben weiß, außer der orangen rechten Pfote und den dunklen Augen/Nasenlöchern
    for (const f of [F.drache, F.dracheDunkel, F.bauch, F.gold]) inhalt = inhalt.split('fill="' + f + '"').join('fill="white"');
    // Der Bauch hat im Original keine Linie: zum Anmalen gestrichelt nachziehen
    inhalt = inhalt.replace('fill="white" stroke="none"', 'fill="white" stroke="' + F.tinte + '" stroke-width="1.2" stroke-dasharray="3 2.5"');
    if (inhalt.indexOf('fill="' + F.rechts + '"') < 0) return H.fehler(el, 'Drache ohne orange rechte Pfote');
    el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-3 -3 106 106" width="' + gr + 'mm" height="' + gr + 'mm" aria-hidden="true">' + inhalt + '</svg>';
    el.classList.add('komp');
  };
})();
