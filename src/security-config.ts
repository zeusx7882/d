/**
 * PULSO GIFS – Security & Anti-Abuse Configuration
 *
 * This file is the single maintainable configuration point for:
 *   • Client-side deterrence toggles
 *   • Backend/CDN upgrade path stubs (NOT active in static builds)
 *
 * ──────────────────────────────────────────────────────────────
 * IMPORTANT LIMITATION NOTICE
 * ──────────────────────────────────────────────────────────────
 * Images delivered to a browser CANNOT be made impossible to copy.
 * Any image rendered in a browser can be obtained via:
 *   - Browser DevTools / Network tab
 *   - Browser cache on disk
 *   - Screenshots or screen-recording software
 *   - Automation tools (Puppeteer, Playwright, curl)
 *
 * The measures below are deterrence only – they raise the effort
 * required for casual copying and document the intended usage
 * policy, but they do not constitute technical DRM.
 *
 * ──────────────────────────────────────────────────────────────
 * UPGRADE PATH (backend/CDN)
 * ──────────────────────────────────────────────────────────────
 * When moving from a static host to a backend-enabled deployment:
 *
 *   1. Signed / expiring asset URLs
 *      - Generate short-lived URLs server-side (e.g. AWS S3 pre-signed,
 *        Cloudflare R2 signed URLs, Supabase Storage signed URLs).
 *      - Store originals in private storage (not public folder).
 *
 *   2. Authentication gate
 *      - Require Discord OAuth or similar to access full-resolution assets.
 *      - Return 401/403 for unauthenticated direct requests.
 *
 *   3. Rate limiting
 *      - Limit downloads per IP / per account (e.g. 100 requests/min).
 *      - Block automated mass-download patterns with a WAF rule.
 *
 *   4. CAPTCHA on export
 *      - Require a lightweight challenge (e.g. hCaptcha, Turnstile) before
 *        delivering high-resolution exports.
 *
 *   5. CDN / WAF
 *      - Use Cloudflare, Fastly, or AWS CloudFront with:
 *          • Hotlink protection (Referer policy enforcement)
 *          • Bot management
 *          • DDoS mitigation
 *
 *   6. Private storage
 *      - Move /public/decorations/catalogo/ to S3/R2/Supabase private bucket.
 *      - Serve only through signed URLs resolved server-side.
 */

// ── Client-side deterrence toggles ──────────────────────────────────────────
// Set to `false` to disable a feature without removing the code.

export const PROTECTION_CONFIG = {
  /** Disable right-click context menu on decoration thumbnails and canvas preview. */
  disableContextMenu: true,

  /** Prevent native drag-to-save on decoration thumbnails. */
  preventImageDrag: true,

  /** Apply CSS user-select:none to catalog card surfaces only. */
  noSelectOnCards: true,

  /** Show copyright/usage notice in the catalog UI. */
  showCopyrightNotice: true,

  /** Render catalog thumbnails with a subtle watermark overlay. */
  enableWatermarkOverlay: true,

  /** Watermark text drawn on canvas thumbnails. */
  watermarkText: '© PULSO GIFS',
} as const

// ── Copyright metadata ──────────────────────────────────────────────────────
export const COPYRIGHT = {
  owner: 'PULSO GIFS',
  year: 2026,
  notice:
    'Decorações protegidas por direitos autorais © 2026 PULSO GIFS. ' +
    'Uso pessoal permitido apenas na plataforma. ' +
    'Redistribuição, venda ou uso comercial é proibido.',
  noticeShort: '© 2026 PULSO GIFS – uso pessoal apenas',
  reportEmail: 'contato@pulsogifs.com', // placeholder – update with real address
  dmcaContact: 'Para denúncias de violação de direitos autorais, envie e-mail para: contato@pulsogifs.com',
} as const
