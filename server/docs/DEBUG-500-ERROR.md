# Debugging 500 Internal Server Error

## Current Status
✅ Proxy is working (no more 502)
❌ Getting 500 Internal Server Error from backend

## Steps to Debug

### 1. Check Backend Server Logs

The server logs will show the exact error. Look for:

```bash
# If running in terminal, you'll see the error immediately
cd server
npm start

# Look for error messages like:
# ❌ Error: ...
# Stack trace: ...
```

### 2. Check What's Being Sent

**In Chrome DevTools:**
1. Open DevTools (F12)
2. Go to Network tab
3. Click "Place Order"
4. Find the failed `/api/orders/checkout` request
5. Click on it
6. Go to "Payload" tab
7. Check the JSON being sent

**Expected payload structure:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "03 123 456",
  "address": "123 Main St",
  "city": "Beirut",
  "caza": "Beirut",
  "country": "Lebanon",
  "items": [
    {
      "id": "product-id",
      "name": "Product Name",
      "price": 50.00,
      "quantity": 1,
      "size": "100ml"
    }
  ],
  "shippingCost": 3.00,
  "totalPrice": 53.00,
  "paymentMethod": "Cash on Delivery",
  "shippingMethod": "Delivery (2-3 Working Days)",
  "notes": ""
}
```

### 3. Test with curl

```bash
curl -i -X POST http://localhost:8080/api/orders/checkout \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8080" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "phone": "03123456",
    "address": "123 Test St",
    "city": "Beirut",
    "caza": "Beirut",
    "country": "Lebanon",
    "items": [{
      "name": "Test Product",
      "price": 50,
      "quantity": 1,
      "size": "100ml"
    }],
    "shippingCost": 3,
    "totalPrice": 53,
    "paymentMethod": "Cash on Delivery",
    "shippingMethod": "Delivery (2-3 Working Days)"
  }'
```

This will show you the exact error response.

### 4. Common Causes

#### A) Missing Required Fields
**Symptoms:** Validation error in logs
**Fix:** Ensure all required fields are present:
- firstName
- lastName  
- phone
- address
- city
- caza
- items (array with at least one item)

#### B) Invalid Phone Format
**Symptoms:** Phone validation fails
**Fix:** Phone should be 8+ digits (Lebanon format)

#### C) Price Mismatch
**Symptoms:** "Total price mismatch" error
**Fix:** Ensure `totalPrice` = `subtotal` + `shippingCost`

#### D) Items Array Issues
**Symptoms:** Error when processing items
**Fix:** Each item must have:
- name (string)
- price (number)
- quantity (number)
- size (string)

#### E) Database Connection (if using DB)
**Symptoms:** Connection errors in logs
**Fix:** Check database is running and `.env` has correct DB config

### 5. Enhanced Logging Added

I've added detailed logging to help debug:

- **Validation middleware** now logs:
  - What fields are present
  - Item count
  - Validation errors

- **Order controller** now logs:
  - Request details
  - Field values
  - Processing steps

### 6. Next Steps

1. **Restart your backend server** to get the new logging:
   ```bash
   cd server
   npm start
   ```

2. **Try checkout again** and watch the server console

3. **Copy the error message** from the server logs

4. **Check the Network tab** in DevTools to see the request/response

The enhanced logging will show exactly where the error occurs!
