Implemented a targeted performance update across the checked-in static site. The production domain, URLs, content, calculator formulas, fonts, and analytics measurement ID remain unchanged. Changes have not been deployed.

Measurements below come from local Chrome 153 / Lighthouse 13.5.0, using the official desktop and mobile configurations, simulated throttling, a gzip-enabled local server, cold page loads, and live Google Analytics. They are not a replacement for a deployed Cloudflare measurement. Each final result uses three runs; medians are calculated per metric. There is no user-agent detection, analytics exclusion, blocked third-party URL, or testing branch in the website.

<!-- METRICS -->

The supplied production desktop baseline was performance 83, FCP 0.3 s, LCP 0.8 s, TBT 380 ms, CLS 0, and Speed Index 0.7 s. Its earlier 99/60 ms result demonstrates the variability. Compare the local before/after series with each other rather than treating the supplied production run as the same test environment.

1. **Changed files and their purpose**

   - `assets/js/main.js`: schedules the GA download after load/idle with bounded fallbacks; guards duplicate downloads; measures the header before opening the mobile menu; caches header/dropdown references; avoids reading dialog geometry for clicks inside its content; removes startup writes for static dropdown IDs and already-present table accessibility attributes. The existing lightweight page checks and calculator event handlers remain.
   - `assets/css/experience.css`: removes the duplicate body font-size rule; anchors the quick-estimate wrapper to the grid start. This prevents transient vertical centering while its HTML is parsed. The finished position was checked at 11 viewport widths (320–1920 px).
   - `assets/css/site.min.css`: new production bundle, generated from `style.css` followed by `experience.css`, preserving the cascade. Both readable source stylesheets remain available for maintenance.
   - `assets/img/leveling-tools-672.webp` and `assets/img/leveling-tools-704.webp`: new responsive candidates; the original 800 px image remains available for larger/high-density displays.
   - `build.py`: mirrors the shared HTML changes, including static dropdown IDs/ARIA references, the early enhancement flag, the retained analytics queue, and the bundled stylesheet reference.
   - All 25 site HTML pages listed below: remove the immediate external GA tag, retain its single configuration/queue, set the existing `has-js` flag before CSS/first paint, reference the CSS bundle, and include static dropdown IDs/ARIA controls. `index.html` also adds responsive `srcset`/`sizes` to the two tool images.
   - `.gitignore`: excludes dependencies, local measurements, and Python caches.
   - `package.json`, `package-lock.json`: pin development-only asset-building and validation dependencies. No dependency is shipped to browsers.
   - `scripts/build-assets.cjs`, `scripts/build-images.cjs`: reproducible CSS and image generation.
   - `scripts/serve.cjs`: local gzip-enabled validation server.
   - `scripts/performance-audit.mjs`: three desktop and three mobile Lighthouse runs, saving reports/traces under `.perf/`.
   - `scripts/regression.cjs`: metadata/link/schema checks and browser interaction tests.
   - `scripts/check-analytics.cjs`: verifies real GA collection, the early event queue, fallback scheduling, and single loading.
   - `PERFORMANCE_REPORT.md`: this report.

   Exact HTML files:

   ```text
   404.html
   index.html
   about/index.html
   contact/index.html
   disclaimer/index.html
   editorial-policy/index.html
   how-to-use-self-leveling-concrete/index.html
   primer-for-self-leveling-concrete/index.html
   privacy-policy/index.html
   self-leveling-concrete/index.html
   self-leveling-concrete-bag-coverage-calculator/index.html
   self-leveling-concrete-calculator/index.html
   self-leveling-concrete-cost-calculator/index.html
   self-leveling-concrete-cost/index.html
   self-leveling-concrete-cracking/index.html
   self-leveling-concrete-mix/index.html
   self-leveling-concrete-not-level/index.html
   self-leveling-concrete-outdoors/index.html
   self-leveling-concrete-over-plywood/index.html
   self-leveling-concrete-problems/index.html
   self-leveling-concrete-thickness/index.html
   self-leveling-concrete-tools/index.html
   self-leveling-concrete-underlayment/index.html
   self-leveling-concrete-vs-concrete/index.html
   terms/index.html
   ```

2. **Initial work and the reported first-party task**

   The initial page parses its inline analytics queue and JSON-LD, loads two stylesheets (now one), the responsive hero, a 5.5 KiB search index, and the shared script. The three calculator pages additionally load `calculator.js`. Navigation is already static HTML; there is no runtime menu construction or large `innerHTML` operation. Calculator results are not calculated on startup. Contact uses email and WhatsApp links, not a form. Fonts are local/system fonts; there are no font downloads, preload/preconnect hints, or other application third-party scripts.

   The original production trace was not provided, so its exact 100 ms event cannot be identified conclusively. In reproduced local traces the long document-attributed task is dominated by initial browser layout/style work. The first desktop baseline trace recorded about 600 ms of actual Layout in that task; the shared script's EvaluateScript was about 7 ms. Lighthouse's modeled task duration differs from raw trace duration. Attribution to the document URL does not establish that inline JavaScript consumed that time.

   The change moves static accessibility work into HTML and sets `has-js` before rendering rather than invalidating root styles later. It also prevents the observed quick-estimate positioning shift. Browser layout/paint remains a separate cost from Google's script. A broad DOM or design rewrite was not justified by these traces.

3. **GA duplication, scheduling, and events**

   GA was not duplicated: each site page originally had one external loader and one configuration call. The template's matching snippet is source, not an additional runtime installation. No custom form/calculator analytics events exist in this repository.

   `window.dataLayer`, `gtag('js', new Date())`, and the single `gtag('config', 'G-EEVCE53BZW')` remain available in the head. `main.js` schedules the external script at the next idle opportunity after `window.load`, with a 1,000 ms idle timeout. Browsers without `requestIdleCallback` use a zero-delay timer after load. A 2,000 ms deadline from shared-script execution handles a slow load event. Hiding the page requests loading immediately. No interaction is required.

   Analytics tradeoff: a visitor who leaves before the library downloads and sends its queued events can be missed. The hide-page attempt does not guarantee delivery during exit. The bounded readiness strategy reduces rendering contention but cannot eliminate Google's execution cost or guarantee a Lighthouse score.

   Real-browser checks passed for normal loading, no idle-callback support, and an intentionally stalled hero request. Each downloaded GA once and sent exactly one initial `page_view` to `G-EEVCE53BZW` with HTTP 204. A `performance_validation` debug event queued at DOMContentLoaded also received HTTP 204. Repeated load signals did not duplicate the script or configuration. These validation events were sent from localhost; GA Realtime/DebugView ingestion in the account still requires an account-side check.

4. **Remaining JavaScript and long tasks**

   The significant unused-JavaScript finding belongs to Google's `gtag.js`, approximately 60–71 KiB in these runs (Google's response varied). It remains externally hosted and unmodified. Its evaluation/timer work remains the main mobile TBT cost. Browser style/layout and unattributed browser work also remain. There is no claim that moving the download removes its CPU cost; the reports include GA execution.

5. **Forced reflow**

   The supplied startup forced-reflow warning did not reproduce in the local Lighthouse insight. Code inspection did find a separate interaction issue: mobile-menu classes/ARIA were written before reading the header's bounding rectangle. That read now happens first, and closing the menu does not measure it. Dialog content clicks no longer read a rectangle unnecessarily. The passive open-menu scroll handler retains one read followed by one write; keyboard focus handling still checks visibility when needed.

6. **CSS, layout, DOM, and caching**

   Both original stylesheets contain hero/navigation/above-the-fold rules and were linked directly from HTML, not via `@import`. They remain synchronously render-blocking as one minified bundle: no print-media switch, async styling, or duplicated inline CSS. Original CSS totaled 59,300 bytes / 12,414 bytes gzipped; the bundle is about 50.5 KiB raw / 10.3 KiB gzipped, saving roughly 2.1 KiB compressed and one request. Exact final sizes appear below.

   CSS consolidation produced pixel-identical full-page screenshots at 1350, 940, and 412 px before the subsequent equivalent-position alignment guard. No content/navigation elements were removed. The modest DOM did not warrant restructuring. Calculator JS remains restricted to the three calculator pages. Existing lazy images keep explicit dimensions and async decoding; the hero remains directly discoverable, eager, and high priority.

   There was no `_headers` file, and none was added. There is no new immutable caching policy for mutable filenames. Existing hosting cache behavior remains; HTML/asset deployment should remain atomic. No extra fonts, preconnects, or preloads were introduced.

7. **Exact image opportunity**

   Desktop Lighthouse reproduced **16,311 wasted bytes** for `/assets/img/leveling-tools-800.webp`, specifically the toolkit image. The source is 800 × 533 WebP, 56,226 bytes. It renders around 587 × 429 px on desktop and 366 × 260 px at a 412 px mobile viewport. The guide-card use is around 351 × 225 px desktop / 346 × 230 px mobile. Cropping and display density are accounted for in the responsive sizing.

   The 672 × 448 candidate is 29,886 bytes (26,340 bytes / 25.7 KiB smaller). The 704 × 469 candidate is 32,152 bytes (24,074 bytes / 23.5 KiB smaller). Both retain WebP, use quality 80, and were visually inspected. Larger-density displays can still select the 800 px original. Browser choice/cache reuse determines actual per-visit savings; the savings are not additive for the same reused image. The image-delivery finding is clear in the final Lighthouse results. Hero and social images were not recompressed.

8. **Regression validation**

   - All 26 HTML files, including Search Console verification, were inspected. All 25 site pages have one GA configuration.
   - 80 JSON-LD objects parse and match the original; titles, descriptions, canonical URLs, robots directives, H1s, sitemap, robots.txt, and verification file match the original.
   - 2,272 internal file/fragment references resolve.
   - Desktop dropdown keyboard opening/Escape/focus restoration; mobile menu opening/closing and dropdowns; search; homepage estimator; layer viewer; all three calculators' expected results, invalid input, and reset passed.
   - Interaction checks ran at 1350, 940, and 412 px. All homepage images decode. No browser JavaScript exceptions were observed. Lighthouse checks console/best-practice issues separately.
   - Real GA collection/fallback tests passed as described above.
   - Final homepage Lighthouse accessibility, best practices, SEO, CLS, and performance are reported with every run below, not inferred for untested pages.

9. **Reproduction and deployment checks**

   The generated assets are checked in, so the existing static deployment can publish these files directly. For maintenance, install the pinned development dependencies with `npm ci`, then run `npm run build:assets` after CSS edits. `npm run build:images` regenerates the two image candidates. The existing `build.py` is only a partial/template module and references missing `seo_data.py` and page generators; a complete original Python build could not be run from this checkout. Its shared template and the deployed HTML were updated together.

   Run `npm run serve`, then in another terminal `npm test`, `npm run test:analytics`, and `npm run audit -- comparison`. The analytics test sends a debug validation event. Set `CHROME_PATH` if Chrome is not in the default Windows installation path. Raw reports, traces, and screenshots from this session are in the ignored `.perf/` directory; the comparable series are `baseline` and `verified`. Intermediate runs exposed the small estimator CLS issue and were not used as final results.

   After deployment, check GA Realtime/DebugView for the production hostname and one page view per navigation, confirm one GA script request, exercise search/mobile keyboard menus and all calculators, and repeat three mobile/desktop Lighthouse runs on Cloudflare. Check that the new CSS/image files return 200 and old browser caches revalidate. Mobile 95–100 and sub-100 ms TBT have not been established; retain real analytics rather than hiding its cost.
