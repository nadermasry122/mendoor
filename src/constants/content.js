/* Statische UI-Inhalte (keine Logik) */

export const CATEGORIES = [
  { id: 'cooling', label: 'Kühlsysteme', icon: 'snowflake' },
  { id: 'screens', label: 'Bildschirme', icon: 'monitor' },
  { id: 'lamps', label: 'Lampen', icon: 'lightbulb' },
  { id: 'large', label: 'Großgeräte', icon: 'plug' },
  { id: 'small', label: 'Kleingeräte', icon: 'wrench' },
  { id: 'it', label: 'IT & Telekom', icon: 'smartphone' },
];

/*
 * Kuratierte Reuse-Ideen für den Start-Screen.
 *
 * Bewusst getrennt vom Scan-Ergebnis: Inspirationen sind geräteunabhängig
 * und öffnen eine eigene Detailseite. `kind` legt das Ziel fest:
 *   guide    → lokale Detailseite (InspirationDetailScreen)
 *   external → externer Link (href)
 *   assistant→ KI-Einstieg (noch nicht implementiert)
 */
export const INSPIRATION = [
  {
    id: 'dashcam',
    kind: 'guide',
    title: 'Altes Handy als Dashcam',
    meta: 'Reuse-Guide',
    icon: 'smartphone',
    summary:
      'Ein ausrangiertes Smartphone mit intakter Kamera kann als Dashcam weiterlaufen. Es braucht vor allem eine stabile Halterung, Strom während der Fahrt und eine App mit Loop-Aufnahme.',
    needs: [
      'Smartphone mit funktionierender Kamera',
      'Stabile Halterung für die Windschutzscheibe',
      'Ladekabel und 12-V-Adapter fürs Auto',
      'Dashcam-App mit Loop-Aufnahme',
      'Ausreichend freier Speicher',
    ],
    steps: [
      {
        title: 'Gerät vorbereiten',
        text: 'Akkuzustand prüfen, nicht benötigte Konten abmelden und Daten löschen. Das Gerät sollte zuverlässig starten und die Kamera-App öffnen.',
      },
      {
        title: 'Sicher montieren',
        text: 'Die Halterung so anbringen, dass die Sicht nicht behindert wird und das Gerät bei einer Vollbremsung nicht zum Hindernis wird. Nicht in den Airbag-Bereich montieren.',
      },
      {
        title: 'Strom anschließen',
        text: 'Das Gerät während der Fahrt laden. Ein 12-V-Adapter ist praktischer als eine Powerbank; bei Hitze im Sommer auf die Akkutemperatur achten.',
      },
      {
        title: 'Aufnahme einrichten',
        text: 'In der App Loop-Aufnahme, Auflösung und Speicherbegrenzung einstellen. Eine Testaufnahme machen und den Winkel prüfen.',
      },
      {
        title: 'Rechtliches beachten',
        text: 'Aufnahmen im öffentlichen Raum können datenschutzrechtlich unzulässig sein. Vor der Nutzung die Regeln am Einsatzort klären und Aufnahmen nicht veröffentlichen.',
      },
    ],
    safety: [
      'Nicht in den Airbag-Bereich montieren.',
      'Akku nicht direkter Sonne oder großer Hitze aussetzen.',
      'Rechtliche Zulässigkeit von Dashcam-Aufnahmen vorab klären.',
    ],
    sources: [
      { label: 'iFixit – Dash Camera (Geräteübersicht)', url: 'https://www.ifixit.com/Device/Dash_Camera' },
    ],
  },
  {
    id: 'homeserver',
    kind: 'guide',
    title: 'Laptop als Homeserver',
    meta: 'Reuse-Guide',
    icon: 'laptop',
    summary:
      'Ein alter Laptop kann als Homeserver für Dateien, Backups oder Medien dienen. Vorteile: eingebauter Bildschirm, Tastatur, x86-Leistung und der Akku als kleine USV.',
    needs: [
      'Laptop mit Netzteil',
      'LAN-Kabel oder stabiles WLAN',
      'Linux-Server-Distribution (z. B. Ubuntu Server oder Debian)',
      'Optional: externe Festplatte für Backups',
    ],
    steps: [
      {
        title: 'Daten sichern und zurücksetzen',
        text: 'Persönliche Daten sichern und das Gerät vollständig neu aufsetzen. Eine Verschlüsselung der Systemplatte ist bei sensiblen Daten sinnvoll.',
      },
      {
        title: 'Server-Betriebssystem installieren',
        text: 'Ubuntu Server oder Debian installieren. Bei der Installation SSH aktivieren und unnötige Dienste weglassen.',
      },
      {
        title: 'Deckel-Logik anpassen',
        text: 'Einstellen, dass der Laptop bei geschlossenem Deckel weiterläuft. Bei vielen Distributionen geht das über systemd-logind (HandleLidSwitch=ignore).',
      },
      {
        title: 'Dienste einrichten',
        text: 'Dateifreigabe, Nextcloud oder einen Medienserver installieren. Updates automatisieren und Fernzugriff absichern.',
      },
      {
        title: 'Backup und Zugriff',
        text: 'Regelmäßige Backups auf eine externe Platte anlegen. Fernzugriff über VPN statt offener Ports; Standardpasswörter ändern.',
      },
    ],
    safety: [
      'Akku bei Alterung beobachten und das Gerät gut belüften.',
      'Keine Dienste ungeschützt aus dem Internet erreichbar machen.',
      'Backups regelmäßig testen, nicht nur anlegen.',
    ],
    sources: [
      { label: 'Ubuntu Server – Dokumentation', url: 'https://documentation.ubuntu.com/server/' },
      { label: 'Nextcloud – Admin Manual', url: 'https://docs.nextcloud.com/server/latest/admin_manual/' },
    ],
  },
  {
    id: 'camera',
    kind: 'guide',
    title: 'Kamera ausbauen & reuse',
    meta: 'Reuse-Guide',
    icon: 'camera',
    summary:
      'Kameras aus alten Smartphones, Webcams oder Überwachungskameras lassen sich oft weiterverwenden – als Webcam, Überwachungskamera oder Ersatzteil. Ob ein Modul allein nutzbar ist, hängt von Anschluss und Treibern ab.',
    needs: [
      'Altgerät mit funktionierender Kamera',
      'Passendes Kabel oder Adapter',
      'Software oder Capture-Gerät',
      'Je nach Projekt: Gehäuse und Stromversorgung',
    ],
    steps: [
      {
        title: 'Funktion prüfen',
        text: 'Testen, ob das Gerät startet und die Kamera erkannt wird. Erst danach mit dem Ausbau beginnen.',
      },
      {
        title: 'Ziel festlegen',
        text: 'Ganze Gerät als Webcam nutzen oder nur das Kameramodul ausbauen? Für Einsteiger ist die Nutzung des kompletten Geräts meist einfacher.',
      },
      {
        title: 'Ausbau vorbereiten',
        text: 'Gerät ausschalten, Akku fachgerecht entfernen oder entladen und Modul sowie Stecker fotografieren. ESD-Schutz beachten.',
      },
      {
        title: 'Anschluss prüfen',
        text: 'Prüfen, ob das Modul USB, CSI oder MIPI nutzt. Passende Adapter und Treiber recherchieren; nicht jedes Modul ist ohne Originalplatine nutzbar.',
      },
      {
        title: 'Datenschutz',
        text: 'Kamera im Netzwerk absichern, Standardpasswörter ändern und Zugriff beschränken. Aufnahmen nur mit Einverständnis betroffener Personen.',
      },
    ],
    safety: [
      'Lithium-Akkus nicht beschädigen oder kurzschließen.',
      'Scharfe Werkzeuge und empfindliche Stecker vorsichtig behandeln.',
      'Netzwerkkameras nicht ungeschützt ins Internet stellen.',
    ],
    sources: [
      { label: 'iFixit – Webcam (Geräteübersicht)', url: 'https://www.ifixit.com/Device/Webcam' },
    ],
  },
  {
    id: 'battery',
    kind: 'guide',
    title: 'Vape-Akku recyceln',
    meta: 'Sicher entsorgen',
    icon: 'battery',
    summary:
      'Vape-Akkus sind Lithium-Ionen-Zellen. Sie gehören nicht in den Hausmüll und sollten nicht geöffnet oder weiter geladen werden, wenn sie beschädigt sind.',
    needs: [
      'Defekten Vape oder Akku',
      'Klebeband zum Isolieren der Kontakte',
      'Rücknahmestelle für Batterien und Akkus',
    ],
    steps: [
      {
        title: 'Nicht öffnen',
        text: 'Den Akku nicht aus dem Gehäuse hebeln und nicht mechanisch beschädigen. Beschädigte Zellen können Feuer fangen.',
      },
      {
        title: 'Kontakte isolieren',
        text: 'Bei losen Akkus die Pole mit Klebeband abdecken, damit sie nicht kurzgeschlossen werden.',
      },
      {
        title: 'Rücknahmestelle nutzen',
        text: 'Vape und Akku bei einer Sammelstelle für Batterien und Akkus oder beim Händler abgeben. Nicht in den Hausmüll oder die gelbe Tonne.',
      },
      {
        title: 'Beschädigte Zellen melden',
        text: 'Aufgeblähte, auslaufende oder heiße Akkus nicht transportieren, sondern die Sammelstelle oder die Kommune kontaktieren.',
      },
    ],
    safety: [
      'Nicht laden, nicht öffnen, nicht ins Feuer werfen.',
      'Nicht in den Hausmüll geben.',
      'Bei Beschädigung Abstand halten und Fachpersonal informieren.',
    ],
    sources: [
      { label: 'iFixit – Battery Recycling and Fees in the EU', url: 'https://www.ifixit.com/Info/Battery_Recycling_and_Fees_in_the_EU' },
      { label: 'Batteriegesetz (BattG) – Informationen zur Rücknahme', url: 'https://www.batteriegesetz.de/' },
    ],
  },
];

// Kuratierte Reparatur-Communities. Kein Live-API-Ergebnis, sondern eine
// feste, ehrliche Liste realer Subreddits (siehe ADR D2 — Link-out statt API).
export const COMMUNITY_SUBS = [
  { name: 'fixit', desc: 'Allgemeine Reparaturfragen aller Art' },
  { name: 'mobilerepair', desc: 'Smartphones & Tablets' },
  { name: 'electronics', desc: 'Elektronik-Grundlagen & Fehlersuche' },
  { name: 'techsupport', desc: 'Technischer Support, breite Themenpalette' },
  { name: 'homelab', desc: 'Alte Geräte weiterverwenden' },
];

// Vertrauenswürdige Domains für die Web-Suche. Muss mit der serverseitigen
// Einschränkung im Worker (`TRUSTED_DOMAINS`) übereinstimmen.
export const TRUSTED_WEB_DOMAINS = [
  'computerbase.de',
  'chip.de',
  'notebookcheck.net',
  'heise.de',
  'golem.de',
  'pcwelt.de',
];

export const DEMO_DEVICE = 'iPhone 14 Pro';
