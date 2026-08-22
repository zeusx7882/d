# PULSO GIFS – Security & Asset-Protection Documentation

## 1. Fundamental Limitation

> **Images delivered to a browser cannot be made impossible to copy.**

Any decoration asset that appears in the browser has already been downloaded to the
visitor's device. It can be retrieved through:

- Browser DevTools → Network or Sources tab
- Browser on-disk cache
- Screenshots or screen-recording
- Automation tools (Puppeteer, Playwright, `curl`, `wget`)

The measures documented here are **deterrence only**. They significantly raise the
effort required for casual copying and communicate the intended usage policy. They
do not constitute technical DRM and should never be described as such.

---

## 2. Client-Side Deterrence Measures (currently enabled)

All toggles are controlled in `src/security-config.ts`.

| Measure | Where applied | Bypass difficulty |
|---|---|---|
| Right-click / context-menu disabled | Decoration thumbnails, catalog grid, canvas preview | Trivial (F12 → right-click) |
| Native image drag-to-save disabled | Decoration thumbnails | Trivial (download via DevTools) |
| CSS `user-select: none` | Catalog card surfaces | Trivial |
| Copyright notice in UI | Catalog header, footer | N/A – informational |
| Subtle watermark on catalog thumbnails | Thumbnail canvas wrapper | Low – watermark is visible overlay only |

**What is NOT blocked:**

- DevTools, Network tab, application cache
- Screenshots and screen recordings
- Direct URL access to `/public/decorations/catalogo/` assets
- Automated HTTP requests (`curl`, scrapers)
- Viewing page source

---

## 3. Security Headers (static host configuration)

The file `public/_headers` configures security headers for **Netlify** deployments.

For other static hosts apply equivalent configuration:

### Vercel (`vercel.json`)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=()" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'" }
      ]
    }
  ]
}
```

### GitHub Pages

GitHub Pages does **not** support custom HTTP headers via configuration files.
Options:
1. Use a reverse proxy (Cloudflare proxy) in front of GitHub Pages to inject headers.
2. Migrate to Netlify or Vercel for native header support.

### Apache (`.htaccess`)

```apache
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"
```

---

## 4. Recommended Production Backend / CDN Controls

The following controls are **not implemented** in the current static build but are
strongly recommended when migrating to a backend-enabled deployment:

### 4.1 Private Storage + Signed URLs

Move decoration assets from `public/decorations/catalogo/` into a private storage
bucket (AWS S3, Cloudflare R2, Supabase Storage) and serve them only through
server-generated short-lived signed URLs.

```
Client → API Server (validates session) → Generates signed URL (TTL 60 s)
                                        → Returns URL to client
Client → CDN (validates signature, serves asset)
```

### 4.2 Authentication Gate

Require Discord OAuth (or another provider) before full-resolution assets are
accessible. Unauthenticated requests receive 401/403.

### 4.3 Rate Limiting

Implement per-IP and per-account rate limits, e.g.:
- 100 asset requests / minute / IP
- 10 exports / hour / account
- Block > 500 requests / minute from a single IP at CDN level

### 4.4 CAPTCHA on Export

Add a lightweight CAPTCHA challenge (Cloudflare Turnstile, hCaptcha) before
delivering the high-resolution export or triggering bulk operations.

### 4.5 CDN / WAF

Deploy behind Cloudflare (free tier available) for:
- Hotlink protection (reject requests where `Referer` is not PULSO GIFS)
- Bot management / challenge pages
- DDoS mitigation
- Cache control with signed token validation

### 4.6 Metadata Embedding

Embed invisible copyright metadata (EXIF/XMP) in all decoration source files
using a batch tool (e.g. `exiftool`). This survives casual copying and
assists in legal identification.

---

## 5. Privacy – Local Uploads

All user-uploaded avatar images are processed **entirely in the browser**:

- Files are never sent to any server.
- The exported PNG/GIF is generated client-side using the HTML5 Canvas API.
- `URL.createObjectURL()` produces an in-memory reference, not an upload.
- Clearing the browser tab discards all uploaded data.

No personal data or uploaded content is stored by PULSO GIFS.

---

## 6. Copyright & Reporting

All decoration assets in this repository are the property of **PULSO GIFS** and are
protected by applicable copyright law.

- **Permitted use:** Personal, non-commercial use of exported profile images created
  through the PULSO GIFS editor.
- **Prohibited:** Redistribution, resale, commercial use, or incorporation of raw
  decoration assets in other products without written permission.

To report unauthorized use or request asset removal:

- **Email:** contato@pulsogifs.com *(placeholder – update with real address)*
- **DMCA / takedown notice:** Send a formal notice to the email above.

---

## 7. Scope of This Document

This document covers the PULSO GIFS static web application in the
[zeusx7882/d](https://github.com/zeusx7882/d) repository. It is intended for
maintainers, contributors, and legal/compliance reference.
