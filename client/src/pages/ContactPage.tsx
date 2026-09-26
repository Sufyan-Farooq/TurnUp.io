import React, { useState } from 'react';
import { LegalLayout } from '../components/LegalLayout';
import { Mail, Bug, Shield, CheckCircle, Send } from 'lucide-react';

const toc = [
  { id: 'channels', title: 'Support Channels' },
  { id: 'send-message', title: 'Send Us a Message' },
  { id: 'faq-help', title: 'Self-Serve Help' },
];

export const ContactPage: React.FC = () => {
  const [draftUrl, setDraftUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'General Question',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    const recipient = formData.category === 'Bug Report'
      ? 'bugs@turnup.io'
      : formData.category === 'Moderation or Safety Report'
        ? 'safety@turnup.io'
        : 'support@turnup.io';
    const subject = `[TurnUp] ${formData.category}`;
    const body = `Name: ${formData.name}\nReply to: ${formData.email}\nCategory: ${formData.category}\n\n${formData.message}`;
    setDraftUrl(`mailto:${recipient}?${new URLSearchParams({ subject, body }).toString()}`);
  };

  return (
    <LegalLayout
      title="Contact &amp; Support"
      subtitle="Have a question, encountered a bug, or want to suggest a new board game? We’d love to hear from you."
      badge="Get in Touch"
      lastUpdated="September 2026"
      toc={toc}
    >
      <div className="legal-prose">
        {/* Support Channels */}
        <section id="channels" style={{ marginBottom: '48px' }}>
          <h2 className="legal-heading">Direct Support Channels</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
              margin: '20px 0',
            }}
          >
            <div className="legal-card">
              <div style={{ color: 'var(--gold, #f0bc64)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '6px' }}>
                <Mail size={16} /> Player Support
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                Account recovery, game lobby issues, or general gameplay questions.
              </p>
              <a href="mailto:support@turnup.io" style={{ color: 'var(--gold, #f0bc64)', fontFamily: "'Space Mono', monospace", fontSize: '13px' }}>
                support@turnup.io
              </a>
            </div>

            <div className="legal-card">
              <div style={{ color: 'var(--coral, #FF5C66)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '6px' }}>
                <Bug size={16} /> Bug Reports
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                Encountered a desync, display glitch, or game-rule issue? Let our dev team know.
              </p>
              <a href="mailto:bugs@turnup.io" style={{ color: 'var(--coral, #FF5C66)', fontFamily: "'Space Mono', monospace", fontSize: '13px' }}>
                bugs@turnup.io
              </a>
            </div>

            <div className="legal-card">
              <div style={{ color: 'var(--violet, #52b5a2)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '6px' }}>
                <Shield size={16} /> Trust &amp; Safety
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '13.5px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                Report harassment, username violations, or privacy concerns.
              </p>
              <a href="mailto:safety@turnup.io" style={{ color: 'var(--violet, #52b5a2)', fontFamily: "'Space Mono', monospace", fontSize: '13px' }}>
                safety@turnup.io
              </a>
            </div>
          </div>
        </section>

        {/* Message Form */}
        <section id="send-message" style={{ marginBottom: '48px' }}>
          <h2 className="legal-heading">Send Us a Message</h2>
          <p>
            Fill out the form to prepare an email in your email app. You can review it there before sending.
          </p>

          <div
            style={{
              padding: 'clamp(24px, 4vw, 36px)',
              borderRadius: '16px',
              backgroundColor: 'var(--ink-panel, #182e3e)',
              border: '1px solid rgba(240, 188, 100, 0.2)',
              marginTop: '20px',
            }}
          >
            {draftUrl ? (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <CheckCircle size={48} style={{ color: 'var(--violet, #52b5a2)', margin: '0 auto 16px' }} />
                <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '24px', margin: '0 0 8px', color: 'var(--cloud, #f4f0e7)' }}>
                  Email draft ready
                </h3>
                <p style={{ color: 'var(--cloud-dim, #d5dcd8)', fontSize: '15px', maxWidth: '420px', margin: '0 auto 20px' }}>
                  Your message has not been sent or stored by TurnUp. Open the draft in your email app and send it when you’re ready.
                </p>
                <a href={draftUrl} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', borderRadius: 8, padding: '10px 22px' }}>
                  <Mail size={15} /> Open email draft
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setDraftUrl(null);
                    setFormData({ name: '', email: '', category: 'General Question', message: '' });
                  }}
                  className="btn-primary"
                  style={{ borderRadius: '8px', padding: '10px 22px' }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                  <div>
                    <label htmlFor="contact-name" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                      Your Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      placeholder="e.g. Alex Miller"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="brand-input"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: '#10222d',
                        border: '1px solid rgba(240, 188, 100, 0.2)',
                        color: 'var(--cloud, #f4f0e7)',
                        fontSize: '14px',
                        fontFamily: "'Manrope', sans-serif",
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-email" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                      Your Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      placeholder="alex@example.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="brand-input"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: '#10222d',
                        border: '1px solid rgba(240, 188, 100, 0.2)',
                        color: 'var(--cloud, #f4f0e7)',
                        fontSize: '14px',
                        fontFamily: "'Manrope', sans-serif",
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-category" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                    Inquiry Category
                  </label>
                  <select
                    id="contact-category"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: '#10222d',
                      border: '1px solid rgba(240, 188, 100, 0.2)',
                      color: 'var(--cloud, #f4f0e7)',
                      fontSize: '14px',
                      fontFamily: "'Manrope', sans-serif",
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="General Question">General Question</option>
                    <option value="Bug Report">Bug Report</option>
                    <option value="Feature or Game Suggestion">Feature or Game Suggestion</option>
                    <option value="Moderation or Safety Report">Moderation or Safety Report</option>
                    <option value="Partnership or Press">Partnership or Press</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="contact-message" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--cloud-dim, #d5dcd8)' }}>
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    placeholder="Tell us what happened or how we can help..."
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: '#10222d',
                      border: '1px solid rgba(240, 188, 100, 0.2)',
                      color: 'var(--cloud, #f4f0e7)',
                      fontSize: '14px',
                      fontFamily: "'Manrope', sans-serif",
                      boxSizing: 'border-box',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    alignSelf: 'flex-start',
                    padding: '14px 28px',
                    borderRadius: '10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                >
                  <Send size={15} /> Prepare Email Draft
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Self-serve */}
        <section id="faq-help" style={{ marginBottom: '20px' }}>
          <h2 className="legal-heading">Looking for Immediate Answers?</h2>
          <p>
            Check out our <a href="/rules" style={{ color: 'var(--gold, #f0bc64)' }}>How to Play &amp; Rules Guide</a> or browse the <a href="/about#faq" style={{ color: 'var(--violet, #52b5a2)' }}>Frequently Asked Questions</a> for instant solutions.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
};
