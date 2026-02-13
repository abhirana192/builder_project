import { RequestHandler } from "express";
import { queries } from "../db/database";

export const getAllVehicles: RequestHandler = (req, res) => {
  try {
    const vehicles = queries.getAllVehicles().all();
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
};

export const getAvailableVehicles: RequestHandler = (req, res) => {
  try {
    const vehicles = queries.getAvailableVehicles().all();
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching available vehicles:", error);
    res.status(500).json({ error: "Failed to fetch available vehicles" });
  }
};

export const updateVehicleStatus: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    queries.updateVehicleStatus().run(status, id);
    const updatedVehicle = queries.getVehicleById().get(id);
    
    res.json(updatedVehicle);
  } catch (error) {
    console.error("Error updating vehicle status:", error);
    res.status(500).json({ error: "Failed to update vehicle status" });
  }
};

export const getTransportSchedules: RequestHandler = (req, res) => {
  try {
    // Get both legacy and new group transport schedules
    const legacySchedules = queries.getTransportSchedules().all();
    const groupSchedules = queries.getGroupTransportSchedules().all();

    // Parse groups_data for group schedules
    const processedGroupSchedules = groupSchedules.map(schedule => ({
      ...schedule,
      groups: schedule.groups_data ? JSON.parse(schedule.groups_data) : [],
      booking_reference: `GRP-${schedule.id}`, // Generate a reference for compatibility
    }));

    // Combine and return all schedules
    const allSchedules = [...legacySchedules, ...processedGroupSchedules];
    res.json(allSchedules);
  } catch (error) {
    console.error("Error fetching transport schedules:", error);
    res.status(500).json({ error: "Failed to fetch transport schedules" });
  }
};

export const createGroupTransportSchedule: RequestHandler = (req, res) => {
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

    console.log('Creating group transport schedule:', req.body);

    let finalPickupTime = pickup_time;

    console.log('🚀 TRANSPORT CREATION DEBUG START');
    console.log('- Transport type:', transport_type);
    console.log('- Original pickup_time from frontend:', pickup_time);
    console.log('- Fetch from database flag:', fetch_from_database);
    console.log('- Groups data:', JSON.stringify(groups_data, null, 2));

    // If transport is airport pickup/dropoff and we have passenger data, fetch from DB
    if (fetch_from_database && (transport_type === 'airport_pickup' || transport_type === 'airport_dropoff') && groups_data && groups_data.length > 0) {
      console.log('🔍 Fetching flight times from database...');

      const firstPassenger = groups_data[0];
      let flightTime = null;

      if (firstPassenger.type === 'group') {
        const groupData = queries.getGroupFlightTimes().get(firstPassenger.id);
        if (groupData) {
          console.log('🔍 DEBUG - Full group data from DB:', groupData);
          if (transport_type === 'airport_pickup') {
            flightTime = groupData.arrival_flight_time;
            const flightDate = groupData.arrival_date;
            if (flightTime && flightDate) {
              const dateStr = flightDate.includes('T') ? flightDate.split('T')[0] : flightDate;
              // Ensure time has seconds if not present
              const timeStr = flightTime.includes(':') && flightTime.split(':').length === 2 ? `${flightTime}:00` : flightTime;
              finalPickupTime = `${dateStr}T${timeStr}`;
              console.log('✅ PICKUP TRANSPORT - Using arrival time from DB:', finalPickupTime);
              console.log('🔍 DEBUG - Raw arrival flight time from DB:', flightTime);
              console.log('🔍 DEBUG - Formatted time string:', timeStr);
              console.log('🔍 DEBUG - Raw arrival date from DB:', flightDate);
            } else {
              console.warn('⚠️ Missing arrival flight time or date for group:', firstPassenger.id);
            }
          } else if (transport_type === 'airport_dropoff') {
            flightTime = groupData.departure_flight_time;
            const flightDate = groupData.departure_date;
            if (flightTime && flightDate) {
              const dateStr = flightDate.includes('T') ? flightDate.split('T')[0] : flightDate;
              // Ensure time has seconds if not present
              const timeStr = flightTime.includes(':') && flightTime.split(':').length === 2 ? `${flightTime}:00` : flightTime;
              finalPickupTime = `${dateStr}T${timeStr}`;
              console.log('✅ DROPOFF TRANSPORT - Using departure time from DB:', finalPickupTime);
              console.log('🔍 DEBUG - Raw departure flight time from DB:', flightTime);
              console.log('🔍 DEBUG - Formatted time string:', timeStr);
              console.log('🔍 DEBUG - Raw departure date from DB:', flightDate);
            } else {
              console.warn('⚠️ Missing departure flight time or date for group:', firstPassenger.id);
            }
          }
        } else {
          console.error('❌ Could not fetch group data from database for ID:', firstPassenger.id);
        }
      } else if (firstPassenger.type === 'member') {
        const memberData = queries.getMemberFlightTimes().get(firstPassenger.id);
        if (memberData) {
          if (transport_type === 'airport_pickup') {
            flightTime = memberData.arrival_flight_time;
            const flightDate = memberData.arrival_date;
            if (flightTime && flightDate) {
              const dateStr = flightDate.includes('T') ? flightDate.split('T')[0] : flightDate;
              finalPickupTime = `${dateStr}T${flightTime}`;
              console.log('✅ Using member arrival time from DB:', finalPickupTime);
            }
          } else if (transport_type === 'airport_dropoff') {
            flightTime = memberData.departure_flight_time;
            const flightDate = memberData.departure_date;
            if (flightTime && flightDate) {
              const dateStr = flightDate.includes('T') ? flightDate.split('T')[0] : flightDate;
              finalPickupTime = `${dateStr}T${flightTime}`;
              console.log('✅ Using member departure time from DB:', finalPickupTime);
            }
          }
        }
      }
    }

    console.log('📦 FINAL TRANSPORT SCHEDULE DATA:');
    console.log('- Transport Type:', transport_type);
    console.log('- Original pickup_time from frontend:', pickup_time);
    console.log('- Final pickup_time (from DB if fetched):', finalPickupTime);
    console.log('- Time changed?', pickup_time !== finalPickupTime ? 'YES ✅' : 'NO ❌');
    console.log('- Passenger data:', JSON.stringify(groups_data));
    console.log('🚀 TRANSPORT CREATION DEBUG END\n');

    const result = queries.createGroupTransportSchedule().run(
      transport_type,
      activity_name || null,
      vehicle_id,
      driver_id,
      pickup_location,
      finalPickupTime, // Use the flight time from database if available
      dropoff_location,
      estimated_dropoff_time || null,
      passenger_count,
      JSON.stringify(groups_data),
      notes || null
    );

    res.json({
      id: result.lastInsertRowid,
      message: 'Transport schedule created successfully'
    });
  } catch (error) {
    console.error("Error creating group transport schedule:", error);
    res.status(500).json({ error: "Failed to create transport schedule" });
  }
};

export const updateTransportStatus: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('Updating transport status:', { id, status });

    // Update the transport schedule status
    const result = queries.updateGroupTransportScheduleStatus().run(status, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Transport schedule not found" });
    }

    res.json({
      message: 'Transport status updated successfully',
      id: id,
      status: status
    });
  } catch (error) {
    console.error("Error updating transport status:", error);
    res.status(500).json({ error: "Failed to update transport status" });
  }
};

export const deleteTransportSchedule: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    console.log('Deleting transport schedule:', id);

    // Delete the transport schedule
    const result = queries.deleteGroupTransportSchedule().run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Transport schedule not found" });
    }

    res.json({
      message: 'Transport schedule deleted successfully',
      id: id
    });
  } catch (error) {
    console.error("Error deleting transport schedule:", error);
    res.status(500).json({ error: "Failed to delete transport schedule" });
  }
};

export const updateTransportDropoffLocation: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { dropoff_location } = req.body;

    console.log('Updating transport dropoff location:', { id, dropoff_location });

    // Update the transport schedule dropoff location
    const result = queries.updateGroupTransportScheduleDropoffLocation().run(dropoff_location, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Transport schedule not found" });
    }

    // Fetch the updated schedule to determine if we should propagate to corresponding airport dropoff
    const schedule: any = queries.getDatabase().prepare('SELECT id, transport_type, groups_data FROM group_transport_schedules WHERE id = ?').get(id);

    try {
      if (schedule && schedule.transport_type === 'airport_pickup' && dropoff_location) {
        const groups = (() => {
          try { return schedule.groups_data ? JSON.parse(schedule.groups_data) : []; } catch { return []; }
        })();
        const groupIds = new Set((groups || []).filter((g: any) => g && g.type === 'group' && g.id != null).map((g: any) => g.id));
        const memberIds = new Set((groups || []).filter((g: any) => g && g.type === 'member' && g.id != null).map((g: any) => g.id));

        // Load potential matching airport_dropoff schedules
        const candidates: any[] = queries.getDatabase().prepare('SELECT id, groups_data FROM group_transport_schedules WHERE transport_type = "airport_dropoff"').all();

        const toUpdate: number[] = [];
        for (const c of candidates) {
          let cGroups: any[] = [];
          try { cGroups = c.groups_data ? JSON.parse(c.groups_data) : []; } catch { cGroups = []; }
          const cGroupIds = new Set(cGroups.filter((g: any) => g && g.type === 'group' && g.id != null).map((g: any) => g.id));
          const cMemberIds = new Set(cGroups.filter((g: any) => g && g.type === 'member' && g.id != null).map((g: any) => g.id));

          // Any overlap qualifies as corresponding schedule
          const groupOverlap = [...groupIds].some(id => cGroupIds.has(id));
          const memberOverlap = [...memberIds].some(id => cMemberIds.has(id));
          if (groupOverlap || memberOverlap) {
            toUpdate.push(c.id);
          }
        }

        // Update pickup_location of matching airport_dropoff schedules
        for (const dropoffId of toUpdate) {
          try {
            queries.updateGroupTransportSchedulePickupLocation().run(dropoff_location, dropoffId);
            console.log(`Propagated pickup_location to airport_dropoff ${dropoffId}:`, dropoff_location);
          } catch (e) {
            console.warn(`Failed to propagate pickup_location for dropoff schedule ${dropoffId}:`, e);
          }
        }
      }
    } catch (propErr) {
      console.warn('Error during propagation to airport_dropoff schedules:', propErr);
    }

    res.json({
      message: 'Transport dropoff location updated successfully',
      id: id,
      dropoff_location: dropoff_location
    });
  } catch (error) {
    console.error("Error updating transport dropoff location:", error);
    res.status(500).json({ error: "Failed to update transport dropoff location" });
  }
};

export const updateTransportPickupLocation: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { pickup_location } = req.body;

    console.log('Updating transport pickup location:', { id, pickup_location });

    // Update the transport schedule pickup location
    const result = queries.updateGroupTransportSchedulePickupLocation().run(pickup_location, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Transport schedule not found" });
    }

    res.json({
      message: 'Transport pickup location updated successfully',
      id: id,
      pickup_location: pickup_location
    });
  } catch (error) {
    console.error("Error updating transport pickup location:", error);
    res.status(500).json({ error: "Failed to update transport pickup location" });
  }
};

export const createVehicle: RequestHandler = (req, res) => {
  try {
    const {
      vehicle_number,
      vehicle_type,
      make,
      model,
      year,
      capacity,
      license_plate,
      last_maintenance,
      next_maintenance,
      insurance_expiry,
      notes
    } = req.body;

    // Validate required fields
    if (!vehicle_number || !vehicle_type || !capacity || !license_plate) {
      return res.status(400).json({
        error: "Missing required fields: vehicle_number, vehicle_type, capacity, license_plate"
      });
    }

    // Check if vehicle_number or license_plate already exists
    const existingVehicle = queries.getDatabase().prepare(`
      SELECT id FROM vehicles WHERE vehicle_number = ? OR license_plate = ?
    `).get(vehicle_number, license_plate);

    if (existingVehicle) {
      return res.status(409).json({
        error: "Vehicle with this number or license plate already exists"
      });
    }

    // Insert new vehicle
    const insertResult = queries.getDatabase().prepare(`
      INSERT INTO vehicles (
        vehicle_number, vehicle_type, make, model, year, capacity,
        license_plate, last_maintenance, next_maintenance, insurance_expiry, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      vehicle_number, vehicle_type, make, model, year, capacity,
      license_plate, last_maintenance, next_maintenance, insurance_expiry, notes
    );

    // Get the created vehicle
    const newVehicle = queries.getDatabase().prepare(`
      SELECT * FROM vehicles WHERE id = ?
    `).get(insertResult.lastInsertRowid);

    res.status(201).json({
      message: 'Vehicle created successfully',
      vehicle: newVehicle
    });
  } catch (error) {
    console.error("Error creating vehicle:", error);

    // Handle unique constraint violations
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        error: "Vehicle with this number or license plate already exists"
      });
    }

    res.status(500).json({ error: "Failed to create vehicle" });
  }
};
