import { RequestHandler } from "express";
import { queries } from "../db/database";

// Get all hotel bookings - simplified like Activities
export const getAllHotelBookings: RequestHandler = (req, res) => {
  try {
    // First, let's check if hotel_bookings table exists and has data
    const tableExists = queries.getDatabase().prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='hotel_bookings'
    `).get();
    
    if (!tableExists) {
      console.log("hotel_bookings table doesn't exist, returning empty array");
      return res.json([]);
    }
    
    // Try simple query first
    const bookings = queries.getDatabase().prepare(`
      SELECT * FROM hotel_bookings ORDER BY created_at DESC
    `).all();
    
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching hotel bookings:", error);
    // Return empty array instead of error to prevent UI crash
    res.json([]);
  }
};

// Get hotel stats - simplified
export const getHotelStats: RequestHandler = (req, res) => {
  try {
    // Check if table exists
    const tableExists = queries.getDatabase().prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='hotel_bookings'
    `).get();
    
    if (!tableExists) {
      // Return default stats
      return res.json({
        total_bookings: 0,
        confirmed_bookings: 0,
        checked_in_bookings: 0,
        checked_out_bookings: 0,
        cancelled_bookings: 0,
        total_revenue: 0,
        avg_booking_value: 0
      });
    }
    
    const stats = queries.getDatabase().prepare(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'checked_in' THEN 1 END) as checked_in_bookings,
        COUNT(CASE WHEN status = 'checked_out' THEN 1 END) as checked_out_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as avg_booking_value
      FROM hotel_bookings
      WHERE created_at >= datetime('now', '-30 days')
    `).get();

    res.json(stats || {
      total_bookings: 0,
      confirmed_bookings: 0,
      checked_in_bookings: 0,
      checked_out_bookings: 0,
      cancelled_bookings: 0,
      total_revenue: 0,
      avg_booking_value: 0
    });
  } catch (error) {
    console.error("Error fetching hotel stats:", error);
    // Return default stats instead of error
    res.json({
      total_bookings: 0,
      confirmed_bookings: 0,
      checked_in_bookings: 0,
      checked_out_bookings: 0,
      cancelled_bookings: 0,
      total_revenue: 0,
      avg_booking_value: 0
    });
  }
};

// Create hotel booking - simplified
export const createHotelBooking: RequestHandler = (req, res) => {
  try {
    const {
      guest_name,
      guest_id,
      group_name,
      hotel_id,
      room_number,
      room_type,
      check_in_date,
      check_out_date,
      guests_count,
      rate_per_night,
      special_requests
    } = req.body;

    // Calculate total amount
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const total_amount = nights * rate_per_night;

    // Create booking reference
    const booking_reference = `HB-${Date.now()}`;

    const result = queries.getDatabase().prepare(`
      INSERT INTO hotel_bookings (
        guest_name, guest_id, group_name, hotel_id, room_number, room_type, check_in_date, check_out_date,
        guests_count, rate_per_night, total_amount, special_requests, status, booking_reference
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)
    `).run(
      guest_name,
      guest_id || null,
      group_name || null,
      hotel_id,
      room_number,
      room_type || 'Standard',
      check_in_date,
      check_out_date,
      guests_count,
      rate_per_night,
      total_amount,
      special_requests || null,
      booking_reference
    );

    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'Hotel booking created successfully',
      booking_reference,
      total_amount
    });
  } catch (error) {
    console.error("Error creating hotel booking:", error);
    res.status(500).json({ error: "Failed to create hotel booking" });
  }
};

// Update booking status - simplified
export const updateBookingStatus: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    let updateQuery = `UPDATE hotel_bookings SET status = ?`;
    let params = [status];

    // Set actual check-in/check-out times
    if (status === 'checked_in') {
      updateQuery += `, actual_check_in = datetime('now')`;
    } else if (status === 'checked_out') {
      updateQuery += `, actual_check_out = datetime('now')`;
    }

    updateQuery += ` WHERE id = ?`;
    params.push(id);

    const result = queries.getDatabase().prepare(updateQuery).run(...params);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Hotel booking not found" });
    }

    res.json({
      message: `Booking ${status} successfully`,
      id: id,
      status: status
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ error: "Failed to update booking status" });
  }
};

// Get guest with group information
export const getGuestWithGroup: RequestHandler = (req, res) => {
  try {
    const { guestId } = req.params;

    // Get guest information with group details
    const guestWithGroup = queries.getDatabase().prepare(`
      SELECT
        g.id,
        g.first_name,
        g.last_name,
        g.email,
        g.phone,
        tg.group_name,
        tg.id as group_id
      FROM guests g
      LEFT JOIN group_members gm ON g.id = gm.guest_id
      LEFT JOIN tour_groups tg ON gm.group_id = tg.id
      WHERE g.id = ?
      ORDER BY gm.join_date DESC
      LIMIT 1
    `).get(guestId);

    if (!guestWithGroup) {
      return res.status(404).json({ error: "Guest not found" });
    }

    res.json(guestWithGroup);
  } catch (error) {
    console.error("Error fetching guest with group:", error);
    res.status(500).json({ error: "Failed to fetch guest information" });
  }
};

export const getHotelCheckInsToday: RequestHandler = (req, res) => {
  try {
    const { date } = req.query as { date?: string };
    const sql = `
      SELECT hb.*, h.name AS hotel_name
      FROM hotel_bookings hb
      JOIN hotels h ON hb.hotel_id = h.id
      WHERE DATE(hb.check_in_date) = DATE(?)
      ORDER BY h.name, hb.guest_name
    `;
    const results = queries.getDatabase().prepare(sql).all(date || new Date().toISOString().slice(0, 10));
    res.json(results);
  } catch (error) {
    console.error("Error fetching today's hotel check-ins:", error);
    res.status(500).json({ error: "Failed to fetch today's hotel check-ins" });
  }
};

export const getHotelCheckOutsToday: RequestHandler = (req, res) => {
  try {
    const { date } = req.query as { date?: string };
    const sql = `
      SELECT hb.*, h.name AS hotel_name
      FROM hotel_bookings hb
      JOIN hotels h ON hb.hotel_id = h.id
      WHERE DATE(hb.check_out_date) = DATE(?)
      ORDER BY h.name, hb.guest_name
    `;
    const results = queries.getDatabase().prepare(sql).all(date || new Date().toISOString().slice(0, 10));
    res.json(results);
  } catch (error) {
    console.error("Error fetching today's hotel check-outs:", error);
    res.status(500).json({ error: "Failed to fetch today's hotel check-outs" });
  }
};
