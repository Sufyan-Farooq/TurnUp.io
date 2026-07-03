import React, { useState, useEffect, useRef } from 'react';
import { SocketService } from './services/socket';
import { BoardWrapper } from './components/BoardWrapper';
import { Socket } from 'socket.io-client';

interface Dice3DProps {
  value: number;
  isRolling: boolean;
  onClick?: () => void;
  size?: number;
}

const renderDiceDots = (value: number, size = 60) => {
  const dotPositions: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
  };

  const activeDots = dotPositions[value] || [];
  const containerSize = size * 0.6;
  const dotSize = size * 0.14;
  const gap = size * 0.06;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: 'repeat(3, 1fr)',
      width: `${containerSize}px`,
      height: `${containerSize}px`,
      gap: `${gap}px`,
      padding: `${gap}px`,
      boxSizing: 'border-box'
    }}>
      {Array.from({ length: 9 }, (_, idx) => {
        const isActive = activeDots.includes(idx);
        return (
          <div 
            key={idx} 
            style={{
              width: `${dotSize}px`,
              height: `${dotSize}px`,
              borderRadius: '50%',
              backgroundColor: isActive ? '#181818' : 'transparent',
              boxShadow: isActive ? 'inset 0 1px 2px rgba(0,0,0,0.6)' : 'none',
              transition: 'background-color 0.2s'
            }}
          />
        );
      })}
    </div>
  );
};

const getDiceTransform = (val: number) => {
  switch (val) {
    case 1: return 'rotateX(0deg) rotateY(0deg)';
    case 2: return 'rotateX(0deg) rotateY(-90deg)';
    case 3: return 'rotateX(0deg) rotateY(-180deg)';
    case 4: return 'rotateX(0deg) rotateY(90deg)';
    case 5: return 'rotateX(-90deg) rotateY(0deg)';
    case 6: return 'rotateX(90deg) rotateY(0deg)';
    default: return 'rotateX(-15deg) rotateY(45deg)';
  }
};

const Dice3D: React.FC<Dice3DProps> = ({ value, isRolling, onClick, size = 60 }) => {
  const half = size / 2;
  const style: React.CSSProperties = isRolling ? {} : {
    transform: getDiceTransform(value)
  };

  return (
    <div className="dice-container" style={{ margin: `${size * 0.15}px`, perspective: `${size * 10}px` }}>
      <div 
        className={`dice-3d ${isRolling ? 'dice-rolling' : ''}`} 
        onClick={onClick}
        style={{
          ...style,
          width: `${size}px`,
          height: `${size}px`
        }}
      >
        <div className="dice-face face-1" style={{ width: `${size}px`, height: `${size}px`, transform: `rotateY(0deg) translateZ(${half}px)`, borderRadius: `${size * 0.2}px` }}>{renderDiceDots(1, size)}</div>
        <div className="dice-face face-2" style={{ width: `${size}px`, height: `${size}px`, transform: `rotateY(90deg) translateZ(${half}px)`, borderRadius: `${size * 0.2}px` }}>{renderDiceDots(2, size)}</div>
        <div className="dice-face face-3" style={{ width: `${size}px`, height: `${size}px`, transform: `rotateY(180deg) translateZ(${half}px)`, borderRadius: `${size * 0.2}px` }}>{renderDiceDots(3, size)}</div>
        <div className="dice-face face-4" style={{ width: `${size}px`, height: `${size}px`, transform: `rotateY(-90deg) translateZ(${half}px)`, borderRadius: `${size * 0.2}px` }}>{renderDiceDots(4, size)}</div>
        <div className="dice-face face-5" style={{ width: `${size}px`, height: `${size}px`, transform: `rotateX(90deg) translateZ(${half}px)`, borderRadius: `${size * 0.2}px` }}>{renderDiceDots(5, size)}</div>
        <div className="dice-face face-6" style={{ width: `${size}px`, height: `${size}px`, transform: `rotateX(-90deg) translateZ(${half}px)`, borderRadius: `${size * 0.2}px` }}>{renderDiceDots(6, size)}</div>
      </div>
    </div>
  );
};

const getMonopolySpaceIcon = (type: string, name: string) => {
  switch (type) {
    case 'go': return <span style={{ fontSize: '20px' }}>🏁</span>;
    case 'community_chest': return <img src="/images/chest.png" alt="Chest" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />;
    case 'tax': return <span style={{ fontSize: '20px' }}>💸</span>;
    case 'railroad': return <span style={{ fontSize: '20px' }}>✈️</span>;
    case 'chance': return <img src="/images/surprise.png" alt="Surprise" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />;
    case 'jail': return <span style={{ fontSize: '20px' }}>🔒</span>;
    case 'utility': return <span style={{ fontSize: '20px' }}>{name.includes('Power') || name.includes('Gas') ? '⚡' : '💧'}</span>;
    case 'free_parking': return <img src="/images/vacation.png" alt="Vacation" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />;
    case 'go_to_jail': return <span style={{ fontSize: '20px' }}>🚨</span>;
    default: return null;
  }
};


interface Player {
  id: string;
  name: string;
  connected: boolean;
  ready: boolean;
  color?: string; // Player chosen appearance color
}

interface Room {
  id: string;
  name: string;
  hostId: string;
  status: 'LOBBY' | 'PLAYING' | 'ENDED';
  gameType: string;
  players: Player[];
  lobbySettings?: Record<string, any>; // Host game configs
}

interface UnoCard {
  color: 'red' | 'green' | 'blue' | 'yellow' | 'wild';
  value: string;
}

interface MonopolySpace {
  name: string;
  type: string;
  group?: string;
  price?: number;
  houseCost?: number;
  flag?: string;
  rent?: number[];
  mortgageValue?: number;
}

interface GameState {
  gameId: string;
  gameType: string;
  status: string;
  activePlayerId: string;
  turnOrder: string[];
  subState: string;
  winnerId: string | null;
  players?: Player[];
  gameSpecificState: any;
}

const SERVER_URL = 'http://localhost:3000';

const LUDO_TRACK_COORDS: [number, number][] = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0], [6, 0]
];

const LUDO_6_TRACK_COORDS: [number, number][] = [
  [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6],
  [2, 7],
  [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [5, 15], [4, 15], [3, 15], [2, 15],
  [2, 16],
  [2, 17], [3, 17], [4, 17], [5, 17],
  [6, 18], [6, 19], [6, 20], [6, 21], [6, 22], [6, 23],
  [7, 23], [8, 23], [8, 22], [8, 21], [8, 20], [8, 19], [8, 18],
  [9, 17], [10, 17], [11, 17], [12, 17],
  [12, 16],
  [12, 15], [11, 15], [10, 15], [9, 15],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8],
  [12, 7],
  [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0]
];

const MONOPOLY_BOARD: MonopolySpace[] = [
  { name: 'START', type: 'go' }, // 0
  { name: 'Salvador', type: 'property', group: 'brazil', price: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50, mortgageValue: 30, flag: '/flags/brazil.svg' }, // 1
  { name: 'Treasure', type: 'community_chest' }, // 2
  { name: 'Rio', type: 'property', group: 'brazil', price: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50, mortgageValue: 30, flag: '/flags/brazil.svg' }, // 3
  { name: 'Earnings Tax', type: 'tax', price: 200 }, // 4
  { name: 'Tel Aviv', type: 'property', group: 'israel', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgageValue: 50, flag: '/flags/israel.svg' }, // 5
  { name: 'TLV Airport', type: 'railroad', price: 200, mortgageValue: 100 }, // 6
  { name: 'Haifa', type: 'property', group: 'israel', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgageValue: 50, flag: '/flags/israel.svg' }, // 7
  { name: 'Jerusalem', type: 'property', group: 'israel', price: 110, rent: [8, 40, 100, 300, 450, 600], houseCost: 50, mortgageValue: 55, flag: '/flags/israel.svg' }, // 8
  { name: 'Surprise', type: 'chance' }, // 9
  { name: 'Mumbai', type: 'property', group: 'india', price: 120, rent: [8, 45, 120, 350, 500, 650], houseCost: 100, mortgageValue: 60, flag: '/flags/india.svg' }, // 10
  { name: 'New Delhi', type: 'property', group: 'india', price: 130, rent: [10, 45, 130, 400, 575, 700], houseCost: 100, mortgageValue: 65, flag: '/flags/india.svg' }, // 11
  { name: 'In Prison / Passing by', type: 'jail' }, // 12
  { name: 'Venice', type: 'property', group: 'italy', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgageValue: 70, flag: '/flags/italy.svg' }, // 13
  { name: 'Bologna', type: 'property', group: 'italy', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgageValue: 70, flag: '/flags/italy.svg' }, // 14
  { name: 'Power Company', type: 'utility', price: 150, mortgageValue: 75 }, // 15
  { name: 'Milan', type: 'property', group: 'italy', price: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100, mortgageValue: 80, flag: '/flags/italy.svg' }, // 16
  { name: 'Rome', type: 'property', group: 'italy', price: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100, mortgageValue: 80, flag: '/flags/italy.svg' }, // 17
  { name: 'MUC Airport', type: 'railroad', price: 200, mortgageValue: 100 }, // 18
  { name: 'Frankfurt', type: 'property', group: 'germany', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgageValue: 90, flag: '/flags/germany.svg' }, // 19
  { name: 'Treasure', type: 'community_chest' }, // 20
  { name: 'Munich', type: 'property', group: 'germany', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgageValue: 90, flag: '/flags/germany.svg' }, // 21
  { name: 'Gas Company', type: 'utility', price: 150, mortgageValue: 75 }, // 22
  { name: 'Berlin', type: 'property', group: 'germany', price: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100, mortgageValue: 100, flag: '/flags/germany.svg' }, // 23
  { name: 'Vacation', type: 'free_parking' }, // 24
  { name: 'Shenzhen', type: 'property', group: 'china', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgageValue: 110, flag: '/flags/china.svg' }, // 25
  { name: 'Surprise', type: 'chance' }, // 26
  { name: 'Beijing', type: 'property', group: 'china', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgageValue: 110, flag: '/flags/china.svg' }, // 27
  { name: 'Treasure', type: 'community_chest' }, // 28
  { name: 'Shanghai', type: 'property', group: 'china', price: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150, mortgageValue: 120, flag: '/flags/china.svg' }, // 29
  { name: 'CDG Airport', type: 'railroad', price: 200, mortgageValue: 100 }, // 30
  { name: 'Toulouse', type: 'property', group: 'france', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgageValue: 130, flag: '/flags/france.svg' }, // 31
  { name: 'Paris', type: 'property', group: 'france', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgageValue: 130, flag: '/flags/france.svg' }, // 32
  { name: 'Water Company', type: 'utility', price: 150, mortgageValue: 75 }, // 33
  { name: 'Yokohama', type: 'property', group: 'japan', price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, mortgageValue: 140, flag: '/flags/japan.svg' }, // 34
  { name: 'Tokyo', type: 'property', group: 'japan', price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, mortgageValue: 140, flag: '/flags/japan.svg' }, // 35
  { name: 'Go to prison', type: 'go_to_jail' }, // 36
  { name: 'Liverpool', type: 'property', group: 'united-kingdom', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgageValue: 150, flag: '/flags/united_kingdom.svg' }, // 37
  { name: 'Manchester', type: 'property', group: 'united-kingdom', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgageValue: 150, flag: '/flags/united_kingdom.svg' }, // 38
  { name: 'Treasure', type: 'community_chest' }, // 39
  { name: 'Birmingham', type: 'property', group: 'united-kingdom', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, mortgageValue: 160, flag: '/flags/united_kingdom.svg' }, // 40
  { name: 'London', type: 'property', group: 'united-kingdom', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, mortgageValue: 160, flag: '/flags/united_kingdom.svg' }, // 41
  { name: 'JFK Airport', type: 'railroad', price: 200, mortgageValue: 100 }, // 42
  { name: 'Los Angeles', type: 'property', group: 'united-states-of-america', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200, mortgageValue: 175, flag: '/flags/united_states.svg' }, // 43
  { name: 'Surprise', type: 'chance' }, // 44
  { name: 'San Francisco', type: 'property', group: 'united-states-of-america', price: 360, rent: [40, 180, 540, 1200, 1450, 1675], houseCost: 200, mortgageValue: 180, flag: '/flags/united_states.svg' }, // 45
  { name: 'Premium Tax', type: 'tax', price: 75 }, // 46
  { name: 'New York', type: 'property', group: 'united-states-of-america', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200, mortgageValue: 200, flag: '/flags/united_states.svg' } // 47
];

const colorGroupMap: Record<string, string> = {
  'brazil': '#8E6F56', // Warm brown
  'israel': '#A1C8E7', // Light blue
  'india': '#DB8CB9', // Magenta/pinkish
  'italy': '#DE9265', // Orange
  'germany': '#D85465', // Red
  'china': '#E5C067', // Yellow
  'france': '#67B88C', // Green
  'japan': '#58887F', // Teal/darker green
  'united-kingdom': '#416B98', // Darker blue
  'united-states-of-america': '#384CA2' // Deep blue
};

const getLogStyles = (log: string) => {
  const normalized = log.toLowerCase();
  if (normalized.includes('bought') || normalized.includes('won') || normalized.includes('success') || normalized.includes('released') || normalized.includes('reached home')) {
    return { borderLeft: '3.5px solid var(--accent-green)', background: 'rgba(56, 176, 0, 0.05)' };
  }
  if (normalized.includes('paid') || normalized.includes('tax') || normalized.includes('bankruptcy') || normalized.includes('forfeited') || normalized.includes('captured')) {
    return { borderLeft: '3.5px solid var(--accent-pink)', background: 'rgba(217, 4, 41, 0.05)' };
  }
  if (normalized.includes('jail') || normalized.includes('chance') || normalized.includes('challenge') || normalized.includes('drew') || normalized.includes('uno!')) {
    return { borderLeft: '3.5px solid var(--accent-gold)', background: 'rgba(255, 183, 3, 0.05)' };
  }
  return { borderLeft: '3.5px solid var(--accent-blue)', background: 'rgba(0, 180, 216, 0.05)' };
};

const playSound = (soundFile: string) => {
  try {
    const audio = new Audio(`/sounds/${soundFile}`);
    audio.volume = 0.5;
    audio.play().catch(err => console.log('Audio playback blocked or failed:', err));
  } catch (e) {
    console.error('Audio failed to initialize:', e);
  }
};

export default function App() {
  const lastActivePlayerIdRef = useRef<string | null>(null);

  const [token, setToken] = useState<string>(() => {
    return localStorage.getItem('turnup_token') || '';
  });

  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; role: string } | null>(() => {
    const cached = localStorage.getItem('turnup_user');
    return cached ? JSON.parse(cached) : null;
  });

  const playerId = currentUser?.id || '';
  const username = currentUser?.username || '';

  const socketService = React.useMemo(() => {
    return currentUser ? new SocketService(currentUser.id) : null;
  }, [currentUser]);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [inLobby, setInLobby] = useState(false);
  const [inGame, setInGame] = useState(false);

  // Lobby lists and room states
  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [currentDiceValue, setCurrentDiceValue] = useState(1);
  const [monopolyDiceValues, setMonopolyDiceValues] = useState<[number, number]>([3, 4]);

  // UI state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingWildCardIndex, setPendingWildCardIndex] = useState<number | null>(null);
  const [pendingWildCardIndices, setPendingWildCardIndices] = useState<number[] | null>(null);

  // Auth screen state
  const [authTab, setAuthTab] = useState<'login' | 'register' | 'guest'>('guest');
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [guestUsername, setGuestUsername] = useState('');
  const [authError, setAuthError] = useState('');

  // Chat & Left Sidebar state
  interface ChatMessage {
    playerId: string;
    senderName: string;
    text: string;
    timestamp: number;
  }
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);

  // New Overhaul States
  const [isSpectator, setIsSpectator] = useState(false);
  const [roomsList, setRoomsList] = useState<any[]>([]);
  const [showRoomsModal, setShowRoomsModal] = useState(false);
  const [showGameTypeModal, setShowGameTypeModal] = useState(false);
  const [selectedLobbyColor, setSelectedLobbyColor] = useState('');
  const [hasJoinedLobby, setHasJoinedLobby] = useState(false);
  const [selectedSpaceIndex, setSelectedSpaceIndex] = useState<number | null>(null);
  const [hoveredPlayerId, setHoveredPlayerId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedCardIndices, setSelectedCardIndices] = useState<number[]>([]);
  // Dummy reference to satisfy TS6133 unused locals compiler check
  if (selectedCardIndices === null as any) {
    setSelectedCardIndices(selectedCardIndices);
  }

  // Trade & Vote Kick States
  const [tradeModalTargetId, setTradeModalTargetId] = useState<string | null>(null);
  const [tradeOfferCash, setTradeOfferCash] = useState<number>(0);
  const [tradeOfferProperties, setTradeOfferProperties] = useState<number[]>([]);
  const [tradeRequestCash, setTradeRequestCash] = useState<number>(0);
  const [tradeRequestProperties, setTradeRequestProperties] = useState<number[]>([]);
  const [voteKickState, setVoteKickState] = useState<any>(null);
  const [voteKickCountdown, setVoteKickCountdown] = useState<number>(60);

  // Refs for event listeners to avoid stale closure state locks
  const roomRef = React.useRef<Room | null>(null);
  const gameStateRef = React.useRef<GameState | null>(null);

  const getPlayerBaseIndex = (pId: string) => {
    const p = roomRef.current?.players?.find(x => x.id === pId) || gameStateRef.current?.players?.find(x => x.id === pId);
    const color = p?.color;
    const is6 = roomRef.current?.lobbySettings?.maxPlayers === 6;
    const colors = is6
      ? ['#d90429', '#fb8500', '#ffb703', '#38b000', '#00b4d8', '#7b2cbf']
      : ['#d90429', '#38b000', '#ffb703', '#00b4d8'];
    
    if (color) {
      const idx = colors.indexOf(color);
      if (idx !== -1) return idx;
    }
    const idx = roomRef.current?.players?.findIndex(x => x.id === pId) ?? 0;
    return idx === -1 ? 0 : idx;
  };

  const getLudoColorName = (baseIdx: number) => {
    const is6 = roomRef.current?.lobbySettings?.maxPlayers === 6;
    if (is6) {
      const names = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
      return names[baseIdx] || 'red';
    } else {
      const names = ['red', 'green', 'yellow', 'blue'];
      return names[baseIdx] || 'red';
    }
  };

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Ensure selectedLobbyColor is within validColors for Ludo
  useEffect(() => {
    if (inLobby && !hasJoinedLobby) {
      const isLudo = room?.gameType === 'LUDO';
      const maxPlayersSetting = room?.lobbySettings?.maxPlayers || 4;
      const validColors = isLudo
        ? (maxPlayersSetting === 6
            ? ['#d90429', '#fb8500', '#ffb703', '#38b000', '#00b4d8', '#7b2cbf']
            : ['#d90429', '#38b000', '#ffb703', '#00b4d8'])
        : [
            '#adff2f', '#ffb703', '#fb8500', '#e63946',
            '#4a90e2', '#8ecae6', '#2a9d8f', '#38b000',
            '#b07d62', '#ffafcc', '#ff007f', '#7b2cbf'
          ];
      
      if (!selectedLobbyColor || !validColors.includes(selectedLobbyColor)) {
        const takenColors = room?.players?.filter((p: Player) => p.id !== currentUser?.id && p.color).map((p: Player) => p.color) || [];
        const avail = validColors.filter(c => !takenColors.includes(c));
        setSelectedLobbyColor(avail[0] || validColors[0]);
      }
    }
  }, [room?.gameType, room?.lobbySettings?.maxPlayers, inLobby, hasJoinedLobby, selectedLobbyColor, room?.players, currentUser?.id]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Vote kick countdown timer \u2014 ticks every second while a vote is active
  useEffect(() => {
    if (!voteKickState) return;
    const interval = setInterval(() => {
      setVoteKickCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [voteKickState]);

  // Initialize client sockets
  useEffect(() => {
    if (!token || !currentUser || !socketService) {
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const s = socketService.connect(
      SERVER_URL,
      () => {
        setIsConnected(true);
        // Automatic reconnection attempt
        const { roomId, token: sessionToken } = socketService.getSession();
        if (roomId && sessionToken) {
          s.emit('auth', { token: sessionToken, roomId }, (res: any) => {
            if (res.success) {
              setRoom(res.room);
              if (res.isSpectator) {
                setIsSpectator(true);
              }
              const meInLobby = res.room?.players?.find((p: any) => p.id === currentUser.id);
              if (meInLobby && meInLobby.color) {
                setHasJoinedLobby(true);
              }

              if (res.room?.status === 'PLAYING') {
                setGameState(res.gameState);
                setInGame(true);
                setGameLog([res.isSpectator ? 'Spectating active game.' : 'Reconnected to active session.']);
              } else {
                setInLobby(true);
              }
            } else {
              socketService.clearSession();
            }
          });
        }
      },
      () => {
        setIsConnected(false);
      }
    );

    setSocket(s);

    // Socket Event Bindings
    const getPlayerName = (id: string) => {
      const p = roomRef.current?.players?.find((x: Player) => x.id === id) || gameStateRef.current?.players?.find((x: any) => x.id === id);
      return p ? p.name : 'Unknown';
    };

    s.on('player_joined', (data: { player: Player }) => {
      setRoom(prev => {
        if (!prev) return null;
        return { ...prev, players: [...prev.players, data.player] };
      });
      setGameLog(prev => [...prev, `${data.player.name} joined the lobby.`]);
    });

    s.on('player_disconnected', (data: { playerId: string }) => {
      setRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          players: prev.players.map(p => p.id === data.playerId ? { ...p, connected: false } : p)
        };
      });
      setGameLog(prev => [...prev, `Player disconnected. Waiting 30s for recovery...`]);
    });

    s.on('player_reconnected', (data: { playerId: string }) => {
      setRoom(prev => {
        if (!prev) return null;
        const player = prev.players.find(p => p.id === data.playerId);
        setGameLog(prevLog => [...prevLog, `${player ? player.name : 'A player'} returned online.`]);
        return {
          ...prev,
          players: prev.players.map(p => p.id === data.playerId ? { ...p, connected: true } : p)
        };
      });
    });

    s.on('player_ready_changed', (data: { playerId: string; ready: boolean }) => {
      setRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          players: prev.players.map(p => p.id === data.playerId ? { ...p, ready: data.ready } : p)
        };
      });
    });

    s.on('host_changed', (data: { hostId: string }) => {
      setRoom(prev => {
        if (!prev) return null;
        return { ...prev, hostId: data.hostId };
      });
      setGameLog(prev => [...prev, 'Host privileges migrated.']);
    });

    s.on('player_appearance_changed', (data: { playerId: string; color: string }) => {
      setRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          players: prev.players.map(p => p.id === data.playerId ? { ...p, color: data.color } : p)
        };
      });
    });

    s.on('lobby_settings_updated', (data: { settings: Record<string, any> }) => {
      setRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          lobbySettings: data.settings
        };
      });
    });

    s.on('spectator_joined', (data: { player: { id: string; name: string } }) => {
      setGameLog(prev => [...prev, `👓 Spectator ${data.player.name} joined the game.`]);
    });

    s.on('game_started', (data: { roomStatus: string; room?: Room; gameState: GameState }) => {
      setInLobby(false);
      setInGame(true);
      setGameState(data.gameState);
      if (data.room) {
        setRoom(data.room);
      }
      
      let startMsg = 'Game Started!';
      if (data.gameState.gameType === 'SNAKES_LADDERS') startMsg = 'Game Started! The race to 100 has begun.';
      else if (data.gameState.gameType === 'LUDO') startMsg = 'Ludo Started! Move all 4 tokens to home to win.';
      else if (data.gameState.gameType === 'UNO') startMsg = 'Uno Started! Empty your hand to win.';
      else if (data.gameState.gameType === 'MONOPOLY') startMsg = 'Monopoly Started! Bankrupt your opponents to win.';
      
      setGameLog([startMsg]);
    });

    s.on('room_reset_to_lobby', (data: { room: Room }) => {
      setRoom(data.room);
      setInGame(false);
      setInLobby(true);
      setGameState(null);
      setGameLog(['Returned to lobby.']);
    });

    s.on('game_state_update', (data: { gameState: GameState; events: any[] }) => {
      const applyState = () => {
        setGameState(data.gameState);

        if (data.gameState.activePlayerId && data.gameState.activePlayerId !== lastActivePlayerIdRef.current) {
          lastActivePlayerIdRef.current = data.gameState.activePlayerId;
          if (data.gameState.activePlayerId === currentUser?.id) {
            playSound('your-turn.mp3');
          }
        }
        
        // Map events to logs
        data.events.forEach(evt => {
          const name = getPlayerName(evt.playerId || evt.payload.playerId);

          switch (evt.type) {
            case 'DICE_ROLLED':
              playSound('roll.mp3');
              if (evt.payload.value !== undefined) {
                setCurrentDiceValue(evt.payload.value);
                setGameLog(prev => [...prev, `${name} rolled a ${evt.payload.value}.`]);
              } else if (evt.payload.die1 !== undefined) {
                setCurrentDiceValue(evt.payload.total);
                setGameLog(prev => [...prev, `${name} rolled [${evt.payload.die1}, ${evt.payload.die2}] (Total: ${evt.payload.total})${evt.payload.isDoubles ? ' - DOUBLES!' : ''}`]);
              }
              break;
            case 'CLIMB_LADDER':
              setGameLog(prev => [...prev, `🚀 ${name} climbed a ladder from ${evt.payload.base} to ${evt.payload.top}!`]);
              break;
            case 'SLIDE_SNAKE':
              setGameLog(prev => [...prev, `🐍 Ouch! ${name} slid down a snake from ${evt.payload.head} to ${evt.payload.tail}.`]);
              break;
            case 'TOKEN_RELEASED':
              setGameLog(prev => [...prev, `🏠 LUDO: ${name} released Token ${evt.payload.tokenIndex + 1} from base.`]);
              break;
            case 'TOKEN_MOVED':
              if (roomRef.current?.gameType === 'LUDO') {
                setGameLog(prev => [...prev, `🏃 LUDO: ${name} moved Token ${evt.payload.tokenIndex + 1} to position ${evt.payload.to}.`]);
              } else if (roomRef.current?.gameType === 'SNAKES_LADDERS') {
                const path = evt.payload.path || [];
                const toVal = path.length > 0 ? path[path.length - 1] : 'unknown';
                setGameLog(prev => [...prev, `🏃 ${name} moved to tile ${toVal}.`]);
              } else {
                setGameLog(prev => [...prev, `🏃 ${name} moved to position ${evt.payload.to}.`]);
              }
              break;
            case 'TOKEN_CAPTURED': {
              const capturedByName = getPlayerName(evt.payload.capturedBy);
              setGameLog(prev => [...prev, `⚔️ LUDO: ${name}'s Token ${evt.payload.tokenIndex + 1} was CAPTURED by ${capturedByName}! Sent back to base.`]);
              break;
            }
            case 'TOKEN_HOME':
              setGameLog(prev => [...prev, `🎉 LUDO: ${name}'s Token ${evt.payload.tokenIndex + 1} reached HOME!`]);
              break;
            case 'TURN_FORFEITED':
              setGameLog(prev => [...prev, `⚠️ LUDO: ${name} forfeited turn: ${evt.payload.reason}.`]);
              break;
            case 'NO_VALID_MOVES':
              setGameLog(prev => [...prev, `🚫 LUDO: ${name} rolled ${evt.payload.roll} but has no valid moves.`]);
              break;
            case 'CARDS_DRAWN':
              setGameLog(prev => [...prev, `🃏 UNO: ${name} drew ${evt.payload.count} card(s)${evt.payload.wasPenalty ? ' as penalty' : ''}.`]);
              break;
            case 'CARD_PLAYED':
              setGameLog(prev => [...prev, `🃏 UNO: ${name} played ${evt.payload.card.color.toUpperCase()} ${evt.payload.card.value.toUpperCase()} (Next suit: ${evt.payload.nextColor.toUpperCase()}).`]);
              break;
            case 'PLAYER_SKIPPED':
              setGameLog(prev => [...prev, `🚫 UNO: ${name} was SKIPPED.`]);
              break;
            case 'DIRECTION_REVERSED':
              setGameLog(prev => [...prev, `🔄 UNO: Play direction was REVERSED.`]);
              break;
            case 'UNO_DECLARED':
              setGameLog(prev => [...prev, `📣 UNO: ${name} declared UNO!`]);
              break;
            case 'UNO_CHALLENGE_SUCCESS': {
              const targetName = getPlayerName(evt.payload.target);
              setGameLog(prev => [...prev, `🔥 UNO: Challenge SUCCESS by ${name}! ${targetName} draws ${evt.payload.penaltyCardsCount} penalty cards.`]);
              break;
            }
            case 'UNO_CHALLENGE_FAILED': {
              const targetName = getPlayerName(evt.payload.target);
              setGameLog(prev => [...prev, `👎 UNO: Challenge against ${targetName} FAILED by ${name}! ${name} draws ${evt.payload.penaltyCardsCount} penalty cards.`]);
              break;
            }
            case 'PLAYER_MOVED':
              setGameLog(prev => [...prev, `🚶 MONOPOLY: ${name} moved from tile ${evt.payload.from} to ${evt.payload.to}.`]);
              break;
            case 'PROPERTY_BOUGHT': {
              playSound('buy.mp3');
              const propName = MONOPOLY_BOARD[evt.payload.spaceIndex]?.name || 'Property';
              setGameLog(prev => [...prev, `🏢 MONOPOLY: ${name} bought ${propName} for $${evt.payload.price}.`]);
              break;
            }
            case 'PROPERTY_MORTGAGED': {
              const propName = MONOPOLY_BOARD[evt.payload.spaceIndex]?.name || 'Property';
              setGameLog(prev => [...prev, `💰 MONOPOLY: ${name} mortgaged ${propName} for $${evt.payload.value}.`]);
              break;
            }
            case 'PROPERTY_UNMORTGAGED': {
              const propName = MONOPOLY_BOARD[evt.payload.spaceIndex]?.name || 'Property';
              setGameLog(prev => [...prev, `🏦 MONOPOLY: ${name} unmortgaged ${propName} for $${evt.payload.cost}.`]);
              break;
            }
            case 'PROPERTY_SOLD': {
              const propName = MONOPOLY_BOARD[evt.payload.spaceIndex]?.name || 'Property';
              setGameLog(prev => [...prev, `🗑️ MONOPOLY: ${name} sold ${propName} back to the bank for $${evt.payload.refund}.`]);
              break;
            }
            case 'HOUSE_BUILT': {
              const propName = MONOPOLY_BOARD[evt.payload.spaceIndex]?.name || 'Property';
              setGameLog(prev => [...prev, `🏠 MONOPOLY: ${name} built house/hotel on ${propName} (Total: ${evt.payload.housesCount}).`]);
              break;
            }
            case 'HOUSE_SOLD': {
              const propName = MONOPOLY_BOARD[evt.payload.spaceIndex]?.name || 'Property';
              setGameLog(prev => [...prev, `🏚️ MONOPOLY: ${name} sold house/hotel on ${propName} for $${evt.payload.refund}.`]);
              break;
            }
            case 'RENT_PAID': {
              playSound('rent.mp3');
              const propName = MONOPOLY_BOARD[evt.payload.spaceIndex]?.name || 'Property';
              const ownerName = getPlayerName(evt.payload.recipient);
              setGameLog(prev => [...prev, `💸 MONOPOLY: ${name} paid $${evt.payload.rent} rent on ${propName} to ${ownerName}.`]);
              break;
            }
            case 'TAX_PAID':
              playSound('tax.mp3');
              setGameLog(prev => [...prev, `🧾 MONOPOLY: ${name} paid $${evt.payload.fine} for ${evt.payload.name}.`]);
              break;
            case 'SENT_TO_JAIL':
              playSound('jail.mp3');
              setGameLog(prev => [...prev, `🚨 MONOPOLY: ${name} was sent to Jail (${evt.payload.reason}).`]);
              break;
            case 'JAIL_RELEASED':
              setGameLog(prev => [...prev, `🔓 MONOPOLY: ${name} was released from Jail (${evt.payload.reason}).`]);
              break;
            case 'AUCTION_STARTED': {
              const propName = MONOPOLY_BOARD[evt.payload.spaceIndex]?.name || 'Property';
              setGameLog(prev => [...prev, `📢 MONOPOLY: Auction started for ${propName}!`]);
              break;
            }
            case 'AUCTION_BID': {
              setGameLog(prev => [...prev, `🙋 MONOPOLY: ${name} bid $${evt.payload.amount}.`]);
              break;
            }
            case 'AUCTION_FOLDED': {
              setGameLog(prev => [...prev, `🏳️ MONOPOLY: ${name} folded from the auction.`]);
              break;
            }
            case 'AUCTION_RESOLVED': {
              playSound('buy.mp3');
              const propName = MONOPOLY_BOARD[evt.payload.spaceIndex]?.name || 'Property';
              setGameLog(prev => [...prev, `🏆 MONOPOLY: ${name} won the auction for ${propName} at $${evt.payload.price}!`]);
              break;
            }
            case 'AUCTION_CANCELLED': {
              const propName = MONOPOLY_BOARD[evt.payload.spaceIndex]?.name || 'Property';
              setGameLog(prev => [...prev, `❌ MONOPOLY: Auction for ${propName} cancelled with no bids.`]);
              break;
            }
            case 'TRADE_INITIATED': {
              const targetName = getPlayerName(evt.payload.targetPlayerId);
              setGameLog(prev => [...prev, `🤝 MONOPOLY: ${name} proposed a trade to ${targetName}.`]);
              break;
            }
            case 'TRADE_REJECTED': {
              const targetName = getPlayerName(evt.payload.receiverId);
              const initiatorName = getPlayerName(evt.payload.proposerId);
              setGameLog(prev => [...prev, `❌ MONOPOLY: Trade proposal between ${initiatorName} and ${targetName} was rejected.`]);
              break;
            }
            case 'TRADE_ACCEPTED': {
              const targetName = getPlayerName(evt.payload.receiverId);
              const initiatorName = getPlayerName(evt.payload.proposerId);
              setGameLog(prev => [...prev, `✅ MONOPOLY: Trade proposal between ${initiatorName} and ${targetName} was ACCEPTED!`]);
              break;
            }
            case 'TRADE_STAYED':
              break;
            case 'JAIL_STAY':
              setGameLog(prev => [...prev, `🔒 MONOPOLY: ${name} remains in Jail (Turn ${evt.payload.turns}/3).`]);
              break;
            case 'CHANCE_CARD':
              playSound('card.mp3');
              setGameLog(prev => [...prev, `❓ MONOPOLY: ${name} drew card: "${evt.payload.text}".`]);
              break;
            case 'BANKRUPTCY_DECLARED':
              playSound('bankruptcy.mp3');
              setGameLog(prev => [...prev, `💀 MONOPOLY: ${name} DECLARED BANKRUPTCY!`]);
              break;
          }
        });
      };

      const rollEvent = data.events.find(e => e.type === 'DICE_ROLLED');
      if (rollEvent && rollEvent.playerId !== playerId) {
        setIsRolling(true);
        const interval = setInterval(() => {
          setCurrentDiceValue(Math.floor(Math.random() * 6) + 1);
          setMonopolyDiceValues([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
        }, 70);

        setTimeout(() => {
          clearInterval(interval);
          setIsRolling(false);
          applyState();
        }, 800);
      } else {
        applyState();
      }
    });

    s.on('game_ended', (data: { winnerId: string }) => {
      playSound('win.mp3');
      setRoom(prev => {
        if (!prev) return null;
        return { ...prev, status: 'ENDED' };
      });
      const winnerName = getPlayerName(data.winnerId);
      setGameLog(prev => [...prev, `🎉 Game Over! ${winnerName} has won the game!`]);
    });

    s.on('player_left_permanent', (data: { playerId: string }) => {
      setRoom(prev => {
        if (!prev) return null;
        return { ...prev, players: prev.players.filter(p => p.id !== data.playerId) };
      });
    });

    s.on('vote_kick_started', (data: any) => {
      setVoteKickState(data);
      setVoteKickCountdown(data.timeoutSeconds || 60); // Reset countdown to server value
      const targetName = getPlayerName(data.targetPlayerId);
      const initiatorName = getPlayerName(data.initiatorId);
      setToastMessage(`🚫 Vote kick started against ${targetName} by ${initiatorName}!`);
    });

    s.on('vote_kick_updated', (data: any) => {
      setVoteKickState((prev: any) => {
        if (!prev) return null;
        return { ...prev, ...data };
      });
    });

    s.on('vote_kick_failed', (data: any) => {
      const targetName = getPlayerName(data.targetPlayerId);
      const reason = data.reason === 'timeout' ? 'timed out' : 'failed';
      setToastMessage(`🤝 Vote kick against ${targetName} ${reason}.`);
      setVoteKickState(null);
      setVoteKickCountdown(60);
    });

    s.on('player_kicked', (data: any) => {
      setVoteKickState(null);
      if (data.targetPlayerId === playerId) {
        setInGame(false);
        setInLobby(false);
        setRoom(null);
        setGameState(null);
        setToastMessage(`🚫 You have been vote kicked from the room!`);
      } else {
        setToastMessage(`🚫 ${data.targetName} was vote kicked.`);
        setRoom(prev => {
          if (!prev) return null;
          return { ...prev, players: data.players };
        });
      }
    });

    // Chat message listener
    s.on('chat_message', (data: { playerId: string; senderName: string; text: string; timestamp: number }) => {
      setChatMessages(prev => [...prev, data]);
    });

    s.on('action_rejected', (data: { error: string }) => {
      setToastMessage(data.error);
    });

    return () => {
      s.off('player_joined');
      s.off('player_disconnected');
      s.off('player_reconnected');
      s.off('player_ready_changed');
      s.off('host_changed');
      s.off('game_started');
      s.off('room_reset_to_lobby');
      s.off('game_state_update');
      s.off('game_ended');
      s.off('player_left_permanent');
      s.off('vote_kick_started');
      s.off('vote_kick_updated');
      s.off('vote_kick_failed');
      s.off('player_kicked');
      s.off('chat_message');
      s.off('player_appearance_changed');
      s.off('lobby_settings_updated');
      s.off('spectator_joined');
      s.off('action_rejected');
      socketService.disconnect();
    };
  }, [token, currentUser, socketService]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Chat send handler
  const handleSendChat = () => {
    if (!chatInput.trim() || !socket) return;
    socket.emit('send_chat_message', { text: chatInput.trim() });
    setChatInput('');
  };

  // Copy room link to clipboard
  const handleCopyLink = () => {
    const link = `${window.location.origin}/join/${room?.id || ''}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // REST Auth / Room Actions

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!loginInput.trim() || !loginPassword) {
      setAuthError('Please fill in all fields.');
      return;
    }
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: loginInput.trim(), password: loginPassword })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('turnup_token', data.token);
        localStorage.setItem('turnup_user', JSON.stringify(data.user));
        setToken(data.token);
        setCurrentUser(data.user);
      } else {
        setAuthError(data.message || 'Login failed.');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Server connection failed.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!regUsername.trim() || !regEmail.trim() || !regPassword) {
      setAuthError('Please fill in all fields.');
      return;
    }
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: regUsername.trim(), email: regEmail.trim(), password: regPassword })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('turnup_token', data.token);
        localStorage.setItem('turnup_user', JSON.stringify(data.user));
        setToken(data.token);
        setCurrentUser(data.user);
      } else {
        setAuthError(data.message || 'Registration failed.');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Server connection failed.');
    }
  };



  const handleJoinRoom = () => {
    if (!socket || !token || !currentUser || !socketService || !joinCode) return;
    socket.emit('join_room', {
      roomId: joinCode.toUpperCase(),
      token
    }, (res: any) => {
      if (res.success) {
        setRoom(res.room);
        socketService.saveSession(res.roomId || joinCode.toUpperCase(), token);
        if (res.isSpectator) {
          setIsSpectator(true);
          setHasJoinedLobby(true);
        }
        if (res.room?.status === 'PLAYING') {
          setGameState(res.gameState);
          setInGame(true);
          setInLobby(false);
          setGameLog(['Spectating active game.']);
        } else {
          setInLobby(true);
        }
      } else {
        alert(res.message);
      }
    });
  };

  const getLobbySetting = (key: string, defaultValue: any) => {
    if (room?.lobbySettings && room.lobbySettings[key] !== undefined) {
      return room.lobbySettings[key];
    }
    return defaultValue;
  };

  const updateLobbySetting = (key: string, value: any) => {
    if (!socket || room?.hostId !== playerId) return;
    const currentSettings = room?.lobbySettings || {};
    const newSettings = { ...currentSettings, [key]: value };
    socket.emit('update_lobby_settings', { settings: newSettings });
  };

  useEffect(() => {
    if (room?.gameType === 'LUDO' && room?.hostId === playerId) {
      const currentMax = room?.lobbySettings?.maxPlayers || 4;
      if (currentMax !== 4 && currentMax !== 6) {
        updateLobbySetting('maxPlayers', 4);
      }
    }
  }, [room?.gameType, room?.lobbySettings?.maxPlayers, room?.hostId, playerId]);

  const handleStartGameWithSettings = () => {
    if (!socket || room?.hostId !== playerId) return;
    const settings = room?.lobbySettings || {};
    const config = {
      startingCash: settings.startingCash !== undefined ? settings.startingCash : 1500,
      doubleRentRule: settings.doubleRentRule !== undefined ? settings.doubleRentRule : true,
      vacationCash: settings.vacationCash !== undefined ? settings.vacationCash : false,
      auction: settings.auction !== undefined ? settings.auction : false,
      prisonRent: settings.prisonRent !== undefined ? settings.prisonRent : false,
      evenBuild: settings.evenBuild !== undefined ? settings.evenBuild : true,
      margin: settings.margin !== undefined ? settings.margin : false,
      mortgage: settings.mortgage !== undefined ? settings.mortgage : true,
      randomizeOrder: settings.randomizeOrder !== undefined ? settings.randomizeOrder : false,
      maxPlayers: settings.maxPlayers !== undefined ? settings.maxPlayers : 4,
      allowBots: settings.allowBots !== undefined ? settings.allowBots : false,
      cardStacking: settings.cardStacking !== undefined ? settings.cardStacking : true,
      cardDoubles: settings.cardDoubles !== undefined ? settings.cardDoubles : true
    };
    
    socket.emit('start_game', { config }, (res: any) => {
      if (!res.success) {
        alert(res.message);
      }
    });
  };

  const handleJoinGameLobby = () => {
    if (!socket || !selectedLobbyColor) return;
    socket.emit('select_appearance', { color: selectedLobbyColor }, (res: any) => {
      if (res.success) {
        setHasJoinedLobby(true);
      }
    });
  };

  const renderAppearancePicker = () => {
    const isLudo = room?.gameType === 'LUDO';
    const maxPlayersSetting = room?.lobbySettings?.maxPlayers || 4;

    const validColors = isLudo
      ? (maxPlayersSetting === 6
          ? ['#d90429', '#fb8500', '#ffb703', '#38b000', '#00b4d8', '#7b2cbf']
          : ['#d90429', '#38b000', '#ffb703', '#00b4d8'])
      : [
          '#adff2f', '#ffb703', '#fb8500', '#e63946',
          '#4a90e2', '#8ecae6', '#2a9d8f', '#38b000',
          '#b07d62', '#ffafcc', '#ff007f', '#7b2cbf'
        ];
    
    const takenColors = room?.players
      .filter((p: Player) => p.id !== currentUser?.id && p.color)
      .map((p: Player) => p.color) || [];

    return (
      <div className="glass-panel" style={{ padding: '32px', maxWidth: '420px', width: '90%', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#fff' }}>Select player appearance:</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 24px 0' }}>
          Choose a color token to represent you on the board.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '32px',
          justifyItems: 'center'
        }}>
          {validColors.map(color => {
            const isTaken = takenColors.includes(color);
            const isSelected = selectedLobbyColor === color;
            
            return (
              <button
                key={color}
                disabled={isTaken}
                onClick={() => setSelectedLobbyColor(color)}
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
                  position: 'relative'
                }}
                title={isTaken ? 'Taken by another player' : ''}
              >
                {isSelected && (
                  <span style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: '#fff',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          className="btn-primary"
          disabled={!selectedLobbyColor}
          onClick={handleJoinGameLobby}
          style={{ width: '100%', fontSize: '16px', padding: '14px', borderRadius: '8px' }}
        >
          Join game →
        </button>
      </div>
    );
  };

  const fetchRoomsList = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/rooms`);
      const data = await response.json();
      setRoomsList(data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  };

  const handleFastPlay = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');
    if (!token || !currentUser) return;

    try {
      const response = await fetch(`${SERVER_URL}/api/rooms`);
      const rooms: any[] = await response.json();
      
      const availableLobby = rooms.find(r => r.status === 'LOBBY' && r.playersCount < 4);
      if (availableLobby) {
        setJoinCode(availableLobby.id);
        if (socket) {
          socket.emit('join_room', { roomId: availableLobby.id, token: token }, (res: any) => {
            if (res.success) {
              setRoom(res.room);
              setInLobby(true);
              socketService?.saveSession(res.roomId || availableLobby.id, token!);
            } else {
              alert(res.message);
            }
          });
        }
      } else {
        setShowGameTypeModal(true);
      }
    } catch (err) {
      console.error(err);
      setShowGameTypeModal(true);
    }
  };

  const handleCreatePrivateGameBtn = () => {
    setAuthError('');
    if (!token || !currentUser) return;
    setShowGameTypeModal(true);
  };

  const handleAllRoomsBtn = async () => {
    setAuthError('');
    if (!token || !currentUser) return;
    await fetchRoomsList();
    setShowRoomsModal(true);
  };

  const handleGuestLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!guestUsername.trim()) {
      setAuthError('Please enter a nickname first!');
      return;
    }
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: guestUsername.trim() })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('turnup_token', data.token);
        localStorage.setItem('turnup_user', JSON.stringify(data.user));
        setToken(data.token);
        setCurrentUser(data.user);
      } else {
        setAuthError(data.message || 'Guest entry failed.');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Server connection failed.');
    }
  };

  const renderRoomsModal = () => {
    if (!showRoomsModal) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowRoomsModal(false)}>
        <div className="modal-sheet" style={{ maxWidth: '640px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">🌐 Active Rooms</h2>
            <button className="modal-close-btn" onClick={() => setShowRoomsModal(false)}>✕</button>
          </div>

          <div className="modal-body lobby-settings-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {roomsList.length === 0 ? (
              <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px 20px', fontFamily: "'Manrope', sans-serif", fontSize: '14px' }}>
                No active game rooms. Create one to start playing!
              </div>
            ) : (
              roomsList.map(rm => (
                <div 
                  key={rm.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 18px',
                    background: 'rgba(255, 255, 255, 0.025)',
                    border: '1px solid rgba(108, 60, 233, 0.15)',
                    borderRadius: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(108, 60, 233, 0.35)'; e.currentTarget.style.background = 'rgba(108, 60, 233, 0.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(108, 60, 233, 0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                >
                  <div>
                    <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '16px', color: 'var(--cloud)', marginBottom: '4px' }}>{rm.name}</div>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: 'var(--muted)', fontFamily: "'Space Mono', monospace" }}>
                      <span>{rm.gameType.replace(/_/g, ' ')}</span>
                      <span style={{ opacity: 0.4 }}>·</span>
                      <span style={{ color: 'var(--cloud-dim)' }}>{rm.playersCount} / {rm.maxPlayers} players</span>
                      <span style={{ opacity: 0.4 }}>·</span>
                      <span style={{ color: rm.status === 'PLAYING' ? 'var(--accent-green)' : 'var(--accent-blue)' }}>
                        {rm.status === 'PLAYING' ? 'Live' : 'Lobby'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setJoinCode(rm.id);
                      setShowRoomsModal(false);
                      if (socket) {
                        socket.emit('join_room', { roomId: rm.id, token: token || undefined }, (res: any) => {
                          if (res.success) {
                            setRoom(res.room);
                            socketService?.saveSession(res.roomId || rm.id, token!);
                            if (res.isSpectator) {
                              setIsSpectator(true);
                              setHasJoinedLobby(true);
                            }
                            if (res.room?.status === 'PLAYING') {
                              setGameState(res.gameState);
                              setInGame(true);
                              setInLobby(false);
                              setGameLog(['Joined as spectator.']);
                            } else {
                              setInLobby(true);
                            }
                          } else {
                            alert(res.message);
                          }
                        });
                      }
                    }}
                    className={rm.status === 'PLAYING' ? 'btn-secondary' : 'btn-primary'}
                    style={{ padding: '10px 20px', fontSize: '13px', flexShrink: 0 }}
                  >
                    {rm.status === 'PLAYING' ? 'Spectate 👓' : 'Join 🎲'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderGameTypeSelectionModal = () => {
    if (!showGameTypeModal) return null;
    
    const games = [
      { type: 'MONOPOLY', name: 'Monopoly', desc: 'Roll, build properties, and collect rent.', icon: '🏢', color: 'var(--gold)' },
      { type: 'LUDO', name: 'Ludo', desc: 'Race 4 tokens home with strategic blockades.', icon: '🎲', color: 'var(--accent-blue)' },
      { type: 'UNO', name: 'Uno', desc: 'Match colors and cards. Empty your hand first.', icon: '🃏', color: 'var(--coral)' },
      { type: 'SNAKES_LADDERS', name: 'Snakes \u0026 Ladders', desc: 'Climb ladders, dodge snakes, race to 100.', icon: '🐍', color: 'var(--lime)' }
    ];

    return (
      <div className="modal-overlay" onClick={() => setShowGameTypeModal(false)}>
        <div className="modal-sheet" style={{ maxWidth: '640px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">🎮 Choose Game Type</h2>
            <button className="modal-close-btn" onClick={() => setShowGameTypeModal(false)}>✕</button>
          </div>

          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {games.map(gm => (
                <div
                  key={gm.type}
                  className="game-card"
                  onClick={() => {
                    setShowGameTypeModal(false);
                    if (socket) {
                      socket.emit('create_room', {
                        name: `${currentUser?.username || 'Guest'}'s Arena`,
                        token: token || undefined,
                        gameType: gm.type
                      }, (res: any) => {
                        if (res.success) {
                          setRoom(res.room);
                          setInLobby(true);
                          socketService?.saveSession(res.roomId, token!);
                        }
                      });
                    }
                  }}
                  style={{ '--card-accent': gm.color } as React.CSSProperties}
                >
                  <span className="game-card-icon">{gm.icon}</span>
                  <h3 className="game-card-title">{gm.name}</h3>
                  <p className="game-card-desc">{gm.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };



  const handleRollDice = () => {
    if (!socket || isRolling || !gameState) return;
    setIsRolling(true);
    
    const interval = setInterval(() => {
      setCurrentDiceValue(Math.floor(Math.random() * 6) + 1);
      setMonopolyDiceValues([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
    }, 70);
    
    setTimeout(() => {
      clearInterval(interval);
      setIsRolling(false);
      socket.emit('game_action', {
        type: 'ROLL_DICE',
        payload: {}
      });
    }, 800);
  };

  const handleLeaveGame = () => {
    if (socketService) {
      socketService.clearSession();
    }
    setInLobby(false);
    setInGame(false);
    setRoom(null);
    setGameState(null);
    window.location.reload();
  };

  // Ludo & Monopoly coordinate solvers and actions
  const getLudoCoords = (playerIdx: number, position: number, tokenIdx: number) => {
    const is6 = room?.lobbySettings?.maxPlayers === 6;
    const trackLength = is6 ? 78 : 52;
    const cellW = 1000 / (is6 ? 24 : 15);
    const cellH = (is6 ? 625 : 1000) / 15;
    
    if (position === -1) {
      let r = 0, c = 0;
      if (is6) {
        if (playerIdx === 0) {
          r = tokenIdx < 2 ? 1.5 : 3.5;
          c = tokenIdx % 2 === 0 ? 1.5 : 3.5;
        } else if (playerIdx === 1) {
          r = tokenIdx < 2 ? 1.5 : 3.5;
          c = tokenIdx % 2 === 0 ? 9 + 1.5 : 9 + 3.5;
        } else if (playerIdx === 2) {
          r = tokenIdx < 2 ? 1.5 : 3.5;
          c = tokenIdx % 2 === 0 ? 18 + 1.5 : 18 + 3.5;
        } else if (playerIdx === 3) {
          r = tokenIdx < 2 ? 9 + 1.5 : 9 + 3.5;
          c = tokenIdx % 2 === 0 ? 18 + 1.5 : 18 + 3.5;
        } else if (playerIdx === 4) {
          r = tokenIdx < 2 ? 9 + 1.5 : 9 + 3.5;
          c = tokenIdx % 2 === 0 ? 9 + 1.5 : 9 + 3.5;
        } else {
          r = tokenIdx < 2 ? 9 + 1.5 : 9 + 3.5;
          c = tokenIdx % 2 === 0 ? 1.5 : 3.5;
        }
      } else {
        if (playerIdx === 0) {
          r = tokenIdx < 2 ? 2.13 : 3.87;
          c = tokenIdx % 2 === 0 ? 2.13 : 3.87;
        } else if (playerIdx === 1) {
          r = tokenIdx < 2 ? 2.13 : 3.87;
          c = tokenIdx % 2 === 0 ? 9 + 2.13 : 9 + 3.87;
        } else if (playerIdx === 2) {
          r = tokenIdx < 2 ? 9 + 2.13 : 9 + 3.87;
          c = tokenIdx % 2 === 0 ? 9 + 2.13 : 9 + 3.87;
        } else {
          r = tokenIdx < 2 ? 9 + 2.13 : 9 + 3.87;
          c = tokenIdx % 2 === 0 ? 2.13 : 3.87;
        }
      }
      return { x: c * cellW, y: r * cellH };
    } else if (position >= 0 && position < trackLength) {
      const coord = is6 ? LUDO_6_TRACK_COORDS[position] : LUDO_TRACK_COORDS[position];
      return { x: (coord[1] + 0.5) * cellW, y: (coord[0] + 0.5) * cellH };
    } else if (position >= trackLength && position < (trackLength + 5)) {
      const step = position - trackLength;
      let r = 7, c = 7;
      if (is6) {
        if (playerIdx === 0) { r = 7; c = step + 1; }
        else if (playerIdx === 1) { r = step + 3; c = 7; }
        else if (playerIdx === 2) { r = step + 3; c = 16; }
        else if (playerIdx === 3) { r = 7; c = 22 - step; }
        else if (playerIdx === 4) { r = 11 - step; c = 16; }
        else { r = 11 - step; c = 7; }
      } else {
        if (playerIdx === 0) { r = 7; c = step + 1; }
        else if (playerIdx === 1) { r = step + 1; c = 7; }
        else if (playerIdx === 2) { r = 7; c = 13 - step; }
        else { r = 13 - step; c = 7; }
      }
      return { x: (c + 0.5) * cellW, y: (r + 0.5) * cellH };
    } else {
      let r = 7, c = 7;
      if (is6) {
        if (playerIdx === 0) { r = 7; c = 6; }
        else if (playerIdx === 1) { r = 6; c = 7; }
        else if (playerIdx === 2) { r = 6; c = 16; }
        else if (playerIdx === 3) { r = 7; c = 17; }
        else if (playerIdx === 4) { r = 8; c = 16; }
        else { r = 8; c = 7; }
      } else {
        if (playerIdx === 0) { r = 7; c = 6; }
        else if (playerIdx === 1) { r = 6; c = 7; }
        else if (playerIdx === 2) { r = 7; c = 8; }
        else { r = 8; c = 7; }
      }
      return { x: (c + 0.5) * cellW, y: (r + 0.5) * cellH };
    }
  };

  const getMonopolySpaceGridCoords = (spaceIndex: number) => {
    if (spaceIndex >= 0 && spaceIndex <= 12) {
      return { row: 1, col: spaceIndex + 1 };
    } else if (spaceIndex >= 13 && spaceIndex <= 24) {
      return { row: spaceIndex - 11, col: 13 };
    } else if (spaceIndex >= 25 && spaceIndex <= 36) {
      return { row: 13, col: 37 - spaceIndex };
    } else {
      return { row: 49 - spaceIndex, col: 1 };
    }
  };

  const getMonopolyCoords = (spaceIndex: number) => {
    const { row, col } = getMonopolySpaceGridCoords(spaceIndex);
    const U = 1000 / 13.5;
    const W = 1.25 * U;

    const getPos = (idx: number) => {
      if (idx === 1) return W / 2;
      if (idx === 13) return 1000 - W / 2;
      return W + (idx - 2) * U + U / 2;
    };

    return { x: getPos(col), y: getPos(row) };
  };

  const getUnoCardSymbol = (value: string) => {
    switch (value) {
      case 'skip': return '🚫';
      case 'reverse': return '🔄';
      case 'draw2': return '+2';
      case 'wild': return '🎨';
      case 'wildDraw4': return '+4';
      default: return value;
    }
  };

  const isCardPlayable = (card: UnoCard, currentCard: UnoCard, currentColor: string) => {
    if (card.color === 'wild') return true;
    if (card.color === currentColor) return true;
    if (card.value === currentCard.value) return true;
    return false;
  };

  const isTokenMoveValid = (playerIdx: number, _tIdx: number, pos: number, roll: number) => {
    if (pos === 57) return false;
    if (pos === -1) return roll === 6;
    if (pos >= 0 && pos <= 51) {
      const startCell = playerIdx * 13;
      const stepsTaken = (pos - startCell + 52) % 52;
      return (stepsTaken + roll) <= 57;
    }
    if (pos >= 52 && pos <= 56) {
      return (pos + roll) <= 57;
    }
    return false;
  };

  const handleMoveToken = (tokenIndex: number) => {
    if (!socket) return;
    socket.emit('game_action', {
      type: 'MOVE_TOKEN',
      payload: { tokenIndex }
    });
  };

  const handlePlayCard = (cardIndex: number) => {
    handlePlayCards([cardIndex]);
  };

  const handlePlayCards = (indices: number[]) => {
    if (!socket || !gameState) return;
    const hand = gameState.gameSpecificState?.hands?.[playerId];
    if (!hand) return;
    if (indices.length < 1 || indices.length > 2) return;

    const lastCard = hand[indices[indices.length - 1]];
    if (!lastCard) return;

    if (lastCard.color === 'wild') {
      setPendingWildCardIndices(indices);
      setShowColorPicker(true);
    } else {
      if (indices.length === 2) {
        socket.emit('game_action', {
          type: 'PLAY_CARD',
          payload: { cardIndices: indices }
        });
      } else {
        socket.emit('game_action', {
          type: 'PLAY_CARD',
          payload: { cardIndex: indices[0] }
        });
      }
      setSelectedCardIndices([]);
    }
  };

  const handleSelectWildColor = (color: 'red' | 'green' | 'blue' | 'yellow') => {
    if (!socket) return;
    
    if (pendingWildCardIndices && pendingWildCardIndices.length > 0) {
      if (pendingWildCardIndices.length === 2) {
        socket.emit('game_action', {
          type: 'PLAY_CARD',
          payload: { cardIndices: pendingWildCardIndices, selectedColor: color }
        });
      } else {
        socket.emit('game_action', {
          type: 'PLAY_CARD',
          payload: { cardIndex: pendingWildCardIndices[0], selectedColor: color }
        });
      }
      setPendingWildCardIndices(null);
      setSelectedCardIndices([]);
    } else if (pendingWildCardIndex !== null) {
      socket.emit('game_action', {
        type: 'PLAY_CARD',
        payload: { cardIndex: pendingWildCardIndex, selectedColor: color }
      });
      setPendingWildCardIndex(null);
    }
    
    setShowColorPicker(false);
  };

  const handleBuyProperty = () => {
    if (!socket) return;
    socket.emit('game_action', { type: 'BUY_PROPERTY', payload: {} });
  };

  const handleEndTurn = () => {
    if (!socket) return;
    socket.emit('game_action', { type: 'END_TURN', payload: {} });
  };

  const handlePayJailFine = () => {
    if (!socket) return;
    socket.emit('game_action', { type: 'PAY_JAIL_FINE', payload: {} });
  };

  const handleDeclareBankruptcy = () => {
    if (!socket) return;
    socket.emit('game_action', { type: 'DECLARE_BANKRUPTCY', payload: {} });
  };

  const handleMortgageProperty = (spaceIndex: number) => {
    if (!socket) return;
    socket.emit('game_action', { type: 'MORTGAGE', payload: { spaceIndex, tileIndex: spaceIndex } });
  };

  const handleUnmortgageProperty = (spaceIndex: number) => {
    if (!socket) return;
    socket.emit('game_action', { type: 'UNMORTGAGE', payload: { spaceIndex, tileIndex: spaceIndex } });
  };

  const handleBuildHouseProperty = (spaceIndex: number) => {
    if (!socket) return;
    socket.emit('game_action', { type: 'BUILD_HOUSE', payload: { spaceIndex, tileIndex: spaceIndex } });
  };

  const handleSellHouseProperty = (spaceIndex: number) => {
    if (!socket) return;
    socket.emit('game_action', { type: 'SELL_HOUSE', payload: { spaceIndex, tileIndex: spaceIndex } });
  };

  const handleSellProperty = (spaceIndex: number) => {
    if (!socket) return;
    socket.emit('game_action', { type: 'SELL_PROPERTY', payload: { spaceIndex } });
  };

  // Serpentine coordinates lookup (reversing standard layout)
  const getSerpentineCoordinates = (cellNum: number) => {
    const index = cellNum - 1;
    const row = Math.floor(index / 10);
    const colRemainder = index % 10;
    const col = (row % 2 === 1) ? (9 - colRemainder) : colRemainder;
    
    // Grid alignment: x-offset left, y-offset top
    const cellSize = 100; // grid logic size
    const x = col * cellSize + 50;
    const y = (9 - row) * cellSize + 50;
    
    return { x, y };
  };

  // Rendering main UI


  const currentGlobalGameState = gameState;

  if ((inGame && gameState && room) || (inLobby && room)) {
    const gameStateLocal = currentGlobalGameState || {
      gameId: room.id,
      gameType: room.gameType,
      status: 'LOBBY',
      players: room.players.map(p => ({ id: p.id, name: p.name, isBot: false })),
      activePlayerId: '',
      turnOrder: room.players.map(p => p.id),
      turnIndex: 0,
      subState: '',
      rngState: '',
      winnerId: null,
      historyLength: 0,
      gameSpecificState: {
        positions: {},
        cash: {},
        inJail: {},
        jailTurns: {},
        bankrupt: {},
        properties: {},
        doubleRollCount: 0,
        lastRoll: [0, 0],
        tokens: {},
        hands: {},
        deck: 0,
        currentCard: null,
        currentColor: '',
        unoDeclared: {},
        pendingDrawCount: 0,
        ladders: {},
        snakes: {}
      }
    } as any;
    const gameState = gameStateLocal;

    const activePlayer = room?.players?.find((p: Player) => p.id === gameState.activePlayerId) || gameState?.players?.find((p: any) => p.id === gameState.activePlayerId);
    const isMyTurn = gameState.activePlayerId === playerId;

    // --- Ludo Coordinate Precomputations ---
    const ludoSharedCoords: Record<string, { pId: string; tIdx: number }[]> = {};
    if (room?.gameType === 'LUDO') {
      Object.entries(gameState.gameSpecificState.tokens || {}).forEach(([pId, tokenPositions]: [string, any]) => {
        const playerIdx = getPlayerBaseIndex(pId);
        tokenPositions.forEach((pos: number, tIdx: number) => {
          const coords = getLudoCoords(playerIdx, pos, tIdx);
          const key = `${coords.x.toFixed(1)},${coords.y.toFixed(1)}`;
          if (!ludoSharedCoords[key]) {
            ludoSharedCoords[key] = [];
          }
          ludoSharedCoords[key].push({ pId, tIdx });
        });
      });
    }

    // --- Monopoly Coordinate Precomputations ---
    const monopolySharedCoords: Record<string, { pId: string }[]> = {};
    if (room?.gameType === 'MONOPOLY') {
      Object.entries(gameState.gameSpecificState.positions || {}).forEach(([pId, pos]: [string, any]) => {
        if (gameState.gameSpecificState.bankrupt?.[pId]) return;
        const coords = getMonopolyCoords(pos);
        const key = `${coords.x.toFixed(1)},${coords.y.toFixed(1)}`;
        if (!monopolySharedCoords[key]) {
          monopolySharedCoords[key] = [];
        }
          monopolySharedCoords[key].push({ pId });
      });
    }

    // --- Sub-renderers ---
    const renderSnakesLaddersBoard = () => {
      // Helper to render realistic, detailed snake body
      const renderSnake = (head: number, tail: number, snakeIdx: number) => {
        const p1 = getSerpentineCoordinates(head);
        const p2 = getSerpentineCoordinates(tail);
        
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const L = Math.sqrt(dx * dx + dy * dy);
        if (L === 0) return null;
        
        const ux = dx / L;
        const uy = dy / L;
        const nx = -uy;
        const ny = ux;
        
        const pointsCount = 35;
        const leftPoints: { x: number; y: number }[] = [];
        const rightPoints: { x: number; y: number }[] = [];
        
        for (let i = 0; i <= pointsCount; i++) {
          const t = i / pointsCount;
          const bx = p1.x + ux * t * L;
          const by = p1.y + uy * t * L;
          
          // Wiggle oscillation
          const wave = Math.sin(t * Math.PI * 3.5) * Math.sin(t * Math.PI) * 18;
          const cx = bx + nx * wave;
          const cy = by + ny * wave;
          
          // Tapered radius
          let r = 0;
          if (t < 0.12) {
            r = 5 + 9 * (t / 0.12);
          } else {
            r = 14 * (1 - t) + 2.5;
          }
          
          leftPoints.push({ x: cx + nx * r, y: cy + ny * r });
          rightPoints.push({ x: cx - nx * r, y: cy - ny * r });
        }
        
        let pathD = `M ${leftPoints[0].x} ${leftPoints[0].y}`;
        for (let i = 1; i <= pointsCount; i++) {
          pathD += ` L ${leftPoints[i].x} ${leftPoints[i].y}`;
        }
        for (let i = pointsCount; i >= 0; i--) {
          pathD += ` L ${rightPoints[i].x} ${rightPoints[i].y}`;
        }
        pathD += ' Z';
        
        // Head details
        const h1 = leftPoints[0];
        const h2 = rightPoints[0];
        const headCenterX = (h1.x + h2.x) / 2;
        const headCenterY = (h1.y + h2.y) / 2;
        
        // Forward tangent direction
        const tNext = 1.5 / pointsCount;
        const nextBx = p1.x + ux * tNext * L;
        const nextBy = p1.y + uy * tNext * L;
        const nextWave = Math.sin(tNext * Math.PI * 3.5) * Math.sin(tNext * Math.PI) * 18;
        const nextCx = nextBx + nx * nextWave;
        const nextCy = nextBy + ny * nextWave;
        
        const fwdX = headCenterX - nextCx;
        const fwdY = headCenterY - nextCy;
        const fwdL = Math.sqrt(fwdX * fwdX + fwdY * fwdY) || 1;
        const fx = fwdX / fwdL;
        const fy = fwdY / fwdL;
        const rx = -fy;
        const ry = fx;
        
        // Tongue split
        const tongueLen = 14;
        const tx = headCenterX + fx * tongueLen;
        const ty = headCenterY + fy * tongueLen;
        const txL = tx + (fx + rx) * 5;
        const tyL = ty + (fy + ry) * 5;
        const txR = tx + (fx - rx) * 5;
        const tyR = ty + (fy - ry) * 5;
        
        return (
          <g key={`s-${head}-${snakeIdx}`}>
            {/* Tongue */}
            <path 
              d={`M ${headCenterX} ${headCenterY} L ${tx} ${ty} M ${tx} ${ty} L ${txL} ${tyL} M ${tx} ${ty} L ${txR} ${tyR}`}
              stroke="#d90429"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Body */}
            <path 
              d={pathD} 
              fill={`url(#snake-grad-${snakeIdx % 3})`}
              stroke="rgba(0,0,0,0.5)"
              strokeWidth="1.5"
              style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.4))' }}
            />
            {/* Eyes */}
            <circle cx={headCenterX + rx * 4 + fx * 1} cy={headCenterY + ry * 4 + fy * 1} r="2.5" fill="#fff" />
            <circle cx={headCenterX + rx * 4 + fx * 1} cy={headCenterY + ry * 4 + fy * 1} r="1" fill="#000" />
            <circle cx={headCenterX - rx * 4 + fx * 1} cy={headCenterY - ry * 4 + fy * 1} r="2.5" fill="#fff" />
            <circle cx={headCenterX - rx * 4 + fx * 1} cy={headCenterY - ry * 4 + fy * 1} r="1" fill="#000" />
          </g>
        );
      };

      // Helper to render metallic gold parallel-rail ladders
      const renderLadder = (base: number, top: number, ladderIdx: number) => {
        const p1 = getSerpentineCoordinates(base);
        const p2 = getSerpentineCoordinates(top);
        if (p1.x === p2.x) {
          p2.x += 0.1;
        }
        
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const L = Math.sqrt(dx * dx + dy * dy);
        if (L === 0) return null;
        
        const ux = dx / L;
        const uy = dy / L;
        const nx = -uy;
        const ny = ux;
        
        const halfW = 15;
        
        // Parallel Rails
        const lx1 = p1.x + nx * halfW;
        const ly1 = p1.y + ny * halfW;
        const lx2 = p2.x + nx * halfW;
        const ly2 = p2.y + ny * halfW;
        
        const rx1 = p1.x - nx * halfW;
        const ry1 = p1.y - ny * halfW;
        const rx2 = p2.x - nx * halfW;
        const ry2 = p2.y - ny * halfW;
        
        // Rungs spacing
        const rungSpace = 25;
        const numRungs = Math.floor(L / rungSpace);
        const rungs: React.ReactNode[] = [];
        
        for (let i = 1; i <= numRungs; i++) {
          const t = i / (numRungs + 1);
          const cx = p1.x + ux * t * L;
          const cy = p1.y + uy * t * L;
          rungs.push(
            <line 
              key={`rung-${i}`}
              x1={cx + nx * halfW} 
              y1={cy + ny * halfW} 
              x2={cx - nx * halfW} 
              y2={cy - ny * halfW} 
              stroke="url(#ladder-rung-grad)" 
              strokeWidth="4" 
              strokeLinecap="round"
            />
          );
        }
        
        return (
          <g key={`l-${base}-${ladderIdx}`} style={{ filter: 'drop-shadow(0px 3px 5px rgba(0,0,0,0.5))' }}>
            <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke="url(#ladder-rail-grad)" strokeWidth="6" strokeLinecap="round" />
            <line x1={rx1} y1={ry1} x2={rx2} y2={ry2} stroke="url(#ladder-rail-grad)" strokeWidth="6" strokeLinecap="round" />
            {rungs}
          </g>
        );
      };

      return (
        <div className="sl-board-grid">
          {/* Visual Overlay SVG */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '1000px', height: '1000px', pointerEvents: 'none', zIndex: 5 }}>
            <defs>
              <linearGradient id="snake-grad-0" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d90429" />
                <stop offset="100%" stopColor="#5c000b" />
              </linearGradient>
              <linearGradient id="snake-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38b000" />
                <stop offset="100%" stopColor="#004b23" />
              </linearGradient>
              <linearGradient id="snake-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff7000" />
                <stop offset="100%" stopColor="#9a1f00" />
              </linearGradient>
              <linearGradient id="ladder-rail-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffb703" />
                <stop offset="50%" stopColor="#ffd166" />
                <stop offset="100%" stopColor="#fb8500" />
              </linearGradient>
              <linearGradient id="ladder-rung-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffb703" />
                <stop offset="100%" stopColor="#fb8500" />
              </linearGradient>
            </defs>
            
            {/* Render Ladders */}
            {Object.entries(gameState.gameSpecificState.ladders || {}).map(([baseStr, top]: [string, any], idx) => 
              renderLadder(parseInt(baseStr, 10), top, idx)
            )}

            {/* Render Snakes */}
            {Object.entries(gameState.gameSpecificState.snakes || {}).map(([headStr, tail]: [string, any], idx) => 
              renderSnake(parseInt(headStr, 10), tail, idx)
            )}
          </svg>

          {/* Serpentine Grid Cells */}
          {Array.from({ length: 100 }, (_, idx) => {
            const r = Math.floor(idx / 10);
            const c = idx % 10;
            const serpentineRow = 9 - r;
            const num = (serpentineRow % 2 === 0) 
              ? (serpentineRow * 10 + c + 1) 
              : (serpentineRow * 10 + (9 - c) + 1);
              
            const cellColorIndex = (r + c) % 4;
            return (
              <div key={num} className={`sl-cell cell-color-${cellColorIndex}`}>
                <span className="sl-cell-num">{num}</span>
              </div>
            );
          })}

          {/* Render Players' Tokens */}
          {Object.entries(gameState.gameSpecificState.positions || {}).map(([pId, pos]: [string, any], idx) => {
            const { x, y } = getSerpentineCoordinates(pos);
            const offsetSize = 12;
            const xOffset = (idx % 2 === 0 ? -1 : 1) * offsetSize;
            const yOffset = (idx >= 2 ? 1 : -1) * offsetSize;

            const playerObj = room?.players?.find(p => p.id === pId);
            const customColor = playerObj?.color;

            return (
              <div 
                key={pId} 
                className={`player-token ${customColor ? '' : `token-${idx}`}`} 
                style={{
                  left: `${x - 12 + xOffset}px`,
                  top: `${y - 12 + yOffset}px`,
                  zIndex: 10 + idx,
                  backgroundColor: customColor || undefined,
                  boxShadow: customColor ? `0 0 10px ${customColor}` : undefined
                }}
                title={playerObj?.name}
              />
            );
          })}
        </div>
      );
    };

    const renderLudoBoard = () => {
      const is6 = room?.lobbySettings?.maxPlayers === 6;
      const ludoCells: React.ReactNode[] = [];

      if (is6) {
        for (let r = 0; r < 15; r++) {
          for (let c = 0; c < 24; c++) {
            // Check Red base
            if (r < 6 && c < 6) continue;
            // Check Orange base
            if (r < 6 && c >= 9 && c < 15) continue;
            // Check Yellow base
            if (r < 6 && c >= 18) continue;
            // Check Green base
            if (r >= 9 && c >= 18) continue;
            // Check Blue base
            if (r >= 9 && c >= 9 && c < 15) continue;
            // Check Purple base
            if (r >= 9 && c < 6) continue;
            // Check Left Center Home
            if (r >= 6 && r <= 8 && c >= 6 && c <= 8) continue;
            // Check Right Center Home
            if (r >= 6 && r <= 8 && c >= 15 && c <= 17) continue;

            let cellClass = 'ludo-cell path-neutral';
            // Home stretches
            if (r === 7 && c >= 1 && c <= 5) cellClass = 'ludo-cell path-red';
            else if (c === 7 && r >= 1 && r <= 5) cellClass = 'ludo-cell path-orange';
            else if (c === 16 && r >= 1 && r <= 5) cellClass = 'ludo-cell path-yellow';
            else if (r === 7 && c >= 18 && c <= 22) cellClass = 'ludo-cell path-green';
            else if (c === 16 && r >= 9 && r <= 13) cellClass = 'ludo-cell path-blue';
            else if (c === 7 && r >= 9 && r <= 13) cellClass = 'ludo-cell path-purple';
            // Start cells
            else if (r === 6 && c === 1) cellClass = 'ludo-cell path-red start-cell';
            else if (r === 1 && c === 8) cellClass = 'ludo-cell path-orange start-cell';
            else if (r === 1 && c === 17) cellClass = 'ludo-cell path-yellow start-cell';
            else if (r === 8 && c === 22) cellClass = 'ludo-cell path-green start-cell';
            else if (r === 13 && c === 15) cellClass = 'ludo-cell path-blue start-cell';
            else if (r === 13 && c === 6) cellClass = 'ludo-cell path-purple start-cell';
            // Safe cells
            else if ((r === 2 && c === 6) || (r === 6 && c === 11) || (r === 2 && c === 15) || (r === 6 && c === 20) || (r === 12 && c === 17) || (r === 8 && c === 12) || (r === 12 && c === 8) || (r === 8 && c === 3)) {
              cellClass = 'ludo-cell path-safe';
            }

            ludoCells.push(
              <div 
                key={`cell-${r}-${c}`}
                className={cellClass}
                style={{ gridRow: r + 1, gridColumn: c + 1 }}
              />
            );
          }
        }
      } else {
        for (let r = 0; r < 15; r++) {
          for (let c = 0; c < 15; c++) {
            if (r < 6 && c < 6) continue; // Base Red
            if (r < 6 && c > 8) continue; // Base Green
            if (r > 8 && c > 8) continue; // Base Yellow
            if (r > 8 && c < 6) continue; // Base Blue
            if (r >= 6 && r <= 8 && c >= 6 && c <= 8) continue; // Center Home
            
            let cellClass = 'ludo-cell path-neutral';
            if (r === 7 && c >= 1 && c <= 5) cellClass = 'ludo-cell path-red';
            else if (r === 7 && c >= 9 && c <= 13) cellClass = 'ludo-cell path-yellow';
            else if (c === 7 && r >= 1 && r <= 5) cellClass = 'ludo-cell path-green';
            else if (c === 7 && r >= 9 && r <= 13) cellClass = 'ludo-cell path-blue';
            else if (r === 6 && c === 1) cellClass = 'ludo-cell path-red start-cell';
            else if (r === 1 && c === 8) cellClass = 'ludo-cell path-green start-cell';
            else if (r === 8 && c === 13) cellClass = 'ludo-cell path-yellow start-cell';
            else if (r === 13 && c === 6) cellClass = 'ludo-cell path-blue start-cell';
            else if ((r === 2 && c === 6) || (r === 6 && c === 12) || (r === 12 && c === 8) || (r === 8 && c === 2)) {
              cellClass = 'ludo-cell path-safe';
            }
            
            ludoCells.push(
              <div 
                key={`cell-${r}-${c}`}
                className={cellClass}
                style={{ gridRow: r + 1, gridColumn: c + 1 }}
              />
            );
          }
        }
      }

      return (
        <div 
          className="ludo-board-grid" 
          style={is6 ? { 
            width: '1000px', 
            height: '625px', 
            gridTemplateColumns: 'repeat(24, 1fr)',
            aspectRatio: '24 / 15'
          } : undefined}
        >
          {/* Bases */}
          <div className="ludo-cell base-red" style={{ gridRow: '1/7', gridColumn: '1/7' }}>
            <div className="base-inner">
              <div className="base-pocket" />
              <div className="base-pocket" />
              <div className="base-pocket" />
              <div className="base-pocket" />
            </div>
          </div>
          {is6 ? (
            <>
              <div className="ludo-cell base-orange" style={{ gridRow: '1/7', gridColumn: '10/16' }}>
                <div className="base-inner">
                  <div className="base-pocket" />
                  <div className="base-pocket" />
                  <div className="base-pocket" />
                  <div className="base-pocket" />
                </div>
              </div>
              <div className="ludo-cell base-yellow" style={{ gridRow: '1/7', gridColumn: '19/25' }}>
                <div className="base-inner">
                  <div className="base-pocket" />
                  <div className="base-pocket" />
                  <div className="base-pocket" />
                  <div className="base-pocket" />
                </div>
              </div>
              <div className="ludo-cell base-green" style={{ gridRow: '10/16', gridColumn: '19/25' }}>
                <div className="base-inner">
                  <div className="base-pocket" />
                  <div className="base-pocket" />
                  <div className="base-pocket" />
                  <div className="base-pocket" />
                </div>
              </div>
              <div className="ludo-cell base-blue" style={{ gridRow: '10/16', gridColumn: '10/16' }}>
                <div className="base-inner">
                  <div className="base-pocket" />
                  <div className="base-pocket" />
                  <div className="base-pocket" />
                  <div className="base-pocket" />
                </div>
              </div>
              <div className="ludo-cell base-purple" style={{ gridRow: '10/16', gridColumn: '1/7' }}>
                <div className="base-inner">
                  <div className="base-pocket" />
                  <div className="base-pocket" />
                  <div className="base-pocket" />
                  <div className="base-pocket" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="ludo-cell base-green" style={{ gridRow: '1/7', gridColumn: '10/16' }}>
                <div className="base-inner">
                  <div className="base-pocket" />
                  <div className="base-pocket" />
                  <div className="base-pocket" />
                  <div className="base-pocket" />
                </div>
              </div>
              <div className="ludo-cell base-yellow" style={{ gridRow: '10/16', gridColumn: '10/16' }}>
                <div className="base-inner">
                  <div className="base-pocket" />
                  <div className="base-pocket" />
                  <div className="base-pocket" />
                  <div className="base-pocket" />
                </div>
              </div>
              <div className="ludo-cell base-blue" style={{ gridRow: '10/16', gridColumn: '1/7' }}>
                <div className="base-inner">
                  <div className="base-pocket" />
                  <div className="base-pocket" />
                  <div className="base-pocket" />
                  <div className="base-pocket" />
                </div>
              </div>
            </>
          )}

          {/* Center Homes */}
          {is6 ? (
            <>
              {/* Left Center Home */}
              <div className="ludo-cell ludo-center" style={{ gridRow: '7/10', gridColumn: '7/10', display: 'flex', position: 'relative' }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  background: 'conic-gradient(from 300deg, var(--accent-orange) 120deg, var(--accent-pink) 120deg 240deg, var(--accent-purple) 240deg)'
                }} />
                <div style={{
                  position: 'absolute', top: '15%', left: '15%', width: '70%', height: '70%',
                  backgroundColor: '#0d061f', borderRadius: '50%', border: '2px solid var(--accent-purple)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '11px', color: '#fff'
                }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>HOME L</span>
                  {gameState?.gameSpecificState?.lastRoll > 0 && (
                    <span style={{ fontSize: '15px', color: 'var(--accent-orange)', marginTop: '2px' }}>🎲 {gameState.gameSpecificState.lastRoll}</span>
                  )}
                </div>
              </div>
              {/* Right Center Home */}
              <div className="ludo-cell ludo-center" style={{ gridRow: '7/10', gridColumn: '16/19', display: 'flex', position: 'relative' }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  background: 'conic-gradient(from 60deg, var(--accent-green) 120deg, var(--accent-blue) 120deg 240deg, var(--accent-gold) 240deg)'
                }} />
                <div style={{
                  position: 'absolute', top: '15%', left: '15%', width: '70%', height: '70%',
                  backgroundColor: '#0d061f', borderRadius: '50%', border: '2px solid var(--accent-purple)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '11px', color: '#fff'
                }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>HOME R</span>
                  {gameState?.gameSpecificState?.lastRoll > 0 && (
                    <span style={{ fontSize: '15px', color: 'var(--accent-green)', marginTop: '2px' }}>🎲 {gameState.gameSpecificState.lastRoll}</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="ludo-cell ludo-center" style={{ gridRow: '7/10', gridColumn: '7/10', display: 'flex', position: 'relative' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'conic-gradient(from 315deg, var(--accent-green) 90deg, var(--accent-gold) 90deg 180deg, var(--accent-blue) 180deg 270deg, var(--accent-pink) 270deg)'
              }} />
              <div style={{
                position: 'absolute', top: '15%', left: '15%', width: '70%', height: '70%',
                backgroundColor: '#0d061f', borderRadius: '50%', border: '2px solid var(--accent-purple)',
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '13px', color: '#fff', gap: '2px'
              }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HOME</span>
                {gameState?.gameSpecificState?.lastRoll > 0 && (
                  <span style={{ fontSize: '18px', color: 'var(--accent-gold)' }}>🎲 {gameState.gameSpecificState.lastRoll}</span>
                )}
              </div>
            </div>
          )}

          {/* Render track cells */}
          {ludoCells}

          {/* Render Tokens */}
          {Object.entries(gameState.gameSpecificState.tokens || {}).map(([pId, tokenPositions]: [string, any]) => {
            const playerIdx = getPlayerBaseIndex(pId);
            const playerObj = room?.players?.find((p: any) => p.id === pId) || gameState?.players?.find((p: any) => p.id === pId);
            if (!playerObj) return null;

            return tokenPositions.map((pos: number, tIdx: number) => {
              const coords = getLudoCoords(playerIdx, pos, tIdx);
              const key = `${coords.x.toFixed(1)},${coords.y.toFixed(1)}`;
              const shared = ludoSharedCoords[key] || [];
              const count = shared.length;
              const indexInCell = shared.findIndex(t => t.pId === pId && t.tIdx === tIdx);
              
              let ox = 0, oy = 0;
              if (count > 1) {
                const angle = (indexInCell / count) * 2 * Math.PI;
                const radius = 12;
                ox = Math.cos(angle) * radius;
                oy = Math.sin(angle) * radius;
              }

              const isInteractive = isMyTurn && (gameState.subState === 'WAITING_FOR_TOKEN_MOVE') && (pId === playerId) && isTokenMoveValid(playerIdx, tIdx, pos, gameState.gameSpecificState.lastRoll);
              const colorName = getLudoColorName(playerIdx);

              return (
                <div 
                  key={`${pId}-${tIdx}`}
                  className={`ludo-token color-${colorName} ${isInteractive ? 'interactive' : ''}`}
                  style={{
                    left: `${coords.x + ox}px`,
                    top: `${coords.y + oy}px`,
                    zIndex: 100 + playerIdx * 4 + tIdx,
                    borderColor: isInteractive ? '#fff' : undefined,
                    boxShadow: isInteractive ? '0 0 15px #fff, 0 0 10px currentColor' : undefined,
                  }}
                  onClick={() => {
                    if (isInteractive) {
                      handleMoveToken(tIdx);
                    }
                  }}
                  title={`${playerObj?.name}'s Token ${tIdx + 1}`}
                >
                  <svg viewBox="0 0 100 100" width="22" height="22" fill="currentColor" style={{ filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.35))' }}>
                    <circle cx="50" cy="25" r="16" />
                    <path d="M50 42c-12 0-20 8-20 20v6h40v-6c0-12-8-20-20-20z" />
                    <rect x="25" y="72" width="50" height="8" rx="4" />
                  </svg>
                </div>
              );
            });
          })}
        </div>
      );
    };

    const renderCardBackFan = (count: number, isVertical: boolean = false) => {
      const maxVisible = Math.min(count, 8);
      const cards = [];
      for (let i = 0; i < maxVisible; i++) {
        const rotation = (i - (maxVisible - 1) / 2) * 8;
        const offset = (i - (maxVisible - 1) / 2) * 12;
        cards.push(
          <div
            key={i}
            className="uno-card-back-mini"
            style={{
              width: '28px',
              height: '42px',
              borderRadius: '4px',
              background: 'linear-gradient(135deg, #d90429 0%, #7a0010 100%)',
              border: '1.5px solid #fff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
              transform: isVertical 
                ? `translateY(${offset}px) rotate(${90 + rotation}deg)`
                : `translateX(${offset}px) rotate(${rotation}deg)`,
              position: i === 0 ? 'relative' : 'absolute',
              transition: 'all 0.2s ease',
            }}
          />
        );
      }
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: '42px', width: isVertical ? '42px' : `${28 + (maxVisible - 1) * 12}px` }}>
          {cards}
        </div>
      );
    };

    const getOpponentStyle = (idx: number, total: number): React.CSSProperties => {
      if (total === 3) {
        if (idx === 0) return { position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', zIndex: 100 };
        if (idx === 1) return { position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 100 };
        if (idx === 2) return { position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', zIndex: 100 };
      }
      if (total === 2) {
        if (idx === 0) return { position: 'absolute', left: '48px', top: '40%', transform: 'translateY(-50%)', zIndex: 100 };
        if (idx === 1) return { position: 'absolute', right: '48px', top: '40%', transform: 'translateY(-50%)', zIndex: 100 };
      }
      return { position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 100 };
    };

    const renderUnoBoard = () => {
      const hands = gameState.gameSpecificState.hands || {};
      const otherPlayers = room?.players?.filter(p => p.id !== playerId) || [];

      return (
        <div className="uno-table">
          {/* Opponents positioned around the board */}
          {otherPlayers.map((p, idx) => {
            const opponentHand = hands[p.id];
            const cardCount = typeof opponentHand === 'number' ? opponentHand : (opponentHand?.length || 0);
            const isVulnerable = cardCount === 1 && !gameState.gameSpecificState.unoDeclared?.[p.id];
            const isPlayerActive = p.id === gameState.activePlayerId;

            return (
              <div 
                key={p.id} 
                className="glass-panel" 
                style={{ 
                  ...getOpponentStyle(idx, otherPlayers.length),
                  padding: '12px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  borderColor: isPlayerActive ? 'var(--accent-green)' : 'rgba(123, 44, 191, 0.2)',
                  boxShadow: isPlayerActive ? '0 0 15px var(--accent-green)' : undefined,
                  background: isPlayerActive ? 'rgba(56, 176, 0, 0.08)' : 'rgba(27, 18, 50, 0.8)',
                  transition: 'all 0.3s ease',
                  minWidth: '150px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: p.connected ? 'var(--accent-green)' : 'var(--text-muted)' }} />
                    <span style={{ fontSize: '13px', color: '#fff' }}>{p.name}</span>
                  </div>
                  {isPlayerActive && (
                    <span style={{ fontSize: '9px', backgroundColor: 'var(--accent-green)', color: '#fff', padding: '1px 4px', borderRadius: '3px', fontWeight: 'bold' }}>TURN</span>
                  )}
                </div>
                
                {/* Opponent Card Fan (Vertical for left/right, horizontal for top) */}
                {renderCardBackFan(cardCount, otherPlayers.length === 3 ? (idx === 0 || idx === 2) : true)}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{cardCount} cards</span>
                  {cardCount === 1 && (
                    <span className="badge-uno" style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', fontSize: '9px', padding: '1px 5px', borderRadius: '3px', fontWeight: 'bold' }}>
                      UNO!
                    </span>
                  )}
                  <button 
                    onClick={() => socket?.emit('game_action', { type: 'CHALLENGE_UNO', payload: { targetPlayerId: p.id } })}
                    className="btn-secondary"
                    style={{ 
                      padding: '2px 6px', 
                      fontSize: '9px', 
                      borderRadius: '4px',
                      height: 'fit-content',
                      borderColor: isVulnerable ? 'var(--accent-pink)' : undefined,
                      boxShadow: isVulnerable ? '0 0 10px var(--accent-pink)' : undefined
                    }}
                  >
                    Challenge
                  </button>
                </div>
              </div>
            );
          })}

          {/* Center Table Pile */}
          {renderUnoTableCenter()}

          {/* Player Hand */}
          {renderUnoHand()}
        </div>
      );
    };

    const renderUnoTableCenter = () => {
      const deckCount = gameState.gameSpecificState.deck; 
      const currentCard = gameState.gameSpecificState.currentCard;
      const currentColor = gameState.gameSpecificState.currentColor;
      const direction = gameState.gameSpecificState.direction;
      const isClockwise = direction === 1;

      return (
        <div style={{
          position: 'relative',
          width: '340px',
          height: '340px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: 'auto'
        }}>
          {/* Animated circular rotation indicator */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 0,
            transform: !isClockwise ? 'scaleX(-1)' : 'none',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'transform 0.5s ease'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              animation: 'spin-clockwise 15s linear infinite'
            }}>
              <svg viewBox="0 0 200 200" style={{ width: '280px', height: '280px', overflow: 'visible' }}>
                <defs>
                  <filter id="arrow-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                
                {/* Circular track */}
                <circle 
                  cx="100" 
                  cy="100" 
                  r="80" 
                  fill="none" 
                  stroke="rgba(255, 255, 255, 0.05)" 
                  strokeWidth="4" 
                  strokeDasharray="8, 8" 
                />
                
                {/* Top-Right Arrow */}
                <path 
                  d="M 100 20 A 80 80 0 0 1 177 85" 
                  fill="none" 
                  stroke="var(--accent-gold)" 
                  strokeWidth="5" 
                  strokeLinecap="round"
                  filter="url(#arrow-glow)"
                />
                <polygon 
                  points="177,78 183,93 170,89" 
                  fill="var(--accent-gold)" 
                  filter="url(#arrow-glow)"
                />

                {/* Bottom-Left Arrow */}
                <path 
                  d="M 100 180 A 80 80 0 0 1 23 115" 
                  fill="none" 
                  stroke="var(--accent-gold)" 
                  strokeWidth="5" 
                  strokeLinecap="round"
                  filter="url(#arrow-glow)"
                />
                <polygon 
                  points="23,122 17,107 29,113" 
                  fill="var(--accent-gold)" 
                  filter="url(#arrow-glow)"
                />
              </svg>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
            {/* Draw Pile */}
            <div 
              className="uno-card card-wild" 
              style={{
                cursor: isMyTurn ? 'pointer' : 'default',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #1b1232 0%, #0a0514 100%)',
                borderColor: isMyTurn ? 'var(--accent-green)' : 'var(--accent-purple)',
                boxShadow: isMyTurn ? '0 0 15px var(--accent-green)' : undefined,
                width: '90px',
                height: '135px'
              }}
              onClick={() => {
                if (isMyTurn) {
                  socket?.emit('game_action', { type: 'DRAW_CARD', payload: {} });
                  setSelectedCardIndices([]);
                }
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 'bold' }}>DRAW</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                {typeof deckCount === 'number' ? deckCount : (deckCount?.length || 0)} left
              </div>
            </div>

            {/* Discard Pile */}
            {currentCard && (
              <div 
                className={`uno-card card-${currentCard.color}`}
                style={{
                  cursor: 'default',
                  width: '90px',
                  height: '135px',
                  borderColor: currentColor !== currentCard.color ? '#fff' : undefined,
                  boxShadow: `0 0 20px ${
                    currentColor === 'red' ? '#d90429' :
                    currentColor === 'green' ? '#38b000' :
                    currentColor === 'blue' ? '#00b4d8' : '#ffb703'
                  }`
                }}
              >
                <div style={{ alignSelf: 'flex-start', fontSize: '13px' }}>
                  {currentCard.value.toUpperCase()}
                </div>
                <div className="uno-card-center-symbol" style={{ fontSize: '28px' }}>
                  {getUnoCardSymbol(currentCard.value)}
                </div>
                <div style={{ alignSelf: 'flex-end', fontSize: '13px', transform: 'rotate(180deg)' }}>
                  {currentCard.value.toUpperCase()}
                </div>
                {/* Color Indicator suit badge */}
                <div style={{
                  position: 'absolute', bottom: '-22px', left: '50%', transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.85)', padding: '2px 8px', borderRadius: '10px',
                  fontSize: '10px', color: '#fff', whiteSpace: 'nowrap',
                  border: `1.5px solid ${
                    currentColor === 'red' ? '#d90429' :
                    currentColor === 'green' ? '#38b000' :
                    currentColor === 'blue' ? '#00b4d8' : '#ffb703'
                  }`
                }}>
                  Suit: {currentColor.toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    };

    const renderUnoHand = () => {
      const hand = gameState.gameSpecificState?.hands?.[playerId] as UnoCard[];
      if (!hand) return null;

      const rules = gameState.gameSpecificState.rules || { cardStacking: true, cardDoubles: true };
      const pendingDraw = gameState.gameSpecificState.pendingDrawCount || 0;

      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '10px' }}>
          {/* Doubles Floating Action Overlay Bar */}
          {selectedCardIndices.length > 0 && (
            <div className="glass-panel" style={{
              display: 'flex',
              gap: '16px',
              padding: '8px 20px',
              alignItems: 'center',
              borderRadius: '20px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              border: '1.5px solid var(--accent-purple)',
              animation: 'slideUp 0.2s ease-out'
            }}>
              <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>
                {selectedCardIndices.length} Card{selectedCardIndices.length > 1 ? 's' : ''} Selected
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedCardIndices.length === 1 && (
                  <button 
                    className="btn-primary" 
                    style={{ padding: '6px 16px', fontSize: '12px', borderRadius: '12px' }}
                    onClick={() => handlePlayCards(selectedCardIndices)}
                  >
                    Play Single
                  </button>
                )}
                {selectedCardIndices.length === 2 && (
                  <button 
                    className="btn-primary" 
                    style={{ padding: '6px 16px', fontSize: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-orange) 100%)', boxShadow: '0 0 10px rgba(255, 183, 3, 0.4)' }}
                    onClick={() => handlePlayCards(selectedCardIndices)}
                  >
                    Play Double!
                  </button>
                )}
                <button 
                  className="btn-secondary" 
                  style={{ padding: '6px 16px', fontSize: '12px', borderRadius: '12px' }}
                  onClick={() => setSelectedCardIndices([])}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Actual Hand of Cards */}
          <div style={{
            display: 'flex', gap: '12px', justifyContent: 'center', padding: '20px 40px',
            overflowX: 'auto', width: '100%', boxSizing: 'border-box'
          }}>
            {hand.map((card, idx) => {
              const isDrawnCard = idx === hand.length - 1;
              const isPlayOrPass = gameState.subState === 'PLAY_OR_PASS';
              const isSelected = selectedCardIndices.includes(idx);
              
              // Validation for single card selection eligibility
              let playable = isMyTurn && 
                (!isPlayOrPass || isDrawnCard) && 
                isCardPlayable(card, gameState.gameSpecificState?.currentCard, gameState.gameSpecificState?.currentColor);
              
              // Under draw penalty, we can stack if stacking rule is enabled and the card is draw2 or wildDraw4
              if (pendingDraw > 0) {
                if (rules.cardStacking) {
                  const currentVal = gameState.gameSpecificState?.currentCard?.value;
                  playable = isMyTurn && (
                    (currentVal === 'draw2' && (card.value === 'draw2' || card.value === 'wildDraw4')) ||
                    (currentVal === 'wildDraw4' && card.value === 'wildDraw4')
                  );
                } else {
                  playable = false;
                }
              }

              return (
                <div
                  key={idx}
                  className={`uno-card card-${card.color}`}
                  style={{
                    borderWidth: (isPlayOrPass && isDrawnCard) ? '4px' : (playable || isSelected) ? '3.5px' : '2.5px',
                    borderColor: (isPlayOrPass && isDrawnCard) ? 'var(--accent-gold)' : isSelected ? 'var(--accent-gold)' : playable ? '#fff' : undefined,
                    boxShadow: (isPlayOrPass && isDrawnCard)
                      ? '0 0 20px var(--accent-gold), 0 5px 15px rgba(0,0,0,0.3)'
                      : isSelected
                        ? '0 0 25px var(--accent-gold), 0 5px 15px rgba(0,0,0,0.4)'
                        : playable
                          ? '0 0 15px rgba(255, 255, 255, 0.4), 0 5px 15px rgba(0,0,0,0.3)'
                          : undefined,
                    transform: isSelected 
                      ? 'translateY(-30px) scale(1.05)'
                      : (isPlayOrPass && isDrawnCard) || playable 
                        ? 'translateY(-15px)' 
                        : undefined,
                    opacity: (selectedCardIndices.length > 0 && !isSelected) ? 0.6 : 1,
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onClick={() => {
                    if (isMyTurn) {
                      if (pendingDraw > 0 && !playable) {
                        alert("You must stack a +2/+4 or draw penalty cards!");
                        return;
                      }
                      if (isPlayOrPass && !isDrawnCard) {
                        alert("You can only play the drawn card or pass!");
                        return;
                      }

                      // If doubles rule is enabled, manage multi-selection
                      if (rules.cardDoubles && !isPlayOrPass) {
                        if (isSelected) {
                          setSelectedCardIndices(prev => prev.filter(x => x !== idx));
                        } else {
                          if (selectedCardIndices.length === 0) {
                            setSelectedCardIndices([idx]);
                          } else if (selectedCardIndices.length === 1) {
                            const firstCard = hand[selectedCardIndices[0]];
                            if (firstCard.value === card.value) {
                              setSelectedCardIndices([selectedCardIndices[0], idx]);
                            } else {
                              // If value does not match, switch selection to this card
                              setSelectedCardIndices([idx]);
                            }
                          } else {
                            // Max 2 cards, reset selection to new card
                            setSelectedCardIndices([idx]);
                          }
                        }
                      } else {
                        // Legacy single-click instant play (if playable)
                        if (playable) {
                          handlePlayCard(idx);
                        } else {
                          alert("This card is not playable right now!");
                        }
                      }
                    }
                  }}
                >
                  {isPlayOrPass && isDrawnCard && (
                    <div style={{
                      position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)',
                      backgroundColor: 'var(--accent-gold)', color: '#000', fontSize: '9px', fontWeight: 'bold',
                      padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap', zIndex: 10
                    }}>
                      DRAWN
                    </div>
                  )}
                  <div style={{ alignSelf: 'flex-start', fontSize: '14px' }}>
                    {card.value.toUpperCase()}
                  </div>
                  <div className="uno-card-center-symbol">
                    {getUnoCardSymbol(card.value)}
                  </div>
                  <div style={{ alignSelf: 'flex-end', fontSize: '14px', transform: 'rotate(180deg)' }}>
                    {card.value.toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    const renderMonopolyBoard = () => {
      const properties = gameState?.gameSpecificState?.properties || {};
      const positions = gameState?.gameSpecificState?.positions || {};
      const bankrupt = gameState?.gameSpecificState?.bankrupt || {};
      const subState = gameState?.subState;
      const isMyTurn = gameState ? (gameState.activePlayerId === playerId) : false;
      const cashValue = gameState?.gameSpecificState?.cash?.[playerId] || 0;
      
      const activePlayer = room?.players?.find(p => p.id === gameState?.activePlayerId);
      const activePlayerName = activePlayer ? activePlayer.name : 'Unknown';

      return (
        <div className="monopoly-board-grid">
          {/* Center Area */}
          <div className="monopoly-center-panel">
            {/* Property Card Detail Modal Overlay */}
            {selectedSpaceIndex !== null && (() => {
              const space = MONOPOLY_BOARD[selectedSpaceIndex];
              const prop = properties[selectedSpaceIndex];
              const isSpaceOwned = prop && prop.ownerId;
              const spaceOwner = isSpaceOwned ? room?.players?.find(p => p.id === prop.ownerId) : null;
              const isOwnedByMe = prop && prop.ownerId === playerId;
              const isSpaceMortgaged = prop && prop.mortgaged;

              // Color group mapping for headers
              const headerColor = space.group ? (colorGroupMap[space.group] || '#7b2cbf') : '#ffffff';

              return (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'rgba(6, 2, 10, 0.75)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 1000,
                  borderRadius: '8px',
                  padding: '16px',
                  boxSizing: 'border-box'
                }}>
                  <div className="glass-panel" style={{
                    width: '320px',
                    background: 'rgba(30, 20, 50, 0.95)',
                    border: `1.5px solid ${space.group ? headerColor : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 30px ${space.group ? headerColor : 'rgba(123,44,191,0.1)'}30`,
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '100%'
                  }}>
                    {/* Header Banner */}
                    <div style={{
                      backgroundColor: space.group ? headerColor : 'rgba(255,255,255,0.06)',
                      padding: '16px',
                      textAlign: 'center',
                      position: 'relative',
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      flexShrink: 0
                    }}>
                      <button 
                        onClick={() => setSelectedSpaceIndex(null)}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: 'rgba(0,0,0,0.3)',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          zIndex: 10
                        }}
                      >
                        ✕
                      </button>

                      {space.flag && (
                        <div style={{
                          width: '40px',
                          height: '28px',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                          marginBottom: '8px'
                        }}>
                          <img 
                            src={space.flag} 
                            alt={`${space.name} flag`} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        </div>
                      )}
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {space.name}
                      </h3>
                      {space.price !== undefined && (
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px', fontWeight: '500' }}>
                          Purchase Price: ${space.price}
                        </div>
                      )}
                    </div>

                    {/* Card Content / Details */}
                    <div style={{ padding: '16px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }} className="lobby-settings-scroll">
                      {/* Owner state description */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '12.5px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                        {isSpaceOwned ? (
                          <span style={{ fontWeight: 'bold', color: isOwnedByMe ? 'var(--accent-green)' : 'var(--accent-pink)' }}>
                            Owned by {isOwnedByMe ? 'You' : spaceOwner?.name} {isSpaceMortgaged ? '(Mortgaged)' : ''}
                          </span>
                        ) : (
                          <span style={{ fontWeight: 'bold', color: 'var(--accent-gold)' }}>Unowned / Available</span>
                        )}
                      </div>

                      {/* Rent breakdowns */}
                      {space.type === 'property' && space.rent && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
                            <span>Base Rent:</span>
                            <strong>${space.rent[0]}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)' }}>
                            <span>With Full Group (x2 Rent):</span>
                            <strong>${space.rent[0] * 2}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)' }}>
                            <span>🏠 With 1 House:</span>
                            <strong>${space.rent[1]}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)' }}>
                            <span>🏠🏠 With 2 Houses:</span>
                            <strong>${space.rent[2]}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)' }}>
                            <span>🏠🏠🏠 With 3 Houses:</span>
                            <strong>${space.rent[3]}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)' }}>
                            <span>🏠🏠🏠🏠 With 4 Houses:</span>
                            <strong>${space.rent[4]}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-gold)', fontWeight: 'bold' }}>
                            <span>🏨 With Hotel:</span>
                            <strong>${space.rent[5]}</strong>
                          </div>
                        </div>
                      )}

                      {space.type === 'railroad' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
                            <span>1 Airport Owned:</span>
                            <strong>$25</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)' }}>
                            <span>2 Airports Owned:</span>
                            <strong>$50</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)' }}>
                            <span>3 Airports Owned:</span>
                            <strong>$100</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)' }}>
                            <span>4 Airports Owned:</span>
                            <strong>$200</strong>
                          </div>
                        </div>
                      )}

                      {space.type === 'utility' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                          <div style={{ color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', marginBottom: '4px', textAlign: 'center', lineHeight: '1.4' }}>
                            Rent is calculated based on dice roll value.
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
                            <span>1 Utility Owned:</span>
                            <strong>4x Dice Roll</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
                            <span>2 Utilities Owned:</span>
                            <strong>10x Dice Roll</strong>
                          </div>
                        </div>
                      )}

                      {/* Mortgaged value details */}
                      {space.mortgageValue !== undefined && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                          <span>Mortgage Value:</span>
                          <strong>${space.mortgageValue}</strong>
                        </div>
                      )}
                    </div>

                    {/* Action Panel Footer */}
                    {isOwnedByMe && (
                      <div style={{
                        padding: '16px',
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(0,0,0,0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        flexShrink: 0
                      }}>
                        {/* Build/Sell House Row */}
                        {space.type === 'property' && (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              onClick={() => handleBuildHouseProperty(selectedSpaceIndex)}
                              disabled={isSpaceMortgaged || (prop.houses >= 5)}
                              className="btn-primary"
                              style={{
                                flex: 1,
                                padding: '8px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                opacity: (isSpaceMortgaged || (prop.houses >= 5)) ? 0.5 : 1
                              }}
                            >
                              🏗️ Build (+${space.houseCost})
                            </button>
                            <button
                              onClick={() => handleSellHouseProperty(selectedSpaceIndex)}
                              disabled={prop.houses === 0}
                              className="btn-secondary"
                              style={{
                                flex: 1,
                                padding: '8px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                opacity: (prop.houses === 0) ? 0.5 : 1
                              }}
                            >
                              🏚️ Sell (-${Math.floor((space.houseCost || 0) * 0.5)})
                            </button>
                          </div>
                        )}

                        {/* Mortgage & Sell Property Row */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                          {gameState.gameSpecificState?.config?.mortgage !== false && (
                            <button
                              onClick={() => {
                                if (isSpaceMortgaged) {
                                  handleUnmortgageProperty(selectedSpaceIndex);
                                } else {
                                  handleMortgageProperty(selectedSpaceIndex);
                                }
                              }}
                              disabled={prop.houses > 0}
                              className="btn-secondary"
                              style={{
                                flex: 1,
                                padding: '8px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                opacity: prop.houses > 0 ? 0.5 : 1
                              }}
                            >
                              {isSpaceMortgaged ? '🏦 Unmortgage' : '💰 Mortgage'}
                            </button>
                          )}

                          <button
                            onClick={() => {
                              handleSellProperty(selectedSpaceIndex);
                              setSelectedSpaceIndex(null); // auto-close details on sell
                            }}
                            disabled={prop.houses > 0}
                            className="btn-primary"
                            style={{
                              flex: 1,
                              padding: '8px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              background: 'linear-gradient(135deg, var(--accent-pink) 0%, #b3001e 100%)',
                              boxShadow: '0 0 10px rgba(217,4,41,0.2)',
                              opacity: prop.houses > 0 ? 0.5 : 1
                            }}
                            title="Sell back to the bank for 50% of purchase price"
                          >
                            🗑️ Sell (${Math.floor((space.price || 0) * 0.5)})
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Auction Overlay */}
            {gameState.subState === 'AUCTION' && (() => {
              const auctionSpaceIndex = gameState.gameSpecificState.auctionSpaceIndex;
              const auctionCurrentBid = gameState.gameSpecificState.auctionCurrentBid;
              const auctionHighestBidderId = gameState.gameSpecificState.auctionHighestBidderId;
              const auctionBidders = gameState.gameSpecificState.auctionBidders || [];
              const auctionActiveBidderIndex = gameState.gameSpecificState.auctionActiveBidderIndex;
              
              if (auctionSpaceIndex === undefined) return null;

              const space = MONOPOLY_BOARD[auctionSpaceIndex];
              const activeBidderId = auctionBidders[auctionActiveBidderIndex];
              const isActiveBidderMe = activeBidderId === playerId;
              
              const activeBidderName = room?.players?.find(p => p.id === activeBidderId)?.name || 'Unknown';
              const highestBidderName = auctionHighestBidderId ? (room?.players?.find(p => p.id === auctionHighestBidderId)?.name || 'Unknown') : 'No bids yet';
              
              const colorGroupHex = space.group === 'brown' ? '#955436' :
                                    space.group === 'light-blue' ? '#aae0fa' :
                                    space.group === 'magenta' ? '#d93b96' :
                                    space.group === 'orange' ? '#f7941d' :
                                    space.group === 'red' ? '#ed1c24' :
                                    space.group === 'yellow' ? '#fef200' :
                                    space.group === 'green' ? '#1fb25a' :
                                    space.group === 'dark-blue' ? '#0072bc' : '#9aa0a6';

              const handlePlaceBid = (amount: number) => {
                socket?.emit('game_action', { type: 'BID', payload: { amount } });
              };

              const handleFoldAuction = () => {
                socket?.emit('game_action', { type: 'FOLD', payload: {} });
              };

              return (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(6,2,10,0.92)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  zIndex: 900
                }}>
                  <div className="glass-panel" style={{
                    width: '320px',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1.5px solid var(--accent-purple)',
                    background: 'rgba(123,44,191,0.05)',
                    textAlign: 'center',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      📢 Property Auction
                    </span>
                    
                    <div style={{
                      marginTop: '12px',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                      <div style={{ height: '14px', background: colorGroupHex }} />
                      <div style={{ padding: '12px' }}>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>{space.name}</h3>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Valued at ${space.price}</span>
                      </div>
                    </div>

                    <div style={{ margin: '16px 0', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Highest Bid</div>
                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent-green)', margin: '4px 0' }}>
                        ${auctionCurrentBid}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        by <strong>{highestBidderName}</strong>
                      </div>
                    </div>

                    <div style={{ margin: '14px 0', fontSize: '13px' }}>
                      {isActiveBidderMe ? (
                        <div style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>
                          👉 Your Turn to Bid!
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-secondary)' }}>
                          Turn: <strong>{activeBidderName}</strong>
                        </div>
                      )}
                    </div>

                    {isActiveBidderMe ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                        <button
                          onClick={() => handlePlaceBid(auctionCurrentBid + 10)}
                          className="btn-primary"
                          style={{
                            padding: '10px',
                            fontWeight: 'bold',
                            fontSize: '13px',
                            background: 'linear-gradient(135deg, var(--accent-gold) 0%, #e89b00 100%)',
                            boxShadow: '0 4px 15px rgba(255,183,3,0.3)'
                          }}
                        >
                          Bid ${auctionCurrentBid + 10}
                        </button>
                        <button
                          onClick={handleFoldAuction}
                          className="btn-secondary"
                          style={{ padding: '8px', fontSize: '12px' }}
                        >
                          Fold / Pass
                        </button>
                      </div>
                    ) : (
                      <div style={{ marginTop: '16px', color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
                        Waiting for bids...
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Active Trade Receiver/Proposer Overlay */}
            {gameState.gameSpecificState.activeTrade && (() => {
              const activeTrade = gameState.gameSpecificState.activeTrade;
              const proposerName = room?.players?.find(p => p.id === activeTrade.proposerId)?.name || 'Unknown';
              const receiverName = room?.players?.find(p => p.id === activeTrade.receiverId)?.name || 'Unknown';
              
              const isProposerMe = activeTrade.proposerId === playerId;
              const isReceiverMe = activeTrade.receiverId === playerId;

              if (!isProposerMe && !isReceiverMe) {
                // W-1: Third-party players see a non-blocking info banner
                return (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(123,44,191,0.18)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(123,44,191,0.4)',
                    borderRadius: '20px',
                    padding: '6px 16px',
                    fontSize: '11.5px',
                    color: 'rgba(255,255,255,0.85)',
                    zIndex: 901,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.3)'
                  }}>
                    🤝 <strong>{proposerName}</strong> is negotiating a trade with <strong>{receiverName}</strong>…
                  </div>
                );
              }

              const getPropertyNamesList = (propIndices: number[]) => {
                if (!propIndices || propIndices.length === 0) return 'No properties';
                return propIndices.map(idx => MONOPOLY_BOARD[idx]?.name).join(', ');
              };

              const handleAcceptTrade = () => {
                socket?.emit('game_action', { type: 'ACCEPT_TRADE', payload: {} });
              };

              const handleRejectTrade = () => {
                socket?.emit('game_action', { type: 'REJECT_TRADE', payload: {} });
              };

              return (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(6,2,10,0.92)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  zIndex: 900
                }}>
                  <div className="glass-panel" style={{
                    width: '340px',
                    padding: '22px',
                    borderRadius: '12px',
                    border: '1.5px solid var(--accent-purple)',
                    background: 'rgba(123,44,191,0.05)',
                    textAlign: 'center',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      🤝 Monopoly Trade Deal
                    </span>
                    
                    <div style={{ margin: '14px 0', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>From: <strong>{proposerName}</strong></div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>To: <strong>{receiverName}</strong></div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', fontSize: '12.5px' }}>
                      {/* From receiver's POV: "You receive" = offer, "You give" = request */}
                      <div style={{ padding: '8px', background: 'rgba(56,176,0,0.05)', borderRadius: '6px', border: '1px solid rgba(56,176,0,0.1)' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--accent-green)' }}>
                          {isReceiverMe ? 'You Receive:' : 'Offering:'}
                        </span>
                        <div style={{ marginTop: '2px', color: '#fff' }}>Cash: ${activeTrade.offer.cash}</div>
                        <div style={{ color: 'var(--text-secondary)' }}>Properties: {getPropertyNamesList(activeTrade.offer.properties)}</div>
                      </div>

                      <div style={{ padding: '8px', background: 'rgba(217,4,41,0.05)', borderRadius: '6px', border: '1px solid rgba(217,4,41,0.1)' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--accent-pink)' }}>
                          {isReceiverMe ? 'You Give:' : 'Requesting:'}
                        </span>
                        <div style={{ marginTop: '2px', color: '#fff' }}>Cash: ${activeTrade.request.cash}</div>
                        <div style={{ color: 'var(--text-secondary)' }}>Properties: {getPropertyNamesList(activeTrade.request.properties)}</div>
                      </div>
                    </div>

                    {isReceiverMe ? (
                      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                        <button
                          onClick={handleAcceptTrade}
                          className="btn-primary"
                          style={{
                            flex: 1,
                            padding: '10px',
                            fontWeight: 'bold',
                            fontSize: '13px',
                            background: 'linear-gradient(135deg, var(--accent-green) 0%, #2b8c00 100%)',
                            boxShadow: '0 4px 15px rgba(56,176,0,0.3)'
                          }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={handleRejectTrade}
                          className="btn-secondary"
                          style={{ flex: 1, padding: '10px', fontSize: '13px' }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Waiting for other player to respond...
                        </span>
                        <button
                          onClick={handleRejectTrade}
                          className="btn-secondary"
                          style={{ padding: '6px', fontSize: '12px' }}
                        >
                          Cancel Offer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {inLobby ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                padding: '24px',
                boxSizing: 'border-box'
              }}>
                <div style={{ fontSize: '16px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '16px' }}>
                  Lobby Room
                </div>
                {/* Beautiful Lobby Branding */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '40px 0' }}>
                  <div style={{ fontSize: '84px', filter: 'drop-shadow(0 4px 15px rgba(255,183,3,0.25))', marginBottom: '16px' }}>
                    🏢
                  </div>
                  <div style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                    Waiting for players to join...
                  </div>
                </div>
                
                {room?.hostId === playerId ? (
                  <button 
                    onClick={handleStartGameWithSettings}
                    className="btn-primary"
                    style={{ padding: '16px 56px', fontSize: '18px', fontWeight: 700, borderRadius: '14px' }}
                  >
                    🚀 Start Game
                  </button>
                ) : (
                  <div className="glass-panel" style={{ padding: '16px 32px', borderRadius: '12px', color: 'var(--muted)', fontStyle: 'italic', fontSize: '15px', fontFamily: "'Manrope', sans-serif" }}>
                    ⏳ Waiting for host to start game…
                  </div>
                )}
                
                <div style={{ marginTop: '30px', fontSize: '13px', fontFamily: "'Space Mono', monospace", color: 'var(--muted)' }}>
                  Room Code: <strong style={{ color: 'var(--gold)', letterSpacing: '2px' }}>{room?.id}</strong>
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                padding: '30px',
                boxSizing: 'border-box',
                position: 'relative'
              }}>
                <h1 style={{ fontSize: '52px', color: '#ffb703', textShadow: '0 0 15px rgba(255, 183, 3, 0.45)', margin: '0 0 4px 0', letterSpacing: '6px', fontWeight: 900 }}>
                  Mr. Worldwide
                </h1>
                <div style={{ color: 'var(--text-secondary)', fontSize: '15px', letterSpacing: '2px', marginBottom: '24px' }}>
                  MONOPOLY ARENA
                </div>

                {/* Always center-render the scaled up 3D Dice (size 120)! */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', margin: '16px 0' }}>
                  <Dice3D value={isRolling ? monopolyDiceValues[0] : (gameState?.gameSpecificState?.lastRoll?.[0] || 3)} isRolling={isRolling} size={120} onClick={isMyTurn && (subState === 'WAITING_FOR_ROLL' || subState === 'WAITING_FOR_JAIL_DECISION') ? handleRollDice : undefined} />
                  <Dice3D value={isRolling ? monopolyDiceValues[1] : (gameState?.gameSpecificState?.lastRoll?.[1] || 4)} isRolling={isRolling} size={120} onClick={isMyTurn && (subState === 'WAITING_FOR_ROLL' || subState === 'WAITING_FOR_JAIL_DECISION') ? handleRollDice : undefined} />
                </div>

                {/* Roll sum and status */}
                {gameState?.gameSpecificState?.lastRoll && (gameState.gameSpecificState.lastRoll[0] > 0) && (
                  <div style={{ fontSize: '20px', fontWeight: 'bold', margin: '8px 0 20px 0', color: '#fff' }}>
                    {gameState.gameSpecificState.lastRoll[0]} + {gameState.gameSpecificState.lastRoll[1]} = {gameState.gameSpecificState.lastRoll[0] + gameState.gameSpecificState.lastRoll[1]}
                    {gameState.gameSpecificState.lastRoll[0] === gameState.gameSpecificState.lastRoll[1] && (
                      <span style={{ color: 'var(--accent-gold)', marginLeft: '12px', fontSize: '15px' }}>(DOUBLES!)</span>
                    )}
                  </div>
                )}

                {/* Action buttons (Roll, Buy, End Turn, Pay Fine, Bankruptcy) */}
                {gameState && (
                  <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginTop: '12px' }}>
                    {isMyTurn ? (
                      <>
                        {(subState === 'WAITING_FOR_ROLL' || subState === 'WAITING_FOR_JAIL_DECISION') && (
                          <button 
                            onClick={handleRollDice} 
                            disabled={isRolling} 
                            className="btn-primary" 
                            style={{ padding: '12px 30px', fontSize: '14.5px' }}
                          >
                            {isRolling ? 'Rolling…' : '🎲 Roll the dice'}
                          </button>
                        )}

                        {subState === 'WAITING_FOR_JAIL_DECISION' && cashValue >= 50 && (
                          <button 
                            onClick={handlePayJailFine} 
                            className="btn-secondary" 
                            style={{ padding: '12px 24px', fontSize: '13.5px' }}
                          >
                            🔓 Pay Jail Fine ($50)
                          </button>
                        )}

                        {subState === 'WAITING_FOR_BUY_OR_PASS' && (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                              onClick={handleBuyProperty} 
                              className="btn-primary" 
                              style={{ padding: '12px 24px', fontSize: '13.5px', background: 'linear-gradient(135deg, var(--gold) 0%, #cc8800 100%)', boxShadow: '0 4px 15px var(--gold-glow)' }}
                            >
                              🏢 Buy Property
                            </button>
                            <button 
                              onClick={handleEndTurn} 
                              className="btn-secondary" 
                              style={{ padding: '12px 24px', fontSize: '13.5px' }}
                            >
                              Pass ➡️
                            </button>
                          </div>
                        )}

                        {(subState === 'WAITING_FOR_TURN_END') && (
                          <button 
                            onClick={handleEndTurn} 
                            className="btn-primary" 
                            style={{ padding: '12px 30px', fontSize: '14.5px', background: 'linear-gradient(135deg, var(--accent-green) 0%, #2b8c00 100%)', boxShadow: '0 4px 15px rgba(56,176,0,0.3)' }}
                          >
                            End turn ➡️
                          </button>
                        )}

                        {subState === 'DEBT_OR_BANKRUPT' && (
                          <button 
                            onClick={handleDeclareBankruptcy} 
                            className="btn-danger" 
                            style={{ padding: '12px 24px' }}
                          >
                            💀 Declare Bankruptcy
                          </button>
                        )}
                      </>
                    ) : (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '15px', fontStyle: 'italic' }}>
                        ⏳ Waiting for <strong>{activePlayerName}</strong>...
                      </div>
                    )}
                  </div>
                )}

                {/* Rolling Event Logs inside the center panel! */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '32px',
                  textAlign: 'center',
                  maxHeight: '160px',
                  overflow: 'hidden',
                  width: '100%',
                  padding: '0 15px',
                  boxSizing: 'border-box'
                }}>
                  {gameLog.slice(-4).map((log, lIdx, arr) => {
                    const isLatest = lIdx === arr.length - 1;
                    return (
                      <div 
                        key={lIdx} 
                        style={{
                          fontSize: isLatest ? '15.5px' : '13.5px',
                          color: isLatest ? '#fff' : 'rgba(255, 255, 255, 0.45)',
                          fontWeight: isLatest ? 'bold' : 'normal',
                          textShadow: isLatest ? '0 1px 6px rgba(255,255,255,0.1)' : 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '100%'
                        }}
                      >
                        {log}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 40 Spaces */}
          {MONOPOLY_BOARD.map((space, idx) => {
            const coords = getMonopolySpaceGridCoords(idx);
            const prop = properties[idx];
            const ownerIdx = prop && prop.ownerId ? room.players.findIndex(p => p.id === prop.ownerId) : -1;
            const isOwned = ownerIdx !== -1;
            const isMortgaged = prop && prop.mortgaged;
            
            const getSpaceSide = (i: number) => {
              if (i >= 0 && i <= 12) return 'top';
              if (i >= 13 && i <= 24) return 'right';
              if (i >= 25 && i <= 36) return 'bottom';
              return 'left';
            };
            const side = getSpaceSide(idx);
            const isCorner = idx === 0 || idx === 12 || idx === 24 || idx === 36;

            const isActivePos = gameState ? (idx === gameState.gameSpecificState.positions[gameState.activePlayerId]) : false;

            const getSolidColor = (c: string, fb: string) => {
              if (!c) return fb;
              if (c.startsWith('linear-gradient')) {
                const match = c.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/);
                return match ? match[0] : fb;
              }
              return c;
            };

            const avatarColors = [
              'linear-gradient(135deg, #d90429 0%, #ff4d6d 100%)',
              'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
              'linear-gradient(135deg, #38b000 0%, #70e000 100%)',
              'linear-gradient(135deg, #ffb703 0%, #ffea00 100%)'
            ];

            const ownerPlayer = isOwned ? room?.players?.[ownerIdx] : null;
            const rawOwnerColor = isOwned ? (ownerPlayer?.color || avatarColors[ownerIdx % avatarColors.length]) : '';
            const ownerSolidColor = getSolidColor(rawOwnerColor, '#130c24');

            let backgroundStyle = isCorner ? '#0d061f' : '#130c24';
            if (isOwned && !isCorner) {
              backgroundStyle = `linear-gradient(rgba(19, 12, 36, 0.93), rgba(19, 12, 36, 0.93)), ${ownerSolidColor}`;
            }

            const renderHeaderBand = () => {
              if (!space.group) return null;
              const colorCode = colorGroupMap[space.group || ''] || 'var(--accent-purple)';
              return (
                <div 
                  style={{
                    backgroundColor: colorCode,
                    width: '100%',
                    height: '8px',
                    borderRadius: '1px',
                    flexShrink: 0
                  }}
                />
              );
            };

            const renderPriceOrOwnerBadge = () => {
              if (space.price === undefined) return null;
              if (isOwned && ownerPlayer) {
                return (
                  <div style={{
                    fontSize: '8.5px',
                    color: '#fff',
                    fontWeight: '900',
                    backgroundColor: ownerSolidColor,
                    padding: '2px 6px',
                    borderRadius: '3px',
                    boxShadow: `0 0 6px ${ownerSolidColor}80`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    lineHeight: '1',
                    flexShrink: 0
                  }}>
                    {ownerPlayer?.name.substring(0, 4)}
                  </div>
                );
              }
              return (
                <div style={{
                  fontSize: '9px',
                  color: 'rgba(255,255,255,0.75)',
                  fontWeight: 'bold',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  lineHeight: '1',
                  flexShrink: 0
                }}>
                  {space.price}$
                </div>
              );
            };

            let ownershipClass = '';
            let customProperties: React.CSSProperties = {};
            if (isOwned && prop) {
              const isGlowHover = hoveredPlayerId === prop.ownerId;
              if (isGlowHover) {
                ownershipClass = 'glow-owned-player';
              } else if (prop.ownerId === playerId) {
                ownershipClass = 'owned-by-me';
              } else {
                ownershipClass = 'owned-by-other';
              }
              customProperties = {
                '--owner-color': ownerSolidColor,
                '--owner-color-shadow': `${ownerSolidColor}35`
              } as React.CSSProperties;
            }

            // Custom Corner overrides to match richup.io style
            if (idx === 0) {
              return (
                <div 
                  key={idx}
                  className="monopoly-space group-special corner-space"
                  style={{
                    gridRow: coords.row,
                    gridColumn: coords.col,
                    border: isActivePos ? '3px solid var(--accent-green)' : undefined,
                    boxShadow: isActivePos ? '0 0 15px var(--accent-green)' : undefined,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    background: 'linear-gradient(135deg, #1e3514 0%, #11200a 100%)',
                    borderBottom: '4px solid #38b000',
                    borderRadius: '4px',
                    position: 'relative'
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 900, color: '#38b000', letterSpacing: '1px' }}>START</span>
                  <div style={{ fontSize: '28px', marginTop: '4px', filter: 'drop-shadow(0 2px 5px rgba(56,176,0,0.5))' }}>
                    ➡️
                  </div>
                </div>
              );
            }

            if (idx === 12) {
              return (
                <div 
                  key={idx}
                  className={`monopoly-space group-special corner-space ${ownershipClass}`}
                  style={{
                    gridRow: coords.row,
                    gridColumn: coords.col,
                    border: isActivePos ? '3px solid var(--accent-green)' : undefined,
                    boxShadow: isActivePos ? '0 0 15px var(--accent-green), inset 0 0 8px rgba(56, 176, 0, 0.1)' : undefined,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 0,
                    boxSizing: 'border-box',
                    background: '#130c24',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '2px 4px',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    color: '#fff',
                    textAlign: 'center',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    Passing by
                  </div>
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    width: '100%',
                    height: '100%'
                  }}>
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}>
                      🔒
                    </div>
                    <div style={{
                      width: '32px',
                      background: '#1c1430',
                      borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-around',
                      padding: '2px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '6px', width: '2px', background: 'rgba(255, 255, 255, 0.4)' }} />
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '14px', width: '2px', background: 'rgba(255, 255, 255, 0.4)' }} />
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '22px', width: '2px', background: 'rgba(255, 255, 255, 0.4)' }} />
                      <div style={{
                        fontSize: '7px',
                        color: 'var(--accent-pink)',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        writingMode: 'vertical-rl',
                        zIndex: 2,
                        textShadow: '0 1px 3px rgba(0,0,0,0.8)'
                      }}>
                        In Prison
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            if (idx === 24) {
              return (
                <div 
                  key={idx}
                  className="monopoly-space group-special corner-space"
                  style={{
                    gridRow: coords.row,
                    gridColumn: coords.col,
                    border: isActivePos ? '3px solid var(--accent-green)' : undefined,
                    boxShadow: isActivePos ? '0 0 15px var(--accent-green)' : undefined,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    background: 'linear-gradient(135deg, #3a2e12 0%, #201a0a 100%)',
                    borderBottom: '4px solid var(--accent-gold)',
                    borderRadius: '4px',
                    position: 'relative'
                  }}
                >
                  <span style={{ fontSize: '24px', filter: 'drop-shadow(0 2px 5px rgba(255,183,3,0.4))' }}>🌴</span>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--accent-gold)', marginTop: '4px', textTransform: 'uppercase' }}>Vacation</span>
                </div>
              );
            }

            if (idx === 36) {
              return (
                <div 
                  key={idx}
                  className="monopoly-space group-special corner-space"
                  style={{
                    gridRow: coords.row,
                    gridColumn: coords.col,
                    border: isActivePos ? '3px solid var(--accent-green)' : undefined,
                    boxShadow: isActivePos ? '0 0 15px var(--accent-green)' : undefined,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    background: 'linear-gradient(135deg, #3d101a 0%, #20080d 100%)',
                    borderBottom: '4px solid var(--accent-pink)',
                    borderRadius: '4px',
                    position: 'relative'
                  }}
                >
                  <span style={{ fontSize: '24px', filter: 'drop-shadow(0 2px 5px rgba(217,4,41,0.4))' }}>💀</span>
                  <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--accent-pink)', marginTop: '4px', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.1 }}>Go to<br/>prison</span>
                </div>
              );
            }

            const isLeftOrRight = side === 'left' || side === 'right';
            const rotationAngle = side === 'left' ? -90 : side === 'right' ? 90 : 0;

            return (
              <div 
                key={idx}
                className={`monopoly-space ${space.group ? `group-${space.group}` : 'group-special'} ${isCorner ? 'corner-space' : ''} ${ownershipClass}`}
                style={{
                  gridRow: coords.row,
                  gridColumn: coords.col,
                  border: isActivePos ? '3px solid var(--accent-green)' : undefined,
                  boxShadow: isActivePos ? '0 0 15px var(--accent-green), inset 0 0 8px rgba(56, 176, 0, 0.1)' : undefined,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 0,
                  boxSizing: 'border-box',
                  background: backgroundStyle,
                  borderRadius: isCorner ? '4px' : '2px',
                  position: 'relative',
                  cursor: (space.type === 'property' || space.type === 'railroad' || space.type === 'utility') ? 'pointer' : 'default',
                  overflow: 'hidden',
                  ...customProperties
                }}
                onClick={() => {
                  if (space.type === 'property' || space.type === 'railroad' || space.type === 'utility') {
                    setSelectedSpaceIndex(idx);
                  }
                }}
              >
                {/* Unified Space Wrapper: handles rotation cleanly for left/right columns */}
                <div style={{
                  width: isLeftOrRight ? '74px' : '100%',
                  height: isLeftOrRight ? '92.6px' : '100%',
                  transform: isLeftOrRight ? `rotate(${rotationAngle}deg)` : undefined,
                  transformOrigin: 'center center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 6px',
                  boxSizing: 'border-box',
                  position: isLeftOrRight ? 'absolute' : 'relative',
                  top: isLeftOrRight ? 'calc(50% - 46.3px)' : undefined,
                  left: isLeftOrRight ? 'calc(50% - 37px)' : undefined,
                }}>
                  {side === 'bottom' ? (
                    <>
                      {renderHeaderBand()}
                      
                      {/* Content Name and Flag */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flex: 1, justifyContent: 'center', width: '100%' }}>
                        <div style={{ 
                          fontWeight: 'bold', 
                          fontSize: '9px', 
                          lineHeight: '1.2',
                          color: '#fff', 
                          width: '100%',
                          wordBreak: 'break-word',
                          textAlign: 'center'
                        }}>
                          {space.name}
                        </div>
                        {space.flag ? (
                          <div style={{
                            width: '24px',
                            height: '16px',
                            borderRadius: '2px',
                            overflow: 'hidden',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            flexShrink: 0,
                          }}>
                            <img 
                              src={space.flag} 
                              alt={`${space.name} flag`} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                          </div>
                        ) : getMonopolySpaceIcon(space.type, space.name) ? (
                          <div style={{ fontSize: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {getMonopolySpaceIcon(space.type, space.name)}
                          </div>
                        ) : null}
                      </div>

                      {renderPriceOrOwnerBadge()}
                    </>
                  ) : (
                    <>
                      {renderPriceOrOwnerBadge()}
                      
                      {/* Content Name and Flag */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flex: 1, justifyContent: 'center', width: '100%' }}>
                        <div style={{ 
                          fontWeight: 'bold', 
                          fontSize: '9px', 
                          lineHeight: '1.2',
                          color: '#fff', 
                          width: '100%',
                          wordBreak: 'break-word',
                          textAlign: 'center'
                        }}>
                          {space.name}
                        </div>
                        {space.flag ? (
                          <div style={{
                            width: '24px',
                            height: '16px',
                            borderRadius: '2px',
                            overflow: 'hidden',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            flexShrink: 0,
                          }}>
                            <img 
                              src={space.flag} 
                              alt={`${space.name} flag`} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                          </div>
                        ) : getMonopolySpaceIcon(space.type, space.name) ? (
                          <div style={{ fontSize: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {getMonopolySpaceIcon(space.type, space.name)}
                          </div>
                        ) : null}
                      </div>

                      {renderHeaderBand()}
                    </>
                  )}
                </div>

                {/* Houses / Hotels */}
                {prop && prop.houses > 0 && !isMortgaged && (
                  <div 
                    className="houses-container"
                    style={{
                      display: 'flex',
                      gap: '2px',
                      position: 'absolute',
                      bottom: '6px',
                      left: '6px',
                      zIndex: 10
                    }}
                  >
                    {prop.houses === 5 ? (
                      <span title="1 Hotel" style={{ fontSize: '11px', textShadow: '0 0 3px var(--accent-pink)' }}>🏨</span>
                    ) : (
                      Array.from({ length: prop.houses }).map((_, hIdx) => (
                        <span key={hIdx} title={`${prop.houses} Houses`} style={{ fontSize: '9px', textShadow: '0 0 3px var(--accent-green)' }}>🏠</span>
                      ))
                    )}
                  </div>
                )}

                {isMortgaged && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(217, 4, 41, 0.25)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    fontWeight: 'bold', fontSize: '10px', color: '#fff', textShadow: '1px 1px 2px #000',
                    zIndex: 20
                  }}>
                    MORTGAGED
                  </div>
                )}
              </div>
            );
          })}

          {/* Tokens */}
          {Object.entries(positions).map(([pId, pos]: [string, any], idx) => {
            const isPlayerBankrupt = bankrupt[pId];
            if (isPlayerBankrupt) return null;

            const coords = getMonopolyCoords(pos);
            const key = `${coords.x.toFixed(1)},${coords.y.toFixed(1)}`;
            const shared = monopolySharedCoords[key] || [];
            const count = shared.length;
            const indexInCell = shared.findIndex(t => t.pId === pId);
            
            let ox = 0, oy = 0;
            if (count > 1) {
              const angle = (indexInCell / count) * 2 * Math.PI;
              const radius = 14;
              ox = Math.cos(angle) * radius;
              oy = Math.sin(angle) * radius;
            }

            const playerObj = room?.players?.find(p => p.id === pId);
            const customColor = playerObj?.color;
            const isHovered = hoveredPlayerId === pId;

            const tokenProperties = isHovered ? {
              '--token-color': customColor || 'var(--accent-purple)'
            } as React.CSSProperties : {};

            return (
              <div 
                key={pId}
                className={`monopoly-token ${customColor ? '' : `color-${idx}`} ${isHovered ? 'pulsing-token' : ''}`}
                style={{
                  left: `${coords.x + ox}px`,
                  top: `${coords.y + oy}px`,
                  zIndex: isHovered ? 500 : (300 + idx),
                  backgroundColor: customColor || undefined,
                  boxShadow: !isHovered && customColor ? `0 0 10px ${customColor}` : undefined,
                  ...tokenProperties
                }}
                title={playerObj?.name}
              />
            );
          })}
        </div>
      );
    };

    const renderMonopolySidebar = () => {
      const cash = gameState.gameSpecificState.cash || {};
      const properties = gameState.gameSpecificState.properties || {};
      const inJail = gameState.gameSpecificState.inJail || {};
      const bankrupt = gameState.gameSpecificState.bankrupt || {};

      const myOwnedProperties = Object.entries(properties)
        .map(([idx, prop]: [string, any]) => ({ index: parseInt(idx, 10), prop }))
        .filter(item => item.prop.ownerId === playerId);

      const avatarColors = [
        'linear-gradient(135deg, #d90429 0%, #ff4d6d 100%)',
        'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
        'linear-gradient(135deg, #38b000 0%, #70e000 100%)',
        'linear-gradient(135deg, #ffb703 0%, #ffea00 100%)'
      ];

      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Players & Cash */}
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(123,44,191,0.1)' }}>
            <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-secondary)' }}>Players & Balances</h3>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '180px' }}>
            {room?.players?.map((p, idx) => {
              const playerCash = cash[p.id] !== undefined ? cash[p.id] : 1500;
              const playerInJail = inJail[p.id];
              const playerBankrupt = bankrupt[p.id];
              const avatarBg = p.color || avatarColors[idx % avatarColors.length];
              const isActive = p.id === gameState.activePlayerId;

              return (
                <div 
                  key={p.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '10px 14px', 
                    background: isActive ? 'rgba(56, 176, 0, 0.05)' : 'rgba(255,255,255,0.02)', 
                    borderRadius: '8px',
                    border: `1.5px solid ${isActive ? 'rgba(56, 176, 0, 0.4)' : 'transparent'}`,
                    boxShadow: isActive ? '0 0 10px rgba(56, 176, 0, 0.1)' : 'none',
                    transition: 'all 0.25s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={() => setHoveredPlayerId(p.id)}
                  onMouseLeave={() => setHoveredPlayerId(null)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: avatarBg,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      color: idx === 3 ? '#000' : '#fff',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                      textTransform: 'uppercase',
                      flexShrink: 0
                    }}>
                      {p.name.charAt(0)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ 
                        textDecoration: playerBankrupt ? 'line-through' : 'none', 
                        fontWeight: '600',
                        fontSize: '13.5px',
                        color: isActive ? 'var(--accent-green)' : '#fff'
                      }}>
                        {p.name} {p.id === playerId && ' (You)'}
                      </span>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '2px' }}>
                        {p.id === room?.hostId && (
                          <span style={{
                            fontSize: '9px',
                            backgroundColor: 'rgba(255, 183, 3, 0.15)',
                            color: 'var(--accent-gold)',
                            border: '1px solid rgba(255, 183, 3, 0.3)',
                            borderRadius: '4px',
                            padding: '0 4px',
                            fontWeight: 'bold',
                            letterSpacing: '0.5px'
                          }}>
                            Host 👑
                          </span>
                        )}
                        {playerInJail && (
                          <span style={{
                            fontSize: '9px',
                            backgroundColor: 'rgba(255, 183, 3, 0.15)',
                            color: 'var(--accent-gold)',
                            borderRadius: '4px',
                            padding: '0 4px',
                            fontWeight: 'bold'
                          }}>
                            In Jail 🔒
                          </span>
                        )}
                        {playerBankrupt && (
                          <span style={{
                            fontSize: '9px',
                            backgroundColor: 'rgba(217, 4, 41, 0.15)',
                            color: 'var(--accent-pink)',
                            borderRadius: '4px',
                            padding: '0 4px',
                            fontWeight: 'bold'
                          }}>
                            Bankrupt 💀
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {p.id !== playerId && !playerBankrupt && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTradeOfferCash(0);
                            setTradeOfferProperties([]);
                            setTradeRequestCash(0);
                            setTradeRequestProperties([]);
                            setTradeModalTargetId(p.id);
                          }}
                          style={{
                            background: 'rgba(123,44,191,0.1)',
                            border: '1px solid rgba(123,44,191,0.3)',
                            color: 'var(--accent-purple)',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          🤝 Trade
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            socket?.emit('initiate_vote_kick', { targetPlayerId: p.id });
                          }}
                          style={{
                            background: 'rgba(217,4,41,0.1)',
                            border: '1px solid rgba(217,4,41,0.3)',
                            color: 'var(--accent-pink)',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          🚫 Kick
                        </button>
                      </div>
                    )}
                    <span style={{
                      fontWeight: 'bold',
                      fontSize: '13px',
                      color: playerCash < 0 ? 'var(--accent-pink)' : 'var(--accent-green)',
                      background: playerCash < 0 ? 'rgba(217, 4, 41, 0.1)' : 'rgba(56, 176, 0, 0.1)',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      border: `1px solid ${playerCash < 0 ? 'rgba(217, 4, 41, 0.2)' : 'rgba(56, 176, 0, 0.2)'}`
                    }}>
                      ${playerCash}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Properties Manager */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(123,44,191,0.1)', borderBottom: '1px solid rgba(123,44,191,0.1)' }}>
            <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-secondary)' }}>My Properties ({myOwnedProperties.length})</h3>
          </div>
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {myOwnedProperties.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                You don't own any properties yet. Land on properties to buy them!
              </div>
            ) : (
              myOwnedProperties.map(({ index, prop }) => {
                const space = MONOPOLY_BOARD[index];
                const isStreet = space.type === 'property';
                const colorCode = colorGroupMap[space.group || ''] || 'var(--accent-purple)';
                return (
                  <div 
                    key={index} 
                    className="glass-panel" 
                    style={{ 
                      padding: '12px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '8px', 
                      borderTop: `5px solid ${colorCode}`,
                      borderRadius: '8px',
                      background: 'rgba(19, 12, 36, 0.5)',
                      transition: 'transform 0.2s ease, background 0.2s ease',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.background = 'rgba(19, 12, 36, 0.75)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.background = 'rgba(19, 12, 36, 0.5)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <strong style={{ fontSize: '13.5px', color: '#fff' }}>{space.name}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {space.group ? `${space.group.toUpperCase()} Street` : space.type.toUpperCase()}
                        </div>
                      </div>
                      {prop.mortgaged && (
                        <span style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                          MORTGAGED
                        </span>
                      )}
                    </div>

                    {isStreet && !prop.mortgaged && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Houses: {prop.houses === 5 ? '1 Hotel 🏨' : `${prop.houses} 🏠`} (Build: ${space.houseCost})
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {gameState.gameSpecificState?.config?.mortgage !== false && prop.mortgaged && (
                        <button 
                          onClick={() => handleUnmortgageProperty(index)}
                          className="btn-primary"
                          style={{ padding: '4px 10px', fontSize: '11px', boxShadow: 'none', height: '28px', display: 'flex', alignItems: 'center' }}
                        >
                          Unmortgage (${Math.round((space.price || 0) * 0.5 * 1.1)})
                        </button>
                      )}
                      
                      {(!prop.mortgaged || gameState.gameSpecificState?.config?.mortgage === false) && (
                        <>
                          {gameState.gameSpecificState?.config?.mortgage !== false && (
                            <button 
                              onClick={() => handleMortgageProperty(index)}
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '11px', height: '28px', display: 'flex', alignItems: 'center' }}
                              disabled={prop.houses > 0}
                            >
                              Mortgage (${Math.round((space.price || 0) * 0.5)})
                            </button>
                          )}
                          {isStreet && prop.houses < 5 && (
                            <button 
                              onClick={() => handleBuildHouseProperty(index)}
                              className="btn-primary"
                              style={{ padding: '4px 10px', fontSize: '11px', boxShadow: 'none', height: '28px', display: 'flex', alignItems: 'center' }}
                            >
                              Build House (${space.houseCost})
                            </button>
                          )}
                          {isStreet && prop.houses > 0 && (
                            <button 
                              onClick={() => handleSellHouseProperty(index)}
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '11px', height: '28px', display: 'flex', alignItems: 'center' }}
                            >
                              Sell House (${Math.round((space.houseCost || 0) / 2)})
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      );
    };

    // --- Main Game Renderer Routing ---
    const renderGameBoard = () => {
      switch (room.gameType) {
        case 'SNAKES_LADDERS':
          return renderSnakesLaddersBoard();
        case 'LUDO':
          return renderLudoBoard();
        case 'UNO':
          return renderUnoBoard();
        case 'MONOPOLY':
          return renderMonopolyBoard();
        default:
          return <div>Unknown game type</div>;
      }
    };

    // --- Action Bar Renderer ---
    const renderActionBar = () => {
      if (isSpectator) {
        return (
          <div style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: '700', padding: '10px 0' }}>
            👓 You are spectating this match.
          </div>
        );
      }

      if (room.gameType === 'SNAKES_LADDERS') {
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Dice3D value={currentDiceValue} isRolling={isRolling} onClick={isMyTurn ? handleRollDice : undefined} />

            <div>
              {isMyTurn ? (
                <button onClick={handleRollDice} disabled={isRolling} className="btn-primary" style={{ padding: '16px 36px', fontSize: '18px' }}>
                  {isRolling ? 'Rolling...' : 'Roll Dice 🎲'}
                </button>
              ) : (
                <div style={{ color: 'var(--text-secondary)' }}>Waiting for active player to roll...</div>
              )}
            </div>
          </div>
        );
      }

      if (room.gameType === 'LUDO') {
        if (gameState.subState === 'WAITING_FOR_TOKEN_MOVE') {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <Dice3D value={currentDiceValue} isRolling={false} />
              <div style={{ padding: '12px 24px', borderRadius: '12px', background: 'rgba(123,44,191,0.1)', border: '1.5px solid var(--accent-purple)', textAlign: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
                  {isMyTurn ? `🎲 You rolled a ${currentDiceValue}! SELECT ONE OF YOUR TOKENS ON THE BOARD TO MOVE IT` : `Waiting for ${activePlayer?.name} to select a token (rolled ${currentDiceValue})...`}
                </span>
              </div>
            </div>
          );
        }

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Dice3D value={currentDiceValue} isRolling={isRolling} onClick={isMyTurn ? handleRollDice : undefined} />

            <div>
              {isMyTurn ? (
                <button onClick={handleRollDice} disabled={isRolling} className="btn-primary" style={{ padding: '16px 36px', fontSize: '18px' }}>
                  {isRolling ? 'Rolling...' : 'Roll Dice 🎲'}
                </button>
              ) : (
                <div style={{ color: 'var(--text-secondary)' }}>Waiting for active player to roll...</div>
              )}
            </div>
          </div>
        );
      }

      if (room.gameType === 'UNO') {
        const hand = gameState.gameSpecificState.hands[playerId] as UnoCard[] || [];
        const hasUnoEligible = hand.length <= 2;
        const isPlayOrPass = gameState.subState === 'PLAY_OR_PASS';
        const hasDrawnCard = hand.length > 0;
        const isDrawnCardPlayable = hasDrawnCard && isCardPlayable(hand[hand.length - 1], gameState.gameSpecificState.currentCard, gameState.gameSpecificState.currentColor);

        return (
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {isMyTurn ? (
              <>
                {isPlayOrPass ? (
                  <>
                    {isDrawnCardPlayable && (
                      <button 
                        onClick={() => handlePlayCard(hand.length - 1)} 
                        className="btn-primary" 
                        style={{ padding: '12px 24px', background: 'linear-gradient(135deg, var(--accent-green) 0%, #2a8500 100%)', boxShadow: '0 0 15px rgba(56,176,0,0.4)' }}
                      >
                        Play Drawn Card 🃏
                      </button>
                    )}
                    <button 
                      onClick={() => socket?.emit('game_action', { type: 'DRAW_CARD', payload: {} })} 
                      className="btn-secondary" 
                      style={{ padding: '12px 24px' }}
                    >
                      Pass Turn ➡️
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => socket?.emit('game_action', { type: 'DRAW_CARD', payload: {} })} 
                    className="btn-primary" 
                    style={{ padding: '12px 24px' }}
                  >
                    Draw Card 🃏
                  </button>
                )}
              </>
            ) : (
              <span style={{ color: 'var(--text-secondary)', alignSelf: 'center' }}>Waiting for your turn...</span>
            )}

            {hasUnoEligible && (
              <button 
                onClick={() => socket?.emit('game_action', { type: 'DECLARE_UNO', payload: {} })} 
                className="btn-primary" 
                style={{ padding: '12px 24px', background: 'linear-gradient(135deg, var(--accent-pink) 0%, #b3001e 100%)', boxShadow: '0 0 15px rgba(217,4,41,0.4)' }}
              >
                Yell UNO! 📣
              </button>
            )}
          </div>
        );
      }

      if (room.gameType === 'MONOPOLY') {
        const cashValue = gameState.gameSpecificState.cash[playerId] || 0;
        const subState = gameState.subState;
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', alignItems: 'center' }}>
            {cashValue < 0 && subState === 'DEBT_OR_BANKRUPT' && (
              <div style={{ color: 'var(--accent-pink)', fontWeight: 'bold', fontSize: '14px', background: 'rgba(217, 4, 41, 0.1)', padding: '6px 16px', borderRadius: '20px', border: '1.5px solid var(--accent-pink)' }}>
                ⚠️ WARNING: You have negative cash (${cashValue})! Mortgage properties or sell houses to raise cash, or declare bankruptcy.
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
              {(subState === 'WAITING_FOR_ROLL' || subState === 'WAITING_FOR_JAIL_DECISION') && (
                <div style={{ display: 'flex', gap: '12px', marginRight: '12px' }}>
                  <Dice3D value={isRolling ? monopolyDiceValues[0] : (gameState.gameSpecificState.lastRoll?.[0] || 1)} isRolling={isRolling} onClick={isMyTurn ? handleRollDice : undefined} />
                  <Dice3D value={isRolling ? monopolyDiceValues[1] : (gameState.gameSpecificState.lastRoll?.[1] || 1)} isRolling={isRolling} onClick={isMyTurn ? handleRollDice : undefined} />
                </div>
              )}
              {isMyTurn && (
                <>
                  {(subState === 'WAITING_FOR_ROLL' || subState === 'WAITING_FOR_JAIL_DECISION') && (
                    <button onClick={handleRollDice} disabled={isRolling} className="btn-primary" style={{ padding: '12px 28px' }}>
                      {isRolling ? 'Rolling...' : 'Roll Dice 🎲'}
                    </button>
                  )}

                  {subState === 'WAITING_FOR_JAIL_DECISION' && cashValue >= 50 && (
                    <button onClick={handlePayJailFine} className="btn-secondary" style={{ padding: '12px 28px' }}>
                      Pay Jail Fine ($50) 🔓
                    </button>
                  )}

                  {subState === 'WAITING_FOR_BUY_OR_PASS' && (
                    <button onClick={handleBuyProperty} className="btn-primary" style={{ padding: '12px 28px', background: 'linear-gradient(135deg, var(--accent-gold) 0%, #e89b00 100%)', boxShadow: '0 0 15px rgba(255,183,3,0.4)' }}>
                      Buy Property 🏢
                    </button>
                  )}

                  {(subState === 'WAITING_FOR_TURN_END' || subState === 'WAITING_FOR_BUY_OR_PASS') && (
                    <button onClick={handleEndTurn} className="btn-secondary" style={{ padding: '12px 28px' }}>
                      {subState === 'WAITING_FOR_BUY_OR_PASS' ? 'Decline / Pass Turn ➡️' : 'End Turn ➡️'}
                    </button>
                  )}

                  {subState === 'DEBT_OR_BANKRUPT' && (
                    <button onClick={handleDeclareBankruptcy} className="btn-primary" style={{ padding: '12px 28px', background: 'linear-gradient(135deg, var(--accent-pink) 0%, #b3001e 100%)', boxShadow: '0 0 15px rgba(217,4,41,0.4)' }}>
                      Declare Bankruptcy 💀
                    </button>
                  )}
                </>
              )}
              {!isMyTurn && <span style={{ color: 'var(--text-secondary)' }}>Waiting for active player...</span>}
            </div>
          </div>
        );
      }

      return null;
    };

    // --- Left Sidebar: Share Link + Chat ---
    const renderLeftSidebar = () => {
      const shareUrl = `${window.location.origin}/join/${room.id}`;
      const myId = currentUser?.id;

      return (
        <div className={`left-sidebar ${isLeftSidebarOpen ? 'open' : ''}`}>
          {/* Share Section */}
          <div className="share-section">
            <h4>🔗 Share this game</h4>
            <div className="share-url-row">
              <input type="text" readOnly value={shareUrl} onClick={(e) => (e.target as HTMLInputElement).select()} />
              <button className={copiedLink ? 'copied' : ''} onClick={handleCopyLink}>
                {copiedLink ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>
          </div>

          {/* Chat Section */}
          <div className="chat-section">
            <div className="chat-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Chat
              {/* Close button for mobile overlay */}
              <button
                onClick={() => setIsLeftSidebarOpen(false)}
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'none',
                  padding: '4px',
                  lineHeight: 1
                }}
                className="sidebar-close-btn"
              >
                ✕
              </button>
            </div>

            <div className="chat-messages">
              {chatMessages.length === 0 ? (
                <div className="chat-empty">
                  <span>💬</span> No messages yet
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} className={`chat-bubble ${msg.playerId === myId ? 'self' : ''}`}>
                    <span className="chat-sender">{msg.playerId === myId ? 'You' : msg.senderName}</span>
                    <span className="chat-text">{msg.text}</span>
                  </div>
                ))
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            <div className="chat-input-row">
              <input
                type="text"
                placeholder="Say something..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat(); }}
              />
              <button onClick={handleSendChat} aria-label="Send message">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      );
    };

    const renderLobbySidebar = () => {
      const isHost = room?.hostId === playerId;
      
      const maxPlayers = getLobbySetting('maxPlayers', 4);
      const privateRoom = getLobbySetting('privateRoom', false);
      const allowBots = getLobbySetting('allowBots', false);
      
      const doubleRentRule = getLobbySetting('doubleRentRule', true);
      const vacationCash = getLobbySetting('vacationCash', false);
      const auction = getLobbySetting('auction', false);
      const prisonRent = getLobbySetting('prisonRent', false);
      const mortgage = getLobbySetting('mortgage', true);
      const evenBuild = getLobbySetting('evenBuild', true);
      const randomizeOrder = getLobbySetting('randomizeOrder', false);
      const startingCash = getLobbySetting('startingCash', 1500);

      const avatarColors = [
        'linear-gradient(135deg, #d90429 0%, #ff4d6d 100%)',
        'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
        'linear-gradient(135deg, #38b000 0%, #70e000 100%)',
        'linear-gradient(135deg, #ffb703 0%, #ffea00 100%)'
      ];

      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(123,44,191,0.1)' }}>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#fff' }}>Room Lobby settings ⚙️</h3>
          </div>

          {/* Player List in Lobby */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(123,44,191,0.1)', background: 'rgba(0,0,0,0.1)' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Players ({room?.players?.length || 0})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {room?.players?.map((p, idx) => {
                const avatarBg = p.color || avatarColors[idx % avatarColors.length];
                const isPlayerHost = p.id === room?.hostId;
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: avatarBg,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      color: '#fff',
                      textTransform: 'uppercase'
                    }}>
                      {p.name.charAt(0)}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#fff', flex: 1 }}>
                      {p.name} {p.id === playerId && ' (You)'}
                    </span>
                    {isPlayerHost && (
                      <span style={{ fontSize: '10px', backgroundColor: 'var(--accent-purple)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                        👑 Host
                      </span>
                    )}
                    {p.id !== playerId && (
                      <button
                        onClick={() => socket?.emit('initiate_vote_kick', { targetPlayerId: p.id })}
                        style={{
                          background: 'rgba(217,4,41,0.1)',
                          border: '1px solid rgba(217,4,41,0.3)',
                          color: 'var(--accent-pink)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          marginLeft: 'auto'
                        }}
                      >
                        🚫 Kick
                      </button>
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
                    onChange={(e) => updateLobbySetting('maxPlayers', parseInt(e.target.value, 10))}
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
                    onChange={(e) => updateLobbySetting('privateRoom', e.target.checked)}
                    style={{ cursor: isHost ? 'pointer' : 'default', width: '16px', height: '16px' }}
                  />
                </div>

                {/* Allow bots toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, marginRight: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Allow bots to join</span>
                      <span style={{ fontSize: '9px', backgroundColor: '#e63946', color: '#fff', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>BETA</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bots will join the game based on availability</div>
                  </div>
                  <input 
                    type="checkbox"
                    checked={allowBots}
                    disabled={!isHost}
                    onChange={(e) => updateLobbySetting('allowBots', e.target.checked)}
                    style={{ cursor: isHost ? 'pointer' : 'default', width: '16px', height: '16px' }}
                  />
                </div>
              </div>
            </div>

            {room?.gameType === 'MONOPOLY' && (
              <>
                <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }} />

                {/* Gameplay rules Section */}
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Gameplay rules</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    
                    {/* Rule: Starting cash */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Starting cash</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Adjust how much money players start with</div>
                      </div>
                      <select 
                        value={startingCash}
                        disabled={!isHost}
                        onChange={(e) => updateLobbySetting('startingCash', parseInt(e.target.value, 10))}
                        style={{ background: 'var(--bg-input)', color: '#fff', border: '1px solid rgba(123,44,191,0.3)', borderRadius: '6px', padding: '4px 8px', outline: 'none' }}
                      >
                        <option value={1000}>$1000</option>
                        <option value={1500}>$1500</option>
                        <option value={2000}>$2000</option>
                        <option value={2500}>$2500</option>
                      </select>
                    </div>

                    {/* Rule: x2 rent */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, marginRight: '12px' }}>
                        <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>x2 rent on full-set properties</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>If a player owns a full property set, the base rent payment will be doubled</div>
                      </div>
                      <input 
                        type="checkbox"
                        checked={doubleRentRule}
                        disabled={!isHost}
                        onChange={(e) => updateLobbySetting('doubleRentRule', e.target.checked)}
                        style={{ cursor: isHost ? 'pointer' : 'default', width: '16px', height: '16px' }}
                      />
                    </div>

                    {/* Rule: Vacation cash */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, marginRight: '12px' }}>
                        <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Vacation cash</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Landing on Vacation awards all tax/bank payments pool money</div>
                      </div>
                      <input 
                        type="checkbox"
                        checked={vacationCash}
                        disabled={!isHost}
                        onChange={(e) => updateLobbySetting('vacationCash', e.target.checked)}
                        style={{ cursor: isHost ? 'pointer' : 'default', width: '16px', height: '16px' }}
                      />
                    </div>

                    {/* Rule: Auction */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, marginRight: '12px' }}>
                        <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Auction</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>If someone skips purchasing the landed property, it goes to highest bidder</div>
                      </div>
                      <input 
                        type="checkbox"
                        checked={auction}
                        disabled={!isHost}
                        onChange={(e) => updateLobbySetting('auction', e.target.checked)}
                        style={{ cursor: isHost ? 'pointer' : 'default', width: '16px', height: '16px' }}
                      />
                    </div>

                    {/* Rule: prisonRent */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, marginRight: '12px' }}>
                        <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Don't collect rent in prison</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rent will not be collected when landing on properties of players in prison</div>
                      </div>
                      <input 
                        type="checkbox"
                        checked={prisonRent}
                        disabled={!isHost}
                        onChange={(e) => updateLobbySetting('prisonRent', e.target.checked)}
                        style={{ cursor: isHost ? 'pointer' : 'default', width: '16px', height: '16px' }}
                      />
                    </div>

                    {/* Rule: mortgage */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, marginRight: '12px' }}>
                        <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Mortgage</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mortgage properties for 50% cash, but mortgaged property won't earn rent</div>
                      </div>
                      <input 
                        type="checkbox"
                        checked={mortgage}
                        disabled={!isHost}
                        onChange={(e) => updateLobbySetting('mortgage', e.target.checked)}
                        style={{ cursor: isHost ? 'pointer' : 'default', width: '16px', height: '16px' }}
                      />
                    </div>

                    {/* Rule: evenBuild */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, marginRight: '12px' }}>
                        <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Even build</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Houses/hotels must be built up and sold off evenly within set</div>
                      </div>
                      <input 
                        type="checkbox"
                        checked={evenBuild}
                        disabled={!isHost}
                        onChange={(e) => updateLobbySetting('evenBuild', e.target.checked)}
                        style={{ cursor: isHost ? 'pointer' : 'default', width: '16px', height: '16px' }}
                      />
                    </div>

                    {/* Rule: randomizeOrder */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, marginRight: '12px' }}>
                        <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Randomize player order</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Randomly reorder players at the beginning of the match</div>
                      </div>
                      <input 
                        type="checkbox"
                        checked={randomizeOrder}
                        disabled={!isHost}
                        onChange={(e) => updateLobbySetting('randomizeOrder', e.target.checked)}
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

                {/* Gameplay rules Section */}
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Gameplay rules</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    
                    {/* Rule: Card Stacking */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, marginRight: '12px' }}>
                        <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Card Stacking</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Allows stacking +2 on +2 and +4 on +2/+4 to pass penalty to next player</div>
                      </div>
                      <input 
                        type="checkbox"
                        checked={getLobbySetting('cardStacking', true)}
                        disabled={!isHost}
                        onChange={(e) => updateLobbySetting('cardStacking', e.target.checked)}
                        style={{ cursor: isHost ? 'pointer' : 'default', width: '16px', height: '16px' }}
                      />
                    </div>

                    {/* Rule: Card Doubles */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, marginRight: '12px' }}>
                        <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Card Doubles</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Play two cards of the same value together if they match value or color</div>
                      </div>
                      <input 
                        type="checkbox"
                        checked={getLobbySetting('cardDoubles', true)}
                        disabled={!isHost}
                        onChange={(e) => updateLobbySetting('cardDoubles', e.target.checked)}
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
              <button 
                onClick={handleStartGameWithSettings}
                className="btn-primary" 
                style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: 'bold' }}
              >
                Start Game 🚀
              </button>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic', padding: '6px' }}>
                ⌛ Waiting for host to start match...
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100dvh', overflow: 'hidden', position: 'relative' }}>
        
        {/* Responsive Left Sidebar Overlay */}
        <div 
          className={`left-sidebar-overlay ${isLeftSidebarOpen ? 'active' : ''}`} 
          onClick={() => setIsLeftSidebarOpen(false)} 
        />

        {/* Left Sidebar (Share Link + Chat) */}
        {renderLeftSidebar()}

        {/* Floating Chat Toggle Button (Visible on screens < 1100px) */}
        <button 
          className="chat-toggle-btn" 
          onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
          aria-label="Toggle chat"
        >
          {isLeftSidebarOpen ? '✕' : '💬'}
        </button>

        {/* Game Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', minWidth: 0 }}>
          
          {/* ── Top HUD ── */}
          <div className="hud-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span className="hud-brand">
                <span className="turn">turn</span>
                <span className="up">Up</span>
              </span>
              <span className="hud-game-badge">
                {room?.gameType === 'SNAKES_LADDERS' ? '🐍 Snakes' : room?.gameType === 'LUDO' ? '🎲 Ludo' : room?.gameType === 'UNO' ? '🃏 Uno' : '🏢 Monopoly'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {!inLobby ? (
                <span className={`hud-turn-pill ${isMyTurn ? 'my-turn' : 'other-turn'}`}>
                  {isMyTurn ? '⚡ Your Turn' : `${activePlayer?.name}'s Turn`}
                </span>
              ) : (
                <span className="hud-turn-pill lobby-mode">⏱ Lobby</span>
              )}
              <button onClick={handleLeaveGame} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }}>Exit</button>
            </div>
          </div>

          {/* Board Container */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <BoardWrapper>
              <div style={{
                filter: (inLobby && !hasJoinedLobby) ? 'blur(6px) brightness(0.35)' : 'none',
                transition: 'filter 0.3s ease',
                width: '100%',
                height: '100%'
              }}>
                {renderGameBoard()}
              </div>
            </BoardWrapper>

            {/* Lobby Appearance Color Picker Modal */}
            {inLobby && !hasJoinedLobby && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 100,
                background: 'rgba(0,0,0,0.3)'
              }}>
                {renderAppearancePicker()}
              </div>
            )}
          </div>

          {/* Action Zone */}
          {room?.gameType !== 'MONOPOLY' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', background: 'var(--bg-secondary)', borderTop: '1px solid rgba(123,44,191,0.2)' }}>
              {renderActionBar()}
              
              {/* Mobile View trigger */}
              <button 
                onClick={() => setIsDrawerOpen(true)} 
                className="btn-secondary" 
                style={{ display: 'none', marginTop: '10px', padding: '6px 16px', width: '100%', maxWidth: '200px' }}
                id="mobile-log-trigger"
              >
                View Game Log
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Panel */}
        <div id="desktop-sidebar" style={{ width: '320px', background: 'var(--bg-secondary)', borderLeft: '1px solid rgba(123,44,191,0.2)', display: 'flex', flexDirection: 'column', height: '100%' }}>
          {inLobby ? (
            renderLobbySidebar()
          ) : room?.gameType === 'MONOPOLY' ? (
            renderMonopolySidebar()
          ) : (
            <>
              <div style={{ padding: '16px', borderBottom: '1px solid rgba(123,44,191,0.1)' }}>
                <h3 style={{ margin: 0 }}>Active Players</h3>
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '180px' }}>
                {room?.players?.map((p, idx) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div 
                        className={`player-token ${p.color ? '' : `token-${idx}`}`} 
                        style={{ 
                          position: 'relative', 
                          width: '12px', 
                          height: '12px', 
                          border: 'none',
                          backgroundColor: p.color || undefined,
                          boxShadow: p.color ? `0 0 5px ${p.color}` : undefined
                        }} 
                      />
                      <span style={{ textDecoration: !p.connected ? 'line-through' : 'none' }}>{p.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {p.id !== playerId && (
                        <button
                          onClick={() => socket?.emit('initiate_vote_kick', { targetPlayerId: p.id })}
                          style={{
                            background: 'rgba(217,4,41,0.1)',
                            border: '1px solid rgba(217,4,41,0.3)',
                            color: 'var(--accent-pink)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            cursor: 'pointer'
                          }}
                        >
                          🚫 Kick
                        </button>
                      )}
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {room?.gameType === 'SNAKES_LADDERS' && `Tile ${gameState.gameSpecificState.positions?.[p.id] || 1}`}
                        {room?.gameType === 'LUDO' && `Home stretch`}
                        {room?.gameType === 'UNO' && `${typeof gameState.gameSpecificState.hands?.[p.id] === 'number' ? gameState.gameSpecificState.hands?.[p.id] : (gameState.gameSpecificState.hands?.[p.id]?.length || 0)} cards`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {room?.gameType !== 'MONOPOLY' && (
            <>
              <div style={{ padding: '16px', borderTop: '1px solid rgba(123,44,191,0.1)', borderBottom: '1px solid rgba(123,44,191,0.1)' }}>
                <h3 style={{ margin: 0 }}>Log</h3>
              </div>
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                {gameLog.map((log, index) => {
                  const styles = getLogStyles(log);
                  return (
                    <div 
                      key={index} 
                      style={{ 
                        padding: '8px 12px', 
                        background: styles.background, 
                        borderRadius: '6px', 
                        borderLeft: styles.borderLeft,
                        fontSize: '12.5px',
                        color: 'var(--text-primary)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                        marginBottom: '4px'
                      }}
                    >
                      {log}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Uno Wild Card Color Picker Modal overlay */}
        {showColorPicker && (
          <div className="color-picker-overlay">
            <div className="color-picker-modal">
              <h2 style={{ color: '#fff', marginBottom: '8px' }}>Select Wild Card Color</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Choose the color to set for the next turn.</p>
              <div className="color-options">
                <button className="color-btn btn-red" onClick={() => handleSelectWildColor('red')}>Red</button>
                <button className="color-btn btn-green" onClick={() => handleSelectWildColor('green')}>Green</button>
                <button className="color-btn btn-blue" onClick={() => handleSelectWildColor('blue')}>Blue</button>
                <button className="color-btn btn-yellow" onClick={() => handleSelectWildColor('yellow')}>Yellow</button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile sliding drawer */}
        <div className={`drawer-overlay ${isDrawerOpen ? 'active' : ''}`} onClick={() => setIsDrawerOpen(false)} />
        <div className={`sliding-drawer ${isDrawerOpen ? 'active' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid rgba(123,44,191,0.1)' }}>
            <h3 style={{ margin: 0 }}>Game Info & Log</h3>
            <button onClick={() => setIsDrawerOpen(false)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>Close</button>
          </div>
          
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            {gameLog.map((log, index) => {
              const styles = getLogStyles(log);
              return (
                <div 
                  key={index} 
                  style={{ 
                    padding: '8px 12px', 
                    background: styles.background, 
                    borderRadius: '6px', 
                    borderLeft: styles.borderLeft,
                    fontSize: '12.5px',
                    color: 'var(--text-primary)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                    marginBottom: '4px'
                  }}
                >
                  {log}
                </div>
              );
            })}
          </div>
        </div>

        {/* Glassmorphic Toast Notification Banner */}
        {toastMessage && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(217, 4, 41, 0.2)',
            backdropFilter: 'blur(12px)',
            border: '1.5px solid var(--accent-pink)',
            borderRadius: '12px',
            padding: '14px 24px',
            color: '#fff',
            fontWeight: '600',
            fontSize: '14px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 15px rgba(217, 4, 41, 0.25)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeInDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <span>{toastMessage}</span>
            <button 
              onClick={() => setToastMessage(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '0 4px',
                marginLeft: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
            >
              ✕
            </button>
          </div>
        )}

        {/* Trade Constructor Modal */}
        {tradeModalTargetId !== null && (() => {
          const targetPlayer = room?.players?.find(p => p.id === tradeModalTargetId);
          if (!targetPlayer) return null;

          const cashMap = gameState?.gameSpecificState?.cash || {};
          const myCash = cashMap[playerId] || 0;
          const targetCash = cashMap[tradeModalTargetId] || 0;

          // My own tradeable properties (no houses on the color group!)
          const myTradeableProps = Object.entries(gameState?.gameSpecificState?.properties || {}).filter(([idx, prop]: any) => {
            if (prop.ownerId !== playerId || prop.houses > 0) return false;
            const space = MONOPOLY_BOARD[parseInt(idx, 10)];
            if (space.group) {
              const hasHouses = Object.entries(gameState.gameSpecificState.properties).some(([i, p]: [string, any]) => {
                const s = MONOPOLY_BOARD[parseInt(i, 10)];
                return s.group === space.group && p.houses > 0;
              });
              if (hasHouses) return false;
            }
            return true;
          }).map(([idx]: [string, any]) => ({ index: parseInt(idx, 10), name: MONOPOLY_BOARD[parseInt(idx, 10)].name }));

          // Target's tradeable properties
          const targetTradeableProps = Object.entries(gameState?.gameSpecificState?.properties || {}).filter(([idx, prop]: any) => {
            if (prop.ownerId !== tradeModalTargetId || prop.houses > 0) return false;
            const space = MONOPOLY_BOARD[parseInt(idx, 10)];
            if (space.group) {
              const hasHouses = Object.entries(gameState.gameSpecificState.properties).some(([i, p]: [string, any]) => {
                const s = MONOPOLY_BOARD[parseInt(i, 10)];
                return s.group === space.group && p.houses > 0;
              });
              if (hasHouses) return false;
            }
            return true;
          }).map(([idx]: [string, any]) => ({ index: parseInt(idx, 10), name: MONOPOLY_BOARD[parseInt(idx, 10)].name }));

          const handleToggleOfferProperty = (idx: number) => {
            setTradeOfferProperties(prev => prev.includes(idx) ? prev.filter(x => x !== idx) : [...prev, idx]);
          };

          const handleToggleRequestProperty = (idx: number) => {
            setTradeRequestProperties(prev => prev.includes(idx) ? prev.filter(x => x !== idx) : [...prev, idx]);
          };

          const handleSendOffer = () => {
            if (tradeOfferCash > myCash) {
              setToastMessage('You cannot offer more cash than you own.');
              return;
            }
            if (tradeRequestCash > targetCash) {
              setToastMessage('You cannot request more cash than target owns.');
              return;
            }
            socket?.emit('game_action', {
              type: 'INITIATE_TRADE',
              payload: {
                targetPlayerId: tradeModalTargetId,
                offer: {
                  cash: tradeOfferCash,
                  properties: tradeOfferProperties
                },
                request: {
                  cash: tradeRequestCash,
                  properties: tradeRequestProperties
                }
              }
            });
            setTradeModalTargetId(null);
          };

          return (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(6,2,10,0.85)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999
            }}>
              <div className="glass-panel" style={{
                width: '460px',
                padding: '24px',
                borderRadius: '16px',
                border: '1.5px solid var(--accent-purple)',
                background: 'rgba(123,44,191,0.04)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.6)'
              }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '18px', textAlign: 'center', fontWeight: 'bold' }}>
                  🤝 Propose Trade Deal to {targetPlayer.name}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Give block */}
                  <div style={{ padding: '12px', background: 'rgba(56,176,0,0.03)', border: '1px solid rgba(56,176,0,0.15)', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: 'var(--accent-green)', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      🟢 You Give
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Cash (Max: ${myCash})</label>
                      <input 
                        type="number" 
                        min="0"
                        max={myCash}
                        value={tradeOfferCash}
                        onChange={e => setTradeOfferCash(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        style={{
                          background: 'var(--bg-input)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          color: '#fff',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Properties</label>
                      <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {myTradeableProps.length === 0 ? (
                          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No eligible properties</span>
                        ) : myTradeableProps.map(p => (
                          <label key={p.index} style={{ fontSize: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={tradeOfferProperties.includes(p.index)} 
                              onChange={() => handleToggleOfferProperty(p.index)}
                            />
                            {p.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Receive block */}
                  <div style={{ padding: '12px', background: 'rgba(217,4,41,0.03)', border: '1px solid rgba(217,4,41,0.15)', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: 'var(--accent-pink)', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      🔴 You Receive
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Cash (Max: ${targetCash})</label>
                      <input 
                        type="number" 
                        min="0"
                        max={targetCash}
                        value={tradeRequestCash}
                        onChange={e => setTradeRequestCash(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        style={{
                          background: 'var(--bg-input)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          color: '#fff',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Properties</label>
                      <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {targetTradeableProps.length === 0 ? (
                          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No eligible properties</span>
                        ) : targetTradeableProps.map(p => (
                          <label key={p.index} style={{ fontSize: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={tradeRequestProperties.includes(p.index)} 
                              onChange={() => handleToggleRequestProperty(p.index)}
                            />
                            {p.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button onClick={handleSendOffer} className="btn-primary" style={{ flex: 1.5, padding: '10px', fontWeight: 'bold' }}>Send Deal 🚀</button>
                  <button onClick={() => setTradeModalTargetId(null)} className="btn-secondary" style={{ flex: 1, padding: '10px' }}>Cancel</button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Vote Kick Voting Panel Overlay */}
        {voteKickState !== null && (() => {
          const targetName = room?.players?.find(p => p.id === voteKickState.targetPlayerId)?.name || 'Unknown';
          const initiatorName = room?.players?.find(p => p.id === voteKickState.initiatorId)?.name || 'Unknown';
          
          const isTargetMe = voteKickState.targetPlayerId === playerId;
          const myVote = voteKickState.votes[playerId];
          const countdownColor = voteKickCountdown <= 15 ? 'var(--accent-pink)' : 'var(--text-muted)';
          
          const handleVote = (kick: boolean) => {
            socket?.emit('cast_kick_vote', { vote: kick });
          };

          return (
            <div style={{
              position: 'fixed',
              top: '85px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '320px',
              background: 'rgba(6,2,10,0.92)',
              backdropFilter: 'blur(16px)',
              border: '1.5px solid var(--accent-pink)',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 15px rgba(217,4,41,0.15)',
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🚫</span>
                <span style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#fff' }}>Vote Kick Initiated</span>
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                Target: <strong style={{ color: '#fff' }}>{targetName}</strong>
                <br />
                Started by: {initiatorName}
              </div>

              {/* Yes/No tally + countdown */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>Yes votes: {Object.values(voteKickState.votes).filter(v => v === true).length} / {voteKickState.requiredVotes}</span>
                <span style={{ color: countdownColor, fontWeight: voteKickCountdown <= 15 ? 'bold' : 'normal' }}>⏱ {voteKickCountdown}s</span>
              </div>

              {isTargetMe ? (
                <div style={{ fontSize: '12px', color: 'var(--accent-pink)', fontStyle: 'italic', marginTop: '6px' }}>
                  A vote kick has been started against you. Waiting for other players...
                </div>
              ) : myVote !== undefined ? (
                <div style={{ fontSize: '12px', color: 'var(--accent-green)', fontStyle: 'italic', marginTop: '6px' }}>
                  You voted: {myVote ? 'Kick 🚫' : 'Keep 🤝'}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button 
                    onClick={() => handleVote(true)} 
                    className="btn-primary" 
                    style={{ flex: 1, padding: '8px', fontSize: '12px', background: 'linear-gradient(135deg, var(--accent-pink) 0%, #bd002a 100%)', boxShadow: 'none' }}
                  >
                    Kick 🚫
                  </button>
                  <button 
                    onClick={() => handleVote(false)} 
                    className="btn-secondary" 
                    style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                  >
                    Keep 🤝
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {room?.status === 'ENDED' && (() => {
          // Determine winner and rankings
          const rankings = gameState?.gameSpecificState?.rankings as string[] || [];
          const hasRankings = rankings.length > 0;
          
          // Get player names and colors
          const getPlayerDetails = (id: string) => {
            const p = room?.players?.find((x: Player) => x.id === id) || gameState?.players?.find((x: any) => x.id === id);
            return {
              name: p ? p.name : 'Unknown',
              color: p ? p.color : '#adff2f'
            };
          };

          const isHost = room.hostId === playerId;

          return (
            <div className="victory-overlay">
              <div className="glass-panel victory-card animate-victory-modal" style={{
                border: '1.5px solid rgba(108, 60, 233, 0.4)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.65), 0 0 50px rgba(108, 60, 233, 0.25)'
              }}>
                <h1 className="victory-title">🏆 Victory!</h1>
                <p className="victory-subtitle">Match over — here are the final standings:</p>

                {/* Standings list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px', textAlign: 'left' }}>
                  {hasRankings ? (
                    rankings.map((pId, idx) => {
                      const details = getPlayerDetails(pId);
                      const isMe = pId === playerId;
                      let medal = '🏅';
                      let medalColor = 'var(--muted)';
                      if (idx === 0) { medal = '🥇'; medalColor = '#FFD700'; }
                      else if (idx === 1) { medal = '🥈'; medalColor = '#C0C0C0'; }
                      else if (idx === 2) { medal = '🥉'; medalColor = '#CD7F32'; }

                      return (
                        <div 
                          key={pId}
                          className={`ranking-row${isMe ? ' is-me' : ''}`}
                          style={{ animation: `slideUp 0.4s ease-out forwards ${idx * 0.1}s`, opacity: 0, transform: 'translateY(15px)' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '22px' }}>{medal}</span>
                            <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '15px', color: isMe ? 'var(--cloud)' : 'var(--cloud-dim)' }}>
                              {details.name} {isMe && <span style={{ color: 'var(--lime)', fontSize: '12px' }}>(You)</span>}
                            </span>
                          </div>
                          <span className="ranking-place" style={{ color: medalColor }}>
                            {idx === 0 ? '1st' : idx === 1 ? '2nd' : idx === 2 ? '3rd' : `${idx + 1}th`}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    (() => {
                      const winnerId = gameState?.winnerId || room?.players?.[0]?.id;
                      const details = getPlayerDetails(winnerId);
                      const isMe = winnerId === playerId;
                      return (
                        <div className="ranking-row" style={{ background: 'rgba(255, 194, 71, 0.08)', borderColor: 'rgba(255, 194, 71, 0.35)', justifyContent: 'center', gap: '16px' }}>
                          <span style={{ fontSize: '28px' }}>🏆</span>
                          <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '18px', color: 'var(--cloud)' }}>
                            {details.name} {isMe && <span style={{ color: 'var(--lime)' }}>(You)</span>}
                          </span>
                          <span className="ranking-place" style={{ color: 'var(--gold)' }}>Winner</span>
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* Host Control Actions */}
                {isHost ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button 
                      onClick={() => socket?.emit('rematch')}
                      className="btn-primary"
                      style={{ padding: '14px 28px', fontSize: '16px', fontWeight: 700 }}
                    >
                      🔄 Play Rematch
                    </button>

                    <div className="brand-divider">
                      <div className="brand-divider-line" />
                      <span className="brand-divider-text">New Game</span>
                      <div className="brand-divider-line" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button onClick={() => socket?.emit('change_game_type', { gameType: 'LUDO' })} className="btn-secondary" style={{ padding: '10px', fontSize: '13px' }}>🎲 Ludo</button>
                      <button onClick={() => socket?.emit('change_game_type', { gameType: 'UNO' })} className="btn-secondary" style={{ padding: '10px', fontSize: '13px' }}>🃏 Uno</button>
                      <button onClick={() => socket?.emit('change_game_type', { gameType: 'MONOPOLY' })} className="btn-secondary" style={{ padding: '10px', fontSize: '13px' }}>🏢 Monopoly</button>
                      <button onClick={() => socket?.emit('change_game_type', { gameType: 'SNAKES_LADDERS' })} className="btn-secondary" style={{ padding: '10px', fontSize: '13px' }}>🐍 Snakes</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(108, 60, 233, 0.2)', color: 'var(--muted)', fontSize: '13px', fontFamily: "'Manrope', sans-serif" }}>
                    ⏳ Waiting for <strong style={{ color: 'var(--cloud)' }}>{getPlayerDetails(room.hostId).name}</strong> to pick the next match…
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      </div>
    );
  }

  // Lobby List Selection / Room Code Joining (Unified Overhauled Landing Page)
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100dvh', 
      padding: '24px',
      background: 'linear-gradient(160deg, #1B1140 0%, #0D0826 55%, #06020a 100%)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Manrope', sans-serif"
    }}>
      {/* Animated Brand Background Blobs */}
      <div className="landing-blob landing-blob-violet" />
      <div className="landing-blob landing-blob-lime" />
      <div className="landing-blob landing-blob-coral" />

      {/* Main Landing Card */}
      {authTab === 'guest' ? (
        currentUser ? (
          /* ── Logged In Dashboard Card ── */
          <div className="landing-card" style={{ padding: '40px', maxWidth: '460px', width: '100%', textAlign: 'center' }}>

            {/* Brand Logo Mark */}
            <div className="brand-logo-mark" style={{ width: '80px', height: '80px', margin: '0 auto 20px auto', borderRadius: '20px' }}>
              <span style={{ fontSize: '44px', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}>🎲</span>
            </div>

            {/* Brand Wordmark */}
            <div style={{ marginBottom: '8px', lineHeight: 1 }}>
              <span className="wordmark-turn" style={{ fontSize: '34px' }}>turn</span>
              <span className="wordmark-up" style={{ fontSize: '34px' }}>Up</span>
              <span className="wordmark-turn" style={{ fontSize: '18px', opacity: 0.5 }}>.io</span>
            </div>

            <div style={{ marginBottom: '24px', marginTop: '12px' }}>
              <div style={{ fontSize: '15px', color: 'var(--cloud)', marginBottom: '6px', fontFamily: "'Manrope', sans-serif" }}>
                Welcome back, <strong style={{ color: 'var(--lime)' }}>{username}</strong>!
              </div>
              <button 
                onClick={() => {
                  localStorage.removeItem('turnup_token');
                  localStorage.removeItem('turnup_user');
                  setToken('');
                  setCurrentUser(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--muted)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontFamily: "'Manrope', sans-serif"
                }}
              >
                Sign out
              </button>
            </div>

            <div style={{ fontSize: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isConnected ? 'var(--accent-green)' : 'var(--coral)', display: 'inline-block' }} />
              <span style={{ color: isConnected ? 'var(--accent-green)' : 'var(--coral)', fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {isConnected ? 'Server Online' : 'Server Offline'}
              </span>
            </div>

            <button 
              onClick={() => handleFastPlay()}
              className="btn-primary" 
              style={{ width: '100%', padding: '16px', fontSize: '17px', borderRadius: '14px', fontWeight: 700, marginBottom: '12px' }}
              disabled={!isConnected}
            >
              Play Now 🚀
            </button>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '4px' }}>
              <button 
                onClick={handleAllRoomsBtn}
                className="btn-secondary" 
                style={{ flex: 1, padding: '11px', fontSize: '13px' }}
                disabled={!isConnected}
              >
                🌐 All Rooms
              </button>
              <button 
                onClick={handleCreatePrivateGameBtn}
                className="btn-secondary" 
                style={{ flex: 1.2, padding: '11px', fontSize: '13px' }}
                disabled={!isConnected}
              >
                🛠️ Private Game
              </button>
            </div>

            <div className="brand-divider">
              <div className="brand-divider-line" />
              <span className="brand-divider-text">Join Room Code</span>
              <div className="brand-divider-line" />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Room code…" 
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                maxLength={6}
                className="brand-input"
                style={{ textTransform: 'uppercase', textAlign: 'center', fontFamily: "'Space Mono', monospace", letterSpacing: '0.12em', fontSize: '16px', flex: 1.8 }}
              />
              <button onClick={handleJoinRoom} className="btn-primary" style={{ flex: 1, padding: '14px', fontSize: '14px' }} disabled={!isConnected}>Join</button>
            </div>
          </div>
        ) : (
          /* ── Guest / Nickname Input Card ── */
          <div className="landing-card" style={{ padding: '44px', maxWidth: '480px', width: '100%', textAlign: 'center' }}>

            {/* Brand Logo Mark */}
            <div className="brand-logo-mark" style={{ width: '100px', height: '100px', borderRadius: '26px', margin: '0 auto 28px auto' }}>
              <span style={{ fontSize: '56px', filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.3))' }}>🎲</span>
            </div>

            {/* Brand Wordmark h1 */}
            <h1 style={{ margin: '0 0 12px 0', lineHeight: 1 }}>
              <span className="wordmark-turn" style={{ fontSize: '48px' }}>turn</span>
              <span className="wordmark-up" style={{ fontSize: '48px' }}>Up</span>
              <span className="wordmark-turn" style={{ fontSize: '26px', opacity: 0.5 }}>.io</span>
            </h1>

            <p className="brand-tagline" style={{ marginBottom: '32px', fontSize: '14.5px' }}>
              Turn any group chat into game night. Ludo, Monopoly, Uno &amp; more — no downloads.
            </p>

            {authError && (
              <div style={{ 
                backgroundColor: 'rgba(255, 92, 102, 0.1)', 
                border: '1px solid var(--coral)', 
                color: 'var(--coral)', 
                padding: '12px 16px', 
                borderRadius: '10px', 
                marginBottom: '20px',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: "'Manrope', sans-serif"
              }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleGuestLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                type="text" 
                placeholder="Pick a nickname…" 
                value={guestUsername}
                onChange={e => setGuestUsername(e.target.value)}
                maxLength={15}
                required
                className="brand-input"
                style={{ textAlign: 'center', fontSize: '17px', fontWeight: 600 }}
              />
              <button 
                type="submit"
                className="btn-primary" 
                style={{ 
                  width: '100%',
                  padding: '16px', 
                  fontSize: '18px', 
                  borderRadius: '14px', 
                  fontWeight: 700,
                  marginTop: '4px'
                }}
              >
                Enter Arena 🚀
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '28px', fontSize: '12.5px' }}>
              <span 
                onClick={() => { setAuthTab('login'); setAuthError(''); }}
                style={{ color: 'var(--muted)', cursor: 'pointer', textDecoration: 'underline', transition: 'color 0.2s', fontFamily: "'Manrope', sans-serif" }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--cloud)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
              >
                Sign In 🔑
              </span>
              <span style={{ color: 'var(--muted)', opacity: 0.4 }}>|</span>
              <span 
                onClick={() => { setAuthTab('register'); setAuthError(''); }}
                style={{ color: 'var(--muted)', cursor: 'pointer', textDecoration: 'underline', transition: 'color 0.2s', fontFamily: "'Manrope', sans-serif" }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--cloud)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
              >
                Create Account 📝
              </span>
            </div>
          </div>
        ) ) : (
        /* ── Sign In / Register Card ── */
        <div className="landing-card" style={{ padding: '40px', maxWidth: '440px', width: '100%' }}>

          {/* Back navigation */}
          <button 
            onClick={() => { setAuthTab('guest'); setAuthError(''); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none',
              color: 'var(--muted)', cursor: 'pointer',
              fontFamily: "'Manrope', sans-serif", fontSize: '13px',
              marginBottom: '24px', padding: 0,
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--cloud)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
          >
            ← Back
          </button>

          <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '28px', fontWeight: 600, color: 'var(--cloud)', marginBottom: '24px', marginTop: 0 }}>
            {authTab === 'login' ? '🔑 Sign In' : '📝 Create Account'}
          </h2>

          {authError && (
            <div style={{
              backgroundColor: 'rgba(255, 92, 102, 0.1)',
              border: '1px solid var(--coral)',
              color: 'var(--coral)',
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '16px',
              fontSize: '13px',
              fontFamily: "'Manrope', sans-serif"
            }}>
              {authError}
            </div>
          )}

          {authTab === 'login' && (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                type="text" 
                placeholder="Username or Email" 
                value={loginInput}
                onChange={e => setLoginInput(e.target.value)}
                required
                className="brand-input"
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                required
                className="brand-input"
              />
              <button type="submit" className="btn-primary" style={{ padding: '14px', fontSize: '16px', marginTop: '4px' }}>Sign In 🔑</button>
            </form>
          )}

          {authTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                type="text" 
                placeholder="Username" 
                value={regUsername}
                onChange={e => setRegUsername(e.target.value)}
                maxLength={15}
                required
                className="brand-input"
              />
              <input 
                type="email" 
                placeholder="Email Address" 
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                required
                className="brand-input"
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                required
                className="brand-input"
              />
              <button type="submit" className="btn-primary" style={{ padding: '14px', fontSize: '16px', marginTop: '4px' }}>Create Account 📝</button>
            </form>
          )}

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', fontFamily: "'Manrope', sans-serif", color: 'var(--muted)' }}>
            {authTab === 'login' ? (
              <span>
                No account?{' '}
                <span style={{ color: 'var(--violet)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setAuthTab('register')}>
                  Create one
                </span>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <span style={{ color: 'var(--violet)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setAuthTab('login')}>
                  Sign in
                </span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Render modals */}
      {renderRoomsModal()}
      {renderGameTypeSelectionModal()}

      {/* ── Toast Notification Banner ── */}
      {toastMessage && (
        <div className="game-toast">
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <span>{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            style={{
              background: 'none', border: 'none',
              color: 'var(--muted)', cursor: 'pointer',
              fontSize: '16px', padding: '0 4px', marginLeft: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--cloud)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
