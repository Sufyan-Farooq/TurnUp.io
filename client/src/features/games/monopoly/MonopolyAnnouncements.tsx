import { useEffect, useRef, useState } from 'react';
import type { GameStateUpdate } from '../../../types/game';
import type { MonopolyRoom } from './types';
import { MONOPOLY_BOARD } from './boardData';
import { formatMonopolyAnnouncement } from './announcements';

export function MonopolyAnnouncements({ update, room }: { update?: GameStateUpdate | null; room: MonopolyRoom }) {
  const [messages, setMessages] = useState<{ id: number; text: string }[]>([]);
  const processed = useRef<GameStateUpdate | null>(null);
  const sequence = useRef(0);
  const firstMessageId = messages[0]?.id;
  useEffect(() => {
    if (!update || update === processed.current || update.gameState.gameType !== 'MONOPOLY') return;
    processed.current = update;
    const name = (id: string) => room.players.find(player => player.id === id)?.name ?? 'A player';
    const incoming = update.events.map(event => formatMonopolyAnnouncement(event, MONOPOLY_BOARD, name)).filter((line): line is string => !!line);
    const queued = incoming.map(text => ({ id: ++sequence.current, text }));
    if (queued.length) setMessages(previous => [...previous, ...queued].slice(-12));
  }, [update, room.players]);
  useEffect(() => {
    if (firstMessageId === undefined) return;
    const timer = setTimeout(() => setMessages(previous => previous.slice(1)), 4500);
    return () => clearTimeout(timer);
  }, [firstMessageId]);
  return <div className="monopoly-announcement" role="status" aria-live="polite" aria-atomic="true">{messages[0]?.text ?? ''}</div>;
}
