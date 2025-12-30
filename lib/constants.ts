
import { Store, StoreStatus, MobileRole, Agent, Vehicle, Announcement, User, UserRole, FuelEntry, CustomerType, VehicleStatus } from './types';

export const MOCK_USERS: User[] = [
  { id: 'U001', name: 'Super Admin', email: 'superadmin@agentops.com', role: UserRole.SUPER_ADMIN, status: 'Active', lastLogin: 'Today, 10:45 AM' },
  { id: 'U002', name: 'Admin User', email: 'admin@agentops.com', role: UserRole.ADMIN, status: 'Active', lastLogin: 'Yesterday, 04:20 PM' },
];

export const MOCK_FUEL_ENTRIES: FuelEntry[] = [
  { id: 'F001', vehicleId: 'V001', liters: 42.5, cost: 65.20, date: '2024-05-21 08:30', loggedBy: 'Alex Admin' },
  { id: 'F002', vehicleId: 'V002', liters: 55.0, cost: 82.50, date: '2024-05-20 17:15', loggedBy: 'Sarah Miller' },
  { id: 'F003', vehicleId: 'V001', liters: 12.0, cost: 18.00, date: '2024-05-19 09:45', loggedBy: 'Alex Admin' },
];

export const MOCK_STORES: Store[] = [
  {
    id: 'ST001',
    name: 'Main Street Grocery',
    address: '123 Main St, Downtown',
    lat: 40.7128,
    lng: -74.0060,
    status: StoreStatus.COLLECTED,
    customerType: CustomerType.EXISTING,
    lastUpdated: '2024-05-20 14:30',
    timeline: [
      { role: MobileRole.SURVEYOR, agentName: 'Joseph', timestamp: '2024-05-18 09:00', vehicleId: 'V001', status: StoreStatus.SURVEYED },
      { role: MobileRole.SALES, agentName: 'Jane Smith', timestamp: '2024-05-19 11:15', vehicleId: 'V002', status: StoreStatus.SALES_VISITED },
      { 
        role: MobileRole.DELIVERY, 
        agentName: 'Bob Wilson', 
        timestamp: '2024-05-20 08:45', 
        vehicleId: 'V003', 
        status: StoreStatus.DELIVERED,
        photoUrl: 'https://images.unsplash.com/photo-1586769852836-bc069f19e1b6?w=800&auto=format&fit=crop' 
      },
      { 
        role: MobileRole.COLLECTOR, 
        agentName: 'Alice Green', 
        timestamp: '2024-05-20 14:30', 
        vehicleId: 'V004', 
        status: StoreStatus.COLLECTED,
        paymentStatus: 'Partial',
        amountCollected: 150.00,
        totalOrderAmount: 450.00,
        note: 'Customer had cash flow issue, requested 3 days for balance.'
      },
    ],
    visitHistory: [
      { id: 'V1', agentName: 'Jane Smith', timestamp: '2024-05-19 11:15', outcome: 'Order Placed', locationVerified: true, notes: 'Store owner agreed to new inventory' }
    ]
  },
  {
    id: 'ST002',
    name: 'Corner Pharmacy',
    address: '456 Oak Rd, Uptown',
    lat: 40.7200,
    lng: -74.0100,
    status: StoreStatus.SALES_VISITED,
    customerType: CustomerType.NEW,
    lastUpdated: '2024-05-21 10:00',
    orderValue: 450.00,
    timeline: [
      { role: MobileRole.SURVEYOR, agentName: 'Joseph', timestamp: '2024-05-19 10:00', vehicleId: 'V001', status: StoreStatus.SURVEYED },
      { role: MobileRole.SALES, agentName: 'Jane Smith', timestamp: '2024-05-21 10:00', vehicleId: 'V002', status: StoreStatus.SALES_VISITED },
    ],
    visitHistory: [
      { id: 'V2', agentName: 'Jane Smith', timestamp: '2024-05-20 14:00', outcome: 'Negotiating', locationVerified: true, notes: 'Initial introduction made.' },
      { id: 'V3', agentName: 'Jane Smith', timestamp: '2024-05-21 10:00', outcome: 'Order Placed', locationVerified: true, notes: 'Order confirmed for $450.' }
    ]
  },
  {
    id: 'ST003',
    name: 'Quick Stop Deli',
    address: '789 Pine Ave, West Side',
    lat: 40.7050,
    lng: -73.9950,
    status: StoreStatus.DELIVERED,
    customerType: CustomerType.EXISTING,
    lastUpdated: '2024-05-22 14:00',
    orderValue: 120.00,
    collectionAmount: 120.00,
    timeline: [
      { role: MobileRole.SURVEYOR, agentName: 'Sam Brown', timestamp: '2024-05-21 15:20', vehicleId: 'V005', status: StoreStatus.SURVEYED },
      { role: MobileRole.SALES, agentName: 'Jane Smith', timestamp: '2024-05-22 09:00', vehicleId: 'V002', status: StoreStatus.SALES_VISITED },
      { 
        role: MobileRole.DELIVERY, 
        agentName: 'Bob Wilson', 
        timestamp: '2024-05-22 14:00', 
        vehicleId: 'V003', 
        status: StoreStatus.DELIVERED,
        photoUrl: 'https://images.unsplash.com/photo-1549194388-f61be84a6e9e?w=800&auto=format&fit=crop'
      },
    ],
    visitHistory: []
  },
  {
    id: 'ST004',
    name: 'Harbor View Mart',
    address: '321 Quay St, Harbor',
    lat: 40.7300,
    lng: -74.0200,
    status: StoreStatus.SALES_VISITED,
    customerType: CustomerType.PROSPECT,
    lastUpdated: '2024-05-22 09:15',
    orderValue: 890.50,
    timeline: [
      { role: MobileRole.SURVEYOR, agentName: 'Joseph', timestamp: '2024-05-22 09:15', vehicleId: 'V001', status: StoreStatus.SURVEYED },
      { role: MobileRole.SALES, agentName: 'Jane Smith', timestamp: '2024-05-22 11:45', vehicleId: 'V002', status: StoreStatus.SALES_VISITED },
    ],
    visitHistory: []
  },
  {
    id: 'ST005',
    name: 'Metropolis Mall Express',
    address: '500 Broadway, Midtown',
    lat: 40.7100,
    lng: -74.0010,
    status: StoreStatus.COLLECTED,
    customerType: CustomerType.NEW,
    lastUpdated: '2024-05-22 16:30',
    orderValue: 2400.00,
    collectionAmount: 2400.00,
    timeline: [
      { role: MobileRole.SURVEYOR, agentName: 'Joseph', timestamp: '2024-05-15 10:00', vehicleId: 'V001', status: StoreStatus.SURVEYED },
      { role: MobileRole.SALES, agentName: 'Jane Smith', timestamp: '2024-05-17 14:00', vehicleId: 'V002', status: StoreStatus.SALES_VISITED },
      { 
        role: MobileRole.DELIVERY, 
        agentName: 'Bob Wilson', 
        timestamp: '2024-05-22 16:30', 
        vehicleId: 'V003', 
        status: StoreStatus.DELIVERED,
        photoUrl: 'https://images.unsplash.com/photo-1512418490979-92798ccc1380?w=800&auto=format&fit=crop'
      },
      { 
        role: MobileRole.COLLECTOR, 
        agentName: 'Alice Green', 
        timestamp: '2024-05-22 17:30', 
        vehicleId: 'V004', 
        status: StoreStatus.COLLECTED,
        paymentStatus: 'Full',
        amountCollected: 2400.00,
        totalOrderAmount: 2400.00
      },
    ],
    visitHistory: []
  }
];

export const MOCK_AGENTS: Agent[] = [
  { id: 'A001', name: 'Joseph', role: MobileRole.SURVEYOR, vehicleId: 'V001', status: 'On Field', lastSeen: '2 mins ago', currentLat: 40.7150, currentLng: -74.0080, attendance: { checkIn: '08:00', duration: '7h 20m' } },
  { id: 'A002', name: 'Jane Smith', role: MobileRole.SALES, vehicleId: 'V002', status: 'On Field', lastSeen: 'Just now', currentLat: 40.7220, currentLng: -74.0120, attendance: { checkIn: '09:15', duration: '6h 05m' } },
  { id: 'A003', name: 'Bob Wilson', role: MobileRole.DELIVERY, vehicleId: 'V003', status: 'On Field', lastSeen: '1h ago', currentLat: 40.7080, currentLng: -74.0000, activeTasksCount: 3, attendance: { checkIn: '07:30', duration: '8h 00m' } },
  { id: 'A004', name: 'Alice Green', role: MobileRole.COLLECTOR, status: 'Available', lastSeen: '5 mins ago', currentLat: 40.7100, currentLng: -74.0050, activeTasksCount: 0, attendance: { checkIn: '08:45', duration: '6h 35m' } },
  { id: 'A005', name: 'Sam Brown', role: MobileRole.SURVEYOR, vehicleId: 'V005', status: 'On Field', lastSeen: '15 mins ago', currentLat: 40.7050, currentLng: -73.9950, attendance: { checkIn: '08:30', duration: '6h 50m' } },
  { id: 'A006', name: 'Frank Miller', role: MobileRole.DELIVERY, vehicleId: 'V004', status: 'Available', lastSeen: '10 mins ago', currentLat: 40.7250, currentLng: -74.0150, activeTasksCount: 1, attendance: { checkIn: '08:00', duration: '7h 30m' } },
  { id: 'A007', name: 'Diana Prince', role: MobileRole.COLLECTOR, status: 'On Field', lastSeen: 'Just now', currentLat: 40.7180, currentLng: -74.0100, activeTasksCount: 2, attendance: { checkIn: '09:00', duration: '6h 30m' } },
];

export const MOCK_VEHICLES: Vehicle[] = [
  { id: 'V001', model: 'Toyota Hiace', plate: 'ABC-123', totalKm: 12450, fuelRate: 12.5, status: VehicleStatus.IN_USE, assignedTo: 'A001' },
  { id: 'V002', model: 'Ford Transit', plate: 'XYZ-789', totalKm: 8900, fuelRate: 10.2, status: VehicleStatus.IN_USE, assignedTo: 'A002' },
  { id: 'V003', model: 'Honda Activa', plate: 'BIK-456', totalKm: 5600, fuelRate: 45.0, status: VehicleStatus.IN_USE, assignedTo: 'A003' },
  { id: 'V004', model: 'Toyota Hilux', plate: 'OFF-001', totalKm: 2500, fuelRate: 8.5, status: VehicleStatus.AVAILABLE },
  { id: 'V005', model: 'Yamaha FZ', plate: 'MTR-112', totalKm: 3200, fuelRate: 40.0, status: VehicleStatus.IN_USE, assignedTo: 'A005' },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'ANN-1', title: 'System Maintenance', content: 'AgentOps will be down for maintenance this Sunday from 2 AM to 4 AM.', target: 'All', timestamp: '2024-05-21 09:00', priority: 'Medium' },
  { id: 'ANN-2', title: 'Route Update: West Side', content: 'New construction on Pine Ave. Please use the detour via 5th St.', target: MobileRole.DELIVERY, timestamp: '2024-05-21 11:30', priority: 'High' },
];
