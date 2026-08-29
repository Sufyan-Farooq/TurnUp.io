import React from 'react';
import { Crown, Ban, Rocket, Hourglass } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { getPlayerColorHex } from '../../theme/playerColors';
import type { Room } from './types';

export interface LobbySettings {
  maxPlayers?: number;
  privateRoom?: boolean;
  allowBots?: boolean;
  // Monopoly-only rules
  startingCash?: number;
  doubleRentRule?: boolean;
  vacationCash?: boolean;
  auction?: boolean;
  prisonRent?: boolean;
  mortgage?: boolean;
  evenBuild?: boolean;
  randomizeOrder?: boolean;
  // Uno-only rules
  cardStacking?: boolean;
  cardDoubles?: boolean;
  [key: string]: any;
}

export interface WaitingRoomSidebarProps {
  room: Room | null;
  /** Current user's player id, used to determine host status and "(You)" labeling. */
  currentPlayerId: string | undefined;
  /**
   * Update one lobby setting. Parent is expected to merge with
   * `room.lobbySettings` and emit `update_lobby_settings` over the socket.
   * No-op (ignored) for non-hosts — this component still calls it but relies
   * on the parent/server to enforce the host check; controls are also
   * disabled client-side when `!isHost`.
   */
  onUpdateSetting: (key: string, value: any) => void;
  /** Emits `initiate_vote_kick` for the given target player id. */
  onKickPlayer: (targetPlayerId: string) => void;
  /** Host-only: emits `start_game` with the assembled config. */
  onStartGame: () => void;
}

function getSetting<T>(settings: LobbySettings | undefined, key: string, defaultValue: T): T {
  if (settings && settings[key] !== undefined) return settings[key];
  return defaultValue;
}

/**
 * Extracted from App.tsx `renderLobbySidebar` (~line 4610). Shows the player
 * list (with host badge + kick buttons) and the host-configurable lobby
 * settings (max players, private room, allow bots, and per-game-type rule
 * toggles for Monopoly / Uno), plus the start-game footer.
 */
export const WaitingRoomSidebar: React.FC<WaitingRoomSidebarProps> = ({
  room,
  currentPlayerId,
  onUpdateSetting,
  onKickPlayer,
  onStartGame,
}) => {
  const isHost = room?.hostId === currentPlayerId;
  const settings = room?.lobbySettings as LobbySettings | undefined;

  const maxPlayers = getSetting(settings, 'maxPlayers', 4);
  const privateRoom = getSetting(settings, 'privateRoom', false);
  const allowBots = getSetting(settings, 'allowBots', false);

  const doubleRentRule = getSetting(settings, 'doubleRentRule', true);
  const vacationCash = getSetting(settings, 'vacationCash', false);
  const auction = getSetting(settings, 'auction', false);
  const prisonRent = getSetting(settings, 'prisonRent', false);
  const mortgage = getSetting(settings, 'mortgage', true);
  const evenBuild = getSetting(settings, 'evenBuild', true);
  const randomizeOrder = getSetting(settings, 'randomizeOrder', false);
  const startingCash = getSetting(settings, 'startingCash', 1500);

  const cardStacking = getSetting(settings, 'cardStacking', true);
  const cardDoubles = getSetting(settings, 'cardDoubles', true);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(123,44,191,0.1)' }}>
        <h3 style={{ margin: 0, fontSize: '15px', color: '#fff' }}>Room Lobby settings</h3>
      </div>

      {/* Player List in Lobby */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(123,44,191,0.1)', background: 'rgba(0,0,0,0.1)' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Players ({room?.players?.length || 0})
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {room?.players?.map((p, idx) => {
            const isPlayerHost = p.id === room?.hostId;
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                <Avatar name={p.name} color={getPlayerColorHex(p.color, idx)} size={24} />
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#fff', flex: 1 }}>
                  {p.name} {p.id === currentPlayerId && ' (You)'}
                </span>
                {isPlayerHost && (
                  <Badge variant="purple" icon={<Crown size={11} />}>Host</Badge>
                )}
                {p.id !== currentPlayerId && (
                  <Button variant="danger" onClick={() => onKickPlayer(p.id)} style={{ padding: '2px 6px', fontSize: '10px', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Ban size={11} /> Kick
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable Settings Panel */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="lobby-settings-scroll">
        {/* Game settings Section */}
        <div>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Game settings</h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Max players */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Maximum players</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>How many players can join the game</div>
              </div>
              <select
                value={maxPlayers}
                disabled={!isHost}
                onChange={(e) => onUpdateSetting('maxPlayers', parseInt(e.target.value, 10))}
                style={{ background: 'var(--bg-input)', color: '#fff', border: '1px solid rgba(123,44,191,0.3)', borderRadius: '6px', padding: '4px 8px', outline: 'none' }}
              >
                {room?.gameType === 'LUDO' ? (
                  <>
                    <option value={4}>4 players</option>
                    <option value={6}>6 players</option>
                  </>
                ) : (
                  <>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    {(room?.gameType === 'UNO' || room?.gameType === 'SNAKES_LADDERS') && (
                      <>
                        <option value={5}>5</option>
                        <option value={6}>6</option>
                      </>
                    )}
                  </>
                )}
              </select>
            </div>

            {/* Private room toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, marginRight: '12px' }}>
                <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Private room</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Private rooms can be accessed using the room URL only</div>
              </div>
              <input
                type="checkbox"
                checked={privateRoom}
                disabled={!isHost}
                onChange={(e) => onUpdateSetting('privateRoom', e.target.checked)}
                style={{ cursor: isHost ? 'pointer' : 'default', width: '16px', height: '16px' }}
              />
            </div>

            {/* Allow bots toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, marginRight: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Allow bots to join</span>
                  <Badge variant="red">BETA</Badge>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bots will join the game based on availability</div>
              </div>
              <input
                type="checkbox"
                checked={allowBots}
                disabled={!isHost}
                onChange={(e) => onUpdateSetting('allowBots', e.target.checked)}
                style={{ cursor: isHost ? 'pointer' : 'default', width: '16px', height: '16px' }}
              />
            </div>
          </div>
        </div>

        {room?.gameType === 'MONOPOLY' && (
          <>
            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }} />

            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Gameplay rules</h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Starting cash</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Adjust how much money players start with</div>
                  </div>
                  <select
                    value={startingCash}
                    disabled={!isHost}
                    onChange={(e) => onUpdateSetting('startingCash', parseInt(e.target.value, 10))}
                    style={{ background: 'var(--bg-input)', color: '#fff', border: '1px solid rgba(123,44,191,0.3)', borderRadius: '6px', padding: '4px 8px', outline: 'none' }}
                  >
                    <option value={1000}>$1000</option>
                    <option value={1500}>$1500</option>
                    <option value={2000}>$2000</option>
                    <option value={2500}>$2500</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, marginRight: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>x2 rent on full-set properties</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>If a player owns a full property set, the base rent payment will be doubled</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={doubleRentRule}
                    disabled={!isHost}
                    onChange={(e) => onUpdateSetting('doubleRentRule', e.target.checked)}
                    style={{ cursor: isHost ? 'pointer' : 'default', width: '16px', height: '16px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, marginRight: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Vacation cash</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Landing on Vacation awards all tax/bank payments pool money</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={vacationCash}
                    disabled={!isHost}
                    onChange={(e) => onUpdateSetting('vacationCash', e.target.checked)}
                    style={{ cursor: isHost ? 'pointer' : 'default', width: '16px', height: '16px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, marginRight: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Auction</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>If someone skips purchasing the landed property, it goes to highest bidder</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={auction}
                    disabled={!isHost}
                    onChange={(e) => onUpdateSetting('auction', e.target.checked)}
                    style={{ cursor: isHost ? 'pointer' : 'default', width: '16px', height: '16px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, marginRight: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Don't collect rent in prison</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rent will not be collected when landing on properties of players in prison</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prisonRent}
                    disabled={!isHost}
                    onChange={(e) => onUpdateSetting('prisonRent', e.target.checked)}
                    style={{ cursor: isHost ? 'pointer' : 'default', width: '16px', height: '16px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, marginRight: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Mortgage</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mortgage properties for 50% cash, but mortgaged property won't earn rent</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={mortgage}
                    disabled={!isHost}
                    onChange={(e) => onUpdateSetting('mortgage', e.target.checked)}
                    style={{ cursor: isHost ? 'pointer' : 'default', width: '16px', height: '16px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, marginRight: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Even build</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Houses/hotels must be built up and sold off evenly within set</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={evenBuild}
                    disabled={!isHost}
                    onChange={(e) => onUpdateSetting('evenBuild', e.target.checked)}
                    style={{ cursor: isHost ? 'pointer' : 'default', width: '16px', height: '16px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, marginRight: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Randomize player order</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Randomly reorder players at the beginning of the match</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={randomizeOrder}
                    disabled={!isHost}
                    onChange={(e) => onUpdateSetting('randomizeOrder', e.target.checked)}
                    style={{ cursor: isHost ? 'pointer' : 'default', width: '16px', height: '16px' }}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {room?.gameType === 'UNO' && (
          <>
            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }} />

            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Gameplay rules</h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, marginRight: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Card Stacking</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Allows stacking +2 on +2 and +4 on +2/+4 to pass penalty to next player</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={cardStacking}
                    disabled={!isHost}
                    onChange={(e) => onUpdateSetting('cardStacking', e.target.checked)}
                    style={{ cursor: isHost ? 'pointer' : 'default', width: '16px', height: '16px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, marginRight: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Card Doubles</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Play two cards of the same value together if they match value or color</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={cardDoubles}
                    disabled={!isHost}
                    onChange={(e) => onUpdateSetting('cardDoubles', e.target.checked)}
                    style={{ cursor: isHost ? 'pointer' : 'default', width: '16px', height: '16px' }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action / Start Game Footer */}
      <div style={{ padding: '16px', borderTop: '1px solid rgba(123,44,191,0.15)', background: 'rgba(0,0,0,0.15)' }}>
        {isHost ? (
          <Button
            variant="primary"
            fullWidth
            onClick={onStartGame}
            style={{ padding: '12px', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            Start Game <Rocket size={16} />
          </Button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic', padding: '6px' }}>
            <Hourglass size={13} /> Waiting for host to start match...
          </div>
        )}
      </div>
    </div>
  );
};

export default WaitingRoomSidebar;
