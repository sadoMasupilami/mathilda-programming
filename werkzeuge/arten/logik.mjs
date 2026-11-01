// Rätselart „logik“ (Einheit 12): Logikgitter und Wahr-oder-falsch-Sätze
//
// Gemeinsame Logik (Regeln, Backtracking, Bilder): web/kern/logik.js
//
// aufgabe "gitter" (Standard): Logikgitter n · n (n = 2 bis 4)
//   { zeilen: ["drache", "einhorn"], spalten: ["apfel", "eis"],
//     hinweise: [{ text: "Der {drache} mag kein {eis}.", regel: "drache!=eis" }],
//     optional: woerter { name: "Wort" } (Namen ohne Bild), ueberfluessig: [3] (Hinweis-Nummern, 1-basiert),
//               vorgabe: { ja: [[zeile, spalte]], nein: [[zeile, spalte]] } (schon gesetzte Zeichen, lila),
//               kobold: { nein: [zeile, spalte] } oder { ja: [zeile, spalte] } (das eine falsche Zeichen der Vorgabe),
//               falscherHinweis: 2 (dieser Hinweis stimmt nicht), erwarteteLoesungen: 2 (Beispiel „da fehlt ein Hinweis“) }
//   Der Löser beweist (Abbruch, wenn nicht):
//   - Backtracking über alle Zuordnungen: genau eine Lösung (oder genau erwarteteLoesungen)
//   - jeder Hinweis ist nötig: ohne ihn gäbe es mehr als eine Lösung. Ausnahmen nur, wenn sie
//     in "ueberfluessig" stehen, und dann genau diese.
//   - Satz und Regel passen zusammen: dieselben Bilder, „kein/nicht“ genau bei !=, „oder“ bei |, „und“ bei &
//     („kein/nicht“ auch an der richtigen Stelle: direkt vor dem Bild des Dings oder als „nicht“ am Satzende)
//   - Oder-Hinweis mit zwei wahren Teilen in der Lösung nur mit "beideWahr": true (wie bei wahrfalsch)
//   - vorgabe/kobold: höchstens ein Zeichen pro Feld, genau ein Zeichen der Vorgabe ist falsch, und zwar das angegebene
//   - falscherHinweis: mit allen Hinweisen keine Lösung, ohne diesen genau eine, ohne jeden anderen keine
//
// aufgabe "wahrfalsch": Sätze über ein Bild
//   { szene: [{ tier: "drache", hat: ["muetze-rot", "apfel"] }, …],
//     aussagen: [{ text, regel, soll?: "wahr"|"falsch", beideWahr?: true }], optional ohneBilder: true }
//   Der Löser rechnet jeden Satz aus. Ein Oder-Satz, bei dem beide Teile wahr sind, braucht
//   "beideWahr": true (im Alltag heißt „oder“ oft „entweder oder“: das soll bewusst passieren).

import '../../web/kern/logik.js';

const L = globalThis.WerkstattLogik;
const NEIN_WORT = /(^|[^\wäöüß])(kein|keine|keinen|keinem|keiner|nicht)([^\wäöüß]|$)/i;
const ODER_WORT = /(^|[^\wäöüß])oder([^\wäöüß]|$)/i;
const UND_WORT = /(^|[^\wäöüß])(und|aber)([^\wäöüß]|$)/i;

// Steht im Satz „kein/nicht“ genau bei diesem Teil der Regel (a=x bzw. a!=x)?
// Gesucht wird das Bild {x} nach dem Bild {a}; „kein/nicht“ zählt zwischen dem vorigen Bild und {x},
// „nicht“ hinter {x} nur am Satzende („… mag den {apfel} nicht.“). null: Satz ohne dieses Bild.
function verneintImSatz(teile, at) {
  const ia = teile.findIndex((t) => t.name === at.a);
  let ix = teile.findIndex((t, i) => i > ia && t.name === at.x);
  if (ix < 0) ix = teile.findIndex((t) => t.name === at.x);
  if (ix < 0) return null;
  let vor = '', nach = '', i;
  for (i = ix - 1; i >= 0 && teile[i].text !== undefined; i--) vor = teile[i].text + vor;
  for (i = ix + 1; i < teile.length && teile[i].text !== undefined; i++) nach += teile[i].text;
  const amEnde = i >= teile.length;
  return NEIN_WORT.test(vor) || (amEnde && /(^|[^\wäöüß])nicht([^\wäöüß]|$)/i.test(nach));
}

// Satz und Regel passen zusammen?
function pruefeSatz(text, regel, F, wo, opt) {
  if (typeof text !== 'string' || !text.trim()) return F(wo + ': text fehlt');
  let rg;
  try { rg = L.liesRegel(regel); } catch (e) { return F(wo + ': ' + e.message); }
  const at = L.atome(rg);
  const namenRegel = new Set(at.flatMap((a) => [a.a, a.x]));
  const namenText = L.tokenNamen(text);
  const woerter = opt.woerter || {};
  for (const n of namenText) if (!namenRegel.has(n)) F(wo + ': {' + n + '} steht im Satz, aber nicht in der Regel „' + regel + '“');
  if (!opt.ohneBilder) for (const n of namenRegel) if ((L.hat(n) || woerter[n]) && !namenText.includes(n)) F(wo + ': ' + n + ' steht in der Regel, aber nicht als {' + n + '} im Satz');
  const ohneToken = text.replace(/\{[^}]*\}/g, ' ');
  const neg = at.some((a) => a.nicht);
  if (neg !== NEIN_WORT.test(ohneToken)) F(wo + ': ' + (neg ? 'Regel mit != (nicht), aber im Satz fehlt „kein“ oder „nicht“' : 'im Satz steht „kein/nicht“, aber die Regel hat kein !='));
  // „kein/nicht“ auch an der richtigen Stelle? („mag kein {eis} und den {apfel}“ ist nicht „drache!=eis & drache!=apfel“)
  const teile = L.satz(text, woerter);
  for (const a of at) {
    const v = verneintImSatz(teile, a);
    if (v !== null && v !== a.nicht) F(wo + ': Bei {' + a.x + '} steht im Satz ' + (v ? '„kein/nicht“, aber die Regel sagt ' + a.a + '=' + a.x : 'kein „kein/nicht“, aber die Regel sagt ' + a.a + '!=' + a.x));
  }
  const oder = rg.oder.length > 1;
  if (oder !== ODER_WORT.test(ohneToken)) F(wo + ': ' + (oder ? 'Regel mit | (oder), aber im Satz fehlt „oder“' : 'im Satz steht „oder“, aber die Regel hat kein |'));
  const und = rg.oder.some((k) => k.und.length > 1);
  if (und && !UND_WORT.test(ohneToken)) F(wo + ': Regel mit & (und), aber im Satz fehlt „und“');
  if (!und && /(^|[^\wäöüß])und([^\wäöüß]|$)/i.test(ohneToken)) F(wo + ': im Satz steht „und“, aber die Regel hat kein &');
  return rg;
}

function pruefeGitter(r, F) {
  const { zeilen, spalten } = r;
  if (!Array.isArray(zeilen) || !Array.isArray(spalten)) return F('gitter braucht zeilen und spalten');
  const n = zeilen.length;
  if (n < 2 || n > 4) F('Logikgitter mit 2 bis 4 Zeilen (normal höchstens 3, 4 nur im Schwerer-Teil)');
  if (spalten.length !== n) F('Logikgitter muss quadratisch sein: ' + n + ' Zeilen, ' + spalten.length + ' Spalten');
  const alle = zeilen.concat(spalten);
  if (new Set(alle).size !== alle.length) F('Namen doppelt (Zeilen und Spalten zusammen)');
  for (const name of alle) if (!L.hat(name) && !(r.woerter && r.woerter[name])) F('„' + name + '“ hat kein Bild in web/kern/logik.js und kein Wort in "woerter"');
  const hinweise = r.hinweise || [];
  if (!hinweise.length) F('Logikgitter ohne Hinweise');
  if (hinweise.length > 6) F('Höchstens 6 Hinweise (ein Kind liest jeden Satz selbst)');
  hinweise.forEach((h, i) => {
    const wo = 'Hinweis ' + (i + 1);
    const rg = pruefeSatz(h.text, h.regel, F, wo, { ohneBilder: r.ohneBilder, woerter: r.woerter });
    if (!rg) return;
    for (const a of L.atome(rg)) {
      if (!zeilen.includes(a.a)) F(wo + ': „' + a.a + '“ ist keine Zeile (' + zeilen.join(', ') + ')');
      if (!spalten.includes(a.x)) F(wo + ': „' + a.x + '“ ist keine Spalte (' + spalten.join(', ') + ')');
    }
  });

  const alleIdx = hinweise.map((h, i) => i);
  let haupt, ohneFalsch = null;
  if (r.falscherHinweis !== undefined) {
    // Kobold-Hinweis: ein Satz stimmt nicht
    const k = r.falscherHinweis - 1;
    if (!(k >= 0 && k < hinweise.length)) return F('falscherHinweis muss eine Hinweis-Nummer sein (1 bis ' + hinweise.length + ')');
    const mitAllen = L.loese(r);
    if (mitAllen.anzahl) F('falscherHinweis: Mit allen Hinweisen gibt es ' + mitAllen.anzahl + ' Lösung(en), es soll keine geben');
    const kandidaten = alleIdx.filter((i) => L.loese(r, { ohne: [i] }).anzahl > 0);
    if (kandidaten.length !== 1 || kandidaten[0] !== k) F('falscherHinweis: Ohne Hinweis ' + kandidaten.map((i) => i + 1).join(', ') + ' gibt es eine Lösung (soll: nur ohne Hinweis ' + (k + 1) + ')');
    haupt = L.loese(r, { ohne: [k] });
    if (haupt.anzahl !== 1) F('falscherHinweis: Ohne Hinweis ' + (k + 1) + ' gibt es ' + haupt.anzahl + ' Lösungen, es soll genau eine sein');
    ohneFalsch = k;
  } else {
    haupt = L.loese(r);
    const soll = r.erwarteteLoesungen || 1;
    if (haupt.anzahl !== soll) {
      const bsp = haupt.loesungen.slice(0, 3).map((z) => zeilen.map((a) => a + '=' + z[a]).join(' ')).join(' | ');
      F(haupt.anzahl === 0 ? 'Keine Lösung: die Hinweise widersprechen sich' : 'Es gibt ' + haupt.anzahl + ' Lösungen (soll ' + soll + '), z. B. ' + bsp);
    }
  }

  // Welche Hinweise sind nötig? (Bericht und Prüfung „überflüssig“)
  const basis = alleIdx.filter((i) => i !== ohneFalsch);
  const ueber = [];
  if (haupt.anzahl === 1) {
    for (const i of basis) {
      const ohne = ohneFalsch === null ? [i] : [i, ohneFalsch];
      if (L.loese(r, { ohne }).anzahl === 1) ueber.push(i + 1);
    }
    const soll = (r.ueberfluessig || []).slice().sort((a, b) => a - b);
    if (ueber.join(',') !== soll.join(',')) {
      if (!soll.length) F('Hinweis ' + ueber.join(', ') + ' ist überflüssig (es geht auch ohne). Weglassen oder "ueberfluessig": [' + ueber.join(', ') + '] setzen');
      else F('"ueberfluessig": [' + soll.join(', ') + '], aber der Löser findet überflüssig: [' + ueber.join(', ') + ']');
    }
  }

  // Oder-Hinweis mit zwei wahren Teilen? Im Alltag heißt „oder“ oft „entweder oder“: nur mit "beideWahr": true
  hinweise.forEach((h, i) => {
    if (i === ohneFalsch) return;
    let rg;
    try { rg = L.liesRegel(h.regel); } catch (e) { return; }
    if (rg.oder.length < 2) return;
    const beide = haupt.loesungen.some((zuo) => L.teilWerte(rg, (a, x) => zuo[a] === x).filter(Boolean).length > 1);
    if (beide && !h.beideWahr) F('Hinweis ' + (i + 1) + ': Oder-Hinweis, bei dem in der Lösung beide Teile wahr sind. Im Alltag heißt „oder“ oft „entweder oder“: anders wählen oder "beideWahr": true');
    if (!beide && h.beideWahr) F('Hinweis ' + (i + 1) + ': "beideWahr" gesetzt, aber in der Lösung sind nicht beide Teile wahr');
  });

  const zu = haupt.anzahl === 1 ? haupt.loesungen[0] : null;
  const marken = {};
  if (zu) for (const a of zeilen) for (const x of spalten) marken[a + '|' + x] = zu[a] === x ? 'ja' : 'nein';

  // Vorgabe mit Kobold-Zeichen
  let kobold = null;
  if (r.vorgabe) {
    if (!zu) F('vorgabe braucht ein eindeutiges Rätsel');
    const falsch = [];
    const gesehen = new Set();
    for (const art of ['ja', 'nein']) {
      for (const [a, x] of r.vorgabe[art] || []) {
        if (!zeilen.includes(a) || !spalten.includes(x)) { F('vorgabe: Feld ' + a + '/' + x + ' gibt es nicht'); continue; }
        if (gesehen.has(a + '|' + x)) F('vorgabe: Feld ' + a + '/' + x + ' hat zwei Zeichen');
        gesehen.add(a + '|' + x);
        if (zu && marken[a + '|' + x] !== art) falsch.push({ art, feld: [a, x] });
      }
    }
    if (r.kobold) {
      const kArt = r.kobold.ja ? 'ja' : 'nein';
      const kFeld = r.kobold[kArt];
      if (falsch.length !== 1) F('Kobold: ' + falsch.length + ' falsche Zeichen in der Vorgabe (soll genau 1)');
      else if (falsch[0].art !== kArt || falsch[0].feld.join('|') !== (kFeld || []).join('|')) F('Kobold: falsch ist ' + falsch[0].art + ' bei ' + falsch[0].feld.join('/') + ', nicht ' + kArt + ' bei ' + (kFeld || []).join('/'));
      kobold = falsch[0] || null;
    } else if (falsch.length) F('vorgabe hat ' + falsch.length + ' falsche Zeichen (ohne "kobold")');
  } else if (r.kobold) F('kobold braucht eine vorgabe');

  return {
    n, zuordnung: zu, marken, anzahl: haupt.anzahl, schritte: haupt.schritte,
    loesungen: haupt.anzahl > 1 ? haupt.loesungen : undefined,
    ueberfluessig: ueber, noetig: basis.map((i) => i + 1).filter((i) => !ueber.includes(i)),
    kobold, falscherHinweis: ohneFalsch === null ? null : ohneFalsch + 1,
    kreise: n, kreuze: n * n - n,
  };
}

function pruefeWahrFalsch(r, F) {
  if (!Array.isArray(r.szene) || !r.szene.length) return F('wahrfalsch braucht eine szene');
  for (const t of r.szene) {
    if (!t.tier) F('szene: tier fehlt');
    for (const d of [t.tier].concat(t.hat || [])) if (!r.ohneBilder && !L.hat(d)) F('szene: „' + d + '“ hat kein Bild');
  }
  const hatFn = L.szeneHat(r.szene);
  const tiere = r.szene.map((t) => t.tier);
  const werte = [];
  (r.aussagen || []).forEach((a, i) => {
    const wo = 'Satz ' + (i + 1);
    const rg = pruefeSatz(a.text, a.regel, F, wo, { ohneBilder: r.ohneBilder, woerter: r.woerter });
    if (!rg) { werte.push(null); return; }
    for (const at of L.atome(rg)) if (!tiere.includes(at.a)) F(wo + ': „' + at.a + '“ ist nicht in der Szene');
    const w = L.wert(rg, hatFn);
    werte.push(w);
    if (a.soll && (a.soll === 'wahr') !== w) F(wo + ': soll ' + a.soll + ', der Löser sagt ' + (w ? 'wahr' : 'falsch'));
    if (rg.oder.length > 1) {
      const teile = L.teilWerte(rg, hatFn).filter(Boolean).length;
      if (teile > 1 && !a.beideWahr) F(wo + ': Oder-Satz, bei dem ' + teile + ' Teile wahr sind. Im Alltag heißt „oder“ oft „entweder oder“: anders wählen oder "beideWahr": true');
      if (teile <= 1 && a.beideWahr) F(wo + ': "beideWahr" gesetzt, aber nicht beide Teile sind wahr');
    }
  });
  if (!werte.length) F('wahrfalsch ohne aussagen');
  if (werte.length >= 3 && (werte.every((w) => w) || werte.every((w) => !w))) F('Alle Sätze sind ' + (werte[0] ? 'wahr' : 'falsch') + ' – bitte mischen');
  return { werte, text: werte.map((w) => (w ? 'wahr' : 'falsch')) };
}

export default {
  art: 'logik',
  pruefe(r, F) {
    const aufgabe = r.aufgabe || 'gitter';
    if (aufgabe === 'gitter') return pruefeGitter(r, F);
    if (aufgabe === 'wahrfalsch') return pruefeWahrFalsch(r, F);
    return F('aufgabe muss „gitter“ oder „wahrfalsch“ sein');
  },
  bericht(r) {
    const l = r.loesung || {};
    if ((r.aufgabe || 'gitter') === 'wahrfalsch') return (l.text || []).join(' ');
    const n = r.zeilen.length;
    let t = n + '·' + n + ', ' + l.anzahl + ' Lösung' + (l.anzahl === 1 ? '' : 'en');
    if (l.zuordnung) t += ': ' + r.zeilen.map((a) => a + '=' + l.zuordnung[a]).join(' ');
    t += '; nötig: ' + ((l.noetig || []).join(',') || '–');
    if (l.ueberfluessig && l.ueberfluessig.length) t += '; überflüssig: ' + l.ueberfluessig.join(',');
    if (l.kobold) t += '; Kobold: ' + l.kobold.art + ' bei ' + l.kobold.feld.join('/');
    if (l.falscherHinweis) t += '; falsch: Hinweis ' + l.falscherHinweis;
    t += ' (' + l.schritte + ' Schritte)';
    return t;
  },
  // Die App bekommt nur das Rätsel, nie die Lösung: sie prüft mit WerkstattLogik.pruefeGitter
  // bzw. rechnet jeden Satz mit WerkstattLogik.wert am Bild aus (ohne "soll", ohne Kobold-Feld, ohne "ueberfluessig")
  fuerApp(r) {
    if (r.aufgabe === 'wahrfalsch') {
      const wf = { id: r.id, art: r.art, aufgabe: 'wahrfalsch', szene: r.szene, aussagen: (r.aussagen || []).map((a) => ({ text: a.text, regel: a.regel })) };
      if (r.titel) wf.titel = r.titel;
      if (r.woerter) wf.woerter = r.woerter;
      return wf;
    }
    const aus = { id: r.id, art: r.art, aufgabe: r.aufgabe || 'gitter', zeilen: r.zeilen, spalten: r.spalten, hinweise: (r.hinweise || []).map((h) => ({ text: h.text, regel: h.regel })) };
    if (r.titel) aus.titel = r.titel;
    if (r.woerter) aus.woerter = r.woerter;
    if (r.vorgabe) aus.vorgabe = r.vorgabe;
    return aus;
  },
};
