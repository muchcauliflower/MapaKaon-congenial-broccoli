// store/routeStore.ts
import { create } from "zustand"

interface RoutePoints {
  originLat: number
  originLon: number
  destLat:   number
  destLon:   number
}

interface RouteStore {
  routePoints: RoutePoints | null
  setRoutePoints: (points: RoutePoints) => void
  clearRoutePoints: () => void
}

export const useRouteStore = create<RouteStore>((set) => ({
  routePoints: null,
  setRoutePoints: (points) => set({ routePoints: points }),
  clearRoutePoints: () => set({ routePoints: null }),
}))