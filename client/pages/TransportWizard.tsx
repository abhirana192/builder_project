import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plane,
  Search,
  ArrowRight,
  Clock,
  Car,
  User,
  Users,
  AlertTriangle,
  CheckCircle,
  Calendar
} from "lucide-react";

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

interface Vehicle {
  id: number;
  vehicle_number: string;
  vehicle_type: string;
  make: string;
  model: string;
  capacity: number;
  status: string;
}

interface Driver {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
}

interface TransportWizardProps {
  groups: Group[];
  vehicles: Vehicle[];
  drivers: Driver[];
  onSchedule: (data: any) => void;
  onClose: () => void;
  formatTimeAMPM: (time: string, date?: string) => string;
  calculateTransportTime: (flightTime: string, flightDate: string, transferType: 'pickup' | 'dropoff') => string;
}

export default function TransportWizard({ 
  groups, 
  vehicles, 
  drivers, 
  onSchedule, 
  onClose,
  formatTimeAMPM,
  calculateTransportTime
}: TransportWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<{id: number, type: 'group' | 'member', data: Group | GroupMember} | null>(null);
  const [selectedTransferType, setSelectedTransferType] = useState<'pickup' | 'dropoff'>('pickup');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [originalFlightTime, setOriginalFlightTime] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');

  const getAllCustomers = () => {
    const customers: Array<{id: number, type: 'group' | 'member', data: Group | GroupMember, displayName: string}> = [];
    
    groups.filter(g => g.status === 'active').forEach(group => {
      if (group.traveling_together) {
        customers.push({
          id: group.id,
          type: 'group',
          data: group,
          displayName: `${group.group_name} (${group.total_members} passengers)`
        });
      } else {
        group.members?.forEach(member => {
          customers.push({
            id: member.id,
            type: 'member',
            data: member,
            displayName: `${member.first_name} ${member.last_name}${member.is_leader ? ' (Leader)' : ''} - ${group.group_name}`
          });
        });
      }
    });
    
    return customers;
  };

  const handleCustomerSelection = (customer: {id: number, type: 'group' | 'member', data: Group | GroupMember}) => {
    setSelectedCustomer(customer);
    setCurrentStep(2);
  };

  const handleTransferTypeSelection = (transferType: 'pickup' | 'dropoff') => {
    setSelectedTransferType(transferType);
    
    if (selectedCustomer) {
      const customerData = selectedCustomer.data;
      let flightTime = '';
      let flightDate = '';
      let flightNum = '';
      
      if (selectedCustomer.type === 'group') {
        const group = customerData as Group;
        if (transferType === 'pickup') {
          flightTime = group.arrival_flight_time || '';
          flightDate = group.arrival_date || group.tour_start_date || '';
          flightNum = group.arrival_flight_number || '';
        } else {
          flightTime = group.departure_flight_time || '';
          flightDate = group.departure_date || group.tour_end_date || '';
          flightNum = group.departure_flight_number || '';
        }
      } else {
        const member = customerData as GroupMember;
        if (transferType === 'pickup') {
          flightTime = member.arrival_flight_time || '';
          flightNum = member.arrival_flight_number || '';
          const memberGroup = groups.find(g => g.members?.some(m => m.id === member.id));
          flightDate = memberGroup?.arrival_date || memberGroup?.tour_start_date || '';
        } else {
          flightTime = member.departure_flight_time || '';
          flightNum = member.departure_flight_number || '';
          const memberGroup = groups.find(g => g.members?.some(m => m.id === member.id));
          flightDate = memberGroup?.departure_date || memberGroup?.tour_end_date || '';
        }
      }
      
      if (flightTime && flightDate) {
        const fullFlightDateTime = `${flightDate.split('T')[0]}T${flightTime}`;
        setOriginalFlightTime(fullFlightDateTime);
        setFlightNumber(flightNum);
        setScheduledDateTime(calculateTransportTime(flightTime, flightDate, transferType));
      }
      setCurrentStep(3);
    }
  };

  const handleSchedule = () => {
    if (!selectedCustomer || !selectedVehicle || !selectedDriver) return;

    const passengerCount = selectedCustomer.type === 'group' 
      ? (selectedCustomer.data as Group).total_members 
      : 1;

    const customerData = {
      type: selectedCustomer.type,
      id: selectedCustomer.id,
      name: selectedCustomer.type === 'group' 
        ? (selectedCustomer.data as Group).group_name
        : `${(selectedCustomer.data as GroupMember).first_name} ${(selectedCustomer.data as GroupMember).last_name}`,
      memberCount: passengerCount
    };

    const scheduleData = {
      transport_type: `airport_${selectedTransferType}`,
      vehicle_id: parseInt(selectedVehicle),
      driver_id: parseInt(selectedDriver),
      pickup_location: selectedTransferType === 'pickup' ? 'Keflavik Airport (KEF)' : 'Hotel/Accommodation',
      pickup_time: scheduledDateTime,
      dropoff_location: selectedTransferType === 'pickup' ? 'Hotel/Accommodation' : 'Keflavik Airport (KEF)',
      passenger_count: passengerCount,
      groups_data: [customerData],
      notes: `${selectedTransferType === 'pickup' ? 'Airport pickup' : 'Airport dropoff'} for ${customerData.name}`
    };

    onSchedule(scheduleData);
  };

  return (
    <>
      {/* Step Progress Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>1</div>
          <span className="text-sm font-medium">Customer</span>
        </div>
        <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>2</div>
          <span className="text-sm font-medium">Transfer</span>
        </div>
        <div className={`w-8 h-0.5 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>3</div>
          <span className="text-sm font-medium">Details</span>
        </div>
      </div>

      {/* Step 1: Customer Selection */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Step 1: Select Customer</Label>
            <p className="text-sm text-gray-600 mt-1">Choose the person or group needing transport</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or group..."
              value={customerSearchTerm}
              onChange={(e) => setCustomerSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-60 overflow-y-auto border rounded-lg">
            {getAllCustomers()
              .filter(customer => {
                if (!customerSearchTerm) return true;
                return customer.displayName.toLowerCase().includes(customerSearchTerm.toLowerCase());
              })
              .map(customer => (
                <div 
                  key={`${customer.type}-${customer.id}`}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                  onClick={() => handleCustomerSelection(customer)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{customer.displayName}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {customer.type === 'group' ? 'Group Booking' : 'Individual Passenger'}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Step 2: Transfer Type Selection */}
      {currentStep === 2 && selectedCustomer && (
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Step 2: Transfer Type</Label>
            <p className="text-sm text-gray-600 mt-1">
              Selected: <span className="font-medium">{
                selectedCustomer.type === 'group' 
                  ? (selectedCustomer.data as Group).group_name
                  : `${(selectedCustomer.data as GroupMember).first_name} ${(selectedCustomer.data as GroupMember).last_name}`
              }</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleTransferTypeSelection('pickup')}
              className="p-4 border-2 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Plane className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Airport Pickup</div>
                  <div className="text-sm text-gray-600">From airport to accommodation</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleTransferTypeSelection('dropoff')}
              className="p-4 border-2 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Plane className="h-5 w-5 text-orange-600 rotate-45" />
                </div>
                <div>
                  <div className="font-medium">Airport Dropoff</div>
                  <div className="text-sm text-gray-600">From accommodation to airport</div>
                </div>
              </div>
            </button>
          </div>

          <div className="flex justify-start">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              Back to Customer
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Flight Details & Vehicle Selection */}
      {currentStep === 3 && selectedCustomer && (
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Step 3: Transport Details</Label>
            <p className="text-sm text-gray-600 mt-1">
              {selectedTransferType === 'pickup' ? 'Airport Pickup' : 'Airport Dropoff'} for{' '}
              <span className="font-medium">
                {selectedCustomer.type === 'group' 
                  ? (selectedCustomer.data as Group).group_name
                  : `${(selectedCustomer.data as GroupMember).first_name} ${(selectedCustomer.data as GroupMember).last_name}`
                }
              </span>
            </p>
          </div>

          {/* Flight Information Display */}
          {originalFlightTime && flightNumber && (
            <div className="p-4 bg-blue-50 rounded-lg border">
              <div className="flex items-center space-x-3">
                <Plane className={`h-5 w-5 ${selectedTransferType === 'pickup' ? 'text-blue-600' : 'text-orange-600'}`} />
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedTransferType === 'pickup' ? 'Arrival Flight' : 'Departure Flight'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Flight {flightNumber} - {formatTimeAMPM(originalFlightTime.split('T')[1], originalFlightTime.split('T')[0])}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Auto-calculated Transport Time */}
          {scheduledDateTime && (
            <div className="p-4 bg-green-50 rounded-lg border">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-gray-900">Transport Time</div>
                  <div className="text-sm text-gray-600">
                    {new Date(scheduledDateTime).toLocaleString()} 
                    <span className="text-green-600 font-medium ml-2">
                      (at original flight time)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vehicle and Driver Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Vehicle</Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.filter(v => v.status === 'available').map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <Car className="h-4 w-4" />
                        <span>{vehicle.vehicle_number} - {vehicle.vehicle_type}</span>
                        <Badge variant="outline" className="ml-auto">{vehicle.capacity} seats</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Driver</Label>
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map(driver => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{driver.first_name} {driver.last_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              Back to Transfer Type
            </Button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        {currentStep === 3 && (
          <Button 
            onClick={handleSchedule}
            disabled={!selectedCustomer || !selectedVehicle || !selectedDriver}
            className="px-6"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Transport
          </Button>
        )}
      </div>
    </>
  );
}
