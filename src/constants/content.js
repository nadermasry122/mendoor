/* Statische UI-Inhalte (keine Logik) */

export const CATEGORIES = [
  { id: 'cooling', label: 'Kühlsysteme', icon: 'snowflake' },
  { id: 'screens', label: 'Bildschirme', icon: 'monitor' },
  { id: 'lamps', label: 'Lampen', icon: 'lightbulb' },
  { id: 'large', label: 'Großgeräte', icon: 'plug' },
  { id: 'small', label: 'Kleingeräte', icon: 'wrench' },
  { id: 'it', label: 'IT & Telekom', icon: 'smartphone' },
];

export const INSPIRATION = [
  { id: 'dashcam', title: 'Altes Handy als Dashcam', meta: 'DIY-Guide · 3 Schritte', icon: 'smartphone', to: 'result' },
  { id: 'homeserver', title: 'Laptop als Homeserver', meta: 'DIY-Guide · 5 Schritte', icon: 'laptop' },
  { id: 'camera', title: 'Kamera ausbauen & reuse', meta: 'DIY-Guide · 4 Schritte', icon: 'camera' },
  { id: 'battery', title: 'Vape-Akku recyceln', meta: 'Recycling-Guide', icon: 'battery' },
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
