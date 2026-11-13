# Dragon Table · 龙桌

Dragon Table (龙桌) — a five-card dragon discovery game with Chinese and English interfaces, built for desktop and mobile.

![Dragon Table room](./room-background.png)

## Current build

A playable static frontend featuring Simplified Chinese by default, an English language switch, solo practice, and a local two-player duel on one device.

The interface follows the red and gold Dragon Table design, with five selectable cards, animated reveals, keyboard-accessible controls, reduced-motion support, and translated game instructions.

The displayed $5 entry and $10 pot are illustrative. This version handles no deposits, transfers, or payouts. Online matchmaking, wallet authentication, escrow, and independently verifiable randomness are future backend work.

## Game rules

1. Each round starts with five face-down cards and one randomly positioned dragon.
2. Player 1 chooses and locks a card, then passes the device to Player 2.
3. Player 2 chooses a different card. Both selected cards reveal together.
4. Whoever finds the dragon wins. If both miss, deal a new round with the same illustrative pot.
5. Solo practice offers one choice per round. All cards reveal after the selected card.

## Run locally

Serve the repository root with a static HTTP server. With Python installed:

```sh
python -m http.server 8000
```

Open http://localhost:8000. No package installation or build step is required.

## Files

| File | Purpose |
| --- | --- |
| index.html | Page structure, dialogs and metadata |
| styles.css | Responsive design and card animation |
| app.js | Language strings and local game state |
| dragon-avatar.png | Brand image and browser icon |
| room-background.png | Game room and table |
| card-back.png | Shared concealed card |
| card-dragon.png | Winning face |
| card-empty.png | Non-winning face |

Keep the image files alongside index.html. Fonts are requested from Google Fonts, with system fallbacks.

## Deployment

This frontend can be served by a static host. A Cloudflare Pages project can use no build command and the repository root as its output directory. Custom domain configuration is separate from committing the code.

## Implementation notes

Random placement uses Web Crypto with rejection sampling. The local browser still controls the complete game state, so this implementation is suitable for practice and demonstrations only. Real-money play requires server-authoritative matches and a separately implemented payment and settlement system.

Refreshing the page resets the local game. Changing modes starts a new round. Language changes preserve the current round.

## Validation

The initial build was checked in Chromium for desktop and a 390-pixel mobile viewport, including Chinese/English switching, card selection, player handoff, duplicate-pick prevention, solo reveals and replay controls.
