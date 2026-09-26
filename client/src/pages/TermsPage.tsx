import React from 'react';
import { LegalLayout } from '../components/LegalLayout';
import { ShieldCheck, Ban } from 'lucide-react';

const toc = [
  { id: 'acceptance', title: '1. Acceptance & Eligibility' },
  { id: 'accounts', title: '2. Accounts & Guest Play' },
  { id: 'community', title: '3. Code of Conduct & Fair Play' },
  { id: 'hosting', title: '4. Rooms, Lobbies & Spectating' },
  { id: 'mechanics', title: '5. Game Rules & Randomness' },
  { id: 'ip', title: '6. Intellectual Property & Brand' },
  { id: 'moderation', title: '7. Vote-Kicking & Sanctions' },
  { id: 'disclaimer', title: '8. Disclaimers & Warranties' },
  { id: 'liability', title: '9. Limitation of Liability' },
  { id: 'disputes', title: '10. Governing Law & Disputes' },
  { id: 'contact', title: '11. Contact & Inquiries' },
];

export const TermsPage: React.FC = () => {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="The rules of the table: how we ensure fair, friendly, and reliable game nights for everyone."
      badge="Legal Agreement"
      lastUpdated="September 26, 2026"
      toc={toc}
    >
      <div className="legal-prose">
        {/* Intro Callout */}
        <div
          style={{
            padding: '20px 24px',
            borderRadius: '14px',
            background: 'rgba(82, 181, 162, 0.12)',
            border: '1px solid rgba(82, 181, 162, 0.3)',
            color: 'var(--cloud, #f4f0e7)',
            marginBottom: '36px',
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-start',
          }}
        >
          <ShieldCheck size={24} style={{ color: 'var(--violet, #52b5a2)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '14.5px', lineHeight: 1.6 }}>
            <strong>Welcome to turnUp.io!</strong> Our mission is simple: turn any group chat into game night in under sixty seconds.
            By playing in a room, hosting a lobby, or creating an account, you agree to these Terms of Service. Please read them with the same care you would bring to any friendly board game match.
          </div>
        </div>

        {/* Section 1 */}
        <section id="acceptance" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">1. Acceptance &amp; Eligibility</h2>
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) constitute a binding legal agreement between you (&ldquo;User,&rdquo; &ldquo;Player,&rdquo; or &ldquo;you&rdquo;) and turnUp.io (&ldquo;turnUp,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
            By accessing our website, creating a game room, joining via code or direct link, or creating a registered user account, you confirm that you have read, understood, and agreed to be bound by these Terms.
          </p>
          <p>
            You must be at least 13 years of age (or the minimum age of digital consent required in your jurisdiction) to use turnUp.io. If you are under the legal age of majority in your jurisdiction, you confirm that you have obtained verifiable parental or guardian consent to play.
          </p>
        </section>

        {/* Section 2 */}
        <section id="accounts" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">2. Accounts &amp; Guest Play</h2>
          <p>
            turnUp.io supports both instantaneous <strong>Guest Play</strong> (zero email or password required) and <strong>Registered Accounts</strong>.
          </p>
          <ul>
            <li>
              <strong>Guest Sessions:</strong> When you join as a guest, we assign a temporary cryptographic session token stored in your browser&rsquo;s local storage. This allows seamless reconnection if your connection drops. Guest tokens are ephemeral and may expire after periods of inactivity.
            </li>
            <li>
              <strong>Registered Accounts:</strong> If you register a persistent profile, you are responsible for maintaining the confidentiality of your credentials and for all gameplay and chat activities originating from your account.
            </li>
            <li>
              <strong>Usernames:</strong> Usernames must not be offensive, defamatory, impersonate another player or celebrity, or violate trademark rights. We reserve the right to rename or reclaim any username violating community standards.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section id="community" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">3. Code of Conduct &amp; Fair Play</h2>
          <p>
            Board games thrive on friendly competition, banter, and trust. To maintain this environment for everyone, players agree to refrain from:
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              margin: '20px 0',
            }}
          >
            <div className="legal-card">
              <div style={{ color: 'var(--coral, #FF5C66)', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ban size={16} /> Cheating &amp; Botting
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                Using automated software, memory injection, packet sniffers, browser automation scripts, or exploits to manipulate dice rolls, peek at opponent UNO cards, or alter game state.
              </p>
            </div>
            <div className="legal-card">
              <div style={{ color: 'var(--coral, #FF5C66)', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ban size={16} /> Harassment &amp; Abuse
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                Engaging in hate speech, sexual harassment, personal threats, doxxing, racism, or persistent spamming in the in-game chat or room titles.
              </p>
            </div>
            <div className="legal-card">
              <div style={{ color: 'var(--coral, #FF5C66)', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ban size={16} /> Stalling &amp; Griefing
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                Deliberately running out turn timers repeatedly (&ldquo;timer griefing&rdquo;) or refusing legal moves to hold other players hostage in a public room.
              </p>
            </div>
            <div className="legal-card">
              <div style={{ color: 'var(--coral, #FF5C66)', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ban size={16} /> Collusion &amp; Win Trading
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                Using multi-accounting or secret alliances in public ranked or competitive lobbies to disadvantage legitimate participants.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section id="hosting" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">4. Rooms, Lobbies &amp; Spectating</h2>
          <p>
            turnUp.io provides room hosting capabilities:
          </p>
          <ul>
            <li>
              <strong>Private Rooms:</strong> Designed for friend groups and accessed via secret room codes or direct URLs. Room creators can configure turn timers, max players, and house rules.
            </li>
            <li>
              <strong>Public Rooms:</strong> Visible in the public lobby directory. Any player matching room criteria may join. Public rooms are subject to democratic vote-kick rules.
            </li>
            <li>
              <strong>Spectators:</strong> Spectators may watch games in progress and participate in chat unless muted or restricted by room settings.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section id="mechanics" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">5. Game Rules &amp; Randomness</h2>
          <p>
            All dice rolls (in Ludo, Monopoly, Snakes &amp; Ladders) and card deck shuffles (in UNO) are executed server-side using cryptographically secure pseudorandom number generators (CSPRNG).
          </p>
          <p>
            While our game implementations are inspired by traditional and classic public-domain tabletop mechanics, turnUp.io maintains authoritative digital adjudication:
          </p>
          <ul>
            <li>The server state is always final. In the event of a client desynchronization or network jitter, the server reconciliation will correct your local view.</li>
            <li>Turn timeouts will automatically trigger default actions (e.g. automatic dice roll, drawing a card, or forfeiting a turn) to ensure the table never freezes.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section id="ip" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">6. Intellectual Property &amp; Brand</h2>
          <p>
            The turnUp.io brand, logo mark, custom board illustrations, UI Game Kit design system, sound effects, codebase, and server infrastructure are the proprietary property of turnUp.io and its licensors.
          </p>
          <p>
            References to classic games (such as Ludo, Monopoly, UNO, or Snakes &amp; Ladders) refer to traditional game formats and mechanics. All trademarks and registered names belong to their respective owners; turnUp.io is an independent platform and is not sponsored by, endorsed by, or affiliated with Mattel, Hasbro, or their subsidiaries.
          </p>
        </section>

        {/* Section 7 */}
        <section id="moderation" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">7. Vote-Kicking &amp; Sanctions</h2>
          <p>
            To empower players to manage their own rooms, turnUp.io includes an in-game <strong>Democratic Vote-Kick</strong> system. If a majority of active room participants vote to remove an AFK or abusive player, that player will be disconnected from the match.
          </p>
          <p>
            We reserve the right, at our sole discretion, to suspend or permanently ban any IP address or user account that repeatedly violates these Terms or harms the stability of the platform.
          </p>
        </section>

        {/* Section 8 */}
        <section id="disclaimer" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">8. Disclaimers &amp; Warranties</h2>
          <p>
            TURNUP.IO IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR UNINTERRUPTED SERVICE.
          </p>
          <p>
            We strive for 99.9% uptime, but we do not guarantee that the service will be error-free, that matches will never be interrupted by network anomalies, or that defects will be corrected immediately.
          </p>
        </section>

        {/* Section 9 */}
        <section id="liability" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">9. Limitation of Liability</h2>
          <p>
            TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL TURNUP.IO, ITS CREATORS, OR CONTRIBUTORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF YOUR USE OF OR INABILITY TO USE THE SERVICE.
          </p>
        </section>

        {/* Section 10 */}
        <section id="disputes" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">10. Governing Law &amp; Disputes</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of Delaware, United States, without regard to its conflict of law principles. Any dispute arising out of these Terms shall first be attempted to be resolved via good-faith informal negotiation.
          </p>
        </section>

        {/* Section 11 */}
        <section id="contact" style={{ marginBottom: '20px' }}>
          <h2 className="legal-heading">11. Contact &amp; Inquiries</h2>
          <p>
            If you have questions, feedback, or concerns regarding these Terms of Service, please reach out to our legal and support team:
          </p>
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: 'var(--ink-panel, #182e3e)',
              border: '1px solid rgba(240, 188, 100, 0.2)',
              fontFamily: "'Space Mono', monospace",
              fontSize: '13px',
              display: 'inline-block',
            }}
          >
            Email: <a href="mailto:legal@turnup.io" style={{ color: 'var(--gold, #f0bc64)' }}>legal@turnup.io</a>
            <br />
            Support: <a href="/contact" style={{ color: 'var(--violet, #52b5a2)' }}>turnup.io/contact</a>
          </div>
        </section>
      </div>
    </LegalLayout>
  );
};
