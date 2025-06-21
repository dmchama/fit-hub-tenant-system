import React, { useState, useEffect } from 'react';
import { Member, PaymentPlan, Attendance } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from '@/hooks/use-toast';
import { User, CreditCard, Calendar, LogOut, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { QRCodeScanner } from './QRCodeScanner';
import { Camera } from 'lucide-react';

export const MemberDashboard: React.FC = () => {
  const [memberData, setMemberData] = useState<Member | null>(null);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (user) {
      loadMemberData();
    }
  }, [user]);

  const loadMemberData = () => {
    // Load member data
    const allMembers = JSON.parse(localStorage.getItem('gymSystemMembers') || '[]');
    const member = allMembers.find((m: Member) => m.username === user?.username);
    setMemberData(member);

    if (member) {
      // Load payment plans
      const allPayments = JSON.parse(localStorage.getItem('gymSystemPayments') || '[]');
      const memberPayments = allPayments.filter((p: PaymentPlan) => p.memberId === member.id);
      setPaymentPlans(memberPayments);

      // Load attendance records
      const allAttendance = JSON.parse(localStorage.getItem('gymSystemAttendance') || '[]');
      const memberAttendance = allAttendance.filter((a: Attendance) => a.memberId === member.id);
      setAttendanceRecords(memberAttendance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  };

  const getCurrentPlan = () => {
    const activePlans = paymentPlans.filter(plan => {
      const endDate = new Date(plan.endDate);
      const today = new Date();
      return endDate >= today && plan.status === 'active';
    });
    return activePlans.length > 0 ? activePlans[0] : null;
  };

  const getAttendanceThisMonth = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return attendanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    }).length;
  };

  const handleQRScan = (qrData: string) => {
    setShowQRScanner(false);
    
    // Parse QR code data (format: "gym:gymId:gymName")
    const qrParts = qrData.split(':');
    if (qrParts.length === 3 && qrParts[0] === 'gym') {
      const scannedGymId = qrParts[1];
      
      // Verify the gym ID matches the member's gym
      if (scannedGymId === memberData?.gymId) {
        markAttendanceByQR();
      } else {
        toast({
          title: "Error",
          description: "This QR code is not for your gym",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Error",
        description: "Invalid QR code format",
        variant: "destructive",
      });
    }
  };

  const markAttendanceByQR = () => {
    if (!memberData) return;

    const today = new Date().toISOString().split('T')[0];
    const allAttendance = JSON.parse(localStorage.getItem('gymSystemAttendance') || '[]');
    
    const existingAttendance = allAttendance.find((a: any) => 
      a.memberId === memberData.id && a.date === today
    );

    if (existingAttendance && !existingAttendance.checkOut) {
      // Member is already checked in, so this is a checkout
      const updatedAttendance = allAttendance.map((a: any) => 
        a.id === existingAttendance.id ? { ...a, checkOut: new Date().toLocaleTimeString() } : a
      );
      localStorage.setItem('gymSystemAttendance', JSON.stringify(updatedAttendance));
      
      toast({
        title: "Success",
        description: "Check-out marked successfully",
      });
      loadMemberData();
      return;
    }

    if (existingAttendance && existingAttendance.checkOut) {
      toast({
        title: "Info",
        description: "You have already completed attendance for today",
      });
      return;
    }

    const newAttendance = {
      id: Date.now().toString(),
      memberId: memberData.id,
      gymId: memberData.gymId,
      date: today,
      checkIn: new Date().toLocaleTimeString()
    };

    const updatedAttendance = [...allAttendance, newAttendance];
    localStorage.setItem('gymSystemAttendance', JSON.stringify(updatedAttendance));
    
    loadMemberData();
    toast({
      title: "Success",
      description: "Check-in marked successfully",
    });
  };

  const currentPlan = getCurrentPlan();
  const monthlyAttendance = getAttendanceThisMonth();

  if (!memberData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading...</h2>
          <p className="text-gray-600">Please wait while we load your data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <User className="mr-3 h-8 w-8 text-green-600" />
            Member Dashboard
          </h1>
          <Button 
            onClick={() => setShowQRScanner(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Camera className="mr-2 h-4 w-4" />
            Scan QR Code
          </Button>
          <Button onClick={logout} variant="outline" className="flex items-center">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Welcome Section */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, {memberData.name}!</h2>
            <p className="text-gray-600">Here's your gym activity overview</p>
          </div>
          <Button 
            onClick={() => setShowQRScanner(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Camera className="mr-2 h-4 w-4" />
            Scan QR Code
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-center">
                <div className={`text-2xl font-bold mb-2 ${memberData.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {memberData.isActive ? 'Active' : 'Inactive'}
                </div>
                <p className="text-sm text-gray-600">
                  Member since {new Date(memberData.joinDate).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-center">
                {currentPlan ? (
                  <>
                    <div className="text-2xl font-bold mb-2 text-green-600">
                      {currentPlan.type.charAt(0).toUpperCase() + currentPlan.type.slice(1)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Expires: {new Date(currentPlan.endDate).toLocaleDateString()}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold mb-2 text-red-600">No Plan</div>
                    <p className="text-sm text-gray-600">Contact admin to purchase a plan</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold mb-2 text-purple-600">
                  {monthlyAttendance} Days
                </div>
                <p className="text-sm text-gray-600">Attendance this month</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Member Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-lg">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-gray-800">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Name:</span>
                  <span className="text-gray-800">{memberData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Email:</span>
                  <span className="text-gray-800">{memberData.email || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Phone:</span>
                  <span className="text-gray-800">{memberData.phone || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Username:</span>
                  <span className="text-gray-800">{memberData.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Join Date:</span>
                  <span className="text-gray-800">{new Date(memberData.joinDate).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {currentPlan && (
            <Card className="shadow-lg">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-800">Current Plan Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Plan Type:</span>
                    <span className="text-gray-800 capitalize">{currentPlan.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Amount Paid:</span>
                    <span className="text-gray-800">₹{currentPlan.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Start Date:</span>
                    <span className="text-gray-800">{new Date(currentPlan.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">End Date:</span>
                    <span className="text-gray-800">{new Date(currentPlan.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      currentPlan.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {currentPlan.status}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Attendance */}
        <Card className="shadow-lg">
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-purple-800">Recent Attendance</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {attendanceRecords.length > 0 ? (
              <div className="space-y-3">
                {attendanceRecords.slice(0, 10).map((record) => (
                  <div key={record.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-800">
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-600 ml-2">
                        ({new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })})
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Check In: {record.checkIn}</div>
                      {record.checkOut && (
                        <div className="text-sm text-gray-600">Check Out: {record.checkOut}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records</h3>
                <p className="text-gray-600">Your attendance history will appear here once you start visiting the gym.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {showQRScanner && (
          <QRCodeScanner
            onScanSuccess={handleQRScan}
            onClose={() => setShowQRScanner(false)}
          />
        )}
      </div>
    </div>
  );
};
