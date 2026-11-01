// Rätselart „kaestchen“ (Einheit 8, Bilder aus Kästchen): prüfen, lösen, beweisen
//
// Die gemeinsame Logik (Code lesen, ausrollen, Zahlen zählen, kürzester Code, Zeichnen)
// steht in web/kern/kaestchen.js und ist dieselbe für Löser, Blätter und Web-App.
//
// Felder (raetsel/e8.json), immer "art": "kaestchen" und "aufgabe":
//   malen      b, h, code (Liste der Zeilen), optional bild (zur Kontrolle), titel (was es ist),
//              farben (erlaubte Farben), richtung: "spalten" (Code Spalte für Spalte),
//              format: "zahlen" (nur Zahlen, abwechselnd weiß und schwarz, zuerst weiß),
//              zahlen (erwartete Zahl der Zahlen im Code), artikel: "ein" (Standard) oder "eine"
//              (die App sagt nach dem Malen „Es ist ein Hase!“)
//              Bild nach Code malen
//   schreiben  bild, optional code (so soll die Lösung lauten), titel
//              Code zu einem fertigen Bild schreiben
//   kobold     bild (so soll es aussehen), code (eine Zeile hat der Kobold verändert), optional
//              zeile (erwartete Kobold-Zeile, ab 1), spiegel: true (das Bild ist links und rechts
//              gleich, nur die Kobold-Zeile nicht), fehler: "summe" | "bild" (erwartete Art),
//              verschoben: true (der Kobold hat nur Kästchen verschoben: gleich viele jeder Farbe)
//   kuerzer    bild oder lang (Code ohne Kasten), kurz (Code mit Zauber-Kasten), optional
//              kuerzest: true (kurz ist der kürzeste Code überhaupt), zeilen: [3, 6] (nur diese Zeilen)
//   zaehlen    bild, optional erwartet: { zeilen, spalten } (wie viele Zahlen Zeile für Zeile
//              bzw. Spalte für Spalte)
//
// Was bewiesen wird (AUFTRAG.md Abschnitt 10):
//   - Code ↔ Bild exakt: jede Zeile hat genau die Breite (Summe der Zahlen = b), so viele Zeilen wie h,
//     das Lösungsbild wird aus dem Code berechnet (und mit bild verglichen, falls angegeben)
//   - schreiben: der Code wird aus dem Bild berechnet (Teile so groß wie möglich: nebeneinander
//     gleiche Farben zusammen), ein angegebener Code muss genau dieser sein
//   - kobold: genau eine Zeile weicht ab; mit spiegel ist das Soll-Bild spiegelgleich und das
//     gemalte Kobold-Bild in genau dieser einen Zeile nicht. Stimmt die Summe (fehler "bild"), ist
//     spiegel Pflicht (sonst findet niemand den Kobold). Mit spiegel: alle anderen Zeilen derselben
//     Form, die das Bild links und rechts gleich machen (loesung.auch, „auch richtig“); mit verschoben:
//     die gemeinte Reparatur ist die einzige davon mit gleich vielen Kästchen jeder Farbe
//   - Code-Regel „gleiche Farben zusammen“: nie zwei Teile derselben Farbe direkt nebeneinander
//   - kuerzer: kurz malt genau dasselbe Bild und braucht weniger Zahlen; kürzester Code per
//     Suche über alle Zauber-Kästen (2- bis 5-mal, 1 bis 3 Teile, Zeilen-Kasten mit 1 bis 3 Zeilen,
//     nicht verschachtelt)

import '../../web/kern/kaestchen.js';

const KK = globalThis.WerkstattKaestchen;
const AUFGABEN = ['malen', 'schreiben', 'kobold', 'kuerzer', 'zaehlen'];
const MAX_B = 16;   // 16 cm passen auf ein Blatt
const MAX_H = 16;

function versuch(F, fn, was) {
  try { return fn(); } catch (e) { F((was ? was + ': ' : '') + e.message); return null; }
}
function pruefeGroesse(F, b, h) {
  if (!Number.isInteger(b) || b < 2 || b > MAX_B) F('b (Breite) muss 2 bis ' + MAX_B + ' sein');
  if (!Number.isInteger(h) || h < 1 || h > MAX_H) F('h (Höhe) muss 1 bis ' + MAX_H + ' sein');
}
function pruefeFarben(F, r, bild) {
  const da = KK.farbenIn(bild);
  if (r.farben !== undefined) {
    if (!Array.isArray(r.farben) || r.farben.some((f) => !KK.FARBEN[f])) return F('farben: Liste aus ' + Object.keys(KK.FARBEN).join(', '));
    const fremd = da.filter((f) => !r.farben.includes(f));
    if (fremd.length) F('Das Bild hat Farben, die nicht in farben stehen: ' + fremd.join(', '));
  }
  return da;
}
// Regel „Gleiche Farben zusammen“: Im geschriebenen Code stehen nie zwei Teile mit derselben Farbe
// direkt nebeneinander (nicht „1s 1s“, sondern „2s“), auch nicht im Zauber-Kasten der Zeile.
function pruefeNachbarn(F, code, was) {
  let eintraege;
  try { eintraege = KK.liesCode(code); } catch (e) { return; }
  const zeile = (z, nr) => {
    const t = z.teile;
    for (let i = 1; i < t.length; i++) {
      if (!t[i].wdh && !t[i - 1].wdh && t[i].f === t[i - 1].f) F(was + ' Zeile ' + nr + ': „' + t[i - 1].n + t[i].f + ' ' + t[i].n + t[i].f + '“ nebeneinander, das ist „' + (t[i - 1].n + t[i].n) + t[i].f + '“ (gleiche Farben zusammen)');
    }
    t.filter((x) => x.wdh).forEach((x) => {
      for (let i = 1; i < x.teile.length; i++) if (x.teile[i].f === x.teile[i - 1].f) F(was + ' Zeile ' + nr + ': im Zauber-Kasten zwei Teile mit derselben Farbe nebeneinander');
    });
  };
  eintraege.forEach((e, i) => (KK.istKasten(e) ? e.zeilen.forEach((z) => zeile(z, i + 1)) : zeile(e, i + 1)));
}
// Alle Zeilen derselben Form (dieselben Farben in derselben Reihenfolge, nur andere Zahlen), die genau
// b Kästchen breit sind (ohne Zauber-Kasten in der Zeile)
function zeilenGleicherForm(zeile, b) {
  const farben = zeile.teile.map((t) => t.f);
  const aus = [];
  (function suche(i, rest, zahlen) {
    if (i === farben.length - 1) { if (rest >= 1) aus.push(zahlen.concat([rest]).map((n, k) => n + farben[k]).join(' ')); return; }
    for (let n = 1; n <= rest - (farben.length - 1 - i); n++) suche(i + 1, rest - n, zahlen.concat([n]));
  })(0, b, []);
  return aus;
}
function zeilenInfo(code, r) {
  if (r.format === 'zahlen') return code.map((z, i) => ({ nr: i + 1, text: z, summe: KK.rolleZeile(KK.liesZahlen(z)).length }));
  return KK.liesCode(code).map((e, i) => ({ nr: i + 1, text: KK.eintragText(e), kasten: KK.istKasten(e) }));
}

const pruefen = {
  malen(r, F) {
    pruefeGroesse(F, r.b, r.h);
    if (!r.code) return F('malen braucht code');
    if (r.richtung !== undefined && !['zeilen', 'spalten'].includes(r.richtung)) F('richtung: zeilen oder spalten');
    if (r.format !== undefined && r.format !== 'zahlen') F('format: nur "zahlen"');
    if (r.artikel !== undefined && !['ein', 'eine'].includes(r.artikel)) F('artikel: "ein" oder "eine" (für „Es ist eine Tanne!“ in der App)');
    const code = Array.isArray(r.code) ? r.code : String(r.code).split(';').map((x) => x.trim());
    if (r.format !== 'zahlen') pruefeNachbarn(F, code, 'code');
    // dieselbe Rechnung wie in der App (web/kern/kaestchen.js malBild)
    const opt = { format: r.format, richtung: r.richtung };
    const bild = versuch(F, () => KK.malBild(code, opt), 'Code');
    if (!bild) return null;
    // jede Zeile (bzw. Spalte) genau so breit wie das Bild
    const reihen = KK.malReihen(code, opt);
    const soll = r.richtung === 'spalten' ? r.h : r.b;
    const anzahl = r.richtung === 'spalten' ? r.b : r.h;
    reihen.forEach((z, i) => { if (z.length !== soll) F((r.richtung === 'spalten' ? 'Spalte ' : 'Zeile ') + (i + 1) + ' malt ' + z.length + ' Kästchen, das Bild ist ' + soll + (r.richtung === 'spalten' ? ' hoch' : ' breit')); });
    if (reihen.length !== anzahl) F('Der Code malt ' + reihen.length + (r.richtung === 'spalten' ? ' Spalten, das Bild hat ' : ' Zeilen, das Bild hat ') + anzahl);
    if (r.bild !== undefined) {
      const erwartet = versuch(F, () => KK.liesBild(r.bild), 'bild');
      if (erwartet && !KK.gleich(erwartet, bild)) {
        const u = KK.unterschiede(erwartet, bild).map((i) => i + 1);
        F('Code und bild passen nicht zusammen, Unterschied in Zeile ' + u.join(', ') + ': Code malt ' + u.map((i) => KK.bildText([bild[i - 1] || []])[0]).join(' | '));
      }
    }
    const farben = pruefeFarben(F, r, bild);
    const zahlen = r.format === 'zahlen' ? code.reduce((s, z) => s + String(z).trim().split(/\s+/).length, 0) : KK.zahlen(code);
    if (r.zahlen !== undefined && r.zahlen !== zahlen) F('zahlen: Der Code hat ' + zahlen + ' Zahlen, nicht ' + r.zahlen);
    const rechteck = bild.every((z) => z.length === bild[0].length);
    const k = rechteck ? KK.kuerzester(bild) : null;
    return {
      bild: KK.bildText(bild), code: code.slice(), zeilen: zeilenInfo(code, r), zahlen, farben,
      anzahl: KK.zaehleFarben(bild), kanonisch: rechteck ? KK.codeAusBild(bild) : null,
      zahlenOhneKasten: rechteck ? KK.zahlenOhneKasten(bild) : null, kuerzester: k,
      spiegelgleich: rechteck ? KK.spiegelgleich(bild) : false,
    };
  },

  schreiben(r, F) {
    if (!r.bild) return F('schreiben braucht bild');
    const g = versuch(F, () => KK.pruefeRechteck(r.bild), 'bild');
    if (!g) return null;
    if (r.b !== undefined && r.b !== g.b) F('b ist ' + r.b + ', das Bild ist ' + g.b + ' breit');
    if (r.h !== undefined && r.h !== g.h) F('h ist ' + r.h + ', das Bild ist ' + g.h + ' hoch');
    const bild = KK.liesBild(r.bild);
    const code = KK.codeAusBild(bild);
    if (r.code !== undefined) {
      const angegeben = versuch(F, () => KK.codeText(r.code), 'code');
      if (angegeben) {
        angegeben.forEach((z, i) => { if (z !== code[i]) F('code Zeile ' + (i + 1) + ': angegeben „' + z + '“, aus dem Bild „' + (code[i] || '–') + '“'); });
        if (angegeben.length !== code.length) F('code hat ' + angegeben.length + ' Zeilen, das Bild ' + code.length);
      }
    }
    const farben = pruefeFarben(F, r, bild);
    return {
      b: g.b, h: g.h, bild: KK.bildText(bild), code, zahlen: KK.zahlen(code),
      teile: code.map((z) => KK.zahlenZeile(z)), farben, anzahl: KK.zaehleFarben(bild),
      spalten: { code: KK.codeSpalten(bild), zahlen: KK.zahlenOhneKasten(KK.spalten(bild)) },
      kuerzester: KK.kuerzester(bild), spiegelgleich: KK.spiegelgleich(bild),
    };
  },

  kobold(r, F) {
    if (!r.bild || !r.code) return F('kobold braucht bild (so soll es aussehen) und code (mit Kobold-Zeile)');
    const g = versuch(F, () => KK.pruefeRechteck(r.bild), 'bild');
    if (!g) return null;
    if (r.b !== undefined && r.b !== g.b) F('b ist ' + r.b + ', das Bild ist ' + g.b + ' breit');
    if (r.h !== undefined && r.h !== g.h) F('h ist ' + r.h + ', das Bild ist ' + g.h + ' hoch');
    const soll = KK.liesBild(r.bild);
    const liste = versuch(F, () => KK.zeilenListe(r.code), 'code');
    if (!liste) return null;
    pruefeNachbarn(F, r.code, 'code');
    const eintraege = KK.liesCode(r.code);
    const gemalt = liste.map((x) => KK.rolleZeile(x.zeile));
    if (gemalt.length !== soll.length) return F('Der Kobold-Code malt ' + gemalt.length + ' Zeilen, das Bild hat ' + soll.length + ' (der Kobold soll nur eine Zeile verändern)');
    const anders = KK.unterschiede(soll, gemalt);
    if (anders.length !== 1) return F('Genau eine Zeile muss anders sein, es sind ' + anders.length + (anders.length ? ' (Zeile ' + anders.map((i) => i + 1).join(', ') + ')' : ''));
    const i = anders[0];
    const herkunft = liste[i];
    if (KK.istKasten(eintraege[herkunft.eintrag])) F('Die Kobold-Zeile steht in einem Zeilen-Kasten: dann wäre sie mehrmals falsch');
    if (r.zeile !== undefined && r.zeile !== i + 1) F('zeile: erwartet ' + r.zeile + ', anders ist Zeile ' + (i + 1));
    const kaputt = KK.zeileText(herkunft.zeile);
    const richtig = KK.zeileText(KK.zeileAusReihe(soll[i]));
    const summe = gemalt[i].length;
    const art = summe !== g.b ? 'summe' : 'bild';
    if (r.fehler !== undefined && r.fehler !== art) F('fehler: erwartet „' + r.fehler + '“, es ist „' + art + '“ (Summe ' + summe + ', Breite ' + g.b + ')');
    // Gleiche Form: dieselben Farben in derselben Reihenfolge, nur Zahlen anders (in der App mit + und − reparierbar)
    const formK = herkunft.zeile.teile.map((t) => (t.wdh ? 'K' + t.teile.map((u) => u.f).join('') : t.f)).join(',');
    const formR = KK.liesZeile(richtig).teile.map((t) => t.f).join(',');
    let reparatur = richtig;
    let gleicheForm = formK === formR;
    if (!gleicheForm && herkunft.zeile.teile.some((t) => t.wdh)) {
      // Kobold in einem Zauber-Kasten der Zeile: die Reparatur behält den Kasten, nur die Zahlen ändern sich
      const t2 = herkunft.zeile.teile.map((t) => ({ ...t }));
      reparatur = null;
      for (let j = 0; j < t2.length && !reparatur; j++) {
        if (!t2[j].wdh) continue;
        for (let w = KK.WDH_MIN; w <= KK.WDH_MAX && !reparatur; w++) {
          const neu = t2.map((t, k) => (k === j ? { ...t, wdh: w } : t));
          if (KK.gleicheReihe(KK.rolleZeile({ teile: neu }), soll[i])) reparatur = KK.zeileText({ teile: neu });
        }
      }
      if (!reparatur) { reparatur = richtig; gleicheForm = false; } else gleicheForm = true;
    }
    // Stimmt die Summe, hilft die Kobold-Probe nicht: Dann muss man den Kobold am Bild sehen können
    if (art === 'bild' && !r.spiegel) F('Die Kobold-Zeile hat die richtige Breite (Summe ' + summe + '): Dann findet man sie nur am Bild. Das geht nur, wenn das Bild links und rechts gleich ist (spiegel: true)');
    if (r.verschoben !== undefined && !r.spiegel) F('verschoben nur mit spiegel');
    let auch = [];
    if (r.spiegel) {
      if (!KK.spiegelgleich(soll)) F('spiegel: Das Soll-Bild ist nicht links und rechts gleich');
      const schief = gemalt.map((z, k) => (z.length === g.b && KK.spiegelgleicheReihe(z) ? -1 : k)).filter((k) => k >= 0);
      if (schief.length !== 1 || schief[0] !== i) F('spiegel: Im gemalten Kobold-Bild ist nicht genau die Kobold-Zeile schief (schief: ' + schief.map((k) => k + 1).join(', ') + ')');
      // Wie beim Kobold-Programm (AUFTRAG 10): Die gemeinte Reparatur ist eine, aber jede Zeile derselben
      // Form, die das Bild links und rechts gleich macht, ist auch eine Reparatur („Auch richtig: …“)
      if (!herkunft.zeile.teile.some((t) => t.wdh)) {
        const gerade = zeilenGleicherForm(herkunft.zeile, g.b).filter((z) => KK.spiegelgleicheReihe(KK.rolleZeile(z)));
        if (gleicheForm && !gerade.includes(reparatur)) F('spiegel: Die Reparatur „' + reparatur + '“ hat nicht die Form der Kobold-Zeile');
        auch = gerade.filter((z) => z !== reparatur);
        // verschoben: Der Kobold hat nur Kästchen verschoben (gleich viele von jeder Farbe), und unter den
        // Zeilen, die links und rechts gleich sind, hat nur die gemeinte Reparatur diese Farb-Anzahl
        if (r.verschoben) {
          const anzahl = (z) => JSON.stringify(KK.zaehleFarben([KK.rolleZeile(z)]));
          if (anzahl(kaputt) !== anzahl(reparatur)) F('verschoben: Die Kobold-Zeile hat andere Farb-Anzahlen als die Reparatur');
          const gleichViele = gerade.filter((z) => anzahl(z) === anzahl(kaputt));
          if (gleichViele.length !== 1 || gleichViele[0] !== reparatur) F('verschoben: Mit gleich vielen Kästchen jeder Farbe gibt es mehrere Reparaturen: ' + gleichViele.join(' | '));
        }
      } else if (r.verschoben) F('verschoben: nur für Zeilen ohne Zauber-Kasten');
    }
    return {
      b: g.b, h: g.h, bild: KK.bildText(soll), zeile: i + 1, kaputt, richtig, reparatur, summe, fehlerArt: art, gleicheForm, auch,
      gemalt: gemalt.map((z) => KK.bildText([z])[0]), code: eintraege.map(KK.eintragText), farben: KK.farbenIn(soll),
      zahlenKaputt: KK.zahlenZeile(kaputt), zahlenRichtig: KK.zahlenZeile(richtig),
    };
  },

  kuerzer(r, F) {
    if (!r.kurz || (!r.bild && !r.lang)) return F('kuerzer braucht kurz und bild oder lang');
    let bild;
    if (r.bild) bild = versuch(F, () => { KK.pruefeRechteck(r.bild); return KK.liesBild(r.bild); }, 'bild');
    else bild = versuch(F, () => KK.ausrollen(r.lang), 'lang');
    if (!bild) return null;
    const lang = KK.codeAusBild(bild);
    if (r.lang) {
      const l = versuch(F, () => KK.codeText(r.lang), 'lang');
      if (l && l.some((z) => /[\[{]/.test(z))) F('lang soll ohne Zauber-Kasten sein');
      if (l && r.bild && !KK.gleich(KK.ausrollen(l), bild)) F('lang malt nicht das bild');
    }
    const kurz = versuch(F, () => KK.ausrollen(r.kurz), 'kurz');
    if (!kurz) return null;
    pruefeNachbarn(F, r.kurz, 'kurz');
    // nur ein Ausschnitt (zeilen: [von, bis]) oder das ganze Bild
    let teil = bild, von = 1;
    if (r.zeilen !== undefined) {
      const z = r.zeilen;
      if (!Array.isArray(z) || z.length !== 2 || !(z[0] >= 1 && z[1] <= bild.length && z[0] < z[1])) return F('zeilen: [von, bis] innerhalb des Bilds');
      teil = bild.slice(z[0] - 1, z[1]);
      von = z[0];
    }
    if (!KK.gleich(teil, kurz)) F('kurz malt nicht dasselbe wie ' + (r.zeilen ? 'die Zeilen ' + r.zeilen.join(' bis ') : 'das Bild') + ' (Unterschied in Zeile ' + KK.unterschiede(teil, kurz).map((i) => i + von).join(', ') + ')');
    const zahlenLang = KK.zahlenOhneKasten(teil);
    const zahlenKurz = KK.zahlen(r.kurz);
    if (zahlenKurz >= zahlenLang) F('kurz ist nicht kürzer: ' + zahlenKurz + ' Zahlen statt ' + zahlenLang);
    const k = KK.kuerzester(teil);
    if (r.kuerzest && zahlenKurz !== k.zahlen) F('kuerzest: Es geht noch kürzer, mit ' + k.zahlen + ' Zahlen: ' + k.code.join('; '));
    return {
      bild: KK.bildText(bild), lang, langTeil: KK.codeAusBild(teil), kurz: KK.codeText(r.kurz), zahlenLang, zahlenKurz,
      zahlenGanzLang: KK.zahlenOhneKasten(bild), kuerzester: k, istKuerzest: zahlenKurz === k.zahlen, zeilen: r.zeilen || null,
    };
  },

  zaehlen(r, F) {
    if (!r.bild) return F('zaehlen braucht bild');
    const g = versuch(F, () => KK.pruefeRechteck(r.bild), 'bild');
    if (!g) return null;
    const bild = KK.liesBild(r.bild);
    const zeilen = KK.zahlenOhneKasten(bild);
    const sp = KK.zahlenOhneKasten(KK.spalten(bild));
    if (r.erwartet) {
      if (r.erwartet.zeilen !== undefined && r.erwartet.zeilen !== zeilen) F('erwartet.zeilen: ' + r.erwartet.zeilen + ', es sind ' + zeilen + ' Zahlen');
      if (r.erwartet.spalten !== undefined && r.erwartet.spalten !== sp) F('erwartet.spalten: ' + r.erwartet.spalten + ', es sind ' + sp + ' Zahlen');
    }
    return {
      b: g.b, h: g.h, bild: KK.bildText(bild), zeilen, spalten: sp, codeZeilen: KK.codeAusBild(bild), codeSpalten: KK.codeSpalten(bild),
      kuerzester: KK.kuerzester(bild), kuerzesterSpalten: KK.kuerzester(KK.spalten(bild)),
    };
  },
};

export default {
  art: 'kaestchen',
  pruefe(r, F) {
    if (!AUFGABEN.includes(r.aufgabe)) return F('aufgabe muss ' + AUFGABEN.join(', ') + ' sein');
    return pruefen[r.aufgabe](r, F);
  },
  bericht(r) {
    const l = r.loesung || {};
    if (r.aufgabe === 'malen') return 'malen ' + r.b + '·' + r.h + (r.titel ? ' „' + r.titel + '“' : '') + ': ' + l.zahlen + ' Zahlen' + (l.kuerzester ? ', kürzester Code ' + l.kuerzester.zahlen : '') + ' | ' + (l.bild || []).join('/');
    if (r.aufgabe === 'schreiben') return 'schreiben ' + l.b + '·' + l.h + ': ' + (l.code || []).join(' | ') + ' (' + l.zahlen + ' Zahlen, Spalten ' + (l.spalten || {}).zahlen + ')';
    if (r.aufgabe === 'kobold') return 'kobold: Zeile ' + l.zeile + ' „' + l.kaputt + '“ statt „' + l.richtig + '“ (' + l.fehlerArt + ', Summe ' + l.summe + (l.gleicheForm ? ', gleiche Form' : '') + ')' + (l.auch && l.auch.length ? ', auch links und rechts gleich: ' + l.auch.join(' | ') : '');
    if (r.aufgabe === 'kuerzer') return 'kuerzer: ' + l.zahlenLang + ' → ' + l.zahlenKurz + ' Zahlen, kürzester ' + (l.kuerzester || {}).zahlen + ': ' + ((l.kuerzester || {}).code || []).join('; ');
    if (r.aufgabe === 'zaehlen') return 'zaehlen: Zeilen ' + l.zeilen + ', Spalten ' + l.spalten + ' Zahlen';
    return JSON.stringify(l).slice(0, 90);
  },
  // Für die App: nur die Aufgabe, nie die Lösung. Malen: der Code (das Bild rechnet die App selbst aus,
  // web/kern/kaestchen.js ausrollen). Schreiben: das Bild (den Code baut das Kind). Kobold: Code mit
  // Kobold-Zeile und das Soll-Bild als Ziel („So soll es aussehen“), aber nicht, welche Zeile falsch ist.
  // name: was das Bild zeigt (beim Malen die Auflösung, also erst im Geschafft-Fenster zeigen).
  // farben: die Farben, die im Bild vorkommen (für die Farb-Tasten), immer mit "w".
  fuerApp(r) {
    const farben = Array.from(new Set(['w'].concat((r.loesung && r.loesung.farben) || r.farben || [])));
    const basis = { id: r.id, art: r.art, aufgabe: r.aufgabe, name: r.titel || '', farben };
    if (r.aufgabe === 'malen') return { ...basis, b: r.b, h: r.h, code: r.code, richtung: r.richtung || 'zeilen', format: r.format || '', artikel: r.artikel || 'ein' };
    if (r.aufgabe === 'schreiben') return { ...basis, b: r.loesung.b, h: r.loesung.h, bild: r.bild };
    if (r.aufgabe === 'kobold') return { ...basis, b: r.loesung.b, h: r.loesung.h, bild: r.bild, code: r.code };
    if (r.aufgabe === 'kuerzer') return { ...basis, bild: r.loesung.bild, zahlenLang: r.loesung.zahlenLang };
    return { ...basis, bild: r.bild };
  },
};
