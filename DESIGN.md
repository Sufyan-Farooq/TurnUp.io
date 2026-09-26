---
name: TurnUp.io Game Kit
description: A board-first, contemporary tabletop interface for shared online play.
colors:
  ink: "#0d1925"
  ink-soft: "#132532"
  ink-panel: "#1a2d39"
  ink-input: "#10222d"
  field: "#0b1923"
  board-stage: "#0a1720"
  gold: "#f0bc64"
  teal: "#73bbaa"
  coral: "#e18476"
  cloud: "#f4f0e7"
  cloud-dim: "#d5dcd8"
  muted: "#aebfc2"
typography:
  display:
    fontFamily: "Fredoka, sans-serif"
    fontSize: "clamp(48px, 6.2vw, 96px)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontWeight: 400
    lineHeight: 1.55
  utility:
    fontFamily: "Space Mono, monospace"
rounded:
  control: "9px"
  board: "10px"
  card: "12px"
  button: "14px"
  panel: "16px"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "13px 28px"
  room-panel:
    backgroundColor: "{colors.ink-panel}"
    textColor: "{colors.cloud}"
    rounded: "{rounded.card}"
---

# Design System: TurnUp.io Game Kit

## Overview

**Creative North Star: "The Game Kit"**

TurnUp should feel like a contemporary shared tabletop: a quiet, dark field around precise, tactile game pieces. The board is the hero, while identity, status, actions, conversation, and recent activity live in predictable supporting positions. The system is mostly restrained; warm gold signals the next meaningful action, and game-specific color explains mechanics rather than decorating every surface.

The Game Kit serves private groups and public rooms equally. A visitor should reach play quickly; a player should see the current turn, legal action, and result without parsing the chat. Room chat is a permanent product capability before, during, and after a match. Its placement may adapt, but it must not disappear or obscure a live decision.

**Key Characteristics:** board-first proportions; dark teal/navy surfaces with warm cream text; gold action emphasis; compact, readable supporting chrome; distinct rules-correct geometry for each game.

## Colors

The final Game Kit palette is defined by the frontmatter and the later `:root` declarations in `client/src/index.css`. Earlier violet/indigo declarations in that file are compatibility history, not the intended palette for new work.

### Primary

- **Warm Table Gold:** the primary action, active tab underline, focus outline, turn cue, and selected board moments. Use it sparingly enough that the next action remains obvious.
- **Felt Teal:** secondary interactive emphasis and links where gold would compete with a primary decision.

### Secondary

- **Soft Coral:** alerts, failed delivery, unread chat, and other states requiring attention. Do not use it as a generic ornament.

### Neutral

- **Deep Ink / Soft Ink / Panel Ink:** application background and layered controls. Tonal changes and fine borders separate regions without bright boxes around everything.
- **Cloud / Dim Cloud / Muted:** primary text, supporting text, and low-priority metadata. Do not rely on low-opacity text for turn-critical information.
- **Field / Board Stage:** the dedicated area behind game geometry. The cells, cards, and pieces must remain brighter and more legible than their surrounding field.

**The Board Color Rule.** Player colors, UNO card colors, Monopoly ownership, and Snakes & Ladders routes are semantic game data. Preserve their distinctions and never replace them wholesale with the shell accent.

## Typography

**Display Font:** Fredoka (sans-serif fallback). **Body Font:** Manrope (sans-serif fallback). **Utility Font:** Space Mono (monospace fallback).

Fredoka makes entry and major calls to action approachable. Manrope carries game-state labels, rules, chat, and controls. Monospace is reserved for compact numeric or coded utility information where alignment matters. These families are imported in `client/src/index.css`.

The landing headline uses the display token above, balanced across a short measure; at tablet and phone widths it reduces through responsive rules rather than shrinking the entire page. Body copy is generally one to two readable lines in cards and up to roughly 48 characters in the landing introduction. Small uppercase kickers may label status or sections, but legal moves, prices, card values, and action labels must remain readable without relying on tiny utility type.

**The State Before Slogan Rule.** Inside a match, type hierarchy first identifies the game, turn, decision, and result. Personality lives in secondary copy, never in an ambiguous action label.

## Layout

The live room is a board stage plus a stable rail. On wider screens, the board takes the flexible majority of the viewport and the right rail occupies `clamp(316px, 23vw, 370px)`. The rail holds player/room state above a Chat / Activity tabbed section; the action dock is attached to that rail. The top HUD is deliberately shallow (`min-height: 56px`). A completed-game result covers only the board region so room chat remains available.

At `1100px` and below, room chat becomes a focus-managed drawer reached by a floating control with unread count. The persistent secondary rail section and rail action dock are hidden; the action dock moves into the main game region. At `900px` and below the right rail itself is hidden and the board receives the available width. At `640px` and below, outer board padding and corner treatment recede for usable play area. Individual game boards have their own smaller-screen adjustments, typically around `720px`, rather than sharing a fake universal geometry.

The landing page uses a two-column introduction/entry layout with a CSS-made tabletop motif. At `940px` it becomes one column and removes that decoration; at `640px` it compresses copy and card spacing. Public rooms and game choices use readable rows/cards, becoming one column at narrow phone widths. Scroll the board or a supporting panel only when necessary; never scale interactive cells until targets or labels become unusable.

**The Board First Rule.** Supporting rails, logs, and chat may yield space, but the active game board and decision may not be covered by persistent chrome.

## Elevation & Depth

Depth is mainly tonal: near-black board field, slightly lighter rail and panels, fine warm borders, then bright pieces and controls. Shadows are structural on raised cards, tokens, dice, drawers, and the landing table; they are not a universal glow. The current room HUD explicitly removes its shadow, while the mobile chat drawer uses a stronger cast shadow to establish its temporary layer.

**The Tactile Only Rule.** Add a shadow when an element behaves like a physical piece or a raised temporary surface. Do not add diffuse neon glows to every panel.

## Shapes

The shell uses gently rounded rectangles: compact controls and tabs, medium board containers/cards, and larger entry/result panels. The principal radii are in the frontmatter. Board geometry is game-specific: Ludo's radial sides, UNO's cards and table ring, Monopoly's perimeter squares, and Snakes & Ladders' numbered grid must follow their rules rather than a decorative generic grid. Pawns and markers are circular or token-like with enough separation to count when several players share a cell.

## Components

### Primary and secondary actions

The shared primary button is a warm gold, dark-text, rounded control; individual games may use a more tactile gold die/roll treatment. Buttons show hover/press feedback but never preview a false game result. Secondary and ghost controls sit back visually. A visible gold keyboard focus outline applies to buttons, links, inputs, and selects at the shell level; game boards also define local high-contrast focus treatments. Disabled actions are visibly muted and explain their unavailability in adjacent state text where relevant.

### Board stage and action dock

The board stage provides a quiet, dark field and minimal padding; each game owns its accurate cells, cards, pieces, and interaction affordances. The dock presents the currently legal action and its context in a stable place. Loading, bot turn, animation, and waiting states must be explicit. Dice and piece motion must settle on the authoritative result, not visually suggest a different outcome at the last frame.

### Room rail, chat, and activity

The rail keeps player identity and active status separate from conversation. Chat and structured activity use labeled tabs on desktop; chat has a separate mobile drawer with a close control, focus return, unread count, delivery/error feedback, timestamps, and reconnection information. The full activity record is not a substitute for chat, and chat must remain available after the match-result overlay appears.

### Entry, public rooms, and game choice

The landing entry card is a raised ink panel beside a typographic invitation. Inputs use dark inset surfaces and a gold focus treatment. Public rooms use bordered rows with clear joining actions and explicit empty, loading, or error states. Game choices are actual buttons, not decorative tiles; they use the same panel language and game-specific accents only for identification.

### Motion and accessibility

Motion communicates a state change: dice settling, pieces moving, UNO direction reversing, card selection, or a drawer entering. Each board stylesheet and the shared stylesheet include `prefers-reduced-motion` handling. Keep the same final state and text explanation when animation is reduced. Status, legal action, ownership, and outcome cannot be color-only; keyboard focus must remain visible and mobile controls reachable.

## Do's and Don'ts

### Do:

- **Do** make the board and the next legal action the first two things a player can locate.
- **Do** keep chat accessible in lobby, live play, and completed matches, with clear send and connection feedback.
- **Do** use game-specific color and geometry to explain rules and player state.
- **Do** retain readable text, visible focus, and a reduced-motion path for every consequential animation.

### Don't:

- **Don't** place a persistent overlay across playable cells or hide chat as an optional afterthought.
- **Don't** use the old violet/neon palette as a model for new shared surfaces; some older selectors still contain those values and should be treated as migration debt.
- **Don't** invent board paths, pawn positions, dice faces, or card outcomes to match a visual concept. Rules and synchronized state are authoritative.
- **Don't** let decorative motion, tiny uppercase labels, or color alone carry a critical turn or error message.
