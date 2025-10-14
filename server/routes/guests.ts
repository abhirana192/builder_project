import { RequestHandler } from "express";
import { queries } from "../db/database";

export const getAllGuests: RequestHandler = (req, res) => {
  try {
    const guests = queries.getAllGuests().all();
    res.json(guests);
  } catch (error) {
    console.error("Error fetching guests:", error);
    res.status(500).json({ error: "Failed to fetch guests" });
  }
};

export const getGuestById: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const guest = queries.getGuestById().get(id);

    if (!guest) {
      return res.status(404).json({ error: "Guest not found" });
    }

    res.json(guest);
  } catch (error) {
    console.error("Error fetching guest:", error);
    res.status(500).json({ error: "Failed to fetch guest" });
  }
};

export const createGuest: RequestHandler = (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      passport_number,
      nationality,
      date_of_birth,
      dietary_restrictions,
      emergency_contact_name,
      emergency_contact_phone,
      notes,
      is_group_leader = false,
      group_size = 1,
      group_name
    } = req.body;

    const result = queries.createGuest().run(
      first_name,
      last_name,
      email,
      phone,
      passport_number,
      nationality,
      date_of_birth,
      dietary_restrictions,
      emergency_contact_name,
      emergency_contact_phone,
      notes,
      is_group_leader,
      group_size,
      group_name
    );

    const newGuest = queries.getGuestById().get(result.lastInsertRowid);
    res.status(201).json(newGuest);
  } catch (error) {
    console.error("Error creating guest:", error);
    res.status(500).json({ error: "Failed to create guest" });
  }
};

export const updateGuest: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      passport_number,
      nationality,
      date_of_birth,
      dietary_restrictions,
      emergency_contact_name,
      emergency_contact_phone,
      notes,
      is_group_leader = false,
      group_size = 1,
      group_name
    } = req.body;

    queries.updateGuest().run(
      first_name,
      last_name,
      email,
      phone,
      passport_number,
      nationality,
      date_of_birth,
      dietary_restrictions,
      emergency_contact_name,
      emergency_contact_phone,
      notes,
      is_group_leader,
      group_size,
      group_name,
      id
    );

    const updatedGuest = queries.getGuestById().get(id);
    res.json(updatedGuest);
  } catch (error) {
    console.error("Error updating guest:", error);
    res.status(500).json({ error: "Failed to update guest" });
  }
};

export const getGuestsWithGroups: RequestHandler = (req, res) => {
  try {
    const guests = queries.getGuestsWithGroups().all();
    res.json(guests);
  } catch (error) {
    console.error("Error fetching guests with groups:", error);
    res.status(500).json({ error: "Failed to fetch guests with group information" });
  }
};

export const debugGuestCounts: RequestHandler = (req, res) => {
  try {
    const allGuests = queries.getAllGuests().all();
    const guestsWithGroups = queries.getGuestsWithGroups().all();

    // Get all groups
    const allGroups = queries.getAllGroups().all();

    // Get all group members
    const allGroupMemberships = allGroups.map(group => {
      const members = queries.getGroupMembers().all(group.id);
      return {
        group_id: group.id,
        group_name: group.group_name,
        total_members: group.total_members,
        actual_members: members.length,
        members: members.map(m => ({
          guest_id: m.id,
          name: `${m.first_name} ${m.last_name}`,
          is_leader: m.is_leader
        }))
      };
    });

    const debug = {
      total_guests_in_guests_table: allGuests.length,
      total_guests_with_groups_query: guestsWithGroups.length,
      total_groups: allGroups.length,
      expected_total_members: allGroups.reduce((sum, g) => sum + (g.total_members || 0), 0),
      all_guests: allGuests.map(g => ({ id: g.id, name: `${g.first_name} ${g.last_name}`, group_id: g.group_id })),
      guests_with_groups: guestsWithGroups.map(g => ({
        id: g.id,
        name: `${g.first_name} ${g.last_name}`,
        group_name: g.group_name
      })),
      group_memberships: allGroupMemberships
    };

    res.json(debug);
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    res.status(500).json({ error: "Failed to debug guest counts" });
  }
};

export const cleanupOrphanedGuests: RequestHandler = (req, res) => {
  try {
    // Find guests that are not referenced in any bookings
    const orphanedGuests = queries.getDatabase().prepare(`
      SELECT g.id, g.first_name, g.last_name, g.email
      FROM guests g
      LEFT JOIN bookings b ON g.id = b.guest_id
      WHERE b.guest_id IS NULL
    `).all();

    // Delete orphaned guests
    let deletedCount = 0;
    for (const guest of orphanedGuests) {
      try {
        queries.getDatabase().prepare('DELETE FROM guests WHERE id = ?').run(guest.id);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete guest ${guest.id}:`, error);
      }
    }

    res.json({
      message: 'Cleanup completed',
      orphaned_guests_found: orphanedGuests.length,
      deleted_count: deletedCount,
      orphaned_guests: orphanedGuests
    });
  } catch (error) {
    console.error("Error in cleanup endpoint:", error);
    res.status(500).json({ error: "Failed to cleanup orphaned guests" });
  }
};

export const repairMissingGuests: RequestHandler = (req, res) => {
  try {
    const allGroups = queries.getAllGroups().all();
    const repairLog = [];

    allGroups.forEach(group => {
      const currentMembers = queries.getGroupMembers().all(group.id);
      const expectedMembers = group.total_members || 0;
      const actualMembers = currentMembers.length;

      if (actualMembers < expectedMembers) {
        const missingCount = expectedMembers - actualMembers;
        repairLog.push({
          group_id: group.id,
          group_name: group.group_name,
          expected: expectedMembers,
          actual: actualMembers,
          missing: missingCount,
          action: 'creating_placeholder_members'
        });

        // Create placeholder members for missing guests
        for (let i = 0; i < missingCount; i++) {
          const memberNumber = actualMembers + i + 1;
          const placeholderEmail = `${group.group_name.replace(/\s+/g, '').toLowerCase()}.member${memberNumber}@placeholder.com`;

          try {
            // Create placeholder guest
            const guestResult = queries.createGuest().run(
              `Member ${memberNumber}`, // first_name
              group.group_name, // last_name (use group name)
              placeholderEmail, // email
              null, // phone
              null, // passport_number
              null, // nationality
              null, // date_of_birth
              null, // dietary_restrictions
              null, // emergency_contact_name
              null, // emergency_contact_phone
              'Placeholder member - please update with actual details', // notes
              group.arrival_date, // arrival_date
              group.departure_date, // departure_date
              group.arrival_flight_number, // arrival_flight_number
              group.arrival_flight_time, // arrival_flight_time
              group.arrival_notes, // arrival_notes
              group.departure_flight_number, // departure_flight_number
              group.departure_flight_time, // departure_flight_time
              group.departure_notes, // departure_notes
              0, // is_group_leader
              1, // group_size
              null // group_name
            );

            // Add to group membership
            queries.addGroupMember().run(
              group.id,
              guestResult.lastInsertRowid,
              0 // not leader
            );

            repairLog[repairLog.length - 1].created_guest_id = guestResult.lastInsertRowid;

          } catch (error) {
            repairLog[repairLog.length - 1].error = error.message;
          }
        }
      } else {
        repairLog.push({
          group_id: group.id,
          group_name: group.group_name,
          expected: expectedMembers,
          actual: actualMembers,
          missing: 0,
          action: 'no_repair_needed'
        });
      }
    });

    res.json({
      message: 'Repair completed',
      repair_log: repairLog
    });

  } catch (error) {
    console.error("Error in repair endpoint:", error);
    res.status(500).json({ error: "Failed to repair missing guests" });
  }
};
