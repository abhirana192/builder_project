import { RequestHandler } from "express";
import { queries } from "../db/database";
import bcrypt from "bcrypt";

export const getAllStaff: RequestHandler = (req, res) => {
  try {
    const staff = queries.getAllStaff().all();
    // Remove password_hash from response
    const staffWithoutPasswords = staff.map(({ password_hash, ...rest }) => rest);
    res.json(staffWithoutPasswords);
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
};

export const getStaffById: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const staffMember = queries.getStaffById().get(id);

    if (!staffMember) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Remove password_hash from response
    const { password_hash, ...staffWithoutPassword } = staffMember;
    res.json(staffWithoutPassword);
  } catch (error) {
    console.error("Error fetching staff member:", error);
    res.status(500).json({ error: "Failed to fetch staff member" });
  }
};

export const createStaff: RequestHandler = async (req, res) => {
  try {
    const {
      email,
      first_name,
      last_name,
      role,
      phone,
      emergency_contact,
      password = 'temppassword123' // Default temporary password
    } = req.body;

    // Validate required fields
    if (!email || !first_name || !last_name || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if email already exists
    const existingStaff = queries.getStaffByEmail().get(email);
    if (existingStaff) {
      return res.status(400).json({ error: "Staff member with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new staff member
    const result = queries.getDatabase().prepare(`
      INSERT INTO staff (
        email, password_hash, first_name, last_name, role, phone, emergency_contact, hire_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, DATE('now'))
    `).run(email, hashedPassword, first_name, last_name, role, phone || null, emergency_contact || null);

    // Get the created staff member
    const newStaff = queries.getStaffById().get(result.lastInsertRowid);
    const { password_hash, ...staffWithoutPassword } = newStaff;

    res.status(201).json({
      message: "Staff member created successfully",
      staff: staffWithoutPassword
    });
  } catch (error) {
    console.error("Error creating staff member:", error);
    res.status(500).json({ error: "Failed to create staff member" });
  }
};

export const updateStaff: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      role,
      phone,
      emergency_contact,
      is_active
    } = req.body;

    // Check if staff member exists
    const existingStaff = queries.getStaffById().get(id);
    if (!existingStaff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Update staff member
    queries.getDatabase().prepare(`
      UPDATE staff SET
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        role = COALESCE(?, role),
        phone = ?,
        emergency_contact = ?,
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      first_name || null,
      last_name || null,
      role || null,
      phone || null,
      emergency_contact || null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      id
    );

    // Get updated staff member
    const updatedStaff = queries.getStaffById().get(id);
    const { password_hash, ...staffWithoutPassword } = updatedStaff;

    res.json({
      message: "Staff member updated successfully",
      staff: staffWithoutPassword
    });
  } catch (error) {
    console.error("Error updating staff member:", error);
    res.status(500).json({ error: "Failed to update staff member" });
  }
};

export const deleteStaff: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    // Check if staff member exists
    const existingStaff = queries.getStaffById().get(id);
    if (!existingStaff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Soft delete by setting is_active to false
    queries.getDatabase().prepare(`
      UPDATE staff SET
        is_active = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    res.json({ message: "Staff member deleted successfully" });
  } catch (error) {
    console.error("Error deleting staff member:", error);
    res.status(500).json({ error: "Failed to delete staff member" });
  }
};

export const resetPassword: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password = 'temppassword123' } = req.body;

    // Check if staff member exists
    const existingStaff = queries.getStaffById().get(id);
    if (!existingStaff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    queries.getDatabase().prepare(`
      UPDATE staff SET
        password_hash = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(hashedPassword, id);

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
};
