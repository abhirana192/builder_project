-- Seed data for Tour Company Management System

-- Insert staff members
INSERT INTO staff (email, password_hash, first_name, last_name, role, phone, hire_date) VALUES
('admin@jiguangtour.com', '$2b$10$rGJZw7QrKsLRUEHHh0UMjOK1uV3XnR8C0LfWBKqHaWFhOhJzJ8gFu', 'Admin', 'User', 'admin', '+354-555-0001', '2023-01-01'),
('erik.hansen@jiguangtour.com', '$2b$10$rGJZw7QrKsLRUEHHh0UMjOK1uV3XnR8C0LfWBKqHaWFhOhJzJ8gFu', 'Erik', 'Hansen', 'guide', '+354-555-0002', '2023-02-01'),
('anna.bjornsson@jiguangtour.com', '$2b$10$rGJZw7QrKsLRUEHHh0UMjOK1uV3XnR8C0LfWBKqHaWFhOhJzJ8gFu', 'Anna', 'Bjornsson', 'guide', '+354-555-0003', '2023-02-15'),
('magnus.thor@jiguangtour.com', '$2b$10$rGJZw7QrKsLRUEHHh0UMjOK1uV3XnR8C0LfWBKqHaWFhOhJzJ8gFu', 'Magnus', 'Thor', 'guide', '+354-555-0004', '2023-03-01'),
('sigrid.olsen@jiguangtour.com', '$2b$10$rGJZw7QrKsLRUEHHh0UMjOK1uV3XnR8C0LfWBKqHaWFhOhJzJ8gFu', 'Sigrid', 'Olsen', 'guide', '+354-555-0005', '2023-03-15'),
('bjorn.eriksson@jiguangtour.com', '$2b$10$rGJZw7QrKsLRUEHHh0UMjOK1uV3XnR8C0LfWBKqHaWFhOhJzJ8gFu', 'Bjorn', 'Eriksson', 'driver', '+354-555-0006', '2023-04-01'),
('helga.nordahl@jiguangtour.com', '$2b$10$rGJZw7QrKsLRUEHHh0UMjOK1uV3XnR8C0LfWBKqHaWFhOhJzJ8gFu', 'Helga', 'Nordahl', 'driver', '+354-555-0007', '2023-04-15'),
('manager@jiguangtour.com', '$2b$10$rGJZw7QrKsLRUEHHh0UMjOK1uV3XnR8C0LfWBKqHaWFhOhJzJ8gFu', 'Tour', 'Manager', 'manager', '+354-555-0008', '2023-01-15');

-- Insert tour packages
INSERT INTO tour_packages (name, description, duration_days, max_capacity, price_per_person, difficulty_level) VALUES
('Golden Circle Classic', 'Experience Iceland''s most famous attractions including Geysir, Gullfoss waterfall, and Thingvellir National Park', 1, 19, 89.00, 'easy'),
('Northern Lights Hunt', 'Chase the magical Aurora Borealis in the Icelandic wilderness', 1, 15, 125.00, 'easy'),
('South Coast Adventure', 'Explore dramatic waterfalls, black sand beaches, and glacier lagoons', 2, 16, 299.00, 'moderate'),
('Ring Road Explorer', 'Complete circumnavigation of Iceland with all major highlights', 7, 12, 1499.00, 'moderate'),
('Westfjords Wilderness', 'Remote fjords, bird cliffs, and untouched nature', 5, 8, 899.00, 'challenging'),
('Blue Lagoon Express', 'Relaxing geothermal spa experience with transport', 1, 25, 65.00, 'easy'),
('Glacier Hiking Experience', 'Guided glacier walk with professional equipment', 1, 8, 179.00, 'challenging'),
('Highland Adventure', 'Off-road exploration of Iceland''s interior highlands', 3, 6, 649.00, 'expert');

-- Insert guests
INSERT INTO guests (first_name, last_name, email, phone, passport_number, nationality, date_of_birth) VALUES
('Sarah', 'Johnson', 'sarah.johnson@email.com', '+1-555-0101', 'US1234567', 'American', '1985-06-15'),
('Michael', 'Chen', 'michael.chen@email.com', '+44-20-7946-0958', 'GB9876543', 'British', '1990-03-22'),
('Emma', 'Wilson', 'emma.wilson@email.com', '+1-555-0102', 'US2345678', 'American', '1988-11-08'),
('Lars', 'Andersen', 'lars.andersen@email.com', '+45-12-34-56-78', 'DK5432109', 'Danish', '1975-09-30'),
('Sophie', 'Dubois', 'sophie.dubois@email.com', '+33-1-42-86-83-92', 'FR8765432', 'French', '1992-12-03'),
('Hans', 'Mueller', 'hans.mueller@email.com', '+49-30-12345678', 'DE3456789', 'German', '1980-07-18'),
('Maria', 'Garcia', 'maria.garcia@email.com', '+34-91-123-4567', 'ES6789012', 'Spanish', '1987-04-25'),
('Yuki', 'Tanaka', 'yuki.tanaka@email.com', '+81-3-1234-5678', 'JP1357924', 'Japanese', '1995-01-12');

-- Insert bookings
INSERT INTO bookings (booking_reference, guest_id, tour_package_id, number_of_guests, total_amount, booking_date, start_date, end_date, status, payment_status, assigned_guide_id) VALUES
('TF-2024-001', 1, 4, 2, 2998.00, '2024-01-15', '2024-03-15', '2024-03-22', 'in_progress', 'paid', 2),
('TF-2024-002', 2, 1, 1, 89.00, '2024-01-20', '2024-03-10', '2024-03-10', 'completed', 'paid', 3),
('TF-2024-003', 3, 2, 1, 125.00, '2024-02-01', '2024-03-20', '2024-03-20', 'confirmed', 'paid', 4),
('TF-2024-004', 4, 3, 2, 598.00, '2024-02-10', '2024-03-25', '2024-03-26', 'confirmed', 'paid', 2),
('TF-2024-005', 5, 6, 1, 65.00, '2024-02-15', '2024-03-12', '2024-03-12', 'completed', 'paid', 5),
('TF-2024-006', 6, 7, 1, 179.00, '2024-02-20', '2024-03-18', '2024-03-18', 'confirmed', 'paid', 3),
('TF-2024-007', 7, 5, 2, 1798.00, '2024-02-25', '2024-04-01', '2024-04-05', 'confirmed', 'partial', 2),
('TF-2024-008', 8, 1, 1, 89.00, '2024-03-01', '2024-03-22', '2024-03-22', 'confirmed', 'paid', 4);

-- Insert vehicles
INSERT INTO vehicles (vehicle_number, vehicle_type, make, model, year, capacity, license_plate, last_maintenance, next_maintenance, status) VALUES
('BUS-001', 'Tour Bus', 'Mercedes', 'Sprinter', 2020, 19, 'TF-001', '2024-02-01', '2024-05-01', 'available'),
('BUS-002', 'Tour Bus', 'Mercedes', 'Sprinter', 2021, 19, 'TF-002', '2024-02-15', '2024-05-15', 'available'),
('VAN-001', 'Mini Bus', 'Ford', 'Transit', 2019, 12, 'TF-003', '2024-01-20', '2024-04-20', 'available'),
('VAN-002', 'Mini Bus', 'Ford', 'Transit', 2020, 12, 'TF-004', '2024-02-10', '2024-05-10', 'maintenance'),
('SUV-001', 'Super Jeep', 'Toyota', 'Hilux Arctic', 2022, 6, 'TF-005', '2024-02-20', '2024-05-20', 'available'),
('SUV-002', 'Super Jeep', 'Isuzu', 'D-Max Arctic', 2021, 6, 'TF-006', '2024-01-30', '2024-04-30', 'available'),
('CAR-001', 'Sedan', 'Toyota', 'Corolla', 2020, 4, 'TF-007', '2024-02-05', '2024-05-05', 'available'),
('CAR-002', 'SUV', 'Subaru', 'Outback', 2021, 5, 'TF-008', '2024-02-25', '2024-05-25', 'available');

-- Insert hotels
INSERT INTO hotels (name, address, phone, email, star_rating, total_rooms, is_partner) VALUES
('Hotel Reykjavik Grand', 'Sigtun 38, 105 Reykjavik', '+354-514-8000', 'info@reykjavikgrand.is', 4, 312, true),
('Fosshotel Baron', 'Barónsstígur 2-4, 101 Reykjavik', '+354-562-3204', 'baron@fosshotel.is', 3, 126, true),
('Hotel Borg', 'Pósthússtræti 11, 101 Reykjavik', '+354-551-1440', 'hotelborg@keahotels.is', 4, 99, true),
('Icelandair Hotel Natura', 'Nauthólsvegur 52, 102 Reykjavik', '+354-444-4500', 'natura@icelandairhotels.is', 4, 220, true),
('Hotel Cabin', 'Borgartún 32, 105 Reykjavik', '+354-511-6030', 'cabin@hotelcabin.is', 3, 90, false);

-- Insert hotel rooms
INSERT INTO hotel_rooms (hotel_id, room_number, room_type, capacity, rate_per_night) VALUES
(1, '101', 'Standard Double', 2, 150.00),
(1, '102', 'Standard Double', 2, 150.00),
(1, '201', 'Superior Double', 2, 180.00),
(1, '301', 'Suite', 4, 350.00),
(2, '101', 'Standard Twin', 2, 120.00),
(2, '102', 'Standard Twin', 2, 120.00),
(2, '201', 'Family Room', 4, 200.00),
(3, '101', 'Classic Double', 2, 200.00),
(3, '201', 'Deluxe Double', 2, 250.00);

-- Insert activities
INSERT INTO activities (tour_package_id, name, description, location, duration_hours, max_participants, difficulty_level) VALUES
(1, 'Geysir Visit', 'Witness the famous hot spring eruptions', 'Geysir Geothermal Area', 1.5, 19, 'easy'),
(1, 'Gullfoss Waterfall', 'Marvel at the Golden Falls', 'Gullfoss', 1.0, 19, 'easy'),
(1, 'Thingvellir National Park', 'UNESCO World Heritage site and continental drift', 'Thingvellir', 2.0, 19, 'easy'),
(2, 'Northern Lights Search', 'Hunt for Aurora Borealis away from city lights', 'Various dark locations', 4.0, 15, 'easy'),
(3, 'Seljalandsfoss Walk', 'Walk behind the famous waterfall', 'Seljalandsfoss', 1.0, 16, 'moderate'),
(3, 'Reynisfjara Black Beach', 'Explore dramatic volcanic black sand beach', 'Reynisfjara', 1.5, 16, 'moderate'),
(7, 'Glacier Safety Briefing', 'Essential safety training for glacier hiking', 'Base camp', 0.5, 8, 'challenging'),
(7, 'Glacier Hike', 'Guided walk on glacier with crampons', 'Sólheimajökull Glacier', 3.0, 8, 'challenging');

-- Insert equipment
INSERT INTO equipment (name, category, description, serial_number, condition_status, location) VALUES
('Crampons Set 1', 'Safety', 'Professional glacier walking spikes', 'CR-001', 'excellent', 'Equipment Room A'),
('Crampons Set 2', 'Safety', 'Professional glacier walking spikes', 'CR-002', 'good', 'Equipment Room A'),
('Safety Helmet 1', 'Safety', 'Climbing helmet for glacier tours', 'SH-001', 'excellent', 'Equipment Room A'),
('Safety Helmet 2', 'Safety', 'Climbing helmet for glacier tours', 'SH-002', 'good', 'Equipment Room A'),
('Ice Axe 1', 'Safety', 'Professional ice climbing axe', 'IA-001', 'excellent', 'Equipment Room A'),
('Radio Set 1', 'Communication', 'Two-way radio for guides', 'RS-001', 'good', 'Office'),
('First Aid Kit Bus 1', 'Medical', 'Comprehensive first aid kit for tours', 'FA-001', 'good', 'BUS-001'),
('Binoculars 1', 'Observation', 'High-quality binoculars for wildlife watching', 'BN-001', 'excellent', 'Equipment Room B');

-- Insert some flight schedules
INSERT INTO flight_schedules (booking_id, flight_type, flight_number, airline, scheduled_time, status, assigned_driver_id) VALUES
(3, 'arrival', 'TF 421', 'Icelandair', '2024-03-20 09:30:00', 'scheduled', 6),
(4, 'arrival', 'BA 893', 'British Airways', '2024-03-25 11:15:00', 'scheduled', 7),
(6, 'arrival', 'LH 456', 'Lufthansa', '2024-03-18 14:20:00', 'scheduled', 6),
(8, 'arrival', 'SK 127', 'SAS', '2024-03-22 16:45:00', 'scheduled', 7);

-- Insert notifications
INSERT INTO notifications (recipient_staff_id, title, message, type, is_urgent) VALUES
(1, 'Vehicle Maintenance Due', 'VAN-002 requires maintenance check before next assignment', 'maintenance', false),
(2, 'Weather Alert', 'Strong winds expected tomorrow - review outdoor activities', 'weather', false),
(1, 'Staff Absence', 'Guide Anna Bjornsson called in sick for tomorrow', 'staffing', true),
(8, 'New Booking', 'New booking TF-2024-009 requires guide assignment', 'booking', false);

-- Insert sample tour groups with flight and financial information
INSERT INTO tour_groups (group_name, group_leader_id, total_members, group_type, arrival_date, departure_date, arrival_flight_number, arrival_flight_time, arrival_notes, departure_flight_number, departure_flight_time, departure_notes, total_cost, amount_paid, deposit_amount, special_requirements, group_notes, status) VALUES
('Johnson Family Adventure', 1, 4, 'family', '2024-03-20', '2024-03-27', 'TF421', '09:30', 'Terminal 1, Gate 5', 'TF422', '15:45', 'Check-in opens 2 hours early', 4500.00, 3000.00, 1000.00, 'Vegetarian meals, wheelchair access', 'Anniversary celebration during stay', 'active'),
('Corporate Retreat 2024', 3, 8, 'corporate', '2024-03-25', '2024-03-29', 'BA893', '11:15', 'Heathrow Terminal 5', 'BA894', '17:20', 'Business class departure', 12000.00, 12000.00, 3000.00, 'Team building activities required', 'Budget approval needed for extras', 'active'),
('Friends Golden Circle Tour', 5, 6, 'friends', '2024-03-18', '2024-03-22', 'LH456', '14:20', 'Frankfurt connection', 'LH457', '10:30', 'Early morning departure', 3600.00, 3600.00, 800.00, 'Photography equipment transport', 'University reunion group', 'completed');

-- Insert group members for each tour group
INSERT INTO group_members (group_id, guest_id, is_leader) VALUES
-- Johnson Family Adventure (Group 1)
(1, 1, true),   -- John is the leader
(1, 2, false),  -- Jane
(1, 3, false),  -- Additional family member
(1, 4, false),  -- Additional family member

-- Corporate Retreat 2024 (Group 2)
(2, 3, true),   -- Peter is the leader
(2, 4, false),  -- Lisa
(2, 5, false),  -- Ahmed
(2, 6, false),  -- Additional member
(2, 7, false),  -- Additional member
(2, 8, false),  -- Additional member

-- Friends Golden Circle Tour (Group 3)
(3, 5, true),   -- Ahmed is the leader
(3, 6, false),  -- Additional friend
(3, 7, false),  -- Additional friend
(3, 8, false);  -- Additional friend

-- Update some timestamps to make data more realistic
UPDATE bookings SET created_at = datetime('now', '-' || (id * 5) || ' days') WHERE id <= 8;
UPDATE guests SET created_at = datetime('now', '-' || (id * 10) || ' days') WHERE id <= 8;
UPDATE staff SET last_login = datetime('now', '-' || (id * 2) || ' hours') WHERE role != 'admin';
UPDATE staff SET last_login = datetime('now', '-30 minutes') WHERE role = 'admin';
UPDATE tour_groups SET created_at = datetime('now', '-' || (id * 3) || ' days') WHERE id <= 3;
