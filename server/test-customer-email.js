/**
 * Test customer confirmation email sending
 * Run: node test-customer-email.js
 */

import dotenv from 'dotenv';
dotenv.config();
import { sendCustomerConfirmationEmail } from './services/emailService.js';
import logger from './utils/logger.js';

// IMPORTANT: Use a REAL email address for testing!
// test@example.com will FAIL because example.com doesn't accept email (Null MX record)
const customerEmail = process.env.TEST_CUSTOMER_EMAIL || 'your-real-email@gmail.com';

const testOrderData = {
  firstName: 'Test',
  lastName: 'User',
  email: customerEmail, // Use a REAL email address - example.com/test.com won't work!
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

const testOrderId = `TEST-CUSTOMER-${Date.now()}`;

async function testCustomerEmail() {
  console.log('\n🧪 Testing customer confirmation email sending...\n');
  
  // Warn if using placeholder email
  if (testOrderData.email.includes('example.com') || testOrderData.email.includes('your-real-email')) {
    console.log('⚠️  WARNING: You are using a placeholder email address!');
    console.log('   Set TEST_CUSTOMER_EMAIL environment variable with a REAL email address.');
    console.log('   Example: TEST_CUSTOMER_EMAIL=your-email@gmail.com node test-customer-email.js');
    console.log('   test@example.com will FAIL because example.com has a Null MX record.\n');
  }
  
  console.log('Email configuration:');
  console.log(`  EMAIL_USER: ${process.env.EMAIL_USER || 'Not set'}`);
  console.log(`  EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : 'Not set'}`);
  console.log(`  Customer email: ${testOrderData.email}`);
  console.log('\n');

  try {
    const result = await sendCustomerConfirmationEmail(testOrderData, testOrderId);
    
    console.log('\n📧 Customer email sending result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Customer confirmation email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Recipient: ${result.recipient}`);
      console.log(`\n💡 Check your inbox at: ${testOrderData.email}`);
      console.log('   (Also check spam folder)');
    } else {
      console.log('\n❌ Customer confirmation email sending failed!');
      console.log(`   Error: ${result.error}`);
      console.log(`   Error Code: ${result.errorCode || 'N/A'}`);
      console.log('\n💡 Common fixes:');
      console.log('   1. Verify EMAIL_PASSWORD is a Gmail App Password (not regular password)');
      console.log('   2. Enable 2-Step Verification on your Google account');
      console.log('   3. Create App Password at: https://myaccount.google.com/apppasswords');
      console.log('   4. Check spam folder');
      console.log('   5. Verify customer email address is valid');
    }
  } catch (error) {
    console.error('\n❌ Test failed with exception:');
    console.error(error);
  }
  
  // Keep process alive for a moment to allow async operations
  setTimeout(() => process.exit(0), 2000);
}

testCustomerEmail();
