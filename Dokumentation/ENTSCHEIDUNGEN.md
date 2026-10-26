# Entscheidungsregister — mendooR

> **Zweck:** Thematisch gegliederte Sammlung aller großen Entscheidungen mit Begründung, verworfenen Alternativen und Zuordnung zum Kapitel der Bachelorarbeit.
> **Regeln:** Siehe `REGELN.md`, Abschnitt 3 (ADR-Schema). Ist-Stand des Systems: `DOKUMENTATION.md`. Chronologie: `PROTOKOLLE.md`.
> **Quellen:** `[Qn]` verweisen auf das zentrale Quellenregister `QUELLEN.md` (stabile Schlüssel).
> **Stand:** 20.10.2026 · **Anzahl Einträge:** 30

### Statusübersicht

| Kürzel | Entscheidung | Status | Kap. |
|---|---|---|---|
| A1 | Web-App statt native Android-App | aktiv (Framework-Detail abgelöst durch A6) | 1.3, 4.1 |
| A2 | Google Cloud Vision statt Tesseract / ML Kit | aktiv | 5.1 |
| A3 | Serverseitiger Proxy (Cloudflare Worker) | aktiv | 4.1 |
| A4 | Cloudflare Workers statt GitHub Pages | aktiv | 4.1, 8 |
| A5 | Sprach-Hints entfernt (Auto-Erkennung) | aktiv | 5.1 |
| A6 | Frontend-Migration auf React + Vite | aktiv | 5.1 |
| B1 | Zwei-Frame-Capture + Laplace-Varianz | aktiv | 5.3 |
| B2 | Typenschild-Klassifikator | aktiv | 5.2 |
| B3 | Strukturbasierte statt listenbasierte Extraktion | aktiv | 5.4 |
| B4 | CJK-/Schriftfähigkeit des Klassifikators | aktiv | 5.5 |
| B5 | Recall vor Precision + Nutzerbestätigung | aktiv | 5.6 |
| C1 | Capability Detection für Kamera | aktiv | 4.2 |
| C2 | Quellen zusammenführen statt trennen | aktiv | 4.3 |
| C3 | Disclosure Controls statt eigener Screens | aktiv | 4.3 |
| C4 | Scanner über Kategorien | aktiv | 4.4 |
| C5 | Dark Mode, Responsivität, Kontrast, Vignette | aktiv | 4.4 |
| C6 | Funktion der Kategorien | **offen** | 4.5 |
| C7 | Festes 5-Farben-Tokensystem | aktiv | 5.2 |
| C8 | Monochromes Icon-System statt Emojis | aktiv | 5.2 |
| C9 | Keine System-Statusleiste, fluide Web-Oberfläche | aktiv | 5.2 |
| D1 | iFixit als Primärquelle + Suchkaskade | aktiv | 6.1 |
| D2 | Reddit: Link-out statt API | aktiv | 6.2 |
| D3 | Internet-Archive-Anbindung | aktiv | 6.3 |
| D4 | Tavily statt Google CSE / SearXNG | aktiv | 6.4 |
| D5 | Suchbegriffsbildung (`bestSearchTerm`) | aktiv | 6.5 |
| D6 | KI-Assistenz: RAG-first, dann Cloudflare Workers AI | aktiv (Stufe 1+2 umgesetzt; Tool-Calling offen) | 7.5, 9.3 |
| D7 | RAG-Orchestrierung und KI-Eintrag (Umsetzung D6) | aktiv (umgesetzt; Evaluation offen) | 7.5 |
| E1 | Iteratives, sitzungsbasiertes Vorgehen | aktiv | 3.x (neu) |
| E2 | Quellenhierarchie für Designfragen | aktiv | 4.x (neu) |
| E3 | Fehlerdokumentation nach festem Schema | aktiv | 7 |

---

# A — Grundarchitektur und Technologie

### A1 — Web-Anwendung statt nativer Android-App
- **Status:** aktiv
- **Datum:** 2026-06-24
- **Thesis-Kapitel:** 1.3, 4.1
- **Kontext:** Zu Beginn war im freigegebenen Konzepttext eine „Implementierung im Android-Ökosystem" genannt. Es musste entschieden werden, auf welcher Plattform die Anwendung entsteht.
- **Optionen:** (1) native Android-App (Kotlin/Java), (2) native iOS-App, (3) plattformübergreifend nativ (z. B. Flutter/React Native), (4) browserbasierte Web-Anwendung.
- **Entscheidung:** Browserbasierte mobile Web-Anwendung (HTML/CSS/JS, kein Framework).
- **Begründung:** Geräteunabhängigkeit (ein Codestand für alle Endgeräte), sofortige Verteilbarkeit ohne App-Store-Freigabe, direkte Anbindung serverbasierter OCR-Dienste per HTTPS, und die Möglichkeit, die Kamera über die MediaDevices-API zu nutzen.
- **Verworfene Alternativen:** Native Entwicklung hätte Zugriff auf plattformspezifische Kamerafunktionen geboten, aber zwei getrennte Codebasen (Android/iOS) und Store-Prozesse erfordert — unverhältnismäßig für den Umfang einer Bachelorarbeit. Zudem wäre eine plattformgebundene Lösung dem Anspruch der Geräteunabhängigkeit zuwidergelaufen.
- **Konsequenzen / Grenzen:** Bestimmte native Kamerafunktionen (gezielter Objektivwechsel) sind im Browser nicht zuverlässig verfügbar (siehe C1). Der Widerspruch zum früheren Konzepttext ist in der Arbeit transparent auszuweisen (siehe `BACHELORARBEIT.md` 1.3).

### A2 — Google Cloud Vision statt Tesseract / ML Kit
- **Status:** aktiv
- **Datum:** 2026-07-06
- **Thesis-Kapitel:** 5.1
- **Kontext:** Die erste Version nutzte Tesseract.js clientseitig. Auf realen Kamerabildern entstanden viele Falscherkennungen (Bodenstrukturen als „Text"). Es war eine robuste OCR-Engine zu wählen.
- **Optionen:** (1) Tesseract (lokal), (2) Google ML Kit (nativ), (3) Google Cloud Vision (Cloud).
- **Entscheidung:** Google Cloud Vision (`DOCUMENT_TEXT_DETECTION`) über einen serverseitigen Proxy.
- **Begründung:** Empirisch deutlich überlegene Genauigkeit auf Kamerabildern — 84,43 % vs. 47,02 % bei Kfz-Dokumenten [Q5], 96,7 % vs. 38,0 % Zeichengenauigkeit unter mobilen Bedingungen [Q6], bestätigt durch ein Benchmark mit > 18.000 Dokumenten [Q7]. ML Kit ist qualitativ gleichwertig, aber ausschließlich nativ verfügbar und hätte die Web-Architektur (A1) gebrochen. Cloud Vision ist per HTTPS ansprechbar; der Schlüssel bleibt serverseitig. Freikontingent 1.000 Anfragen/Monat [Q4] ist für den Demo-Betrieb ausreichend.
- **Verworfene Alternativen:** Tesseract — für kontrollierte Dokumentenscans entwickelt, nicht für rauschige Kamerabilder [Q3]. ML Kit — Architekturbruch. Eine reine Konfidenzfilterung der Tesseract-Ausgabe war wirkungslos.
- **Konsequenzen / Grenzen:** Abhängigkeit von einem externen Cloud-Dienst und dessen Verfügbarkeit/Kontingent. Reale Bilder verlassen das Endgerät (Datenschutz zu bedenken, siehe E-Bereich/Datenschutz).

### A3 — Serverseitiger Proxy (Cloudflare Worker) für API-Schlüssel
- **Status:** aktiv
- **Datum:** 2026-07-09
- **Thesis-Kapitel:** 4.1
- **Kontext:** Der Cloud-Vision-Schlüssel darf niemals im Client erscheinen. Zusätzlich blockieren Browser Cross-Origin-Zugriffe ohne CORS-Header.
- **Optionen:** (1) Schlüssel im Frontend, (2) eigener Server, (3) Serverless-Proxy (Cloudflare Worker).
- **Entscheidung:** Cloudflare Worker als Proxy; Schlüssel im Secrets Store.
- **Begründung:** Schlüssel bleibt serverseitig (Sicherheit) [Q22], CORS wird kontrolliert umgangen, Antworten können vorverarbeitet/gefiltert werden, und das Muster lässt sich für weitere Dienste wiederverwenden. Serverless entfällt der Betriebsaufwand.
- **Verworfene Alternativen:** Schlüssel im Client — sofort verworfen (Sicherheitsrisiko). Eigener Server — überdimensioniert.
- **Konsequenzen / Grenzen:** Alle schlüsselpflichtigen Dienste laufen über den Worker → dieser wird zur zentralen, zu wartenden Komponente.

### A4 — Cloudflare Workers statt GitHub Pages
- **Status:** aktiv
- **Datum:** 2026-07-09
- **Thesis-Kapitel:** 4.1, 8
- **Kontext:** Die App startete auf GitHub Pages (nur statisches Hosting, keine serverseitigen Endpunkte, keine Secrets).
- **Optionen:** (1) GitHub Pages (statisch), (2) Cloudflare Workers/Pages (statisch + Serverless-Funktionen).
- **Entscheidung:** Cloudflare Workers mit Git-Integration (Auto-Deploy) und Secrets Store.
- **Begründung:** Nur mit serverseitigen Funktionen sind Proxy (A3) und sichere Schlüsselverwaltung möglich. Git-Integration liefert automatisches Deployment.
- **Verworfene Alternativen:** GitHub Pages blieb als reines Statik-Hosting ungeeignet (keine Backend-Logik).
- **Konsequenzen / Grenzen:** Deployment-Konfiguration wird komplex (siehe Fehlerchronik 9.1) — z. B. `not_found_handling`, Assets-Verzeichnis, Worker-Entry. Die vielen Fehler beim Umstieg sind in `PROTOKOLLE.md` (09.07.) dokumentiert.

### A5 — Sprach-Hints entfernt (automatische Spracherkennung)
- **Status:** aktiv (löst frühere Fehlentscheidung ab)
- **Datum:** 2026-07-30
- **Thesis-Kapitel:** 5.1
- **Kontext:** Ein früher Stand beschränkte die Erkennung über `languageHints` auf `['en','de','zh']`. Ein chinesisch beschriftetes Dell-Typenschild wurde dadurch problematisch.
- **Optionen:** (1) Hint auf feste Sprachen, (2) Hint erweitern, (3) Hint entfernen.
- **Entscheidung:** Hint **vollständig entfernen** — Google automatisch erkennen lassen.
- **Begründung:** Die offizielle Dokumentation stellt fest, dass ein **leerer** Wert die besten Ergebnisse liefert, da er die automatische Spracherkennung aktiviert; `DOCUMENT_TEXT_DETECTION` erkennt das vollständige Sprachspektrum selbst; ein falscher/unvollständiger Hint kann die Erkennung aktiv **behindern** [Q8]. Für eine weltweit nutzbare App ist das die einzig konsistente Lösung.
- **Verworfene Alternativen:** „Mehr Sprachen hinzufügen" — bleibt prinzipiell unvollständig und verschärft das Problem; der Hint war nicht nur lückenhaft, sondern kontraproduktiv.
- **Konsequenzen / Grenzen:** Keine Sprachsteuerung mehr möglich; ein späterer manueller **Sprach-Switcher** bleibt als optionale Erweiterung denkbar (zurückgestellt).

### A6 — Frontend-Migration auf React + Vite
- **Status:** aktiv (löst das „kein Framework“-Detail von A1 ab)
- **Datum:** 2026-10-01
- **Thesis-Kapitel:** 5.1
- **Kontext:** Der MVP war als imperative Einzeldatei-Sammlung gewachsen: alle Screens, sämtliche Zustände und DOM-Manipulationen lagen in `index.html` bzw. `app.js`, die Styles in `styles.css`. Eine Wiederverwendung von UI-Elementen oder Funktionen war praktisch nicht möglich — jeder neue Screen duplizierte Markup und Logik. Zusätzlich existierten die Dateien doppelt (Root und `test/`), was bereits einmal zum Ausliefern eines veralteten Stands geführt hatte (Fehlerchronik 9.1, Nr. 9).
- **Optionen:** (1) Vanilla-JS beibehalten und lediglich in ES-Module aufteilen, (2) komponentenbasiertes Framework (React/Vue/Svelte), (3) Web Components.
- **Entscheidung:** Migration auf **React 19** mit **Vite** als Build-Tool; Aufteilung in Screens, wiederverwendbares UI-Kit, Hooks (Kamera, Datenladen, Uhr), frameworkunabhängige `lib/`-Module und einen zentralen App-Zustand.
- **Begründung:** Komponenten, Props und Hooks erzwingen Wiederverwendung und trennen Darstellung von Logik [Q25]. Der deklarative Zustandsbegriff verhindert die Fehlerklasse, bei der Oberfläche und interner Zustand auseinanderlaufen — genau die Klasse, die beim manuellen `innerHTML`-Aufbau entstand. Vite liefert einen schnellen Entwicklungsserver (Hot Module Replacement) sowie einen optimierten Produktions-Build [Q26]. Die OCR-Pipeline wurde **unverändert** portiert (Klassifikator, Suchkaskade), um das bestehende Verhalten zu erhalten und die Entscheidungen B1–B5 nicht zu berühren.
- **Verworfene Alternativen:** (1) Vanilla + ES-Module — verbessert die Dateistruktur, erzwingt aber weder Wiederverwendung noch Zustandskonsistenz, da jede Ansicht weiterhin manuell synchron gehalten werden muss. (3) Web Components — geringere Verbreitung, schwächere Ökosystem-/Tooling-Unterstützung und für diesen Umfang kein Mehrwert gegenüber React.
- **Konsequenzen / Grenzen:** Neue Build-Stufe (`dist/`) — das Asset-Verzeichnis in `wrangler.jsonc` wurde von `./test` auf `./dist` umgestellt; die App ist damit kein reines „No-Build“-Projekt mehr. Die bisherigen Legacy-Dateien (Root-Kopien, `test/`) wurden entfernt und vollständig in `legacy_mendoor.md` archiviert. Die Kernfunktionen bleiben verhaltensgleich; dies wurde durch Stichproben der portierten Logikmodule abgesichert.

# B — Erkennungs- und Klassifikationspipeline

### B1 — Zwei-Frame-Capture mit Laplace-Varianz
- **Status:** aktiv
- **Datum:** 2026-07-20
- **Thesis-Kapitel:** 5.3
- **Kontext:** Zwischen Auslöser und Erkennung vergingen 2–3 Sekunden.
- **Optionen:** (1) Mehrfachaufnahme beibehalten, (2) Anzahl reduzieren, (3) Schärfeberechnung beschleunigen, (4) beides.
- **Entscheidung:** Von **drei Bildern / 400 ms** auf **zwei Bilder / 120 ms**; Schärfeauswahl per Laplace-Varianz mit **Stichproben (Schrittweite 2)**.
- **Begründung:** Die Mehrfachaufnahme war eine Kompensation für Tesseract-Schwächen und nach dem Wechsel zu Cloud Vision (A2) unnötig — Cloud Vision ist robuster gegenüber suboptimalen Aufnahmen. Bildschärfe ist eine großflächige Eigenschaft; Stichproben senken den Rechenaufwand um ~75 %, ohne die Zuverlässigkeit messbar zu verschlechtern.
- **Verworfene Alternativen:** Beibehaltung der Tesseract-Strategie — unnötige Latenz.
- **Konsequenzen / Grenzen:** Erkenntnis: Optimierungen, die an eine bestimmte Komponente gebunden waren, müssen nach deren Austausch überprüft werden.

### B2 — Typenschild-Klassifikator (Prosa-Abwehr)
- **Status:** aktiv
- **Datum:** 2026-07-22
- **Thesis-Kapitel:** 5.2
- **Kontext:** Cloud Vision erkennt **allen** Text — auch Verpackungsprosa, Sicherheitshinweise, Marketing. Eine Filterung über Konfidenz ist wirkungslos, weil korrekter Fließtext ebenfalls hohe Konfidenz erreicht.
- **Optionen:** (1) Konfidenzfilter, (2) semantisch-strukturelle Klassifikation.
- **Entscheidung:** Zweistufiger struktureller Klassifikator: `isProseLine()` (Ausschluss von Prosa) + `typePlateScore()` (Punktwert für Typenschild-Indikatoren; nur Zeilen ≥ 2 Punkte).
- **Begründung:** Typenschilder und Fließtext unterscheiden sich systematisch in Zeilenlänge, Funktionswort-/Ziffernanteil, Interpunktion und regulatorischen Kennzeichnungen (Label, elektrische Kennwerte). Diese Regelmäßigkeit beruht auf gesetzlichen Kennzeichnungspflichten und ist damit ein verlässliches Merkmal.
- **Verworfene Alternativen:** Reine Konfidenzfilterung (wirkungslos); Verzicht auf Filterung (Nutzer sah Unsinn).
- **Konsequenzen / Grenzen:** Die Untrennbarkeit von *Erkennungsqualität* und *Verwertbarkeit* der OCR-Ausgabe wird zur zentralen Erkenntnis (Kap. 5/7).
- **Abhängigkeit:** Ein Zwischenfehler (zerstörte Zeilenumbrüche durch `filterWords()`) machte den Klassifikator zunächst in der App unbrauchbar; behoben durch Umstellung auf `fullTextAnnotation.text` (siehe Fehlerchronik 9.2, Nr. 11).

### B3 — Strukturbasierte statt listenbasierte Extraktion (Kernentscheidung)
- **Status:** aktiv (löst listenbasierten Ansatz ab)
- **Datum:** 2026-07-30
- **Thesis-Kapitel:** 5.4
- **Kontext:** Die Kandidatenextraktion nutzte `KNOWN_BRANDS` + mehrere formatspezifische Regexe. Beim Test mit „Dell Latitude 7421" wurde das Modell trotz korrekter OCR **nicht** vorgeschlagen: „Latitude" fehlte in der Markenliste, und kein Regex erfasste „Wort + Leerzeichen + Zahl".
- **Optionen:** (1) Markenliste weiter ergänzen, (2) weitere Regexe ergänzen, (3) strukturbasierte Regeln.
- **Entscheidung:** Drei **strukturelle** Regeln: (1) Label-Regel, (2) Alphanumerische Misch-Regel, (3) Wort+Zahl-Regel. Die Markenliste wird vom Kriterium zum reinen Bonus-Signal.
- **Begründung:** Listenbasierte Verfahren (Gazetteers) können eine **offene Menge** (alle Marken/Formate weltweit) strukturell nie vollständig abdecken; jede Ergänzung behebt nur den nächsten Einzelfall [Q9]. Die strukturellen Regeln generalisieren auf nie beobachtete Fälle (validiert mit einer fiktiven Marke und digit-first-Codes).
- **Verworfene Alternativen:** „Markenliste erweitern" wurde ausdrücklich als **Pflaster** verworfen (kein System). Weitere format-spezifische Regexe — endlose Enumeration.
- **Konsequenzen / Grenzen:** Eine breitere Misch-Regel fing zunächst elektrische Kennwerte (`220–240V`, `50/60Hz`) ein → ergänzendes Ausschlussmuster nötig. Grundsätzliche Unsicherheit der Mustererkennung bleibt bestehen (siehe B5).
- **Validierung:** siehe `DOKUMENTATION.md` §5.4 (keine Regression, neue Fälle korrekt).

### B4 — CJK-/Schriftfähigkeit des Klassifikators
- **Status:** aktiv
- **Datum:** 2026-07-30
- **Thesis-Kapitel:** 5.5
- **Kontext:** `isProseLine()` zählte „Wörter" per Leerzeichen. Chinesisch/Japanisch/Koreanisch/Thai trennen Wörter **nicht** mit Leerzeichen — ein ganzer Satz galt so als „1 Wort" und rutschte durch den Prosa-Filter.
- **Optionen:** (1) Leerzeichenbasierte Zählung beibehalten, (2) Sonderheuristik für Schriften ohne Worttrennung.
- **Entscheidung:** `hasNoSpaceScript()` erkennt diese Schriftsysteme; für sie wird statt Wortanzahl die Zeichenlänge + Ziffernanteil als Prosa-Maßstab verwendet.
- **Begründung:** Für Schriften ohne Worttrennung liefert eine leerzeichenbasierte Wortzählung strukturell keine sinnvollen Werte. Da die App weltweit einsetzbar sein soll, muss jede Typenschild-Sprache funktionieren (Anlass: chinesisches Dell-Typenschild).
- **Verworfene Alternativen:** Beschränkung auf lateinische Sprachen — widerspricht dem Anspruch weltweiter Nutzbarkeit.
- **Konsequenzen / Grenzen:** Regel 3 der Extraktion (Wort+Zahl, B3) setzt lateinische Großschreibung voraus; da Modellcodes international aber fast immer lateinisch-alphanumerisch sind, bleibt die weiterverarbeitungsrelevante Information erfassbar.

### B5 — Recall vor Precision + Nutzerbestätigung
- **Status:** aktiv
- **Datum:** 2026-07-30
- **Thesis-Kapitel:** 5.6
- **Kontext:** Es wurde die Forderung formuliert, ein „zu jeder Zeit stabiles" System zu bauen. Absolute Zuverlässigkeit ist bei Mustererkennung auf beliebigem Text unmöglich.
- **Optionen:** (1) maximal sichere Einzelvorschläge (hohe Precision), (2) mehrere plausible Kandidaten (hoher Recall) + menschliche Bestätigung.
- **Entscheidung:** Bewusste Priorisierung von **Recall**; das OCR-Sheet zeigt mehrere antippbare Kandidaten + Rohtext + Freitextfeld. Der Mensch bestätigt die Kennung.
- **Begründung:** Recall und Precision stehen im Zielkonflikt [Q10]. Ein System, das aus beliebigem Text exakt einen korrekten Kandidaten bestimmt, ist unrealistisch; ein System, das den korrekten Kandidaten zuverlässig in eine überschaubare Vorschlagsmenge aufnimmt und die Entscheidung dem Nutzer überlässt, ist erreichbar und für den Anwendungsfall ausreichend.
- **Verworfene Alternativen:** „Perfekte Automatik" — als nicht erreichbare Zielsetzung erkannt; Robustheit liegt in der Systemarchitektur (Mensch im System), nicht in perfekten Regeln.
- **Konsequenzen / Grenzen:** Setzt die Nutzerbestätigung im UI voraus (existiert). Verbleibende Unsicherheit wird so abgefangen, nicht beseitigt.

---

# C — UI/UX und Informationsarchitektur

### C1 — Capability Detection für die Kamera
- **Status:** aktiv
- **Datum:** 2026-07-20
- **Thesis-Kapitel:** 4.2
- **Kontext:** Gewünscht waren Zoom, Fokus, Torch, Kamerawechsel und Objektivwechsel. Die MediaDevices-API variiert jedoch stark je Browser/Gerät.
- **Optionen:** (1) statische Bedienoberfläche mit allen Elementen, (2) adaptive Bedienoberfläche nach Capability-Check.
- **Entscheidung:** Nach Stream-Start werden die Fähigkeiten des `MediaStreamTrack` via `getCapabilities()` abgefragt; nur unterstützte Elemente werden eingeblendet. Zoom übernimmt die gemeldeten Min/Max/Schrittwerte.
- **Begründung:** Prinzip des *Progressive Enhancement*; vermeidet nicht funktionsfähige Bedienelemente (Bedienfehler, Frust). Erlaubt eine einheitliche Codebasis bei Anpassung an das Endgerät.
- **Verworfene Alternativen:** Statische UI — hätte auf vielen Geräten wirkungslose Schaltflächen gezeigt. Nativer Zugriff (siehe A1) — Architekturbruch.
- **Konsequenzen / Grenzen:** Strukturelle Limitation: gezielter Objektivwechsel ist im Browser nicht zuverlässig; iOS abstrahiert Objektive und wechselt sie über die Zoomstufe. Zoom fungiert als funktionaler Ersatz. Tap-to-Focus wird unabhängig vom API-Erfolg durch einen Fokusring quittiert.

### C2 — Quellen zusammenführen statt trennen (nutzerzentrierte IA)
- **Status:** aktiv (löst quellenzentrierte Struktur ab)
- **Datum:** 2026-07-23
- **Thesis-Kapitel:** 4.3
- **Kontext:** „Repairguides" (iFixit) und „Community & Foren" (Reddit) waren getrennte Menüpunkte — eine Gliederung nach Datenquelle. Für einen Quellenvergleich waren vier Interaktionsschritte nötig.
- **Optionen:** (1) getrennte Menüpunkte (Quelle), (2) ein gemeinsamer Bereich mit Reitern/Segment-Control (Absicht).
- **Entscheidung:** Zusammenführung zu einem Bereich „Reparatur & Community"; Quellen als Tabs/Segmented Control mit Trefferzahl, parallel geladen.
- **Begründung:** Nutzer orientieren sich an Aufgaben, nicht an Systemstrukturen [Q11]; aufgabenbasierte Strukturen sind stabiler und besser erlernbar [Q12]. Format-/quellenbasierte Navigation ist auf oberer Ebene ungeeignet, auf tieferen Ebenen jedoch angemessen [Q13]. Apple HIG: Tab Bar = app-weite Navigation, Segmented Control = Wechsel verwandter Ansichten im Kontext [Q14]. Material 3: Tabs gruppieren verwandte Inhalte derselben Hierarchieebene [Q15]. Trefferzahl am Label vermeidet leere Tabs.
- **Verworfene Alternativen:** Quellenzentrierte Trennung — vom Nutzer nicht leistbare Vorabentscheidung („welche Datenbank beantwortet meine Frage?"). Der reale Qualitätsunterschied rechtfertigt **visuelle Differenzierung innerhalb** des Bereichs (unterschiedliche Kartengestaltung), nicht eine Trennung der Navigation.
- **Konsequenzen / Grenzen:** Verallgemeinerbare Erkenntnis: technische Systemgrenzen (getrennte Schnittstellen) dürfen nicht ungeprüft in die Nutzerführung übernommen werden.

### C3 — Disclosure Controls statt eigener Screens
- **Status:** aktiv
- **Datum:** 2026-07-30
- **Thesis-Kapitel:** 4.3
- **Kontext:** Nach der Reddit-Revision existierten zeitweise zwei „Community & Foren"-Einträge; zudem sollten Archiv und Websuche eingebunden werden, ohne die Menüliste aufzublähen.
- **Optionen:** (1) je eigener Screen, (2) je eigener Menüpunkt mit Modal, (3) einklappbare Disclosure-Panels in der Menüliste.
- **Entscheidung:** **Disclosure Controls** (Apple-HIG-Muster): Tap klappt ein Panel in der Menüliste auf; es ist immer nur eines geöffnet.
- **Begründung:** Entspricht dem etablierten Muster für progressive Offenlegung; hält die Liste kompakt, vermeidet redundante Tab-Einträge und reduziert Navigationswechsel.
- **Verworfene Alternativen:** Doppelte Community-Einträge (Redundanz, Fehler #19) wurden konsolidiert; separate Screens blähten die Navigation auf.
- **Konsequenzen / Grenzen:** Chevron rotiert (rechts → unten), Panel animiert per `max-height`; nur ein Panel gleichzeitig offen.

### C4 — Scanner über den Kategorien
- **Status:** aktiv
- **Datum:** 2026-08-05
- **Thesis-Kapitel:** 4.4
- **Kontext:** Auf dem Start-Screen standen Kategorien **über** dem Scanner. Die Anordnung suggerierte fälschlich, Kategorien würden den Scan beeinflussen.
- **Optionen:** (1) Reihenfolge beibehalten, (2) tauschen: Scanner oben.
- **Entscheidung:** Scanner steht **oben**, Kategorien sichtbar getrennt darunter.
- **Begründung:** Die primäre Aktion (Scannen) muss ohne Fehlinterpretation zugänglich sein; Kategorien sind eine nachgelagerte Auswahl, kein Scan-Parameter.
- **Verworfene Alternativen:** Beibehaltung — Fehlinterpretationsrisiko.
- **Konsequenzen / Grenzen:** Konsequenz für C6: „Kategorie als Suchfilter" wurde damit konzeptionell ausgeschlossen.

### C5 — Dark Mode, Responsivität, Kontrast, Vignette
- **Status:** aktiv
- **Datum:** 2026-06-24 (Responsivität) / 2026-07-20 (Kontrast, Vignette)
- **Thesis-Kapitel:** 4.4
- **Kontext:** Es sollte auf jeder Bildschirmgröße identisch gut aussehen; sekundärer Text war zu dunkel; die Kameravignette verdeckte Bildinhalt.
- **Entscheidung:** Durchgängig responsives Dark-Mode-Layout (skalierend, kein horizontaler Overflow); sekundärer Text von `#555555` auf `#8a8a8a` (zentral über CSS-Variable); Vignette vollständig entfernt.
- **Begründung:** Responsivität nach den Google/Apple-Guidelines (siehe E2); Kontrast für Lesbarkeit auf dunklem Grund; die Vignette behinderte die korrekte Positionierung des Geräts.
- **Verworfene Alternativen:** Feste Pixelgrößen (frühe Version) — auf verschiedenen Geräten unbrauchbar. Reduzierte statt entfernte Vignette (Zwischenstufe) — verdeckte weiterhin Randbereiche.
- **Konsequenzen / Grenzen:** Alle sekundären Textelemente folgen der zentralen Variable → konsistente Anpassung.

### C6 — Funktion der Kategorien
- **Status:** **OFFEN** (Konzeptphase)
- **Datum:** 2026-08-05
- **Thesis-Kapitel:** 4.5
- **Kontext:** Die Kategorien sind bisher nicht interaktiv. Frage: wozu dienen sie?
- **Optionen:** (1) DIY-Projekte je Kategorie, (2) Kategorie als Suchfilter, (3) gescannte Geräte je Kategorie, (4) Kombination (1)+(3) mit **anonym geteilter Scan-Historie aller Nutzer**.
- **Entscheidung:** **Noch offen.** Sicher ausgeschlossen: Option 2 (Suchfilter) — widerspricht C4.
- **Zwischenstand:** (3) ist technisch am leichtesten (Cloudflare KV/D1, kein Konto nötig); (1) erfordert echten Inhalt (Schreibarbeit oder Fremdquellen); der kombinierte Ansatz „(1)+(3), alle Scans anonym" passt inhaltlich zum FDR-Konzept, wirft aber ein **DSGVO-Thema** auf (Hinweis-Screen beim ersten Scan nötig). Nutzerkonten mit selbst geschriebenen Projekten = großer, eigenständiger Aufwandsblock → zurückstellen.
- **Konsequenzen / Grenzen:** Für eine wissenschaftliche Arbeit ist die Entscheidung zu begründen und der Datenschutzaspekt auszuweisen.

### C7 — Festes 5-Farben-Tokensystem (Discord-/Instagram-Anmutung)
- **Status:** aktiv
- **Datum:** 2026-10-01
- **Thesis-Kapitel:** 5.2
- **Kontext:** Mit der Migration auf Komponenten musste die Gestaltung zentral definierbar werden. Zuvor lagen Farbwerte verstreut vor (teils inline, teils als CSS-Variablen). Gefordert war eine auf **vier bis fünf feste UI-Farben** begrenzte Palette, die über alle Screens und Größen konsistent wirkt.
- **Optionen:** (1) freie Farbwahl je Komponente, (2) semantische Variablen ohne feste Anzahl, (3) genau fünf Basisfarben als Tokens, alle Abstufungen ausschließlich als Deckkraft/Mischung.
- **Entscheidung:** Genau **fünf Basisfarben** als Design-Tokens: Hintergrund `#0B0F0E`, Fläche `#161B19`, Akzent-Blurple `#5865F2`, Primärtext `#ECF1EF`, Sekundärtext `#8B9A94`. Alle weiteren Töne (Rahmen, gedimmte Flächen, Overlays) entstehen ausschließlich über `color-mix()` aus diesen fünf [Q28]. Die Anmutung orientiert sich an **Discord** (geschichtete Flächen, Blurple-Akzent) und **Instagram** (großzügige Rundungen, klar getrennte Karten); die Bindung an die Guideline-Hierarchie (E2) bleibt über [Q14] und [Q21] erhalten.
- **Begründung:** Eine kleine, feste Palette erzwingt visuelle Konsistenz und setzt den Grundsatz zentraler, wiederverwendbarer Gestaltungswerte um [Q27]. Kontrast und Dark-Mode-Lesbarkeit folgen [Q14]. Durch die Mischungsregel entsteht **keine sechste Basisfarbe** — die Palette bleibt prüfbar.
- **Verworfene Alternativen:** Farbwahl je Komponente — führt zu Drift und Inkonsistenz (genau das Problem des vorherigen MVP, in dem Farben verstreut waren). Semantische Variablen ohne feste Anzahl — bequem, aber ohne die geforderte Begrenzung und damit nicht überprüfbar.
- **Konsequenzen / Grenzen:** Farbänderungen erfolgen an genau einer Stelle (`src/styles/tokens.css`). Neue Töne dürfen nur als Mischung der fünf Basisfarben entstehen. Die Palette ist auf Dark Mode ausgelegt; ein heller Modus wäre eine eigene, zurückgestellte Entscheidung.

### C8 — Monochromes Icon-System statt Emojis
- **Status:** aktiv
- **Datum:** 2026-10-01
- **Thesis-Kapitel:** 5.2
- **Kontext:** Die Oberfläche nutzte durchgängig Emojis als Icons (Kategorien, Ergebnis-Menü, Kacheln, Zustände, Kamera). Emojis sind **mehrfarbig** und systemfremd — sie durchbrechen die auf fünf Farben begrenzte Palette (C7) und werden je nach Betriebssystem unterschiedlich dargestellt (keine einheitliche, planbare Optik).
- **Optionen:** (1) Emojis beibehalten, (2) Flaticon-UIcons als Icon-Font, (3) Open-Source-Vektor-Icons als React-Komponenten (Lucide).
- **Entscheidung:** Zentrale `Icon`-Fassade auf Basis von **Lucide**; sämtliche Emojis ersetzt. Jedes Icon ist einfarbig und erbt seine Farbe über `currentColor` aus der jeweiligen Komponente.
- **Begründung:** Emojis sind per Definition mehrfarbig und damit mit C7 unvereinbar. Flaticon-Icons sind nutzbar, aber attributionspflichtig (bzw. kostenpflichtig ohne Nennung) und als Icon-Font aufwändiger in ein React/Vite-Projekt zu integrieren (Font-Datei, Klassen/Ligaturen). Lucide ist **ISC-lizenziert** (keine Attributionspflicht), liefert monochrome SVGs, ist tree-shakeable und passt zum bestehenden Stack [Q30]. Ergebnis: einheitliche, plattformunabhängige Darstellung innerhalb der Palette.
- **Verworfene Alternativen:** Emojis — verletzen C7 und sind plattformabhängig. Flaticon-Icon-Font — Lizenz- und Integrationsnachteil ohne funktionalen Mehrwert für dieses Projekt.
- **Konsequenzen / Grenzen:** Neue Icons werden zentral in `src/components/ui/Icon.jsx` registriert (semantischer Name → Komponente); Färbung ausschließlich über `currentColor`, also nur aus der 5-Farben-Palette. Das Bundle wächst nur um die tatsächlich importierten Icons.

### C9 — Keine System-Statusleiste, fluide Web-Oberfläche
- **Status:** aktiv (präzisiert C5)
- **Datum:** 2026-10-01
- **Thesis-Kapitel:** 5.2
- **Kontext:** Zwei Schwächen: (1) Eine nachgeahmte iOS-Statusleiste (Uhrzeit, Empfang, WLAN, Akku) imitierte Systeminformationen, die eine Web-Anwendung weder zuverlässig auslesen noch steuern kann — sie zeigte damit potenziell **falsche** Werte und war reine Dekoration. (2) Die Oberfläche war auf eine feste „Phone“-Breite begrenzt und nicht konsequent für sehr kleine (Smartwatch) und sehr große Anzeigen (Desktop) ausgelegt.
- **Optionen:** (1) Statusleiste beibehalten bzw. echte Systemwerte auslesen, (2) Statusleiste entfernen, feste Phone-Breite behalten, (3) Statusleiste entfernen und fluide, breakpoint-basierte Web-Oberfläche.
- **Entscheidung:** Die nachgeahmte Statusleiste wird **vollständig entfernt**. Das Layout wird als fluide Web-Oberfläche umgesetzt: mobil randlos, ab 768 px zentrierte Spalte (820 px) mit raster-/mehrspaltigen Inhalten, ab 1200 px 960 px Breite; sehr kleine Anzeigen (≤ 340 px) erhalten eigene Kompaktregeln. Statt der festen 44-px-Leiste werden **Safe-Area-Insets** (`env(safe-area-inset-*)`) verwendet.
- **Begründung:** Systemuhr und -akku lassen sich im Browser nicht plattformübergreifend und nicht verlässlich auslesen; eine Attrappe widerspricht dem Grundsatz, echte Informationen statt Zierrat zu zeigen. Responsives Verhalten folgt den Google-*Mobile App UX Principles* [Q21] und den Apple HIG [Q14]: Inhalte passen sich dem verfügbaren Raum an, anstatt eine Geräteklasse zu imitieren.
- **Verworfene Alternativen:** Fake-Statusleiste — falsche Informationen. Echte Systemwerte (z. B. Battery Status API) — im Web nicht standardisiert bzw. nicht verfügbar. Starre Phone-Breite — verschenkt Platz auf Tablet/Desktop und bricht auf sehr kleinen Anzeigen.
- **Konsequenzen / Grenzen:** Kein System-Zierrat mehr; Zustände (Laden, Fehler, Offline) werden inhaltlich kommuniziert. Responsive Breakpoints: ≤ 340 px kompakt, ≥ 768 px Tablet-Raster, ≥ 1200 px Desktop. Die Kameraansicht füllt weiterhin die verfügbare Fläche.

---

# D — Externe Informationsquellen

### D1 — iFixit als Primärquelle + Suchkaskade
- **Status:** aktiv
- **Datum:** 2026-06-25
- **Thesis-Kapitel:** 6.1
- **Kontext:** Nach dem Scan soll der Nutzer passende Reparaturanleitungen erhalten.
- **Optionen:** (1) eigene Anleitungsdatenbank, (2) iFixit-API, (3) reine Verlinkung.
- **Entscheidung:** iFixit-API, In-App-Darstellung (Liste + Schritte), DE bevorzugt (`langid=de`), Fallback auf Quellsprache (`useSourceLang=1`). Suche über eine **Kaskade** von spezifisch zu breit.
- **Begründung:** iFixit ist die größte kuratierte Reparaturdatenbank mit offener API; In-App-Darstellung hält den Nutzer im Kontext; die Kaskade kompensiert, dass exakte Modellnummern selten direkt treffen.
- **Verworfene Alternativen:** Eigene Datenbank — unrealistischer Aufwand. Reine Verlinkung — geringerer Mehrwert.
- **Konsequenzen / Grenzen:** iFixit deckt alte/wenig verbreitete Geräte unzureichend ab → Motiv für D2–D4.

### D2 — Reddit: Link-out statt API
- **Status:** aktiv
- **Datum:** 2026-07-28 (Umsetzung 2026-07-29)
- **Thesis-Kapitel:** 6.2
- **Kontext:** Die Reddit-Einbindung (`/api/reddit`) lieferte konsistent HTTP 403.
- **Ursache (architekturbedingt, nicht codebehebbar):** Reddit verlangt für Zugriffe aus Rechenzentrums-IP-Bereichen ein OAuth-Token [Q16]; Cloudflare Workers laufen in Rechenzentren; die Selbstregistrierung wurde unter der *Responsible Builder Policy* geschlossen, der Registrierungsversuch verwies lediglich auf die Richtlinie [Q17]; unabhängige Entwicklerberichte bestätigen den Sachstand [Q23][Q24]; Wayback ist kein Ausweg, da Reddit archive.org gezielt ausgeschlossen hat [Q18].
- **Optionen:** (1) OAuth-Anbindung, (2) Verlinkung statt Einbettung, (3) alternative Community-Quelle, (4) Verzicht.
- **Entscheidung:** **Link-out** — kuratierte, horizontal scrollbare Reihe realer Subreddits (`r/fixit`, `r/mobilerepair`, `r/electronics`, `r/techsupport`, `r/homelab`) mit redaktioneller Kurzbeschreibung; jede Karte öffnet eine auf den Subreddit eingegrenzte Gerätesuche. Keine simulierten Inhalte.
- **Begründung:** Einbettung ist architektonisch blockiert; Link-out ist sofort umsetzbar, ausfallfrei und rechtlich unbedenklich. Die Subreddit-Eingrenzung reduziert zusätzlich die Wahrscheinlichkeit algorithmisch generierter KI-Zusammenfassungen auf der Zielseite.
- **Verworfene Alternativen:** OAuth — geschlossene Registrierung, unkalkulierbares Zeitrisiko → für den Zeitrahmen nicht gangbar. Meta-Tag-Extraktion einzelner Beiträge — setzt denselben blockierten Zugriffsweg voraus und widerspräche der Nutzungsordnung. Wayback Machine — von Reddit blockiert.
- **Konsequenzen / Grenzen:** Als **Kontrastfall** zur geglückten Archive-Anbindung (D3) verwertbar: Abhängigkeit von Dritt-APIs ist quellenspezifisch zu bewerten.
- **Offener Bug:** Subreddit-/Suchbegriff-Kontext passt nicht immer (letzter Stand).

### D3 — Internet-Archive-Anbindung
- **Status:** aktiv
- **Datum:** 2026-07-29
- **Thesis-Kapitel:** 6.3
- **Kontext:** Für ältere/obsolete Geräte gibt es oft nur gescannte Bedienungsanleitungen.
- **Optionen:** (1) direkte Browser-Anfrage, (2) Worker-Proxy.
- **Entscheidung:** Worker-Endpunkt `/api/archive` über die Advanced Search API (`mediatype:texts`, Titelsuche); liefert Identifier, Titel, Jahr, Vorschau.
- **Begründung:** Die Advanced Search API ist offen, dokumentiert und authentifizierungsfrei [Q19] — im Gegensatz zu Reddit. Der Proxy ist **nur** wegen fehlender CORS-Header nötig (Browser-Sicherheitsbeschränkung, keine Zugriffssperre seitens Archive.org).
- **Verworfene Alternativen:** Direkte Browser-Anfrage — durch CORS blockiert.
- **Konsequenzen / Grenzen:** Verifikation mit echtem Netzwerkzugriff im Produktiv-Deployment noch zu bestätigen.

### D4 — Tavily statt Google Custom Search / SearXNG
- **Status:** aktiv (Ablösung der Domain-Allowlist durch D8 vorgeschlagen; Tavily als Anbieter bleibt)
- **Datum:** 2026-07-31
- **Thesis-Kapitel:** 6.4
- **Kontext:** Es sollte eine Websuche auf vertrauenswürdigen Fachseiten ergänzt werden.
- **Optionen:** (1) Google Custom Search JSON API, (2) Vertex AI Search, (3) öffentliches SearXNG, (4) Tavily.
- **Entscheidung:** **Tavily**, serverseitig auf vertrauenswürdige deutsche Tech-/Reparatur-Domains beschränkt; Fallback auf site-restricted Google-Link.
- **Begründung:** Google CSE ist für Neukunden geschlossen (Abschaltung 2027-01-01); Vertex AI Search berechnet ab der ersten Anfrage ohne Freikontingent; öffentliche SearXNG-Instanzen blockieren die JSON-API (403). Tavily ist die einzige Option mit **monatlich erneuertem** Freikontingent (1.000 Suchen/Monat) **ohne Kreditkarte** — kann also nicht still Kosten verursachen [Q20].
- **Verworfene Alternativen:** siehe oben; zusätzlich Serper (einmaliges statt erneuertes Kontingent) und Brave (Freikontingent ohne Karte entfallen).
- **Konsequenzen / Grenzen:** Weitere externe Abhängigkeit; Fallback-Link verhindert Sackgassen. Die ursprüngliche Beschränkung auf sechs deutsche Tech-Domains soll durch **D8** abgelöst werden (Vorschlag): Sie schließt Herstellerhandbücher und offizielle Supportseiten systematisch aus (Nutzerfall „latitude 7420“). Tavily bleibt der Suchanbieter.

### D5 — Suchbegriffsbildung (`bestSearchTerm`)
- **Status:** aktiv (Ergänzung durch D8 vorgeschlagen)
- **Datum:** 2026-07-30
- **Thesis-Kapitel:** 6.5
- **Kontext:** Die Suche nach „iPhone 14" auf Reddit/Archiv verlor die Zahl; vollständige Modellcodes schränkten Treffer unnötig ein.
- **Optionen:** (1) vollständigen String verwenden, (2) interne Herstellercodes verwerfen, (3) Marke behalten, Zahl verwerfen.
- **Entscheidung:** `bestSearchTerm` verwirft nur **lange Misch-Token** (≥ 6 Zeichen, Buchstaben+Ziffern, z. B. `WAT28401`); kurze IDs und Zahlen (`A11`, `14`, `2019`) bleiben erhalten.
- **Begründung:** Interne Codes schreibt in Foren niemand wörtlich; kurze Kennungen und Jahreszahlen werden dagegen tatsächlich gesucht. Verhindert Über- und Unter-Einschränkung der Suche.
- **Verworfene Alternativen:** Vollständiger String (zu streng), generisches Kürzen (verliert relevante Zahlen).
- **Konsequenzen / Grenzen:** Wird von iFixit-Kaskade, Community, Archiv und Websuche gemeinsam genutzt. **D8 schlägt vor:** Bleibt nach dem Entfernen des Modellcodes nur noch ein Token übrig, wird der Code behalten (z. B. `Sony WH-1000XM4` statt nur `Sony`, `Bosch WAT28460/01` statt nur `Bosch`), weil die Marke allein für die Websuche zu unspezifisch ist.

### D6 — KI-/Assistenzschicht: RAG-first, dann Cloudflare Workers AI
- **Status:** aktiv (Stufe 1+2 umgesetzt; Tool-Calling/Evaluation offen)
- **Datum:** 2026-10-20
- **Thesis-Kapitel:** 7.5 (neu), 9.3
- **Kontext:** Der MVP bündelt bereits Quellen (iFixit, Internet Archive, Tavily), erzeugt aber noch keine eigene, quellenbelegte Antwort. Für eine KI-Assistenz waren Laufzeitort und Vorgehen zu wählen. Randbedingungen: browserbasierte mobile Web-App (A1), bestehender Cloudflare Worker (A3/A4), kein Budget (NFA-08), Geräteunabhängigkeit (NFA-01), geringe Latenz (NFA-06), Fallback statt Sackgasse (NFA-09) und Quellenbindung statt freier Generierung.
- **Optionen:** (A) Browser-lokal (WebLLM/Transformers.js), (B) Cloudflare Workers AI über den bestehenden Worker, (C) Self-hosted (Ollama/llama.cpp/vLLM), (D) Muster „RAG + Werkzeugaufrufe“ auf A/B/C.
- **Entscheidung:**
  1. **Laufzeitort B:** Cloudflare Workers AI über ein `AI`-Binding im bestehenden Worker. Der Modellaufruf bleibt serverseitig; es entsteht kein neuer API-Schlüssel im Client.
  2. **Muster D:** RAG. Die Antwort wird **ausschließlich aus abgerufenen Quellen** erzeugt; ohne Retrieval keine generative Antwort.
  3. **Reihenfolge:** **Zuerst RAG** — Abruf, Normalisierung, Quellenaufbereitung und deterministische Fallback-Anzeige. **Danach Workers AI** — Synthese der Antwort aus dem Quellenkontext. **Tool-Calling/ReAct** ist Stufe 3 und wird erst nach der Evaluation ergänzt.
  4. **Modellshortlist:** Qwen3-30B-A3B-FP8 und gpt-oss-20b (beide Apache-2.0, Function Calling); Gemma 4 26B nur bei akzeptabler Gemma-Lizenz; Llama 3.1 8B höchstens als RAG-Baseline (die geprüfte Katalogvariante weist kein Function Calling aus).
- **Begründung:**
  - **RAG-first** erzwingt Quellenbindung und Nachvollziehbarkeit [Q46], senkt das Halluzinationsrisiko [Q48] und hält die App auch ohne KI nutzbar (NFA-09). Es definiert zugleich den Kontext, das Ausgabeformat und die Messgrößen für die Evaluation, bevor ein Modell ins Spiel kommt. Function Calling ist bei Workers AI noch **Beta** [Q35]; der MVP soll nicht davon abhängen.
  - **Workers AI** fügt sich in die bestehende Architektur (A3) ein, benötigt keinen neuen Secret-Typ und ist im Frei-Kontingent kostenneutral: 10.000 Neurons/Tag, 0,011 USD/1.000 Neurons, 300 Text-Generierungen/Minute [Q32], [Q38]. Die für die generative Stufe vorgesehenen Modelle (Qwen3, gpt-oss, Gemma) unterstützen Function Calling; Cloudflare verarbeitet Standard-Inferenzen ohne Retention und trainiert nicht mit Kundendaten [Q37].
  - **Server statt Gerät:** Die Zielgruppe sind alte/obsolete Geräte. On-Device-KI würde genau diese Zielgruppe ausschließen: WebGPU fehlt oft, Modell-Download und RAM sind knapp, Akku/Wärme leiden, mobil sind realistisch nur 1–3B-Modelle, und Function Calling ist in WebLLM „WIP“ [Q40], [Q42]. Die App benötigt ohnehin Netz für OCR und Quellen; ein lokales LLM macht sie daher nicht offline.
  - **Self-hosted** ist qualitativ und lizenzseitig gleichwertig, aber GPU- und Betriebsaufwand stehen in keinem Verhältnis zum Demonstrations-MVP [Q43]–[Q45].
- **Verworfene Alternativen:**

| Alternative | Warum verworfen |
| --- | --- |
| **A — On-Device als MVP-Pflicht** | Download (0,3–5 GB), RAM/Akku, WebGPU-Abhängigkeit, schwächere 1–3B-Modelle und Function Calling nur „WIP“ [Q40], [Q42]. Widerspricht NFA-01 (Geräteunabhängigkeit) und trifft die Zielgruppe alter Geräte am härtesten. Bleibt als Experiment für neue Geräte/Offline-Szenarien. |
| **C — Self-hosted im Live-Betrieb** | GPU-/Betriebsaufwand, Deployment, Skalierung und Ausfallsicherheit für ein Demonstrations-MVP unverhältnismäßig [Q43]–[Q45]. Bleibt Referenz-/Benchmark-Umgebung. |
| **Reine Prompt-Generierung ohne Retrieval** | Keine Quellenbindung; erhöht nachweislich das Halluzinationsrisiko [Q48] und widerspricht dem Grundprinzip von mendooR. |
| **Workers AI + Tool-Calling zuerst** | Function Calling ist Beta [Q35]; mehrere Modellaufrufe pro Anfrage erhöhen Latenz, Kosten und Fehlerfläche, bevor das Retrieval-Fundament steht. RAG-first ist der robustere MVP-Pfad. |
| **Feintuning (LoRA) als erster Schritt** | Ohne sauberen Trainingsdatensatz und ausgeschöpftes Retrieval kein Nutzen; zudem Rank-/Größen-/Formatvorgaben [Q36]. |
| **Closed-Weight-SaaS** | In der Recherche bewusst ausgeklammert (Open-Weight-Fokus). Diese Prämisse ist **keine** harte FA/NFA-Anforderung; wird sie fallengelassen, ist die Entscheidung neu zu prüfen. |

- **Konsequenzen / Grenzen:**
  - Die KI ist eine **optionale Erweiterung**: Ohne AI oder bei leerem Kontingent bleibt die Quellenliste nutzbar (NFA-09).
  - Das Frei-Kontingent ist ein **Hard Cap** (10.000 Neurons/Tag); Tool-Loops, Embeddings und größerer RAG-Kontext senken die Zahl der möglichen Anfragen. Darüber ist der Workers-Paid-Plan nötig.
  - Die Kostenschätzung (2.000 Input-/600 Output-Token, **ein** Aufruf) ist eine **Untergrenze**; reale Tokenlängen und deutsche Sprachqualität sind `[OFFEN]` und in der Evaluation zu messen.
  - Datenschutz: Texte und Quellen gehen an Cloudflare; die OCR-Bilder gehen bereits an Google Cloud Vision. DSGVO-/AVV-Prüfung und Transparenzhinweis bleiben offen.
  - Anbieterabhängigkeit: permissive Gewichte und offene Engines (C) bleiben der Ausweg.
  - **Umsetzungsstand:** Stufe 1+2 sind umgesetzt (`functions/sources.js`, `functions/rag.js`, `/api/ai`, `AI`-Binding, `AiPanel`). Tool-Calling (Stufe 3) und die Evaluation bleiben offen.
- **Quellen:** [Q32]–[Q48], [Q51], [Q52].

### D7 — RAG-Orchestrierung und KI-Eintrag (Umsetzung von D6)
- **Status:** aktiv (umgesetzt; Evaluation offen)
- **Datum:** 2026-10-20
- **Thesis-Kapitel:** 7.5
- **Kontext:** D6 legte RAG-first und Cloudflare Workers AI fest. Für die Umsetzung war zu entscheiden: (a) Wo läuft das Retrieval? (b) Welches Modell? (c) Wie wird die KI im UI zugänglich? (d) Wie verhält sie sich ohne Quellen oder bei Fehlern?
- **Optionen:** (1) Client-Retrieval + Worker-Synthese, (2) Server-Retrieval + Worker-Synthese, (3) automatische Generierung beim Screen-Aufbau vs. manueller Button, (4) gpt-oss-20b vs. Qwen3-30B-A3B vs. Llama 3.1 8B als Modell.
- **Entscheidung:**
  1. **Serverseitiges Retrieval:** `functions/sources.js` ruft iFixit, Internet Archive und Tavily ab; `functions/rag.js` normalisiert, filtert, dedupliziert und begrenzt die Quellen. `/api/ai` baut daraus den Prompt und ruft Workers AI auf.
  2. **Modell:** `@cf/openai/gpt-oss-20b` mit `max_tokens: 800`, `temperature: 0.2` und `reasoning.effort: low`.
  3. **UI:** Optionaler, eingeklappter KI-Eintrag (`AiPanel`) in der Quellenliste des Ergebnis-Screens; ein Klick öffnet ihn, ein weiterer startet die RAG-Kette. Die bereitgestellten Quellen werden unter der Antwort mit `[1]`, `[2]` … aufgelistet und verlinkt.
  4. **Fallback:** Ohne Quellen keine generative Antwort; bei AI-Fehler/Timeout bleiben die normalen Quellenlisten nutzbar. `?debug=1` liefert Retrieval + Prompt ohne AI-Aufruf (POST oder GET mit `device`).
- **Begründung:**
  - **Server-Retrieval** stellt sicher, dass nur validierte, begrenzte Quellen an das Modell gelangen. Der Client sendet keine fremden Kontexte und keine Schlüssel; die Logik liegt an einer Stelle und nutzt das bestehende Worker-Muster (A3).
  - **gpt-oss-20b** ist Apache-2.0, hat 128k Kontext und Function Calling; das Reasoning-Level ist explizit steuerbar. Qwen3-30B-A3B ist günstiger, aber Thinking-Modus und deutsche Qualität sind nicht evaluiert; Llama 3.1 8B hat in der geprüften Katalogvariante kein Function Calling und bleibt Baseline.
  - **Manueller Button** kontrolliert die Neurons-Kosten: Nicht jeder Aufruf des Ergebnis-Screens löst eine KI-Anfrage aus. Die Quellenlisten bleiben auch ohne KI lesbar.
- **Verworfene Alternativen:**

| Alternative | Warum verworfen |
| --- | --- |
| **Client-Retrieval, nur Synthese im Worker** | Der Client müsste den Kontext liefern; Validierung, Kürzung und Prompt-Injection-Schutz wären schwieriger. Server-Retrieval ist die vertrauenswürdigere Grenze. |
| **Automatische Generierung beim Screen-Aufbau** | Jeder Ergebnis-Aufruf würde Quellen abrufen und Neurons verbrauchen; Latenz und Kosten wären für den MVP schlecht kontrollierbar. |
| **Qwen3-30B-A3B als Erstmodell** | Günstiger, aber Thinking-Verhalten und deutsche Antwortqualität sind ungemessen. Bleibt Kandidat für den Benchmark. |
| **Llama 3.1 8B als Erstmodell** | Kein Function-Calling-Merkmal in der geprüften Katalogvariante; nur als RAG-Baseline geeignet. |
| **Tool-Calling/ReAct sofort** | Function Calling ist Beta [Q35]; mehrere Calls erhöhen Latenz/Kosten und erschweren die Fehlersuche. Stufe 3 nach der Evaluation. |
| **Streaming sofort** | Verbessert die wahrgenommene Latenz, erfordert aber SSE-Parsing und zusätzliche Fehlerpfade. Für die erste funktionale Version nicht nötig. |

- **Konsequenzen / Grenzen:**
  - **Umsetzung:** `functions/sources.js`, `functions/rag.js`, `functions/_worker.js` (`/api/ai`), `wrangler.jsonc` (`ai`-Binding), `src/lib/api.js`, `src/components/result/AiPanel.jsx`, `src/styles/screens.css`.
  - **Teststand:** `npm run build` und `wrangler deploy --dry-run` erfolgreich; `POST /api/ai?debug=1` liefert im lokalen Worker Quellen und Prompt. Ein echter AI-Aufruf war in dieser Umgebung nicht möglich, weil Wrangler nicht authentifiziert ist und das AI-Binding lokal „not supported“ meldet. Bei einer Ablehnung des optionalen Reasoning-Parameters wiederholt der Worker den Aufruf einmal ohne ihn.
  - **Retrieval-Qualität:** Archive-Treffer können Rauschen enthalten (Gerichtsakten werden gefiltert, generische Dokumente bleiben möglich). Die Quellenbegrenzung und der Prompt reduzieren, beseitigen das Risiko aber nicht.
  - **Evaluation:** Deutsche Sprachqualität, Fakten-Treue und Quellenabdeckung sind `[OFFEN]`; Messaufbau in `EVALUATION.md`.
  - **Kosten/Latenz:** Kein Cache; wiederholte Klicks rufen Quellen erneut ab und verbrauchen Neurons. Cloudflare-Cache/KV und Streaming sind spätere Optimierungen.
  - **Datenschutz:** Quellen und Gerätekontext gehen an Cloudflare; die OCR-Bilder bereits an Google. DSGVO-/AVV-Prüfung bleibt offen.
- **Quellen:** [Q32]–[Q48], [Q51], [Q52].

### D8 — Offene Websuche mit Trust-Ranking statt Domain-Allowlist
- **Status:** vorgeschlagen; Entscheidung und Umsetzung ausstehend
- **Datum:** 2026-10-21
- **Thesis-Kapitel:** 7.4 (Websuche), 8 (Evaluation)
- **Kontext:** Die erste Websuche-Fassung beschränkte Tavily über `include_domains` auf sechs deutsche Tech-/Reparaturseiten. Der Nutzertest „latitude 7420“ lieferte in der App keine Treffer; ohne die Domain-Beschränkung erschien das offizielle Dell-Handbuch unmittelbar. Die Live-Analyse der Web-Quellen zeigte außerdem überwiegend Tests, Preisvergleiche, Angebote und markenbezogene, aber gerätefremde Artikel (z. B. Bosch-Heißluftfritteuse, E-Bike-Update, Notebookcheck-Suchseite, Sony PlayStation 2). Zusätzlich erkannte der bisherige Filter `manual`/`handbuch`/`owner's manual` nicht als Dokumentationsabsicht; `bestSearchTerm('Sony WH-1000XM4')` verkürzte auf `Sony`.
- **Optionen:** (1) Domain-Allowlist beibehalten und enger pflegen, (2) offene Websuche ohne Filter, (3) offene Websuche mit Intent- und Trust-Ranking, (4) ausschließliche Herstellersuche, (5) zusätzliche Suchanbieter.
- **Empfohlene Entscheidung:** **Option 3 — offene Websuche mit Trust-Ranking.** Im Einzelnen:
  1. **Keine `include_domains`-Allowlist als Standard.** Tavily durchsucht das offene Web; eine kleine **Denylist** entfernt reine Preisvergleichs-, Shop- und SEO-/Suchseiten.
  2. **Query-Builder:** Marke aus Produktlinie inferieren (z. B. `latitude` → Dell), Gerätename normalisieren und **deutsch + englisch** um Dokumentations- und Reparaturbegriffe ergänzen (`service manual`, `owner's manual`, `handbuch`, `bedienungsanleitung`, `Reparatur`, `teardown`).
  3. **Intent-Filter:** Dokumentationsabsicht ausdrücklich anerkennen (`manual`, `handbuch`, `service manual`, `owner's manual`, `user guide`, `schematic`, `anleitung`, `reparatur`, `teardown`, `zerlegen`).
  4. **Trust-Ranking statt Ausschluss:** positive Signale für offizielle Herstellerdomains, iFixit/Reparaturdomains, Geräte-Token in Titel/URL, Dokumentbegriffe und Tavily-Score; negative Signale für Test/Preis/Shop/Suchseiten. Nur klarer Müll wird verworfen.
  5. **Quellenhierarchie:** Offizielles Herstellerhandbuch > iFixit/Reparaturanleitung > Internet Archive > Fachartikel/Community. Das Modell erhält die Quellentypen im Prompt.
  6. **Zweite Suche nur bei Bedarf:** Liefert die offene Standardsuche weniger als zwei brauchbare Quellen, folgt eine zweite Query (Reparatur oder herstellerspezifisch). Standard bleibt **eine** Tavily-Suche pro KI-Anfrage.
  7. **Caching und UI:** Ergebnisse pro normalisierter Query cachen; in der UI Suchbegriff, Quellentyp-Badges und mehr Treffer anzeigen; Google-Fallback beibehalten.
  8. **`bestSearchTerm`-Ergänzung (zu D5):** Bleibt nur ein Token übrig, wird der Modellcode behalten; der Web-Filter wird um Dokumentationsbegriffe erweitert.
- **Begründung:**
  - Die Allowlist optimiert Precision, erzeugt aber **systematische False Negatives**: Die fachlich beste Quelle — das offizielle Herstellerhandbuch — ist konstruktiv ausgeschlossen. Der Nutzertest „latitude 7420“ belegt das unmittelbar.
  - Offene Suche allein genügt nicht: Ohne Intent- und Trust-Ranking gelangen Tests, Preisvergleiche und SEO-Seiten in den Prompt. Notwendig ist daher **Recall durch offene Suche, Precision durch Ranking** [Q10].
  - Offizielle Handbücher sind für Reparatur- und Bedienfragen die primäre Quelle; iFixit und Archiv bleiben gleichrangige Reparaturquellen. Die bisherige Einstufung „Web nur ergänzend“ bleibt für Fachartikel richtig, nicht aber für Herstellerdokumentation.
  - Eine herstellerspezifische Suche (Option 4) wäre präzise, aber nur mit einer aufwendig zu pflegenden Hersteller-/Domain-Liste möglich und würde die lange tail unbekannter Geräte nicht abdecken.
  - Der Kostenrahmen bleibt kontrollierbar: eine Tavily-Suche pro Anfrage, eine zweite nur bei schlechten Ergebnissen, Caching. Tavily bleibt der Anbieter aus D4 [Q20].
- **Verworfene Alternativen:**

| Alternative | Warum verworfen |
| --- | --- |
| **Allowlist beibehalten** | Schließt Herstellerhandbücher und offizielle Supportseiten aus; „latitude 7420“ findet das Dell-Handbuch nicht. Precision wird mit systematischen False Negatives erkauft. |
| **Offene Suche ohne Filter/Ranking** | Tests, Preisvergleiche, Shops und SEO-Seiten gelangen ungefiltert in den Prompt; die KI fasst dann Produktjournalismus statt Reparaturen zusammen. |
| **Ausschließlich Herstellersuche** | Hoher Pflegeaufwand für Hersteller-/Domain-Zuordnungen; unbekannte Marken und lange tail fallen heraus. |
| **Zusätzliche Suchanbieter** | Ändert nichts an der Query-/Ranking-Problematik, erhöht Kosten und Architekturaufwand; Tavily erfüllt den Bedarf. |
| **Nur Dokumentationsbegriffe ergänzen** | Behebt „Owner's Manual“, lässt aber die Domain-Allowlist und die fehlende Marken-Inferenz unangetastet. |

- **Konsequenzen / Grenzen:**
  - **Umsetzungsstand:** vorgeschlagen, noch nicht entschieden und nicht umgesetzt. Der Code enthält weiterhin die Allowlist; in Commit `2921d5b` (nicht deployt) liegen vorläufige Filteränderungen (strenger Web-Filter, `bestSearchTerm`-Edge-Case, Prompt-Regel 10, Query-Anzeige), die bei einer D8-Umsetzung überarbeitet werden müssen.
  - **Sicherheit:** Offene Quellen erhöhen das Prompt-Injection-Risiko. Der Systemprompt behandelt Quellentext weiterhin als Daten; Ranking und Quellenbegrenzung reduzieren, beseitigen das Risiko aber nicht.
  - **Extraktion:** Herstellerhandbücher liegen oft als PDF vor; Snippet/Content-Extraktion ist begrenzt. Die App verlinkt das Original, statt es zu reproduzieren.
  - **Recht:** Handbücher sind urheberrechtlich geschützt; zulässig ist die Verlinkung und die zusammenfassende Auswertung, nicht die Vervielfältigung.
  - **Evaluation:** Recall/Precision, Nulltrefferquote, Latenz und Tavily-Verbrauch müssen mit einem Benchmark-Set gemessen werden (siehe `EVALUATION.md` §6.4).
- **Quellen:** [Q10], [Q20].

---

# E — Methodische Entscheidungen

### E1 — Iteratives, sitzungsbasiertes Vorgehen
- **Status:** aktiv
- **Datum:** ab 2026-06-15 (durchgängig)
- **Thesis-Kapitel:** neues Kapitel „Methodisches Vorgehen" (3.x)
- **Kontext:** Projekt über mehrere Monate, mit Unterbrechungen, begrenztem Zeit- und API-Kontingent.
- **Entscheidung:** Iterativ und implementierungsgetrieben: jede Sitzung beginnt mit dem verifizierten Stand, endet mit getestetem Inkrement + Dokumentation + nächstem Plan.
- **Begründung:** Passt zu den externen Unwägbarkeiten (API-Policies, Kontingente) und macht den Fortschritt nachvollziehbar. Passt zur Dokumentationspflicht der Arbeit.
- **Verworfene Alternativen:** klassisches Wasserfall-Vorgehen — zu starr für explorative Dienstanbindung.
- **Konsequenzen / Grenzen:** **Methodische Lücke:** keine **vorgelagerte** Anforderungsanalyse; Anforderungen sind nur retrospektiv herleitbar (Kap. 3). Als solche kenntlich zu machen. Rohdaten für Evaluation parallel mitschreiben.

### E2 — Quellenhierarchie für Designfragen
- **Status:** aktiv
- **Datum:** 2026-07-23
- **Thesis-Kapitel:** neues Kapitel „Gestaltungsgrundlagen" (4.x)
- **Kontext:** Designentscheidungen sollten nicht auf Meinungen, sondern auf anerkannten Richtlinien beruhen.
- **Entscheidung:** Feste Hierarchie: (1) Apple HIG, (2) Google *Mobile App UX Principles*, (3) Google *Interactive Canvas Design*; als Basis zusätzlich das Google *Actions SDK*.
- **Begründung:** Hersteller-Guidelines sind für mobiles App-Design der anerkannte Standard; eine feste Rangfolge verhindert willkürliche Quellenwahl und macht Entscheidungen konsistent prüfbar.
- **Verworfene Alternativen:** keine feste Hierarchie — hätte zu inkonsistenten Begründungen geführt.
- **Konsequenzen / Grenzen:** Gilt für alle künftigen Designfragen; Belege siehe C2/C5.

### E3 — Fehlerdokumentation nach festem Schema
- **Status:** aktiv
- **Datum:** ab 2026-07-09 (durchgängig)
- **Thesis-Kapitel:** 7 (Evaluation/Reflexion)
- **Entscheidung:** Jeder Fehler wird als *Symptom → Diagnose → Ursache → Lösung → Erkenntnis* erfasst; die Erkenntnis wird verallgemeinert formuliert.
- **Begründung:** Die Fehlerchronik ist selbst Dokumentationsgegenstand und liefert belastbares Material für die Reflexion; verallgemeinerte Erkenntnisse sind wiederverwendbar.
- **Konsequenzen / Grenzen:** Die vollständige Fehlerliste liegt in `DOKUMENTATION.md` §9 und `PROTOKOLLE.md`; die Arbeit zitiert nur die übertragbaren Erkenntnisse.

---

## Pflegehinweis

Neue große Entscheidungen werden nach dem Schema in den passenden thematischen Abschnitt einsortiert. Wird eine frühere Entscheidung abgelöst, erhält sie den Status „abgelöst durch [Kürzel]" und bleibt als Eintrag erhalten — der historische Verlauf ist Teil der wissenschaftlichen Dokumentation.
