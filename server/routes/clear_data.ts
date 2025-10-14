import { RequestHandler } from "express";
import { queries } from "../db/database";

export const clearTransportData: RequestHandler = (req, res) => {
  try {
    console.log('🗑️ Clearing all transport schedule data...');
    
    // Clear group transport schedules
    const groupTransportResult = queries.getDatabase().prepare('DELETE FROM group_transport_schedules').run();
    console.log(`✅ Deleted ${groupTransportResult.changes} group transport schedules`);
    
    // Clear regular transport schedules if they exist
    try {
      const transportResult = queries.getDatabase().prepare('DELETE FROM transport_schedules').run();
      console.log(`✅ Deleted ${transportResult.changes} transport schedules`);
    } catch (error) {
      console.log('ℹ️ No transport_schedules table found or already empty');
    }
    
    res.json({
      message: "Transport data cleared successfully",
      deleted: {
        group_transport_schedules: groupTransportResult.changes,
        transport_schedules: 0
      }
    });
  } catch (error) {
    console.error("Error clearing transport data:", error);
    res.status(500).json({ error: "Failed to clear transport data" });
  }
};

export const clearBookingData: RequestHandler = (req, res) => {
  try {
    console.log('🗑️ Clearing all booking data...');

    // Disable foreign key constraints temporarily
    queries.getDatabase().pragma('foreign_keys = OFF');

    // Clear hotel bookings first (no foreign key dependencies)
    const hotelBookingsResult = queries.getDatabase().prepare('DELETE FROM hotel_bookings').run();
    console.log(`✅ Deleted ${hotelBookingsResult.changes} hotel bookings`);

    // Clear transport schedules that might reference bookings
    try {
      const transportResult = queries.getDatabase().prepare('DELETE FROM transport_schedules').run();
      console.log(`✅ Deleted ${transportResult.changes} transport schedules`);
    } catch (error) {
      console.log('ℹ️ No transport_schedules table or already empty');
    }

    // Clear flight schedules that reference bookings
    try {
      const flightResult = queries.getDatabase().prepare('DELETE FROM flight_schedules').run();
      console.log(`✅ Deleted ${flightResult.changes} flight schedules`);
    } catch (error) {
      console.log('ℹ️ No flight_schedules table or already empty');
    }

    // Clear regular bookings
    const bookingsResult = queries.getDatabase().prepare('DELETE FROM bookings').run();
    console.log(`✅ Deleted ${bookingsResult.changes} bookings`);

    // Re-enable foreign key constraints
    queries.getDatabase().pragma('foreign_keys = ON');

    res.json({
      message: "Booking data cleared successfully",
      deleted: {
        hotel_bookings: hotelBookingsResult.changes,
        bookings: bookingsResult.changes
      }
    });
  } catch (error) {
    console.error("Error clearing booking data:", error);
    // Re-enable foreign keys even on error
    try {
      queries.getDatabase().pragma('foreign_keys = ON');
    } catch (e) {
      console.error('Failed to re-enable foreign keys:', e);
    }
    res.status(500).json({ error: "Failed to clear booking data", details: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const clearAllTransportAndBookings: RequestHandler = (req, res) => {
  try {
    console.log('🗑️ Clearing ALL transport and booking data...');

    // Disable foreign key constraints temporarily
    queries.getDatabase().pragma('foreign_keys = OFF');

    // Clear all transport data first
    const groupTransportResult = queries.getDatabase().prepare('DELETE FROM group_transport_schedules').run();
    console.log(`✅ Deleted ${groupTransportResult.changes} group transport schedules`);

    let transportResult = { changes: 0 };
    try {
      transportResult = queries.getDatabase().prepare('DELETE FROM transport_schedules').run();
      console.log(`✅ Deleted ${transportResult.changes} transport schedules`);
    } catch (error) {
      console.log('ℹ️ No transport_schedules table found or already empty');
    }

    // Clear flight schedules
    let flightResult = { changes: 0 };
    try {
      flightResult = queries.getDatabase().prepare('DELETE FROM flight_schedules').run();
      console.log(`✅ Deleted ${flightResult.changes} flight schedules`);
    } catch (error) {
      console.log('ℹ️ No flight_schedules table or already empty');
    }

    // Clear all booking data
    const hotelBookingsResult = queries.getDatabase().prepare('DELETE FROM hotel_bookings').run();
    console.log(`✅ Deleted ${hotelBookingsResult.changes} hotel bookings`);

    const bookingsResult = queries.getDatabase().prepare('DELETE FROM bookings').run();
    console.log(`✅ Deleted ${bookingsResult.changes} bookings`);

    // Re-enable foreign key constraints
    queries.getDatabase().pragma('foreign_keys = ON');

    res.json({
      message: "All transport and booking data cleared successfully",
      deleted: {
        group_transport_schedules: groupTransportResult.changes,
        transport_schedules: transportResult.changes,
        flight_schedules: flightResult.changes,
        hotel_bookings: hotelBookingsResult.changes,
        bookings: bookingsResult.changes
      }
    });
  } catch (error) {
    console.error("Error clearing all data:", error);
    // Re-enable foreign keys even on error
    try {
      queries.getDatabase().pragma('foreign_keys = ON');
    } catch (e) {
      console.error('Failed to re-enable foreign keys:', e);
    }
    res.status(500).json({ error: "Failed to clear all data", details: error instanceof Error ? error.message : 'Unknown error' });
  }
};
