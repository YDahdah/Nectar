#!/bin/bash
# Test checkout endpoint
# Usage: ./test-checkout.sh

API_URL="${1:-https://api.perfumenectar.com}"

echo "Testing checkout endpoint: $API_URL/api/orders/checkout"
echo "=================================="
echo ""

# Sample order data
ORDER_DATA='{
  "firstName": "John",
  "lastName": "Doe",
  "email": "test@example.com",
  "phone": "81353685",
  "address": "123 Test Street",
  "city": "Beirut",
  "caza": "Beirut",
  "country": "Lebanon",
  "items": [
    {
      "id": "test-1",
      "name": "Test Product",
      "size": "50ml",
      "quantity": 1,
      "price": 6.99
    }
  ],
  "shippingCost": 2.0,
  "totalPrice": 8.99,
  "paymentMethod": "Cash on Delivery",
  "shippingMethod": "Express Delivery (2-3 Working Days)"
}'

echo "Sending test order..."
echo ""

response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://perfumenectar.com" \
  -d "$ORDER_DATA" \
  "$API_URL/api/orders/checkout")

http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $http_status"
echo ""
echo "Response:"
echo "$body" | jq . 2>/dev/null || echo "$body"
echo ""

if [ "$http_status" = "201" ]; then
  echo "✅ Checkout test PASSED"
  exit 0
else
  echo "❌ Checkout test FAILED"
  exit 1
fi
