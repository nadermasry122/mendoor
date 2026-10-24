# mendooR - Projektdokumentation

> **Projekt:** Entwicklung einer mobilen Anwendung zur Identifikation und Reparaturunterstützung von Elektroaltgeräten
> **Art:** Bachelorarbeit
> **Stand:** 20.10.2026
> **Dokumentstatus:** Konsolidierte Fassung - zusammengeführt aus den Entwicklungs-Sitzungsprotokollen, den Kapitelentwürfen und dem tatsächlichen Quellcode

---

## Inhalt

1. [Projektüberblick](#1-projektüberblick)
2. [Vorgehensweise und Methodik](#2-vorgehensweise-und-methodik)
3. [Systemarchitektur](#3-systemarchitektur)
4. [Technologieentscheidung: OCR](#4-technologieentscheidung-ocr)
5. [Kernkomponenten der Anwendung](#5-kernkomponenten-der-anwendung)
6. [Informationsarchitektur und UI-Konzept](#6-informationsarchitektur-und-ui-konzept)
7. [Externe Informationsquellen](#7-externe-informationsquellen)
8. [Infrastruktur und Deployment](#8-infrastruktur-und-deployment)
9. [Fehlerchronik und Lösungen](#9-fehlerchronik-und-lösungen)
10. [Evaluation und Messgrößen](#10-evaluation-und-messgrößen)
11. [Offene Punkte und Roadmap](#11-offene-punkte-und-roadmap)
12. [Quellenverzeichnis](#12-quellenverzeichnis)
13. [Anhang: Dateien und Endpunkte](#13-anhang-dateien-und-endpunkte)

---

## 1. Projektüberblick

### 1.1 Problemstellung

Die gegenwärtige Lebensweise ist von fortschreitender Technisierung geprägt, wodurch stetig Elektroaltgeräte anfallen. Für 2022 wurden weltweit 62 Milliarden Kilogramm Elektroschrott dokumentiert (7,8 kg pro Kopf), von denen nur 22,3 % fachgerecht recycelt wurden [Q1]. Der enthaltene Materialwert wird auf ~91 Mrd. USD geschätzt; dem stehen Umwelt- und Gesundheitskosten durch unsachgemäße Entsorgung gegenüber.

Häufig scheitert die Wiederverwendung funktionsfähiger Komponenten (etwa ein Laptop als Homeserver oder Mediathek) **an einem hohen Rechercheaufwand** für den Endnutzer. Es besteht eine Diskrepanz zwischen der ökologischen Notwendigkeit der Lebensdauerverlängerung und dem individuellen Informationszugang zu Reparatur- und DIY-Wissen.

### 1.2 Zielsetzung

Entwicklung einer mobilen Applikation (mendooR), die:
1. ein Elektrogerät automatisiert anhand seines **Typenschilds** identifiziert (Kamera + OCR),
2. dem Nutzer gebündelt **Reparatur-, Community- und Rechercheinformationen** zu diesem Gerät bereitstellt,
3. dadurch Wiederverwendung und fachgerechtes Recycling fördert.

Übergeordnet soll technisches Know-how so aufbereitet werden, dass Nutzer technologische Zusammenhänge verstehen und Geräte länger nutzen (Konzept *Facilitated Do-It-Yourself Repair, FDR* [Q2]).

### 1.3 Technische Grundausrichtung

mendooR wurde als **browserbasierte mobile Web-Anwendung** realisiert - nicht als native Android-App. Gründe: Geräteunabhängigkeit, sofortige Verteilbarkeit ohne App-Store, Wiederverwendung der bestehenden Web-Architektur und die direkte Anbindung serverbasierter OCR.

> **Konsistenzhinweis:** Ein früher, freigegebener Konzepttext (Kapitel 1.3 "Aufbau der Arbeit") nannte noch eine "Implementierung im Android-Ökosystem". Diese Abweichung zwischen frühem Konzept und späterer technischer Entscheidung wird hier transparent ausgewiesen und nicht stillschweigend korrigiert.

---

## 2. Vorgehensweise und Methodik

Die Entwicklung folgte einem **iterativen, sitzungsbasierten Vorgehen** mit durchgängiger Dokumentationspflicht. Kennzeichen:

| Prinzip | Umsetzung |
|---|---|
| **Iterativ / implementierungsgetrieben** | Jede Sitzung beginnt mit dem verifizierten Stand der Vorsitzung, endet mit einem getesteten Inkrement und einem nächsten Plan. |
| **Quellenbasierte Entscheidungen** | Design- und Technologieentscheidungen werden mit Primärquellen (Hersteller-Guidelines, wissenschaftliche Paper) belegt, nicht behauptet. Für Designfragen gilt eine feste Quellenhierarchie (siehe 2.1). |
| **Fehler als Dokumentationsgegenstand** | Jeder Fehler wird nach dem Schema *Symptom → Diagnose → Ursache → Lösung → Erkenntnis* festgehalten. Die Erkenntnis-Absätze sind bewusst verallgemeinert, um in der Reflexion wiederverwendbar zu sein. |
| **Ehrliche Lückenmarkierung** | Nicht belegte oder nicht umgesetzte Teile werden als Lücke ausgewiesen statt mit erfundenem Inhalt gefüllt. |
| **Recall vor Precision** | Wo vollständige Automatik unmöglich ist, liefert das System mehrere plausible Vorschläge und lässt den Menschen bestätigen (siehe 5.4). |

### 2.1 Quellenhierarchie für Designfragen

Für UI/UX-Entscheidungen verbindlich (höchstgewichtet):

1. Apple - Human Interface Guidelines - <https://developer.apple.com/design/human-interface-guidelines>
2. Google / Think with Google - *Mobile App UX Principles* - <https://www.thinkwithgoogle.com/_qs/documents/2081/Mobile_App_UX_Principles_3.pdf>
3. Google - *Interactive Canvas Design* - <https://developers.google.com/assistant/interactivecanvas/design>

Als Basis (locker gewichtet): Google - *Actions SDK*.

### 2.2 Werkzeuge und Arbeitsmittel

- **Entwicklung:** React 19 + Vite (JavaScript/JSX) im Frontend, Cloudflare Workers (Backend).
- **Versionsverwaltung:** Git / GitHub (`nadermasry122/mendoor`).
- **Deployment:** Cloudflare Workers mit Git-Integration (Auto-Deploy bei Push).
- **Externe Dienste:** Google Cloud Vision, Internet Archive, Tavily, iFixit, Cloudflare Workers AI (ADR D6/D7).

---

## 3. Systemarchitektur

mendooR folgt dem Standardmuster für sichere Anbindung schlüsselpflichtiger Cloud-APIs: **kein API-Schlüssel im Client**. Ein Cloudflare Worker fungiert als vertrauenswürdiger Vermittler.

```
┌──────────────────────────────┐
│  Browser (mobiler Client)     │
│  React-App (src/)             │
│  Build: dist/                 │
└──────────────┬───────────────┘
               │  HTTPS  /api/*
               ▼
┌──────────────────────────────┐
│  Cloudflare Worker            │
│  functions/_worker.js         │
│  ┌─────────────────────────┐  │
│  │ Secrets Store:          │  │
│  │  GOOGLE_VISION_API_KEY  │  │
│  │  TAVILY_API_KEY         │  │
│  └─────────────────────────┘  │
└───┬──────────┬──────────┬──────────┬─────┘
    │          │          │          │
    ▼          ▼          ▼          ▼
 Google     Internet    Tavily    Workers AI
 Vision     Archive               (RAG-Synthese)

(+ iFixit: direkt aus dem Client für die Guide-Liste; serverseitig für RAG)
```

### 3.1 Warum ein serverseitiger Proxy?

1. **Sicherheit** - API-Schlüssel bleiben serverseitig; eine Exposition im Client wird ausgeschlossen.
2. **CORS** - Browsers blockieren cross-origin-Lesezugriffe ohne CORS-Header. Der Worker umgeht das kontrolliert (relevant für Internet Archive).
3. **Vorverarbeitung** - Antworten können serverseitig gefiltert/normalisiert werden (z. B. auf vertrauenswürdige Domains beschränkt).
4. **Erweiterbarkeit** - Weitere schlüsselpflichtige Dienste lassen sich nach demselben Muster ergänzen; die KI-Assistenz nutzt denselben Worker zusätzlich als RAG-Orchestrierung (D6/D7).

### 3.2 Endpunkte

| Endpunkt | Zweck | Status |
|---|---|---|
| `GET /api/ping` | Health-Check | ✅ |
| `POST /api/vision` | Proxy zu Google Cloud Vision (OCR), `?debug=1` für Rohantwort | ✅ |
| `GET /api/archive` | Suche nach gescannten Handbüchern (Internet Archive) | ✅ |
| `GET /api/websearch` | Fachartikel-Suche über Tavily, auf vertrauenswürdige Domains beschränkt (D8: offene Suche geplant) | ✅ |
| `POST /api/ai` | KI-Assistenz: serverseitiges RAG + Workers-AI-Synthese (ADR D6/D7); Body `{ "device": "…" }` | ✅ |
| `GET /api/ai?device=…&debug=1` | Diagnose: RAG-Retrieval + Prompt **ohne** AI-Aufruf (Browser-Test) | ✅ |
| ~~`/api/reddit`~~ | entfernt — Reddit blockiert Serverzugriffe (siehe 7.2) | ❌ |

### 3.3 KI-/Assistenzschicht: RAG + Workers AI (implementiert, Stufe 1+2)

ADR D6/D7 legen fest: **RAG-first, danach Cloudflare Workers AI**. Die Stufen 1 und 2 sind umgesetzt: Quellen werden serverseitig abgerufen und aufbereitet; erst danach synthetisiert Workers AI die Antwort. Tool-Calling (Stufe 3) ist noch nicht implementiert.

**Datenfluss:**

```
Browser (Gerätekontext)
   │ POST /api/ai
   ▼
Cloudflare Worker (functions/_worker.js)
   1. Gerätekontext normalisieren + bestSearchTerm
   2. paralleles Retrieval: iFixit, Internet Archive, Tavily
   3. Normalisierung/Filterung/Deduplizierung → max. 12 Quellen
   4. Quellen-Prompt mit [1], [2] … bauen (functions/rag.js)
   5. env.AI.run("@cf/openai/gpt-oss-20b", …) mit Quellenkontext
   6. Antwort + Quellenliste zurück an den Client
   └─ ohne Quellen: keine generative Antwort
   └─ bei AI-Fehler/Timeout: Quellenlisten bleiben nutzbar
```

**Bausteine:**

| Baustein | Aufgabe |
| --- | --- |
| `functions/sources.js` | iFixit-, Archiv- und Tavily-Abruf; Suchbegriffe, Filter, Textbegrenzung |
| `functions/rag.js` | Quellen normalisieren/begrenzen, Prompt bauen, Antwort extrahieren |
| `functions/_worker.js` | `/api/ai`, Timeout, Debug-Modus, Fehlerantworten |
| `src/lib/api.js` | `requestAiGuide()` für den Client |
| `src/components/result/AiPanel.jsx` | Optionaler KI-Eintrag in der Quellenliste des Ergebnis-Screens |
| `src/lib/savedAi.js` | Lokale Speicherung der KI-Ergebnisse (`localStorage`, max. 20) |
| `src/components/result/SavedAiDetailScreen.jsx` | Detailansicht eines gespeicherten KI-Ergebnisses |

**Modell:** `@cf/openai/gpt-oss-20b` (Apache-2.0), `max_tokens: 800`, `temperature: 0.2`, `reasoning.effort: low`. Das Modell antwortet ausschließlich auf Basis der übergebenen Quellen und soll Lücken ausdrücklich benennen. Der Button „Einschätzung erstellen“ im KI-Eintrag startet die Kette **manuell**; er löst das Retrieval aus, bei vorhandenen Quellen folgt der AI-Aufruf. Das kontrolliert Neurons-Kosten und Latenz. Nach Erfolg kann die Antwort lokal im Browser gespeichert werden (`localStorage`, max. 20 Einträge, ein Eintrag pro Gerät); eine Detailansicht und eine Startseiten-Liste machen sie wieder zugänglich.

**Umsetzungsstufen:**

1. **RAG-Retrieval + Quellenaufbereitung** (ohne LLM) — umgesetzt.
2. **Workers-AI-Synthese** aus dem Quellenkontext (ohne Tool-Calling) — umgesetzt.
3. **Tool-Calling/ReAct** (optional, erst nach der Evaluation) — offen.

> **Lokale Entwicklung:** `wrangler dev --local` kann das AI-Binding nicht ausführen („not supported“). Für einen echten AI-Aufruf `wrangler dev --remote` bzw. Deployment nutzen. `POST /api/ai?debug=1` oder `GET /api/ai?device=…&debug=1` testet die RAG-Kette ohne AI-Aufruf.

**Begründung und verworfene Alternativen:** siehe ADR D6/D7 in `ENTSCHEIDUNGEN.md`.

> **Dokumentationskette:** Recherche (`Wissenschaftliche-Vertiefung/02-Recherche`) → Vergleich/Entscheidung (`03-Analyse`, ADR D6/D7) → technische Referenz (§3.3) → Thesis 7.5 → Evaluation (`EVALUATION.md` §6).

---

## 4. Technologieentscheidung: OCR

### 4.1 Ausgangslage

Die erste Version nutzte **Tesseract.js** clientseitig. Problem: Auf realen Kamerabildern lieferte Tesseract zahlreiche Falsch-Erkennungen (z. B. wurden Bodenstrukturen als Text interpretiert). Tesseract sucht per Design *überall* nach Text und wurde für kontrollierte Dokumentenscans entwickelt [Q3].

### 4.2 Vergleich der drei geprüften Optionen

| Kriterium | HP Tesseract | Google ML Kit | Google Cloud Vision |
|---|---|---|---|
| Betrieb | lokal, im Browser | nativ (Android/iOS) | Cloud, per HTTPS |
| Qualität auf Kamerabildern | gering | hoch | hoch |
| Web-Tauglichkeit | ja | **nein** (nur nativ) | ja |
| Schlüsselverwaltung | keine | - | serverseitig nötig |
| Kosten | kostenlos | kostenlos | 1.000 Anfragen/Monat frei [Q4] |

**Empirische Belege für den Qualitätsunterschied:**
- Kfz-Zulassungsdokumente (Kamerabild): Cloud Vision **84,43 %** vs. Tesseract **47,02 %** [Q5].
- Assistive-Tech-Studie auf realen Kamerabildern: Cloud Vision **96,7 %** Zeichengenauigkeit vs. Tesseract **38,0 %**, signifikant (p < 0,001) [Q6].
- Benchmark mit > 18.000 Dokumenten: serverbasierte Systeme robuster bei verrauschten Eingaben [Q7].

### 4.3 Entscheidung

**Google Cloud Vision API über einen Cloudflare-Worker-Proxy**, mit `DOCUMENT_TEXT_DETECTION`.

Begründung:
- deutlich höhere Erkennungsqualität als Tesseract auf realen Kamerabildern,
- ML Kit wäre nur nativ verfügbar und würde die Web-Architektur brechen,
- Cloud Vision ist per HTTPS ansprechbar und passt in die bestehende Struktur,
- der Schlüssel bleibt serverseitig gekapselt.

### 4.4 Sprachkonfiguration (Korrektur einer Fehlentscheidung)

Ein früher Stand beschränkte die Erkennung über `languageHints` auf eine feste Sprachliste (`['en','de','zh']`). Das war **methodisch falsch**:

- Googles Dokumentation stellt fest, dass ein **leerer Wert** die besten Ergebnisse liefert, da er die automatische Spracherkennung aktiviert;
- `DOCUMENT_TEXT_DETECTION` erkennt das vollständige Sprachspektrum bereits automatisch;
- ein falscher/unvollständiger Hint kann die Erkennung aktiv **behindern** [Q8].

Die Korrektur ist für eine weltweit nutzbare App grundlegend: Eine feste Liste hätte die Anwendung strukturell auf die gelisteten Sprachen beschränkt. **Lösung: Hint vollständig entfernt.**

---

## 5. Kernkomponenten der Anwendung

### 5.1 Kameraerfassung

Kamerafunktionen werden **adaptiv per Capability Detection** eingeblendet (Prinzip *Progressive Enhancement*) - nicht statisch, da die MediaDevices-API je nach Browser/Gerät variiert.

| Funktion | Web-API | Verfügbarkeit |
|---|---|---|
| Kamerawechsel Front/Rück | `getUserMedia({facingMode})` | plattformübergreifend |
| Zoom | `applyConstraints({zoom})` | verbreitet |
| Taschenlampe (Torch) | `applyConstraints({torch})` | geräteabhängig, nur Rückkamera |
| Tap-to-Focus | `pointsOfInterest`, `focusMode` | eingeschränkt |
| Objektivwechsel | `enumerateDevices()` | stark geräteabhängig |

Nach dem Stream-Start werden die Fähigkeiten des aktiven `MediaStreamTrack` über `getCapabilities()` abgefragt; nur unterstützte Bedienelemente erscheinen. Der Scanner startet immer mit der **Rückkamera** (höhere Auflösung, für Nahaufnahmen geeigneter).

**Scan-Performance.** Die Auslöseverzögerung (2-3 s) wurde auf zwei Ursachen zurückgeführt: (1) drei Einzelbilder im 400-ms-Abstand → reduziert auf **zwei Bilder im 120-ms-Abstand**; (2) pixelweise Schärfeberechnung (Laplace-Varianz) → **Stichproben mit Schrittweite 2** (≈ 75 % weniger Rechenaufwand). Beides war Kompensation für Tesseract-Schwächen und nach dem Wechsel zu Cloud Vision nicht mehr nötig.

### 5.2 OCR-Pipeline (Ablauf)

```
Kameraauslöser
  → Dual-Frame-Capture (120 ms) + Auswahl des schärfsten Bildes (Laplace-Varianz)
  → Crop auf zentrales Quadrat (~72 % der kürzeren Seite)
  → Base64-JPEG (Qualität 0.85)
  → POST /api/vision  →  Cloud Vision (DOCUMENT_TEXT_DETECTION)
  → Rausch-Gate isRealText()
  → Typenschild-Filter filterToTypePlate()  [isProseLine + typePlateScore]
  → Kandidatenextraktion extractCandidates()  [3 strukturelle Regeln]
  → OCR-Bestätigungs-Sheet (Rohtext + antippbare Vorschläge + Freitextfeld)
  → Nutzer bestätigt Modell
  → Gerätebezogene Suche (iFixit / Archiv / Websuche / Community)
```

### 5.3 Typenschild-Klassifikator

**Problem:** Eine Filterung über Konfidenzwerte ist wirkungslos, da Cloud Vision auch korrekten Fließtext mit hoher Konfidenz erkennt. Der Text ist nicht falsch gelesen, sondern für den Anwendungsfall **irrelevant**. Die Unterscheidung muss daher strukturell erfolgen.

**Stufe 1 - Prosa-Erkennung (`isProseLine`):**
Ausschluss einer Zeile bei: Funktionswortanteil ≥ 28 %, > 9 Wörtern ohne nennenswerten Ziffernanteil, oder satzabschließender Interpunktion mit erhöhtem Funktionswortanteil. Funktionswortliste umfasst Deutsch + Englisch.
→ Für Schriften **ohne Leerzeichen-Worttrennung** (CJK, Thai) wird stattdessen eine zeichenlängenbasierte Heuristik verwendet (`hasNoSpaceScript`), da Wortzählung per Leerzeichen dort bedeutungslos ist.

**Stufe 2 - Typenschild-Bewertung (`typePlateScore`):**

| Indikator | Punkte |
|---|---|
| Kennzeichnungslabel (`Model:`, `Typ:`, `S/N`, `P/N`, `FCC ID`, `IMEI`) | 4 |
| Herstellername (Markenliste) | 3 |
| Technische Angabe (`230V`, `50Hz`, `2300W`) | 2 |
| Alphanumerisches Codemuster | 2 |
| Kurze Versalienzeile | 1 |
| Ziffernanteil > 15 % | 1 |
| ≤ 5 Wörter | 1 |

Nur Zeilen mit ≥ 2 Punkten gelangen (sortiert, max. 12 Zeilen) in die Ausgabe.

**Validierungsbeispiele:** Samsung-Verpackung → `SM-A115A1L`; Apple-Rückseite → `iPhone`, `A2890`; Typenschild + Anleitungstext → `Bosch Serie 6`, `WAT28401` (Prosa verworfen); reiner Beipackzettel → leere Ausgabe.

### 5.4 Kandidatenextraktion: von listenbasiert zu strukturbasiert

Dies ist der methodisch zentrale Beitrag der Arbeit.

**Ausgangsproblem.** Ursprünglich wurden zwei Mechanismen kombiniert: eine Liste bekannter Herstellermarken (`KNOWN_BRANDS`) und mehrere **formatspezifische reguläre Ausdrücke** (je einer für `SM-G991B`, `WAT28401`, `A2890`, `20XW0041` ...). Beim Test mit einem **Dell Latitude 7421** wurde das Modell trotz erfolgreicher Texterkennung nicht vorgeschlagen:
- "Latitude" fehlte in der Markenliste (dort stand nur "Dell"),
- kein Regex erfasste das Muster "Wort + Leerzeichen + Zahl".

**Strukturproblem (Gazetteer-Problem).** Listenbasierte Verfahren (Gazetteers) können eine **offene Menge** niemals vollständig abdecken. Da die Menge weltweit existierender Marken und Codeformate unbegrenzt ist, bleibt jede Liste strukturell lückenhaft; jede Ergänzung behebt nur den nächsten Einzelfall [Q9]. In der NER-Forschung ist dies als grundlegender Nachteil handgefertigter Regeln dokumentiert [Q9].

**Neues Design - drei strukturelle Regeln:**

1. **Label-Regel** - "Model:", "P/N:", "MTM:" gefolgt von einem alphanumerischen Token → stärkstes Signal, unabhängig von Marke/Format.
2. **Misch-Regel** - jedes Token, das Buchstaben *und* Ziffern kombiniert (Präfix, Suffix, Bindestrich, durchmischt), gilt als Gerätecode. Eine strukturelle Eigenschaft ersetzt alle formatspezifischen Regexe. Ausnahme: elektrische Kennwerte (`220-240V`, `50/60Hz`) werden über ein Ausschlussmuster entfernt.
3. **Wort+Zahl-Regel** - großgeschriebenes Wort (ggf. + zweites) direkt vor einer Zahl → Produktlinienbezeichnung (z. B. "Latitude 7421", "Pavilion 15").

Die Markenliste blieb erhalten, wurde aber von einer **Voraussetzung** zu einem reinen **Bonus-Signal** degradiert.

**Validierung** (inkl. synthetisch konstruierter, nie beobachteter Fälle):

| Testfall | Vorher | Nachher |
|---|---|---|
| "Latitude 7421" (ungelistete Produktlinie) | kein Kandidat | "Latitude 7421" |
| "SM-A115A1L" (bekanntes Format) | erkannt | erkannt (keine Regression) |
| Fiktive Marke, Code `7B4XK21Q` | kein Kandidat | `7B4XK21Q` |
| "220-240V ~ 50Hz" (Kennwerte) | - | korrekt ausgeschlossen |
| Reiner Fließtext | leere Liste | leere Liste |

**Entwurfsprinzip: Recall vor Precision.** Das System muss den korrekten Kandidaten nicht mit maximaler Sicherheit *rank-en*, sondern ihn zuverlässig **in eine überschaubare Vorschlagsmenge aufnehmen**. Die Bestätigung übernimmt der Mensch über das OCR-Sheet. Begründung: Exakte Ein-Kandidaten-Bestimmung aus beliebigem Text/Sprache ist unrealistisch; zuverlässige Vorschlagsmengen mit Nutzerbestätigung sind erreichbar [Q10].

**Bekannte Grenzen:** Mustererkennung auf beliebigem Text bleibt prinzipiell unvollständig lösbar. Regel 3 setzt lateinische Großschreibung voraus (auf CJK nicht direkt anwendbar); Modellcodes sind jedoch international nahezu immer lateinisch-alphanumerisch, sodass die weiterverarbeitungsrelevante Information erfassbar bleibt.

### 5.5 Suchbegriffsbildung und Suchkaskade

- **`bestSearchTerm`** - entfernt interne Herstellercodes (≥ 6 Zeichen, Buchstaben+Ziffern, z. B. `WAT28401`) aus dem Suchbegriff, behält aber kurze IDs und Zahlen (`A11`, `14`, `2019`). So wird "Samsung Galaxy A11" zu "Samsung Galaxy A11", aber "Bosch Serie 6 WAT28401" zu "Bosch Serie 6". **D8-Ergänzung (vorgeschlagen, noch nicht umgesetzt):** Bleibt nur ein Token übrig, wird der Code behalten (z. B. `Sony WH-1000XM4` statt `Sony`).
- **Suchkaskade** (für iFixit und Community) - von spezifisch zu breit: (1) voller String → (2) erste zwei Tokens → (3) erstes Token → (4) Modellcode-Token. Erster Schritt mit Treffern gewinnt.
- Grund für die Kaskade: Vollständige Modellnummern treten in informellen Forenbeiträgen selten wörtlich auf und schränken die Trefferzahl unnötig ein.

### 5.6 Geräteherkunft und dynamische Quellenlage

- **Herkunft:** Der AppContext führt zusätzlich zur Gerätebezeichnung die Quelle (`ocr`, `manual`, `demo`). Produktkarte und „Zuletzt verwendet“ zeigen dadurch „Erkannt via OCR-Scan“, „Manuell eingegeben“ oder „Beispielgerät“ statt einer pauschalen OCR-Angabe. Beim Öffnen eines Eintrags aus „Zuletzt verwendet“ wird das Gerät samt Quelle wieder geladen.
- **Kategorie:** `src/lib/device.js` liefert eine kleine UI-Heuristik für Label und Icon (Smartphone, Laptop, Kamera, Haushaltsgerät, Lampe, Bildschirm); bei unbekannten Geräten steht neutral „Gerät“. Das ist keine fachliche Klassifikation.
- **Quellenlage:** Die früheren statischen Kacheln („Reparierbar“, „Metalle“, „Gold“) hatten keine per-Gerät-Datenbasis. `ScoreRow` zeigt jetzt eine kompakte Zeile aus den tatsächlich geladenen iFixit-Treffern: Anzahl der Anleitungen, niedrigstes Schwierigkeitsniveau und Quelle. Material-/Edelmetallwerte bleiben als eigenständige Datenaufgabe offen.

---

## 6. Informationsarchitektur und UI-Konzept

### 6.1 Screens

| Screen | Funktion |
|---|---|
| **Start** | Kamera-Scanner (im Vordergrund), Kategorien, "Zuletzt verwendet", gespeicherte KI-Einschätzungen, Inspiration |
| **Scanner** | Live-Kamera, Scan-Rahmen, Capability-gesteuerte Bedienelemente, OCR-Sheet |
| **Ergebnis** | Gerätekarte mit Herkunft/Quellenlage, Menü mit Reparatur/Community/Archiv/Websuche/KI/Entsorgung |
| **Guide-Liste / -Detail** | iFixit-Anleitungen mit DE-Bevorzugung und EN-Fallback |
| **Gespeicherte KI-Einschätzung** | Lokal gespeicherte Antwort mit Quellen und Löschfunktion |
| **Community** | (in Disclosure integriert) kuratierte Subreddit-Karten |

### 6.2 Designentscheidung: Quellen zusammenführen statt trennen

**Ursprünglich** standen "Repairguides" (iFixit) und "Community & Foren" (Reddit) als **getrennte Menüpunkte** nebeneinander. Begründung war der reale Qualitätsunterschied (kuratiert vs. erfahrungsbasiert).

**Revision:** Diese Begründung ist inhaltlich richtig, führt aber zur falschen Konsequenz. Der Qualitätsunterschied rechtfertigt eine **visuelle Differenzierung innerhalb eines Bereichs**, nicht eine Trennung auf Navigationsebene. Die ursprüngliche Struktur war **quellenzentriert** (nach Herkunft) statt **nutzerzentriert** (nach Absicht).

Belege:
- Nutzer orientieren sich an Aufgaben, nicht an Systemstrukturen [Q11]; aufgabenbasierte Strukturen sind stabiler und besser erlernbar [Q12].
- **Formatbasierte Navigation** auf oberer Ebene liefert zu wenig Kontext; auf *tieferen* Ebenen ist sie jedoch angemessen [Q13].
- Apples HIG unterscheiden **Tab Bar** (oberste, app-weite Navigation) vs. **Segmented Control** (Wechsel zwischen verwandten Ansichten im selben Kontext) [Q14].
- Material Design 3: Tabs gruppieren verwandte Inhalte auf **derselben Hierarchieebene** mit klarer Unterscheidbarkeit [Q15].
- Reduktion der Navigationstiefe: getrennte Menüs = 4 Interaktionsschritte für einen Quellenvergleich, zusammengeführt = 1.

**Umgesetzte Lösung:** Zusammenführung zu einem inhaltlichen Bereich "Reparatur & Community"; Quellen als Tabs/Segmented Control mit Trefferzahl. Dadurch erkennt der Nutzer vor dem Wechsel, ob die andere Quelle Treffer hat (vermeidet leere Tabs). Beide Quellen werden parallel geladen.

**Spätere Verfeinerung:** Die Ergebnismenü-Einträge für Community, Archiv und Websuche wurden in **Disclosure Controls** (Apple-HIG-Muster) überführt - einklappbare Panels innerhalb der Menüliste, statt separater Screens. So bleibt die Liste kompakt.

### 6.3 Gestaltung nach Guidelines

- **Dark Mode**, durchgängig responsive (`clamp()`-basierte Skalierung, keine festen Größen, kein horizontaler Overflow).
- **Kontrast:** sekundäre Texte von `#555555` auf `#8a8a8a` angehoben (Kontrast auf dunklem Grund), zentral über CSS-Custom-Property.
- **Kamera-Bedienung** in drei Ebenen (oben: Zurück/Blitz/Objektiv; Mitte: Zoom; unten: Galerie/Auslöser/Wechsel) - Konvention nativer Kamera-Apps.
- **Vignettierung entfernt** - verdeckte relevante Bildbereiche.
- **Start-Screen-Reihenfolge:** Scanner **über** den Kategorien, damit Kategorien nicht fälschlich als Scan-Filter missverstanden werden.
- **Farb- und Tokensystem:** genau **fünf feste UI-Farben** (Hintergrund, Fläche, Akzent, Primär-/Sekundärtext); alle weiteren Töne über `color-mix()` abgeleitet (ADR C7, `src/styles/tokens.css`). Umsetzung als komponentenbasiertes Design-Token-System [Q27].
- **Icons:** monochrome Vektor-Icons über die zentrale `Icon`-Fassade (`src/components/ui/Icon.jsx`), eingefärbt ausschließlich über `currentColor`. **Keine Emojis** - diese sind mehrfarbig und würden die 5-Farben-Regel brechen (ADR C8, Bibliothek Lucide [Q30]).
- **Kacheln:** "Inspiration" (Startseite) und "Community & Foren" (Ergebnis) nutzen denselben Baustein `TileCard` mit einheitlichem Innen-Padding und Icon-Feld.
- **Responsive Breakpoints:** ≤ 340 px kompakte Ansicht (sehr kleine Displays), ≥ 768 px Tablet (horizontale Reihen werden zu Rastern, Listen zweispaltig, Inhalte auf lesbare Breite zentriert), ≥ 1200 px Desktop (dreispaltige Guide-Liste).
- **Keine System-Attrappe:** Es gibt **keine** nachgeahmte Statusleiste (Uhrzeit/Akku). Zustände werden inhaltlich kommuniziert; Systemränder werden über `env(safe-area-inset-*)` berücksichtigt (ADR C9).

### 6.4 Bildmaterial auf der Startseite

Der Kopfbereich der Startseite zeigt ein Foto, das das Thema der Anwendung (Reparieren und Wiederverwenden von Elektrogeräten) unmittelbar vermittelt. Das Bild liegt mit Titel und Claim als Text-Overlay in einer Karte; die Abdunklung entsteht ausschließlich aus der Hintergrundfarbe der fünf UI-Farben, sodass die Textlesbarkeit unabhängig vom Bildinhalt gesichert bleibt.

- **Datei:** `public/hero.jpg` (wird von Vite unverändert nach `dist/` kopiert).
- **Quelle:** Pexels, Foto-ID 6755053 [Q29]. Pexels-Lizenz (kostenlose Nutzung, keine Namensnennung erforderlich). Fotografenname über die Pexels-Seite zum Abgabezeitpunkt verifizieren.

---

## 7. Externe Informationsquellen

Die Anwendung bündelt mehrere Quellen statt sich auf eine zu beschränken (iFixit deckt alte/wenig verbreitete Geräte unzureichend ab).

### 7.1 iFixit (✅ funktionsfähig)

Öffentliche API (`www.ifixit.com/api/2.0`). Guide-Suche mit Kaskade, Detailansicht mit DE-Bevorzugung (`?langid=de`) und Fallback auf die Quellsprache (`?useSourceLang=1`).

### 7.2 Reddit (❌ gescheitert - dokumentierter Kontrastfall)

**Fehlerbild:** `/api/reddit` liefert konsistent **HTTP 403**.

**Ursache (architekturbedingt, nicht durch Code behebbar):**
- Reddit verlangt für Zugriffe aus Rechenzentrums-IP-Bereichen ein gültiges OAuth-Token [Q16];
- Cloudflare Workers laufen in Rechenzentren → werden unabhängig von der Codekorrektheit abgewiesen;
- die Selbstregistrierung wurde unter der **Responsible Builder Policy** geschlossen; der Registrierungsversuch führte lediglich auf diese Richtlinie [Q17].
- **Wayback Machine ist kein Ausweg:** Reddit hat archive.org gezielt von der Indexierung der Beitragsseiten ausgeschlossen [Q18].
- Meta-Tag-Extraktion einzelner Beiträge wurde verworfen - sie setzt denselben blockierten Zugriffsweg voraus und widerspräche Reddits Nutzungsordnung.

**Umgesetzte Lösung (Link-out statt Einbettung):** Eine horizontal scrollbare Reihe **realer, kuratierter Subreddits** (`r/fixit`, `r/mobilerepair`, `r/electronics`, `r/techsupport`, `r/homelab`) mit redaktioneller Kurzbeschreibung. Jede Karte öffnet eine auf den Subreddit eingegrenzte Reddit-Suche zum erkannten Gerät. Es werden **keine** Inhalte, Zahlen oder Beiträge simuliert.

> **Offener Bug (letzter Stand):** Die Subreddit-Suche verwendet teils Suchbegriffe, die nicht zum Gerät passen bzw. der Subreddit-Kontext stimmt nicht immer. Der Fix war noch nicht umgesetzt (siehe Abschnitt 11).

### 7.3 Internet Archive (✅ implementiert)

Eigenständiger Anwendungsfall: Suche nach **gescannten Bedienungsanleitungen** für ältere/obsolete Geräte. Die Advanced Search API ist offen, dokumentiert und authentifizierungsfrei [Q19]; sie liefert kein CORS, daher Läuft der Zugriff über den Worker (Browser-Sicherheitsbeschränkung, keine Zugriffssperre seitens Archive.org).

Endpunkt `/api/archive?q=...` beschränkt auf `mediatype:texts` mit Titelsuche; liefert Identifier, Titel, Jahr, Vorschau.

> **Hinweis:** Die Verifikation mit echtem Netzwerkzugriff im Produktiv-Deployment sollte erneut bestätigt werden.

### 7.4 Tavily-Websuche (✅ implementiert)

**Warum Tavily:** Google Custom Search JSON API ist für Neukunden geschlossen (Abschaltung 2027-01-01); der Nachfolger Vertex AI Search berechnet ab der ersten Anfrage ohne Freikontingent; öffentliche SearXNG-Instanzen blockieren die JSON-API (403). Tavily war die einzige Option mit monatlich erneuerndem Freikontingent (1.000 Suchen/Monat) **ohne** Kreditkarte im Signup [Q20].

Serverseitig auf vertrauenswürdige deutsche Tech-/Reparatur-Domains beschränkt (`include_domains`: computerbase.de, chip.de, notebookcheck.net, heise.de, golem.de, pcwelt.de). Suchbegriff wird mit "Reparatur" angereichert; `search_depth: basic` (Kostengrund).

> **Geplante Ablösung (ADR D8):** Die Domain-Allowlist wird durch eine **offene Websuche mit Intent-/Trust-Ranking** ersetzt (Herstellerhandbücher als Primärquellen, Denylist statt Allowlist, optionale zweite Suche, Cache). Grund: Die Allowlist schließt offizielle Herstellerdokumentation systematisch aus (Nutzertest „latitude 7420“ → Dell-Handbuch). Die Umsetzung ist noch offen; bis dahin beschreibt der obige Absatz den Ist-Stand.

**Fallback:** Bei leerem Ergebnis/Fehler wird ein **site-restricted Google-Link** erzeugt (gleiches Link-out-Muster wie Reddit), sodass das Panel nie in einer Sackgasse endet.

---

## 8. Infrastruktur und Deployment

- **Hosting:** Cloudflare Workers, Projekt `mendoor1`, erreichbar unter `mendoor1.kimanhhang122.workers.dev`.
- **Worker-Entry:** `functions/_worker.js` (muss einen `export default` besitzen, sonst Fehler 10021).
- **Statische Assets:** `dist/` - das Build-Ergebnis von `npm run build` (Vite). Quelle des Frontends ist `src/` (Single Source of Truth); `dist/` ist generiert.
- **Build:** `npm install && npm run build` erzeugt `dist/`. Bei der Cloudflare-Git-Integration ist als **Build-Befehl** `npm run build` zu hinterlegen, da `dist/` nicht versioniert wird (`.gitignore`).
- **Secrets:** Cloudflare Secrets Store - `GOOGLE_VISION_API_KEY`, `TAVILY_API_KEY`.
- **`wrangler.jsonc`:**

```jsonc
{
  "name": "mendoor1",
  "main": "functions/_worker.js",
  "compatibility_date": "2026-07-09",
  "compatibility_flags": ["nodejs_compat"],
  "observability": { "enabled": true },
  "ai": { "binding": "AI" },
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "none"
  },
  "secrets_store_secrets": [ /* Google Vision, Tavily */ ]
}
```

> **Workers AI:** Das Binding `"ai": { "binding": "AI" }` ist aktiv; es benötigt keinen zusätzlichen Secret-Eintrag. Der Endpunkt `/api/ai` ist in `functions/_worker.js` implementiert. Lokal (`--local`) ist das AI-Binding nicht ausführbar; siehe §3.3.

> **Sicherheitshinweis:** Eine zuvor in der Projektablage vorhandene Datei `vision PAI.txt` mit einem Google-API-Schlüssel im Klartext wurde am 29.09.2026 **entfernt**. Der betroffene Schlüssel ist als **kompromittiert** zu behandeln und im Google-Cloud-Konsos zu **rotieren** (siehe `REGELN.md` §6). Schlüssel gehören ausschließlich in den Cloudflare Secrets Store und werden über Env-Bindings gelesen.

---

## 9. Fehlerchronik und Lösungen

### 9.1 Infrastruktur & Deployment

| # | Symptom | Ursache | Lösung |
|---|---|---|---|
| 1 | 404 auf GitHub-Pages-URL | privates Repository | Repo auf "public" gestellt |
| 2 | Seite ohne CSS/JS | Browser-Cache | Hard Reload (Strg+Shift+R) |
| 3 | "Variables cannot be added ... only static assets" | Projekt als static-only erkannt | `functions/_worker.js` mit `export default` angelegt |
| 4 | Build-Fehler **10021** "No event handlers" | `_worker.js` leer gespeichert | Datei mit vollständigem Inhalt neu hochgeladen |
| 5 | `.git/`-Inhalte als Assets hochgeladen | `"directory": "."` | auf `"./test"` geändert |
| 6 | Verwirrung, welches Projekt läuft | zwei parallele Projekte (`mendoor`, `mendoor1`) | altes Projekt gelöscht |
| 7 | "No URLs enabled" | `workers.dev`-Subdomain nicht aktiviert | in Settings manuell aktiviert |
| 8 | `/api/ping` liefert HTML statt JSON | `not_found_handling: "single-page-application"` fing alle Pfade ab | auf `"none"` geändert |
| 9 | Debug-Modus nicht auslösbar | App-Dateien doppelt (Root + `test/`) → veraltete Version ausgeliefert | Verzeichnisstruktur vereinheitlicht |

### 9.2 OCR & Verarbeitung

| # | Symptom | Ursache | Lösung | Erkenntnis |
|---|---|---|---|---|
| 10 | Irrelevanter Text wird als Gerät erkannt | Filterung nach Konfidenz wirkungslos | struktureller Klassifikator (5.3) | Erkennungsqualität ≠ Verwertbarkeit |
| 11 | Zeilenklassifikator scheitert in-App, isoliert korrekt | `filterWords()` zerstörte Zeilenumbrüche | Umstellung auf `fullTextAnnotation.text` | verlustbehaftete Normalisierung früh kann nachgelagerte Analyse unmöglich machen |
| 12 | Auslöseverzögerung 2-3 s | Mehrfachaufnahme + pixelweise Schärfeanalyse | 2 Bilder/120 ms + Stichproben | Kompensationsmaßnahmen nach Engine-Wechsel überprüfen |
| 13 | "Latitude 7421" erkannt, aber nicht klickbar | Markenliste + formatspezifische Regexe | 3 strukturelle Regeln (5.4) | Gazetteer-Problem: Listen sind strukturell unvollständig |
| 14 | Kennwerte (`220-240V`) als Kandidaten | breite Misch-Regel | Ausschlussmuster für Einheiten | breitere Regeln brauchen gezielte Ausnahmen |
| 15 | CJK-Fließtext rutscht durch Prosa-Filter | Wortzählung per Leerzeichen | `hasNoSpaceScript`-Heuristik | für Schriften ohne Worttrennung anderes Maß nötig |
| 16 | Sprache außerhalb der Hint-Liste schlechter erkannt | hardcodierter `languageHints` | Hint entfernt (4.4) | falscher Hint ist kontraproduktiv |

### 9.3 Entwicklung & Datenquellen

| # | Symptom | Lösung |
|---|---|---|
| 17 | Dateiübertragung zwischen Umgebungen scheitert | Weiterentwicklung auf verifiziertem Stand; Prüfung auf zentrale Codebestandteile |
| 18 | Reddit 403 | Link-out-Lösung (7.2) |
| 19 | Doppelte "Community & Foren"-Einträge | konsolidiert in Disclosure-Panel |
| 20 | Subreddit-/Archiv-Suche ignoriert Zahlen ("iPhone 14") | `bestSearchTerm` + Kaskade (5.5) |
| 21 | `/api/ai` lokal: „Binding AI needs to be run remotely“ | AI-Binding ist lokal nicht ausführbar; `?debug=1` testet Retrieval/Prompt, echter AI-Aufruf über `wrangler dev --remote` oder Deployment |
| 22 | Browser-Aufruf von `/api/ai` meldet „Method not allowed“ | GET ist kein AI-Aufruf; AI braucht POST mit JSON | Für AI `POST` mit `{ "device": "…" }`; für einen Browser-Test `GET /api/ai?device=…&debug=1`; bare GET liefert jetzt eine Nutzungshilfe (400) |

---

## 10. Evaluation und Messgrößen

Aus der Dokumentation ergeben sich mehrere Qualitätsdimensionen - die **mehrdimensionale Messgröße** ist der methodische Ertrag für die Evaluation:

1. **Zeichenerkennungsrate** der OCR-Engine (Qualität der Texterkennung).
2. **Rate korrekt extrahierter Modellbezeichnungen** (Verwertbarkeit der Ausgabe).
3. **KI-Assistenz:** Quellenabdeckung, Fakten-Treue, deutsche Sprachqualität, Latenz und Neurons/Anfrage. Messaufbau in `EVALUATION.md`; Ergebnisse stehen noch aus (`[OFFEN]`).

**Empfohlener Testdatensatz:** Typenschilder aller sechs Elektroaltgeräte-Kategorien, jeweils unter variierenden Bedingungen (Beleuchtung, Winkel, Distanz, Oberfläche). Der Aufbau sollte **parallel** zur Entwicklung erfolgen: Jedes ohnehin gescannte Typenschild wird fotografiert und mit dem tatsächlichen Modell annotiert.

**Weitere zu erhebende Größen:** Trefferquote der Anleitungssuche; Nutzerbefragung zum FDR-Potenzial.

> Dieses Kapitel ist im ursprünglichen Entwurf als **Lücke** markiert - es liegt noch keine durchgeführte Evaluation vor.

---

## 11. Offene Punkte und Roadmap

### 11.1 Ausstehend aus dem letzten Stand

- **Subreddit-Suche verfeinern** - Suchbegriff/Subreddit-Kontext passt nicht immer zum Gerät (höchste Priorität, laut letztem Entwicklungsstand).
- **YouTube- und Google-Suchanbindung** beginnen (weitere Antwortquellen).
- **Recyclinghöfe in der Nähe** anzeigen.
- **Verifikation** von `/api/archive` und `/api/websearch` mit echtem Netzwerkzugriff.
- **KI-Assistenz testen:** echten Workers-AI-Aufruf im Deployment prüfen (`AI`-Binding, Tavily-Key); deutsche Qualität und Quellenabdeckung nach `EVALUATION.md` §6 messen.

### 11.2 Konzeptphase / teilweise umgesetzt

- **Kategorien-Funktion:** Verworfen wurde „Kategorie als Suchfilter“ (widerspricht der Start-Screen-Reihenfolge). Diskutiert: (1) DIY-Projekte pro Kategorie, (3) gescannte Geräte nach Kategorie filtern, oder eine Kombination mit **anonym geteilter Scan-Historie aller Nutzer**. Letzteres ist technisch überschaubar (Cloudflare KV/D1, kein Konto nötig), wirft aber ein **DSGVO-Thema** auf (Hinweis-Screen beim ersten Scan nötig). Nutzerkonten mit selbst geschriebenen Projekten gelten als großer, eigenständiger Aufwandsblock → zurückstellen.
- **KI-Assistenz (ADR D6/D7):** Stufe 1 (RAG-Retrieval + Quellenaufbereitung) und Stufe 2 (Workers-AI-Synthese über `/api/ai`) sind umgesetzt; KI-Ergebnisse lassen sich lokal speichern. Offen: Stufe 3 Tool-Calling; Evaluation (deutsche Qualität, Quellenabdeckung, Latenz, Neurons/Anfrage); Caching/Streaming.

### 11.3 Platzhalter im Ergebnis-Screen

| Menüpunkt | Geplanter Inhalt |
|---|---|
| Einzelheiten | Technische Daten - günstigste Variante: Rohdaten des Scans mit Erläuterung (didaktischer Wert) |
| Zusammensetzung | Materialanteile; eine per-Gerät-Datenbasis fehlt, daher derzeit keine Zahlen (der Global E-Waste Monitor liefert nur Aggregate [Q1]) |
| Gerät kaputt? | Entsorgungswege + Weiterverwendungsideen, statisch nach den sechs Kategorien |

### 11.4 Methodische Lücken der Arbeit

- **Kapitel 3 (Nutzeranforderungen):** Es fand keine eigene Erhebung (Befragung/Interviews) statt; Anforderungen ließen sich nur retrospektiv aus dem Gebauten ableiten. Als methodische Lücke kenntlich zu machen.
- **Kapitel 7 (Evaluation):** siehe Abschnitt 10.

---

## 12. Quellenverzeichnis

Die vollständigen Literaturangaben werden zentral in `QUELLEN.md` geführt (stabile Schlüssel `[Qn]`). Alle `[Qn]`-Verweise in diesem Dokument lösen sich dort auf. Es wird hier bewusst **keine zweite Quellenliste** gepflegt, um Redundanz und Divergenz zu vermeiden.

---

## 13. Anhang: Dateien und Endpunkte

### 13.1 Verzeichnisstruktur

```
mendoor/
├── functions/
│   ├── _worker.js          # Backend: /api/ping, /api/vision, /api/archive, /api/websearch, /api/ai
│   ├── sources.js          # RAG-Retrieval: iFixit, Archiv, Tavily
│   └── rag.js              # RAG-Kontext, Quellen-Prompt, Antwort-Extraktion
├── src/                    # React-Frontend (Single Source of Truth)
│   ├── components/
│   │   ├── ui/             # UI-Kit: Icon, BottomNav, Disclosure, Sheet, StateBox ...
│   │   ├── home/           # HomeScreen + Bausteine
│   │   ├── scanner/        # ScannerScreen, OcrSheet, DebugPanel
│   │   ├── result/         # ResultScreen, AiPanel, SavedAiDetailScreen + Quellen-Panels
│   │   └── guides/         # GuidesScreen, GuideCard, GuideDetailScreen
│   ├── hooks/              # useCamera, useAsyncData
│   ├── lib/                # classify, search, capture, api, device, savedAi (reine Logik/Datenzugriff)
│   ├── context/            # AppContext (Navigation, Gerät, Toast)
│   ├── constants/          # statische UI-Inhalte
│   ├── styles/             # tokens.css, base.css, components.css, screens.css
│   ├── App.jsx
│   └── main.jsx
├── index.html              # Vite-Einstieg
├── vite.config.js
├── package.json
├── legacy_mendoor.md       # Archiv des Vor-React-Frontends (ADR A6)
├── dist/                   # Build-Ergebnis (generierte, ausgelieferte Assets)
└── wrangler.jsonc
```

> **Single Source of Truth:** Nach der Migration (ADR A6) ist `src/` die einzige Quelle des Frontends; `dist/` ist das generierte Build-Ergebnis. Die früheren Frontend-Dateien (Wurzelkopien `app.js`/`styles.css` sowie `test/`) wurden am 01.10.2026 entfernt und vollständig in `legacy_mendoor.md` archiviert - damit ist die in Fehler #9 beschriebene Fehlerklasse (doppelte Ablagen) endgültig ausgeschlossen.

### 13.2 Zentrale Module unter `src/`

| Modul | Aufgabe |
|---|---|
| `hooks/useCamera.js` | Medienstream, Capability Detection, Zoom/Torch/Objektiv/Fokus |
| `lib/capture.js` | Zwei-Frame-Capture + Laplace-Varianz |
| `lib/classify.js` | `isRealText`, Prosa-Filter, strukturbasierte Extraktion |
| `lib/search.js` | `bestSearchTerm`, Suchkaskade, Schwierigkeits-Mapping |
| `lib/api.js` | Vision-/Archive-/Websearch-Proxy, iFixit, Link-out-URLs, `requestAiGuide()` |
| `components/result/AiPanel.jsx` | Optionaler KI-Eintrag: Start, Lade-/Fehlerzustand, Antwort + Quellen, lokales Speichern |
| `components/result/SavedAiDetailScreen.jsx` | Detailansicht eines lokal gespeicherten KI-Ergebnisses |
| `lib/savedAi.js` | Lokale Speicherung der KI-Ergebnisse (`localStorage`) |
| `lib/device.js` | UI-Heuristik für Gerätekategorie und Herkunftslabel |
| `hooks/useAsyncData.js` | Lade-Zustand mit Lazy-Loading |
| `context/AppContext.jsx` | Navigation, aktuelles Gerät, Toasts |
| `components/ui/*` | wiederverwendbares UI-Kit |

---

*Ende der Dokumentation. Diese Fassung führt die im Projektverlauf entstandenen Einzeldokumente zusammen. Nicht belegte oder nicht umgesetzte Teile sind als Lücke/offen gekennzeichnet.*
