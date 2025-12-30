import { create } from 'zustand';
import { Vehicle, VehicleStatus } from '@prisma/client';

interface VehiclesState {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  filterStatus: VehicleStatus | 'ALL';
  searchQuery: string;
  isLoading: boolean;

  // Actions
  setVehicles: (vehicles: Vehicle[]) => void;
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (id: number, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: number) => void;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  setFilterStatus: (status: VehicleStatus | 'ALL') => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;

  // Computed
  filteredVehicles: () => Vehicle[];
  availableVehicles: () => Vehicle[];
}

export const useVehiclesStore = create<VehiclesState>((set, get) => ({
  vehicles: [],
  selectedVehicle: null,
  filterStatus: 'ALL',
  searchQuery: '',
  isLoading: false,

  setVehicles: (vehicles) => set({ vehicles }),

  addVehicle: (vehicle) => set((state) => ({
    vehicles: [...state.vehicles, vehicle]
  })),

  updateVehicle: (id, updates) => set((state) => ({
    vehicles: state.vehicles.map(vehicle =>
      vehicle.id === id ? { ...vehicle, ...updates } : vehicle
    )
  })),

  deleteVehicle: (id) => set((state) => ({
    vehicles: state.vehicles.filter(vehicle => vehicle.id !== id),
    selectedVehicle: state.selectedVehicle?.id === id ? null : state.selectedVehicle
  })),

  setSelectedVehicle: (vehicle) => set({ selectedVehicle: vehicle }),

  setFilterStatus: (status) => set({ filterStatus: status }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setLoading: (loading) => set({ isLoading: loading }),

  filteredVehicles: () => {
    const { vehicles, filterStatus, searchQuery } = get();

    return vehicles.filter(vehicle => {
      const matchesStatus = filterStatus === 'ALL' || vehicle.status === filterStatus;
      const matchesSearch = !searchQuery ||
        vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.plate.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  },

  availableVehicles: () => {
    const { vehicles } = get();
    return vehicles.filter(vehicle => vehicle.status === 'AVAILABLE');
  }
}));
