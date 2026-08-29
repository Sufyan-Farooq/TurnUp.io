import React from 'react';
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
}) => {
  const shareUrl = `${window.location.origin}/join/${roomId}`;

  return (
    <div className={`left-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Share Section */}
      <div className="share-section">
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
      </div>

      {/* Chat Section */}
      <div className="chat-section">
        <div className="chat-header">
          <MessageSquare size={16} />
          Chat
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'none',
              padding: '4px',
              lineHeight: 1,
            }}
            className="sidebar-close-btn"
          >
            <X size={16} />
          </button>
        </div>

        <div className="chat-messages">
          {chatMessages.length === 0 ? (
            <div className="chat-empty">
              <MessageCircle size={14} /> No messages yet
            </div>
          ) : (
            chatMessages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble ${msg.playerId === currentPlayerId ? 'self' : ''}`}>
                <span className="chat-sender">{msg.playerId === currentPlayerId ? 'You' : msg.senderName}</span>
                <span className="chat-text">{msg.text}</span>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="chat-input-row">
          <input
            type="text"
            placeholder="Say something..."
            value={chatInput}
            onChange={(e) => onChatInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSendChat();
            }}
          />
          <button onClick={onSendChat} aria-label="Send message">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;
