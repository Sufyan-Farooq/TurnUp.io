# TurnUp.io — Full redesign brief (proposed)

Status: visual direction confirmed by user delegation on 2026-09-26. The Game Kit implementation follows this brief; this document is not a game-rules change.

## Job, audience, outcome

TurnUp serves two equally important sessions: friends entering a private room through an invite and players discovering a public room. Both should reach a match quickly, understand the game state without deciphering chrome, and trust that visible moves match the server's rules. The primary success measure is whether a player can identify whose turn it is, what action is legal, what just happened, and where to look next in every game, on desktop and mobile.

The product-specific strength is one live room system for four different games. The redesign should make that feel like one coherent destination without flattening Ludo, UNO, Monopoly, and Snakes & Ladders into the same generic board skin.

## Selected visual direction: The Game Kit

Each game is a distinct, mathematically correct playfield seated in one recognizable TurnUp kit. The first viewport of a live match is a large, centered board. A stable, narrow perimeter carries player identity, turn status, the next action, connection state, chat access, and a compact event ledger. Materials evoke a contemporary tabletop kit—quiet felt-like field, precise printed labels, tactile pieces—but never displace playable area. Motion explains events rather than decorates them: a die settles on its actual result, a pawn travels cell-by-cell, a card lands in the correct pile, and an UNO reverse visibly changes the direction indicator.

The approved room composition is `.impeccable/mocks/room-approved.png`: a large board field, a stable player/action rail, and visible room chat that never covers the board. The user delegated composition choice and authorized implementation. The image establishes hierarchy and material, **not** valid Ludo path geometry, exact player colors, chat data, or production copy. Those must come from tested game-state geometry and real UI content. Its decorative copy and avatar photos are not required; the placement and proportions are. The [Richup.io](https://richup.io/) reference informs board prominence and low-friction entry, not copied branding, layout, or assets.

## Experience map

1. **Enter:** one dominant Play action; public rooms and private invite/code entry are immediately legible alternatives. Show game choice with genuine board previews, not generic icon cards.
2. **Prepare:** room settings disclose what will change the match. Players, bots, ready state, privacy, and game rules remain visible and correctly synchronized. A guest can understand how to join without unnecessary account friction.
3. **Play:** board first. Keep one primary action at a time and retain a stable place for player list, turn/direction/status, connection recovery, chat, and recent moves. Chat is a must-have, not a secondary feature to remove. On desktop it has a persistent, discoverable entry; on mobile it opens in a reachable drawer/sheet that never silently covers the current decision. Keep the complete game log separate from conversation so neither becomes noisy or misleading.
4. **Finish:** clear outcome, how it was reached, rematch and room-return actions, plus honest handling of disconnects or abandoned matches. Keep room chat available while players decide whether to rematch or leave.

## Board-specific commitments

- **Ludo:** six-player matches use six equal radial sides with each home, track, safe cell, finish lane, and center mapped by one authoritative geometry model. Four pawns per player have distinct home sockets and non-overlapping on-track positions; legal destinations and captures are visible before selection. Two- and four-player modes remain balanced and centered.
- **UNO:** player ring, draw/discard piles, active color, direction, penalties, and turn order occupy stable positions. Reverse changes both turn logic and the visible direction indicator. A persistent chronological log covers plays, draws, color choices, skips, reverses, penalties, and UNO calls. The hand, deck, and discard pile must never visually collapse into a misleading empty state.
- **Monopoly:** the board remains centered within the available viewport at practical zoom. Property names, prices, ownership, player tokens, and location stay legible; stacked pawns separate enough to count. The action area distinguishes roll, buy/pass, auction, trade, and jail decisions, and the event ledger makes money movement explainable. Dice animation must visibly settle on the server-authoritative values with no last-frame swap.
- **Snakes & Ladders:** a numbered, readable grid with unambiguous start/finish, snake and ladder endpoints, legal pawn positions, and a clear cell-by-cell move path. Player positions remain distinguishable on shared cells.

## Cross-game interaction rules

- A turn has explicit phases: waiting, your decision, animating, resolving, and next turn. Bot actions are paced, but their delay never hides a blocked or disconnected game.
- Every consequential animation has a reduced-motion equivalent, consistent final state, and no false preview of a result.
- Server state is authoritative. Local visuals may anticipate movement only when they can reconcile safely; reconnects, stale actions, and duplicate events need explicit handling.
- Settings are grouped by effect (room access, match rules, bots, appearance, audio/motion) and provide immediate confirmation or a clear reason they cannot change mid-match.
- The activity log is structured data with timestamps/turn order and accessible text, not a decorative afterthought.
- Chat remains real-time and room-scoped from lobby through match end. It needs readable sender identity, message ordering, sending/failure feedback, unread counts, keyboard focus management, and reconnection behavior that neither duplicates nor silently loses visible messages.

## Layout and content ranges

Desktop prioritizes board scale, then a slim action/player rail with an always-visible chat entry and unread indicator. Tablet and phone keep the board within the viewport with deliberate zoom/pan where necessary; action controls stay reachable and logs/chat become distinct drawers rather than overlays across active cells. Plan for 2–6 Ludo players, 2–10 UNO players if supported by the engine, 2–8 Monopoly players if supported, variable bot counts, long names, empty public-room lists, full public-room lists, spectators if supported, and intermittent connections. Confirm exact per-game player limits from server code before implementation rather than treating these planning ranges as rules.

## Delivery and verification

Build order: (1) shared room shell and state vocabulary, (2) one rules-correct board prototype and responsive layout, (3) remaining three boards, (4) lobby/landing/settings, (5) motion, accessibility, performance, and visual QA. Each game needs deterministic geometry/state tests, multiplayer reconnect and bot-turn tests, keyboard and touch checks, reduced-motion checks, and side-by-side screenshots at desktop, tablet, and phone sizes. A generated concept image is never a source for board math.

Keep existing backend rules unless a specific defect is established and tested. Any removed capability or rule change requires a separately named decision; broad design freedom is not a license to silently discard a game or hide a broken feature.

## Open confirmation

The Game Kit is selected by the user's delegation. The production design must include chat access and tested board geometry. Exact board geometry, breakpoint behavior, and retained capabilities are validated during the build.
