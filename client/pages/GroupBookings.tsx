import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Calendar,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Crown,
  Phone,
  Mail,
  MapPin,
  Plane,
  Clock,
  Printer,
} from "lucide-react";

interface GroupMember {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  passport_number?: string;
  nationality?: string;
  date_of_birth?: string;
  dietary_restrictions?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
  arrival_date?: string;
  departure_date?: string;
  arrival_flight_number?: string;
  arrival_flight_time?: string;
  arrival_notes?: string;
  departure_flight_number?: string;
  departure_flight_time?: string;
  departure_notes?: string;
  is_leader?: boolean;
}

interface GroupBookingSummary {
  id: number;
  booking_reference: string;
  invoice_number?: string;
  guest_name: string;
  tour_name: string;
  start_date?: string;
  end_date?: string;
  status: string;
  payment_status?: string;
}

interface TourGroup {
  id: number;
  group_name: string;
  group_leader_id?: number;
  leader_name?: string;
  leader_email?: string;
  leader_phone?: string;
  total_members: number;
  group_type: string;
  tour_start_date?: string;
  tour_end_date?: string;
  arrival_date?: string;
  departure_date?: string;
  arrival_flight_number?: string;
  arrival_flight_time?: string;
  arrival_notes?: string;
  departure_flight_number?: string;
  departure_flight_time?: string;
  departure_notes?: string;
  traveling_together?: boolean;
  total_cost?: number;
  amount_paid?: number;
  deposit_amount?: number;
  special_requirements?: string;
  group_notes?: string;
  status: string;
  created_at: string;
  members?: GroupMember[];
}

export default function GroupBookings() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<TourGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupIdFilter, setGroupIdFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<
    (TourGroup & { bookings?: GroupBookingSummary[] }) | null
  >(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TourGroup | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<TourGroup | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelingGroup, setCancelingGroup] = useState<TourGroup | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);

  // New group form state
  const [newGroup, setNewGroup] = useState({
    group_name: "",
    group_type: "family",
    tour_start_date: "",
    tour_end_date: "",
    arrival_date: "",
    departure_date: "",
    arrival_flight_number: "",
    arrival_flight_time: "",
    arrival_notes: "",
    departure_flight_number: "",
    departure_flight_time: "",
    departure_notes: "",
    traveling_together: true,
    total_cost: 0,
    amount_paid: 0,
    deposit_amount: 0,
    special_requirements: "",
    group_notes: "",
  });

  // Group members state
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([
    {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      passport_number: "",
      nationality: "",
      date_of_birth: "",
      dietary_restrictions: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      notes: "",
      arrival_date: "",
      departure_date: "",
      arrival_flight_number: "",
      arrival_flight_time: "",
      arrival_notes: "",
      departure_flight_number: "",
      departure_flight_time: "",
      departure_notes: "",
      is_leader: true,
    },
  ]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/groups");
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      } else {
        console.error(
          "Failed to fetch groups:",
          response.status,
          response.statusText,
        );
        setGroups([]);
        toast({
          title: "Failed to Load Groups",
          description: `Server responded with ${response.status}: ${response.statusText}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      setGroups([]);
      toast({
        title: "Connection Error",
        description:
          "Unable to connect to the server. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addMember = () => {
    setGroupMembers([
      ...groupMembers,
      {
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        passport_number: "",
        nationality: "",
        date_of_birth: "",
        dietary_restrictions: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        notes: "",
        arrival_date: "",
        departure_date: "",
        arrival_flight_number: "",
        arrival_flight_time: "",
        arrival_notes: "",
        departure_flight_number: "",
        departure_flight_time: "",
        departure_notes: "",
        is_leader: false,
      },
    ]);
  };

  const removeMember = (index: number) => {
    if (groupMembers.length > 1) {
      const updatedMembers = groupMembers.filter((_, i) => i !== index);
      // Ensure at least one leader exists
      const hasLeader = updatedMembers.some((m) => m.is_leader);
      if (!hasLeader && updatedMembers.length > 0) {
        updatedMembers[0].is_leader = true;
      }
      setGroupMembers(updatedMembers);
    }
  };

  const updateMember = (index: number, field: string, value: any) => {
    const updatedMembers = [...groupMembers];
    updatedMembers[index] = {
      ...updatedMembers[index],
      [field]: value,
    };

    // If setting someone as leader, remove leader status from others
    if (field === "is_leader" && value) {
      updatedMembers.forEach((member, i) => {
        if (i !== index) {
          member.is_leader = false;
        }
      });
    }

    setGroupMembers(updatedMembers);
  };

  const createGroup = async () => {
    // Prevent double submission
    if (isCreating) {
      return;
    }

    // Validation
    if (!newGroup.group_name.trim()) {
      alert("Please enter a group name");
      return;
    }

    const validMembers = groupMembers.filter(
      (m) => m.first_name.trim() && m.last_name.trim() && m.email.trim(),
    );

    if (validMembers.length === 0) {
      alert("Please add at least one member with complete information");
      return;
    }

    // Ensure at least one leader
    const hasLeader = validMembers.some((m) => m.is_leader);
    if (!hasLeader) {
      validMembers[0].is_leader = true;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newGroup,
          members: validMembers,
        }),
      });

      // Read the response body only once
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        data = null;
      }

      if (response.ok) {
        await fetchGroups();
        setIsCreateDialogOpen(false);
        resetForm();
        toast({
          title: "Group Created Successfully!",
          description: `"${newGroup.group_name}" has been created with ${validMembers.length} member(s). Transport schedules have been automatically created based on flight details.`,
        });
      } else {
        const errorMessage =
          data?.error ||
          data?.message ||
          `${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        title: "Error Creating Group",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const updateGroup = async (groupId: number | undefined) => {
    if (!groupId) {
      toast({
        title: "Error",
        description: "No group selected for update",
        variant: "destructive",
      });
      return;
    }

    // Validation
    if (!newGroup.group_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a group name",
        variant: "destructive",
      });
      return;
    }

    // Validate members
    const validMembers = groupMembers.filter(
      (m) => m.first_name.trim() && m.last_name.trim() && m.email.trim(),
    );

    if (validMembers.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one member with complete information",
        variant: "destructive",
      });
      return;
    }

    // Ensure at least one leader
    const hasLeader = validMembers.some((m) => m.is_leader);
    if (!hasLeader) {
      validMembers[0].is_leader = true;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newGroup,
          members: validMembers,
        }),
      });

      // Read the response body only once
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        data = null;
      }

      if (response.ok) {
        await fetchGroups();
        setIsEditDialogOpen(false);
        resetForm();
        setEditingGroup(null);
        toast({
          title: "Group Updated Successfully!",
          description: `"${newGroup.group_name}" has been updated with ${validMembers.length} member(s). Transport schedules have been automatically updated based on flight details.`,
        });
      } else {
        const errorMessage =
          data?.error ||
          data?.message ||
          `${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error updating group:", error);
      toast({
        title: "Error Updating Group",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setNewGroup({
      group_name: "",
      group_type: "family",
      tour_start_date: "",
      tour_end_date: "",
      arrival_date: "",
      departure_date: "",
      arrival_flight_number: "",
      arrival_flight_time: "",
      arrival_notes: "",
      departure_flight_number: "",
      departure_flight_time: "",
      departure_notes: "",
      traveling_together: true,
      total_cost: 0,
      amount_paid: 0,
      deposit_amount: 0,
      special_requirements: "",
      group_notes: "",
    });
    setGroupMembers([
      {
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        passport_number: "",
        nationality: "",
        date_of_birth: "",
        dietary_restrictions: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        notes: "",
        arrival_date: "",
        departure_date: "",
        arrival_flight_number: "",
        arrival_flight_time: "",
        arrival_notes: "",
        departure_flight_number: "",
        departure_flight_time: "",
        departure_notes: "",
        is_leader: true,
      },
    ]);
  };

  const fetchGroupWithMembers = async (
    groupId: number,
  ): Promise<(TourGroup & { bookings?: GroupBookingSummary[] }) | null> => {
    try {
      const response = await fetch(`/api/groups/${groupId}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching group details:", error);
      return null;
    }
  };

  const initializeEditMode = async (group: TourGroup) => {
    setNewGroup({
      group_name: group.group_name,
      group_type: group.group_type,
      tour_start_date: group.tour_start_date || "",
      tour_end_date: group.tour_end_date || "",
      arrival_date: group.arrival_date || "",
      departure_date: group.departure_date || "",
      arrival_flight_number: group.arrival_flight_number || "",
      arrival_flight_time: group.arrival_flight_time || "",
      arrival_notes: group.arrival_notes || "",
      departure_flight_number: group.departure_flight_number || "",
      departure_flight_time: group.departure_flight_time || "",
      departure_notes: group.departure_notes || "",
      traveling_together:
        group.traveling_together !== undefined
          ? group.traveling_together
          : true,
      total_cost: group.total_cost || 0,
      amount_paid: group.amount_paid || 0,
      deposit_amount: group.deposit_amount || 0,
      special_requirements: group.special_requirements || "",
      group_notes: group.group_notes || "",
    });

    // Fetch detailed group data with members
    const groupWithMembers = await fetchGroupWithMembers(group.id);
    if (groupWithMembers && groupWithMembers.members) {
      const formattedMembers = groupWithMembers.members.map((member) => ({
        id: member.id,
        first_name: member.first_name || "",
        last_name: member.last_name || "",
        email: member.email || "",
        phone: member.phone || "",
        passport_number: member.passport_number || "",
        nationality: member.nationality || "",
        date_of_birth: member.date_of_birth || "",
        dietary_restrictions: member.dietary_restrictions || "",
        emergency_contact_name: member.emergency_contact_name || "",
        emergency_contact_phone: member.emergency_contact_phone || "",
        notes: member.notes || "",
        arrival_date: member.arrival_date || "",
        departure_date: member.departure_date || "",
        arrival_flight_number: member.arrival_flight_number || "",
        arrival_flight_time: member.arrival_flight_time || "",
        arrival_notes: member.arrival_notes || "",
        departure_flight_number: member.departure_flight_number || "",
        departure_flight_time: member.departure_flight_time || "",
        departure_notes: member.departure_notes || "",
        is_leader: member.is_leader || false,
      }));
      setGroupMembers(formattedMembers);
    } else {
      // Fallback if no members found
      setGroupMembers([
        {
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          passport_number: "",
          nationality: "",
          date_of_birth: "",
          dietary_restrictions: "",
          emergency_contact_name: "",
          emergency_contact_phone: "",
          notes: "",
          arrival_date: "",
          departure_date: "",
          arrival_flight_number: "",
          arrival_flight_time: "",
          arrival_notes: "",
          departure_flight_number: "",
          departure_flight_time: "",
          departure_notes: "",
          is_leader: true,
        },
      ]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "completed":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getGroupTypeColor = (type: string) => {
    switch (type) {
      case "family":
        return "default";
      case "corporate":
        return "secondary";
      case "friends":
        return "outline";
      default:
        return "outline";
    }
  };

  const deleteGroup = async (groupId: number) => {
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchGroups();
        setIsDeleteDialogOpen(false);
        setDeletingGroup(null);
        toast({
          title: "Group Deleted Successfully!",
          description:
            "The group booking and all its members have been removed.",
        });
      } else {
        throw new Error("Failed to delete group");
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      toast({
        title: "Error Deleting Group",
        description: "An error occurred while deleting the group.",
        variant: "destructive",
      });
    }
  };

  const cancelReservation = async (groupId: number, refundAmount: number) => {
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newGroup,
          status: "cancelled",
          refund_amount: refundAmount,
          cancelled_at: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        await fetchGroups();
        setIsCancelDialogOpen(false);
        setCancelingGroup(null);
        setRefundAmount(0);
        setIsEditDialogOpen(false);
        resetForm();
        toast({
          title: "Reservation Cancelled",
          description: `Group cancelled successfully. Refund amount: $${refundAmount.toFixed(2)}`,
        });
      } else {
        throw new Error("Failed to cancel reservation");
      }
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      toast({
        title: "Error Cancelling Reservation",
        description: "An error occurred while cancelling the reservation.",
        variant: "destructive",
      });
    }
  };

  const handlePrintGroup = (
    group: (TourGroup & { bookings?: GroupBookingSummary[] }) | null,
  ) => {
    if (!group) return;

    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Generate the print HTML content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Group Details - ${group.group_name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #ccc;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 5px;
            }
            .document-title {
              font-size: 18px;
              color: #666;
              margin-bottom: 10px;
            }
            .group-name {
              font-size: 28px;
              font-weight: bold;
              margin: 20px 0;
            }
            .section {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #2563eb;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 8px;
              margin-bottom: 15px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 15px;
              margin-bottom: 15px;
            }
            .info-item {
              margin-bottom: 10px;
            }
            .info-label {
              font-weight: bold;
              color: #666;
              display: block;
              margin-bottom: 2px;
            }
            .info-value {
              display: block;
              padding-left: 10px;
            }
            .member-card {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 15px;
              page-break-inside: avoid;
            }
            .member-header {
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 10px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .leader-badge {
              background: #2563eb;
              color: white;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: normal;
            }
            .financial-summary {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .financial-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 16px;
            }
            .financial-item.total {
              border-top: 1px solid #ccc;
              padding-top: 10px;
              font-weight: bold;
              font-size: 18px;
            }
            .notes-box {
              background: #f9fafb;
              border-left: 4px solid #2563eb;
              padding: 15px;
              margin: 10px 0;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ccc;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            .badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
              margin-right: 10px;
            }
            .badge-active { background: #dcfce7; color: #166534; }
            .badge-cancelled { background: #fee2e2; color: #dc2626; }
            .badge-completed { background: #dbeafe; color: #1d4ed8; }
            .badge-family { background: #fef3c7; color: #d97706; }
            .badge-corporate { background: #e0e7ff; color: #3730a3; }
            .badge-friends { background: #f3e8ff; color: #7c3aed; }
            .flight-info {
              display: flex;
              align-items: center;
              gap: 5px;
              margin: 5px 0;
              font-size: 14px;
            }
            @media print {
              body { margin: 0; padding: 15px; }
              .section { page-break-inside: avoid; }
              .member-card { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">JIGUANG TOUR</div>
            <div class="document-title">Group Booking Details</div>
            <div>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
          </div>

          <div class="group-name">${group.group_name}</div>

          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Group ID:</span>
              <span class="info-value">${group.id}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Status:</span>
              <span class="info-value">
                <span class="badge badge-${group.status}">${group.status.toUpperCase()}</span>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Group Type:</span>
              <span class="info-value">
                <span class="badge badge-${group.group_type}">${group.group_type}</span>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Total Members:</span>
              <span class="info-value">${group.total_members}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Created:</span>
              <span class="info-value">${new Date(group.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          ${
            group.tour_start_date || group.tour_end_date
              ? `
            <div class="section">
              <div class="section-title">📅 Tour Duration</div>
              <div class="info-grid">
                ${
                  group.tour_start_date
                    ? `
                  <div class="info-item">
                    <span class="info-label">Tour Start Date:</span>
                    <span class="info-value">${new Date(group.tour_start_date).toLocaleDateString()}</span>
                  </div>
                `
                    : ""
                }
                ${
                  group.tour_end_date
                    ? `
                  <div class="info-item">
                    <span class="info-label">Tour End Date:</span>
                    <span class="info-value">${new Date(group.tour_end_date).toLocaleDateString()}</span>
                  </div>
                `
                    : ""
                }
              </div>
            </div>
          `
              : ""
          }

          <div class="section">
            <div class="section-title">👑 Group Leader</div>
            <div class="info-grid">
              ${
                group.leader_name
                  ? `
                <div class="info-item">
                  <span class="info-label">Name:</span>
                  <span class="info-value">${group.leader_name}</span>
                </div>
              `
                  : ""
              }
              ${
                group.leader_email
                  ? `
                <div class="info-item">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${group.leader_email}</span>
                </div>
              `
                  : ""
              }
              ${
                group.leader_phone
                  ? `
                <div class="info-item">
                  <span class="info-label">Phone:</span>
                  <span class="info-value">${group.leader_phone}</span>
                </div>
              `
                  : ""
              }
            </div>
          </div>

          ${
            group.traveling_together &&
            (group.arrival_date || group.departure_date)
              ? `
            <div class="section">
              <div class="section-title">📅 Group Travel Dates</div>
              <div class="info-grid">
                ${
                  group.arrival_date
                    ? `
                  <div class="info-item">
                    <span class="info-label">Group Arrival:</span>
                    <span class="info-value">${new Date(group.arrival_date).toLocaleDateString()}</span>
                  </div>
                `
                    : ""
                }
                ${
                  group.departure_date
                    ? `
                  <div class="info-item">
                    <span class="info-label">Group Departure:</span>
                    <span class="info-value">${new Date(group.departure_date).toLocaleDateString()}</span>
                  </div>
                `
                    : ""
                }
              </div>
            </div>
          `
              : ""
          }

          ${
            group.traveling_together &&
            (group.arrival_flight_number || group.departure_flight_number)
              ? `
            <div class="section">
              <div class="section-title">✈️ Flight Information</div>
              <div class="info-grid">
                ${
                  group.arrival_flight_number
                    ? `
                  <div class="info-item">
                    <span class="info-label">Arrival Flight:</span>
                    <span class="info-value">
                      <div class="flight-info">✈️ ${group.arrival_flight_number} ${group.arrival_flight_time ? `at ${group.arrival_flight_time}` : ""}</div>
                      ${group.arrival_notes ? `<div style="font-size: 12px; color: #666;">Notes: ${group.arrival_notes}</div>` : ""}
                    </span>
                  </div>
                `
                    : ""
                }
                ${
                  group.departure_flight_number
                    ? `
                  <div class="info-item">
                    <span class="info-label">Departure Flight:</span>
                    <span class="info-value">
                      <div class="flight-info">🛫 ${group.departure_flight_number} ${group.departure_flight_time ? `at ${group.departure_flight_time}` : ""}</div>
                      ${group.departure_notes ? `<div style="font-size: 12px; color: #666;">Notes: ${group.departure_notes}</div>` : ""}
                    </span>
                  </div>
                `
                    : ""
                }
              </div>
            </div>
          `
              : ""
          }

          ${
            !group.traveling_together
              ? `
            <div class="section">
              <div class="section-title">🚶 Travel Arrangements</div>
              <div class="notes-box">
                Group members are travelling separately with individual flight arrangements.
              </div>
            </div>
          `
              : ""
          }

          ${
            group.bookings && group.bookings.length > 0
              ? `
            <div class="section">
              <div class="section-title">📄 Bookings</div>
              <div class="info-grid">
                ${group.bookings
                  .map(
                    (b) => `
                  <div class="info-item">
                    <span class="info-label">Invoice #:</span>
                    <span class="info-value">${b.invoice_number || ""}</span>
                    <div class="info-value">Ref: ${b.booking_reference || ""}</div>
                    <div class="info-value">Guest: ${b.guest_name || ""}</div>
                    <div class="info-value">Tour: ${b.tour_name || ""}</div>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }

          ${
            group.members && group.members.length > 0
              ? `
            <div class="section">
              <div class="section-title">👥 Group Members (${group.members.length})</div>
              ${group.members
                .map(
                  (member) => `
                <div class="member-card">
                  <div class="member-header">
                    ${member.first_name} ${member.last_name}
                    ${member.is_leader ? '<span class="leader-badge">Leader</span>' : ""}
                  </div>
                  <div class="info-grid">
                    ${
                      member.email
                        ? `
                      <div class="info-item">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${member.email}</span>
                      </div>
                    `
                        : ""
                    }
                    ${
                      member.phone
                        ? `
                      <div class="info-item">
                        <span class="info-label">Phone:</span>
                        <span class="info-value">${member.phone}</span>
                      </div>
                    `
                        : ""
                    }
                    ${
                      member.nationality
                        ? `
                      <div class="info-item">
                        <span class="info-label">Nationality:</span>
                        <span class="info-value">${member.nationality}</span>
                      </div>
                    `
                        : ""
                    }
                    ${
                      member.dietary_restrictions
                        ? `
                      <div class="info-item">
                        <span class="info-label">Dietary Restrictions:</span>
                        <span class="info-value">${member.dietary_restrictions}</span>
                      </div>
                    `
                        : ""
                    }
                  </div>
                  ${
                    member.arrival_flight_number ||
                    member.departure_flight_number
                      ? `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
                      <span class="info-label">Flight Details:</span>
                      ${
                        member.arrival_flight_number
                          ? `
                        <div class="flight-info">✈️ Arrival: ${member.arrival_flight_number} ${member.arrival_flight_time ? `at ${member.arrival_flight_time}` : ""}</div>
                      `
                          : ""
                      }
                      ${
                        member.departure_flight_number
                          ? `
                        <div class="flight-info">🛫 Departure: ${member.departure_flight_number} ${member.departure_flight_time ? `at ${member.departure_flight_time}` : ""}</div>
                      `
                          : ""
                      }
                    </div>
                  `
                      : ""
                  }
                </div>
              `,
                )
                .join("")}
            </div>
          `
              : ""
          }

          ${
            group.total_cost || group.amount_paid || group.deposit_amount
              ? `
            <div class="section">
              <div class="section-title">💰 Financial Information</div>
              <div class="financial-summary">
                <div class="financial-item">
                  <span>Total Cost:</span>
                  <span>$${(group.total_cost || 0).toFixed(2)}</span>
                </div>
                <div class="financial-item">
                  <span>Amount Paid:</span>
                  <span>$${(group.amount_paid || 0).toFixed(2)}</span>
                </div>
                ${
                  group.deposit_amount
                    ? `
                  <div class="financial-item">
                    <span>Deposit:</span>
                    <span>$${group.deposit_amount.toFixed(2)}</span>
                  </div>
                `
                    : ""
                }
                <div class="financial-item total">
                  <span>${group.status === "cancelled" ? "Refund Amount:" : "Outstanding Balance:"}</span>
                  <span>${
                    group.status === "cancelled"
                      ? "$" + (group.refund_amount || 0).toFixed(2)
                      : "$" +
                        (
                          (group.total_cost || 0) - (group.amount_paid || 0)
                        ).toFixed(2)
                  }</span>
                </div>
                ${
                  group.status === "cancelled" && group.cancelled_at
                    ? `
                  <div style="margin-top: 10px; font-size: 14px; color: #666;">
                    Reservation cancelled on ${new Date(group.cancelled_at).toLocaleDateString()}
                  </div>
                `
                    : ""
                }
              </div>
            </div>
          `
              : ""
          }

          ${
            group.special_requirements || group.group_notes
              ? `
            <div class="section">
              <div class="section-title">📝 Additional Information</div>
              ${
                group.special_requirements
                  ? `
                <div style="margin-bottom: 15px;">
                  <span class="info-label">Special Requirements:</span>
                  <div class="notes-box">${group.special_requirements}</div>
                </div>
              `
                  : ""
              }
              ${
                group.group_notes
                  ? `
                <div>
                  <span class="info-label">Group Notes:</span>
                  <div class="notes-box">${group.group_notes}</div>
                </div>
              `
                  : ""
              }
            </div>
          `
              : ""
          }

          <div class="footer">
            <p>This document was generated by JIGUANG TOUR on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p>© ${new Date().getFullYear()} JIGUANG TOUR - Tour Management System</p>
          </div>
        </body>
      </html>
    `;

    // Write the content to the print window
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for the content to load, then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  };

  const filteredGroups = groups.filter((group) => {
    // Text search by name or leader
    const matchesSearch =
      searchTerm === "" ||
      group.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.leader_name &&
        group.leader_name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Group ID exact match if provided
    const matchesId = !groupIdFilter || group.id === Number(groupIdFilter);

    // Status filter
    const matchesStatus =
      statusFilter === "all" || group.status === statusFilter;

    // Date filter: show groups active on this date
    const matchesDate = (() => {
      if (!dateFilter) return true;
      const date = new Date(dateFilter + "T00:00:00");
      // Prefer tour dates; fallback to arrival/departure when traveling together; else created_at only
      const startStr =
        group.tour_start_date ||
        (group.traveling_together ? group.arrival_date : undefined) ||
        group.created_at;
      const endStr =
        group.tour_end_date ||
        (group.traveling_together ? group.departure_date : undefined) ||
        group.created_at;
      if (!startStr && !endStr) return true;
      const start = startStr ? new Date(startStr) : null;
      const end = endStr ? new Date(endStr) : null;
      if (start && end)
        return date >= stripTime(start) && date <= stripTime(end);
      if (start && !end) return date >= stripTime(start);
      if (!start && end) return date <= stripTime(end);
      return true;
    })();

    return matchesSearch && matchesId && matchesStatus && matchesDate;
  });

  function stripTime(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading group bookings...</p>
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
          <h1 className="text-3xl font-bold text-foreground">Group Bookings</h1>
          <p className="text-muted-foreground">
            Manage tour groups and group member information
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Group Booking</DialogTitle>
              <DialogDescription>
                Create a tour group and add all member information
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Group Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Group Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="group_name">Group Name *</Label>
                    <Input
                      id="group_name"
                      value={newGroup.group_name}
                      onChange={(e) =>
                        setNewGroup({ ...newGroup, group_name: e.target.value })
                      }
                      placeholder="Johnson Family, Corporate Retreat..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group_type">Group Type</Label>
                    <Select
                      value={newGroup.group_type}
                      onValueChange={(value) =>
                        setNewGroup({ ...newGroup, group_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="family">Family</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="friends">Friends</SelectItem>
                        <SelectItem value="wedding">Wedding Party</SelectItem>
                        <SelectItem value="school">School Group</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Tour Dates */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tour Dates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tour_start_date">Tour Start Date</Label>
                    <Input
                      id="tour_start_date"
                      type="date"
                      value={newGroup.tour_start_date}
                      onChange={(e) =>
                        setNewGroup({
                          ...newGroup,
                          tour_start_date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tour_end_date">Tour End Date</Label>
                    <Input
                      id="tour_end_date"
                      type="date"
                      value={newGroup.tour_end_date}
                      onChange={(e) =>
                        setNewGroup({
                          ...newGroup,
                          tour_end_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Group Information */}
              <div className="space-y-4">
                {/* Traveling Together Toggle */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <h4 className="text-md font-semibold">
                      Travel Arrangements
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="traveling_together"
                      checked={newGroup.traveling_together}
                      onChange={(e) =>
                        setNewGroup({
                          ...newGroup,
                          traveling_together: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <Label
                      htmlFor="traveling_together"
                      className="text-sm font-medium"
                    >
                      All group members are traveling together (same dates and
                      flights)
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Uncheck this if group members have different travel dates
                    and flight arrangements.
                  </p>
                </div>

                {/* Group Travel Dates - Only shown when traveling together */}
                {newGroup.traveling_together && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="arrival_date">Group Arrival Date</Label>
                      <Input
                        id="arrival_date"
                        type="date"
                        value={newGroup.arrival_date}
                        onChange={(e) =>
                          setNewGroup({
                            ...newGroup,
                            arrival_date: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="departure_date">
                        Group Departure Date
                      </Label>
                      <Input
                        id="departure_date"
                        type="date"
                        value={newGroup.departure_date}
                        onChange={(e) =>
                          setNewGroup({
                            ...newGroup,
                            departure_date: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Group Flight Information - Only shown when traveling together */}
                {newGroup.traveling_together && (
                  <>
                    {/* Arrival Flight Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Plane className="h-5 w-5 text-blue-600" />
                        <h4 className="text-md font-semibold">
                          Group Arrival Flight Details
                        </h4>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="arrival_flight_number">
                            Flight Number
                          </Label>
                          <Input
                            id="arrival_flight_number"
                            value={newGroup.arrival_flight_number}
                            onChange={(e) =>
                              setNewGroup({
                                ...newGroup,
                                arrival_flight_number: e.target.value,
                              })
                            }
                            placeholder="e.g. AI 123"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="arrival_flight_time">
                            Flight Time
                          </Label>
                          <Input
                            id="arrival_flight_time"
                            type="time"
                            value={newGroup.arrival_flight_time}
                            onChange={(e) =>
                              setNewGroup({
                                ...newGroup,
                                arrival_flight_time: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="arrival_notes">Arrival Notes</Label>
                          <Input
                            id="arrival_notes"
                            value={newGroup.arrival_notes}
                            onChange={(e) =>
                              setNewGroup({
                                ...newGroup,
                                arrival_notes: e.target.value,
                              })
                            }
                            placeholder="Terminal, gate info..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Departure Flight Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Plane className="h-5 w-5 text-orange-600 rotate-45" />
                        <h4 className="text-md font-semibold">
                          Group Departure Flight Details
                        </h4>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="departure_flight_number">
                            Flight Number
                          </Label>
                          <Input
                            id="departure_flight_number"
                            value={newGroup.departure_flight_number}
                            onChange={(e) =>
                              setNewGroup({
                                ...newGroup,
                                departure_flight_number: e.target.value,
                              })
                            }
                            placeholder="e.g. AI 456"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="departure_flight_time">
                            Flight Time
                          </Label>
                          <Input
                            id="departure_flight_time"
                            type="time"
                            value={newGroup.departure_flight_time}
                            onChange={(e) =>
                              setNewGroup({
                                ...newGroup,
                                departure_flight_time: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="departure_notes">
                            Departure Notes
                          </Label>
                          <Input
                            id="departure_notes"
                            value={newGroup.departure_notes}
                            onChange={(e) =>
                              setNewGroup({
                                ...newGroup,
                                departure_notes: e.target.value,
                              })
                            }
                            placeholder="Terminal, check-in time..."
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Financial Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 text-green-600">💰</span>
                    <h4 className="text-md font-semibold">
                      Financial Information
                    </h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="total_cost">Total Cost</Label>
                      <Input
                        id="total_cost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newGroup.total_cost}
                        onChange={(e) =>
                          setNewGroup({
                            ...newGroup,
                            total_cost: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount_paid">Amount Paid</Label>
                      <Input
                        id="amount_paid"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newGroup.amount_paid}
                        onChange={(e) =>
                          setNewGroup({
                            ...newGroup,
                            amount_paid: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deposit_amount">Deposit Amount</Label>
                      <Input
                        id="deposit_amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newGroup.deposit_amount}
                        onChange={(e) =>
                          setNewGroup({
                            ...newGroup,
                            deposit_amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Outstanding Balance: $
                    {(
                      (newGroup.total_cost || 0) - (newGroup.amount_paid || 0)
                    ).toFixed(2)}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="special_requirements">
                    Special Requirements
                  </Label>
                  <Textarea
                    id="special_requirements"
                    value={newGroup.special_requirements}
                    onChange={(e) =>
                      setNewGroup({
                        ...newGroup,
                        special_requirements: e.target.value,
                      })
                    }
                    placeholder="Any special accommodations needed..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group_notes">Group Notes</Label>
                  <Textarea
                    id="group_notes"
                    value={newGroup.group_notes}
                    onChange={(e) =>
                      setNewGroup({ ...newGroup, group_notes: e.target.value })
                    }
                    placeholder="Additional notes about the group..."
                  />
                </div>
              </div>

              {/* Group Members */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Group Members ({groupMembers.length})
                  </h3>
                  <Button type="button" variant="outline" onClick={addMember}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                </div>

                {groupMembers.map((member, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">Member {index + 1}</h4>
                        {member.is_leader && (
                          <Badge variant="default" className="text-xs">
                            <Crown className="mr-1 h-3 w-3" />
                            Group Leader
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateMember(index, "is_leader", !member.is_leader)
                          }
                        >
                          {member.is_leader ? "Remove Leader" : "Make Leader"}
                        </Button>
                        {groupMembers.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeMember(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name *</Label>
                        <Input
                          value={member.first_name}
                          onChange={(e) =>
                            updateMember(index, "first_name", e.target.value)
                          }
                          placeholder="First name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name *</Label>
                        <Input
                          value={member.last_name}
                          onChange={(e) =>
                            updateMember(index, "last_name", e.target.value)
                          }
                          placeholder="Last name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={member.email}
                          onChange={(e) =>
                            updateMember(index, "email", e.target.value)
                          }
                          placeholder="Email address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={member.phone}
                          onChange={(e) =>
                            updateMember(index, "phone", e.target.value)
                          }
                          placeholder="Phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Passport Number</Label>
                        <Input
                          value={member.passport_number}
                          onChange={(e) =>
                            updateMember(
                              index,
                              "passport_number",
                              e.target.value,
                            )
                          }
                          placeholder="Passport number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nationality</Label>
                        <Input
                          value={member.nationality}
                          onChange={(e) =>
                            updateMember(index, "nationality", e.target.value)
                          }
                          placeholder="Nationality"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input
                          type="date"
                          value={member.date_of_birth}
                          onChange={(e) =>
                            updateMember(index, "date_of_birth", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Dietary Restrictions</Label>
                        <Input
                          value={member.dietary_restrictions}
                          onChange={(e) =>
                            updateMember(
                              index,
                              "dietary_restrictions",
                              e.target.value,
                            )
                          }
                          placeholder="Allergies, preferences..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Emergency Contact Name</Label>
                        <Input
                          value={member.emergency_contact_name}
                          onChange={(e) =>
                            updateMember(
                              index,
                              "emergency_contact_name",
                              e.target.value,
                            )
                          }
                          placeholder="Emergency contact"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Emergency Contact Phone</Label>
                        <Input
                          value={member.emergency_contact_phone}
                          onChange={(e) =>
                            updateMember(
                              index,
                              "emergency_contact_phone",
                              e.target.value,
                            )
                          }
                          placeholder="Emergency phone"
                        />
                      </div>
                    </div>

                    {/* Individual Travel Information - Only shown when NOT traveling together */}
                    {!newGroup.traveling_together && (
                      <div className="mt-4 space-y-4">
                        <h5 className="font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-purple-600" />
                          Individual Travel Information for{" "}
                          {member.first_name || `Member ${index + 1}`}
                        </h5>

                        {/* Individual Travel Dates */}
                        <div className="space-y-3">
                          <h6 className="text-sm font-medium text-purple-600">
                            Travel Dates
                          </h6>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Arrival Date</Label>
                              <Input
                                type="date"
                                value={member.arrival_date || ""}
                                onChange={(e) =>
                                  updateMember(
                                    index,
                                    "arrival_date",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Departure Date</Label>
                              <Input
                                type="date"
                                value={member.departure_date || ""}
                                onChange={(e) =>
                                  updateMember(
                                    index,
                                    "departure_date",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {/* Individual Flight Information */}
                        <div className="space-y-3">
                          <h6 className="text-sm font-medium text-blue-600">
                            Arrival Flight
                          </h6>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <Label>Flight Number</Label>
                              <Input
                                value={member.arrival_flight_number}
                                onChange={(e) =>
                                  updateMember(
                                    index,
                                    "arrival_flight_number",
                                    e.target.value,
                                  )
                                }
                                placeholder="e.g. AI 123"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Flight Time</Label>
                              <Input
                                type="time"
                                value={member.arrival_flight_time}
                                onChange={(e) =>
                                  updateMember(
                                    index,
                                    "arrival_flight_time",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Arrival Notes</Label>
                              <Input
                                value={member.arrival_notes}
                                onChange={(e) =>
                                  updateMember(
                                    index,
                                    "arrival_notes",
                                    e.target.value,
                                  )
                                }
                                placeholder="Terminal, gate..."
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h6 className="text-sm font-medium text-orange-600">
                            Departure Flight
                          </h6>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <Label>Flight Number</Label>
                              <Input
                                value={member.departure_flight_number}
                                onChange={(e) =>
                                  updateMember(
                                    index,
                                    "departure_flight_number",
                                    e.target.value,
                                  )
                                }
                                placeholder="e.g. AI 456"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Flight Time</Label>
                              <Input
                                type="time"
                                value={member.departure_flight_time}
                                onChange={(e) =>
                                  updateMember(
                                    index,
                                    "departure_flight_time",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Departure Notes</Label>
                              <Input
                                value={member.departure_notes}
                                onChange={(e) =>
                                  updateMember(
                                    index,
                                    "departure_notes",
                                    e.target.value,
                                  )
                                }
                                placeholder="Terminal, check-in..."
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={createGroup} disabled={isCreating}>
                {isCreating ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                    Creating Group...
                  </div>
                ) : (
                  `Create Group (${groupMembers.filter((m) => m.first_name && m.last_name && m.email).length} members)`
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Group Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>Group Details</DialogTitle>
                  <DialogDescription>
                    View complete information for this group booking
                  </DialogDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrintGroup(selectedGroup)}
                  className="flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>
            </DialogHeader>

            {selectedGroup && (
              <div className="space-y-6">
                {/* Group Header */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedGroup.group_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">ID #{selectedGroup.id}</Badge>
                      <Badge
                        variant={getGroupTypeColor(selectedGroup.group_type)}
                      >
                        {selectedGroup.group_type}
                      </Badge>
                      <Badge variant={getStatusColor(selectedGroup.status)}>
                        {selectedGroup.status}
                      </Badge>
                      {selectedGroup.bookings &&
                        selectedGroup.bookings.length > 0 && (
                          <Badge variant="outline">
                            Invoice #
                            {selectedGroup.bookings[0]?.invoice_number || "—"}
                          </Badge>
                        )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Total Members
                    </p>
                    <p className="text-2xl font-bold">
                      {selectedGroup.total_members}
                    </p>
                  </div>
                </div>

                {/* Tour Dates */}
                {(selectedGroup.tour_start_date ||
                  selectedGroup.tour_end_date) && (
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      Tour Duration
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedGroup.tour_start_date && (
                        <div className="p-4 border rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">
                            Tour Start Date
                          </p>
                          <p className="font-medium">
                            {new Date(
                              selectedGroup.tour_start_date,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {selectedGroup.tour_end_date && (
                        <div className="p-4 border rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">
                            Tour End Date
                          </p>
                          <p className="font-medium">
                            {new Date(
                              selectedGroup.tour_end_date,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Group Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Travel Dates - Only shown when traveling together */}
                  {Boolean(selectedGroup.traveling_together) &&
                    (selectedGroup.arrival_date ||
                      selectedGroup.departure_date) && (
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Group Travel Dates
                        </h4>
                        <div className="space-y-2">
                          {selectedGroup.arrival_date && (
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Group Arrival
                              </p>
                              <p>
                                {new Date(
                                  selectedGroup.arrival_date,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {selectedGroup.departure_date && (
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Group Departure
                              </p>
                              <p>
                                {new Date(
                                  selectedGroup.departure_date,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Group Leader
                    </h4>
                    <div className="space-y-2">
                      {selectedGroup.leader_name && (
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p>{selectedGroup.leader_name}</p>
                        </div>
                      )}
                      {selectedGroup.leader_email && (
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p>{selectedGroup.leader_email}</p>
                        </div>
                      )}
                      {selectedGroup.leader_phone && (
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p>{selectedGroup.leader_phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Flight Information - Only shown when traveling together */}
                {Boolean(selectedGroup.traveling_together) &&
                  (selectedGroup.arrival_flight_number ||
                    selectedGroup.departure_flight_number) && (
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Plane className="h-4 w-4" />
                        Flight Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedGroup.arrival_flight_number && (
                          <div className="p-4 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Plane className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">
                                Arrival Flight
                              </span>
                            </div>
                            <div className="space-y-1">
                              <p>
                                <span className="text-muted-foreground">
                                  Flight:
                                </span>{" "}
                                {selectedGroup.arrival_flight_number}
                              </p>
                              {selectedGroup.arrival_flight_time && (
                                <p>
                                  <span className="text-muted-foreground">
                                    Time:
                                  </span>{" "}
                                  {selectedGroup.arrival_flight_time}
                                </p>
                              )}
                              {selectedGroup.arrival_notes && (
                                <p>
                                  <span className="text-muted-foreground">
                                    Notes:
                                  </span>{" "}
                                  {selectedGroup.arrival_notes}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        {selectedGroup.departure_flight_number && (
                          <div className="p-4 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Plane className="h-4 w-4 text-orange-600 rotate-45" />
                              <span className="font-medium">
                                Departure Flight
                              </span>
                            </div>
                            <div className="space-y-1">
                              <p>
                                <span className="text-muted-foreground">
                                  Flight:
                                </span>{" "}
                                {selectedGroup.departure_flight_number}
                              </p>
                              {selectedGroup.departure_flight_time && (
                                <p>
                                  <span className="text-muted-foreground">
                                    Time:
                                  </span>{" "}
                                  {selectedGroup.departure_flight_time}
                                </p>
                              )}
                              {selectedGroup.departure_notes && (
                                <p>
                                  <span className="text-muted-foreground">
                                    Notes:
                                  </span>{" "}
                                  {selectedGroup.departure_notes}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Travel Arrangements - Show when NOT traveling together */}
                {!Boolean(selectedGroup.traveling_together) && (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">Travel Arrangements</span>
                      </div>
                      <p className="text-muted-foreground">
                        Group members are travelling separately with individual
                        flight arrangements.
                      </p>
                    </div>
                  </div>
                )}

                {/* Additional Information */}
                {(selectedGroup.special_requirements ||
                  selectedGroup.group_notes) && (
                  <div className="space-y-4">
                    <h4 className="font-semibold">Additional Information</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {selectedGroup.special_requirements && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Special Requirements
                          </p>
                          <p className="p-3 bg-muted rounded">
                            {selectedGroup.special_requirements}
                          </p>
                        </div>
                      )}
                      {selectedGroup.group_notes && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Group Notes
                          </p>
                          <p className="p-3 bg-muted rounded">
                            {selectedGroup.group_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Financial Information */}
                {(selectedGroup.total_cost ||
                  selectedGroup.amount_paid ||
                  selectedGroup.deposit_amount) && (
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <span className="text-green-600">💰</span>
                      Financial Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Total Cost
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          ${(selectedGroup.total_cost || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Amount Paid
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          ${(selectedGroup.amount_paid || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Deposit</p>
                        <p className="text-2xl font-bold text-orange-600">
                          ${(selectedGroup.deposit_amount || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      {selectedGroup.status === "cancelled" ? (
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Refund Amount:</span>
                            <span className="text-xl font-bold text-orange-600">
                              ${(selectedGroup.refund_amount || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Reservation cancelled{" "}
                            {selectedGroup.cancelled_at &&
                              `on ${new Date(selectedGroup.cancelled_at).toLocaleDateString()}`}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">
                              Outstanding Balance:
                            </span>
                            <span
                              className={`text-xl font-bold ${
                                (selectedGroup.total_cost || 0) -
                                  (selectedGroup.amount_paid || 0) >
                                0
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              $
                              {(
                                (selectedGroup.total_cost || 0) -
                                (selectedGroup.amount_paid || 0)
                              ).toFixed(2)}
                            </span>
                          </div>
                          {selectedGroup.deposit_amount &&
                            selectedGroup.deposit_amount > 0 && (
                              <div className="text-sm text-muted-foreground mt-1">
                                Deposit of $
                                {selectedGroup.deposit_amount.toFixed(2)} has
                                been collected
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bookings (with Invoice Numbers) */}
                {selectedGroup.bookings &&
                  selectedGroup.bookings.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <span className="text-blue-600">📄</span>
                        Bookings
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedGroup.bookings.map((b) => (
                          <div key={b.id} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-center">
                              <div className="font-medium">
                                Invoice #{b.invoice_number || "—"}
                              </div>
                              <Badge variant="outline">{b.status}</Badge>
                            </div>
                            <div className="text-sm mt-2 space-y-1">
                              <div>Ref: {b.booking_reference}</div>
                              <div>Guest: {b.guest_name}</div>
                              <div>Tour: {b.tour_name}</div>
                              {b.start_date && (
                                <div>
                                  Start:{" "}
                                  {new Date(b.start_date).toLocaleDateString()}
                                </div>
                              )}
                              {b.end_date && (
                                <div>
                                  End:{" "}
                                  {new Date(b.end_date).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Group Members */}
                {selectedGroup.members && selectedGroup.members.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Group Members ({selectedGroup.members.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedGroup.members.map((member, index) => (
                        <div
                          key={member.id || index}
                          className="p-4 border rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">
                              {member.first_name} {member.last_name}
                            </h5>
                            {member.is_leader && (
                              <Badge variant="default" className="text-xs">
                                <Crown className="mr-1 h-3 w-3" />
                                Leader
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1 text-sm">
                            {member.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span>{member.email}</span>
                              </div>
                            )}
                            {member.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span>{member.phone}</span>
                              </div>
                            )}
                            {member.nationality && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span>{member.nationality}</span>
                              </div>
                            )}
                            {member.dietary_restrictions && (
                              <div className="text-xs text-muted-foreground">
                                Dietary: {member.dietary_restrictions}
                              </div>
                            )}

                            {/* Individual Flight Information */}
                            {(member.arrival_flight_number ||
                              member.departure_flight_number) && (
                              <div className="mt-3 pt-2 border-t">
                                <div className="text-xs font-medium text-muted-foreground mb-2">
                                  Flight Details:
                                </div>
                                {member.arrival_flight_number && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <Plane className="h-3 w-3 text-blue-600" />
                                    <span>
                                      Arrival: {member.arrival_flight_number}
                                    </span>
                                    {member.arrival_flight_time && (
                                      <span>
                                        at {member.arrival_flight_time}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {member.departure_flight_number && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <Plane className="h-3 w-3 text-orange-600 rotate-45" />
                                    <span>
                                      Departure:{" "}
                                      {member.departure_flight_number}
                                    </span>
                                    {member.departure_flight_time && (
                                      <span>
                                        at {member.departure_flight_time}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Group Created Date */}
                <div className="text-sm text-muted-foreground border-t pt-4">
                  Group created on{" "}
                  {new Date(selectedGroup.created_at).toLocaleDateString()} at{" "}
                  {new Date(selectedGroup.created_at).toLocaleTimeString()}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Group Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Group Booking</DialogTitle>
              <DialogDescription>
                Update group information and details
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Group Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Group Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_group_name">Group Name *</Label>
                    <Input
                      id="edit_group_name"
                      value={newGroup.group_name}
                      onChange={(e) =>
                        setNewGroup({ ...newGroup, group_name: e.target.value })
                      }
                      placeholder="Johnson Family, Corporate Retreat..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_group_type">Group Type</Label>
                    <Select
                      value={newGroup.group_type}
                      onValueChange={(value) =>
                        setNewGroup({ ...newGroup, group_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="family">Family</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="friends">Friends</SelectItem>
                        <SelectItem value="wedding">Wedding Party</SelectItem>
                        <SelectItem value="school">School Group</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Tour Dates */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tour Dates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_tour_start_date">
                      Tour Start Date
                    </Label>
                    <Input
                      id="edit_tour_start_date"
                      type="date"
                      value={newGroup.tour_start_date}
                      onChange={(e) =>
                        setNewGroup({
                          ...newGroup,
                          tour_start_date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_tour_end_date">Tour End Date</Label>
                    <Input
                      id="edit_tour_end_date"
                      type="date"
                      value={newGroup.tour_end_date}
                      onChange={(e) =>
                        setNewGroup({
                          ...newGroup,
                          tour_end_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Group Information */}
              <div className="space-y-4">
                {/* Traveling Together Toggle */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <h4 className="text-md font-semibold">
                      Travel Arrangements
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit_traveling_together"
                      checked={newGroup.traveling_together}
                      onChange={(e) =>
                        setNewGroup({
                          ...newGroup,
                          traveling_together: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <Label
                      htmlFor="edit_traveling_together"
                      className="text-sm font-medium"
                    >
                      All group members are traveling together (same dates and
                      flights)
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Uncheck this if group members have different travel dates
                    and flight arrangements.
                  </p>
                </div>

                {/* Group Travel Dates - Only shown when traveling together */}
                {newGroup.traveling_together && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_arrival_date">
                        Group Arrival Date
                      </Label>
                      <Input
                        id="edit_arrival_date"
                        type="date"
                        value={newGroup.arrival_date}
                        onChange={(e) =>
                          setNewGroup({
                            ...newGroup,
                            arrival_date: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_departure_date">
                        Group Departure Date
                      </Label>
                      <Input
                        id="edit_departure_date"
                        type="date"
                        value={newGroup.departure_date}
                        onChange={(e) =>
                          setNewGroup({
                            ...newGroup,
                            departure_date: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Group Flight Information - Only shown when traveling together */}
                {newGroup.traveling_together && (
                  <>
                    {/* Arrival Flight Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Plane className="h-5 w-5 text-blue-600" />
                        <h4 className="text-md font-semibold">
                          Group Arrival Flight Details
                        </h4>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit_arrival_flight_number">
                            Flight Number
                          </Label>
                          <Input
                            id="edit_arrival_flight_number"
                            value={newGroup.arrival_flight_number}
                            onChange={(e) =>
                              setNewGroup({
                                ...newGroup,
                                arrival_flight_number: e.target.value,
                              })
                            }
                            placeholder="e.g. AI 123"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit_arrival_flight_time">
                            Flight Time
                          </Label>
                          <Input
                            id="edit_arrival_flight_time"
                            type="time"
                            value={newGroup.arrival_flight_time}
                            onChange={(e) =>
                              setNewGroup({
                                ...newGroup,
                                arrival_flight_time: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit_arrival_notes">
                            Arrival Notes
                          </Label>
                          <Input
                            id="edit_arrival_notes"
                            value={newGroup.arrival_notes}
                            onChange={(e) =>
                              setNewGroup({
                                ...newGroup,
                                arrival_notes: e.target.value,
                              })
                            }
                            placeholder="Terminal, gate info..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Departure Flight Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Plane className="h-5 w-5 text-orange-600 rotate-45" />
                        <h4 className="text-md font-semibold">
                          Group Departure Flight Details
                        </h4>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit_departure_flight_number">
                            Flight Number
                          </Label>
                          <Input
                            id="edit_departure_flight_number"
                            value={newGroup.departure_flight_number}
                            onChange={(e) =>
                              setNewGroup({
                                ...newGroup,
                                departure_flight_number: e.target.value,
                              })
                            }
                            placeholder="e.g. AI 456"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit_departure_flight_time">
                            Flight Time
                          </Label>
                          <Input
                            id="edit_departure_flight_time"
                            type="time"
                            value={newGroup.departure_flight_time}
                            onChange={(e) =>
                              setNewGroup({
                                ...newGroup,
                                departure_flight_time: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit_departure_notes">
                            Departure Notes
                          </Label>
                          <Input
                            id="edit_departure_notes"
                            value={newGroup.departure_notes}
                            onChange={(e) =>
                              setNewGroup({
                                ...newGroup,
                                departure_notes: e.target.value,
                              })
                            }
                            placeholder="Terminal, check-in time..."
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Financial Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 text-green-600">💰</span>
                    <h4 className="text-md font-semibold">
                      Financial Information
                    </h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_total_cost">Total Cost</Label>
                      <Input
                        id="edit_total_cost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newGroup.total_cost}
                        onChange={(e) =>
                          setNewGroup({
                            ...newGroup,
                            total_cost: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_amount_paid">Amount Paid</Label>
                      <Input
                        id="edit_amount_paid"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newGroup.amount_paid}
                        onChange={(e) =>
                          setNewGroup({
                            ...newGroup,
                            amount_paid: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_deposit_amount">
                        Deposit Amount
                      </Label>
                      <Input
                        id="edit_deposit_amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newGroup.deposit_amount}
                        onChange={(e) =>
                          setNewGroup({
                            ...newGroup,
                            deposit_amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Outstanding Balance: $
                    {(
                      (newGroup.total_cost || 0) - (newGroup.amount_paid || 0)
                    ).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Group Members */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Group Members ({groupMembers.length})
                  </h3>
                  <Button type="button" variant="outline" onClick={addMember}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                </div>

                {groupMembers.map((member, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">Member {index + 1}</h4>
                        {member.is_leader && (
                          <Badge variant="default" className="text-xs">
                            <Crown className="mr-1 h-3 w-3" />
                            Group Leader
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateMember(index, "is_leader", !member.is_leader)
                          }
                        >
                          {member.is_leader ? "Remove Leader" : "Make Leader"}
                        </Button>
                        {groupMembers.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeMember(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name *</Label>
                        <Input
                          value={member.first_name}
                          onChange={(e) =>
                            updateMember(index, "first_name", e.target.value)
                          }
                          placeholder="First name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name *</Label>
                        <Input
                          value={member.last_name}
                          onChange={(e) =>
                            updateMember(index, "last_name", e.target.value)
                          }
                          placeholder="Last name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={member.email}
                          onChange={(e) =>
                            updateMember(index, "email", e.target.value)
                          }
                          placeholder="Email address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={member.phone}
                          onChange={(e) =>
                            updateMember(index, "phone", e.target.value)
                          }
                          placeholder="Phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Passport Number</Label>
                        <Input
                          value={member.passport_number}
                          onChange={(e) =>
                            updateMember(
                              index,
                              "passport_number",
                              e.target.value,
                            )
                          }
                          placeholder="Passport number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nationality</Label>
                        <Input
                          value={member.nationality}
                          onChange={(e) =>
                            updateMember(index, "nationality", e.target.value)
                          }
                          placeholder="Nationality"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input
                          type="date"
                          value={member.date_of_birth}
                          onChange={(e) =>
                            updateMember(index, "date_of_birth", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Dietary Restrictions</Label>
                        <Input
                          value={member.dietary_restrictions}
                          onChange={(e) =>
                            updateMember(
                              index,
                              "dietary_restrictions",
                              e.target.value,
                            )
                          }
                          placeholder="Allergies, preferences..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Emergency Contact Name</Label>
                        <Input
                          value={member.emergency_contact_name}
                          onChange={(e) =>
                            updateMember(
                              index,
                              "emergency_contact_name",
                              e.target.value,
                            )
                          }
                          placeholder="Emergency contact"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Emergency Contact Phone</Label>
                        <Input
                          value={member.emergency_contact_phone}
                          onChange={(e) =>
                            updateMember(
                              index,
                              "emergency_contact_phone",
                              e.target.value,
                            )
                          }
                          placeholder="Emergency phone"
                        />
                      </div>
                    </div>

                    {/* Individual Travel Information - Only shown when NOT traveling together */}
                    {!newGroup.traveling_together && (
                      <div className="mt-4 space-y-4">
                        <h5 className="font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-purple-600" />
                          Individual Travel Information for{" "}
                          {member.first_name || `Member ${index + 1}`}
                        </h5>

                        {/* Individual Travel Dates */}
                        <div className="space-y-3">
                          <h6 className="text-sm font-medium text-purple-600">
                            Travel Dates
                          </h6>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Arrival Date</Label>
                              <Input
                                type="date"
                                value={member.arrival_date || ""}
                                onChange={(e) =>
                                  updateMember(
                                    index,
                                    "arrival_date",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Departure Date</Label>
                              <Input
                                type="date"
                                value={member.departure_date || ""}
                                onChange={(e) =>
                                  updateMember(
                                    index,
                                    "departure_date",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {/* Individual Flight Information */}
                        <div className="space-y-3">
                          <h6 className="text-sm font-medium text-blue-600">
                            Arrival Flight
                          </h6>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <Label>Flight Number</Label>
                              <Input
                                value={member.arrival_flight_number}
                                onChange={(e) =>
                                  updateMember(
                                    index,
                                    "arrival_flight_number",
                                    e.target.value,
                                  )
                                }
                                placeholder="e.g. AI 123"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Flight Time</Label>
                              <Input
                                type="time"
                                value={member.arrival_flight_time}
                                onChange={(e) =>
                                  updateMember(
                                    index,
                                    "arrival_flight_time",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Arrival Notes</Label>
                              <Input
                                value={member.arrival_notes}
                                onChange={(e) =>
                                  updateMember(
                                    index,
                                    "arrival_notes",
                                    e.target.value,
                                  )
                                }
                                placeholder="Terminal, gate..."
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h6 className="text-sm font-medium text-orange-600">
                            Departure Flight
                          </h6>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <Label>Flight Number</Label>
                              <Input
                                value={member.departure_flight_number}
                                onChange={(e) =>
                                  updateMember(
                                    index,
                                    "departure_flight_number",
                                    e.target.value,
                                  )
                                }
                                placeholder="e.g. AI 456"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Flight Time</Label>
                              <Input
                                type="time"
                                value={member.departure_flight_time}
                                onChange={(e) =>
                                  updateMember(
                                    index,
                                    "departure_flight_time",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Departure Notes</Label>
                              <Input
                                value={member.departure_notes}
                                onChange={(e) =>
                                  updateMember(
                                    index,
                                    "departure_notes",
                                    e.target.value,
                                  )
                                }
                                placeholder="Terminal, check-in..."
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_special_requirements">
                    Special Requirements
                  </Label>
                  <Textarea
                    id="edit_special_requirements"
                    value={newGroup.special_requirements}
                    onChange={(e) =>
                      setNewGroup({
                        ...newGroup,
                        special_requirements: e.target.value,
                      })
                    }
                    placeholder="Any special accommodations needed..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_group_notes">Group Notes</Label>
                  <Textarea
                    id="edit_group_notes"
                    value={newGroup.group_notes}
                    onChange={(e) =>
                      setNewGroup({ ...newGroup, group_notes: e.target.value })
                    }
                    placeholder="Additional notes about the group..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="destructive"
                onClick={() => {
                  if (editingGroup) {
                    setCancelingGroup(editingGroup);
                    setRefundAmount(editingGroup.amount_paid || 0);
                    setIsCancelDialogOpen(true);
                  }
                }}
                disabled={editingGroup?.status === "cancelled"}
              >
                Cancel Reservation
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => updateGroup(editingGroup?.id)}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <div className="flex items-center">
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                      Updating Group...
                    </div>
                  ) : (
                    "Update Group"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Delete Group Booking</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this group booking? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>

            {deletingGroup && (
              <div className="py-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold text-lg">
                    {deletingGroup.group_name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {deletingGroup.total_members} member(s) •{" "}
                    {deletingGroup.group_type}
                  </p>
                  {deletingGroup.leader_name && (
                    <p className="text-sm text-muted-foreground">
                      Led by: {deletingGroup.leader_name}
                    </p>
                  )}
                </div>

                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> This will permanently delete the
                    group booking and remove all associated member records.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setDeletingGroup(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deletingGroup && deleteGroup(deletingGroup.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel Reservation Dialog */}
        <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Cancel Reservation</DialogTitle>
              <DialogDescription>
                Cancel this group reservation and process refund. This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>

            {cancelingGroup && (
              <div className="py-4">
                <div className="p-4 bg-muted rounded-lg mb-4">
                  <h4 className="font-semibold text-lg">
                    {cancelingGroup.group_name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {cancelingGroup.total_members} member(s) ���{" "}
                    {cancelingGroup.group_type}
                  </p>
                  {cancelingGroup.leader_name && (
                    <p className="text-sm text-muted-foreground">
                      Led by: {cancelingGroup.leader_name}
                    </p>
                  )}
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-sm">
                      <span className="font-medium">Total Cost:</span> $
                      {(cancelingGroup.total_cost || 0).toFixed(2)}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Amount Paid:</span> $
                      {(cancelingGroup.amount_paid || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="refund_amount"
                      className="text-sm font-medium"
                    >
                      Refund Amount ($)
                    </Label>
                    <Input
                      id="refund_amount"
                      type="number"
                      step="0.01"
                      value={refundAmount}
                      onChange={(e) =>
                        setRefundAmount(parseFloat(e.target.value) || 0)
                      }
                      placeholder="Enter refund amount"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum refundable: $
                      {(cancelingGroup.amount_paid || 0).toFixed(2)}
                    </p>
                  </div>

                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Warning:</strong> This will mark the reservation
                      as cancelled and record the refund amount for tracking
                      purposes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCancelDialogOpen(false);
                  setCancelingGroup(null);
                  setRefundAmount(0);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  cancelingGroup &&
                  cancelReservation(cancelingGroup.id, refundAmount)
                }
                disabled={
                  refundAmount < 0 ||
                  refundAmount > (cancelingGroup?.amount_paid || 0)
                }
              >
                Confirm Cancellation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{groups.length}</p>
                <p className="text-sm text-muted-foreground">Total Groups</p>
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
                  {groups.filter((g) => g.status === "active").length}
                </p>
                <p className="text-sm text-muted-foreground">Active Groups</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {groups.reduce((sum, g) => sum + g.total_members, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">
                  {groups.filter((g) => g.group_type === "family").length}
                </p>
                <p className="text-sm text-muted-foreground">Family Groups</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or leader..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
              <Input
                placeholder="Group ID"
                value={groupIdFilter}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, "");
                  setGroupIdFilter(v);
                }}
                inputMode="numeric"
              />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Groups List */}
      <div className="grid gap-4">
        {filteredGroups.map((group) => (
          <Card key={group.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        {group.group_name}
                      </h3>
                      <Badge variant="outline">ID #{group.id}</Badge>
                      <Badge variant={getGroupTypeColor(group.group_type)}>
                        {group.group_type}
                      </Badge>
                      <Badge variant={getStatusColor(group.status)}>
                        {group.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Users className="mr-1 h-4 w-4" />
                        {group.total_members} member
                        {group.total_members > 1 ? "s" : ""}
                      </div>
                      {group.leader_name && (
                        <div className="flex items-center">
                          <Crown className="mr-1 h-4 w-4" />
                          Leader: {group.leader_name}
                        </div>
                      )}
                      {group.leader_email && (
                        <div className="flex items-center">
                          <Mail className="mr-1 h-4 w-4" />
                          {group.leader_email}
                        </div>
                      )}
                      {/* Tour Dates - Always show */}
                      {(group.tour_start_date || group.tour_end_date) && (
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-4 w-4" />
                          {group.tour_start_date
                            ? new Date(
                                group.tour_start_date,
                              ).toLocaleDateString()
                            : "TBD"}{" "}
                          -{" "}
                          {group.tour_end_date
                            ? new Date(group.tour_end_date).toLocaleDateString()
                            : "TBD"}
                        </div>
                      )}

                      {/* Travel Information */}
                      {Boolean(group.traveling_together) ? (
                        <>
                          {group.arrival_flight_number && (
                            <div className="flex items-center text-blue-600">
                              <Plane className="mr-1 h-4 w-4" />
                              Arrival: {group.arrival_flight_number}{" "}
                              {group.arrival_flight_time &&
                                `at ${group.arrival_flight_time}`}
                            </div>
                          )}
                          {group.departure_flight_number && (
                            <div className="flex items-center text-orange-600">
                              <Plane className="mr-1 h-4 w-4 rotate-45" />
                              Departure: {group.departure_flight_number}{" "}
                              {group.departure_flight_time &&
                                `at ${group.departure_flight_time}`}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center text-purple-600 font-medium">
                          <Users className="mr-1 h-4 w-4" />
                          Travelling separately
                        </div>
                      )}
                      {(group.total_cost || group.amount_paid) && (
                        <div className="flex items-center">
                          <span className="mr-1 text-green-600">💰</span>
                          Total: ${(group.total_cost || 0).toFixed(2)} | Paid: $
                          {(group.amount_paid || 0).toFixed(2)}
                          {group.status === "cancelled" &&
                          group.refund_amount > 0 ? (
                            <span className="ml-2 text-orange-600 font-medium">
                              (Refunded: $
                              {(group.refund_amount || 0).toFixed(2)})
                            </span>
                          ) : (
                            (group.total_cost || 0) - (group.amount_paid || 0) >
                              0 && (
                              <span className="ml-2 text-red-600 font-medium">
                                ($
                                {(
                                  (group.total_cost || 0) -
                                  (group.amount_paid || 0)
                                ).toFixed(2)}{" "}
                                due)
                              </span>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const groupWithMembers = await fetchGroupWithMembers(
                          group.id,
                        );
                        setSelectedGroup(groupWithMembers || group);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        setEditingGroup(group);
                        await initializeEditMode(group);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeletingGroup(group);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No groups found
            </h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Create your first group booking to get started"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
