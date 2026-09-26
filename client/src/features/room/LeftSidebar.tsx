import React, { useEffect, useRef } from 'react';
import { Link2, Copy, Check, MessageSquare, Send, X, MessageCircle } from 'lucide-react';
import type { ChatMessage } from './types';

export interface LeftSidebarProps {
  roomId: string;
  /** Whether the mobile overlay drawer is open (adds the `open` class). */
  isOpen: boolean;
  /** Closes the mobile overlay (X button next to "Chat" header). */
  onClose: () => void;
  chatMessages: ChatMessage[];
  /** Current user's player id, used to style/label own messages as "You". */
  currentPlayerId: string | undefined;
  chatInput: string;
  onChatInputChange: (value: string) => void;
  /** Emits `send_chat_message` with the trimmed input and clears the input. */
  onSendChat: () => void;
  /** Whether the share link was just copied (drives the "Copied" button state/label). */
  copiedLink: boolean;
  onCopyLink: () => void;
  /** Ref to an empty div at the bottom of the message list for auto-scroll-into-view. */
  chatEndRef?: React.RefObject<HTMLDivElement | null>;
  placement?: 'rail' | 'mobile';
  isConnected?: boolean;
  isSending?: boolean;
  sendError?: string | null;
}

/**
 * Extracted from App.tsx `renderLeftSidebar` (~line 4530). Renders the
 * share-link box and the chat panel (message list + input). Parent owns
 * `chatInput`/`chatMessages` state and the socket wiring for
 * `send_chat_message` / `chat_message`.
 */
export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  roomId,
  isOpen,
  onClose,
  chatMessages,
  currentPlayerId,
  chatInput,
  onChatInputChange,
  onSendChat,
  copiedLink,
  onCopyLink,
  chatEndRef,
  placement = 'mobile',
  isConnected = true,
  isSending = false,
  sendError = null,
}) => {
  const shareUrl = `${window.location.origin}/join/${roomId}`;
  const drawerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (placement !== 'mobile' || !isOpen) return;
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        window.requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.chat-toggle-btn')?.focus());
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href]') ?? []);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, placement, onClose]);

  return (
    <div
      ref={drawerRef}
      className={`left-sidebar left-sidebar--${placement} ${isOpen ? 'open' : ''}`}
      role={placement === 'mobile' ? 'dialog' : 'region'}
      aria-label="Room chat"
      aria-modal={placement === 'mobile' && isOpen ? true : undefined}
      aria-hidden={placement === 'mobile' && !isOpen ? true : undefined}
      inert={placement === 'mobile' && !isOpen}
    >
      {/* Share Section */}
      {placement === 'mobile' && <div className="share-section">
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Link2 size={14} /> Share this game
        </h4>
        <div className="share-url-row">
          <input type="text" readOnly value={shareUrl} onClick={(e) => (e.target as HTMLInputElement).select()} />
          <button className={copiedLink ? 'copied' : ''} onClick={onCopyLink}>
            {copiedLink ? (
              <>
                <Check size={13} /> Copied
              </>
            ) : (
              <>
                <Copy size={13} /> Copy
              </>
            )}
          </button>
        </div>
      </div>}

      {/* Chat Section */}
      <div className="chat-section">
        <div className="chat-header">
          <MessageSquare size={16} />
          Room chat
          <button
            onClick={onClose}
            className="sidebar-close-btn"
            type="button"
            aria-label="Close room chat"
          >
            <X size={16} />
          </button>
        </div>

        <div className="chat-messages">
          {chatMessages.length === 0 ? (
            <div className="chat-empty">
              <MessageCircle size={14} /> No messages yet. Say hello to the room.
            </div>
          ) : (
            chatMessages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble ${msg.playerId === currentPlayerId ? 'self' : ''}`}>
                <span className="chat-sender">{msg.playerId === currentPlayerId ? 'You' : msg.senderName} · {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                <span className="chat-text">{msg.text}</span>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {sendError && <div className="chat-send-error" role="alert">{sendError}</div>}
        {!isConnected && <div className="chat-connection-note" role="status">Reconnecting… messages will be available when you’re back online.</div>}
        <div className="chat-input-row">
          <input
            ref={inputRef}
            type="text"
            placeholder={isConnected ? 'Message the room…' : 'Reconnect to chat'}
            value={chatInput}
            maxLength={500}
            disabled={!isConnected || isSending}
            aria-label="Message the room"
            onChange={(e) => onChatInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSendChat();
            }}
          />
          <button onClick={onSendChat} aria-label={isSending ? 'Sending message' : 'Send message'} disabled={!isConnected || isSending || !chatInput.trim()}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;
