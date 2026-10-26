# mendooR — Entwicklung einer mobilen Anwendung zur Identifikation und Reparaturunterstützung von Elektroaltgeräten

**Bachelorarbeit**

> **Arbeitsstand:** 20.10.2026
> **Charakter:** Gemeinsam wachsendes Dokument. Bereits freigegebener Text (Kapitel 1–2) wurde unverändert übernommen. Abschnitte ohne Ausgangsmaterial sind als **`[LÜCKE]`** markiert und nicht mit erfundenem Inhalt gefüllt. Noch nicht abgeschlossene Vorgänge sind als **`[OFFEN]`** gekennzeichnet.
> **Konsistenzhinweis:** Zwischen frühem Konzept und späterer technischer Umsetzung bestehen dokumentierte Abweichungen (insb. Web-App statt Android); sie werden transparent ausgewiesen, nicht stillschweigend korrigiert. Die Kapitelnummerierung wurde gegenüber dem ersten Entwurf erweitert (neue Kapitel 3 „Methodisches Vorgehen" und Abschnitt 5.2 „Gestaltungsgrundlagen").

---

## Inhaltsverzeichnis

1. Einleitung
   - 1.1 Motivation und Problemstellung
   - 1.2 Zielsetzung der Arbeit
   - 1.3 Aufbau der Arbeit
2. Theoretische Grundlagen und Stand der Technik
   - 2.1 Elektroschrott und Kreislaufwirtschaft
   - 2.2 Facilitated Do-It-Yourself Repair (FDR)
   - 2.3 Grundlagen der mobilen Bildverarbeitung und OCR `[LÜCKE]`
   - 2.4 Bestehende Lösungen `[LÜCKE]`
3. Methodisches Vorgehen *(neu)*
   - 3.1 Iteratives, sitzungsbasiertes Vorgehen
   - 3.2 Quellenbasierte Entscheidungsfindung
   - 3.3 Dokumentations- und Fehlererfassungsschema
   - 3.4 Grenzen des Vorgehens
4. Analyse der Nutzeranforderungen und Szenarien *(retrospektiv rekonstruiert)*
5. Konzeption der Anwendung mendooR
   - 5.1 Systemarchitektur
   - 5.2 Gestaltungsgrundlagen *(neu)*
   - 5.3 Kamerasteuerung als Teil des UI/UX-Konzepts
   - 5.4 Informationsarchitektur
6. Entwicklung der Texterkennungs- und Klassifikationspipeline
   - 6.1 Technologieentscheidung
   - 6.2 Problem listenbasierter Klassifikation
   - 6.3 Typenschild-Klassifikator
   - 6.4 Strukturbasierte Merkmalserkennung
   - 6.5 Mehrsprachigkeit
   - 6.6 Trefferquote als leitendes Entwurfsprinzip
7. Anbindung und Bewertung externer Informationsquellen
   - 7.1 iFixit
   - 7.2 Reddit: Scheitern der API-Anbindung
   - 7.3 Internet Archive
   - 7.4 Websuche
   - 7.5 KI-gestützte Assistenzschicht
8. Evaluation `[LÜCKE]`
9. Fazit und Ausblick

---

# 1. Einleitung

## 1.1 Motivation und Problemstellung

Die gegenwärtige Lebensweise ist durch eine fortschreitende Technisierung geprägt, die zu einer stetigen Zunahme von Elektroaltgeräten im privaten und beruflichen Umfeld führt [Q1]. In privaten Haushalten findet sich oft eine Vielzahl ungenutzter Altgeräte wie Smartphones, Informationstechnik oder Haushaltsgeräte, die entweder ungenutzt gelagert oder unsachgemäß über den Hausmüll entsorgt werden [Q1]. Ein markantes Beispiel für diese Entwicklung stellen Einwegprodukte wie elektronische Zigaretten dar, die trotz technischer Funktionalität nach dem Verbrauch der Aromastoffe als Abfall entsorgt werden [Q1]. Diese Tendenz gefährdet die globale Bewohnbarkeit und erfordert neue Ansätze zur Wiederverwendung vorhandener Ressourcen [Q1].

Auf globaler Ebene wurde für das Jahr 2022 eine Gesamtmenge von 62 Milliarden Kilogramm Elektroschrott dokumentiert, was einer pro-Kopf-Menge von 7,8 Kilogramm entspricht [Q1]. Von dieser massiven Abfallmenge wurden lediglich 22,3 % offiziellen und fachgerechten Recyclingprozessen zugeführt [Q1]. Die stoffliche Zusammensetzung dieser Abfälle umfasst primär Metalle mit einem Anteil von 31 Milliarden Kilogramm, gefolgt von Kunststoffen mit 17 Milliarden Kilogramm sowie weiteren Mineralien im Umfang von 14 Milliarden Kilogramm [Q1].

Ökonomisch betrachtet repräsentiert der generierte Elektroschrott einen potenziellen Materialwert von etwa 91 Milliarden US-Dollar, wobei signifikante Anteile auf Kupfer (19 Milliarden USD), Gold (15 Milliarden USD) und Eisen (16 Milliarden USD) entfallen [Q1]. Während die theoretischen Kosten für ein umfassendes Recycling auf 37 Milliarden US-Dollar geschätzt werden, führt die unvollständige und unsachgemäße Behandlung zu massiven Umweltbelastungen durch Schadstoffe wie Blei und Quecksilber, deren externe Kosten auf 78 Milliarden US-Dollar beziffert werden [Q1]. In der Gesamtbilanz resultiert aus der aktuellen Entsorgungspraxis ein wirtschaftliches Defizit von 37 Milliarden US-Dollar durch Umwelt- und Gesundheitsschäden [Q1]. Häufig scheitert die Wiederverwendung funktionsfähiger Komponenten, wie beispielsweise die Nutzung alter Laptops als Homeserver oder Mediathek, an einem hohen Rechercheaufwand für den Endnutzer. Es besteht somit eine Diskrepanz zwischen der ökologischen Notwendigkeit einer Lebensdauerverlängerung und dem individuellen Informationszugang für Reparatur- und DIY-Projekte [Q1].

## 1.2 Zielsetzung der Arbeit

Das Ziel der vorliegenden Bachelorarbeit ist die Entwicklung einer mobilen Applikation zur automatisierten Identifizierung von Elektrogeräten, um die Wiederverwendung und das fachgerechte Recycling gezielt zu fördern [Q2]. Durch den verbesserten Zugang zu technischen Informationen soll die technologische Unabhängigkeit der Nutzer gestärkt und ein verantwortungsvoller Umgang mit Endgeräten etabliert werden [Q2]. Die Arbeit verfolgt den Ansatz, technisches Know-how so aufzubereiten, dass Anwender in die Lage versetzt werden, technologische Zusammenhänge besser zu verstehen und beispielsweise Komponenten wie Kamerasysteme für neue Einsatzzwecke zu extrahieren [Q2]. Hierbei soll das Bewusstsein dafür geschärft werden, dass die Verantwortung für nachhaltiges Handeln nicht ausschließlich bei großen Technologiekonzernen liegt, sondern durch individuelle Kompetenz gefördert werden kann [Q2].

## 1.3 Aufbau der Arbeit

Die Arbeit gliedert sich nach der Einleitung in einen theoretischen Teil, der die Grundlagen von Elektroschrott und das Konzept des Facilitated Do-It-Yourself Repair (FDR) erläutert [Q1]. Darauf folgt eine Analyse der Nutzeranforderungen sowie der relevanten Nutzungsszenarien [Q2]. Im Anschluss werden die Konzeption und das technische Design der Applikation mendooR detailliert beschrieben, gefolgt von der Dokumentation der Implementierung. Den Abschluss bilden eine systematische Evaluation der Erkennungsraten und der Nutzererfahrung sowie ein zusammenfassendes Fazit mit Ausblick auf zukünftige Entwicklungen [Q2].

> **[Konsistenzhinweis, nicht Teil des freigegebenen Originaltextes]:** Der vorstehende Absatz benannte im ursprünglichen Konzept eine „Dokumentation der Implementierung im Android-Ökosystem". Im tatsächlichen Projektverlauf wurde mendooR als browserbasierte mobile Web-Anwendung realisiert (siehe Kapitel 5 und 6), nicht als native Android-Anwendung. Diese Abweichung wird hier transparent ausgewiesen. Für die Einreichung ist zu entscheiden, ob Abschnitt 1.3 an die tatsächliche technische Umsetzung angepasst wird.

---

# 2. Theoretische Grundlagen und Stand der Technik

## 2.1 Elektroschrott und Kreislaufwirtschaft

Elektroschrott wird wissenschaftlich in sechs Hauptkategorien unterteilt, um die unterschiedlichen Anforderungen an die Abfallbehandlung abzubilden [Q1]. Hierzu zählen Wärmeüberträger wie Kühlsysteme und Wärmepumpen, Bildschirme und Monitore, Lampen sowie Großgeräte wie Waschmaschinen und Photovoltaikanlagen [Q1]. Ergänzt wird diese Systematik durch Kleingeräte sowie kleine IT- und Telekommunikationsgeräte [Q1].

Von der Definition als Elektroschrott ausgenommen sind Batterien sowie elektronische Komponenten, die fest in Fahrzeugen verbaut sind, da diese als Teil eines Gesamtsystems fungieren und nicht als eigenständige Elektrogeräte betrachtet werden [Q1]. Ebenfalls nicht inkludiert sind militärische Ausrüstungsgüter und Weltraumschrott [Q1]. Ein zentrales Problem der Kreislaufwirtschaft stellt der Export von Altgeräten in Regionen ohne ausreichende Recycling-Infrastruktur dar, was die ökologischen Risiken verschärft [Q1]. In diesem Kontext gewinnt das Konzept des Urban Mining an Bedeutung, welches die Rückgewinnung wertvoller Sekundärrohstoffe aus anthropogenen Lagern forciert [Q1].

## 2.2 Facilitated Do-It-Yourself Repair (FDR)

Das Konzept des Facilitated Do-It-Yourself Repair (FDR) beschreibt die aktive Unterstützung von Konsumenten bei der Instandsetzung ihrer Geräte durch Bereitstellung spezifischer Ressourcen [Q2]. Dieser Ansatz zielt auf eine Verlängerung der Produktlebensdauer ab, indem Hersteller oder Dienstleister den Nutzern notwendige Werkzeuge, Ersatzteile und detaillierte Anleitungen zur Verfügung stellen [Q2]. Im Sinne der Kreislaufwirtschaft wird Reparatur hierbei als ein Prozess der gemeinsamen Wertschöpfung verstanden, der die passive Rolle des Konsumenten hin zu einem aktiven Teilnehmer an der Produktlebenszyklus-Erhaltung transformiert [Q2]. Die Förderung von FDR-Maßnahmen gilt als wesentliche Strategie zur Reduzierung von Elektroschrott und zur Steigerung der Ressourceneffizienz [Q2].

## 2.3 Grundlagen der mobilen Bildverarbeitung und OCR

> **`[LÜCKE]` — kein Ausgangsmaterial vorhanden.** Dieser Abschnitt soll die allgemeinen technischen Grundlagen der optischen Zeichenerkennung (OCR) auf mobilen Endgeräten unabhängig von der in mendooR konkret gewählten Umsetzung darstellen. Vorhandenes, aber anwendungsspezifisches Material zur tatsächlich eingesetzten Technologie findet sich in Kapitel 6.1; für einen allgemeinen Grundlagenabschnitt ist eigenständige Literaturarbeit erforderlich, etwa zur Funktionsweise klassischer OCR-Pipelines (Segmentierung, Merkmalsextraktion, Klassifikation) im Unterschied zu modernen Cloud-basierten Ansätzen.

## 2.4 Bestehende Lösungen

> **`[LÜCKE]` — kein Ausgangsmaterial vorhanden.** Dieser Abschnitt soll bestehende Plattformen zur Reparaturunterstützung (insbesondere iFixit, das in mendooR als Datenquelle dient) sowie vergleichbare Anwendungen zur Geräteidentifikation analysieren und mendooR davon abgrenzen. Die technische Anbindung von iFixit ist in Kapitel 7.1 beschrieben, ersetzt jedoch keine Marktanalyse bestehender Lösungen.

---

# 3. Methodisches Vorgehen

*Dieses Kapitel wurde nachträglich als eigenständiges Kapitel aufgenommen, um die Vorgehensweise der Arbeit offenzulegen.*

## 3.1 Iteratives, sitzungsbasiertes Vorgehen

Die Entwicklung von mendooR erfolgte iterativ und implementierungsgetrieben. Jede Arbeitssitzung begann mit dem verifizierten Stand der vorangegangenen Sitzung, führte zu einem getesteten Inkrement und endete mit einer dokumentierten Planung der nächsten Schritte. Dieses Vorgehen trägt den externen Unwägbarkeiten Rechnung, die das Projekt prägten: die Abhängigkeit von Drittanbieter-Schnittstellen (siehe Kapitel 7) und begrenzte Kontingente kostenpflichtiger Dienste. Ein klassisch lineares Vorgehen hätte auf zwischenzeitliche Änderungen externer Randbedingungen (etwa die Zugriffsbeschränkungen von Reddit) nicht angemessen reagieren können.

## 3.2 Quellenbasierte Entscheidungsfindung

Technische und gestalterische Entscheidungen wurden nicht nach Plausibilität, sondern nach belegbaren Kriterien getroffen. Für Gestaltungsfragen galt eine feste Quellenhierarchie mit den Apple Human Interface Guidelines [Q14] an erster Stelle, gefolgt von den Google *Mobile App UX Principles* [Q21] und der Google *Interactive Canvas*-Gestaltungsrichtlinie. Für technische Fragen wurden Primärquellen (Herstellerdokumentation) und, wo verfügbar, wissenschaftliche Publikationen herangezogen. Jede große Entscheidung wurde mit Kontext, geprüften Optionen, verworfene Alternativen und Begründung festgehalten (`ENTSCHEIDUNGEN.md`).

## 3.3 Dokumentations- und Fehlererfassungsschema

Jedes technische Problem wurde nach einem festen Schema erfasst: *Symptom → Diagnose → Ursache → Lösung → Erkenntnis*. Die Erkenntnis wurde bewusst verallgemeinert formuliert, um über den Einzelfall hinaus in die Reflexion (Kapitel 8) einzufließen. Der Projektverlauf wurde fortlaufend protokolliert; Entscheidungen wurden zusätzlich thematisch registriert.

## 3.4 Grenzen des Vorgehens

Das implementierungsgetriebene Vorgehen bringt eine methodische Einschränkung mit sich: Es fand **keine vorgelagerte, eigenständige Anforderungsanalyse** statt. Die in Kapitel 4 zu formulierenden Nutzeranforderungen lassen sich daher nur retrospektiv aus dem entstandenen System ableiten. Diese Einschränkung wird ausdrücklich kenntlich gemacht, um den Anschein einer zum Entwicklungsbeginn durchgeführten Erhebung zu vermeiden.

---

# 4. Analyse der Nutzeranforderungen und Szenarien

## 4.1 Methodische Vorbemerkung

Dieses Kapitel ist **retrospektiv rekonstruiert**. Im Projektverlauf fand keine eigenständige, der Implementierung vorgelagerte Anforderungserhebung statt (Befragung, Interviews, Beobachtungsstudie). Die Anforderungen werden daher aus drei dokumentierten Quellen hergeleitet: aus der Problemstellung und Motivation (Kapitel 1.1), aus dem Konzept des Facilitated Do-It-Yourself Repair (Kapitel 2.2) sowie aus den während der Entwicklung und Nutzung protokollierten Beobachtungen (`EVALUATION.md` §5.3, `PROTOKOLLE.md` S4, S9, S10, S16).

Diese Offenlegung ist notwendig, um den Anschein einer vorgelagerten Erhebung zu vermeiden. Die rekonstruierten Anforderungen sind als Arbeitsgrundlage belastbar, weil jede auf eine konkrete Beobachtung oder ein belegtes Problem zurückführbar ist; sie ersetzen jedoch **keine** empirische Nutzerstudie. Eine solche bleibt als Erweiterung offen (Kapitel 8).

## 4.2 Barrieren beim Nutzer

Aus der Problemstellung (Kapitel 1.1) und dem FDR-Konzept (Kapitel 2.2) lassen sich Barrieren identifizieren, die einer Reparatur oder Wiederverwendung entgegenstehen:

- **Hoher Rechercheaufwand.** Passende Informationen zum konkreten Gerät sind über viele Quellen verstreut und müssen mühsam zusammengetragen werden. Dies ist die in Kapitel 1.1 benannte zentrale Diskrepanz zwischen ökologischer Notwendigkeit und individuellem Informationszugang [Q1].
- **Fehlende Zuordnung Gerät → Anleitung.** Dem Nutzer fehlt häufig die konkrete Modellbezeichnung, die für eine gezielte Suche erforderlich ist.
- **Fragmentierte Quellen.** Kuratierte Anleitungen, Erfahrungsberichte aus Foren, Videoanleitungen und archivierte Dokumente liegen in getrennten Systemen mit unterschiedlicher Struktur und Verlässlichkeit vor.
- **Fehlende Dokumentation für Alt- und Nischengeräte.** Für ältere oder wenig verbreitete Geräte existieren oft nur gescannte Handbücher oder keine zugängliche Dokumentation [Q2].
- **Fehlendes Wissen über Wiederverwendung.** Statt einer Zweitnutzung (etwa Laptop als Homeserver) erfolgt häufig die Entsorgung [Q1].

## 4.3 Anforderungen an die Anwendung

Die Anforderungen gliedern sich in funktionale (FA) und nicht-funktionale (NFA) Anforderungen. Jede ist auf ihre Herleitung, die zugehörige Entscheidung (`ENTSCHEIDUNGEN.md`) und das behandelnde Kapitel zurückgeführt.

### Funktionale Anforderungen

| ID | Anforderung | Hergeleitet aus | Entscheidung | Kapitel |
|---|---|---|---|---|
| FA-01 | Ein Gerät soll anhand eines Fotos seines Typenschilds automatisiert identifiziert werden. | Kap. 1.1; Bedarf nach Zuordnung Gerät → Anleitung | A2, A3, B2, B3 | 5.1, 6 |
| FA-02 | Die Identifikation muss unempfindlich gegen irrelevanten Umgebungstext sein (Verpackung, Anleitung, Untergrund). | Beobachtung: Bodenscan lieferte scheinbar „Text“ (S4, S10) | B2 | 6.2 |
| FA-03 | Typenschilder in beliebigen Beschriftungssprachen müssen verarbeitet werden können. | Anspruch weltweiter Nutzbarkeit; chinesisches Dell-Typenschild (S13) | A5, B4 | 6.1, 6.4 |
| FA-04 | Passende Reparaturanleitungen sollen angezeigt werden (Deutsch bevorzugt, Englisch als Fallback). | Kap. 1.1, 2.2 | D1 | 7.1 |
| FA-05 | Erfahrungswissen aus Community und Foren soll zugänglich gemacht werden. | Kap. 1.1 | D2 | 7.2 |
| FA-06 | Dokumentation für alte oder obsolete Geräte soll auffindbar sein. | Kap. 1.1 | D3 | 7.3 |
| FA-07 | Als weitere Quelle sollen Fachartikel über eine Websuche erschlossen werden. | Nutzerfeedback realer Nutzung (S16) | D4 | 7.4 |
| FA-08 | Wege zur Entsorgung und zur Weiterverwendung sollen aufgezeigt werden. | Kap. 1.1, 2.1 | — (offen) | 9.3 |
| FA-09 | Zuletzt gescannte Geräte sollen zugänglich sein. | UI-Konzept | — (offen: Persistenz) | 9.3 |
| FA-10 | Geräte sollen über die sechs Elektroaltgeräte-Kategorien strukturiert werden. | Kap. 2.1 | C6 (offen) | 4.5 |

### Nicht-funktionale Anforderungen

| ID | Anforderung | Hergeleitet aus | Entscheidung | Kapitel |
|---|---|---|---|---|
| NFA-01 | Geräteunabhängige Nutzbarkeit (kein App-Store, keine Plattformbindung). | Konzeptentscheidung | A1 | 5.1 |
| NFA-02 | API-Schlüssel dürfen niemals im Client erscheinen. | Sicherheitsdiskussion (S5, S6) | A3 | 5.1 |
| NFA-03 | Die Bedienung folgt anerkannten Mobile-Guidelines. | S9, S13 | E2, C2–C5 | 5.2, 5.4 |
| NFA-04 | Die Darstellung muss auf allen Bildschirmgrößen ohne horizontalen Überlauf funktionieren. | S2 | C5 | 5.3 |
| NFA-05 | Das Erkennungsergebnis muss trotz verbleibender Unsicherheit nutzbar sein (Vorschläge + Bestätigung). | Analyse der Extraktionsgrenzen | B5 | 6.5 |
| NFA-06 | Zwischen Auslöser und Ergebnis soll nur geringe Latenz liegen. | Beobachtung 2–3 s (S9) | B1 | 5.3 |
| NFA-07 | Gescannte Gerätedaten dürfen nur mit ausdrücklicher Einwilligung geteilt werden. | Diskussion geteilte Scan-Historie | — (offen) | 4.5, 9.2 |
| NFA-08 | Es dürfen keine versteckten Kosten durch Dritt-Dienste entstehen. | Diskussion API-Kontingente (S11, S13) | A2, A4, D4 | 5.1, 7.4 |
| NFA-09 | Der Ausfall einzelner Quellen darf nicht in einer Sackgasse enden (Fallbacks). | S11, S13 | D2, D4 | 7.2, 7.4 |

## 4.4 Nutzungsszenarien

Aus den Anforderungen lassen sich typische Nutzungsszenarien ableiten:

1. **Smartphone (IT & Telekom):** Ein nicht mehr genutztes Smartphone wird gescannt; der Nutzer erhält Reparaturmöglichkeiten und schätzt den Wiederverkaufswert ein.
2. **Laptop (IT & Telekom):** Ein altes Notebook wird zur Zweitnutzung als Homeserver vorgesehen; der Nutzer findet anwendungsbezogene Ideen (Inspiration) und ggf. eine Anleitung.
3. **Großgerät:** Eine defekte Waschmaschine wird gescannt; der Nutzer entscheidet zwischen Reparaturanleitung und fachgerechter Entsorgung.
4. **Obsoletes Gerät:** Für eine ältere Digitalkamera existiert keine aktuelle Anleitung; der Nutzer findet ein gescanntes Handbuch im Internet Archive.
5. **Unklares Problem:** Der Nutzer kennt den Fehler nicht; er zieht Community-Erfahrungen und Fachartikel hinzu, um die Ursache einzugrenzen.

## 4.5 Offene Anforderung: Kategorien und Datenschutz

Die funktionale Anforderung FA-10 (Strukturierung über Kategorien) ist bislang **nicht abgeschlossen**. Drei Deutungen wurden geprüft: (1) Anzeige von DIY-Projekten je Kategorie, (2) Kategorie als Scan-/Suchfilter, (3) Filterung gescannter Geräte nach Kategorie, optional kombiniert mit einer anonym geteilten Scan-Historie aller Nutzer. Deutung (2) wurde verworfen, da sie der Anordnung auf dem Startbildschirm widerspricht (siehe `ENTSCHEIDUNGEN.md` C4/C6). Die kombinierte Variante ist inhaltlich an das FDR-Konzept anschlussfähig, zieht jedoch eine Anforderung nach sich, die bislang nicht erfüllt ist: den Datenschutz (NFA-07). Sobald Daten anderer Nutzer sichtbar würden, müsste der Nutzer vorab und transparent auf die Weitergabe hingewiesen werden. Diese Abwägung ist vor der Umsetzung zu treffen.

## 4.6 Zusammenfassung des Kapitels

Die Anforderungen an mendooR speisen sich aus zwei Quellen: dem übergeordneten Problem des Elektroschrotts und der Verlängerung der Produktlebensdauer einerseits sowie den im Projektverlauf dokumentierten praktischen Beobachtungen andererseits. Als zentrale Erkenntnis der Rekonstruktion zeigt sich, dass ein großer Teil der nicht-funktionalen Anforderungen (Robustheit, Mehrsprachigkeit, Recall, Kostenfreiheit, Ausfallrobustheit) erst **aus dem Betrieb** sichtbar wurde, nicht aus der Vorüberlegung. Dies bestätigt die in Kapitel 3.4 benannte Grenze des implementierungsgetriebenen Vorgehens und begründet zugleich die Empfehlung, eine eigene Anforderungserhebung nachzuholen.

---

# 5. Konzeption der Anwendung mendooR

## 5.1 Systemarchitektur

mendooR folgt dem Standardmuster für die sichere Anbindung schlüsselpflichtiger Cloud-Dienste: Der API-Schlüssel verbleibt serverseitig und erscheint niemals im Client. Als Vermittler fungiert ein Cloudflare Worker, der die Anfragen des Browsers entgegennimmt, mit dem hinterlegten Schlüssel an den jeweiligen Dienst weiterleitet und die Antwort aufbereitet zurückgibt.

```
Browser (React-App, src/)  ──HTTPS /api/*──▶  Cloudflare Worker (functions/_worker.js)
                                          │  Secrets Store (Schlüssel)
                                          ▼
                          Google Cloud Vision · Internet Archive · Tavily
```

Die Architektur erfüllt vier Zwecke: die **Sicherheit** des Schlüssels, die kontrollierte Umgehung von CORS-Beschränkungen, die **Vorverarbeitung** der Antworten sowie die **Erweiterbarkeit** um weitere Dienste nach demselben Muster. Der Worker stellt vier Endpunkte bereit: `/api/vision` (OCR-Proxy), `/api/archive` (Internet-Archive-Suche), `/api/websearch` (Fachartikelsuche) und `/api/ping` (Health-Check). Die Auslieferung der statischen Anwendungsdateien erfolgt über dieselbe Worker-Infrastruktur; die Anwendung selbst ist eine browserbasierte mobile Web-Anwendung.

Das Frontend ist als komponentenbasierte Single-Page-Anwendung mit React umgesetzt und wird über Vite gebaut [Q25][Q26]. Die Oberfläche gliedert sich in Screens, ein gemeinsam genutztes UI-Kit sowie Hooks für querschnittliche Belange wie Kamera und Datenladen; die fachliche Logik (Klassifikation, Suchbegriffsbildung) liegt in frameworkunabhängigen Modulen. Diese Trennung erlaubt es, UI-Elemente und Funktionen wiederzuverwenden, anstatt sie — wie in der ersten Fassung — je Ansicht erneut zu implementieren.

## 5.2 Gestaltungsgrundlagen

Die Gestaltung der Benutzeroberfläche orientiert sich an den etablierten Guideline-Systemen für mobiles App-Design. Die primäre Referenz bilden die Apple Human Interface Guidelines [Q14], ergänzt um die Google-*Mobile App UX Principles* [Q21]. Diese Hierarchie wurde bewusst festgelegt, um zu verhindern, dass Gestaltungsentscheidungen auf willkürlichen Vorlieben statt auf anerkannten Interaktionsmustern beruhen. Die konkrete Anwendung dieser Grundlagen ist in den Abschnitten 5.3 und 5.4 dokumentiert.

Als verbindliche Gestaltungswerte dient ein Tokensystem aus **fünf festen UI-Farben** — Hintergrund, Fläche, Akzent sowie Primär- und Sekundärtext [Q27]. Sämtliche weiteren Töne (Rahmen, gedimmte Flächen, Überlagerungen) werden ausschließlich durch Deckkraft beziehungsweise Mischung dieser fünf Grundwerte erzeugt, sodass keine sechste Basisfarbe entsteht und die Palette zentral prüfbar bleibt. Die visuelle Anmutung orientiert sich an Discord (geschichtete Flächen, ein einziger kräftiger Akzent) und Instagram (großzügige Rundungen, klar voneinander abgesetzte Karten). Das Layout ist vollständig fluide aufgebaut und passt sich vom sehr kleinen Display bis zum Desktop an: mobil randlos, ab Tabletbreite als zentrierte, breitenbegrenzte Spalte mit mehrspaltigen Rastern, auf sehr kleinen Anzeigen mit eigenen Kompaktregeln. Auf eine nachgeahmte System-Statusleiste (Uhrzeit, Empfang, Akku) wird bewusst verzichtet, da eine Web-Anwendung diese Werte weder zuverlässig auslesen noch steuern kann und eine Attrappe lediglich falsche Informationen zeigen würde. Auch die Icons sind einfarbige Vektoren und beziehen ihre Farbe ausschließlich aus dieser Palette [Q30]; mehrfarbige Emojis werden bewusst nicht eingesetzt, da sie die Farbbegrenzung unterlaufen würden.

## 5.3 Kamerasteuerung als Teil des UI/UX-Konzepts

Die Kamera ist die zentrale Erfassungskomponente der Anwendung: Der Nutzer hält sie auf das Typenschild eines Geräts, das anschließend mittels Texterkennung identifiziert wird. Typenschilder sind häufig klein, schlecht beleuchtet oder auf reflektierenden Oberflächen angebracht; die Kamerasteuerung muss daher über einen bloßen Auslöser hinausgehen.

**Grenzen der Web-Plattform.** Vor der Umsetzung war zu klären, welche Kamerafunktionen im Browser realisierbar sind. Während native Anwendungen über plattformspezifische Schnittstellen direkt auf die Hardware zugreifen, stellt die Web-Plattform mit der *MediaDevices-API* eine abstrahierte Schnittstelle bereit, deren Funktionsumfang je nach Browser und Endgerät variiert. Tabelle 5.1 stellt die geprüften Funktionen zusammen.

| Funktion | Web-API | Verfügbarkeit |
|---|---|---|
| Kamerawechsel Front/Rück | `getUserMedia({ facingMode })` | plattformübergreifend |
| Zoom | `applyConstraints({ zoom })` | verbreitet |
| Beleuchtung (Torch) | `applyConstraints({ torch })` | geräteabhängig, nur Rückkamera |
| Tap-to-Focus | `pointsOfInterest`, `focusMode` | eingeschränkt |
| Objektivwechsel | `enumerateDevices()` | stark geräteabhängig |

Besonders relevant ist die Einschränkung beim Objektivwechsel: Während einige Android-Geräte einzelne Kameramodule als separate Eingabegeräte melden, abstrahiert iOS die Objektive und wechselt sie anhand der Zoomstufe. Ein gezieltes Ansteuern der Telelinse ist im Browser daher nicht zuverlässig möglich; der Zoom fungiert als funktionaler Ersatz.

**Adaptiver Ansatz (Capability Detection).** Anstelle einer statischen Bedienoberfläche wird nach dem Start des Kamerastreams die tatsächliche Leistungsfähigkeit des aktiven Video-Tracks über `getCapabilities()` abgefragt. Bedienelemente werden nur eingeblendet, wenn die entsprechende Funktion unterstützt wird. Dieses Vorgehen entspricht dem Prinzip des *Progressive Enhancement* und vermeidet nicht funktionsfähige Schaltflächen, die zu Bedienfehlern und Frustration führen. Der Zoom-Regler übernimmt dabei die vom Gerät gemeldeten Grenzwerte statt fest kodierter Werte. Der Scanner startet stets mit der Rückkamera, da Frontkameras typischerweise eine geringere Auflösung und einen für Nahaufnahmen ungeeigneten Fokusbereich aufweisen.

**Tap-to-Focus und Rückmeldung.** Das Antippen des Kamerabildes setzt den Fokuspunkt. Da nicht alle Geräte diese Funktion unterstützen, wird unabhängig vom Erfolg der API-Anfrage eine visuelle Rückmeldung in Form eines Fokusrings angezeigt. Der Nutzer erhält damit in jedem Fall eine Interaktionsbestätigung.

**Optimierung des Scanvorgangs.** Die anfängliche Auslöseverzögerung von zwei bis drei Sekunden wurde auf zwei Ursachen zurückgeführt. Erstens wurden drei Einzelbilder im Abstand von 400 ms aufgenommen und das schärfste ausgewählt — eine Redundanz aus der vorherigen Tesseract-Implementierung, die nach dem Wechsel zu Google Cloud Vision (Kapitel 6.1) nicht mehr erforderlich war und auf zwei Bilder im Abstand von 120 ms reduziert wurde. Zweitens wurde die Bildschärfe über die Laplace-Varianz pixelweise berechnet; da Schärfe eine großflächige Eigenschaft ist, wird sie nun über eine Stichprobe mit Schrittweite 2 geschätzt, wodurch der Rechenaufwand um etwa 75 % sinkt, ohne die Zuverlässigkeit der Schätzung messbar zu beeinträchtigen.

**Bedienoberfläche und Kontrast.** Die zunächst vertikal gestapelten Bedienelemente am rechten Bildrand wurden gemäß der Konvention nativer Kameraanwendungen auf drei Ebenen verteilt: obere Leiste (Zurück, Beleuchtung, Objektivwechsel), mittlerer Bereich (Zoom), untere Leiste (Galerie, Auslöser, Kamerawechsel). Die Farbe sekundärer Texte wurde angehoben, da der ursprüngliche Wert auf dem dunklen Hintergrund kein ausreichendes Kontrastverhältnis erreichte. Die ursprüngliche Vignettierung des Kamerabildes, die relevante Randbereiche verdeckte, wurde vollständig entfernt.

## 5.4 Informationsarchitektur

Nach dem Scan wird dem Nutzer eine Auswahl von Informationsquellen zum erkannten Gerät angeboten. Die Gliederung dieser Quellen stand zunächst zur Disposition.

**Ausgangsstruktur und ihre Schwäche.** In der ersten Umsetzung wurden die Reparaturanleitungen (iFixit) und die Community-Inhalte (Reddit) als getrennte, gleichrangige Menüpunkte dargestellt. Diese Struktur gliedert nach der *Herkunft* der Daten. Der Nutzer müsste vor dem Zugriff entscheiden, welche Datenbank seine Frage beantwortet — eine Entscheidung, die er zu diesem Zeitpunkt nicht treffen kann, da er den Inhalt beider Quellen noch nicht kennt. Für einen Vergleich beider Quellen waren vier Interaktionsschritte erforderlich.

**Nutzerabsicht als Gliederungsprinzip.** Grundlage der Revision ist der informationsarchitektonische Befund, dass sich Nutzer an Aufgaben und nicht an Systemstrukturen orientieren [Q11]. Eine Untersuchung von 77 Intranet-Informationsarchitekturen belegt, dass aufgabenbasierte Strukturen gegenüber datenquellen- bzw. organisationsbasierten Strukturen stabiler und besser erlernbar sind [Q12]. Für die oberste Navigationsebene gilt zudem, dass eine Gliederung nach Format oder Quelle zu wenig inhaltlichen Kontext liefert; auf tieferen Ebenen kann sie hingegen angemessen sein [Q13]. Die Apple Human Interface Guidelines unterscheiden entsprechend zwischen der *Tab Bar* für die app-weite Navigation und dem *Segmented Control* für den Wechsel zwischen verwandten Ansichten innerhalb eines bestehenden Kontexts [Q14]. Material Design 3 präzisiert den Einsatzbereich von Tabs: Sie gruppieren verwandte Inhalte derselben Hierarchieebene, die klar voneinander unterscheidbar sind [Q15].

**Gewählte Umsetzung.** Reparaturanleitungen und Community-Inhalte wurden zu einem gemeinsamen inhaltlichen Bereich zusammengeführt und als Reiter beziehungsweise segmentierte Ansicht innerhalb des Ergebnisbereichs dargestellt. Der Vergleichspfad reduziert sich damit auf einen einzigen Bildschirm. Der reale Qualitätsunterschied zwischen kuratierten Anleitungen und Erfahrungsberichten wird nicht auf Navigationsebene, sondern durch unterschiedliche Kartengestaltung abgebildet. Die Trefferanzahl wird am Reiter angezeigt, damit der Nutzer vor einem Wechsel erkennt, ob die andere Quelle Ergebnisse liefert.

**Progressive Offenlegung.** Zur Einbindung weiterer Quellen (Community, Archiv, Websuche) wurden *Disclosure Controls* nach dem Apple-Muster eingesetzt: Die Menüeinträge klappen ihre Inhalte an Ort und Stelle auf, wobei stets nur ein Bereich geöffnet ist. Dadurch bleibt die Menüliste kompakt, und redundante, doppelt vorhandene Einträge werden vermieden. Diese Lösung entspricht der von der Quelle als angemessen bezeichneten quellenbasierten Untergliederung auf einer tieferen Ebene.

**Anordnung auf dem Startbildschirm.** Auf dem Startbildschirm wurde die Kamera über die Gerätekategorien gesetzt. Die ursprüngliche Anordnung (Kategorien über dem Scanner) konnte den Eindruck erwecken, die Kategorien beeinflussten den Scanvorgang. Die primäre Aktion — das Scannen — muss ohne Fehlinterpretation zugänglich sein; die Kategorien sind eine nachgelagerte Auswahl.

# 6. Entwicklung der Texterkennungs- und Klassifikationspipeline

## 6.1 Technologieentscheidung

Die erste Umsetzung nutzte die clientseitige Bibliothek Tesseract zur Texterkennung. Auf realen Kamerabildern führte dies zu Fehlerkennungen (etwa von Bodenstrukturen als Text), da Tesseract darauf ausgelegt ist, in einem Bild an jeder Stelle nach Text zu suchen, und für kontrollierte Dokumentenscans bei definierter Beleuchtung und definiertem Kontrast entwickelt wurde [Q3]. Aufgrund der geräteunabhängigen Web-Architektur der Anwendung (Kapitel 5.1) wurde die native Google-ML-Kit-Alternative verworfen, da sie die Architektur gebrochen hätte. Gewählt wurde die **Google Cloud Vision API** mit dem Modus `DOCUMENT_TEXT_DETECTION`, angesprochen über den Worker-Proxy.

Die Wahl stützt sich auf empirische Vergleichsstudien: Bei der Erkennung von Kfz-Zulassungsdokumenten erzielte Google Cloud Vision eine Genauigkeit von 84,43 % gegenüber 47,02 % bei Tesseract [Q5]. Eine Untersuchung zu Kamerabildern unter variierenden Aufnahmebedingungen bestätigt diesen Befund mit einer mittleren Zeichengenauigkeit von 96,7 % für Google Vision gegenüber 38,0 % für Tesseract bei zugleich deutlich geringerer Varianz [Q6]. Ein Benchmark mit über 18.000 Dokumenten zeigt, dass serverbasierte Systeme ihre Überlegenheit insbesondere bei verrauschten Eingaben systematisch vergrößern [Q7]. Das Freikontingent der API von 1.000 Anfragen pro Monat ist für den Demonstrationsbetrieb der Arbeit ausreichend.

Ein früher Implementierungsstand schränkte die Erkennung über `languageHints` auf eine feste Sprachliste ein. Nach Prüfung der Herstellerdokumentation wurde diese Einschränkung als methodisch falsch erkannt und zurückgenommen: Die offizielle Dokumentation stellt fest, dass ein leerer Wert in den meisten Fällen die besten Ergebnisse liefert, da er die automatische Spracherkennung aktiviert; der hier verwendete Endpunkt erkennt das vollständige Spektrum unterstützter Sprachen selbst, während ein falscher oder unvollständiger Sprachhinweis die Erkennung beeinträchtigen kann [Q8]. Für eine Anwendung, die beliebige Elektrogeräte unabhängig von Herkunftsland und Beschriftungssprache identifizieren soll, ist die automatische Erkennung die einzig konsistente Lösung.

## 6.2 Problem listenbasierter Klassifikation

Die von Cloud Vision zurückgegebenen Texte enthalten neben der eigentlichen Typenschild-Information regelmäßig Fließtext aus Verpackungsaufdrucken, Sicherheitshinweisen und Bedienungsanleitungen. Da eine Filterung über den von der API gelieferten Konfidenzwert wirkungslos ist — auch korrekt erkannter Fließtext erreicht hohe Konfidenzwerte —, wurde eine eigene Klassifikationslogik implementiert, die Typenschild-Inhalte anhand struktureller Merkmale von Fließtext unterscheidet.

Die Klassifikation gliedert sich in zwei Stufen. Die erste Stufe (`isProseLine`) prüft jede Zeile auf Fließtext-Indikatoren und verwirft Zeilen mit hohem Funktionswortanteil, mit mehr als neun Wörtern ohne nennenswerten Ziffernanteil sowie mit satzabschließender Interpunktion. Die zweite Stufe (`typePlateScore`) bewertet die verbleibenden Zeilen mit einem Punktesystem (Tabelle 6.1); nur Zeilen mit mindestens zwei Punkten werden weiterverarbeitet.

| Indikator | Punkte |
|---|---|
| Kennzeichnungslabel (`Model:`, `Typ:`, `S/N`, `P/N`, `FCC ID`, `IMEI`) | 4 |
| Herstellername (Markenliste) | 3 |
| Technische Angabe (`230V`, `50Hz`, `2300W`, `5V ⎓ 2.0A`) | 2 |
| Alphanumerisches Codemuster | 2 |
| Kurze Versalienzeile | 1 |
| Ziffernanteil über 15 % | 1 |
| Maximal fünf Wörter | 1 |

*Tabelle 6.1: Bewertungsindikatoren des Typenschild-Klassifikators.*

Die Unterscheidung beruht auf einer systematischen Regelmäßigkeit: Typenschilder weisen kurze Zeilen, hohen Ziffernanteil, normierte Kennzeichnungslabels und standardisierte Angaben elektrischer Parameter auf, während Fließtext durch lange Zeilen, hohen Funktionswortanteil und geringen Ziffernanteil gekennzeichnet ist. Diese Regelmäßigkeit resultiert aus regulatorischen Kennzeichnungspflichten und ist damit ein verlässliches Klassifikationsmerkmal.

Die Validierung anhand realitätsnaher Testfälle bestätigt das Verfahren: Ein Samsung-Verpackungsetikett liefert die Modellnummer, eine Apple-Geräterückseite das Modellkürzel, ein Typenschild mit begleitendem Anleitungstext dessen ungeachtet nur die Typenschild-Zeilen, und ein reiner Beipackzettel erzeugt keine Kandidaten.

## 6.3 Strukturbasierte Merkmalserkennung

Die Extraktion eines konkreten Suchbegriffs aus dem klassifizierten Text bildete zunächst das Kernproblem des Projekts und führte zu einer grundlegenden methodischen Neuausrichtung.

**Ausgangsarchitektur.** Die ursprüngliche Extraktionslogik kombinierte zwei Mechanismen: eine Liste bekannter Herstellermarken (`KNOWN_BRANDS`), gegen die jede Zeile abgeglichen wurde, und eine Sammlung regulärer Ausdrücke, die jeweils eine spezifische, bereits beobachtete Modellcode-Form abbildeten (beispielsweise für Codes der Form „SM-G991B").

**Identifiziertes Strukturproblem.** Bei der Erweiterung der Testfälle um ein Gerät der Produktlinie „Dell Latitude" zeigte sich, dass die Modellbezeichnung „Latitude 7421" trotz erfolgreicher Texterkennung nicht als Kandidat vorgeschlagen wurde. Die Ursachenanalyse ergab zwei unabhängige Lücken: Erstens war die Produktlinie „Latitude" nicht in der Markenliste enthalten, die lediglich den Oberbegriff „Dell" kannte. Zweitens erforderten sämtliche regulären Ausdrücke eine unmittelbare, leerzeichenfreie Abfolge von Buchstaben und Ziffern — ein Format wie „Latitude 7421", bei dem ein großgeschriebenes Wort durch ein Leerzeichen von der folgenden Zahl getrennt ist, wurde von keinem der Muster erfasst.

Dieser Einzelfall verweist auf ein allgemeineres Problem. In der Forschung zur Eigennamenerkennung werden Listen bekannter Entitäten als *Gazetteers* bezeichnet. Nadeau und Sekine stellen fest, dass Systeme zur Entitätserkennung historisch mit handgefertigten Regeln begannen, bevor sich generalisierbarere, lernbasierte Ansätze durchsetzten [Q9]. Der grundlegende Nachteil listenbasierter Verfahren liegt darin, dass sie strukturell nur bereits bekannte Entitäten abdecken: Jede neue, nicht gelistete Instanz führt zu einem Erkennungsausfall, unabhängig davon, wie viele Einträge die Liste bereits enthält. Da die Menge weltweit existierender Hersteller und Produktlinien offen ist, kann eine solche Liste denknotwendig nie vollständig sein. Dasselbe Argument gilt für die Sammlung formatspezifischer regulärer Ausdrücke.

**Neugestaltung: drei strukturelle Regeln.** Aus dieser Analyse ergab sich der Wechsel von einer *aufzählenden* zu einer *strukturellen* Erkennungslogik. Drei Regeln ersetzen die Enumeration:

1. **Regel 1 — Explizite Kennzeichnung.** Eine Zeile mit einer anerkannten Kennzeichnungsangabe („Model:", „Typ:", „P/N:", „MTM:") gefolgt von einem alphanumerischen Token liefert das stärkste Signal, unabhängig von Marke und Codeformat.
2. **Regel 2 — Alphanumerische Mischung.** Jedes Token, das Buchstaben und Ziffern in beliebiger Anordnung kombiniert, wird als potenzielle Modellkennung gewertet. Diese Regel beruht auf der Beobachtung, dass gewöhnliche Wörter in praktisch allen Sprachen keine Ziffern in ihre Buchstabenfolge einbetten, Modellcodes dies hingegen systematisch tun. Eine einzelne strukturelle Prüfung ersetzt die zuvor separat kodierten, formatspezifischen Ausdrücke.
3. **Regel 3 — Produktname-Zahl-Konvention.** Ein großgeschriebenes Wort (optional gefolgt von einem zweiten), dem unmittelbar eine Zahl folgt, wird als Produktlinienbezeichnung gewertet. Diese Regel bildet das Muster ab, das im Anlassfall („Latitude 7421") zum Ausfall führte.

Die ursprüngliche Markenliste wurde nicht entfernt, ihre Funktion jedoch verändert: Sie dient nicht mehr als Voraussetzung, sondern ausschließlich als zusätzlicher Bewertungsbonus.

Eine notwendige Einschränkung betrifft elektrische Kennwerte: Angaben wie „220–240V" oder „50/60Hz" erfüllen die Misch-Regel, beschreiben jedoch eine Betriebsspannung oder Frequenz, nicht die Gerätekennung. Sie werden über ein ergänzendes Ausschlussmuster von der Kandidatenliste ausgenommen.

**Validierung.** Die überarbeitete Logik wurde gegen einen Testkorpus geprüft, der sowohl die ursprünglich beobachteten Fälle (Regressionskontrolle) als auch neu konstruierte Fälle mit nicht gelisteten Marken und zuvor nicht kodierten Codeformaten enthielt (Tabelle 6.2).

| Testfall | Vor der Überarbeitung | Nach der Überarbeitung |
|---|---|---|
| „Latitude 7421" (ungelistete Produktlinie) | kein Kandidat | „Latitude 7421" |
| „SM-A115A1L" (bekanntes Format) | „SM-A115A1L" | „SM-A115A1L" (unverändert) |
| Fiktive Marke mit Code „7B4XK21Q" | kein Kandidat | „7B4XK21Q" |
| „220–240V ~ 50Hz" (elektrische Kennwerte) | nicht betroffen | korrekt ausgeschlossen |
| Reiner Fließtext ohne Kennzeichnung | leere Kandidatenliste | leere Kandidatenliste (unverändert) |

*Tabelle 6.2: Validierung der strukturbasierten Extraktion.*

Die Validierung bestätigt zweierlei: Es traten keine Regressionen bei den ursprünglich funktionierenden Fällen auf, und sowohl der auslösende Fehlerfall als auch ein synthetisch konstruierter, im Entwicklungsprozess nie beobachteter Fall wurden korrekt gelöst. Dies ist ein Hinweis darauf, dass die neue Logik tatsächlich strukturell generalisiert, statt lediglich um einen weiteren Einzelfall ergänzt worden zu sein.

## 6.4 Mehrsprachigkeit

Die Zielsetzung einer weltweit einsetzbaren Anwendung verlangt, dass Typenschilder in beliebiger Beschriftungssprache verarbeitet werden können. Zwei Aspekte waren hierfür zu berücksichtigen.

Auf Ebene der Texterkennung wurde die Sprachbeschränkung entfernt und die automatische Erkennung aktiviert (Kapitel 6.1). Auf Ebene der Klassifikation ergab sich ein eigenständiges Problem: Die Prosa-Erkennung `isProseLine` zählte Wörter durch Trennung an Leerzeichen. Die chinesische, japanische, koreanische und thailändische Schrift trennen Wörter jedoch nicht durch Leerzeichen, sodass ein vollständiger Satz fälschlich als ein einziges Wort gezählt und vom Prosa-Filter nicht erfasst wurde. Für Schriftsysteme ohne Leerzeichen-Worttrennung wird daher eine gesonderte, auf Zeichenlänge und Ziffernanteil basierende Heuristik verwendet. Diese Anpassung wurde im Projektverlauf ergänzt, nachdem der ursprüngliche, ausschließlich leerzeichenbasierte Mechanismus an einem chinesisch beschrifteten Gerät als unzureichend erkannt worden war.

Die dritte Extrahierungsregel (Produktname-Zahl-Konvention) setzt eine lateinische Großschreibungskonvention voraus und ist auf Schriftsysteme ohne vergleichbare Groß-/Kleinschreibung nicht direkt anwendbar. Da Modellkennungen international jedoch nahezu durchgängig in lateinischer alphanumerischer Form angegeben werden — auch auf Typenschildern in nicht-lateinischer Beschriftungssprache —, wird dieser Umstand als vertretbare Einschränkung bewertet: Die für die Weiterverarbeitung relevante Information bleibt in aller Regel erfassbar.

## 6.5 Trefferquote als leitendes Entwurfsprinzip

Der Neugestaltung liegt eine bewusste Priorisierung von Trefferquote (Recall) gegenüber der Rangfolgegenauigkeit (Precision) zugrunde. Recall bezeichnet den Anteil der tatsächlich relevanten Elemente, die ein System auffindet; Precision den Anteil der vorgeschlagenen Elemente, die tatsächlich relevant sind; zwischen beiden besteht in der Regel ein Zielkonflikt [Q10].

Für mendooR wurde bewusst zugunsten von Recall entschieden: Die Extraktionslogik liefert mehrere plausible Kandidaten, statt in jedem Fall exakt einen korrekten Vorschlag mit maximaler Sicherheit zu bestimmen. Die Anwendung stellt die Kandidaten als antippbare Vorschläge neben dem vollständigen Rohtext und einem Freitextfeld dar; die abschließende Bestätigung obliegt dem Nutzer. Diese Architekturentscheidung ist inhaltlich damit begründet, dass ein automatisiertes System, das aus beliebigem Text in beliebiger Sprache exakt einen korrekten Kandidaten mit hoher Sicherheit bestimmt, keine realistische Zielsetzung darstellt; ein System hingegen, das den korrekten Kandidaten zuverlässig in eine überschaubare Vorschlagsmenge aufnimmt und die endgültige Entscheidung dem Menschen überlässt, ist erreichbar und für den vorliegenden Anwendungsfall ausreichend.

Die verbleibende Unsicherheit automatisierter Erkennung wird damit nicht beseitigt, sondern durch die Systemarchitektur — die Einbindung des Nutzers — abgefangen. Mustererkennung auf beliebigem Text in beliebigen Sprachen bleibt ein grundsätzlich unvollständig lösbares Problem; die drei strukturellen Regeln erhöhen die Generalisierbarkeit gegenüber dem vorherigen listenbasierten Ansatz nachweislich, heben die grundsätzliche Unsicherheit jedoch nicht auf.

---

# 7. Anbindung und Bewertung externer Informationsquellen

## 7.1 iFixit

Als primäre Quelle für Reparaturanleitungen dient die öffentliche API der Platform iFixit. Die Anwendung sucht Anleitungen zum erkannten Gerät und stellt sie als Liste mit Vorschaubild und Schwierigkeitsgrad dar; die Detailansicht zeigt Werkzeugliste und Schritte. Die Ausgabe wird bevorzugt auf Deutsch geladen und bei Fehlen auf die Quellsprache (in der Regel Englisch) zurückgegriffen. Die Suche nutzt eine Kaskade von spezifisch nach breit (vom vollständigen Gerätenamen über Produktlinie und Marke bis zur Modellnummer), wobei der erste Schritt mit Treffern verwendet wird. Die Beschränkung auf eine einzige Quelle deckt jedoch insbesondere ältere und weniger verbreitete Geräte unzureichend ab; daraus erwuchs die Erweiterung um die in den folgenden Abschnitten beschriebenen Quellen.

## 7.2 Reddit: Scheitern der API-Anbindung

Die zunächst vorgesehene Anbindung der öffentlichen Reddit-Schnittstelle lieferte konsistent den HTTP-Status 403 Forbidden. Die Ursachenanalyse ergab eine **architekturbedingte, nicht durch Codeänderungen behebbare** Ursache: Reddit verlangt für Zugriffe aus IP-Adressbereichen von Hosting-Anbietern ein gültiges OAuth-Token, während unauthentifizierter Zugriff aus solchen Bereichen unabhängig von der Korrektheit der Anfrage abgelehnt wird [Q16]. Da der Cloudflare Worker auf Rechenzentrums-Infrastruktur ausgeführt wird, war die Anfrage von dieser Regelung betroffen.

Der Versuch, einen regulären OAuth-Zugang zu registrieren, führte nicht zur Ausstellung von Zugangsdaten, sondern zu einem Verweis auf die *Responsible Builder Policy* von Reddit [Q17], mit der das Unternehmen die Selbstregistrierung für API-Zugänge eingestellt hat. Als Umwege geprüfte Optionen wurden verworfen: Die Nutzung archivierter Reddit-Seiten über die Wayback Machine scheitert daran, dass Reddit das Internet Archive gezielt von der Indexierung der Beitragsseiten ausgeschlossen hat [Q18]; die Extraktion von Metadaten einzelner Beitragsseiten setzte denselben blockierten Zugriffsweg voraus und widerspräche zudem der Nutzungsordnung.

Als Lösung wurde eine **Verlinkung statt Einbettung** umgesetzt: Die Anwendung zeigt eine horizontal scrollbare Reihe realer, kuratierter Subreddits mit kurzer Beschreibung; jede Karte öffnet eine auf den jeweiligen Subreddit eingegrenzte Suchanfrage zum erkannten Gerät. Es werden keine Beitragsinhalte, Nutzerzahlen oder sonstige Daten simuliert.

## 7.3 Internet Archive

Als eigenständige Quelle für ältere oder nicht mehr im Handel befindliche Geräte wurde die Suche nach gescannten Bedienungsanleitungen über das Internet Archive ergänzt. Die technische und rechtliche Ausgangslage unterscheidet sich grundlegend von der Reddit-Situation: Das Internet Archive stellt mit der Advanced Search API eine offen dokumentierte, authentifizierungsfreie Schnittstelle bereit, deren Nutzung für Suchzwecke ausdrücklich vorgesehen ist [Q19]. Die Schnittstelle unterstützt keine Cross-Origin-Anfragen aus dem Browser, weshalb die Anbindung über den bestehenden Worker erfolgt — diese Notwendigkeit ergibt sich aus einer allgemeinen Browser-Sicherheitsbeschränkung, nicht aus einer Zugriffsbeschränkung seitens des Internet Archive.

Die Suche beschränkt sich serverseitig auf den Medientyp „texts" und liefert Identifier, Titel, Erscheinungsjahr sowie eine Vorschau; gefundene Dokumente werden als Kartenliste mit Verweis auf die Archiv-Detailseite dargestellt.

## 7.4 Websuche

Als dritte Erweiterung wurde eine Websuche nach Fachartikeln ergänzt. Die Auswahl des Suchdienstes war durch externe Randbedingungen bestimmt: Die Google Custom Search JSON API ist für Neukunden geschlossen und wird zum 1. Januar 2027 abgeschaltet; der Nachfolger Vertex AI Search berechnet ab der ersten Anfrage ohne Freikontingent; öffentliche Instanzen von SearXNG blockierten die JSON-API mit dem Status 403. Gewählt wurde der Dienst Tavily, dessen Freikontingent monatlich erneuert wird und keine Kreditkartenangabe im Anmeldeprozess erfordert, sodass das Projekt nicht unerwartet Kosten verursachen kann [Q20]. Die Ergebnisse werden serverseitig auf eine kuratierte Liste deutschsprachiger Technik- und Reparaturseiten beschränkt. Ist der Dienst nicht erreichbar oder liefert keine Ergebnisse, wird als Rückfallebene eine auf dieselben Domains eingeschränkte Google-Suche verlinkt.

**Suchbegriffsbildung.** Sowohl für die Community- als auch für die Archiv- und Websuche wird der Suchbegriff aus dem erkannten Gerätenamen abgeleitet, wobei interne Herstellercodes (lange Zeichenketten aus Buchstaben und Ziffern, etwa „WAT28401") entfernt werden, kurze Kennungen und Zahlen hingegen erhalten bleiben. Diese Regel verhindert eine unnötige Einschränkung der Treffermenge: Interne Modellcodes treten in informellen Forenbeiträgen selten wörtlich auf, während Produktnamen und Jahreszahlen tatsächlich gesucht werden.

## 7.5 KI-gestützte Assistenzschicht

Die bisherigen Quellen liefern einzelne Treffer, aber keine zusammenhängende, quellenbelegte Einschätzung. Eine freie Generierung durch ein Sprachmodell würde diesem Anspruch widersprechen, weil sie Fakten erfinden kann. Deshalb wurde die Assistenz als **Retrieval-Augmented Generation (RAG)** umgesetzt: Das Modell erhält ausschließlich zuvor abgerufene Quellen und soll seine Aussagen mit Quellenangaben belegen [Q46], [Q48].

**Architektur.** Der Browser sendet nur den Gerätekontext an den Endpunkt `/api/ai`. Der Cloudflare Worker ruft iFixit, Internet Archive und Tavily parallel ab, normalisiert und begrenzt die Treffer auf maximal zwölf Quellen, dedupliziert sie und baut daraus einen Prompt mit nummerierten Quellen. Erst danach wird Cloudflare Workers AI über das Binding `AI` aufgerufen [Q32], [Q34]. Verwendet wird `gpt-oss-20b` (Apache-2.0 [Q51]) mit niedrigem Reasoning-Level, einer Ausgabegrenze von 800 Token und niedriger Temperatur. Die Antwort wird zusammen mit der Quellenliste an den Client zurückgegeben und in einem optionalen, eingeklappten KI-Eintrag auf dem Ergebnis-Screen dargestellt; die Quellen sind dort verlinkt.

**Fallback und Grenzen.** Ohne Quellen wird keine generative Antwort erzeugt. Fällt eine Quelle aus, werden die übrigen genutzt; fällt die KI aus oder überschreitet sie das Timeout, bleiben die bestehenden Quellenlisten nutzbar. Die KI ist damit eine optionale Verdichtung, keine Voraussetzung für den Kernablauf. Der Eintrag wird bewusst manuell geöffnet und ausgelöst, um Neurons-Kosten und Latenz zu kontrollieren; das freie Kontingent von 10.000 Neurons pro Tag bleibt so planbar [Q32], [Q38].

**Warum serverseitig?** Die Zielgruppe sind alte und obsolete Geräte. Eine lokale Ausführung im Browser würde genau diese Geräte ausschließen: Sie setzt WebGPU, mehrere hundert Megabyte bis Gigabyte Modell-Download, zusätzlichen Arbeitsspeicher und Akkuleistung voraus; mobil sind überwiegend kleine Modelle realistisch, und Function Calling ist in WebLLM noch nicht ausgereift [Q40], [Q42]. Zudem benötigt die Anwendung ohnehin eine Netzverbindung für OCR und Quellen; ein lokales Modell würde den Offline-Vorteil daher kaum einlösen. Die serverseitige Variante hält den Client dünn und die Modellversion einheitlich. Cloudflare verarbeitet Standard-Inferenzen ohne dauerhafte Speicherung und trainiert nicht mit Kundendaten [Q37]; eine datenschutzrechtliche Prüfung bleibt dennoch erforderlich.

**Offene Punkte.** Deutsche Sprachqualität, Fakten-Treue und Quellenabdeckung sind noch nicht systematisch gemessen. Prompt-Injection aus fremden Quellen wird durch Delimiting und Systemregeln reduziert, aber nicht beseitigt. Caching, Streaming und Tool-Calling sind bewusst noch nicht umgesetzt. Der Messaufbau für diese Punkte ist in Kapitel 8 und in `EVALUATION.md` beschrieben.

---

# 8. Evaluation

> **`[LÜCKE]` — noch nicht durchgeführt.** Aus der Dokumentation ergibt sich eine **mehrdimensionale Messgröße**: (1) die reine Zeichenerkennungsrate der OCR-Engine, (2) die Rate korrekt extrahierter Modellbezeichnungen und (3) die Qualität der KI-Assistenz. Vorgesehen ist ein Testdatensatz aus Typenschildern der sechs Elektroaltgeräte-Kategorien unter variierenden Aufnahmebedingungen (Beleuchtung, Winkel, Distanz, Oberfläche). Der Aufbau dieses Datensatzes soll parallel zur weiteren Entwicklung erfolgen; jedes ohnehin gescannte Typenschild wird fotografiert und mit dem tatsächlichen Modell annotiert. Ergänzend sind die Trefferquote der Anleitungssuche und eine Nutzerbefragung zum FDR-Potenzial zu erheben.
>
> Für die KI-Assistenz ist ein zusätzlicher Messaufbau vorgesehen: Quellenabdeckung, Fakten-Treue, deutsche Sprachqualität, Latenz und Neurons pro Anfrage an 20–30 realen Scans; geplant ist auch ein Modellvergleich zwischen `gpt-oss-20b`, Qwen3-30B-A3B und Llama 3.1 8B als Baseline. Die Ergebnisse stehen noch aus; der Aufbau ist in `EVALUATION.md` §6 dokumentiert.

---

# 9. Fazit und Ausblick

## 9.1 Zusammenfassung der Ergebnisse

> **`[OFFEN]` — zusammenfassend zu ergänzen, sobald die offenen Kapitel 4 und 8 vorliegen.**

## 9.2 Limitationen

> **`[OFFEN]`** Zu benennen sind insbesondere: die Abhängigkeit von externen Cloud-Diensten und deren Kontingenten und Richtlinien; die strukturelle Einschränkung des Browserzugriffs auf die Kamera (Capability Detection als Kompensation, siehe 5.3); die verbleibende Unsicherheit automatisierter Mustererkennung (6.5); die fehlende vorgelagerte Anforderungsanalyse (Kapitel 3.4 / 4) sowie die bislang ausgebliebene systematische Evaluation (Kapitel 8).

## 9.3 Zukünftige Erweiterungen

Vorgesehen sind unter anderem: die funktionale Ausgestaltung der sechs Gerätekategorien (derzeit offen, mit Datenschutzabwägung bei anonym geteilter Scan-Historie); die inhaltliche Vertiefung der Bereiche technische Daten, gerätebezogene Materialzusammensetzung und Entsorgung; die persistente Speicherung gescannter Geräte; eine Videoanleitungs-Anbindung; sowie ein manueller Sprachumschalter. Die Reddit-Anbindung bleibt als Option bestehen, ist jedoch an ein ungewisses Freigabeverfahren gebunden.

Die in Abschnitt 7.5 beschriebene KI-Assistenz ist in den Stufen 1 und 2 umgesetzt (RAG-Retrieval und Workers-AI-Synthese). Offen bleiben Tool-Calling, Caching/Streaming sowie die systematische Evaluation von deutscher Sprachqualität, Fakten-Treue und Quellenabdeckung (Kapitel 8).

---

# Quellenverzeichnis

Die vollständigen Literaturangaben werden zentral in `QUELLEN.md` geführt (stabile Schlüssel `[Qn]`). Alle Verweise im Text dieses Dokuments verwenden diese Schlüssel. Die endgültige, fortlaufend nummerierte Quellenliste der Arbeit `[1]…[n]` wird bei der Abgabe aus `QUELLEN.md` erzeugt (siehe dort, Abschnitt „Zuordnungsregel für die Abgabe").

---

*Hinweis: Dieses Dokument führt das freigegebene Ausgangsmaterial mit dem im Projektverlauf entstandenen technischen Material zusammen. Offene Kapitel (2.3, 2.4, 4, 8) sind ehrlich als Lücke markiert. Die Quellenverweise folgen stabilen Schlüsseln `[Qn]` (Master: `QUELLEN.md`).*
