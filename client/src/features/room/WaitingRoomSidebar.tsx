import React from 'react';
import { Ban, Check, CircleAlert, Cloud, CloudOff, Crown, Hourglass, Rocket, X } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { getPlayerColorHex } from '../../theme/playerColors';
import type { LobbySettings, LobbySettingsPatch, Room } from '../../types/game';
import type { SettingsSyncState } from '../../hooks/useRoom';

export interface WaitingRoomSidebarProps {
  room: Room | null;
  currentPlayerId: string | undefined;
  isConnected: boolean;
  settingsSyncState: SettingsSyncState;
  settingsSyncMessage: string | null;
  onUpdateSettings: (settings: LobbySettingsPatch) => boolean;
  onKickPlayer: (targetPlayerId: string) => void;
  onStartGame: () => void;
  onClose?: () => void;
}

const DEFAULT_SETTINGS: LobbySettings = {
  maxPlayers: 4,
  privateRoom: false,
  allowBots: false,
  startingCash: 1500,
  doubleRentRule: true,
  vacationCash: false,
  auction: false,
  prisonRent: false,
  mortgage: true,
  evenBuild: true,
  randomizeOrder: false,
  cardStacking: true,
  cardDoubles: true,
};

interface ToggleRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
  badge?: React.ReactNode;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ id, label, description, checked, disabled, onChange, badge }) => (
  <div className="lobby-setting-row">
    <div className="lobby-setting-copy">
      <label htmlFor={id} className="lobby-setting-label">{label} {badge}</label>
      <p id={`${id}-description`} className="lobby-setting-description">{description}</p>
    </div>
    <label className="switch" aria-label={label}>
      <input id={id} type="checkbox" checked={checked} disabled={disabled} aria-describedby={`${id}-description`} onChange={event => onChange(event.target.checked)} />
      <span className="slider round" aria-hidden="true" />
    </label>
  </div>
);

export const WaitingRoomSidebar: React.FC<WaitingRoomSidebarProps> = ({ room, currentPlayerId, isConnected, settingsSyncState, settingsSyncMessage, onUpdateSettings, onKickPlayer, onStartGame, onClose }) => {
  const isHost = room?.hostId === currentPlayerId;
  const settings = { ...DEFAULT_SETTINGS, ...room?.lobbySettings };
  const players = room?.players ?? [];
  const isEditingDisabled = !isHost || !isConnected || settingsSyncState === 'saving';
  const maxPlayerChoices = room?.gameType === 'LUDO' ? [4, 6] : room?.gameType === 'UNO' || room?.gameType === 'SNAKES_LADDERS' ? [2, 3, 4, 5, 6] : [2, 3, 4];
  const visibleMaxPlayerChoices = maxPlayerChoices.filter(value => value >= players.length || value === settings.maxPlayers);
  const waitingPlayers = players.filter(player => player.id !== room?.hostId && (!player.ready || !player.connected));
  const needsOpponent = players.length < 2 && !settings.allowBots;
  const canStart = isHost && isConnected && settingsSyncState !== 'saving' && waitingPlayers.length === 0 && !needsOpponent;

  const update = <K extends keyof LobbySettings>(key: K, value: LobbySettings[K]) => {
    onUpdateSettings({ [key]: value } as LobbySettingsPatch);
  };

  const startHint = !isConnected
    ? 'Reconnect to the server before starting.'
    : settingsSyncState === 'saving'
      ? 'Wait for settings to finish saving.'
      : needsOpponent
        ? 'Invite another player or enable bots.'
        : waitingPlayers.length > 0
          ? `Waiting for ${waitingPlayers.map(player => player.name).join(', ')} to be ready and online.`
          : 'Everyone is ready. Start when you are.';

  return (
    <aside className="waiting-room" aria-label="Lobby players and settings">
      <header className="waiting-room-header">
        <div><h2>Lobby settings</h2><p>{isHost ? 'Configure this match before it starts.' : 'The host controls match settings.'}</p></div>
        {onClose && <button type="button" className="waiting-room-close" onClick={onClose} aria-label="Close lobby settings"><X size={18} /></button>}
      </header>

      <section className="lobby-player-section" aria-labelledby="lobby-player-heading">
        <div className="lobby-section-heading"><h3 id="lobby-player-heading">Players</h3><span>{players.length}/{settings.maxPlayers}</span></div>
        <div className="lobby-player-list">
          {players.map((player, index) => {
            const isPlayerHost = player.id === room?.hostId;
            return (
              <div key={player.id} className="lobby-player-row">
                <Avatar name={player.name} color={getPlayerColorHex(player.color, index)} size={32} />
                <div className="lobby-player-copy">
                  <span className="lobby-player-name">{player.name}{player.id === currentPlayerId ? ' (you)' : ''}</span>
                  <span className={`lobby-player-status ${player.connected && player.ready ? 'is-ready' : ''}`}>{!player.connected ? 'Reconnecting' : player.ready ? 'Ready' : 'Not ready'}</span>
                </div>
                {isPlayerHost && <Badge variant="purple" icon={<Crown size={11} />}>Host</Badge>}
                {!isPlayerHost && player.id !== currentPlayerId && (
                  <Button type="button" variant="ghost" className="lobby-vote-button" onClick={() => onKickPlayer(player.id)} aria-label={`Start a vote to remove ${player.name}`} title="Start vote to remove"><Ban size={15} /></Button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="lobby-settings-scroll waiting-room-settings">
        <section aria-labelledby="match-settings-heading">
          <div className="lobby-section-heading">
            <h3 id="match-settings-heading">Match</h3>
            <span className={`settings-sync settings-sync--${settingsSyncState}`} role="status" aria-live="polite">
              {settingsSyncState === 'saving' && <Cloud size={12} />}{settingsSyncState === 'saved' && <Check size={12} />}{settingsSyncState === 'error' && <CloudOff size={12} />}
              {settingsSyncMessage ?? (isHost ? 'Auto-save' : 'Read only')}
            </span>
          </div>

          <div className="lobby-setting-row">
            <div className="lobby-setting-copy"><label htmlFor="max-players" className="lobby-setting-label">Maximum players</label><p id="max-players-description" className="lobby-setting-description">Sets the room capacity and bot fill target.</p></div>
            <select id="max-players" className="lobby-setting-select" value={settings.maxPlayers} disabled={isEditingDisabled} aria-describedby="max-players-description" onChange={event => update('maxPlayers', Number(event.target.value))}>
              {visibleMaxPlayerChoices.map(value => <option key={value} value={value}>{value} players</option>)}
            </select>
          </div>

          <ToggleRow id="private-room" label="Private room" description="Hide this room from the public room browser." checked={settings.privateRoom} disabled={isEditingDisabled} onChange={value => update('privateRoom', value)} />
          <ToggleRow id="allow-bots" label="Fill empty seats with bots" description="Bots occupy open seats when the match starts." checked={settings.allowBots} disabled={isEditingDisabled} onChange={value => update('allowBots', value)} badge={<Badge variant="red">Beta</Badge>} />
        </section>

        {room?.gameType === 'MONOPOLY' && (
          <section className="lobby-rules-section" aria-labelledby="game-rules-heading">
            <div className="lobby-section-heading"><h3 id="game-rules-heading">Monopoly rules</h3></div>
            <div className="lobby-setting-row">
              <div className="lobby-setting-copy"><label htmlFor="starting-cash" className="lobby-setting-label">Starting cash</label><p id="starting-cash-description" className="lobby-setting-description">Money each player receives at the start.</p></div>
              <select id="starting-cash" className="lobby-setting-select" value={settings.startingCash} disabled={isEditingDisabled} aria-describedby="starting-cash-description" onChange={event => update('startingCash', Number(event.target.value))}>
                {[1000, 1500, 2000, 2500].map(value => <option key={value} value={value}>${value.toLocaleString()}</option>)}
              </select>
            </div>
            <ToggleRow id="double-rent" label="Double rent on a full set" description="Double base rent when an owner controls the full color set." checked={settings.doubleRentRule} disabled={isEditingDisabled} onChange={value => update('doubleRentRule', value)} />
            <ToggleRow id="vacation-cash" label="Free Parking cash" description="Award the tax and bank payment pool on Free Parking." checked={settings.vacationCash} disabled={isEditingDisabled} onChange={value => update('vacationCash', value)} />
            <ToggleRow id="property-auctions" label="Property auctions" description="Auction an unpurchased property to the highest bidder." checked={settings.auction} disabled={isEditingDisabled} onChange={value => update('auction', value)} />
            <ToggleRow id="prison-rent" label="No rent while in jail" description="Players in jail cannot collect rent." checked={settings.prisonRent} disabled={isEditingDisabled} onChange={value => update('prisonRent', value)} />
            <ToggleRow id="mortgage" label="Mortgages" description="Allow properties to be mortgaged for cash." checked={settings.mortgage} disabled={isEditingDisabled} onChange={value => update('mortgage', value)} />
            <ToggleRow id="even-build" label="Even building" description="Build and sell houses evenly across a color set." checked={settings.evenBuild} disabled={isEditingDisabled} onChange={value => update('evenBuild', value)} />
            <ToggleRow id="random-order" label="Random player order" description="Shuffle the turn order when the match starts." checked={settings.randomizeOrder} disabled={isEditingDisabled} onChange={value => update('randomizeOrder', value)} />
          </section>
        )}

        {room?.gameType === 'UNO' && (
          <section className="lobby-rules-section" aria-labelledby="uno-rules-heading">
            <div className="lobby-section-heading"><h3 id="uno-rules-heading">Uno rules</h3></div>
            <ToggleRow id="card-stacking" label="Draw-card stacking" description="Stack compatible draw cards and pass the penalty onward." checked={settings.cardStacking} disabled={isEditingDisabled} onChange={value => update('cardStacking', value)} />
            <ToggleRow id="card-doubles" label="Play matching doubles" description="Play two cards of the same value together when legal." checked={settings.cardDoubles} disabled={isEditingDisabled} onChange={value => update('cardDoubles', value)} />
          </section>
        )}
      </div>

      <footer className="waiting-room-footer">
        {isHost ? (
          <>
            <p className={`start-readiness ${canStart ? 'is-ready' : ''}`} role="status">{canStart ? <Check size={14} /> : <CircleAlert size={14} />}{startHint}</p>
            <Button type="button" variant="primary" fullWidth onClick={onStartGame} disabled={!canStart} className="start-game-button">Start game <Rocket size={16} /></Button>
          </>
        ) : <p className="start-readiness"><Hourglass size={14} />Waiting for the host to start the match.</p>}
      </footer>
    </aside>
  );
};

export default WaitingRoomSidebar;
