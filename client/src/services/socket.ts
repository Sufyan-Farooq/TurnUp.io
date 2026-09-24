import { io, Socket } from 'socket.io-client';

export class SocketService {
  private socket: Socket | null = null;
  private playerId: string;
  private token: string | null = null;
  private roomId: string | null = null;

  constructor(playerId: string) {
    this.playerId = playerId;
    this.token = localStorage.getItem(`turnup_token_${playerId}`);
    this.roomId = localStorage.getItem(`turnup_room_${playerId}`);
  }

  public connect(serverUrl: string, onConnect: () => void, onDisconnect: () => void): Socket {
    this.socket = io(serverUrl || undefined, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 750,
      reconnectionDelayMax: 10_000,
      randomizationFactor: 0.4,
      timeout: 15_000
    });

    this.socket.on('connect', () => {
      console.log('Socket transport connected.');
      onConnect();
    });

    this.socket.on('disconnect', () => {
      console.log('Socket transport disconnected.');
      onDisconnect();
    });

    this.socket.connect();
    return this.socket;
  }

  public getSession(): { roomId: string | null; token: string | null } {
    return { roomId: this.roomId, token: this.token };
  }

  public saveSession(roomId: string, token: string) {
    this.roomId = roomId;
    this.token = token;
    localStorage.setItem(`turnup_room_${this.playerId}`, roomId);
    localStorage.setItem(`turnup_token_${this.playerId}`, token);
  }

  public clearSession() {
    this.roomId = null;
    this.token = null;
    localStorage.removeItem(`turnup_room_${this.playerId}`);
    localStorage.removeItem(`turnup_token_${this.playerId}`);
  }

  public disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
