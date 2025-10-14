import express from "express";
import cors from "cors";
import path from "path"; // Import path module
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { initializeDatabase } from "./db/database";
import { handleDemo } from "./routes/demo";
import { 
  getDashboardStats, 
  getTodaysArrivals, 
  getTodaysDepartures, 
  getActiveBookings 
} from "./routes/dashboard";
import {
  getAllVehicles,
  getAvailableVehicles,
  updateVehicleStatus,
  getTransportSchedules,
  updateTransportStatus,
  deleteTransportSchedule,
  updateTransportDropoffLocation,
  updateTransportPickupLocation,
  createVehicle
} from "./routes/vehicles";
import {
  deleteVehicle
} from "./routes/vehicles_delete";
import { createManualTransportSchedule } from "./routes/transport_manual";
import { 
  getAllEquipment, 
  getAvailableEquipment, 
  updateEquipmentStatus 
} from "./routes/equipment";
import {
  getAllHotels,
  getHotelById,
  getHotelRooms,
  createHotel,
  updateHotel,
  deleteHotel,
  createHotelRoom,
  updateHotelRoom,
  updateRoomStatus,
  deleteHotelBooking
} from "./routes/hotels";
import {
  getAllHotelBookings,
  createHotelBooking,
  updateBookingStatus,
  getHotelStats,
  getGuestWithGroup,
  getHotelCheckInsToday,
  getHotelCheckOutsToday
} from "./routes/hotel_bookings_simple";
import {
  getAllBookings,
  getBookingById,
  createBooking,
  getBookingsByStatus,
  getDailyActivityReport // Import the new handler
} from "./routes/bookings";
import { runMigrations } from "./routes/migrate";
import {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  resetPassword
} from "./routes/staff";
import {
  adminChangePassword
} from "./routes/staff_admin";
import {
  clearTransportData,
  clearBookingData,
  clearAllTransportAndBookings
} from "./routes/clear_data";
import {
  login,
  logout,
  verifyToken,
  getCurrentUser,
  changePassword
} from "./routes/auth";
import {
  getAllGuests
} from "./routes/guests";
import {
  getAllGroups,
  getGroupById,
  getGroupMembers,
  createGroup,
  updateGroup,
  deleteGroup,
  addMemberToGroup,
  removeMemberFromGroup,
  testAutoStatusUpdate,
  testAutoTransportScheduling,
  manualTriggerAutoScheduling,
  getGroupBookingsReport
} from "./routes/groups";
import {
  getAllActivities,
  getActivityInstances,
  getTodaysActivityInstances,
  createActivity,
  updateActivity,
  deleteActivity,
  scheduleActivity,
  updateActivityInstanceStatus,
  takeAttendance,
  deleteActivityInstance,
  getAvailableGuides,
  getTourPackages,
  seedActivitiesData,
  debugActivities,
  fixActivityInstancesTable,
  addParticipantsToActivity
} from "./routes/activities";

export function createServer() {
  const app = express();

  // Initialize database
  initializeDatabase();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Serve static files from the dist/spa directory
  app.use(express.static(path.join(__dirname, '..', 'dist', 'spa')));

  // Health check
  app.get("/api/ping", (req, res) => {
    res.json({ message: "pong" });
  });

  // Authentication routes
  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/me", verifyToken, getCurrentUser);
  app.post("/api/auth/change-password", verifyToken, changePassword);

  // Original demo route
  app.get("/api/demo", handleDemo);

  // Dashboard routes
  app.get("/api/dashboard/stats", getDashboardStats);
  app.get("/api/dashboard/arrivals", getTodaysArrivals);
  app.get("/api/dashboard/departures", getTodaysDepartures);
  app.get("/api/dashboard/active-bookings", getActiveBookings);


  // Vehicle/Transport routes
  app.get("/api/vehicles", getAllVehicles);
  app.get("/api/vehicles/available", getAvailableVehicles);
  app.post("/api/vehicles", createVehicle);
  app.patch("/api/vehicles/:id/status", updateVehicleStatus);
  app.delete("/api/vehicles/:id", deleteVehicle);
  app.get("/api/transport/schedules", getTransportSchedules);
  app.post("/api/transport/schedules", createManualTransportSchedule);
  app.patch("/api/transport/schedules/:id/status", updateTransportStatus);
  app.delete("/api/transport/schedules/:id", deleteTransportSchedule);
  app.patch("/api/transport/schedules/:id/dropoff-location", updateTransportDropoffLocation);
  app.patch("/api/transport/schedules/:id/pickup-location", updateTransportPickupLocation);

  // Equipment routes
  app.get("/api/equipment", getAllEquipment);
  app.get("/api/equipment/available", getAvailableEquipment);
  app.patch("/api/equipment/:id/status", updateEquipmentStatus);

  // Hotel routes
  app.get("/api/hotels", getAllHotels);
  app.post("/api/hotels", createHotel);
  app.get("/api/hotels/:id", getHotelById);
  app.put("/api/hotels/:id", updateHotel);
  app.delete("/api/hotels/:id", deleteHotel);
  app.get("/api/hotels/:id/rooms", getHotelRooms);
  app.post("/api/hotels/:hotelId/rooms", createHotelRoom);
  app.put("/api/hotels/rooms/:id", updateHotelRoom);
  app.patch("/api/hotels/rooms/:id/status", updateRoomStatus);

  // Hotel booking routes
  app.get("/api/hotel-bookings", getAllHotelBookings);
  app.post("/api/hotel-bookings", createHotelBooking);
  app.delete("/api/hotel-bookings/:id", deleteHotelBooking);
  app.patch("/api/hotel-bookings/:id/status", updateBookingStatus);
  app.get("/api/hotel-stats", getHotelStats);
  app.get("/api/guests/:guestId/group", getGuestWithGroup);
  app.get("/api/hotels/checkins/today", getHotelCheckInsToday);
  app.get("/api/hotels/checkouts/today", getHotelCheckOutsToday);

  // Reports routes
  app.get("/api/reports/daily-activity", getDailyActivityReport);
  app.get("/api/reports/group-bookings", getGroupBookingsReport);

  // Staff routes
  app.get("/api/staff", getAllStaff);
  app.get("/api/staff/:id", getStaffById);
  app.post("/api/staff", createStaff);
  app.put("/api/staff/:id", updateStaff);
  app.delete("/api/staff/:id", deleteStaff);
  app.post("/api/staff/:id/reset-password", resetPassword);
  app.post("/api/staff/:id/change-password", verifyToken, adminChangePassword);

  // Guest routes
  app.get("/api/guests", getAllGuests);

  // Group routes
  app.get("/api/groups", getAllGroups);
  app.get("/api/groups/:id", getGroupById);
  app.get("/api/groups/:groupId/members", getGroupMembers);
  app.post("/api/groups", createGroup);
  app.put("/api/groups/:id", updateGroup);
  app.delete("/api/groups/:id", deleteGroup);
  app.post("/api/groups/:groupId/members", addMemberToGroup);
  app.delete("/api/groups/:groupId/members/:memberId", removeMemberFromGroup);
  app.post("/api/groups/test-auto-status", testAutoStatusUpdate);
  app.post("/api/groups/test-auto-transport", testAutoTransportScheduling);
  app.post("/api/groups/:groupId/trigger-auto-scheduling", manualTriggerAutoScheduling);

  // Migration routes (commented out for security)
  // app.post("/api/migrate", runMigrations);

  // Data clearing routes
  app.delete("/api/clear/transport", clearTransportData);
  app.delete("/api/clear/bookings", clearBookingData);
  app.delete("/api/clear/all-transport-bookings", clearAllTransportAndBookings);

  // Activities routes
  app.get("/api/activities", getAllActivities);
  app.get("/api/activities/instances", getActivityInstances);
  app.get("/api/activities/today", getTodaysActivityInstances);
  app.post("/api/activities", createActivity);
  app.put("/api/activities/:id", updateActivity);
  app.delete("/api/activities/:id", deleteActivity);
  app.post("/api/activities/schedule", scheduleActivity);
  app.patch("/api/activities/instances/:id/status", updateActivityInstanceStatus);
  app.patch("/api/activities/instances/:id/attendance", takeAttendance);
  app.post("/api/activities/instances/:id/participants", addParticipantsToActivity);
  app.delete("/api/activities/instances/:id", deleteActivityInstance);
  app.get("/api/activities/guides", getAvailableGuides);
  app.get("/api/activities/packages", getTourPackages);
  app.post("/api/activities/seed", seedActivitiesData);
  app.get("/api/activities/debug", debugActivities);
  app.post("/api/activities/fix-schema", fixActivityInstancesTable);

  return app;
}

// Start server only if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createServer();
  const PORT = process.env.PORT || 8080;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
