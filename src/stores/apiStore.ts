import { create } from 'zustand'
import type { ApiSpec, Endpoint, ApiResponse } from '@/types/api'

interface ApiState {
  // Spec data
  spec: ApiSpec | null
  isLoading: boolean
  error: string | null
  
  // UI state
  selectedEndpoint: Endpoint | null
  selectedSchema: string | null
  searchQuery: string
  expandedTags: string[]
  activeTab: 'docs' | 'try-it' | 'schema' | 'graph'
  
  // Try It Out state
  lastResponse: ApiResponse | null
  isRequestLoading: boolean
  
  // Theme
  isDarkMode: boolean
  
  // Actions
  setSpec: (spec: ApiSpec | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  selectEndpoint: (endpoint: Endpoint | null) => void
  selectSchema: (schemaName: string | null) => void
  setSearchQuery: (query: string) => void
  toggleTag: (tag: string) => void
  setActiveTab: (tab: 'docs' | 'try-it' | 'schema' | 'graph') => void
  setLastResponse: (response: ApiResponse | null) => void
  setRequestLoading: (loading: boolean) => void
  toggleDarkMode: () => void
  reset: () => void
}

export const useApiStore = create<ApiState>((set) => ({
  // Initial state
  spec: null,
  isLoading: false,
  error: null,
  selectedEndpoint: null,
  selectedSchema: null,
  searchQuery: '',
  expandedTags: [],
  activeTab: 'docs',
  lastResponse: null,
  isRequestLoading: false,
  isDarkMode: true,
  
  // Actions
  setSpec: (spec) => set({ spec, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  selectEndpoint: (endpoint) => set({ selectedEndpoint: endpoint, activeTab: 'docs' }),
  selectSchema: (schemaName) => set({ selectedSchema: schemaName }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toggleTag: (tag) => set((state) => ({
    expandedTags: state.expandedTags.includes(tag)
      ? state.expandedTags.filter(t => t !== tag)
      : [...state.expandedTags, tag]
  })),
  setActiveTab: (activeTab) => set({ activeTab }),
  setLastResponse: (lastResponse) => set({ lastResponse }),
  setRequestLoading: (isRequestLoading) => set({ isRequestLoading }),
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  reset: () => set({
    spec: null,
    isLoading: false,
    error: null,
    selectedEndpoint: null,
    selectedSchema: null,
    searchQuery: '',
    expandedTags: [],
    lastResponse: null,
  }),
}))
