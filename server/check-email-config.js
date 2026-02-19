/**
 * Check current email configuration
 * Run: node check-email-config.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: join(__dirname, '.env') });

console.log('\n📧 Email Configuration Check\n');
console.log('='.repeat(60));
console.log('Environment Variables:');
console.log('='.repeat(60));
console.log(`EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`);
console.log(`EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET'}`);
console.log(`ORDER_EMAIL: ${process.env.ORDER_EMAIL || 'NOT SET'}`);
console.log(`EMAIL_APP_PASSWORD: ${process.env.EMAIL_APP_PASSWORD ? '***' + process.env.EMAIL_APP_PASSWORD.slice(-4) : 'NOT SET'}`);
console.log('\n' + '='.repeat(60));
console.log('Configuration Object (from config.js):');
console.log('='.repeat(60));

// Import config after loading env
const config = (await import('./config/config.js')).default;

console.log(`config.email.user: ${config.email.user || 'NOT SET'}`);
console.log(`config.email.password: ${config.email.password ? '***' + config.email.password.slice(-4) : 'NOT SET'}`);
console.log(`config.email.orderEmail: ${config.email.orderEmail || 'NOT SET'}`);

console.log('\n' + '='.repeat(60));
console.log('Expected Behavior:');
console.log('='.repeat(60));
console.log(`Order emails should be sent TO: ${config.email.orderEmail || config.email.user || 'NOT CONFIGURED'}`);
console.log(`Emails will be sent FROM: ${config.email.user || 'NOT CONFIGURED'}`);

if (config.email.orderEmail === 'youssefdahdah44@gmail.com' || config.email.user === 'youssefdahdah44@gmail.com') {
  console.log('\n⚠️  WARNING: Old email address detected!');
  console.log('   The server is still using youssefdahdah44@gmail.com');
  console.log('   Make sure you have:');
  console.log('   1. Updated server/.env file');
  console.log('   2. Restarted the server');
  console.log('   3. If deployed, updated environment variables in Cloud Run/Kubernetes');
}

if (config.email.orderEmail === 'lbnectar@gmail.com' && config.email.user === 'lbnectar@gmail.com') {
  console.log('\n✅ Configuration looks correct!');
  console.log('   If emails are still going to the wrong address:');
  console.log('   1. Make sure the server has been restarted');
  console.log('   2. Check if you have a production deployment that needs updating');
}

console.log('\n');
