import { RequestHandler } from "express";
import { queries } from "../db/database";
import bcrypt from "bcrypt";

export const adminChangePassword: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Check if requesting user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: "Only admins can change passwords" });
    }

    if (!newPassword) {
      return res.status(400).json({ error: "New password is required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    // Check if target staff member exists
    const targetStaff = queries.getStaffById().get(id);
    if (!targetStaff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    queries.getDatabase().prepare(`
      UPDATE staff SET
        password_hash = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(hashedPassword, id);

    res.json({ 
      message: "Password changed successfully",
      changedFor: {
        name: `${targetStaff.first_name} ${targetStaff.last_name}`,
        email: targetStaff.email
      }
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
};
