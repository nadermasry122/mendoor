import { TileCard } from '../ui/TileCard.jsx';
import { COMMUNITY_SUBS } from '../../constants/content.js';
import { bestSearchTerm } from '../../lib/search.js';
import { buildSubredditSearchUrl } from '../../lib/api.js';

/*
 * Community-Panel: kuratierte, reale Subreddits als horizontale Kacheln.
 * Kein API-Aufruf (Reddit-Policy, ADR D2) — jeder Tipp öffnet eine
 * vorgefertigte Suche direkt auf Reddit.
 */
export function CommunityPanel({ device }) {
  const term = bestSearchTerm(device);

  return (
    <>
      <p className="panel-note">
        Kuratierte Reparatur-Communities. Ein Tipp öffnet die Suche nach „{term}“ auf Reddit.
      </p>
      <div className="hscroll">
        {COMMUNITY_SUBS.map((sub) => (
          <TileCard
            key={sub.name}
            className="subreddit-card"
            icon="message"
            title={`r/${sub.name}`}
            subtitle={sub.desc}
            onClick={() => window.open(buildSubredditSearchUrl(sub.name, device), '_blank', 'noopener')}
          />
        ))}
      </div>
    </>
  );
}
