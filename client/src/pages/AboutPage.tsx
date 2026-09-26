import React, { useState } from 'react';
import { LegalLayout } from '../components/LegalLayout';
import { Sparkles, Users, Cpu, ShieldCheck, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

const toc = [
  { id: 'story', title: 'Our Story & Mission' },
  { id: 'pillars', title: 'Why TurnUp is Different' },
  { id: 'tech', title: 'Technology & Craft' },
  { id: 'faq', title: 'Frequently Asked Questions' },
  { id: 'community', title: 'Community & What’s Next' },
];

interface FaqItem {
  q: string;
  a: string;
}

const faqs: FaqItem[] = [
  {
    q: 'Is turnUp.io completely free to play?',
    a: 'Yes, 100% free! There are no paywalls, no subscriptions, no pay-to-win microtransactions, and no intrusive video popups.',
  },
  {
    q: 'Do my friends need to register or download an app?',
    a: 'No! TurnUp runs entirely in the modern web browser (iOS Safari, Android Chrome, Mac, Windows, Linux). Anyone with the link can join instantly as a guest in under 10 seconds.',
  },
  {
    q: 'Can we play across different devices (cross-platform)?',
    a: 'Absolutely. One friend can be on an iPhone, another on an Android tablet, and two others on Mac or Windows laptops. The Game Kit interface automatically adapts to every screen size.',
  },
  {
    q: 'What happens if a player disconnects mid-game?',
    a: 'Our server maintains an encrypted session token in your browser. If you reload your tab or switch Wi-Fi networks, you will automatically reconnect and resume your active position without losing turns.',
  },
  {
    q: 'How many players can join a single game room?',
    a: 'Active player counts depend on the game type: Ludo supports 2–4 players, UNO supports 2–6 players, Monopoly supports 2–6 players, and Snakes & Ladders supports 2–6 players. Unlimited additional friends can join as spectators!',
  },
  {
    q: 'How does vote-kicking work for AFK or absent players?',
    a: 'If a player goes inactive or abandons the match, any active player can initiate a democratic vote-kick. When a majority votes yes, the inactive player is safely removed, and turn order advances smoothly.',
  },
  {
    q: 'Can I create private rooms just for my friend group?',
    a: 'Yes! When creating a room, you can keep it private. Only friends who receive your private room code or direct invite link can enter.',
  },
];

export const AboutPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <LegalLayout
      title="About turnUp.io"
      subtitle="Turning any group chat into game night in under sixty seconds."
      badge="Our Mission"
      lastUpdated="September 2026"
      toc={toc}
    >
      <div className="legal-prose">
        {/* Story */}
        <section id="story" style={{ marginBottom: '56px' }}>
          <h2 className="legal-heading">Our Story &amp; Mission</h2>
          <p>
            Everyone has that group chat. The college friends scattered across three time zones. The cousins who live in different cities. The coworkers who want to unwind on Friday evening.
          </p>
          <p>
            You want to play a game together, but someone doesn&rsquo;t have the 2GB app installed. Someone else forgot their app store password. Another app forces everyone through four video ads and a paid subscription prompt before you even see a board.
          </p>
          <p>
            <strong>We built turnUp.io to eliminate all of that.</strong>
          </p>
          <div
            style={{
              padding: '24px 28px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(82, 181, 162, 0.15) 0%, rgba(240, 188, 100, 0.1) 100%)',
              border: '1px solid rgba(240, 188, 100, 0.25)',
              margin: '28px 0',
            }}
          >
            <p
              style={{
                fontFamily: "'Fredoka', sans-serif",
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--cloud, #f4f0e7)',
                lineHeight: 1.4,
                margin: 0,
              }}
            >
              &ldquo;Turn any group chat into game night in under sixty seconds.&rdquo;
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--gold, #f0bc64)', fontFamily: "'Space Mono', monospace" }}>
              — The TurnUp Design Manifesto
            </p>
          </div>
        </section>

        {/* Pillars */}
        <section id="pillars" style={{ marginBottom: '56px' }}>
          <h2 className="legal-heading">Why TurnUp is Different</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              margin: '24px 0',
            }}
          >
            <div className="legal-card">
              <div style={{ color: 'var(--gold, #f0bc64)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '8px' }}>
                <Sparkles size={18} /> Board-First, Never Corporate
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--cloud-dim, #d5dcd8)', lineHeight: 1.6 }}>
                The board is the hero of the screen. We don&rsquo;t clutter your view with gambling banners, coin shops, or flashing promo popups. Just pure, clean tabletop mechanics.
              </p>
            </div>
            <div className="legal-card">
              <div style={{ color: 'var(--violet, #52b5a2)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '8px' }}>
                <Users size={18} /> Chat is the Living Room
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--cloud-dim, #d5dcd8)', lineHeight: 1.6 }}>
                Conversation isn&rsquo;t an afterthought bolted onto the side. Real-time room chat, match activity logs, and live reactions make it feel like everyone is sitting at the same kitchen table.
              </p>
            </div>
            <div className="legal-card">
              <div style={{ color: 'var(--coral, #FF5C66)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '8px' }}>
                <Cpu size={18} /> Real-Time WebSocket Engine
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--cloud-dim, #d5dcd8)', lineHeight: 1.6 }}>
                Powered by high-frequency socket synchronization, server-authoritative state reconciliation, and 3D physics dice that roll simultaneously on every player&rsquo;s screen.
              </p>
            </div>
            <div className="legal-card">
              <div style={{ color: '#3FBF7F', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '8px' }}>
                <ShieldCheck size={18} /> Zero Friction
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--cloud-dim, #d5dcd8)', lineHeight: 1.6 }}>
                One-click guest mode, zero required installs, and instant invite link sharing. If you have a browser, you have game night.
              </p>
            </div>
          </div>
        </section>

        {/* Technology */}
        <section id="tech" style={{ marginBottom: '56px' }}>
          <h2 className="legal-heading">Technology &amp; Craft</h2>
          <p>
            turnUp.io is crafted as a high-performance modern web application:
          </p>
          <ul>
            <li><strong>Frontend:</strong> React 19, TypeScript, Vite, CSS custom properties, and SVG vector graphics.</li>
            <li><strong>Typography:</strong> Fredoka (display headers), Manrope (high-legibility body), and Space Mono (utility and statistics).</li>
            <li><strong>Backend Engine:</strong> Node.js, Express, Socket.IO, and Prisma ORM with strict game rule validation.</li>
            <li><strong>Audio Engine:</strong> Custom web audio synthesized tactile sound effects for dice rolls, token hops, UNO draws, and victory fanfares.</li>
          </ul>
        </section>

        {/* FAQ Accordion */}
        <section id="faq" style={{ marginBottom: '56px' }}>
          <h2 className="legal-heading">Frequently Asked Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  style={{
                    borderRadius: '12px',
                    border: '1px solid rgba(240, 188, 100, 0.18)',
                    backgroundColor: isOpen ? 'rgba(24, 46, 62, 0.75)' : 'rgba(19, 39, 55, 0.45)',
                    overflow: 'hidden',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'none',
                      border: 'none',
                      color: 'var(--cloud, #f4f0e7)',
                      fontSize: '15.5px',
                      fontWeight: 600,
                      fontFamily: "'Fredoka', sans-serif",
                      cursor: 'pointer',
                      textAlign: 'left',
                      gap: '12px',
                    }}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp size={18} style={{ color: 'var(--gold, #f0bc64)', flexShrink: 0 }} />
                    ) : (
                      <ChevronDown size={18} style={{ color: 'var(--muted, #aebfc2)', flexShrink: 0 }} />
                    )}
                  </button>
                  {isOpen && (
                    <div
                      style={{
                        padding: '0 20px 18px',
                        fontSize: '14px',
                        lineHeight: 1.65,
                        color: 'var(--cloud-dim, #d5dcd8)',
                        borderTop: '1px solid rgba(244, 240, 231, 0.06)',
                        paddingTop: '14px',
                      }}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Community */}
        <section id="community" style={{ marginBottom: '20px' }}>
          <h2 className="legal-heading">Community &amp; What’s Next</h2>
          <p>
            We are actively developing new classic tabletop games, custom tournament ladders, and customizable table themes.
            Have a game you want to see added or a feature suggestion?
          </p>
          <div
            style={{
              padding: '20px 24px',
              borderRadius: '14px',
              background: 'rgba(240, 188, 100, 0.08)',
              border: '1px solid rgba(240, 188, 100, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: 'var(--gold, #f0bc64)', marginBottom: '4px' }}>
                Join the Conversation
              </div>
              <div style={{ fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                Help shape the future of TurnUp. Send your ideas to our team.
              </div>
            </div>
            <a
              href="/contact"
              className="btn-primary"
              style={{
                textDecoration: 'none',
                padding: '9px 18px',
                fontSize: '13px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <MessageSquare size={14} /> Contact Us
            </a>
          </div>
        </section>
      </div>
    </LegalLayout>
  );
};
