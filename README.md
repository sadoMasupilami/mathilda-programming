# Denk- und Programmier-Werkstatt

Ein druckbarer Guide plus eine kleine Web-App, mit dem ein Elternteil mit seiner Tochter (6 Jahre, 1. Klasse Volksschule, Österreich) logisch denken und programmieren lernt: mit Befehlen, Programmen, Fehler-Kobolden, Wiederhol-Zauber, später Mustern, Geheimcodes, Wenn-dann-Regeln und Strategiespielen. Fast alles läuft am Papier, mit Bewegung und Basteln. Die Web-App ist ein kurzer, freiwilliger Bildschirm-Bonus am Ende einer Einheit.

Die Werkstatt entsteht in Blöcken. Jetzt fertig: **Block A, Einheiten 1–5** (Befehle, Programme, Fehler) mit den Web-Paketen e2–e5. Der Plan für 20 Einheiten steht in `plan/lehrplan.md`.

## Ergebnis

| Was | Inhalt |
|---|---|
| `out/denk-werkstatt.pdf` | alles: Titel, Inhalt, Einleitung, Hallo-Seite, Sammelpass, Einheiten (Anleitung + Blätter + Lösungen), Urkunden, Rückmeldebogen, Gerätetest-Checkliste |
| `out/kopiervorlagen.pdf` | nur die Seiten des Kindes: Deckblatt, Hallo-Seite, Sammelpass, alle Blätter, Urkunden |
| Web-App (`web/`, gebaut nach `_site/`) | Level-Pakete e2–e5 für Handy und Tablet, offline-fähig, über GitHub Pages veröffentlicht |

Drucken in **Originalgröße (100 %)**, damit die Gitterfelder mindestens 2 cm groß sind.

Die PDFs werden **nur lokal** gebaut. Sie sind nicht eingecheckt und kommen nicht auf GitHub Pages, weil sie den Namen des Kindes enthalten.

## Datenschutz: der Name bleibt lokal (Variante B)

Der Vorname des Kindes steht **in keiner Datei im Repo**. In allen Quellen steht der Platzhalter `{{KIND}}` (Genitiv `{{KIND}}s`). Beim Bauen setzt `build.mjs` den Namen aus `kind.json` ein. Diese Datei ist in `.gitignore` und wird nie eingecheckt.

Einmalig anlegen:

```bash
cp kind.beispiel.json kind.json
# in kind.json bei "KIND" den Vornamen eintragen
```

`kind.json` kann außerdem `pagesBasis` enthalten (die Adresse der Web-App, siehe unten). Sonst gilt der Wert aus `werkstatt.json`.

Der Build prüft bei jedem Lauf alle Dateien, die ins Repo kommen würden (eingecheckte und neue, nicht ignorierte), und **bricht ab**, wenn der Name irgendwo steht, auch in Kommentaren oder Dateinamen. Einzeln prüfen:

```bash
werkzeuge/mit-nix.sh node werkzeuge/pruefe-name.mjs
```

Die Prüfung sieht nur Dateiinhalte und Dateinamen. Zwei Stellen prüft sie **nicht**, die gehören trotzdem dazu:

- **Der Repo-Name auf GitHub.** Er steht in der öffentlichen Pages-Adresse (`https://<benutzername>.github.io/<repo-name>/`) und damit in jedem QR-Code. Er darf den Namen des Kindes nicht enthalten (z. B. `denk-werkstatt`). Kontrolle: `git remote -v`.
- **`pagesBasis` in `kind.json`.** Diese lokale Adresse überschreibt die aus `werkstatt.json` und landet in den QR-Codes der PDFs. Sie muss auf dieselbe Adresse ohne Namen zeigen.

Außerdem: keine Fotos, kein Nachname, keine Schule, kein Wohnort in den Quellen. Die Web-App enthält keinen Namen, keine Anmeldung, keine Tracker und hat `noindex`. Wer will, gibt in der App unter „Für Erwachsene“ einen Namen ein. Er bleibt nur im Browser dieses Geräts.

## Bauen

Alle Werkzeuge (Node 22, poppler, zbar, qrencode, Python mit fontTools) kommen über **Nix**, nichts wird global installiert. Dazu braucht es Google Chrome (oder `WERKSTATT_CHROME=/pfad/zu/chrome`).

```bash
./baue.sh                            # ganzes Buch + Kopiervorlagen → out/
./baue.sh --nur 03 --png --dpi 110   # nur Einheit 3, Seitenbilder in out/seiten-03/
./baue.sh --nur rahmen --png         # nur Titel, Einleitung, Sammelpass, Urkunden, Rückmeldebogen, Gerätetest
./baue.sh --png --dpi 110            # alle Seiten als Bild in out/seiten/
```

`baue.sh` startet `werkzeuge/mit-nix.sh` und installiert beim ersten Lauf `playwright-core` lokal (`node_modules/`). Jeder andere Befehl läuft genauso: `werkzeuge/mit-nix.sh <befehl>`.

Der Build prüft automatisch und bricht mit ❌ ab, wenn

- ein Rätsel nicht lösbar oder nicht eindeutig (und nicht gekennzeichnet) ist,
- eine Rechnung im Text falsch ist,
- ein Blatt über die A4-Seite läuft, etwas in den Druckrand ragt oder eine Leerseite entsteht,
- die Schrift auf einem Blatt des Kindes kleiner als 14 pt ist,
- ein Pflichtteil einer Anleitung fehlt (Ziel, Material, Ablauf, Beispielsätze, Stolpersteine, Leichter/Schwerer, Bonus-Knobelei, Hintergrund, Bildschirm-Bonus, Lösungen),
- ein Symbol als Schriftzeichen statt als SVG geschrieben ist, ein Fachwort auf einem Blatt steht oder „Zauber“ außerhalb von Wiederhol-Zauber, Zauber-Kasten und Zauberspruch vorkommt,
- ein Zeichen in der Schrift fehlt,
- ein QR-Code aus dem Seitenbild nicht mehr gelesen werden kann,
- der Name des Kindes in einer Quelldatei steht.

Warnungen (⚠️, z. B. bundesdeutsche Wörter wie „Treppe“ statt „Stiege“) bitte auch beheben.

## Rätsel prüfen

Alle Rätsel (Drachen-Pfade, Programme lesen, Kobold-Programme, Ablauf-Karten, Kürzer-Schreiben) stehen in `raetsel/eN.json`. Dieselben Daten gehen an die Blätter und an die Web-App. Ein Löser (`werkzeuge/loeser.mjs`, Breitensuche über Feld und Blickrichtung) prüft und löst sie mit demselben Ausführer, den auch die Web-App verwendet (`web/kern/ausfuehrer.js`).

```bash
werkzeuge/mit-nix.sh node werkzeuge/raetsel.mjs --bericht   # alle Rätsel lösen, Bericht ausgeben
werkzeuge/mit-nix.sh node --test tests/kern.test.mjs        # Tests für Ausführer und Löser
```

## Web-App lokal bauen und testen

Die Web-App liegt in `web/` (einfaches HTML/CSS/JavaScript, ohne Server, Schriften lokal, keine externen Anfragen, Service Worker und Manifest für offline und Home-Bildschirm). Die Levels kommen aus den `"web"`-Abschnitten der Rätsel-Dateien.

```bash
werkzeuge/mit-nix.sh node werkzeuge/web-bauen.mjs     # web/ + Rätsel-Daten → _site/
werkzeuge/mit-nix.sh npx playwright test              # Tests in Chromium und WebKit (Handy, Tablet, hoch und quer)
```

`web-bauen.mjs` löst und prüft dabei alle Rätsel, schreibt die Level-Daten nach `_site/`, setzt die Build-Version in den Cache-Namen des Service Workers und prüft, dass jedes Level spielbar ist und keine fremden Adressen geladen werden. Zum Ausprobieren im Browser `_site/` mit einem beliebigen lokalen Webserver ausliefern (Service Worker brauchen `http://localhost`, nicht `file://`). Die Playwright-Tests spielen jedes Level einmal durch, machen Bildschirmfotos und lassen jeden Zugriff auf fremde Hosts scheitern. Die Chromium-Tests nutzen das installierte Google Chrome (`channel: 'chrome'`, das braucht auch der PDF-Build); WebKit für Playwright einmalig mit `werkzeuge/mit-nix.sh npx playwright install webkit` holen.

Die Pakete sind ohne Schlüsselwort offen, der QR-Code auf dem Blatt führt direkt hin. Übersicht: `plan/lehrplan.md`, Abschnitt 7.7.

## Veröffentlichen (GitHub Pages)

Veröffentlicht wird **nur die Web-App** (`_site/`, gebaut aus `web/` und `raetsel/`), nie die PDFs. Das macht der Workflow `.github/workflows/pages.yml` bei jedem Push auf `main` (mit `actions/upload-pages-artifact` und `actions/deploy-pages`, Rechte `pages: write` und `id-token: write`).

Einmalig vor dem ersten Deploy:

1. **Repo-Name prüfen (Pflicht).** Der Repo-Name darf den Vornamen des Kindes nicht enthalten, sonst steht er in der öffentlichen Adresse und in jedem QR-Code. Enthält er ihn, das Repo auf GitHub umbenennen (**Settings → General → Repository name**, z. B. `denk-werkstatt`) und danach lokal die Remote-Adresse anpassen: `git remote set-url origin https://github.com/<benutzername>/<neuer-name>.git`.
2. Im Repo auf GitHub: **Settings → Pages → Source: „GitHub Actions“** einstellen.
3. Die Adresse ist dann `https://<benutzername>.github.io/<repo-name>/`.
4. Diese Adresse muss als `pagesBasis` in `werkstatt.json` stehen, weil die QR-Codes auf den Blättern daraus gebaut werden (`<pagesBasis>#e2` usw.). Steht in `kind.json` ebenfalls ein `pagesBasis`, gilt dieser Wert: Er muss dieselbe Adresse sein (oder ganz weg). Danach die PDFs neu bauen.
5. Die Adresse in der Gerätetest-Checkliste (letzte Seite im PDF) bei „Adresse der Web-App“ eintragen. Das Heft nennt sie absichtlich nirgends im Text, nur im QR-Code.

Ein Paket öffnet man über den QR-Code auf dem Blatt der Einheit oder über die Adresse plus `#e2`, `#e3` … Gratis-Konten brauchen für Pages ein öffentliches Repo. Deshalb darf der Name des Kindes in keiner Datei und auch nicht im Repo-Namen stehen.

Vor Einheit 1: die **Gerätetest-Checkliste** (letzte Seite im PDF) auf iPhone, iPad und Android abarbeiten.

## Aufbau

```
AUFTRAG.md                       Auftrag mit allen Wünschen
plan/lehrplan.md                 Plan für 20 Einheiten + verbindliche Begriffsliste, Symbole, Gitter-Regeln, Web-Pakete
vorlagen/AUTOREN-LEITFADEN.md    wie man eine Einheit schreibt, alle Bausteine, Rätsel-Datenformat
src/buch.json                    Reihenfolge der Teile im Buch
src/rahmen/                      Titel, Inhalt, Einleitung, Hallo-Seite, Sammelpass, Urkunden, Rückmeldebogen, Gerätetest
src/einheiten/NN-*.html          eine Datei pro Einheit (Anleitung + Blätter)
src/einheiten/00-muster.html     Muster mit allen Bausteinen (nicht im Buch)
src/styles.css                   Design (A4, Schriften, Farben pro Block)
src/components.js                Kern-Bausteine, Lösungsansicht, Inhaltsverzeichnis, Prüfungen
src/bausteine/                   Bausteine fürs Programmieren (Gitter, Programm-Reihe, QR-Code …)
src/fonts/                       Andika und Nunito (SIL Open Font License)
raetsel/eN.json                  Rätsel und Web-Levels pro Einheit (eine Datenquelle für Papier und App)
web/                             Web-App (index.html, Service Worker, Manifest, Schriften, Symbole)
web/kern/                        Ausführer und Symbole, gemeinsam für Web-App, Build und Löser
werkzeuge/                       mit-nix.sh, Löser, Rätsel-Prüfung, Namens-Prüfung, Web-App bauen, Schriften kürzen
tests/                           Tests für Ausführer, Löser und Web-App
build.mjs, baue.sh               PDFs bauen
werkstatt.json                   Titel, Stand, Adresse der Web-App (ohne Namen)
kind.beispiel.json               Vorlage für kind.json (lokal, nie einchecken)
.github/workflows/pages.yml      Web-App auf GitHub Pages veröffentlichen
```

## Etwas ändern

- **Text oder Aufgabe:** in `src/einheiten/NN-*.html` ändern und `./baue.sh --nur NN --png` laufen lassen. Dann die Seitenbilder in `out/seiten-NN/` ansehen.
- **Ein Rätsel:** in `raetsel/eN.json` ändern. Lösungen muss man nicht nachtragen: Gitter und Programm-Reihen holen sie sich vom Löser und zeigen sie in der Lösungsansicht der Anleitung. Ist ein „finde das kürzeste“-Rätsel nicht mehr eindeutig, meldet der Build das.
- **Ein Web-Level:** ebenfalls in `raetsel/eN.json` (Abschnitt `"web"`), danach `werkzeuge/web-bauen.mjs` und die Playwright-Tests laufen lassen.
- **Begriffe, Symbole, Gitter-Regeln:** zuerst in `plan/lehrplan.md` (Abschnitt 7) ändern, dann überall übernehmen. Sie gelten für Blätter, Anleitung und Web-App gleich.
- **Sammelpass-Titel** späterer Einheiten: `src/rahmen/04-sammelpass.html` (die Blockgrenzen müssen zu `src/components.js` passen: 1–5, 6–10, 11–14, 15–20).
- **Nach der Rückmeldung:** `plan/lehrplan.md`, Abschnitt 10 „Rückmeldung einarbeiten“.

Details zu allen Bausteinen: `vorlagen/AUTOREN-LEITFADEN.md`.
