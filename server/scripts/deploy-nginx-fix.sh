#!/bin/bash
# Quick script to deploy nginx MIME type fix

set -e

echo "🔧 Deploying nginx MIME type fix..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Backup current config
NGINX_CONFIG="/etc/nginx/sites-available/perfumenectar.com"
if [ -f "$NGINX_CONFIG" ]; then
    BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$NGINX_CONFIG" "$BACKUP_FILE"
    echo "✅ Backup created: $BACKUP_FILE"
else
    echo "⚠️  Config file not found at $NGINX_CONFIG"
    echo "Please update the NGINX_CONFIG variable in this script"
    exit 1
fi

# Copy new config
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
NEW_CONFIG="$PROJECT_ROOT/server/nginx-frontend.conf"

if [ ! -f "$NEW_CONFIG" ]; then
    echo "❌ New config file not found at $NEW_CONFIG"
    exit 1
fi

cp "$NEW_CONFIG" "$NGINX_CONFIG"
echo "✅ Config copied"

# Test configuration
echo "🧪 Testing nginx configuration..."
if nginx -t; then
    echo "✅ Configuration test passed"
else
    echo "❌ Configuration test failed - restoring backup"
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    exit 1
fi

# Reload nginx
echo "🔄 Reloading nginx..."
systemctl reload nginx
echo "✅ Nginx reloaded"

echo ""
echo "✅ Fix deployed successfully!"
echo ""
echo "Test with:"
echo "  curl -I https://perfumenectar.com/assets/react-vendor-B984J_S_.js"
echo ""
echo "Expected: Content-Type: application/javascript; charset=utf-8"
