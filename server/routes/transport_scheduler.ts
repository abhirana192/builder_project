import { queries } from '../db/database';
import { createIndividualMemberTransport } from './transport_scheduler_individual';

// Simple and reliable transport auto-scheduling system
export const createAutoTransportForGroup = async (groupId: number) => {
  try {
    console.log(`🚀 AUTO-SCHEDULING TRANSPORT FOR GROUP ${groupId}`);
    
    // Get the group data directly from database to ensure we have the latest
    const group = queries.getGroupById().get(groupId);
    if (!group) {
      console.error(`❌ Group ${groupId} not found`);
      return;
    }
    
    console.log(`📋 Group: ${group.group_name}`);
    console.log(`✈️ Arrival: ${group.arrival_date} at ${group.arrival_flight_time}`);
    console.log(`🛫 Departure: ${group.departure_date} at ${group.departure_flight_time}`);
    
    // Get available vehicles and drivers
    const vehicles = queries.getAllVehicles().all().filter(v => v.status === 'available');
    const drivers = queries.getAllStaff().all().filter(s => s.role === 'driver' && s.is_active);
    
    if (vehicles.length === 0 || drivers.length === 0) {
      console.error('❌ No available vehicles or drivers');
      return;
    }
    
    // Check if group is traveling together or separately
    if (group.traveling_together) {
      // Create group-level transport if flight details exist
      if (group.arrival_date && group.arrival_flight_time) {
        await createPickupTransport(group, vehicles[0], drivers[0]);
      }

      if (group.departure_date && group.departure_flight_time) {
        await createDropoffTransport(group, vehicles[Math.min(1, vehicles.length - 1)], drivers[Math.min(1, drivers.length - 1)]);
      }
    } else {
      // Group is traveling separately - check individual member flight details
      console.log('👥 Group traveling separately - checking individual member flights');
      await createIndividualMemberTransport(groupId, vehicles, drivers);
    }
    
    console.log(`✅ Auto-scheduling completed for group ${group.group_name}`);
    
  } catch (error) {
    console.error('❌ Auto-scheduling failed:', error);
  }
};

// Create pickup transport for arrival
const createPickupTransport = async (group: any, vehicle: any, driver: any) => {
  console.log(`🚐 Creating pickup transport for arrival`);
  
  // Simple datetime construction: YYYY-MM-DD + T + HH:MM:SS
  const dateOnly = group.arrival_date.includes('T') ? group.arrival_date.split('T')[0] : group.arrival_date;
  const timeOnly = group.arrival_flight_time.includes(':') && group.arrival_flight_time.split(':').length === 2 
    ? `${group.arrival_flight_time}:00` 
    : group.arrival_flight_time;
  
  const arrivalDateTime = `${dateOnly}T${timeOnly}`;
  
  console.log(`⏰ Pickup time: ${arrivalDateTime}`);
  
  const transportData = {
    transport_type: 'airport_pickup',
    vehicle_id: vehicle.id,
    driver_id: driver.id,
    pickup_location: 'Yellowknife Airport',
    pickup_time: arrivalDateTime,
    dropoff_location: 'Hotel/Accommodation', 
    estimated_dropoff_time: null,
    passenger_count: group.total_members,
    groups_data: JSON.stringify([{
      type: 'group',
      id: group.id,
      name: group.group_name,
      memberCount: group.total_members
    }]),
    notes: `Auto-scheduled pickup for ${group.group_name}`
  };
  
  // Insert directly into database
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
  
  console.log(`✅ Created pickup transport with ID: ${result.lastInsertRowid}`);
};

// Create dropoff transport for departure
const createDropoffTransport = async (group: any, vehicle: any, driver: any) => {
  console.log(`🚐 Creating dropoff transport for departure`);
  
  // Simple datetime construction: YYYY-MM-DD + T + HH:MM:SS
  const dateOnly = group.departure_date.includes('T') ? group.departure_date.split('T')[0] : group.departure_date;
  const timeOnly = group.departure_flight_time.includes(':') && group.departure_flight_time.split(':').length === 2 
    ? `${group.departure_flight_time}:00` 
    : group.departure_flight_time;
  
  const departureDateTime = `${dateOnly}T${timeOnly}`;
  
  console.log(`⏰ Dropoff time: ${departureDateTime}`);
  
  const transportData = {
    transport_type: 'airport_dropoff',
    vehicle_id: vehicle.id,
    driver_id: driver.id,
    pickup_location: 'Hotel/Accommodation',
    pickup_time: departureDateTime, // Use flight time as pickup time for dropoff
    dropoff_location: 'Yellowknife Airport',
    estimated_dropoff_time: departureDateTime,
    passenger_count: group.total_members,
    groups_data: JSON.stringify([{
      type: 'group', 
      id: group.id,
      name: group.group_name,
      memberCount: group.total_members
    }]),
    notes: `Auto-scheduled dropoff for ${group.group_name}`
  };
  
  // Insert directly into database
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
  
  console.log(`✅ Created dropoff transport with ID: ${result.lastInsertRowid}`);
};
