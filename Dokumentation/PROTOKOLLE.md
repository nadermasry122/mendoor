# Sitzungsprotokolle — mendooR

> **Zweck:** Chronologisches Gedächtnis des Projekts — *was* geschah in welcher Sitzung.
> **Abgrenzung:** Entscheidungsbegründungen stehen in `ENTSCHEIDUNGEN.md`; kleine Änderungen in `CHANGELOG.md`. Hier nur Ziel, Verlauf, Fehler und Ergebnis.
> **Hinweis:** Rekonstruiert am 29.09.2026 aus dem Claude-Projektverlauf; S20/S21 am 20.10.2026 ergänzt; S23/S24 am 21.10.2026 ergänzt. Sitzung 1–5 waren teils Konzept-/Recherchesitzungen ohne Codeänderung.

---

## Übersicht

| # | Datum | Fokus | Kernergebnis | ADRs |
|---|---|---|---|---|
| S1 | 15.06.2026 | Prompt-Bau, erste App-Mockups | Erster klickbarer UI-Entwurf | — |
| S2 | 24.06.2026 | Screens → Prototyp, Dynamik, Kamera | Responsiver Prototyp mit Kamerazugriff | A1 |
| S3 | 25.06.2026 | iFixit-Anbindung, Dateitrennung, Deployment | Live auf GitHub Pages, erste Bugs behoben | D1 |
| S4 | 26.06.2026 | OCR-Fehlverhalten, Tesseract-Recherche | Entscheidungsgrundlage OCR | — |
| S5 | 06.07.2026 | Technologievergleich, Umsetzungsplan | Cloud Vision gewählt | A2 |
| S6 | 09.07.2026 | Cloudflare-Setup, Worker, Deployment | Worker live, `/api/ping` ok | A3, A4, E2, E3 |
| S7 | 13.07.2026 | Vision-Integration, Kamera-Redesign | `/api/vision` gebaut, Debug-Modus | — |
| S8 | 16.07.2026 | Debugging der Deploy-/Cache-Probleme | Ursache: doppelte Dateien | — |
| S9 | 20.07.2026 | Kamera-Features, UI-Politur, Shutter | Capability Detection, Performance | B1, C1, C5 |
| S10 | 23.07.2026 | OCR-Filter, Roadmap, IA, Reddit | Design-Doku, Reddit-403 analysiert | C2, E2 |
| S11 | 27.–28.07.2026 | Reddit-OAuth, Link-out-Konzept, Testkarte | Link-out-Lösung | D2 |
| S12 | 29.07.2026 | Karten einbauen, Archive.org | Reddit-Karten + Archiv-Sektion | D2, D3 |
| S13 | 30.–31.07.2026 | Design-Konsolidierung, CJK, Extraktion, Thesis | Strukturelle Regeln, Thesis-Synthese | A5, B3, B4, B5, C3, D5 |
| S14 | 05.08.2026 | Home-Reihenfolge, Kategorien-Konzept | Scanner oben; Kategorien offen | C4, C6 |
| S15 | 02.09.2026 | Zwischenbilanz | Zusammenfassung letzter Schritte | — |
| S16 | 25.09.2026 | Nutzungsfeedback | Neue ToDos identifiziert | — |
| S17 | 29.09.2026 | Doku-Konsolidierung | Diese Register/Dokumente angelegt | — |
| S18 | 01.10.2026 | React/Vite-Migration, Design-System | Komponentenarchitektur, 5-Farben-System, Icon-System | A6, C7, C8 |
| S19 | 01.10.2026 | Responsive-Überarbeitung, System-UI entfernt | Fluide Web-Oberfläche mit Breakpoints | C9 |
| S20 | 20.10.2026 | KI-Optionen prüfen, Assistenzschicht entscheiden | RAG-first, dann Cloudflare Workers AI | D6 |
| S21 | 20.10.2026 | RAG + Workers AI implementieren, KI-Eintrag bauen | `/api/ai`, RAG-Retrieval, AiPanel, Doku | D7 |
| S22 | 20.10.2026 | Ergebnis-Screen: Herkunft, Quellenlage, lokale KI-Speicherung | Dynamische Labels, Quellenstrip, Speichern/Detail | D7 (erweitert) |
| S23 | 21.10.2026 | Ergebnis-Screen: Scrollen, Quellenrelevanz, Build-Prüfung | Scrollfix, Kandidatenranking, iFixit-Filter; Commit `092b63f` | — |
| S24 | 21.10.2026 | Websuche: Domain-Allowlist und offene Suche | D8 vorgeschlagen: offene Suche + Trust-Ranking | D8 (Vorschlag); D4 zur Ablösung vorgeschlagen |

---

## S1 — 15.06.2026 · Prompt-Bau und erste Entwürfe

- **Ziel:** Akademisch korrekten Prompt für Thesis-Texterstellung bauen; App-Oberfläche aus einer Beschreibung/Mockup erzeugen (ohne Funktion).
- **Durchgeführt:** Prompt für wissenschaftliches Schreiben; erste statische UI-Mockups (Start, Scanner, Ergebnis) im Dark Mode.
- **Fehler/Beobachtung:** Quellen wurden als `[QUELLE]` statt mit ISBN/DOI ausgegeben → Prompt um exakte Zitatpflicht ergänzt.
- **Ergebnis:** Erster klickbarer UI-Entwurf (Mockup).
- **Nächste Schritte:** Layout dynamisch machen.

## S2 — 24.06.2026 · Prototyp, Dynamik, Kamera

- **Ziel:** Aus Screens einen ersten klickbaren, dynamischen Prototyp bauen; Kamerazugriff integrieren.
- **Durchgeführt:** Drei Screens zusammen, feste Größen durch dynamische Skalierung ersetzt, `getUserMedia()` für die Kamera.
- **Entscheidung:** **Web-Anwendung statt native App** (A1).
- **Ergebnis:** Responsiver Prototyp mit funktionierendem Kamerazugriff.
- **Nächste Schritte:** Echte Datenquelle anbinden (iFixit).

## S3 — 25.06.2026 · iFixit, Dateitrennung, Deployment

- **Ziel:** iFixit-Anbindung im Ergebnisbereich; App aufs Handy bringen.
- **Durchgeführt:** iFixit-Suche + Guide-Detail (DE bevorzugt, EN-Fallback); Trennung in `index.html`, `styles.css`, `app.js`; Deployment über GitHub Pages; anschließend Migration in Unterordner `test/`.
- **Entscheidung:** iFixit als Primärquelle mit Suchkaskade (D1).
- **Fehler:** 404 (privates Repo); Seite ohne CSS/JS (Cache + Namens-/Ordnerprobleme); `openScanner is not defined`; horizontale Overflows. Alle behoben.
- **Beobachtung (später relevant):** Modellnummern-Suche erkannte nichts; die reine iFixit-Beschränkung war zu eng → Wunsch nach Reddit/Google/YouTube.
- **Ergebnis:** App live; grundlegende Bugs behoben.
- **Nächste Schritte:** OCR verbessern.

## S4 — 26.06.2026 · OCR-Probleme und Tesseract-Recherche

- **Ziel:** Automatische Erkennung verbessern (erkannte Unsinn, auch ohne Text).
- **Durchgeführt:** Analyse der Tesseract-Schwächen; Paper-Zusammenfassung Tesseract; Diskussion Google ML Kit.
- **Erkenntnis:** Tesseract findet per Design *überall* Text — ungeeignet für rauschige Kamerabilder.
- **Ergebnis:** Entscheidungsgrundlage; Wunsch nach Cloud Vision / ML Kit.
- **Nächste Schritte:** Drei OCR-Technologien vergleichen.

## S5 — 06.07.2026 · Technologievergleich und Umsetzungsplan

- **Ziel:** Akademisch fundierte Gegenüberstellung Tesseract / ML Kit / Cloud Vision; nächste Schritte.
- **Durchgeführt:** Vergleich anhand von Papern; Fahrplan erstellt; API-Einschränkungen (Key-Sicherheit) diskutiert.
- **Entscheidung:** **Google Cloud Vision über serverseitigen Proxy** (A2, vorbereitend A3).
- **Ergebnis:** Klarer Umsetzungsplan; Wahl der Web-Architektur bestätigt.
- **Nächste Schritte:** Cloudflare aufsetzen.

## S6 — 09.07.2026 · Cloudflare-Setup und Worker (Meilenstein)

- **Ziel:** Sichere Schlüsselverwaltung + Proxy-Backend etablieren.
- **Durchgeführt:** Cloudflare-Account, Git-Integration (Auto-Deploy), Worker-Entry `functions/_worker.js`, `wrangler.jsonc`, `/api/ping`.
- **Entscheidungen:** Worker-Proxy (A3), Cloudflare statt GitHub Pages (A4).
- **Fehler (lange Kette, siehe `DOKUMENTATION.md` §9.1):** static-only-Projekt → Env-Variablen nicht anlegbar; Build-Fehler **10021** (`_worker.js` leer); `.git` als Assets (Verzeichnis `"."` → `"./test"`); zwei parallele Projekte; „No URLs enabled"; `/api/ping` lieferte HTML statt JSON (`not_found_handling` → `none`).
- **Ergebnis:** **`/api/ping` liefert korrektes JSON** — Backend erreichbar; Session-Dokument + Cloud-Vision-Übersicht erstellt.
- **Nächste Schritte:** `/api/vision` und Key im Secrets Store.

## S7 — 13.07.2026 · Vision-Integration und Kamera-Redesign

- **Ziel:** Scanner auf Cloud Vision umstellen; Kamera vollwertiger machen.
- **Durchgeführt:** `/api/vision` implementiert; Secret im Secrets Store; Vision-Response-Parsing; Debug-Modus (`?debug=1`); Kamera-Redesign geplant (Zoom, Fokus, Torch, Linsen).
- **Fehler/Beobachtung:** Debug-Modus löste nicht aus; „Method not allowed" (POST vs. GET); Unsinn-Erkennung blieb.
- **Ergebnis:** Endpunkt steht, Verifikation steht noch aus.
- **Nächste Schritte:** Debug-Ursache finden.

## S8 — 16.07.2026 · Debugging der Deploy-/Cache-Probleme

- **Ziel:** Warum greift die neue `app.js`/der Debug-Modus nicht?
- **Durchgeführt:** Eingrenzung; festgestellt: Browser-Cache und — entscheidend — **doppelte Dateiablage** (Root vs. `test/`), ausgeliefert wurde der 3 Wochen alte Stand.
- **Ergebnis:** Ursache identifiziert; Konsolidierung der Ablage beschlossen.
- **Erkenntnis:** Redundante Dateiablagen in Deployment-Pipelines sind eine strukturelle Fehlerquelle (Fehler #9).
- **Nächste Schritte:** Kamera-Features umsetzen.

## S9 — 20.07.2026 · Kamera-Features, UI-Politur, Performance

- **Ziel:** Zoom, Fokus, Torch, Flip, Objektivwechsel; Design nachbessern.
- **Durchgeführt:** Capability Detection (C1); Performance optimiert (B1); sekundärer Text heller (C5); Vignette entfernt (C5); Shutter beschleunigt.
- **Entscheidungen:** B1, C1, C5.
- **Fehler:** S25 zeigte keine Features (Capability-Handling); Vignette verdeckte Bild; Shutter 2–3 s.
- **Ergebnis:** Kamerasteuerung vollständig und adaptiv; Scan fühlt sich „voller" an.
- **Nächste Schritte:** OCR-Ergebnisse brauchbar filtern.

## S10 — 23.07.2026 · OCR-Filter, Roadmap, Informationsarchitektur, Reddit

- **Ziel:** Typenschild statt Fließtext erkennen; weitere Quellen erschließen; Design dokumentieren.
- **Durchgeführt:** Typenschild-Klassifikator (B2); Designentscheidung zur Zusammenführung von Anleitungen + Community (C2); Reddit-403 analysiert (D2); Roadmap und Fehlerdokumentation erstellt.
- **Entscheidungen:** C2, E2 (Quellenhierarchie).
- **Fehler/Erkenntnis:** Reddit 403 = datacenter-bedingt, nicht codebehebbar.
- **Ergebnis:** Saubere OCR-Filterung konzeptionell; Reddit-Situation geklärt; Design doku-fundiert.
- **Nächste Schritte:** Reddit-Lösung; Tab-Struktur.

## S11 — 27.–28.07.2026 · Reddit-OAuth-Versuch, Link-out, Testkarte

- **Ziel:** Reddit doch zum Laufen bringen.
- **Durchgeführt:** OAuth-Registrierung versucht → Verweis auf *Responsible Builder Policy* (Selbstregistrierung geschlossen); Alternativen geprüft; Link-out-Konzept und Testkarte gebaut.
- **Entscheidung:** **Link-out statt API** (D2).
- **Verworfen:** OAuth, Meta-Tag-Extraktion, Wayback.
- **Ergebnis:** Funktionale, rechtlich saubere Community-Lösung.
- **Nächste Schritte:** In App integrieren; Archive.org ergänzen.

## S12 — 29.07.2026 · Karten einbauen, Internet Archive

- **Ziel:** Reddit-Karten und Archiv-Anbindung ins Projekt bringen.
- **Durchgeführt:** Horizontale Subreddit-Karten integriert; `/api/archive` + „Anleitungen im Archiv"-Sektion gebaut; Fehlermeldungen überarbeitet.
- **Entscheidungen:** D2 (final), D3.
- **Fehler:** Doppelter „Community & Foren"-Eintrag.
- **Ergebnis:** Community und Archiv in der App.
- **Nächste Schritte:** Design angleichen.

## S13 — 30.–31.07.2026 · Design-Konsolidierung, Mehrsprachigkeit, Extraktion, Thesis

- **Ziel:** Design vereinheitlichen; Suchgenauigkeit; weltweite Nutzbarkeit; Thesis zusammenführen.
- **Durchgeführt:**
  - Archiv-Design an Guidelines angepasst, doppelten Community-Eintrag in **Disclosure** zusammengeführt (C3).
  - Suchgenauigkeit verbessert: `bestSearchTerm` (D5).
  - **Weltweite Typenschilder:** `languageHints` entfernt (A5); CJK-fähiger Klassifikator (B4).
  - **Extraktion von listenbasiert auf strukturbasiert** umgestellt (B3); Recall-vor-Precision-Prinzip formuliert (B5); Validierungstests inkl. synthetischer Fälle.
  - Prompt + Zusammenführung zur vollständigen Thesis (8 Kapitel, 19 Quellen); Extraktionskapitel als eigenständiges Kapitel.
- **Entscheidungen:** A5, B3, B4, B5, C3, D5.
- **Ergebnis:** Robusteres, weltweit einsetzbares System; Thesis-Entwurf erstellt; 6 Lücken markiert.
- **Nächste Schritte:** Kategorien-Funktion konzipieren.

## S14 — 05.08.2026 · Home-Reihenfolge und Kategorien-Konzept

- **Ziel:** Start-Screen verbessern; Kategorien einen Zweck geben.
- **Durchgeführt:** Scanner über Kategorien getauscht (C4); drei Optionen für die Kategorien diskutiert; Kombinationsidee (anonyme geteilte Scan-Historie) erwogen.
- **Entscheidungen:** C4; C6 **offen** (Datenschutz-Hinweis nötig).
- **Ergebnis:** Start-Reihenfolge umgesetzt; Kategorien-Konzept in der Schwebe.
- **Nächste Schritte:** Entscheidung zur geteilten Scan-Historie.

## S15 — 02.09.2026 · Zwischenbilanz

- **Ziel:** Überblick über die letzten drei großen Schritte.
- **Ergebnis:** Zusammenfassung: (1) Thesis zusammengeführt, (2) Home-Reihenfolge getauscht, (3) Kategorien-Konzept diskutiert. Offener Punkt: Entscheidung zur geteilten Scan-Historie.

## S16 — 25.09.2026 · Nutzungsfeedback

- **Ziel:** Nach längerer Nutzung Feedback einbringen.
- **Beobachtungen:**
  - YouTube- und Google-Suchsanbindung beginnen.
  - Subreddit-Karten passen nicht immer zum Gerät → Suche verfeinern.
  - Recyclinghöfe in der Nähe anzeigen.
- **Ergebnis:** Neue ToDos; Fix am Subreddit-Mismatch als erstes geplant.
- **Nächste Schritte:** Subreddit-Fix, dann neue Quellen.

## S17 — 29.09.2026 · Dokumentations-Konsolidierung

- **Ziel:** Projektverlauf nachvollziehbar machen; Dokumentation sauber strukturieren.
- **Durchgeführt:** Claude-Verlauf ausgelesen und ausgewertet; Dateirollen festgelegt (`REGELN`, `ENTSCHEIDUNGEN`, `PROTOKOLLE`, `CHANGELOG`, `QUELLEN`, `EVALUATION`, `BACHELORARBEIT`, `DOKUMENTATION`); alle großen Entscheidungen rückwirkend als ADRs erfasst; Quellen auf ein Master-Register vereinheitlicht; Kapitel 4 (Anforderungen) rekonstruiert.
- **Entscheidungen:** Dokumentationsregeln (siehe `REGELN.md`).
- **Ergebnis:** Vollständiges Entscheidungsregister (22 Einträge), Sitzungsprotokolle, Regeln, Master-Quellenregister, Evaluations-Erfassung; Thesis-Grundgerüst mit Kap. 1–7 (Kap. 4 rekonstruiert).
- **Nächste Schritte:** Evaluation-Daten sammeln; offene Kapitel 2.3/2.4/8; Subreddit-Fix; neue Quellen (YouTube/Google).

## S18 — 01.10.2026 · Migration auf React + Vite, Design-Tokens

- **Ziel:** Den als Einzeldatei-Sammlung gewachsenen MVP in eine wartbare, komponentenbasierte Architektur überführen; UI-Elemente und Funktionen wiederverwendbar machen; die Gestaltung auf wenige feste Farben begrenzen und auf allen Bildschirmgrößen absichern.
- **Durchgeführt:** Vite + React 19 eingerichtet (Feature-Branch `feature/react-vite`); App in Screens, UI-Kit, Hooks, `lib/` und zentralen Kontext zerlegt (44 Quelldateien); OCR-Pipeline unverändert portiert; `dist/` als neues Asset-Verzeichnis verdrahtet; fünf Farb-Tokens als Basissystem definiert.
- **Entscheidungen:** A6 (React/Vite), C7 (5-Farben-Tokens), C8 (monochromes Icon-System).
- **Validierung:** Produktions-Build fehlerfrei (57 Module); reine Logikmodule mit Node per Stichprobe gegen Referenzwerte geprüft (`bestSearchTerm`, `buildQueryCascade`, `filterToTypePlate`, `extractCandidates`, `isRealText`) — Ergebnisse entsprechen der früheren Implementierung; Preview-Server liefert `index.html` und Bundle aus.
- **Fehler/Erkenntnis:** —
- **Ergebnis:** Lauffähige React-App unter `src/`, Deployment-Ziel `dist/`; Legacy-Dateien (Root-Kopien, `test/`) entfernt und vollständig in `mendoor/legacy_mendoor.md` archiviert (8 Dateien, byte-genau verifiziert).
- **Nächste Schritte:** Verhalten im Browser bzw. auf Echtgerät prüfen (Kamera, OCR, iFixit); visuelle Abnahme der 5-Farben-Palette; Build über `wrangler` deployen und verifizieren; Evaluationsdaten sammeln.

---

## S19 — 01.10.2026 · Responsive-Überarbeitung und Entfernen der System-Statusleiste

- **Ziel:** Die Oberfläche soll auf allen Anzeigegrößen (Smartwatch, Smartphone, Tablet, Laptop, Desktop) gleichermaßen funktionieren; die nachgeahmte Statusleiste mit falscher Uhrzeit und Akku-Anzeige sollte verschwinden.
- **Durchgeführt:** `StatusBar`-Komponente und `useClock`-Hook entfernt; Shell von der festen „Phone Card“ auf eine fluide, zentrierte Web-Oberfläche umgestellt (Safe-Area-Insets statt 44-px-Leiste); Breakpoints ergänzt: ≤ 340 px kompakt, ≥ 768 px Raster/zweispaltig, ≥ 1200 px dreispaltig; Mindestgrößen (Padding, Kamera-Bedienung, Hero-Höhe) für kleine Displays reduziert.
- **Entscheidungen:** C9 (keine System-Statusleiste, fluide Web-Oberfläche).
- **Validierung:** Produktions-Build fehlerfrei; SSR-Smoke-Test aller fünf Screens ohne Laufzeitfehler; keine Referenzen auf `StatusBar`/`useClock`/`--status-h`/`--shell-max` mehr im Quellbaum.
- **Fehler/Erkenntnis:** Systemwerte (Uhr, Akku) sind im Web nicht zuverlässig verfügbar — eine Attrappe suggeriert falsche Information; echte Zustände gehören inhaltlich kommuniziert.
- **Ergebnis:** Randlose, fluide Oberfläche ohne System-Zierrat; Breakpoints nutzen den Platz auf Tablet/Desktop und halten sehr kleine Displays nutzbar.
- **Nächste Schritte:** Visuelle Abnahme auf echten Geräten bzw. via Device-Emulation (insb. ≤ 340 px und ≥ 1200 px); Verhalten im Browser/Echtgerät prüfen (Kamera, OCR, iFixit); Deployment.

---

## S20 — 20.10.2026 · KI-Assistenz: Prüfung und Entscheidung

- **Ziel:** KI-Optionen gegen Primärquellen prüfen und eine belastbare MVP-Entscheidung dokumentieren.
- **Durchgeführt:** Cloudflare Pricing/Limits/Modelle/Data Usage, caniuse sowie WebLLM-Paper/README gegengeprüft; Kostentabelle und Browserangaben präzisiert; Kandidaten A–D gegenübergestellt; Entscheidung **D6** formuliert.
- **Entscheidungen:** D6 — **RAG-first, danach Cloudflare Workers AI**; Tool-Calling erst nach der Evaluation; kein On-Device im MVP; kein Self-hosted im Live-Betrieb.
- **Fehler/Erkenntnis:** On-Device-KI würde die Zielgruppe alter Geräte ausschließen; die App benötigt ohnehin Netz für OCR/Quellen. Die Kostenmodellrechnung ist eine **Untergrenze** (ein Call; Tool-Loops/Embeddings fehlen). Deutsche Sprachqualität ist ungemessen.
- **Ergebnis:** ADR D6, präzisierter KI-Vergleich, aktualisierte Quellenangabe; Umsetzung noch offen.
- **Nächste Schritte:** Stufe 1 RAG-Retrieval + Quellenaufbereitung; danach `/api/ai` + `AI`-Binding; Evaluation.

---

## S21 — 20.10.2026 · RAG, Workers AI und KI-Eintrag

- **Ziel:** Die Entscheidung D6 in eine funktionale RAG-Kette und einen optionalen KI-Eintrag überführen.
- **Durchgeführt:** `functions/sources.js` (iFixit/Archiv/Tavily-Retrieval, Filter, Textbegrenzung) und `functions/rag.js` (Quellen-Normalisierung, Prompt, Antwort-Extraktion) angelegt; `/api/ai` in `functions/_worker.js` ergänzt; `"ai": { "binding": "AI" }` in `wrangler.jsonc` aktiviert; `requestAiGuide()` in `src/lib/api.js`; `AiPanel.jsx` inkl. Lade-/Fehler-/Quellenzustand gebaut; CSS in `screens.css`; `AiPanel` in `ResultScreen` eingebunden.
- **Entscheidungen:** D7 (serverseitiges Retrieval, gpt-oss-20b, manueller Button, Fallback); D6-Status auf Stufe 1+2 umgesetzt.
- **Validierung:** `npm run build` erfolgreich; `wrangler deploy --dry-run` erkennt das `AI`-Binding; `POST /api/ai?debug=1` liefert im lokalen Worker Quellen und Prompt; `searchIfixitGuides` liefert Treffer; `searchArchiveItems` liefert je nach Gerät Treffer und filtert Gerichtsakten; fehlender Tavily-Key wird als Teilfehler behandelt, ohne den Vorgang abzubrechen.
- **Fehler/Erkenntnis:** `wrangler dev --local` meldet „Binding AI needs to be run remotely“; der echte AI-Aufruf ist lokal nicht möglich. Der Debug-Modus trennt Retrieval/Prompt sauber vom Modellaufruf. Ohne Quellen darf keine generative Antwort entstehen. Ein direkter Browser-Aufruf von `/api/ai` ist ein **GET** und damit kein AI-Aufruf; der Endpunkt akzeptiert POST für AI und GET nur mit `?device=…&debug=1`. Bare GET liefert jetzt eine Nutzungshilfe (400) statt „Method not allowed“.
- **Ergebnis:** Funktionale RAG-Kette und optionaler KI-Eintrag; der echte Workers-AI-Aufruf ist noch nicht gegen ein authentifiziertes Konto getestet. Evaluation offen.
- **Nächste Schritte:** Deployment mit `AI`-Binding und Tavily-Key; echten AI-Aufruf testen; deutsche Qualität/Quellenabdeckung evaluieren; danach Tool-Calling und Caching/Streaming prüfen.

---

## S22 — 20.10.2026 · Ergebnis-Screen: Herkunft, Quellenlage, lokale KI-Speicherung

- **Ziel:** Fehlende Unterscheidung zwischen OCR und manueller Eingabe beheben; statische Materialwerte durch eine echte, kompakte Quellenlage ersetzen; KI-Ergebnisse lokal speicherbar machen.
- **Durchgeführt:** `AppContext` um `currentDeviceSource` erweitert; `openDevice(name, source)` und Recent-Scan-Metadaten angepasst; `ScannerScreen` übergibt `manual`/`ocr`; `HomeScreen` öffnet Recent-Einträge mit ihrer Quelle; `ProductCard` zeigt Herkunft, Kategorie und iFixit-Status dynamisch; `ScoreRow` durch einen kompakten Quellenstrip ersetzt; `lib/device.js` (Kategorie-Heuristik) und `lib/savedAi.js` (`localStorage`, max. 20) ergänzt; `AiPanel` um Speichern/Entfernen erweitert; `SavedAiDetailScreen` und Startseiten-Liste gebaut.
- **Entscheidungen:** D7 erweitert (lokale Speicherung, dynamische Quellenlage, keine statischen Materialwerte).
- **Validierung:** `npm run build` erfolgreich; Speicherlogik isoliert mit `localStorage`-Mock geprüft (Speichern, Laden, Löschen); Kategorie-/Herkunftsfunktionen stichprobenartig geprüft.
- **Fehler/Erkenntnis:** Die statischen Metall-/Goldwerte hatten keine per-Gerät-Datenbasis; sie wurden entfernt statt durch neue Fantasiezahlen ersetzt. Die Herkunft muss am Eingabepfad mitgeführt werden, sonst bleibt sie in Produktkarte und Recent-Liste falsch. Lokale Speicherung ist gerätegebunden und nicht synchronisiert.
- **Ergebnis:** Herkunft und Quellenlage sind dynamisch, die Kacheln sind kompakter, KI-Ergebnisse können gespeichert und über die Startseite wieder geöffnet werden.
- **Nächste Schritte:** Browser-Test der neuen Ansichten; optional gerätebezogene Materialdaten ergänzen; gespeicherte Einträge bei Bedarf exportierbar machen.

---

## S23 — 21.10.2026 · Ergebnis-Screen: Scrollen, Quellenrelevanz, veralteter Build

- **Ziel:** Die gemeldeten Fehler auf dem Ergebnis-Screen eingrenzen: Ergebnisse nur teilweise sichtbar, kein Scrollen, fachlich falsche KI-Antworten.
- **Durchgeführt:**
  - Revert geprüft: `git diff 300c43c HEAD` ist leer; der Revert `93aabee` ist baumgleich mit `300c43c`. Es gab keinen halb zurückgerollten Quellcode.
  - **Veralteter Build gefunden:** `dist/` enthielt noch Strings aus dem reverted Commit `cc84624` (u. a. „Auf Gerät speichern“, „Quellenlage“); `npm run build` neu ausgeführt.
  - **Scrollen:** `.disclosure__panel` war auf `max-height: 420px` mit `overflow: hidden` begrenzt. Mit acht Archiv-/Web-Treffern waren 419 px von 482/594 px sichtbar. Auf `0fr→1fr`-Grid mit eigenem Inhalts-Wrapper umgestellt; den KI-Sonderfall `max-height: 3000px` entfernt.
  - **OCR-Kandidaten:** `extractCandidates` bevorzugte Modellcodes (Label-Regel 6 Punkte) vor Markennamen. `A2890` → iFixit Samsung SCH-A890, `A2251` → Shark-Staubsauger. Marken-/Mehrwort-Kandidaten höher gewichtet; der Code bleibt als Chip auswählbar.
  - **iFixit-Relevanzfilter:** Guides nur behalten, wenn Titel/Subject/Kategorie alle aussagekräftigen Geräte-Token enthalten.
  - **Prompt:** Regel ergänzt, gerätefremde Quellen zu ignorieren.
- **Entscheidungen:** Keine neue ADR; Vorarbeit zu D8 (Such-/Quellenlogik).
- **Validierung:** `npm run build` erfolgreich; DOM-Messungen (Panel 482/482, 594/594; Seite scrollt bis zum Maximum); Node-Tests der iFixit-Filter; Live-Debug des Workers.
- **Fehler/Erkenntnis:** Ein Revert kann sauber sein, während der Build veraltet bleibt. Eine feste `max-height` plus `overflow: hidden` erzeugt einen nicht scrollbaren Bereich, obwohl die Seite selbst scrollt. Die OCR-Vorauswahl entscheidet über die fachliche Relevanz der gesamten Quellenkette.
- **Ergebnis:** Fixes in Commit `092b63f`; der Ergebnis-Screen scrollt, die Quellen sind gerätenäher.
- **Nächste Schritte:** Websuche prüfen (→ S24).

---

## S24 — 21.10.2026 · Websuche: Domain-Allowlist, offene Suche und D8

- **Ziel:** Die Web-Quellen der KI nachvollziehen und die Ursache für weiterhin irrelevante Antworten beseitigen; die Suchstrategie neu ausrichten.
- **Durchgeführt:**
  - Live-Debug des Workers (`/api/ai?device=…&debug=1`) für iPhone 14 Pro, A2890, A2251, Bosch Serie 6, Samsung Galaxy S21, MacBook Pro 13, Waschmaschine Bosch und Sony WH-1000XM4.
  - Befund: Web-Quellen sind überwiegend Tests, Preisvergleiche, Angebote und markenbezogene, aber gerätefremde Artikel (z. B. Bosch-Heißluftfritteuse, E-Bike-Update, Notebookcheck-Suchseite; Sony PlayStation 2/A7 III).
  - **Ursache 1:** `include_domains` beschränkt Tavily auf sechs deutsche Tech-Seiten; Hersteller-Support (Dell, Lenovo, Apple …) ist ausgeschlossen.
  - **Ursache 2:** `WEB_REPAIR_HINT` erkennt `manual`/`handbuch`/`owner's manual` nicht; das offizielle Dell-Handbuch würde selbst ohne Domain-Beschränkung verworfen.
  - **Ursache 3:** `bestSearchTerm('Sony WH-1000XM4')` → `Sony`; der Modellcode wird verworfen, wenn nur die Marke übrig bleibt.
  - **Nutzertest „latitude 7420“:** in der App 0 Treffer; ohne `include_domains` erscheint das offizielle Dell-Handbuch als zweiter Treffer.
  - **D8 formuliert:** offene Suche, Query-Builder mit Marken-Inferenz und bilingualen Dokumentations-/Reparaturbegriffen, Trust-Ranking statt Allowlist, offizielle Handbücher als Primärquellen, optionale zweite Suche, Cache, UI-Badges und Benchmark.
  - **Vorläufig in Commit `2921d5b` (nicht deployt):** strenger Web-Filter, `bestSearchTerm`-Edge-Case, Prompt-Regel 10, Query-Anzeige im `AiPanel`. Diese Umsetzung widerspricht teilweise D8 und wird bei einer D8-Umsetzung überarbeitet.
- **Entscheidungen:** **D8** als Lösungsvorschlag dokumentiert (Entscheidung und Umsetzung ausstehend); **D4**-Domain-Allowlist zur Ablösung vorgeschlagen; **D5** um den Brand-only-Fall ergänzt (Vorschlag).
- **Validierung:** Live-Debug vor/nach Filter; isolierte Node-Tests (A2890/A2251 ohne falsche iFixit-Treffer; iPhone/Galaxy/MacBook/Waschmaschine behalten passende Treffer); Nutzerbeobachtung „latitude 7420“; kein D8-Code implementiert.
- **Fehler/Erkenntnis:** Eine Allowlist maximiert Precision, erzeugt aber systematische False Negatives und schließt die beste Quelle (Herstellerhandbuch) aus. Ein Intent-Filter ohne Dokumentationsbegriffe verwirft „Owner’s Manual“. Offene Suche braucht Ranking, nicht Ausschluss.
- **Ergebnis:** Ursachenanalyse und D8 dokumentiert; Implementierung und Evaluation offen.
- **Nächste Schritte:** D8-Entscheidung herbeiführen und bei Zustimmung stufenweise umsetzen (Query-Builder, offene Suche, Ranking, Fallbacks, Cache), Benchmark in `EVALUATION.md` §6.4 messen, `DOKUMENTATION.md` §5.5/§7.4 und Thesis 7.4 nachziehen.

---

## Wiederkehrende Muster (sitzungsübergreifend)

- **Externe Randbedingungen** (Reddit-Policy, Google-API-Abschaltung, CORS) waren mehrfach entscheidend — nie selbstverschuldet, aber dokumentationspflichtig.
- **Deployment-/Pfadprobleme** traten gehäuft auf (Cache, doppelte Ablagen, Konfiguration).
- **Jede Sitzung endet mit Doku** (Protokoll/Kapitel/Plan) — Muster, das die Nachvollziehbarkeit sichert.
- **Suchdesign:** Harte Allowlists maximieren Precision, erzeugen aber systematische False Negatives (Herstellerhandbücher). Offene Suche braucht Intent- und Trust-Ranking statt Ausschluss.
