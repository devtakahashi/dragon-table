# 龙桌 · Dragon Table

Chinese-only static UI demo. No real wagers, deposits, wallet connection or payouts. The wallet control opens an accurate availability notice. Solo mode works; online duel is visibly unavailable. Production payout rules are not yet specified.

## Deployment
Upload all files from this update to the repository root, retaining the existing five PNG assets.

Update the Cloudflare build command so the new pages are included:

```sh
mkdir -p public && cp *.html styles.css app.js *.png public/
```

Deploy command:

```sh
npx wrangler deploy --name dragon-table --assets ./public --compatibility-date 2026-11-10
```

## Interaction
Select a card, enter a positive amount (up to 1,000,000 with two decimals), and confirm. A ten-second animation reveals the card. One of five cards contains a dragon. Browser randomness is for demo only and is not secure settlement. Win displays the entered demo amount, explicitly not a payout. Reduced-motion preferences suppress spinning and effects while retaining the reveal wait.

## Before production
Confirm solo/duel mechanics, payout multiplier, chain/token, backend randomness, escrow, authentication and settlement. Replace informational demo policies with reviewed operator-specific policies, jurisdiction eligibility and a working support contact. Do not remove demo notices before these are implemented.
