#!/bin/bash
# Test script to verify MIME types are correct
# Usage: ./test-mime-types.sh [domain]

DOMAIN="${1:-https://perfumenectar.com}"

echo "Testing MIME types for $DOMAIN"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_mime_type() {
    local url=$1
    local expected=$2
    local description=$3
    
    echo -n "Testing $description... "
    
    response=$(curl -sI "$url" 2>/dev/null)
    content_type=$(echo "$response" | grep -i "content-type:" | cut -d' ' -f2- | tr -d '\r')
    status=$(echo "$response" | head -n1 | awk '{print $2}')
    
    if [ "$status" = "200" ] || [ "$status" = "404" ]; then
        if echo "$content_type" | grep -qi "$expected"; then
            echo -e "${GREEN}✓${NC} Content-Type: $content_type"
            return 0
        else
            echo -e "${RED}✗${NC} Expected: $expected, Got: $content_type"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠${NC} Status: $status (file may not exist)"
        return 2
    fi
}

# Find a JS file in the build (you may need to adjust this)
echo "Finding test files..."
JS_FILE=$(find your-dream-website/dist/assets/js -name "*.js" -type f 2>/dev/null | head -n1)
MJS_FILE=$(find your-dream-website/dist/assets/js -name "*.mjs" -type f 2>/dev/null | head -n1)
CSS_FILE=$(find your-dream-website/dist/assets/css -name "*.css" -type f 2>/dev/null | head -n1)

if [ -z "$JS_FILE" ]; then
    echo -e "${YELLOW}Warning: No JS files found in dist. Using example paths.${NC}"
    JS_FILE="/assets/js/index-abc123.js"
    MJS_FILE="/assets/js/vendor-xyz789.mjs"
    CSS_FILE="/assets/css/index-def456.css"
else
    # Extract relative path
    JS_FILE="/${JS_FILE#*/dist/}"
    if [ -n "$MJS_FILE" ]; then
        MJS_FILE="/${MJS_FILE#*/dist/}"
    else
        MJS_FILE="/assets/js/vendor-xyz789.mjs"
    fi
    CSS_FILE="/${CSS_FILE#*/dist/}"
fi

echo ""
echo "Test Files:"
echo "  JS:  $JS_FILE"
echo "  MJS: $MJS_FILE"
echo "  CSS: $CSS_FILE"
echo ""

# Run tests
FAILED=0

test_mime_type "$DOMAIN$JS_FILE" "application/javascript" "JavaScript file (.js)"
[ $? -eq 1 ] && FAILED=$((FAILED + 1))

test_mime_type "$DOMAIN$MJS_FILE" "application/javascript" "JavaScript module (.mjs)"
[ $? -eq 1 ] && FAILED=$((FAILED + 1))

test_mime_type "$DOMAIN$CSS_FILE" "text/css" "CSS file (.css)"
[ $? -eq 1 ] && FAILED=$((FAILED + 1))

test_mime_type "$DOMAIN/shop" "text/html" "SPA route (/shop)"
[ $? -eq 1 ] && FAILED=$((FAILED + 1))

test_mime_type "$DOMAIN/assets/js/nonexistent.js" "404" "Non-existent asset (should 404)"
[ $? -eq 1 ] && FAILED=$((FAILED + 1))

echo ""
echo "=================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}$FAILED test(s) failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check nginx config: sudo nginx -t"
    echo "2. Reload nginx: sudo systemctl reload nginx"
    echo "3. Check error log: sudo tail -f /var/log/nginx/error.log"
    echo "4. Verify mime.types: grep javascript /etc/nginx/mime.types"
    exit 1
fi
