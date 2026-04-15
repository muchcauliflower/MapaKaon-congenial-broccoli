"use client"

import { useEffect, useState } from "react"
import {
  ChevronUp,
  ChevronDown,
  MapPin,
  Navigation,
  Bus,
  ArrowRight,
  Footprints,
} from "lucide-react"

import { useRouteStore } from "@/store/routeStore"
import type { RouteResponse } from "./mapView"

const JEEPNEY_COLORS = ["#4A90D9", "#F5A623", "#9B59B6"] as const
const WALK_COLOR = "#27AE60"

// Mirror of ALT_COLORS in mapView — used to tint the alt tab pills
const ALT_COLORS = ["#6B8CAE", "#B07D5A"] as const

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RouteSheetProps {
  routeData: RouteResponse | null
  alternatives: RouteResponse[]
  selectedIndex: number | null   // null = best is selected
  onSelectRoute: (index: number | null) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function routeTabLabel(route: RouteResponse, index: number | null): string {
  if (index === null) return route.summary ?? route.segments[0]?.route_number ?? "Best"
  return route.summary ?? route.segments.map((s) => s.route_number).join(" → ")
}

function formatDist(m?: number): string | null {
  if (m == null) return null
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m.toFixed(0)} m`
}

function formatTime(s?: number): string | null {
  if (s == null) return null
  return `~${(s / 60).toFixed(0)} min`
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function RouteSheet({
  routeData,
  alternatives,
  selectedIndex,
  onSelectRoute,
}: RouteSheetProps) {
  const [expanded, setExpanded] = useState(false)
  const clearRoutePoints = useRouteStore((s) => s.clearRoutePoints)

  // Collapse sheet when a new route arrives
  useEffect(() => {
    if (routeData) setExpanded(false)
  }, [routeData])

  if (!routeData) return null

  const totalDistance = formatDist(routeData.total_distance_m)
  const totalTime     = formatTime(routeData.total_duration_s)

  const routeLabel =
    routeData.type === "transfer"
      ? `Transfer: ${routeData.summary}`
      : `Direct: ${routeData.segments[0]?.route_number} — ${routeData.segments[0]?.direction}`

  const dotColor = selectedIndex !== null
    ? ALT_COLORS[selectedIndex % ALT_COLORS.length]
    : routeData.type === "transfer" ? "#9B59B6" : "#4A90D9"

  const hasAlternatives = alternatives.length > 0

  return (
    <>
      {/* ── Mobile bottom sheet ─────────────────────────────────────────── */}
      <div
        className={`
          sm:hidden
          fixed right-0 bottom-0 left-0 z-40
          rounded-t-2xl bg-white dark:bg-zinc-900
          shadow-2xl transition-all duration-300 ease-in-out
          ${expanded ? "max-h-[80vh]" : "max-h-[72px]"}
          flex flex-col overflow-hidden
        `}
      >
        <SummaryBar
          routeLabel={routeLabel}
          dotColor={dotColor}
          totalDistance={totalDistance}
          totalTime={totalTime}
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
        />
        {hasAlternatives && (
          <RouteTabPicker
            best={routeData}
            alternatives={alternatives}
            selectedIndex={selectedIndex}
            onSelect={onSelectRoute}
          />
        )}
        <ScrollableSteps routeData={routeData} onClear={clearRoutePoints} />
      </div>

      {/* ── Desktop sidebar card ─────────────────────────────────────────── */}
      <div
        className={`
          hidden sm:flex
          fixed right-4 bottom-4 z-40
          w-80 lg:w-96
          flex-col
          rounded-2xl bg-white/95 dark:bg-zinc-900/95
          backdrop-blur-md border border-zinc-200 dark:border-zinc-700
          shadow-2xl transition-all duration-300 ease-in-out
          ${expanded ? "max-h-[calc(100vh-6rem)]" : "max-h-[64px]"}
          overflow-hidden
        `}
      >
        <SummaryBar
          routeLabel={routeLabel}
          dotColor={dotColor}
          totalDistance={totalDistance}
          totalTime={totalTime}
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
        />
        {hasAlternatives && (
          <RouteTabPicker
            best={routeData}
            alternatives={alternatives}
            selectedIndex={selectedIndex}
            onSelect={onSelectRoute}
          />
        )}
        <ScrollableSteps routeData={routeData} onClear={clearRoutePoints} />
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Route picker tabs
// ---------------------------------------------------------------------------

function RouteTabPicker({
  best,
  alternatives,
  selectedIndex,
  onSelect,
}: {
  best: RouteResponse
  alternatives: RouteResponse[]
  selectedIndex: number | null
  onSelect: (i: number | null) => void
}) {
  return (
    <div className="flex flex-shrink-0 gap-2 overflow-x-auto border-b border-zinc-100 px-4 py-2 dark:border-zinc-800">
      {/* Best tab */}
      <RouteTab
        label={routeTabLabel(best, null)}
        sublabel={best.type === "transfer" ? `${best.number_of_transfers} transfer(s)` : "Direct"}
        color="#4A90D9"
        isActive={selectedIndex === null}
        onClick={() => onSelect(null)}
      />

      {/* Alternative tabs */}
      {alternatives.map((alt, i) => (
        <RouteTab
          key={i}
          label={routeTabLabel(alt, i)}
          sublabel={alt.type === "transfer" ? `${alt.number_of_transfers} transfer(s)` : "Direct"}
          color={ALT_COLORS[i % ALT_COLORS.length]}
          isActive={selectedIndex === i}
          onClick={() => onSelect(i)}
        />
      ))}
    </div>
  )
}

function RouteTab({
  label,
  sublabel,
  color,
  isActive,
  onClick,
}: {
  label: string
  sublabel: string
  color: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-shrink-0 flex-col items-start rounded-xl px-3 py-2 text-left
        transition-all duration-150
        ${isActive
          ? "shadow-sm"
          : "bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        }
      `}
      style={isActive ? { background: `${color}18`, border: `1.5px solid ${color}` } : { border: "1.5px solid transparent" }}
    >
      <span
        className="text-xs font-semibold leading-tight"
        style={{ color: isActive ? color : undefined }}
      >
        {label}
      </span>
      <span className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
        {sublabel}
      </span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Summary bar (unchanged from original)
// ---------------------------------------------------------------------------

function SummaryBar({
  routeLabel,
  dotColor,
  totalDistance,
  totalTime,
  expanded,
  onToggle,
}: {
  routeLabel: string
  dotColor: string
  totalDistance: string | null
  totalTime: string | null
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex flex-shrink-0 items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <div
          className="h-2 w-2 flex-shrink-0 rounded-full"
          style={{ background: dotColor }}
        />
        <span className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {routeLabel}
        </span>
      </div>
      <div className="ml-2 flex flex-shrink-0 items-center gap-3">
        {totalDistance && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{totalDistance}</span>
        )}
        {totalTime && (
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{totalTime}</span>
        )}
        <button
          onClick={onToggle}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
          ) : (
            <ChevronUp className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
          )}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scrollable steps (unchanged logic, just reads from routeData prop)
// ---------------------------------------------------------------------------

function ScrollableSteps({
  routeData,
  onClear,
}: {
  routeData: RouteResponse
  onClear: () => void
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 pb-8">
      {routeData.segments.map((seg, i) => {
        const color = JEEPNEY_COLORS[seg.segment_index % JEEPNEY_COLORS.length]
        return (
          <div key={i}>
            {seg.board_dist_m != null && (
              <Step
                icon={<Footprints className="h-4 w-4" style={{ color: WALK_COLOR }} />}
                color={WALK_COLOR}
                title={i === 0 ? "Walk to boarding point" : "Walk to next jeepney"}
                detail={`${seg.board_dist_m.toFixed(0)} m · ~${(seg.board_dist_m / 1.4 / 60).toFixed(0)} min`}
                dashed
              />
            )}

            <Step
              icon={<Bus className="h-4 w-4 text-white" />}
              color={color}
              title={`Board Jeepney Route ${seg.route_number}`}
              detail={seg.direction}
              filled
            />

            {seg.jeepney_dist_m != null && (
              <Step
                icon={<ArrowRight className="h-4 w-4" style={{ color }} />}
                color={color}
                title={`Ride ${(seg.jeepney_dist_m / 1000).toFixed(1)} km`}
                detail={`~${(seg.jeepney_dist_m / 333.33).toFixed(0)} min`}
              />
            )}

            <Step
              icon={<MapPin className="h-4 w-4 text-white" />}
              color={color}
              title="Alight here"
              detail={
                i < routeData.segments.length - 1
                  ? seg.transfer_spot_name
                    ? `Alight at ${seg.transfer_spot_name}`
                    : "Transfer to next jeepney"
                  : seg.alight_dist_m != null
                    ? `${seg.alight_dist_m.toFixed(0)} m from destination`
                    : "Near destination"
              }
              filled
            />

            {i === routeData.segments.length - 1 && seg.alight_dist_m != null && (
              <Step
                icon={<Navigation className="h-4 w-4" style={{ color: WALK_COLOR }} />}
                color={WALK_COLOR}
                title="Walk to destination"
                detail={`${seg.alight_dist_m.toFixed(0)} m · ~${(seg.alight_dist_m / 1.4 / 60).toFixed(0)} min`}
                dashed
                last
              />
            )}

            {i < routeData.segments.length - 1 && (
              <div className="mx-2 my-3 border-t border-dashed border-zinc-200 dark:border-zinc-700" />
            )}
          </div>
        )
      })}

      <div className="mt-4 flex items-center gap-3 px-2">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-500 text-base">
          🏁
        </div>
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          Destination
        </span>
      </div>

      <div className="mt-4 pb-2">
        <button
          onClick={onClear}
          className="w-full rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Clear Route
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step component (unchanged)
// ---------------------------------------------------------------------------

function Step({
  icon,
  color,
  title,
  detail,
  filled = false,
  dashed = false,
  last = false,
}: {
  icon: React.ReactNode
  color: string
  title: string
  detail?: string
  filled?: boolean
  dashed?: boolean
  last?: boolean
}) {
  return (
    <div className="relative flex gap-3">
      {!last && (
        <div
          className="absolute top-8 bottom-0 left-4 w-0.5"
          style={{
            background: dashed
              ? `repeating-linear-gradient(to bottom, ${color} 0px, ${color} 4px, transparent 4px, transparent 8px)`
              : color,
            opacity: 0.4,
          }}
        />
      )}
      <div
        className={`relative z-10 mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
          filled ? "shadow-md" : "bg-zinc-100 dark:bg-zinc-800"
        }`}
        style={filled ? { background: color } : undefined}
      >
        {icon}
      </div>
      <div className="pb-4">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{title}</p>
        {detail && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{detail}</p>
        )}
      </div>
    </div>
  )
}