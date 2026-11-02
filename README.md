# Denk- und Programmier-Werkstatt

Ein druckbarer Guide plus eine kleine Web-App, mit dem ein Elternteil mit seiner Tochter (6 Jahre, 1. Klasse Volksschule, Österreich) logisch denken und programmieren lernt: mit Befehlen, Programmen, Fehler-Kobolden und dem Wiederhol-Zauber, dann mit Mustern, Geheimcodes, Sortieren und Suchen, Wenn-dann-Regeln, Logik, Labyrinthen, Zaubersprüchen und Strategiespielen. Fast alles läuft am Papier, mit Bewegung und Basteln. Die Web-App ist ein kurzer, freiwilliger Bildschirm-Bonus am Ende einer Einheit (höchstens 15 Minuten, siehe `plan/lehrplan.md` Abschnitt 9).

Stand: **alle 20 Einheiten** sind ausformuliert, in vier Blöcken: A (1–5) Befehle, Programme, Fehler; B (6–10) Muster und Geheimcodes; C (11–14) Wenn-dann und Logik; D (15–20) Strategie und Projekte. Dazu die Web-Pakete **e2–e20** (ohne e18: Einheit 1 und 18 sind bewusst ohne Bildschirm). Plan, verbindliche Begriffe und Übersicht der Pakete: `plan/lehrplan.md`.

## Ergebnis

| Was | Inhalt |
|---|---|
| `out/denk-werkstatt.pdf` | alles: Titel, Inhalt, Einleitung, Hallo-Seite, Sammelpass, Einheiten (Spickzettel + Anleitung + Blätter + Lösungen), Urkunden, Rückmeldebogen, Gerätetest-Checkliste |
| `out/kopiervorlagen.pdf` | nur die Seiten des Kindes: Deckblatt, Hallo-Seite, Sammelpass, alle Blätter, Urkunden |
| `out/spickzettel.pdf` | höchstens zwei Seiten pro Einheit zum Mitnehmen beim Durchführen (beidseitig drucken): Vorbereitung zum Abhaken, Ablauf als Drehbuch mit Minuten, Spielregeln in Kürze und Sätzen zum Sagen, Hilfen, „Zum Schluss nicht vergessen“ |
| Web-App (`web/`, gebaut nach `_site/`) | 18 Level-Pakete (e2–e20 ohne e18, je 6–9 Levels) für Handy und Tablet; die Startseite zeigt die Blöcke A–D, ein Tipp auf einen Block seine Pakete; offline-fähig, über GitHub Pages veröffentlicht |

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

Die Prüfung sieht nur Dateiinhalte und Dateinamen. Der Repo-Name auf GitHub und damit die Pages-Adresse in den QR-Codes darf den Namen enthalten, das ist so gewollt und wird nicht geprüft.

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
- ein Spickzettel länger als zwei Seiten wird oder sein Ablauf (Schritte und Minuten) nicht mehr zur Anleitung passt,
- die Schrift auf einem Blatt des Kindes kleiner als 14 pt ist, auch gezeichnete Schrift in SVG-Bildern (Nebenbeschriftungen tragen `data-nebenschrift`),
- ein Gitterfeld auf einem Blatt kleiner als 20 mm ist oder eine Programm-Reihe mehr als 12 Kästchen hat,
- ein Pflichtteil einer Anleitung fehlt (Ziel, Material, Ablauf, Beispielsätze, Stolpersteine, Leichter/Schwerer, Bonus-Knobelei, Hintergrund, Bildschirm-Bonus, Lösungen),
- ein Symbol als Schriftzeichen statt als SVG geschrieben ist, ein Fachwort auf einem Blatt steht oder „Zauber“ außerhalb von Wiederhol-Zauber, Zauber-Kasten und Zauberspruch vorkommt,
- ein Zeichen in der Schrift fehlt,
- ein QR-Code aus dem Seitenbild nicht mehr gelesen werden kann oder ein Verweis auf ein Blatt ins Leere zeigt,
- der Name des Kindes in einer Quelldatei steht.

Warnungen (⚠️, z. B. bundesdeutsche Wörter wie „Treppe“ statt „Stiege“) bitte auch beheben.

## Rätsel prüfen

Alle Rätsel stehen in `raetsel/eN.json` (Einheit 18 hat keine). Dieselben Daten gehen an die Blätter und an die Web-App. Die Grundarten (Drachen-Pfade, Programme lesen, Kobold-Programme, Ablauf-Karten, Kürzer-Schreiben, ab Block C mit Wenn-dann-Kasten, „bis zum Schatz“, Zaubersprüchen und mehreren Gittern) löst `werkzeuge/loeser.mjs` mit demselben Ausführer, den auch die Web-App verwendet (`web/kern/ausfuehrer.js`).

Die Rätselarten ab Block B sind **Plugins**, je Art bis zu vier Dateien (Anleitung: `vorlagen/AUTOREN-LEITFADEN.md`, Abschnitt 8):

| Datei | Inhalt |
|---|---|
| `werkzeuge/arten/<art>.mjs` | prüfen und lösen (genau eine Lösung, Spielbaum …), nur die Aufgabe für die App |
| `web/kern/<art>.js` | gemeinsame Logik und Zeichnungen für Löser, Blätter und App |
| `web/spiele/<art>.js` (+ `.css`) | das Spiel in der App |
| `tests/spiele/<art>.mjs` | Test-Plugin: spielt jedes Level per Antippen durch |

Arten: `muster` (E6), `geheim` (E7), `kaestchen` (E8), `janein` (E9), `suche` (E10), `logik` (E12), `baum` (E13), `formen` (E14), `nim` (E15) und `zweidrachen` (E19, nur für die Blätter, ohne App-Spiel). Das Paket von Einheit 20 mischt Levels verschiedener Arten (`"art": "gemischt"`).

```bash
werkzeuge/mit-nix.sh node werkzeuge/raetsel.mjs --bericht   # alle Rätsel lösen, Bericht ausgeben
werkzeuge/mit-nix.sh node --test tests/kern.test.mjs        # Tests für Ausführer und Löser
```

## Web-App lokal bauen und testen

Die Web-App liegt in `web/` (einfaches HTML/CSS/JavaScript, ohne Server, Schriften lokal, keine externen Anfragen, Service Worker und Manifest für offline und Home-Bildschirm). Die Levels kommen aus den `"web"`-Abschnitten der Rätsel-Dateien.

```bash
werkzeuge/mit-nix.sh node werkzeuge/web-bauen.mjs     # web/ + Rätsel-Daten → _site/
werkzeuge/mit-nix.sh npx playwright test              # alle Tests in Chromium und WebKit (Handy, Tablet, hoch und quer)
# nur ein Paket und drei Geräte, auf einem eigenen Port:
WERKSTATT_TEST_PORT=4110 werkzeuge/mit-nix.sh npx playwright test --grep "e10|suche" \
  --project=chromium-iphone-hoch --project=webkit-iphone-quer --project=chromium-ipad-quer
```

`web-bauen.mjs` löst und prüft dabei alle Rätsel, schreibt die Level-Daten nach `_site/`, setzt die Build-Version in den Cache-Namen des Service Workers und prüft, dass jedes Level spielbar ist und keine fremden Adressen geladen werden. Zum Ausprobieren im Browser `_site/` mit einem beliebigen lokalen Webserver ausliefern (Service Worker brauchen `http://localhost`, nicht `file://`). Die Playwright-Tests spielen jedes Level einmal durch (Pfad-Levels mit einer Lösung des Lösers, die anderen Arten über ihr Test-Plugin), öffnen jedes Paket und Level auch direkt über die Adresse, machen Bildschirmfotos (`test-results/bilder/<projekt>/`), prüfen Tastengröße, Feldgröße (mindestens 36 px) und dass nichts scrollt, und lassen jeden Zugriff auf fremde Hosts scheitern. Für die neuen Kästen gibt es zusätzlich Test-Levels in `tests/fixtures/web-raetsel/` (`node werkzeuge/web-bauen.mjs --raetsel tests/fixtures/web-raetsel`, danach wieder ohne `--raetsel` bauen). Die Chromium-Tests nutzen das installierte Google Chrome (`channel: 'chrome'`, das braucht auch der PDF-Build); WebKit für Playwright einmalig mit `werkzeuge/mit-nix.sh npx playwright install webkit` holen.

Die Pakete sind ohne Schlüsselwort offen, der QR-Code auf dem Blatt führt direkt hin. Übersicht: `plan/lehrplan.md`, Abschnitt 7.7.

## Veröffentlichen (GitHub Pages)

Veröffentlicht wird **nur die Web-App** (`_site/`, gebaut aus `web/` und `raetsel/`), nie die PDFs. Das macht der Workflow `.github/workflows/pages.yml` bei jedem Push auf `main` (mit `actions/upload-pages-artifact` und `actions/deploy-pages`, Rechte `pages: write` und `id-token: write`).

Einmalig vor dem ersten Deploy:

1. Im Repo auf GitHub: **Settings → Pages → Source: „GitHub Actions“** einstellen.
2. Die Adresse ist dann `https://<benutzername>.github.io/<repo-name>/`.
3. Diese Adresse muss als `pagesBasis` in `werkstatt.json` stehen, weil die QR-Codes auf den Blättern daraus gebaut werden (`<pagesBasis>#e2` usw.). Steht in `kind.json` ebenfalls ein `pagesBasis`, gilt dieser Wert: Er muss dieselbe Adresse sein (oder ganz weg). Danach die PDFs neu bauen.
4. Die Adresse in der Gerätetest-Checkliste (letzte Seite im PDF) bei „Adresse der Web-App“ eintragen. Das Heft nennt sie absichtlich nirgends im Text, nur im QR-Code.

Ein Paket öffnet man über den QR-Code auf dem Blatt der Einheit oder über die Adresse plus `#e2`, `#e3` … Gratis-Konten brauchen für Pages ein öffentliches Repo. Deshalb steht der Name des Kindes in keiner Datei (im Repo-Namen ist er erlaubt).

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
src/bausteine/                   Bausteine fürs Programmieren (Gitter, Programm-Reihe, QR-Code …) und eigene Bausteine der Einheiten (eN-*.js)
src/fonts/                       Andika und Nunito (SIL Open Font License)
raetsel/eN.json                  Rätsel und Web-Levels pro Einheit (eine Datenquelle für Papier und App)
web/                             Web-App (index.html, Service Worker, Manifest, Schriften, Symbole)
web/kern/                        Ausführer, Symbole und die Logik jeder Rätselart, gemeinsam für Web-App, Build und Löser
web/spiele/                      Spiele der Rätselarten in der App (Plugins, eines pro Art)
werkzeuge/                       mit-nix.sh, Löser, Rätsel-Prüfung, Namens-Prüfung, Web-App bauen, Schriften kürzen
werkzeuge/arten/                 Rätselarten ab Block B: prüfen und lösen (eine Datei pro Art)
tests/                           Tests für Ausführer, Löser und Web-App; tests/spiele/ Test-Plugins pro Art, tests/fixtures/ Test-Levels
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
