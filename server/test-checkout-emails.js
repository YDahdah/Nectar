/**
 * Test checkout email flow - simulates a real checkout
 * Run: node test-checkout-emails.js
 * 
 * This will test both owner and customer emails as they would be sent during checkout
 */

import dotenv from 'dotenv';
dotenv.config();
import { sendOrderEmail, sendCustomerConfirmationEmail } from './services/emailService.js';
import logger from './utils/logger.js';

// Use real email addresses for testing
const ownerEmail = process.env.ORDER_EMAIL || process.env.EMAIL_USER || 'lbnectar@gmail.com';
const customerEmail = process.env.TEST_CUSTOMER_EMAIL || 'lbnectar@gmail.com'; // Use your email for testing

const testOrderData = {
  firstName: 'Test',
  lastName: 'Customer',
  email: customerEmail,
  phone: '+9613123456',
  address: '123 Test Street',
  city: 'Beirut',
  caza: 'Beirut',
  country: 'Lebanon',
  items: [
    {
      name: 'Test Product',
      price: 50.00,
      quantity: 1,
      size: '100ml'
    }
  ],
  shippingCost: 3.00,
  totalPrice: 53.00,
  paymentMethod: 'Cash on Delivery',
  shippingMethod: 'Express Delivery (2-3 Working Days)'
};

const testOrderId = `TEST-CHECKOUT-${Date.now()}`;

async function testCheckoutEmails() {
  console.log('\n🧪 Testing checkout email flow (simulating real checkout)...\n');
  console.log('Configuration:');
  console.log(`  Owner email (ORDER_EMAIL): ${ownerEmail}`);
  console.log(`  Customer email: ${customerEmail}`);
  console.log(`  Test order ID: ${testOrderId}`);
  console.log('\n');

  const results = {
    ownerEmail: { success: false },
    customerEmail: { success: false }
  };

  // Test 1: Owner notification email (sendOrderEmail)
  console.log('📧 Test 1: Sending owner notification email...');
  console.log(`   Should be sent to: ${ownerEmail}`);
  try {
    results.ownerEmail = await sendOrderEmail(testOrderData, testOrderId);
    
    if (results.ownerEmail.success) {
      console.log(`   ✅ Owner email sent successfully!`);
      console.log(`   Message ID: ${results.ownerEmail.messageId}`);
      console.log(`   Recipient: ${results.ownerEmail.recipient}`);
    } else {
      console.log(`   ❌ Owner email failed!`);
      console.log(`   Error: ${results.ownerEmail.error}`);
      console.log(`   Error Code: ${results.ownerEmail.errorCode || 'N/A'}`);
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
    results.ownerEmail = { success: false, error: error.message };
  }

  console.log('\n');

  // Test 2: Customer confirmation email (sendCustomerConfirmationEmail)
  console.log('📧 Test 2: Sending customer confirmation email...');
  console.log(`   Should be sent to: ${customerEmail}`);
  try {
    results.customerEmail = await sendCustomerConfirmationEmail(testOrderData, testOrderId);
    
    if (results.customerEmail.success) {
      console.log(`   ✅ Customer email sent successfully!`);
      console.log(`   Message ID: ${results.customerEmail.messageId}`);
      console.log(`   Recipient: ${results.customerEmail.recipient}`);
    } else {
      console.log(`   ❌ Customer email failed!`);
      console.log(`   Error: ${results.customerEmail.error}`);
      console.log(`   Error Code: ${results.customerEmail.errorCode || 'N/A'}`);
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
    results.customerEmail = { success: false, error: error.message };
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Owner Email (${ownerEmail}):`);
  console.log(`  Status: ${results.ownerEmail.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  if (results.ownerEmail.error) {
    console.log(`  Error: ${results.ownerEmail.error}`);
  }
  
  console.log(`\nCustomer Email (${customerEmail}):`);
  console.log(`  Status: ${results.customerEmail.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  if (results.customerEmail.error) {
    console.log(`  Error: ${results.customerEmail.error}`);
  }

  console.log('\n💡 Next steps:');
  if (results.ownerEmail.success) {
    console.log(`   1. Check inbox at ${ownerEmail} for owner notification`);
    console.log('   2. Check spam folder if not in inbox');
  }
  if (results.customerEmail.success) {
    console.log(`   3. Check inbox at ${customerEmail} for customer confirmation`);
    console.log('   4. Check spam folder if not in inbox');
  }
  if (!results.ownerEmail.success || !results.customerEmail.success) {
    console.log('   5. Check server logs above for detailed error messages');
    console.log('   6. Verify EMAIL_USER and EMAIL_PASSWORD in server/.env');
  }

  // Keep process alive for a moment to allow async operations
  setTimeout(() => process.exit(0), 2000);
}

testCheckoutEmails();
