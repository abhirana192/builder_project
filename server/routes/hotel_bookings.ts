import { RequestHandler } from "express";
import { queries } from "../db/database";

// Get all hotel bookings with hotel and room details
export const getAllHotelBookings: RequestHandler = (req, res) => {
  try {
    const bookings = queries.getDatabase().prepare(`
      SELECT 
        hb.*,
        h.name as hotel_name,
        hr.room_number,
        hr.room_type,
        b.guest_name,
        b.booking_reference
      FROM hotel_bookings hb
      JOIN hotels h ON hb.hotel_id = h.id
      JOIN hotel_rooms hr ON hb.room_id = hr.id
      JOIN bookings b ON hb.booking_id = b.id
      ORDER BY hb.check_in_date DESC
    `).all();
    
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching hotel bookings:", error);
    res.status(500).json({ error: "Failed to fetch hotel bookings" });
  }
};

// Create new hotel booking
export const createHotelBooking: RequestHandler = (req, res) => {
  try {
    const {
      booking_id,
      hotel_id,
      room_id,
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

    const result = queries.getDatabase().prepare(`
      INSERT INTO hotel_bookings (
        booking_id, hotel_id, room_id, check_in_date, check_out_date,
        guests_count, rate_per_night, total_amount, special_requests, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
    `).run(
      booking_id,
      hotel_id, 
      room_id,
      check_in_date,
      check_out_date,
      guests_count,
      rate_per_night,
      total_amount,
      special_requests || null
    );

    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'Hotel booking created successfully',
      total_amount
    });
  } catch (error) {
    console.error("Error creating hotel booking:", error);
    res.status(500).json({ error: "Failed to create hotel booking" });
  }
};

// Update booking status (check-in/check-out)
export const updateBookingStatus: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    let updateQuery = `UPDATE hotel_bookings SET status = ?, updated_at = CURRENT_TIMESTAMP`;
    let params = [status, id];

    // Set actual check-in/check-out times
    if (status === 'checked_in') {
      updateQuery += `, actual_check_in = CURRENT_TIMESTAMP`;
    } else if (status === 'checked_out') {
      updateQuery += `, actual_check_out = CURRENT_TIMESTAMP`;
    }

    updateQuery += ` WHERE id = ?`;

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

// Get available rooms for a hotel in a date range
export const getAvailableRooms: RequestHandler = (req, res) => {
  try {
    const { hotelId } = req.params;
    const { checkInDate, checkOutDate } = req.query;

    const availableRooms = queries.getDatabase().prepare(`
      SELECT hr.*
      FROM hotel_rooms hr
      WHERE hr.hotel_id = ?
        AND hr.status = 'available'
        AND hr.id NOT IN (
          SELECT hb.room_id 
          FROM hotel_bookings hb 
          WHERE hb.hotel_id = ?
            AND hb.status IN ('confirmed', 'checked_in')
            AND (
              (hb.check_in_date <= ? AND hb.check_out_date > ?) OR
              (hb.check_in_date < ? AND hb.check_out_date >= ?) OR
              (hb.check_in_date >= ? AND hb.check_out_date <= ?)
            )
        )
      ORDER BY hr.room_number
    `).all(
      hotelId, 
      hotelId,
      checkInDate, checkInDate,
      checkOutDate, checkOutDate,
      checkInDate, checkOutDate
    );

    res.json(availableRooms);
  } catch (error) {
    console.error("Error fetching available rooms:", error);
    res.status(500).json({ error: "Failed to fetch available rooms" });
  }
};

// Get hotel booking by ID
export const getHotelBookingById: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = queries.getDatabase().prepare(`
      SELECT 
        hb.*,
        h.name as hotel_name,
        hr.room_number,
        hr.room_type,
        b.guest_name,
        b.booking_reference
      FROM hotel_bookings hb
      JOIN hotels h ON hb.hotel_id = h.id
      JOIN hotel_rooms hr ON hb.room_id = hr.id
      JOIN bookings b ON hb.booking_id = b.id
      WHERE hb.id = ?
    `).get(id);

    if (!booking) {
      return res.status(404).json({ error: "Hotel booking not found" });
    }

    res.json(booking);
  } catch (error) {
    console.error("Error fetching hotel booking:", error);
    res.status(500).json({ error: "Failed to fetch hotel booking" });
  }
};

// Delete hotel booking
export const deleteHotelBooking: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    const result = queries.getDatabase().prepare(
      'DELETE FROM hotel_bookings WHERE id = ?'
    ).run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Hotel booking not found" });
    }

    res.json({
      message: 'Hotel booking deleted successfully',
      id: id
    });
  } catch (error) {
    console.error("Error deleting hotel booking:", error);
    res.status(500).json({ error: "Failed to delete hotel booking" });
  }
};

// Get hotel occupancy stats
export const getHotelStats: RequestHandler = (req, res) => {
  try {
    const stats = queries.getDatabase().prepare(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'checked_in' THEN 1 END) as checked_in_bookings,
        COUNT(CASE WHEN status = 'checked_out' THEN 1 END) as checked_out_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_booking_value
      FROM hotel_bookings
      WHERE check_in_date >= date('now', '-30 days')
    `).get();

    res.json(stats);
  } catch (error) {
    console.error("Error fetching hotel stats:", error);
    res.status(500).json({ error: "Failed to fetch hotel stats" });
  }
};
