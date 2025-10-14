import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Package, 
  Shield, 
  Radio, 
  Heart, 
  Binoculars, 
  Hammer, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  User
} from "lucide-react";

interface Equipment {
  id: number;
  name: string;
  category: string;
  description?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_price?: number;
  condition_status: string;
  last_maintenance?: string;
  next_maintenance?: string;
  location?: string;
  assigned_to_staff_id?: number;
  is_available: boolean;
  notes?: string;
}

interface EquipmentAssignment {
  id: number;
  equipment_name: string;
  booking_reference?: string;
  activity_name?: string;
  assigned_date: string;
  returned_date?: string;
  assigned_by: string;
  condition_out?: string;
  condition_returned?: string;
  notes?: string;
}

export default function Equipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/equipment');
      const equipmentData = await response.json();
      setEquipment(equipmentData);

      // Mock assignments data
      setAssignments([
        {
          id: 1,
          equipment_name: "Crampons Set 1",
          booking_reference: "TF-2024-006",
          activity_name: "Glacier Hike",
          assigned_date: "2024-03-18",
          assigned_by: "Magnus Thor",
          condition_out: "excellent"
        },
        {
          id: 2,
          equipment_name: "Safety Helmet 1",
          booking_reference: "TF-2024-006",
          activity_name: "Glacier Hike",
          assigned_date: "2024-03-18",
          assigned_by: "Magnus Thor",
          condition_out: "excellent"
        }
      ]);
    } catch (error) {
      console.error('Error fetching equipment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'default';
      case 'good': return 'secondary';
      case 'fair': return 'outline';
      case 'poor': return 'destructive';
      case 'out_of_service': return 'destructive';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'safety': return Shield;
      case 'communication': return Radio;
      case 'medical': return Heart;
      case 'observation': return Binoculars;
      default: return Package;
    }
  };

  const getStatusIcon = (isAvailable: boolean, condition: string) => {
    if (condition === 'out_of_service') return XCircle;
    if (!isAvailable) return AlertTriangle;
    return CheckCircle;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const updateEquipmentStatus = async (equipmentId: number, isAvailable: boolean, condition: string) => {
    try {
      const response = await fetch(`/api/equipment/${equipmentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_available: isAvailable, condition_status: condition }),
      });
      
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error updating equipment status:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading equipment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Equipment Management</h1>
          <p className="text-muted-foreground">
            Track and manage tour equipment, maintenance schedules, and inventory
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Equipment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Equipment</DialogTitle>
              <DialogDescription>
                Register new equipment item to the inventory
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Equipment Name *</Label>
                  <Input id="name" placeholder="Crampons Set" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="communication">Communication</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="observation">Observation</SelectItem>
                      <SelectItem value="transportation">Transportation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Equipment description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serial">Serial Number</Label>
                  <Input id="serial" placeholder="CR-001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="Equipment Room A" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button>Add Equipment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{equipment.length}</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{equipment.filter(e => e.is_available).length}</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{equipment.filter(e => !e.is_available).length}</p>
                <p className="text-sm text-muted-foreground">In Use</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Hammer className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{equipment.filter(e => e.condition_status === 'poor' || e.condition_status === 'out_of_service').length}</p>
                <p className="text-sm text-muted-foreground">Needs Service</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search equipment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="observation">Observation</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in_use">In Use</SelectItem>
                  <SelectItem value="maintenance">Needs Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment List */}
      <div className="grid gap-4">
        {equipment.map((item) => {
          const CategoryIcon = getCategoryIcon(item.category);
          const StatusIcon = getStatusIcon(item.is_available, item.condition_status);
          const needsMaintenance = item.next_maintenance && new Date(item.next_maintenance) <= new Date();
          
          return (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                      <CategoryIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-foreground">{item.name}</h3>
                        <Badge variant="outline">{item.category}</Badge>
                        <Badge variant={getConditionColor(item.condition_status)}>
                          {item.condition_status}
                        </Badge>
                        {!item.is_available && (
                          <Badge variant="secondary">In Use</Badge>
                        )}
                        {needsMaintenance && (
                          <Badge variant="destructive">Maintenance Due</Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        {item.serial_number && (
                          <div>Serial: {item.serial_number}</div>
                        )}
                        {item.location && (
                          <div className="flex items-center">
                            <MapPin className="mr-1 h-4 w-4" />
                            {item.location}
                          </div>
                        )}
                        {item.purchase_date && (
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4" />
                            Purchased: {formatDate(item.purchase_date)}
                          </div>
                        )}
                        {item.last_maintenance && (
                          <div>Last service: {formatDate(item.last_maintenance)}</div>
                        )}
                        {item.next_maintenance && (
                          <div>Next service: {formatDate(item.next_maintenance)}</div>
                        )}
                        {item.purchase_price && (
                          <div>Value: ${item.purchase_price}</div>
                        )}
                      </div>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">{item.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusIcon className="h-6 w-6 text-muted-foreground" />
                      <Select 
                        onValueChange={(value) => {
                          const [availability, condition] = value.split(':');
                          updateEquipmentStatus(item.id, availability === 'true', condition);
                        }}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Update" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true:excellent">Available - Excellent</SelectItem>
                          <SelectItem value="true:good">Available - Good</SelectItem>
                          <SelectItem value="false:good">In Use</SelectItem>
                          <SelectItem value="true:fair">Available - Fair</SelectItem>
                          <SelectItem value="true:poor">Needs Repair</SelectItem>
                          <SelectItem value="false:out_of_service">Out of Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {equipment.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No equipment found</h3>
            <p className="text-muted-foreground">Add equipment to your inventory to get started</p>
          </CardContent>
        </Card>
      )}

      {/* Recent Assignments */}
      {assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Equipment Assignments</CardTitle>
            <CardDescription>Latest equipment checkouts and returns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <div className="font-medium">{assignment.equipment_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {assignment.booking_reference} • {assignment.activity_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Assigned by {assignment.assigned_by} on {formatDate(assignment.assigned_date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={assignment.returned_date ? "default" : "secondary"}>
                      {assignment.returned_date ? "Returned" : "Checked Out"}
                    </Badge>
                    {assignment.condition_out && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Condition: {assignment.condition_out}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
