import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { Player } from './types';

export interface AppearancePickerProps {
  /** The current player's own id, used to exclude their own reserved color from "taken" checks. */
  currentUserId: string | undefined;
  /** All players currently in the room (used to compute which colors are already taken). */
  players: Player[] | undefined;
  gameType: string | undefined;
  /** Current lobbySettings.maxPlayers (defaults to 4 upstream). */
  maxPlayers: number;
  /** The color palette to render as swatches (already resolved for gameType/maxPlayers, e.g. via theme/playerColors.getValidAppearanceColors). */
  availableColors: readonly string[];
  /** Currently selected (but not yet confirmed) color. */
  selectedColor: string;
  onSelectColor: (color: string) => void;
  /** Called when the player confirms their choice and wants to join the lobby. */
  onConfirm: () => void;
}

/**
 * Extracted from App.tsx `renderAppearancePicker` (~line 1077). Renders the
 * color-swatch grid players use to pick their token color before joining the
 * lobby view. Confirmation ("Join game") is delegated to `onConfirm`, which
 * the parent wires to `socket.emit('select_appearance', { color }, cb)`.
 */
export const AppearancePicker: React.FC<AppearancePickerProps> = ({
  currentUserId,
  players,
  availableColors,
  selectedColor,
  onSelectColor,
  onConfirm,
}) => {
  const takenColors = (players || [])
    .filter((p) => p.id !== currentUserId && p.color)
    .map((p) => p.color);

  return (
    <Card style={{ padding: '32px', maxWidth: '420px', width: '90%', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#fff' }}>Select player appearance:</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 24px 0' }}>
        Choose a color token to represent you on the board.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '32px',
          justifyItems: 'center',
        }}
      >
        {availableColors.map((color) => {
          const isTaken = takenColors.includes(color);
          const isSelected = selectedColor === color;

          return (
            <button
              key={color}
              disabled={isTaken}
              onClick={() => onSelectColor(color)}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: color,
                border: isSelected ? '4px solid #fff' : '2px solid rgba(255,255,255,0.1)',
                cursor: isTaken ? 'not-allowed' : 'pointer',
                opacity: isTaken ? 0.25 : 1,
                transform: isSelected ? 'scale(1.15)' : 'none',
                boxShadow: isSelected ? `0 0 20px ${color}` : 'none',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
              title={isTaken ? 'Taken by another player' : ''}
            >
              {isSelected && (
                <span
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: '#fff',
                    display: 'flex',
                  }}
                >
                  <Check size={18} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Button
        variant="primary"
        fullWidth
        disabled={!selectedColor}
        onClick={onConfirm}
        style={{ fontSize: '16px', padding: '14px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
      >
        Join game <ArrowRight size={16} />
      </Button>
    </Card>
  );
};

export default AppearancePicker;
