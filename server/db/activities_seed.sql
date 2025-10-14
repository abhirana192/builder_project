-- Insert sample tour packages
INSERT OR IGNORE INTO tour_packages (id, name, description, duration_days, price, is_active) VALUES
(1, 'Golden Circle Classic', 'Classic Golden Circle tour with Geysir, Gullfoss, and Thingvellir', 1, 12000, 1),
(2, 'South Coast Adventure', 'South coast waterfalls and black sand beaches', 1, 15000, 1),
(3, 'Glacier Hiking Experience', 'Ice climbing and glacier exploration', 1, 25000, 1),
(4, 'Northern Lights Hunt', 'Chase the Aurora Borealis away from city lights', 1, 8000, 1),
(5, 'Blue Lagoon & Reykjanes', 'Relaxing spa experience and peninsula exploration', 1, 18000, 1);

-- Insert sample activities
INSERT OR IGNORE INTO activities (id, tour_package_id, name, description, location, duration_hours, max_participants, equipment_required, difficulty_level, weather_dependent, is_active) VALUES
(1, 1, 'Geysir Visit', 'Witness the famous hot spring eruptions and learn about geothermal activity', 'Geysir Geothermal Area', 1.5, 19, NULL, 'easy', 0, 1),
(2, 1, 'Gullfoss Waterfall', 'Experience the power and beauty of the Golden Waterfall', 'Gullfoss Waterfall', 1.0, 19, NULL, 'easy', 0, 1),
(3, 1, 'Thingvellir National Park', 'Walk between tectonic plates in this UNESCO World Heritage site', 'Thingvellir National Park', 2.0, 19, NULL, 'easy', 0, 1),
(4, 2, 'Seljalandsfoss Waterfall', 'Walk behind the magnificent waterfall', 'Seljalandsfoss', 1.0, 15, 'Waterproof jacket', 'easy', 1, 1),
(5, 2, 'Skógafoss Waterfall', 'Climb the stairs for spectacular views', 'Skógafoss', 1.5, 15, NULL, 'moderate', 0, 1),
(6, 2, 'Reynisfjara Black Beach', 'Explore dramatic basalt columns and black sand', 'Reynisfjara Beach', 1.0, 15, NULL, 'easy', 1, 1),
(7, 3, 'Glacier Hike', 'Guided walk on glacier with crampons and safety equipment', 'Sólheimajökull Glacier', 3.0, 8, 'Crampons, helmets, ice axes', 'challenging', 1, 1),
(8, 3, 'Ice Cave Exploration', 'Explore natural ice caves formed in glacier', 'Vatnajökull Glacier', 2.5, 6, 'Helmets, headlamps, crampons', 'challenging', 1, 1),
(9, 4, 'Northern Lights Search', 'Hunt for Aurora Borealis away from city lights', 'Various dark locations', 4.0, 15, 'Warm clothing', 'easy', 1, 1),
(10, 4, 'Photography Workshop', 'Learn to photograph the Northern Lights', 'Dark sky locations', 3.0, 8, 'Camera, tripod', 'easy', 1, 1),
(11, 5, 'Blue Lagoon Experience', 'Relax in the geothermal spa waters', 'Blue Lagoon', 2.0, 20, NULL, 'easy', 0, 1),
(12, 5, 'Reykjanes Peninsula Tour', 'Explore volcanic landscapes and geothermal areas', 'Reykjanes Peninsula', 3.0, 15, NULL, 'easy', 0, 1);

-- Insert sample activity instances for today and upcoming days
INSERT OR IGNORE INTO activity_instances (id, activity_id, booking_id, scheduled_date, scheduled_time, guide_id, status, weather_conditions, attendance_count, notes) VALUES
(1, 1, NULL, date('now'), '10:00', 1, 'scheduled', 'Clear and sunny', 0, 'Regular morning departure'),
(2, 7, NULL, date('now'), '09:00', 2, 'in_progress', 'Clear, cold (-5°C)', 1, 'Good conditions for glacier hiking'),
(3, 9, NULL, date('now'), '20:00', 3, 'scheduled', 'Clear skies, no moon', 0, 'Perfect conditions for Northern Lights'),
(4, 4, NULL, date('now', '+1 day'), '14:00', 1, 'scheduled', 'Partly cloudy', 0, 'Afternoon departure to south coast'),
(5, 11, NULL, date('now', '+1 day'), '16:00', NULL, 'scheduled', 'Any weather', 0, 'Evening Blue Lagoon visit'),
(6, 2, NULL, date('now', '+2 days'), '11:00', 2, 'scheduled', 'Sunny', 0, 'Golden Circle continuation'),
(7, 8, NULL, date('now', '+2 days'), '13:00', 3, 'scheduled', 'Cold, stable', 0, 'Ice cave exploration');
