import { RequestHandler } from "express";
import { queries } from "../db/database";

export const getAllHotels: RequestHandler = (req, res) => {
  try {
    const hotels = queries.getAllHotels().all();
    res.json(hotels);
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ error: "Failed to fetch hotels" });
  }
};

export const getHotelById: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const hotel = queries.getHotelById().get(id);
    
    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }
    
    res.json(hotel);
  } catch (error) {
    console.error("Error fetching hotel:", error);
    res.status(500).json({ error: "Failed to fetch hotel" });
  }
};

export const getHotelRooms: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const rooms = queries.getHotelRooms().all(id);
    res.json(rooms);
  } catch (error) {
    console.error("Error fetching hotel rooms:", error);
    res.status(500).json({ error: "Failed to fetch hotel rooms" });
  }
};

// Create new hotel
export const createHotel: RequestHandler = (req, res) => {
  try {
    console.log('🏨 Creating hotel with data:', req.body);
    const {
      name,
      address,
      phone,
      email,
      star_rating,
      total_rooms,
      contact_person,
      special_rates,
      amenities,
      check_in_time,
      check_out_time,
      is_partner
    } = req.body;

    // Convert and validate data types for SQLite
    const hotelData = {
      name: name || '',
      address: address || '',
      phone: phone || null,
      email: email || null,
      star_rating: parseInt(star_rating) || 3,
      total_rooms: parseInt(total_rooms) || 0,
      contact_person: contact_person || null,
      special_rates: special_rates ? parseFloat(special_rates) : null,
      amenities: amenities || null,
      check_in_time: check_in_time || '15:00',
      check_out_time: check_out_time || '11:00',
      is_partner: is_partner ? 1 : 0
    };

    console.log('🏨 Converted hotel data:', hotelData);

    const result = queries.createHotel().run(
      hotelData.name,
      hotelData.address,
      hotelData.phone,
      hotelData.email,
      hotelData.star_rating,
      hotelData.total_rooms,
      hotelData.contact_person,
      hotelData.special_rates,
      hotelData.amenities,
      hotelData.check_in_time,
      hotelData.check_out_time,
      hotelData.is_partner
    );

    // Get the newly created hotel
    const newHotel = queries.getHotelById().get(result.lastInsertRowid);

    res.status(201).json(newHotel);
  } catch (error) {
    console.error("Error creating hotel:", error);
    res.status(500).json({ error: "Failed to create hotel" });
  }
};

// Update hotel
export const updateHotel: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      address,
      phone,
      email,
      star_rating,
      total_rooms,
      contact_person,
      special_rates,
      amenities,
      check_in_time,
      check_out_time,
      is_partner
    } = req.body;

    const result = queries.updateHotel().run(
      name,
      address,
      phone,
      email,
      star_rating,
      total_rooms,
      contact_person,
      special_rates,
      amenities,
      check_in_time,
      check_out_time,
      is_partner,
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Hotel not found" });
    }

    res.json({
      message: 'Hotel updated successfully',
      id: id
    });
  } catch (error) {
    console.error("Error updating hotel:", error);
    res.status(500).json({ error: "Failed to update hotel" });
  }
};

// Delete hotel
export const deleteHotel: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    const result = queries.deleteHotel().run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Hotel not found" });
    }

    res.json({
      message: 'Hotel deleted successfully',
      id: id
    });
  } catch (error) {
    console.error("Error deleting hotel:", error);
    res.status(500).json({ error: "Failed to delete hotel" });
  }
};

// Delete hotel booking
export const deleteHotelBooking: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    const result = queries.deleteHotelBooking().run(id);

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

// Create hotel room
export const createHotelRoom: RequestHandler = (req, res) => {
  try {
    const { hotelId } = req.params;
    const {
      room_number,
      room_type,
      capacity,
      rate_per_night,
      amenities
    } = req.body;

    const result = queries.createHotelRoom().run(
      hotelId,
      room_number,
      room_type,
      capacity,
      rate_per_night,
      amenities || null
    );

    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'Hotel room created successfully'
    });
  } catch (error) {
    console.error("Error creating hotel room:", error);
    res.status(500).json({ error: "Failed to create hotel room" });
  }
};

// Update hotel room
export const updateHotelRoom: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const {
      room_number,
      room_type,
      capacity,
      rate_per_night,
      amenities,
      status
    } = req.body;

    const result = queries.updateHotelRoom().run(
      room_number,
      room_type,
      capacity,
      rate_per_night,
      amenities,
      status,
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Hotel room not found" });
    }

    res.json({
      message: 'Hotel room updated successfully',
      id: id
    });
  } catch (error) {
    console.error("Error updating hotel room:", error);
    res.status(500).json({ error: "Failed to update hotel room" });
  }
};

// Update room status
export const updateRoomStatus: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = queries.updateRoomStatus().run(status, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Hotel room not found" });
    }

    res.json({
      message: 'Room status updated successfully',
      id: id,
      status: status
    });
  } catch (error) {
    console.error("Error updating room status:", error);
    res.status(500).json({ error: "Failed to update room status" });
  }
};
