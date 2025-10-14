import { RequestHandler } from 'express';
import { queries } from '../db/database';

interface FlightData {
  arrival_date: string;
  arrival_flight_time: string;
  departure_date: string;
  departure_flight_time: string;
}

interface TransportSchedule {
  id: number;
  transport_type: string;
  activity_name?: string;
  vehicle_id: number;
  driver_id?: number;
  pickup_location: string;
  pickup_time: string;
  dropoff_location: string;
  estimated_dropoff_time?: string;
  passenger_count: number;
  groups_data: string;
  status: string;
  vehicle_number?: string;
  driver_name?: string;
  passengers?: Array<{
    name: string;
    type: string;
    id: number;
  }>;
}

// Simple manual transport creation that preserves exact flight times
export const createManualTransportSchedule: RequestHandler = (req, res) => {
  try {
    const {
      transport_type,
      activity_name,
      vehicle_id,
      driver_id,
      pickup_location,
      pickup_time,
      dropoff_location,
      estimated_dropoff_time,
      passenger_count,
      groups_data,
      notes,
      fetch_from_database // Flag to fetch flight times from DB
    } = req.body;

    console.log('🚐 Creating manual transport schedule');
    console.log('Type:', transport_type);
    console.log('Original time:', pickup_time);

    let finalPickupTime = pickup_time;

    // For airport transports, fetch exact flight times from database
    if (fetch_from_database && (transport_type === 'airport_pickup' || transport_type === 'airport_dropoff') && groups_data && groups_data.length > 0) {

      console.log('📍 Fetching flight time from database...');
      const firstPassenger = groups_data[0];

      if (firstPassenger.type === 'group') {
        const groupData = queries.getGroupFlightTimes().get(firstPassenger.id) as FlightData;

        if (groupData) {
          let flightDate, flightTime;

          if (transport_type === 'airport_pickup') {
            flightDate = groupData.arrival_date;
            flightTime = groupData.arrival_flight_time;
            console.log('✈️ Found arrival flight:', flightDate, 'at', flightTime);
          } else if (transport_type === 'airport_dropoff') {
            flightDate = groupData.departure_date;
            flightTime = groupData.departure_flight_time;
            console.log('🛫 Found departure flight:', flightDate, 'at', flightTime);
          }

          if (flightDate && flightTime) {
            // Simple datetime construction
            const dateOnly = flightDate.includes('T') ? flightDate.split('T')[0] : flightDate;
            const timeWithSeconds = flightTime.includes(':') && flightTime.split(':').length === 2
              ? `${flightTime}:00`
              : flightTime;

            finalPickupTime = `${dateOnly}T${timeWithSeconds}`;
            console.log('✅ Using flight time from database:', finalPickupTime);
          }
        } else {
          console.warn('⚠️ Could not find group data for ID:', firstPassenger.id);
        }
      } else if (firstPassenger.type === 'member') {
        const memberData = queries.getMemberFlightDetailsForTransport().get(firstPassenger.id) as FlightData;

        if (memberData) {
          let flightDate, flightTime;

          if (transport_type === 'airport_pickup') {
            flightDate = memberData.arrival_date;
            flightTime = memberData.arrival_flight_time;
            console.log('✈️ Found member arrival flight:', flightDate, 'at', flightTime);
          } else if (transport_type === 'airport_dropoff') {
            flightDate = memberData.departure_date;
            flightTime = memberData.departure_flight_time;
            console.log('🛫 Found member departure flight:', flightDate, 'at', flightTime);
          }

          if (flightDate && flightTime) {
            const dateOnly = flightDate.includes('T') ? flightDate.split('T')[0] : flightDate;
            const timeWithSeconds = flightTime.includes(':') && flightTime.split(':').length === 2
              ? `${flightTime}:00`
              : flightTime;

            finalPickupTime = `${dateOnly}T${timeWithSeconds}`;
            console.log('✅ Using member flight time from database:', finalPickupTime);
          }
        } else {
          console.warn('⚠️ Could not find member data for ID:', firstPassenger.id);
        }
      }
    }

    console.log('🎯 Final pickup time:', finalPickupTime);

    // Create the transport schedule
    const result = queries.createGroupTransportSchedule().run(
      transport_type,
      activity_name || null,
      vehicle_id,
      driver_id,
      pickup_location,
      finalPickupTime,
      dropoff_location,
      estimated_dropoff_time || null,
      passenger_count,
      JSON.stringify(groups_data),
      notes || null
    );

    console.log('✅ Transport schedule created with ID:', result.lastInsertRowid);

    // Get the newly created transport schedule
    const transport = queries.getGroupTransportSchedules().get(result.lastInsertRowid) as TransportSchedule;

    if (transport) {
      // Update pickup location
      queries.updatePickupLocation().run(
        'YELLOWKNIFE AIRPORT',
        transport.transport_type,
        transport.pickup_time
      );
    }

    res.json({
      id: result.lastInsertRowid,
      message: 'Transport schedule created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating manual transport schedule:', error);
    res.status(500).json({ error: 'Failed to create transport schedule' });
  }
};
