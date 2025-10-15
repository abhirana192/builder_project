import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Plane,
  AlertTriangle,
  CalendarCheck,
  Hotel,
  Users,
  Printer,
} from "lucide-react";
import { fetchJSON } from "@/lib/fetch-utils";

interface TransportSchedule {
  id: number;
  transport_type: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  passenger_count: number;
  vehicle_number?: string;
  driver_name?: string;
  passengers?: Array<{
    name: string;
    type: string;
    id: number;
    groupName?: string;
    groupId?: number | null;
  }>;
}

interface ActivityInstance {
  id: number;
  activity_id: number;
  scheduled_date: string;
  scheduled_time: string;
  activity_name?: string;
  guide_name?: string | null;
  status?: string;
  notes?: string | null;
  duration_hours?: number | null;
  computed_end_time?: string | null;
  participants?: Array<{
    id: number;
    name: string;
    groupName?: string;
    groupId?: number | null;
    location?: string | null;
  }>;
}

interface HotelBookingToday {
  id: number;
  booking_reference: string;
  guest_name: string;
  group_name?: string | null;
  hotel_id: number;
  hotel_name?: string;
  room_number?: string | null;
  check_in_date: string;
  check_out_date: string;
  guests_count?: number;
}

interface GroupReportItem {
  id: number;
  group_name: string;
  status: string;
  total_members: number;
  group_type: string;
  tour_start_date?: string | null;
  tour_end_date?: string | null;
  arrival_date?: string | null;
  arrival_flight_number?: string | null;
  arrival_flight_time?: string | null;
  departure_date?: string | null;
  departure_flight_number?: string | null;
  departure_flight_time?: string | null;
  group_notes?: string | null;
  leader_name?: string | null;
  leader_email?: string | null;
  leader_phone?: string | null;
  member_names?: string | null;
  hotel_names?: string | null;
  room_numbers?: string | null;
}

const DailyActivityReport: React.FC = () => {
  const [arrivals, setArrivals] = useState<TransportSchedule[]>([]);
  const [departures, setDepartures] = useState<TransportSchedule[]>([]);
  const [activities, setActivities] = useState<ActivityInstance[]>([]);
  const [hotelCheckIns, setHotelCheckIns] = useState<HotelBookingToday[]>([]);
  const [hotelCheckOuts, setHotelCheckOuts] = useState<HotelBookingToday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbReadOnly, setDbReadOnly] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [startTime, setStartTime] = useState<string>("00:00");
  const [endTime, setEndTime] = useState<string>("23:59");

  // Group bookings report state
  const [groupStart, setGroupStart] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [groupEnd, setGroupEnd] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [groupStatus, setGroupStatus] = useState<string>("active");
  const [groupReport, setGroupReport] = useState<GroupReportItem[]>([]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDate) params.set("date", selectedDate);
      if (startTime && endTime) {
        params.set("startTime", startTime);
        params.set("endTime", endTime);
      }

      const [
        arrivalsData,
        departuresData,
        activitiesData,
        checkInsData,
        checkOutsData,
        groupReportData,
      ] = await Promise.all([
        fetchJSON(`/api/dashboard/arrivals?${params.toString()}`).catch((e) => {
          console.warn("Arrivals fetch failed", e);
          return [];
        }),
        fetchJSON(`/api/dashboard/departures?${params.toString()}`).catch(
          (e) => {
            console.warn("Departures fetch failed", e);
            return [];
          },
        ),
        fetchJSON(`/api/activities/today?${params.toString()}`).catch((e) => {
          console.warn("Activities fetch failed", e);
          return [];
        }),
        fetchJSON(`/api/hotels/checkins/today?${params.toString()}`).catch(
          (e) => {
            console.warn("Checkins fetch failed", e);
            return [];
          },
        ),
        fetchJSON(`/api/hotels/checkouts/today?${params.toString()}`).catch(
          (e) => {
            console.warn("Checkouts fetch failed", e);
            return [];
          },
        ),
        fetchJSON(
          `/api/reports/group-bookings?start=${groupStart}&end=${groupEnd}&status=${encodeURIComponent(groupStatus)}`,
        ).catch((e) => {
          console.warn("Group report fetch failed", e);
          return [];
        }),
      ]);

      setArrivals(Array.isArray(arrivalsData) ? arrivalsData : []);
      setDepartures(Array.isArray(departuresData) ? departuresData : []);
      setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      setHotelCheckIns(Array.isArray(checkInsData) ? checkInsData : []);
      setHotelCheckOuts(Array.isArray(checkOutsData) ? checkOutsData : []);
      setGroupReport(Array.isArray(groupReportData) ? groupReportData : []);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unknown error occurred while fetching report data.";
      setError(errorMessage);
      setArrivals([]);
      setDepartures([]);
      setActivities([]);
      setHotelCheckIns([]);
      setHotelCheckOuts([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
    (async () => {
      try {
        const res = await fetch("/api/db/status");
        if (res.ok) {
          const data = await res.json();
          setDbReadOnly(!!data.readOnly);
        }
      } catch (e) {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatPassengerNames = (
    passengers: TransportSchedule["passengers"],
  ) => {
    if (!Array.isArray(passengers) || passengers.length === 0) return "N/A";
    return passengers
      .map((p) => `${p.name} ${p.groupName ? `(${p.groupName})` : ""}`)
      .join(", ");
  };

  // Print helpers for specific sections
  const generateReportHtml = (opts: {
    includeGroups?: boolean;
    includeTransport?: boolean;
    includeActivities?: boolean;
    includeHotels?: boolean;
  }) => {
    const {
      includeGroups = true,
      includeTransport = true,
      includeActivities = true,
      includeHotels = true,
    } = opts;

    const style = `
      body { font-family: Arial, sans-serif; color: #111827; padding: 20px; }
      h1 { margin: 0 0 6px; }
      .meta { color: #6b7280; margin-bottom: 14px; }
      .section { margin: 18px 0; }
      .section h2 { font-size: 18px; margin: 0 0 8px; color: #111827; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; vertical-align: top; }
      th { background: #f3f4f6; }
      .muted { color: #6b7280; }
      .nowrap { white-space: nowrap; }
      @media print { body { padding: 0; } }
    `;

    const transportRows = [
      ...arrivals.map((a) => ({ ...a, type: "Arrival" })),
      ...departures.map((d) => ({ ...d, type: "Departure" })),
    ].sort((a, b) => (a.pickup_time || "").localeCompare(b.pickup_time || ""));

    const hotelsRows = [
      ...hotelCheckIns.map((h) => ({ ...h, type: "Check-in" })),
      ...hotelCheckOuts.map((h) => ({ ...h, type: "Check-out" })),
    ];

    const sections: string[] = [];

    if (includeGroups) {
      sections.push(`
        <div class="section">
          <h2>Group Bookings (${groupReport.length})</h2>
          <div class="meta">Range: ${groupStart} → ${groupEnd} | Status: ${groupStatus || "All"}</div>
          <table>
            <thead>
              <tr>
                <th>Group ID</th>
                <th>Group</th>
                <th>Status</th>
                <th>Pax</th>
                <th>Arrival</th>
                <th>Departure</th>
                <th>Hotel</th>
                <th>Room</th>
                <th>Leader</th>
                <th>Contact</th>
                <th>Members</th>
                <th>Notes</th>
                <th>Hotel</th>
                <th>Room</th>
              </tr>
            </thead>
            <tbody>
              ${groupReport
                .map(
                  (g) => `
                <tr>
                  <td>${g.id}</td>
                  <td>${g.group_name}</td>
                  <td>${g.status}</td>
                  <td class="nowrap">${g.total_members}</td>
                  <td>
                    <div>${g.arrival_date || g.tour_start_date || ""}</div>
                    <div class="muted">${[g.arrival_flight_number, g.arrival_flight_time].filter(Boolean).join(" ")}</div>
                  </td>
                  <td>
                    <div>${g.departure_date || g.tour_end_date || ""}</div>
                    <div class="muted">${[g.departure_flight_number, g.departure_flight_time].filter(Boolean).join(" ")}</div>
                  </td>
                  <td>${g.leader_name || ""}</td>
                  <td>
                    <div>${g.leader_email || ""}</div>
                    <div>${g.leader_phone || ""}</div>
                  </td>
                  <td>${g.member_names || ""}</td>
                  <td>${g.group_notes || ""}</td>
                  <td>${g.hotel_names || ""}</td>
                  <td>${g.room_numbers || ""}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `);
    }

    if (includeTransport) {
      sections.push(`
        <div class="section">
          <h2>Transport (Arrivals + Departures): ${transportRows.length}</h2>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Passengers</th>
                <th>Group ID(s)</th>
                <th>Group Members</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Pickup Time</th>
                <th>Flight No.</th>
                <th>From</th>
                <th>To</th>
              </tr>
            </thead>
            <tbody>
              ${transportRows
                .map((t) => {
                  const groupMap = new Map();
                  (t.passengers || []).forEach((p) => {
                    const gid = p.groupId;
                    if (gid) {
                      const arr = groupMap.get(gid) || [];
                      if (!arr.includes(p.name)) arr.push(p.name);
                      groupMap.set(gid, arr);
                    }
                  });
                  const groupIdsStr = Array.from(groupMap.keys()).join(", ");
                  const membersByGroupStr = Array.from(groupMap.entries())
                    .map(([gid, names]) => `#${gid}: ${names.join(", ")}`)
                    .join(" | ");
                  return `
                <tr>
                  <td>${t.type}</td>
                  <td>${formatPassengerNames(t.passengers)}</td>
                  <td>${groupIdsStr || "—"}</td>
                  <td>${membersByGroupStr || "—"}</td>
                  <td>${t.vehicle_number || "N/A"}</td>
                  <td>${t.driver_name || "N/A"}</td>
                  <td class="nowrap">${t.pickup_time ? new Date(t.pickup_time).toLocaleString() : ""}</td>
                  <td>${(t as any).flight_number || ""}</td>
                  <td>${t.pickup_location || ""}</td>
                  <td>${t.dropoff_location || ""}</td>
                </tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      `);
    }

    if (includeActivities) {
      sections.push(`
        <div class="section">
          <h2>Activities Today: ${activities.length}</h2>
          ${activities
            .map((a) => {
              const pRows = (a.participants || []).map((p) => ({
                name: p.name,
                group: p.groupName || "",
                groupId: p.groupId || "",
                location: p.location || null,
              }));
              return `
            <div style="margin: 12px 0;">
              <div class="muted">Guide: ${a.guide_name || "N/A"} | Date: ${a.scheduled_date} | Start: ${a.scheduled_time} | End: ${a.computed_end_time || ""} | Status: ${a.status || "scheduled"}</div>
              <div style="font-weight:600; margin: 4px 0 8px;">${a.activity_name || "N/A"}</div>
              <table>
                <thead>
                  <tr>
                    <th>Participant</th>
                    <th>Group</th>
                    <th>Group ID</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    pRows.length > 0
                      ? pRows
                          .map(
                            (r) => `
                    <tr>
                      <td>${r.name}</td>
                      <td>${r.group}</td>
                      <td>${r.groupId || "—"}</td>
                      <td>${r.location || "NULL"}</td>
                    </tr>
                  `,
                          )
                          .join("")
                      : `
                    <tr><td colspan="4" class="muted">No participants for this activity.</td></tr>
                  `
                  }
                </tbody>
              </table>
            </div>`;
            })
            .join("")}
        </div>
      `);
    }

    if (includeHotels) {
      sections.push(`
        <div class="section">
          <h2>Hotels (Check-ins + Check-outs): ${hotelsRows.length}</h2>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Guest</th>
                <th>Group</th>
                <th>Hotel</th>
                <th>Room</th>
                <th>Check-in</th>
                <th>Check-out</th>
              </tr>
            </thead>
            <tbody>
              ${hotelsRows
                .map(
                  (h) => `
                <tr>
                  <td>${h.type}</td>
                  <td>${h.guest_name}</td>
                  <td>${h.group_name || ""}</td>
                  <td>${h.hotel_name || h.hotel_id}</td>
                  <td>${h.room_number || ""}</td>
                  <td>${h.check_in_date}</td>
                  <td>${h.check_out_date}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `);
    }

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Daily Report (Printable)</title>
          <style>
            ${style}
            .toolbar { position: sticky; top: 0; background: #111827; color: #fff; padding: 8px 12px; margin: -20px -20px 12px; display: flex; gap: 8px; align-items: center; z-index: 10; }
            .toolbar button { background: #374151; color: #fff; border: 0; padding: 6px 10px; border-radius: 6px; cursor: pointer; }
            .toolbar .note { margin-left: auto; color: #d1d5db; font-size: 12px; }
            #editable-root { outline: 2px dashed transparent; }
            #editable-root[contenteditable="true"] { outline-color: #93c5fd; }
            @media print { .toolbar { display: none; } }
          </style>
        </head>
        <body>
          <div class="toolbar">
            <div style="font-weight:600">Edit Mode</div>
            <button onclick="toggleEdit()" id="toggleBtn">Disable Edit</button>
            <button onclick="window.print()">Print</button>
            <button onclick="document.execCommand('undo')">Undo</button>
            <button onclick="document.execCommand('redo')">Redo</button>
            <span class="note">You can click and edit any text below before printing. Changes are not saved to the database.</span>
          </div>
          <h1>Daily Activity Report</h1>
          <div class="meta">
            Generated on ${new Date().toLocaleString()} | Date: ${selectedDate} | Time: ${startTime} - ${endTime}
          </div>
          <div id="editable-root" contenteditable="true">
            ${sections.join("")}
          </div>
          <script>
            function toggleEdit(){
              var root = document.getElementById('editable-root');
              var btn = document.getElementById('toggleBtn');
              var enabled = root.getAttribute('contenteditable') === 'true';
              root.setAttribute('contenteditable', enabled ? 'false' : 'true');
              btn.textContent = enabled ? 'Enable Edit' : 'Disable Edit';
              if (!enabled) root.focus();
            }
          </script>
        </body>
      </html>
    `;

    return html;
  };

  const openPrintWindow = (html: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
  };

  const handlePrintReport = () => {
    const html = generateReportHtml({
      includeGroups: true,
      includeTransport: true,
      includeActivities: true,
      includeHotels: true,
    });
    openPrintWindow(html);
  };

  const handlePrintGroups = () => {
    const html = generateReportHtml({
      includeGroups: true,
      includeTransport: false,
      includeActivities: false,
      includeHotels: false,
    });
    openPrintWindow(html);
  };

  const handlePrintTransportOnly = () => {
    const html = generateReportHtml({
      includeGroups: false,
      includeTransport: true,
      includeActivities: false,
      includeHotels: false,
    });
    openPrintWindow(html);
  };

  const handlePrintActivitiesOnly = () => {
    const html = generateReportHtml({
      includeGroups: false,
      includeTransport: false,
      includeActivities: true,
      includeHotels: false,
    });
    openPrintWindow(html);
  };

  const handlePrintHotelsOnly = () => {
    const html = generateReportHtml({
      includeGroups: false,
      includeTransport: false,
      includeActivities: false,
      includeHotels: true,
    });
    openPrintWindow(html);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading daily report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error} Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Daily Activity Report</h1>
          {dbReadOnly ? (
            <div className="mb-2 text-sm text-yellow-700 bg-yellow-100 px-3 py-2 rounded">
              Database is in read-only mode — mutating actions are disabled.
              Prints and local edits are still available.
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-1">
                Start time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-1">
                End time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-background"
              />
            </div>
            <Button onClick={fetchReportData} variant="secondary">
              Apply
            </Button>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handlePrintReport}
            variant="outline"
            disabled={
              loading ||
              arrivals.length +
                departures.length +
                activities.length +
                hotelCheckIns.length +
                hotelCheckOuts.length +
                groupReport.length ===
                0
            }
          >
            <Printer className="mr-2 h-4 w-4" />
            Print All
          </Button>
          <Button
            onClick={handlePrintGroups}
            variant="outline"
            disabled={groupReport.length === 0}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Groups
          </Button>
          <Button
            onClick={handlePrintTransportOnly}
            variant="outline"
            disabled={arrivals.length + departures.length === 0}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Transport
          </Button>
          <Button
            onClick={handlePrintActivitiesOnly}
            variant="outline"
            disabled={activities.length === 0}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Activities
          </Button>
          <Button
            onClick={handlePrintHotelsOnly}
            variant="outline"
            disabled={hotelCheckIns.length + hotelCheckOuts.length === 0}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Hotels
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Group Bookings ({groupReport.length})
          </CardTitle>
          <CardDescription>
            Groups active within the selected date range, with pax, travel,
            contact, and notes.
          </CardDescription>
          <div className="mt-4 flex flex-wrap gap-3 items-end">
            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-1">
                Start date
              </label>
              <input
                type="date"
                value={groupStart}
                onChange={(e) => setGroupStart(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-1">
                End date
              </label>
              <input
                type="date"
                value={groupEnd}
                onChange={(e) => setGroupEnd(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-1">
                Status
              </label>
              <select
                value={groupStatus}
                onChange={(e) => setGroupStatus(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <Button variant="secondary" onClick={fetchReportData}>
              Load
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {groupReport.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group ID</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pax</TableHead>
                  <TableHead>Arrival</TableHead>
                  <TableHead>Departure</TableHead>
                  <TableHead>Leader</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupReport.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {g.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {g.group_name}
                    </TableCell>
                    <TableCell>{g.status}</TableCell>
                    <TableCell>{g.total_members}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{g.arrival_date || g.tour_start_date || ""}</div>
                        <div className="text-muted-foreground">
                          {[g.arrival_flight_number, g.arrival_flight_time]
                            .filter(Boolean)
                            .join(" ")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{g.departure_date || g.tour_end_date || ""}</div>
                        <div className="text-muted-foreground">
                          {[g.departure_flight_number, g.departure_flight_time]
                            .filter(Boolean)
                            .join(" ")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{g.hotel_names || ""}</TableCell>
                    <TableCell>{g.room_numbers || ""}</TableCell>
                    <TableCell>{g.leader_name || ""}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{g.leader_email || ""}</div>
                        <div>{g.leader_phone || ""}</div>
                      </div>
                    </TableCell>
                    <TableCell
                      className="max-w-[320px] truncate"
                      title={g.member_names || ""}
                    >
                      {g.member_names || ""}
                    </TableCell>
                    <TableCell
                      className="max-w-[240px] truncate"
                      title={g.group_notes || ""}
                    >
                      {g.group_notes || ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              No groups found for the selected range.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-blue-600" />
            Transport (Arrivals + Departures):{" "}
            {arrivals.length + departures.length}
          </CardTitle>
          <CardDescription>
            All transport schedules for guests arriving and departing today.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {arrivals.length > 0 || departures.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Passenger(s)</TableHead>
                  <TableHead>Group ID(s)</TableHead>
                  <TableHead>Group Members</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Pickup Time</TableHead>
                  <TableHead>Flight No.</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arrivals.map((item) => {
                  const groupMap = new Map<number, string[]>();
                  (item.passengers || []).forEach((p) => {
                    const gid = (p as any).groupId as number | null | undefined;
                    if (gid && typeof gid === "number") {
                      const arr = groupMap.get(gid) || [];
                      if (!arr.includes(p.name)) arr.push(p.name);
                      groupMap.set(gid, arr);
                    }
                  });
                  const groupIdsStr = Array.from(groupMap.keys()).join(", ");
                  const membersByGroupStr = Array.from(groupMap.entries())
                    .map(([gid, names]) => `#${gid}: ${names.join(", ")}`)
                    .join(" | ");
                  return (
                    <TableRow key={`arr-${item.id}`}>
                      <TableCell>
                        <span className="font-semibold text-green-600">
                          Arrival
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPassengerNames(item.passengers)}
                      </TableCell>
                      <TableCell>{groupIdsStr || "—"}</TableCell>
                      <TableCell
                        className="max-w-[360px] truncate"
                        title={membersByGroupStr}
                      >
                        {membersByGroupStr || "—"}
                      </TableCell>
                      <TableCell>{item.vehicle_number || "N/A"}</TableCell>
                      <TableCell>{item.driver_name || "N/A"}</TableCell>
                      <TableCell>
                        {new Date(item.pickup_time).toLocaleString()}
                      </TableCell>
                      <TableCell>{(item as any).flight_number || ""}</TableCell>
                      <TableCell>{item.pickup_location}</TableCell>
                      <TableCell>{item.dropoff_location}</TableCell>
                    </TableRow>
                  );
                })}
                {departures.map((item) => {
                  const groupMap = new Map<number, string[]>();
                  (item.passengers || []).forEach((p) => {
                    const gid = (p as any).groupId as number | null | undefined;
                    if (gid && typeof gid === "number") {
                      const arr = groupMap.get(gid) || [];
                      if (!arr.includes(p.name)) arr.push(p.name);
                      groupMap.set(gid, arr);
                    }
                  });
                  const groupIdsStr = Array.from(groupMap.keys()).join(", ");
                  const membersByGroupStr = Array.from(groupMap.entries())
                    .map(([gid, names]) => `#${gid}: ${names.join(", ")}`)
                    .join(" | ");
                  return (
                    <TableRow key={`dep-${item.id}`}>
                      <TableCell>
                        <span className="font-semibold text-red-600">
                          Departure
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPassengerNames(item.passengers)}
                      </TableCell>
                      <TableCell>{groupIdsStr || "—"}</TableCell>
                      <TableCell
                        className="max-w-[360px] truncate"
                        title={membersByGroupStr}
                      >
                        {membersByGroupStr || "—"}
                      </TableCell>
                      <TableCell>{item.vehicle_number || "N/A"}</TableCell>
                      <TableCell>{item.driver_name || "N/A"}</TableCell>
                      <TableCell>
                        {new Date(item.pickup_time).toLocaleString()}
                      </TableCell>
                      <TableCell>{(item as any).flight_number || ""}</TableCell>
                      <TableCell>{item.pickup_location}</TableCell>
                      <TableCell>{item.dropoff_location}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              No transport scheduled for today.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-emerald-600" />
            Activities Today: {activities.length}
          </CardTitle>
          <CardDescription>
            Each activity includes a participant list with group info.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {activities.length > 0 ? (
            activities.map((a) => {
              const startTime = a.scheduled_time;
              const endTime = a.computed_end_time || "";
              const participantRows = (a.participants || []).map((p) => ({
                name: p.name,
                group: p.groupName || "",
                groupId: p.groupId ?? "",
                location: p.location || null,
              }));
              return (
                <div key={`act-${a.id}`} className="border rounded-md">
                  <div className="px-4 pt-4">
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">
                          Activity:
                        </span>{" "}
                        {a.activity_name || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">
                          Guide:
                        </span>{" "}
                        {a.guide_name || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">
                          Date:
                        </span>{" "}
                        {a.scheduled_date}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">
                          Start:
                        </span>{" "}
                        {startTime}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">
                          End:
                        </span>{" "}
                        {endTime || "—"}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">
                          Status:
                        </span>{" "}
                        {a.status || "scheduled"}
                      </div>
                    </div>
                    {a.notes ? (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Notes:</span> {a.notes}
                      </div>
                    ) : null}
                  </div>
                  <div className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Participant</TableHead>
                          <TableHead>Group</TableHead>
                          <TableHead>Group ID</TableHead>
                          <TableHead>Location</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {participantRows.length > 0 ? (
                          participantRows.map((row, idx) => (
                            <TableRow key={`act-${a.id}-p-${idx}`}>
                              <TableCell className="font-medium">
                                {row.name}
                              </TableCell>
                              <TableCell>{row.group}</TableCell>
                              <TableCell>{row.groupId || "—"}</TableCell>
                              <TableCell>{row.location || "NULL"}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="text-sm text-muted-foreground"
                            >
                              No participants for this activity.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">
              No activities scheduled for today.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hotel className="h-5 w-5 text-indigo-600" />
            Hotels (Check-ins: {hotelCheckIns.length}, Check-outs:{" "}
            {hotelCheckOuts.length})
          </CardTitle>
          <CardDescription>Guests checking in and out today.</CardDescription>
        </CardHeader>
        <CardContent>
          {hotelCheckIns.length + hotelCheckOuts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotelCheckIns.map((h) => (
                  <TableRow key={`hin-${h.id}`}>
                    <TableCell>
                      <span className="font-semibold text-green-600">
                        Check-in
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {h.guest_name}
                    </TableCell>
                    <TableCell>{h.group_name || ""}</TableCell>
                    <TableCell>{h.hotel_name || h.hotel_id}</TableCell>
                    <TableCell>{h.room_number || ""}</TableCell>
                    <TableCell>{h.check_in_date}</TableCell>
                    <TableCell>{h.check_out_date}</TableCell>
                  </TableRow>
                ))}
                {hotelCheckOuts.map((h) => (
                  <TableRow key={`hout-${h.id}`}>
                    <TableCell>
                      <span className="font-semibold text-red-600">
                        Check-out
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {h.guest_name}
                    </TableCell>
                    <TableCell>{h.group_name || ""}</TableCell>
                    <TableCell>{h.hotel_name || h.hotel_id}</TableCell>
                    <TableCell>{h.room_number || ""}</TableCell>
                    <TableCell>{h.check_in_date}</TableCell>
                    <TableCell>{h.check_out_date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hotel check-ins or check-outs today.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyActivityReport;
