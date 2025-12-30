
export enum UserRole {
  SUPER_ADMIN = 'Super Admin',
  ADMIN = 'Admin'
}

export enum MobileRole {
  SURVEYOR = 'Surveyor',
  SALES = 'Sales',
  DELIVERY = 'Delivery',
  COLLECTOR = 'Collector'
}

export enum StoreStatus {
  SURVEYED = 'Surveyed',
  SALES_VISITED = 'Sales Visited',
  DELIVERED = 'Delivered',
  COLLECTED = 'Collected',
  PENDING = 'Pending'
}

export enum CustomerType {
  PROSPECT = 'Prospect',
  NEW = 'New Customer',
  EXISTING = 'Existing Customer'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'Active' | 'Suspended';
  lastLogin: string;
  avatar?: string;
}

export interface TimelineEvent {
  role: MobileRole;
  agentName: string;
  timestamp: string;
  vehicleId: string;
  status: StoreStatus;
  note?: string;
  // New Fields for Delivery Verification & Collection Tracking
  photoUrl?: string; 
  paymentStatus?: 'Full' | 'Partial' | 'Credit';
  amountCollected?: number;
  totalOrderAmount?: number;
}

export interface VisitLog {
  id: string;
  agentName: string;
  timestamp: string;
  outcome: string;
  locationVerified: boolean;
  notes: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: StoreStatus;
  customerType: CustomerType;
  lastUpdated: string;
  orderValue?: number;
  collectionAmount?: number;
  timeline: TimelineEvent[];
  currentAssignment?: {
    agentId: string;
    agentName: string;
    role: MobileRole;
    assignedAt: string;
  };
  visitHistory: VisitLog[];
}

export interface Agent {
  id: string;
  name: string;
  role: MobileRole;
  vehicleId?: string;
  status: 'Available' | 'On Field' | 'Off Duty';
  lastSeen: string;
  currentLat: number;
  currentLng: number;
  activeTasksCount?: number;
  attendance: {
    checkIn: string;
    checkOut?: string;
    duration?: string;
  };
}

export interface FuelEntry {
  id: string;
  vehicleId: string;
  liters: number;
  cost: number;
  date: string;
  loggedBy: string;
}

export enum VehicleStatus {
  AVAILABLE = 'Available',
  IN_USE = 'In Use',
  MAINTENANCE = 'Maintenance'
}

export interface Vehicle {
  id: string;
  model: string;
  plate: string;
  totalKm: number;
  fuelRate: number; // km per liter
  status: VehicleStatus;
  assignedTo?: string; // Agent ID
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target: 'All' | MobileRole | string; // Role or Store ID
  timestamp: string;
  priority: 'Low' | 'Medium' | 'High';
}
