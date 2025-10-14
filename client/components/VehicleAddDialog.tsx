import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VehicleAddDialogProps {
  onVehicleAdded: () => void;
}

export const VehicleAddDialog: React.FC<VehicleAddDialogProps> = ({
  onVehicleAdded,
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_number: "",
    vehicle_type: "",
    make: "",
    model: "",
    year: "",
    capacity: "",
    license_plate: "",
    last_maintenance: "",
    next_maintenance: "",
    insurance_expiry: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          year: formData.year ? parseInt(formData.year) : null,
          capacity: parseInt(formData.capacity),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Vehicle Added",
          description: `Successfully added vehicle ${result.vehicle.vehicle_number}`,
        });
        
        // Reset form and close dialog
        setFormData({
          vehicle_number: "",
          vehicle_type: "",
          make: "",
          model: "",
          year: "",
          capacity: "",
          license_plate: "",
          last_maintenance: "",
          next_maintenance: "",
          insurance_expiry: "",
          notes: "",
        });
        setOpen(false);
        onVehicleAdded();
      } else {
        const error = await response.json();
        toast({
          title: "Add Failed",
          description: error.error || "Failed to add vehicle",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding vehicle:", error);
      toast({
        title: "Error",
        description: "An error occurred while adding the vehicle",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
          <DialogDescription>
            Enter the details for the new vehicle to add to your fleet.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle_number">Vehicle Number *</Label>
              <Input
                id="vehicle_number"
                value={formData.vehicle_number}
                onChange={(e) => handleInputChange("vehicle_number", e.target.value)}
                placeholder="e.g., VH-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle_type">Vehicle Type *</Label>
              <Select 
                value={formData.vehicle_type} 
                onValueChange={(value) => handleInputChange("vehicle_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sedan">Sedan</SelectItem>
                  <SelectItem value="SUV">SUV</SelectItem>
                  <SelectItem value="Van">Van</SelectItem>
                  <SelectItem value="Bus">Bus</SelectItem>
                  <SelectItem value="Truck">Truck</SelectItem>
                  <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                value={formData.make}
                onChange={(e) => handleInputChange("make", e.target.value)}
                placeholder="e.g., Toyota"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
                placeholder="e.g., Corolla"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => handleInputChange("year", e.target.value)}
                placeholder="e.g., 2023"
                min="1900"
                max="2030"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => handleInputChange("capacity", e.target.value)}
                placeholder="e.g., 4"
                min="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_plate">License Plate *</Label>
              <Input
                id="license_plate"
                value={formData.license_plate}
                onChange={(e) => handleInputChange("license_plate", e.target.value)}
                placeholder="e.g., ABC-1234"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_maintenance">Last Maintenance</Label>
              <Input
                id="last_maintenance"
                type="date"
                value={formData.last_maintenance}
                onChange={(e) => handleInputChange("last_maintenance", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_maintenance">Next Maintenance</Label>
              <Input
                id="next_maintenance"
                type="date"
                value={formData.next_maintenance}
                onChange={(e) => handleInputChange("next_maintenance", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insurance_expiry">Insurance Expiry</Label>
              <Input
                id="insurance_expiry"
                type="date"
                value={formData.insurance_expiry}
                onChange={(e) => handleInputChange("insurance_expiry", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Additional notes about the vehicle..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Vehicle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
