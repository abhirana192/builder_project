-- Groups table for managing tour groups
CREATE TABLE IF NOT EXISTS tour_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_name VARCHAR(255) NOT NULL,
    group_leader_id INTEGER,
    total_members INTEGER NOT NULL DEFAULT 1,
    group_type VARCHAR(50) DEFAULT 'family', -- family, corporate, friends, etc.
    arrival_date DATE,
    departure_date DATE,
    arrival_flight_number VARCHAR(20),
    arrival_flight_time VARCHAR(10),
    arrival_notes TEXT,
    departure_flight_number VARCHAR(20),
    departure_flight_time VARCHAR(10),
    departure_notes TEXT,
    traveling_together BOOLEAN DEFAULT TRUE,
    total_cost DECIMAL(10,2) DEFAULT 0.00,
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    deposit_amount DECIMAL(10,2) DEFAULT 0.00,
    special_requirements TEXT,
    group_notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_leader_id) REFERENCES guests(id)
);

-- Group members junction table
CREATE TABLE IF NOT EXISTS group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    guest_id INTEGER NOT NULL,
    is_leader BOOLEAN DEFAULT FALSE,
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES tour_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE,
    UNIQUE(group_id, guest_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_guest_id ON group_members(guest_id);
CREATE INDEX IF NOT EXISTS idx_tour_groups_status ON tour_groups(status);
CREATE INDEX IF NOT EXISTS idx_tour_groups_dates ON tour_groups(arrival_date, departure_date);
