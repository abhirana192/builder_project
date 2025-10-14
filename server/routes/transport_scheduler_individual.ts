import { queries } from '../db/database';

// Create individual transport for group members traveling separately
export const createIndividualMemberTransport = async (groupId: number, vehicles: any[], drivers: any[]) => {
  console.log(`👤 Creating individual member transport for group ${groupId}`);
  
  // Get all members of this group
  const members = queries.getGroupMembers().all(groupId);
  
  if (members.length === 0) {
    console.log('❌ No group members found');
    return;
  }
  
  console.log(`👥 Found ${members.length} group members`);
  
  let vehicleIndex = 0;
  let driverIndex = 0;
  
  for (const member of members) {
    console.log(`\n👤 Processing member: ${member.first_name} ${member.last_name}`);
    
    // Create pickup transport for member arrival
    if (member.arrival_flight_number && member.arrival_flight_time) {
      console.log(`✈️ Member has arrival flight: ${member.arrival_flight_number} at ${member.arrival_flight_time}`);
      
      const vehicle = vehicles[vehicleIndex % vehicles.length];
      const driver = drivers[driverIndex % drivers.length];
      
      await createMemberPickupTransport(member, groupId, vehicle, driver);
      
      vehicleIndex++;
      driverIndex++;
    }
    
    // Create dropoff transport for member departure
    if (member.departure_flight_number && member.departure_flight_time) {
      console.log(`🛫 Member has departure flight: ${member.departure_flight_number} at ${member.departure_flight_time}`);
      
      const vehicle = vehicles[vehicleIndex % vehicles.length];
      const driver = drivers[driverIndex % drivers.length];
      
      await createMemberDropoffTransport(member, groupId, vehicle, driver);
      
      vehicleIndex++;
      driverIndex++;
    }
    
    if (!member.arrival_flight_number && !member.departure_flight_number) {
      console.log(`ℹ️ Member has no flight details - skipping transport creation`);
    }
  }
  
  console.log(`✅ Completed individual member transport creation`);
};

// Create pickup transport for individual member
const createMemberPickupTransport = async (member: any, groupId: number, vehicle: any, driver: any) => {
  console.log(`🚐 Creating individual pickup for ${member.first_name} ${member.last_name}`);
  
  // Construct arrival datetime from member's flight details
  // Assuming arrival_flight_time format is "HH:MM" and we need to get the date
  // For now, we'll use today's date as a fallback if no proper date is available
  const today = new Date().toISOString().split('T')[0];
  const timeOnly = member.arrival_flight_time.includes(':') && member.arrival_flight_time.split(':').length === 2 
    ? `${member.arrival_flight_time}:00` 
    : member.arrival_flight_time;
  
  const arrivalDateTime = `${today}T${timeOnly}`;
  
  console.log(`⏰ Member pickup time: ${arrivalDateTime}`);
  
  const transportData = {
    transport_type: 'airport_pickup',
    vehicle_id: vehicle.id,
    driver_id: driver.id,
    pickup_location: 'Yellowknife Airport',
    pickup_time: arrivalDateTime,
    dropoff_location: 'Hotel/Accommodation', 
    estimated_dropoff_time: null,
    passenger_count: 1, // Individual member
    groups_data: JSON.stringify([{
      type: 'individual',
      groupId: groupId,
      memberId: member.id,
      memberName: `${member.first_name} ${member.last_name}`,
      flightNumber: member.arrival_flight_number
    }]),
    notes: `Auto-scheduled pickup for ${member.first_name} ${member.last_name} (Group member - traveling separately)`
  };
  
  // Insert into database
  const result = queries.createGroupTransportSchedule().run(
    transportData.transport_type,
    null, // activity_name
    transportData.vehicle_id,
    transportData.driver_id,
    transportData.pickup_location,
    transportData.pickup_time,
    transportData.dropoff_location,
    transportData.estimated_dropoff_time,
    transportData.passenger_count,
    transportData.groups_data,
    transportData.notes
  );
  
  console.log(`✅ Created member pickup transport with ID: ${result.lastInsertRowid}`);
};

// Create dropoff transport for individual member
const createMemberDropoffTransport = async (member: any, groupId: number, vehicle: any, driver: any) => {
  console.log(`🚐 Creating individual dropoff for ${member.first_name} ${member.last_name}`);
  
  // Construct departure datetime from member's flight details
  const today = new Date().toISOString().split('T')[0];
  const timeOnly = member.departure_flight_time.includes(':') && member.departure_flight_time.split(':').length === 2 
    ? `${member.departure_flight_time}:00` 
    : member.departure_flight_time;
  
  const departureDateTime = `${today}T${timeOnly}`;
  
  console.log(`⏰ Member dropoff time: ${departureDateTime}`);
  
  const transportData = {
    transport_type: 'airport_dropoff',
    vehicle_id: vehicle.id,
    driver_id: driver.id,
    pickup_location: 'Hotel/Accommodation',
    pickup_time: departureDateTime,
    dropoff_location: 'Yellowknife Airport',
    estimated_dropoff_time: departureDateTime,
    passenger_count: 1, // Individual member
    groups_data: JSON.stringify([{
      type: 'individual',
      groupId: groupId,
      memberId: member.id,
      memberName: `${member.first_name} ${member.last_name}`,
      flightNumber: member.departure_flight_number
    }]),
    notes: `Auto-scheduled dropoff for ${member.first_name} ${member.last_name} (Group member - traveling separately)`
  };
  
  // Insert into database
  const result = queries.createGroupTransportSchedule().run(
    transportData.transport_type,
    null, // activity_name
    transportData.vehicle_id,
    transportData.driver_id,
    transportData.pickup_location,
    transportData.pickup_time,
    transportData.dropoff_location,
    transportData.estimated_dropoff_time,
    transportData.passenger_count,
    transportData.groups_data,
    transportData.notes
  );
  
  console.log(`✅ Created member dropoff transport with ID: ${result.lastInsertRowid}`);
};
