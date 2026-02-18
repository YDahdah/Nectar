#!/bin/bash
# Fix MIME types for JavaScript modules in nginx
# This script ensures .js and .mjs files are served with application/javascript

set -e

echo "🔧 Fixing nginx MIME types for JavaScript modules..."

# Find nginx config file (common locations)
NGINX_CONFIG=""
if [ -f "/etc/nginx/sites-available/perfumenectar.com" ]; then
    NGINX_CONFIG="/etc/nginx/sites-available/perfumenectar.com"
elif [ -f "/etc/nginx/sites-available/default" ]; then
    NGINX_CONFIG="/etc/nginx/sites-available/default"
else
    echo "❌ Could not find nginx config file"
    echo "Please specify the path to your nginx config file"
    exit 1
fi

echo "📝 Found nginx config: $NGINX_CONFIG"

# Backup the config
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

# Check if the fix is already applied
if grep -q "types.*application/javascript.*js.*mjs" "$NGINX_CONFIG"; then
    echo "⚠️  MIME type fix appears to already be applied"
    echo "Checking if it's in the right location..."
fi

# Create a temporary file with the fix
TEMP_FILE=$(mktemp)

# Read the config and inject the fix
cat > "$TEMP_FILE" << 'FIX_CONFIG'
    # CRITICAL FIX: Set proper MIME types for JavaScript modules
    # This fixes "Expected a JavaScript-or-Wasm module script" error
    # Must be inside the server block, before location blocks
    
    # Ensure mime.types is included
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Override MIME types for JS files using map (most reliable method)
    map $sent_http_content_type $content_type_override {
        ~^application/octet-stream$ application/javascript;
        default $sent_http_content_type;
    }
FIX_CONFIG

# Check if we need to add the fix
if ! grep -q "CRITICAL FIX: Set proper MIME types" "$NGINX_CONFIG"; then
    # Find the server block and insert after SSL config
    if grep -q "ssl_prefer_server_ciphers" "$NGINX_CONFIG"; then
        # Insert after ssl_prefer_server_ciphers line
        sed -i '/ssl_prefer_server_ciphers on;/r '"$TEMP_FILE" "$NGINX_CONFIG"
        echo "✅ Added MIME type fix to nginx config"
    else
        # Insert after root directive
        sed -i '/^[[:space:]]*root[[:space:]]/r '"$TEMP_FILE" "$NGINX_CONFIG"
        echo "✅ Added MIME type fix to nginx config"
    fi
else
    echo "⚠️  MIME type fix already exists in config"
fi

# Update the JS location block to use the correct type
if grep -q "location ~\* \\.(js|mjs)" "$NGINX_CONFIG"; then
    # Replace the location block with proper type setting
    sed -i 's|location ~\* \\.(js|mjs)$|location ~* \\.(js|mjs)$ {\n        types { application/javascript js mjs; }\n        default_type application/javascript;|' "$NGINX_CONFIG"
    echo "✅ Updated JS location block"
fi

# Clean up temp file
rm "$TEMP_FILE"

# Test nginx config
echo ""
echo "🧪 Testing nginx configuration..."
if sudo nginx -t; then
    echo ""
    echo "✅ Nginx configuration is valid!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Review the changes: diff $BACKUP_FILE $NGINX_CONFIG"
    echo "2. If everything looks good, reload nginx:"
    echo "   sudo systemctl reload nginx"
    echo ""
    echo "3. Test your site - the MIME type error should be fixed!"
else
    echo ""
    echo "❌ Nginx configuration test failed!"
    echo "Restoring backup..."
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    echo "Backup restored. Please check the config manually."
    exit 1
fi
