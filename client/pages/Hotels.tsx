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
import { DeleteHotelBookingDialog } from "@/components/DeleteHotelBookingDialog";
// Remove the problematic fetchWithTimeout import
import { 
  Hotel, 
  Star, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Plus,
  Search,
  Filter,
  Calendar,
  Bed,
  Edit3,
  Trash2,
  DollarSign
} from "lucide-react";

// Interfaces following Activities pattern
interface HotelData {
  id: number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  star_rating: number;
  total_rooms: number;
  contact_person?: string;
  special_rates?: number;
  amenities?: string;
  check_in_time: string;
  check_out_time: string;
  is_partner: boolean;
}

interface HotelBooking {
  id: number;
  booking_reference: string;
  guest_name: string;
  guest_id?: number;
  group_name?: string;
  hotel_id: number;
  room_number: string;
  room_type: string;
  check_in_date: string;
  check_out_date: string;
  actual_check_in?: string;
  actual_check_out?: string;
  guests_count: number;
  rate_per_night: number;
  total_amount: number;
  status: string;
  special_requests?: string;
}

interface HotelStats {
  total_bookings: number;
  confirmed_bookings: number;
  checked_in_bookings: number;
  checked_out_bookings: number;
  cancelled_bookings: number;
  total_revenue: number;
  avg_booking_value: number;
}

export default function Hotels() {
  // Test basic connectivity
  const testConnectivity = async () => {
    try {
      console.log('🔄 Testing server connectivity...');
      const response = await fetch('/api/ping', {
        method: 'GET',
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const isConnected = response.ok;
      console.log(`📡 Server connectivity: ${isConnected ? '✅ Connected' : '❌ Failed'}`);
      return isConnected;
    } catch (error) {
      console.error('❌ Connectivity test failed:', error);
      return false;
    }
  };

  // Safe fetch function with retry mechanism
  const safeFetch = async (url: string, options: RequestInit = {}, retries = 2) => {
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        console.log(`🔄 Safe fetching (attempt ${attempt}): ${url}`);

        // Add a small delay for retries
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }

        const response = await fetch(url, options);
        console.log(`✅ Safe fetch completed: ${url} - ${response.status}`);
        return response;
      } catch (error) {
        console.error(`❌ Safe fetch failed (attempt ${attempt}): ${url}`, error);

        if (attempt === retries + 1) {
          // Last attempt failed, throw the error
          throw error;
        }

        console.log(`🔄 Retrying fetch for: ${url}`);
      }
    }

    // This should never be reached, but TypeScript requires it
    throw new Error(`All fetch attempts failed for: ${url}`);
  };

  // State following Activities pattern
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [stats, setStats] = useState<HotelStats>({
    total_bookings: 0,
    confirmed_bookings: 0,
    checked_in_bookings: 0,
    checked_out_bookings: 0,
    cancelled_bookings: 0,
    total_revenue: 0,
    avg_booking_value: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [groupIdQuery, setGroupIdQuery] = useState("");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Dialog states
  const [isCreateHotelOpen, setIsCreateHotelOpen] = useState(false);
  const [isCreateBookingOpen, setIsCreateBookingOpen] = useState(false);
  const [isBookingDetailOpen, setIsBookingDetailOpen] = useState(false);
  const [isHotelDetailOpen, setIsHotelDetailOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<HotelBooking | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<HotelData | null>(null);

  // Add stable dimensions to prevent layout thrashing
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Form states
  const [hotelForm, setHotelForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    star_rating: 3,
    total_rooms: 0,
    contact_person: '',
    special_rates: '',
    amenities: '',
    check_in_time: '15:00',
    check_out_time: '11:00',
    is_partner: false
  });

  const [bookingForm, setBookingForm] = useState({
    booking_type: 'individual', // 'individual' or 'group'
    guest_name: '',
    selected_guest_id: '',
    guest_group_name: '', // Group name for individual guest
    selected_group_id: '',
    selected_members: [] as number[], // Array of guest IDs for multi-selection
    individual_selected_guests: [] as number[], // For individual booking multi-guest selection
    hotel_id: '',
    room_number: '',
    room_type: 'Standard',
    check_in_date: '',
    check_out_date: '',
    guests_count: 1,
    rate_per_night: 150,
    special_requests: ''
  });

  // Additional state for group booking management
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [bookingArrangements, setBookingArrangements] = useState<any[]>([]);

  // Additional state for individual guest multi-selection
  const [individualGuestGroup, setIndividualGuestGroup] = useState<any>(null);
  const [individualGroupMembers, setIndividualGroupMembers] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    // Set initialized after first render to prevent layout issues
    const timer = setTimeout(() => setIsInitialized(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Simple data fetching following Activities pattern
  const fetchData = async () => {
    setLoading(true);
    console.log('🏨 Fetching hotels data...');

    // Clear previous errors
    setConnectionError(null);

    // Check network connectivity first
    if (!navigator.onLine) {
      console.error('❌ No internet connection');
      setConnectionError('No internet connection. Please check your network and try again.');
      setLoading(false);
      return;
    }

    // Test server connectivity
    const isConnected = await testConnectivity();
    if (!isConnected) {
      console.error('❌ Server is not reachable');
      setConnectionError('Unable to connect to server. Please try again in a moment.');
      setLoading(false);
      return;
    }

    let successCount = 0;
    const totalRequests = 5;

    // Fetch each endpoint independently with error handling
    try {
      const hotelsRes = await safeFetch('/api/hotels');
      if (hotelsRes.ok) {
        const hotelsData = await hotelsRes.json();
        setHotels(hotelsData);
        console.log('✅ Hotels loaded:', hotelsData.length);
        successCount++;
      } else {
        console.error('❌ Failed to fetch hotels:', hotelsRes.status);
      }
    } catch (error) {
      console.error('❌ Error fetching hotels:', error);
    }

    try {
      const bookingsRes = await safeFetch('/api/hotel-bookings');
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData);
        console.log('✅ Bookings loaded:', bookingsData.length);
        successCount++;
      } else {
        console.error('❌ Failed to fetch bookings:', bookingsRes.status);
      }
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
    }

    try {
      const groupsRes = await safeFetch('/api/groups');
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData);
        console.log('✅ Groups loaded:', groupsData.length);
        successCount++;
      } else {
        console.error('❌ Failed to fetch groups:', groupsRes.status);
      }
    } catch (error) {
      console.error('❌ Error fetching groups:', error);
    }

    try {
      const guestsRes = await safeFetch('/api/guests');
      if (guestsRes.ok) {
        const guestsData = await guestsRes.json();
        setGuests(guestsData);
        console.log('✅ Guests loaded:', guestsData.length);
        successCount++;
      } else {
        console.error('❌ Failed to fetch guests:', guestsRes.status);
      }
    } catch (error) {
      console.error('❌ Error fetching guests:', error);
    }

    try {
      const statsRes = await safeFetch('/api/hotel-stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
        console.log('✅ Stats loaded:', statsData);
        successCount++;
      } else {
        console.error('❌ Failed to fetch stats:', statsRes.status);
      }
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
    }

    console.log(`📊 Data loading complete: ${successCount}/${totalRequests} successful`);

    // Show a user-friendly message if most requests failed
    if (successCount === 0) {
      console.error('❌ All API requests failed. Please check your connection and try again.');
    } else if (successCount < totalRequests) {
      console.warn(`⚠️ Some data could not be loaded (${successCount}/${totalRequests} successful)`);
    }

    setLoading(false);
  };

  // CRUD operations following Activities pattern
  const handleCreateHotel = async () => {
    try {
      const response = await fetch('/api/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hotelForm)
      });

      if (response.ok) {
        const newHotel = await response.json();
        setHotels([...hotels, newHotel]);
        setIsCreateHotelOpen(false);
        resetHotelForm();
      }
    } catch (error) {
      console.error('Error creating hotel:', error);
    }
  };

  const handleCreateBooking = async () => {
    try {
      // Calculate total amount
      const nights = calculateNights(bookingForm.check_in_date, bookingForm.check_out_date);
      const total_amount = nights * bookingForm.rate_per_night;

      // For multi-guest individual bookings, create guest names list
      let guestNames = bookingForm.guest_name;
      let primaryGuestId = bookingForm.selected_guest_id ? parseInt(bookingForm.selected_guest_id) : null;

      if (bookingForm.guests_count > 1 && bookingForm.individual_selected_guests.length > 1) {
        // Create comma-separated list of guest names
        const selectedGuestNames = bookingForm.individual_selected_guests
          .map(guestId => {
            const guest = individualGroupMembers.find(m => m.id === guestId) || guests.find(g => g.id === guestId);
            return guest ? `${guest.first_name} ${guest.last_name}` : '';
          })
          .filter(name => name)
          .join(', ');

        guestNames = selectedGuestNames || bookingForm.guest_name;
        // Use the first selected guest as primary
        primaryGuestId = bookingForm.individual_selected_guests[0];
      }

      const bookingData = {
        guest_name: guestNames,
        guest_id: primaryGuestId,
        group_name: bookingForm.guest_group_name || null,
        hotel_id: parseInt(bookingForm.hotel_id),
        room_number: bookingForm.room_number,
        room_type: bookingForm.room_type,
        check_in_date: bookingForm.check_in_date,
        check_out_date: bookingForm.check_out_date,
        guests_count: bookingForm.guests_count,
        rate_per_night: bookingForm.rate_per_night,
        total_amount: total_amount,
        special_requests: bookingForm.special_requests,
        booking_reference: `HB-${Date.now()}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`
      };

      console.log('🏨 Creating booking with data:', bookingData);

      const response = await safeFetch('/api/hotel-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      if (response.ok) {
        const newBooking = await response.json();
        console.log('✅ Booking created successfully:', newBooking);
        // Refresh data to get updated list
        fetchData();
        setIsCreateBookingOpen(false);
        resetBookingForm();
      } else {
        console.error('❌ Failed to create booking:', response.status);
      }
    } catch (error) {
      console.error('❌ Error creating booking:', error);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: number, status: string) => {
    try {
      const response = await safeFetch(`/api/hotel-bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        // Update local state
        setBookings(bookings.map(booking => 
          booking.id === bookingId ? { ...booking, status } : booking
        ));
        // Refresh stats
        fetchData();
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  const resetHotelForm = () => {
    setHotelForm({
      name: '',
      address: '',
      phone: '',
      email: '',
      star_rating: 3,
      total_rooms: 0,
      contact_person: '',
      special_rates: '',
      amenities: '',
      check_in_time: '15:00',
      check_out_time: '11:00',
      is_partner: false
    });
  };

  const resetBookingForm = () => {
    setBookingForm({
      booking_type: 'individual',
      guest_name: '',
      selected_guest_id: '',
      guest_group_name: '',
      selected_group_id: '',
      selected_members: [],
      individual_selected_guests: [],
      hotel_id: '',
      room_number: '',
      room_type: 'Standard',
      check_in_date: '',
      check_out_date: '',
      guests_count: 1,
      rate_per_night: 150,
      special_requests: ''
    });
    setSelectedGroup(null);
    setGroupMembers([]);
    setBookingArrangements([]);
    setIndividualGuestGroup(null);
    setIndividualGroupMembers([]);
  };

  // Fetch guest group information when individual guest is selected
  const handleIndividualGuestSelection = async (guestId: string) => {
    console.log('🔄 Fetching guest group info for ID:', guestId);

    const guest = guests.find(g => g.id.toString() === guestId);
    if (!guest) {
      console.error('❌ Guest not found in local data');
      return;
    }

    // Set guest info immediately
    const baseForm = {
      ...bookingForm,
      selected_guest_id: guestId,
      guest_name: `${guest.first_name} ${guest.last_name}`,
      guest_group_name: '',
      individual_selected_guests: [parseInt(guestId)] // Start with the selected guest
    };

    try {
      // Try to fetch group information for this guest
      const response = await safeFetch(`/api/guests/${guestId}/group`);
      if (response.ok) {
        const guestWithGroup = await response.json();
        console.log('✅ Guest group info loaded:', guestWithGroup.group_name || 'No group');

        if (guestWithGroup.group_name && guestWithGroup.group_id) {
          // Fetch group members for multi-selection
          await fetchIndividualGroupMembers(guestWithGroup.group_id.toString());
          setIndividualGuestGroup(guestWithGroup);
        } else {
          setIndividualGuestGroup(null);
          setIndividualGroupMembers([]);
        }

        setBookingForm({
          ...baseForm,
          guest_group_name: guestWithGroup.group_name || ''
        });
      } else if (response.status === 404) {
        // Guest has no group - this is normal
        console.log('ℹ️ Guest has no group');
        setBookingForm(baseForm);
        setIndividualGuestGroup(null);
        setIndividualGroupMembers([]);
      } else {
        console.error('❌ Failed to fetch guest group info:', response.status);
        setBookingForm(baseForm);
        setIndividualGuestGroup(null);
        setIndividualGroupMembers([]);
      }
    } catch (error) {
      console.error('❌ Error fetching guest group information:', error);
      // Still set the guest even if group fetch fails
      setBookingForm(baseForm);
      setIndividualGuestGroup(null);
      setIndividualGroupMembers([]);
    }
  };

  // Fetch group members for individual guest selection
  const fetchIndividualGroupMembers = async (groupId: string) => {
    try {
      console.log('🔄 Fetching group members for individual selection:', groupId);
      const membersResponse = await safeFetch(`/api/groups/${groupId}/members`);
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setIndividualGroupMembers(membersData);
        console.log('✅ Individual group members loaded:', membersData.length);
      } else {
        console.error('❌ Failed to fetch individual group members:', membersResponse.status);
        setIndividualGroupMembers([]);
      }
    } catch (error) {
      console.error('❌ Error fetching individual group members:', error);
      setIndividualGroupMembers([]);
    }
  };

  // Fetch group members when a group is selected
  const handleGroupSelection = async (groupId: string) => {
    try {
      console.log('🔄 Fetching group data for ID:', groupId);

      const response = await safeFetch(`/api/groups/${groupId}`);
      if (response.ok) {
        const groupData = await response.json();
        setSelectedGroup(groupData);
        console.log('✅ Group data loaded:', groupData.group_name);

        // Get group members
        try {
          const membersResponse = await safeFetch(`/api/groups/${groupId}/members`);
          if (membersResponse.ok) {
            const membersData = await membersResponse.json();
            setGroupMembers(membersData);
            console.log('✅ Group members loaded:', membersData.length);
          } else {
            console.error('❌ Failed to fetch group members:', membersResponse.status);
            setGroupMembers([]);
          }
        } catch (memberError) {
          console.error('❌ Error fetching group members:', memberError);
          setGroupMembers([]);
        }
      } else {
        console.error('❌ Failed to fetch group data:', response.status);
        setSelectedGroup(null);
        setGroupMembers([]);
      }
    } catch (error) {
      console.error('❌ Error fetching group data:', error);
      setSelectedGroup(null);
      setGroupMembers([]);
    }
  };

  // Handle creating multiple bookings for group arrangements
  const handleCreateGroupBookings = async () => {
    if (bookingArrangements.length === 0) {
      console.error('No booking arrangements created');
      return;
    }

    try {
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < bookingArrangements.length; i++) {
        const arrangement = bookingArrangements[i];
        console.log(`🏨 Creating booking ${i + 1}/${bookingArrangements.length} for:`, arrangement.guest_names);

        const bookingData = {
          guest_name: arrangement.guest_names,
          guest_id: arrangement.member_ids && arrangement.member_ids.length > 0 ? arrangement.member_ids[0] : null,
          group_name: selectedGroup?.group_name || null,
          hotel_id: parseInt(arrangement.hotel_id),
          room_number: arrangement.room_number,
          room_type: arrangement.room_type,
          check_in_date: arrangement.check_in_date,
          check_out_date: arrangement.check_out_date,
          guests_count: arrangement.guests_count,
          rate_per_night: arrangement.rate_per_night,
          total_amount: arrangement.rate_per_night * arrangement.guests_count * calculateNights(arrangement.check_in_date, arrangement.check_out_date),
          special_requests: arrangement.special_requests,
          booking_reference: `HB-${Date.now()}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`
        };

        console.log(`📋 Booking data for ${arrangement.guest_names}:`, bookingData);

        try {
          const response = await safeFetch('/api/hotel-bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`✅ Booking created successfully for ${arrangement.guest_names}:`, result);
            successCount++;
          } else {
            const errorText = await response.text();
            console.error(`❌ Failed to create booking for ${arrangement.guest_names}. Status: ${response.status}, Error:`, errorText);
            failureCount++;
          }
        } catch (bookingError) {
          console.error(`❌ Error creating booking for ${arrangement.guest_names}:`, bookingError);
          failureCount++;
        }
      }

      console.log(`📊 Group booking summary: ${successCount} successful, ${failureCount} failed`);

      // Show user feedback
      if (successCount > 0 && failureCount === 0) {
        console.log('🎉 All bookings created successfully!');
      } else if (successCount > 0 && failureCount > 0) {
        console.warn(`⚠️ Partial success: ${successCount} bookings created, ${failureCount} failed`);
      } else {
        console.error('❌ All bookings failed to create');
      }

      // Refresh data and close dialog only if at least one booking was successful
      if (successCount > 0) {
        fetchData();
        setIsCreateBookingOpen(false);
        resetBookingForm();
      }
    } catch (error) {
      console.error('❌ Error in group booking process:', error);
    }
  };

  // Calculate number of nights
  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Add a booking arrangement for group bookings
  const addBookingArrangement = () => {
    const selectedMemberNames = bookingForm.selected_members
      .map(memberId => {
        const member = groupMembers.find(m => m.id === memberId);
        return member ? `${member.first_name} ${member.last_name}` : '';
      })
      .filter(name => name)
      .join(', ');

    const newArrangement = {
      id: Date.now(),
      guest_names: selectedMemberNames,
      member_ids: [...bookingForm.selected_members],
      hotel_id: bookingForm.hotel_id,
      room_number: bookingForm.room_number,
      room_type: bookingForm.room_type,
      check_in_date: bookingForm.check_in_date,
      check_out_date: bookingForm.check_out_date,
      guests_count: bookingForm.selected_members.length,
      rate_per_night: bookingForm.rate_per_night,
      special_requests: bookingForm.special_requests
    };

    setBookingArrangements([...bookingArrangements, newArrangement]);

    // Reset form for next arrangement but keep group selection
    setBookingForm({
      ...bookingForm,
      selected_members: [],
      room_number: '',
      special_requests: ''
    });
  };

  // Remove a booking arrangement
  const removeBookingArrangement = (arrangementId: number) => {
    setBookingArrangements(bookingArrangements.filter(arr => arr.id !== arrangementId));
  };

  // Handle detail views
  const handleViewBookingDetail = (booking: HotelBooking) => {
    setSelectedBooking(booking);
    setIsBookingDetailOpen(true);
  };

  const handleViewHotelDetail = (hotel: HotelData) => {
    setSelectedHotel(hotel);
    setIsHotelDetailOpen(true);
  };

  const closeDetailViews = () => {
    setSelectedBooking(null);
    setSelectedHotel(null);
    setIsBookingDetailOpen(false);
    setIsHotelDetailOpen(false);
  };

  // Handle guest count changes for individual bookings
  const handleGuestCountChange = (newCount: number) => {
    setBookingForm({
      ...bookingForm,
      guests_count: newCount,
      individual_selected_guests: newCount === 1 && bookingForm.selected_guest_id
        ? [parseInt(bookingForm.selected_guest_id)]
        : newCount > 1 ? [] : []
    });
  };

  // Handle individual guest multi-selection
  const handleIndividualGuestToggle = (guestId: number) => {
    const currentlySelected = bookingForm.individual_selected_guests;
    const isSelected = currentlySelected.includes(guestId);

    if (isSelected) {
      // Remove guest
      const newSelection = currentlySelected.filter(id => id !== guestId);
      setBookingForm({
        ...bookingForm,
        individual_selected_guests: newSelection
      });
    } else {
      // Add guest if under limit
      if (currentlySelected.length < bookingForm.guests_count) {
        const newSelection = [...currentlySelected, guestId];
        setBookingForm({
          ...bookingForm,
          individual_selected_guests: newSelection
        });
      }
    }
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'checked_in': return 'secondary';
      case 'checked_out': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return CheckCircle;
      case 'checked_in': return Clock;
      case 'checked_out': return CheckCircle;
      case 'cancelled': return XCircle;
      default: return AlertTriangle;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  // Filtering
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = (
      booking.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.booking_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.group_name ? booking.group_name.toLowerCase().includes(searchTerm.toLowerCase()) : false)
    );

    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

    const matchesGroupId = (() => {
      if (!groupIdQuery) return true;
      const gid = parseInt(groupIdQuery, 10);
      if (!gid) return false;
      const grp = groups.find((g:any) => g.id === gid);
      if (!grp) return false;
      const gname = (grp.group_name || '').toLowerCase();
      return (booking.group_name || '').toLowerCase() === gname;
    })();

    const matchesDate = (() => {
      if (!selectedDate) return true;
      const toYMD = (str: string) => {
        try {
          const d = new Date(str);
          const y = d.getFullYear();
          const m = String(d.getMonth()+1).padStart(2,'0');
          const da = String(d.getDate()).padStart(2,'0');
          if (!y || isNaN(y)) return '';
          return `${y}-${m}-${da}`;
        } catch { return ''; }
      };
      const sel = selectedDate;
      const inY = toYMD(booking.check_in_date);
      const outY = toYMD(booking.check_out_date);
      if (!inY || !outY) return false;
      return sel >= inY && sel <= outY;
    })();

    return matchesSearch && matchesStatus && matchesGroupId && matchesDate;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading hotels...</p>
          </div>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-red-500">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Connection Error</h3>
            <p className="text-muted-foreground mb-4">{connectionError}</p>
            <Button onClick={() => {
              setConnectionError(null);
              fetchData();
            }}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 py-8 space-y-8 ${!isInitialized ? 'min-h-[600px]' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hotel Management</h1>
          <p className="text-muted-foreground">
            Manage hotels and room bookings
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setIsCreateBookingOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
          <Button onClick={() => setIsCreateHotelOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Hotel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Hotel className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{hotels.length}</p>
                <p className="text-sm text-muted-foreground">Hotels</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bed className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{hotels.reduce((sum, h) => sum + h.total_rooms, 0)}</p>
                <p className="text-sm text-muted-foreground">Total Rooms</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.checked_in_bookings}</p>
                <p className="text-sm text-muted-foreground">Checked In</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.confirmed_bookings}</p>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">${stats.total_revenue?.toFixed(0) || 0}</p>
                <p className="text-sm text-muted-foreground">Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bookings">Hotel Bookings</TabsTrigger>
          <TabsTrigger value="hotels">Hotel Directory</TabsTrigger>
        </TabsList>

        {/* Hotel Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search bookings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
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
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="checked_in">Checked In</SelectItem>
                      <SelectItem value="checked_out">Checked Out</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hotel Bookings List */}
          <div className="grid gap-4">
            {filteredBookings.map((booking) => {
              const StatusIcon = getStatusIcon(booking.status);
              const hotel = hotels.find(h => h.id === booking.hotel_id);
              
              return (
                <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                          <StatusIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold text-foreground">{booking.guest_name}</h3>
                            <Badge variant="outline">{booking.booking_reference}</Badge>
                            <Badge variant={getStatusColor(booking.status)}>{booking.status}</Badge>
                            {booking.group_name && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                {booking.group_name}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{hotel?.name || 'Unknown Hotel'}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Bed className="mr-1 h-4 w-4" />
                              Room {booking.room_number} ({booking.room_type})
                            </div>
                            <div className="flex items-center">
                              <Users className="mr-1 h-4 w-4" />
                              {booking.guests_count} guest{booking.guests_count > 1 ? 's' : ''}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="mr-1 h-4 w-4" />
                              {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                            </div>
                            <div className="text-lg font-semibold text-foreground">
                              ${booking.total_amount}
                            </div>
                          </div>
                          {booking.special_requests && (
                            <p className="text-sm text-muted-foreground mt-2 italic">
                              Request: {booking.special_requests}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewBookingDetail(booking)}
                          >
                            <Edit3 className="mr-1 h-4 w-4" />
                            View Details
                          </Button>
                          {booking.status === 'confirmed' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateBookingStatus(booking.id, 'checked_in')}
                            >
                              Check In
                            </Button>
                          )}
                          {booking.status === 'checked_in' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateBookingStatus(booking.id, 'checked_out')}
                            >
                              Check Out
                            </Button>
                          )}
                          <Select
                            value={booking.status}
                            onValueChange={(status) => handleUpdateBookingStatus(booking.id, status)}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="checked_in">Checked In</SelectItem>
                              <SelectItem value="checked_out">Checked Out</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <DeleteHotelBookingDialog
                            bookingId={booking.id}
                            onDelete={fetchData}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredBookings.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Hotel className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No bookings found</h3>
                <p className="text-muted-foreground">Create your first hotel booking to get started</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Hotels Directory Tab */}
        <TabsContent value="hotels" className="space-y-4">
          <div className="grid gap-4">
            {hotels.map((hotel) => (
              <Card key={hotel.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                        <Hotel className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-foreground">{hotel.name}</h3>
                          <div className="flex">{renderStars(hotel.star_rating)}</div>
                          {hotel.is_partner && (
                            <Badge variant="default">Partner</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <MapPin className="mr-1 h-4 w-4" />
                            {hotel.address}
                          </div>
                          <div className="flex items-center">
                            <Bed className="mr-1 h-4 w-4" />
                            {hotel.total_rooms} rooms
                          </div>
                          {hotel.phone && (
                            <div className="flex items-center">
                              <Phone className="mr-1 h-4 w-4" />
                              {hotel.phone}
                            </div>
                          )}
                          {hotel.email && (
                            <div className="flex items-center">
                              <Mail className="mr-1 h-4 w-4" />
                              {hotel.email}
                            </div>
                          )}
                          <div className="flex items-center">
                            <Clock className="mr-1 h-4 w-4" />
                            Check-in: {hotel.check_in_time}
                          </div>
                          {hotel.special_rates && (
                            <div>
                              Special rate: ${hotel.special_rates}/night
                            </div>
                          )}
                        </div>
                        {hotel.contact_person && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Contact: {hotel.contact_person}
                          </p>
                        )}
                        {hotel.amenities && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Amenities: {hotel.amenities}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewHotelDetail(hotel)}
                        >
                          <Edit3 className="mr-1 h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {hotels.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Hotel className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No hotels registered</h3>
                <p className="text-muted-foreground">Add your first hotel to get started</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Hotel Dialog */}
      <Dialog open={isCreateHotelOpen} onOpenChange={setIsCreateHotelOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Hotel</DialogTitle>
            <DialogDescription>
              Register a new hotel partner
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Hotel Name</Label>
                <Input
                  id="name"
                  value={hotelForm.name}
                  onChange={(e) => setHotelForm({...hotelForm, name: e.target.value})}
                  placeholder="Hotel Reykjavik Grand"
                />
              </div>
              <div>
                <Label htmlFor="star_rating">Star Rating</Label>
                <Select 
                  value={hotelForm.star_rating.toString()} 
                  onValueChange={(value) => setHotelForm({...hotelForm, star_rating: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Star</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={hotelForm.address}
                onChange={(e) => setHotelForm({...hotelForm, address: e.target.value})}
                placeholder="Sigtun 38, 105 Reykjavik"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={hotelForm.phone}
                  onChange={(e) => setHotelForm({...hotelForm, phone: e.target.value})}
                  placeholder="+354-514-8000"
                />
              </div>
              <div>
                <Label htmlFor="total_rooms">Total Rooms</Label>
                <Input
                  id="total_rooms"
                  type="number"
                  value={hotelForm.total_rooms}
                  onChange={(e) => setHotelForm({...hotelForm, total_rooms: parseInt(e.target.value) || 0})}
                  placeholder="100"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_partner"
                checked={hotelForm.is_partner}
                onChange={(e) => setHotelForm({...hotelForm, is_partner: e.target.checked})}
              />
              <Label htmlFor="is_partner">Partner Hotel</Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsCreateHotelOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateHotel}>
              Create Hotel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Booking Dialog */}
      <Dialog open={isCreateBookingOpen} onOpenChange={setIsCreateBookingOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Hotel Booking</DialogTitle>
            <DialogDescription>
              Create hotel room bookings for individuals or groups
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Booking Type Selection */}
            <div>
              <Label>Booking Type</Label>
              <Select
                value={bookingForm.booking_type}
                onValueChange={(value) => {
                  resetBookingForm();
                  setBookingForm(prev => ({...prev, booking_type: value}));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual Guest</SelectItem>
                  <SelectItem value="group">Group Booking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Individual Guest Section */}
            {bookingForm.booking_type === 'individual' && (
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guest_selection">Select Guest</Label>
                    <Select
                      value={bookingForm.selected_guest_id}
                      onValueChange={(value) => {
                        handleIndividualGuestSelection(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select existing guest or enter new name" />
                      </SelectTrigger>
                      <SelectContent>
                        {guests.map((guest) => (
                          <SelectItem key={guest.id} value={guest.id.toString()}>
                            {guest.first_name} {guest.last_name} ({guest.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="guest_name">Or Enter Guest Name{bookingForm.guests_count > 1 ? 's' : ''}</Label>
                    <Input
                      id="guest_name"
                      value={bookingForm.guest_name}
                      onChange={(e) => setBookingForm({
                        ...bookingForm,
                        guest_name: e.target.value,
                        selected_guest_id: '',
                        guest_group_name: '',
                        individual_selected_guests: []
                      })}
                      placeholder={bookingForm.guests_count > 1 ? "John Smith, Jane Smith, ..." : "John Smith"}
                    />
                    {bookingForm.guests_count > 1 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Enter names separated by commas for {bookingForm.guests_count} guests
                      </p>
                    )}
                  </div>
                </div>

                {/* Show group name if guest is part of a group */}
                {bookingForm.guest_group_name && (
                  <div>
                    <Label htmlFor="guest_group_name">Group Name</Label>
                    <Input
                      id="guest_group_name"
                      value={bookingForm.guest_group_name}
                      onChange={(e) => setBookingForm({...bookingForm, guest_group_name: e.target.value})}
                      placeholder="Group name"
                      className="bg-blue-50 border-blue-200"
                    />
                    <p className="text-sm text-blue-600 mt-1">
                      This guest is part of the "{bookingForm.guest_group_name}" group
                    </p>
                  </div>
                )}

                {/* Multi-guest selection for individual bookings */}
                {bookingForm.booking_type === 'individual' &&
                 bookingForm.guests_count > 1 &&
                 individualGroupMembers.length > 0 && (
                  <div>
                    <Label>Select {bookingForm.guests_count} Guests from {bookingForm.guest_group_name}</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Select exactly {bookingForm.guests_count} guest{bookingForm.guests_count > 1 ? 's' : ''} from the same group for this room
                    </p>
                    <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                      <div className="grid gap-2">
                        {individualGroupMembers.map((member) => (
                          <div key={member.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`individual-guest-${member.id}`}
                              checked={bookingForm.individual_selected_guests.includes(member.id)}
                              onChange={() => handleIndividualGuestToggle(member.id)}
                              disabled={
                                !bookingForm.individual_selected_guests.includes(member.id) &&
                                bookingForm.individual_selected_guests.length >= bookingForm.guests_count
                              }
                            />
                            <Label htmlFor={`individual-guest-${member.id}`} className="cursor-pointer">
                              {member.first_name} {member.last_name}
                              {member.is_leader && <Badge variant="outline" className="ml-2">Leader</Badge>}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Selected: {bookingForm.individual_selected_guests.length} / {bookingForm.guests_count}
                      </p>
                      {bookingForm.individual_selected_guests.length !== bookingForm.guests_count && (
                        <p className="text-sm text-amber-600">
                          ⚠️ Please select exactly {bookingForm.guests_count} guest{bookingForm.guests_count > 1 ? 's' : ''}
                        </p>
                      )}
                      {bookingForm.individual_selected_guests.length === bookingForm.guests_count && (
                        <p className="text-sm text-green-600">
                          ✅ All guests selected
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Group Selection Section */}
            {bookingForm.booking_type === 'group' && (
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="group_selection">Select Group</Label>
                  <Select
                    value={bookingForm.selected_group_id}
                    onValueChange={(value) => {
                      setBookingForm({...bookingForm, selected_group_id: value});
                      handleGroupSelection(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tour group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.filter(group => group.status === 'active').map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.group_name} ({group.total_members} members)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Group Members Selection */}
                {selectedGroup && groupMembers.length > 0 && (
                  <div>
                    <Label>Select Group Members for This Room</Label>
                    <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                      <div className="grid gap-2">
                        {groupMembers.map((member) => (
                          <div key={member.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`member-${member.id}`}
                              checked={bookingForm.selected_members.includes(member.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setBookingForm({
                                    ...bookingForm,
                                    selected_members: [...bookingForm.selected_members, member.id],
                                    guests_count: bookingForm.selected_members.length + 1
                                  });
                                } else {
                                  setBookingForm({
                                    ...bookingForm,
                                    selected_members: bookingForm.selected_members.filter(id => id !== member.id),
                                    guests_count: Math.max(1, bookingForm.selected_members.length - 1)
                                  });
                                }
                              }}
                            />
                            <Label htmlFor={`member-${member.id}`} className="cursor-pointer">
                              {member.first_name} {member.last_name}
                              {member.is_leader && <Badge variant="outline" className="ml-2">Leader</Badge>}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {bookingForm.selected_members.length} member(s)
                    </p>
                  </div>
                )}

                {/* Current Booking Arrangements */}
                {bookingArrangements.length > 0 && (
                  <div>
                    <Label>Booking Arrangements</Label>
                    <div className="border rounded-lg p-4 space-y-2">
                      {bookingArrangements.map((arrangement) => (
                        <div key={arrangement.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="text-sm">
                            <strong>{arrangement.guest_names}</strong> - {arrangement.room_type} Room {arrangement.room_number}
                            <br />
                            <span className="text-muted-foreground">
                              {hotels.find(h => h.id.toString() === arrangement.hotel_id)?.name}
                              ({arrangement.guests_count} guests)
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeBookingArrangement(arrangement.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Common Booking Details */}
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hotel_id">Hotel</Label>
                  <Select
                    value={bookingForm.hotel_id}
                    onValueChange={(value) => setBookingForm({...bookingForm, hotel_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hotel" />
                    </SelectTrigger>
                    <SelectContent>
                      {hotels.map((hotel) => (
                        <SelectItem key={hotel.id} value={hotel.id.toString()}>
                          {hotel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="room_type">Room Type</Label>
                  <Select
                    value={bookingForm.room_type}
                    onValueChange={(value) => setBookingForm({...bookingForm, room_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="Superior">Superior</SelectItem>
                      <SelectItem value="Deluxe">Deluxe</SelectItem>
                      <SelectItem value="Suite">Suite</SelectItem>
                      <SelectItem value="Family Room">Family Room</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="room_number">Room Number</Label>
                  <Input
                    id="room_number"
                    value={bookingForm.room_number}
                    onChange={(e) => setBookingForm({...bookingForm, room_number: e.target.value})}
                    placeholder="201"
                  />
                </div>
                <div>
                  <Label htmlFor="guests_count">Guests Count</Label>
                  <Input
                    id="guests_count"
                    type="number"
                    value={bookingForm.guests_count}
                    onChange={(e) => handleGuestCountChange(parseInt(e.target.value) || 1)}
                    min="1"
                    disabled={bookingForm.booking_type === 'group'}
                  />
                </div>
                <div>
                  <Label htmlFor="rate_per_night">Rate per Night</Label>
                  <Input
                    id="rate_per_night"
                    type="number"
                    value={bookingForm.rate_per_night}
                    onChange={(e) => setBookingForm({...bookingForm, rate_per_night: parseFloat(e.target.value) || 0})}
                    placeholder="150"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="check_in_date">Check-in Date</Label>
                  <Input
                    id="check_in_date"
                    type="date"
                    value={bookingForm.check_in_date}
                    onChange={(e) => setBookingForm({...bookingForm, check_in_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="check_out_date">Check-out Date</Label>
                  <Input
                    id="check_out_date"
                    type="date"
                    value={bookingForm.check_out_date}
                    onChange={(e) => setBookingForm({...bookingForm, check_out_date: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="special_requests">Special Requests</Label>
                <Textarea
                  id="special_requests"
                  value={bookingForm.special_requests}
                  onChange={(e) => setBookingForm({...bookingForm, special_requests: e.target.value})}
                  placeholder="Late check-in, extra towels, connecting rooms, etc."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <div>
              {bookingForm.booking_type === 'group' && bookingForm.selected_members.length > 0 && (
                <Button
                  variant="outline"
                  onClick={addBookingArrangement}
                  disabled={!bookingForm.hotel_id || !bookingForm.room_number || !bookingForm.check_in_date || !bookingForm.check_out_date}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add This Room Arrangement
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => {setIsCreateBookingOpen(false); resetBookingForm();}}>
                Cancel
              </Button>
              {bookingForm.booking_type === 'individual' ? (
                <Button
                  onClick={handleCreateBooking}
                  disabled={
                    (!bookingForm.guest_name && !bookingForm.selected_guest_id) ||
                    !bookingForm.hotel_id ||
                    !bookingForm.check_in_date ||
                    !bookingForm.check_out_date ||
                    (bookingForm.guests_count > 1 &&
                     individualGroupMembers.length > 0 &&
                     bookingForm.individual_selected_guests.length !== bookingForm.guests_count)
                  }
                >
                  Create Booking
                  {bookingForm.guests_count > 1 && individualGroupMembers.length > 0 &&
                   bookingForm.individual_selected_guests.length !== bookingForm.guests_count &&
                   ` (${bookingForm.individual_selected_guests.length}/${bookingForm.guests_count})`}
                </Button>
              ) : (
                <Button
                  onClick={handleCreateGroupBookings}
                  disabled={bookingArrangements.length === 0}
                >
                  Create All Bookings ({bookingArrangements.length})
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Detail Dialog */}
      <Dialog open={isBookingDetailOpen} onOpenChange={setIsBookingDetailOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Complete information for booking {selectedBooking?.booking_reference}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="grid gap-6 py-4">
              {/* Booking Status Header */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <h3 className="text-lg font-semibold">{selectedBooking.guest_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Booking Reference: {selectedBooking.booking_reference}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusColor(selectedBooking.status)} className="text-sm">
                    {selectedBooking.status}
                  </Badge>
                  {selectedBooking.group_name && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {selectedBooking.group_name}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Guest Information */}
              <div className="grid gap-4">
                <h4 className="text-md font-semibold">Guest Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Guest Name</Label>
                    <p className="text-sm">{selectedBooking.guest_name}</p>
                  </div>
                  {selectedBooking.group_name && (
                    <div>
                      <Label className="text-sm font-medium">Group</Label>
                      <p className="text-sm">{selectedBooking.group_name}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium">Number of Guests</Label>
                    <p className="text-sm">{selectedBooking.guests_count}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <p className="text-sm capitalize">{selectedBooking.status}</p>
                  </div>
                </div>
              </div>

              {/* Hotel & Room Information */}
              <div className="grid gap-4">
                <h4 className="text-md font-semibold">Hotel & Room Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Hotel</Label>
                    <p className="text-sm">
                      {hotels.find(h => h.id === selectedBooking.hotel_id)?.name || 'Unknown Hotel'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Room Number</Label>
                    <p className="text-sm">{selectedBooking.room_number}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Room Type</Label>
                    <p className="text-sm">{selectedBooking.room_type}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Rate per Night</Label>
                    <p className="text-sm">${selectedBooking.rate_per_night}</p>
                  </div>
                </div>
              </div>

              {/* Check-in/Check-out Information */}
              <div className="grid gap-4">
                <h4 className="text-md font-semibold">Stay Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Check-in Date</Label>
                    <p className="text-sm">{formatDate(selectedBooking.check_in_date)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Check-out Date</Label>
                    <p className="text-sm">{formatDate(selectedBooking.check_out_date)}</p>
                  </div>
                  {selectedBooking.actual_check_in && (
                    <div>
                      <Label className="text-sm font-medium">Actual Check-in</Label>
                      <p className="text-sm">{formatDateTime(selectedBooking.actual_check_in)}</p>
                    </div>
                  )}
                  {selectedBooking.actual_check_out && (
                    <div>
                      <Label className="text-sm font-medium">Actual Check-out</Label>
                      <p className="text-sm">{formatDateTime(selectedBooking.actual_check_out)}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium">Total Nights</Label>
                    <p className="text-sm">
                      {calculateNights(selectedBooking.check_in_date, selectedBooking.check_out_date)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Amount</Label>
                    <p className="text-lg font-semibold text-green-600">${selectedBooking.total_amount}</p>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.special_requests && (
                <div className="grid gap-4">
                  <h4 className="text-md font-semibold">Special Requests</h4>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{selectedBooking.special_requests}</p>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid gap-4">
                <h4 className="text-md font-semibold">Quick Actions</h4>
                <div className="flex items-center space-x-2">
                  {selectedBooking.status === 'confirmed' && (
                    <Button
                      onClick={() => {
                        handleUpdateBookingStatus(selectedBooking.id, 'checked_in');
                        closeDetailViews();
                      }}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Check In
                    </Button>
                  )}
                  {selectedBooking.status === 'checked_in' && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleUpdateBookingStatus(selectedBooking.id, 'checked_out');
                        closeDetailViews();
                      }}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Check Out
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleUpdateBookingStatus(selectedBooking.id, 'cancelled');
                      closeDetailViews();
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Booking
                  </Button>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={closeDetailViews}>
              Close
            </Button>
            <Button onClick={() => window.print()}>
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hotel Detail Dialog */}
      <Dialog open={isHotelDetailOpen} onOpenChange={setIsHotelDetailOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hotel Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedHotel?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedHotel && (
            <div className="grid gap-6 py-4">
              {/* Hotel Header */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <span>{selectedHotel.name}</span>
                    <div className="flex">{renderStars(selectedHotel.star_rating)}</div>
                  </h3>
                  <p className="text-sm text-muted-foreground">{selectedHotel.address}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedHotel.is_partner && (
                    <Badge variant="default">Partner Hotel</Badge>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid gap-4">
                <h4 className="text-md font-semibold">Contact Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Address</Label>
                    <p className="text-sm">{selectedHotel.address}</p>
                  </div>
                  {selectedHotel.phone && (
                    <div>
                      <Label className="text-sm font-medium">Phone</Label>
                      <p className="text-sm">{selectedHotel.phone}</p>
                    </div>
                  )}
                  {selectedHotel.email && (
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm">{selectedHotel.email}</p>
                    </div>
                  )}
                  {selectedHotel.contact_person && (
                    <div>
                      <Label className="text-sm font-medium">Contact Person</Label>
                      <p className="text-sm">{selectedHotel.contact_person}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Hotel Information */}
              <div className="grid gap-4">
                <h4 className="text-md font-semibold">Hotel Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Star Rating</Label>
                    <div className="flex items-center space-x-1">
                      {renderStars(selectedHotel.star_rating)}
                      <span className="text-sm ml-2">({selectedHotel.star_rating} stars)</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Rooms</Label>
                    <p className="text-sm">{selectedHotel.total_rooms} rooms</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Check-in Time</Label>
                    <p className="text-sm">{selectedHotel.check_in_time}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Check-out Time</Label>
                    <p className="text-sm">{selectedHotel.check_out_time}</p>
                  </div>
                  {selectedHotel.special_rates && (
                    <div>
                      <Label className="text-sm font-medium">Special Rate</Label>
                      <p className="text-sm text-green-600 font-semibold">
                        ${selectedHotel.special_rates}/night
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium">Partnership Status</Label>
                    <p className="text-sm">
                      {selectedHotel.is_partner ? 'Partner Hotel' : 'Standard Hotel'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              {selectedHotel.amenities && (
                <div className="grid gap-4">
                  <h4 className="text-md font-semibold">Amenities</h4>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{selectedHotel.amenities}</p>
                  </div>
                </div>
              )}

              {/* Hotel Statistics */}
              <div className="grid gap-4">
                <h4 className="text-md font-semibold">Booking Statistics</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {bookings.filter(b => b.hotel_id === selectedHotel.id).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Bookings</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {bookings.filter(b => b.hotel_id === selectedHotel.id && b.status === 'checked_in').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Currently Checked In</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">
                      {bookings.filter(b => b.hotel_id === selectedHotel.id && b.status === 'confirmed').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Upcoming Bookings</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={closeDetailViews}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
