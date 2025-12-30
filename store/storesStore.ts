import { create } from 'zustand';
import { Store, StoreStatus, CustomerType, MobileRole } from '@prisma/client';

interface StoresState {
  stores: Store[];
  selectedStore: Store | null;
  filterStatus: StoreStatus | 'ALL';
  filterCustomerType: CustomerType | 'ALL';
  searchQuery: string;
  isLoading: boolean;

  // Actions
  setStores: (stores: Store[]) => void;
  addStore: (store: Store) => void;
  updateStore: (id: number, updates: Partial<Store>) => void;
  deleteStore: (id: number) => void;
  setSelectedStore: (store: Store | null) => void;
  setFilterStatus: (status: StoreStatus | 'ALL') => void;
  setFilterCustomerType: (type: CustomerType | 'ALL') => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;

  // Computed
  filteredStores: () => Store[];
  getStoresByStatus: (status: StoreStatus) => Store[];
}

export const useStoresStore = create<StoresState>((set, get) => ({
  stores: [],
  selectedStore: null,
  filterStatus: 'ALL',
  filterCustomerType: 'ALL',
  searchQuery: '',
  isLoading: false,

  setStores: (stores) => set({ stores }),

  addStore: (store) => set((state) => ({
    stores: [...state.stores, store]
  })),

  updateStore: (id, updates) => set((state) => ({
    stores: state.stores.map(store =>
      store.id === id ? { ...store, ...updates } : store
    )
  })),

  deleteStore: (id) => set((state) => ({
    stores: state.stores.filter(store => store.id !== id),
    selectedStore: state.selectedStore?.id === id ? null : state.selectedStore
  })),

  setSelectedStore: (store) => set({ selectedStore: store }),

  setFilterStatus: (status) => set({ filterStatus: status }),

  setFilterCustomerType: (type) => set({ filterCustomerType: type }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setLoading: (loading) => set({ isLoading: loading }),

  filteredStores: () => {
    const { stores, filterStatus, filterCustomerType, searchQuery } = get();

    return stores.filter(store => {
      const matchesStatus = filterStatus === 'ALL' || store.status === filterStatus;
      const matchesCustomerType = filterCustomerType === 'ALL' || store.customerType === filterCustomerType;
      const matchesSearch = !searchQuery ||
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.address.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesCustomerType && matchesSearch;
    });
  },

  getStoresByStatus: (status: StoreStatus) => {
    const { stores } = get();
    return stores.filter(store => store.status === status);
  }
}));
