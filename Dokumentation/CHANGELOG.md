# Changelog — mendooR

> **Zweck:** Überblick über **kleine** Änderungen — ohne Redundanz, eine Zeile pro Eintrag.
> **Nicht hier:** Große Änderungen und Entscheidungen → `ENTSCHEIDUNGEN.md`. Sitzungsverlauf → `PROTOKOLLE.md`.
> **Format:** `Datum · Bereich · Änderung · (Commit)`
> **Stand:** 20.10.2026

---

## Git-Historie (rekonstruiert)

### 2026-10-20
| Datum | Bereich | Änderung | Commit |
|---|---|---|---|
| 2026-10-20 | Doku | ADR D6 (KI-Assistenz: RAG-first, dann Workers AI) ergänzt; KI-Vergleich und Browserangaben präzisiert | — |
| 2026-10-20 | RAG | `functions/sources.js` (iFixit/Archiv/Tavily-Retrieval) und `functions/rag.js` (Quellen-Prompt) ergänzt | — |
| 2026-10-20 | Worker | `/api/ai` mit Timeout, Debug-Modus und Teilquellen-Fallback; `AI`-Binding in `wrangler.jsonc` | — |
| 2026-10-20 | UI | Optionaler KI-Eintrag `AiPanel` inkl. Quellenliste, Lade-/Fehlerzustand und CSS | — |
| 2026-10-20 | Doku | ADR D7, DOKUMENTATION §3.3, Protokoll S21 und Thesis 7.5 ergänzt | — |
| 2026-10-20 | Ergebnis-Screen | Geräteherkunft (OCR/Manuell/Demo) und Kategorie dynamisch; „Zuletzt verwendet“ korrigiert | — |
| 2026-10-20 | Ergebnis-Screen | Statische Materialkacheln durch kompakten iFixit-Quellenstrip ersetzt | — |
| 2026-10-20 | KI | Lokales Speichern der KI-Ergebnisse (`localStorage`), Detailansicht und Startseiten-Liste | — |

### 2026-09-25
| Datum | Bereich | Änderung | Commit |
|---|---|---|---|
| 2026-09-25 | Worker | Worker aktualisiert (Secrets-Store-Bindings, Tavily) | `b3bbfa3` |
| 2026-09-25 | Backend | Suchmaschinen-API-Endpunkt ergänzt | `69b0ba3` |

### 2026-07-31
| Datum | Bereich | Änderung | Commit |
|---|---|---|---|
| 2026-07-31 | App | App-Stand aktualisiert | `cd45d3a` |
| 2026-07-31 | Suche | Sprachunterstützung für die Suche | `f2a0fbf` |
| 2026-07-31 | Suche | Bugfixes bei Suchresultaten | `da63e12` |
| 2026-07-31 | Ergebnis-Screen | Design-Element angepasst | `2c4d9ef` |
| 2026-07-31 | Codebasis | Aufräumen, neuer Basisstand | `72a3a8f` |

### 2026-07-29
| Datum | Bereich | Änderung | Commit |
|---|---|---|---|
| 2026-07-29 | Community | Reddit-Suche (Link-out-Karten) ergänzt | `ea2d079` |
| 2026-07-29 | Dateien | Aktuelle Dateien aktualisiert | `a78d610` |

### 2026-07-28
| Datum | Bereich | Änderung | Commit |
|---|---|---|---|
| 2026-07-28 | Frontend | `index.html` aktualisiert | `dc2ecd1` |

### 2026-07-23
| Datum | Bereich | Änderung | Commit |
|---|---|---|---|
| 2026-07-23 | Community | Erste Reddit-API-Anbindung | `900e106` |

### 2026-07-20 – 2026-07-22
| Datum | Bereich | Änderung | Commit |
|---|---|---|---|
| 2026-07-22 | Kamera-UI | Kamera-Oberfläche überarbeitet | `0d1fb05` |
| 2026-07-22 | App | `app.js` aktualisiert | `58a1e32` |
| 2026-07-22 | App | `app.js` aktualisiert | `f7ba006` |
| 2026-07-22 | Styling | `styles.css` aktualisiert | `024dd0c` |
| 2026-07-20 | Styling | `styles.css` aktualisiert | `b7a4b0c` |
| 2026-07-20 | Kamera | Kleinere Kamera-Bugs behoben | `cbf6cba` |
| 2026-07-20 | Kamera | Kamera in Testumgebung angepasst | `6a44b99` |
| 2026-07-20 | Kamera | Kamerafunktion ergänzt | `d256c1b` |
| 2026-07-20 | Kamera | Kamerafunktionalität aktualisiert | `3fc9809` |

### 2026-07-16
| Datum | Bereich | Änderung | Commit |
|---|---|---|---|
| 2026-07-16 | Frontend | `index.html` aktualisiert | `3e786bd` |
| 2026-07-16 | Tests | Tests in Test-Branch übernommen | `7f68ef3` |

### 2026-07-13
| Datum | Bereich | Änderung | Commit |
|---|---|---|---|
| 2026-07-13 | OCR | Debug-Funktion für gescannten Text ergänzt | `16aa961` |
| 2026-07-13 | OCR | Umstellung von Tesseract auf Google Cloud Vision | `4442ec9` |

### 2026-07-09
| Datum | Bereich | Änderung | Commit |
|---|---|---|---|
| 2026-07-09 | Deploy | `wrangler.jsonc` aktualisiert | `e972a57` |
| 2026-07-09 | Worker | `_worker.js` aktualisiert | `f0586b5` |
| 2026-07-09 | Deploy | Projekt von `mendoor` in `mendoor1` umbenannt | `2624789` |
| 2026-07-09 | Deploy | `wrangler.jsonc` aktualisiert | `274b2fa` |
| 2026-07-09 | Deploy | `.wrangler` aus `.gitignore` entfernt | `3a5e91c` |
| 2026-07-09 | Deploy | Cloudflare Workers mit SPA-Assets konfiguriert | `7595cee` |
| 2026-07-09 | Deploy | Cloudflare-Workers-Konfiguration ergänzt | `db3a47c` |
| 2026-07-09 | Backend | `ping.js` erstellt | `f5d53ed` |

### 2026-06-25 – 2026-06-26
| Datum | Bereich | Änderung | Commit |
|---|---|---|---|
| 2026-06-26 | App | `app.js` aktualisiert | `7ff595b` |
| 2026-06-25 | Header | Header-Text angepasst | `3ffa5f1` |
| 2026-06-25 | Struktur | `test/`-Ordner eingeführt | `5066de1` |
| 2026-06-25 | Initial | Erster Upload des Beispiels | `876034f` |

---

## Laufende Einträge (ab 29.09.2026)

Neue kleine Änderungen werden hier oben eingetragen (neueste zuerst). Große Änderungen gehören **nicht** hierher, sondern als ADR in `ENTSCHEIDUNGEN.md`.

| Datum | Bereich | Änderung |
|---|---|---|
| 2026-10-21 | Ergebnis-Screen | Disclosure-Panel wächst mit Inhalt; OCR-Kandidatenranking; iFixit-Relevanzfilter; Prompt-Regel gegen gerätefremde Quellen (Commit `092b63f`) |
| 2026-10-21 | Suche | `bestSearchTerm` behält den Modellcode, wenn nur noch die Marke übrig bleibt (`Sony WH-1000XM4` statt `Sony`) (Commit `2921d5b`) |
| 2026-10-21 | Websuche | Web-Quellen live analysiert; Domain-Allowlist als Ursache fehlender Herstellerhandbücher identifiziert (siehe ADR D8, Vorschlag) |
| 2026-10-21 | KI-UI | Verwendete Quellensuche wird im `AiPanel` angezeigt (Commit `2921d5b`) |
| 2026-10-21 | Websuche | Vorläufiger strenger Web-Filter in Commit `2921d5b` (nicht deployt); wird bei einer D8-Umsetzung überarbeitet |
| 2026-10-01 | UI | Nachgeahmte System-Statusleiste (Uhrzeit/Akku) entfernt (siehe ADR C9) |
| 2026-10-01 | Responsive | Fluide Web-Oberfläche: Breakpoints ≤340 px (kompakt), ≥768 px (Raster/2-spaltig), ≥1200 px (3-spaltig); Safe-Area-Insets |
| 2026-10-01 | Icons | Emojis durch monochrome Lucide-Icons (`currentColor`) ersetzt; zentrale `Icon`-Fassade (siehe ADR C8) |
| 2026-10-01 | Startseite | Inspiration-Kacheln an Community-Kacheln angeglichen: ein `TileCard`-Baustein, einheitliches Padding |
| 2026-10-01 | Startseite | Hero-Bild (Pexels [Q29], `public/hero.jpg`) mit Text-Overlay ergänzt |
| 2026-10-01 | Doku | Legacy-Frontend (Wurzel-`app.js`/`styles.css`, `test/`) entfernt; vollständig archiviert in `mendoor/legacy_mendoor.md` |
| 2026-10-01 | Frontend | Migration auf React + Vite, komponentenbasierte Struktur (siehe ADR A6) |
| 2026-10-01 | Design | 5-Farben-Tokensystem; Styles in `tokens`/`base`/`components`/`screens` getrennt (siehe ADR C7) |
| 2026-10-01 | Deploy | Asset-Verzeichnis in `wrangler.jsonc` von `./test` auf `./dist` umgestellt |
| 2026-10-01 | Tooling | `package.json` + `vite.config.js` angelegt; `.gitignore` um `node_modules/`, `dist/`, `.wrangler/` ergänzt |
| 2026-10-01 | Doku | `QUELLEN.md` um Q25–Q28 ergänzt; Thesis-Abschnitt 5.1/5.2 an React-Struktur angeglichen |
| 2026-10-01 | Security | Kontrolle: keine Secrets in den neuen Dateien; `.gitignore` unverändert streng |
| 2026-09-29 | Doku | Projektverlauf ausgewertet; `REGELN.md`, `ENTSCHEIDUNGEN.md`, `PROTOKOLLE.md`, `CHANGELOG.md` angelegt |
| 2026-09-29 | Doku | `QUELLEN.md` (Master-Register, stabile `[Qn]`) und `EVALUATION.md` (Erfassungsschema) angelegt |
| 2026-09-29 | Doku | Quellen auf ein Nummerierungssystem vereinheitlicht; doppelte Quellenliste in `DOKUMENTATION.md` §12 entfernt; Nummerierungsfehler bei den Quellenverweisen der Thesis behoben |
| 2026-09-29 | Thesis | Kapitel 4 (Nutzeranforderungen) retrospektiv rekonstruiert; neue kanonische Kapitel 3 (Methodik) und 5.2 (Gestaltungsgrundlagen) |
| 2026-09-29 | Sicherheit | Offengelegten Google-API-Schlüssel entfernt (`vision PAI.txt` gelöscht); Sicherheitsregel in `REGELN.md` §6 aufgenommen; `.gitignore` um Secret-Muster ergänzt. **Schlüssel muss rotiert werden.** |
