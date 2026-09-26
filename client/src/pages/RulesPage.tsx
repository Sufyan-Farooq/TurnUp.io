import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LegalLayout } from '../components/LegalLayout';
import { Dices } from 'lucide-react';

const toc = [
  { id: 'overview', title: 'Game Night Overview' },
  { id: 'ludo', title: 'Ludo Club Rules' },
  { id: 'uno', title: 'UNO Match Rules' },
  { id: 'monopoly', title: 'Monopoly Empire Rules' },
  { id: 'snakes', title: 'Snakes & Ladders Rules' },
  { id: 'room-controls', title: 'Room & Host Controls' },
  { id: 'etiquette', title: 'Table Etiquette' },
];

export const RulesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const gameParam = searchParams.get('game');

  useEffect(() => {
    if (gameParam) {
      const el = document.getElementById(gameParam);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    }
  }, [gameParam]);

  return (
    <LegalLayout
      title="How to Play &amp; Game Rules"
      subtitle="Complete, rules-correct guide to every game in the TurnUp tabletop kit."
      badge="Player's Handbook"
      lastUpdated="September 2026"
      toc={toc}
    >
      <div className="legal-prose">
        {/* Intro Banner */}
        <section id="overview" style={{ marginBottom: '44px' }}>
          <div
            style={{
              padding: '24px',
              borderRadius: '16px',
              backgroundColor: 'var(--ink-panel, #182e3e)',
              border: '1px solid rgba(240, 188, 100, 0.25)',
              display: 'flex',
              gap: '18px',
              alignItems: 'flex-start',
            }}
          >
            <Dices size={28} style={{ color: 'var(--gold, #f0bc64)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ margin: '0 0 8px', fontFamily: "'Fredoka', sans-serif", fontSize: '20px', color: 'var(--cloud, #f4f0e7)' }}>
                Four Classics. One Unified Tabletop.
              </h3>
              <p style={{ margin: 0, fontSize: '14.5px', color: 'var(--cloud-dim, #d5dcd8)', lineHeight: 1.6 }}>
                Every game in turnUp.io is built from the ground up for multiplayer web play. We combine rules-correct tabletop mechanics with low-latency WebSockets, clear visual turn indicators, and tactile audio feedback.
              </p>
            </div>
          </div>
        </section>

        {/* LUDO */}
        <section id="ludo" style={{ marginBottom: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 92, 102, 0.2)',
                color: 'var(--coral, #FF5C66)',
                fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
                fontSize: '14px',
              }}
            >
              01
            </span>
            <h2 className="legal-heading" style={{ margin: 0 }}>Ludo Club</h2>
          </div>
          <p>
            Ludo is a strategic race game for 2 to 4 players. Each player pilots 4 tokens from their colored corner yard into the center home triangle.
          </p>

          <div className="rules-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', margin: '20px 0' }}>
            <div className="legal-card">
              <h4 style={{ margin: '0 0 6px', color: 'var(--gold, #f0bc64)', fontSize: '15px' }}>Entering the Board</h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                You must roll a <strong>6</strong> on the 3D dice to move a token from your base onto your starting cell. Rolling a 6 also awards an immediate bonus roll!
              </p>
            </div>
            <div className="legal-card">
              <h4 style={{ margin: '0 0 6px', color: 'var(--gold, #f0bc64)', fontSize: '15px' }}>Capturing Opponents</h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                Landing on a square occupied by an opponent&rsquo;s pawn knocks it back to their yard! Capturing an opponent grants an extra dice roll bonus.
              </p>
            </div>
            <div className="legal-card">
              <h4 style={{ margin: '0 0 6px', color: 'var(--gold, #f0bc64)', fontSize: '15px' }}>Star Safe Zones (&star;)</h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                Squares marked with a star symbol (&star;) are sanctuary zones. Multiple players may share safe cells without risk of capture.
              </p>
            </div>
            <div className="legal-card">
              <h4 style={{ margin: '0 0 6px', color: 'var(--gold, #f0bc64)', fontSize: '15px' }}>Winning the Match</h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                Navigate all 4 tokens around the board, down your colored home column, and into the center home triangle with exact dice counts.
              </p>
            </div>
          </div>
        </section>

        {/* UNO */}
        <section id="uno" style={{ marginBottom: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(82, 181, 162, 0.2)',
                color: 'var(--violet, #52b5a2)',
                fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
                fontSize: '14px',
              }}
            >
              02
            </span>
            <h2 className="legal-heading" style={{ margin: 0 }}>UNO Match</h2>
          </div>
          <p>
            The fast-paced card shedding showdown. Match cards by color or number, unleash devastating action cards, and be the first to empty your hand.
          </p>

          <div className="rules-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', margin: '20px 0' }}>
            <div className="legal-card">
              <h4 style={{ margin: '0 0 6px', color: 'var(--gold, #f0bc64)', fontSize: '15px' }}>Draw Two (+2) &amp; Skip</h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                <strong>+2:</strong> The next player must draw 2 cards and forfeits their turn (unless draw stacking is active). <strong>Skip:</strong> Next player loses their turn.
              </p>
            </div>
            <div className="legal-card">
              <h4 style={{ margin: '0 0 6px', color: 'var(--gold, #f0bc64)', fontSize: '15px' }}>Reverse &amp; Wilds</h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                <strong>Reverse:</strong> Flips turn direction. In 2-player games, acts as a Skip. <strong>Wild:</strong> Play on any card and declare the active color.
              </p>
            </div>
            <div className="legal-card">
              <h4 style={{ margin: '0 0 6px', color: 'var(--gold, #f0bc64)', fontSize: '15px' }}>Wild Draw Four (+4) &amp; Challenge</h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                Next player draws 4 cards. If challenged, if the player held matching color, they draw 4 instead! If the play was legal, challenger draws 6 cards.
              </p>
            </div>
            <div className="legal-card">
              <h4 style={{ margin: '0 0 6px', color: 'var(--gold, #f0bc64)', fontSize: '15px' }}>Calling &ldquo;UNO!&rdquo;</h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                When playing your second-to-last card, you MUST hit the <strong>UNO</strong> button! If an opponent catches you before your next turn, you draw 2 penalty cards.
              </p>
            </div>
          </div>
        </section>

        {/* MONOPOLY */}
        <section id="monopoly" style={{ marginBottom: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(240, 188, 100, 0.2)',
                color: 'var(--gold, #f0bc64)',
                fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
                fontSize: '14px',
              }}
            >
              03
            </span>
            <h2 className="legal-heading" style={{ margin: 0 }}>Monopoly Empire</h2>
          </div>
          <p>
            Roll dice, buy real estate, construct houses and hotels, negotiate trades, collect rent, and drive your opponents into bankruptcy.
          </p>

          <div className="rules-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', margin: '20px 0' }}>
            <div className="legal-card">
              <h4 style={{ margin: '0 0 6px', color: 'var(--gold, #f0bc64)', fontSize: '15px' }}>Pass GO &amp; Double Rolls</h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                Collect $200 each time you pass GO. Rolling doubles lets you roll again; but 3 consecutive doubles sends you straight to Jail!
              </p>
            </div>
            <div className="legal-card">
              <h4 style={{ margin: '0 0 6px', color: 'var(--gold, #f0bc64)', fontSize: '15px' }}>Color Sets &amp; Development</h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                Owning all properties in a color group doubles unimproved rent and unlocks house &amp; hotel building for exponential rents.
              </p>
            </div>
            <div className="legal-card">
              <h4 style={{ margin: '0 0 6px', color: 'var(--gold, #f0bc64)', fontSize: '15px' }}>Interactive Trading</h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                Use the live Trade Modal to exchange properties, cash, and Get Out of Jail Free cards with opponents at any time during your turn.
              </p>
            </div>
            <div className="legal-card">
              <h4 style={{ margin: '0 0 6px', color: 'var(--gold, #f0bc64)', fontSize: '15px' }}>Mortgages &amp; Bankruptcy</h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                Short on cash? Mortgage unimproved properties to the bank. If debts exceed all cash and mortgaged equity, declare bankruptcy.
              </p>
            </div>
          </div>
        </section>

        {/* SNAKES & LADDERS */}
        <section id="snakes" style={{ marginBottom: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(63, 191, 127, 0.2)',
                color: '#3FBF7F',
                fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
                fontSize: '14px',
              }}
            >
              04
            </span>
            <h2 className="legal-heading" style={{ margin: 0 }}>Snakes &amp; Ladders</h2>
          </div>
          <p>
            The timeless vertical race of luck and dramatic reversals across a 100-cell grid.
          </p>

          <div className="rules-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', margin: '20px 0' }}>
            <div className="legal-card">
              <h4 style={{ margin: '0 0 6px', color: 'var(--gold, #f0bc64)', fontSize: '15px' }}>Ladders (Ascend)</h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                Land on the base of a ladder and climb straight to the top, skipping entire rows of danger!
              </p>
            </div>
            <div className="legal-card">
              <h4 style={{ margin: '0 0 6px', color: 'var(--coral, #FF5C66)', fontSize: '15px' }}>Snakes (Descend)</h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                Step onto a snake&rsquo;s head and slide all the way down to its tail. Watch out for tile 99!
              </p>
            </div>
            <div className="legal-card">
              <h4 style={{ margin: '0 0 6px', color: 'var(--gold, #f0bc64)', fontSize: '15px' }}>Exact Roll Finish</h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                You must roll the exact number required to land directly on tile <strong>100</strong> to win the crown.
              </p>
            </div>
          </div>
        </section>

        {/* ROOM CONTROLS */}
        <section id="room-controls" style={{ marginBottom: '56px' }}>
          <h2 className="legal-heading">Room &amp; Host Controls</h2>
          <p>turnUp.io equips lobby hosts and rooms with powerful tools:</p>
          <ul>
            <li><strong>Turn Timers:</strong> Choose between standard (30s) and relaxed (60s) turn limits so games maintain momentum.</li>
            <li><strong>Appearance Picker:</strong> Customize your pawn color token before the match starts with 6 curated palette styles.</li>
            <li><strong>Spectator Mode:</strong> Invite friends to watch the match and cheer or banter in live room chat without occupying player slots.</li>
            <li><strong>Instant Rematch:</strong> Finished a match? The host can trigger an immediate rematch with identical players or swap to another game type instantly.</li>
          </ul>
        </section>

        {/* ETIQUETTE */}
        <section id="etiquette" style={{ marginBottom: '20px' }}>
          <h2 className="legal-heading">Table Etiquette</h2>
          <div
            style={{
              padding: '20px 24px',
              borderRadius: '14px',
              background: 'rgba(82, 181, 162, 0.1)',
              border: '1px solid rgba(82, 181, 162, 0.25)',
              color: 'var(--cloud, #f4f0e7)',
            }}
          >
            <p style={{ margin: '0 0 10px', fontWeight: 600 }}>Remember the golden rule of TurnUp:</p>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--cloud-dim, #d5dcd8)' }}>
              Play with people you&rsquo;d actually want in the room. Celebrate high rolls, laugh off double sixes that land in jail, and keep banter good-spirited!
            </p>
          </div>
        </section>
      </div>
    </LegalLayout>
  );
};
