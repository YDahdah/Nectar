const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const cors = require("cors")({origin: true});
const sgMail = require("@sendgrid/mail");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Prevent simple HTML injection in emails
 */
function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}

/**
 * Format phone number (basic validation)
 */
function formatPhoneNumber(phone) {
  if (!phone) return null;
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");
  // If it starts with country code, keep it; otherwise assume Lebanon (+961)
  if (cleaned.startsWith("961") && cleaned.length >= 11) {
    return `+${cleaned}`;
  }
  if (cleaned.length >= 8) {
    return `+961${cleaned}`;
  }
  return null;
}

/**
 * Create order endpoint - receives order data, saves to Firestore, sends email
 */
exports.createOrder = onRequest(
    {
      region: "europe-west1", // Change to your preferred region
      secrets: ["SENDGRID_API_KEY", "FROM_EMAIL", "STORE_EMAIL"],
      cors: true,
    },
    (req, res) => {
      cors(req, res, async () => {
        try {
          // 1) Allow only POST
          if (req.method !== "POST") {
            return res.status(405).json({error: "Method not allowed"});
          }

          // 2) Extract and validate order data
          const orderData = req.body || {};

          const {
            firstName,
            lastName,
            email,
            phone,
            address,
            city,
            caza,
            country = "Lebanon",
            items = [],
            shippingCost = 0,
            totalPrice,
            paymentMethod = "Cash on Delivery",
            shippingMethod = "Express Delivery (2-3 Working Days)",
            notes,
          } = orderData;

          // Validation
          if (!firstName || !lastName || !email || !phone) {
            return res.status(400).json({
              error: "Missing required fields: firstName, lastName, email, phone",
            });
          }

          if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({error: "Order must contain at least one item"});
          }

          if (!totalPrice || (typeof totalPrice !== "number" && typeof totalPrice !== "string")) {
            return res.status(400).json({error: "Invalid totalPrice"});
          }

          // Format phone number
          const formattedPhone = formatPhoneNumber(phone);
          if (!formattedPhone) {
            return res.status(400).json({error: "Invalid phone number format"});
          }

          // Calculate subtotal from items
          const subtotal = items.reduce(
              (sum, item) => sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0),
              0
          );

          // Generate order ID
          const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;

          // Create order object
          const orderObject = {
            orderId,
            firstName,
            lastName,
            email,
            phone: formattedPhone,
            address: address || null,
            city: city || null,
            caza: caza || null,
            country,
            items,
            subtotal,
            shippingCost: parseFloat(shippingCost) || 0,
            totalPrice: parseFloat(totalPrice) || subtotal + parseFloat(shippingCost),
            paymentMethod,
            shippingMethod,
            notes: notes || null,
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            ipAddress: req.ip || null,
            userAgent: req.get("user-agent") || null,
          };

          logger.info(`Processing order ${orderId}...`);

          // 3) Save to Firestore
          try {
            await admin.firestore().collection("orders").add(orderObject);
            logger.info(`Order ${orderId} saved to Firestore`);
          } catch (firestoreError) {
            logger.error("Failed to save order to Firestore", firestoreError);
            // Continue even if Firestore fails - email is more critical
          }

          // 4) Build email HTML
          const customerName = `${firstName} ${lastName}`;
          const fullAddress = [address, city, caza, country]
              .filter(Boolean)
              .join(", ");

          const itemsHtml = items
              .map(
                  (i) => `
                <tr>
                  <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(i.name || "Unknown")}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${escapeHtml(String(i.quantity || 0))}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(String(i.size || ""))}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">$${escapeHtml(String(parseFloat(i.price) || 0).toFixed(2))}</td>
                </tr>`
              )
              .join("");

          const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
                h3 { color: #34495e; margin-top: 20px; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th { background-color: #f8f9fa; text-align: left; padding: 10px 12px; border-bottom: 2px solid #ddd; }
                td { padding: 8px 12px; border-bottom: 1px solid #eee; }
                .total { font-size: 18px; font-weight: bold; color: #27ae60; margin-top: 15px; }
                .info-box { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>🛍️ New Perfume Order</h2>
                
                <div class="info-box">
                  <p><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
                  <p><strong>Customer Name:</strong> ${escapeHtml(customerName)}</p>
                  <p><strong>Email:</strong> ${escapeHtml(email)}</p>
                  <p><strong>Phone:</strong> ${escapeHtml(formattedPhone)}</p>
                  ${fullAddress ? `<p><strong>Address:</strong> ${escapeHtml(fullAddress)}</p>` : ""}
                  <p><strong>Payment Method:</strong> ${escapeHtml(paymentMethod)}</p>
                  <p><strong>Shipping Method:</strong> ${escapeHtml(shippingMethod)}</p>
                  ${notes ? `<p><strong>Notes:</strong> ${escapeHtml(notes)}</p>` : ""}
                </div>

                <h3>Order Items</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style="text-align:center;">Qty</th>
                      <th>Size</th>
                      <th style="text-align:right;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>

                <div style="margin-top: 20px; text-align: right;">
                  <p><strong>Subtotal:</strong> $${subtotal.toFixed(2)}</p>
                  <p><strong>Shipping:</strong> $${parseFloat(shippingCost).toFixed(2)}</p>
                  <p class="total">Total: $${parseFloat(orderObject.totalPrice).toFixed(2)}</p>
                </div>

                <p style="margin-top: 30px; color: #7f8c8d; font-size: 12px;">
                  This order was placed through your website at ${new Date().toLocaleString()}.
                </p>
              </div>
            </body>
            </html>
          `;

          // 5) Send email via SendGrid
          try {
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);

            const fromEmail = process.env.FROM_EMAIL || "no-reply@nectarperfume.com";
            const toEmail = process.env.STORE_EMAIL || "YOUR_STORE_EMAIL@GMAIL.COM";
            const subject = `New Order #${orderId} - ${customerName}`;

            await sgMail.send({
              to: toEmail,
              from: fromEmail, // Must be verified in SendGrid
              subject,
              html,
              replyTo: email, // So you can reply directly to customer
            });

            logger.info(`Order email sent for ${orderId}`, {email, totalPrice: orderObject.totalPrice});
          } catch (emailError) {
            logger.error("Failed to send order email", emailError);
            // Still return success if email fails - order is saved
            // You might want to handle this differently in production
          }

          // 6) Return success response
          return res.status(201).json({
            success: true,
            message: "Order placed successfully. You will receive a confirmation email shortly.",
            orderId,
          });
        } catch (err) {
          logger.error("createOrder failed", err);
          return res.status(500).json({
            error: "Internal server error",
            message: err.message,
          });
        }
      });
    }
);
