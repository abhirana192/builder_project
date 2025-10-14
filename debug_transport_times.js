// Debug script to compare group booking times vs transport times
const sqlite3 = require('sqlite3').verbose();

// Connect to database
const db = new sqlite3.Database('./server/db/tourflow.db');

console.log('🔍 DEBUGGING TRANSPORT TIMES VS GROUP BOOKING TIMES\n');

// Get recent groups with their flight times
db.all(`
  SELECT id, group_name, arrival_date, arrival_flight_time, departure_date, departure_flight_time, created_at
  FROM tour_groups 
  ORDER BY created_at DESC 
  LIMIT 5
`, (err, groups) => {
  if (err) {
    console.error('Error fetching groups:', err);
    return;
  }
  
  console.log('📅 RECENT GROUP BOOKINGS:');
  groups.forEach(group => {
    console.log(`\nGroup: ${group.group_name} (ID: ${group.id})`);
    console.log(`  Arrival: ${group.arrival_date} at ${group.arrival_flight_time}`);
    console.log(`  Departure: ${group.departure_date} at ${group.departure_flight_time}`);
    console.log(`  Created: ${group.created_at}`);
  });
  
  // Get recent transport schedules
  db.all(`
    SELECT id, transport_type, pickup_time, groups_data, notes, created_at
    FROM group_transport_schedules 
    ORDER BY created_at DESC 
    LIMIT 10
  `, (err, transports) => {
    if (err) {
      console.error('Error fetching transports:', err);
      return;
    }
    
    console.log('\n\n🚗 RECENT TRANSPORT SCHEDULES:');
    transports.forEach(transport => {
      console.log(`\nTransport ID: ${transport.id} (${transport.transport_type})`);
      console.log(`  Pickup Time: ${transport.pickup_time}`);
      console.log(`  Groups Data: ${transport.groups_data}`);
      console.log(`  Notes: ${transport.notes}`);
      console.log(`  Created: ${transport.created_at}`);
      
      // Try to parse groups_data to see which group this belongs to
      try {
        const groupsData = JSON.parse(transport.groups_data);
        if (groupsData && groupsData.length > 0) {
          console.log(`  Associated Group: ${groupsData[0].name} (ID: ${groupsData[0].id})`);
        }
      } catch (e) {
        console.log('  Could not parse groups_data');
      }
    });
    
    console.log('\n\n🎯 COMPARISON ANALYSIS:');
    console.log('Compare the flight times above with the transport pickup times.');
    console.log('They should match exactly for airport pickup/dropoff transports.');
    
    db.close();
  });
});
