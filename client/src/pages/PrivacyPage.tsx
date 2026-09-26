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
  { id: 'rights', title: '7. Your Privacy Rights (GDPR/CCPA)' },
  { id: 'children', title: '8. Children’s Privacy' },
  { id: 'security', title: '9. Security & Encryption' },
  { id: 'contact', title: '10. Contact Privacy Officer' },
];

export const PrivacyPage: React.FC = () => {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How we collect, store, and protect your data while you play."
      badge="Privacy & Data Protection"
      lastUpdated="September 26, 2026"
      toc={toc}
    >
      <div className="legal-prose">
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
            <strong>Privacy by design:</strong> At turnUp.io, we believe you shouldn&rsquo;t have to hand over personal identity to play a game with friends.
            We don&rsquo;t sell your data, we don&rsquo;t track you across the internet with behavioral advertising, and our default game mode doesn&rsquo;t even require an email address.
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
                Temporary guest username, randomly generated session ID, token color preference, and browser socket ID. No email, phone number, or personal identifiers.
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
                Move history, dice roll sequences, card plays, in-game match duration, and win/loss records. Used to render match replays and calculate game-end rankings.
              </p>
            </div>
            <div className="legal-card">
              <div style={{ color: 'var(--gold, #f0bc64)', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={16} /> Technical Diagnostics
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                IP address, user-agent (browser and operating system type), WebSocket latency ping, and crash/error reports to troubleshoot network disconnects.
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
            <li><strong>Fair Play &amp; Security:</strong> Verifying legal moves, detecting automated bot scripts, preventing rate-limit abuse, and honoring vote-kick decisions.</li>
            <li><strong>Platform Improvements:</strong> Monitoring server health, reducing latency spikes, and optimizing board performance on mobile devices.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section id="gameplay" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">3. Real-Time Gameplay &amp; Chat</h2>
          <p>
            In-game chat messages are transmitted live over encrypted WebSockets to other active players in your specific game room.
          </p>
          <ul>
            <li>In <strong>Private Rooms</strong>, chat is visible only to people who have the secret room code or direct link.</li>
            <li>In <strong>Public Rooms</strong>, chat is visible to all participants and active spectators in that room.</li>
            <li>Chat messages are stored ephemerally in server memory for the duration of the match and are automatically flushed when the room closes. We do not permanently retain or sell private chat logs.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section id="cookies" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">4. Cookies &amp; Local Storage</h2>
          <p>
            turnUp.io uses client-side <code>localStorage</code> instead of invasive tracking cookies. Specifically:
          </p>
          <ul>
            <li><code>turnup_token</code>: An encrypted JSON Web Token that proves your identity to the game server.</li>
            <li><code>turnup_user</code>: Your active username and avatar settings so you don&rsquo;t have to re-enter them every round.</li>
            <li><code>turnup_room_[id]</code>: A room reconnection cache key to seamlessly resume your game if your browser tab reloads.</li>
          </ul>
          <p>
            We do NOT use third-party marketing cookies, Google AdSense trackers, Facebook tracking pixels, or cross-site behavioral telemetry.
          </p>
        </section>

        {/* Section 5 */}
        <section id="sharing" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">5. Data Sharing &amp; Infrastructure</h2>
          <p>
            We will never sell, rent, or trade your personal information. We share minimal telemetry only with trusted infrastructure providers who help us host turnUp.io:
          </p>
          <ul>
            <li><strong>Cloud Hosting &amp; Edge Network:</strong> High-performance server infrastructure for running Node.js / WebSocket game loops.</li>
            <li><strong>Database Hosting:</strong> Encrypted databases for registered account persistence.</li>
            <li><strong>Legal Compliance:</strong> If required by law, court order, or governmental authority to protect life, public safety, or national security.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section id="retention" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">6. Retention &amp; Erasure</h2>
          <p>
            Guest sessions and in-game chat messages are ephemeral and purged upon game completion or after 24 hours of room inactivity.
          </p>
          <p>
            If you have a registered account, your profile data remains stored until you request deletion. You may delete your account at any time by contacting our privacy desk.
          </p>
        </section>

        {/* Section 7 */}
        <section id="rights" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">7. Your Privacy Rights (GDPR &amp; CCPA)</h2>
          <p>
            Regardless of your country of residence, we uphold the highest standards of data rights under the European Union General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA):
          </p>
          <ul>
            <li><strong>Right to Access:</strong> You can request a full machine-readable copy of any personal data we hold about you.</li>
            <li><strong>Right to Rectification:</strong> You can update or correct your username and account credentials.</li>
            <li><strong>Right to Erasure (&ldquo;Right to be Forgotten&rdquo;):</strong> You can request complete deletion of your account and all associated match history.</li>
            <li><strong>Right to Non-Discrimination:</strong> You receive the identical game experience and features regardless of exercising your privacy rights.</li>
          </ul>
        </section>

        {/* Section 8 */}
        <section id="children" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">8. Children’s Privacy</h2>
          <p>
            turnUp.io does not knowingly collect personal information from children under the age of 13. If you are a parent or guardian and discover that your child has provided us with personal data without your consent, please contact us immediately, and we will purge that information from our records.
          </p>
        </section>

        {/* Section 9 */}
        <section id="security" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">9. Security &amp; Encryption</h2>
          <p>
            We implement robust security practices to safeguard player data:
          </p>
          <ul>
            <li>All client-to-server traffic is encrypted using modern TLS (HTTPS) and Secure WebSockets (WSS).</li>
            <li>User passwords are encrypted with industry-standard bcrypt hashing with adaptive salt rounds.</li>
            <li>Room instances are isolated in memory to prevent cross-room data leakage.</li>
          </ul>
        </section>

        {/* Section 10 */}
        <section id="contact" style={{ marginBottom: '20px' }}>
          <h2 className="legal-heading">10. Contact Privacy Officer</h2>
          <p>
            For any privacy inquiries, data deletion requests, or regulatory questions, please contact our Data Protection desk:
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
            <br />
            Data Protection: <span style={{ color: 'var(--cloud, #f4f0e7)' }}>turnUp.io Trust &amp; Safety</span>
          </div>
        </section>
      </div>
    </LegalLayout>
  );
};
