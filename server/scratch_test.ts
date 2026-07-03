import { SnakesLaddersRuleset } from './src/engine/snakesLadders';

const ruleset = new SnakesLaddersRuleset();
const state = ruleset.initialize([{ id: 'p1', name: 'Player 1', isBot: false }], {}, 12345);
console.log("LADDERS:", JSON.stringify(state.gameSpecificState.ladders));
console.log("SNAKES:", JSON.stringify(state.gameSpecificState.snakes));
