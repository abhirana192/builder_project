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
  DollarSign,
  TrendingUp
} from "lucide-react";

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
  hotel_name: string;
  room_number: string;
  room_type: string;
  guest_name: string;
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

interface HotelRoom {
  id: number;
  hotel_id: number;
  room_number: string;
  room_type: string;
  capacity: number;
  rate_per_night: number;
  amenities?: string;
  status: string;
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
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [stats, setStats] = useState<HotelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("bookings");
  const [selectedHotel, setSelectedHotel] = useState<HotelData | null>(null);
  
  // Dialog states
  const [isHotelDialogOpen, setIsHotelDialogOpen] = useState(false);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<HotelData | null>(null);
  
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hotelsRes, bookingsRes, statsRes] = await Promise.all([
        fetch('/api/hotels'),
        fetch('/api/hotel-bookings'),
        fetch('/api/hotel-stats')
      ]);
      
      const hotelsData = await hotelsRes.json();
      const bookingsData = await bookingsRes.json();
      const statsData = await statsRes.json();
      
      setHotels(hotelsData);
      setBookings(bookingsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching hotels data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHotelRooms = async (hotelId: number) => {
    try {
      const response = await fetch(`/api/hotels/${hotelId}/rooms`);
      const roomsData = await response.json();
      setRooms(roomsData);
    } catch (error) {
      console.error('Error fetching hotel rooms:', error);
    }
  };

  const handleCreateHotel = async () => {
    try {
      const response = await fetch('/api/hotels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hotelForm),
      });

      if (response.ok) {
        setIsHotelDialogOpen(false);
        resetHotelForm();
        fetchData();
      }
    } catch (error) {
      console.error('Error creating hotel:', error);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: number, status: string) => {
    try {
      const response = await fetch(`/api/hotel-bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
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
    setEditingHotel(null);
  };

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

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.hotel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.booking_reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
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

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hotel Management</h1>
          <p className="text-muted-foreground">
            Manage accommodations, room assignments, and check-in/out processes
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setIsBookingDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
          <Button onClick={() => setIsHotelDialogOpen(true)}>
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
                <p className="text-sm text-muted-foreground">Partner Hotels</p>
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
                <p className="text-2xl font-bold">{stats?.checked_in_bookings || 0}</p>
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
                <p className="text-2xl font-bold">{stats?.confirmed_bookings || 0}</p>
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
                <p className="text-2xl font-bold">${stats?.total_revenue?.toFixed(0) || 0}</p>
                <p className="text-sm text-muted-foreground">Revenue (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bookings">Hotel Bookings</TabsTrigger>
          <TabsTrigger value="hotels">Hotel Directory</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search hotel bookings..."
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

          {/* Hotel Bookings */}
          <div className="grid gap-4">
            {filteredBookings.map((booking) => {
              const StatusIcon = getStatusIcon(booking.status);
              const nights = Math.ceil((new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / (1000 * 60 * 60 * 24));
              
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
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{booking.hotel_name}</p>
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
                              {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)} ({nights} night{nights > 1 ? 's' : ''})
                            </div>
                            <div className="text-lg font-semibold text-foreground">
                              ${booking.total_amount} total
                            </div>
                          </div>
                          {booking.actual_check_in && (
                            <p className="text-sm text-muted-foreground mt-2">
                              <Clock className="inline mr-1 h-4 w-4" />
                              Checked in: {formatDateTime(booking.actual_check_in)}
                            </p>
                          )}
                          {booking.special_requests && (
                            <p className="text-sm text-muted-foreground mt-2 italic">
                              Request: {booking.special_requests}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
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
                <h3 className="text-lg font-semibold text-foreground mb-2">No hotel bookings</h3>
                <p className="text-muted-foreground">No hotel bookings found matching your criteria</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="hotels" className="space-y-4">
          {/* Hotel Directory */}
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
                            Check-in: {hotel.check_in_time}, Check-out: {hotel.check_out_time}
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
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setSelectedHotel(hotel);
                                fetchHotelRooms(hotel.id);
                              }}
                            >
                              View Rooms
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle>{selectedHotel?.name} - Room Details</DialogTitle>
                              <DialogDescription>
                                Available rooms and their specifications
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <div className="grid gap-2">
                                {rooms.map((room) => (
                                  <div key={room.id} className="p-3 border rounded-lg">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <div className="font-medium">Room {room.room_number} - {room.room_type}</div>
                                        <div className="text-sm text-muted-foreground">
                                          {room.capacity} guests • ${room.rate_per_night}/night
                                        </div>
                                        {room.amenities && (
                                          <div className="text-xs text-muted-foreground mt-1">
                                            {room.amenities}
                                          </div>
                                        )}
                                      </div>
                                      <Badge variant={room.status === 'available' ? 'default' : 'secondary'}>
                                        {room.status}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button size="sm">
                          Book Room
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
                <p className="text-muted-foreground">Add partner hotels to get started</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Hotel Dialog */}
      <Dialog open={isHotelDialogOpen} onOpenChange={setIsHotelDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingHotel ? 'Edit Hotel' : 'Add New Hotel'}</DialogTitle>
            <DialogDescription>
              {editingHotel ? 'Update hotel information' : 'Enter the details for the new hotel'}
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={hotelForm.email}
                  onChange={(e) => setHotelForm({...hotelForm, email: e.target.value})}
                  placeholder="info@hotel.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
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
              <div>
                <Label htmlFor="check_in_time">Check-in Time</Label>
                <Input
                  id="check_in_time"
                  type="time"
                  value={hotelForm.check_in_time}
                  onChange={(e) => setHotelForm({...hotelForm, check_in_time: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="check_out_time">Check-out Time</Label>
                <Input
                  id="check_out_time"
                  type="time"
                  value={hotelForm.check_out_time}
                  onChange={(e) => setHotelForm({...hotelForm, check_out_time: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={hotelForm.contact_person}
                  onChange={(e) => setHotelForm({...hotelForm, contact_person: e.target.value})}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label htmlFor="special_rates">Special Rate (per night)</Label>
                <Input
                  id="special_rates"
                  type="number"
                  value={hotelForm.special_rates}
                  onChange={(e) => setHotelForm({...hotelForm, special_rates: e.target.value})}
                  placeholder="150"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="amenities">Amenities</Label>
              <Textarea
                id="amenities"
                value={hotelForm.amenities}
                onChange={(e) => setHotelForm({...hotelForm, amenities: e.target.value})}
                placeholder="WiFi, Breakfast, Parking, Gym, Spa..."
              />
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
            <Button variant="outline" onClick={() => setIsHotelDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateHotel}>
              {editingHotel ? 'Update Hotel' : 'Create Hotel'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
