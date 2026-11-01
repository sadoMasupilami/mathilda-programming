# Autoren-Leitfaden: eine Einheit schreiben

Eine Einheit besteht aus

- **einer HTML-Datei** `src/einheiten/NN-name.html` (nur Inhalt, kein `<html>`/`<head>`): zuerst die Anleitung für Mama oder Papa, danach 1–3 Blätter für das Kind,
- **ihren Rätseln** in `raetsel/eN.json` (Gitter, Programme, Kobold-Programme, Ablauf-Karten …). Dieselbe Datei liefert die Level der Web-App.

Reihenfolge im Buch: `src/buch.json`. Vorbild mit allen Bausteinen: `src/einheiten/00-muster.html` + `raetsel/e0-muster.json`. Begriffe, Symbole und Gitter-Regeln: `plan/lehrplan.md` **verbindlich** (Kurzfassung unten in Abschnitt 6).

```bash
./baue.sh --nur 03 --png --dpi 110   # nur Einheit 3, Seitenbilder in out/seiten-03/
./baue.sh                            # ganzes Buch + Kopiervorlagen
werkzeuge/mit-nix.sh node werkzeuge/raetsel.mjs --bericht   # nur die Rätsel lösen und prüfen
```

Der Build bricht mit ❌ ab, wenn ein Rätsel nicht eindeutig (und nicht gekennzeichnet) ist, eine Rechnung falsch ist, ein Blatt überläuft, ein Pflichtteil fehlt, die Schrift auf einem Blatt zu klein ist (auch gezeichnete Schrift in SVG, Abschnitt 3), ein Zeichen in der Schrift fehlt, ein QR-Code nicht lesbar ist oder der Name des Kindes in einer Quelldatei steht. Warnungen (⚠️) bitte auch beheben.

## 0. Datenschutz: der Name

Der Name des Kindes steht **nirgends** im Repo. In allen Quellen steht `{{KIND}}`, beim Bauen wird der Name aus `kind.json` (nicht eingecheckt) eingesetzt: „{{KIND}}, kannst du den Drachen zum Schatz programmieren?“, „{{KIND}}s Sammelpass“. Der Build prüft alle Dateien, die ins Repo kommen, und bricht ab, wenn der echte Name irgendwo steht (auch in Kommentaren).

## 1. Grundgerüst

```html
<section class="spick nur-buch" data-einheit="2" data-titel="Drachen-Pfade">  … Spickzettel … </section>

<section class="anleitung" data-einheit="2" data-titel="Drachen-Pfade">
  … Anleitung …
  <h2>Lösungen</h2>
  <m-loesungen einheit="2"></m-loesungen>
</section>

<section class="blatt" data-einheit="2" data-titel="Drachen-Pfade">  … </section>
<section class="blatt" data-einheit="2" data-titel="Meine Drachen-Figur" data-art="Bastelvorlage"> … </section>
```

- Kopf der Anleitung (Nummer, Titel, Block, Minuten) entsteht automatisch.
- Blätter werden automatisch nummeriert (Blatt 2-1, 2-2 …), bekommen Kopf mit Titel und „Geschafft?“-Stern und eine Fußzeile. `data-art` (Arbeitsblatt, Spielplan, Karten, Bastelvorlage) steht in der Fußzeile.
- Verweis auf ein Blatt in der Anleitung: `<a class="blattref" href="#blatt-2-2"></a>` → „Blatt 2-2 (S. 17)“.
- Eigene CSS-Regeln in einem `<style>`-Block oben in der Einheit, Klassen mit Präfix `eNN-` (z. B. `.e02-reihe`). `src/styles.css`, `src/components.js`, `src/bausteine/programmieren.js` und `web/kern/*.js` nicht ändern (gemeinsamer Kern). Braucht eine Einheit einen eigenen Baustein, kommt er in eine eigene Datei `src/bausteine/eN-name.js` (Muster: `programmieren.js`, Anmeldung über `window.__bausteine`, Hilfen über `window.__hilfen`).

## 2. Anleitung: Pflichtteile

Fehlt einer davon, bricht der Build ab. Überschriften der Kästen entstehen automatisch.

| Markup | Überschrift |
|---|---|
| `<div class="kasten ziel">` | Darum geht's heute |
| `<div class="kasten material">` | Material & Vorbereitung. **Vorbereitung ohne Kind getrennt und mit Minuten** (Liste „Vorher, ohne {{KIND}} (10 Min)“). Aufwändiges Basteln als Extra außerhalb der Einheit kennzeichnen |
| `<ol class="ablauf"><li data-min="5"><span class="schritt-titel">…</span> …</li></ol>` | Schritte mit Minuten; Summe wird angezeigt, Ziel 20–30 |
| `<div class="sag"><p class="du">„…“</p><p class="sie">„…“</p><p class="dann">…</p></div>` | Beispielsätze (Du / {{KIND}} / Hinweis) |
| `<div class="kasten stolper">` | Stolpersteine |
| `<m-linksrechts></m-linksrechts>` | Hilfen für links und rechts – **Pflicht in jeder Einheit mit Gitter oder Programm-Reihe** (immer derselbe Text) |
| `<div class="kasten leichter">` | Leichter machen |
| `<div class="kasten schwerer">` | Schwerer machen (**ausführlich!** Das Kind ist schnell, das ist ein vollwertiger Hauptteil) |
| `<div class="kasten bonus">` | Bonus-Knobelei für zwischendurch (ohne Papier: Auto, Abendessen) mit Kurz-Lösung |
| `<div class="kasten warum">` | Was hat das mit echtem Programmieren zu tun? (Fachwörter hier erklären) |
| `<div class="kasten bildschirm">` | Bildschirm-Bonus: welche Levels passen, wann das Gerät wieder weggelegt wird (Einheit 1: „heute kein Bildschirm“) |
| `<m-loesungen einheit="N">` | alle Blätter verkleinert mit roten Lösungen |

Lange Tabellen, die umbrechen dürfen: `<table class="tab darf-brechen">`. Kästen auch auf fließenden Rahmenseiten (`<section class="fliess">`) bekommen ihre Überschrift automatisch. Weitere Kästen: `kasten spiel` (mit `data-titel="Roboter-Koch"` → „Spiel: Roboter-Koch“), `kasten bewegung`, `kasten basteln`, `kasten tipp`, `kasten einschaetzung`, `kasten loesung` (Text-Lösungen), `kasten material`. Zwei Kästen nebeneinander: `<div class="zwei">…</div>`. Tabellen: `<table class="tab">`. Ein Begriff aus der Begriffsliste beim ersten Auftreten: `<span class="begriff">Wiederhol-Zauber</span>`.

Spielregeln immer so, dass sie **zu zweit** mit Haushaltsmaterial funktionieren: Material, Vorbereitung, Ziel, Ablauf eines Zuges, Ende/Gewinner, Varianten. Einmal im Kopf durchspielen.

Überschriften `<h2>` in der Anleitung (in dieser Reihenfolge, wenn passend): „Ablauf Schritt für Schritt“, „Spiele, Bewegung und Basteln“, „Wenn es hakt oder zu leicht ist“, „Hintergrund“, „Bildschirm-Bonus“, „Lösungen“.

## 2a. Spickzettel: Kurzfassung auf höchstens zwei Seiten

Zum Mitnehmen beim Durchführen, beidseitig gedruckt ein Blatt. Steht im Buch direkt vor der Anleitung und gesammelt in `out/spickzettel.pdf`. Fließt über höchstens zwei Seiten (wird geprüft), lange Schritte dürfen umbrechen, Regelkästen, Tabellen und Sätze bleiben ganz. Der Kopf entsteht automatisch, die Anleitung verweist mit „Kurzfassung: Spickzettel (S. n)“ zurück.

Aufbau: oben die Vorbereitung, dann der Ablauf als **Drehbuch** (pro Schritt: was zu tun ist, die Spielregeln in Kürze, die Sätze zum Sagen), am Ende Hilfen und Schluss. So muss man beim Durchführen nicht blättern.

```html
<section class="spick nur-buch" data-einheit="2" data-titel="Drachen-Pfade">
  <p class="spick-kern"><b>Darum geht’s:</b> …</p>
  <div class="spick-zwei breit-links">
    <div class="spick-block vorher"><h2>Vorher, ohne {{KIND}} <small>· etwa 25 Min</small></h2><ul class="check"><li>… <span class="min">10 Min</span></li></ul></div>
    <div class="spick-block vorher"><h2>Bereitlegen</h2><ul class="check">…</ul></div>
  </div>
  <h2>Gemeinsam</h2>
  <ol class="spick-ablauf">
    <li data-min="7"><div><b>Spiel „Schatz-Versteck“.</b> Das Hauptspiel, 4 Runden.
      <div class="spick-spiel"><h3>Schatz-Versteck</h3><p class="meta">Material</p>
        <ul><li><b>Rollen:</b> …</li><li><b>Ein Zug:</b> …</li><li><b>Punkte:</b> …</li><li><b>Ende:</b> …</li></ul></div>
      <div class="sag"><p class="du">„…“</p><p class="sie">„…“</p><p class="dann">Hinweis</p></div>
    </div></li>
  </ol>
  <div class="spick-zwei">
    <div class="spick-block stolper"><h2>Wenn es hakt</h2><ul>…</ul></div>
    <div class="spick-block schwerer"><h2>Zu leicht?</h2><ul>…</ul></div>
  </div>
  <div class="spick-block schluss"><h2>Zum Schluss nicht vergessen</h2><ul class="check">…</ul></div>
</section>
```

- `ol.spick-ablauf` braucht **dieselben Schritte mit denselben Minuten** wie `ol.ablauf` der Anleitung (wird geprüft). Ändert sich der Ablauf, den Spickzettel mitziehen.
- Der Schritt-Text sagt nur, was nicht schon im Regelkasten steht. Mehrere Satz-Gruppen in einem Schritt bekommen je eine `<p class="unterzeile">` davor. Tabellen: `<table class="spick-tab">` (z. B. „Kind sagt / Roboter macht“).
- `ul.check` zeichnet Abhak-Kästchen. Keine Verweise auf Rahmenseiten (`#rueckmeldebogen` …), sonst scheitert der Teil-Build; Blätter (`#blatt-N-M`) und die eigene Anleitung gehen.
- Die Einleitung verweist auf jeden Spickzettel (`#spick-N`). Bei einer neuen Einheit dort ergänzen.
- Zu lang? Zuerst doppelte Stellen streichen (Schritt-Text gegen Regelkasten), dann Sätze kürzen.

## 3. Blätter für das Kind

- **Eine A4-Seite pro Blatt**, nichts darf überlaufen (wird geprüft). Lieber weniger Aufgaben, dafür luftig.
- Schrift mindestens 14 pt (geprüft; Standard 16 pt). Kleinerer Hilfstext nur mit `class="klein"`.
- **Auch gezeichnete Schrift** (`<text>` in einem SVG, z. B. Fragen im Baum, Zahlen am Spielplan) muss auf Blättern mindestens 14 pt haben, gerechnet als Schriftgröße mal Maßstab der Zeichnung (geprüft in `src/components.js`, „Gezeichnete Schrift“). Nebenbeschriftungen einer Zeichnung (Kartenzahl, Zahlenring, verkleinertes Bild im Bild) tragen `data-nebenschrift` am `<text>` oder am Baustein, **nicht** `class="klein"`: Die CSS-Regel `.klein` würde die Schriftgröße der Zeichnung überschreiben.
- Kurze Hauptsätze, „du“, das Kind namentlich („{{KIND}}, wo ist der Drache nach Befehl 3?“).
- Unten eine `<div class="profi">` (Krone, „Profi-Aufgabe“) oder `<div class="knobel">` (Eule, „Knobel-Ecke“). Eigener Titel: `data-titel="Drachen-Profi"`.
- Aufgaben: `<div class="aufg"><p class="anw">Anweisung</p> … </div>` → automatisch nummeriert. Ohne Nummer: `class="aufg ohne-nr"`.
- Anordnung: `<div class="reihe">` (nebeneinander, umbrechend), `<div class="raster s3">` (Spalten s2–s5), `.mitte`, `.zentriert`. `data-verteilt` am Blatt verteilt die Aufgaben über die Höhe.
- **Jede Aufgabe braucht eine Lösung** in der Anleitung. Bausteine aus Rätseln bringen sie selbst mit (Lösungsansicht). Freie Aufgaben bekommen einen Lösungshinweis `<p class="lsg-nur">Mehrere Lösungen möglich, z. B. …</p>` (nur in der Lösungsansicht sichtbar) oder eine Text-Lösung im `kasten loesung`.
- Auf Blättern mit Bildschirm-Bonus: `<m-qr paket="eN"></m-qr>` (nur für Mama oder Papa, Pflicht, wird zurückgelesen).
- **Keine Fachwörter auf den Blättern** (Anweisung, Algorithmus, Schleife, Bug, Debuggen, Bedingung, Funktion, Unterprogramm, Binär, Computer …): wird geprüft. Dort stehen die Kinderwörter.
- Symbole **nur als Baustein** `<m-symbol>`, nie als Zeichen (kein ← → ↑ ↻ ★ ✓ im Text, auch nicht in der Anleitung): wird geprüft.

## 4. Rätsel-Daten: `raetsel/eN.json`

```json
{
  "paket": "e2",
  "einheit": 2,
  "titel": "Drachen-Pfade",
  "web": { "titel": "Drachen-Pfade", "art": "pfad", "levels": ["e2-w1", "e2-w2", "e2-a1"] },
  "raetsel": [
    { "id": "e2-a1", "art": "pfad", "aufgabe": "kuerzestes",
      "b": 3, "h": 3, "start": { "x": 0, "y": 2, "blick": "oben" }, "ziel": { "x": 2, "y": 0 },
      "hindernisse": [[1, 1]] }
  ]
}
```

Gitter: `x` nach rechts, `y` nach unten, Feld `(0, 0)` ist links oben (mehrere Gitter: `"welten"`, Abschnitt 4a). `blick`: `oben`, `rechts`, `unten`, `links` (ohne Angabe: oben). Optional `edelsteine: [[x, y], …]` (alle müssen eingesammelt werden), `zielSymbol`: `schatz` (Standard), `ziel` (Zielflagge) oder `stern`.

Programme als Text: `"vor vor rechts 3[vor links]"` (Befehle `vor`, `links` = links drehen, `rechts` = rechts drehen; `3[…]` = Zauber-Kasten „3-mal“, 2 bis 5, kein Zauber-Kasten im Zauber-Kasten). Ab Block C dazu `wenn[…]`, `bis[…]` und `@stern` (Abschnitt 4a).

| art | Felder | Was der Löser prüft (Abbruch, wenn nicht) | Lösung |
|---|---|---|---|
| `pfad` | Gitter, `aufgabe`: `kuerzestes` oder `ankommen`; optional `maxBefehle` (≤ 12), `beispiel`, `mehrereLoesungen`, `zauber: true`, `maxKarten` | Ziel erreichbar (Breitensuche über Feld **und** Blickrichtung). `kuerzestes`: genau **ein** kürzestes Programm, sonst `"mehrereLoesungen": true` setzen und auf dem Blatt „Mehrere Lösungen möglich“ dazuschreiben. Kürzestes ≤ `maxBefehle`. Mit `zauber`: kleinste Kartenzahl mit Wiederhol-Zauber; `maxKarten` muss den Zauber-Kasten erzwingen | kürzeste Länge, Anzahl, alle kürzesten Programme |
| `lesen` | Gitter (Ziel optional), `programm`, optional `fragen: [3]` (Stand nach Befehl 3), `erwartetStoss` | Programm läuft ohne Anstoßen (oder stößt, wenn `erwartetStoss`); mit Ziel muss es ankommen (sonst `"mussAnkommen": false`) | Endfeld + Blickrichtung, Stand nach n Befehlen, Weg |
| `kobold` | Gitter mit Ziel, `programm` (mit genau einem Fehler, ohne Zauber-Kasten), `reparatur`: `{ "art": "tauschen", "stelle": 3, "befehl": "rechts" }` oder `{ "art": "loeschen", "stelle": 4 }` oder `{ "art": "einfuegen", "stelle": 2, "befehl": "vor" }` (danach steht der neue Befehl an Stelle 2) | kaputtes Programm kommt nicht an; mit der gemeinten Reparatur kommt es an | gemeinte Reparatur und **alle anderen** Ein-Schritt-Reparaturen, die auch ankommen (in der Lösung nennen: „Auch richtig: …“) |
| `ablauf` | `karten: [{ "id", "text", "bild" }]` (≤ 8), `regeln: [["a", "b"]]` = a kommt vor b, optional `loesung`, `mehrereLoesungen` | alle gültigen Reihenfolgen gezählt; mehr als eine nur mit `"mehrereLoesungen": true` | alle Reihenfolgen, Paare mit egal-Reihenfolge |
| `kuerzer` | `lang` (ohne Zauber-Kasten), `kurz` (mit Zauber-Kasten), optional Gitter | `kurz` macht genau dasselbe wie `lang` (gleiche ausgerollte Befehle) und braucht weniger Karten | beide Programme, Kartenzahlen |

**Zauber-Kasten:** 2- bis 5-mal, darin **1 bis 3 Befehle** (höchstens 3, wie im Auftrag „eine Gruppe von 2–3 Befehlen“; Papier, Löser und App gleich, `K.MAX_INNEN`), kein Zauber-Kasten im Zauber-Kasten (ab Block C dürfen Wenn-dann-Kästen und Spruch-Aufrufe hinein, Abschnitt 4a).

**Karten zählen** (Einheit 5): Ein Befehl ist 1 Karte, ein Zauber-Kasten ist 1 Karte plus die Befehle darin. „3-mal: vor“ = 2 Karten, „vor vor vor“ = 3 Karten. **Kürzestes Programm** (ohne Zauber-Kasten): die wenigsten Befehle, Drehungen zählen mit.

Achtung beim Entwerfen: Eine Kehrtwende geht mit „links links“ oder „rechts rechts“, beide gleich lang. Wer ein „finde das kürzeste“-Rätsel will, das eine Kehrtwende braucht, bekommt deshalb immer mehrere kürzeste Programme. Ebenso hat ein freies Rechteck viele gleich lange Wege (oben-dann-rechts gegen rechts-dann-oben). Hindernisse und Startrichtung so setzen, dass genau ein kürzestes Programm übrig bleibt, oder kennzeichnen. Der Löser sagt es genau: `werkzeuge/mit-nix.sh node werkzeuge/raetsel.mjs --bericht`.

### 4a. Erweiterte Befehle (ab Block C: Wenn-dann, „bis zum Schatz“, Zaubersprüche)

Regeln: `plan/lehrplan.md` Abschnitt 7.8 (verbindlich). Programme als Text:

```
wenn[stein: rechts]                    Wenn-dann-Kasten ohne sonst
wenn[stein: rechts sonst vor]          mit sonst (dann: 1–3, sonst: 0–3 Befehle oder Aufrufe)
bis[wenn[stein: rechts sonst vor]]     Wiederhol-Zauber „bis zum Schatz“ (1–3 Teile)
3[vor wenn[frei-links: links vor]]     Zauber-Kasten mit Wenn-dann-Kasten (zusammen höchstens 3 Teile)
@stern @stern links @stern             Zauberspruch-Aufrufe (stern, mond, krone)
```

Bedingungen: `stein`, `frei` (vor der Nase), `stein-links`, `stein-rechts`, `frei-links`, `frei-rechts` (neben dem Drachen, von ihm aus gesehen). Der Rand zählt wie ein Stein. Verschachtelung: Kein Zauber-Kasten im Zauber-Kasten, kein Wenn-dann im Wenn-dann, im Wenn-dann nur Befehle und Aufrufe, kein Aufruf in einem Spruch. Höchstens 60 ausgeführte Befehle (sonst: „Der Drache läuft im Kreis.“).

**Zaubersprüche** stehen beim Rätsel: `"sprueche": { "stern": "vor vor links" }` (1–4 Teile: Befehle, Zauber-Kasten, Wenn-dann-Kasten). **Karten zählen:** Wenn-dann-Kasten = 1 (Wenn-Karte) + dann + sonst; `bis[…]` = 1 + Inhalt; Aufruf = 1; ein Spruch, den das Kind schreibt, einmal 1 + Inhalt; ein vorgegebener Spruch zählt nicht.

| art | zusätzliche Felder | Was der Löser prüft |
|---|---|---|
| `pfad` | `erlaubt`: Teilmenge von `["zauber", "wenn", "bis", "spruch"]` (was das Kind benutzen darf, die App bietet genau das an); `bedingungen` (Wenn-Karten, Standard `["stein", "frei"]`); `maxKarten` (Standard 12); `beispiel` (ein Programm, das ankommt); `sprueche` (vorgegeben) **oder** `spruchFrei: ["stern"]` (das Kind schreibt den Spruch; dann `beispielSprueche: { "stern": "…" }`); optional `erzwingt` (welche Kästen die Grenze erzwingen muss, **jeder für sich**; Standard: alle neuen aus `erlaubt`, also `wenn`, `bis`, `spruch`); optional `welten` (siehe unten) | Beispiel kommt an, benutzt nur Erlaubtes, Kartenzahl ≤ `maxKarten`. **Ohne jeden Kasten aus `erzwingt` geht es mit `maxKarten` nicht** (der Löser lässt ihn weg, alles andere bleibt erlaubt; sonst Fehler „Ohne Wenn-dann-Kasten geht es auch: mit n Karten, z. B. …“ – Grenze kleiner machen oder, wenn dieser Kasten nicht nötig sein muss, `erzwingt` kleiner). Kleinste Kartenzahl und Anzahl der Programme mit dieser Kartenzahl (gespiegelte Wenn-Karten `wenn[stein: A sonst B]` = `wenn[frei: B sonst A]` zählen beide). `aufgabe: "kuerzestes"` nur, wenn das eindeutig ist (sonst `"mehrereLoesungen": true`) und das Beispiel so kurz ist. Ohne `beispiel` nimmt der Löser das erste kürzeste. |
| `pfad` mit `welten` | `"welten": [{ "ziel": {…} }, { "ziel": {…}, "hindernisse": […] }]` (2–4 Gitter; fehlende Felder kommen aus dem Rätsel, z. B. `b`, `h`, `start` gemeinsam). Geht mit und ohne `erlaubt` | **ein** Programm muss in **allen** Gittern ankommen („Ein Programm für alle“). Hier ist ein Wenn-dann-Kasten auch außerhalb eines Zauber-Kastens sinnvoll |
| `lesen` | `sprueche`; `erwartetZuLang: true` (das Programm läuft absichtlich im Kreis) | wie bisher, `fragen: [5]` zählt ausgeführte Befehle (Wenn-dann und Sprüche wie ausgeführt) |
| `kobold` | `sprueche`; optional `welten`, `bedingungen`. `reparatur.stelle` als Text: `"3"` (Teil 3), `"3.2"` (2. Teil im Zauber-Kasten 3), `"3.dann.1"`, `"3.2.sonst.1"`, `"@stern.2"` (2. Teil im Stern-Spruch). Arten: `tauschen` (`befehl`: vor, links, rechts oder `"@stern"`), `loeschen`, `einfuegen`, `bedingung` (`"bedingung": "frei"`, andere Wenn-Karte), `zahl` (`"wdh": 4`, anderes „n-mal“) | kaputt kommt nicht an (Stoß, im Kreis, nicht am Ziel), gemeinte Reparatur schon; alle anderen Ein-Karten-Reparaturen, die auch ankommen („Auch richtig: …“). In der App gehen (noch) nur Kobold-Programme aus Befehlen |
| `kuerzer` | `sprueche` (gehören zur kurzen Lösung und zählen mit); `kurz` darf Wenn-dann und `bis[…]` enthalten, dann braucht das Rätsel ein Gitter (`b`, `h`, `start` …) | kurz macht genau dasselbe wie lang (ohne Wenn-dann/bis: dieselben Befehle; mit: im Gitter dieselben ausgeführten Befehle) und braucht weniger Karten |

**Grenzen des Lösers** (ehrlich): Die Suche nach der kleinsten Kartenzahl (`mitRegeln` in `werkzeuge/loeser.mjs`) probiert alle Programme bis zur Kartengrenze durch (nach Kartenzahl geordnet), legt gleiche Zustände (Feld, Blick, Edelsteine, Befehle bis jetzt, in jedem Gitter) zusammen und beschneidet nur, was nie das kürzeste sein kann (Stoß, mehr als 60 Befehle, Wenn-dann außerhalb eines Kastens bei einem Gitter, `wenn[c: X sonst X]`, Spruch aus einem Befehl). Gespiegelte Wenn-Karten zählen überall doppelt, auch im selbst geschriebenen Spruch. Sie ist gegen ein stures Durchprobieren aller Programme getestet (`tests/kern.test.mjs`). Rechen-Grenze: 30 Millionen Schritte, das sind etwa 2–5 Sekunden pro Suche; ein Rätsel braucht 1 + (Anzahl in `erzwingt`) Suchen. Teuer ist vor allem der Beweis „ohne … geht es nicht“, weil dabei alle Programme bis `maxKarten` durchprobiert werden. **Darum `maxKarten` immer so klein wie möglich setzen** (der Standard 12 ist für erweiterte Rätsel fast immer zu groß). Bis zu welcher Kartengrenze die Suche vollständig ist (gemessen im schlimmsten Fall, ohne Lösung; die Zahl hängt an der Rechen-Grenze, nicht an der Rechnerzeit):

| erlaubt (Wenn-Karten) | 2 Gitter 3 · 3 | 4 · 4 frei | 5 · 5 frei | Labyrinth 5 · 5 |
|---|---|---|---|---|
| `wenn` (2 oder 4), mehrere Gitter | 12 | – | – | – |
| `wenn` + `bis` (2) | 9 | 9 | 9 | 9 |
| `wenn` + `bis` (alle 6) | 8 | 8 | 8 | 8 |
| `zauber` + `wenn` + `bis` (2) | 9 | 9 | 8 | 9 |
| `zauber` + `wenn` + `bis` (alle 6) | 7 | 7 | 7 | 7 |
| `spruch` mit `spruchFrei` | 12 | 12 | 12 | 12 |
| `zauber` + `spruch` mit `spruchFrei` | 9 | 9 | 9 | 9 |
| `zauber` + `wenn` + `bis` (2) + `spruch` mit `spruchFrei` | 7 | 7 | 7 | 8 |

Der Beweis „ohne …“ lässt einen Kasten weg und reicht weiter (5 · 5 frei: `zauber` + `bis` 12, `zauber` + `wenn` (2) 9, (6) 8; `zauber` + `wenn` (2) + `spruchFrei` 8; `wenn` + `bis` (2) + `spruchFrei` 8). Bricht eine Suche ab, meldet der Bericht „Suche zu groß“: Für „ohne … geht es nicht“ ist das ein Fehler (Grenze kleiner, weniger Wenn-Karten oder `erzwingt` kleiner), für die kleinste Kartenzahl nur ein Hinweis (dann wird nur das Beispiel geprüft, und „Finde das kürzeste“ geht nicht). Höchstens **ein** selbst geschriebener Spruch (`spruchFrei`) wird durchsucht; bei zwei nur das Beispiel. Der Bericht zeigt alles: `werkzeuge/mit-nix.sh node werkzeuge/raetsel.mjs --bericht`.

**Entwerfen:** Ein Wenn-dann-Kasten lohnt sich nur, wenn er mehrmals drankommt (im Zauber-Kasten, in einem Spruch) oder bei mehreren Gittern. Ein `pfad` mit `"erlaubt": ["wenn"]` und **einem** Gitter geht darum nicht (der Löser meldet „Ohne Wenn-dann-Kasten geht es auch“, denn der gewählte Zweig allein ist kürzer): Für Einheit 11 entweder `welten` (2–4 Gitter, ein Programm für alle), einen Zauber-Kasten dazu (`["zauber", "wenn"]`) oder ein `lesen`-Rätsel („Wo landet der Drache?“). „bis zum Schatz“ mit einer Wenn-dann-Regel braucht Gitter, in denen die Regel wirklich zum Schatz führt (Gang mit Ecken, Spirale, Labyrinth mit Hand-an-der-Wand). Sind alle Stücke des Gangs gleich lang, geht es auch ohne Wenn-dann (`bis[vor vor rechts]`): verschieden lange Stücke erzwingen die Regel (Beispiel `e0-bis`: erst 2 Felder hinauf, dann 3 nach rechts, dann 2 hinunter). Den Weg im Kopf mit dem Finger nachgehen und mit dem Löser prüfen; ein Programm, das im Kreis läuft, meldet der Löser.

### 4b. Erweiterte Befehle in der Web-App (Bedienung und Level-Felder)

Pfad-Levels mit `erlaubt` und/oder `welten` dürfen in `web.levels` (ab Einheit 11). Die App bietet **genau das an, was `erlaubt` sagt**, und bewertet nur nach dem Ergebnis, mit demselben Ausführer wie der Löser. Erweiterte Kobold-Levels (Stellen wie `"3.dann.1"`) gehen in der App noch nicht (der Build meldet das).

**Was die App von einem Level bekommt** (`werkzeuge/raetsel.mjs`, `webDaten`): `erlaubt`, `bedingungen`, `maxKarten`, `sprueche`, `spruchFrei`, `welten`, `aufgabe`, `edelsteine`, `zielSymbol` und `minKarten` (die kleinste Kartenzahl, nur wenn der Löser sie bewiesen hat). **Nie** `beispiel`, `beispielSprueche` oder die Lösung.

**Bedienung (nur Antippen, kein Ziehen).** Links oben die Befehle vor, links drehen, rechts drehen und je Zauberspruch eine Aufruf-Taste (Siegel); links unten die Kasten-Tasten und Löschen; rechts immer **Nochmal** und **Los** (sie bleiben an ihrer Stelle).

| Kasten | So baut ihn das Kind |
|---|---|
| Wenn-dann-Kasten (`wenn`) | Taste mit dem schauenden Drachen → **Wenn-Karte wählen** (nur die `bedingungen` des Levels; gibt es nur eine, entfällt die Wahl) → Befehle (oder Aufrufe) für „dann“ antippen → optional **sonst** → Befehle → **fertig**. „Letzten Befehl löschen“ geht Schritt für Schritt zurück (sonst-Befehl, „sonst“, dann-Befehl, ganzer Kasten). |
| Zauber-Kasten (`zauber`, `bis`) | Taste „?-mal“ → **Wie oft?** 2, 3, 4, 5 und, wenn `bis` erlaubt ist, **bis zum Schatz** → Inhalt antippen (Befehle, ein Wenn-dann-Kasten, Aufrufe; höchstens 3 Teile) → **fertig**. Ist nur `bis` erlaubt, zeigt die Taste das Bild „bis zum Schatz“ und legt den Kasten gleich hin. |
| Zauberspruch vorgegeben (`sprueche`) | Steht als braune Spruch-Reihe über dem Programm (Siegel, Name, seine Teile). Das Kind ruft ihn mit der Siegel-Taste auf. |
| Zauberspruch selbst schreiben (`spruchFrei`) | Das Level beginnt in der (leeren, gestrichelten) Spruch-Reihe: Befehle, Zauber-Kasten, Wenn-dann-Kasten hineintippen (1–4 Teile, kein Aufruf) → **fertig** (braune Taste) → im Programm aufrufen. Spruch-Reihe antippen = weiterschreiben. Ein leerer Spruch, der aufgerufen wird, läuft nicht („Dein Stern-Spruch ist noch leer.“). |
| Mehrere Gitter (`welten`) | Die Gitter stehen nebeneinander oder untereinander (so groß wie möglich), jedes mit Nummer. Meldung: „Ein Programm für beide Gitter!“ |

**Beim Laufen** läuft der Drache erst im ersten Gitter, dann im nächsten (die anderen sind blass). Der gerade laufende Befehl leuchtet, dazu alle Kästen darum: Zauber-Kasten mit „Runde n“, im Wenn-dann-Kasten der Zweig „dann“ oder „sonst“ (der andere wird blass), bei einem Aufruf die Aufruf-Karte und die Spruch-Reihe. Bevor ein Wenn-dann-Kasten entscheidet, „schaut“ der Drache kurz: Die Wenn-Karte leuchtet, das angeschaute Feld ist türkis umrandet (am Rand leuchtet die Kante). Meldungen: Stoß wie bisher („Hier hat der Kobold zugeschlagen!“, auch im Zweig oder im Spruch), nach 60 Befehlen „Der Drache läuft im Kreis. Er findet den Schatz so nicht.“ (läuft ein Programm so lange, wird der Drache nach den ersten Befehlen schneller, damit es nicht ewig dauert), bei mehreren Gittern „Im Gitter 2 ist der Drache noch nicht beim Schatz.“

**Karten und Sterne:** Der Kartenzähler zählt wie am Papier (Abschnitt 4a), mit dem selbst geschriebenen Spruch (sobald etwas drinsteht). Ist eine Grenze voll, sind die Tasten grau und sagen beim Antippen freundlich, warum (Kartengrenze, nach „dann“/„sonst“ höchstens 3, im Zauber-Kasten höchstens 3, im Spruch höchstens 4 Teile). Stern: geschafft = in **allen** Gittern am Schatz (und alle Edelsteine). Bei `"aufgabe": "kuerzestes"` gibt es den Stern nur mit `minKarten` Karten (sonst „Fast geschafft! Aber es geht kürzer: mit n Karten.“); bei „ankommen“ mit mehr Karten als `minKarten` kommt nur die Profi-Frage „Geht es auch mit n Karten?“.

**Für das Handy entwerfen:** Das Programm darf in mehrere Zeilen umbrechen; wird es zu hoch, zeigt die App den Spruch nur mit Siegel und macht die Karten kleiner. Getestet bis 12 Karten mit Spruch-Reihe, Wenn-dann- und Zauber-Kasten auf 667 · 375. Empfehlungen: höchstens 2 Sprüche pro Level (mit 3 Aufruf-Tasten bricht die obere Tastenreihe auf dem Handy um), 2 Gitter bis 4 · 4, 3–4 Gitter nur bis 3 · 3 (sonst werden die Felder auf dem Handy quer zu klein), höchstens 6 Wenn-Karten.

**Testen ohne eigene Einheit:** Test-Levels für alle neuen Kästen liegen in `tests/fixtures/web-raetsel/` (e11 Wenn-dann und mehrere Gitter, e16 „bis zum Schatz“ und Hand-an-der-Wand, e17 Zaubersprüche). `node werkzeuge/web-bauen.mjs --raetsel tests/fixtures/web-raetsel`, dann Playwright; danach wieder `node werkzeuge/web-bauen.mjs` (echte Rätsel). Die Playwright-Tests spielen jedes Level mit einer Lösung des Lösers (`mitRegeln`) durch und prüfen die neuen Tasten, das Aufleuchten, „läuft im Kreis“, Grenzen und den Doppeltipp-Schutz; ohne solche Levels werden diese Tests übersprungen.

## 5. Bausteine

### Symbole (`web/kern/symbole.js`, einmal als SVG gezeichnet)
```html
<m-symbol name="vor" gr="8"></m-symbol>        <!-- gr in mm -->
<m-symbol name="drache" gr="20" blick="rechts"></m-symbol>
```
Namen: `vor`, `links` (links drehen), `rechts` (rechts drehen), `drache`, `schatz`, `stern`, `sternLeer`, `ziel`, `hindernis`, `edelstein`, `kobold`, `haken`. Farben: vor blau, links drehen grün, rechts drehen orange (wie die rechte Pfote des Drachen). In Fließtext der Anleitung: `gr="4.5"`.

Ab Block C (Lehrplan 7.4/7.8): Wenn-Karten `wenn-stein`, `wenn-frei`, `wenn-stein-links`, `wenn-frei-links`, `wenn-stein-rechts`, `wenn-frei-rechts` (türkiser Grund; der Drache schaut im Bild immer nach oben, das Feld liegt vor bzw. neben ihm), `wenn` (Wenn-dann-Kasten allgemein), `bis` („bis zum Schatz“, lila), Spruch-Siegel `spruch-stern`, `spruch-mond`, `spruch-krone` (braun). Farben: Wenn-dann-Kasten Türkis, Zaubersprüche Braun, „bis zum Schatz“ Lila wie der Zauber-Kasten. Wenn-Karten und Spruch-Siegel haben kleine Bilder: im Fließtext der Anleitung `gr="7"` statt 4.5, auf Blättern mindestens 12 mm.

### Gitter
```html
<m-gitter raetsel="e2-a1" feld="22"></m-gitter>                  <!-- Lösung: roter Weg + Drache am Ende -->
<m-gitter raetsel="e4-k1" feld="20" loesung="keine"></m-gitter>  <!-- in der Lösung nichts einzeichnen -->
<m-gitter raetsel="e2-l1" loesung="ende" ohne-ziel></m-gitter>   <!-- Lösung: nur Drache am Endfeld -->
<m-gitter raetsel="e4-l2" loesung="nach:3"></m-gitter>           <!-- Lösung: Weg bis Befehl 3 -->
<m-gitter deko b="4" h="4" start="0,3,oben" feld="20"></m-gitter> <!-- Bild ohne Aufgabe, leeres Gitter -->
```
`feld` in mm, **mindestens 20**. Ein 4 · 4-Gitter mit 22 mm ist knapp 9 cm breit. Das Startfeld ist hellgrün hinterlegt, der Drache zeigt mit der Nase (und einem kleinen Pfeil) die Blickrichtung.

### Programm-Reihe
```html
<m-programm befehle="vor vor rechts 3[vor]"></m-programm>        <!-- fertiges Programm zeigen -->
<m-programm raetsel="e2-a1"></m-programm>                         <!-- pfad: leere Kästchen (max(8, kürzeste)), Lösung = kürzestes -->
<m-programm raetsel="e2-a1" plaetze="6"></m-programm>             <!-- genau 6 leere Kästchen -->
<m-programm raetsel="e4-k1"></m-programm>                         <!-- kobold: kaputtes Programm, Lösung markiert den Fehler -->
<m-programm raetsel="e4-l1"></m-programm>                         <!-- lesen: das Programm -->
<m-programm raetsel="e5-k1" teil="lang"></m-programm>             <!-- kuerzer: langes Programm -->
<m-programm raetsel="e5-k1" teil="kurz"></m-programm>             <!-- kuerzer: leere Form mit Zauber-Kasten, Lösung gefüllt -->
<m-programm raetsel="e5-k1" teil="kurz" zeige></m-programm>       <!-- kuerzer: kurzes Programm gefüllt -->
<m-programm raetsel="e5-p1" teil="zauber"></m-programm>           <!-- pfad mit zauber: leere Form des kürzesten -->
<m-programm leer="6"></m-programm>                                <!-- 6 leere Kästchen ohne Lösung (eigene Programme) -->
<m-programm befehle="bis[wenn[stein: rechts sonst vor]] @stern"></m-programm>  <!-- erweiterte Befehle zeigen -->
<m-programm raetsel="e16-p1" teil="form"></m-programm>            <!-- pfad mit "erlaubt": leere Form des Beispiels, Lösung rot -->
<m-programm raetsel="e16-p1" teil="beispiel"></m-programm>        <!-- pfad mit "erlaubt": das Beispiel gefüllt (z. B. Anleitung) -->
```
`gr` = Kästchengröße in mm (Standard 14). Höchstens 12 Kästchen pro Reihe (geprüft). Bei 12 Kästchen nimmt der Baustein ohne `gr` automatisch 13 mm (12 · 14 mm plus Abstände wären breiter als das Blatt). Nummern über den Kästchen; `nummern="nein"` lässt die Nummernzeile ganz weg (für Programme im Fließtext). Bei Kobold-Rätseln markiert die Lösungsansicht die Fehlerstelle; wenn Streichen oder Einfügen an mehreren Stellen dasselbe Programm ergibt (z. B. in „vor vor vor“), werden alle diese Stellen genannt. Der Zauber-Kasten ist lila, links oben steht groß „3-mal“, kein Mal-Punkt.

**Erweiterte Befehle am Papier** (Abschnitt 4a): Der Wenn-dann-Kasten ist türkis und steht in einer Zeile: „wenn“ [Wenn-Karte] „dann“ [Befehle] „sonst“ [Befehle]. „bis zum Schatz“ ist ein lila Zauber-Kasten mit Schatztruhe und „bis zum Schatz“ oben. Ein Aufruf `@stern` ist eine braune Karte mit dem Spruch-Siegel. In der leeren Form (`teil="form"`) sind Wenn-Karte, Befehle, Aufrufe und „n-mal“ leer, Kästen und die Wörter „wenn/dann/sonst/bis zum Schatz“ stehen da. Ein Wenn-dann-Kasten ist mit seinen Wörtern breit: Eine Reihe mit Kasten und Wenn-dann hat Platz für etwa 6–8 Kästchen (14 mm), sonst `gr="12"`. Kobold-Rätsel mit Stellen wie `"3.dann.1"` markieren in der Lösung die Karte und nennen die Reparatur.

### Zaubersprüche
```html
<m-spruch name="stern" befehle="vor vor links"></m-spruch>     <!-- fertiger Spruch: Siegel, „Stern-Spruch“, Befehle -->
<m-spruch raetsel="e17-p1" name="stern"></m-spruch>            <!-- aus dem Rätsel: vorgegeben gefüllt; spruchFrei (pfad) bzw.
                                                                    sprueche (kuerzer): leere Kästchen, Lösung rot -->
<m-spruch raetsel="e17-p1" name="stern" plaetze="5"></m-spruch> <!-- genau 5 leere Kästchen; teil="form": Form der Lösung; zeige: gefüllt -->
<m-spruch name="mond" leer="4"></m-spruch>                     <!-- 4 leere Kästchen ohne Lösung (eigene Sprüche erfinden) -->
```
Braun wie eine Spruch-Rolle, nummerierte Reihe, höchstens 12 Kästchen. Bei Kobold-Rätseln mit Fehler im Spruch (`"@stern.2"`) markiert die Lösungsansicht die Karte im Spruch.

### Mehrere Gitter („Ein Programm für alle“)
```html
<m-gitter raetsel="e11-w1" welt="1" feld="20"></m-gitter> <m-gitter raetsel="e11-w1" welt="2" feld="20"></m-gitter>
```
Bei Rätseln mit `"welten"` ist `welt` Pflicht. Die Lösung zeigt in jedem Gitter den Weg des Beispiels.

### QR-Code, Hilfen links/rechts
```html
<m-qr paket="e2"></m-qr>          <!-- 32 mm, Fehlerkorrektur M, Ruhezone 4 Module; Adresse …/#e2 -->
<m-linksrechts></m-linksrechts>   <!-- in jeder Gitter-Einheit in der Anleitung -->
```

### Bausteine einzelner Einheiten (`src/bausteine/eN-*.js`)

Jede Einheit darf eigene Bausteine in einer eigenen Datei anmelden. Die bisherigen (Beschreibung jeweils oben in der Datei):

| Datei | Bausteine | wofür |
|---|---|---|
| `e1-blick.js` | `<m-e1-wahl raetsel nach>`, `<m-e1-befehlwahl raetsel>` | vier Drachen zum Ankreuzen (Wohin schaut er?), drei Befehle zum Ankreuzen |
| `e2-drache.js` | `<m-e2-ausmal gr>` | großer Drache zum Anmalen (rechte Pfote orange) |
| `e3-ablauf.js` | `<m-ablaufbild>`, `<m-ablaufkarte>`, `<m-ablauf>`, `<m-ablaufpaar>`, `<m-ablaufanzahl>`, `<m-ablaufzuerst>` | Ablauf-Karten mit Bildern aus `web/kern/bilder.js` (auch in der Web-App), Nummern eintragen, falsche Reihenfolge, „egal?“ |
| `e4-kobold.js` | `<m-e4-blick raetsel nach>`, `<m-e4-befehl raetsel>`, `<m-e4-art raetsel>` | Einkreisen: Blickrichtung nach Befehl n, richtiger Befehl, Art des Fehlers |
| `e5-muster.js` | `<m-e5-muster art="malen\|finden">`, `<m-e5-karten>` | Muster-Bilder auf 1-cm-Kästchen mit Wiederhol-Zauber, Karten zählen |
| `e6-muster.js` | `<m-e6-el name>`, `<m-e6-folge>`, `<m-e6-reihe raetsel [kern]>`, `<m-e6-zauber raetsel [zeige]>`, `<m-e6-programm programm>`, `<m-e6-wert raetsel wert>`, `<m-e6-janein raetsel>` | Perlen, Bewegungen und Muster aus `web/kern/muster.js`: fortsetzen und Lücken füllen, Kobold im Muster, Muster-Kern als Zauber-Kasten, Zahlen aus der Lösung im Text, „ja/nein“ zum Ankreuzen |
| `e7-geheim.js` | `<m-e7-lesen>`, `<m-e7-knacken>`, `<m-e7-kobold>`, `<m-e7-schreiben [name]>`, `<m-e7-zeichen [schreiben]>`, `<m-e7-alphabet>`, `<m-e7-rad teil>`, `<m-e7-text>`, `<m-e7-feld>`, `<m-e7-feen>`, `<m-e7-bild>`, `<m-e7-post>`, `<m-e7-versuche>`, `<m-e7-kette>` | Geheimschrift lesen, schreiben (auch den eigenen Namen, aus `kind.json`), knacken, Feen-Zeichen, Geheimschrift-Rad zum Ausschneiden; Geheimschrift im Fließtext wird ausgerechnet (`<m-e7-text schreibe="MOND" k="3">`) |
| `e8-kaestchen.js` | `<m-e8-bild raetsel>`, `<m-e8-code>`, `<m-e8-kasten>`, `<m-e8-zahlen>`, `<m-e8-text>` (auch `teil="auch" alle anzahl="2"`), `<m-e8-mini>`, `<m-e8-brett>`, `<m-e8-gitter>` | Kästchenbilder auf echten 1-cm-Kästchen mit Kästchen-Code (malen, schreiben, Kobold, kürzer), Zahlen zählen, Code in Worten für die Anleitung, Muggelstein-Brett |
| `e9-janein.js` | `<m-e9-zahl raetsel>`, `<m-e9-zeige ja>`, `<m-e9-karte wert>`, `<m-e9-feld>`, `<m-e9-loesung>`, `<m-e9-tabelle>`, `<m-e9-liste karte>` | Ja/Nein-Zahlen als Karten, Lampen, Hand oder Nullen und Einsen (lesen, legen, Kobold), Karten der Bastelvorlage, Tabelle, alle Zahlen einer Gedankenlese-Karte |
| `e12-logik.js` | `<m-e12-gitter raetsel>`, `<m-e12-hinweise>`, `<m-e12-legende>`, `<m-e12-szene>`, `<m-e12-aussagen>`, `<m-e12-bild>`, `<m-e12-leer>`, `<m-e12-zahl>`, `<m-e12-anzahl>`, `<m-e12-loesung>` | Logikgitter mit Bildern und Hinweis-Sätzen, „Wahr oder falsch?“ zu einem Bild, leeres Gitter zum Selbermachen; Zahlen im Text (Kreise, Kreuze, Lösungen ohne einen Hinweis) kommen vom Löser. Prüft selbst: Felder auf Blättern mindestens 20 mm |
| `e13-baum.js` | `<m-e13-baum raetsel modus [pille="5"]>`, `<m-e13-reihe>`, `<m-e13-weg>`, `<m-e13-fragen>`, `<m-e13-optionen>`, `<m-e13-landet>`, `<m-e13-trennen>`, `<m-e13-bild>`, `<m-e13-fragekarte>`, `<m-e13-pille>`, `<m-e13-tabelle>`, `<m-e13-zahl>` | Ja-Nein-Bäume als SVG (leer, voll, fehlende Frage, Kobold), Wege mit Ja-/Nein-Schildern, Frage-Karten der Bastelvorlage, Merkmals-Tabelle für die Anleitung (prüft, dass die Antworten in allen Rätseln gleich sind). Prüft auf Blättern jede Schrift im Baum (ab 14 pt); für Bäume auf Blättern `pille="5"` (Ja/Nein-Schilder und Platz-Nummern in 5 mm) |
| `e14-formen.js` | `<m-e14-quadrat raetsel [zeige] [mit-loesung]>`, `<m-e14-quadrat leer n [beispiel] [schraege]>`, `<m-e14-form name>`, `<m-e14-linie art formen>`, `<m-e14-antwort raetsel>` | Formen-Quadrate aus `web/kern/formen.js` (auch mit Schrägen und Farben), leere Quadrate zum Selbermachen, Formen im Text, Reihe oder Spalte zum Zeigen, Antwort-Kästchen beim Kobold-Quadrat. Prüft selbst: Felder auf Blättern mindestens 20 mm |
| `e15-nim.js` | `<m-e15-steine>`, `<m-e15-stellung>`, `<m-e15-weg>`, `<m-e15-zahlen>`, `<m-e15-antwort>`, `<m-e15-regeln>`, `<m-e15-baum>`, `<m-e15-zugtabelle>`, `<m-e15-text>`, **`<m-e15-stimmt>`** | Muggelsteine, „Wer gewinnt hier?“, Zahlen-Weg für „Wer sagt 20?“, Gewinnzahlen, Wenn-dann-Regeln (auch mit Kobold), Spielbaum. **`<m-e15-stimmt>` ist das Muster für geprüfte Aussagen im Text** (siehe unten) |
| `e18-spiel.js` | `<m-e18-plan>`, `<m-e18-strecke>`, `<m-e18-test>`, `<m-e18-pruefe>`, `<m-e18-zahl spiel was>` (auch `spiel="rennen"`, `was="zehntelVonBis"`), `<m-e18-felder>`, `<m-e18-kobold>`, `<m-e18-schnecken>`, `<m-e18-sieger>`, `<m-e18-bild>` | Spielplan (leer als Bastelvorlage) und Beispiel-Spiel „Wettflug zum Wolkenschloss“, beim Bauen ausgerechnet; jede Zahl im Text (Gewinnchancen, Zugzahlen, Testfälle) kommt aus der Rechnung oder wird mit `l="…"` dagegen geprüft. Ohne Rätsel-Datei |

**Geprüfte Aussagen im Text.** Was der Build nicht von selbst nachrechnet (eine Zahl oder Aussage in Worten in der Anleitung), kommt aus der Lösung (`<m-e12-zahl>`, `<m-e13-zahl>`, `<m-e18-zahl>` …) oder steht in einem Prüf-Baustein. Muster ist `<m-e15-stimmt spiel="steine 1-2" haufen="4" dran="du" gewinner="du" nimm="1">Bei 4 Steinen nimmst du 1.</m-e15-stimmt>`: Der Text bleibt, wie er ist, und der Build rechnet die Aussage mit dem Spielbaum nach (Fehler, wenn sie nicht stimmt). So kann eine Zahl im Text nicht unbemerkt falsch werden. Neue Einheiten mit vielen Zahlen im Text bauen sich so einen Baustein.

**Gitter in eigenen Bausteinen** (Logikgitter, Formen-Quadrate, Spielpläne) haben auf Blättern Felder von mindestens 20 mm wie `<m-gitter>` (Lehrplan 7.5, Regel 14); der Baustein prüft das selbst. Ausgenommen sind die echten 1-cm-Kästchen der Kästchenbilder (E8).

Ablauf-Karten (`art: "ablauf"`) dürfen ohne `bild` sein (leere Karte zum Selbermalen); optional `titel` und `gemischt` (Startreihenfolge in der Web-App). Jedes `bild` muss es in `web/kern/bilder.js` geben (geprüft).

### Verweise auf Blätter anderer Einheiten

`<a class="blattref" href="#blatt-1-1"></a>` geht auch über Einheiten hinweg. Im Teil-Build (`--nur 02`) steht dann nur „Blatt 1-1“, im Gesamtbuild mit Seitenzahl. Einen fehlenden Verweis meldet nur der Gesamtbuild als Fehler.

### Aus der Rechen-Werkstatt übernommen
`<m-feld l="5">` (Antwortkästchen, Lösung 5; `art="text"` für Wörter), `<m-aufgabe>3 + 4 = _</m-aufgabe>`, `<m-kaestchen b="18" h="3">` (echte 1-cm-Kästchen), `<m-karten spalten="4" zeilen="3" hoehe="55" breite="176">…</m-karten>` (Karten zum Ausschneiden, Schnittlinien), `<m-bild name="…">` (Strichzeichnungen: stern, zauberstab, krone, mond, edelstein, trank, zauberhut, schloss, drache, einhorn, fee, schere, gluehbirne, eule, wuerfel, rakete, karten, ei, kreide, haken, ziel, achtung, feder, huepfen, lupe, medaille, tablet, roboter), `<m-stern gr="14">`, `<m-wuerfel n="5">`, `<m-punkte>`. Rechnungen im Fließtext (`3 + 4 = 7`) werden geprüft.

## 6. Begriffe, Symbole, Gitter-Regeln (Kurzfassung, verbindlich)

| Kinderwort (Blätter, Beispielsätze, Web-App) | Fachwort (nur Anleitung, Kasten „Was hat das …“) |
|---|---|
| Befehl | Anweisung |
| Programm | Programm, Algorithmus, Sequenz |
| Wiederhol-Zauber, Zauber-Kasten („3-mal“) | Schleife |
| Fehler-Kobold, Kobold-Jagd | Bug, Debuggen |
| Wenn-dann-Regel | Bedingung (if) |
| Geheimcode | Verschlüsselung, Codierung |
| Ja/Nein-Zahlen | Binärzahlen (Bits) |
| Zauberspruch | Funktion, Unterprogramm |
| Roboter | Computer, Ausführender |
| Ablauf-Karten | Sequenz |
| Karten (beim Zählen von Programmen) | Programmlänge |

- **„Zauber“ nur** in Wiederhol-Zauber, Zauber-Kasten und Zauberspruch (geprüft). Kein „verzaubern“, „Zauberei“, „Zauberstab“ im Text.
- Befehle heißen immer **vor**, **links drehen**, **rechts drehen** (nie „geradeaus“, „gehe“, „dreh dich“). Kein seitlich oder rückwärts Gehen.
- Die Figur steht immer **in einem Feld**. Am Papier mindestens 20 mm, am Boden 40–50 cm (Malerkrepp oder Kreide). In der Wohnung ohne Gitter ist „vor“ **ein großer Schritt** bzw. eine Fliese.
- Jedes Gitter zeigt **Startfeld und Blickrichtung**. Ohne andere Angabe schaut der Drache nach oben. Stufen: zuerst Start nach oben, dann nach links oder rechts, nach unten erst im Schwerer-Teil.
- Programme als **nummerierte Reihe**, höchstens 12 Befehle. Beim Ausführen tippt das Kind mit dem Finger oder einem Muggelstein mit.
- Stößt der Drache an den Rand oder an einen Stein, bleibt er stehen: „Hier hat der Kobold zugeschlagen!“ Das Programm ist dann zu Ende.
- **Geschafft** heißt: Am Ende des Programms steht der Drache auf dem Schatz (und hat alle Edelsteine eingesammelt). Nur vorbeigehen zählt nicht.
- Österreichisch: Volksschule, Hausübung, Jänner, Sackerl, Zuckerl, Gummiringerl, Kasten, Stiege, Gang, Jause, Semmel, Tixo, Malerkrepp. Rechenzeichen: plus, minus, mal (·), durch (:). Kein × oder ÷.

### Pakete der Web-App

| Paket | Einheit | Adresse | Inhalt |
|---|---|---|---|
| e2 | 2 Drachen-Pfade | `…/#e2` | Drachen-Pfade programmieren (erst 3–5 Befehle, dann mit Steinen) |
| e3 | 3 Erst das, dann das | `…/#e3` | Bilder-Abläufe sortieren (antippen, kein Ziehen) |
| e4 | 4 Der Fehler-Kobold | `…/#e4` | Kaputte Programme reparieren |
| e5 | 5 Der Wiederhol-Zauber | `…/#e5` | Drachen-Pfade mit Zauber-Kasten und Kartengrenze |
| e6 | 6 Muster-Detektivin | `…/#e6` | 9 Levels (`muster`): Muster fortsetzen (goldener Platz ist dran, Perle aus der Auswahl antippen), Kobold-Perle tauschen, Muster-Kern als Zauber-Kasten (malt sein Armband zum Vergleich) |
| e7 | 7 Geheimschrift der Feen | `…/#e7` | 8 Levels (`geheim`): digitales Geheimschrift-Rad mit Dreh-Tasten; lesen, schreiben, Feen-Zeichen, knacken mit „Probe“ |
| e8 | 8 Bilder aus Kästchen | `…/#e8` | 8 Levels (`kaestchen`): Kästchen-Maler, Code bauen mit Teil-Tasten (zu große Teile grau), Kobold-Zeile reparieren (Zahl mit Minus und Plus) |
| e9 | 9 Nur Ja oder Nein | `…/#e9` | 9 Levels (`janein`): Zahl legen mit Karten, Lampen oder Fingern, Welche Zahl? (eine von drei), Kobold-Karte umdrehen |
| e12 | 12 Logikrätsel | `…/#e12` | 9 Levels (`logik`), 2 · 2 bis 4 · 4: Feld antippen (leer, Kreuz, Kreis), Hinweise als Bilder-Sätze; „Wahr oder falsch?“ mit Daumen-Tasten, ein Level mit lila Kobold-Zeichen |
| e13 | 13 Ja-Nein-Bäume | `…/#e13` | 8 Levels (`baum`): einem Wesen folgen (Ja/Nein antippen), alle an ihre Plätze, welche Frage fehlt |
| e14 | 14 Formen-Quadrate | `…/#e14` | 9 Levels (`formen`): Feld antippen, Form wählen, „Los“; ein Kobold-Level (nur ein Feld änderbar), Level 9 mit der Schrägen-Regel |
| e15 | 15 Gewinnen mit Plan | `…/#e15` | 8 Levels (`nim`): Strategiespiele gegen den Roboter; Stern nur bei Sieg, sonst „Nochmal?“ mit Tipp |

Kein Schlüsselwort: Alle Pakete sind offen, der QR-Code führt direkt zum Paket. Jedes Paket hat 5–9 Levels (10–15 Minuten). Die Startseite zeigt die Blöcke A–D, darin die Pakete (`web/app.js`, `zeigeStart`, `zeigeBlock`). Welche Levels genau wie am Blatt sind: Lehrplan 7.7. Steine sollen nicht nur am Rand liegen, sondern auch mitten im Weg (direkt vor der Nase, Mauer mit Lücke, Slalom).

**Sterne in der App:** 1 Stern pro geschafftem Level. Bei `pfad`-Levels mit `"aufgabe": "kuerzestes"` (ohne Zauber) gibt es den Stern nur mit einem kürzesten Programm, sonst zeigt die App „Fast geschafft! Es geht kürzer“. Bei `maxKarten` zählt die Grenze. Ab Block C (Wenn-dann, „bis zum Schatz“, Zaubersprüche, mehrere Gitter) zählen bei „kuerzestes“ die Karten (`minKarten`), siehe Abschnitt 4b. Bei den Spiel-Plugins ab Block B bewertet das Plugin nur das Ergebnis mit seinem Kern (z. B. e15: Stern nur bei Sieg gegen den Roboter). Texte im Kasten „bildschirm“ müssen diese Regel richtig wiedergeben. Danach kommt ein klares Ende: „Super! Jetzt zurück zum Papier.“

## 7. Qualität vor dem Abgeben

1. `./baue.sh --nur NN --png --dpi 110` ohne ❌ und ohne ⚠️.
2. **Jede Seite als Bild ansehen** (`out/seiten-NN/`): nichts abgeschnitten, nichts überlappt, Felder groß genug, Blatt luftig, Lösungsansicht lesbar und vollständig.
3. Jede Zahl im Text, in Spielregeln, Beispielsätzen und Lösungen nachrechnen (auch „nach 3 Befehlen steht er …“ in Worten: das prüft der Build nicht, also mit dem Ausführer nachrechnen).
4. Spiele einmal gedanklich zu zweit durchspielen: Geht es auf? Gibt es ein Ende? Reicht das Material?
5. Österreichisches Deutsch und Begriffe aus der Begriffsliste.

## 8. Neue Rätselart (ab Block B): vier Dateien, nichts im gemeinsamen Kern ändern

Eine Einheit mit einer neuen Rätselart (Muster, Geheimschrift, Kästchenbild, Ja/Nein-Zahlen, Logikgitter, Formen-Quadrat, Nim …) bringt alles in **eigenen Dateien** mit. `src/styles.css`, `src/components.js`, `src/bausteine/programmieren.js`, `web/app.js`, `web/app.css`, `web/kern/ausfuehrer.js`, `web/kern/symbole.js`, `werkzeuge/raetsel.mjs`, `werkzeuge/loeser.mjs` und `tests/web.spec.mjs` bleiben unverändert. `<art>` ist ein kurzes Wort ohne Umlaute (z. B. `geheim`), überall gleich:

| Datei | Inhalt |
|---|---|
| `web/kern/<art>.js` | Die Logik, die **Löser, Blätter und App gemeinsam** brauchen (z. B. Buchstaben verschieben, Muster ausrollen, Spielzüge des Computers). Ohne Abhängigkeiten, wie `ausfuehrer.js` gebaut: `(function (g) { … g.WerkstattGeheim = { … }; })(typeof globalThis !== 'undefined' ? globalThis : this);`. Wird automatisch geladen: im PDF-Build (Chrome), in der Web-App und in Node per `import '../../web/kern/<art>.js'`. |
| `werkzeuge/arten/<art>.mjs` | Prüfen und Lösen: `export default { art: '<art>', pruefe(r, F, ctx) { …; return loesung; }, bericht(r) { return 'kurz'; }, fuerApp(r) { return { …ohne Lösung… }; } }` (auch ein Array mehrerer Arten). `F('…')` meldet einen Fehler, der Build bricht dann ab. Hier wird bewiesen, was AUFTRAG.md Abschnitt 10 verlangt (genau eine Lösung, Gewinn-Strategie per Spielbaum …). Die Lösung landet in `r.loesung` und steht den Bausteinen der Blätter zur Verfügung (`H().DATEN.raetsel[id].loesung`). `fuerApp` gibt nur weiter, was die App braucht, **nie die Lösung** (ohne `fuerApp`: alles außer `loesung`, `paket` und den Feldern in `geheim: ['…']`). |
| `web/spiele/<art>.js` (+ optional `web/spiele/<art>.css`) | Das Spiel in der App: `window.WerkstattSpiele['<art>'] = { icon, start, grundMeldung, klick, los, nochmal, stopp }`. Schnittstelle im Kopf von `web/app.js`. Spielfeld in `api.feld`, Anzeige in `api.programm`, Tasten in `api.tasten` (mit `api.taste(…)`, mindestens 48 · 48 px, 8 px Abstand, kein Ziehen, kein Hover). Bewertet wird nach dem Ergebnis mit `web/kern/<art>.js`, Erfolg mit `api.geschafft({})`, freundliche Hinweise mit `api.meldung(text, 'hinweis')`. CSS-Klassen mit Präfix `<art>-`. Hoch: Feld oben, Tasten unten. Quer: Feld links, Tasten rechts. Ohne Scrollen auf 375 · 667 und 667 · 375. |
| `tests/spiele/<art>.mjs` | Test-Plugin: `export async function spiele(page, lv, h, info, fotos)` spielt ein Level per Antippen bis zum Geschafft-Fenster (Lösung selbst ausrechnen mit `web/kern/<art>.js`, die App kennt sie nicht). `export function tests({ test, expect, DATEN, h })` für weitere Tests: falsche Antwort → freundliche Meldung, Nochmal, Doppeltipp auf umschaltende Elemente. Jede neue Ansicht mit `h.ansicht(page, 'name', info)` fotografieren (prüft Scrollen, Tastengröße, Abstände). |

Dazu wie immer `raetsel/eN.json` (Rätsel der Blätter und `"web": { "titel", "art": "<art>", "levels": […] }`), `src/einheiten/NN-name.html` und bei Bedarf `src/bausteine/eN-name.js` (Bausteine für die Blätter, die ihre Lösung aus `r.loesung` holen und in der Lösungsansicht rot zeigen).

Ein Paket mit Levels verschiedener Arten (Einheit 20) hat `"art": "gemischt"`. Einheiten ohne neue Art (Wenn-dann, Labyrinth, Zaubersprüche) verwenden `pfad`, `lesen`, `kobold` mit den erweiterten Befehlen aus `plan/lehrplan.md` Abschnitt 7.8.

**Prüfen:**

```bash
werkzeuge/mit-nix.sh node werkzeuge/raetsel.mjs --bericht                  # alle Rätsel, auch die neuen Arten
./baue.sh --nur 07 --png --dpi 110                                         # Einheit 7, Seitenbilder in out/seiten-07/
werkzeuge/mit-nix.sh node werkzeuge/web-bauen.mjs                          # App bauen (prüft Zeichen, Adressen, Arten)
WERKSTATT_TEST_PORT=4107 npx playwright test --grep "e7|geheim" --project=chromium-iphone-hoch --project=webkit-iphone-quer --project=chromium-ipad-quer
```

Bildschirmfotos der Tests: `test-results/bilder/<projekt>/`. Jede Ansicht ansehen (wie die Seitenbilder der PDFs).

**Erfahrungen aus den Einheiten 6–15:**

- **Ladereihenfolge:** Die Spiel-Plugins laden **vor** `app.js` (`web/index.html`, Platzhalter `<!-- SPIELE -->`, eingesetzt von `werkzeuge/web-bauen.mjs`). Schon die erste Ansicht (QR-Code, Lesezeichen, Neuladen eines Levels) kennt also das Spiel. Ein Plugin braucht beim Laden nur seine Kern-Datei und `window.WerkstattSpiele` (legt es selbst an). Die Umgehung `neuZeichnen()` am Ende der Plugins der Einheiten 6–15 ist damit überflüssig (sie schadet nicht, neue Plugins brauchen sie nicht). Der Test „Direkt geöffnet“ in `tests/web.spec.mjs` öffnet jedes Paket und jedes Level über die Adresse, auch nach dem Neuladen, und erwartet im Level ein Element mit einer Klasse `<art>-…`.
- **Doppeltipp-Schutz im Test:** Ein Element mit `data-umschalter` schaltet bei einem zweiten Tipp innerhalb von 350 ms nicht zurück (`SPERRE` in `web/app.js`; beim Kind ist das richtig). `h.tippe` wartet nur auf die Belegungs-Sperre (`#app[data-sperre]`), nicht auf diesen Schutz. Zwei Tipps auf dasselbe umschaltende Element brauchen im Test darum mehr als 350 ms Abstand (`await page.waitForTimeout(400)`) oder wechseln mit anderen Tasten ab (so in `tests/spiele/logik.mjs`, `tippeRunden`).
- **Schnelle Gegenseite** (Roboter, Test-Tempo): Der Test wartet auf einen Zug-Zähler (z. B. `data-zug` in `web/spiele/nim.js`), nicht auf das Verschwinden eines Zustands, der nur kurz zu sehen ist. Umschaltende Tasten, die über mehrere Züge gleich bleiben, tragen den Zug-Zähler in `data-id` (`data-id="n2-5"`): Sonst schluckt der Doppeltipp-Schutz im schnellen Test den Tipp im nächsten Zug.
- **Schriftzeichen in Kommentaren:** `web-bauen.mjs` prüft jedes Zeichen von `app.js`, `web/spiele/<art>.js` und `web/kern/<art>.js` gegen die gekürzte Schrift. Entfernt werden nur `/* … */` und ganze `//`-Zeilen; ein Kommentar hinter Code wird mitgeprüft. Dort also kein „→“ oder ähnliches Zeichen.
- **Test-Port:** Für eigene Läufe `WERKSTATT_TEST_PORT=41NN` (NN = Nummer der Einheit, z. B. 4107), nie einen Port, auf dem schon der Server eines anderen läuft. Nicht 4190: WebKit sperrt ihn („restricted network port“).
- **Nur die Aufgabe in die App-Daten:** `fuerApp` gibt nur weiter, was das Kind sehen soll, nie die Lösung und nichts, woraus die App sie bloß ablesen müsste (bei den Feen-Zeichen der Code aus Form und Punkten, nicht das Wort; bei Ja-Nein-Bäumen leere Plätze). Nach dem Bauen in `_site/daten.js` nachsehen.

## 9. Reihenfolge im Buch

Alle Einheiten stehen schon in `src/buch.json` (Dateinamen `06-muster-detektivin.html` … `20-das-grosse-code-fest.html`). Eine noch nicht geschriebene Einheit ist eine Datei mit nur einem Kommentar. Die Einleitung verweist auf jeden Spickzettel (`#spick-N`); das ergänzt, wer die Rahmenseiten pflegt.
