import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Mountain,
  Calendar,
  Clock,
  Users,
  MapPin,
  User,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Plus,
  Search,
  Filter,
  Thermometer,
  Package,
  Edit,
  Trash2,
  UserPlus,
  RefreshCw,
  Printer
} from "lucide-react";

interface Activity {
  id: number;
  name: string;
  description: string;
  location: string;
  duration_hours: number;
  max_participants: number;
  equipment_required?: string;
  difficulty_level: string;
  weather_dependent: boolean;
  is_active: boolean;
  tour_package_name: string;
}

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
}

interface Guide {
  id: number;
  first_name: string;
  last_name: string;
  phone?: string;
}

interface TourPackage {
  id: number;
  name: string;
  description?: string;
}

interface Group {
  id: number;
  group_name: string;
  total_members: number;
  leader_name: string;
  status: string;
  members?: GroupMember[];
}

interface GroupMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  group_id?: number;
  group_name?: string;
}

interface ActivityParticipant {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  group_name: string;
  group_id: number;
}

export interface AssignedParticipant {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  group_name?: string;
  activity_instance_id: number;
}

export default function Activities() {
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [instances, setInstances] = useState<ActivityInstance[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbReadOnly, setDbReadOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("schedule");

  // Dialog states
  const [isCreateActivityOpen, setIsCreateActivityOpen] = useState(false);
  const [isScheduleActivityOpen, setIsScheduleActivityOpen] = useState(false);
  const [isEditActivityOpen, setIsEditActivityOpen] = useState(false);
  const [isAddParticipantsOpen, setIsAddParticipantsOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<ActivityInstance | null>(null);

  // Form states
  const [activityForm, setActivityForm] = useState({
    name: '',
    description: '',
    location: '',
    duration_hours: 1,
    max_participants: 1,
    equipment_required: '',
    difficulty_level: 'easy',
    weather_dependent: false,
    tour_package_id: 1
  });

  const [scheduleForm, setScheduleForm] = useState({
    activity_id: 0,
    scheduled_date: '',
    scheduled_time: '',
    guide_id: 0,
    weather_conditions: '',
    notes: '',
    participants: [] as number[]
  });

  const [selectedParticipants, setSelectedParticipants] = useState<Set<number>>(new Set());
  const [availableParticipants, setAvailableParticipants] = useState<ActivityParticipant[]>([]);
  const [participantSearchTerm, setParticipantSearchTerm] = useState("");
  const [availableGuests, setAvailableGuests] = useState<any[]>([]);
  const [assignedParticipants, setAssignedParticipants] = useState<{[instanceId: number]: AssignedParticipant[]}>({});
  const [isViewActivityOpen, setIsViewActivityOpen] = useState(false);
  const [selectedInstanceForView, setSelectedInstanceForView] = useState<ActivityInstance | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<ActivityInstance | null>(null);
  const [isDeleteActivityDialogOpen, setIsDeleteActivityDialogOpen] = useState(false);
  const [activityLibraryToDelete, setActivityLibraryToDelete] = useState<Activity | null>(null);

  useEffect(() => {
    fetchData();

    // Check DB status
    (async () => {
      try {
        const res = await fetch('/api/db/status');
        if (res.ok) {
          const data = await res.json();
          setDbReadOnly(!!data.readOnly);
        }
      } catch (e) {
        console.warn('Could not fetch DB status', e);
      }
    })();
  }, []);

  const fetchData = async () => {
    try {
      const [activitiesRes, instancesRes, guidesRes, packagesRes, groupsRes] = await Promise.all([
        fetch('/api/activities'),
        fetch('/api/activities/instances'),
        fetch('/api/activities/guides'),
        fetch('/api/activities/packages'),
        fetch('/api/groups')
      ]);

      if (activitiesRes.ok) setActivities(await activitiesRes.json());
      if (instancesRes.ok) {
        const instancesData = await instancesRes.json();
        setInstances(instancesData);

        // Initialize assigned participants based on attendance_count
        const initialAssignedParticipants: {[instanceId: number]: AssignedParticipant[]} = {};
        instancesData.forEach((instance: any) => {
          if (instance.attendance_count > 0) {
            // Create placeholder participants based on attendance count
            const placeholderParticipants: AssignedParticipant[] = [];
            for (let i = 0; i < instance.attendance_count; i++) {
              placeholderParticipants.push({
                id: -1 * (instance.id * 1000 + i), // Negative IDs for placeholders
                first_name: `Participant`,
                last_name: `${i + 1}`,
                email: `participant${i + 1}@placeholder.com`,
                group_name: 'Unknown Group',
                activity_instance_id: instance.id
              });
            }
            initialAssignedParticipants[instance.id] = placeholderParticipants;
          }
        });

        setAssignedParticipants(initialAssignedParticipants);
      }
      if (guidesRes.ok) setGuides(await guidesRes.json());
      if (packagesRes.ok) setPackages(await packagesRes.json());
      if (groupsRes.ok) setGroups(await groupsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleCreateActivity = async () => {
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityForm)
      });

      if (response.ok) {
        const newActivity = await response.json();
        setActivities([...activities, newActivity]);
        setIsCreateActivityOpen(false);
        resetActivityForm();
      }
    } catch (error) {
      console.error('Error creating activity:', error);
    }
  };

  const handleUpdateActivity = async () => {
    if (!selectedActivity) return;

    try {
      const response = await fetch(`/api/activities/${selectedActivity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityForm)
      });

      if (response.ok) {
        const updatedActivity = await response.json();
        setActivities(activities.map(a => a.id === selectedActivity.id ? updatedActivity : a));
        setIsEditActivityOpen(false);
        setSelectedActivity(null);
        resetActivityForm();
      }
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  };

  const handleScheduleActivity = async () => {
    try {
      if (dbReadOnly) {
        toast({ title: 'Read-only database', description: 'Cannot schedule activities because the database is in read-only mode.', variant: 'destructive' });
        return;
      }
      console.log('=== FORM VALIDATION ===');
      console.log('Form data:', scheduleForm);

      // Validate required fields
      if (!scheduleForm.activity_id || scheduleForm.activity_id === 0) {
        toast({
          title: "Validation Error",
          description: "Please select an activity",
          variant: "destructive",
        });
        return;
      }

      if (!scheduleForm.scheduled_date) {
        toast({
          title: "Validation Error",
          description: "Please select a date",
          variant: "destructive",
        });
        return;
      }

      if (!scheduleForm.scheduled_time) {
        toast({
          title: "Validation Error",
          description: "Please select a time",
          variant: "destructive",
        });
        return;
      }

      console.log('Form validation passed');
      console.log('Available activities:', activities.length);
      console.log('Available guides:', guides.length);
      console.log('=== END FORM VALIDATION ===');

      console.log('Scheduling activity with validated form data:', scheduleForm);

      // Use XMLHttpRequest as a workaround for fetch body stream issues
      const xhr = new XMLHttpRequest();

      interface ScheduleResponse {
        ok: boolean;
        status: number;
        data: any;
      }

      const responsePromise = new Promise<ScheduleResponse>((resolve, reject) => {
        xhr.onload = () => {
          try {
            console.log('=== SERVER RESPONSE DEBUG ===');
            console.log('XHR Response status:', xhr.status);
            console.log('XHR Response statusText:', xhr.statusText);
            console.log('XHR Response headers:', xhr.getAllResponseHeaders());
            console.log('XHR Response text (full):', xhr.responseText);
            console.log('XHR Response text length:', xhr.responseText?.length);

            let responseData;

            if (xhr.responseText) {
              try {
                responseData = JSON.parse(xhr.responseText);
                console.log('Parsed JSON response:', responseData);
              } catch (parseError) {
                console.log('Response is not JSON, treating as text');
                console.log('Parse error:', parseError);
                responseData = { error: xhr.responseText };
              }
            } else {
              console.log('Empty response received');
              responseData = { error: 'Empty response' };
            }

            console.log('Final response data:', responseData);
            console.log('=== END SERVER RESPONSE DEBUG ===');

            resolve({
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              data: responseData
            });
          } catch (error) {
            console.error('Error processing response:', error);
            reject(error);
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error'));
        };

        xhr.ontimeout = () => {
          reject(new Error('Request timeout'));
        };
      });

      xhr.open('POST', '/api/activities/schedule');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.timeout = 30000; // 30 second timeout
      xhr.send(JSON.stringify(scheduleForm));

      const response = await responsePromise;

      console.log('Final response:', response);

      if (response.ok && response.data && !response.data.error) {
        console.log('Success! New instance created');
        setInstances([...instances, response.data]);
        setIsScheduleActivityOpen(false);
        resetScheduleForm();
        toast({
          title: "Success!",
          description: "Activity scheduled successfully",
          variant: "default",
        });
      } else {
        const errorMessage = response.data?.error || response.data?.message || `Server error (${response.status})`;
        console.error('Request failed:', errorMessage);
        toast({
          title: "Scheduling Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Request error:', error);
      toast({
        title: "Network Error",
        description: error.message || 'Failed to schedule activity due to network error',
        variant: "destructive",
      });
    }
  };


  const handleAddParticipants = async () => {
    if (!selectedInstance) return;

    if (dbReadOnly) {
      toast({ title: 'Read-only database', description: 'Cannot add participants because the database is in read-only mode.', variant: 'destructive' });
      return;
    }

    // Send the full selection to the server to add/remove accordingly
    const participantIds = Array.from(selectedParticipants);

    try {
      const response = await fetch(`/api/activities/instances/${selectedInstance.id}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participant_ids: participantIds })
      });

      if (response.ok) {
        const updatedInstance = await response.json();

        setInstances(instances.map(i => i.id === selectedInstance.id ? updatedInstance : i));

        // Build the complete list for this activity from the selection
        const allAssignedParticipants: AssignedParticipant[] = [];

        // Add from available participants (group members)
        availableParticipants.forEach(p => {
          if (participantIds.includes(p.id)) {
            allAssignedParticipants.push({
              id: p.id,
              first_name: p.first_name,
              last_name: p.last_name,
              email: p.email,
              group_name: p.group_name,
              activity_instance_id: selectedInstance.id
            });
          }
        });

        // Add from available guests (individual guests)
        availableGuests.forEach(g => {
          if (participantIds.includes(g.id)) {
            allAssignedParticipants.push({
              id: g.id,
              first_name: g.first_name,
              last_name: g.last_name,
              email: g.email,
              group_name: 'Individual Guest',
              activity_instance_id: selectedInstance.id
            });
          }
        });

        setAssignedParticipants(prev => ({
          ...prev,
          [selectedInstance.id]: allAssignedParticipants
        }));

        setIsAddParticipantsOpen(false);
        setSelectedInstance(null);
        setSelectedParticipants(new Set());
        toast({
          title: 'Saved',
          description: 'Participants list updated for the activity',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error updating participants:', error);
      toast({
        title: 'Error',
        description: 'Failed to update participants',
        variant: 'destructive',
      });
    }
  };

  const resetActivityForm = () => {
    setActivityForm({
      name: '',
      description: '',
      location: '',
      duration_hours: 1,
      max_participants: 1,
      equipment_required: '',
      difficulty_level: 'easy',
      weather_dependent: false,
      tour_package_id: 1
    });
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      activity_id: 0,
      scheduled_date: '',
      scheduled_time: '',
      guide_id: 0,
      weather_conditions: '',
      notes: '',
      participants: []
    });
  };

  const openEditActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setActivityForm({
      name: activity.name || '',
      description: activity.description || '',
      location: activity.location || '',
      duration_hours: activity.duration_hours || 1,
      max_participants: activity.max_participants || 1,
      equipment_required: activity.equipment_required || '',
      difficulty_level: activity.difficulty_level || 'easy',
      weather_dependent: activity.weather_dependent || false,
      tour_package_id: 1 // Would need to get this from activity
    });
    setIsEditActivityOpen(true);
  };

  const openScheduleActivity = (activity: Activity) => {
    setScheduleForm(prev => ({
      ...prev,
      activity_id: activity.id
    }));
    setIsScheduleActivityOpen(true);
  };

  const openViewActivity = (instance: ActivityInstance) => {
    setSelectedInstanceForView(instance);
    setIsViewActivityOpen(true);
  };

  const openDeleteDialog = (instance: ActivityInstance) => {
    setActivityToDelete(instance);
    setIsDeleteDialogOpen(true);
  };

  const openDeleteActivityDialog = (activity: Activity) => {
    setActivityLibraryToDelete(activity);
    setIsDeleteActivityDialogOpen(true);
  };

  const handleDeleteActivity = async () => {
    if (!activityToDelete) return;

    try {
      const response = await fetch(`/api/activities/instances/${activityToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setInstances(instances.filter(i => i.id !== activityToDelete.id));
        // Remove assigned participants for this activity
        setAssignedParticipants(prev => {
          const updated = { ...prev };
          delete updated[activityToDelete.id];
          return updated;
        });
        setIsDeleteDialogOpen(false);
        setActivityToDelete(null);
        toast({
          title: "Success!",
          description: "Activity deleted successfully",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete activity",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast({
        title: "Error",
        description: "Failed to delete activity",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (instanceId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/activities/instances/${instanceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const updatedInstance = await response.json();
        setInstances(instances.map(i => i.id === instanceId ? updatedInstance : i));

        // Update selected instance for view if it's the same one
        if (selectedInstanceForView?.id === instanceId) {
          setSelectedInstanceForView(updatedInstance);
        }

        toast({
          title: "Success!",
          description: `Activity status updated to ${newStatus}`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteActivityFromLibrary = async () => {
    if (!activityLibraryToDelete) return;

    try {
      const response = await fetch(`/api/activities/${activityLibraryToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setActivities(activities.filter(a => a.id !== activityLibraryToDelete.id));
        setIsDeleteActivityDialogOpen(false);
        setActivityLibraryToDelete(null);
        toast({
          title: "Success!",
          description: "Activity deleted successfully",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete activity",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast({
        title: "Error",
        description: "Failed to delete activity",
        variant: "destructive",
      });
    }
  };

  const handlePrintActivity = (instance: ActivityInstance | null) => {
    if (instance) {
      // For a real application, you might generate a specific print-friendly view
      // or PDF. For this example, we'll just trigger the browser's print dialog.
      console.log('Printing activity instance:', instance);
      toast({
        title: "Printing Activity",
        description: `Preparing to print details for ${instance.activity_name}.`,
        variant: "default",
      });
      window.print(); // Triggers the browser's print dialog
    } else {
      toast({
        title: "Print Error",
        description: "No activity instance selected for printing.",
        variant: "destructive",
      });
    }
  };

  const openAddParticipants = async (instance: ActivityInstance) => {
    setSelectedInstance(instance);

    try {
      // Fetch groups, individual guests, and currently assigned participants
      const [groupsResponse, guestsResponse, assignedResponse] = await Promise.all([
        fetch('/api/groups'),
        fetch('/api/guests'),
        fetch(`/api/activities/instances/${instance.id}/participants`)
      ]);

      const groupsData = await groupsResponse.json();
      const guestsData = await guestsResponse.json();
      const assignedData = await assignedResponse.json();

      // Fetch detailed group information with members for each group
      const groupsWithMembers: Group[] = [];
      for (const group of groupsData) {
        try {
          const groupResponse = await fetch(`/api/groups/${group.id}`);
          const groupWithMembers = await groupResponse.json();
          groupsWithMembers.push(groupWithMembers);
        } catch (error) {
          console.warn(`Failed to fetch members for group ${group.id}:`, error);
          // Add group without members as fallback
          groupsWithMembers.push({ ...group, members: [] });
        }
      }

      // Flatten all group members into participants with group information
      const allParticipants: ActivityParticipant[] = [];
      const groupMemberIds = new Set<number>();

      groupsWithMembers.forEach((group: Group) => {
        if (group.members && group.members.length > 0) {
          group.members.forEach((member: GroupMember) => {
            groupMemberIds.add(member.id);
            allParticipants.push({
              id: member.id,
              first_name: member.first_name,
              last_name: member.last_name,
              email: member.email,
              group_name: group.group_name,
              group_id: group.id
            });
          });
        }
      });

      // Filter out guests who are already part of groups to avoid duplicates
      const individualGuests = guestsData.filter((guest: any) => !groupMemberIds.has(guest.id));

      // Use server-assigned participants if available (ensures correctness after refresh)
      const normalizedAssigned = Array.isArray(assignedData) ? assignedData.map((p: any) => ({
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        email: p.email || '',
        group_name: p.group_name || undefined,
        activity_instance_id: instance.id,
      })) : [];

      const assignedIds = new Set<number>(normalizedAssigned.map((p: any) => p.id));

      // Show all participants and pre-check already assigned for add/remove UX
      setAvailableParticipants(allParticipants);
      setAvailableGuests(individualGuests);
      setGroups(groupsWithMembers);

      // Update assigned participants cache for this instance
      setAssignedParticipants(prev => ({ ...prev, [instance.id]: normalizedAssigned }));

      // Pre-select already assigned participants
      setSelectedParticipants(assignedIds);
      setParticipantSearchTerm("");
      setIsAddParticipantsOpen(true);
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast({
        title: "Error",
        description: "Failed to load participants",
        variant: "destructive",
      });
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return 'default';
      case 'moderate': return 'secondary';
      case 'challenging': return 'destructive';
      case 'expert': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'in_progress': return 'secondary';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return Calendar;
      case 'in_progress': return Clock;
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      default: return AlertTriangle;
    }
  };

  const formatDateTime = (date: string, time: string) => {
    return `${new Date(date).toLocaleDateString()} at ${time}`;
  };

  const filteredInstances = instances.filter(instance => {
    const matchesSearch = instance.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instance.booking_reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || instance.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading activities...</p>
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
          <h1 className="text-3xl font-bold text-foreground">Activities & Tours</h1>
          <p className="text-muted-foreground">
            Manage tour activities, attendance tracking, and guide assignments
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={isScheduleActivityOpen} onOpenChange={setIsScheduleActivityOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Schedule Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Schedule Activity</DialogTitle>
                <DialogDescription>Schedule an activity instance for specific date and time</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Activity</Label>
                    <Select value={scheduleForm.activity_id > 0 ? scheduleForm.activity_id.toString() : ""} onValueChange={(value) => setScheduleForm({...scheduleForm, activity_id: parseInt(value) || 0})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity" />
                      </SelectTrigger>
                      <SelectContent>
                        {activities.map(activity => (
                          <SelectItem key={activity.id} value={activity.id.toString()}>
                            {activity.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Guide</Label>
                    <Select value={scheduleForm.guide_id > 0 ? scheduleForm.guide_id.toString() : ""} onValueChange={(value) => setScheduleForm({...scheduleForm, guide_id: parseInt(value) || 0})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select guide" />
                      </SelectTrigger>
                      <SelectContent>
                        {guides.map(guide => (
                          <SelectItem key={guide.id} value={guide.id.toString()}>
                            {guide.first_name} {guide.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={scheduleForm.scheduled_date}
                      onChange={(e) => setScheduleForm({...scheduleForm, scheduled_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={scheduleForm.scheduled_time}
                      onChange={(e) => setScheduleForm({...scheduleForm, scheduled_time: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label>Weather Conditions</Label>
                  <Input
                    placeholder="e.g., Clear, sunny, 15°C"
                    value={scheduleForm.weather_conditions}
                    onChange={(e) => setScheduleForm({...scheduleForm, weather_conditions: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Additional notes or instructions"
                    value={scheduleForm.notes}
                    onChange={(e) => setScheduleForm({...scheduleForm, notes: e.target.value})}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsScheduleActivityOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleScheduleActivity} disabled={dbReadOnly}>
                    Schedule Activity
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateActivityOpen} onOpenChange={setIsCreateActivityOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Activity</DialogTitle>
                <DialogDescription>Add a new activity to your tour library</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Activity Name</Label>
                    <Input
                      placeholder="e.g., Geysir Visit"
                      value={activityForm.name}
                      onChange={(e) => setActivityForm({...activityForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      placeholder="e.g., Geysir Geothermal Area"
                      value={activityForm.location}
                      onChange={(e) => setActivityForm({...activityForm, location: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe the activity"
                    value={activityForm.description}
                    onChange={(e) => setActivityForm({...activityForm, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Duration (hours)</Label>
                    <Input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={activityForm.duration_hours.toString()}
                      onChange={(e) => setActivityForm({...activityForm, duration_hours: parseFloat(e.target.value) || 0.5})}
                    />
                  </div>
                  <div>
                    <Label>Max Participants</Label>
                    <Input
                      type="number"
                      min="1"
                      value={activityForm.max_participants.toString()}
                      onChange={(e) => setActivityForm({...activityForm, max_participants: parseInt(e.target.value) || 1})}
                    />
                  </div>
                  <div>
                    <Label>Difficulty Level</Label>
                    <Select value={activityForm.difficulty_level} onValueChange={(value) => setActivityForm({...activityForm, difficulty_level: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="challenging">Challenging</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Equipment Required</Label>
                  <Input
                    placeholder="e.g., Crampons, helmets, ice axes"
                    value={activityForm.equipment_required}
                    onChange={(e) => setActivityForm({...activityForm, equipment_required: e.target.value})}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="weather_dependent"
                    checked={activityForm.weather_dependent}
                    onChange={(e) => setActivityForm({...activityForm, weather_dependent: e.target.checked})}
                  />
                  <Label htmlFor="weather_dependent">Weather Dependent</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateActivityOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateActivity}>
                    Create Activity
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mountain className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{activities.filter(a => a.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Active Activities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{instances.filter(i => i.status === 'scheduled').length}</p>
                <p className="text-sm text-muted-foreground">Scheduled Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{instances.filter(i => i.status === 'in_progress').length}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{instances.reduce((sum, i) => sum + i.attendance_count, 0)}</p>
                <p className="text-sm text-muted-foreground">Participants Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schedule">Activity Schedule</TabsTrigger>
          <TabsTrigger value="activities">Activity Library</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search scheduled activities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Schedule */}
          <div className="grid gap-4">
            {filteredInstances.map((instance) => {
              const StatusIcon = getStatusIcon(instance.status);
              const actualParticipantCount = assignedParticipants[instance.id]?.length || 0;
              const attendancePercentage = (actualParticipantCount / instance.max_participants) * 100;
              
              return (
                <Card key={instance.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                          <StatusIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold text-foreground">{instance.activity_name}</h3>
                            <Badge variant="outline">{instance.booking_reference || 'No Booking'}</Badge>
                            <Badge variant={getStatusColor(instance.status)}>{instance.status}</Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Calendar className="mr-1 h-4 w-4" />
                              {formatDateTime(instance.scheduled_date, instance.scheduled_time)}
                            </div>
                            {instance.guide_name && (
                              <div className="flex items-center">
                                <User className="mr-1 h-4 w-4" />
                                Guide: {instance.guide_name}
                              </div>
                            )}
                            <div className="flex items-center">
                              <Users className="mr-1 h-4 w-4" />
                              {actualParticipantCount}/{instance.max_participants} participants
                            </div>
                            {instance.weather_conditions && (
                              <div className="flex items-center">
                                <Thermometer className="mr-1 h-4 w-4" />
                                {instance.weather_conditions}
                              </div>
                            )}
                          </div>
                          {instance.status !== 'completed' && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Attendance</span>
                                <span className="text-muted-foreground">{Math.round(attendancePercentage)}%</span>
                              </div>
                              <Progress value={attendancePercentage} className="h-2" />
                            </div>
                          )}
                          {instance.notes && (
                            <p className="text-sm text-muted-foreground mt-2 italic">{instance.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAddParticipants(instance)}
                            disabled={dbReadOnly}
                          >
                            <UserPlus className="mr-1 h-4 w-4" />
                            Add Participants
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openViewActivity(instance)}
                          >
                            <Users className="mr-1 h-4 w-4" />
                            View Activity
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(instance)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredInstances.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No scheduled activities</h3>
                <p className="text-muted-foreground">No activities match your current filters</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          {/* Activity Library */}
          <div className="grid gap-4">
            {activities.map((activity) => (
              <Card key={activity.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                        <Mountain className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-foreground">{activity.name}</h3>
                          <Badge variant={getDifficultyColor(activity.difficulty_level)}>
                            {activity.difficulty_level}
                          </Badge>
                          {Boolean(activity.weather_dependent) && (
                            <Badge variant="outline">Weather Dependent</Badge>
                          )}
                          {!activity.is_active && (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <MapPin className="mr-1 h-4 w-4" />
                            {activity.location}
                          </div>
                          <div className="flex items-center">
                            <Clock className="mr-1 h-4 w-4" />
                            {activity.duration_hours}h duration
                          </div>
                          <div className="flex items-center">
                            <Users className="mr-1 h-4 w-4" />
                            Max {activity.max_participants} participants
                          </div>
                        </div>
                        {activity.equipment_required && (
                          <div className="mt-2">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Package className="mr-1 h-4 w-4" />
                              Equipment: {activity.equipment_required}
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Part of: {activity.tour_package_name}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditActivity(activity)}
                        >
                          <Edit className="mr-1 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openScheduleActivity(activity)}
                        >
                          <Calendar className="mr-1 h-4 w-4" />
                          Schedule
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteActivityDialog(activity)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {activities.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Mountain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No activities found</h3>
                <p className="text-muted-foreground">Create your first activity to get started</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Activity Dialog */}
      <Dialog open={isEditActivityOpen} onOpenChange={setIsEditActivityOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
            <DialogDescription>Update activity details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Activity Name</Label>
                <Input
                  value={activityForm.name}
                  onChange={(e) => setActivityForm({...activityForm, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={activityForm.location}
                  onChange={(e) => setActivityForm({...activityForm, location: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={activityForm.description}
                onChange={(e) => setActivityForm({...activityForm, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Duration (hours)</Label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={activityForm.duration_hours.toString()}
                  onChange={(e) => setActivityForm({...activityForm, duration_hours: parseFloat(e.target.value) || 0.5})}
                />
              </div>
              <div>
                <Label>Max Participants</Label>
                <Input
                  type="number"
                  min="1"
                  value={activityForm.max_participants.toString()}
                  onChange={(e) => setActivityForm({...activityForm, max_participants: parseInt(e.target.value) || 1})}
                />
              </div>
              <div>
                <Label>Difficulty Level</Label>
                <Select value={activityForm.difficulty_level} onValueChange={(value) => setActivityForm({...activityForm, difficulty_level: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="challenging">Challenging</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Equipment Required</Label>
              <Input
                value={activityForm.equipment_required}
                onChange={(e) => setActivityForm({...activityForm, equipment_required: e.target.value})}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit_weather_dependent"
                checked={activityForm.weather_dependent}
                onChange={(e) => setActivityForm({...activityForm, weather_dependent: e.target.checked})}
              />
              <Label htmlFor="edit_weather_dependent">Weather Dependent</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditActivityOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateActivity}>
                Update Activity
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Participants Dialog */}
      <Dialog open={isAddParticipantsOpen} onOpenChange={setIsAddParticipantsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Add Participants</DialogTitle>
            <DialogDescription>
              Add participants to {selectedInstance?.activity_name}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {/* Activity Info */}
            <div className="bg-muted/50 p-4 rounded-lg text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Activity:</span> {selectedInstance?.activity_name}
                </div>
                <div>
                  <span className="font-medium">Date:</span> {selectedInstance && formatDateTime(selectedInstance.scheduled_date, selectedInstance.scheduled_time)}
                </div>
                <div>
                  <span className="font-medium">Guide:</span> {selectedInstance?.guide_name || 'No guide assigned'}
                </div>
                <div>
                  <span className="font-medium">Max Participants:</span> {selectedInstance?.max_participants}
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search participants or groups..."
                value={participantSearchTerm}
                onChange={(e) => setParticipantSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="groups" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="groups">Groups & Members</TabsTrigger>
                <TabsTrigger value="individuals">Individual Guests</TabsTrigger>
              </TabsList>

              <TabsContent value="groups" className="mt-4">
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {(() => {
                    const groupedParticipants = availableParticipants.reduce((acc, participant) => {
                      const groupName = participant.group_name;
                      if (!acc[groupName]) {
                        acc[groupName] = [];
                      }
                      acc[groupName].push(participant);
                      return acc;
                    }, {} as {[key: string]: ActivityParticipant[]});

                    const filteredGroups = Object.entries(groupedParticipants).filter(([groupName, members]) => {
                      if (!participantSearchTerm) return true;
                      return groupName.toLowerCase().includes(participantSearchTerm.toLowerCase()) ||
                             members.some(member =>
                               `${member.first_name} ${member.last_name}`.toLowerCase().includes(participantSearchTerm.toLowerCase()) ||
                               member.email.toLowerCase().includes(participantSearchTerm.toLowerCase())
                             );
                    });

                    if (filteredGroups.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          {participantSearchTerm ? 'No matching groups or members found' : 'No groups available'}
                        </div>
                      );
                    }

                    return filteredGroups.map(([groupName, members]) => (
                      <div key={`group-container-${groupName}`} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="secondary" className="font-semibold">
                            {groupName} ({members.length})
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newSelected = new Set(selectedParticipants);
                              const allGroupSelected = members.every(member => selectedParticipants.has(member.id));
                              members.forEach(member => {
                                if (allGroupSelected) {
                                  newSelected.delete(member.id);
                                } else {
                                  newSelected.add(member.id);
                                }
                              });
                              setSelectedParticipants(newSelected);
                            }}
                          >
                            {members.every(member => selectedParticipants.has(member.id)) ?
                              'Deselect All' : 'Select All'}
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {members.filter(member =>
                            !participantSearchTerm ||
                            `${member.first_name} ${member.last_name}`.toLowerCase().includes(participantSearchTerm.toLowerCase()) ||
                            member.email.toLowerCase().includes(participantSearchTerm.toLowerCase())
                          ).map((participant) => {
                            const isAlreadyAssigned = assignedParticipants[selectedInstance?.id || 0]?.some(p => p.id === participant.id) || false;
                            return (
                              <label key={`group-member-${participant.id}`} className={`flex items-center space-x-3 p-2 rounded cursor-pointer hover:bg-accent/50 ${isAlreadyAssigned ? 'bg-primary/10 border border-primary/20' : 'bg-accent/30'}`}>
                                <input
                                  type="checkbox"
                                  checked={selectedParticipants.has(participant.id)}
                                  onChange={(e) => {
                                    const newSelected = new Set(selectedParticipants);
                                    if (e.target.checked) {
                                      newSelected.add(participant.id);
                                    } else {
                                      newSelected.delete(participant.id);
                                    }
                                    setSelectedParticipants(newSelected);
                                  }}
                                  className="h-4 w-4"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <div className="font-medium text-sm">
                                      {participant.first_name} {participant.last_name}
                                    </div>
                                    {isAlreadyAssigned && (
                                      <Badge variant="secondary" className="text-xs">
                                        Already Assigned
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {participant.email}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </TabsContent>

              <TabsContent value="individuals" className="mt-4">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {(() => {
                    const filteredGuests = availableGuests.filter(guest => {
                      if (!participantSearchTerm) return true;
                      return `${guest.first_name} ${guest.last_name}`.toLowerCase().includes(participantSearchTerm.toLowerCase()) ||
                             guest.email.toLowerCase().includes(participantSearchTerm.toLowerCase());
                    });

                    if (filteredGuests.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          {participantSearchTerm ? 'No matching individual guests found' : 'No individual guests available'}
                        </div>
                      );
                    }

                    return filteredGuests.map((guest) => {
                      const isAlreadyAssigned = assignedParticipants[selectedInstance?.id || 0]?.some(p => p.id === guest.id) || false;
                      return (
                        <label key={`individual-guest-${guest.id}`} className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-accent/50 ${isAlreadyAssigned ? 'bg-primary/10 border border-primary/20' : 'border'}`}>
                          <input
                            type="checkbox"
                            checked={selectedParticipants.has(guest.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedParticipants);
                              if (e.target.checked) {
                                newSelected.add(guest.id);
                              } else {
                                newSelected.delete(guest.id);
                              }
                              setSelectedParticipants(newSelected);
                            }}
                            className="h-4 w-4"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <div className="font-medium">
                                {guest.first_name} {guest.last_name}
                              </div>
                              {isAlreadyAssigned && (
                                <Badge variant="secondary" className="text-xs">
                                  Already Assigned
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {guest.email}
                            </div>
                            {guest.phone && (
                              <div className="text-xs text-muted-foreground">
                                {guest.phone}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            Individual
                          </Badge>
                        </label>
                      );
                    });
                  })()}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Fixed Footer */}
          <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t bg-background">
            <div className="text-sm text-muted-foreground">
              {selectedParticipants.size} participants selected
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsAddParticipantsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddParticipants}
                disabled={selectedParticipants.size === 0}
              >
                Add {selectedParticipants.size} Participants
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Activity Dialog */}
      <Dialog open={isViewActivityOpen} onOpenChange={setIsViewActivityOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Activity Participants</DialogTitle>
                <DialogDescription>
                  View all participants for {selectedInstanceForView?.activity_name}
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePrintActivity(selectedInstanceForView)}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {/* Activity Info */}
            <div className="bg-muted/50 p-4 rounded-lg text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Activity:</span> {selectedInstanceForView?.activity_name}
                </div>
                <div>
                  <span className="font-medium">Date:</span> {selectedInstanceForView && formatDateTime(selectedInstanceForView.scheduled_date, selectedInstanceForView.scheduled_time)}
                </div>
                <div>
                  <span className="font-medium">Guide:</span> {selectedInstanceForView?.guide_name || 'No guide assigned'}
                </div>
                <div className="col-span-2 flex items-center justify-between pt-2 border-t">
                  <div>
                    <span className="font-medium">Status:</span>
                    <Badge variant={getStatusColor(selectedInstanceForView?.status || 'scheduled')} className="ml-2">
                      {selectedInstanceForView?.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">Change status:</span>
                    <Select
                      value={selectedInstanceForView?.status || 'scheduled'}
                      onValueChange={(value) => selectedInstanceForView && handleStatusChange(selectedInstanceForView.id, value)}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="col-span-2 mt-4 pt-4 border-t border-gray-300">
                  <span className="font-medium">Tour Guide Signature:</span>
                  <div className="border-b border-gray-500 mt-4 h-8"></div>
                </div>
              </div>
            </div>

            {/* Participants List */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Participants ({assignedParticipants[selectedInstanceForView?.id || 0]?.length || 0})</h3>

              {(() => {
                const participants = assignedParticipants[selectedInstanceForView?.id || 0] || [];

                if (participants.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="mx-auto h-12 w-12 mb-4" />
                      <p>No participants assigned to this activity yet.</p>
                      <p className="text-sm">Use "Add Participants" to assign people to this activity.</p>
                    </div>
                  );
                }

                // Group participants by group name
                const groupedParticipants = participants.reduce((acc, participant) => {
                  const groupName = participant.group_name || 'Individual Guest';
                  if (!acc[groupName]) {
                    acc[groupName] = [];
                  }
                  acc[groupName].push(participant);
                  return acc;
                }, {} as {[key: string]: AssignedParticipant[]});

                // Sort groups and participants within groups
                const sortedGroups: [string, AssignedParticipant[]][] = Object.entries(groupedParticipants)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([groupName, members]) => [
                    groupName,
                    members.sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`))
                  ]);

                return (
                  <div className="space-y-4">
                    {sortedGroups.map(([groupName, members]) => {
                      return (
                        <div key={`view-group-${groupName}`} className="border rounded-lg p-4">
                          <div className="flex items-center mb-3">
                            <Badge variant="secondary" className="font-semibold">
                              {groupName} ({(members as AssignedParticipant[]).length})
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-2 font-medium text-sm border-b pb-1 mb-2">
                            <div>Name</div>
                            <div>Email</div>
                            <div>Signature</div>
                          </div>
                          <div className="space-y-2">
                            {(members as AssignedParticipant[]).map((participant, index) => (
                              <div key={`view-participant-${participant.id}-${index}`} className="grid grid-cols-3 gap-2 text-base items-center">
                                <div>{participant.first_name} {participant.last_name}</div>
                                <div className="text-sm text-muted-foreground">{participant.email}</div>
                                <div className="border-b border-gray-300 h-6"></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex justify-end pt-4 border-t">
            <Button onClick={() => setIsViewActivityOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Activity Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span>Delete Activity</span>
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the activity and remove all participant assignments.
            </DialogDescription>
          </DialogHeader>

          {activityToDelete && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Activity:</span> {activityToDelete.activity_name}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {formatDateTime(activityToDelete.scheduled_date, activityToDelete.scheduled_time)}
                  </div>
                  <div>
                    <span className="font-medium">Guide:</span> {activityToDelete.guide_name || 'No guide assigned'}
                  </div>
                  <div>
                    <span className="font-medium">Participants:</span> {assignedParticipants[activityToDelete.id]?.length || 0}
                  </div>
                </div>
              </div>

              <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">Warning!</p>
                    <p className="text-muted-foreground">
                      Deleting this activity will also remove all {assignedParticipants[activityToDelete.id]?.length || 0} participant assignments.
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteActivity}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete Activity
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Activity from Library Confirmation Dialog */}
      <Dialog open={isDeleteActivityDialogOpen} onOpenChange={setIsDeleteActivityDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span>Delete Activity</span>
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the activity from your library and all its scheduled instances.
            </DialogDescription>
          </DialogHeader>

          {activityLibraryToDelete && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Activity:</span> {activityLibraryToDelete.name}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {activityLibraryToDelete.location}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {activityLibraryToDelete.duration_hours}h
                  </div>
                  <div>
                    <span className="font-medium">Max Participants:</span> {activityLibraryToDelete.max_participants}
                  </div>
                  <div>
                    <span className="font-medium">Difficulty:</span> {activityLibraryToDelete.difficulty_level}
                  </div>
                </div>
              </div>

              <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">Warning!</p>
                    <p className="text-muted-foreground">
                      Deleting this activity will also remove all scheduled instances and their participant assignments.
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteActivityDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteActivityFromLibrary}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete Activity
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
