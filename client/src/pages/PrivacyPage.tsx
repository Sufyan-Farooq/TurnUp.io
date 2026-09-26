import React from 'react';
import { LegalLayout } from '../components/LegalLayout';
import { Lock, EyeOff, Database, KeyRound, UserCheck } from 'lucide-react';

const toc = [
  { id: 'collection', title: '1. Information We Collect' },
  { id: 'usage', title: '2. How We Use Data' },
  { id: 'gameplay', title: '3. Real-Time Gameplay & Chat' },
  { id: 'cookies', title: '4. Cookies & Local Storage' },
  { id: 'sharing', title: '5. Data Sharing & Infrastructure' },
  { id: 'retention', title: '6. Retention & Erasure' },
  { id: 'rights', title: '7. Privacy Requests' },
  { id: 'children', title: '8. Children’s Privacy' },
  { id: 'security', title: '9. Security Practices' },
  { id: 'contact', title: '10. Privacy Contact' },
];

export const PrivacyPage: React.FC = () => {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How we collect, store, and protect your data while you play."
      badge="Privacy & Data Protection"
      lastUpdated="September 26, 2026"
      dateLabel="Draft dated"
      toc={toc}
    >
      <div className="legal-prose">
        <p role="note" style={{ padding: '14px 18px', borderRadius: 10, background: 'rgba(240,188,100,.1)', color: 'var(--cloud)' }}>
          Draft for review: hosting providers, data retention, contact details, and privacy-law obligations must be confirmed by the service operator before this page is presented as an official policy.
        </p>
        {/* Intro Callout */}
        <div
          style={{
            padding: '20px 24px',
            borderRadius: '14px',
            background: 'rgba(240, 188, 100, 0.08)',
            border: '1px solid rgba(240, 188, 100, 0.25)',
            color: 'var(--cloud, #f4f0e7)',
            marginBottom: '36px',
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-start',
          }}
        >
          <Lock size={24} style={{ color: 'var(--gold, #f0bc64)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '14.5px', lineHeight: 1.6 }}>
            The app supports guest play without an email address and registered accounts with an email address. This page summarizes data flows visible in the current codebase.
          </div>
        </div>

        {/* Section 1 */}
        <section id="collection" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">1. Information We Collect</h2>
          <p>We collect only the minimum data required to orchestrate multiplayer synchronization and safe gameplay:</p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              margin: '20px 0',
            }}
          >
            <div className="legal-card">
              <div style={{ color: 'var(--gold, #f0bc64)', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <EyeOff size={16} /> Guest Session Data
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                Guest username and a temporary session ID are used to join rooms. Guest identities are not created as database user records.
              </p>
            </div>
            <div className="legal-card">
              <div style={{ color: 'var(--gold, #f0bc64)', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={16} /> Registered Account Data
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                If you choose to create an account: your chosen username, email address, and a cryptographically salted password hash (we never store plain-text passwords).
              </p>
            </div>
            <div className="legal-card">
              <div style={{ color: 'var(--gold, #f0bc64)', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={16} /> Gameplay Logs
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                Registered-player game totals and match results are stored for profiles. The current app does not provide saved move-by-move replays.
              </p>
            </div>
            <div className="legal-card">
              <div style={{ color: 'var(--gold, #f0bc64)', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={16} /> Technical Diagnostics
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                The server writes operational events to its configured logs. Hosting providers may also process connection metadata needed to deliver the service; retention depends on the deployment.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section id="usage" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">2. How We Use Data</h2>
          <p>Your information is used strictly to power the core gaming service:</p>
          <ul>
            <li><strong>Room Synchronization:</strong> Relaying player dice rolls, pawn moves, card draws, and chat messages in real time across WebSockets.</li>
            <li><strong>Session Resilience:</strong> Allowing you to refresh your browser or recover from a momentary Wi-Fi drop without getting kicked from your match.</li>
            <li><strong>Fair Play &amp; Security:</strong> Verifying legal moves, limiting authentication requests, and applying room moderation actions.</li>
            <li><strong>Profiles:</strong> Saving registered players&rsquo; match totals and results.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section id="gameplay" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">3. Real-Time Gameplay &amp; Chat</h2>
          <p>
            In-game chat messages are broadcast live to members of your game room. Transport encryption depends on whether the deployment is served over HTTPS/WSS.
          </p>
          <ul>
            <li>In <strong>Private Rooms</strong>, chat is visible only to people who have the secret room code or direct link.</li>
            <li>In <strong>Public Rooms</strong>, chat is visible to all participants and active spectators in that room.</li>
            <li>The game server broadcasts chat messages without saving a chat history. Messages remain in the open page&rsquo;s client state and are lost when that page session ends.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section id="cookies" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">4. Cookies &amp; Local Storage</h2>
          <p>
            turnUp.io uses client-side <code>localStorage</code> instead of invasive tracking cookies. Specifically:
          </p>
          <ul>
            <li><code>turnup_token</code> and <code>turnup_user</code>: Your signed session token and cached account or guest details. The token is signed, not encrypted, and expires after seven days.</li>
            <li><code>turnup_token_[playerId]</code> and <code>turnup_room_[playerId]</code>: Per-player room reconnection credentials used by the socket client.</li>
            <li>These values remain in local storage until sign out, leaving the room, or clearing this site&rsquo;s browser storage.</li>
          </ul>
          <p>
            We do NOT use third-party marketing cookies, Google AdSense trackers, Facebook tracking pixels, or cross-site behavioral telemetry.
          </p>
        </section>

        {/* Section 5 */}
        <section id="sharing" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">5. Data Sharing &amp; Infrastructure</h2>
          <p>
            The application uses a database for registered accounts and match results, and hosting services may process connection data to run the deployment. The specific providers and their retention depend on where the service is hosted.
          </p>
          <ul>
            <li>Information may be disclosed when required by applicable law.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section id="retention" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">6. Retention &amp; Erasure</h2>
          <p>
            Guest identities are signed into temporary sessions and are not inserted into the registered-user database. Chat is not stored by the game server. Registered account records and match results remain in the database; room cleanup timing depends on server configuration.
          </p>
          <p>
            The current app does not include a self-service account deletion control. For access, correction, or deletion requests, contact the service operator using the address below.
          </p>
        </section>

        {/* Section 7 */}
        <section id="rights" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">7. Privacy Requests</h2>
          <p>
            Depending on where you live, privacy laws may provide rights over your personal information. Contact the service operator to submit an access, correction, or deletion request.
          </p>
          <ul>
            <li>Requests will be reviewed and handled as required by applicable law.</li>
          </ul>
        </section>

        {/* Section 8 */}
        <section id="children" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">8. Children’s Privacy</h2>
          <p>
            The service is not designed specifically for children. If you have a concern about a child&rsquo;s account or information, contact the service operator using the address below.
          </p>
        </section>

        {/* Section 9 */}
        <section id="security" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">9. Security Practices</h2>
          <p>
            We implement robust security practices to safeguard player data:
          </p>
          <ul>
            <li>Production transport encryption depends on the hosting configuration; the application should be served over HTTPS/WSS.</li>
            <li>Registered account passwords are hashed with Node.js scrypt and a random salt. Passwords are not stored in plain text.</li>
            <li>Room instances are isolated in memory to prevent cross-room data leakage.</li>
          </ul>
        </section>

        {/* Section 10 */}
        <section id="contact" style={{ marginBottom: '20px' }}>
          <h2 className="legal-heading">10. Privacy Contact</h2>
          <p>
            For privacy questions or account data requests, contact the service operator:
          </p>
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: 'var(--ink-panel, #182e3e)',
              border: '1px solid rgba(82, 181, 162, 0.25)',
              fontFamily: "'Space Mono', monospace",
              fontSize: '13px',
              display: 'inline-block',
            }}
          >
            Email: <a href="mailto:privacy@turnup.io" style={{ color: 'var(--violet, #52b5a2)' }}>privacy@turnup.io</a>
          </div>
        </section>
      </div>
    </LegalLayout>
  );
};
