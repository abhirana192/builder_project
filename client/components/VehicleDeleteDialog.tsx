import React from "react";
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
import { XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VehicleDeleteDialogProps {
  vehicleId: number;
  vehicleName: string;
  onDeleteSuccess: () => void;
}

export const VehicleDeleteDialog: React.FC<VehicleDeleteDialogProps> = ({
  vehicleId,
  vehicleName,
  onDeleteSuccess,
}) => {
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Vehicle Deleted",
          description: `Successfully deleted ${result.vehicleName}`,
        });
        onDeleteSuccess();
      } else {
        const error = await response.json();
        toast({
          title: "Delete Failed",
          description: error.error || "Failed to delete vehicle",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the vehicle",
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          title="Delete Vehicle"
        >
          <XCircle className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Vehicle
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete vehicle <strong>"{vehicleName}"</strong>?
            <br />
            <br />
            This action cannot be undone and will permanently remove the vehicle from your fleet.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Vehicle
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
