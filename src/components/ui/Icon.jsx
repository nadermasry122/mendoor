import { House } from '@phosphor-icons/react/dist/csr/House';
import { Scan } from '@phosphor-icons/react/dist/csr/Scan';
import { User } from '@phosphor-icons/react/dist/csr/User';
import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { Lightning } from '@phosphor-icons/react/dist/csr/Lightning';
import { Aperture } from '@phosphor-icons/react/dist/csr/Aperture';
import { Image } from '@phosphor-icons/react/dist/csr/Image';
import { ArrowsClockwise } from '@phosphor-icons/react/dist/csr/ArrowsClockwise';
import { ArrowSquareOut } from '@phosphor-icons/react/dist/csr/ArrowSquareOut';
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight';
import { Info } from '@phosphor-icons/react/dist/csr/Info';
import { Snowflake } from '@phosphor-icons/react/dist/csr/Snowflake';
import { Monitor } from '@phosphor-icons/react/dist/csr/Monitor';
import { Lightbulb } from '@phosphor-icons/react/dist/csr/Lightbulb';
import { Plug } from '@phosphor-icons/react/dist/csr/Plug';
import { Wrench } from '@phosphor-icons/react/dist/csr/Wrench';
import { DeviceMobile } from '@phosphor-icons/react/dist/csr/DeviceMobile';
import { Laptop } from '@phosphor-icons/react/dist/csr/Laptop';
import { Camera } from '@phosphor-icons/react/dist/csr/Camera';
import { BatteryCharging } from '@phosphor-icons/react/dist/csr/BatteryCharging';
import { ClipboardText } from '@phosphor-icons/react/dist/csr/ClipboardText';
import { Flask } from '@phosphor-icons/react/dist/csr/Flask';
import { ChatCircle } from '@phosphor-icons/react/dist/csr/ChatCircle';
import { FileText } from '@phosphor-icons/react/dist/csr/FileText';
import { Globe } from '@phosphor-icons/react/dist/csr/Globe';
import { Recycle } from '@phosphor-icons/react/dist/csr/Recycle';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { WifiSlash } from '@phosphor-icons/react/dist/csr/WifiSlash';
import { Broadcast } from '@phosphor-icons/react/dist/csr/Broadcast';
import { Clock } from '@phosphor-icons/react/dist/csr/Clock';
import { Bug } from '@phosphor-icons/react/dist/csr/Bug';
import { Keyboard } from '@phosphor-icons/react/dist/csr/Keyboard';
import { Sparkle } from '@phosphor-icons/react/dist/csr/Sparkle';

/*
 * Zentrale Icon-Fassade (ADR C10): semantischer Name → Phosphor-Komponente.
 *
 * Alle Icons sind einfarbig, erben ihre Farbe über `currentColor` aus der
 * jeweiligen Komponente und bleiben damit innerhalb der Farbpalette (C10).
 *
 * Gewicht statt Linienstärke: Phosphor kennt die Gewichte thin | light |
 * regular | bold | fill | duotone. Die Komponenten sprechen `weight` an;
 * das alte `strokeWidth` der vorigen Bibliothek wird übergangsweise noch
 * auf ein Gewicht abgebildet, damit nichts stumm wegbricht.
 *
 * Import jeweils aus dem Einzelpfad (`/dist/csr/<Name>`) statt aus dem
 * Barrel-Export: Dadurch lädt der Dev-Server nur die tatsächlich genutzten
 * Icons und nicht alle ~3000.
 *
 * Lizenz: Phosphor Icons ist MIT-lizenziert (permissiv, keine
 * Attributionspflicht). Quelle: QUELLEN.md [Q31].
 */
const ICONS = {
  // Navigation / Kamera
  home: House,
  scan: Scan,
  user: User,
  arrowLeft: ArrowLeft,
  flash: Lightning,
  lens: Aperture,
  image: Image,
  flip: ArrowsClockwise,
  external: ArrowSquareOut,
  chevronRight: CaretRight,
  info: Info,
  // Kategorien
  snowflake: Snowflake,
  monitor: Monitor,
  lightbulb: Lightbulb,
  plug: Plug,
  wrench: Wrench,
  smartphone: DeviceMobile,
  // Inspiration
  laptop: Laptop,
  camera: Camera,
  battery: BatteryCharging,
  // Ergebnis-Menü
  clipboard: ClipboardText,
  flask: Flask,
  message: ChatCircle,
  file: FileText,
  globe: Globe,
  recycle: Recycle,
  // KI-Assistenz
  sparkle: Sparkle,
  // Zustände
  search: MagnifyingGlass,
  wifiOff: WifiSlash,
  broadcast: Broadcast,
  clock: Clock,
  bug: Bug,
  keyboard: Keyboard,
};

/* Alt-Prop `strokeWidth` auf ein Phosphor-Gewicht abbilden. */
function weightFromStroke(strokeWidth) {
  if (strokeWidth == null) return 'regular';
  if (strokeWidth >= 2.4) return 'bold';
  if (strokeWidth <= 1.6) return 'light';
  return 'regular';
}

export function Icon({ name, size = 22, weight, strokeWidth, className, style }) {
  const Component = ICONS[name] || Wrench;
  return (
    <Component
      size={size}
      weight={weight || weightFromStroke(strokeWidth)}
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    />
  );
}
