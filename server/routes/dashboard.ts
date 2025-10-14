import { RequestHandler } from "express";
import { queries } from "../db/database";

export const getDashboardStats: RequestHandler = (req, res) => {
  try {
    const stats = queries.getDashboardStats().get();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
};

export const getTodaysArrivals: RequestHandler = (req, res) => {
  try {
    const { date, startTime, endTime } = req.query as { date?: string; startTime?: string; endTime?: string };

    let sql = `
      SELECT gts.*, v.vehicle_number, v.vehicle_type, s.first_name || ' ' || s.last_name as driver_name
      FROM group_transport_schedules gts
      JOIN vehicles v ON gts.vehicle_id = v.id
      JOIN staff s ON gts.driver_id = s.id
      WHERE (LOWER(gts.transport_type) = 'airport_pickup' OR LOWER(gts.pickup_location) LIKE '%airport%')
    `;
    const params: any[] = [];

    if (date) {
      sql += " AND DATE(gts.pickup_time) = DATE(?)";
      params.push(date);
    } else {
      sql += " AND DATE(gts.pickup_time) = DATE('now')";
    }
    if (startTime && endTime) {
      sql += " AND TIME(gts.pickup_time) BETWEEN TIME(?) AND TIME(?)";
      params.push(startTime, endTime);
    }
    sql += " ORDER BY gts.pickup_time";

    const arrivals = queries.getDatabase().prepare(sql).all(...params) as any[];
    const detailedArrivals = arrivals.map(arrival => {
      if (arrival.groups_data) {
        try {
          const groups = JSON.parse(arrival.groups_data);
          const passengers = groups.flatMap((p: { id: number; type: string }) => {
            if (p.type === 'group') {
              const group = queries.getGroupById().get(p.id) as { group_name: string };
              const members = queries.getGroupMembers().all(p.id) as { first_name: string; last_name: string, id: number }[];
              if (members && members.length > 0) {
                return members.map(member => {
                  const name = `${member?.first_name || ''} ${member?.last_name || ''}`.trim() || 'Unknown Member';
                  return { id: member.id, type: 'member', name, groupName: group?.group_name || 'Unknown Group' };
                });
              } else {
                return [{ id: p.id, type: 'group', name: group?.group_name || 'Unknown Group' }];
              }
            } else if (p.type === 'member') {
              const member = queries.getMemberWithGroupInfo().get(p.id) as { first_name: string; last_name: string; group_name: string };
              const name = `${member?.first_name || ''} ${member?.last_name || ''}`.trim() || 'Unknown Member';
              return [{ id: p.id, type: 'member', name, groupName: member?.group_name || 'No Group' }];
            }
            return [];
          });
          return { ...arrival, passengers };
        } catch (e) {
          console.error('Error parsing groups_data:', arrival.groups_data, e);
          return { ...arrival, passengers: [] };
        }
      }
      return { ...arrival, passengers: [] };
    });
    res.json(detailedArrivals);
  } catch (error) {
    console.error("Error fetching today's arrivals:", error);
    res.status(500).json({ error: "Failed to fetch arrivals" });
  }
};

export const getTodaysDepartures: RequestHandler = (req, res) => {
  try {
    const { date, startTime, endTime } = req.query as { date?: string; startTime?: string; endTime?: string };

    let sql = `
      SELECT gts.*, v.vehicle_number, v.vehicle_type, s.first_name || ' ' || s.last_name as driver_name
      FROM group_transport_schedules gts
      JOIN vehicles v ON gts.vehicle_id = v.id
      JOIN staff s ON gts.driver_id = s.id
      WHERE (LOWER(gts.transport_type) = 'airport_dropoff' OR LOWER(gts.dropoff_location) LIKE '%airport%')
    `;
    const params: any[] = [];

    if (date) {
      sql += " AND DATE(gts.pickup_time) = DATE(?)";
      params.push(date);
    } else {
      sql += " AND DATE(gts.pickup_time) = DATE('now')";
    }
    if (startTime && endTime) {
      sql += " AND TIME(gts.pickup_time) BETWEEN TIME(?) AND TIME(?)";
      params.push(startTime, endTime);
    }
    sql += " ORDER BY gts.pickup_time";

    const departures = queries.getDatabase().prepare(sql).all(...params) as any[];
    const detailedDepartures = departures.map(departure => {
      if (departure.groups_data) {
        try {
          const groups = JSON.parse(departure.groups_data);
          const passengers = groups.flatMap((p: { id: number; type: string }) => {
            if (p.type === 'group') {
              const group = queries.getGroupById().get(p.id) as { group_name: string };
              const members = queries.getGroupMembers().all(p.id) as { first_name: string; last_name: string, id: number }[];
              if (members && members.length > 0) {
                return members.map(member => {
                  const name = `${member?.first_name || ''} ${member?.last_name || ''}`.trim() || 'Unknown Member';
                  return { id: member.id, type: 'member', name, groupName: group?.group_name || 'Unknown Group' };
                });
              } else {
                return [{ id: p.id, type: 'group', name: group?.group_name || 'Unknown Group' }];
              }
            } else if (p.type === 'member') {
              const member = queries.getMemberWithGroupInfo().get(p.id) as { first_name: string; last_name: string; group_name: string };
              const name = `${member?.first_name || ''} ${member?.last_name || ''}`.trim() || 'Unknown Member';
              return [{ id: p.id, type: 'member', name, groupName: member?.group_name || 'No Group' }];
            }
            return [];
          });
          return { ...departure, passengers };
        } catch (e) {
          console.error('Error parsing groups_data:', departure.groups_data, e);
          return { ...departure, passengers: [] };
        }
      }
      return { ...departure, passengers: [] };
    });
    res.json(detailedDepartures);
  } catch (error) {
    console.error("Error fetching today's departures:", error);
    res.status(500).json({ error: "Failed to fetch departures" });
  }
};

export const getActiveBookings: RequestHandler = (req, res) => {
  try {
    const activeBookings = queries.getBookingsByStatus().all('in_progress');
    res.json(activeBookings);
  } catch (error) {
    console.error("Error fetching active bookings:", error);
    res.status(500).json({ error: "Failed to fetch active bookings" });
  }
};
