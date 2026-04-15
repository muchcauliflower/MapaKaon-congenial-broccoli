"use client"

import mapboxgl from "mapbox-gl"
import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { SidebarDrawer } from "./sidebarDrawer"
import { toast } from "sonner"
import { useRouteStore } from "@/store/routeStore"
import { useLocationStore } from "@/store/locationStore"
import { RouteSheet } from "./routeSheet"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

const JEEPNEY_COLORS = ["#4A90D9", "#00BCD4", "#9B59B6"] as const  // blue / cyan / purple
const WALK_COLOR     = "#27AE60"
const ALT_COLORS     = ["#6B8CAE", "#B07D5A"] as const
const ALT_OPACITY    = 0.10
const ALT_LINE_WIDTH = 3

const TRAFFIC_COLORS: Record<string, string> = {
  HEAVY:    "#E74C3C",
  MODERATE: "#ffc108",
}
const TRAFFIC_WIDTH   = 8
const TRAFFIC_OPACITY = 0.9

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SegmentData = {
  segment_index: number
  route_number: string
  direction: string
  walk_to_polyline:   { latitude: number; longitude: number }[]
  jeepney_polyline:   { latitude: number; longitude: number }[]
  walk_from_polyline: { latitude: number; longitude: number }[]
  board_point:  { lat: number; lng: number }
  alight_point: { lat: number; lng: number }
  score?: number
  board_dist_m?: number
  jeepney_dist_m?: number
  alight_dist_m?: number
  transfer_spot_name?: string | null
}

export type RouteResponse = {
  type: "direct" | "transfer"
  summary?: string
  number_of_transfers?: number
  total_distance_m?: number
  total_duration_s?: number
  total_score?: number
  segments: SegmentData[]
}

type ApiResponse = {
  best: RouteResponse
  alternatives: RouteResponse[]
}

type TrafficSample = {
  lat: number; lng: number
  congestion: "CLEAR" | "MODERATE" | "HEAVY" | "NO_DATA"
  current_speed_kmph: number | null
  free_flow_speed_kmph: number | null
  ratio: number | null
}

type SegmentTraffic = {
  status: "ok" | "no_data" | "disabled" | "error"
  overall: "CLEAR" | "MODERATE" | "HEAVY" | null
  samples: TrafficSample[]
}

type TrafficResponse = {
  segments: { segment_index: number; traffic: SegmentTraffic }[]
}

type TrafficMap = Record<string, SegmentTraffic>

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

const toCoords = (
  pts: { latitude: number; longitude: number }[]
): [number, number][] => pts.map((p) => [p.longitude, p.latitude])

const layerId = (slot: string, kind: string, segIdx: number) =>
  `route-${slot}-${kind}-${segIdx}`

const MAX_SEGS  = 3
const ALT_SLOTS = ["alt-0", "alt-1"] as const

function clearAllRouteLayers(m: mapboxgl.Map) {
  const slots = ["best", ...ALT_SLOTS]
  const kinds = ["walk-to", "jeepney", "walk-from"]
  for (const slot of slots) {
    for (const kind of kinds) {
      for (let i = 0; i < MAX_SEGS; i++) {
        const id = layerId(slot, kind, i)
        if (m.getLayer(id)) m.removeLayer(id)
        if (m.getSource(id)) m.removeSource(id)
      }
    }
  }
}

function trafficLayerId(slot: string, segIdx: number, sampleIdx: number) {
  return `traffic-${slot}-${segIdx}-${sampleIdx}`
}

function closestPolylineIdx(
  polyline: { latitude: number; longitude: number }[],
  lat: number,
  lng: number,
): number {
  let best = 0, bestDist = Infinity
  for (let i = 0; i < polyline.length; i++) {
    const d = (polyline[i].latitude - lat) ** 2 + (polyline[i].longitude - lng) ** 2
    if (d < bestDist) { bestDist = d; best = i }
  }
  return best
}

function clearTrafficLayers(m: mapboxgl.Map) {
  const slots = ["best", ...ALT_SLOTS]
  for (const slot of slots) {
    for (let i = 0; i < MAX_SEGS; i++) {
      for (let s = 0; s < 20; s++) {
        const id = trafficLayerId(slot, i, s)
        if (m.getLayer(id)) m.removeLayer(id)
        if (m.getSource(id)) m.removeSource(id)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// addLineLayer — slot:"top" + emissive so Mapbox Standard doesn't darken lines
// ---------------------------------------------------------------------------
function addLineLayer(
  m: mapboxgl.Map,
  id: string,
  coordinates: [number, number][],
  color: string,
  width: number,
  opacity: number,
  dashed: boolean,
) {
  if (m.getLayer(id)) m.removeLayer(id)
  if (m.getSource(id)) m.removeSource(id)

  m.addSource(id, {
    type: "geojson",
    data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } },
  })

  const layerDef: any = {
    id,
    type: "line",
    source: id,
    slot: "top",                          // Mapbox Standard: render above basemap lighting
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": color,
      "line-width": width,
      "line-opacity": opacity,
      "line-emissive-strength": 1,        // prevents Standard lighting model darkening
      ...(dashed ? { "line-dasharray": [2, 2] } : {}),
    },
  }

  try {
    m.addLayer(layerDef)
  } catch {
    // Fallback for older GL JS: strip slot and retry
    const { slot: _s, ...fallback } = layerDef
    try { m.addLayer(fallback) } catch { /* give up */ }
  }
}

// ---------------------------------------------------------------------------
// drawRoute
// ---------------------------------------------------------------------------
function drawRoute(
  m: mapboxgl.Map,
  route: RouteResponse,
  slot: string,
  altIndex: number | null,
  isSelected: boolean,
) {
  const isBest   = slot === "best"
  const active   = isSelected || isBest
  const altColor = altIndex !== null ? ALT_COLORS[altIndex % ALT_COLORS.length] : null

  const opacity     = active ? 0.95 : ALT_OPACITY
  const lineWidth   = active ? 5    : ALT_LINE_WIDTH
  const walkOpacity = active ? 0.85 : ALT_OPACITY

  route.segments.forEach((seg) => {
    const idx      = seg.segment_index
    const jeepColor = active ? JEEPNEY_COLORS[idx % JEEPNEY_COLORS.length] : altColor!

    addLineLayer(m, layerId(slot, "walk-to",   idx), toCoords(seg.walk_to_polyline),   WALK_COLOR, active ? 3 : 2, walkOpacity, true)
    addLineLayer(m, layerId(slot, "jeepney",   idx), toCoords(seg.jeepney_polyline),   jeepColor,  lineWidth,      opacity,     false)
    addLineLayer(m, layerId(slot, "walk-from", idx), toCoords(seg.walk_from_polyline), WALK_COLOR, active ? 3 : 2, walkOpacity, true)
  })
}

// ---------------------------------------------------------------------------
// drawTrafficOverlays
// ---------------------------------------------------------------------------
function drawTrafficOverlays(
  m: mapboxgl.Map,
  route: RouteResponse,
  slot: string,
  trafficMap: TrafficMap,
) {
  route.segments.forEach((seg) => {
    const key     = `${slot}-${seg.segment_index}`
    const traffic = trafficMap[key]
    if (!traffic?.samples?.length) return

    const polyline = seg.jeepney_polyline
    const samples  = traffic.samples

    for (let s = 0; s < samples.length; s++) {
      const color = TRAFFIC_COLORS[samples[s].congestion]
      if (!color) continue

      const startIdx = closestPolylineIdx(polyline, samples[s].lat, samples[s].lng)
      const endIdx   = s + 1 < samples.length
        ? closestPolylineIdx(polyline, samples[s + 1].lat, samples[s + 1].lng)
        : polyline.length - 1

      if (startIdx >= endIdx) continue
      const sliceCoords = toCoords(polyline.slice(startIdx, endIdx + 1))
      if (sliceCoords.length < 2) continue

      addLineLayer(m, trafficLayerId(slot, seg.segment_index, s), sliceCoords, color, TRAFFIC_WIDTH, TRAFFIC_OPACITY, false)
    }
  })
}

// ---------------------------------------------------------------------------
// drawBoardAlightMarkers
// ---------------------------------------------------------------------------
function drawBoardAlightMarkers(
  m: mapboxgl.Map,
  route: RouteResponse,
  markersArr: mapboxgl.Marker[],
) {
  route.segments.forEach((seg) => {
    const color = JEEPNEY_COLORS[seg.segment_index % JEEPNEY_COLORS.length]

    const boardEl = document.createElement("div")
    boardEl.innerHTML = `<div style="background:${color};color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,.35)">▲</div>`
    markersArr.push(
      new mapboxgl.Marker({ element: boardEl })
        .setLngLat([seg.board_point.lng, seg.board_point.lat])
        .setPopup(new mapboxgl.Popup().setText(`Board Jeepney ${seg.route_number}`))
        .addTo(m)
    )

    const alightEl = document.createElement("div")
    alightEl.innerHTML = `<div style="background:${color};color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,.35)">▼</div>`
    markersArr.push(
      new mapboxgl.Marker({ element: alightEl })
        .setLngLat([seg.alight_point.lng, seg.alight_point.lat])
        .setPopup(new mapboxgl.Popup().setText(`Alight Jeepney ${seg.route_number}`))
        .addTo(m)
    )
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MapView = () => {
  const mapContainer        = useRef<HTMLDivElement>(null)
  const map                 = useRef<mapboxgl.Map | null>(null)
  const markers             = useRef<mapboxgl.Marker[]>([])
  const apiDataRef          = useRef<ApiResponse | null>(null)
  const hasDrawnRef         = useRef(false)
  const userLocationMarker  = useRef<mapboxgl.Marker | null>(null)

  const { theme } = useTheme()

  const [apiData,       setApiData]       = useState<ApiResponse | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [loading,       setLoading]       = useState(false)
  const [trafficMap,    setTrafficMap]     = useState<TrafficMap>({})

  const lightStyle = "mapbox://styles/mapbox/streets-v11"
  const darkStyle  = "mapbox://styles/muchcauliflower/cmmigeaqr001f01sh99hi0fv9"

  const routePoints = useRouteStore((s) => s.routePoints)
  const userCoords  = useLocationStore((s) => s.coords)

  const activeRoute: RouteResponse | null = apiData
    ? selectedIndex === null
      ? apiData.best
      : (apiData.alternatives[selectedIndex] ?? apiData.best)
    : null

  useEffect(() => { apiDataRef.current = apiData }, [apiData])

  // ---------------------------------------------------------------------------
  // User location marker — pulsing blue dot
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const m = map.current
    if (!m || !userCoords) return

    const place = () => {
      if (userLocationMarker.current) {
        userLocationMarker.current.setLngLat([userCoords.lng, userCoords.lat])
        return
      }

      const el = document.createElement("div")
      el.style.cssText = `
        position: relative;
        width: 20px;
        height: 20px;
      `
      el.innerHTML = `
        <div style="
          position: absolute; inset: 0;
          background: #4A90D9;
          border-radius: 50%;
          border: 2.5px solid white;
          box-shadow: 0 0 0 2px #4A90D9;
          z-index: 1;
        "></div>
        <div style="
          position: absolute; inset: -6px;
          background: rgba(74,144,217,0.25);
          border-radius: 50%;
          animation: ors-pulse 2s ease-out infinite;
        "></div>
        <style>
          @keyframes ors-pulse {
            0%   { transform: scale(0.6); opacity: 1; }
            100% { transform: scale(1.8); opacity: 0; }
          }
        </style>
      `

      userLocationMarker.current = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([userCoords.lng, userCoords.lat])
        .setPopup(new mapboxgl.Popup({ offset: 16 }).setText("You are here"))
        .addTo(m)
    }

    if (m.loaded() && m.isStyleLoaded()) place()
    else m.once("idle", place)
  }, [userCoords])

  // ---------------------------------------------------------------------------
  // Clear user location marker on map teardown
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => { userLocationMarker.current?.remove() }
  }, [])

  // ---------------------------------------------------------------------------
  // Clear on route reset
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (routePoints !== null) return
    const m = map.current
    if (!m) return
    clearAllRouteLayers(m)
    clearTrafficLayers(m)
    markers.current.forEach((mk) => mk.remove())
    markers.current = []
    setApiData(null)
    setSelectedIndex(null)
    setTrafficMap({})
    hasDrawnRef.current = false
  }, [routePoints])

  // ---------------------------------------------------------------------------
  // Init map
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapContainer.current) return
    if (map.current) { map.current.remove(); map.current = null }
    mapboxgl.accessToken = MAPBOX_TOKEN
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: theme === "dark" ? darkStyle : lightStyle,
      center: [122.5621, 10.7202],
      zoom: 14,
    })
    return () => { map.current?.remove(); map.current = null }
  }, [])

  // ---------------------------------------------------------------------------
  // Fetch route
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!routePoints) return

    const fetchRoute = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE_URL}/route`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start_lat: routePoints.originLat,
            start_lng: routePoints.originLon,
            dest_lat:  routePoints.destLat,
            dest_lng:  routePoints.destLon,
          }),
        })
        if (!res.ok) throw new Error(`Server responded ${res.status}`)
        if (!res.body) throw new Error("No response body")

        // Stream NDJSON — render best route as soon as it arrives,
        // then add alternatives as they stream in.
        const reader  = res.body.getReader()
        const decoder = new TextDecoder()
        let   buffer  = ""
        let   best:    RouteResponse | null = null
        const alts:   RouteResponse[]       = []

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""
          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const msg = JSON.parse(line)
              if (msg.event === "error") throw new Error(msg.detail)
              if (msg.event === "done") break
              if (msg.event === "best") {
                best = msg.route as RouteResponse
                // Render best route immediately — don't wait for alts
                setApiData({ best: best!, alternatives: [] })
                setSelectedIndex(null)
                map.current?.flyTo({ center: [routePoints.originLon, routePoints.originLat], zoom: 15, duration: 1500 })
              } else if (msg.event === "alternative") {
                alts.push(msg.route as RouteResponse)
                // Update with accumulated alternatives so far
                setApiData({ best: best!, alternatives: [...alts] })
              }
            } catch { /* malformed line */ }
          }
        }
        if (!best) throw new Error("No route found")
      } catch (e: any) {
        toast.error("Failed to fetch route", { description: e.message ?? "Unknown error" })
      } finally {
        setLoading(false)
      }
    }
    fetchRoute()
  }, [routePoints])

  // ---------------------------------------------------------------------------
  // Core redraw — the ONLY function that writes to the map.
  // Always wipes all layers first to prevent ghost routes.
  // keepStartEnd=true preserves the 📍/🏁 markers (indices 0+1).
  // ---------------------------------------------------------------------------
  const redrawAll = (
    m: mapboxgl.Map,
    data: ApiResponse,
    selIdx: number | null,
    tMap: TrafficMap,
    keepStartEnd: boolean,
  ) => {
    const bestIsActive = selIdx === null
    const activeRoute  = bestIsActive ? data.best : (data.alternatives[selIdx!] ?? data.best)
    const activeSlot   = bestIsActive ? "best" : ALT_SLOTS[selIdx! % ALT_SLOTS.length]

    // Wipe everything — no ghost layers
    clearAllRouteLayers(m)
    clearTrafficLayers(m)

    if (!keepStartEnd) {
      markers.current.forEach((mk) => mk.remove())
      markers.current = []

      const startEl = document.createElement("div")
      startEl.innerHTML = `<div style="background:#4A90D9;color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:17px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4)">📍</div>`
      markers.current.push(
        new mapboxgl.Marker({ element: startEl })
          .setLngLat([routePoints!.originLon, routePoints!.originLat])
          .setPopup(new mapboxgl.Popup().setText("Start"))
          .addTo(m)
      )
      const endEl = document.createElement("div")
      endEl.innerHTML = `<div style="background:#E74C3C;color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:17px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4)">🏁</div>`
      markers.current.push(
        new mapboxgl.Marker({ element: endEl })
          .setLngLat([routePoints!.destLon, routePoints!.destLat])
          .setPopup(new mapboxgl.Popup().setText("Destination"))
          .addTo(m)
      )
    }

    // When no route is selected (best), show alts faded behind it.
    // When a specific route is selected, hide all others entirely.
    if (bestIsActive) {
      data.alternatives.forEach((alt, i) => drawRoute(m, alt, ALT_SLOTS[i], i, false))
    }
    drawRoute(m, activeRoute, activeSlot, bestIsActive ? null : selIdx, true)

    // Traffic only for active route
    if (Object.keys(tMap).length > 0) {
      drawTrafficOverlays(m, activeRoute, activeSlot, tMap)
    }

    // Board/alight markers — keep 📍🏁, replace rest
    markers.current.slice(2).forEach((mk) => mk.remove())
    markers.current = markers.current.slice(0, 2)
    drawBoardAlightMarkers(m, activeRoute, markers.current)
  }

  // ---------------------------------------------------------------------------
  // Draw when apiData arrives
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const m = map.current
    if (!m || !apiData || !routePoints) return
    const run = () => {
      const data = apiDataRef.current
      if (!data) return
      redrawAll(m, data, null, {}, false)
      hasDrawnRef.current = true
    }
    if (m.loaded() && m.isStyleLoaded()) run()
    else m.once("idle", run)
  }, [apiData])

  // ---------------------------------------------------------------------------
  // Fetch traffic
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!apiData) { setTrafficMap({}); return }

    const allRoutes = [apiData.best, ...apiData.alternatives]
    const slotMap   = ["best", ...ALT_SLOTS] as const
    const payload: { order_index: number; segment_index: number; route_number: string; slot: string; jeepney_polyline: object[] }[] = []
    const slotByOrder: string[] = []

    allRoutes.forEach((route, ri) => {
      const slot = slotMap[ri] ?? `alt-${ri}`
      route.segments.forEach((seg) => {
        payload.push({ order_index: payload.length, segment_index: seg.segment_index, route_number: seg.route_number, slot, jeepney_polyline: seg.jeepney_polyline })
        slotByOrder.push(slot)
      })
    })

    let cancelled = false
    const streamTraffic = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/route/traffic`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ segments: payload }),
        })
        if (!res.ok || !res.body) return
        const reader  = res.body.getReader()
        const decoder = new TextDecoder()
        let   buffer  = ""
        while (true) {
          const { done, value } = await reader.read()
          if (done || cancelled) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""
          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const item: { order_index: number; segment_index: number; traffic: SegmentTraffic } = JSON.parse(line)
              // Use order_index echoed from backend to look up the exact slot —
              // segment_index alone is not globally unique across routes.
              const slot = (item.order_index >= 0 && item.order_index < payload.length)
                ? payload[item.order_index].slot
                : "best"
              setTrafficMap((prev) => ({ ...prev, [`${slot}-${item.segment_index}`]: item.traffic }))
            } catch { /* malformed line */ }
          }
        }
      } catch { /* traffic failed */ }
    }
    streamTraffic()
    return () => { cancelled = true }
  }, [apiData])

  // ---------------------------------------------------------------------------
  // Redraw when selectedIndex or trafficMap changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const m = map.current
    if (!m || !apiData || !routePoints || !m.isStyleLoaded()) return
    // Only run after the initial apiData draw has executed
    if (!hasDrawnRef.current) return
    redrawAll(m, apiData, selectedIndex, trafficMap, true)
  }, [selectedIndex, trafficMap])

  // ---------------------------------------------------------------------------
  // Theme change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!map.current) return
    map.current.setStyle(theme === "dark" ? darkStyle : lightStyle)
    map.current.once("style.load", () => {
      if (apiDataRef.current) setApiData({ ...apiDataRef.current })
    })
  }, [theme])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="relative h-dvh">
      <SidebarDrawer />
      <div ref={mapContainer} className="h-full w-full" />
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
          <span className="rounded-full bg-white px-4 py-2 text-sm shadow-lg dark:bg-zinc-900">
            Finding route…
          </span>
        </div>
      )}
      <RouteSheet
        routeData={activeRoute}
        alternatives={apiData?.alternatives ?? []}
        selectedIndex={selectedIndex}
        onSelectRoute={setSelectedIndex}
      />
    </div>
  )
}

export default MapView