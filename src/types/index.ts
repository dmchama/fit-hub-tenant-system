
export interface User {
  id: string;
  username: string;
  password: string;
  role: 'superadmin' | 'gymadmin' | 'member';
  gymId?: string;
  createdAt: string;
}

export interface Gym {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  adminUsername: string;
  adminPassword: string;
  createdAt: string;
}

export interface Member {
  id: string;
  gymId: string;
  username: string;
  password: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  currentPlan?: PaymentPlan;
  isActive: boolean;
}

export interface PaymentPlan {
  id: string;
  memberId: string;
  type: 'daily' | 'monthly' | '3month' | '6month' | '1year';
  amount: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'pending';
}

export interface Attendance {
  id: string;
  memberId: string;
  gymId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
}

export interface AuthContext {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}
