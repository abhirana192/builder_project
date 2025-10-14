import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, Clock, Users, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DiscrepancyItem {
  groupName: string;
  groupId: number;
  memberName: string;
  memberDepartureDate: string;
  memberDepartureTime: string;
  transportDepartureTime: string;
  timeDifference: string;
  transportId: number;
}

export const ScheduleDiscrepancyAlert: React.FC = () => {
  const { toast } = useToast();
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyItem[]>([]);
  const [loading, setLoading] = useState(false);

  const checkForDiscrepancies = async () => {
    setLoading(true);
    try {
      // Fetch groups and transport schedules
      const [groupsResponse, transportResponse] = await Promise.all([
        fetch('/api/groups'),
        fetch('/api/transport/schedules')
      ]);

      const groups = await groupsResponse.json();
      const transports = await transportResponse.json();

      const foundDiscrepancies: DiscrepancyItem[] = [];

      // Check each group and its members against transport schedules
      groups.forEach((group: any) => {
        if (group.members && group.members.length > 0) {
          group.members.forEach((member: any) => {
            if (member.departure_date && member.departure_flight_time) {
              // Find corresponding transport schedule
              const transport = transports.find((t: any) => {
                if (!t.groups_data) return false;
                try {
                  const groupsData = JSON.parse(t.groups_data);
                  return groupsData.some((item: any) => 
                    (item.type === 'group' && item.id === group.id) ||
                    (item.type === 'individual' && item.id === member.id)
                  );
                } catch (error) {
                  return false;
                }
              });

              if (transport && transport.transport_type === 'airport_dropoff') {
                // Compare times
                const memberDateTime = new Date(`${member.departure_date}T${member.departure_flight_time}`);
                const transportDateTime = new Date(transport.pickup_time);
                
                const timeDiff = Math.abs(memberDateTime.getTime() - transportDateTime.getTime());
                const hoursDiff = timeDiff / (1000 * 60 * 60);

                // If there's more than 30 minutes difference, consider it a discrepancy
                if (hoursDiff > 0.5) {
                  foundDiscrepancies.push({
                    groupName: group.group_name,
                    groupId: group.id,
                    memberName: `${member.first_name} ${member.last_name}`,
                    memberDepartureDate: member.departure_date,
                    memberDepartureTime: member.departure_flight_time,
                    transportDepartureTime: transport.pickup_time,
                    timeDifference: `${hoursDiff.toFixed(1)} hours`,
                    transportId: transport.id
                  });
                }
              }
            }
          });
        }
      });

      setDiscrepancies(foundDiscrepancies);

      if (foundDiscrepancies.length > 0) {
        toast({
          title: "Schedule Discrepancies Found",
          description: `Found ${foundDiscrepancies.length} mismatches between guest departures and transport schedules`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "No Discrepancies",
          description: "All guest departure times match their transport schedules",
        });
      }

    } catch (error) {
      console.error('Error checking discrepancies:', error);
      toast({
        title: "Error",
        description: "Failed to check for schedule discrepancies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-check on mount
  useEffect(() => {
    checkForDiscrepancies();
  }, []);

  const fixDiscrepancy = async (discrepancy: DiscrepancyItem) => {
    try {
      // Update transport schedule to match guest departure time
      const memberDateTime = new Date(`${discrepancy.memberDepartureDate}T${discrepancy.memberDepartureTime}`);
      // Subtract 2 hours for airport pickup buffer
      const pickupTime = new Date(memberDateTime.getTime() - (2 * 60 * 60 * 1000));

      const response = await fetch(`/api/transport/schedules/${discrepancy.transportId}/pickup-location`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pickup_time: pickupTime.toISOString()
        }),
      });

      if (response.ok) {
        toast({
          title: "Schedule Updated",
          description: `Transport schedule updated for ${discrepancy.memberName}`,
        });
        // Re-check discrepancies
        checkForDiscrepancies();
      } else {
        throw new Error('Failed to update schedule');
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update transport schedule",
        variant: "destructive",
      });
    }
  };

  if (discrepancies.length === 0 && !loading) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            Schedule Discrepancies Detected ({discrepancies.length})
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={checkForDiscrepancies}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Check
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {discrepancies.map((discrepancy, index) => (
            <div key={index} className="p-3 border border-orange-200 rounded-lg bg-white">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {discrepancy.groupName} - {discrepancy.memberName}
                  </h4>
                  <div className="text-sm space-y-1 mt-2">
                    <div className="flex items-center gap-2 text-green-700">
                      <Calendar className="h-3 w-3" />
                      <span>Guest Departure: {new Date(`${discrepancy.memberDepartureDate}T${discrepancy.memberDepartureTime}`).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-orange-700">
                      <Clock className="h-3 w-3" />
                      <span>Transport Pickup: {new Date(discrepancy.transportDepartureTime).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Badge variant="destructive" className="mb-2">
                    {discrepancy.timeDifference} difference
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fixDiscrepancy(discrepancy)}
                    className="text-xs"
                  >
                    Auto-Fix Schedule
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 border border-blue-200 rounded-lg bg-blue-50">
          <h5 className="font-medium text-blue-800 mb-2">How to Fix Discrepancies:</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Auto-Fix:</strong> Click "Auto-Fix Schedule" to align transport pickup with guest departure</li>
            <li>• <strong>Manual Fix:</strong> Go to Transport Management → Edit the schedule manually</li>
            <li>• <strong>Update Guest:</strong> Go to Group Bookings → Edit guest departure time</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
