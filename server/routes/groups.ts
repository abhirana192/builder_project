import { RequestHandler } from "express";
import { queries } from "../db/database";
import { createAutoTransportForGroup } from "./transport_scheduler";

// Simple auto-scheduling using the new clean system
const autoScheduleTransport = async (groupId: number) => {
  await createAutoTransportForGroup(groupId);
};

// OLD COMPLEX SYSTEM - REMOVED
const autoScheduleTransportOLD = async (
  groupId: number,
  group: any,
  members: any[],
) => {
  try {
    console.log("\n\n==============================================");
    console.log("AUTO-SCHEDULING TRANSPORT STARTED");
    console.log("==============================================");
    console.log("Group ID:", groupId);
    console.log("Group Name:", group.group_name);
    console.log("EXACT GROUP DATA RECEIVED:");
    console.log("- ID:", JSON.stringify(group.id));
    console.log(
      "- Traveling Together:",
      JSON.stringify(group.traveling_together),
    );
    console.log("- ARRIVAL DATE:", JSON.stringify(group.arrival_date));
    console.log(
      "- ARRIVAL FLIGHT TIME:",
      JSON.stringify(group.arrival_flight_time),
    );
    console.log("- DEPARTURE DATE:", JSON.stringify(group.departure_date));
    console.log(
      "- DEPARTURE FLIGHT TIME:",
      JSON.stringify(group.departure_flight_time),
    );
    console.log("- Total Members:", JSON.stringify(group.total_members));
    console.log("- All Group Keys:", Object.keys(group));
    console.log("==============================================");

    // Get available vehicles and drivers
    const allVehicles = queries.getAllVehicles().all();
    const vehicles = allVehicles.filter(
      (vehicle: any) => vehicle.status === "available",
    );
    const drivers = queries
      .getAllStaff()
      .all()
      .filter((staff: any) => staff.role === "driver" && staff.is_active);

    console.log("Available resources:", {
      vehicles: vehicles.length,
      drivers: drivers.length,
    });

    if (vehicles.length === 0) {
      console.warn("❌ No available vehicles for auto-scheduling");
      return;
    }

    if (drivers.length === 0) {
      console.warn("❌ No available drivers for auto-scheduling");
      return;
    }

    if (group.traveling_together) {
      console.log("👥 Group traveling together - creating group transport");
      await createTransportForGroup(group, members, vehicles, drivers);
    } else {
      console.log(
        "👤 Group traveling separately - creating individual transports",
      );
      await createTransportForSeparateMembers(
        group,
        members,
        vehicles,
        drivers,
      );
    }

    console.log("\n==============================================");
    console.log("AUTO-SCHEDULING TRANSPORT COMPLETED");
    console.log("==============================================\n");
  } catch (error) {
    console.error("\n==============================================");
    console.error("AUTO-SCHEDULING TRANSPORT FAILED");
    console.error("Error:", error);
    console.error("Stack:", error.stack);
    console.error("==============================================\n");
  }
};

// Create transport for group traveling together
const createTransportForGroup = async (
  group: any,
  members: any[],
  vehicles: any[],
  drivers: any[],
) => {
  console.log(
    "Creating transport for group traveling together:",
    group.group_name,
  );

  // Use the group data that was passed in (already has the correct flight times)
  console.log("🔄 Using passed group data for transport scheduling:", {
    id: group.id,
    group_name: group.group_name,
    arrival_date: group.arrival_date,
    arrival_flight_time: group.arrival_flight_time,
    departure_date: group.departure_date,
    departure_flight_time: group.departure_flight_time,
  });

  // Log exact data types and values
  console.log(
    "🔍 TYPE CHECK - Arrival time type:",
    typeof group.arrival_flight_time,
    "Value:",
    JSON.stringify(group.arrival_flight_time),
  );
  console.log(
    "🔍 TYPE CHECK - Departure time type:",
    typeof group.departure_flight_time,
    "Value:",
    JSON.stringify(group.departure_flight_time),
  );

  // Create pickup transport if arrival details exist
  if (group.arrival_date && group.arrival_flight_time) {
    console.log("\n>>> CREATING ARRIVAL PICKUP TRANSPORT <<<");
    console.log("Raw arrival_date:", JSON.stringify(group.arrival_date));
    console.log(
      "Raw arrival_flight_time:",
      JSON.stringify(group.arrival_flight_time),
    );

    // SIMPLE APPROACH: Just use the exact flight time without complex processing
    let flightDateTime;

    // Try different approaches to construct the datetime
    if (group.arrival_date.includes("T")) {
      // If date already has time component, replace it with flight time
      const dateOnly = group.arrival_date.split("T")[0];
      const timeWithSeconds =
        group.arrival_flight_time.includes(":") &&
        group.arrival_flight_time.split(":").length === 2
          ? `${group.arrival_flight_time}:00`
          : group.arrival_flight_time;
      flightDateTime = `${dateOnly}T${timeWithSeconds}`;
    } else {
      // Simple date format
      const timeWithSeconds =
        group.arrival_flight_time.includes(":") &&
        group.arrival_flight_time.split(":").length === 2
          ? `${group.arrival_flight_time}:00`
          : group.arrival_flight_time;
      flightDateTime = `${group.arrival_date}T${timeWithSeconds}`;
    }

    console.log(
      "Constructed flight datetime string:",
      JSON.stringify(flightDateTime),
    );

    const pickupTime = new Date(flightDateTime);

    console.log(">>> ARRIVAL TRANSPORT TIME RESULT <<<");
    console.log("Date object created:", pickupTime.toString());
    console.log(
      "ISO string to store:",
      JSON.stringify(pickupTime.toISOString()),
    );
    console.log("Display format:", pickupTime.toLocaleString());

    const pickupSchedule = {
      transport_type: "airport_pickup",
      vehicle_id: vehicles[0].id,
      driver_id: drivers[0].id,
      pickup_location: "Yellowknife Airport",
      pickup_time: pickupTime.toISOString(),
      dropoff_location: "Hotel/Accommodation",
      estimated_dropoff_time: new Date(
        pickupTime.getTime() + 60 * 60 * 1000,
      ).toISOString(),
      passenger_count: group.total_members,
      groups_data: JSON.stringify([
        {
          type: "group",
          id: group.id,
          name: group.group_name,
          memberCount: group.total_members,
        },
      ]),
      notes: `Auto-scheduled airport pickup for ${group.group_name} - ${group.total_members} passenger(s)`,
    };

    console.log("Creating pickup schedule:", pickupSchedule);
    await createTransportSchedule(pickupSchedule);
  } else {
    console.log("⚠️ No arrival details for pickup transport");
  }

  // Create dropoff transport if departure details exist
  if (group.departure_date && group.departure_flight_time) {
    console.log(
      "📅 Creating dropoff transport for departure:",
      group.departure_date,
      group.departure_flight_time,
    );
    // Ensure time has seconds if not present
    const departureTimeFormatted =
      group.departure_flight_time.includes(":") &&
      group.departure_flight_time.split(":").length === 2
        ? `${group.departure_flight_time}:00`
        : group.departure_flight_time;
    const departureTimeString = `${group.departure_date.split("T")[0]}T${departureTimeFormatted}`;

    // Force local timezone interpretation for departure time
    const [datePartDep, timePartDep] = departureTimeString.split("T");
    const [yearDep, monthDep, dayDep] = datePartDep.split("-");
    const [hourDep, minuteDep, secondDep] = timePartDep.split(":");

    const dropoffTime = new Date(
      parseInt(yearDep),
      parseInt(monthDep) - 1, // Month is 0-indexed
      parseInt(dayDep),
      parseInt(hourDep),
      parseInt(minuteDep),
      parseInt(secondDep || "0"),
    );

    // Use original departure flight time
    const pickupTime = new Date(
      parseInt(yearDep),
      parseInt(monthDep) - 1,
      parseInt(dayDep),
      parseInt(hourDep),
      parseInt(minuteDep),
      parseInt(secondDep || "0"),
    );

    console.log("DEPARTURE TIMEZONE FIX - Local timezone construction:");
    console.log(
      "  - Departure date parts:",
      yearDep,
      monthDep,
      dayDep,
      hourDep,
      minuteDep,
      secondDep,
    );

    console.log(
      "���� DEBUG - Departure flight time from group data:",
      group.departure_flight_time,
    );
    console.log(
      "🔍 DEBUG - Constructed pickup time string:",
      departureTimeString,
    );
    console.log("🔍 DEBUG - Final pickup time ISO:", pickupTime.toISOString());

    const dropoffSchedule = {
      transport_type: "airport_dropoff",
      vehicle_id: vehicles[Math.min(1, vehicles.length - 1)].id, // Use different vehicle if available
      driver_id: drivers[Math.min(1, drivers.length - 1)].id, // Use different driver if available
      pickup_location: "Hotel/Accommodation",
      pickup_time: pickupTime.toISOString(),
      dropoff_location: "Yellowknife Airport",
      estimated_dropoff_time: dropoffTime.toISOString(),
      passenger_count: group.total_members,
      groups_data: JSON.stringify([
        {
          type: "group",
          id: group.id,
          name: group.group_name,
          memberCount: group.total_members,
        },
      ]),
      notes: `Auto-scheduled airport dropoff for ${group.group_name} - ${group.total_members} passenger(s)`,
    };

    console.log("Creating dropoff schedule:", dropoffSchedule);
    await createTransportSchedule(dropoffSchedule);
  } else {
    console.log("⚠️ No departure details for dropoff transport");
  }
};

// Create transport for members traveling separately
const createTransportForSeparateMembers = async (
  group: any,
  members: any[],
  vehicles: any[],
  drivers: any[],
) => {
  console.log(
    "Creating transport for members traveling separately:",
    group.group_name,
  );

  // Fetch fresh member data from database to ensure accuracy
  const freshMemberData = new Map();
  for (const member of members) {
    const freshData = queries.getMemberFlightTimes().get(member.id);
    if (freshData) {
      freshMemberData.set(member.id, freshData);
      console.log(
        `🔄 Fetched fresh flight data for member ${member.id}:`,
        freshData,
      );
    }
  }

  // Group members by their arrival times using fresh data
  const arrivalGroups = new Map();
  const departureGroups = new Map();

  members.forEach((member) => {
    const freshData = freshMemberData.get(member.id);
    if (!freshData) {
      console.warn(`⚠️ No fresh data found for member ${member.id}, skipping`);
      return;
    }

    // Group by arrival date + time using fresh data
    if (freshData.arrival_date && freshData.arrival_flight_time) {
      const arrivalKey = `${freshData.arrival_date}_${freshData.arrival_flight_time}`;
      if (!arrivalGroups.has(arrivalKey)) {
        arrivalGroups.set(arrivalKey, []);
      }
      arrivalGroups.get(arrivalKey).push({ ...member, ...freshData });
    }

    // Group by departure date + time using fresh data
    if (freshData.departure_date && freshData.departure_flight_time) {
      const departureKey = `${freshData.departure_date}_${freshData.departure_flight_time}`;
      if (!departureGroups.has(departureKey)) {
        departureGroups.set(departureKey, []);
      }
      departureGroups.get(departureKey).push({ ...member, ...freshData });
    }
  });

  let vehicleIndex = 0;
  let driverIndex = 0;

  // Create pickup transports for each arrival group
  for (const [arrivalKey, arrivalMembers] of arrivalGroups) {
    const [date, time] = arrivalKey.split("_");
    // Ensure time has seconds if not present
    const timeFormatted =
      time.includes(":") && time.split(":").length === 2 ? `${time}:00` : time;
    const pickupTime = new Date(`${date.split("T")[0]}T${timeFormatted}`);
    console.log(
      "🔍 DEBUG - Member arrival transport - Original time:",
      time,
      "Formatted:",
      timeFormatted,
    );

    await createTransportSchedule({
      transport_type: "airport_pickup",
      vehicle_id: vehicles[vehicleIndex % vehicles.length].id,
      driver_id: drivers[driverIndex % drivers.length].id,
      pickup_location: "Yellowknife Airport",
      pickup_time: pickupTime.toISOString(),
      dropoff_location: "Hotel/Accommodation",
      estimated_dropoff_time: new Date(
        pickupTime.getTime() + 60 * 60 * 1000,
      ).toISOString(),
      passenger_count: arrivalMembers.length,
      groups_data: JSON.stringify(
        arrivalMembers.map((member: any) => ({
          type: "member",
          id: member.id,
          name: `${member.first_name} ${member.last_name}`,
          memberCount: 1,
        })),
      ),
      notes: `Auto-scheduled airport pickup for ${arrivalMembers.length} member(s) from ${group.group_name}`,
    });

    vehicleIndex++;
    driverIndex++;
  }

  // Create dropoff transports for each departure group
  for (const [departureKey, departureMembers] of departureGroups) {
    const [date, time] = departureKey.split("_");
    // Ensure time has seconds if not present
    const timeFormatted =
      time.includes(":") && time.split(":").length === 2 ? `${time}:00` : time;
    const dropoffTime = new Date(`${date.split("T")[0]}T${timeFormatted}`);
    // Use original departure flight time
    const pickupTime = new Date(`${date.split("T")[0]}T${timeFormatted}`);
    console.log(
      "🔍 DEBUG - Member departure transport - Original time:",
      time,
      "Formatted:",
      timeFormatted,
    );

    await createTransportSchedule({
      transport_type: "airport_dropoff",
      vehicle_id: vehicles[vehicleIndex % vehicles.length].id,
      driver_id: drivers[driverIndex % drivers.length].id,
      pickup_location: "Hotel/Accommodation",
      pickup_time: pickupTime.toISOString(),
      dropoff_location: "Yellowknife Airport",
      estimated_dropoff_time: dropoffTime.toISOString(),
      passenger_count: departureMembers.length,
      groups_data: JSON.stringify(
        departureMembers.map((member: any) => ({
          type: "member",
          id: member.id,
          name: `${member.first_name} ${member.last_name}`,
          memberCount: 1,
        })),
      ),
      notes: `Auto-scheduled airport dropoff for ${departureMembers.length} member(s) from ${group.group_name}`,
    });

    vehicleIndex++;
    driverIndex++;
  }
};

// Helper to create transport schedule
const createTransportSchedule = async (scheduleData: any) => {
  try {
    console.log("🚗 Creating transport schedule with data:", {
      type: scheduleData.transport_type,
      vehicle_id: scheduleData.vehicle_id,
      driver_id: scheduleData.driver_id,
      pickup_time: scheduleData.pickup_time,
      passenger_count: scheduleData.passenger_count,
    });

    const result = queries
      .createGroupTransportSchedule()
      .run(
        scheduleData.transport_type,
        scheduleData.activity_name || null,
        scheduleData.vehicle_id,
        scheduleData.driver_id,
        scheduleData.pickup_location,
        scheduleData.pickup_time,
        scheduleData.dropoff_location,
        scheduleData.estimated_dropoff_time || null,
        scheduleData.passenger_count,
        scheduleData.groups_data,
        scheduleData.notes || null,
      );

    console.log(
      "✅ Successfully created transport schedule with ID:",
      result.lastInsertRowid,
    );
    console.log("📝 Schedule notes:", scheduleData.notes);
    return result.lastInsertRowid;
  } catch (error) {
    console.error("❌ Error creating transport schedule:", error);
    console.error("📄 Schedule data that failed:", scheduleData);
    throw error;
  }
};

// Helper function to auto-update group status based on tour dates
const updateGroupStatusIfNeeded = (group: any) => {
  if (
    group.tour_end_date &&
    group.status !== "completed" &&
    group.status !== "cancelled"
  ) {
    try {
      const tourEndDate = new Date(group.tour_end_date);
      const currentDate = new Date();

      // Reset time to compare only dates (not time)
      tourEndDate.setHours(23, 59, 59, 999); // End of tour day
      currentDate.setHours(0, 0, 0, 0); // Start of current day

      console.log(
        `Checking group ${group.id} (${group.group_name}): tour ends ${group.tour_end_date} (${tourEndDate.toISOString()}), current date: ${currentDate.toISOString()}, status: ${group.status}`,
      );

      // If tour has ended, mark as completed
      if (tourEndDate < currentDate) {
        queries
          .getDatabase()
          .prepare(
            "UPDATE tour_groups SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          )
          .run("completed", group.id);
        group.status = "completed";
        console.log(
          `✅ Auto-updated group ${group.id} (${group.group_name}) status to completed - tour ended on ${group.tour_end_date}`,
        );
      }
    } catch (error) {
      console.error(
        `Failed to auto-update status for group ${group.id}:`,
        error,
      );
    }
  }
  return group;
};

export const getAllGroups: RequestHandler = (req, res) => {
  try {
    const groups = queries.getAllGroups().all();

    // Auto-update status for groups with ended tours
    const updatedGroups = groups.map(updateGroupStatusIfNeeded);

    res.json(updatedGroups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
};

export const getGroupById: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    let group = queries.getGroupById().get(id);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Auto-update status if needed
    group = updateGroupStatusIfNeeded(group);

    // Get group members
    const members = queries.getGroupMembers().all(id);

    // Get group bookings (by members) including invoice numbers
    let bookings: any[] = [];
    try {
      bookings = queries.getBookingsForGroup().all(id);
    } catch (e) {
      console.error("Failed to load group bookings:", e);
      bookings = [];
    }

    res.json({
      ...group,
      members,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching group:", error);
    res.status(500).json({ error: "Failed to fetch group" });
  }
};

export const getGroupMembers: RequestHandler = (req, res) => {
  try {
    const { groupId } = req.params;
    console.log("\n👥 Getting members for group:", groupId);

    // Check if group exists
    const group = queries.getGroupById().get(groupId);
    if (!group) {
      console.log("❌ Group not found");
      return res.status(404).json({ error: "Group not found" });
    }

    // Get group members
    const members = queries.getGroupMembers().all(groupId);

    console.log("✅ Members loaded:", members.length);
    res.json(members || []);
  } catch (error) {
    console.error("❌ Error fetching group members:", error);
    res.status(500).json({ error: "Failed to fetch group members" });
  }
};

// Helper function to safely convert values for SQLite
const toSqliteValue = (value: any): string | null => {
  if (value === undefined || value === "" || value === null) {
    return null;
  }
  // Convert all values to string to ensure SQLite compatibility
  const converted = String(value);
  // Validate that we got a proper string
  if (typeof converted !== "string") {
    throw new Error(
      `Failed to convert value to string: ${typeof value} = ${value}`,
    );
  }
  return converted;
};

// Helper to ensure we have proper number
const toSqliteNumber = (value: any): number => {
  const converted = Number(value);
  if (isNaN(converted)) {
    throw new Error(
      `Failed to convert value to number: ${typeof value} = ${value}`,
    );
  }
  return converted;
};

export const createGroup: RequestHandler = async (req, res) => {
  try {
    const {
      group_name,
      group_type = "family",
      tour_start_date,
      tour_end_date,
      arrival_date,
      departure_date,
      arrival_flight_number,
      arrival_flight_time,
      arrival_notes,
      departure_flight_number,
      departure_flight_time,
      departure_notes,
      traveling_together = true,
      total_cost = 0,
      amount_paid = 0,
      deposit_amount = 0,
      special_requirements,
      group_notes,
      members = [],
    } = req.body;

    // Validate that we have at least one member
    if (!members || members.length === 0) {
      return res
        .status(400)
        .json({ error: "Group must have at least one member" });
    }

    // Start transaction
    const db = queries.getDatabase();
    const transaction = db.transaction(() => {
      // Create all guests first
      const createdGuests = [];
      for (let i = 0; i < members.length; i++) {
        const member = members[i];
        console.log(
          "Creating guest:",
          member.first_name,
          member.last_name,
          "with email:",
          member.email,
        );

        // Check if guest with exact same details already exists (to avoid duplicates)
        const existingGuest = queries
          .getDatabase()
          .prepare(
            `
          SELECT id FROM guests
          WHERE first_name = ? AND last_name = ? AND email = ?
        `,
          )
          .get(member.first_name, member.last_name, member.email);

        if (existingGuest) {
          console.log("Found existing guest with ID:", existingGuest.id);
          createdGuests.push({
            id: Number(existingGuest.id),
            is_leader: member.is_leader || false,
          });
          continue;
        }

        // If guest doesn't exist, create a new one with a unique email
        let emailToUse = String(member.email);
        let emailSuffix = 0;

        // Make email unique by appending member index and suffix if needed
        while (true) {
          try {
            if (emailSuffix === 0) {
              // First try: append member number to email
              const emailParts = member.email.split("@");
              emailToUse = `${emailParts[0]}.member${i + 1}@${emailParts[1]}`;
            } else {
              // Subsequent tries: append additional suffix
              const emailParts = member.email.split("@");
              emailToUse = `${emailParts[0]}.member${i + 1}.${emailSuffix}@${emailParts[1]}`;
            }

            const emailCheck = queries
              .getDatabase()
              .prepare("SELECT id FROM guests WHERE email = ?")
              .get(emailToUse);
            if (!emailCheck) {
              break; // Email is unique, use it
            }
            emailSuffix++;
          } catch (error) {
            break; // If query fails, proceed with current email
          }
        }

        console.log("Using unique email:", emailToUse);

        const guestParams = [
          String(member.first_name),
          String(member.last_name),
          emailToUse,
          toSqliteValue(member.phone),
          toSqliteValue(member.passport_number),
          toSqliteValue(member.nationality),
          toSqliteValue(member.date_of_birth),
          toSqliteValue(member.dietary_restrictions),
          toSqliteValue(member.emergency_contact_name),
          toSqliteValue(member.emergency_contact_phone),
          toSqliteValue(member.notes),
          toSqliteValue(member.arrival_date),
          toSqliteValue(member.departure_date),
          toSqliteValue(member.arrival_flight_number),
          toSqliteValue(member.arrival_flight_time),
          toSqliteValue(member.arrival_notes),
          toSqliteValue(member.departure_flight_number),
          toSqliteValue(member.departure_flight_time),
          toSqliteValue(member.departure_notes),
          0, // is_group_leader - we'll handle this in the groups table (0 = false)
          1, // group_size - not used for group members
          null, // group_name - not used for group members
        ];

        try {
          const guestResult = queries.createGuest().run(...guestParams);
          console.log("Guest created with ID:", guestResult.lastInsertRowid);

          createdGuests.push({
            id: Number(guestResult.lastInsertRowid),
            is_leader: member.is_leader || false,
          });
        } catch (error) {
          console.error("Error creating guest:", error);
          console.error("Guest data:", member);
          console.error("Using email:", emailToUse);
          throw new Error(
            `Failed to create guest ${member.first_name} ${member.last_name}: ${error.message}`,
          );
        }
      }

      // Find the group leader
      const groupLeader = createdGuests.find((g) => g.is_leader);
      const groupLeaderId = groupLeader ? groupLeader.id : createdGuests[0].id;

      // Create the group with safe type conversion
      const params = [
        toSqliteValue(group_name) || "Unnamed Group",
        toSqliteNumber(groupLeaderId),
        toSqliteNumber(members.length),
        toSqliteValue(group_type) || "family",
        toSqliteValue(tour_start_date),
        toSqliteValue(tour_end_date),
        toSqliteValue(arrival_date),
        toSqliteValue(departure_date),
        toSqliteValue(arrival_flight_number),
        toSqliteValue(arrival_flight_time),
        toSqliteValue(arrival_notes),
        toSqliteValue(departure_flight_number),
        toSqliteValue(departure_flight_time),
        toSqliteValue(departure_notes),
        traveling_together ? 1 : 0,
        toSqliteNumber(total_cost),
        toSqliteNumber(amount_paid),
        toSqliteNumber(deposit_amount),
        toSqliteValue(special_requirements),
        toSqliteValue(group_notes),
      ];

      // Simple parameter validation and coercion
      const finalParams = params.map((p, i) => {
        if (p === null) return null;
        if (typeof p === "number") return p;
        if (typeof p === "string") return p;
        // Force convert anything else to string
        console.log(`Converting param ${i} from ${typeof p} to string:`, p);
        return String(p);
      });

      console.log("Creating group with final params:", finalParams);
      const groupResult = queries.createGroup().run(...finalParams);

      const groupId = Number(groupResult.lastInsertRowid);

      // Add all guests to the group
      for (const guest of createdGuests) {
        queries
          .addGroupMember()
          .run(
            toSqliteNumber(groupId),
            toSqliteNumber(guest.id),
            guest.is_leader ? 1 : 0,
          );
      }

      return groupId;
    });

    // Execute transaction
    const groupId = transaction();

    // Get the complete group data
    console.log("\n>>> FETCHING GROUP DATA FOR AUTO-SCHEDULING <<<");
    console.log("Group ID for fetch:", groupId);

    const newGroup = queries.getGroupById().get(groupId);
    const newMembers = queries.getGroupMembers().all(groupId);

    console.log(">>> DATA FETCHED FROM DATABASE <<<");
    console.log("newGroup:", JSON.stringify(newGroup, null, 2));
    console.log("newMembers count:", newMembers ? newMembers.length : 0);
    console.log(">>> CALLING AUTO-SCHEDULING <<<");

    // Auto-schedule transport for the new group
    await autoScheduleTransport(groupId);

    res.status(201).json({
      ...newGroup,
      members: newMembers,
    });
  } catch (error) {
    console.error("Error creating group:", error);

    // Ensure we always return a proper JSON response
    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to create group",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
};

export const updateGroup: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      group_name,
      group_type,
      tour_start_date,
      tour_end_date,
      arrival_date,
      departure_date,
      arrival_flight_number,
      arrival_flight_time,
      arrival_notes,
      departure_flight_number,
      departure_flight_time,
      departure_notes,
      traveling_together = true,
      total_cost = 0,
      amount_paid = 0,
      deposit_amount = 0,
      special_requirements,
      group_notes,
      status,
      refund_amount = 0,
      cancelled_at,
      members = [],
    } = req.body;

    const db = queries.getDatabase();
    const transaction = db.transaction(() => {
      // Update group information
      queries
        .updateGroup()
        .run(
          toSqliteValue(group_name) || "Unnamed Group",
          toSqliteValue(group_type) || "family",
          toSqliteValue(tour_start_date),
          toSqliteValue(tour_end_date),
          toSqliteValue(arrival_date),
          toSqliteValue(departure_date),
          toSqliteValue(arrival_flight_number),
          toSqliteValue(arrival_flight_time),
          toSqliteValue(arrival_notes),
          toSqliteValue(departure_flight_number),
          toSqliteValue(departure_flight_time),
          toSqliteValue(departure_notes),
          traveling_together ? 1 : 0,
          toSqliteNumber(total_cost),
          toSqliteNumber(amount_paid),
          toSqliteNumber(deposit_amount),
          toSqliteValue(special_requirements),
          toSqliteValue(group_notes),
          toSqliteValue(status) || "active",
          toSqliteNumber(refund_amount),
          toSqliteValue(cancelled_at),
          toSqliteNumber(id),
        );

      // Handle member updates if provided
      if (members && members.length > 0) {
        // Get existing members
        const existingMembers = queries.getGroupMembers().all(id);
        const existingMemberIds = existingMembers.map((m) => m.guest_id);

        // Update/Create members
        const updatedMemberIds = [];
        for (const member of members) {
          if (member.id && existingMemberIds.includes(member.id)) {
            // Update existing member
            queries.updateGuest().run(
              String(member.first_name),
              String(member.last_name),
              String(member.email),
              toSqliteValue(member.phone),
              toSqliteValue(member.passport_number),
              toSqliteValue(member.nationality),
              toSqliteValue(member.date_of_birth),
              toSqliteValue(member.dietary_restrictions),
              toSqliteValue(member.emergency_contact_name),
              toSqliteValue(member.emergency_contact_phone),
              toSqliteValue(member.notes),
              toSqliteValue(member.arrival_date),
              toSqliteValue(member.departure_date),
              toSqliteValue(member.arrival_flight_number),
              toSqliteValue(member.arrival_flight_time),
              toSqliteValue(member.arrival_notes),
              toSqliteValue(member.departure_flight_number),
              toSqliteValue(member.departure_flight_time),
              toSqliteValue(member.departure_notes),
              member.is_leader ? 1 : 0,
              1, // group_size
              null, // group_name
              member.id,
            );
            updatedMemberIds.push(member.id);
          } else {
            // Create new member
            const guestResult = queries.createGuest().run(
              String(member.first_name),
              String(member.last_name),
              String(member.email),
              toSqliteValue(member.phone),
              toSqliteValue(member.passport_number),
              toSqliteValue(member.nationality),
              toSqliteValue(member.date_of_birth),
              toSqliteValue(member.dietary_restrictions),
              toSqliteValue(member.emergency_contact_name),
              toSqliteValue(member.emergency_contact_phone),
              toSqliteValue(member.notes),
              toSqliteValue(member.arrival_date),
              toSqliteValue(member.departure_date),
              toSqliteValue(member.arrival_flight_number),
              toSqliteValue(member.arrival_flight_time),
              toSqliteValue(member.arrival_notes),
              toSqliteValue(member.departure_flight_number),
              toSqliteValue(member.departure_flight_time),
              toSqliteValue(member.departure_notes),
              0, // is_group_leader - handled in group_members table
              1, // group_size
              null, // group_name
            );

            const newMemberId = Number(guestResult.lastInsertRowid);

            // Add to group
            queries
              .addGroupMember()
              .run(toSqliteNumber(id), newMemberId, member.is_leader ? 1 : 0);
            updatedMemberIds.push(newMemberId);
          }
        }

        // Remove members that are no longer in the list
        for (const existingMemberId of existingMemberIds) {
          if (!updatedMemberIds.includes(existingMemberId)) {
            queries.removeGroupMember().run(id, existingMemberId);
          }
        }

        // Update total member count
        queries.updateGroupMemberCount().run(members.length, id);
      }
    });

    // Execute transaction
    transaction();

    const updatedGroup = queries.getGroupById().get(id);
    const updatedMembers = queries.getGroupMembers().all(id);

    // Auto-schedule transport for the updated group (in case flight details were added)
    await autoScheduleTransport(parseInt(id));

    res.json({
      ...updatedGroup,
      members: updatedMembers,
    });
  } catch (error) {
    console.error("Error updating group:", error);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to update group",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
};

export const deleteGroup: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    // Note: This will cascade delete group members due to foreign key constraint
    queries.deleteGroup().run(id);

    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ error: "Failed to delete group" });
  }
};

export const addMemberToGroup: RequestHandler = (req, res) => {
  try {
    const { groupId } = req.params;
    const { guest_id, is_leader = false } = req.body;

    queries.addGroupMember().run(groupId, guest_id, is_leader);

    // Update group member count
    const memberCount = queries.getGroupMemberCount().get(groupId) as {
      count: number;
    };
    queries.updateGroupMemberCount().run(memberCount.count, groupId);

    res.json({ message: "Member added to group successfully" });
  } catch (error) {
    console.error("Error adding member to group:", error);
    res.status(500).json({ error: "Failed to add member to group" });
  }
};

export const testAutoStatusUpdate: RequestHandler = (req, res) => {
  try {
    // Create a test group with past tour end date
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7); // 7 days ago
    const pastDateStr = pastDate.toISOString().split("T")[0];

    console.log(`Creating test group with tour end date: ${pastDateStr}`);

    const testGroup = queries
      .getDatabase()
      .prepare(
        `
      INSERT INTO tour_groups
      (group_name, total_members, group_type, tour_start_date, tour_end_date, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        "Test Completed Group",
        1,
        "family",
        pastDateStr,
        pastDateStr,
        "active",
      );

    // Now fetch all groups to trigger the auto-update
    const groups = queries.getAllGroups().all();
    const updatedGroups = groups.map(updateGroupStatusIfNeeded);

    res.json({
      message: "Test completed",
      test_group_id: testGroup.lastInsertRowid,
      groups: updatedGroups,
    });
  } catch (error) {
    console.error("Error in test endpoint:", error);
    res.status(500).json({ error: "Failed to test auto-status update" });
  }
};

export const manualTriggerAutoScheduling: RequestHandler = async (req, res) => {
  try {
    const { groupId } = req.params;
    console.log("🔧 Manually triggering auto-scheduling for group:", groupId);

    // Get the group data
    const group = queries.getGroupById().get(groupId);
    const members = queries.getGroupMembers().all(groupId);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Trigger auto-scheduling
    await autoScheduleTransport(parseInt(groupId));

    res.json({
      message: "Manual auto-scheduling completed",
      group_id: groupId,
      group_name: group.group_name,
    });
  } catch (error) {
    console.error("Error in manual auto-scheduling:", error);
    res
      .status(500)
      .json({ error: "Failed to manually trigger auto-scheduling" });
  }
};

export const testAutoTransportScheduling: RequestHandler = (req, res) => {
  try {
    console.log("🧪 Testing auto transport scheduling...");

    // Create a test group with flight details
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 3);
    const dayAfterStr = dayAfter.toISOString().split("T")[0];

    const testGroupData = {
      group_name: "Test Auto Transport Group",
      total_members: 2,
      group_type: "family",
      tour_start_date: tomorrowStr,
      tour_end_date: dayAfterStr,
      arrival_date: tomorrowStr,
      departure_date: dayAfterStr,
      arrival_flight_number: "TEST123",
      arrival_flight_time: "14:30",
      departure_flight_number: "TEST456",
      departure_flight_time: "16:45",
      traveling_together: true,
      status: "active",
    };

    // Create test group
    const groupResult = queries.createGroup().run(
      testGroupData.group_name,
      1, // leader_id (dummy)
      testGroupData.total_members,
      testGroupData.group_type,
      testGroupData.tour_start_date,
      testGroupData.tour_end_date,
      testGroupData.arrival_date,
      testGroupData.departure_date,
      testGroupData.arrival_flight_number,
      testGroupData.arrival_flight_time,
      null, // arrival_notes
      testGroupData.departure_flight_number,
      testGroupData.departure_flight_time,
      null, // departure_notes
      1, // traveling_together
      0, // total_cost
      0, // amount_paid
      0, // deposit_amount
      null, // special_requirements
      "Test group for auto transport scheduling",
    );

    const groupId = Number(groupResult.lastInsertRowid);

    // Get the created group
    const newGroup = queries.getGroupById().get(groupId);

    // Test auto-scheduling
    autoScheduleTransport(groupId);

    res.json({
      message: "Test auto transport scheduling completed",
      test_group_id: groupId,
      group_data: newGroup,
    });
  } catch (error) {
    console.error("Error in test auto transport scheduling:", error);
    res.status(500).json({ error: "Failed to test auto transport scheduling" });
  }
};

export const removeMemberFromGroup: RequestHandler = (req, res) => {
  try {
    const { groupId, memberId } = req.params;

    queries.removeGroupMember().run(groupId, memberId);

    // Update group member count
    const memberCount = queries.getGroupMemberCount().get(groupId) as {
      count: number;
    };
    queries.updateGroupMemberCount().run(memberCount.count, groupId);

    res.json({ message: "Member removed from group successfully" });
  } catch (error) {
    console.error("Error removing member from group:", error);
    res.status(500).json({ error: "Failed to remove member from group" });
  }
};

export const getGroupBookingsReport: RequestHandler = (req, res) => {
  try {
    const { start, end, status } = req.query as {
      start?: string;
      end?: string;
      status?: string;
    };

    const today = new Date().toISOString().slice(0, 10);
    const startDate = (start && String(start)) || today;
    const endDate = (end && String(end)) || today;
    const statusFilter = status ? String(status) : null;

    const groups = queries
      .getGroupsReportInRange()
      .all(endDate, startDate, statusFilter, statusFilter);

    res.json(groups || []);
  } catch (error) {
    console.error("Error generating group bookings report:", error);
    res.status(500).json({ error: "Failed to generate group bookings report" });
  }
};
