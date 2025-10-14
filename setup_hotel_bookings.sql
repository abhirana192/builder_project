-- Simple hotel bookings table following Activities pattern
CREATE TABLE IF NOT EXISTS hotel_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    guest_name VARCHAR(255) NOT NULL,
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
    FOREIGN KEY (hotel_id) REFERENCES hotels(id)
);

-- Add some sample data if table is empty
INSERT OR IGNORE INTO hotel_bookings (
    booking_reference, guest_name, hotel_id, room_number, room_type,
    check_in_date, check_out_date, guests_count, rate_per_night, total_amount, status
) VALUES 
('HB-2024-001', 'Sarah Johnson', 1, '201', 'Superior Double', '2024-03-15', '2024-03-22', 2, 180.00, 1260.00, 'checked_in'),
('HB-2024-002', 'Lars Andersen', 2, '201', 'Family Room', '2024-03-25', '2024-03-26', 2, 200.00, 200.00, 'confirmed'),
('HB-2024-003', 'Maria Garcia', 3, '101', 'Classic Double', '2024-04-01', '2024-04-05', 2, 200.00, 800.00, 'confirmed');
