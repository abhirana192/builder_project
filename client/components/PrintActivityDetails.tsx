import React from 'react';
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
  Calendar,
  Clock,
  Users,
  Phone,
  MapPin,
  Printer,
  User,
  CalendarDays,
  Mountain
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ActivityInstance {
  id: number;
  activity_id: number;
  activity_name: string;
  booking_reference: string;
  scheduled_date: string;
  scheduled_time: string;
  guide_name?: string;
  guide_id?: number;
  status: string;
  weather_conditions?: string;
  attendance_count: number;
  max_participants: number;
  notes?: string;
  location?: string;
}

// Assuming AssignedParticipant is defined elsewhere or can be simplified for this context
// For now, we'll use a simplified version or import if available
// import type { AssignedParticipant } from '../pages/Activities'; // If this import is valid

interface PrintActivityDetailsProps {
  activities: ActivityInstance[]; // Changed from instance to activities array
  children: React.ReactNode;
}

const formatDateTime = (date: string, time: string) => {
  return `${new Date(date).toLocaleDateString()} at ${time}`;
};

const PrintActivityDetails: React.FC<PrintActivityDetailsProps> = ({ activities, children }) => {
  const { toast } = useToast();

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Print Failed",
        description: "Please allow pop-ups to print the activity list",
        variant: "destructive",
      });
      return;
    }

    const currentDate = new Date().toLocaleDateString();
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Today's Activities - ${currentDate}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .activity-item { margin-bottom: 20px; padding: 15px; border: 1px solid #ccc; border-radius: 5px; }
            .activity-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .details { margin: 5px 0; }
            .info-block { background-color: #f0f8ff; padding: 10px; border-radius: 3px; margin: 10px 0; }
            .status { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 12px; }
            .status-scheduled { background-color: #e8f5e8; color: #2d5a2d; }
            .status-in_progress { background-color: #fffbe6; color: #8a6d3b; }
            .status-completed { background-color: #dff0d8; color: #3c763d; }
            .status-cancelled { background-color: #f2dede; color: #a94442; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>JIGUANG TOUR - Today's Activities</h1>
            <p>Date: ${currentDate} | Total Activities: ${activities.length}</p>
            <p>Prepared for Guides & Staff</p>
          </div>
          
          ${activities.map(activity => `
            <div class="activity-item">
              <div class="activity-name">${activity.activity_name}</div>
              <div class="details"><strong>Scheduled:</strong> ${formatDateTime(activity.scheduled_date, activity.scheduled_time)}</div>
              ${activity.location ? `<div class="details"><strong>Location:</strong> ${activity.location}</div>` : ''}
              <div class="details"><strong>Guide:</strong> ${activity.guide_name || 'No guide assigned'}</div>
              <div class="details"><strong>Participants:</strong> ${activity.attendance_count} / ${activity.max_participants}</div>
              ${activity.booking_reference ? `<div class="details"><strong>Booking Ref:</strong> ${activity.booking_reference}</div>` : ''}

              <div class="info-block">
                <div><strong>Status:</strong> <span class="status status-${activity.status.replace(' ', '_')}">${activity.status.toUpperCase()}</span></div>
                ${activity.weather_conditions ? `<div><strong>Weather:</strong> ${activity.weather_conditions}</div>` : ''}
                ${activity.notes ? `<div><strong>Notes:</strong> ${activity.notes}</div>` : ''}
              </div>

              <div style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px; color: #666;">
                <strong>Guide Signature:</strong> ___________________________________
              </div>
            </div>
          `).join('')}
          
          <div style="margin-top: 30px; border-top: 2px solid #000; padding-top: 10px; text-align: center; color: #666;">
            <p>Printed on: ${new Date().toLocaleString()}</p>
            <p>Manager Signature: _________________________ Time: _________</p>
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
      description: "Activity list has been sent to printer",
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
              <Calendar className="mr-2 h-5 w-5 text-green-600" />
              Today's Activities ({activities.length})
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print for Guides
            </Button>
          </DialogTitle>
          <DialogDescription>
            Detailed activity information for today's scheduled tours.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="mx-auto h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg">No activities scheduled for today</p>
            </div>
          ) : (
            activities.map((activity) => (
              <Card key={activity.id} className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mountain className="h-5 w-5" />
                      {activity.activity_name}
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {activity.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Time:</span>
                        <span>{activity.scheduled_time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Location:</span>
                        <span>{activity.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Guide:</span>
                        <span>{activity.guide_name || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-800">Participants</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div><strong>Attending:</strong> {activity.attendance_count}</div>
                          <div><strong>Max Capacity:</strong> {activity.max_participants}</div>
                          {activity.booking_reference && (
                            <div><strong>Booking Ref:</strong> {activity.booking_reference}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      <span>Scheduled for: {new Date(activity.scheduled_date).toLocaleDateString()}</span>
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

export default PrintActivityDetails;
