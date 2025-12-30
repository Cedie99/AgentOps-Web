# Zustand State Management

This directory contains all Zustand stores for global state management in the AgentOps application.

## Available Stores

### 1. Authentication Store (`authStore.ts`)
Manages user authentication state.

```typescript
import { useAuthStore } from '@/store';

// In your component
const { user, dbUser, isAuthenticated, setUser, logout } = useAuthStore();

// Actions
setUser(supabaseUser);
setDbUser(databaseUser);
logout();
```

### 2. Agents Store (`agentsStore.ts`)
Manages field agents data and filtering.

```typescript
import { useAgentsStore } from '@/store';

// Get all agents
const agents = useAgentsStore(state => state.agents);

// Get filtered agents
const filteredAgents = useAgentsStore(state => state.filteredAgents());

// Set filters
const { setFilterRole, setFilterStatus, setSearchQuery } = useAgentsStore();

// CRUD operations
const { addAgent, updateAgent, deleteAgent } = useAgentsStore();
```

### 3. Stores Store (`storesStore.ts`)
Manages store locations data.

```typescript
import { useStoresStore } from '@/store';

// Get all stores
const stores = useStoresStore(state => state.stores);

// Get filtered stores
const filteredStores = useStoresStore(state => state.filteredStores());

// Get stores by status
const deliveredStores = useStoresStore(state =>
  state.getStoresByStatus('DELIVERED')
);

// CRUD operations
const { addStore, updateStore, deleteStore } = useStoresStore();
```

### 4. Vehicles Store (`vehiclesStore.ts`)
Manages vehicle fleet data.

```typescript
import { useVehiclesStore } from '@/store';

// Get all vehicles
const vehicles = useVehiclesStore(state => state.vehicles);

// Get available vehicles only
const availableVehicles = useVehiclesStore(state => state.availableVehicles());

// CRUD operations
const { addVehicle, updateVehicle, deleteVehicle } = useVehiclesStore();
```

### 5. UI Store (`uiStore.ts`)
Manages UI state (modals, sidebar, notifications, etc.)

```typescript
import { useUIStore } from '@/store';

// Sidebar
const { sidebarOpen, toggleSidebar } = useUIStore();

// Modals
const { openModal, closeModal } = useUIStore();
openModal('addAgent');
closeModal('addAgent');

// Map view
const { mapView, setMapView } = useUIStore();
setMapView('agents');

// Notifications
const { addNotification, removeNotification } = useUIStore();
addNotification({
  type: 'success',
  message: 'Agent created successfully!'
});
```

## Best Practices

### 1. Selector Pattern (Performance)
Use selectors to prevent unnecessary re-renders:

```typescript
// ❌ Bad - Component re-renders on any state change
const store = useAgentsStore();

// ✅ Good - Only re-renders when agents change
const agents = useAgentsStore(state => state.agents);
```

### 2. Multiple Selectors
```typescript
// Get multiple values efficiently
const { agents, selectedAgent, isLoading } = useAgentsStore(state => ({
  agents: state.agents,
  selectedAgent: state.selectedAgent,
  isLoading: state.isLoading
}));
```

### 3. Computed Values
Use the built-in computed functions:

```typescript
// Use computed values instead of filtering manually
const filteredAgents = useAgentsStore(state => state.filteredAgents());
```

### 4. Actions Outside Components
You can call actions outside React components:

```typescript
import { useAgentsStore } from '@/store';

// In an API handler or utility function
export async function fetchAgents() {
  const response = await fetch('/api/agents');
  const agents = await response.json();

  // Update store directly
  useAgentsStore.getState().setAgents(agents);
}
```

## Integration with Next.js

### Loading Data on Mount
```typescript
'use client'

import { useEffect } from 'react';
import { useAgentsStore } from '@/store';

export default function AgentsPage() {
  const { agents, setAgents, setLoading } = useAgentsStore();

  useEffect(() => {
    async function loadAgents() {
      setLoading(true);
      try {
        const response = await fetch('/api/agents');
        const data = await response.json();
        setAgents(data);
      } catch (error) {
        console.error('Failed to load agents:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAgents();
  }, []);

  return (
    <div>
      {agents.map(agent => (
        <div key={agent.id}>{agent.name}</div>
      ))}
    </div>
  );
}
```

### Server Actions Integration
```typescript
'use server'

import { useAgentsStore } from '@/store';

export async function createAgent(data: FormData) {
  // Create agent in database
  const agent = await prisma.agent.create({
    data: {
      name: data.get('name') as string,
      // ... other fields
    }
  });

  // Update store on client
  return agent;
}
```

## Persistence

The `authStore` uses Zustand's persistence middleware to save auth state to localStorage:

```typescript
// Automatically saved to localStorage
// Automatically restored on page reload
```

To add persistence to other stores:

```typescript
import { persist } from 'zustand/middleware';

export const useAgentsStore = create<AgentsState>()(
  persist(
    (set, get) => ({
      // ... your state and actions
    }),
    {
      name: 'agents-storage', // localStorage key
    }
  )
);
```

## Debugging

Enable Redux DevTools integration:

```typescript
import { devtools } from 'zustand/middleware';

export const useAgentsStore = create<AgentsState>()(
  devtools(
    (set, get) => ({
      // ... your state
    }),
    { name: 'AgentsStore' }
  )
);
```

Then use Redux DevTools browser extension to inspect state changes.
