/**
 * Game-log formatting + sound-cue mapping for `game_state_update` events.
 *
 * This is the presentational half of the old App.tsx `game_state_update`
 * handler: `useGameState` owns the authoritative `GameState`, while this
 * module turns each `GameEvent` into the human-readable log line (and the
 * optional sound cue) that the sidebar log / MobileLogDrawer render.
 */
import { MONOPOLY_BOARD } from '../games/monopoly/boardData';
import type { GameEvent } from '../../types/game';

/** Keyword-driven accent styling for a log line (verbatim from App.tsx). */
export const getLogStyles = (log: string): { borderLeft: string; background: string } => {
  const normalized = log.toLowerCase();
  if (
    normalized.includes('bought') ||
    normalized.includes('won') ||
    normalized.includes('success') ||
    normalized.includes('released') ||
    normalized.includes('reached home')
  ) {
    return { borderLeft: '3.5px solid var(--accent-green)', background: 'rgba(56, 176, 0, 0.05)' };
  }
  if (
    normalized.includes('paid') ||
    normalized.includes('tax') ||
    normalized.includes('bankruptcy') ||
    normalized.includes('forfeited') ||
    normalized.includes('captured')
  ) {
    return { borderLeft: '3.5px solid var(--accent-pink)', background: 'rgba(217, 4, 41, 0.05)' };
  }
  if (
    normalized.includes('jail') ||
    normalized.includes('chance') ||
    normalized.includes('challenge') ||
    normalized.includes('drew') ||
    normalized.includes('uno!')
  ) {
    return { borderLeft: '3.5px solid var(--accent-gold)', background: 'rgba(255, 183, 3, 0.05)' };
  }
  return { borderLeft: '3.5px solid var(--accent-blue)', background: 'rgba(0, 180, 216, 0.05)' };
};

/** Files that actually exist under `client/public/sounds/`. */
export const SOUNDS = {
  yourTurn: '_your-turn.mp3',
  dice: 'dice.mp3',
  gameStart: 'game-start.mp3',
  bid: 'bid.mp3',
  tradeAccept: 'trade-accept.mp3',
  tradeDecline: 'trade-decline.mp3',
  mortgage: 'mortgage_sharp-592.mp3',
  mortgageLift: 'mortgage-lift_just-saying-593.mp3',
  chatIn: 'chat-in.mp3',
  chatOut: 'chat-out.mp3',
} as const;

/** Fire-and-forget audio cue; autoplay rejections are swallowed (as before). */
export const playSound = (soundFile: string) => {
  try {
    const audio = new Audio(`/sounds/${soundFile}`);
    audio.volume = 0.5;
    audio.play().catch((err) => console.log('Audio playback blocked or failed:', err));
  } catch (e) {
    console.error('Audio failed to initialize:', e);
  }
};

/** Event type -> sound cue, for the events that have a real asset. */
const EVENT_SOUNDS: Record<string, string> = {
  DICE_ROLLED: SOUNDS.dice,
  AUCTION_BID: SOUNDS.bid,
  TRADE_ACCEPTED: SOUNDS.tradeAccept,
  TRADE_REJECTED: SOUNDS.tradeDecline,
  PROPERTY_MORTGAGED: SOUNDS.mortgage,
  PROPERTY_UNMORTGAGED: SOUNDS.mortgageLift,
};

export const getEventSound = (eventType: string): string | undefined => EVENT_SOUNDS[eventType];

export interface LogFormatContext {
  /** Resolve a player id to a display name (room players, then game players). */
  getPlayerName: (id: string) => string;
  /** The room's current game type, used to disambiguate TOKEN_MOVED. */
  gameType?: string;
}

const propName = (spaceIndex: number) => MONOPOLY_BOARD[spaceIndex]?.name || 'Property';

/**
 * Formats one `GameEvent` into its log line, or null when the event produces
 * no log output. Mirrors the original ~30-case switch 1:1.
 */
export function formatGameEvent(evt: GameEvent, ctx: LogFormatContext): string | null {
  const payload = evt.payload || {};
  const name = ctx.getPlayerName(evt.playerId || payload.playerId);

  switch (evt.type) {
    case 'DICE_ROLLED':
      if (payload.value !== undefined) {
        return `${name} rolled a ${payload.value}.`;
      }
      if (payload.die1 !== undefined) {
        return `${name} rolled [${payload.die1}, ${payload.die2}] (Total: ${payload.total})${payload.isDoubles ? ' - DOUBLES!' : ''}`;
      }
      return null;
    case 'CLIMB_LADDER':
      return `${name} climbed a ladder from ${payload.base} to ${payload.top}!`;
    case 'SLIDE_SNAKE':
      return `Ouch! ${name} slid down a snake from ${payload.head} to ${payload.tail}.`;
    case 'TOKEN_RELEASED':
      return `LUDO: ${name} released Token ${payload.tokenIndex + 1} from base.`;
    case 'TOKEN_MOVED': {
      if (ctx.gameType === 'LUDO') {
        return `LUDO: ${name} moved Token ${payload.tokenIndex + 1} to position ${payload.to}.`;
      }
      if (ctx.gameType === 'SNAKES_LADDERS') {
        const path = payload.path || [];
        const toVal = path.length > 0 ? path[path.length - 1] : 'unknown';
        return `${name} moved to tile ${toVal}.`;
      }
      return `${name} moved to position ${payload.to}.`;
    }
    case 'TOKEN_CAPTURED':
      return `LUDO: ${name}'s Token ${payload.tokenIndex + 1} was CAPTURED by ${ctx.getPlayerName(payload.capturedBy)}! Sent back to base.`;
    case 'TOKEN_HOME':
      return `LUDO: ${name}'s Token ${payload.tokenIndex + 1} reached HOME!`;
    case 'TURN_FORFEITED':
      return `LUDO: ${name} forfeited turn: ${payload.reason}.`;
    case 'NO_VALID_MOVES':
      return `LUDO: ${name} rolled ${payload.roll} but has no valid moves.`;
    case 'CARDS_DRAWN':
      return `UNO: ${name} drew ${payload.count} card(s)${payload.wasPenalty ? ' as penalty' : ''}.`;
    case 'CARD_PLAYED':
      return `UNO: ${name} played ${payload.card.color.toUpperCase()} ${payload.card.value.toUpperCase()} (Next suit: ${payload.nextColor.toUpperCase()}).`;
    case 'PLAYER_SKIPPED':
      return `UNO: ${name} was SKIPPED.`;
    case 'DIRECTION_REVERSED':
      return `UNO: ${name} reversed play${payload.direction === 1 ? ' — now clockwise' : payload.direction === -1 ? ' — now counter-clockwise' : ''}.`;
    case 'PLAYER_PASSED':
      return `UNO: ${name} passed.`;
    case 'NO_CARDS_TO_DRAW':
      return `UNO: ${name} could not draw; the deck is empty.`;
    case 'PLAYER_FINISHED':
      return `${ctx.gameType === 'LUDO' ? 'LUDO' : 'UNO'}: ${name} finished in place ${payload.rank}.`;
    case 'UNO_DECLARED':
      return `UNO: ${name} declared UNO!`;
    case 'UNO_CHALLENGE_SUCCESS':
      return `UNO: Challenge SUCCESS by ${name}! ${ctx.getPlayerName(payload.target)} draws ${payload.penaltyCardsCount} penalty cards.`;
    case 'UNO_CHALLENGE_FAILED':
      return `UNO: Challenge against ${ctx.getPlayerName(payload.target)} FAILED by ${name}! ${name} draws ${payload.penaltyCardsCount} penalty cards.`;
    case 'PLAYER_MOVED':
      return `MONOPOLY: ${name} moved from tile ${payload.from} to ${payload.to}.`;
    case 'PROPERTY_BOUGHT':
      return `MONOPOLY: ${name} bought ${propName(payload.spaceIndex)} for $${payload.price}.`;
    case 'PROPERTY_MORTGAGED':
      return `MONOPOLY: ${name} mortgaged ${propName(payload.spaceIndex)} for $${payload.value}.`;
    case 'PROPERTY_UNMORTGAGED':
      return `MONOPOLY: ${name} unmortgaged ${propName(payload.spaceIndex)} for $${payload.cost}.`;
    case 'PROPERTY_SOLD':
      return `MONOPOLY: ${name} sold ${propName(payload.spaceIndex)} back to the bank for $${payload.refund}.`;
    case 'HOUSE_BUILT':
      return `MONOPOLY: ${name} built house/hotel on ${propName(payload.spaceIndex)} (Total: ${payload.housesCount}).`;
    case 'HOUSE_SOLD':
      return `MONOPOLY: ${name} sold house/hotel on ${propName(payload.spaceIndex)} for $${payload.refund}.`;
    case 'RENT_PAID':
      return `MONOPOLY: ${name} paid $${payload.rent} rent on ${propName(payload.spaceIndex)} to ${ctx.getPlayerName(payload.recipient)}.`;
    case 'TAX_PAID':
      return `MONOPOLY: ${name} paid $${payload.fine} for ${payload.name}.`;
    case 'SENT_TO_JAIL':
      return `MONOPOLY: ${name} was sent to Jail (${payload.reason}).`;
    case 'JAIL_RELEASED':
      return `MONOPOLY: ${name} was released from Jail (${payload.reason}).`;
    case 'AUCTION_STARTED':
      return `MONOPOLY: Auction started for ${propName(payload.spaceIndex)}!`;
    case 'AUCTION_BID':
      return `MONOPOLY: ${name} bid $${payload.amount}.`;
    case 'AUCTION_FOLDED':
      return `MONOPOLY: ${name} folded from the auction.`;
    case 'AUCTION_RESOLVED':
      return `MONOPOLY: ${name} won the auction for ${propName(payload.spaceIndex)} at $${payload.price}!`;
    case 'AUCTION_CANCELLED':
      return `MONOPOLY: Auction for ${propName(payload.spaceIndex)} cancelled with no bids.`;
    case 'TRADE_INITIATED':
      return `MONOPOLY: ${name} proposed a trade to ${ctx.getPlayerName(payload.targetPlayerId)}.`;
    case 'TRADE_REJECTED':
      return `MONOPOLY: Trade proposal between ${ctx.getPlayerName(payload.proposerId)} and ${ctx.getPlayerName(payload.receiverId)} was rejected.`;
    case 'TRADE_ACCEPTED':
      return `MONOPOLY: Trade proposal between ${ctx.getPlayerName(payload.proposerId)} and ${ctx.getPlayerName(payload.receiverId)} was ACCEPTED!`;
    case 'TRADE_STAYED':
      return null;
    case 'JAIL_STAY':
      return `MONOPOLY: ${name} remains in Jail (Turn ${payload.turns}/3).`;
    case 'CHANCE_CARD':
      return `MONOPOLY: ${name} drew card: "${payload.text}".`;
    case 'BANKRUPTCY_DECLARED':
      return `MONOPOLY: ${name} DECLARED BANKRUPTCY!`;
    default:
      return null;
  }
}

/** Opening log line for a freshly started game, keyed by game type. */
export function getGameStartMessage(gameType: string | undefined): string {
  switch (gameType) {
    case 'SNAKES_LADDERS':
      return 'Game Started! The race to 100 has begun.';
    case 'LUDO':
      return 'Ludo Started! Move all 4 tokens to home to win.';
    case 'UNO':
      return 'Uno Started! Empty your hand to win.';
    case 'MONOPOLY':
      return 'Monopoly Started! Bankrupt your opponents to win.';
    default:
      return 'Game Started!';
  }
}
