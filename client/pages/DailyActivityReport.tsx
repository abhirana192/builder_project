import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, Plane, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

// This interface should match the data from your API
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

const DailyActivityReport: React.FC = () => {
  const [arrivals, setArrivals] = useState<TransportSchedule[]>([]);
  const [departures, setDepartures] = useState<TransportSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const [arrivalsResponse, departuresResponse] = await Promise.all([
          fetch('/api/dashboard/arrivals'),
          fetch('/api/dashboard/departures')
        ]);

        if (!arrivalsResponse.ok || !departuresResponse.ok) {
          throw new Error('Failed to fetch arrival or departure data');
        }

        const arrivalsData: TransportSchedule[] = await arrivalsResponse.json();
        const departuresData: TransportSchedule[] = await departuresResponse.json();

        // Ensure that we always have an array, even if the API response is malformed.
        setArrivals(Array.isArray(arrivalsData) ? arrivalsData : []);
        setDepartures(Array.isArray(departuresData) ? departuresData : []);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching report data.';
        setError(errorMessage);
        setArrivals([]);
        setDepartures([]);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, []);

  const formatPassengerNames = (passengers: TransportSchedule['passengers']) => {
    // Added Array.isArray check for more robustness against unexpected API data.
    if (!Array.isArray(passengers) || passengers.length === 0) return 'N/A';
    return passengers.map(p => `${p.name} ${p.groupName ? `(${p.groupName})` : ''}`).join(', ');
  };

  const handleExportToExcel = () => {
    const combinedData = [
      ...arrivals.map(item => ({
        'Type': 'Arrival',
        'Passengers': formatPassengerNames(item.passengers),
        'Vehicle': item.vehicle_number || 'N/A',
        'Driver': item.driver_name || 'N/A',
        'Pickup Time': new Date(item.pickup_time).toLocaleString(),
        'From': item.pickup_location,
        'To': item.dropoff_location,
      })),
      ...departures.map(item => ({
        'Type': 'Departure',
        'Passengers': formatPassengerNames(item.passengers),
        'Vehicle': item.vehicle_number || 'N/A',
        'Driver': item.driver_name || 'N/A',
        'Pickup Time': new Date(item.pickup_time).toLocaleString(),
        'From': item.pickup_location,
        'To': item.dropoff_location,
      })),
    ];

    const wb = XLSX.utils['book_new']();
    const ws = XLSX.utils['json_to_sheet'](combinedData);
    XLSX.utils['book_append_sheet'](wb, ws, "Daily Activity");
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Daily Activity Report</h1>
        <Button onClick={handleExportToExcel} disabled={loading || (arrivals.length === 0 && departures.length === 0)}>
          <Download className="mr-2 h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-blue-600" />
            Today's Activities ({arrivals.length + departures.length})
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
            <p className="text-sm text-muted-foreground">No activities scheduled for today.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyActivityReport;
