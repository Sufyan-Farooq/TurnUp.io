import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TurnUpLogo } from './brand/TurnUpLogo';
import { Footer } from './Footer';
import { ArrowLeft, ArrowUp, Calendar, ChevronRight } from 'lucide-react';

export interface TocItem {
  id: string;
  title: string;
}

export interface LegalLayoutProps {
  title: string;
  subtitle: string;
  badge?: string;
  lastUpdated?: string;
  dateLabel?: string;
  toc?: TocItem[];
  children: React.ReactNode;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({
  title,
  subtitle,
  badge = 'Policy',
  lastUpdated = 'September 2026',
  dateLabel = 'Last updated',
  toc = [],
  children,
}) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>(toc[0]?.id || '');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);

      if (toc.length === 0) return;
      const scrollPosition = window.scrollY + 180;
      for (let i = toc.length - 1; i >= 0; i--) {
        const el = document.getElementById(toc[i].id);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(toc[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [toc]);

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  return (
    <div
      className="legal-page-container"
      style={{
        minHeight: '100dvh',
        width: '100%',
        backgroundColor: 'var(--ink, #0d1a24)',
        color: 'var(--cloud, #f4f0e7)',
        fontFamily: "'Manrope', sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Navigation Bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'rgba(13, 26, 36, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(240, 188, 100, 0.14)',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <TurnUpLogo size="sm" variant="full" />
          </Link>
          <nav className="legal-header-nav" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <Link to="/rules" className="legal-nav-link">
              Rules
            </Link>
            <Link to="/about" className="legal-nav-link">
              About
            </Link>
            <Link to="/terms" className="legal-nav-link">
              Terms
            </Link>
            <Link to="/privacy" className="legal-nav-link">
              Privacy
            </Link>
            <Link to="/contact" className="legal-nav-link">
              Contact
            </Link>
          </nav>
        </div>

        <button
          onClick={() => navigate('/')}
          className="btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            fontSize: '13px',
            borderRadius: '999px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={15} />
          Back to Play
        </button>
      </header>

      {/* Hero Header Banner */}
      <section
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(24, 46, 62, 0.9) 0%, rgba(13, 26, 36, 1) 75%)',
          borderBottom: '1px solid rgba(244, 240, 231, 0.08)',
          padding: 'clamp(40px, 6vw, 72px) 24px clamp(32px, 5vw, 56px)',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              backgroundColor: 'rgba(240, 188, 100, 0.12)',
              border: '1px solid rgba(240, 188, 100, 0.28)',
              color: 'var(--gold, #f0bc64)',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '16px',
            }}
          >
            {badge}
          </div>

          <h1
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: 'clamp(32px, 4.5vw, 52px)',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
              margin: '0 0 16px',
              color: 'var(--cloud, #f4f0e7)',
            }}
          >
            {title}
          </h1>

          <p
            style={{
              fontSize: 'clamp(16px, 1.3vw, 19px)',
              lineHeight: 1.6,
              color: 'var(--cloud-dim, #d5dcd8)',
              margin: '0 auto 20px',
              maxWidth: '680px',
            }}
          >
            {subtitle}
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--muted, #aebfc2)',
              fontFamily: "'Space Mono', monospace",
            }}
          >
            <Calendar size={13} />
            <span>{dateLabel}: {lastUpdated}</span>
          </div>
        </div>
      </section>

      {/* Main Body with Sidebar Table of Contents */}
      <main
        style={{
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          padding: 'clamp(32px, 5vw, 64px) 24px clamp(48px, 6vw, 96px)',
          display: 'grid',
          gridTemplateColumns: toc.length > 0 ? 'minmax(220px, 280px) minmax(0, 1fr)' : '1fr',
          gap: 'clamp(32px, 5vw, 64px)',
          boxSizing: 'border-box',
          flex: '1 0 auto',
        }}
      >
        {/* Table of Contents sidebar */}
        {toc.length > 0 && (
          <aside
            className="legal-toc-sidebar"
            style={{
              position: 'sticky',
              top: '90px',
              alignSelf: 'start',
              padding: '20px',
              borderRadius: '14px',
              backgroundColor: 'rgba(19, 39, 55, 0.65)',
              border: '1px solid rgba(240, 188, 100, 0.12)',
              backdropFilter: 'blur(8px)',
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--gold, #f0bc64)',
                marginBottom: '14px',
              }}
            >
              Contents
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {toc.map(item => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToId(item.id)}
                    style={{
                      textAlign: 'left',
                      background: isActive ? 'rgba(240, 188, 100, 0.12)' : 'transparent',
                      border: 'none',
                      borderLeft: isActive ? '3px solid var(--gold, #f0bc64)' : '3px solid transparent',
                      color: isActive ? 'var(--gold, #f0bc64)' : 'var(--cloud-dim, #d5dcd8)',
                      padding: '7px 12px',
                      borderRadius: '0 8px 8px 0',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.18s ease',
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </span>
                    {isActive && <ChevronRight size={13} style={{ flexShrink: 0, opacity: 0.8 }} />}
                  </button>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Content Pane */}
        <article className="legal-article-content" style={{ minWidth: 0, lineHeight: 1.75 }}>
          {children}
        </article>
      </main>

      {/* Floating Scroll to Top button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll back to top"
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'var(--ink-panel, #182e3e)',
            border: '1px solid rgba(240, 188, 100, 0.3)',
            color: 'var(--gold, #f0bc64)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 40,
            transition: 'transform 0.2s ease',
          }}
        >
          <ArrowUp size={18} />
        </button>
      )}

      {/* Site Footer */}
      <Footer />
    </div>
  );
};
