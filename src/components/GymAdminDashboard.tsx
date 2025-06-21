
import React, { useState, useEffect } from 'react';
import { Member, PaymentPlan, Attendance, User } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Users, CreditCard, Calendar, LogOut, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const GymAdminDashboard: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<PaymentPlan[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const { user, logout } = useAuth();

  const [memberForm, setMemberForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    memberId: '',
    type: 'monthly' as PaymentPlan['type'],
    amount: 0
  });

  const paymentPlans = {
    daily: { name: 'Daily Plan', amount: 50, duration: 1 },
    monthly: { name: 'Monthly Plan', amount: 1000, duration: 30 },
    '3month': { name: '3 Month Plan', amount: 2700, duration: 90 },
    '6month': { name: '6 Month Plan', amount: 5000, duration: 180 },
    '1year': { name: '1 Year Plan', amount: 9000, duration: 365 }
  };

  useEffect(() => {
    if (user?.gymId) {
      loadData();
    }
  }, [user]);

  const loadData = () => {
    const storedMembers = JSON.parse(localStorage.getItem('gymSystemMembers') || '[]');
    const storedPayments = JSON.parse(localStorage.getItem('gymSystemPayments') || '[]');
    const storedAttendance = JSON.parse(localStorage.getItem('gymSystemAttendance') || '[]');

    setMembers(storedMembers.filter((m: Member) => m.gymId === user?.gymId));
    setPayments(storedPayments);
    setAttendance(storedAttendance.filter((a: Attendance) => a.gymId === user?.gymId));
  };

  const saveMember = () => {
    if (!memberForm.username || !memberForm.password || !memberForm.name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const newMember: Member = {
      id: editingMember?.id || Date.now().toString(),
      gymId: user?.gymId || '',
      username: memberForm.username,
      password: memberForm.password,
      name: memberForm.name,
      email: memberForm.email,
      phone: memberForm.phone,
      joinDate: editingMember?.joinDate || new Date().toISOString(),
      isActive: true
    };

    const allMembers = JSON.parse(localStorage.getItem('gymSystemMembers') || '[]');
    let updatedMembers;

    if (editingMember) {
      updatedMembers = allMembers.map((m: Member) => m.id === editingMember.id ? newMember : m);
    } else {
      updatedMembers = [...allMembers, newMember];
      
      // Create member user account
      const memberUser: User = {
        id: Date.now().toString(),
        username: memberForm.username,
        password: memberForm.password,
        role: 'member',
        gymId: user?.gymId,
        createdAt: new Date().toISOString()
      };

      const existingUsers = JSON.parse(localStorage.getItem('gymSystemUsers') || '[]');
      const updatedUsers = [...existingUsers, memberUser];
      localStorage.setItem('gymSystemUsers', JSON.stringify(updatedUsers));
    }

    localStorage.setItem('gymSystemMembers', JSON.stringify(updatedMembers));
    loadData();
    resetMemberForm();
    
    toast({
      title: "Success",
      description: editingMember ? "Member updated successfully" : "Member added successfully",
    });
  };

  const savePayment = () => {
    if (!paymentForm.memberId || !paymentForm.type) {
      toast({
        title: "Error",
        description: "Please select member and payment type",
        variant: "destructive",
      });
      return;
    }

    const plan = paymentPlans[paymentForm.type];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.duration);

    const newPayment: PaymentPlan = {
      id: Date.now().toString(),
      memberId: paymentForm.memberId,
      type: paymentForm.type,
      amount: paymentForm.amount || plan.amount,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'active'
    };

    const allPayments = JSON.parse(localStorage.getItem('gymSystemPayments') || '[]');
    const updatedPayments = [...allPayments, newPayment];
    localStorage.setItem('gymSystemPayments', JSON.stringify(updatedPayments));

    // Update member's current plan
    const allMembers = JSON.parse(localStorage.getItem('gymSystemMembers') || '[]');
    const updatedMembers = allMembers.map((m: Member) => 
      m.id === paymentForm.memberId ? { ...m, currentPlan: newPayment } : m
    );
    localStorage.setItem('gymSystemMembers', JSON.stringify(updatedMembers));

    loadData();
    resetPaymentForm();
    
    toast({
      title: "Success",
      description: "Payment plan added successfully",
    });
  };

  const markAttendance = (memberId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const existingAttendance = attendance.find(a => 
      a.memberId === memberId && a.date === today
    );

    if (existingAttendance) {
      toast({
        title: "Info",
        description: "Attendance already marked for today",
      });
      return;
    }

    const newAttendance: Attendance = {
      id: Date.now().toString(),
      memberId,
      gymId: user?.gymId || '',
      date: today,
      checkIn: new Date().toLocaleTimeString()
    };

    const allAttendance = JSON.parse(localStorage.getItem('gymSystemAttendance') || '[]');
    const updatedAttendance = [...allAttendance, newAttendance];
    localStorage.setItem('gymSystemAttendance', JSON.stringify(updatedAttendance));
    
    loadData();
    toast({
      title: "Success",
      description: "Attendance marked successfully",
    });
  };

  const resetMemberForm = () => {
    setMemberForm({
      username: '',
      password: '',
      name: '',
      email: '',
      phone: ''
    });
    setShowMemberForm(false);
    setEditingMember(null);
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      memberId: '',
      type: 'monthly',
      amount: 0
    });
    setShowPaymentForm(false);
  };

  const editMember = (member: Member) => {
    setMemberForm({
      username: member.username,
      password: member.password,
      name: member.name,
      email: member.email,
      phone: member.phone
    });
    setEditingMember(member);
    setShowMemberForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Users className="mr-3 h-8 w-8 text-blue-600" />
            Gym Admin Dashboard
          </h1>
          <Button onClick={logout} variant="outline" className="flex items-center">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold text-gray-700">Member Management</h2>
                <div className="bg-blue-100 px-3 py-1 rounded-full">
                  <span className="text-blue-800 font-medium">{members.length} Members</span>
                </div>
              </div>
              <Button 
                onClick={() => setShowMemberForm(true)} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </div>

            {showMemberForm && (
              <Card className="shadow-lg">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-blue-800">
                    {editingMember ? 'Edit Member' : 'Add New Member'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="memberName">Name *</Label>
                      <Input
                        id="memberName"
                        value={memberForm.name}
                        onChange={(e) => setMemberForm({...memberForm, name: e.target.value})}
                        placeholder="Enter member name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="memberEmail">Email</Label>
                      <Input
                        id="memberEmail"
                        type="email"
                        value={memberForm.email}
                        onChange={(e) => setMemberForm({...memberForm, email: e.target.value})}
                        placeholder="Enter email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="memberPhone">Phone</Label>
                      <Input
                        id="memberPhone"
                        value={memberForm.phone}
                        onChange={(e) => setMemberForm({...memberForm, phone: e.target.value})}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="memberUsername">Username *</Label>
                      <Input
                        id="memberUsername"
                        value={memberForm.username}
                        onChange={(e) => setMemberForm({...memberForm, username: e.target.value})}
                        placeholder="Enter username"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="memberPassword">Password *</Label>
                      <Input
                        id="memberPassword"
                        type="password"
                        value={memberForm.password}
                        onChange={(e) => setMemberForm({...memberForm, password: e.target.value})}
                        placeholder="Enter password"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <Button variant="outline" onClick={resetMemberForm}>
                      Cancel
                    </Button>
                    <Button onClick={saveMember} className="bg-blue-600 hover:bg-blue-700">
                      {editingMember ? 'Update Member' : 'Add Member'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => (
                <Card key={member.id} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <UserPlus className="mr-2 h-5 w-5" />
                        {member.name}
                      </span>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => editMember(member)}
                          className="text-white hover:bg-white/20"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAttendance(member.id)}
                          className="text-white hover:bg-green-500/20"
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2 text-sm">
                      <p><strong>Email:</strong> {member.email || 'Not provided'}</p>
                      <p><strong>Phone:</strong> {member.phone || 'Not provided'}</p>
                      <p><strong>Username:</strong> {member.username}</p>
                      <p><strong>Join Date:</strong> {new Date(member.joinDate).toLocaleDateString()}</p>
                      <p><strong>Status:</strong> 
                        <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                          member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-700">Payment Management</h2>
              <Button 
                onClick={() => setShowPaymentForm(true)} 
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Payment
              </Button>
            </div>

            {showPaymentForm && (
              <Card className="shadow-lg">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-green-800">Add Payment Plan</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentMember">Select Member</Label>
                      <Select value={paymentForm.memberId} onValueChange={(value) => 
                        setPaymentForm({...paymentForm, memberId: value})
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose member" />
                        </SelectTrigger>
                        <SelectContent>
                          {members.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentType">Payment Plan</Label>
                      <Select value={paymentForm.type} onValueChange={(value: PaymentPlan['type']) => 
                        setPaymentForm({...paymentForm, type: value, amount: paymentPlans[value].amount})
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(paymentPlans).map(([key, plan]) => (
                            <SelectItem key={key} value={key}>
                              {plan.name} - ₹{plan.amount}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentAmount">Amount</Label>
                      <Input
                        id="paymentAmount"
                        type="number"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({...paymentForm, amount: Number(e.target.value)})}
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <Button variant="outline" onClick={resetPaymentForm}>
                      Cancel
                    </Button>
                    <Button onClick={savePayment} className="bg-green-600 hover:bg-green-700">
                      Add Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {payments.map((payment) => {
                const member = members.find(m => m.id === payment.memberId);
                return (
                  <Card key={payment.id} className="shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                      <CardTitle className="flex items-center">
                        <CreditCard className="mr-2 h-5 w-5" />
                        {member?.name || 'Unknown Member'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-2 text-sm">
                        <p><strong>Plan:</strong> {paymentPlans[payment.type].name}</p>
                        <p><strong>Amount:</strong> ₹{payment.amount}</p>
                        <p><strong>Start Date:</strong> {new Date(payment.startDate).toLocaleDateString()}</p>
                        <p><strong>End Date:</strong> {new Date(payment.endDate).toLocaleDateString()}</p>
                        <p><strong>Status:</strong> 
                          <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                            payment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {payment.status}
                          </span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-700">Attendance Records</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {attendance.map((record) => {
                const member = members.find(m => m.id === record.memberId);
                return (
                  <Card key={record.id} className="shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                      <CardTitle className="flex items-center">
                        <Calendar className="mr-2 h-5 w-5" />
                        {member?.name || 'Unknown Member'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-2 text-sm">
                        <p><strong>Date:</strong> {new Date(record.date).toLocaleDateString()}</p>
                        <p><strong>Check In:</strong> {record.checkIn}</p>
                        {record.checkOut && (
                          <p><strong>Check Out:</strong> {record.checkOut}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {attendance.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
                <p className="mt-1 text-sm text-gray-500">Attendance will appear here as members check in.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
