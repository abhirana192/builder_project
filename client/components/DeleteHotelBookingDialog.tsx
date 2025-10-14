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
import { Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeleteHotelBookingDialogProps {
  bookingId: number;
  onDelete: () => void;
}

export const DeleteHotelBookingDialog: React.FC<DeleteHotelBookingDialogProps> = ({
  bookingId,
  onDelete,
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/hotel-bookings/${bookingId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Booking Deleted",
          description: "Hotel booking deleted successfully.",
        });
        onDelete();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete hotel booking.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting hotel booking:", error);
      toast({
        title: "Error",
        description: "Failed to delete hotel booking.",
        variant: "destructive",
      });
    } finally {
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the hotel
            booking with ID {bookingId}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
