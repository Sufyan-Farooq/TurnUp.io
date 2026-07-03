import { IGameRuleset, GameState, GameAction, ActionResult, IPlayer, GameEvent } from './interfaces';
import { DeterministicRNG } from './rng';

export interface SnakesLaddersState extends GameState {
  gameSpecificState: {
    positions: Record<string, number>; // playerId -> cell (1-100)
    snakes: Record<number, number>; // head -> tail
    ladders: Record<number, number>; // base -> top
    lastRoll: number;
  };
}

export class SnakesLaddersRuleset implements IGameRuleset<SnakesLaddersState> {
  public gameType = 'SNAKES_LADDERS';

  // Standard board layouts
  private defaultSnakes: Record<number, number> = {
    16: 6,
    46: 25,
    49: 11,
    62: 19,
    64: 60,
    74: 53,
    89: 68,
    92: 88,
    95: 75,
    99: 80
  };

  private defaultLadders: Record<number, number> = {
    2: 38,
    7: 14,
    8: 31,
    15: 26,
    21: 42,
    28: 84,
    36: 44,
    51: 67,
    71: 91,
    78: 98,
    87: 94
  };

  public initialize(players: IPlayer[], config: Record<string, any>, seed: number): SnakesLaddersState {
    const positions: Record<string, number> = {};
    players.forEach(p => {
      positions[p.id] = 1; // All start at cell 1
    });

    const turnOrder = players.map(p => p.id);

    return {
      gameId: config.gameId || 'game_sl',
      gameType: this.gameType,
      status: 'ACTIVE',
      players,
      activePlayerId: turnOrder[0] || '',
      turnOrder,
      turnIndex: 0,
      subState: 'WAITING_FOR_ROLL',
      rngState: seed.toString(),
      winnerId: null,
      historyLength: 0,
      gameSpecificState: {
        positions,
        snakes: this.defaultSnakes,
        ladders: this.defaultLadders,
        lastRoll: 0
      }
    };
  }

  public processAction(currentState: SnakesLaddersState, action: GameAction): ActionResult<SnakesLaddersState> {
    if (action.type !== 'ROLL_DICE') {
      return { isValid: false, error: 'Only ROLL_DICE is allowed.', events: [] };
    }

    if (currentState.subState !== 'WAITING_FOR_ROLL') {
      return { isValid: false, error: 'Invalid game sub-state for roll.', events: [] };
    }

    const playerId = action.playerId;
    const rng = new DeterministicRNG(parseInt(currentState.rngState, 10));
    const roll = rng.rollRange(1, 6);
    const events: GameEvent[] = [];

    events.push({
      type: 'DICE_ROLLED',
      playerId,
      payload: { value: roll }
    });

    const positions = { ...currentState.gameSpecificState.positions };
    const oldPos = positions[playerId] || 1;
    let newPos = oldPos + roll;

    // Check boundary
    if (newPos > 100) {
      newPos = oldPos; // Must land exactly on 100
      events.push({
        type: 'TOKEN_BOUNCED',
        playerId,
        payload: { from: oldPos, roll, target: newPos }
      });
    } else {
      events.push({
        type: 'TOKEN_MOVED',
        playerId,
        payload: { path: Array.from({ length: roll }, (_, idx) => oldPos + idx + 1) }
      });
    }

    // Check snakes/ladders
    let landedPos = newPos;
    const snakeTail = currentState.gameSpecificState.snakes[newPos];
    const ladderTop = currentState.gameSpecificState.ladders[newPos];

    if (snakeTail) {
      landedPos = snakeTail;
      events.push({
        type: 'SLIDE_SNAKE',
        playerId,
        payload: { head: newPos, tail: snakeTail }
      });
    } else if (ladderTop) {
      landedPos = ladderTop;
      events.push({
        type: 'CLIMB_LADDER',
        playerId,
        payload: { base: newPos, top: ladderTop }
      });
    }

    positions[playerId] = landedPos;

    // Determine next turn
    let winnerId = this.checkWinner(positions);
    let nextPlayerId = currentState.activePlayerId;
    let nextSubState = 'WAITING_FOR_ROLL';
    let nextTurnIndex = currentState.turnIndex;

    if (winnerId) {
      nextSubState = 'GAME_OVER';
    } else {
      if (currentState.turnOrder.length > 0) {
        nextTurnIndex = (currentState.turnIndex + 1) % currentState.turnOrder.length;
        nextPlayerId = currentState.turnOrder[nextTurnIndex];
      } else {
        nextTurnIndex = 0;
        nextPlayerId = '';
      }
    }

    const nextState: SnakesLaddersState = {
      ...currentState,
      activePlayerId: nextPlayerId,
      turnIndex: nextTurnIndex,
      subState: nextSubState,
      rngState: rng.getState().toString(),
      winnerId,
      gameSpecificState: {
        ...currentState.gameSpecificState,
        positions,
        lastRoll: roll
      }
    };

    return {
      isValid: true,
      newState: nextState,
      events
    };
  }

  public getPlayerState(currentState: SnakesLaddersState, playerId: string): Record<string, any> {
    return currentState; // Snakes & Ladders has fully open state
  }

  public checkWinConditions(currentState: SnakesLaddersState): string | null {
    return this.checkWinner(currentState.gameSpecificState.positions);
  }

  private checkWinner(positions: Record<string, number>): string | null {
    for (const [playerId, pos] of Object.entries(positions)) {
      if (pos >= 100) {
        return playerId;
      }
    }
    return null;
  }
}
