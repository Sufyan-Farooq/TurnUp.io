import React from 'react';
import { Link } from 'react-router-dom';
import { TurnUpLogo } from './brand/TurnUpLogo';
import { Shield, Sparkles, BookOpen, HelpCircle, Mail, FileText, Lock } from 'lucide-react';

export interface FooterProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Footer: React.FC<FooterProps> = ({ className = '', style }) => {
  return (
    <footer
      className={`site-footer ${className}`}
      style={{
        borderTop: '1px solid rgba(240, 188, 100, 0.14)',
        background: 'linear-gradient(180deg, rgba(13, 26, 36, 0.95) 0%, rgba(9, 18, 25, 0.98) 100%)',
        color: 'var(--cloud-dim, #d5dcd8)',
        padding: '56px 24px 32px',
        width: '100%',
        boxSizing: 'border-box',
        fontFamily: "'Manrope', sans-serif",
        position: 'relative',
        zIndex: 5,
        ...style,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '40px',
          paddingBottom: '40px',
        }}
      >
        {/* Brand identity column */}
        <div style={{ maxWidth: '340px' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '14px' }}>
            <TurnUpLogo size="sm" variant="full" />
          </Link>
          <p
            style={{
              fontSize: '14px',
              lineHeight: 1.6,
              color: 'var(--muted, #aebfc2)',
              margin: '0 0 18px',
            }}
          >
            The shared online tabletop for game night. Play Ludo, UNO, Monopoly, and Snakes &amp; Ladders live with your group chat — no downloads required.
          </p>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '999px',
              background: 'rgba(82, 181, 162, 0.1)',
              border: '1px solid rgba(82, 181, 162, 0.25)',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              color: 'var(--violet, #52b5a2)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#3FBF7F',
                boxShadow: '0 0 8px #3FBF7F',
                display: 'inline-block',
              }}
            />
            WebSockets Live · v1.4
          </div>
        </div>

        {/* Featured Games */}
        <div>
          <h4
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--cloud, #f4f0e7)',
              letterSpacing: '-0.01em',
              margin: '0 0 16px',
            }}
          >
            Games
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li>
              <Link to="/rules?game=ludo" className="footer-link">
                Ludo Club
              </Link>
            </li>
            <li>
              <Link to="/rules?game=uno" className="footer-link">
                UNO Match
              </Link>
            </li>
            <li>
              <Link to="/rules?game=monopoly" className="footer-link">
                Monopoly Empire
              </Link>
            </li>
            <li>
              <Link to="/rules?game=snakes" className="footer-link">
                Snakes &amp; Ladders
              </Link>
            </li>
          </ul>
        </div>

        {/* Guides & Support */}
        <div>
          <h4
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--cloud, #f4f0e7)',
              letterSpacing: '-0.01em',
              margin: '0 0 16px',
            }}
          >
            Resources
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li>
              <Link to="/rules" className="footer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={14} style={{ color: 'var(--gold, #f0bc64)' }} />
                Rules &amp; How to Play
              </Link>
            </li>
            <li>
              <Link to="/about" className="footer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <HelpCircle size={14} style={{ color: 'var(--violet, #52b5a2)' }} />
                About &amp; FAQ
              </Link>
            </li>
            <li>
              <Link to="/contact" className="footer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} style={{ color: 'var(--coral, #FF5C66)' }} />
                Contact &amp; Support
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal & Compliance */}
        <div>
          <h4
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--cloud, #f4f0e7)',
              letterSpacing: '-0.01em',
              margin: '0 0 16px',
            }}
          >
            Legal &amp; Trust
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li>
              <Link to="/terms" className="footer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} />
                Terms of Service
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="footer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={14} />
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/cookies" className="footer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={14} />
                Cookie &amp; Storage Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          borderTop: '1px solid rgba(244, 240, 231, 0.08)',
          paddingTop: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          fontSize: '12px',
          color: 'var(--muted, #aebfc2)',
        }}
      >
        <div>
          &copy; {new Date().getFullYear()} <strong style={{ color: 'var(--cloud, #f4f0e7)' }}>turnUp.io</strong>. Built for shared tabletop play.
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Sparkles size={13} style={{ color: 'var(--gold, #f0bc64)' }} />
            Zero friction, zero installs
          </span>
          <Link to="/" style={{ color: 'var(--gold, #f0bc64)', textDecoration: 'none', fontWeight: 600 }}>
            Play Now &rarr;
          </Link>
        </div>
      </div>
    </footer>
  );
};
