import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Calendar,
  Car,
  Mountain,
  Hotel,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  MapPin,
  Plane,
  Bell,
  Plus,
} from "lucide-react";
import { ArrivalDetailsDialog } from "@/components/ArrivalDetailsDialog";
import { DepartureDetailsDialog } from "@/components/DepartureDetailsDialog";
import PrintActivityDetails from "@/components/PrintActivityDetails";

interface GroupStats {
  total_groups: number;
  active_groups: number;
  total_members: number;
  available_vehicles: number;
}

interface Group {
  id: number;
  group_name: string;
  total_members: number;
  leader_name: string;
  group_type: string;
  status: string;
  tour_start_date?: string;
  tour_end_date?: string;
}

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

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<GroupStats | null>(null);
  const [recentGroups, setRecentGroups] = useState<Group[]>([]);
  const [todaysArrivals, setTodaysArrivals] = useState<TransportSchedule[]>([]);
  const [todaysDepartures, setTodaysDepartures] = useState<TransportSchedule[]>(
    [],
  );
  const [todaysActivities, setTodaysActivities] = useState<ActivityInstance[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        statsResponse,
        groupsResponse,
        arrivalsResponse,
        departuresResponse,
        activitiesResponse,
      ] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/groups"),
        fetch("/api/dashboard/arrivals"),
        fetch("/api/dashboard/departures"),
        fetch("/api/activities/today"),
      ]);

      const statsData = await statsResponse.json();
      const groupsData = await groupsResponse.json();
      const arrivalsData = await arrivalsResponse.json();
      const departuresData = await departuresResponse.json();
      const activitiesData = await activitiesResponse.json();

      setStats(statsData);
      setRecentGroups(groupsData.slice(0, 5)); // Show 5 most recent groups

      setTodaysArrivals(arrivalsData);
      setTodaysDepartures(departuresData);
      setTodaysActivities(activitiesData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  interface ActivityInstance {
    id: number;
    activity_id: number;
    booking_id: number | null;
    scheduled_date: string;
    scheduled_time: string;
    actual_start_time: string | null;
    actual_end_time: string | null;
    guide_id: number | null;
    status: string;
    weather_conditions: string | null;
    attendance_count: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
    activity_name: string;
    max_participants: number;
    booking_reference: string;
    guide_name: string;
    location: string;
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getBookingProgress = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();

    if (now < start) return 0;
    if (now > end) return 100;

    return Math.round(((now - start) / (end - start)) * 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
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
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your tours today.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => navigate("/group-bookings")}>
            <Plus className="mr-2 h-4 w-4" />
            New Group Booking
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Groups
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.total_groups}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Groups
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.active_groups}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Mountain className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Members
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.total_members}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Available Vehicles
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.available_vehicles}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Car className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Today's Arrivals, Departures, and Activities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today's Arrivals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Plane className="mr-2 h-5 w-5 text-blue-600" />
                Today's Arrivals ({todaysArrivals.length})
              </div>
              <ArrivalDetailsDialog arrivals={todaysArrivals}>
                <Button variant="outline" size="sm">
                  View All Details
                </Button>
              </ArrivalDetailsDialog>
            </CardTitle>
            <CardDescription>Groups arriving today</CardDescription>
          </CardHeader>
          <CardContent>
            {todaysArrivals.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Plane className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p>No arrivals scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysArrivals.slice(0, 2).map((arrival) => (
                  <div
                    key={arrival.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">
                        {arrival.passengers
                          ?.map(
                            (p) =>
                              `${p.name} ${p.groupName ? `(${p.groupName})` : ""}`,
                          )
                          .join(", ") || "Passenger names TBD"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {arrival.passenger_count} passengers •{" "}
                        {new Date(arrival.pickup_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-blue-600">
                        {arrival.pickup_location} → {arrival.dropoff_location}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {arrival.status}
                    </Badge>
                  </div>
                ))}
                {todaysArrivals.length > 2 && (
                  <div className="text-center text-sm text-muted-foreground">
                    +{todaysArrivals.length - 2} more pickups
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Departures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Plane className="mr-2 h-5 w-5 text-orange-600 rotate-45" />
                Today's Departures ({todaysDepartures.length})
              </div>
              <DepartureDetailsDialog departures={todaysDepartures}>
                <Button variant="outline" size="sm">
                  View All Details
                </Button>
              </DepartureDetailsDialog>
            </CardTitle>
            <CardDescription>Groups departing today</CardDescription>
          </CardHeader>
          <CardContent>
            {todaysDepartures.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Plane className="mx-auto h-12 w-12 mb-2 opacity-50 rotate-45" />
                <p>No departures scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysDepartures.slice(0, 2).map((departure) => (
                  <div
                    key={departure.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">
                        {departure.passengers
                          ?.map(
                            (p) =>
                              `${p.name} ${p.groupName ? `(${p.groupName})` : ""}`,
                          )
                          .join(", ") || "Passenger names TBD"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {departure.passenger_count} passengers •{" "}
                        {new Date(departure.pickup_time).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </p>
                      <p className="text-xs text-orange-600">
                        {departure.pickup_location} →{" "}
                        {departure.dropoff_location}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-orange-50 text-orange-700 border-orange-200"
                    >
                      {departure.status}
                    </Badge>
                  </div>
                ))}
                {todaysDepartures.length > 2 && (
                  <div className="text-center text-sm text-muted-foreground">
                    +{todaysDepartures.length - 2} more drop-offs
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-green-600" />
                Today's Activities ({todaysActivities.length})
              </div>
              <PrintActivityDetails activities={todaysActivities}>
                <Button variant="outline" size="sm">
                  View All Details
                </Button>
              </PrintActivityDetails>
            </CardTitle>
            <CardDescription>Activities scheduled for today</CardDescription>
          </CardHeader>
          <CardContent>
            {todaysActivities.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p>No activities scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysActivities.slice(0, 2).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">
                        {activity.activity_name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {activity.scheduled_time} • Guide: {activity.guide_name}
                      </p>
                      <p className="text-xs text-green-600">
                        {activity.location}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      {activity.status}
                    </Badge>
                  </div>
                ))}
                {todaysActivities.length > 2 && (
                  <div className="text-center text-sm text-muted-foreground">
                    +{todaysActivities.length - 2} more activities
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Groups */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Recent Group Bookings
              </CardTitle>
              <CardDescription>
                Latest group bookings and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentGroups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-foreground">
                          {group.total_members}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Members
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {group.group_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {group.group_type} • Led by {group.leader_name}
                        </div>
                        {group.tour_start_date && (
                          <div className="text-sm text-muted-foreground">
                            Tour: {formatDate(group.tour_start_date)} -{" "}
                            {group.tour_end_date
                              ? formatDate(group.tour_end_date)
                              : "TBD"}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        group.status === "active" ? "default" : "secondary"
                      }
                      className="ml-2 capitalize"
                    >
                      {group.status}
                    </Badge>
                  </div>
                ))}
                {recentGroups.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No group bookings found
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate("/group-bookings")}
        >
          <CardContent className="p-6 text-center">
            <Users className="mx-auto h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold text-foreground">Group Bookings</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Manage group bookings and members
            </p>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate("/transport")}
        >
          <CardContent className="p-6 text-center">
            <Car className="mx-auto h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold text-foreground">Transport</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Schedule vehicles and drivers
            </p>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate("/activities")}
        >
          <CardContent className="p-6 text-center">
            <Mountain className="mx-auto h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold text-foreground">Activities</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Track tour activities
            </p>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate("/hotels")}
        >
          <CardContent className="p-6 text-center">
            <Hotel className="mx-auto h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold text-foreground">Hotels</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Manage accommodations
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
