import React, { useState, useEffect } from 'react';
import { Gym, User } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Building2, Users, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import QRCode from 'qrcode';

export const SuperAdminDashboard: React.FC = () => {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGym, setEditingGym] = useState<Gym | null>(null);
  const { logout } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    adminUsername: '',
    adminPassword: ''
  });

  useEffect(() => {
    loadGyms();
  }, []);

  const loadGyms = () => {
    const storedGyms = JSON.parse(localStorage.getItem('gymSystemGyms') || '[]');
    setGyms(storedGyms);
  };

  const saveGym = async () => {
    if (!formData.name || !formData.adminUsername || !formData.adminPassword) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Generate QR code for the gym
    const gymQRData = `gym:${editingGym?.id || Date.now().toString()}:${formData.name}`;
    const qrCodeDataURL = await QRCode.toDataURL(gymQRData);

    const newGym: Gym = {
      id: editingGym?.id || Date.now().toString(),
      ...formData,
      qrCode: qrCodeDataURL,
      createdAt: editingGym?.createdAt || new Date().toISOString()
    };

    let updatedGyms;
    if (editingGym) {
      updatedGyms = gyms.map(gym => gym.id === editingGym.id ? newGym : gym);
    } else {
      updatedGyms = [...gyms, newGym];
      
      // Create gym admin user
      const gymAdminUser: User = {
        id: Date.now().toString(),
        username: formData.adminUsername,
        password: formData.adminPassword,
        role: 'gymadmin',
        gymId: newGym.id,
        createdAt: new Date().toISOString()
      };

      const existingUsers = JSON.parse(localStorage.getItem('gymSystemUsers') || '[]');
      const updatedUsers = [...existingUsers, gymAdminUser];
      localStorage.setItem('gymSystemUsers', JSON.stringify(updatedUsers));
    }

    localStorage.setItem('gymSystemGyms', JSON.stringify(updatedGyms));
    setGyms(updatedGyms);
    resetForm();
    
    toast({
      title: "Success",
      description: editingGym ? "Gym updated successfully" : "Gym created successfully",
    });
  };

  const deleteGym = (gymId: string) => {
    const updatedGyms = gyms.filter(gym => gym.id !== gymId);
    localStorage.setItem('gymSystemGyms', JSON.stringify(updatedGyms));
    setGyms(updatedGyms);
    
    toast({
      title: "Success",
      description: "Gym deleted successfully",
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      adminUsername: '',
      adminPassword: ''
    });
    setShowCreateForm(false);
    setEditingGym(null);
  };

  const editGym = (gym: Gym) => {
    setFormData({
      name: gym.name,
      address: gym.address,
      phone: gym.phone,
      email: gym.email,
      adminUsername: gym.adminUsername,
      adminPassword: gym.adminPassword
    });
    setEditingGym(gym);
    setShowCreateForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Building2 className="mr-3 h-8 w-8 text-indigo-600" />
            Super Admin Dashboard
          </h1>
          <Button onClick={logout} variant="outline" className="flex items-center">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-700">Gym Management</h2>
            <div className="bg-indigo-100 px-3 py-1 rounded-full">
              <span className="text-indigo-800 font-medium">{gyms.length} Gyms</span>
            </div>
          </div>
          <Button 
            onClick={() => setShowCreateForm(true)} 
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Gym
          </Button>
        </div>

        {showCreateForm && (
          <Card className="mb-6 shadow-lg">
            <CardHeader className="bg-indigo-50">
              <CardTitle className="text-indigo-800">
                {editingGym ? 'Edit Gym' : 'Create New Gym'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Gym Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter gym name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Enter gym email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Enter gym address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminUsername">Admin Username *</Label>
                  <Input
                    id="adminUsername"
                    value={formData.adminUsername}
                    onChange={(e) => setFormData({...formData, adminUsername: e.target.value})}
                    placeholder="Enter admin username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Admin Password *</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
                    placeholder="Enter admin password"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={saveGym} className="bg-indigo-600 hover:bg-indigo-700">
                  {editingGym ? 'Update Gym' : 'Create Gym'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gyms.map((gym) => (
            <Card key={gym.id} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Building2 className="mr-2 h-5 w-5" />
                    {gym.name}
                  </span>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => editGym(gym)}
                      className="text-white hover:bg-white/20"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteGym(gym.id)}
                      className="text-white hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <p><strong>Address:</strong> {gym.address || 'Not specified'}</p>
                  <p><strong>Phone:</strong> {gym.phone || 'Not specified'}</p>
                  <p><strong>Email:</strong> {gym.email || 'Not specified'}</p>
                  <p><strong>Admin:</strong> {gym.adminUsername}</p>
                  <p className="text-gray-500">
                    <strong>Created:</strong> {new Date(gym.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {gyms.length === 0 && !showCreateForm && (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No gyms</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new gym.</p>
            <div className="mt-6">
              <Button onClick={() => setShowCreateForm(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="mr-2 h-4 w-4" />
                Add New Gym
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
