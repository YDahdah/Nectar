#!/bin/bash
# Diagnostic script to identify MIME type issues
# This helps determine which server is serving files and what MIME types are being sent

set -e

echo "🔍 MIME Type Diagnostic Tool"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get domain from user or use default
DOMAIN="${1:-perfumenectar.com}"
echo "Testing domain: ${DOMAIN}"
echo ""

# Function to check MIME type
check_mime_type() {
    local url=$1
    local expected_type=$2
    local file_type=$3
    
    echo -n "Checking ${file_type} file... "
    
    # Get headers
    response=$(curl -sI "${url}" 2>&1)
    content_type=$(echo "${response}" | grep -i "content-type" | cut -d: -f2 | tr -d ' \r\n' || echo "")
    status=$(echo "${response}" | head -n1 | awk '{print $2}')
    
    if [ -z "${content_type}" ]; then
        echo -e "${RED}❌ FAILED${NC}"
        echo "   Status: ${status}"
        echo "   Content-Type header missing!"
        echo "   Full response:"
        echo "${response}" | head -n5
        return 1
    fi
    
    # Check if content type matches expected
    if echo "${content_type}" | grep -qi "${expected_type}"; then
        echo -e "${GREEN}✅ OK${NC}"
        echo "   Content-Type: ${content_type}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "   Expected: ${expected_type}"
        echo "   Got: ${content_type}"
        return 1
    fi
}

# Test JavaScript files (most common issue)
echo "1. Testing JavaScript Module Files"
echo "-----------------------------------"

# Try to find a JS file in assets
js_url=""
if curl -sI "https://${DOMAIN}/assets/index.js" | head -n1 | grep -q "200"; then
    js_url="https://${DOMAIN}/assets/index.js"
elif curl -sI "https://${DOMAIN}/assets/js/index.js" | head -n1 | grep -q "200"; then
    js_url="https://${DOMAIN}/assets/js/index.js"
else
    # Try to get index.html and parse for script src
    echo "   Attempting to find JS files from index.html..."
    html=$(curl -s "https://${DOMAIN}/")
    js_files=$(echo "${html}" | grep -oP 'src="[^"]*\.js[^"]*"' | head -n1 | sed 's/src="//;s/"//')
    if [ -n "${js_files}" ]; then
        js_url="https://${DOMAIN}${js_files}"
    fi
fi

if [ -n "${js_url}" ]; then
    check_mime_type "${js_url}" "application/javascript\|text/javascript" "JavaScript"
else
    echo -e "${YELLOW}⚠️  Could not find a JavaScript file to test${NC}"
    echo "   Please provide a direct URL to a .js file"
fi

echo ""
echo "2. Testing CSS Files"
echo "--------------------"
css_url="https://${DOMAIN}/assets/index.css"
if curl -sI "${css_url}" | head -n1 | grep -q "200"; then
    check_mime_type "${css_url}" "text/css" "CSS"
else
    echo -e "${YELLOW}⚠️  CSS file not found at ${css_url}${NC}"
fi

echo ""
echo "3. Server Information"
echo "---------------------"
echo "Checking which server is responding..."

server_header=$(curl -sI "https://${DOMAIN}/" | grep -i "server:" | cut -d: -f2 | tr -d ' \r\n' || echo "Not found")
echo "Server: ${server_header:-'Not specified'}"

powered_by=$(curl -sI "https://${DOMAIN}/" | grep -i "x-powered-by:" | cut -d: -f2 | tr -d ' \r\n' || echo "Not found")
if [ "${powered_by}" != "Not found" ]; then
    echo "X-Powered-By: ${powered_by}"
fi

echo ""
echo "4. Recommendations"
echo "------------------"

if echo "${server_header}" | grep -qi "nginx"; then
    echo -e "${GREEN}✓${NC} Using nginx - check nginx configuration"
    echo "  1. Ensure nginx-frontend.conf is deployed"
    echo "  2. Run: sudo nginx -t"
    echo "  3. Run: sudo systemctl reload nginx"
    echo "  4. Check: /etc/nginx/sites-available/perfumenectar.com"
elif echo "${powered_by}" | grep -qi "express"; then
    echo -e "${YELLOW}⚠${NC}  Using Express - ensure express-static-config.js is used"
    echo "  Check server.js imports configureStaticFiles"
else
    echo -e "${YELLOW}⚠${NC}  Unknown server - check your deployment configuration"
fi

echo ""
echo "5. Quick Fix Commands"
echo "---------------------"
echo "If using nginx:"
echo "  sudo cp server/nginx-frontend.conf /etc/nginx/sites-available/perfumenectar.com"
echo "  sudo nginx -t"
echo "  sudo systemctl reload nginx"
echo ""
echo "If using Express:"
echo "  Ensure server.js imports and uses configureStaticFiles from express-static-config.js"
echo ""
