import { create } from 'zustand';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Modals
  modalOpen: {
    addAgent: boolean;
    editAgent: boolean;
    addStore: boolean;
    editStore: boolean;
    addVehicle: boolean;
    editVehicle: boolean;
    addUser: boolean;
    editUser: boolean;
  };

  // Map
  mapView: 'all' | 'agents' | 'stores';
  selectedMapAgent: number | null;
  selectedMapStore: number | null;

  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
  }>;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  openModal: (modal: keyof UIState['modalOpen']) => void;
  closeModal: (modal: keyof UIState['modalOpen']) => void;
  closeAllModals: () => void;

  setMapView: (view: UIState['mapView']) => void;
  setSelectedMapAgent: (id: number | null) => void;
  setSelectedMapStore: (id: number | null) => void;

  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  sidebarOpen: true,
  sidebarCollapsed: false,

  modalOpen: {
    addAgent: false,
    editAgent: false,
    addStore: false,
    editStore: false,
    addVehicle: false,
    editVehicle: false,
    addUser: false,
    editUser: false,
  },

  mapView: 'all',
  selectedMapAgent: null,
  selectedMapStore: null,

  notifications: [],

  // Sidebar actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  // Modal actions
  openModal: (modal) => set((state) => ({
    modalOpen: { ...state.modalOpen, [modal]: true }
  })),

  closeModal: (modal) => set((state) => ({
    modalOpen: { ...state.modalOpen, [modal]: false }
  })),

  closeAllModals: () => set({
    modalOpen: {
      addAgent: false,
      editAgent: false,
      addStore: false,
      editStore: false,
      addVehicle: false,
      editVehicle: false,
      addUser: false,
      editUser: false,
    }
  }),

  // Map actions
  setMapView: (view) => set({ mapView: view }),
  setSelectedMapAgent: (id) => set({ selectedMapAgent: id }),
  setSelectedMapStore: (id) => set({ selectedMapStore: id }),

  // Notification actions
  addNotification: (notification) => set((state) => ({
    notifications: [
      ...state.notifications,
      {
        ...notification,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      }
    ]
  })),

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),

  clearNotifications: () => set({ notifications: [] }),
}));
