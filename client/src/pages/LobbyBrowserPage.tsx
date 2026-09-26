import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Dice5, Layers, Route, Eye } from 'lucide-react';
import { Modal, Button } from '../components/ui';

import { SERVER_URL } from '../hooks/useSocket';

export interface RoomListItem {
  id: string;
  name: string;
  status: 'LOBBY' | 'PLAYING' | 'ENDED';
  gameType: string;
  playersCount: number;
  maxPlayers: number;
}

export interface RoomsModalProps {
  /** Whether the "All Rooms" browser is open. */
  open: boolean;
  onClose: () => void;
  /**
   * Called when the player clicks Join/Spectate on a room row. The parent
   * owns the socket connection and is responsible for emitting
   * `join_room`, updating room/game state, and surfacing any failure
   * (e.g. via the shared toast) — this component only reports intent.
   */
  onJoinRoom: (room: RoomListItem) => void;
}

/**
 * "All Rooms" browser modal. Fetches `GET /api/rooms` itself whenever it is
 * opened (mirroring the original `fetchRoomsList` + `handleAllRoomsBtn`
 * flow), and renders each room with a Join/Spectate action. Extracted from
 * App.tsx's `renderRoomsModal`, rebuilt on the shared `Modal` primitive
 * instead of the ad hoc `.modal-overlay` markup.
 */
export const RoomsModal: React.FC<RoomsModalProps> = ({ open, onClose, onJoinRoom }) => {
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadRooms = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`${SERVER_URL}/api/rooms`, { signal });
      if (!response.ok) throw new Error('Room list unavailable.');
      const data: unknown = await response.json();
      if (!Array.isArray(data)) throw new Error('Room list unavailable.');
      setRooms(data.filter((room): room is RoomListItem =>
        typeof room === 'object' && room !== null && 'id' in room && 'status' in room && room.status !== 'ENDED'
      ));
    } catch (error) {
      if (signal?.aborted) return;
      console.error('Failed to fetch rooms:', error);
      setRooms([]);
      setLoadError('Could not load public rooms. Check your connection and try again.');
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    void loadRooms(controller.signal);
    return () => controller.abort();
  }, [open, loadRooms]);

  return (
    <Modal open={open} onClose={onClose} title="Active Rooms" maxWidth="640px">
      <div className="public-room-list lobby-settings-scroll">
        {isLoading ? (
          <div className="public-room-list__state" role="status">Looking for open tables…</div>
        ) : loadError ? (
          <div className="public-room-list__state" role="alert">
            <p>{loadError}</p>
            <Button type="button" variant="secondary" onClick={() => void loadRooms()}>Try again</Button>
          </div>
        ) : rooms.length === 0 ? (
          <div className="public-room-list__state">No public rooms are open yet. You can create a private game or check back soon.</div>
        ) : (
          rooms.map(rm => (
            <div key={rm.id} className="public-room-row">
              <div>
                <div className="public-room-row__name">{rm.name}</div>
                <div className="public-room-row__meta">
                  <span>{rm.gameType.replace(/_/g, ' ')}</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span style={{ color: 'var(--cloud-dim)' }}>{rm.playersCount} / {rm.maxPlayers} players</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span style={{ color: rm.status === 'PLAYING' ? 'var(--accent-green)' : 'var(--accent-blue)' }}>
                    {rm.status === 'PLAYING' ? 'Live' : 'Lobby'}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => onJoinRoom(rm)}
                variant={rm.status === 'PLAYING' ? 'secondary' : 'primary'}
                style={{ padding: '10px 20px', fontSize: '13px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {rm.status === 'PLAYING' ? <><Eye size={14} /> Spectate</> : <><Dice5 size={14} /> Join</>}
              </Button>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};

export type SelectableGameType = 'MONOPOLY' | 'LUDO' | 'UNO' | 'SNAKES_LADDERS';

interface GameTypeOption {
  type: SelectableGameType;
  name: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}

const GAME_TYPE_OPTIONS: GameTypeOption[] = [
  { type: 'MONOPOLY', name: 'Monopoly', desc: 'Roll, build properties, and collect rent.', icon: <Building2 size={28} />, color: 'var(--gold)' },
  { type: 'LUDO', name: 'Ludo', desc: 'Race 4 tokens home with strategic blockades.', icon: <Dice5 size={28} />, color: 'var(--accent-blue)' },
  { type: 'UNO', name: 'Uno', desc: 'Match colors and cards. Empty your hand first.', icon: <Layers size={28} />, color: 'var(--coral)' },
  { type: 'SNAKES_LADDERS', name: 'Snakes & Ladders', desc: 'Climb ladders, dodge snakes, race to 100.', icon: <Route size={28} />, color: 'var(--lime)' }
];

export interface GameTypeModalProps {
  /** Whether the "Choose Game Type" modal is open. */
  open: boolean;
  onClose: () => void;
  /**
   * Called with the chosen game type when the player picks a card. The
   * parent owns the socket connection and is responsible for emitting
   * `create_room` (with the room name/token it wants to use) and updating
   * room state on success.
   */
  onSelectGameType: (gameType: SelectableGameType) => void;
}

/**
 * "Choose Game Type" modal, extracted from App.tsx's
 * `renderGameTypeSelectionModal`. Room creation (the `create_room` socket
 * emit) is left to the parent via `onSelectGameType` since this component
 * has no socket access.
 */
export const GameTypeModal: React.FC<GameTypeModalProps> = ({ open, onClose, onSelectGameType }) => {
  return (
    <Modal open={open} onClose={onClose} title="Choose Game Type" maxWidth="640px">
      <div className="game-type-grid">
        {GAME_TYPE_OPTIONS.map(gm => (
          <button
            type="button"
            key={gm.type}
            className="game-card"
            onClick={() => onSelectGameType(gm.type)}
            style={{ '--card-accent': gm.color } as React.CSSProperties}
          >
            <span className="game-card-icon">{gm.icon}</span>
            <h3 className="game-card-title">{gm.name}</h3>
            <p className="game-card-desc">{gm.desc}</p>
          </button>
        ))}
      </div>
    </Modal>
  );
};

export default RoomsModal;
