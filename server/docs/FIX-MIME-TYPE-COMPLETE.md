# Complete Fix: MIME Type Error for JavaScript Modules

## Problem
```
Failed to load module script: Expected a JavaScript-or-Wasm module script 
but the server responded with a MIME type of "application/octet-stream"
```

## Root Cause
Static asset requests (`.js`, `.mjs` files) are being caught by the SPA fallback (`try_files $uri $uri/ /index.html`) before nginx can set the correct MIME type.

## Solution

### Option 1: Nginx Configuration (Recommended)

**File:** `server/nginx-frontend.conf`

**Key Points:**
1. ✅ Static asset locations (`/assets/`, `*.js`, `*.css`) MUST come BEFORE `location /`
2. ✅ Use `try_files $uri =404;` for assets (no fallback to index.html)
3. ✅ SPA fallback (`try_files $uri $uri/ /index.html`) ONLY in `location /` (last)
4. ✅ Explicit `types {}` blocks to override MIME types

**Deployment Steps:**

```bash
# 1. Backup current config
sudo cp /etc/nginx/sites-available/perfumenectar.com /etc/nginx/sites-available/perfumenectar.com.backup

# 2. Copy new config
sudo cp server/nginx-frontend.conf /etc/nginx/sites-available/perfumenectar.com

# 3. Test configuration
sudo nginx -t

# 4. If test passes, reload nginx
sudo systemctl reload nginx

# 5. Test a JS file
curl -I https://perfumenectar.com/assets/js/index-abc123.js

# Expected output:
# Content-Type: application/javascript; charset=utf-8
```

### Option 2: Express Static Serving

**File:** `server/express-static-config.js`

**Usage:**

```javascript
import express from 'express';
import { configureStaticFiles } from './express-static-config.js';

const app = express();

// Configure static files BEFORE routes
configureStaticFiles(app);

// Your API routes
app.use('/api', apiRoutes);
```

**Restart Node:**

```bash
# If using PM2
pm2 restart nectar-api

# Or if using systemd
sudo systemctl restart nectar-api

# Or if running directly
# Stop current process (Ctrl+C) and restart
npm start
```

---

## Testing

### Test 1: Check JS file MIME type

```bash
# Replace with actual JS file from your build
curl -I https://perfumenectar.com/assets/js/index-abc123.js

# Expected:
# HTTP/1.1 200 OK
# Content-Type: application/javascript; charset=utf-8
# Cache-Control: public, max-age=31536000, immutable
```

### Test 2: Check MJS file

```bash
curl -I https://perfumenectar.com/assets/js/vendor-xyz789.mjs

# Expected:
# HTTP/1.1 200 OK
# Content-Type: application/javascript; charset=utf-8
```

### Test 3: Verify SPA fallback still works

```bash
# Should return index.html (not 404)
curl -I https://perfumenectar.com/shop

# Expected:
# HTTP/1.1 200 OK
# Content-Type: text/html; charset=utf-8
```

### Test 4: Verify assets don't fallback

```bash
# Should return 404 (not index.html)
curl -I https://perfumenectar.com/assets/js/nonexistent.js

# Expected:
# HTTP/1.1 404 Not Found
```

---

## Nginx Location Block Order (CRITICAL)

The order matters! Nginx processes locations in this priority:

1. **Exact match** (`location = /path`)
2. **Prefix match** (`location /path`)
3. **Regex match** (`location ~* pattern`)
4. **Longest prefix** (`location /`)

**Correct Order:**
```nginx
# 1. API routes (exact prefix)
location /api { ... }

# 2. Static assets directory (exact prefix)
location /assets/ { ... }

# 3. File extensions (regex - more specific)
location ~* \.(js|mjs)$ { ... }
location ~* \.css$ { ... }

# 4. SPA fallback (catch-all - LAST)
location / { try_files $uri $uri/ /index.html; }
```

---

## Verification Checklist

- [ ] Nginx config tested: `sudo nginx -t`
- [ ] Nginx reloaded: `sudo systemctl reload nginx`
- [ ] JS file returns `Content-Type: application/javascript`
- [ ] MJS file returns `Content-Type: application/javascript`
- [ ] CSS file returns `Content-Type: text/css`
- [ ] SPA routes still work (e.g., `/shop` returns HTML)
- [ ] Assets return 404 when missing (not index.html)
- [ ] Browser console shows no MIME type errors

---

## Troubleshooting

### Issue: Still getting `application/octet-stream`

**Solution:**
1. Check nginx error log: `sudo tail -f /var/log/nginx/error.log`
2. Verify mime.types includes JS: `grep javascript /etc/nginx/mime.types`
3. Clear browser cache: Hard refresh (Ctrl+Shift+R)
4. Check if CDN is caching wrong headers (clear CDN cache)

### Issue: Assets return index.html instead of 404

**Solution:**
- Ensure asset locations use `try_files $uri =404;` (not `/index.html`)
- Verify asset locations come BEFORE `location /`

### Issue: SPA routes return 404

**Solution:**
- Ensure `location /` block exists with `try_files $uri $uri/ /index.html;`
- Verify it's the LAST location block

---

## Quick Reference

### Nginx Reload
```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Test JS File
```bash
curl -I https://perfumenectar.com/assets/js/index-abc123.js | grep Content-Type
```

### Check Nginx Config
```bash
sudo nginx -T | grep -A 10 "location.*js"
```

### View Error Log
```bash
sudo tail -f /var/log/nginx/error.log
```

---

*Last Updated: February 18, 2026*
