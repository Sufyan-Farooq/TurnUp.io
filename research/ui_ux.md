# UI/UX Architecture & Responsive Scaling for a Multi-Game Board Portal

This document outlines the UI/UX architecture and front-end engineering specifications for a responsive multiplayer game portal. It details layout adaptability, viewport scaling, interaction design, and mobile viewport optimizations for different board game geometries, including:
1. **Square Track Geometry** (e.g., Monopoly, Ludo)
2. **Serpentine Grid Geometry** (e.g., Snakes & Ladders)
3. **Oval Card Table Geometry** (e.g., Uno)

---

## 1. Multi-Game Layout Adaptability

Each board game geometry presents unique structural requirements that must adjust dynamically between desktop (landscape/wide) and mobile (portrait/narrow) screens.

### 1.1. Square Track Geometry (Monopoly, Ludo)

```
+---------------------------------------------+
|  Corner [0]  |     Top Row [1..9]    |Corner [10]|
+--------------+-----------------------+-----------+
|              |                       |           |
|  Left Row    |       Inner Hub       | Right Row |
|  [39..31]    |     (Stats/Center)    | [11..19]  |
|              |                       |           |
+--------------+-----------------------+-----------+
|  Corner [30] |    Bottom Row [29..21]|Corner [20]|
+---------------------------------------------+
```

*   **Layout Strategy**: Use **CSS Grid** with a $11 \times 11$ cell configuration. The track cells reside on the grid outline, while the middle $9 \times 9$ space serves as the `inner-hub` for animations, community cards, dice displays, and game state.
*   **Desktop Layout**: The board is centered in a landscape view. Player panels, chat, and trade offers are placed as sidebar units on the left and right sides of the locked-aspect square board.
*   **Mobile Layout**: The square board is scale-locked to the viewport width (`100vw` minus safe margins) and anchored to the top or center. Player statuses and interaction buttons shift to the bottom. Side panels (chat, trade, log) are collapsed into overlay drawers.

### 1.2. Serpentine Grid Geometry (Snakes & Ladders)

```
[100] <- [99] <- [98] <- [97] <- [96]  (Row 9: Left-facing)
  |
[81] -> [82] -> [83] -> [84] -> [85]  (Row 8: Right-facing)
  ^
  |
[ 1 ] -> [ 2 ] -> [ 3 ] -> [ 4 ] -> [ 5 ]  (Row 0: Right-facing)
```

*   **Layout Strategy**: Structured as a standard $10 \times 10$ CSS Grid. The visual grid cells are indexed from $1$ (bottom-left) to $100$ (top-left or top-right depending on the row height).
*   **Serpentine Coordinate Mapping**: 
    A grid cell coordinate is resolved mathematically. For any cell ID ($1$-based index $c \in [1, 100]$):
    1.  Zero-based index: $i = c - 1$
    2.  Row (from bottom, 0-indexed): $y = \lfloor i / 10 \rfloor$
    3.  Column offset (0-indexed): $x_{\text{temp}} = i \pmod{10}$
    4.  Directional adjustment: If $y$ is odd, the row moves right-to-left, so the column is reversed: $x = 9 - x_{\text{temp}}$. If $y$ is even, $x = x_{\text{temp}}$.
    This maps index $c$ to grid coordinate $(x, y)$, matching CSS grid lines `grid-column: x + 1` and `grid-row: 10 - y`.
*   **Responsive Scaling**: Since Snakes & Ladders has no interactive internal hubs (tokens move directly onto grid cells), the entire grid scales proportionally. Aspect ratio is locked to $1:1$.

### 1.3. Card Table Geometry (Uno)

```
              [ Player 2 (Top) ]
        +----------------------------+
        |  +----------------------+  |
Player 3|  |  [Draw Pile] [Discard]  |  |Player 1
 (Left) |  +----------------------+  | (Right)
        +----------------------------+
              [ Player 0 (Bottom/Me) ]
```

*   **Layout Strategy**: An oval or rectangular layout. The center represents the communal discard and draw piles. Players are arranged along the perimeter (radial seating).
*   **Desktop Layout**: Wide landscape window.
    -   **Center**: Draw and discard piles.
    -   **Opponents**: Positioned at the top, left, and right borders of the screen.
    -   **Active Player**: Displayed at the bottom with a large, readable card hand container spreading horizontally.
*   **Mobile Layout**: Vertical space is limited. 
    -   Opponents are grouped into a compact top-bar with smaller avatars and card counters.
    -   The center card piles scale down.
    -   The active player's hand occupies the bottom $35\%$ of the screen. Swiping horizontally scrolls through the hand if cards exceed the viewport width.

---

## 2. Viewport Scaling & Aspect Ratio Management

To prevent boards from clipping, breaking layout, or scaling disproportionately across various screen aspect ratios (from ultra-wide $21:9$ desktop monitors to vertical $19.5:9$ mobile screens), we employ strict layout bounds calculations.

### 2.1. Aspect Ratio Lock Methods

To preserve game boards' shapes, the container must maintain a rigid ratio (e.g., $1:1$ for Monopoly/Ludo, $4:3$ for Card Tables).

#### Modern CSS `aspect-ratio`
We define a lock on the game container:
```css
.game-board {
  aspect-ratio: 1 / 1;
  width: 100%;
  max-width: min(90vw, 90vh);
  margin: auto;
}
```
This keeps the element square and bounded by whichever viewport dimension is smaller (width or height), leaving padding for player panels.

### 2.2. CSS-Based Viewport Units (`vmin`/`vmax`)

Using `vmin` ensures sizing is relative to the shorter screen dimension:
```css
:root {
  --board-size: 85vmin;
  --cell-size: calc(var(--board-size) / 11);
  --font-size-base: calc(var(--board-size) / 40);
}

.game-board {
  width: var(--board-size);
  height: var(--board-size);
}

.cell {
  width: var(--cell-size);
  height: var(--cell-size);
  font-size: var(--font-size-base);
}
```
*Pros*: Pure CSS, highly responsive, scales automatically on window resize.
*Cons*: Sub-pixel rendering discrepancies can sometimes cause thin visual gaps between grid cells in certain browsers.

### 2.3. Dynamic JavaScript-Driven Transform Scaling

Used by production board games like Richup.io, this technique scales a fixed-resolution virtual board (e.g., $1000\text{px} \times 1000\text{px}$) to fit the client container via CSS 2D transforms. This avoids browser text-rendering issues and pixel alignment gaps.

#### Scaling Formula:
Given a target board size $B_{\text{orig}} = 1000\text{px}$ and an available wrapper area of width $W_{\text{avail}}$ and height $H_{\text{avail}}$ (with margins $M$ subtracted):

$$S_w = \frac{W_{\text{avail}} - 2M}{B_{\text{orig}}}$$
$$S_h = \frac{H_{\text{avail}} - 2M}{B_{\text{orig}}}$$
$$\text{Scale Factor } (S) = \min(S_w, S_h)$$

```javascript
function resizeBoard() {
  const boardEl = document.getElementById('board');
  const containerEl = document.getElementById('board-container');
  
  const originalSize = 1000; // virtual canvas resolution
  const margin = 20;
  
  const wAvail = containerEl.clientWidth - (margin * 2);
  const hAvail = containerEl.clientHeight - (margin * 2);
  
  const scale = Math.min(wAvail / originalSize, hAvail / originalSize);
  
  // Apply transformation
  boardEl.style.transform = `scale(${scale})`;
  boardEl.style.width = `${originalSize}px`;
  boardEl.style.height = `${originalSize}px`;
}
```

```css
#board-container {
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

#board {
  transform-origin: center center;
  flex-shrink: 0;
  will-change: transform; /* Promotes element to its own GPU layer */
}
```

### 2.4. SVG Viewport Scaling

For grids that require clean vectors and dynamic layers (like Snakes & Ladders), drawing the board as an SVG using `viewBox="0 0 1000 1000"` allows the browser to handle all aspect-ratio locking and coordinate transformations natively.

```xml
<svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet" class="svg-board">
  <!-- Grid definitions, Snakes, Ladders, and tokens -->
</svg>
```

---

## 3. Touch & Click Interaction Design

### 3.1. Turn Indicators & Highlights

```
 +-------------------------+
 | (Turn Timer: 12s)       |
 | [Avatar] Player 1 (Active) <-- Pulsing Green Ring & Glow
 +-------------------------+
```

*   **Visual Cueing**: The active player's panel features a pulsing SVG border animation and a drop shadow glow.
*   **Accessibility**: A text indicator ("Your Turn" or "Player 1's Turn") is positioned at a fixed status bar. Screen readers receive updates via `aria-live="polite"`.
*   **UX Pattern**: On touch screens, when a turn changes, a temporary overlay banner flashes ("YOUR TURN") across the center of the board for $800\text{ms}$ before fading out to catch user attention.

### 3.2. Dice Rolling Systems

*   **3D CSS Dice (Best for Desktop)**:
    A 3D cube rendered in CSS using 3D transforms (`preserve-3d`).
    ```css
    .dice-cube {
      width: 60px;
      height: 60px;
      position: relative;
      transform-style: preserve-3d;
      transition: transform 1.2s cubic-bezier(0.2, 0.8, 0.3, 1.1);
    }
    .dice-face {
      position: absolute;
      width: 60px;
      height: 60px;
      background: white;
      border: 2px solid #ccc;
      border-radius: 8px;
    }
    /* Define 3D rotation offsets for faces 1-6 */
    .face-1 { transform: rotateY(0deg) translateZ(30px); }
    .face-2 { transform: rotateY(90deg) translateZ(30px); }
    /* ... */
    ```
    To roll, update the inline style `transform` to coordinates that map to the target result, adding multiple rotations (e.g., $+720^{\circ}$) for kinetic realism.
*   **2D Sprite Sheets (Best for Mobile)**:
    3D elements consume mobile battery and system resources. A 2D fallback uses a sprite sheet animation or an optimized WebP loop with an instantaneous snap to the static final face.

### 3.3. Token Movement Animations

Tokens should traverse board tiles sequentially rather than teleporting.

1.  **Interpolated Pathing**: If a player rolls a 4, the token triggers a sequential timeline animating to $curr + 1 \to curr + 2 \to curr + 3 \to curr + 4$.
2.  **Arc Transitions**: Moving tokens display a parabolic arc (`bounce` effect) during transitions.
    Using CSS properties or anime.js:
    ```javascript
    // Animate a single tile hop
    timeline.add({
      targets: tokenEl,
      left: targetX,
      top: targetY,
      duration: 300,
      easing: 'easeOutQuad',
      // Dynamic vertical hop (arc) using translatey translation
      translateY: [
        { value: -25, duration: 150, easing: 'easeOutQuad' },
        { value: 0, duration: 150, easing: 'easeInQuad' }
      ]
    });
    ```
3.  **Token Stacking**: If multiple tokens land on the same cell, they adjust their offsets dynamically (e.g., clustered in a grid or spread radially) to ensure all tokens remain visible.

### 3.4. Card Interactions (Uno Specific)

*   **Tap-Select (Mobile)**: 
    1.  Tap a card once to focus/raise it ($20\text{px}$ up, showing action triggers like "Play" or "Info").
    2.  Tap the raised card again or tap the "Play" button to submit. This prevents accidental card plays on small screens.
*   **Drag-and-Drop (Desktop/Tablet)**:
    Uses HTML5 Drag and Drop or touch listeners to allow dragging a card from the hand directly to the central discard pile.
    -   *Visual feedback*: Highlight the discard drop-zone with a dashed outline and scale it up by $5\%$ when a playable card is dragged over it.

---

## 4. Mobile Optimization & Drawer Architecture

Mobile screens (typically portrait $9:16$ or $9.2:19$) lack space for sidebars. Sidebars must be collapsed into sliding panels using hardware-accelerated CSS.

```
+------------------------------------+
|            Top Bar Info            |
+------------------------------------+
|                                    |
|             Game Board             |
|              (Square)              |
|                                    |
+------------------------------------+
|      Mobile Interaction Deck       |
+------------------------------------+
| [ Chat ] [ Trade ] [ Log ] [ Shop ]|  <- Bottom Drawer Triggers
+------------------------------------+
```

### 4.1. Hardware-Accelerated Drawer System

To avoid layout reflows, drawers utilize CSS 2D translations (`transform: translate3d`) instead of modifying layout properties like `width`, `height`, or `left`.

```css
.sliding-drawer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 80vh;
  background: #ffffff;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -10px 25px rgba(0,0,0,0.15);
  z-index: 1000;
  
  /* Initial off-screen state (GPU Accelerated) */
  transform: translate3d(0, 100%, 0);
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  will-change: transform;
}

.sliding-drawer.active {
  /* Dynamic entry slide-in */
  transform: translate3d(0, 0, 0);
}
```

```javascript
// Toggle Drawer State
function toggleDrawer(drawerId, open) {
  const drawer = document.getElementById(drawerId);
  const overlay = document.getElementById('drawer-overlay');
  
  if (open) {
    drawer.classList.add('active');
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden'; // Prevent page background scrolling
  } else {
    drawer.classList.remove('active');
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
  }
}
```

### 4.2. Viewport Height Fixes (Safari & Chrome Mobile)

Using standard `100vh` on mobile web browsers often results in layout clipping because address bars dynamically expand or collapse, overlapping content.

*   **Solution**: Use CSS dynamic viewport height units (`svh`, `dvh`, `lvh`) and custom CSS variables to handle browsers without full dynamic unit support.

```css
.app-container {
  /* Fallback for older browsers */
  height: 100vh;
  /* Dynamic viewport height including address bar shifts */
  height: 100dvh; 
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

---

## 5. Implementation Blueprints

### 5.1. Serpentine Grid Coordinate Mapping (Snakes & Ladders)

This JavaScript helper translates a cell number into column/row indices and offsets for placing tokens.

```javascript
/**
 * Resolves the 2D grid coordinates for a cell in a Snakes & Ladders game.
 * @param {number} cellNumber - Cell number (1 to 100)
 * @param {number} cols - Columns on the board (default 10)
 * @returns {{ col: number, row: number }} 0-indexed column and row (from bottom)
 */
function getSerpentineCoordinates(cellNumber, cols = 10) {
  if (cellNumber < 1 || cellNumber > 100) {
    throw new Error("Cell number must be between 1 and 100");
  }
  
  const index = cellNumber - 1;
  const row = Math.floor(index / cols);
  const colRemainder = index % cols;
  
  // Serpentine behavior: reverse column direction on odd rows (0-indexed)
  const col = (row % 2 === 1) ? (cols - 1 - colRemainder) : colRemainder;
  
  return { col, row };
}

// Example usage:
// Cell 1  -> row: 0, col: 0
// Cell 10 -> row: 0, col: 9
// Cell 11 -> row: 1, col: 9 (direction reverses)
// Cell 20 -> row: 1, col: 0
```

To map this to visual coordinates on a normalized $1000 \times 1000\text{px}$ SVG canvas:

```javascript
function getPixelPosition(cellNumber) {
  const { col, row } = getSerpentineCoordinates(cellNumber);
  const cellSize = 100; // 1000 / 10
  
  // X increases from left to right
  const x = col * cellSize + (cellSize / 2);
  
  // Y increases from top to bottom (so invert the row)
  const y = (9 - row) * cellSize + (cellSize / 2);
  
  return { x, y };
}
```

### 5.2. Responsive Uno Card Table Layout

A clean CSS structure showing how radial seating for 4 players is established around a card table.

```css
.card-table-container {
  position: relative;
  width: 100%;
  height: 100dvh;
  background-color: #1e3a1e; /* Green felt table background */
  overflow: hidden;
}

.game-table-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 800px;
  height: 60%;
  border-radius: 100px;
  border: 15px solid #5c3a21; /* Wooden table rim styling */
  background: radial-gradient(circle, #2d5a27 0%, #1e3a1e 100%);
}

/* Base styling for seating locations */
.player-seat {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

/* Positioning players around the table rim */
.seat-bottom { /* Active Player */
  bottom: 5%;
  left: 50%;
  transform: translateX(-50%);
}

.seat-top {
  top: 5%;
  left: 50%;
  transform: translateX(-50%);
}

.seat-left {
  left: 5%;
  top: 50%;
  transform: translateY(-50%);
}

.seat-right {
  right: 5%;
  top: 50%;
  transform: translateY(-50%);
}

/* Scale down assets on small screens using Media Queries */
@media (max-width: 600px) {
  .game-table-inner {
    height: 45%;
    border-width: 8px;
    border-radius: 50px;
  }
  
  .seat-left, .seat-right {
    /* Push side player avatars towards the top corners to clear horizontal space */
    top: 15%;
    transform: translateY(0);
  }
}
```

---

## 6. Recommendations for Scaling Architecture

1.  **Use Fixed Logical Coordinate Spaces ($1000 \times 1000$)**:
    By using dynamic scaling transform engines, developers write code against a predictable size, avoiding layout calculations during viewport adjustments.
2.  **Decouple Board Scaling from UI Overlays**:
    The game board should scale inside an isolated wrapper. HUD overlays, chat elements, drawer systems, and trade screens must reside on independent structural layers, bypassing the board scaling transform.
3.  **Optimize SVG for Path-Based Animation**:
    When moving tokens dynamically (especially along serpentine paths), representing the paths as hidden SVG paths (`<path d="..." />`) allows developers to utilize native web animation capabilities like CSS `offset-path` or libraries like GSAP for path tracking.
4.  **Enforce Safe Margins**:
    Provide a minimum margins pad ($5\%$ of viewport bounds) inside scaling math variables to accommodate varying phone shapes (rounded display corners, pill cutouts, and status bars).
