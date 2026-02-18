# MIME Type Fix Guide: JavaScript Module Error

## Error Message
```
Failed to load module script: Expected a JavaScript-or-Wasm module script 
but the server responded with a MIME type of "application/octet-stream"
```

## Quick Diagnosis

Run the diagnostic script (on Linux/Mac):
```bash
bash server/scripts/diagnose-mime-types.sh perfumenectar.com
```

Or manually check:
```bash
curl -I https://perfumenectar.com/assets/index.js
# Look for: Content-Type: application/javascript; charset=utf-8
```

## Solution by Server Type

### Option 1: Using Nginx (Production - Recommended)

**Your nginx config already has the fix!** Just ensure it's deployed:

1. **Deploy the config:**
   ```bash
   sudo cp server/nginx-frontend.conf /etc/nginx/sites-available/perfumenectar.com
   ```

2. **Test the configuration:**
   ```bash
   sudo nginx -t
   ```

3. **Reload nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

4. **Verify it's working:**
   ```bash
   curl -I https://perfumenectar.com/assets/index.js
   # Should show: Content-Type: application/javascript; charset=utf-8
   ```

**Key points in the nginx config:**
- ✅ `include /etc/nginx/mime.types;` is included
- ✅ JavaScript files have explicit `types { application/javascript js mjs; }`
- ✅ Static asset locations come BEFORE `location /` (SPA fallback)
- ✅ Assets use `try_files $uri =404;` (no fallback to index.html)

### Option 2: Using Express (Development/Local)

If serving files through Express, ensure `express-static-config.js` is used:

1. **Import and use in server.js:**
   ```javascript
   import { configureStaticFiles } from './express-static-config.js';
   
   // Add this BEFORE API routes
   configureStaticFiles(app);
   ```

2. **Restart the server:**
   ```bash
   npm start
   # or
   pm2 restart nectar-api
   ```

### Option 3: Using Vite Dev Server (Local Development)

Vite handles MIME types correctly by default. If you see this error:

1. **Ensure you're using the dev server:**
   ```bash
   cd your-dream-website
   npm run dev
   ```

2. **Access via http://localhost:5173** (not file://)

3. **Check vite.config.ts** - should have no special MIME type config needed

## Common Issues

### Issue 1: Nginx config not deployed
**Symptom:** Config file exists but changes don't take effect
**Fix:** 
```bash
sudo cp server/nginx-frontend.conf /etc/nginx/sites-available/perfumenectar.com
sudo nginx -t && sudo systemctl reload nginx
```

### Issue 2: Wrong file order in nginx
**Symptom:** JS files return HTML (index.html)
**Fix:** Ensure static asset `location` blocks come BEFORE `location /`

### Issue 3: Missing mime.types include
**Symptom:** All files return `application/octet-stream`
**Fix:** Add `include /etc/nginx/mime.types;` in nginx config

### Issue 4: Express not using static config
**Symptom:** Express serves files but with wrong MIME type
**Fix:** Import and use `configureStaticFiles()` from `express-static-config.js`

### Issue 5: CDN/Proxy caching wrong headers
**Symptom:** Works locally but fails in production
**Fix:** Clear CDN cache or wait for cache expiry

## Testing

### Test 1: Check JavaScript file MIME type
```bash
curl -I https://perfumenectar.com/assets/index.js | grep -i content-type
# Expected: Content-Type: application/javascript; charset=utf-8
```

### Test 2: Check in browser DevTools
1. Open browser DevTools (F12)
2. Go to Network tab
3. Reload page
4. Click on a `.js` file
5. Check Response Headers → Content-Type
6. Should be: `application/javascript` or `text/javascript`

### Test 3: Test module loading
```javascript
// In browser console:
import('https://perfumenectar.com/assets/index.js')
  .then(() => console.log('✅ Module loaded successfully'))
  .catch(err => console.error('❌ Module failed:', err));
```

## Verification Checklist

- [ ] Nginx config deployed to `/etc/nginx/sites-available/`
- [ ] Nginx config tested: `sudo nginx -t` passes
- [ ] Nginx reloaded: `sudo systemctl reload nginx`
- [ ] JavaScript files return `Content-Type: application/javascript`
- [ ] Static asset locations come before SPA fallback
- [ ] Browser DevTools shows correct MIME type
- [ ] No errors in browser console

## Still Not Working?

1. **Check nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

2. **Check if files exist:**
   ```bash
   ls -la /home/ubuntu/Nectar/your-dream-website/dist/assets/
   ```

3. **Test nginx config syntax:**
   ```bash
   sudo nginx -t
   ```

4. **Check file permissions:**
   ```bash
   ls -la /home/ubuntu/Nectar/your-dream-website/dist/
   ```

5. **Verify mime.types file exists:**
   ```bash
   cat /etc/nginx/mime.types | grep javascript
   ```

## Additional Resources

- [MDN: MIME Types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)
- [Nginx: MIME Types](http://nginx.org/en/docs/http/ngx_http_core_module.html#types)
- [Express: Static Files](https://expressjs.com/en/starter/static-files.html)
