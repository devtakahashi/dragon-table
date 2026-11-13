# Dragon Table update

Upload every file from this ZIP to the repository root, replacing the previous files. Keep the existing five PNG assets. card-cat.png is new and REQUIRED.

Cloudflare build command:
```
mkdir -p public && cp *.html styles.css app.js *.png public/
```
Keep the existing deploy command. The existing older build command also includes the new cat image and app bundle; footer information is bundled into app.js so it works independently of separate-page deployment.

Changes: three-second reveal, explicit WebKit backface rules, two-pass shuffle, cat special card (one dragon, one cat, three misses), embedded information pages, preview invitation links, Phantom public-address connection, account panel, read-only mainnet SOL balance with failure state. Open inside Phantom's in-app browser on mobile. No transaction or signature requests.

Limitations: not a funded casino. Invite URLs are editable preview data, not authenticated rooms. No opponent synchronization, acceptance persistence, escrow, deposits, payouts or real earnings history. Demo stats last for the current page only and are not wallet-specific financial records. Displayed SOL balance is separate from the illustrative USDC stake. Public RPC may rate-limit requests; unavailable balance is shown honestly.

Production decisions needed: chain/token, cat and dragon payout rules, duel tie/miss rules, cancellation/expiry and settlement implementation. A shared backend and secure escrow are required before funded duels.

Verification: JavaScript syntax and deterministic local interaction checks. Physical mobile devices and a real wallet were not available for live validation.
