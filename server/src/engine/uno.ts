import { IGameRuleset, GameState, GameAction, ActionResult, IPlayer, GameEvent } from './interfaces';
import { DeterministicRNG } from './rng';

export interface UnoCard {
  color: 'red' | 'green' | 'blue' | 'yellow' | 'wild';
  value: string; // '0'-'9', 'skip', 'reverse', 'draw2', 'wild', 'wildDraw4'
}

export interface UnoState extends GameState {
  gameSpecificState: {
    hands: Record<string, UnoCard[]>;
    deck: UnoCard[];
    discardPile: UnoCard[];
    currentCard: UnoCard;
    currentColor: 'red' | 'green' | 'blue' | 'yellow';
    direction: number; // 1 or -1
    pendingDrawCount: number;
    unoDeclared: Record<string, boolean>;
    rankings?: string[];
    rules?: {
      cardStacking: boolean;
      cardDoubles: boolean;
    };
  };
}

export class UnoRuleset implements IGameRuleset<UnoState> {
  public gameType = 'UNO';

  public initialize(players: IPlayer[], config: Record<string, any>, seed: number): UnoState {
    const rng = new DeterministicRNG(seed);
    let deck: UnoCard[] = [];

    // Build standard 108-card deck
    const colors: ('red' | 'green' | 'blue' | 'yellow')[] = ['red', 'green', 'blue', 'yellow'];
    colors.forEach(color => {
      // One 0 card
      deck.push({ color, value: '0' });
      // Two of each 1-9
      for (let i = 1; i <= 9; i++) {
        deck.push({ color, value: i.toString() });
        deck.push({ color, value: i.toString() });
      }
      // Action cards: 2 of each
      deck.push({ color, value: 'skip' });
      deck.push({ color, value: 'skip' });
      deck.push({ color, value: 'reverse' });
      deck.push({ color, value: 'reverse' });
      deck.push({ color, value: 'draw2' });
      deck.push({ color, value: 'draw2' });
    });

    // 4 Wilds and 4 Wild Draw 4s
    for (let i = 0; i < 4; i++) {
      deck.push({ color: 'wild', value: 'wild' });
      deck.push({ color: 'wild', value: 'wildDraw4' });
    }

    // Shuffle deck
    deck = rng.shuffle(deck);

    // Deal 7 cards to each player
    const hands: Record<string, UnoCard[]> = {};
    players.forEach(p => {
      hands[p.id] = [];
      for (let i = 0; i < 7; i++) {
        const card = deck.pop();
        if (card) {
          hands[p.id].push(card);
        }
      }
    });

    // Draw first card for discard pile
    let currentCard = deck.pop()!;
    // Ensure first card is not a Wild Draw 4
    while (currentCard.value === 'wildDraw4') {
      deck.unshift(currentCard);
      deck = rng.shuffle(deck);
      currentCard = deck.pop()!;
    }

    const discardPile: UnoCard[] = [currentCard];
    let currentColor: 'red' | 'green' | 'blue' | 'yellow' = 'red';
    let pendingDrawCount = 0;
    let turnIndex = 0;
    let direction = 1;

    if (currentCard.color !== 'wild') {
      currentColor = currentCard.color;
    } else {
      const colors: ('red' | 'green' | 'blue' | 'yellow')[] = ['red', 'green', 'blue', 'yellow'];
      currentColor = colors[rng.rollRange(0, 3)];
    }

    // Handle starting card actions
    if (currentCard.value === 'skip') {
      turnIndex = 1 % players.length;
    } else if (currentCard.value === 'reverse') {
      direction = -1;
      turnIndex = players.length - 1; // start with last player
    } else if (currentCard.value === 'draw2') {
      pendingDrawCount = 2;
    }

    const turnOrder = players.map(p => p.id);
    const unoDeclared: Record<string, boolean> = {};
    players.forEach(p => {
      unoDeclared[p.id] = false;
    });

    return {
      gameId: config.gameId || 'game_uno',
      gameType: this.gameType,
      status: 'ACTIVE',
      players,
      activePlayerId: turnOrder[turnIndex] || '',
      turnOrder,
      turnIndex,
      subState: 'WAITING_FOR_PLAY',
      rngState: rng.getState().toString(),
      winnerId: null,
      historyLength: 0,
      gameSpecificState: {
        hands,
        deck,
        discardPile,
        currentCard,
        currentColor,
        direction,
        pendingDrawCount,
        unoDeclared,
        rankings: [],
        rules: {
          cardStacking: config.cardStacking !== undefined ? !!config.cardStacking : true,
          cardDoubles: config.cardDoubles !== undefined ? !!config.cardDoubles : true
        }
      }
    };
  }

  public processAction(currentState: UnoState, action: GameAction): ActionResult<UnoState> {
    const { type, playerId, payload } = action;
    const rng = new DeterministicRNG(parseInt(currentState.rngState, 10));

    // Handle out-of-turn actions first
    if (type === 'DECLARE_UNO') {
      const playerHand = currentState.gameSpecificState.hands[playerId];
      if (!playerHand) {
        return { isValid: false, error: 'Player hand not found.', events: [] };
      }

      // Player must have exactly 1 or 2 cards to declare Uno
      if (playerHand.length > 2) {
        return { isValid: false, error: 'You have too many cards to declare UNO.', events: [] };
      }

      const unoDeclared = { ...currentState.gameSpecificState.unoDeclared, [playerId]: true };
      const nextState: UnoState = {
        ...currentState,
        gameSpecificState: {
          ...currentState.gameSpecificState,
          unoDeclared
        }
      };

      return {
        isValid: true,
        newState: nextState,
        events: [{ type: 'UNO_DECLARED', playerId, payload: {} }]
      };
    }

    if (type === 'CHALLENGE_UNO') {
      const targetPlayerId = payload.targetPlayerId;
      if (!targetPlayerId || !currentState.gameSpecificState.hands[targetPlayerId]) {
        return { isValid: false, error: 'Invalid challenge target.', events: [] };
      }

      const targetHand = currentState.gameSpecificState.hands[targetPlayerId];
      const isTargetVulnerable = targetHand.length === 1 && !currentState.gameSpecificState.unoDeclared[targetPlayerId];

      if (isTargetVulnerable) {
        // Challenge success: target draws 2 cards
        const drawResult = this.drawCards(currentState.gameSpecificState.deck, currentState.gameSpecificState.discardPile, 2, rng);
        const updatedHands = { ...currentState.gameSpecificState.hands };
        updatedHands[targetPlayerId] = [...updatedHands[targetPlayerId], ...drawResult.drawnCards];

        const events: GameEvent[] = [
          {
            type: 'UNO_CHALLENGE_SUCCESS',
            playerId,
            payload: { challenger: playerId, target: targetPlayerId, penaltyCardsCount: drawResult.drawnCards.length }
          }
        ];

        const nextState: UnoState = {
          ...currentState,
          rngState: rng.getState().toString(),
          gameSpecificState: {
            ...currentState.gameSpecificState,
            hands: updatedHands,
            deck: drawResult.deck,
            discardPile: drawResult.discardPile
          }
        };

        return { isValid: true, newState: nextState, events };
      } else {
        // Challenge failed: Challenger draws 2 cards as penalty
        const drawResult = this.drawCards(currentState.gameSpecificState.deck, currentState.gameSpecificState.discardPile, 2, rng);
        const updatedHands = { ...currentState.gameSpecificState.hands };
        updatedHands[playerId] = [...updatedHands[playerId], ...drawResult.drawnCards];

        const events: GameEvent[] = [
          {
            type: 'UNO_CHALLENGE_FAILED',
            playerId,
            payload: { challenger: playerId, target: targetPlayerId, penaltyCardsCount: drawResult.drawnCards.length }
          }
        ];

        const nextState: UnoState = {
          ...currentState,
          rngState: rng.getState().toString(),
          gameSpecificState: {
            ...currentState.gameSpecificState,
            hands: updatedHands,
            deck: drawResult.deck,
            discardPile: drawResult.discardPile
          }
        };

        return { isValid: true, newState: nextState, events };
      }
    }

    // In-turn validation
    if (playerId !== currentState.activePlayerId) {
      return { isValid: false, error: 'Not your turn.', events: [] };
    }

    if (type === 'DRAW_CARD') {
      if (currentState.subState === 'PLAY_OR_PASS') {
        // Passing in PLAY_OR_PASS. We do NOT draw another card.
        const nextTurnIndex = this.getNextTurnIndex(currentState);
        const nextPlayerId = currentState.turnOrder[nextTurnIndex];
        const events = [{ type: 'PLAYER_PASSED', playerId, payload: {} }];

        const nextState: UnoState = {
          ...currentState,
          activePlayerId: nextPlayerId,
          turnIndex: nextTurnIndex,
          subState: 'WAITING_FOR_PLAY',
          rngState: rng.getState().toString(),
          gameSpecificState: {
            ...currentState.gameSpecificState,
          }
        };
        return { isValid: true, newState: nextState, events };
      }

      const pendingDraw = currentState.gameSpecificState.pendingDrawCount;
      const updatedHands = { ...currentState.gameSpecificState.hands };
      const playerHand = updatedHands[playerId];

      if (pendingDraw > 0) {
        // Draw the accumulated penalty cards and skip turn
        const drawResult = this.drawCards(currentState.gameSpecificState.deck, currentState.gameSpecificState.discardPile, pendingDraw, rng);
        updatedHands[playerId] = [...playerHand, ...drawResult.drawnCards];

        // Reset unoDeclared since hand size increases
        const unoDeclared = { ...currentState.gameSpecificState.unoDeclared, [playerId]: false };

        const events: GameEvent[] = [
          {
            type: 'CARDS_DRAWN',
            playerId,
            payload: { count: drawResult.drawnCards.length, wasPenalty: true }
          }
        ];

        // Pass turn
        const nextTurnIndex = this.getNextTurnIndex(currentState);
        const nextPlayerId = currentState.turnOrder[nextTurnIndex];

        const nextState: UnoState = {
          ...currentState,
          activePlayerId: nextPlayerId,
          turnIndex: nextTurnIndex,
          subState: 'WAITING_FOR_PLAY',
          rngState: rng.getState().toString(),
          gameSpecificState: {
            ...currentState.gameSpecificState,
            hands: updatedHands,
            deck: drawResult.deck,
            discardPile: drawResult.discardPile,
            pendingDrawCount: 0,
            unoDeclared
          }
        };

        return { isValid: true, newState: nextState, events };
      } else {
        // Draw 1 card
        const drawResult = this.drawCards(currentState.gameSpecificState.deck, currentState.gameSpecificState.discardPile, 1, rng);
        const drawnCard = drawResult.drawnCards[0];

        if (!drawnCard) {
          // If deck and discard pile are empty, pass turn directly without deadlock
          const nextTurnIndex = this.getNextTurnIndex(currentState);
          const nextPlayerId = currentState.turnOrder[nextTurnIndex];
          const events = [{ type: 'NO_CARDS_TO_DRAW', playerId, payload: {} }];

          const nextState: UnoState = {
            ...currentState,
            activePlayerId: nextPlayerId,
            turnIndex: nextTurnIndex,
            subState: 'WAITING_FOR_PLAY',
            rngState: rng.getState().toString(),
            gameSpecificState: {
              ...currentState.gameSpecificState,
              deck: drawResult.deck,
              discardPile: drawResult.discardPile
            }
          };
          return { isValid: true, newState: nextState, events };
        }

        updatedHands[playerId] = [...playerHand, drawnCard];
        const unoDeclared = { ...currentState.gameSpecificState.unoDeclared, [playerId]: false };

        const events: GameEvent[] = [
          {
            type: 'CARDS_DRAWN',
            playerId,
            payload: { count: 1, wasPenalty: false }
          }
        ];

        // Check if the drawn card is playable
        const isPlayable = this.isCardPlayable(drawnCard, currentState.gameSpecificState.currentCard, currentState.gameSpecificState.currentColor);

        if (isPlayable && currentState.subState !== 'PLAY_OR_PASS') {
          // Allow player to play the drawn card or pass
          const nextState: UnoState = {
            ...currentState,
            subState: 'PLAY_OR_PASS',
            rngState: rng.getState().toString(),
            gameSpecificState: {
              ...currentState.gameSpecificState,
              hands: updatedHands,
              deck: drawResult.deck,
              discardPile: drawResult.discardPile,
              unoDeclared
            }
          };
          return { isValid: true, newState: nextState, events };
        } else {
          // If we were already in PLAY_OR_PASS, drawing again acts as a pass.
          // Or if the drawn card is not playable, we pass.
          const nextTurnIndex = this.getNextTurnIndex(currentState);
          const nextPlayerId = currentState.turnOrder[nextTurnIndex];

          const nextState: UnoState = {
            ...currentState,
            activePlayerId: nextPlayerId,
            turnIndex: nextTurnIndex,
            subState: 'WAITING_FOR_PLAY',
            rngState: rng.getState().toString(),
            gameSpecificState: {
              ...currentState.gameSpecificState,
              hands: updatedHands,
              deck: drawResult.deck,
              discardPile: drawResult.discardPile,
              unoDeclared
            }
          };

          return { isValid: true, newState: nextState, events };
        }
      }
    }

    if (type === 'PLAY_CARD') {
      const selectedColor = payload.selectedColor;
      const rules = currentState.gameSpecificState.rules || { cardStacking: true, cardDoubles: true };
      const pendingDraw = currentState.gameSpecificState.pendingDrawCount || 0;

      // Normalize cardIndex vs cardIndices
      let cardIndices: number[] = [];
      if (Array.isArray(payload.cardIndices)) {
        cardIndices = payload.cardIndices;
      } else if (typeof payload.cardIndex === 'number') {
        cardIndices = [payload.cardIndex];
      } else {
        return { isValid: false, error: 'No card selected.', events: [] };
      }

      if (cardIndices.length < 1 || cardIndices.length > 2) {
        return { isValid: false, error: 'Can only play 1 or 2 cards.', events: [] };
      }

      if (cardIndices.length === 2 && !rules.cardDoubles) {
        return { isValid: false, error: 'Playing doubles is disabled.', events: [] };
      }

      const playerHand = currentState.gameSpecificState.hands[playerId];
      if (!playerHand) {
        return { isValid: false, error: 'Player hand not found.', events: [] };
      }

      // Validate indices
      for (const idx of cardIndices) {
        if (idx < 0 || idx >= playerHand.length) {
          return { isValid: false, error: 'Invalid card index.', events: [] };
        }
      }

      if (cardIndices.length === 2 && cardIndices[0] === cardIndices[1]) {
        return { isValid: false, error: 'Cannot play the same card twice.', events: [] };
      }

      if (currentState.subState === 'PLAY_OR_PASS') {
        const drawnCardIndex = playerHand.length - 1;
        if (cardIndices.length !== 1 || cardIndices[0] !== drawnCardIndex) {
          return { isValid: false, error: 'You can only play the drawn card or pass.', events: [] };
        }
      }

      let cardsPlayed = cardIndices.map(idx => playerHand[idx]);
      const currentCard = currentState.gameSpecificState.currentCard;
      const currentColor = currentState.gameSpecificState.currentColor;

      // Handle card stacking validation
      if (pendingDraw > 0) {
        if (rules.cardStacking) {
          // If stacking is allowed, all cards played must be stackable draw cards
          const isStackable = cardsPlayed.every(c => 
            (currentCard.value === 'draw2' && (c.value === 'draw2' || c.value === 'wildDraw4')) ||
            (currentCard.value === 'wildDraw4' && c.value === 'wildDraw4')
          );
          if (!isStackable) {
            return { isValid: false, error: 'You must stack a +2 or +4 card, or draw penalty cards.', events: [] };
          }
        } else {
          return { isValid: false, error: 'You must draw penalty cards first.', events: [] };
        }
      }

      // For doubles, check matching value
      if (cardIndices.length === 2) {
        const [c1, c2] = cardsPlayed;
        if (c1.value !== c2.value) {
          return { isValid: false, error: 'Double cards must have the same value.', events: [] };
        }
        // One of the cards must be playable on discard pile
        const c1Playable = this.isCardPlayable(c1, currentCard, currentColor);
        const c2Playable = this.isCardPlayable(c2, currentCard, currentColor);
        if (!c1Playable && !c2Playable) {
          return { isValid: false, error: 'At least one card must be playable on the discard pile.', events: [] };
        }
        // Ensure card1 is the playable one, if not, swap them so it plays first
        if (!c1Playable && c2Playable) {
          cardsPlayed = [c2, c1];
          cardIndices = [cardIndices[1], cardIndices[0]];
        }
      } else {
        // Single card play validation
        const card = cardsPlayed[0];
        if (!this.isCardPlayable(card, currentCard, currentColor)) {
          return { isValid: false, error: 'This card cannot be played on the current pile.', events: [] };
        }
      }

      // Check wild color selection
      const lastCard = cardsPlayed[cardsPlayed.length - 1];
      if (lastCard.color === 'wild' && !selectedColor) {
        return { isValid: false, error: 'You must select a color for wild cards.', events: [] };
      }
      if (selectedColor && !['red', 'green', 'blue', 'yellow'].includes(selectedColor)) {
        return { isValid: false, error: 'Invalid color selected.', events: [] };
      }

      // Remove cards from player hand
      const updatedHands = { ...currentState.gameSpecificState.hands };
      updatedHands[playerId] = playerHand.filter((_, idx) => !cardIndices.includes(idx));

      // Add to discard pile
      const discardPile = [...currentState.gameSpecificState.discardPile, ...cardsPlayed];

      // Reset or maintain UNO declared status
      const unoDeclared = { ...currentState.gameSpecificState.unoDeclared };
      if (updatedHands[playerId].length > 1) {
        unoDeclared[playerId] = false;
      }

      // Set new currentColor
      const nextColor = lastCard.color === 'wild' ? selectedColor as 'red' | 'green' | 'blue' | 'yellow' : lastCard.color;

      const events: GameEvent[] = [
        {
          type: 'CARD_PLAYED',
          playerId,
          payload: { 
            card: lastCard, 
            nextColor,
            isDouble: cardsPlayed.length === 2,
            cards: cardsPlayed
          }
        }
      ];

      // Calculate next turn index and effects
      let direction = currentState.gameSpecificState.direction;
      let updatedPendingDrawCount = currentState.gameSpecificState.pendingDrawCount;
      let skipCount = 0;

      for (const card of cardsPlayed) {
        if (card.value === 'reverse') {
          if (currentState.players.length === 2) {
            skipCount++;
          } else {
            direction = -direction;
            events.push({ type: 'DIRECTION_REVERSED', playerId, payload: { direction } });
          }
        }

        if (card.value === 'skip') {
          skipCount++;
        } else if (card.value === 'draw2') {
          updatedPendingDrawCount += 2;
        } else if (card.value === 'wildDraw4') {
          updatedPendingDrawCount += 4;
        }
      }

      // Emit PLAYER_SKIPPED events for skipped players
      for (let s = 1; s <= skipCount; s++) {
        const skippedIdx = (currentState.turnIndex + s * direction + currentState.turnOrder.length) % currentState.turnOrder.length;
        events.push({ type: 'PLAYER_SKIPPED', playerId: currentState.turnOrder[skippedIdx], payload: {} });
      }

      // Calculate next turn index
      let nextTurnIndex = (currentState.turnIndex + (1 + skipCount) * direction + currentState.turnOrder.length) % currentState.turnOrder.length;

      const nextPlayerId = currentState.turnOrder[nextTurnIndex];

      // Check if player has finished (hand is empty)
      const isFinished = updatedHands[playerId].length === 0;
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

      let finalActivePlayerId = nextPlayerId;
      let finalTurnIndex = nextTurnIndex;
      let finalTurnOrder = [...currentState.turnOrder];

      if (isFinished && rankingsChanged) {
        if (currentState.turnOrder.length > 2) {
          // Remove finished player from active turn order
          finalTurnOrder = currentState.turnOrder.filter(id => id !== playerId);
          
          // Locate the player index who goes next in the updated turn order
          finalTurnIndex = finalTurnOrder.indexOf(nextPlayerId);
          if (finalTurnIndex === -1) {
            finalTurnIndex = 0;
          }
          finalActivePlayerId = finalTurnOrder[finalTurnIndex];
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
          finalTurnOrder = [];
        }
      }

      const nextState: UnoState = {
        ...currentState,
        activePlayerId: finalActivePlayerId,
        turnOrder: finalTurnOrder,
        turnIndex: finalTurnIndex,
        subState: 'WAITING_FOR_PLAY',
        gameSpecificState: {
          ...currentState.gameSpecificState,
          hands: updatedHands,
          discardPile,
          currentCard: lastCard,
          currentColor: nextColor,
          direction,
          pendingDrawCount: updatedPendingDrawCount,
          unoDeclared,
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

  public getPlayerState(currentState: UnoState, playerId: string): Record<string, any> {
    const hands: Record<string, any> = {};
    Object.entries(currentState.gameSpecificState.hands).forEach(([pid, hand]) => {
      if (pid === playerId) {
        hands[pid] = hand;
      } else {
        hands[pid] = hand.length; // Expose card count only
      }
    });

    return {
      ...currentState,
      gameSpecificState: {
        ...currentState.gameSpecificState,
        hands,
        deck: currentState.gameSpecificState.deck.length, // Hide actual deck cards
      }
    };
  }

  public checkWinConditions(currentState: UnoState): string | null {
    const rankings = currentState.gameSpecificState.rankings || [];
    if (rankings.length >= currentState.players.length || currentState.turnOrder.length <= 1) {
      return rankings[0] || null;
    }
    return null;
  }

  private isCardPlayable(card: UnoCard, currentCard: UnoCard, currentColor: string): boolean {
    if (card.color === 'wild') {
      return true; // Wilds are always playable
    }
    if (card.color === currentColor) {
      return true; // Match color
    }
    if (card.value === currentCard.value) {
      return true; // Match value/type
    }
    return false;
  }

  private getNextTurnIndex(state: UnoState): number {
    const dir = state.gameSpecificState.direction;
    const len = state.turnOrder.length;
    return (state.turnIndex + dir + len) % len;
  }

  private drawCards(deck: UnoCard[], discardPile: UnoCard[], count: number, rng: DeterministicRNG): { drawnCards: UnoCard[], deck: UnoCard[], discardPile: UnoCard[] } {
    let currentDeck = [...deck];
    let currentDiscard = [...discardPile];
    const drawnCards: UnoCard[] = [];

    for (let i = 0; i < count; i++) {
      if (currentDeck.length === 0) {
        // Replenish deck
        if (currentDiscard.length <= 1) {
          break; // Nothing left to draw
        }
        const topCard = currentDiscard.pop()!;
        currentDeck = rng.shuffle(currentDiscard);
        currentDiscard = [topCard];
      }
      const card = currentDeck.pop();
      if (card) {
        drawnCards.push(card);
      }
    }

    return { drawnCards, deck: currentDeck, discardPile: currentDiscard };
  }
}
