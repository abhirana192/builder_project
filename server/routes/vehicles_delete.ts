import { RequestHandler } from "express";
import { queries } from "../db/database";

export const deleteVehicle: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    console.log('Deleting vehicle:', id);

    // Check if vehicle exists
    const vehicle = queries.getVehicleById().get(id);
    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    // Check if vehicle is currently assigned to any active transport schedules
    const activeTransports = queries.getDatabase().prepare(`
      SELECT COUNT(*) as count FROM group_transport_schedules 
      WHERE vehicle_id = ? AND status IN ('scheduled', 'in_transit')
    `).get(id) as { count: number };

    if (activeTransports.count > 0) {
      return res.status(400).json({ 
        error: `Cannot delete vehicle. It is currently assigned to ${activeTransports.count} active transport schedule(s). Please complete or cancel these transports first.`
      });
    }

    // Delete the vehicle
    const result = queries.getDatabase().prepare('DELETE FROM vehicles WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    res.json({
      message: 'Vehicle deleted successfully',
      vehicleId: id,
      vehicleName: `${vehicle.vehicle_number} - ${vehicle.vehicle_type}`
    });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({ error: "Failed to delete vehicle" });
  }
};
