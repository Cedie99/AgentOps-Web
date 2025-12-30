import { create } from 'zustand';
import { Agent, MobileRole, AgentStatus } from '@prisma/client';

interface AgentsState {
  agents: Agent[];
  selectedAgent: Agent | null;
  filterRole: MobileRole | 'ALL';
  filterStatus: AgentStatus | 'ALL';
  searchQuery: string;
  isLoading: boolean;

  // Actions
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: number, updates: Partial<Agent>) => void;
  deleteAgent: (id: number) => void;
  setSelectedAgent: (agent: Agent | null) => void;
  setFilterRole: (role: MobileRole | 'ALL') => void;
  setFilterStatus: (status: AgentStatus | 'ALL') => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;

  // Computed
  filteredAgents: () => Agent[];
}

export const useAgentsStore = create<AgentsState>((set, get) => ({
  agents: [],
  selectedAgent: null,
  filterRole: 'ALL',
  filterStatus: 'ALL',
  searchQuery: '',
  isLoading: false,

  setAgents: (agents) => set({ agents }),

  addAgent: (agent) => set((state) => ({
    agents: [...state.agents, agent]
  })),

  updateAgent: (id, updates) => set((state) => ({
    agents: state.agents.map(agent =>
      agent.id === id ? { ...agent, ...updates } : agent
    )
  })),

  deleteAgent: (id) => set((state) => ({
    agents: state.agents.filter(agent => agent.id !== id),
    selectedAgent: state.selectedAgent?.id === id ? null : state.selectedAgent
  })),

  setSelectedAgent: (agent) => set({ selectedAgent: agent }),

  setFilterRole: (role) => set({ filterRole: role }),

  setFilterStatus: (status) => set({ filterStatus: status }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setLoading: (loading) => set({ isLoading: loading }),

  filteredAgents: () => {
    const { agents, filterRole, filterStatus, searchQuery } = get();

    return agents.filter(agent => {
      const matchesRole = filterRole === 'ALL' || agent.role === filterRole;
      const matchesStatus = filterStatus === 'ALL' || agent.status === filterStatus;
      const matchesSearch = !searchQuery ||
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.email?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesRole && matchesStatus && matchesSearch;
    });
  }
}));
