import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, Calendar, Users, MapPin, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TransportSchedule {
  id: number;
  transport_type: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  passenger_count: number;
  vehicle_number?: string;
  groups?: any[];
}

interface DeleteScheduleDialogProps {
  schedule: TransportSchedule;
  onDeleteSuccess: () => void;
  children?: React.ReactNode;
}

export const DeleteScheduleDialog: React.FC<DeleteScheduleDialogProps> = ({
  schedule,
  onDeleteSuccess,
  children,
}) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/transport/schedules/${schedule.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "Schedule Deleted",
          description: "Transport schedule deleted successfully",
        });
        onDeleteSuccess();
      } else {
        throw new Error('Failed to delete schedule');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete transport schedule",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTransportType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  const getPassengerNames = () => {
    if (schedule.groups && schedule.groups.length > 0) {
      return schedule.groups.map(g => g.name || g.group_name || 'Unknown').join(', ');
    }
    return 'Unknown passengers';
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children || (
          <Button
            variant="destructive"
            size="sm"
            title="Delete Schedule"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-red-50 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">Delete Transport Schedule</div>
              <div className="text-sm text-gray-500 font-normal">This action cannot be undone</div>
            </div>
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to delete this transport schedule? This will permanently remove 
                the schedule and cannot be undone.
              </p>
              
              {/* Schedule Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Schedule Details
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Type:</span>
                    <span>{formatTransportType(schedule.transport_type)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Time:</span>
                    <span>{formatDateTime(schedule.pickup_time)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Passengers:</span>
                    <span>{schedule.passenger_count} people</span>
                  </div>
                  
                  {schedule.vehicle_number && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Vehicle:</span>
                      <span>{schedule.vehicle_number}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <span className="font-medium">Route:</span>
                      <div className="text-gray-600">
                        {schedule.pickup_location} → {schedule.dropoff_location}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <span className="font-medium">Passengers:</span>
                      <div className="text-gray-600">{getPassengerNames()}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Warning */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Warning</span>
                </div>
                <p className="text-red-700 text-sm mt-1">
                  Deleting this schedule will remove all associated transport arrangements. 
                  Make sure to notify affected passengers and drivers.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Schedule
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
