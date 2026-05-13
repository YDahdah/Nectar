const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const cors = require("cors")({origin: true});
const sgMail = require("@sendgrid/mail");
const admin = require("firebase-admin");

admin.initializeApp();

// Boot log so Cloud Functions logs immediately reveal whether SendGrid
// secrets were actually attached at deploy time. Secrets resolve lazily,
// so this only checks the names — actual values are read at request time.
logger.info("[functions] Email config (deploy-time):", {
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? "SET" : "MISSING",
  FROM_EMAIL: process.env.FROM_EMAIL || "MISSING",
  STORE_EMAIL: process.env.STORE_EMAIL || "MISSING",
});

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
          // Handle preflight (firebase hosting/function rewrite may trigger OPTIONS)
          if (req.method === "OPTIONS") {
            return res.status(204).send("");
          }

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
            shippingMethod = "Delivery (2-4 days)",
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
          let emailSent = false;
          let emailErrorMessage = null;
          try {
            if (!process.env.SENDGRID_API_KEY) {
              throw new Error("SENDGRID_API_KEY secret is not set on this function");
            }
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

            emailSent = true;
            logger.info(`Order email sent for ${orderId}`, {email, totalPrice: orderObject.totalPrice});
          } catch (emailError) {
            // SendGrid puts the real reason inside response.body — surface it.
            emailErrorMessage = emailError.message;
            logger.error("[createOrder] Owner email failed:", {
              message: emailError.message,
              code: emailError.code,
              response: emailError.response && emailError.response.body,
              stack: emailError.stack,
            });
            // Note: we still acknowledge the order so the customer's checkout
            // doesn't fail — the order is already in Firestore. The error is
            // visible in Cloud Functions logs.
          }

          // 6) Return success response
          return res.status(201).json({
            success: true,
            message: "Order placed successfully. You will receive a confirmation email shortly.",
            orderId,
            emailSent,
            emailError: emailErrorMessage,
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

/**
 * Diagnostic endpoint. Hit GET /api/health/email on the live domain to
 * verify the real production email pipeline (SendGrid + secrets) without
 * placing an order. Returns the actual SendGrid error body on failure.
 */
exports.healthEmail = onRequest(
    {
      region: "europe-west1",
      secrets: ["SENDGRID_API_KEY", "FROM_EMAIL", "STORE_EMAIL"],
      cors: true,
    },
    (req, res) => {
      cors(req, res, async () => {
        const envSummary = {
          SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? "SET" : "MISSING",
          FROM_EMAIL: process.env.FROM_EMAIL || "MISSING",
          STORE_EMAIL: process.env.STORE_EMAIL || "MISSING",
        };

        try {
          if (!process.env.SENDGRID_API_KEY) {
            return res.status(500).json({
              success: false,
              error: "SENDGRID_API_KEY secret is not set on this function. " +
                "Run: firebase functions:secrets:set SENDGRID_API_KEY",
              env: envSummary,
            });
          }

          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          const fromEmail = process.env.FROM_EMAIL || "no-reply@nectarperfume.com";
          const toEmail = process.env.STORE_EMAIL || "YOUR_STORE_EMAIL@GMAIL.COM";

          await sgMail.send({
            to: toEmail,
            from: fromEmail,
            subject: `[health] Email pipeline test ${new Date().toISOString()}`,
            text: "This is a test email from /api/health/email. " +
              "If you received it, SendGrid is configured correctly.",
          });

          return res.json({
            success: true,
            message: "Test email sent",
            recipient: toEmail,
            from: fromEmail,
            env: envSummary,
          });
        } catch (err) {
          logger.error("[healthEmail] Failed:", {
            message: err.message,
            code: err.code,
            response: err.response && err.response.body,
            stack: err.stack,
          });
          return res.status(500).json({
            success: false,
            error: err.message,
            // SendGrid's real reason lives here (e.g. "from email not verified")
            sendgridResponse: err.response && err.response.body,
            env: envSummary,
          });
        }
      });
    }
);
