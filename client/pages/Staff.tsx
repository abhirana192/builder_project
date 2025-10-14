import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Users,
  User,
  Shield,
  Car,
  Mountain,
  Phone,
  Mail,
  Calendar,
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  Trash2
} from "lucide-react";

interface StaffMember {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  emergency_contact?: string;
  hire_date: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export default function Staff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [createForm, setCreateForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: '',
    phone: '',
    emergency_contact: '',
    password: ''
  });
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    role: '',
    phone: '',
    emergency_contact: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  const [passwordChangeTarget, setPasswordChangeTarget] = useState<StaffMember | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if current user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff');
      const data = await response.json();
      setStaff(data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: "Error",
        description: "Failed to fetch staff members",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async () => {
    if (!createForm.first_name || !createForm.last_name || !createForm.email || !createForm.role || !createForm.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (createForm.password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createForm)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create staff member');
      }

      toast({
        title: "Success",
        description: "Staff member created successfully"
      });

      setCreateForm({
        first_name: '',
        last_name: '',
        email: '',
        role: '',
        phone: '',
        emergency_contact: '',
        password: ''
      });
      setIsCreateDialogOpen(false);
      fetchStaff();
    } catch (error) {
      console.error('Error creating staff:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create staff member",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    setEditForm({
      first_name: staff.first_name,
      last_name: staff.last_name,
      role: staff.role,
      phone: staff.phone || '',
      emergency_contact: staff.emergency_contact || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/staff/${editingStaff.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update staff member');
      }

      toast({
        title: "Success",
        description: "Staff member updated successfully"
      });

      setIsEditDialogOpen(false);
      setEditingStaff(null);
      fetchStaff();
    } catch (error) {
      console.error('Error updating staff:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update staff member",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteStaff = async (staffId: number, staffName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${staffName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete staff member');
      }

      toast({
        title: "Success",
        description: "Staff member deleted successfully"
      });

      fetchStaff();
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete staff member",
        variant: "destructive"
      });
    }
  };

  const handleResetPassword = async (staffId: number, staffName: string) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can reset passwords",
        variant: "destructive"
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to reset the password for ${staffName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/staff/${staffId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset password');
      }

      toast({
        title: "Success",
        description: "Password reset successfully. New password: temppassword123"
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset password",
        variant: "destructive"
      });
    }
  };

  const handleChangePassword = (staff: StaffMember) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can change passwords",
        variant: "destructive"
      });
      return;
    }
    setPasswordChangeTarget(staff);
    setNewPassword('');
    setIsChangePasswordDialogOpen(true);
  };

  const handleSubmitPasswordChange = async () => {
    if (!passwordChangeTarget || !newPassword) {
      toast({
        title: "Error",
        description: "Please enter a new password",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch(`/api/staff/${passwordChangeTarget.id}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newPassword })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }

      toast({
        title: "Success",
        description: `Password changed successfully for ${passwordChangeTarget.first_name} ${passwordChangeTarget.last_name}`
      });

      setIsChangePasswordDialogOpen(false);
      setPasswordChangeTarget(null);
      setNewPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change password",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'default';
      case 'guide': return 'secondary';
      case 'driver': return 'outline';
      case 'desk_agent': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      case 'manager': return User;
      case 'guide': return Mountain;
      case 'driver': return Car;
      case 'desk_agent': return Users;
      default: return User;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = searchTerm === "" || 
      `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    
    return matchesSearch && matchesRole && member.is_active;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading staff...</p>
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
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
            {isAdmin && (
              <Badge variant="destructive" className="text-xs">
                Admin Access
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Admin: Manage staff profiles, roles, passwords, and permissions"
              : "View staff profiles and information"
            }
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>
                Create a new staff account with role-based access
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    placeholder="John"
                    value={createForm.first_name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, first_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    placeholder="Doe"
                    value={createForm.last_name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, last_name: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@jiguangtour.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={createForm.role} onValueChange={(value) => setCreateForm(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="guide">Guide</SelectItem>
                      <SelectItem value="driver">Driver</SelectItem>
                      <SelectItem value="desk_agent">Desk Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+354-555-0123"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact">Emergency Contact</Label>
                <Input
                  id="emergency_contact"
                  placeholder="Emergency contact information"
                  value={createForm.emergency_contact}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, emergency_contact: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password (min 8 characters)"
                  value={createForm.password}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateStaff} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Staff Member"}
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{staff.filter(s => s.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Active Staff</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mountain className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{staff.filter(s => s.role === 'guide' && s.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Guides</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Car className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{staff.filter(s => s.role === 'driver' && s.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Drivers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{staff.filter(s => s.role === 'manager' && s.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Managers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{staff.filter(s => s.role === 'admin' && s.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Admins</p>
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
                  placeholder="Search staff by name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="guide">Guide</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="desk_agent">Desk Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <div className="grid gap-4">
        {filteredStaff.map((member) => {
          const RoleIcon = getRoleIcon(member.role);
          
          return (
            <Card key={member.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(member.first_name, member.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-foreground">
                          {member.first_name} {member.last_name}
                        </h3>
                        <Badge variant={getRoleColor(member.role)} className="flex items-center">
                          <RoleIcon className="mr-1 h-3 w-3" />
                          {member.role}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Mail className="mr-1 h-4 w-4" />
                          {member.email}
                        </div>
                        {member.phone && (
                          <div className="flex items-center">
                            <Phone className="mr-1 h-4 w-4" />
                            {member.phone}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-4 w-4" />
                          Hired: {formatDate(member.hire_date)}
                        </div>
                      </div>
                      {member.emergency_contact && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Emergency: {member.emergency_contact}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedStaff(member)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Staff Details</DialogTitle>
                            <DialogDescription>
                              Complete profile for {member.first_name} {member.last_name}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedStaff && (
                            <div className="grid gap-4 py-4">
                              <div className="flex items-center space-x-4">
                                <Avatar className="h-16 w-16">
                                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                                    {getInitials(selectedStaff.first_name, selectedStaff.last_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="text-lg font-semibold">
                                    {selectedStaff.first_name} {selectedStaff.last_name}
                                  </h3>
                                  <Badge variant={getRoleColor(selectedStaff.role)}>
                                    {selectedStaff.role}
                                  </Badge>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Email</Label>
                                  <p className="text-sm text-muted-foreground">{selectedStaff.email}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Phone</Label>
                                  <p className="text-sm text-muted-foreground">{selectedStaff.phone || 'Not provided'}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Hire Date</Label>
                                  <p className="text-sm text-muted-foreground">{formatDate(selectedStaff.hire_date)}</p>
                                </div>
                              </div>
                              {selectedStaff.emergency_contact && (
                                <div>
                                  <Label className="text-sm font-medium">Emergency Contact</Label>
                                  <p className="text-sm text-muted-foreground">{selectedStaff.emergency_contact}</p>
                                </div>
                              )}
                              {isAdmin && (
                                <div className="flex gap-2 pt-4">
                                  <Button variant="outline" onClick={() => handleEditStaff(selectedStaff)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Profile
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleChangePassword(selectedStaff)}
                                  >
                                    Change Password
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleResetPassword(selectedStaff.id, `${selectedStaff.first_name} ${selectedStaff.last_name}`)}
                                  >
                                    Reset Password
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      {isAdmin && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleEditStaff(member)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleChangePassword(member)}
                            title="Change Password"
                          >
                            🔑
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteStaff(member.id, `${member.first_name} ${member.last_name}`)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredStaff.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No staff members found</h3>
            <p className="text-muted-foreground">
              {searchTerm || roleFilter !== "all" 
                ? "Try adjusting your search or filter criteria" 
                : "Add staff members to get started"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Staff Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff member information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_first_name">First Name *</Label>
                <Input
                  id="edit_first_name"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_last_name">Last Name *</Label>
                <Input
                  id="edit_last_name"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_role">Role *</Label>
                <Select value={editForm.role} onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                    <SelectItem value="driver">Driver</SelectItem>
                    <SelectItem value="desk_agent">Desk Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_emergency_contact">Emergency Contact</Label>
              <Input
                id="edit_emergency_contact"
                value={editForm.emergency_contact}
                onChange={(e) => setEditForm(prev => ({ ...prev, emergency_contact: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStaff} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Staff Member"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Change password for {passwordChangeTarget?.first_name} {passwordChangeTarget?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">New Password *</Label>
              <Input
                id="new_password"
                type="password"
                placeholder="Enter new password (min 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Password must be at least 8 characters long
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsChangePasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitPasswordChange} disabled={isChangingPassword}>
              {isChangingPassword ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
