import { IGameRuleset, GameState, GameAction, ActionResult, IPlayer, GameEvent } from './interfaces';
import { DeterministicRNG } from './rng';

export interface LudoState extends GameState {
  gameSpecificState: {
    // PlayerId -> Array of 4 token positions
    // -1: Base, 0-51: Common Track, 52-56: Home Stretch, 57: Home
    tokens: Record<string, number[]>;
    lastRoll: number;
    consecutiveSixes: number;
    rankings?: string[];
    maxPlayers?: number;
  };
}

export class LudoRuleset implements IGameRuleset<LudoState> {
  public gameType = 'LUDO';

  public initialize(players: IPlayer[], config: Record<string, any>, seed: number): LudoState {
    const tokens: Record<string, number[]> = {};
    players.forEach(p => {
      tokens[p.id] = [-1, -1, -1, -1];
    });

    const turnOrder = players.map(p => p.id);
    const maxPlayers = config.maxPlayers || 4;

    return {
      gameId: config.gameId || 'game_ludo',
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
        tokens,
        lastRoll: 0,
        consecutiveSixes: 0,
        rankings: [],
        maxPlayers
      }
    };
  }

  public processAction(currentState: LudoState, action: GameAction): ActionResult<LudoState> {
    const { type, playerId, payload } = action;

    if (playerId !== currentState.activePlayerId) {
      return { isValid: false, error: 'Not your turn.', events: [] };
    }

    if (type === 'ROLL_DICE') {
      if (currentState.subState !== 'WAITING_FOR_ROLL') {
        return { isValid: false, error: 'Cannot roll dice right now.', events: [] };
      }

      const rng = new DeterministicRNG(parseInt(currentState.rngState, 10));
      const roll = rng.rollRange(1, 6);
      const events: GameEvent[] = [
        {
          type: 'DICE_ROLLED',
          playerId,
          payload: { value: roll }
        }
      ];

      let consecutiveSixes = currentState.gameSpecificState.consecutiveSixes;

      if (roll === 6) {
        consecutiveSixes++;
      } else {
        consecutiveSixes = 0;
      }

      // 3 consecutive sixes forfeits turn
      if (consecutiveSixes === 3) {
        events.push({
          type: 'TURN_FORFEITED',
          playerId,
          payload: { reason: 'Three consecutive sixes' }
        });

        const nextTurnIndex = (currentState.turnIndex + 1) % currentState.turnOrder.length;
        const nextPlayerId = currentState.turnOrder[nextTurnIndex];

        const nextState: LudoState = {
          ...currentState,
          activePlayerId: nextPlayerId,
          turnIndex: nextTurnIndex,
          subState: 'WAITING_FOR_ROLL',
          rngState: rng.getState().toString(),
          gameSpecificState: {
            ...currentState.gameSpecificState,
            lastRoll: roll,
            consecutiveSixes: 0
          }
        };

        return { isValid: true, newState: nextState, events };
      }

      // Check if there are any valid moves for this player with this roll
      const hasMoves = this.hasValidMoves(currentState, playerId, roll);

      if (!hasMoves) {
        events.push({
          type: 'NO_VALID_MOVES',
          playerId,
          payload: { roll }
        });

        // Turn ends, advance to next player
        const nextTurnIndex = (currentState.turnIndex + 1) % currentState.turnOrder.length;
        const nextPlayerId = currentState.turnOrder[nextTurnIndex];

        const nextState: LudoState = {
          ...currentState,
          activePlayerId: nextPlayerId,
          turnIndex: nextTurnIndex,
          subState: 'WAITING_FOR_ROLL',
          rngState: rng.getState().toString(),
          gameSpecificState: {
            ...currentState.gameSpecificState,
            lastRoll: roll,
            consecutiveSixes: 0
          }
        };

        return { isValid: true, newState: nextState, events };
      }

      // Player has valid moves, must select a token to move
      const nextState: LudoState = {
        ...currentState,
        subState: 'WAITING_FOR_TOKEN_MOVE',
        rngState: rng.getState().toString(),
        gameSpecificState: {
          ...currentState.gameSpecificState,
          lastRoll: roll,
          consecutiveSixes
        }
      };

      return { isValid: true, newState: nextState, events };
    }

    if (type === 'MOVE_TOKEN') {
      if (currentState.subState !== 'WAITING_FOR_TOKEN_MOVE') {
        return { isValid: false, error: 'Cannot move a token right now.', events: [] };
      }

      const tokenIndex = payload.tokenIndex;
      if (typeof tokenIndex !== 'number' || tokenIndex < 0 || tokenIndex > 3) {
        return { isValid: false, error: 'Invalid token index.', events: [] };
      }

      const roll = currentState.gameSpecificState.lastRoll;
      const playerTokens = currentState.gameSpecificState.tokens[playerId];
      const currentPos = playerTokens[tokenIndex];

      if (!this.isValidMove(currentState, playerId, tokenIndex, roll)) {
        return { isValid: false, error: 'This token cannot make a valid move with the current roll.', events: [] };
      }

      const maxPlayers = currentState.gameSpecificState.maxPlayers || 4;
      const trackLength = maxPlayers === 6 ? 78 : 52;
      const playerIdx = this.getPlayerBaseIndex(currentState, playerId);
      const startCell = playerIdx * 13;
      let newPos = currentPos;

      const events: GameEvent[] = [];

      if (currentPos === -1) {
        // Release from base
        newPos = startCell;
        events.push({
          type: 'TOKEN_RELEASED',
          playerId,
          payload: { tokenIndex, startCell }
        });
      } else if (currentPos >= 0 && currentPos <= (trackLength - 1)) {
        // On common track
        const stepsTaken = (currentPos - startCell + trackLength) % trackLength;
        const newSteps = stepsTaken + roll;
        if (newSteps <= (trackLength - 1)) {
          newPos = (startCell + newSteps) % trackLength;
        } else {
          newPos = trackLength + (newSteps - trackLength);
        }
        events.push({
          type: 'TOKEN_MOVED',
          playerId,
          payload: { tokenIndex, from: currentPos, to: newPos }
        });
      } else if (currentPos >= trackLength && currentPos <= (trackLength + 4)) {
        // On home stretch
        newPos = currentPos + roll;
        events.push({
          type: 'TOKEN_MOVED',
          playerId,
          payload: { tokenIndex, from: currentPos, to: newPos }
        });
      }

      // Clone tokens and update position
      const updatedTokens = { ...currentState.gameSpecificState.tokens };
      const playerTokensCopy = [...updatedTokens[playerId]];
      playerTokensCopy[tokenIndex] = newPos;
      updatedTokens[playerId] = playerTokensCopy;

      let captured = false;

      // Handle collision on common track (0 to trackLength - 1)
      if (newPos >= 0 && newPos <= (trackLength - 1)) {
        Object.keys(updatedTokens).forEach(otherPlayerId => {
          if (otherPlayerId !== playerId) {
            const otherTokens = updatedTokens[otherPlayerId];
            const updatedOtherTokens = [...otherTokens];
            let checkCapture = false;

            for (let i = 0; i < 4; i++) {
              if (updatedOtherTokens[i] === newPos) {
                updatedOtherTokens[i] = -1; // Send back to base
                captured = true;
                checkCapture = true;
                events.push({
                  type: 'TOKEN_CAPTURED',
                  playerId: otherPlayerId,
                  payload: { tokenIndex: i, sentToBase: true, capturedBy: playerId }
                });
              }
            }
            if (checkCapture) {
              updatedTokens[otherPlayerId] = updatedOtherTokens;
            }
          }
        });
      }

      if (newPos === (trackLength + 5)) {
        events.push({
          type: 'TOKEN_HOME',
          playerId,
          payload: { tokenIndex }
        });
      }

      // Check if player has finished (all 4 tokens are home)
      const isFinished = updatedTokens[playerId].every(pos => pos === (trackLength + 5));
      const updatedRankings = [...(currentState.gameSpecificState.rankings || [])];
      
      let rankingsChanged = false;
      if (isFinished && !updatedRankings.includes(playerId)) {
        updatedRankings.push(playerId);
        rankingsChanged = true;
        events.push({
          type: 'PLAYER_FINISHED',
          playerId,
          payload: { rank: updatedRankings.length }
        });
      }

      // Determine next turn: extra turn on rolling 6 or capturing a token
      const extraTurn = (roll === 6) || captured;
      let nextPlayerId = playerId;
      let nextTurnIndex = currentState.turnIndex;
      let consecutiveSixes = currentState.gameSpecificState.consecutiveSixes;
      let nextTurnOrder = [...currentState.turnOrder];

      if (isFinished && rankingsChanged) {
        if (currentState.turnOrder.length > 2) {
          // Remove from turn order
          nextTurnOrder = currentState.turnOrder.filter(id => id !== playerId);
          
          // Calculate who goes next in the old turnOrder list
          const rawNextIndex = extraTurn ? currentState.turnIndex : (currentState.turnIndex + 1) % currentState.turnOrder.length;
          const rawNextPlayerId = currentState.turnOrder[rawNextIndex];
          
          // Locate that player index in the new list
          nextTurnIndex = nextTurnOrder.indexOf(rawNextPlayerId);
          if (nextTurnIndex === -1) {
            nextTurnIndex = 0;
          }
          nextPlayerId = nextTurnOrder[nextTurnIndex];
          consecutiveSixes = 0;
        } else {
          // Only 1 player left. Add them to rankings and end game.
          const lastPlayerId = currentState.turnOrder.find(id => id !== playerId);
          if (lastPlayerId && !updatedRankings.includes(lastPlayerId)) {
            updatedRankings.push(lastPlayerId);
            events.push({
              type: 'PLAYER_FINISHED',
              playerId: lastPlayerId,
              payload: { rank: updatedRankings.length }
            });
          }
          nextTurnOrder = [];
        }
      } else {
        // Standard turn advancement
        if (!extraTurn) {
          nextTurnIndex = (currentState.turnIndex + 1) % currentState.turnOrder.length;
          nextPlayerId = currentState.turnOrder[nextTurnIndex];
          consecutiveSixes = 0; // Reset consecutive sixes on normal turn pass
        } else {
          // If it was a capture and not a 6, we reset consecutive sixes
          if (roll !== 6) {
            consecutiveSixes = 0;
          }
        }
      }

      const nextState: LudoState = {
        ...currentState,
        activePlayerId: nextPlayerId,
        turnOrder: nextTurnOrder,
        turnIndex: nextTurnIndex,
        subState: 'WAITING_FOR_ROLL',
        gameSpecificState: {
          ...currentState.gameSpecificState,
          tokens: updatedTokens,
          consecutiveSixes,
          rankings: updatedRankings
        }
      };

      return {
        isValid: true,
        newState: nextState,
        events
      };
    }

    return { isValid: false, error: 'Unknown action type.', events: [] };
  }

  public getPlayerState(currentState: LudoState, playerId: string): Record<string, any> {
    return currentState; // Ludo is open state
  }

  public checkWinConditions(currentState: LudoState): string | null {
    const rankings = currentState.gameSpecificState.rankings || [];
    if (rankings.length >= currentState.players.length || currentState.turnOrder.length <= 1) {
      return rankings[0] || null;
    }
    return null;
  }

  private hasValidMoves(state: LudoState, playerId: string, roll: number): boolean {
    const tokens = state.gameSpecificState.tokens[playerId];
    for (let i = 0; i < 4; i++) {
      if (this.isValidMove(state, playerId, i, roll)) {
        return true;
      }
    }
    return false;
  }

  private getPlayerBaseIndex(state: LudoState, playerId: string): number {
    const player = state.players.find(p => p.id === playerId);
    const color = player?.color;
    
    const maxPlayers = state.gameSpecificState.maxPlayers || 4;
    const colors = maxPlayers === 6
      ? ['#d90429', '#fb8500', '#ffb703', '#38b000', '#00b4d8', '#7b2cbf']
      : ['#d90429', '#38b000', '#ffb703', '#00b4d8'];
      
    if (color) {
      const idx = colors.indexOf(color);
      if (idx !== -1) return idx;
    }
    
    return state.players.findIndex(p => p.id === playerId);
  }

  private isValidMove(state: LudoState, playerId: string, tokenIndex: number, roll: number): boolean {
    const tokens = state.gameSpecificState.tokens[playerId];
    const currentPos = tokens[tokenIndex];

    const maxPlayers = state.gameSpecificState.maxPlayers || 4;
    const trackLength = maxPlayers === 6 ? 78 : 52;
    const maxPos = trackLength + 5;

    if (currentPos === maxPos) {
      return false; // Already home
    }

    if (currentPos === -1) {
      return roll === 6; // Requires a 6 to release from base
    }

    if (currentPos >= 0 && currentPos <= (trackLength - 1)) {
      // On track: check path constraints
      const playerIdx = this.getPlayerBaseIndex(state, playerId);
      const startCell = playerIdx * 13;
      const stepsTaken = (currentPos - startCell + trackLength) % trackLength;
      return (stepsTaken + roll) <= maxPos; // Max is home
    }

    if (currentPos >= trackLength && currentPos <= (trackLength + 4)) {
      // On home stretch: must land exactly on home
      return (currentPos + roll) <= maxPos;
    }

    return false;
  }
}
