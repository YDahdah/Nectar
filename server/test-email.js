/**
 * Test email sending
 * Run: node test-email.js
 */

import dotenv from 'dotenv';
dotenv.config();
import { sendOrderEmail } from './services/emailService.js';
import logger from './utils/logger.js';

const testOrderData = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
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
  shippingMethod: 'Delivery (2-4 days)'
};

const testOrderId = `TEST-${Date.now()}`;

async function testEmail() {
  console.log('\n🧪 Testing email sending...\n');
  console.log('Email configuration:');
  console.log(`  EMAIL_USER: ${process.env.EMAIL_USER || 'Not set'}`);
  console.log(`  EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : 'Not set'}`);
  console.log(`  ORDER_EMAIL: ${process.env.ORDER_EMAIL || 'Not set'}`);
  console.log('\n');

  try {
    const result = await sendOrderEmail(testOrderData, testOrderId);
    
    console.log('\n📧 Email sending result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Recipient: ${result.recipient}`);
      console.log('\n💡 Check your inbox at:', process.env.ORDER_EMAIL || process.env.EMAIL_USER);
    } else {
      console.log('\n❌ Email sending failed!');
      console.log(`   Error: ${result.error}`);
      console.log(`   Error Code: ${result.errorCode || 'N/A'}`);
      console.log('\n💡 Common fixes:');
      console.log('   1. Verify EMAIL_PASSWORD is a Gmail App Password (not regular password)');
      console.log('   2. Enable 2-Step Verification on your Google account');
      console.log('   3. Create App Password at: https://myaccount.google.com/apppasswords');
      console.log('   4. Check spam folder');
    }
  } catch (error) {
    console.error('\n❌ Test failed with exception:');
    console.error(error);
  }
  
  // Keep process alive for a moment to allow async operations
  setTimeout(() => process.exit(0), 2000);
}

testEmail();
