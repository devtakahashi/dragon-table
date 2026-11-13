# Dragon Table automatic animation and WebP update

Upload every file in this patch into the repository root, keeping assets/ where provided. Include .gitattributes (a dotfile) so GitHub can classify authored JavaScript/CSS. Commit to the default branch and allow Pages to deploy. No live deployment was performed here.

Shuffle and reveal animate on explicit button clicks without a separate animation toggle. Existing artwork was converted to WebP, not regenerated. Cat and dragon preload and decode at startup. Keep the old PNG files until this deployment is verified; the new code no longer references them. SVG wallet logos remain SVG because they are already small vectors. Raster wallet icons use embedded WebP.

VS Code: Open your repository folder. Edit app.js (behavior), styles.css (design), index.html (game UI) or the five information HTML pages. Files are now formatted. Use a local static web server or VS Code Live Server for preview. GitHub's language bar can take time to refresh and its exact percentages are not guaranteed.

Validation: JavaScript syntax passes; automatic motion has no reduced-motion gate or toggle dependency; all artwork references use WebP; cat and dragon are preloaded. Physical Android Chrome testing still needed after upload. This patch retains the previous account and dragon-header updates.
