// Test script to verify transport time processing
console.log('🧪 TESTING TRANSPORT TIME PROCESSING\n');

// Simulate the time processing logic from groups.ts
function testTimeProcessing(flightTime, flightDate) {
  console.log(`\n--- Testing flight time: "${flightTime}" on date: "${flightDate}" ---`);
  
  // Step 1: Check input types and values
  console.log('1. Input analysis:');
  console.log('   Flight time type:', typeof flightTime);
  console.log('   Flight time value:', JSON.stringify(flightTime));
  console.log('   Flight date type:', typeof flightDate);
  console.log('   Flight date value:', JSON.stringify(flightDate));
  
  // Step 2: Time formatting logic from auto-scheduling
  const hasSeconds = flightTime.includes(':') && flightTime.split(':').length === 3;
  const needsSeconds = flightTime.includes(':') && flightTime.split(':').length === 2;
  const formattedTime = needsSeconds ? `${flightTime}:00` : flightTime;
  
  console.log('2. Time formatting:');
  console.log('   Has seconds already?', hasSeconds);
  console.log('   Needs seconds added?', needsSeconds);
  console.log('   Formatted time:', JSON.stringify(formattedTime));
  
  // Step 3: Date extraction
  const dateOnly = flightDate.split('T')[0];
  const fullDateTimeString = `${dateOnly}T${formattedTime}`;
  
  console.log('3. Date construction:');
  console.log('   Date only:', JSON.stringify(dateOnly));
  console.log('   Full datetime string:', JSON.stringify(fullDateTimeString));
  
  // Step 4: Date object creation
  const dateObject = new Date(fullDateTimeString);
  
  console.log('4. Final result:');
  console.log('   Date object valid?', !isNaN(dateObject.getTime()));
  console.log('   Local time:', dateObject.toString());
  console.log('   ISO time (stored):', JSON.stringify(dateObject.toISOString()));
  console.log('   Display time:', dateObject.toLocaleString());
  
  return dateObject.toISOString();
}

// Test with various time formats
console.log('Testing common time formats that might be in the database:');

// Test case 1: HH:MM format
testTimeProcessing('14:30', '2025-02-15');

// Test case 2: HH:MM:SS format
testTimeProcessing('14:30:00', '2025-02-15');

// Test case 3: Single digit hour
testTimeProcessing('9:30', '2025-02-15');

// Test case 4: Different date format
testTimeProcessing('18:45', '2025-02-15T00:00:00.000Z');

console.log('\n🎯 SUMMARY:');
console.log('Check if the "Display time" matches what you expect to see in the transport system.');
console.log('The "ISO time (stored)" is what gets saved to the database.');
