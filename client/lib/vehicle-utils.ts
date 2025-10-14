export const handleDeleteVehicle = async (
  vehicleId: number, 
  vehicleName: string,
  toast: any,
  fetchData: () => void
) => {
  if (!window.confirm(`Are you sure you want to delete vehicle "${vehicleName}"? This action cannot be undone.`)) {
    return;
  }

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
      fetchData(); // Refresh the vehicle list
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
