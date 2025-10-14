// Test script to create a group and check transport timing
const testGroupData = {
  group_name: "TEST_TIMING_GROUP",
  arrival_date: "2025-02-15",
  arrival_flight_time: "14:30:00", // 2:30 PM
  arrival_airline: "Test Airways",
  arrival_flight_number: "TA123",
  arrival_pax: 4,
  departure_date: "2025-02-20", 
  departure_flight_time: "18:45:00", // 6:45 PM
  departure_airline: "Test Airways",
  departure_flight_number: "TA456",
  departure_pax: 4,
  accommodation: "Test Hotel",
  notes: "Testing transport timing - should show exact flight times"
};

console.log("Test group with flight times:", testGroupData);
console.log("Expected pickup time for arrival:", testGroupData.arrival_flight_time);
console.log("Expected pickup time for departure:", testGroupData.departure_flight_time);
