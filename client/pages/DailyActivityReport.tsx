import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, Plane, AlertTriangle, CalendarCheck, Hotel, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import { fetchJSON } from '@/lib/fetch-utils';

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
}

const DailyActivityReport: React.FC = () => {
  const [arrivals, setArrivals] = useState<TransportSchedule[]>([]);
  const [departures, setDepartures] = useState<TransportSchedule[]>([]);
  const [activities, setActivities] = useState<ActivityInstance[]>([]);
  const [hotelCheckIns, setHotelCheckIns] = useState<HotelBookingToday[]>([]);
  const [hotelCheckOuts, setHotelCheckOuts] = useState<HotelBookingToday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState<string>('00:00');
  const [endTime, setEndTime] = useState<string>('23:59');

  // Group bookings report state
  const [groupStart, setGroupStart] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [groupEnd, setGroupEnd] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [groupStatus, setGroupStatus] = useState<string>('active');
  const [groupReport, setGroupReport] = useState<GroupReportItem[]>([]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDate) params.set('date', selectedDate);
      if (startTime && endTime) {
        params.set('startTime', startTime);
        params.set('endTime', endTime);
      }

      const [arrivalsData, departuresData, activitiesData, checkInsData, checkOutsData, groupReportData] = await Promise.all([
        fetchJSON(`/api/dashboard/arrivals?${params.toString()}`),
        fetchJSON(`/api/dashboard/departures?${params.toString()}`),
        fetchJSON(`/api/activities/today?${params.toString()}`).catch(() => []),
        fetchJSON(`/api/hotels/checkins/today?${params.toString()}`).catch(() => []),
        fetchJSON(`/api/hotels/checkouts/today?${params.toString()}`).catch(() => []),
        fetchJSON(`/api/reports/group-bookings?start=${groupStart}&end=${groupEnd}&status=${encodeURIComponent(groupStatus)}`).catch(() => []),
      ]);

      setArrivals(Array.isArray(arrivalsData) ? arrivalsData : []);
      setDepartures(Array.isArray(departuresData) ? departuresData : []);
      setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      setHotelCheckIns(Array.isArray(checkInsData) ? checkInsData : []);
      setHotelCheckOuts(Array.isArray(checkOutsData) ? checkOutsData : []);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching report data.';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatPassengerNames = (passengers: TransportSchedule['passengers']) => {
    if (!Array.isArray(passengers) || passengers.length === 0) return 'N/A';
    return passengers.map(p => `${p.name} ${p.groupName ? `(${p.groupName})` : ''}`).join(', ');
  };

  const handleExportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const transportArrivals = arrivals.map(item => ({
      Type: 'Arrival',
      Passengers: formatPassengerNames(item.passengers),
      Vehicle: item.vehicle_number || 'N/A',
      Driver: item.driver_name || 'N/A',
      'Pickup Time': new Date(item.pickup_time).toLocaleString(),
      From: item.pickup_location,
      To: item.dropoff_location,
    }));
    const transportDepartures = departures.map(item => ({
      Type: 'Departure',
      Passengers: formatPassengerNames(item.passengers),
      Vehicle: item.vehicle_number || 'N/A',
      Driver: item.driver_name || 'N/A',
      'Pickup Time': new Date(item.pickup_time).toLocaleString(),
      From: item.pickup_location,
      To: item.dropoff_location,
    }));

    const activitiesSheet = activities.map(a => ({
      Activity: a.activity_name || 'N/A',
      Guide: a.guide_name || 'N/A',
      Date: a.scheduled_date,
      Time: a.scheduled_time,
      Status: a.status || 'scheduled',
      Notes: a.notes || '',
    }));

    const hotelCheckInsSheet = hotelCheckIns.map(h => ({
      Type: 'Check-in',
      Guest: h.guest_name,
      Group: h.group_name || '',
      Hotel: h.hotel_name || h.hotel_id,
      Room: h.room_number || '',
      'Check-in Date': h.check_in_date,
      'Check-out Date': h.check_out_date,
      Guests: h.guests_count || 1,
    }));

    const hotelCheckOutsSheet = hotelCheckOuts.map(h => ({
      Type: 'Check-out',
      Guest: h.guest_name,
      Group: h.group_name || '',
      Hotel: h.hotel_name || h.hotel_id,
      Room: h.room_number || '',
      'Check-in Date': h.check_in_date,
      'Check-out Date': h.check_out_date,
      Guests: h.guests_count || 1,
    }));

    const sheets = [
      { name: 'Transport Arrivals', data: transportArrivals },
      { name: 'Transport Departures', data: transportDepartures },
      { name: 'Activities Today', data: activitiesSheet },
      { name: 'Hotel Check-ins', data: hotelCheckInsSheet },
      { name: 'Hotel Check-outs', data: hotelCheckOutsSheet },
    ];

    sheets.forEach(({ name, data }) => {
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, name);
    });

    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Jiguang_Tour_Daily_Report_${today}.xlsx`);
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
          <AlertDescription>{error} Please try refreshing the page.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Daily Activity Report</h1>
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
              <label className="text-xs text-muted-foreground mb-1">Start time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-1">End time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-background"
              />
            </div>
            <Button onClick={fetchReportData} variant="secondary">Apply</Button>
          </div>
        </div>
        <Button onClick={handleExportToExcel} disabled={loading || (arrivals.length + departures.length + activities.length + hotelCheckIns.length + hotelCheckOuts.length === 0)}>
          <Download className="mr-2 h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-blue-600" />
            Transport (Arrivals + Departures): {arrivals.length + departures.length}
          </CardTitle>
          <CardDescription>All transport schedules for guests arriving and departing today.</CardDescription>
        </CardHeader>
        <CardContent>
          {(arrivals.length > 0 || departures.length > 0) ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Passenger(s)</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Pickup Time</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arrivals.map((item) => (
                  <TableRow key={`arr-${item.id}`}>
                    <TableCell><span className="font-semibold text-green-600">Arrival</span></TableCell>
                    <TableCell className="font-medium">{formatPassengerNames(item.passengers)}</TableCell>
                    <TableCell>{item.vehicle_number || 'N/A'}</TableCell>
                    <TableCell>{item.driver_name || 'N/A'}</TableCell>
                    <TableCell>{new Date(item.pickup_time).toLocaleString()}</TableCell>
                    <TableCell>{item.pickup_location}</TableCell>
                    <TableCell>{item.dropoff_location}</TableCell>
                  </TableRow>
                ))}
                {departures.map((item) => (
                  <TableRow key={`dep-${item.id}`}>
                    <TableCell><span className="font-semibold text-red-600">Departure</span></TableCell>
                    <TableCell className="font-medium">{formatPassengerNames(item.passengers)}</TableCell>
                    <TableCell>{item.vehicle_number || 'N/A'}</TableCell>
                    <TableCell>{item.driver_name || 'N/A'}</TableCell>
                    <TableCell>{new Date(item.pickup_time).toLocaleString()}</TableCell>
                    <TableCell>{item.pickup_location}</TableCell>
                    <TableCell>{item.dropoff_location}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No transport scheduled for today.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-emerald-600" />
            Activities Today: {activities.length}
          </CardTitle>
          <CardDescription>All activities scheduled for today.</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Guide</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((a) => (
                  <TableRow key={`act-${a.id}`}>
                    <TableCell className="font-medium">{a.activity_name || 'N/A'}</TableCell>
                    <TableCell>{a.guide_name || 'N/A'}</TableCell>
                    <TableCell>{a.scheduled_date}</TableCell>
                    <TableCell>{a.scheduled_time}</TableCell>
                    <TableCell>{a.status || 'scheduled'}</TableCell>
                    <TableCell>{a.notes || ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No activities scheduled for today.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hotel className="h-5 w-5 text-indigo-600" />
            Hotels (Check-ins: {hotelCheckIns.length}, Check-outs: {hotelCheckOuts.length})
          </CardTitle>
          <CardDescription>Guests checking in and out today.</CardDescription>
        </CardHeader>
        <CardContent>
          {(hotelCheckIns.length + hotelCheckOuts.length) > 0 ? (
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
                {hotelCheckIns.map(h => (
                  <TableRow key={`hin-${h.id}`}>
                    <TableCell><span className="font-semibold text-green-600">Check-in</span></TableCell>
                    <TableCell className="font-medium">{h.guest_name}</TableCell>
                    <TableCell>{h.group_name || ''}</TableCell>
                    <TableCell>{h.hotel_name || h.hotel_id}</TableCell>
                    <TableCell>{h.room_number || ''}</TableCell>
                    <TableCell>{h.check_in_date}</TableCell>
                    <TableCell>{h.check_out_date}</TableCell>
                  </TableRow>
                ))}
                {hotelCheckOuts.map(h => (
                  <TableRow key={`hout-${h.id}`}>
                    <TableCell><span className="font-semibold text-red-600">Check-out</span></TableCell>
                    <TableCell className="font-medium">{h.guest_name}</TableCell>
                    <TableCell>{h.group_name || ''}</TableCell>
                    <TableCell>{h.hotel_name || h.hotel_id}</TableCell>
                    <TableCell>{h.room_number || ''}</TableCell>
                    <TableCell>{h.check_in_date}</TableCell>
                    <TableCell>{h.check_out_date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No hotel check-ins or check-outs today.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyActivityReport;
