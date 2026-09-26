import React from 'react';
import { Check, ArrowRight, X, Lock } from 'lucide-react';
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
  /** Optional callback to close the picker (when opened from the lobby sidebar). */
  onClose?: () => void;
}

/**
 * Game Kit AppearancePicker: renders the tactile color-swatch grid players use
 * to choose their token color before entering or within the lobby.
 */
export const AppearancePicker: React.FC<AppearancePickerProps> = ({
  currentUserId,
  players,
  gameType,
  maxPlayers,
  availableColors,
  selectedColor,
  onSelectColor,
  onConfirm,
  onClose,
}) => {
  const takenColors = (players || [])
    .filter((p) => p.id !== currentUserId && p.color)
    .map((p) => p.color?.toLowerCase());

  const isLudo = gameType === 'LUDO';
  const columns = isLudo ? (maxPlayers === 6 ? 3 : 4) : 4;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="appearance-picker-title"
      style={{
        width: '92%',
        maxWidth: isLudo ? '440px' : '420px',
        padding: '30px 28px',
        background: '#132737',
        border: '1px solid rgba(210, 161, 101, 0.45)',
        borderRadius: '18px',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
        textAlign: 'center',
        position: 'relative',
        backdropFilter: 'blur(16px)',
        color: 'var(--cloud, #f4f0e7)',
      }}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close appearance picker"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--cloud, #f4f0e7)',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
        >
          <X size={16} />
        </button>
      )}

      <h3
        id="appearance-picker-title"
        style={{
          margin: '0 0 8px 0',
          fontFamily: "'Fredoka', sans-serif",
          fontSize: '23px',
          fontWeight: 700,
          color: '#f4f0e7',
          letterSpacing: '-0.02em',
        }}
      >
        Choose Your Token Color
      </h3>
      <p
        style={{
          color: 'var(--muted, #aebfc2)',
          fontSize: '13px',
          lineHeight: '1.45',
          margin: '0 0 26px 0',
          fontFamily: "'Manrope', sans-serif",
        }}
      >
        {isLudo
          ? 'Select a colored base and seat to claim on the Ludo board.'
          : 'Pick a distinct color token to represent your piece on the board.'}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '16px',
          marginBottom: '28px',
          justifyItems: 'center',
        }}
      >
        {availableColors.map((color) => {
          const isTaken = takenColors.includes(color.toLowerCase());
          const isSelected = selectedColor?.toLowerCase() === color.toLowerCase();

          return (
            <button
              key={color}
              type="button"
              disabled={isTaken}
              onClick={() => onSelectColor(color)}
              aria-label={`Select color ${color}${isSelected ? ' (selected)' : ''}${isTaken ? ' (taken)' : ''}`}
              aria-pressed={isSelected}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: color,
                border: isSelected ? '2px solid #ffffff' : '2px solid rgba(255, 255, 255, 0.16)',
                cursor: isTaken ? 'not-allowed' : 'pointer',
                opacity: isTaken ? 0.22 : 1,
                transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                boxShadow: isSelected
                  ? '0 0 0 3px #132737, 0 0 0 5.5px #f0bc64, 0 6px 14px rgba(0, 0, 0, 0.45)'
                  : '0 2px 6px rgba(0, 0, 0, 0.35)',
                transition: 'transform 0.16s ease, box-shadow 0.16s ease',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              title={isTaken ? 'Taken by another player' : ''}
            >
              {isSelected && (
                <Check
                  size={20}
                  strokeWidth={3}
                  color="#ffffff"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.85))' }}
                />
              )}
              {isTaken && (
                <Lock
                  size={16}
                  strokeWidth={2.5}
                  color="#ffffff"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))' }}
                />
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={!selectedColor}
        onClick={onConfirm}
        style={{
          width: '100%',
          padding: '14px 20px',
          background: selectedColor ? '#e8af55' : 'rgba(255, 255, 255, 0.08)',
          border: selectedColor ? '1px solid #f5c77e' : '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          color: selectedColor ? '#0d1925' : 'rgba(255, 255, 255, 0.35)',
          fontFamily: "'Fredoka', sans-serif",
          fontSize: '16px',
          fontWeight: 700,
          cursor: selectedColor ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: 'none',
          transition: 'background 0.15s ease, transform 0.15s ease',
        }}
      >
        <span>Confirm appearance</span>
        <ArrowRight size={17} strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default AppearancePicker;

