import { RequestHandler } from "express";
import { queries } from "../db/database";

export const getAllBookings: RequestHandler = (req, res) => {
  try {
    const bookings = queries.getAllBookings().all();
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};

export const getBookingById: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const booking = queries.getBookingById().get(id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
};

export const createBooking: RequestHandler = (req, res) => {
  try {
    const {
      booking_reference,
      guest_id,
      tour_package_id,
      number_of_guests,
      total_amount,
      booking_date,
      start_date,
      end_date,
      status = 'pending',
      payment_status = 'pending',
      special_requests,
      assigned_guide_id
    } = req.body;

    const result = queries.createBooking().run(
      booking_reference,
      guest_id,
      tour_package_id,
      number_of_guests,
      total_amount,
      booking_date,
      start_date,
      end_date,
      status,
      payment_status,
      special_requests,
      assigned_guide_id
    );

    const newBooking = queries.getBookingById().get(result.lastInsertRowid);
    res.status(201).json(newBooking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
};

export const updateBookingStatus: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    queries.updateBookingStatus().run(status, id);
    const updatedBooking = queries.getBookingById().get(id);

    res.json(updatedBooking);
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ error: "Failed to update booking" });
  }
};

export const getBookingsByStatus: RequestHandler = (req, res) => {
  try {
    const { status } = req.params;
    const bookings = queries.getBookingsByStatus().all(status);
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings by status:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};

// New handler for Daily Activity Report
export const getDailyActivityReport: RequestHandler = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    // Placeholder for database queries. These would need to be implemented in ../db/database.ts
    // and would likely involve joining tables for guests, bookings, vehicles, and drivers.

    // Example: Fetch guests arriving today
    // const arrivingGuests = await queries.getGuestsArrivingToday().all(today.toISOString());
    const arrivingGuests = []; // Mock data for now

    // Example: Fetch guests departing today
    // const departingGuests = await queries.getGuestsDepartingToday().all(today.toISOString());
    const departingGuests = []; // Mock data for now

    // Example: Fetch vehicle assignments for today
    // This might involve looking at bookings or specific tour schedules for today
    // const vehicleAssignments = await queries.getVehicleAssignmentsForDay().all(today.toISOString());
    const vehicleAssignments = [
      { vehicle_id: 1, vehicle_type: 'Bus', vehicle_number: 'Bus 2', driver_name: 'Simon', assigned_to_activity_for_date: today.toISOString() },
      { vehicle_id: 2, vehicle_type: 'Van', vehicle_number: 'Van 1', driver_name: 'Wendy', assigned_to_activity_for_date: today.toISOString() },
      { vehicle_id: 3, vehicle_type: 'Van', vehicle_number: 'Van 3', driver_name: 'Wendy', assigned_to_activity_for_date: today.toISOString() },
    ]; // Mock data for now

    // Example: Fetch participant details for today's activities
    // This would likely involve joining bookings, guests, and vehicle assignments
    // For simplicity, we'll combine mock data based on the frontend's expected structure
    const participantsToday: any[] = [];

    // Mocking data to match the frontend structure
    // In a real scenario, you'd fetch guest names, their booking info, and link them to vehicle assignments
    const mockParticipants = [
      { name: 'YAN KUHON', info: 'Hotel: Jenny\'s', vehicleType: 'Bus', vehicleNumber: 'Bus 2', driverName: 'Simon', arrival_time: '1:13 PM', departure_time: '1:13 PM' },
      { name: 'SU CHI HWEI', info: 'Hotel: (5115 50St)', vehicleType: 'Bus', vehicleNumber: 'Bus 2', driverName: 'Simon', arrival_time: '1:13 PM', departure_time: '1:13 PM' },
      { name: 'GUO AN', info: 'Hotel: CAP', vehicleType: 'Bus', vehicleNumber: 'Bus 2', driverName: 'Simon', arrival_time: '1:13 PM', departure_time: '1:13 PM' },
      { name: 'LEE CHIAWENWEN', info: 'Hotel: EXP', vehicleType: 'Van', vehicleNumber: 'Van 1', driverName: 'Wendy', arrival_time: '1:13 PM', departure_time: '1:13 PM' },
      { name: 'CARMEN WANG', info: 'Hotel: DISC', vehicleType: 'Van', vehicleNumber: 'Van 1', driverName: 'Wendy', arrival_time: '2:30 PM', departure_time: '2:30 PM' },
      { name: 'LU LIENCHIN', info: 'Hotel: CHTU', vehicleType: 'Van', vehicleNumber: 'Van 1', driverName: 'Wendy', arrival_time: '2:30 PM', departure_time: '2:30 PM' },
      { name: 'HUANG LUINGLING', info: 'Hotel: QUA', vehicleType: 'Van', vehicleNumber: 'Van 3', driverName: 'Wendy', arrival_time: '3:00 PM', departure_time: '12:00 PM' },
      { name: 'JI FENG', info: 'Hotel: NOVA INN', vehicleType: 'Van', vehicleNumber: 'Van 3', driverName: 'Wendy', arrival_time: '2:00 PM', departure_time: '12:05 PM' },
      { name: 'CHEN KAICHUN', info: 'Hotel: (4924 43St)', vehicleType: 'Van', vehicleNumber: 'Van 3', driverName: 'Wendy', arrival_time: '2:00 PM', departure_time: '12:05 PM' },
    ];

    // In a real implementation, you would fetch actual data and map it to the frontend structure.
    // For now, we'll use the mock data structure that matches the frontend.
    const reportData = {
      arrivingGuests: arrivingGuests, // Placeholder
      departingGuests: departingGuests, // Placeholder
      participantsToday: mockParticipants, // Using mock data for now
      vehicleAssignments: vehicleAssignments, // Mock data
    };

    res.json(reportData);

  } catch (error) {
    console.error("Error fetching daily activity report:", error);
    res.status(500).json({ error: "Failed to fetch daily activity report" });
  }
};

// Export the new handler
