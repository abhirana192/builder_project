import { RequestHandler } from "express";
import { queries } from "../db/database";

interface TableInfo {
  name: string;
}

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: 0 | 1;
  dflt_value: string | null;
  pk: 0 | 1;
}

interface ActivityInstance {
  id: number;
  activity_id: number;
  booking_id: number | null;
  scheduled_date: string;
  scheduled_time: string;
  actual_start_time: string | null;
  actual_end_time: string | null;
  guide_id: number | null;
  status: string;
  weather_conditions: string | null;
  attendance_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const getAllActivities: RequestHandler = (req, res) => {
  try {
    const activities = queries.getDatabase().prepare(`
      SELECT a.*, tp.name as tour_package_name 
      FROM activities a 
      LEFT JOIN tour_packages tp ON a.tour_package_id = tp.id 
      WHERE a.is_active = 1
      ORDER BY a.name
    `).all();
    res.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
};

export const getActivityInstances: RequestHandler = (req, res) => {
  try {
    const instances = queries.getDatabase().prepare(`
      SELECT 
        ai.*,
        a.name as activity_name,
        a.max_participants,
        b.booking_reference,
        s.first_name || ' ' || s.last_name as guide_name
      FROM activity_instances ai
      LEFT JOIN activities a ON ai.activity_id = a.id
      LEFT JOIN bookings b ON ai.booking_id = b.id
      LEFT JOIN staff s ON ai.guide_id = s.id
      ORDER BY ai.scheduled_date DESC, ai.scheduled_time ASC
    `).all();
    res.json(instances);
  } catch (error) {
    console.error("Error fetching activity instances:", error);
    res.status(500).json({ error: "Failed to fetch activity instances" });
  }
};

export const getTodaysActivityInstances: RequestHandler = (req, res) => {
  try {
    // Get today's date in YYYY-MM-DD format based on local timezone
    const today = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
    const instances = queries.getDatabase().prepare(`
      SELECT 
        ai.*,
        a.name as activity_name,
        a.max_participants,
        b.booking_reference,
        s.first_name || ' ' || s.last_name as guide_name
      FROM activity_instances ai
      LEFT JOIN activities a ON ai.activity_id = a.id
      LEFT JOIN bookings b ON ai.booking_id = b.id
      LEFT JOIN staff s ON ai.guide_id = s.id
      WHERE ai.scheduled_date = ?
      ORDER BY ai.scheduled_time ASC
    `).all(today);
    res.json(instances);
  } catch (error) {
    console.error("Error fetching today's activity instances:", error);
    res.status(500).json({ error: "Failed to fetch today's activity instances" });
  }
};

export const createActivity: RequestHandler = (req, res) => {
  try {
    const {
      tour_package_id,
      name,
      description,
      location,
      duration_hours,
      max_participants,
      equipment_required,
      difficulty_level,
      weather_dependent
    } = req.body;

    const result = queries.getDatabase().prepare(`
      INSERT INTO activities (
        tour_package_id, name, description, location, duration_hours,
        max_participants, equipment_required, difficulty_level, weather_dependent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tour_package_id || 1, name, description, location, duration_hours,
      max_participants, equipment_required, difficulty_level, weather_dependent ? 1 : 0
    );

    const newActivity = queries.getDatabase().prepare(`
      SELECT a.*, tp.name as tour_package_name 
      FROM activities a 
      LEFT JOIN tour_packages tp ON a.tour_package_id = tp.id 
      WHERE a.id = ?
    `).get(result.lastInsertRowid);

    res.json(newActivity);
  } catch (error) {
    console.error("Error creating activity:", error);
    res.status(500).json({ error: "Failed to create activity" });
  }
};

export const updateActivity: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      location,
      duration_hours,
      max_participants,
      equipment_required,
      difficulty_level,
      weather_dependent,
      is_active
    } = req.body;

    queries.getDatabase().prepare(`
      UPDATE activities SET
        name = ?, description = ?, location = ?, duration_hours = ?,
        max_participants = ?, equipment_required = ?, difficulty_level = ?,
        weather_dependent = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name, description, location, duration_hours, max_participants,
      equipment_required, difficulty_level, weather_dependent ? 1 : 0,
      is_active ? 1 : 0, id
    );

    const updatedActivity = queries.getDatabase().prepare(`
      SELECT a.*, tp.name as tour_package_name
      FROM activities a
      LEFT JOIN tour_packages tp ON a.tour_package_id = tp.id
      WHERE a.id = ?
    `).get(id);

    res.json(updatedActivity);
  } catch (error) {
    console.error("Error updating activity:", error);
    res.status(500).json({ error: "Failed to update activity" });
  }
};

export const deleteActivity: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    // First, delete all activity instances for this activity
    const deleteInstancesResult = queries.getDatabase().prepare(`
      DELETE FROM activity_instances WHERE activity_id = ?
    `).run(id);

    // Then delete the activity itself
    const result = queries.getDatabase().prepare(`
      DELETE FROM activities WHERE id = ?
    `).run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Activity not found" });
    }

    res.json({
      message: "Activity deleted successfully",
      deletedInstances: deleteInstancesResult.changes,
      deletedActivity: result.changes
    });
  } catch (error) {
    console.error("Error deleting activity:", error);
    res.status(500).json({ error: "Failed to delete activity" });
  }
};

export const scheduleActivity: RequestHandler = (req, res) => {
  try {
    console.log("=== SCHEDULE ACTIVITY SERVER DEBUG ===");
    console.log("Request method:", req.method);
    console.log("Request headers:", req.headers);
    console.log("Request body:", req.body);

    const {
      activity_id,
      booking_id,
      scheduled_date,
      scheduled_time,
      guide_id,
      weather_conditions,
      notes
    } = req.body;

    console.log("Extracted data:", {
      activity_id: activity_id,
      activity_id_type: typeof activity_id,
      booking_id: booking_id,
      scheduled_date: scheduled_date,
      scheduled_time: scheduled_time,
      guide_id: guide_id,
      guide_id_type: typeof guide_id,
      weather_conditions: weather_conditions,
      notes: notes
    });

    // Validate required fields
    if (!activity_id || !scheduled_date || !scheduled_time) {
      console.log("Validation failed - missing required fields");
      return res.status(400).json({
        error: "Missing required fields: activity_id, scheduled_date, scheduled_time",
        received: { activity_id, scheduled_date, scheduled_time }
      });
    }

    // Check if activity exists
    const activityCheck = queries.getDatabase().prepare(`
      SELECT id, name FROM activities WHERE id = ?
    `).get(activity_id);

    console.log("Activity check result:", activityCheck);

    if (!activityCheck) {
      console.log("Activity not found with ID:", activity_id);
      return res.status(400).json({
        error: "Activity not found",
        activity_id: activity_id
      });
    }

    // Check if guide exists (if provided)
    if (guide_id && guide_id > 0) {
      const guideCheck = queries.getDatabase().prepare(`
        SELECT id, first_name, last_name FROM staff WHERE id = ? AND role = 'guide'
      `).get(guide_id);

      console.log("Guide check result:", guideCheck);

      if (!guideCheck) {
        console.log("Guide not found with ID:", guide_id);
        return res.status(400).json({
          error: "Guide not found",
          guide_id: guide_id
        });
      }
    }

    console.log("Validation passed, inserting activity instance...");

    // Insert activity instance
    const insertQuery = `
      INSERT INTO activity_instances (
        activity_id, booking_id, scheduled_date, scheduled_time,
        guide_id, weather_conditions, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const insertParams = [
      activity_id,
      booking_id || null,
      scheduled_date,
      scheduled_time,
      guide_id || null,
      weather_conditions || null,
      notes || null
    ];

    console.log("Insert query:", insertQuery);
    console.log("Insert params:", insertParams);

    let result;
    try {
      result = queries.getDatabase().prepare(insertQuery).run(...insertParams);
    } catch (dbError: any) {
      if (dbError.code === 'SQLITE_READONLY' || dbError.code === 'SQLITE_READONLY_DBMOVED') {
        console.error('Database is read-only, cannot schedule activity');
        return res.status(500).json({
          error: "Database is in read-only mode. Please contact administrator.",
          code: "DATABASE_READONLY"
        });
      }
      throw dbError; // Re-throw other errors
    }

    console.log("Insert result:", result);
    console.log("Activity instance created with ID:", result.lastInsertRowid);

    // Get the created instance with joined data
    const selectQuery = `
      SELECT
        ai.*,
        a.name as activity_name,
        a.max_participants,
        COALESCE(b.booking_reference, 'No Booking') as booking_reference,
        COALESCE(s.first_name || ' ' || s.last_name, 'No Guide') as guide_name
      FROM activity_instances ai
      LEFT JOIN activities a ON ai.activity_id = a.id
      LEFT JOIN bookings b ON ai.booking_id = b.id
      LEFT JOIN staff s ON ai.guide_id = s.id
      WHERE ai.id = ?
    `;

    console.log("Select query:", selectQuery);
    console.log("Select param:", result.lastInsertRowid);

    const newInstance = queries.getDatabase().prepare(selectQuery).get(result.lastInsertRowid);

    console.log("Retrieved new instance:", newInstance);
    console.log("=== END SCHEDULE ACTIVITY SERVER DEBUG ===");

    res.json(newInstance);
  } catch (error) {
    console.error("=== SCHEDULE ACTIVITY ERROR ===");
    console.error("Error scheduling activity:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Stack trace:", error.stack);
    console.error("=== END SCHEDULE ACTIVITY ERROR ===");

    res.status(500).json({
      error: "Failed to schedule activity",
      details: error.message,
      code: error.code,
      name: error.name
    });
  }
};

export const updateActivityInstanceStatus: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    let updateQuery = `
      UPDATE activity_instances SET
        status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    `;
    let params = [status, notes];

    // Set timestamps based on status
    if (status === 'in_progress') {
      updateQuery += `, actual_start_time = CURRENT_TIMESTAMP`;
    } else if (status === 'completed') {
      updateQuery += `, actual_end_time = CURRENT_TIMESTAMP`;
    }

    updateQuery += ` WHERE id = ?`;
    params.push(id);

    queries.getDatabase().prepare(updateQuery).run(...params);

    const updatedInstance = queries.getDatabase().prepare(`
      SELECT 
        ai.*,
        a.name as activity_name,
        a.max_participants,
        b.booking_reference,
        s.first_name || ' ' || s.last_name as guide_name
      FROM activity_instances ai
      LEFT JOIN activities a ON ai.activity_id = a.id
      LEFT JOIN bookings b ON ai.booking_id = b.id
      LEFT JOIN staff s ON ai.guide_id = s.id
      WHERE ai.id = ?
    `).get(id);

    res.json(updatedInstance);
  } catch (error) {
    console.error("Error updating activity instance status:", error);
    res.status(500).json({ error: "Failed to update activity instance status" });
  }
};

export const takeAttendance: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { participant_ids, attendance_count } = req.body;

    // Update attendance count
    queries.getDatabase().prepare(`
      UPDATE activity_instances SET
        attendance_count = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(attendance_count, id);

    // If we have specific participants, we could store them in a separate table
    // For now, we'll just update the count

    const updatedInstance = queries.getDatabase().prepare(`
      SELECT
        ai.*,
        a.name as activity_name,
        a.max_participants,
        b.booking_reference,
        s.first_name || ' ' || s.last_name as guide_name
      FROM activity_instances ai
      LEFT JOIN activities a ON ai.activity_id = a.id
      LEFT JOIN bookings b ON ai.booking_id = b.id
      LEFT JOIN staff s ON ai.guide_id = s.id
      WHERE ai.id = ?
    `).get(id);

    res.json(updatedInstance);
  } catch (error) {
    console.error("Error taking attendance:", error);
    res.status(500).json({ error: "Failed to take attendance" });
  }
};

export const addParticipantsToActivity: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { participant_ids } = req.body;

    console.log("Adding participants to activity instance:", id);
    console.log("Participant IDs:", participant_ids);

    // For now, we'll just update the attendance count
    // In a full implementation, you'd want to create a separate table for activity participants
    const participantCount = participant_ids ? participant_ids.length : 0;

    queries.getDatabase().prepare(`
      UPDATE activity_instances SET
        attendance_count = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(participantCount, id);

    const updatedInstance = queries.getDatabase().prepare(`
      SELECT
        ai.*,
        a.name as activity_name,
        a.max_participants,
        b.booking_reference,
        s.first_name || ' ' || s.last_name as guide_name
      FROM activity_instances ai
      LEFT JOIN activities a ON ai.activity_id = a.id
      LEFT JOIN bookings b ON ai.booking_id = b.id
      LEFT JOIN staff s ON ai.guide_id = s.id
      WHERE ai.id = ?
    `).get(id);

    res.json(updatedInstance);
  } catch (error) {
    console.error("Error adding participants to activity:", error);
    res.status(500).json({ error: "Failed to add participants to activity" });
  }
};

export const deleteActivityInstance: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    const result = queries.getDatabase().prepare(`
      DELETE FROM activity_instances WHERE id = ?
    `).run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Activity instance not found" });
    }

    res.json({ message: "Activity instance deleted successfully" });
  } catch (error) {
    console.error("Error deleting activity instance:", error);
    res.status(500).json({ error: "Failed to delete activity instance" });
  }
};

export const getAvailableGuides: RequestHandler = (req, res) => {
  try {
    const guides = queries.getDatabase().prepare(`
      SELECT id, first_name, last_name, phone
      FROM staff 
      WHERE role = 'guide' AND is_active = 1
      ORDER BY first_name, last_name
    `).all();
    res.json(guides);
  } catch (error) {
    console.error("Error fetching guides:", error);
    res.status(500).json({ error: "Failed to fetch guides" });
  }
};

export const getTourPackages: RequestHandler = (req, res) => {
  try {
    const packages = queries.getDatabase().prepare(`
      SELECT id, name, description
      FROM tour_packages
      WHERE is_active = 1
      ORDER BY name
    `).all();
    res.json(packages);
  } catch (error) {
    console.error("Error fetching tour packages:", error);
    res.status(500).json({ error: "Failed to fetch tour packages" });
  }
};

export const debugActivities: RequestHandler = (req, res) => {
  try {
    const db = queries.getDatabase();

    console.log("=== DATABASE DEBUG ===");

    // Check if tables exist
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as TableInfo[];
    console.log("Available tables:", tables.map(t => t.name));

    // Check activities table structure
    const activitiesSchema = db.prepare("PRAGMA table_info(activities)").all();
    console.log("Activities table schema:", activitiesSchema);

    // Check activity_instances table structure
    const instancesSchema = db.prepare("PRAGMA table_info(activity_instances)").all();
    console.log("Activity instances table schema:", instancesSchema);

    // Check if activities table exists and has data
    const activities = db.prepare("SELECT * FROM activities LIMIT 5").all();
    const packages = db.prepare("SELECT * FROM tour_packages LIMIT 5").all();
    const staff = db.prepare("SELECT * FROM staff WHERE role = 'guide' LIMIT 5").all();
    const instances = db.prepare("SELECT * FROM activity_instances LIMIT 5").all();

    console.log("Activities data:", activities);
    console.log("Packages data:", packages);
    console.log("Staff data:", staff);
    console.log("Instances data:", instances);

    console.log("=== END DATABASE DEBUG ===");

    res.json({
      tables: tables.map(t => t.name),
      activities_schema: activitiesSchema,
      instances_schema: instancesSchema,
      activities_count: activities.length,
      packages_count: packages.length,
      guides_count: staff.length,
      instances_count: instances.length,
      sample_activities: activities,
      sample_packages: packages,
      sample_guides: staff,
      sample_instances: instances
    });
  } catch (error) {
    console.error("Error debugging activities:", error);
    res.status(500).json({ error: "Failed to debug activities", details: error.message });
  }
};

export const fixActivityInstancesTable: RequestHandler = (req, res) => {
  try {
    const db = queries.getDatabase();

    console.log("=== FIXING ACTIVITY INSTANCES TABLE ===");

    // First, check current schema
    const currentSchema = db.prepare("PRAGMA table_info(activity_instances)").all() as ColumnInfo[];
    console.log("Current schema:", currentSchema);

    // Check if booking_id is nullable
    const bookingIdColumn = currentSchema.find((col: ColumnInfo) => col.name === 'booking_id');
    console.log("booking_id column info:", bookingIdColumn);

    if (bookingIdColumn && bookingIdColumn.notnull === 1) {
      console.log("booking_id is NOT NULL, need to fix...");

      // Back up existing data
      const existingInstances = db.prepare("SELECT * FROM activity_instances").all() as ActivityInstance[];
      console.log("Backing up existing instances:", existingInstances.length, "rows");

      // Drop the current table
      db.prepare("DROP TABLE activity_instances").run();
      console.log("Dropped old activity_instances table");

      // Recreate with proper schema
      db.prepare(`
        CREATE TABLE activity_instances (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          activity_id INTEGER NOT NULL,
          booking_id INTEGER,
          scheduled_date DATE NOT NULL,
          scheduled_time TIME NOT NULL,
          actual_start_time TIMESTAMP,
          actual_end_time TIMESTAMP,
          guide_id INTEGER,
          status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
          weather_conditions VARCHAR(100),
          attendance_count INTEGER DEFAULT 0,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (activity_id) REFERENCES activities(id),
          FOREIGN KEY (booking_id) REFERENCES bookings(id),
          FOREIGN KEY (guide_id) REFERENCES staff(id)
        )
      `).run();
      console.log("Created new activity_instances table with nullable booking_id");

      // Restore existing data
      for (const instance of existingInstances) {
        db.prepare(`
          INSERT INTO activity_instances (
            id, activity_id, booking_id, scheduled_date, scheduled_time,
            actual_start_time, actual_end_time, guide_id, status,
            weather_conditions, attendance_count, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          instance.id, instance.activity_id, instance.booking_id, instance.scheduled_date,
          instance.scheduled_time, instance.actual_start_time, instance.actual_end_time,
          instance.guide_id, instance.status, instance.weather_conditions,
          instance.attendance_count, instance.notes, instance.created_at, instance.updated_at
        );
      }
      console.log("Restored", existingInstances.length, "existing instances");
    } else {
      console.log("booking_id is already nullable, no fix needed");
    }

    // Verify the fix
    const newSchema = db.prepare("PRAGMA table_info(activity_instances)").all() as ColumnInfo[];
    const newBookingIdColumn = newSchema.find((col: ColumnInfo) => col.name === 'booking_id');

    console.log("=== END FIXING ACTIVITY INSTANCES TABLE ===");

    res.json({
      message: "Activity instances table fixed successfully",
      old_schema: currentSchema,
      new_schema: newSchema,
      booking_id_nullable: newBookingIdColumn.notnull === 0
    });
  } catch (error) {
    console.error("Error fixing activity instances table:", error);
    res.status(500).json({ error: "Failed to fix activity instances table", details: error.message });
  }
};

export const seedActivitiesData: RequestHandler = (req, res) => {
  try {
    const db = queries.getDatabase();

    // Insert sample tour packages
    const packages = [
      [1, 'Golden Circle Classic', 'Classic Golden Circle tour with Geysir, Gullfoss, and Thingvellir', 1, 12000, 1],
      [2, 'South Coast Adventure', 'South coast waterfalls and black sand beaches', 1, 15000, 1],
      [3, 'Glacier Hiking Experience', 'Ice climbing and glacier exploration', 1, 25000, 1],
      [4, 'Northern Lights Hunt', 'Chase the Aurora Borealis away from city lights', 1, 8000, 1],
      [5, 'Blue Lagoon & Reykjanes', 'Relaxing spa experience and peninsula exploration', 1, 18000, 1]
    ];

    packages.forEach(pkg => {
      try {
        db.prepare(`INSERT OR IGNORE INTO tour_packages (id, name, description, duration_days, price, is_active) VALUES (?, ?, ?, ?, ?, ?)`).run(...pkg);
      } catch (e) {
        console.log('Package exists:', pkg[1]);
      }
    });

    // Insert sample activities
    const activities = [
      [1, 1, 'Geysir Visit', 'Witness the famous hot spring eruptions and learn about geothermal activity', 'Geysir Geothermal Area', 1.5, 19, null, 'easy', 0, 1],
      [2, 1, 'Gullfoss Waterfall', 'Experience the power and beauty of the Golden Waterfall', 'Gullfoss Waterfall', 1.0, 19, null, 'easy', 0, 1],
      [3, 1, 'Thingvellir National Park', 'Walk between tectonic plates in this UNESCO World Heritage site', 'Thingvellir National Park', 2.0, 19, null, 'easy', 0, 1],
      [4, 2, 'Seljalandsfoss Waterfall', 'Walk behind the magnificent waterfall', 'Seljalandsfoss', 1.0, 15, 'Waterproof jacket', 'easy', 1, 1],
      [5, 2, 'Skógafoss Waterfall', 'Climb the stairs for spectacular views', 'Skógafoss', 1.5, 15, null, 'moderate', 0, 1],
      [6, 2, 'Reynisfjara Black Beach', 'Explore dramatic basalt columns and black sand', 'Reynisfjara Beach', 1.0, 15, null, 'easy', 1, 1],
      [7, 3, 'Glacier Hike', 'Guided walk on glacier with crampons and safety equipment', 'Sólheimajökull Glacier', 3.0, 8, 'Crampons, helmets, ice axes', 'challenging', 1, 1],
      [8, 3, 'Ice Cave Exploration', 'Explore natural ice caves formed in glacier', 'Vatnajökull Glacier', 2.5, 6, 'Helmets, headlamps, crampons', 'challenging', 1, 1],
      [9, 4, 'Northern Lights Search', 'Hunt for Aurora Borealis away from city lights', 'Various dark locations', 4.0, 15, 'Warm clothing', 'easy', 1, 1],
      [10, 4, 'Photography Workshop', 'Learn to photograph the Northern Lights', 'Dark sky locations', 3.0, 8, 'Camera, tripod', 'easy', 1, 1],
      [11, 5, 'Blue Lagoon Experience', 'Relax in the geothermal spa waters', 'Blue Lagoon', 2.0, 20, null, 'easy', 0, 1],
      [12, 5, 'Reykjanes Peninsula Tour', 'Explore volcanic landscapes and geothermal areas', 'Reykjanes Peninsula', 3.0, 15, null, 'easy', 0, 1]
    ];

    activities.forEach(activity => {
      try {
        db.prepare(`INSERT OR IGNORE INTO activities (id, tour_package_id, name, description, location, duration_hours, max_participants, equipment_required, difficulty_level, weather_dependent, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(...activity);
      } catch (e) {
        console.log('Activity exists:', activity[2]);
      }
    });

    // Insert sample activity instances
    // Use local date for seeding to ensure "today" matches user's local timezone
    const today = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
    const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
    const dayAfter = new Date(Date.now() + 172800000).toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');

    const instances = [
      [1, 1, null, today, '10:00', 1, 'scheduled', 'Clear and sunny', 0, 'Regular morning departure'],
      [2, 7, null, today, '09:00', 2, 'in_progress', 'Clear, cold (-5°C)', 1, 'Good conditions for glacier hiking'],
      [3, 9, null, today, '20:00', 3, 'scheduled', 'Clear skies, no moon', 0, 'Perfect conditions for Northern Lights'],
      [4, 4, null, tomorrow, '14:00', 1, 'scheduled', 'Partly cloudy', 0, 'Afternoon departure to south coast'],
      [5, 11, null, tomorrow, '16:00', null, 'scheduled', 'Any weather', 0, 'Evening Blue Lagoon visit'],
      [6, 2, null, dayAfter, '11:00', 2, 'scheduled', 'Sunny', 0, 'Golden Circle continuation'],
      [7, 8, null, dayAfter, '13:00', 3, 'scheduled', 'Cold, stable', 0, 'Ice cave exploration']
    ];

    instances.forEach(instance => {
      try {
        db.prepare(`INSERT OR IGNORE INTO activity_instances (id, activity_id, booking_id, scheduled_date, scheduled_time, guide_id, status, weather_conditions, attendance_count, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(...instance);
      } catch (e) {
        console.log('Instance exists for activity:', instance[1]);
      }
    });

    res.json({ message: 'Activities data seeded successfully!' });
  } catch (error) {
    console.error("Error seeding activities data:", error);
    res.status(500).json({ error: "Failed to seed activities data" });
  }
};
