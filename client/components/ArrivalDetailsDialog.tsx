import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plane,
  Clock,
  Users,
  Phone,
  MapPin,
  Printer,
  User,
  CalendarDays,
  Car
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TransportSchedule {
  id: number;
  transport_type: string;
  activity_name?: string;
  vehicle_id: number;
  driver_id?: number;
  pickup_location: string;
  pickup_time: string;
  dropoff_location: string;
  estimated_dropoff_time?: string;
  passenger_count: number;
  groups_data: string;
  status: string;
  vehicle_number?: string;
  driver_name?: string;
  passengers?: Array<{
    name: string;
    type: string;
    id: number;
    groupName?: string;
  }>;
}

interface ArrivalDetailsDialogProps {
  arrivals: TransportSchedule[];
  children: React.ReactNode;
}

export const ArrivalDetailsDialog: React.FC<ArrivalDetailsDialogProps> = ({
  arrivals,
  children,
}) => {
  const { toast } = useToast();
  const [timeUntilArrivals, setTimeUntilArrivals] = useState<{[key: number]: string}>({});

  // Calculate time until arrival for each group
  useEffect(() => {
    const calculateTimeUntil = () => {
      const newTimes: {[key: number]: string} = {};
      
      arrivals.forEach(arrival => {
        if (arrival.pickup_time) {
          const pickupDateTime = new Date(arrival.pickup_time);
          const now = new Date();
          const timeDiff = pickupDateTime.getTime() - now.getTime();

          if (timeDiff > 0) {
            const hours = Math.floor(timeDiff / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

            if (hours > 0) {
              newTimes[arrival.id] = `${hours}h ${minutes}m`;
            } else {
              newTimes[arrival.id] = `${minutes}m`;
            }
          } else {
            newTimes[arrival.id] = "Pickup Time";
          }
        } else {
          newTimes[arrival.id] = "Time TBD";
        }
      });
      
      setTimeUntilArrivals(newTimes);
    };

    calculateTimeUntil();
    const interval = setInterval(calculateTimeUntil, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [arrivals]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Print Failed",
        description: "Please allow pop-ups to print the arrival list",
        variant: "destructive",
      });
      return;
    }

    const currentDate = new Date().toLocaleDateString();
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Today's Arrivals - ${currentDate}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .arrival-item { margin-bottom: 20px; padding: 15px; border: 1px solid #ccc; border-radius: 5px; }
            .group-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .details { margin: 5px 0; }
            .flight-info { background-color: #f0f8ff; padding: 10px; border-radius: 3px; margin: 10px 0; }
            .status { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 12px; }
            .status-active { background-color: #e8f5e8; color: #2d5a2d; }
            .countdown { font-weight: bold; color: #0066cc; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>JIGUANG TOUR - Today's Arrivals</h1>
            <p>Date: ${currentDate} | Total Groups: ${arrivals.length}</p>
            <p>Prepared for Driver Staff</p>
          </div>
          
          ${arrivals.map(arrival => `
            <div class="arrival-item">
              <div class="group-name">Pickup #${arrival.id} - ${arrival.transport_type.replace('_', ' ').toUpperCase()}</div>
              <div class="details"><strong>Passengers:</strong> ${arrival.passengers?.map(p => p.name).join(', ') || 'TBD'}</div>
              <div class="details"><strong>Passenger Count:</strong> ${arrival.passenger_count} people</div>
              <div class="details"><strong>Vehicle:</strong> ${arrival.vehicle_number || `Vehicle ID ${arrival.vehicle_id}`}</div>
              ${arrival.driver_name ? `<div class="details"><strong>Driver:</strong> ${arrival.driver_name}</div>` : ''}

              <div class="flight-info">
                <div><strong>Pickup Time:</strong> ${new Date(arrival.pickup_time).toLocaleString()}</div>
                <div><strong>Pickup Location:</strong> ${arrival.pickup_location}</div>
                <div><strong>Drop-off Location:</strong> ${arrival.dropoff_location}</div>
                <div class="countdown"><strong>Pickup in:</strong> ${timeUntilArrivals[arrival.id] || 'TBD'}</div>
              </div>

              <div class="details">
                <strong>Status:</strong>
                <span class="status status-${arrival.status}">${arrival.status.toUpperCase()}</span>
              </div>

              <div style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px; color: #666;">
                <strong>Driver Notes:</strong> ___________________________________
              </div>
            </div>
          `).join('')}
          
          <div style="margin-top: 30px; border-top: 2px solid #000; padding-top: 10px; text-align: center; color: #666;">
            <p>Printed on: ${new Date().toLocaleString()}</p>
            <p>Driver Signature: _________________________ Time: _________</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();

    toast({
      title: "Print Ready",
      description: "Arrival list has been sent to printer",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Plane className="mr-2 h-5 w-5 text-blue-600" />
              Today's Arrivals ({arrivals.length})
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print for Drivers
            </Button>
          </DialogTitle>
          <DialogDescription>
            Detailed arrival information with countdown timers and contact details
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {arrivals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Plane className="mx-auto h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg">No arrivals scheduled for today</p>
            </div>
          ) : (
            arrivals.map((arrival) => (
              <Card key={arrival.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Pickup #{arrival.id} - {arrival.transport_type.replace('_', ' ')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {arrival.status}
                      </Badge>
                      {timeUntilArrivals[arrival.id] && (
                        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                          <Clock className="w-3 h-3 mr-1" />
                          {timeUntilArrivals[arrival.id] === "Pickup Time" ? "Pickup Time" : `Pickup in ${timeUntilArrivals[arrival.id]}`}
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Passengers:</span>
                        <span>{arrival.passengers?.map(p => `${p.name} ${p.groupName ? `(${p.groupName})` : ''}`).join(', ') || 'TBD'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Count:</span>
                        <span>{arrival.passenger_count} people</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Vehicle:</span>
                        <span>{arrival.vehicle_number || `Vehicle ID ${arrival.vehicle_id}`}</span>
                      </div>
                      {arrival.driver_name && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Driver:</span>
                          <span>{arrival.driver_name}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-800">Schedule Information</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div><strong>Pickup Time:</strong> {new Date(arrival.pickup_time).toLocaleString()}</div>
                          <div><strong>From:</strong> {arrival.pickup_location}</div>
                          <div><strong>To:</strong> {arrival.dropoff_location}</div>
                          {arrival.estimated_dropoff_time && (
                            <div><strong>Est. Arrival:</strong> {new Date(arrival.estimated_dropoff_time).toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      <span>Last updated: {new Date().toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
