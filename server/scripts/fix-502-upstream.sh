set -e

NGINX_ERROR_LOG="${NGINX_ERROR_LOG:-/var/log/nginx/error.log}"
NGINX_SITE="${NGINX_SITE:-/etc/nginx/sites-available/api.perfumenectar.com}"
BACKEND_PORT="${PORT:-3000}"

echo "=== 1. Recent nginx upstream errors (tail of error.log) ==="
if [ -r "$NGINX_ERROR_LOG" ]; then
  sudo tail -50 "$NGINX_ERROR_LOG" | grep -E "upstream|connect|refused|502" || true
else
  echo "Cannot read $NGINX_ERROR_LOG (run with sudo?)"
fi

echo ""
echo "=== 2. What is listening on TCP (backend port) ==="
if command -v ss >/dev/null 2>&1; then
  ss -lntp | grep -E "LISTEN|:${BACKEND_PORT}\s" || ss -lntp
else
  netstat -lntp 2>/dev/null || true
fi

echo ""
echo "=== 3. Backend health (curl 127.0.0.1:${BACKEND_PORT}/health) ==="
if curl -sf --connect-timeout 2 "http://127.0.0.1:${BACKEND_PORT}/health" >/dev/null 2>&1; then
  echo "OK: Backend responds on port ${BACKEND_PORT}"
  curl -s "http://127.0.0.1:${BACKEND_PORT}/health" | head -5
else
  echo "FAIL: No response on 127.0.0.1:${BACKEND_PORT}. Start the Node backend (see below)."
  for p in 3000 3001 8080; do
    if [ "$p" != "$BACKEND_PORT" ] && curl -sf --connect-timeout 1 "http://127.0.0.1:${p}/health" >/dev/null 2>&1; then
      echo "Found backend on port $p. Set Nginx upstream to 127.0.0.1:$p"
    fi
  done
fi

echo ""
echo "=== 4. Nginx site config upstream (proxy_pass target) ==="
if [ -r "$NGINX_SITE" ]; then
  grep -E "server\s+127|proxy_pass|upstream" "$NGINX_SITE" || true
else
  echo "Config not found at $NGINX_SITE. Set NGINX_SITE or copy server/nginx-api.example.conf."
fi

echo ""
echo "=== Next steps ==="
echo "1. If backend is not running: start it (e.g. PORT=${BACKEND_PORT} node server.js, or pm2/systemd)."
echo "2. If backend runs on a different port: edit $NGINX_SITE upstream to server 127.0.0.1:<that_port>; then:"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo "3. Restart backend if you use pm2: pm2 restart nectar-api (or your app name)"
echo "   Or systemd: sudo systemctl restart nectar-api (or your service name)"
