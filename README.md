# Dragon Table account update

Chinese account modal with Jupiter, Phantom, Solflare and Backpack logo buttons in one row, original dragon watermark, SOL balance, and current-page demo counters. Responsive mobile/tablet/desktop layouts.

Wallet Standard discovery supports compatible installed wallets, with injected-provider fallbacks for Phantom, Solflare and Backpack. No transaction or signature calls. Mobile users need a compatible wallet browser; cross-app QR/deep-link pairing is not included. Real wallet/device approval remains to be checked. Public Solana RPC may rate-limit; failure displays a Chinese message.

Validated: JavaScript syntax; all local HTML/CSS assets; browser layout at mobile 390px, tablet 768px and desktop; double shuffle (two iterations); reveal animation and completion; all five Chinese modal page links; simulated Standard/legacy connection, rejection, account removal, reconnection, disconnect, balance and stats.

Real iPhone Safari rendering and real wallet extensions/apps were not available for verification. Funded duels, escrow, payout rules and persistent wallet history remain unfinished.

Upload all files including assets/ to your existing static deployment, or copy into the repository root. GitHub and production were not changed: connected repository access is read-only.

Wallet icons sourced from the official wallet adapter packages (@jup-ag/jup-mobile-adapter, @solana/wallet-adapter-backpack, anza-xyz/wallet-adapter). Brand assets retain their respective ownership.

Account revision 2: removed account title and separate connect button; tapping a wallet logo starts connection. Wallet logos embedded in HTML to avoid missing asset-folder uploads. Four decorative Chinese gold corners added. Verified logo decoding, title/button removal and direct selection feedback in a 390px browser layout.

Revision 3: compact approved layout, selected logo plus explicit Connect Wallet confirmation, embedded logos and gold corners, balance row and three demo counters. Removes unavailable returns and empty history. Phantom, Solflare, Backpack mobile browse links preserve selected wallet; press Connect again inside wallet browser to authorize. Jupiter separate mobile pairing remains unfinished; compatible Wallet Standard provider supported. Mobile app handoff requires real-device validation.

Revision 4: card movement uses Web Animations instead of nested CSS 3D transforms. Six half-second edge-turn cycles precede the result at three seconds; shuffle runs two 750ms passes with stagger. Chinese animation switch respects system reduced-motion by default and allows explicit override for this page. No images changed or generated. Browser checks at 390px confirmed changing shuffle transforms, changing flip scale, revealed face visibility, animation-off static state, and animation-on movement. Physical iOS Safari remains untested. Cache version updated to motion-4.
