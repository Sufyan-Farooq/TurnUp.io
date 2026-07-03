/**
 * Generic Player representation.
 */
export interface IPlayer {
  id: string;
  name: string;
  avatarUrl?: string;
  isBot: boolean;
  color?: string;
}

/**
 * Base Game Action representation. All actions are serializable commands.
 */
export interface GameAction {
  type: string;
  playerId: string;
  payload: Record<string, any>;
  timestamp: number;
}

/**
 * The base game state fields required for engine management.
 * Game-specific states (e.g. Ludo, Monopoly) extend this interface.
 */
export interface GameState {
  gameId: string;
  gameType: string;
  status: 'LOBBY' | 'INITIALIZING' | 'ACTIVE' | 'PAUSED' | 'GAME_OVER';
  players: IPlayer[];
  activePlayerId: string;
  turnOrder: string[];
  turnIndex: number;
  subState: string;
  rngState: string; // Seed/State representation for reproducible RNG
  winnerId: string | null;
  historyLength: number;
  gameSpecificState: Record<string, any>;
}

/**
 * Visual/auditory event emitted during a state transition.
 * Sent to clients to trigger animations (e.g. token movement steps).
 */
export interface GameEvent {
  type: string;
  playerId?: string;
  payload: Record<string, any>;
}

/**
 * Result returned by the ruleset after processing an action.
 */
export interface ActionResult<S extends GameState = GameState> {
  isValid: boolean;
  error?: string;
  newState?: S;
  events: GameEvent[]; // Sequential animation/UI cues
}

/**
 * Unified Game Ruleset Interface.
 * All games (Monopoly, Ludo, Uno, Snakes & Ladders) must implement this.
 */
export interface IGameRuleset<S extends GameState = GameState, A extends GameAction = GameAction> {
  gameType: string;

  /**
   * Initializes the game state.
   */
  initialize(players: IPlayer[], config: Record<string, any>, seed: number): S;

  /**
   * Processes a player action, performs validation, and returns the modified state and events.
   * This is a pure function.
   */
  processAction(currentState: S, action: A): ActionResult<S>;

  /**
   * Filters the raw game state to remove hidden information (Fog-of-War).
   * E.g., hiding other players' cards in Uno, or face-down deck cards.
   */
  getPlayerState(currentState: S, playerId: string): Record<string, any>;

  /**
   * Evaluates if a player has met the victory conditions.
   */
  checkWinConditions(currentState: S): string | null;
}

/**
 * Decoupled State & Rule Engine Implementation.
 * The core runtime uses this class to run game actions against the ruleset.
 */
export class GameEngineManager {
  private currentState!: GameState;
  private ruleset: IGameRuleset;
  private actionLog: GameAction[] = [];

  constructor(ruleset: IGameRuleset) {
    this.ruleset = ruleset;
  }

  public initGame(players: IPlayer[], config: Record<string, any>, seed: number): GameState {
    this.currentState = this.ruleset.initialize(players, config, seed);
    return this.currentState;
  }

  public handleIncomingAction(action: GameAction): ActionResult {
    // 1. Authoritative Validation
    if (this.currentState.status !== 'ACTIVE' && this.currentState.status !== 'INITIALIZING') {
      return { isValid: false, error: 'Game is not in active state.', events: [] };
    }

    if (action.playerId !== this.currentState.activePlayerId && !this.isOutofTurnActionAllowed(action)) {
      return { isValid: false, error: 'It is not this player\'s turn.', events: [] };
    }

    // 2. Delegate execution to pure ruleset function
    const result = this.ruleset.processAction(this.currentState, action);

    if (result.isValid && result.newState) {
      this.currentState = result.newState;
      this.actionLog.push(action);
      this.currentState.historyLength = this.actionLog.length;

      // 3. Post-Process Win Conditions
      const winner = this.ruleset.checkWinConditions(this.currentState);
      if (winner) {
        this.currentState.status = 'GAME_OVER';
        this.currentState.winnerId = winner;
      }
    }

    return result;
  }

  private isOutofTurnActionAllowed(action: GameAction): boolean {
    // Certain actions like Monopoly trades, auctions, or Uno "Draw Penalty" / "Saying Uno" can occur out of turn.
    const outOfTurnActions = ['INITIATE_TRADE', 'ACCEPT_TRADE', 'REJECT_TRADE', 'BID', 'FOLD', 'DECLARE_UNO', 'CHALLENGE_UNO'];
    return outOfTurnActions.includes(action.type);
  }

  public getCurrentState(): GameState {
    return this.currentState;
  }

  public setCurrentState(state: GameState): void {
    this.currentState = state;
  }

  public getAuditedState(playerId: string): Record<string, any> {
    return this.ruleset.getPlayerState(this.currentState, playerId);
  }

  public getActionLog(): GameAction[] {
    return this.actionLog;
  }

  public getRuleset(): IGameRuleset {
    return this.ruleset;
  }
}
