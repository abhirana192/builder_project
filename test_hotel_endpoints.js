// Simple test to check hotel endpoints
console.log('Testing hotel endpoints...');

async function testEndpoints() {
  const baseUrl = 'http://localhost:5000'; // Adjust if needed
  
  try {
    console.log('Testing /api/hotels...');
    const hotelsRes = await fetch(`${baseUrl}/api/hotels`);
    console.log('Hotels status:', hotelsRes.status);
    if (hotelsRes.ok) {
      const hotels = await hotelsRes.json();
      console.log('Hotels count:', hotels.length);
    } else {
      console.log('Hotels error:', await hotelsRes.text());
    }
  } catch (error) {
    console.error('Hotels fetch error:', error.message);
  }
  
  try {
    console.log('Testing /api/hotel-bookings...');
    const bookingsRes = await fetch(`${baseUrl}/api/hotel-bookings`);
    console.log('Bookings status:', bookingsRes.status);
    if (bookingsRes.ok) {
      const bookings = await bookingsRes.json();
      console.log('Bookings count:', bookings.length);
    } else {
      console.log('Bookings error:', await bookingsRes.text());
    }
  } catch (error) {
    console.error('Bookings fetch error:', error.message);
  }
  
  try {
    console.log('Testing /api/hotel-stats...');
    const statsRes = await fetch(`${baseUrl}/api/hotel-stats`);
    console.log('Stats status:', statsRes.status);
    if (statsRes.ok) {
      const stats = await statsRes.json();
      console.log('Stats:', stats);
    } else {
      console.log('Stats error:', await statsRes.text());
    }
  } catch (error) {
    console.error('Stats fetch error:', error.message);
  }
}

if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  testEndpoints();
} else {
  // Browser environment
  testEndpoints();
}
