import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { fetchWithTimeout } from "@/lib/fetch-utils";
import { VehicleDeleteDialog } from "@/components/VehicleDeleteDialog";
import { VehicleAddDialog } from "@/components/VehicleAddDialog";
import { DeleteScheduleDialog } from "@/components/DeleteScheduleDialog";
import {
  Car,
  Truck,
  Bus,
  Calendar,
  Clock,
  MapPin,
  User,
  Wrench,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Plus,
  Search,
  Filter,
  Plane,
  Mountain,
  Users,
  Route,
  ArrowRight,
  RefreshCw,
  Eye,
  Trash2,
} from "lucide-react";

interface Vehicle {
  id: number;
  vehicle_number: string;
  vehicle_type: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  license_plate: string;
  last_maintenance: string;
  next_maintenance: string;
  status: string;
  notes?: string;
}

interface TransportSchedule {
  id: number;
  booking_reference: string;
  vehicle_number: string;
  vehicle_type: string;
  driver_name: string;
  pickup_location: string;
  pickup_time: string;
  dropoff_location: string;
  estimated_dropoff_time: string;
  status: string;
  distance_km?: number;
  transport_type?: "airport_pickup" | "airport_dropoff" | "activity" | "custom";
  groups?: string[];
  passenger_count?: number;
  activity_name?: string;
}

interface Driver {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
}

interface Group {
  id: number;
  group_name: string;
  total_members: number;
  leader_name: string;
  arrival_flight_number?: string;
  arrival_flight_time?: string;
  arrival_date?: string;
  departure_flight_number?: string;
  departure_flight_time?: string;
  departure_date?: string;
  tour_start_date?: string;
  tour_end_date?: string;
  status: string;
  traveling_together?: boolean;
  members?: GroupMember[];
}

interface GroupMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  arrival_flight_number?: string;
  arrival_flight_time?: string;
  arrival_notes?: string;
  departure_flight_number?: string;
  departure_flight_time?: string;
  departure_notes?: string;
  is_leader?: boolean;
}

export default function Transport() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [schedules, setSchedules] = useState<TransportSchedule[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [groupIdQuery, setGroupIdQuery] = useState("");
  const [activeTab, setActiveTab] = useState("schedules");
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [scheduleType, setScheduleType] = useState<
    "airport" | "activity" | "custom"
  >("airport");
  const [selectedTransferType, setSelectedTransferType] = useState<
    "pickup" | "dropoff"
  >("pickup");
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: number;
    type: "group" | "member";
    data: Group | GroupMember;
  } | null>(null);
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [originalFlightTime, setOriginalFlightTime] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPassengers, setSelectedPassengers] = useState<
    Array<{ id: number; type: "group" | "member"; data: Group | GroupMember }>
  >([]);
  const [passengerSearchTerm, setPassengerSearchTerm] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedScheduleForDetail, setSelectedScheduleForDetail] =
    useState<TransportSchedule | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] =
    useState<TransportSchedule | null>(null);
  const [editingDropoffLocation, setEditingDropoffLocation] = useState("");
  const [isEditingDropoff, setIsEditingDropoff] = useState(false);
  const [editingPickupLocation, setEditingPickupLocation] = useState("");
  const [isEditingPickup, setIsEditingPickup] = useState(false);
  const { toast } = useToast();

  // Helper function to format passenger names correctly
  const formatPassengerNames = (groups: any) => {
    if (!Array.isArray(groups)) return groups;

    return groups
      .map((g: any) => {
        if (typeof g === "string") return g;

        // Handle individual member transport
        if (g.type === "individual" && g.memberName) {
          return g.memberName;
        }

        // Handle group transport
        return g.name || g.group_name || "Unknown";
      })
      .join(", ");
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh disabled by request; use manual Refresh button instead
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Use Promise.allSettled to avoid one failing request cancelling others
      const results = await Promise.allSettled([
        fetchWithTimeout("/api/vehicles"),
        fetchWithTimeout("/api/transport/schedules"),
        fetchWithTimeout("/api/staff"), // Get all staff, we'll filter drivers
        fetchWithTimeout("/api/groups"),
      ]);

      const safeParse = async (resResult: any, name: string) => {
        if (resResult.status === "fulfilled") {
          const res = resResult.value;
          if (res && res.ok) {
            try {
              return await res.json();
            } catch (err) {
              console.warn(`${name} response json parsing failed:`, err);
              return [];
            }
          } else {
            console.warn(
              `${name} fetch returned non-ok status:`,
              res && res.status,
            );
            return [];
          }
        } else {
          console.warn(`${name} fetch failed:`, resResult.reason);
          return [];
        }
      };

      const [vehiclesData, schedulesData, staffData, groupsData] =
        await Promise.all([
          safeParse(results[0], "vehicles"),
          safeParse(results[1], "schedules"),
          safeParse(results[2], "staff"),
          safeParse(results[3], "groups"),
        ]);

      // Filter drivers from staff
      const driversData = Array.isArray(staffData)
        ? staffData.filter(
            (staff: any) => staff.role === "driver" && staff.is_active,
          )
        : [];

      // Fetch detailed group data with members for proper display
      const groupsWithMembers = Array.isArray(groupsData)
        ? await Promise.all(
            groupsData.map(async (group: any) => {
              if (!group || !group.id) return group;
              try {
                const groupDetailResponse = await fetchWithTimeout(
                  `/api/groups/${group.id}`,
                );
                if (groupDetailResponse.ok) {
                  return await groupDetailResponse.json();
                } else {
                  // Fallback to basic group data if detailed fetch fails
                  return group;
                }
              } catch (error) {
                console.warn(
                  `Failed to fetch detailed data for group ${group.id}:`,
                  error,
                );
                return group;
              }
            }),
          )
        : [];

      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      setSchedules(Array.isArray(schedulesData) ? schedulesData : []);
      setDrivers(driversData);
      setGroups(groupsWithMembers);
    } catch (error) {
      console.error("Error fetching transport data:", error);
      // Inform user via toast if available
      try {
        toast?.({
          title: "Failed to load transport data",
          description: String(error),
          variant: "destructive",
        });
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "tour bus":
      case "mini bus":
        return Bus;
      case "super jeep":
      case "suv":
        return Truck;
      default:
        return Car;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
      case "completed":
        return "default";
      case "in_use":
      case "in_transit":
        return "secondary";
      case "maintenance":
        return "outline";
      case "out_of_service":
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
      case "completed":
        return CheckCircle;
      case "maintenance":
        return Wrench;
      case "out_of_service":
      case "cancelled":
        return XCircle;
      default:
        return AlertTriangle;
    }
  };

  const getTransportTypeIcon = (type: string) => {
    switch (type) {
      case "airport_pickup":
      case "airport_dropoff":
        return Plane;
      case "activity":
        return Mountain;
      default:
        return Route;
    }
  };

  const getTransportTypeColor = (type: string) => {
    switch (type) {
      case "airport_pickup":
        return "text-blue-600";
      case "airport_dropoff":
        return "text-orange-600";
      case "activity":
        return "text-green-600";
      default:
        return "text-purple-600";
    }
  };

  const formatTransportType = (type: string) => {
    switch (type) {
      case "airport_pickup":
        return "Airport Pickup";
      case "airport_dropoff":
        return "Airport Dropoff";
      case "activity":
        return "Activity Transport";
      default:
        return "Custom Transport";
    }
  };

  const updateVehicleStatus = async (vehicleId: number, newStatus: string) => {
    try {
      const response = await fetchWithTimeout(`/api/vehicles/${vehicleId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error updating vehicle status:", error);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Helper function to get the correct time label based on transport type
  const getTimeLabel = (transportType: string) => {
    if (transportType === "airport_pickup") {
      return "Arrival";
    } else if (transportType === "airport_dropoff") {
      return "Departure";
    } else {
      return "Pickup";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTimeAMPM = (timeString: string, dateString?: string) => {
    if (!timeString) return "";

    try {
      // If we have a date, combine it with time, otherwise use today
      const baseDate = dateString
        ? dateString.split("T")[0]
        : new Date().toISOString().split("T")[0];
      const dateTime = new Date(`${baseDate}T${timeString}`);

      if (isNaN(dateTime.getTime())) return timeString; // Return original if invalid

      return dateTime.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return timeString; // Return original if error
    }
  };

  const getFlightDetails = (
    member: GroupMember | Group,
    transferType: "pickup" | "dropoff",
  ) => {
    const isGroup = "group_name" in member;

    if (transferType === "pickup") {
      const flightNumber = isGroup
        ? member.arrival_flight_number
        : (member as GroupMember).arrival_flight_number;
      const flightTime = isGroup
        ? member.arrival_flight_time
        : (member as GroupMember).arrival_flight_time;
      const flightDate = isGroup ? member.arrival_date : null;

      return {
        flightNumber,
        flightTime: flightTime ? formatTimeAMPM(flightTime, flightDate) : "",
        type: "Arrival",
      };
    } else {
      const flightNumber = isGroup
        ? member.departure_flight_number
        : (member as GroupMember).departure_flight_number;
      const flightTime = isGroup
        ? member.departure_flight_time
        : (member as GroupMember).departure_flight_time;
      const flightDate = isGroup ? member.departure_date : null;

      return {
        flightNumber,
        flightTime: flightTime ? formatTimeAMPM(flightTime, flightDate) : "",
        type: "Departure",
      };
    }
  };

  const isPassengerAlreadyAssigned = (
    passengerId: number,
    passengerType: "group" | "member",
    currentTransportType?: string,
  ) => {
    // Check if passenger is already assigned to the same transport type
    for (const schedule of schedules) {
      if (schedule.groups_data) {
        try {
          const groupsData =
            typeof schedule.groups_data === "string"
              ? JSON.parse(schedule.groups_data)
              : schedule.groups_data;

          if (Array.isArray(groupsData)) {
            const isAssigned = groupsData.some(
              (assignedPassenger: any) =>
                assignedPassenger.type === passengerType &&
                assignedPassenger.id === passengerId,
            );

            // Only consider it assigned if it's the same transport type (or if no type specified, check all)
            if (
              isAssigned &&
              (!currentTransportType ||
                schedule.transport_type === currentTransportType)
            ) {
              return {
                assigned: true,
                scheduleId: schedule.id,
                transportType: schedule.transport_type,
                pickupTime: schedule.pickup_time,
                vehicleNumber: schedule.vehicle_number,
              };
            }
          }
        } catch (error) {
          console.error(
            "Error parsing groups_data for schedule:",
            schedule.id,
            error,
          );
        }
      }

      // Also check legacy groups format (array of strings)
      if (schedule.groups && Array.isArray(schedule.groups)) {
        // For legacy format, we can't easily check individual members,
        // so we'll focus on the new format
      }
    }
    return { assigned: false };
  };

  const getAssignmentStatus = (
    passenger: Group | GroupMember,
    type: "group" | "member",
  ) => {
    // Determine current transport type based on selectedTransferType
    let currentTransportType = "";
    if (selectedTransferType === "pickup") {
      currentTransportType = "airport_pickup";
    } else if (selectedTransferType === "dropoff") {
      currentTransportType = "airport_dropoff";
    } else if (selectedTransferType === "custom") {
      currentTransportType = "custom";
    }

    return isPassengerAlreadyAssigned(passenger.id, type, currentTransportType);
  };

  const calculateTransportTime = (
    flightTime: string,
    flightDate: string,
    transferType: "pickup" | "dropoff",
  ) => {
    // Validate parameters first
    if (
      typeof flightTime !== "string" ||
      typeof flightDate !== "string" ||
      typeof transferType !== "string"
    ) {
      console.error("Invalid parameter types:", {
        flightTime: typeof flightTime,
        flightDate: typeof flightDate,
        transferType: typeof transferType,
      });
      return "";
    }

    if (!flightTime || !flightDate) {
      console.log("Missing flight time or date:", { flightTime, flightDate });
      return "";
    }

    // Check if parameters got mixed up (transferType should not contain time)
    if (
      transferType.includes(":") ||
      flightTime === "pickup" ||
      flightTime === "dropoff"
    ) {
      console.error("Parameters appear to be in wrong order:", {
        flightTime,
        flightDate,
        transferType,
      });
      return "";
    }

    try {
      // Debug logging
      console.log("Calculating transport time with:", {
        flightTime,
        flightDate,
        transferType,
      });

      // Ensure we have a proper date string
      let dateStr = flightDate;
      if (flightDate.includes("T")) {
        dateStr = flightDate.split("T")[0]; // Get just the date part
      }

      // Ensure time is in HH:MM format
      let timeStr = flightTime;
      if (!timeStr.includes(":")) {
        console.warn(
          "Flight time does not include colon, defaulting to 12:00:",
          timeStr,
        );
        timeStr = "12:00";
      }

      // Validate date format (YYYY-MM-DD)
      if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        console.error("Invalid date format:", dateStr);
        return "";
      }

      // Validate time format (HH:MM or H:MM)
      if (!timeStr.match(/^\d{1,2}:\d{2}$/)) {
        console.error("Invalid time format:", timeStr);
        return "";
      }

      const flightDateTime = new Date(`${dateStr}T${timeStr}`);

      // Validate the date
      if (isNaN(flightDateTime.getTime())) {
        console.error("Invalid flight date/time:", dateStr, timeStr);
        return "";
      }

      // Use original flight time for all transport types
      const transportTime = new Date(flightDateTime);

      const result = transportTime.toISOString().slice(0, 16);
      console.log("Calculated transport time:", result);
      return result;
    } catch (error) {
      console.error("Error calculating transport time:", error);
      return "";
    }
  };

  const handlePassengerSelection = (
    checked: boolean,
    type: "group" | "member",
    data: Group | GroupMember,
  ) => {
    if (checked) {
      setSelectedPassengers((prev) => [...prev, { id: data.id, type, data }]);

      // Auto-populate flight details and time for the first selected passenger
      if (selectedPassengers.length === 0) {
        let flightTime = "";
        let flightDate = "";
        let flightNum = "";

        if (type === "group") {
          const group = data as Group;
          console.log("Group data:", group);
          if (selectedTransferType === "pickup") {
            flightTime = group.arrival_flight_time || "";
            flightDate = group.arrival_date || group.tour_start_date || "";
            flightNum = group.arrival_flight_number || "";
          } else {
            flightTime = group.departure_flight_time || "";
            flightDate = group.departure_date || group.tour_end_date || "";
            flightNum = group.departure_flight_number || "";
          }
        } else {
          const member = data as GroupMember;
          console.log("Member data:", member);
          if (selectedTransferType === "pickup") {
            flightTime = member.arrival_flight_time || "";
            flightNum = member.arrival_flight_number || "";
            // For individual members, we need to get the group dates
            const memberGroup = groups.find((g) =>
              g.members?.some((m) => m.id === member.id),
            );
            flightDate =
              memberGroup?.arrival_date || memberGroup?.tour_start_date || "";
            console.log("Found member group:", memberGroup);
          } else {
            flightTime = member.departure_flight_time || "";
            flightNum = member.departure_flight_number || "";
            // For individual members, we need to get the group dates
            const memberGroup = groups.find((g) =>
              g.members?.some((m) => m.id === member.id),
            );
            flightDate =
              memberGroup?.departure_date || memberGroup?.tour_end_date || "";
            console.log("Found member group:", memberGroup);
          }
        }

        console.log("Extracted flight data:", {
          flightTime,
          flightDate,
          flightNum,
          selectedTransferType,
        });

        if (flightTime && flightDate) {
          // Ensure date is in YYYY-MM-DD format
          const dateStr = flightDate.includes("T")
            ? flightDate.split("T")[0]
            : flightDate.split(" ")[0];

          // Ensure time is in HH:MM format (pad single digits)
          let timeStr = flightTime;
          if (timeStr.length === 4 && timeStr.includes(":")) {
            const [hours, minutes] = timeStr.split(":");
            timeStr = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
          }

          const fullFlightDateTime = `${dateStr}T${timeStr}:00`;
          console.log("Constructing flight datetime:", {
            flightDate,
            flightTime,
            dateStr,
            timeStr,
            fullFlightDateTime,
          });
          setOriginalFlightTime(fullFlightDateTime);
          setFlightNumber(flightNum);
        } else {
          console.warn("Missing flight data:", {
            flightTime,
            flightDate,
            type,
            data,
          });
        }
      }
    } else {
      setSelectedPassengers((prev) =>
        prev.filter((p) => !(p.id === data.id && p.type === type)),
      );

      // Clear flight details if no passengers selected
      if (selectedPassengers.length === 1) {
        setOriginalFlightTime("");
        setFlightNumber("");
      }
    }
  };

  const isPassengerSelected = (type: "group" | "member", id: number) => {
    return selectedPassengers.some((p) => p.type === type && p.id === id);
  };

  const handleTransferTypeChange = (transferType: "pickup" | "dropoff") => {
    setSelectedTransferType(transferType);

    // Update times for selected passengers
    if (selectedPassengers.length > 0) {
      const firstPassenger = selectedPassengers[0];
      let flightTime = "";
      let flightDate = "";
      let flightNum = "";

      if (firstPassenger.type === "group") {
        const group = firstPassenger.data as Group;
        if (transferType === "pickup") {
          flightTime = group.arrival_flight_time || "";
          flightDate = group.arrival_date || group.tour_start_date || "";
          flightNum = group.arrival_flight_number || "";
        } else {
          flightTime = group.departure_flight_time || "";
          flightDate = group.departure_date || group.tour_end_date || "";
          flightNum = group.departure_flight_number || "";
        }
      } else {
        const member = firstPassenger.data as GroupMember;
        if (transferType === "pickup") {
          flightTime = member.arrival_flight_time || "";
          flightNum = member.arrival_flight_number || "";
          const memberGroup = groups.find((g) =>
            g.members?.some((m) => m.id === member.id),
          );
          flightDate =
            memberGroup?.arrival_date || memberGroup?.tour_start_date || "";
        } else {
          flightTime = member.departure_flight_time || "";
          flightNum = member.departure_flight_number || "";
          const memberGroup = groups.find((g) =>
            g.members?.some((m) => m.id === member.id),
          );
          flightDate =
            memberGroup?.departure_date || memberGroup?.tour_end_date || "";
        }
      }

      if (flightTime && flightDate) {
        // Ensure date is in YYYY-MM-DD format
        const dateStr = flightDate.includes("T")
          ? flightDate.split("T")[0]
          : flightDate.split(" ")[0];

        // Ensure time is in HH:MM format (pad single digits)
        let timeStr = flightTime;
        if (timeStr.length === 4 && timeStr.includes(":")) {
          const [hours, minutes] = timeStr.split(":");
          timeStr = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
        }

        const fullFlightDateTime = `${dateStr}T${timeStr}:00`;
        console.log("Constructing flight datetime (transfer type change):", {
          flightDate,
          flightTime,
          dateStr,
          timeStr,
          fullFlightDateTime,
        });
        setOriginalFlightTime(fullFlightDateTime);
        setFlightNumber(flightNum);
      }
    }
  };

  const handleCustomerSelection = (customer: {
    id: number;
    type: "group" | "member";
    data: Group | GroupMember;
  }) => {
    setSelectedCustomer(customer);
    setCurrentStep(2);
    console.log("Selected customer:", customer);
  };

  const handleTransferTypeSelection = (transferType: "pickup" | "dropoff") => {
    setSelectedTransferType(transferType);

    // Auto-populate locations based on transfer type
    if (transferType === "pickup") {
      setPickupLocation("Yellowknife Airport");
      setDropoffLocation("");
    } else if (transferType === "dropoff") {
      setPickupLocation("");
      setDropoffLocation("Yellowknife Airport");
    } else {
      setPickupLocation("");
      setDropoffLocation("");
    }

    if (selectedCustomer) {
      // Automatically fetch flight details based on customer and transfer type
      const customerData = selectedCustomer.data;
      let flightTime = "";
      let flightDate = "";
      let flightNum = "";

      if (selectedCustomer.type === "group") {
        const group = customerData as Group;
        if (transferType === "pickup") {
          flightTime = group.arrival_flight_time || "";
          flightDate = group.arrival_date || group.tour_start_date || "";
          flightNum = group.arrival_flight_number || "";
        } else {
          flightTime = group.departure_flight_time || "";
          flightDate = group.departure_date || group.tour_end_date || "";
          flightNum = group.departure_flight_number || "";
        }
      } else {
        const member = customerData as GroupMember;
        if (transferType === "pickup") {
          flightTime = member.arrival_flight_time || "";
          flightNum = member.arrival_flight_number || "";
          // Find the group this member belongs to for dates
          const memberGroup = groups.find((g) =>
            g.members?.some((m) => m.id === member.id),
          );
          flightDate =
            memberGroup?.arrival_date || memberGroup?.tour_start_date || "";
        } else {
          flightTime = member.departure_flight_time || "";
          flightNum = member.departure_flight_number || "";
          const memberGroup = groups.find((g) =>
            g.members?.some((m) => m.id === member.id),
          );
          flightDate =
            memberGroup?.departure_date || memberGroup?.tour_end_date || "";
        }
      }

      if (flightTime && flightDate) {
        // Ensure date is in YYYY-MM-DD format
        const dateStr = flightDate.includes("T")
          ? flightDate.split("T")[0]
          : flightDate.split(" ")[0];

        // Ensure time is in HH:MM format (pad single digits)
        let timeStr = flightTime;
        if (timeStr.length === 4 && timeStr.includes(":")) {
          const [hours, minutes] = timeStr.split(":");
          timeStr = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
        }

        const fullFlightDateTime = `${dateStr}T${timeStr}:00`;
        console.log("Constructing flight datetime (transfer type selection):", {
          flightDate,
          flightTime,
          dateStr,
          timeStr,
          fullFlightDateTime,
        });
        setOriginalFlightTime(fullFlightDateTime);
        setFlightNumber(flightNum);
        setCurrentStep(3);
      } else {
        console.warn(
          "No flight details found for selected customer and transfer type",
        );
        setCurrentStep(3); // Still proceed to next step
      }
    }
  };

  const getAllCustomers = () => {
    const customers: Array<{
      id: number;
      type: "group" | "member";
      data: Group | GroupMember;
      displayName: string;
    }> = [];

    groups
      .filter((g) => g.status === "active")
      .forEach((group) => {
        if (group.traveling_together) {
          // Add group as a single customer
          customers.push({
            id: group.id,
            type: "group",
            data: group,
            displayName: `${group.group_name} (${group.total_members} passengers)`,
          });
        } else {
          // Add individual members
          group.members?.forEach((member) => {
            customers.push({
              id: member.id,
              type: "member",
              data: member,
              displayName: `${member.first_name} ${member.last_name}${member.is_leader ? " (Leader)" : ""} - ${group.group_name}`,
            });
          });
        }
      });

    return customers;
  };

  const handleScheduleTransport = async () => {
    if (
      !pickupLocation ||
      !dropoffLocation ||
      !selectedVehicle ||
      !selectedDriver
    ) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate proper pickup time based on flight time
      let calculatedPickupTime = new Date().toISOString(); // fallback to current time

      // Try to get flight time from originalFlightTime state or from selected passengers
      let flightTimeToUse = originalFlightTime;

      if (
        !flightTimeToUse &&
        selectedPassengers.length > 0 &&
        (selectedTransferType === "pickup" ||
          selectedTransferType === "dropoff")
      ) {
        // If originalFlightTime is not set, try to get it from the first selected passenger
        const firstPassenger = selectedPassengers[0];
        let flightTime = "";
        let flightDate = "";

        if (firstPassenger.type === "group") {
          const group = firstPassenger.data as Group;
          if (selectedTransferType === "pickup") {
            flightTime = group.arrival_flight_time || "";
            flightDate = group.arrival_date || group.tour_start_date || "";
          } else {
            flightTime = group.departure_flight_time || "";
            flightDate = group.departure_date || group.tour_end_date || "";
          }
        } else {
          const member = firstPassenger.data as GroupMember;
          if (selectedTransferType === "pickup") {
            flightTime = member.arrival_flight_time || "";
            const memberGroup = groups.find((g) =>
              g.members?.some((m) => m.id === member.id),
            );
            flightDate =
              memberGroup?.arrival_date || memberGroup?.tour_start_date || "";
          } else {
            flightTime = member.departure_flight_time || "";
            const memberGroup = groups.find((g) =>
              g.members?.some((m) => m.id === member.id),
            );
            flightDate =
              memberGroup?.departure_date || memberGroup?.tour_end_date || "";
          }
        }

        if (flightTime && flightDate) {
          const dateStr = flightDate.includes("T")
            ? flightDate.split("T")[0]
            : flightDate.split(" ")[0];
          let timeStr = flightTime;
          if (timeStr.length === 4 && timeStr.includes(":")) {
            const [hours, minutes] = timeStr.split(":");
            timeStr = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
          }
          flightTimeToUse = `${dateStr}T${timeStr}:00`;
          console.log(
            "��� Reconstructed flight time from passenger data:",
            flightTimeToUse,
          );
        }
      }

      if (
        flightTimeToUse &&
        (selectedTransferType === "pickup" ||
          selectedTransferType === "dropoff")
      ) {
        const flightDateTime = new Date(flightTimeToUse);

        if (!isNaN(flightDateTime.getTime())) {
          // Use original flight time for both pickups and dropoffs
          calculatedPickupTime = flightTimeToUse;
          console.log("✅ Using original flight time:", calculatedPickupTime);
        } else {
          console.error("❌ Invalid flight datetime:", flightTimeToUse);
        }
      } else {
        console.warn(
          "⚠️ No flight time available for calculation. Using current time.",
          {
            flightTimeToUse,
            selectedTransferType,
            hasPassengers: selectedPassengers.length > 0,
          },
        );
      }

      // Determine transport type based on selection
      let transportType = "custom";
      if (selectedTransferType === "pickup") {
        transportType = "airport_pickup";
      } else if (selectedTransferType === "dropoff") {
        transportType = "airport_dropoff";
      }

      // Prepare passenger data for database lookup
      const passengerData = selectedPassengers.map((passenger) => ({
        type: passenger.type,
        id: passenger.data.id,
        name:
          passenger.type === "group"
            ? (passenger.data as Group).group_name
            : `${(passenger.data as GroupMember).first_name} ${(passenger.data as GroupMember).last_name}`,
        memberCount:
          passenger.type === "group"
            ? (passenger.data as Group).total_members
            : 1,
      }));

      const scheduleData = {
        transport_type: transportType,
        activity_name: null,
        vehicle_id: parseInt(selectedVehicle),
        driver_id: parseInt(selectedDriver),
        pickup_location: pickupLocation,
        pickup_time: calculatedPickupTime, // This will be overridden by DB data if available
        dropoff_location: dropoffLocation,
        estimated_dropoff_time: null,
        passenger_count: selectedPassengers.reduce((total, passenger) => {
          if (passenger.type === "group") {
            return total + (passenger.data as Group).total_members;
          } else {
            return total + 1;
          }
        }, 0),
        groups_data: passengerData,
        notes: `${selectedTransferType === "pickup" ? "Airport pickup" : selectedTransferType === "dropoff" ? "Airport dropoff" : "Transport"} from ${pickupLocation} to ${dropoffLocation}`,
        fetch_from_database: true, // Flag to fetch flight times from database
      };

      console.log("Submitting transport schedule:", scheduleData);

      const response = await fetchWithTimeout("/api/transport/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scheduleData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Transport scheduled successfully:", result);

        // Close dialog and refresh data
        setIsScheduleDialogOpen(false);
        fetchData(); // Refresh the schedules list

        // You could add a success notification here
      } else {
        // Handle error response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorResult = await response.json();
          errorMessage =
            errorResult.message || errorResult.error || errorMessage;
        } catch (parseError) {
          // If response is not JSON, use the status text
          console.warn("Could not parse error response as JSON:", parseError);
        }
        console.error("Failed to schedule transport:", errorMessage);
        // You could add error notification here
      }
    } catch (error) {
      console.error("Error scheduling transport:", error);
      // You could add error notification here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewTransportDetails = (schedule: TransportSchedule) => {
    setSelectedScheduleForDetail(schedule);
    setIsDetailDialogOpen(true);
  };

  const handleStatusChange = async (scheduleId: number, newStatus: string) => {
    try {
      const response = await fetchWithTimeout(
        `/api/transport/schedules/${scheduleId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (response.ok) {
        fetchData(); // Refresh the schedules list

        // Update the selected schedule for detail if it's the same one
        if (
          selectedScheduleForDetail &&
          selectedScheduleForDetail.id === scheduleId
        ) {
          setSelectedScheduleForDetail({
            ...selectedScheduleForDetail,
            status: newStatus,
          });
        }

        console.log(`Transport status changed to ${newStatus}`);
      } else {
        console.error(`Failed to change transport status to ${newStatus}`);
      }
    } catch (error) {
      console.error(`Error changing transport status to ${newStatus}:`, error);
    }
  };

  const handleDeleteTransport = (schedule: TransportSchedule) => {
    setScheduleToDelete(schedule);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteTransport = async () => {
    if (!scheduleToDelete) return;

    try {
      const response = await fetchWithTimeout(
        `/api/transport/schedules/${scheduleToDelete.id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        fetchData(); // Refresh the schedules list
        console.log("Transport deleted successfully");
        setIsDeleteDialogOpen(false);
        setScheduleToDelete(null);
      } else {
        console.error("Failed to delete transport");
      }
    } catch (error) {
      console.error("Error deleting transport:", error);
    }
  };

  const handleDropoffLocationUpdate = async () => {
    if (!selectedScheduleForDetail || !editingDropoffLocation.trim()) return;

    try {
      const response = await fetchWithTimeout(
        `/api/transport/schedules/${selectedScheduleForDetail.id}/dropoff-location`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dropoff_location: editingDropoffLocation.trim(),
          }),
        },
      );

      if (response.ok) {
        // Update the selected schedule for detail
        setSelectedScheduleForDetail({
          ...selectedScheduleForDetail,
          dropoff_location: editingDropoffLocation.trim(),
        });
        setIsEditingDropoff(false);
        setEditingDropoffLocation("");
        fetchData(); // Refresh the schedules list
        console.log("Dropoff location updated successfully");
      } else {
        console.error("Failed to update dropoff location");
      }
    } catch (error) {
      console.error("Error updating dropoff location:", error);
    }
  };

  const startEditingDropoff = () => {
    if (selectedScheduleForDetail) {
      setEditingDropoffLocation(selectedScheduleForDetail.dropoff_location);
      setIsEditingDropoff(true);
    }
  };

  const cancelEditingDropoff = () => {
    setIsEditingDropoff(false);
    setEditingDropoffLocation("");
  };

  const handlePickupLocationUpdate = async () => {
    if (!selectedScheduleForDetail || !editingPickupLocation.trim()) return;

    try {
      const response = await fetchWithTimeout(
        `/api/transport/schedules/${selectedScheduleForDetail.id}/pickup-location`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pickup_location: editingPickupLocation.trim(),
          }),
        },
      );

      if (response.ok) {
        // Update the selected schedule for detail
        setSelectedScheduleForDetail({
          ...selectedScheduleForDetail,
          pickup_location: editingPickupLocation.trim(),
        });
        setIsEditingPickup(false);
        setEditingPickupLocation("");
        fetchData(); // Refresh the schedules list
        console.log("Pickup location updated successfully");
      } else {
        console.error("Failed to update pickup location");
      }
    } catch (error) {
      console.error("Error updating pickup location:", error);
    }
  };

  const startEditingPickup = () => {
    if (selectedScheduleForDetail) {
      setEditingPickupLocation(selectedScheduleForDetail.pickup_location);
      setIsEditingPickup(true);
    }
  };

  const cancelEditingPickup = () => {
    setIsEditingPickup(false);
    setEditingPickupLocation("");
  };

  const getDetailedPassengerInfo = (schedule: TransportSchedule) => {
    if (!schedule.groups || !Array.isArray(schedule.groups)) {
      return [];
    }

    const passengerDetails: Array<{
      name: string;
      groupName: string;
      type: "group" | "member";
      memberCount: number;
    }> = [];

    schedule.groups.forEach((passenger: any) => {
      if (passenger.type === "group") {
        const group = groups.find((g) => g.id === passenger.id);
        if (group) {
          if (group.members && group.members.length > 0) {
            group.members.forEach((member) => {
              passengerDetails.push({
                name: `${member.first_name} ${member.last_name}`,
                groupName: group.group_name,
                type: "member",
                memberCount: 1,
              });
            });
          } else {
            passengerDetails.push({
              name: `${group.group_name} (${group.total_members} passengers)`,
              groupName: group.group_name,
              type: "group",
              memberCount: group.total_members,
            });
          }
        } else {
          passengerDetails.push({
            name: passenger.name || "Unknown Group",
            groupName: passenger.name || "Unknown Group",
            type: "group",
            memberCount: passenger.memberCount || 1,
          });
        }
      } else if (passenger.type === "member") {
        let memberGroupName = "Unknown Group";
        for (const group of groups) {
          if (group.members?.some((m) => m.id === passenger.id)) {
            memberGroupName = group.group_name;
            break;
          }
        }
        passengerDetails.push({
          name: passenger.name,
          groupName: memberGroupName,
          type: "member",
          memberCount: 1,
        });
      }
    });

    return passengerDetails;
  };

  type CombinedAirportTransfer = {
    groupId: number;
    groupName: string;
    passengerCount: number;
    pickup?: TransportSchedule;
    dropoff?: TransportSchedule;
  };

  const buildCombinedAirportTransfers = (): CombinedAirportTransfer[] => {
    const map = new Map<number, CombinedAirportTransfer>();

    const airportSchedules = schedules.filter(
      (s) =>
        (s.transport_type === "airport_pickup" ||
          s.transport_type === "airport_dropoff") &&
        Array.isArray(s.groups),
    );

    for (const s of airportSchedules) {
      const groupEntry = (s.groups as any[]).find(
        (g) => g && g.type === "group" && typeof g.id === "number",
      );
      if (!groupEntry) {
        // Not a traveling-together group; skip combining
        continue;
      }
      const gid = groupEntry.id as number;
      const gname = groupEntry.name || groupEntry.group_name || "Group";
      const existing = map.get(gid) || {
        groupId: gid,
        groupName: gname,
        passengerCount: s.passenger_count || groupEntry.memberCount || 0,
      };
      if (s.transport_type === "airport_pickup") existing.pickup = s;
      if (s.transport_type === "airport_dropoff") existing.dropoff = s;
      existing.passengerCount =
        existing.passengerCount ||
        s.passenger_count ||
        groupEntry.memberCount ||
        0;
      map.set(gid, existing);
    }

    // Return unsorted; we'll sort per view (pickup/dropoff) newest->oldest
    const list = Array.from(map.values());
    return list;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading transport data...</p>
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
          <h1 className="text-3xl font-bold text-foreground">
            Transport Management
          </h1>
          <p className="text-muted-foreground">
            Manage vehicles, drivers, and transport schedules
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Dialog
            open={isScheduleDialogOpen}
            onOpenChange={(open) => {
              setIsScheduleDialogOpen(open);
              if (!open) {
                // Reset state when dialog is closed
                setPickupLocation("");
                setDropoffLocation("");
                setSelectedTransferType("pickup");
                setSelectedVehicle("");
                setSelectedDriver("");
                setIsSubmitting(false);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Schedule Transport
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Plane className="h-5 w-5 text-blue-600" />
                  <span>Schedule Transport</span>
                </DialogTitle>
                <DialogDescription>
                  Schedule transport for passengers
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Transport Details */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">
                      Transport Type
                    </Label>
                    <Select
                      value={selectedTransferType}
                      onValueChange={(
                        value: "pickup" | "dropoff" | "custom",
                      ) => {
                        setSelectedTransferType(value);
                        // Auto-populate locations based on transport type
                        if (value === "pickup") {
                          setPickupLocation("Yellowknife Airport");
                          setDropoffLocation("");
                        } else if (value === "dropoff") {
                          setPickupLocation("");
                          setDropoffLocation("Yellowknife Airport");
                        } else {
                          setPickupLocation("");
                          setDropoffLocation("");
                        }
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select transport type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pickup">Airport Pickup</SelectItem>
                        <SelectItem value="dropoff">Airport Dropoff</SelectItem>
                        <SelectItem value="custom">Custom Transport</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Pickup Location
                      </Label>
                      <Input
                        value={pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value)}
                        placeholder={
                          selectedTransferType === "pickup"
                            ? "Yellowknife Airport"
                            : "Enter pickup address or location"
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Dropoff Location
                      </Label>
                      <Input
                        value={dropoffLocation}
                        onChange={(e) => setDropoffLocation(e.target.value)}
                        placeholder={
                          selectedTransferType === "dropoff"
                            ? "Yellowknife Airport"
                            : "Enter dropoff address or destination"
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Airport Transfer Form */}
                {scheduleType === "airport" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Transfer Type</Label>
                        <Select
                          value={selectedTransferType}
                          onValueChange={handleTransferTypeChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select transfer type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pickup">
                              Airport Pickup
                            </SelectItem>
                            <SelectItem value="dropoff">
                              Airport Dropoff
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedTransferType !== "custom" && (
                        <div>
                          <Label>Flight Overview</Label>
                          {originalFlightTime && (
                            <div className="mt-2 p-3 bg-blue-50 rounded-md border">
                              <div className="text-sm text-blue-700">
                                <div className="font-medium mb-2">
                                  Original Flight Details:
                                </div>
                                <div className="flex items-center justify-between bg-white p-2 rounded border">
                                  <div>
                                    <div className="font-semibold text-blue-800">
                                      Flight {flightNumber}
                                    </div>
                                    <div className="text-blue-600">
                                      {new Date(
                                        originalFlightTime,
                                      ).toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-blue-600 font-medium">
                                      Original{" "}
                                      {selectedTransferType === "pickup"
                                        ? "arrival"
                                        : "departure"}{" "}
                                      time
                                    </div>
                                    <div className="text-xs text-blue-500">
                                      Transport scheduled at original flight
                                      time:{" "}
                                      {new Date(
                                        originalFlightTime,
                                      ).toLocaleDateString()}{" "}
                                      {new Date(
                                        originalFlightTime,
                                      ).toLocaleTimeString()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          {!originalFlightTime && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                              <div className="text-sm text-gray-600 text-center">
                                Select passengers to view flight details
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Passenger Selection with Search */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base font-semibold">
                          Select Passengers
                        </Label>
                        {selectedPassengers.length > 0 && (
                          <div className="flex items-center space-x-2 px-3 py-1 bg-primary/10 rounded-full">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="font-medium text-primary text-sm">
                              {selectedPassengers.reduce((total, passenger) => {
                                if (passenger.type === "group") {
                                  return (
                                    total +
                                    (passenger.data as Group).total_members
                                  );
                                } else {
                                  return total + 1;
                                }
                              }, 0)}{" "}
                              selected
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Search Bar */}
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search groups or passengers by name..."
                          value={passengerSearchTerm}
                          onChange={(e) =>
                            setPassengerSearchTerm(e.target.value)
                          }
                          className="pl-10"
                        />
                      </div>

                      {/* Selected Passengers Display */}
                      {selectedPassengers.length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border">
                          <div className="text-sm font-medium text-blue-800 mb-2">
                            Selected Passengers:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedPassengers.map((passenger, index) => (
                              <div
                                key={`${passenger.type}-${passenger.id}`}
                                className="flex items-center space-x-1 bg-white px-2 py-1 rounded border"
                              >
                                <span className="text-xs">
                                  {passenger.type === "group"
                                    ? `${(passenger.data as Group).group_name} (${(passenger.data as Group).total_members})`
                                    : `${(passenger.data as GroupMember).first_name} ${(passenger.data as GroupMember).last_name}`}
                                </span>
                                <button
                                  onClick={() =>
                                    handlePassengerSelection(
                                      false,
                                      passenger.type,
                                      passenger.data,
                                    )
                                  }
                                  className="text-gray-400 hover:text-red-500 ml-1"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Passenger List */}
                      <div className="max-h-72 overflow-y-auto border rounded-lg">
                        {groups
                          .filter((g) => g.status === "active")
                          .filter((group) => {
                            if (!passengerSearchTerm) return true;
                            const searchLower =
                              passengerSearchTerm.toLowerCase();

                            // Search group name
                            if (
                              group.group_name
                                ?.toLowerCase()
                                .includes(searchLower)
                            )
                              return true;

                            // Search member names
                            if (
                              group.members?.some((member) =>
                                `${member.first_name} ${member.last_name}`
                                  .toLowerCase()
                                  .includes(searchLower),
                              )
                            )
                              return true;

                            return false;
                          })
                          .map((group) => (
                            <div
                              key={group.id}
                              className="border-b last:border-b-0"
                            >
                              {group.traveling_together ? (
                                /* Group traveling together */
                                <div className="p-3 hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center space-x-3">
                                    <input
                                      type="checkbox"
                                      id={`group-${group.id}`}
                                      checked={isPassengerSelected(
                                        "group",
                                        group.id,
                                      )}
                                      onChange={(e) =>
                                        handlePassengerSelection(
                                          e.target.checked,
                                          "group",
                                          group,
                                        )
                                      }
                                      disabled={
                                        getAssignmentStatus(group, "group")
                                          .assigned
                                      }
                                      className="rounded border-gray-300"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        <h4 className="font-medium text-gray-900">
                                          {group.group_name}
                                        </h4>
                                        <Badge
                                          variant="secondary"
                                          className="text-xs bg-blue-100 text-blue-700"
                                        >
                                          <Users className="h-3 w-3 mr-1" />
                                          Together ({group.total_members})
                                        </Badge>
                                        {getAssignmentStatus(group, "group")
                                          .assigned && (
                                          <Badge
                                            variant="destructive"
                                            className="text-xs"
                                          >
                                            Already Assigned
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-600 mt-1">
                                        {selectedTransferType === "pickup" &&
                                          group.arrival_flight_number && (
                                            <span className="text-blue-600">
                                              ✈️ Arrival:{" "}
                                              {group.arrival_flight_number} at{" "}
                                              {group.arrival_flight_time}
                                            </span>
                                          )}
                                        {selectedTransferType === "dropoff" &&
                                          group.departure_flight_number && (
                                            <span className="text-orange-600">
                                              �� Departure:{" "}
                                              {group.departure_flight_number} at{" "}
                                              {group.departure_flight_time}
                                            </span>
                                          )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                /* Group traveling separately */
                                <div className="p-3">
                                  <div className="mb-3">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-medium text-gray-900">
                                        {group.group_name}
                                      </h4>
                                      <div className="flex items-center space-x-2">
                                        {selectedTransferType === "custom" ? (
                                          <Badge
                                            variant="outline"
                                            className="text-xs border-purple-300 text-purple-700 bg-purple-50"
                                          >
                                            <Users className="h-3 w-3 mr-1" />
                                            Individual Selection
                                          </Badge>
                                        ) : group.traveling_together ? (
                                          <Badge
                                            variant="secondary"
                                            className="text-xs bg-blue-100 text-blue-700"
                                          >
                                            <Users className="h-3 w-3 mr-1" />
                                            Together ({group.total_members})
                                          </Badge>
                                        ) : (
                                          <Badge
                                            variant="outline"
                                            className="text-xs border-orange-300 text-orange-700 bg-orange-50"
                                          >
                                            <Users className="h-3 w-3 mr-1" />
                                            Traveling Separately
                                          </Badge>
                                        )}
                                        {selectedTransferType === "custom" && (
                                          <span className="text-xs text-gray-500 italic">
                                            Mix with any group
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Group-level selection for traveling together (non-custom) */}
                                  {group.traveling_together &&
                                    selectedTransferType !== "custom" && (
                                      <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-center space-x-3">
                                          <input
                                            type="checkbox"
                                            id={`group-${group.id}`}
                                            checked={isPassengerSelected(
                                              "group",
                                              group.id,
                                            )}
                                            onChange={(e) =>
                                              handlePassengerSelection(
                                                e.target.checked,
                                                "group",
                                                group,
                                              )
                                            }
                                            disabled={
                                              getAssignmentStatus(
                                                group,
                                                "group",
                                              ).assigned
                                            }
                                            className="rounded border-gray-300"
                                          />
                                          <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                              <span className="font-medium text-blue-800">
                                                Select entire group (
                                                {group.total_members}{" "}
                                                passengers)
                                              </span>
                                              {getAssignmentStatus(
                                                group,
                                                "group",
                                              ).assigned && (
                                                <Badge
                                                  variant="destructive"
                                                  className="text-xs"
                                                >
                                                  Already Assigned
                                                </Badge>
                                              )}
                                            </div>
                                            <div className="text-sm text-blue-600 mt-1">
                                              {selectedTransferType ===
                                                "pickup" &&
                                                group.arrival_flight_number && (
                                                  <span>
                                                    ✈️ Arrival:{" "}
                                                    {
                                                      group.arrival_flight_number
                                                    }{" "}
                                                    at{" "}
                                                    {group.arrival_flight_time}
                                                  </span>
                                                )}
                                              {selectedTransferType ===
                                                "dropoff" &&
                                                group.departure_flight_number && (
                                                  <span>
                                                    🛫 Departure:{" "}
                                                    {
                                                      group.departure_flight_number
                                                    }{" "}
                                                    at{" "}
                                                    {
                                                      group.departure_flight_time
                                                    }
                                                  </span>
                                                )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                  {/* Always show individual members when they exist */}
                                  {group.members &&
                                    group.members.length > 0 && (
                                      <div className="ml-4 space-y-2">
                                        <div className="text-xs text-gray-600 mb-2 font-medium">
                                          {selectedTransferType === "custom"
                                            ? "Select individual passengers (can mix with other groups):"
                                            : group.traveling_together
                                              ? "Individual passengers (or select entire group above):"
                                              : "Select individual passengers:"}
                                        </div>
                                        {group.members
                                          .filter((member) => {
                                            if (!passengerSearchTerm)
                                              return true;
                                            return `${member.first_name} ${member.last_name}`
                                              .toLowerCase()
                                              .includes(
                                                passengerSearchTerm.toLowerCase(),
                                              );
                                          })
                                          .map((member) => {
                                            const assignmentStatus =
                                              getAssignmentStatus(
                                                member,
                                                "member",
                                              );
                                            const isAlreadyAssigned =
                                              assignmentStatus.assigned;

                                            return (
                                              <div
                                                key={member.id}
                                                className={`flex items-center space-x-3 p-3 rounded-md transition-colors border ${
                                                  isAlreadyAssigned
                                                    ? "bg-red-50 border-red-200 opacity-75"
                                                    : selectedTransferType ===
                                                        "custom"
                                                      ? "bg-purple-50 border-purple-200 hover:bg-purple-100"
                                                      : "bg-orange-50 border-orange-200 hover:bg-orange-100"
                                                }`}
                                              >
                                                <input
                                                  type="checkbox"
                                                  id={`member-${member.id}`}
                                                  checked={isPassengerSelected(
                                                    "member",
                                                    member.id,
                                                  )}
                                                  onChange={(e) =>
                                                    handlePassengerSelection(
                                                      e.target.checked,
                                                      "member",
                                                      member,
                                                    )
                                                  }
                                                  disabled={isAlreadyAssigned}
                                                  className="rounded border-gray-300 w-4 h-4"
                                                />
                                                <div className="flex-1">
                                                  <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                      <span
                                                        className={`font-semibold ${isAlreadyAssigned ? "text-gray-500" : "text-gray-900"}`}
                                                      >
                                                        {member.first_name}{" "}
                                                        {member.last_name}
                                                      </span>
                                                      {member.is_leader && (
                                                        <Badge
                                                          variant="outline"
                                                          className="text-xs bg-blue-100 text-blue-700 border-blue-300"
                                                        >
                                                          Leader
                                                        </Badge>
                                                      )}
                                                      {isAlreadyAssigned && (
                                                        <Badge
                                                          variant="destructive"
                                                          className="text-xs"
                                                        >
                                                          Already Assigned
                                                        </Badge>
                                                      )}
                                                      {selectedTransferType ===
                                                        "custom" && (
                                                        <Badge
                                                          variant="outline"
                                                          className="text-xs bg-purple-100 text-purple-700 border-purple-300"
                                                        >
                                                          From{" "}
                                                          {group.group_name}
                                                        </Badge>
                                                      )}
                                                    </div>
                                                  </div>

                                                  {/* Assignment Information */}
                                                  {isAlreadyAssigned && (
                                                    <div className="mt-1 text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                                                      🚗 Assigned to{" "}
                                                      {
                                                        assignmentStatus.vehicleNumber
                                                      }{" "}
                                                      -{" "}
                                                      {assignmentStatus.transportType?.replace(
                                                        "_",
                                                        " ",
                                                      )}
                                                      at{" "}
                                                      {new Date(
                                                        assignmentStatus.pickupTime,
                                                      ).toLocaleString()}
                                                    </div>
                                                  )}

                                                  {/* Flight Information - Hide for custom transport */}
                                                  {selectedTransferType !==
                                                    "custom" && (
                                                    <div className="mt-2 space-y-1">
                                                      {(() => {
                                                        const arrivalDetails =
                                                          getFlightDetails(
                                                            member,
                                                            "pickup",
                                                          );
                                                        const departureDetails =
                                                          getFlightDetails(
                                                            member,
                                                            "dropoff",
                                                          );

                                                        return (
                                                          <>
                                                            {arrivalDetails.flightNumber && (
                                                              <div
                                                                className={`text-xs flex items-center space-x-2 ${
                                                                  selectedTransferType ===
                                                                  "pickup"
                                                                    ? "font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded"
                                                                    : "text-gray-600"
                                                                }`}
                                                              >
                                                                <span>
                                                                  ✈️ Arrival:
                                                                </span>
                                                                <span className="font-mono font-semibold">
                                                                  {
                                                                    arrivalDetails.flightNumber
                                                                  }
                                                                </span>
                                                                <span>
                                                                  {
                                                                    arrivalDetails.flightTime
                                                                  }
                                                                </span>
                                                              </div>
                                                            )}
                                                            {departureDetails.flightNumber && (
                                                              <div
                                                                className={`text-xs flex items-center space-x-2 ${
                                                                  selectedTransferType ===
                                                                  "dropoff"
                                                                    ? "font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded"
                                                                    : "text-gray-600"
                                                                }`}
                                                              >
                                                                <span>
                                                                  🛫 Departure:
                                                                </span>
                                                                <span className="font-mono font-semibold">
                                                                  {
                                                                    departureDetails.flightNumber
                                                                  }
                                                                </span>
                                                                <span>
                                                                  {
                                                                    departureDetails.flightTime
                                                                  }
                                                                </span>
                                                              </div>
                                                            )}
                                                            {!arrivalDetails.flightNumber &&
                                                              !departureDetails.flightNumber && (
                                                                <div className="text-xs text-gray-400 italic">
                                                                  No flight
                                                                  details
                                                                  available
                                                                </div>
                                                              )}
                                                          </>
                                                        );
                                                      })()}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>
                          ))}

                        {/* No results message */}
                        {passengerSearchTerm &&
                          groups.filter((g) => {
                            const searchLower =
                              passengerSearchTerm.toLowerCase();
                            return (
                              g.group_name
                                ?.toLowerCase()
                                .includes(searchLower) ||
                              g.members?.some((member) =>
                                `${member.first_name} ${member.last_name}`
                                  .toLowerCase()
                                  .includes(searchLower),
                              )
                            );
                          }).length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                              <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p>
                                No groups or passengers found matching "
                                {passengerSearchTerm}"
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Activity Transport Form */}
                {scheduleType === "activity" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Activity</Label>
                        <Select
                          value={selectedActivity}
                          onValueChange={setSelectedActivity}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Choose activity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ice_fishing">
                              <div className="flex items-center space-x-2">
                                <Mountain className="h-4 w-4" />
                                <span>Ice Fishing</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="city_tour">
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4" />
                                <span>City Tour</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="northern_lights">
                              <div className="flex items-center space-x-2">
                                <Mountain className="h-4 w-4" />
                                <span>Northern Lights</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="glacier_tour">
                              <div className="flex items-center space-x-2">
                                <Mountain className="h-4 w-4" />
                                <span>Glacier Tour</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="volcano_tour">
                              <div className="flex items-center space-x-2">
                                <Mountain className="h-4 w-4" />
                                <span>Volcano Tour</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Departure Time
                        </Label>
                        <Input
                          type="datetime-local"
                          className="mt-1"
                          value={scheduledDateTime}
                          onChange={(e) => setScheduledDateTime(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Participants Selection with Search - Reuse the same component */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base font-semibold">
                          Select Participants
                        </Label>
                        {selectedPassengers.length > 0 && (
                          <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 rounded-full">
                            <Users className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-600 text-sm">
                              {selectedPassengers.reduce((total, passenger) => {
                                if (passenger.type === "group") {
                                  return (
                                    total +
                                    (passenger.data as Group).total_members
                                  );
                                } else {
                                  return total + 1;
                                }
                              }, 0)}{" "}
                              participants
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Search Bar */}
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search groups or participants by name..."
                          value={passengerSearchTerm}
                          onChange={(e) =>
                            setPassengerSearchTerm(e.target.value)
                          }
                          className="pl-10"
                        />
                      </div>

                      {/* Selected Passengers Display */}
                      {selectedPassengers.length > 0 && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg border">
                          <div className="text-sm font-medium text-green-800 mb-2">
                            Selected Participants:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedPassengers.map((passenger) => (
                              <div
                                key={`${passenger.type}-${passenger.id}`}
                                className="flex items-center space-x-1 bg-white px-2 py-1 rounded border"
                              >
                                <span className="text-xs">
                                  {passenger.type === "group"
                                    ? `${(passenger.data as Group).group_name} (${(passenger.data as Group).total_members})`
                                    : `${(passenger.data as GroupMember).first_name} ${(passenger.data as GroupMember).last_name}`}
                                </span>
                                <button
                                  onClick={() =>
                                    handlePassengerSelection(
                                      false,
                                      passenger.type,
                                      passenger.data,
                                    )
                                  }
                                  className="text-gray-400 hover:text-red-500 ml-1"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Participant List - Same as airport transfer */}
                      <div className="max-h-72 overflow-y-auto border rounded-lg">
                        {groups
                          .filter((g) => g.status === "active")
                          .filter((group) => {
                            if (!passengerSearchTerm) return true;
                            const searchLower =
                              passengerSearchTerm.toLowerCase();

                            if (
                              group.group_name
                                ?.toLowerCase()
                                .includes(searchLower)
                            )
                              return true;

                            if (
                              group.members?.some((member) =>
                                `${member.first_name} ${member.last_name}`
                                  .toLowerCase()
                                  .includes(searchLower),
                              )
                            )
                              return true;

                            return false;
                          })
                          .map((group) => (
                            <div
                              key={group.id}
                              className="border-b last:border-b-0"
                            >
                              {group.traveling_together ? (
                                <div className="p-3 hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center space-x-3">
                                    <input
                                      type="checkbox"
                                      id={`activity-group-${group.id}`}
                                      checked={isPassengerSelected(
                                        "group",
                                        group.id,
                                      )}
                                      onChange={(e) =>
                                        handlePassengerSelection(
                                          e.target.checked,
                                          "group",
                                          group,
                                        )
                                      }
                                      className="rounded border-gray-300"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        <h4 className="font-medium text-gray-900">
                                          {group.group_name}
                                        </h4>
                                        <Badge
                                          variant="secondary"
                                          className="text-xs bg-green-100 text-green-700"
                                        >
                                          <Users className="h-3 w-3 mr-1" />
                                          Group ({group.total_members})
                                        </Badge>
                                      </div>
                                      <div className="text-sm text-gray-600 mt-1">
                                        Available for activity participation
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3">
                                  <div className="mb-2">
                                    <div className="flex items-center space-x-2">
                                      <h4 className="font-medium text-gray-900">
                                        {group.group_name}
                                      </h4>
                                      <Badge
                                        variant="outline"
                                        className="text-xs border-purple-300 text-purple-700"
                                      >
                                        <Users className="h-3 w-3 mr-1" />
                                        Individual
                                      </Badge>
                                    </div>
                                  </div>
                                  {group.members &&
                                    group.members.length > 0 && (
                                      <div className="ml-4 space-y-2">
                                        {group.members
                                          .filter((member) => {
                                            if (!passengerSearchTerm)
                                              return true;
                                            return `${member.first_name} ${member.last_name}`
                                              .toLowerCase()
                                              .includes(
                                                passengerSearchTerm.toLowerCase(),
                                              );
                                          })
                                          .map((member) => (
                                            <div
                                              key={member.id}
                                              className="flex items-center space-x-3 p-3 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors border border-purple-200"
                                            >
                                              <input
                                                type="checkbox"
                                                id={`activity-member-${member.id}`}
                                                checked={isPassengerSelected(
                                                  "member",
                                                  member.id,
                                                )}
                                                onChange={(e) =>
                                                  handlePassengerSelection(
                                                    e.target.checked,
                                                    "member",
                                                    member,
                                                  )
                                                }
                                                className="rounded border-gray-300 w-4 h-4"
                                              />
                                              <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center space-x-2">
                                                    <span className="font-semibold text-gray-900">
                                                      {member.first_name}{" "}
                                                      {member.last_name}
                                                    </span>
                                                    {member.is_leader && (
                                                      <Badge
                                                        variant="outline"
                                                        className="text-xs bg-blue-100 text-blue-700 border-blue-300"
                                                      >
                                                        Leader
                                                      </Badge>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Flight Information for Activity Transport */}
                                                <div className="mt-2 space-y-1">
                                                  {(() => {
                                                    const arrivalDetails =
                                                      getFlightDetails(
                                                        member,
                                                        "pickup",
                                                      );
                                                    const departureDetails =
                                                      getFlightDetails(
                                                        member,
                                                        "dropoff",
                                                      );

                                                    return (
                                                      <>
                                                        {arrivalDetails.flightNumber && (
                                                          <div className="text-xs flex items-center space-x-2 text-gray-600">
                                                            <span>
                                                              ✈️ Arrival:
                                                            </span>
                                                            <span className="font-mono font-semibold">
                                                              {
                                                                arrivalDetails.flightNumber
                                                              }
                                                            </span>
                                                            <span>
                                                              {
                                                                arrivalDetails.flightTime
                                                              }
                                                            </span>
                                                          </div>
                                                        )}
                                                        {departureDetails.flightNumber && (
                                                          <div className="text-xs flex items-center space-x-2 text-gray-600">
                                                            <span>
                                                              🛫 Departure:
                                                            </span>
                                                            <span className="font-mono font-semibold">
                                                              {
                                                                departureDetails.flightNumber
                                                              }
                                                            </span>
                                                            <span>
                                                              {
                                                                departureDetails.flightTime
                                                              }
                                                            </span>
                                                          </div>
                                                        )}
                                                        <div className="text-xs text-purple-600 font-medium">
                                                          Available for activity
                                                          transport
                                                        </div>
                                                      </>
                                                    );
                                                  })()}
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Transport Form */}
                {scheduleType === "custom" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">
                          Pickup Location
                        </Label>
                        <Input
                          placeholder="Enter pickup address or location"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Dropoff Location
                        </Label>
                        <Input
                          placeholder="Enter dropoff address or destination"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">
                          Pickup Time
                        </Label>
                        <Input
                          type="datetime-local"
                          className="mt-1"
                          value={scheduledDateTime}
                          onChange={(e) => setScheduledDateTime(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Estimated Duration
                        </Label>
                        <Select>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="90">1.5 hours</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                            <SelectItem value="180">3 hours</SelectItem>
                            <SelectItem value="240">4 hours</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Passengers Selection with Search - Reuse the same component */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base font-semibold">
                          Select Passengers
                        </Label>
                        {selectedPassengers.length > 0 && (
                          <div className="flex items-center space-x-2 px-3 py-1 bg-purple-100 rounded-full">
                            <Users className="h-4 w-4 text-purple-600" />
                            <span className="font-medium text-purple-600 text-sm">
                              {selectedPassengers.reduce((total, passenger) => {
                                if (passenger.type === "group") {
                                  return (
                                    total +
                                    (passenger.data as Group).total_members
                                  );
                                } else {
                                  return total + 1;
                                }
                              }, 0)}{" "}
                              passengers
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Search Bar */}
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search groups or passengers by name..."
                          value={passengerSearchTerm}
                          onChange={(e) =>
                            setPassengerSearchTerm(e.target.value)
                          }
                          className="pl-10"
                        />
                      </div>

                      {/* Selected Passengers Display */}
                      {selectedPassengers.length > 0 && (
                        <div className="mb-4 p-3 bg-purple-50 rounded-lg border">
                          <div className="text-sm font-medium text-purple-800 mb-2">
                            Selected Passengers:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedPassengers.map((passenger) => (
                              <div
                                key={`${passenger.type}-${passenger.id}`}
                                className="flex items-center space-x-1 bg-white px-2 py-1 rounded border"
                              >
                                <span className="text-xs">
                                  {passenger.type === "group"
                                    ? `${(passenger.data as Group).group_name} (${(passenger.data as Group).total_members})`
                                    : `${(passenger.data as GroupMember).first_name} ${(passenger.data as GroupMember).last_name}`}
                                </span>
                                <button
                                  onClick={() =>
                                    handlePassengerSelection(
                                      false,
                                      passenger.type,
                                      passenger.data,
                                    )
                                  }
                                  className="text-gray-400 hover:text-red-500 ml-1"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Passenger List - Same structure as other forms */}
                      <div className="max-h-72 overflow-y-auto border rounded-lg">
                        {groups
                          .filter((g) => g.status === "active")
                          .filter((group) => {
                            if (!passengerSearchTerm) return true;
                            const searchLower =
                              passengerSearchTerm.toLowerCase();

                            if (
                              group.group_name
                                ?.toLowerCase()
                                .includes(searchLower)
                            )
                              return true;

                            if (
                              group.members?.some((member) =>
                                `${member.first_name} ${member.last_name}`
                                  .toLowerCase()
                                  .includes(searchLower),
                              )
                            )
                              return true;

                            return false;
                          })
                          .map((group) => (
                            <div
                              key={group.id}
                              className="border-b last:border-b-0"
                            >
                              {group.traveling_together ? (
                                <div className="p-3 hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center space-x-3">
                                    <input
                                      type="checkbox"
                                      id={`custom-group-${group.id}`}
                                      checked={isPassengerSelected(
                                        "group",
                                        group.id,
                                      )}
                                      onChange={(e) =>
                                        handlePassengerSelection(
                                          e.target.checked,
                                          "group",
                                          group,
                                        )
                                      }
                                      className="rounded border-gray-300"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        <h4 className="font-medium text-gray-900">
                                          {group.group_name}
                                        </h4>
                                        <Badge
                                          variant="secondary"
                                          className="text-xs bg-purple-100 text-purple-700"
                                        >
                                          <Users className="h-3 w-3 mr-1" />
                                          Group ({group.total_members})
                                        </Badge>
                                      </div>
                                      <div className="text-sm text-gray-600 mt-1">
                                        Available for custom transport
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3">
                                  <div className="mb-2">
                                    <div className="flex items-center space-x-2">
                                      <h4 className="font-medium text-gray-900">
                                        {group.group_name}
                                      </h4>
                                      <Badge
                                        variant="outline"
                                        className="text-xs border-gray-300 text-gray-700"
                                      >
                                        <Users className="h-3 w-3 mr-1" />
                                        Individual
                                      </Badge>
                                    </div>
                                  </div>
                                  {group.members &&
                                    group.members.length > 0 && (
                                      <div className="ml-4 space-y-2">
                                        {group.members
                                          .filter((member) => {
                                            if (!passengerSearchTerm)
                                              return true;
                                            return `${member.first_name} ${member.last_name}`
                                              .toLowerCase()
                                              .includes(
                                                passengerSearchTerm.toLowerCase(),
                                              );
                                          })
                                          .map((member) => (
                                            <div
                                              key={member.id}
                                              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
                                            >
                                              <input
                                                type="checkbox"
                                                id={`custom-member-${member.id}`}
                                                checked={isPassengerSelected(
                                                  "member",
                                                  member.id,
                                                )}
                                                onChange={(e) =>
                                                  handlePassengerSelection(
                                                    e.target.checked,
                                                    "member",
                                                    member,
                                                  )
                                                }
                                                className="rounded border-gray-300 w-4 h-4"
                                              />
                                              <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center space-x-2">
                                                    <span className="font-semibold text-gray-900">
                                                      {member.first_name}{" "}
                                                      {member.last_name}
                                                    </span>
                                                    {member.is_leader && (
                                                      <Badge
                                                        variant="outline"
                                                        className="text-xs bg-blue-100 text-blue-700 border-blue-300"
                                                      >
                                                        Leader
                                                      </Badge>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Flight Information for Custom Transport */}
                                                <div className="mt-2 space-y-1">
                                                  {(() => {
                                                    const arrivalDetails =
                                                      getFlightDetails(
                                                        member,
                                                        "pickup",
                                                      );
                                                    const departureDetails =
                                                      getFlightDetails(
                                                        member,
                                                        "dropoff",
                                                      );

                                                    return (
                                                      <>
                                                        {arrivalDetails.flightNumber && (
                                                          <div className="text-xs flex items-center space-x-2 text-gray-600">
                                                            <span>
                                                              ✈️ Arrival:
                                                            </span>
                                                            <span className="font-mono font-semibold">
                                                              {
                                                                arrivalDetails.flightNumber
                                                              }
                                                            </span>
                                                            <span>
                                                              {
                                                                arrivalDetails.flightTime
                                                              }
                                                            </span>
                                                          </div>
                                                        )}
                                                        {departureDetails.flightNumber && (
                                                          <div className="text-xs flex items-center space-x-2 text-gray-600">
                                                            <span>
                                                              🛫 Departure:
                                                            </span>
                                                            <span className="font-mono font-semibold">
                                                              {
                                                                departureDetails.flightNumber
                                                              }
                                                            </span>
                                                            <span>
                                                              {
                                                                departureDetails.flightTime
                                                              }
                                                            </span>
                                                          </div>
                                                        )}
                                                        <div className="text-xs text-gray-600 font-medium">
                                                          Available for custom
                                                          transport
                                                        </div>
                                                      </>
                                                    );
                                                  })()}
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Vehicle and Driver Selection */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Vehicle</Label>
                      <Select
                        value={selectedVehicle}
                        onValueChange={setSelectedVehicle}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicles
                            .filter((v) => v.status === "available")
                            .map((vehicle) => (
                              <SelectItem
                                key={vehicle.id}
                                value={vehicle.id.toString()}
                              >
                                <div className="flex items-center space-x-2">
                                  <Car className="h-4 w-4" />
                                  <span>
                                    {vehicle.vehicle_number} -{" "}
                                    {vehicle.vehicle_type}
                                  </span>
                                  <Badge variant="outline" className="ml-auto">
                                    {vehicle.capacity} seats
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Driver</Label>
                      <Select
                        value={selectedDriver}
                        onValueChange={setSelectedDriver}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose driver" />
                        </SelectTrigger>
                        <SelectContent>
                          {drivers.map((driver) => (
                            <SelectItem
                              key={driver.id}
                              value={driver.id.toString()}
                            >
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4" />
                                <span>
                                  {driver.first_name} {driver.last_name}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Capacity Validation */}
                  {selectedVehicle && selectedPassengers.length > 0 && (
                    <div className="p-3 rounded-lg border">
                      {(() => {
                        const vehicle = vehicles.find(
                          (v) => v.id.toString() === selectedVehicle,
                        );
                        const totalPassengers = selectedPassengers.reduce(
                          (total, passenger) => {
                            if (passenger.type === "group") {
                              return (
                                total + (passenger.data as Group).total_members
                              );
                            } else {
                              return total + 1;
                            }
                          },
                          0,
                        );

                        const isOverCapacity =
                          vehicle && totalPassengers > vehicle.capacity;

                        return (
                          <div
                            className={`flex items-center space-x-2 text-sm ${
                              isOverCapacity ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {isOverCapacity ? (
                              <AlertTriangle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            <span>
                              {totalPassengers} passengers / {vehicle?.capacity}{" "}
                              capacity
                              {isOverCapacity && " - Vehicle over capacity!"}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-3">
                  {/* Validation Summary */}
                  {!pickupLocation && (
                    <div className="flex items-center space-x-2 text-amber-600 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Please enter pickup location</span>
                    </div>
                  )}

                  {!dropoffLocation && (
                    <div className="flex items-center space-x-2 text-amber-600 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Please enter dropoff location</span>
                    </div>
                  )}

                  {!selectedVehicle && (
                    <div className="flex items-center space-x-2 text-amber-600 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Please select a vehicle</span>
                    </div>
                  )}

                  {!selectedDriver && (
                    <div className="flex items-center space-x-2 text-amber-600 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Please select a driver</span>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsScheduleDialogOpen(false);
                        // State will be reset by the dialog onOpenChange handler
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="px-6"
                      disabled={
                        !pickupLocation ||
                        !dropoffLocation ||
                        !selectedVehicle ||
                        !selectedDriver ||
                        isSubmitting
                      }
                      onClick={handleScheduleTransport}
                    >
                      {isSubmitting ? (
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                      ) : (
                        <Calendar className="h-4 w-4 mr-2" />
                      )}
                      {isSubmitting ? "Scheduling..." : "Schedule Transport"}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Transport Detail Dialog */}
          <Dialog
            open={isDetailDialogOpen}
            onOpenChange={(open) => {
              setIsDetailDialogOpen(open);
              if (!open) {
                setIsEditingDropoff(false);
                setEditingDropoffLocation("");
                setIsEditingPickup(false);
                setEditingPickupLocation("");
              }
            }}
          >
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Car className="h-5 w-5 text-blue-600" />
                  <span>Transport Details</span>
                </DialogTitle>
                <DialogDescription>
                  Detailed information about the transport schedule
                </DialogDescription>
              </DialogHeader>

              {selectedScheduleForDetail && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Vehicle
                      </Label>
                      <p className="text-sm font-semibold">
                        {selectedScheduleForDetail.vehicle_number} -{" "}
                        {selectedScheduleForDetail.vehicle_type}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Driver
                      </Label>
                      <p className="text-sm font-semibold">
                        {selectedScheduleForDetail.driver_name}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Transport Type
                      </Label>
                      <p className="text-sm font-semibold">
                        {formatTransportType(
                          selectedScheduleForDetail.transport_type || "custom",
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Current Status
                      </Label>
                      <Badge
                        variant={getStatusColor(
                          selectedScheduleForDetail.status,
                        )}
                        className="w-fit"
                      >
                        {selectedScheduleForDetail.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Status Management */}
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      Change Status
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() =>
                          handleStatusChange(
                            selectedScheduleForDetail.id,
                            "scheduled",
                          )
                        }
                        className={`px-3 py-2 text-xs font-medium rounded-md border transition-all duration-200 ${
                          selectedScheduleForDetail.status === "scheduled"
                            ? "bg-gray-800 text-white border-gray-800 shadow-sm"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50 hover:shadow-sm"
                        }`}
                      >
                        Scheduled
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(
                            selectedScheduleForDetail.id,
                            "in_transit",
                          )
                        }
                        className={`px-3 py-2 text-xs font-medium rounded-md border transition-all duration-200 ${
                          selectedScheduleForDetail.status === "in_transit"
                            ? "bg-gray-800 text-white border-gray-800 shadow-sm"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50 hover:shadow-sm"
                        }`}
                      >
                        In Transit
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(
                            selectedScheduleForDetail.id,
                            "completed",
                          )
                        }
                        className={`px-3 py-2 text-xs font-medium rounded-md border transition-all duration-200 ${
                          selectedScheduleForDetail.status === "completed"
                            ? "bg-gray-800 text-white border-gray-800 shadow-sm"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50 hover:shadow-sm"
                        }`}
                      >
                        Completed
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Pickup Location
                      </Label>
                      {selectedScheduleForDetail.transport_type ===
                      "airport_dropoff" ? (
                        isEditingPickup ? (
                          <div className="flex items-center space-x-2 mt-1">
                            <Input
                              value={editingPickupLocation}
                              onChange={(e) =>
                                setEditingPickupLocation(e.target.value)
                              }
                              placeholder="Enter pickup location"
                              className="text-sm"
                            />
                            <Button
                              size="sm"
                              onClick={handlePickupLocationUpdate}
                              disabled={!editingPickupLocation.trim()}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditingPickup}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm">
                              {selectedScheduleForDetail.pickup_location}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={startEditingPickup}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </Button>
                          </div>
                        )
                      ) : (
                        <p className="text-sm">
                          {selectedScheduleForDetail.pickup_location}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Dropoff Location
                      </Label>
                      {selectedScheduleForDetail.transport_type ===
                        "airport_pickup" ||
                      selectedScheduleForDetail.transport_type === "custom" ? (
                        isEditingDropoff ? (
                          <div className="flex items-center space-x-2 mt-1">
                            <Input
                              value={editingDropoffLocation}
                              onChange={(e) =>
                                setEditingDropoffLocation(e.target.value)
                              }
                              placeholder="Enter dropoff location"
                              className="text-sm"
                            />
                            <Button
                              size="sm"
                              onClick={handleDropoffLocationUpdate}
                              disabled={!editingDropoffLocation.trim()}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditingDropoff}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm">
                              {selectedScheduleForDetail.dropoff_location}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={startEditingDropoff}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </Button>
                          </div>
                        )
                      ) : (
                        <p className="text-sm">
                          {selectedScheduleForDetail.dropoff_location}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        {getTimeLabel(selectedScheduleForDetail.transport_type)}{" "}
                        Time
                      </Label>
                      <p className="text-sm">
                        {formatDateTime(selectedScheduleForDetail.pickup_time)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Passenger Count
                      </Label>
                      <p className="text-sm">
                        {selectedScheduleForDetail.passenger_count || 0}{" "}
                        passengers
                      </p>
                    </div>
                  </div>

                  {selectedScheduleForDetail.activity_name && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Activity
                      </Label>
                      <p className="text-sm">
                        {selectedScheduleForDetail.activity_name}
                      </p>
                    </div>
                  )}

                  {selectedScheduleForDetail.distance_km && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Distance
                      </Label>
                      <p className="text-sm">
                        {selectedScheduleForDetail.distance_km} km
                      </p>
                    </div>
                  )}

                  {selectedScheduleForDetail.groups &&
                    selectedScheduleForDetail.groups.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Passengers
                        </Label>
                        <div className="mt-2 space-y-2">
                          {getDetailedPassengerInfo(
                            selectedScheduleForDetail,
                          ).map((passenger, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                            >
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-2 h-2 rounded-full ${passenger.type === "group" ? "bg-blue-500" : "bg-green-500"}`}
                                ></div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {passenger.name}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {passenger.type === "group"
                                      ? "Group"
                                      : `Member of ${passenger.groupName}`}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-700">
                                  {passenger.memberCount}{" "}
                                  {passenger.memberCount === 1
                                    ? "passenger"
                                    : "passengers"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {passenger.type === "group"
                                    ? "Traveling together"
                                    : "Individual"}
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                            <div className="text-sm text-blue-700 font-medium">
                              Total:{" "}
                              {getDetailedPassengerInfo(
                                selectedScheduleForDetail,
                              ).reduce((sum, p) => sum + p.memberCount, 0)}{" "}
                              passengers
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setIsDetailDialogOpen(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Confirm Deletion</span>
                </DialogTitle>
                <DialogDescription>
                  This action cannot be undone. Are you sure you want to delete
                  this transport schedule?
                </DialogDescription>
              </DialogHeader>

              {scheduleToDelete && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Car className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-800">
                          {scheduleToDelete.vehicle_number} -{" "}
                          {scheduleToDelete.vehicle_type}
                        </span>
                      </div>
                      <div className="text-sm text-red-700">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>From: {scheduleToDelete.pickup_location}</span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>To: {scheduleToDelete.dropoff_location}</span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {getTimeLabel(scheduleToDelete.transport_type)}{" "}
                            Time: {formatDateTime(scheduleToDelete.pickup_time)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <User className="h-3 w-3" />
                          <span>Driver: {scheduleToDelete.driver_name}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDeleteDialogOpen(false);
                        setScheduleToDelete(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={confirmDeleteTransport}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Delete Transport
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <VehicleAddDialog onVehicleAdded={fetchData} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Car className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{vehicles.length}</p>
                <p className="text-sm text-muted-foreground">Total Vehicles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {vehicles.filter((v) => v.status === "available").length}
                </p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {schedules.filter((s) => s.status === "in_transit").length}
                </p>
                <p className="text-sm text-muted-foreground">In Transit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wrench className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">
                  {vehicles.filter((v) => v.status === "maintenance").length}
                </p>
                <p className="text-sm text-muted-foreground">Maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedules">Airport Pick Up</TabsTrigger>
          <TabsTrigger value="airport">Airport Drop Off</TabsTrigger>
          <TabsTrigger value="activities">Activity Transport</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicle Fleet</TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="space-y-4">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search schedules..."
                      value={passengerSearchTerm}
                      onChange={(e) => setPassengerSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-[170px]"
                  />
                  <Input
                    placeholder="Group ID"
                    inputMode="numeric"
                    value={groupIdQuery}
                    onChange={(e) => setGroupIdQuery(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-[130px]"
                  />
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Airport Pickup Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Plane className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {
                        schedules.filter(
                          (s) => s.transport_type === "airport_pickup",
                        ).length
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Airport Pickups
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {schedules
                        .filter((s) => s.transport_type === "airport_pickup")
                        .reduce((sum, s) => sum + (s.passenger_count || 0), 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Pickup Passengers
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Airport Pickup Schedules (combined per group) */}
          <div className="grid gap-4">
            {buildCombinedAirportTransfers()
              .filter((t) => {
                if (!t.pickup) return false;
                const s = t.pickup;
                // Status filter
                if (statusFilter !== "all" && s.status !== statusFilter) return false;
                // Group ID filter
                if (groupIdQuery) {
                  const gid = parseInt(groupIdQuery, 10);
                  if (!gid || t.groupId !== gid) return false;
                }
                // Date filter
                if (selectedDate) {
                  try {
                    const d = new Date(s.pickup_time);
                    const dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                    if (dStr !== selectedDate) return false;
                  } catch {}
                }
                // Name search (group or passenger)
                if (passengerSearchTerm) {
                  const q = passengerSearchTerm.toLowerCase();
                  const groupMatch = (t.groupName || "").toLowerCase().includes(q);
                  let paxMatch = false;
                  const groupsArr: any[] = Array.isArray(s.groups) ? (s.groups as any[]) : [];
                  for (const g of groupsArr) {
                    const name = (g && (g.name || g.group_name || (g.first_name && g.last_name ? `${g.first_name} ${g.last_name}` : ""))) || "";
                    if (String(name).toLowerCase().includes(q)) { paxMatch = true; break; }
                  }
                  if (!groupMatch && !paxMatch) return false;
                }
                return true;
              })
              .sort(
                (a, b) =>
                  new Date(b.pickup!.pickup_time).getTime() -
                  new Date(a.pickup!.pickup_time).getTime(),
              )
              .map((t) => {
                const refSchedule = t.pickup!;
                const VehicleIcon = getVehicleIcon(refSchedule.vehicle_type);
                const StatusIcon = getStatusIcon(refSchedule.status);

                return (
                  <Card
                    key={`grp-${t.groupId}`}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                            <VehicleIcon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-lg font-semibold text-foreground">
                                {t.groupName}
                              </h3>
                              <Badge variant="secondary">
                                {t.passengerCount} passengers
                              </Badge>
                            </div>

                            {/* Airport Pickup details */}
                            <div className="space-y-3 text-sm">
                              {t.pickup && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 rounded-md border bg-blue-50">
                                  <div className="font-medium text-blue-700">
                                    Airport Pickup
                                  </div>
                                  <div className="flex items-center">
                                    <MapPin className="mr-1 h-4 w-4" /> From:{" "}
                                    {t.pickup.pickup_location}
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="mr-1 h-4 w-4" /> Time:{" "}
                                    {formatDateTime(t.pickup.pickup_time)}
                                  </div>
                                  <div className="flex items-center">
                                    <User className="mr-1 h-4 w-4" /> Driver:{" "}
                                    {t.pickup.driver_name}
                                  </div>
                                  <div className="flex items-center">
                                    <MapPin className="mr-1 h-4 w-4" /> To:{" "}
                                    {t.pickup.dropoff_location}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <StatusIcon className="h-6 w-6 text-muted-foreground mb-2" />
                            <div className="flex flex-col space-y-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleViewTransportDetails(refSchedule)
                                }
                                className="text-xs"
                              >
                                Details
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleDeleteTransport(refSchedule)
                                }
                                className="text-xs"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>

          {schedules.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No transport schedules
                </h3>
                <p className="text-muted-foreground">
                  No scheduled transports found for today
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="airport" className="space-y-4">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search schedules..."
                      value={passengerSearchTerm}
                      onChange={(e) => setPassengerSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-[170px]"
                  />
                  <Input
                    placeholder="Group ID"
                    inputMode="numeric"
                    value={groupIdQuery}
                    onChange={(e) => setGroupIdQuery(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-[130px]"
                  />
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Airport Dropoff Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Plane className="h-5 w-5 text-orange-600 rotate-45" />
                  <div>
                    <p className="text-2xl font-bold">
                      {
                        schedules.filter(
                          (s) => s.transport_type === "airport_dropoff",
                        ).length
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Airport Dropoffs
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {schedules
                        .filter((s) => s.transport_type === "airport_dropoff")
                        .reduce((sum, s) => sum + (s.passenger_count || 0), 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Dropoff Passengers
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Airport Dropoff Schedules (combined per group) */}
          <div className="grid gap-4">
            {buildCombinedAirportTransfers()
              .filter((t) => {
                if (!t.dropoff) return false;
                const s = t.dropoff;
                // Status filter
                if (statusFilter !== "all" && s.status !== statusFilter) return false;
                // Group ID filter
                if (groupIdQuery) {
                  const gid = parseInt(groupIdQuery, 10);
                  if (!gid || t.groupId !== gid) return false;
                }
                // Date filter
                if (selectedDate) {
                  try {
                    const d = new Date(s.pickup_time);
                    const dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                    if (dStr !== selectedDate) return false;
                  } catch {}
                }
                // Name search (group or passenger)
                if (passengerSearchTerm) {
                  const q = passengerSearchTerm.toLowerCase();
                  const groupMatch = (t.groupName || "").toLowerCase().includes(q);
                  let paxMatch = false;
                  const groupsArr: any[] = Array.isArray(s.groups) ? (s.groups as any[]) : [];
                  for (const g of groupsArr) {
                    const name = (g && (g.name || g.group_name || (g.first_name && g.last_name ? `${g.first_name} ${g.last_name}` : ""))) || "";
                    if (String(name).toLowerCase().includes(q)) { paxMatch = true; break; }
                  }
                  if (!groupMatch && !paxMatch) return false;
                }
                return true;
              })
              .sort(
                (a, b) =>
                  new Date(b.dropoff!.pickup_time).getTime() -
                  new Date(a.dropoff!.pickup_time).getTime(),
              )
              .map((t) => {
                const refSchedule = t.dropoff!;
                const VehicleIcon = getVehicleIcon(refSchedule.vehicle_type);

                return (
                  <Card
                    key={`grp-do-${t.groupId}`}
                    className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg">
                            <VehicleIcon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold text-foreground">
                                {t.groupName}
                              </h3>
                              <Badge variant="secondary">
                                {t.passengerCount} passengers
                              </Badge>
                            </div>

                            <div className="space-y-3 text-sm">
                              {t.pickup && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 rounded-md border bg-blue-50">
                                  <div className="font-medium text-blue-700">
                                    Airport Pickup
                                  </div>
                                  <div className="flex items-center">
                                    <MapPin className="mr-1 h-4 w-4" /> From:{" "}
                                    {t.pickup.pickup_location}
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="mr-1 h-4 w-4" /> Time:{" "}
                                    {formatDateTime(t.pickup.pickup_time)}
                                  </div>
                                  <div className="flex items-center">
                                    <User className="mr-1 h-4 w-4" /> Driver:{" "}
                                    {t.pickup.driver_name}
                                  </div>
                                  <div className="flex items-center">
                                    <MapPin className="mr-1 h-4 w-4" /> To:{" "}
                                    {t.pickup.dropoff_location}
                                  </div>
                                </div>
                              )}
                              {t.dropoff && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 rounded-md border bg-orange-50">
                                  <div className="font-medium text-orange-700">
                                    Airport Dropoff
                                  </div>
                                  <div className="flex items-center">
                                    <MapPin className="mr-1 h-4 w-4" /> From:{" "}
                                    {t.dropoff.pickup_location}
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="mr-1 h-4 w-4" /> Time:{" "}
                                    {formatDateTime(t.dropoff.pickup_time)}
                                  </div>
                                  <div className="flex items-center">
                                    <User className="mr-1 h-4 w-4" /> Driver:{" "}
                                    {t.dropoff.driver_name}
                                  </div>
                                  <div className="flex items-center">
                                    <MapPin className="mr-1 h-4 w-4" /> To:{" "}
                                    {t.dropoff.dropoff_location}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex flex-col space-y-2 min-w-[120px]">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedScheduleForDetail(refSchedule);
                                  setIsDetailDialogOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                              <DeleteScheduleDialog
                                schedule={refSchedule}
                                onDeleteSuccess={fetchData}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>

          {schedules.filter((s) => s.transport_type?.includes("airport"))
            .length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Plane className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No airport transfers scheduled
                </h3>
                <p className="text-muted-foreground">
                  Schedule airport pickups and dropoffs for your groups
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          {/* Activity Transport Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Mountain className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {
                        schedules.filter((s) => s.transport_type === "activity")
                          .length
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Activity Transports
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {schedules
                        .filter((s) => s.transport_type === "activity")
                        .reduce((sum, s) => sum + (s.passenger_count || 0), 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Activity Participants
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Route className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {
                        new Set(
                          schedules
                            .filter((s) => s.transport_type === "activity")
                            .map((s) => s.activity_name),
                        ).size
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Different Activities
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Transport Schedules */}
          <div className="grid gap-4">
            {schedules
              .filter((s) => s.transport_type === "activity")
              .map((schedule) => {
                const VehicleIcon = getVehicleIcon(schedule.vehicle_type);

                return (
                  <Card
                    key={schedule.id}
                    className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex items-center justify-center w-12 h-12 bg-green-50 rounded-lg">
                            <Mountain className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold text-foreground">
                                {schedule.activity_name}
                              </h3>
                              <Badge variant="secondary">
                                {schedule.vehicle_number}
                              </Badge>
                              <Badge variant={getStatusColor(schedule.status)}>
                                {schedule.status}
                              </Badge>
                            </div>

                            {schedule.groups && schedule.groups.length > 0 && (
                              <div className="mb-3 p-3 bg-green-50 rounded-lg">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Users className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-medium text-green-800">
                                    Participating Groups:{" "}
                                    {formatPassengerNames(schedule.groups)}
                                  </span>
                                </div>
                                <p className="text-sm text-green-600">
                                  Total participants:{" "}
                                  {schedule.passenger_count || 0}
                                </p>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center">
                                <MapPin className="mr-2 h-4 w-4" />
                                <span>Pickup: {schedule.pickup_location}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="mr-2 h-4 w-4" />
                                <span className="font-medium">
                                  {getTimeLabel(schedule.transport_type)} Time:{" "}
                                  {formatDateTime(schedule.pickup_time)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              {schedule.passenger_count || 0}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              participants
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>

          {schedules.filter((s) => s.transport_type === "activity").length ===
            0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Mountain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No activity transports scheduled
                </h3>
                <p className="text-muted-foreground">
                  Schedule transportation for ice fishing, city tours, northern
                  lights, and other activities
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="vehicles" className="space-y-4">
          {/* Vehicle Fleet */}
          <div className="grid gap-4">
            {vehicles.map((vehicle) => {
              const VehicleIcon = getVehicleIcon(vehicle.vehicle_type);
              const StatusIcon = getStatusIcon(vehicle.status);
              const maintenanceDue =
                new Date(vehicle.next_maintenance) <= new Date();

              return (
                <Card
                  key={vehicle.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                          <VehicleIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold text-foreground">
                              {vehicle.vehicle_number}
                            </h3>
                            <Badge variant="outline">
                              {vehicle.license_plate}
                            </Badge>
                            <Badge variant={getStatusColor(vehicle.status)}>
                              {vehicle.status}
                            </Badge>
                            {maintenanceDue && (
                              <Badge variant="destructive">
                                Maintenance Due
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {vehicle.year} {vehicle.make} {vehicle.model} •{" "}
                            {vehicle.vehicle_type}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                            <div>Capacity: {vehicle.capacity} passengers</div>
                            <div>
                              Last Service:{" "}
                              {formatDate(vehicle.last_maintenance)}
                            </div>
                            <div>
                              Next Service:{" "}
                              {formatDate(vehicle.next_maintenance)}
                            </div>
                          </div>
                          {vehicle.notes && (
                            <p className="text-sm text-muted-foreground mt-2 italic">
                              {vehicle.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <StatusIcon className="h-6 w-6 text-muted-foreground" />
                          <Select
                            onValueChange={(value) =>
                              updateVehicleStatus(vehicle.id, value)
                            }
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">
                                Available
                              </SelectItem>
                              <SelectItem value="in_use">In Use</SelectItem>
                              <SelectItem value="maintenance">
                                Maintenance
                              </SelectItem>
                              <SelectItem value="out_of_service">
                                Out of Service
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <VehicleDeleteDialog
                            vehicleId={vehicle.id}
                            vehicleName={vehicle.vehicle_number}
                            onDeleteSuccess={fetchData}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {vehicles.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Car className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No vehicles registered
                </h3>
                <p className="text-muted-foreground">
                  Add vehicles to your fleet to get started
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
