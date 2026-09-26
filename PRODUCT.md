# TurnUp.io Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
Private groups of friends and players joining public rooms are equally important audiences. They arrive to start or join a real-time multiplayer game and understand what is happening throughout play.

## Product Purpose
TurnUp.io is a browser-based multiplayer game portal. The current product offers Ludo, Uno, Monopoly, and Snakes & Ladders. The redesign's primary outcome is clearer, more enjoyable gameplay across all four boards, alongside a stronger general website experience.

## Positioning
The current product combines several familiar turn-based games in one real-time room system. Its distinct future position is not yet confirmed; the redesign plan must not invent competitive claims.

## Operating Context
Players can create or join rooms, use public room discovery or private invitations, configure a lobby, and then play synchronized turns. The existing app supports guest and registered identities, bots, chat, event logs, and desktop and mobile web layouts.

## Capabilities and Constraints
- Preserve the four games as the core redesign scope because the user specifically requested better boards for each one.
- Room chat is a binding requirement. It must remain usable before, during, and after matches on desktop and mobile without obscuring the board or active decision.
- Current authentication, rooms, bots, settings, statistics, and game rules are implementation facts, not binding redesign commitments. The user delegated decisions about changing them; any proposed removal or rule change needs an explicit rationale in the plan.
- Keep game outcomes, current turn, legal actions, and multiplayer synchronization clear and trustworthy during any interface redesign.
- Existing stack: React, TypeScript, Vite, Socket.io, Express, Prisma, PostgreSQL. The current request is for a redesign plan, not implementation.

## Brand Commitments
The product is currently named TurnUp.io. The user gave broad freedom to rethink the current identity; no palette, typography, or logo is confirmed as mandatory.

## Evidence on Hand
- Current implementation and assets in `client/src/` and `assets/`.
- Prior user screenshots identify board-centering, pawn placement, dice feedback, bot pacing, UNO direction/logs, and lobby-state clarity as pain points.
- [Richup.io](https://richup.io/) is a user-supplied comparison for board-focused online play and the general website experience, not a visual identity to copy.
- No verified testimonials, pricing, usage metrics, or user research are supplied.

## Product Principles
1. Put the playable board and the next meaningful action at the center of each game.
2. Make turn, direction, ownership, penalties, and consequences legible without requiring the activity log.
3. Make both public-room discovery and private-group entry feel direct.
4. Share interaction patterns across games while respecting each game's distinct geometry and mechanics.
5. Keep waiting, reconnecting, bot turns, and completed-match states honest and understandable.
6. Keep conversation available in every room state, with clear unread and delivery feedback that does not interrupt play.
