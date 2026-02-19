// Quick test script to verify server is running
import http from 'http';

const testUrl = 'http://localhost:3000/health';

http.get(testUrl, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ Server is running!');
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    process.exit(0);
  });
}).on('error', (err) => {
  console.error('❌ Server is NOT running:', err.message);
  console.log('\n💡 Start the server with: cd server && npm start');
  process.exit(1);
});
