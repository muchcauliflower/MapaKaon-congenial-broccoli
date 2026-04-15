"use client"

import { useState, ReactNode } from "react"

type BadgeVariant =
  | "direct"
  | "transfer"
  | "error"
  | "green"
  | "blue"
  | "default"
type HttpMethod = "GET" | "POST"
type TabLabel = "JavaScript" | "Dart / Flutter" | "cURL" | "Python"


const TABS: TabLabel[] = ["JavaScript", "Dart / Flutter", "cURL", "Python"]

const CODE: Record<TabLabel, string> = {
  JavaScript: `const res = await fetch("http://<host>:8000/route", {
  method:  "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    start_lat: 10.7202, start_lng: 122.5621,
    dest_lat:  10.7015, dest_lng:  122.5690,
  }),
});

if (!res.ok) {
  const err = await res.json();
  console.error(err.detail);   // "No route found within walking limits."
  return;
}

const route = await res.json();
console.log(route.summary);          // "10B"  or  "10B → 2A"
console.log(route.type);             // "direct" | "transfer"
console.log(route.total_distance_m); // 3210.0

for (const seg of route.segments) {
  // jeepney_polyline   → solid coloured Polyline on MapView
  // walk_to_polyline   → dashed Polyline (start/transfer → board)
  // walk_from_polyline → dashed Polyline (alight → dest/transfer)
  console.log(seg.route_number, seg.jeepney_polyline.length);
}`,

  "Dart / Flutter": `import 'dart:convert';
import 'package:http/http.dart' as http;

final res = await http.post(
  Uri.parse('http://<host>:8000/route'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'start_lat': 10.7202, 'start_lng': 122.5621,
    'dest_lat':  10.7015, 'dest_lng':  122.5690,
  }),
);

if (res.statusCode == 404) {
  final err = jsonDecode(res.body);
  debugPrint(err['detail']);
  return;
}

final data     = jsonDecode(res.body) as Map<String, dynamic>;
final segments = data['segments'] as List<dynamic>;

for (final seg in segments) {
  final polyline = (seg['jeepney_polyline'] as List)
    .map((p) => LatLng(
      (p['latitude']  as num).toDouble(),
      (p['longitude'] as num).toDouble(),
    )).toList();
}`,

  cURL: `curl -X POST http://<host>:8000/route \\
  -H "Content-Type: application/json" \\
  -d '{
    "start_lat": 10.7202,
    "start_lng": 122.5621,
    "dest_lat":  10.7015,
    "dest_lng":  122.5690
  }'`,

  Python: `import requests

res = requests.post(
    "http://<host>:8000/route",
    json={
        "start_lat": 10.7202, "start_lng": 122.5621,
        "dest_lat":  10.7015, "dest_lng":  122.5690,
    },
)

if res.status_code == 404:
    print(res.json()["detail"])
else:
    route = res.json()
    print(route["summary"])          # "10B"  or  "10B → 2A"
    print(route["total_distance_m"]) # 3210.0
    for seg in route["segments"]:
        print(seg["route_number"], len(seg["jeepney_polyline"]))`,
}

const badgeClasses: Record<BadgeVariant, string> = {
  direct: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  transfer:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  error: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  green:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  default: "bg-[#eeebe7] text-[#08030f] dark:bg-[#2e2c3a] dark:text-[#f7f1e2]",
}

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
}

function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-[11px] font-medium ${badgeClasses[variant]}`}
    >
      {children}
    </span>
  )
}

interface MethodBadgeProps {
  method: HttpMethod
}

function MethodBadge({ method }: MethodBadgeProps) {
  const cls =
    method === "POST"
      ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
      : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
  return (
    <span
      className={`rounded px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide ${cls}`}
    >
      {method}
    </span>
  )
}

interface CodeBlockProps {
  code: string
}

function CodeBlock({ code }: CodeBlockProps) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-[#08030f]/10 bg-[#eeebe7] p-4 font-mono text-xs leading-relaxed whitespace-pre text-[#08030f] lg:text-sm dark:border-[#f7f1e2]/10 dark:bg-[#1c1b24] dark:text-[#f7f1e2]">
      {code}
    </pre>
  )
}

interface CardProps {
  children: ReactNode
  className?: string
}

function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`mb-4 overflow-hidden rounded-2xl border border-[#08030f]/10 bg-white dark:border-[#f7f1e2]/10 dark:bg-[#2e2c3a] ${className}`}
    >
      {children}
    </div>
  )
}

interface CardSectionProps {
  children: ReactNode
  className?: string
}

function CardSection({ children, className = "" }: CardSectionProps) {
  return (
    <div
      className={`border-t border-[#08030f]/10 p-4 sm:p-5 lg:p-6 dark:border-[#f7f1e2]/10 ${className}`}
    >
      {children}
    </div>
  )
}

interface SectionLabelProps {
  children: ReactNode
}

function SectionLabel({ children }: SectionLabelProps) {
  return (
    <p className="mb-2.5 text-[11px] font-semibold tracking-widest text-[#08030f]/50 uppercase dark:text-[#f7f1e2]/50">
      {children}
    </p>
  )
}

interface FieldRowProps {
  name: string
  type: string
  note: string
  required?: boolean
}

function FieldRow({ name, type, note, required = false }: FieldRowProps) {
  return (
    <div className="flex items-baseline gap-2 py-1">
      <span className="min-w-[160px] font-mono text-sm text-[#08030f] lg:min-w-[200px] lg:text-base dark:text-[#f7f1e2]">
        {name}
        {required && (
          <span className="ml-1.5 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
            required
          </span>
        )}
      </span>
      <span className="min-w-[48px] text-xs text-blue-600 lg:text-sm dark:text-blue-400">
        {type}
      </span>
      <span className="text-xs text-[#08030f]/60 lg:text-sm dark:text-[#f7f1e2]/60">
        {note}
      </span>
    </div>
  )
}

interface NoteBoxProps {
  children: ReactNode
}

function NoteBox({ children }: NoteBoxProps) {
  return (
    <div className="mt-3 rounded-r-lg border-l-2 border-violet-500 bg-violet-50 px-4 py-3 text-sm leading-relaxed text-[#08030f]/80 lg:text-base dark:border-violet-400 dark:bg-violet-900/20 dark:text-[#f7f1e2]/80">
      {children}
    </div>
  )
}

interface InlineCodeProps {
  children: ReactNode
}

function InlineCode({ children }: InlineCodeProps) {
  return (
    <code className="rounded border border-[#08030f]/10 bg-[#eeebe7] px-1.5 py-0.5 font-mono text-xs text-[#08030f] dark:border-[#f7f1e2]/10 dark:bg-[#1c1b24] dark:text-[#f7f1e2]">
      {children}
    </code>
  )
}

function Divider() {
  return (
    <hr className="my-10 border-0 border-t border-[#08030f]/10 lg:my-14 dark:border-[#f7f1e2]/10" />
  )
}

function TabbedExamples() {
  const [active, setActive] = useState<TabLabel>("JavaScript")

  return (
    <Card>
      <div className="flex overflow-x-auto border-b border-[#08030f]/10 px-5 dark:border-[#f7f1e2]/10">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`-mb-px cursor-pointer px-3 py-2.5 text-sm whitespace-nowrap transition-colors lg:text-base ${
              active === tab
                ? "border-b-2 border-violet-500 font-semibold text-[#08030f] dark:border-violet-400 dark:text-[#f7f1e2]"
                : "border-b-2 border-transparent text-[#08030f]/50 hover:text-[#08030f]/80 dark:text-[#f7f1e2]/50 dark:hover:text-[#f7f1e2]/80"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="p-4 sm:p-5 lg:p-6">
        <CodeBlock code={CODE[active]} />
      </div>
    </Card>
  )
}

export default function ApiDocs() {
  const howRoutingWorks: [string, string][] = [
    [
      "Direct first:",
      "The finder evaluates all jeepney routes for a single-ride solution.",
    ],
    [
      "Transfer fallback:",
      "If no direct route exists, it searches up to 2 transfers via known transfer spots.",
    ],
    [
      "Scoring:",
      "Each candidate is scored by board walk distance, alight walk distance, and ride distance — weighted to penalise long walks to alight.",
    ],
    [
      "Walking paths:",
      "Only the final board and alight legs call ORS. The search itself uses fast haversine math.",
    ],
  ]

  return (
    <div className="pb-16 text-left lg:py-12 lg:pb-20">
      <div className="lg:mt-20 mt-30 mb-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-500/40 dark:bg-amber-900/20">
        <span className="mt-0.5 text-base text-amber-500 dark:text-amber-400">
          ⚠
        </span>
        <p className="text-sm leading-relaxed text-amber-800 lg:text-base dark:text-amber-300">
          <span className="font-semibold">Work in progress —</span> this section (well a lot of sections)
          are still under development. Some details may be incomplete or subject
          to change please.
        </p>
      </div>

      {/* Breadcrumb */}
      <div className="mb-7 flex items-center gap-1.5 text-xs text-[#08030f]/50 dark:text-[#f7f1e2]/50">
        <span className="cursor-pointer transition-colors hover:text-[#08030f] dark:hover:text-[#f7f1e2]">
          Docs
        </span>
        <span className="opacity-40">/</span>
        <span>API Reference</span>
      </div>

      {/* Prev / Next - to implement next time */}
      {/* <div className="flex justify-between mb-8 pb-6 border-b border-[#08030f]/10 dark:border-[#f7f1e2]/10">
        <span className="text-sm text-[#08030f]/50 dark:text-[#f7f1e2]/50 cursor-pointer hover:text-[#08030f] dark:hover:text-[#f7f1e2] transition-colors">
          ← Getting Started
        </span>
        <span className="text-sm text-[#08030f]/50 dark:text-[#f7f1e2]/50 cursor-pointer hover:text-[#08030f] dark:hover:text-[#f7f1e2] transition-colors">
          Route Response →
        </span>
      </div> */}

      {/* Title */}
      {/* <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#08030f] dark:text-[#f7f1e2] mb-2.5 tracking-tight">
        API Reference
      </h1> */}
      <p className="mb-6 text-sm leading-relaxed text-[#08030f]/60 sm:text-base lg:text-lg dark:text-[#f7f1e2]/60">
        A FastAPI service that finds the best jeepney route between two
        coordinates — direct or with transfers. Returns polylines ready for
        React Native MapView.
      </p>

      {/* Callout */}
      <div className="mb-9 rounded-2xl border border-[#08030f]/10 bg-[#eeebe7]/60 p-4 sm:p-5 dark:border-[#f7f1e2]/10 dark:bg-[#1c1b24]">
        <p className="m-0 text-sm leading-relaxed text-[#08030f] lg:text-base dark:text-[#f7f1e2]">
          This is not a routing engine. It is how you add jeepney navigation to
          your app. The API reads from your local route and transfer spot JSON
          files, scores every candidate using a weighted algorithm, and returns
          structured polyline data — no external map dependencies at query time.
        </p>
      </div>

      {/* Introduction */}
      <h2 className="mb-2.5 text-xl font-bold tracking-tight text-[#08030f] sm:text-2xl lg:text-3xl dark:text-[#f7f1e2]">
        Introduction
      </h2>
      <p className="mb-2 text-sm leading-relaxed text-[#08030f]/60 lg:text-base dark:text-[#f7f1e2]/60">
        The API exposes a single route-finding endpoint. You send a start and
        destination coordinate pair; it returns the best jeepney path found,
        along with walking legs fetched from OpenRouteService for the board and
        alight portions.
      </p>
      <p className="mb-4 text-sm leading-relaxed text-[#08030f]/60 lg:text-base dark:text-[#f7f1e2]/60">
        The response is designed to map directly to a React Native / Expo
        MapView — every polyline uses{" "}
        <InlineCode>{"{latitude, longitude}"}</InlineCode> objects, not{" "}
        <InlineCode>{"[lng, lat]"}</InlineCode> arrays.
      </p>

      <h3 className="mb-2 text-base font-semibold text-[#08030f] sm:text-lg dark:text-[#f7f1e2]">
        How routing works
      </h3>
      <ul className="mb-4 space-y-1 pl-5">
        {howRoutingWorks.map(([label, text]) => (
          <li
            key={label}
            className="text-sm leading-relaxed text-[#08030f]/60 lg:text-base dark:text-[#f7f1e2]/60"
          >
            <strong className="font-semibold text-[#08030f] dark:text-[#f7f1e2]">
              {label}
            </strong>{" "}
            {text}
          </li>
        ))}
      </ul>

      <Divider />

      {/* Base URL */}
      <h2 className="mb-3 text-xl font-bold tracking-tight text-[#08030f] sm:text-2xl lg:text-3xl dark:text-[#f7f1e2]">
        Base URL
      </h2>
      <Card>
        <div className="p-4 sm:p-5 lg:p-6">
          <CodeBlock code="http://<host>:8000" />
          <NoteBox>
            Start the server with:{" "}
            <InlineCode>
              uvicorn main:app --reload --host 0.0.0.0 --port 8000
            </InlineCode>
          </NoteBox>
        </div>
      </Card>

      <Divider />

      {/* Endpoints */}
      <h2 className="mb-4 text-xl font-bold tracking-tight text-[#08030f] sm:text-2xl lg:text-3xl dark:text-[#f7f1e2]">
        Endpoints
      </h2>

      {/* GET /health */}
      <Card>
        <div className="flex items-center gap-2.5 border-b border-[#08030f]/10 p-4 sm:p-5 dark:border-[#f7f1e2]/10">
          <MethodBadge method="GET" />
          <span className="font-mono text-sm font-semibold text-[#08030f] lg:text-base dark:text-[#f7f1e2]">
            /health
          </span>
          <span className="ml-auto text-sm text-[#08030f]/50 lg:text-base dark:text-[#f7f1e2]/50">
            Health check
          </span>
        </div>
        <div className="p-4 sm:p-5 lg:p-6">
          <SectionLabel>Response</SectionLabel>
          <CodeBlock code={`{ "status": "ok" }`} />
        </div>
      </Card>

      {/* POST /route */}
      <Card>
        <div className="flex items-center gap-2.5 border-b border-[#08030f]/10 p-4 sm:p-5 dark:border-[#f7f1e2]/10">
          <MethodBadge method="POST" />
          <span className="font-mono text-sm font-semibold text-[#08030f] lg:text-base dark:text-[#f7f1e2]">
            /route
          </span>
          <span className="ml-auto text-sm text-[#08030f]/50 lg:text-base dark:text-[#f7f1e2]/50">
            Find best jeepney route
          </span>
        </div>

        <CardSection className="border-t-0">
          <SectionLabel>Request body — application/json</SectionLabel>
          <FieldRow
            name="start_lat"
            type="float"
            note="Starting latitude"
            required
          />
          <FieldRow
            name="start_lng"
            type="float"
            note="Starting longitude"
            required
          />
          <FieldRow
            name="dest_lat"
            type="float"
            note="Destination latitude"
            required
          />
          <FieldRow
            name="dest_lng"
            type="float"
            note="Destination longitude"
            required
          />
          <div className="mt-3">
            <CodeBlock
              code={`{
  "start_lat": 10.7202,
  "start_lng": 122.5621,
  "dest_lat":  10.7015,
  "dest_lng":  122.5690
}`}
            />
          </div>
        </CardSection>

        <CardSection>
          <SectionLabel>Response</SectionLabel>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="direct">type: &quot;direct&quot;</Badge>
            <Badge variant="transfer">type: &quot;transfer&quot;</Badge>
            <Badge variant="error">404 no route</Badge>
          </div>
          <CodeBlock
            code={`{
  "type":                "direct" | "transfer",
  "summary":             "10B" | "10B → 2A",
  "number_of_transfers": 0,
  "total_score":         1842.5,
  "total_distance_m":    3210.0,
  "total_duration_s":    null,      // null for direct routes
  "markers":             [...],     // map pins — see below
  "segments":            [...]      // one per jeepney leg — see below
}`}
          />
        </CardSection>

        <CardSection>
          <SectionLabel>markers</SectionLabel>
          <p className="mb-2 text-xs text-[#08030f]/60 lg:text-sm dark:text-[#f7f1e2]/60">
            Flat ordered list of map pins: start → board → alight (repeated per
            leg) → dest.
          </p>
          <CodeBlock
            code={`[
  { "type": "start",  "lat": 10.7202, "lng": 122.5621 },
  { "type": "board",  "lat": 10.7198, "lng": 122.5630, "route_number": "10B" },
  { "type": "alight", "lat": 10.7020, "lng": 122.5685, "route_number": "10B" },
  { "type": "dest",   "lat": 10.7015, "lng": 122.5690 }
]`}
          />
        </CardSection>

        <CardSection>
          <SectionLabel>segments — one object per jeepney leg</SectionLabel>
          <CodeBlock
            code={`{
  "segment_index":      0,
  "route_number":       "10B",
  "direction":          "Northbound",
  "board_point":        { "lat": 10.7198, "lng": 122.5630 },
  "alight_point":       { "lat": 10.7020, "lng": 122.5685 },
  "board_dist_m":       95.2,
  "alight_dist_m":      42.8,
  "jeepney_dist_m":     3072.0,
  "score":              1842.5,
  "transfer_spot_name": null,        // populated when a transfer follows
  "jeepney_polyline":   [{ "latitude": …, "longitude": … }],
  "walk_to_polyline":   [{ "latitude": …, "longitude": … }],  // ORS walking path
  "walk_from_polyline": [{ "latitude": …, "longitude": … }]   // ORS walking path
}`}
          />
          <NoteBox>
            Polyline points use{" "}
            <InlineCode>{"{latitude, longitude}"}</InlineCode> — the React
            Native / Expo MapView convention. Walking polylines are fetched from
            ORS after route selection; they fall back to a straight line if ORS
            is unavailable.
          </NoteBox>
        </CardSection>

        <CardSection>
          <SectionLabel>Error</SectionLabel>
          <CodeBlock
            code={`// HTTP 404\n{ "detail": "No route found within walking limits." }`}
          />
        </CardSection>
      </Card>

      <Divider />

      {/* Examples */}
      <h2 className="mb-4 text-xl font-bold tracking-tight text-[#08030f] sm:text-2xl lg:text-3xl dark:text-[#f7f1e2]">
        Examples
      </h2>
      <TabbedExamples />
    </div>
  )
}
