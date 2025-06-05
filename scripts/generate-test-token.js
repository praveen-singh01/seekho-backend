#!/usr/bin/env node

/**
 * 🧪 Test Google ID Token Generator
 * 
 * This script generates valid JWT tokens for testing the Android authentication
 * endpoint without requiring actual Google OAuth flow.
 */

const crypto = require('crypto');

// Function to base64url encode
function base64urlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Function to generate a test Google ID token
function generateTestGoogleIdToken(userData = {}) {
  // Default user data
  const defaultUser = {
    sub: '123456789012345678901',
    name: 'Test User',
    email: 'test.user@gmail.com',
    picture: 'https://lh3.googleusercontent.com/a-/AOh14GhT_example',
    iss: 'accounts.google.com',
    aud: process.env.ANDROID_CLIENT_ID || '601890245278-8bm75vhctl3udijcf3uj1kmdrm848krr.apps.googleusercontent.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    email_verified: true,
    given_name: 'Test',
    family_name: 'User',
    locale: 'en'
  };

  // Merge with provided user data
  const user = { ...defaultUser, ...userData };

  // JWT Header
  const header = {
    alg: 'RS256',
    kid: '1670271038',
    typ: 'JWT'
  };

  // Create the token parts
  const headerEncoded = base64urlEncode(JSON.stringify(header));
  const payloadEncoded = base64urlEncode(JSON.stringify(user));
  
  // For testing, we'll use a dummy signature
  const signature = base64urlEncode('dummy_signature_for_testing');

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

// Function to decode and display token contents
function decodeToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    return { header, payload };
  } catch (error) {
    throw new Error(`Failed to decode token: ${error.message}`);
  }
}

// CLI functionality
if (require.main === module) {
  const args = process.argv.slice(2);
  
  console.log('🧪 Google ID Token Generator for Testing\n');

  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage:');
    console.log('  node scripts/generate-test-token.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --name "John Doe"           Set user name');
    console.log('  --email "john@gmail.com"    Set user email');
    console.log('  --sub "123456789"           Set user Google ID');
    console.log('  --expired                   Generate expired token');
    console.log('  --decode <token>            Decode existing token');
    console.log('  --help, -h                  Show this help');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/generate-test-token.js');
    console.log('  node scripts/generate-test-token.js --name "John Doe" --email "john@gmail.com"');
    console.log('  node scripts/generate-test-token.js --expired');
    console.log('  node scripts/generate-test-token.js --decode "eyJhbGciOiJSUzI1NiI..."');
    return;
  }

  // Handle decode option
  const decodeIndex = args.indexOf('--decode');
  if (decodeIndex !== -1 && args[decodeIndex + 1]) {
    const token = args[decodeIndex + 1];
    try {
      const { header, payload } = decodeToken(token);
      console.log('📋 Token Contents:');
      console.log('Header:', JSON.stringify(header, null, 2));
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp && payload.exp < now;
      console.log(`\n⏰ Token Status: ${isExpired ? '❌ EXPIRED' : '✅ VALID'}`);
      
      if (payload.exp) {
        const expiresIn = payload.exp - now;
        console.log(`Expires in: ${expiresIn > 0 ? expiresIn + ' seconds' : 'Already expired'}`);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
    return;
  }

  // Parse custom user data
  const userData = {};
  
  const nameIndex = args.indexOf('--name');
  if (nameIndex !== -1 && args[nameIndex + 1]) {
    userData.name = args[nameIndex + 1];
    const nameParts = userData.name.split(' ');
    userData.given_name = nameParts[0];
    userData.family_name = nameParts.slice(1).join(' ') || nameParts[0];
  }

  const emailIndex = args.indexOf('--email');
  if (emailIndex !== -1 && args[emailIndex + 1]) {
    userData.email = args[emailIndex + 1];
  }

  const subIndex = args.indexOf('--sub');
  if (subIndex !== -1 && args[subIndex + 1]) {
    userData.sub = args[subIndex + 1];
  }

  // Handle expired token
  if (args.includes('--expired')) {
    userData.iat = Math.floor(Date.now() / 1000) - 7200; // 2 hours ago
    userData.exp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago (expired)
  }

  // Generate token
  const token = generateTestGoogleIdToken(userData);
  const { header, payload } = decodeToken(token);

  console.log('✅ Generated Test Google ID Token\n');
  console.log('📋 User Information:');
  console.log(`   Name: ${payload.name}`);
  console.log(`   Email: ${payload.email}`);
  console.log(`   Google ID: ${payload.sub}`);
  console.log(`   Audience: ${payload.aud}`);
  console.log(`   Issued: ${new Date(payload.iat * 1000).toISOString()}`);
  console.log(`   Expires: ${new Date(payload.exp * 1000).toISOString()}`);
  
  const now = Math.floor(Date.now() / 1000);
  const isExpired = payload.exp < now;
  console.log(`   Status: ${isExpired ? '❌ EXPIRED' : '✅ VALID'}\n`);

  console.log('🎫 Token:');
  console.log(token);
  console.log('');

  console.log('🧪 Test Command:');
  console.log(`curl -X POST http://localhost:8000/api/auth/android/google \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"idToken": "${token}"}' \\`);
  console.log(`  -v`);
  console.log('');

  console.log('💡 Tips:');
  console.log('- Set SKIP_GOOGLE_VERIFICATION=true in .env to use test tokens');
  console.log('- Use --expired to test token expiration handling');
  console.log('- Use --decode to examine existing tokens');
  console.log('- Tokens are valid for 1 hour by default');
}

module.exports = {
  generateTestGoogleIdToken,
  decodeToken
};
