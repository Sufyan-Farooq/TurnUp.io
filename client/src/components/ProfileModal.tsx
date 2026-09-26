import React, { useEffect, useState, useMemo } from 'react';
import {
  Trophy,
  Gamepad2,
  TrendingUp,
  Award,
  Calendar,
  Mail,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  Dice5
} from 'lucide-react';
import { Modal, Button } from './ui';
import { SERVER_URL } from '../hooks/useSocket';
import type { AuthUser, UserProfileData, GameType } from '../types/game';

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onOpenRegister?: () => void;
}

const GAME_NAMES: Record<GameType, string> = {
  SNAKES_LADDERS: 'Snakes & Ladders',
  LUDO: 'Ludo',
  UNO: 'Uno',
  MONOPOLY: 'Monopoly',
};

const GAME_COLORS: Record<GameType, string> = {
  SNAKES_LADDERS: '#3FBF7F',
  LUDO: '#FF5C66',
  UNO: '#4E8CFF',
  MONOPOLY: '#f0bc64',
};

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenRegister,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | GameType>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);

  const isGuest = currentUser?.role === 'GUEST';

  const fetchProfile = async () => {
    if (!currentUser || isGuest) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${SERVER_URL}/api/users/${currentUser.id}/profile`);
      const data = await res.json();
      if (data.success && data.profile) {
        setProfileData(data.profile);
      } else {
        setError(data.message || 'Could not load profile.');
      }
    } catch (err) {
      console.error('Profile fetch failed:', err);
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser && !isGuest) {
      void fetchProfile();
    }
  }, [isOpen, currentUser?.id, isGuest]);

  const filteredMatches = useMemo(() => {
    if (!profileData?.matchHistory) return [];
    if (historyFilter === 'ALL') return profileData.matchHistory;
    return profileData.matchHistory.filter(m => m.gameType === historyFilter);
  }, [profileData?.matchHistory, historyFilter]);

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen || !currentUser) return null;

  return (
    <Modal open={isOpen} onClose={onClose} maxWidth="680px">
      <div className="profile-sheet">
        {/* Header Profile Summary */}
        <div className="profile-header-card">
          <div className="profile-avatar-circle">
            {currentUser.username.charAt(0).toUpperCase()}
          </div>
          <div className="profile-header-meta">
            <div className="profile-header-title-row">
              <h2 className="profile-username">{currentUser.username}</h2>
              {isGuest ? (
                <span className="profile-role-badge guest">Guest Mode</span>
              ) : (
                <span className="profile-role-badge verified">
                  <ShieldCheck size={12} /> Registered Member
                </span>
              )}
            </div>

            <div className="profile-sub-meta">
              {currentUser.email && (
                <span className="profile-sub-item">
                  <Mail size={13} /> {currentUser.email}
                </span>
              )}
              {profileData?.user.createdAt && (
                <span className="profile-sub-item">
                  <Calendar size={13} /> Member since {formatDate(profileData.user.createdAt).split(',')[0]}
                </span>
              )}
              {isGuest && (
                <span className="profile-sub-item guest-note">
                  Temporary guest session
                </span>
              )}
            </div>
          </div>

          {!isGuest && (
            <button
              type="button"
              className="profile-refresh-btn"
              onClick={() => void fetchProfile()}
              title="Refresh stats"
              disabled={loading}
              aria-label="Refresh stats"
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
            </button>
          )}
        </div>

        {/* Guest Upsell Banner */}
        {isGuest && (
          <div className="profile-guest-banner">
            <div className="profile-guest-banner-icon">
              <Sparkles size={24} color="var(--gold)" />
            </div>
            <div className="profile-guest-banner-body">
              <strong>Unlock Match History & Career Stats</strong>
              <p>
                You are currently playing in Guest Mode. Matches and statistics are not permanently tracked for guest nicknames. Create a free account to record your wins, win rates, and climb the leaderboard!
              </p>
              {onOpenRegister && (
                <Button
                  variant="primary"
                  onClick={() => {
                    onClose();
                    onOpenRegister();
                  }}
                  style={{ marginTop: 10, padding: '10px 20px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <UserPlus size={16} /> Create Free Account
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Tab Controls for Registered Users */}
        {!isGuest && (
          <>
            <div className="profile-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'overview'}
                className={`profile-tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <Trophy size={15} /> Career Overview
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'history'}
                className={`profile-tab ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <Gamepad2 size={15} /> Match History
                {profileData?.matchHistory?.length ? (
                  <span className="profile-tab-count">{profileData.matchHistory.length}</span>
                ) : null}
              </button>
            </div>

            {loading && !profileData && (
              <div className="profile-loading-state">
                <RefreshCw size={24} className="spin" />
                <span>Loading your player stats…</span>
              </div>
            )}

            {error && (
              <div className="profile-error-alert" role="alert">
                {error}
                <button type="button" onClick={() => void fetchProfile()} className="profile-retry-link">
                  Retry
                </button>
              </div>
            )}

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && profileData && (
              <div className="profile-overview-pane">
                {/* 4 Stat Highlights */}
                <div className="profile-highlights-grid">
                  <div className="profile-stat-tile">
                    <div className="profile-stat-icon" style={{ backgroundColor: 'rgba(78, 140, 255, 0.15)', color: '#4E8CFF' }}>
                      <Gamepad2 size={20} />
                    </div>
                    <div className="profile-stat-data">
                      <span className="profile-stat-number">{profileData.aggregates.totalPlayed}</span>
                      <span className="profile-stat-label">Matches Played</span>
                    </div>
                  </div>

                  <div className="profile-stat-tile">
                    <div className="profile-stat-icon" style={{ backgroundColor: 'rgba(63, 191, 127, 0.15)', color: '#3FBF7F' }}>
                      <Trophy size={20} />
                    </div>
                    <div className="profile-stat-data">
                      <span className="profile-stat-number">{profileData.aggregates.totalWon}</span>
                      <span className="profile-stat-label">Victories</span>
                    </div>
                  </div>

                  <div className="profile-stat-tile">
                    <div className="profile-stat-icon" style={{ backgroundColor: 'rgba(240, 188, 100, 0.15)', color: 'var(--gold)' }}>
                      <TrendingUp size={20} />
                    </div>
                    <div className="profile-stat-data">
                      <span className="profile-stat-number">{profileData.aggregates.winRate}%</span>
                      <span className="profile-stat-label">Win Rate</span>
                    </div>
                  </div>

                  <div className="profile-stat-tile">
                    <div className="profile-stat-icon" style={{ backgroundColor: 'rgba(255, 92, 102, 0.15)', color: 'var(--coral)' }}>
                      <Award size={20} />
                    </div>
                    <div className="profile-stat-data">
                      <span className="profile-stat-number">{profileData.aggregates.totalPoints.toLocaleString()}</span>
                      <span className="profile-stat-label">Total Points</span>
                    </div>
                  </div>
                </div>

                {/* Per-Game Stats Grid */}
                <h3 className="profile-section-heading">Games Breakdown</h3>
                <div className="profile-games-grid">
                  {(['LUDO', 'MONOPOLY', 'UNO', 'SNAKES_LADDERS'] as GameType[]).map((gt) => {
                    const stat = profileData.stats.find(s => s.gameType === gt);
                    const played = stat?.gamesPlayed || 0;
                    const won = stat?.gamesWon || 0;
                    const rate = played > 0 ? Math.round((won / played) * 100) : 0;
                    const points = stat?.totalPoints || 0;

                    return (
                      <div key={gt} className="profile-game-card">
                        <div className="profile-game-card-header">
                          <span
                            className="profile-game-dot"
                            style={{ backgroundColor: GAME_COLORS[gt] }}
                          />
                          <span className="profile-game-title">{GAME_NAMES[gt]}</span>
                          <span className="profile-game-winrate">{rate}% win</span>
                        </div>
                        <div className="profile-game-stats-row">
                          <div className="profile-game-mini-stat">
                            <span className="mini-num">{played}</span>
                            <span className="mini-label">Played</span>
                          </div>
                          <div className="profile-game-mini-stat">
                            <span className="mini-num" style={{ color: '#3FBF7F' }}>{won}</span>
                            <span className="mini-label">Won</span>
                          </div>
                          <div className="profile-game-mini-stat">
                            <span className="mini-num" style={{ color: 'var(--gold)' }}>{points.toLocaleString()}</span>
                            <span className="mini-label">Points</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: MATCH HISTORY */}
            {activeTab === 'history' && profileData && (
              <div className="profile-history-pane">
                {/* Filter Pills */}
                <div className="profile-filter-bar">
                  <button
                    type="button"
                    className={`profile-filter-chip ${historyFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setHistoryFilter('ALL')}
                  >
                    All Games
                  </button>
                  {(['LUDO', 'MONOPOLY', 'UNO', 'SNAKES_LADDERS'] as GameType[]).map((gt) => (
                    <button
                      key={gt}
                      type="button"
                      className={`profile-filter-chip ${historyFilter === gt ? 'active' : ''}`}
                      onClick={() => setHistoryFilter(gt)}
                    >
                      {GAME_NAMES[gt]}
                    </button>
                  ))}
                </div>

                {filteredMatches.length === 0 ? (
                  <div className="profile-empty-history">
                    <Dice5 size={40} style={{ opacity: 0.35, marginBottom: 12 }} />
                    <p className="empty-title">No matches recorded yet</p>
                    <p className="empty-desc">
                      Jump into a public room or create a game to start logging match results!
                    </p>
                  </div>
                ) : (
                  <div className="profile-match-list">
                    {filteredMatches.map((match) => (
                      <div
                        key={match.matchId}
                        className={`profile-match-row ${match.isWinner ? 'is-win' : 'is-loss'}`}
                      >
                        <div className="profile-match-left">
                          <div className="profile-match-badge-col">
                            <span
                              className="profile-game-badge"
                              style={{
                                borderColor: GAME_COLORS[match.gameType],
                                color: GAME_COLORS[match.gameType],
                                backgroundColor: `${GAME_COLORS[match.gameType]}18`
                              }}
                            >
                              {GAME_NAMES[match.gameType]}
                            </span>
                            <span className="profile-match-time">
                              <Clock size={11} /> {formatDate(match.startedAt)}
                            </span>
                          </div>

                          <div className="profile-match-details">
                            <div className="profile-match-outcome-line">
                              {match.isWinner ? (
                                <span className="outcome-pill victory">
                                  <CheckCircle2 size={13} /> Victory
                                </span>
                              ) : (
                                <span className="outcome-pill defeat">
                                  <XCircle size={13} /> Rank #{match.rank || 2}
                                </span>
                              )}
                              <span className="profile-match-score">
                                Score: <strong>{match.score.toLocaleString()}</strong>
                              </span>
                            </div>

                            {match.opponents.length > 0 && (
                              <div className="profile-match-opponents">
                                <span className="opponents-label">Opponents:</span>
                                {match.opponents.map((opp) => (
                                  <span key={opp.userId} className="opponent-tag">
                                    {opp.username}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="profile-match-winner-col">
                          {match.isWinner ? (
                            <span className="winner-label you">Winner: You</span>
                          ) : match.winner ? (
                            <span className="winner-label">Winner: {match.winner.username}</span>
                          ) : (
                            <span className="winner-label ended">Completed</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default ProfileModal;
