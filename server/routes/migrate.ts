import { RequestHandler } from "express";
import { queries } from "../db/database";

export const runMigrations: RequestHandler = (req, res) => {
  try {
    const database = queries.getDatabase();
    
    console.log('🔄 Running manual migrations...');
    
    // Check hotel_bookings table structure
    const hotelBookingsTableInfo = database.prepare("PRAGMA table_info(hotel_bookings)").all() as any[];
    const columnNames = hotelBookingsTableInfo.map(col => col.name);
    
    console.log('📋 Current hotel_bookings columns:', columnNames);
    
    let migrationsRun = 0;

    // Check if we have the old schema and need to recreate the table
    const hasOldSchema = columnNames.includes('booking_id') && !columnNames.includes('booking_reference');

    if (hasOldSchema) {
      console.log('🔄 Detected old schema, recreating hotel_bookings table...');

      // Backup existing data
      database.exec(`CREATE TABLE hotel_bookings_backup AS SELECT * FROM hotel_bookings;`);

      // Drop and recreate with new schema
      database.exec(`DROP TABLE hotel_bookings;`);

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
      `);

      // Migrate data from backup (what we can)
      database.exec(`
        INSERT INTO hotel_bookings (
          hotel_id, check_in_date, check_out_date, actual_check_in, actual_check_out,
          guests_count, rate_per_night, total_amount, status, special_requests,
          created_at, updated_at, group_name, guest_name, booking_reference
        )
        SELECT
          hotel_id, check_in_date, check_out_date, actual_check_in, actual_check_out,
          guests_count, rate_per_night, total_amount, status, special_requests,
          created_at, updated_at, group_name,
          COALESCE(group_name, 'Unknown Guest') as guest_name,
          'HB-' || id as booking_reference
        FROM hotel_bookings_backup;
      `);

      // Clean up backup
      database.exec(`DROP TABLE hotel_bookings_backup;`);

      console.log('✅ Table recreated with new schema');
      migrationsRun++;
    } else {
      // Regular column additions for newer schema
      if (!columnNames.includes('guest_name')) {
        console.log('Adding guest_name column to hotel_bookings table...');
        database.exec(`ALTER TABLE hotel_bookings ADD COLUMN guest_name VARCHAR(255) NOT NULL DEFAULT 'Unknown Guest';`);
        console.log('Guest_name column added successfully');
        migrationsRun++;
      }

      if (!columnNames.includes('group_name')) {
        console.log('Adding group_name column to hotel_bookings table...');
        database.exec(`ALTER TABLE hotel_bookings ADD COLUMN group_name VARCHAR(255);`);
        console.log('Group_name column added successfully');
        migrationsRun++;
      }

      if (!columnNames.includes('guest_id')) {
        console.log('Adding guest_id column to hotel_bookings table...');
        database.exec(`ALTER TABLE hotel_bookings ADD COLUMN guest_id INTEGER REFERENCES guests(id);`);
        console.log('Guest_id column added successfully');
        migrationsRun++;
      }

      if (!columnNames.includes('booking_reference')) {
        console.log('Adding booking_reference column to hotel_bookings table...');
        database.exec(`ALTER TABLE hotel_bookings ADD COLUMN booking_reference VARCHAR(50);`);
        database.exec(`UPDATE hotel_bookings SET booking_reference = 'HB-' || id WHERE booking_reference IS NULL;`);
        console.log('Booking_reference column added successfully');
        migrationsRun++;
      }
    }
    
    // Get final column list
    const finalColumns = database.prepare("PRAGMA table_info(hotel_bookings)").all() as any[];
    const finalColumnNames = finalColumns.map(col => col.name);
    
    res.json({
      success: true,
      message: `Migrations completed. ${migrationsRun} migrations run.`,
      before: columnNames,
      after: finalColumnNames,
      migrationsRun
    });
    
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Migration failed' 
    });
  }
};
