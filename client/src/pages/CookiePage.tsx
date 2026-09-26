import React from 'react';
import { LegalLayout } from '../components/LegalLayout';
import { ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

const toc = [
  { id: 'overview', title: '1. What We Store & Why' },
  { id: 'storage-keys', title: '2. Exact Keys Used on TurnUp' },
  { id: 'no-tracking', title: '3. Zero Third-Party Ad Trackers' },
  { id: 'managing', title: '4. How to Clear Your Storage' },
  { id: 'contact', title: '5. Questions' },
];

export const CookiePage: React.FC = () => {
  return (
    <LegalLayout
      title="Cookie &amp; Storage Policy"
      subtitle="Complete transparency about how turnUp.io stores session data in your browser."
      badge="Storage Policy"
      lastUpdated="September 2026"
      toc={toc}
    >
      <div className="legal-prose">
        {/* Intro Banner */}
        <section id="overview" style={{ marginBottom: '44px' }}>
          <div
            style={{
              padding: '20px 24px',
              borderRadius: '14px',
              background: 'rgba(82, 181, 162, 0.12)',
              border: '1px solid rgba(82, 181, 162, 0.28)',
              color: 'var(--cloud, #f4f0e7)',
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start',
            }}
          >
            <ShieldCheck size={24} style={{ color: 'var(--violet, #52b5a2)', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '14.5px', lineHeight: 1.6 }}>
              <strong>The TL;DR:</strong> turnUp.io does <strong>not</strong> use advertising cookies, marketing pixels, or third-party cross-site trackers.
              We only use browser <code>localStorage</code> for essential features like keeping you connected to your active board game if your page refreshes.
            </div>
          </div>
        </section>

        {/* Section 2: Storage Keys */}
        <section id="storage-keys" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">2. Exact Keys Used on TurnUp</h2>
          <p>
            Here is the complete inventory of data stored in your browser&rsquo;s <code>localStorage</code> when playing on turnUp.io:
          </p>

          <div style={{ overflowX: 'auto', margin: '20px 0' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13.5px',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(240, 188, 100, 0.25)', color: 'var(--gold, #f0bc64)' }}>
                  <th style={{ padding: '12px 14px', fontFamily: "'Space Mono', monospace" }}>Key Name</th>
                  <th style={{ padding: '12px 14px' }}>Type</th>
                  <th style={{ padding: '12px 14px' }}>Purpose</th>
                  <th style={{ padding: '12px 14px' }}>Lifespan</th>
                </tr>
              </thead>
              <tbody style={{ color: 'var(--cloud-dim, #d5dcd8)' }}>
                <tr style={{ borderBottom: '1px solid rgba(244, 240, 231, 0.08)' }}>
                  <td style={{ padding: '12px 14px', fontFamily: "'Space Mono', monospace", color: 'var(--cloud, #f4f0e7)' }}>
                    turnup_token
                  </td>
                  <td style={{ padding: '12px 14px' }}>Authentication</td>
                  <td style={{ padding: '12px 14px' }}>Stores your secure session JWT so you remain authenticated across matches.</td>
                  <td style={{ padding: '12px 14px' }}>Session / 30 days</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(244, 240, 231, 0.08)' }}>
                  <td style={{ padding: '12px 14px', fontFamily: "'Space Mono', monospace", color: 'var(--cloud, #f4f0e7)' }}>
                    turnup_user
                  </td>
                  <td style={{ padding: '12px 14px' }}>Preferences</td>
                  <td style={{ padding: '12px 14px' }}>Caches your chosen guest username and token color to save you typing each game.</td>
                  <td style={{ padding: '12px 14px' }}>Persistent</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(244, 240, 231, 0.08)' }}>
                  <td style={{ padding: '12px 14px', fontFamily: "'Space Mono', monospace", color: 'var(--cloud, #f4f0e7)' }}>
                    turnup_room_[id]
                  </td>
                  <td style={{ padding: '12px 14px' }}>Reconnection</td>
                  <td style={{ padding: '12px 14px' }}>Remembers your active room ID to quickly rejoin if your browser tab reloads or closes.</td>
                  <td style={{ padding: '12px 14px' }}>Match duration</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: No Tracking */}
        <section id="no-tracking" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">3. Zero Third-Party Ad Trackers</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
              margin: '20px 0',
            }}
          >
            <div className="legal-card" style={{ borderColor: 'rgba(82, 181, 162, 0.3)' }}>
              <div style={{ color: 'var(--violet, #52b5a2)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '6px' }}>
                <CheckCircle2 size={16} /> What We Do
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                <li>Keep your match connected</li>
                <li>Store your volume &amp; theme choices</li>
                <li>Verify your player move legitimacy</li>
              </ul>
            </div>

            <div className="legal-card" style={{ borderColor: 'rgba(255, 92, 102, 0.3)' }}>
              <div style={{ color: 'var(--coral, #FF5C66)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '6px' }}>
                <XCircle size={16} /> What We NEVER Do
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                <li>Track your browsing across other sites</li>
                <li>Sell usage profiles to advertisers</li>
                <li>Inject third-party ad networks</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4: Clearing Storage */}
        <section id="managing" style={{ marginBottom: '44px' }}>
          <h2 className="legal-heading">4. How to Clear Your Storage</h2>
          <p>
            You can clear all stored turnUp.io data at any time directly through your browser settings or by signing out:
          </p>
          <ul>
            <li><strong>Signing Out:</strong> Clicking &ldquo;Sign out&rdquo; on the landing screen immediately clears your active auth token and user profile.</li>
            <li><strong>Browser DevTools:</strong> Press <code>F12</code> or right-click &gt; <em>Inspect</em> &gt; <em>Application</em> / <em>Storage</em> &gt; <em>Local Storage</em> &gt; click &ldquo;Clear All&rdquo;.</li>
            <li><strong>Browser Settings:</strong> In Chrome, Safari, Firefox, or Edge, go to <em>Settings</em> &gt; <em>Privacy &amp; Security</em> &gt; <em>Cookies and site data</em> &gt; search for <code>turnup.io</code> &gt; delete.</li>
          </ul>
        </section>

        {/* Section 5: Contact */}
        <section id="contact" style={{ marginBottom: '20px' }}>
          <h2 className="legal-heading">5. Questions</h2>
          <p>
            If you have questions about how we use local storage, feel free to contact us at <a href="mailto:privacy@turnup.io" style={{ color: 'var(--violet, #52b5a2)' }}>privacy@turnup.io</a>.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
};
