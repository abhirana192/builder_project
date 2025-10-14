import { RequestHandler } from "express";
import { queries } from "../db/database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email/name and password are required" });
    }

    // Get staff member by email or name
    let staff = queries.getStaffByEmail().get(email);

    // If not found by email, try searching by name (first name + last name)
    if (!staff) {
      const nameParts = email.trim().split(' ');
      if (nameParts.length >= 2) {
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        staff = queries.getDatabase().prepare(`
          SELECT * FROM staff
          WHERE (LOWER(first_name) = LOWER(?) AND LOWER(last_name) = LOWER(?))
          OR (LOWER(first_name || ' ' || last_name) = LOWER(?))
        `).get(firstName, lastName, email);
      } else {
        // Try single name search (either first or last name)
        staff = queries.getDatabase().prepare(`
          SELECT * FROM staff
          WHERE LOWER(first_name) = LOWER(?) OR LOWER(last_name) = LOWER(?)
        `).get(email, email);
      }
    }
    
    if (!staff) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if staff member is active
    if (!staff.is_active) {
      return res.status(401).json({ error: "Account is deactivated" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, staff.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    queries.getDatabase().prepare(`
      UPDATE staff SET last_login = CURRENT_TIMESTAMP WHERE id = ?
    `).run(staff.id);

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: staff.id, 
        email: staff.email, 
        role: staff.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Remove password_hash from response
    const { password_hash, ...staffWithoutPassword } = staff;

    res.json({
      message: "Login successful",
      token,
      user: staffWithoutPassword
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logout: RequestHandler = (req, res) => {
  // For JWT, logout is typically handled client-side by removing the token
  // But we can blacklist tokens if needed in the future
  res.json({ message: "Logout successful" });
};

export const verifyToken: RequestHandler = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Get current staff info
    const staff = queries.getStaffById().get(decoded.id);
    
    if (!staff || !staff.is_active) {
      return res.status(401).json({ error: "Invalid or inactive user" });
    }

    // Add user info to request
    req.user = {
      id: staff.id,
      email: staff.email,
      role: staff.role,
      first_name: staff.first_name,
      last_name: staff.last_name
    };

    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const getCurrentUser: RequestHandler = (req, res) => {
  // This endpoint requires authentication middleware
  res.json({ user: req.user });
};

export const changePassword: RequestHandler = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long" });
    }

    // Get staff member
    const staff = queries.getStaffById().get(userId);
    
    if (!staff) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, staff.password_hash);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    queries.getDatabase().prepare(`
      UPDATE staff SET 
        password_hash = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(hashedNewPassword, userId);

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        first_name: string;
        last_name: string;
      };
    }
  }
}
