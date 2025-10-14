import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'server', 'db', 'tourflow.db');

let db: Database.Database | null = null;

export let DATABASE_IS_READONLY = false;

function getDatabase() {
  if (!db) {
    try {
      db = new Database(DB_PATH);
      db.pragma('foreign_keys = ON');

      // Test write access by trying a simple operation
      try {
        db.prepare('SELECT 1').get();
        // Try a write operation to test if database is writable
        db.exec('CREATE TEMPORARY TABLE test_write (id INTEGER)');
        db.exec('DROP TABLE test_write');
      } catch (writeError: any) {
        if (writeError.code === 'SQLITE_READONLY' || writeError.code === 'SQLITE_READONLY_DBMOVED') {
          console.warn('Database is read-only, creating in-memory database as fallback');
          DATABASE_IS_READONLY = true;
          try { db.close(); } catch (e) {}
          db = new Database(':memory:');
          db.pragma('foreign_keys = ON');
        }
      }
    } catch (error) {
      console.error('Error opening database, falling back to in-memory:', error);
      db = new Database(':memory:');
      db.pragma('foreign_keys = ON');
    }
  }
  return db;
}

export function initializeDatabase() {
  try {
    const database = getDatabase();

    // Read and execute main schema
    const schema = readFileSync(join(process.cwd(), 'server', 'db', 'schema.sql'), 'utf8');
    database.exec(schema);

    // Read and execute groups schema
    const groupsSchema = readFileSync(join(process.cwd(), 'server', 'db', 'groups_schema.sql'), 'utf8');
    database.exec(groupsSchema);

    // Run migrations for existing databases
    runMigrations(database);

    // Check if database is already seeded
    const staffCount = database.prepare('SELECT COUNT(*) as count FROM staff').get() as { count: number };

    if (staffCount.count === 0) {
      // Read and execute seed data
      const seedData = readFileSync(join(process.cwd(), 'server', 'db', 'seed.sql'), 'utf8');
      database.exec(seedData);
      console.log('Database initialized with seed data');
    } else {
      console.log('Database already contains data');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

function runMigrations(database: Database.Database) {
  try {
    // Ensure bookings has invoice_number column
    const bookingsTableInfo = database.prepare("PRAGMA table_info(bookings)").all() as any[];
    const bookingsColumnNames = bookingsTableInfo.map(col => col.name);
    if (!bookingsColumnNames.includes('invoice_number')) {
      console.log('Adding invoice_number column to bookings table...');
      database.exec(`ALTER TABLE bookings ADD COLUMN invoice_number VARCHAR(4) UNIQUE`);
      console.log('invoice_number column added successfully');
    }

    // Check if group columns exist in guests table
    const guestsTableInfo = database.prepare("PRAGMA table_info(guests)").all() as any[];
    const guestsColumnNames = guestsTableInfo.map(col => col.name);

    // Add group columns if they don't exist
    if (!guestsColumnNames.includes('is_group_leader')) {
      console.log('Adding group columns to guests table...');
      database.exec(`
        ALTER TABLE guests ADD COLUMN is_group_leader BOOLEAN DEFAULT FALSE;
        ALTER TABLE guests ADD COLUMN group_size INTEGER DEFAULT 1;
        ALTER TABLE guests ADD COLUMN group_name VARCHAR(255);
      `);
      console.log('Group columns added successfully');
    }

    // Check if flight columns exist in tour_groups table
    const tourGroupsTableInfo = database.prepare("PRAGMA table_info(tour_groups)").all() as any[];
    const tourGroupsColumnNames = tourGroupsTableInfo.map(col => col.name);

    // Add flight columns if they don't exist
    if (!tourGroupsColumnNames.includes('arrival_flight_number')) {
      console.log('Adding flight information columns to tour_groups table...');
      database.exec(`
        ALTER TABLE tour_groups ADD COLUMN arrival_flight_number VARCHAR(20);
        ALTER TABLE tour_groups ADD COLUMN arrival_flight_time VARCHAR(10);
        ALTER TABLE tour_groups ADD COLUMN arrival_notes TEXT;
        ALTER TABLE tour_groups ADD COLUMN departure_flight_number VARCHAR(20);
        ALTER TABLE tour_groups ADD COLUMN departure_flight_time VARCHAR(10);
        ALTER TABLE tour_groups ADD COLUMN departure_notes TEXT;
      `);
      console.log('Flight information columns added successfully');
    }

    // Add financial columns if they don't exist
    if (!tourGroupsColumnNames.includes('total_cost')) {
      console.log('Adding financial columns to tour_groups table...');
      database.exec(`
        ALTER TABLE tour_groups ADD COLUMN total_cost DECIMAL(10,2) DEFAULT 0.00;
        ALTER TABLE tour_groups ADD COLUMN amount_paid DECIMAL(10,2) DEFAULT 0.00;
        ALTER TABLE tour_groups ADD COLUMN deposit_amount DECIMAL(10,2) DEFAULT 0.00;
      `);
      console.log('Financial columns added successfully');
    }

    // Add traveling_together column if it doesn't exist
    if (!tourGroupsColumnNames.includes('traveling_together')) {
      console.log('Adding traveling_together column to tour_groups table...');
      database.exec(`
        ALTER TABLE tour_groups ADD COLUMN traveling_together BOOLEAN DEFAULT TRUE;
      `);
      console.log('Traveling together column added successfully');
    }

    // Add individual flight columns to guests table if they don't exist
    const guestsFlightTableInfo = database.prepare("PRAGMA table_info(guests)").all() as any[];
    const guestsFlightColumnNames = guestsFlightTableInfo.map(col => col.name);

    if (!guestsFlightColumnNames.includes('arrival_flight_number')) {
      console.log('Adding individual flight information columns to guests table...');
      database.exec(`
        ALTER TABLE guests ADD COLUMN arrival_flight_number VARCHAR(20);
        ALTER TABLE guests ADD COLUMN arrival_flight_time VARCHAR(10);
        ALTER TABLE guests ADD COLUMN arrival_notes TEXT;
        ALTER TABLE guests ADD COLUMN departure_flight_number VARCHAR(20);
        ALTER TABLE guests ADD COLUMN departure_flight_time VARCHAR(10);
        ALTER TABLE guests ADD COLUMN departure_notes TEXT;
      `);
      console.log('Individual flight information columns added successfully');
    }

    // Add individual travel date columns to guests table if they don't exist
    if (!guestsFlightColumnNames.includes('arrival_date')) {
      console.log('Adding individual travel date columns to guests table...');
      database.exec(`
        ALTER TABLE guests ADD COLUMN arrival_date DATE;
        ALTER TABLE guests ADD COLUMN departure_date DATE;
      `);
      console.log('Individual travel date columns added successfully');
    }

    // Add tour date columns to tour_groups table if they don't exist
    if (!tourGroupsColumnNames.includes('tour_start_date')) {
      console.log('Adding tour date columns to tour_groups table...');
      database.exec(`
        ALTER TABLE tour_groups ADD COLUMN tour_start_date DATE;
        ALTER TABLE tour_groups ADD COLUMN tour_end_date DATE;
      `);
      console.log('Tour date columns added successfully');
    }

    // Add status column if it doesn't exist
    if (!tourGroupsColumnNames.includes('status')) {
      console.log('Adding status column to tour_groups table...');
      database.exec(`
        ALTER TABLE tour_groups ADD COLUMN status VARCHAR(20) DEFAULT 'active';
      `);
      console.log('Status column added successfully');
    }

    // Add refund tracking columns if they don't exist
    if (!tourGroupsColumnNames.includes('refund_amount')) {
      console.log('Adding refund tracking columns to tour_groups table...');
      database.exec(`
        ALTER TABLE tour_groups ADD COLUMN refund_amount DECIMAL(10,2) DEFAULT 0.00;
        ALTER TABLE tour_groups ADD COLUMN cancelled_at TIMESTAMP;
      `);
      console.log('Refund tracking columns added successfully');
    }

    // Add group_transport_schedules table if it doesn't exist
    const groupTransportTableExists = database.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='group_transport_schedules'"
    ).get();

    if (!groupTransportTableExists) {
      console.log('Creating group_transport_schedules table...');
      database.exec(`
        CREATE TABLE group_transport_schedules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          transport_type VARCHAR(50) NOT NULL CHECK (transport_type IN ('airport_pickup', 'airport_dropoff', 'activity', 'custom')),
          activity_name VARCHAR(255),
          vehicle_id INTEGER NOT NULL,
          driver_id INTEGER NOT NULL,
          pickup_location VARCHAR(255) NOT NULL,
          pickup_time TIMESTAMP NOT NULL,
          dropoff_location VARCHAR(255) NOT NULL,
          estimated_dropoff_time TIMESTAMP,
          passenger_count INTEGER NOT NULL DEFAULT 1,
          groups_data TEXT, -- JSON string of selected groups/passengers
          status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_transit', 'completed', 'cancelled')),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
          FOREIGN KEY (driver_id) REFERENCES staff(id)
        );
      `);
      console.log('Group transport schedules table created successfully');
    }

    // Add hotel_bookings table if it doesn't exist
    const hotelBookingsTableExists = database.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='hotel_bookings'"
    ).get();

    if (!hotelBookingsTableExists) {
      console.log('Creating hotel_bookings table...');
      database.exec(`
        CREATE TABLE hotel_bookings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          booking_reference VARCHAR(50) UNIQUE NOT NULL,
          guest_name VARCHAR(255) NOT NULL,
          guest_id INTEGER,
          group_name VARCHAR(255),
          hotel_id INTEGER NOT NULL,
          room_number VARCHAR(20),
          room_type VARCHAR(100) DEFAULT 'Standard',
          check_in_date DATE NOT NULL,
          check_out_date DATE NOT NULL,
          actual_check_in DATETIME,
          actual_check_out DATETIME,
          guests_count INTEGER DEFAULT 1,
          rate_per_night DECIMAL(10,2),
          total_amount DECIMAL(10,2),
          status VARCHAR(50) DEFAULT 'confirmed',
          special_requests TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (hotel_id) REFERENCES hotels(id),
          FOREIGN KEY (guest_id) REFERENCES guests(id)
        );

        INSERT OR IGNORE INTO hotel_bookings (
          booking_reference, guest_name, hotel_id, room_number, room_type,
          check_in_date, check_out_date, guests_count, rate_per_night, total_amount, status
        ) VALUES
        ('HB-2024-001', 'Sarah Johnson', 1, '201', 'Superior Double', '2024-03-15', '2024-03-22', 2, 180.00, 1260.00, 'checked_in'),
        ('HB-2024-002', 'Lars Andersen', 2, '201', 'Family Room', '2024-03-25', '2024-03-26', 2, 200.00, 200.00, 'confirmed'),
        ('HB-2024-003', 'Maria Garcia', 3, '101', 'Classic Double', '2024-04-01', '2024-04-05', 2, 200.00, 800.00, 'confirmed');
      `);
      console.log('Hotel bookings table created successfully');
    } else {
      // Add group_name and guest_id columns if they don't exist
      const hotelBookingsTableInfo = database.prepare("PRAGMA table_info(hotel_bookings)").all() as any[];
      const columnNames = hotelBookingsTableInfo.map(col => col.name);

      if (!columnNames.includes('guest_name')) {
        console.log('Adding guest_name column to hotel_bookings table...');
        database.exec(`ALTER TABLE hotel_bookings ADD COLUMN guest_name VARCHAR(255) NOT NULL DEFAULT 'Unknown Guest';`);
        console.log('Guest_name column added successfully');
      }

      if (!columnNames.includes('group_name')) {
        console.log('Adding group_name column to hotel_bookings table...');
        database.exec(`ALTER TABLE hotel_bookings ADD COLUMN group_name VARCHAR(255);`);
        console.log('Group_name column added successfully');
      }

      if (!columnNames.includes('guest_id')) {
        console.log('Adding guest_id column to hotel_bookings table...');
        database.exec(`ALTER TABLE hotel_bookings ADD COLUMN guest_id INTEGER REFERENCES guests(id);`);
        console.log('Guest_id column added successfully');
      }
    }

    // Clean up any leftover backup tables
    try {
      database.exec('DROP TABLE IF EXISTS guests_backup');
    } catch (e) {
      // Ignore errors when dropping backup table
    }
  } catch (error) {
    console.error('Error running migrations:', error);
  }
}

// Database helper functions
export const queries = {
  // Staff queries
  getAllStaff: () => getDatabase().prepare('SELECT * FROM staff WHERE is_active = 1 ORDER BY last_name, first_name'),
  getStaffById: () => getDatabase().prepare('SELECT * FROM staff WHERE id = ?'),
  getStaffByEmail: () => getDatabase().prepare('SELECT * FROM staff WHERE email = ?'),
  
  // Guest queries
  getAllGuests: () => getDatabase().prepare('SELECT * FROM guests ORDER BY last_name, first_name'),
  getGuestById: () => getDatabase().prepare('SELECT * FROM guests WHERE id = ?'),
  getMemberWithGroupInfo: () => getDatabase().prepare(`
    SELECT
      g.first_name,
      g.last_name,
      tg.group_name,
      tg.id as group_id
    FROM guests g
    LEFT JOIN group_members gm ON g.id = gm.guest_id
    LEFT JOIN tour_groups tg ON gm.group_id = tg.id
    WHERE g.id = ?
  `),
  getGuestsWithGroups: () => getDatabase().prepare(`
    SELECT DISTINCT
      g.id,
      g.first_name,
      g.last_name,
      g.email,
      g.phone,
      g.passport_number,
      g.nationality,
      g.date_of_birth,
      g.dietary_restrictions,
      g.emergency_contact_name,
      g.emergency_contact_phone,
      g.notes,
      g.arrival_date,
      g.departure_date,
      g.arrival_flight_number,
      g.arrival_flight_time,
      g.arrival_notes,
      g.departure_flight_number,
      g.departure_flight_time,
      g.departure_notes,
      g.created_at,
      tg.id as group_id,
      tg.group_name,
      tg.total_members as group_total_members,
      tg.traveling_together,
      gm.is_leader as is_group_leader
    FROM guests g
    LEFT JOIN group_members gm ON g.id = gm.guest_id
    LEFT JOIN tour_groups tg ON gm.group_id = tg.id
    ORDER BY g.last_name, g.first_name
  `),
  createGuest: () => getDatabase().prepare(`
    INSERT INTO guests (first_name, last_name, email, phone, passport_number, nationality, date_of_birth, dietary_restrictions, emergency_contact_name, emergency_contact_phone, notes, arrival_date, departure_date, arrival_flight_number, arrival_flight_time, arrival_notes, departure_flight_number, departure_flight_time, departure_notes, is_group_leader, group_size, group_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  updateGuest: () => getDatabase().prepare(`
    UPDATE guests SET first_name = ?, last_name = ?, email = ?, phone = ?, passport_number = ?, nationality = ?, date_of_birth = ?, dietary_restrictions = ?, emergency_contact_name = ?, emergency_contact_phone = ?, notes = ?, arrival_date = ?, departure_date = ?, arrival_flight_number = ?, arrival_flight_time = ?, arrival_notes = ?, departure_flight_number = ?, departure_flight_time = ?, departure_notes = ?, is_group_leader = ?, group_size = ?, group_name = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  
  // Booking queries
  getAllBookings: () => getDatabase().prepare(`
    SELECT b.*, b.invoice_number, g.first_name || ' ' || g.last_name as guest_name, tp.name as tour_name, s.first_name || ' ' || s.last_name as guide_name
    FROM bookings b
    JOIN guests g ON b.guest_id = g.id
    JOIN tour_packages tp ON b.tour_package_id = tp.id
    LEFT JOIN staff s ON b.assigned_guide_id = s.id
    ORDER BY b.start_date DESC
  `),
  getBookingById: () => getDatabase().prepare(`
    SELECT b.*, b.invoice_number, g.first_name || ' ' || g.last_name as guest_name, g.email as guest_email, tp.name as tour_name, s.first_name || ' ' || s.last_name as guide_name
    FROM bookings b
    JOIN guests g ON b.guest_id = g.id
    JOIN tour_packages tp ON b.tour_package_id = tp.id
    LEFT JOIN staff s ON b.assigned_guide_id = s.id
    WHERE b.id = ?
  `),
  getBookingsByStatus: () => getDatabase().prepare(`
    SELECT b.*, b.invoice_number, g.first_name || ' ' || g.last_name as guest_name, tp.name as tour_name
    FROM bookings b
    JOIN guests g ON b.guest_id = g.id
    JOIN tour_packages tp ON b.tour_package_id = tp.id
    WHERE b.status = ?
    ORDER BY b.start_date
  `),
  createBooking: () => getDatabase().prepare(`
    INSERT INTO bookings (
      booking_reference, guest_id, tour_package_id, number_of_guests, total_amount,
      booking_date, start_date, end_date, status, payment_status, special_requests,
      assigned_guide_id, invoice_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  updateBookingStatus: () => getDatabase().prepare('UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),
  
  // Fetch bookings for a given group (by members), including invoice numbers
  getBookingsForGroup: () => getDatabase().prepare(`
    SELECT b.*, b.invoice_number,
           g.first_name || ' ' || g.last_name as guest_name,
           tp.name as tour_name
    FROM bookings b
    JOIN guests g ON b.guest_id = g.id
    JOIN tour_packages tp ON b.tour_package_id = tp.id
    WHERE b.guest_id IN (
      SELECT gm.guest_id FROM group_members gm WHERE gm.group_id = ?
    )
    ORDER BY b.start_date DESC
  `),

  // Tour package queries
  getAllTourPackages: () => getDatabase().prepare('SELECT * FROM tour_packages WHERE is_active = 1 ORDER BY name'),
  getTourPackageById: () => getDatabase().prepare('SELECT * FROM tour_packages WHERE id = ?'),
  
  // Vehicle queries
  getAllVehicles: () => getDatabase().prepare('SELECT * FROM vehicles ORDER BY vehicle_number'),
  getVehicleById: () => getDatabase().prepare('SELECT * FROM vehicles WHERE id = ?'),
  getAvailableVehicles: () => getDatabase().prepare('SELECT * FROM vehicles WHERE status = "available" ORDER BY vehicle_number'),
  updateVehicleStatus: () => getDatabase().prepare('UPDATE vehicles SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),
  
  // Transport schedule queries (legacy)
  getTransportSchedules: () => getDatabase().prepare(`
    SELECT ts.*, v.vehicle_number, v.vehicle_type, s.first_name || ' ' || s.last_name as driver_name, b.booking_reference
    FROM transport_schedules ts
    JOIN vehicles v ON ts.vehicle_id = v.id
    JOIN staff s ON ts.driver_id = s.id
    JOIN bookings b ON ts.booking_id = b.id
    ORDER BY ts.pickup_time
  `),
  getTodaysTransport: () => getDatabase().prepare(`
    SELECT ts.*, v.vehicle_number, v.vehicle_type, s.first_name || ' ' || s.last_name as driver_name, b.booking_reference
    FROM transport_schedules ts
    JOIN vehicles v ON ts.vehicle_id = v.id
    JOIN staff s ON ts.driver_id = s.id
    JOIN bookings b ON ts.booking_id = b.id
    WHERE DATE(ts.pickup_time) = DATE('now')
    ORDER BY ts.pickup_time
  `),

  // Group transport schedule queries
  getGroupTransportSchedules: () => getDatabase().prepare(`
    SELECT gts.*, v.vehicle_number, v.vehicle_type, s.first_name || ' ' || s.last_name as driver_name
    FROM group_transport_schedules gts
    JOIN vehicles v ON gts.vehicle_id = v.id
    JOIN staff s ON gts.driver_id = s.id
    ORDER BY gts.pickup_time
  `),

  createGroupTransportSchedule: () => getDatabase().prepare(`
    INSERT INTO group_transport_schedules (
      transport_type, activity_name, vehicle_id, driver_id, pickup_location, pickup_time,
      dropoff_location, estimated_dropoff_time, passenger_count, groups_data, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  updateGroupTransportSchedule: () => getDatabase().prepare(`
    UPDATE group_transport_schedules
    SET transport_type = ?, activity_name = ?, vehicle_id = ?, driver_id = ?, pickup_location = ?,
        pickup_time = ?, dropoff_location = ?, estimated_dropoff_time = ?, passenger_count = ?,
        groups_data = ?, notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  updateGroupTransportScheduleStatus: () => getDatabase().prepare(`
    UPDATE group_transport_schedules
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  updateGroupTransportScheduleDropoffLocation: () => getDatabase().prepare(`
    UPDATE group_transport_schedules
    SET dropoff_location = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  updateGroupTransportSchedulePickupLocation: () => getDatabase().prepare(`
    UPDATE group_transport_schedules
    SET pickup_location = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  deleteGroupTransportSchedule: () => getDatabase().prepare('DELETE FROM group_transport_schedules WHERE id = ?'),

  // Fetch flight times for transport scheduling
  getGroupFlightTimes: () => getDatabase().prepare(`
    SELECT id, group_name, arrival_date, arrival_flight_time, departure_date, departure_flight_time
    FROM tour_groups
    WHERE id = ?
  `),

  getMemberFlightDetailsForTransport: () => getDatabase().prepare(`
    SELECT
      g.arrival_flight_time,
      g.departure_flight_time,
      tg.arrival_date,
      tg.departure_date
    FROM guests g
    JOIN group_members gm ON g.id = gm.guest_id
    JOIN tour_groups tg ON gm.group_id = tg.id
    WHERE g.id = ?
  `),

  getMemberFlightTimes: () => getDatabase().prepare(`
    SELECT gm.id, gm.first_name, gm.last_name, gm.arrival_flight_time, gm.departure_flight_time,
           tg.arrival_date, tg.departure_date
    FROM group_members gm
    JOIN tour_groups tg ON gm.group_id = tg.id
    WHERE gm.id = ?
  `),
  
  // Activity participants queries
  getParticipantsForActivityInstance: () => getDatabase().prepare(`
    SELECT
      ap.guest_id as id,
      g.first_name,
      g.last_name,
      tg.id as group_id,
      tg.group_name
    FROM activity_participants ap
    JOIN guests g ON g.id = ap.guest_id
    LEFT JOIN group_members gm ON gm.guest_id = g.id
    LEFT JOIN tour_groups tg ON tg.id = gm.group_id
    WHERE ap.activity_instance_id = ?
    ORDER BY g.last_name, g.first_name
  `),
  addParticipantToActivity: () => getDatabase().prepare(`
    INSERT OR IGNORE INTO activity_participants (activity_instance_id, guest_id)
    VALUES (?, ?)
  `),
  removeParticipantFromActivity: () => getDatabase().prepare(`
    DELETE FROM activity_participants WHERE activity_instance_id = ? AND guest_id = ?
  `),

  // Hotel queries
  getAllHotels: () => getDatabase().prepare('SELECT * FROM hotels ORDER BY name'),
  getHotelById: () => getDatabase().prepare('SELECT * FROM hotels WHERE id = ?'),
  getHotelRooms: () => getDatabase().prepare('SELECT * FROM hotel_rooms WHERE hotel_id = ? ORDER BY room_number'),
  createHotel: () => getDatabase().prepare(`
    INSERT INTO hotels (name, address, phone, email, star_rating, total_rooms, contact_person, special_rates, amenities, check_in_time, check_out_time, is_partner)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  updateHotel: () => getDatabase().prepare(`
    UPDATE hotels SET name = ?, address = ?, phone = ?, email = ?, star_rating = ?, total_rooms = ?, contact_person = ?, special_rates = ?, amenities = ?, check_in_time = ?, check_out_time = ?, is_partner = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  deleteHotel: () => getDatabase().prepare('DELETE FROM hotels WHERE id = ?'),
  deleteHotelBooking: () => getDatabase().prepare('DELETE FROM hotel_bookings WHERE id = ?'),

  // Hotel room queries
  createHotelRoom: () => getDatabase().prepare(`
    INSERT INTO hotel_rooms (hotel_id, room_number, room_type, capacity, rate_per_night, amenities, status)
    VALUES (?, ?, ?, ?, ?, ?, 'available')
  `),
  updateHotelRoom: () => getDatabase().prepare(`
    UPDATE hotel_rooms SET room_number = ?, room_type = ?, capacity = ?, rate_per_night = ?, amenities = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  deleteHotelRoom: () => getDatabase().prepare('DELETE FROM hotel_rooms WHERE id = ?'),
  updateRoomStatus: () => getDatabase().prepare('UPDATE hotel_rooms SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),
  
  // Equipment queries
  getAllEquipment: () => getDatabase().prepare('SELECT * FROM equipment ORDER BY category, name'),
  getEquipmentById: () => getDatabase().prepare('SELECT * FROM equipment WHERE id = ?'),
  getAvailableEquipment: () => getDatabase().prepare('SELECT * FROM equipment WHERE is_available = 1 ORDER BY category, name'),
  updateEquipmentStatus: () => getDatabase().prepare('UPDATE equipment SET is_available = ?, condition_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),
  
  // Group transport schedule queries
  getTodaysArrivals: () => getDatabase().prepare(`
    SELECT gts.*, v.vehicle_number, v.vehicle_type, s.first_name || ' ' || s.last_name as driver_name
    FROM group_transport_schedules gts
    JOIN vehicles v ON gts.vehicle_id = v.id
    JOIN staff s ON gts.driver_id = s.id
    WHERE DATE(gts.pickup_time) = DATE('now')
    AND (LOWER(gts.transport_type) = 'airport_pickup' OR LOWER(gts.pickup_location) LIKE '%airport%')
    ORDER BY gts.pickup_time
  `),
  getTodaysDepartures: () => getDatabase().prepare(`
    SELECT gts.*, v.vehicle_number, v.vehicle_type, s.first_name || ' ' || s.last_name as driver_name
    FROM group_transport_schedules gts
    JOIN vehicles v ON gts.vehicle_id = v.id
    JOIN staff s ON gts.driver_id = s.id
    WHERE DATE(gts.pickup_time) = DATE('now')
    AND (gts.transport_type = 'airport_dropoff' OR LOWER(gts.dropoff_location) LIKE '%airport%')
    ORDER BY gts.pickup_time
  `),
  
  // Notification queries
  getUnreadNotifications: () => getDatabase().prepare(`
    SELECT * FROM notifications 
    WHERE recipient_staff_id = ? AND is_read = 0 
    ORDER BY is_urgent DESC, created_at DESC
  `),
  markNotificationRead: () => getDatabase().prepare('UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ?'),
  
  // Dashboard statistics
  getDashboardStats: () => getDatabase().prepare(`
    SELECT
      (SELECT COUNT(*) FROM tour_groups) as total_groups,
      (SELECT COUNT(*) FROM tour_groups WHERE status = 'active') as active_groups,
      (SELECT SUM(total_members) FROM tour_groups) as total_members,
      (SELECT COUNT(*) FROM group_transport_schedules WHERE DATE(pickup_time) = DATE('now') AND (LOWER(transport_type) = 'airport_pickup' OR LOWER(pickup_location) LIKE '%airport%')) as todays_arrivals,
      (SELECT COUNT(*) FROM group_transport_schedules WHERE DATE(pickup_time) = DATE('now') AND (LOWER(transport_type) = 'airport_dropoff' OR LOWER(dropoff_location) LIKE '%airport%')) as todays_departures,
      (SELECT COUNT(*) FROM staff WHERE is_active = 1) as active_staff,
      (SELECT COUNT(*) FROM vehicles WHERE status = 'available') as available_vehicles,
      (SELECT COUNT(*) FROM hotel_bookings WHERE status = 'checked_in') as checked_in_guests,
      (SELECT COUNT(*) FROM transport_schedules WHERE status = 'in_transit') as in_transit
  `),

  // Group queries
  getAllGroups: () => getDatabase().prepare(`
    SELECT tg.*,
           g.first_name || ' ' || g.last_name as leader_name,
           g.email as leader_email,
           g.phone as leader_phone
    FROM tour_groups tg
    LEFT JOIN guests g ON tg.group_leader_id = g.id
    ORDER BY tg.created_at DESC
  `),

  getGroupById: () => getDatabase().prepare(`
    SELECT tg.*,
           g.first_name || ' ' || g.last_name as leader_name,
           g.email as leader_email
    FROM tour_groups tg
    LEFT JOIN guests g ON tg.group_leader_id = g.id
    WHERE tg.id = ?
  `),

  // Groups report by date range (overlap using tour or arrival/departure dates)
  getGroupsReportInRange: () => getDatabase().prepare(`
    SELECT
      tg.id,
      tg.group_name,
      tg.status,
      tg.total_members,
      tg.group_type,
      tg.tour_start_date,
      tg.tour_end_date,
      tg.arrival_date,
      tg.arrival_flight_number,
      tg.arrival_flight_time,
      tg.departure_date,
      tg.departure_flight_number,
      tg.departure_flight_time,
      tg.group_notes,
      (
        SELECT GROUP_CONCAT(gu.first_name || ' ' || gu.last_name, ', ')
        FROM group_members gm
        JOIN guests gu ON gm.guest_id = gu.id
        WHERE gm.group_id = tg.id
      ) AS member_names,
      g.first_name || ' ' || g.last_name AS leader_name,
      g.email AS leader_email,
      g.phone AS leader_phone
    FROM tour_groups tg
    LEFT JOIN guests g ON tg.group_leader_id = g.id
    WHERE DATE(COALESCE(tg.tour_start_date, tg.arrival_date)) <= DATE(?)
      AND DATE(COALESCE(tg.tour_end_date, tg.departure_date)) >= DATE(?)
      AND (? IS NULL OR tg.status = ?)
    ORDER BY COALESCE(tg.tour_start_date, tg.arrival_date) ASC, tg.group_name ASC
  `),

  createGroup: () => getDatabase().prepare(`
    INSERT INTO tour_groups (group_name, group_leader_id, total_members, group_type, tour_start_date, tour_end_date, arrival_date, departure_date, arrival_flight_number, arrival_flight_time, arrival_notes, departure_flight_number, departure_flight_time, departure_notes, traveling_together, total_cost, amount_paid, deposit_amount, special_requirements, group_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  updateGroup: () => getDatabase().prepare(`
    UPDATE tour_groups
    SET group_name = ?, group_type = ?, tour_start_date = ?, tour_end_date = ?, arrival_date = ?, departure_date = ?, arrival_flight_number = ?, arrival_flight_time = ?, arrival_notes = ?, departure_flight_number = ?, departure_flight_time = ?, departure_notes = ?, traveling_together = ?, total_cost = ?, amount_paid = ?, deposit_amount = ?, special_requirements = ?, group_notes = ?, status = ?, refund_amount = ?, cancelled_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  deleteGroup: () => getDatabase().prepare('DELETE FROM tour_groups WHERE id = ?'),

  getGroupMembers: () => getDatabase().prepare(`
    SELECT gm.*,
           g.id as id, g.first_name, g.last_name, g.email, g.phone, g.passport_number,
           g.nationality, g.date_of_birth, g.dietary_restrictions,
           g.emergency_contact_name, g.emergency_contact_phone, g.notes,
           g.arrival_date, g.departure_date,
           g.arrival_flight_number, g.arrival_flight_time, g.arrival_notes,
           g.departure_flight_number, g.departure_flight_time, g.departure_notes
    FROM group_members gm
    JOIN guests g ON gm.guest_id = g.id
    WHERE gm.group_id = ?
    ORDER BY gm.is_leader DESC, g.last_name, g.first_name
  `),

  addGroupMember: () => getDatabase().prepare(`
    INSERT INTO group_members (group_id, guest_id, is_leader)
    VALUES (?, ?, ?)
  `),

  removeGroupMember: () => getDatabase().prepare(`
    DELETE FROM group_members WHERE group_id = ? AND guest_id = ?
  `),

  getGroupMemberCount: () => getDatabase().prepare(`
    SELECT COUNT(*) as count FROM group_members WHERE group_id = ?
  `),

  updateGroupMemberCount: () => getDatabase().prepare(`
    UPDATE tour_groups SET total_members = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `),

  // Update pickup location
  updatePickupLocation: () => getDatabase().prepare(`
    UPDATE group_transport_schedules
    SET pickup_location = ?
    WHERE transport_type = ?
    AND pickup_time = ?
  `),

  // Get database reference for transactions
  getDatabase: () => getDatabase(),
};
