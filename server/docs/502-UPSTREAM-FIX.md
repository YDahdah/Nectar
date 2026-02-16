# Fix 502 Bad Gateway (Nginx upstream)

502 from `api.perfumenectar.com` means Nginx cannot reach the Node backend. Fix upstream connectivity first; CORS is irrelevant until the API responds.

## 1. Check Nginx error log (upstream errors)

On the server:

```bash
sudo tail -100 /var/log/nginx/error.log
```

Look for lines like:
- `connect() failed (111: Connection refused)`
- `upstream timed out`
- `no live upstreams`

That tells you Nginx is trying to connect but the backend is not accepting (wrong port, not running, or not listening on 127.0.0.1).

## 2. See what port the backend is listening on

```bash
ss -lntp
# or: netstat -lntp
```

Find the line for your Node process (e.g. `node` or `server.js`) and note the port (e.g. `0.0.0.0:3000` or `127.0.0.1:3000`). The app default is **3000** (from `PORT` in `.env` or `config.js`).

## 3. Test backend locally

```bash
curl -s http://127.0.0.1:3000/health
```

- If you get JSON like `{"status":"ok",...}`, the backend is running and Nginx’s upstream port is wrong.
- If connection refused, the backend is not running or not listening on that port (start it or fix `PORT`).

## 4. Align Nginx with the backend port

Edit the site config (often `/etc/nginx/sites-available/api.perfumenectar.com`):

- Find the `upstream` block, e.g.:
  ```nginx
  upstream nectar_api {
      server 127.0.0.1:3000;
      keepalive 64;
  }
  ```
- Change `127.0.0.1:3000` to the port your backend actually uses (e.g. `127.0.0.1:3001` if `PORT=3001`).
- Ensure every `proxy_pass` for this API uses that upstream (e.g. `proxy_pass http://nectar_api;`).

Test and reload Nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 5. Start or restart the backend

- **PM2**
  ```bash
  cd /path/to/Nectar2/server
  pm2 start server.js --name nectar-api
  # or if already added:
  pm2 restart nectar-api
  pm2 logs nectar-api
  ```

- **Systemd**
  ```bash
  sudo systemctl start nectar-api   # or your service name
  sudo systemctl status nectar-api
  ```

- **Manual (foreground)**
  ```bash
  cd /path/to/Nectar2/server
  PORT=3000 node server.js
  ```

Ensure `PORT` in the environment (or in `.env`) matches the port in the Nginx upstream (default **3000**).

## 6. Verify

- Local: `curl -s http://127.0.0.1:3000/health`
- Public: `curl -sI https://api.perfumenectar.com/health` (should be 200, not 502)

After 502 is fixed, CORS is already configured in the Node app; no extra CORS step is required for normal requests.
