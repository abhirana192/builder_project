import { RequestHandler } from "express";
import { queries } from "../db/database";

export const getAllEquipment: RequestHandler = (req, res) => {
  try {
    const equipment = queries.getAllEquipment().all();
    res.json(equipment);
  } catch (error) {
    console.error("Error fetching equipment:", error);
    res.status(500).json({ error: "Failed to fetch equipment" });
  }
};

export const getAvailableEquipment: RequestHandler = (req, res) => {
  try {
    const equipment = queries.getAvailableEquipment().all();
    res.json(equipment);
  } catch (error) {
    console.error("Error fetching available equipment:", error);
    res.status(500).json({ error: "Failed to fetch available equipment" });
  }
};

export const updateEquipmentStatus: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { is_available, condition_status } = req.body;

    queries.updateEquipmentStatus().run(is_available, condition_status, id);
    const updatedEquipment = queries.getEquipmentById().get(id);
    
    res.json(updatedEquipment);
  } catch (error) {
    console.error("Error updating equipment status:", error);
    res.status(500).json({ error: "Failed to update equipment status" });
  }
};
