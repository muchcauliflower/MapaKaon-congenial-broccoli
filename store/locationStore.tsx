import { create } from "zustand"

interface LocationState {
  coords: { lat: number; lng: number } | null
  setCoords: (coords: { lat: number; lng: number } | null) => void
}

export const useLocationStore = create<LocationState>((set) => ({
  coords: null,
  setCoords: (coords) => set({ coords }),
}))