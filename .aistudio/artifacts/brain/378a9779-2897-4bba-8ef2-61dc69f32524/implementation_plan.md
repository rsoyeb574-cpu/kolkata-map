# Kolkata Street Map – Interactive Durga Puja Viewer & Area Mapper

A specialized cartographic web application using an authentic scanned street map of Kolkata as the fixed visual base, replacing printed text on green hatched Puja locations with custom user labels, and featuring a slide-over place card with optional Google Places API integration.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed during initial clarification:
> - **Map Image Source**: Strict file reference expecting `map.jpg` in the root/public directory, with a clear fallback notification and custom scan drop-in trigger if `map.jpg` is initially unplaced.
> - **Runtime & Deliverable Architecture**: Full React/Vite interactive application with instant one-click **"Export Single-File Standalone HTML"** feature, providing both modern runtime performance and a zero-dependency self-contained distribution file.
> - **Edit Mode & Coordinate Workflow**: Built-in visual polygon editor (toggle with `E` key or top bar button) that displays percentage coordinates, live polygon preview, mask point adjusting, and generates ready-to-copy code snippets directly for `MY_LOCATIONS` and `PUJA_LOCATIONS`.

---

### 1. Overview & Core Concept

- **What It Does**: Renders an authentic scanned Kolkata street map containing yellow/black road signage, pink route markings, and green hatched Puja locations. For each green Puja area, the app draws an SVG hatch cover that conceals legacy printed text while displaying the user's custom name in crisp, outlined typography. Clicking an area highlights it with a saffron border and opens an information card with photo carousels, schedule details, directions, and Google Places data.
- **Target Audience / Persona**: Kolkata Durga Puja parikrama visitors, neighborhood guides, festival committees, and map curators who need exact street-level scanned cartography without Google base tile replacement.
- **Key Value**: 100% fidelity to the scanned physical map, strict zero-hallucination data discipline (only user-provided Pujas are rendered), and seamless in-browser polygon geometry adjustment.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Exploration & Navigation**:
   - The user pans via mouse drag or touch, zooms via scroll wheel or pinch gestures (fit-to-screen to 6x zoom limit).
   - The North orientation can be adjusted with `MAP_ROTATION` (0°, 90°, 180°, 270°) or an on-screen rotation switch.
   - Road names (yellow/black) and route markings (pink) remain untouched. Only green hatched Puja zones have interactive SVG overlays.
2. **Selection & Place Sheet**:
   - Hovering over a green zone reveals a subtle glow.
   - Clicking a zone smoothly centers it, outlines the polygon in warm saffron with a pulsing halo, and opens the place card.
   - Desktop: 380px wide sliding drawer from the right. Mobile: Draggable bottom sheet with generous touch targets (≥44px).
   - Tabs: *Overview*, *Photos*, *Reviews*, *About*.
   - Direct action buttons: Directions (Google Maps route URL), View on Google Maps, Call, Share, and Copy Address.
   - Clicking empty map or pressing `Esc` dismisses the drawer and selection.
3. **Edit Mode (`E` key or toolbar button)**:
   - Toggles interactive crosshairs and coordinate tool.
   - Allows clicking points on the map to trace new polygons or adjust click areas, mask areas, and label positions.
   - Generates formatted JSON snippets ready to paste into `PUJA_LOCATIONS`.

#### Visual Identity & Theme
- **Color Palette**:
  - Dominant Canvas: Warm neutral slate (`#0f172a` viewport frame with `#f8fafc` clean paper backdrop).
  - Accent Tone: Traditional Deep Saffron (`#ea580c` / `#f97316`) for active borders, call-to-actions, and active tab indicators.
  - Green Hatch Mask: Authentic `#22c55e` / `#16a34a` 45° diagonal SVG hatch pattern matched to the physical scan tint.
  - Typography: Outlined high-contrast labels (`#0f172a` text with `3px` white halo stroke) for map legibility.
- **Typography & Hierarchy**:
  - Headings: Bold, crisp sans-serif (`Cabinet Grotesk` or system geometric sans).
  - Body: Refined clean sans (`Plus Jakarta Sans` or modern UI system stack).
  - Coordinates & Code Snippets: Monospace with tabular figures.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: SVG Masking Over Canvas Redraw**
  - *Chosen Approach*: Use an SVG overlay layer placed directly over the base `<img>` inside the transformable map stage. The SVG defines `<pattern>` diagonal hatching and `<polygon>` elements with `<text>` labels.
  - *Why*: SVG retains infinite crispness during CSS zoom transforms, scales vector coordinates proportionally (0–100%), and cleanly isolates pointer events.
- **Decision 2: Strict Data Sovereignty (Zero Google Injections)**
  - *Chosen Approach*: All rendered map locations come exclusively from the user's `MY_LOCATIONS` array.
  - *Why*: Ensures no nearby shops, commercial pins, or unauthorized markers populate the map. Google Places API (New) is invoked strictly for the single selected Puja if `placeId` is provided.
- **Decision 3: Standalone HTML Generator**
  - *Chosen Approach*: The React app includes an "Export Standalone HTML" utility that serializes the active state, scripts, and base styles into a single zero-dependency HTML file suitable for offline use or GitHub Pages.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   Top Navigation Bar                   │
│   [Title & Stats]   —   [Zoom / Reset / Rotate]   —    │
│   [Edit Mode 'E']   —   [Export Standalone HTML]       │
└───────────────────────────────────┬────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────┐
│              Map Viewport Container                    │
│   ┌────────────────────────────────────────────────┐   │
│   │ Zoom & Pan Transform Stage (will-change)        │   │
│   │  ├── Base Map Scan (<img src="map.jpg" />)     │   │
│   │  ├── SVG Mask & Cover Layer (diagonal hatch)   │   │
│   │  ├── SVG Custom Label Layer (halo stroke)      │   │
│   │  ├── SVG Interactive Click Hotspots            │   │
│   │  └── Edit Mode Overlay (live crosshairs & path)│   │
│   └────────────────────────────────────────────────┘   │
└───────────────────┬────────────────────────────────────┘
                    │
                    ▼ Selection Event
┌────────────────────────────────────────────────────────┐
│       Place Details Drawer (Desktop: 380px / Mobile)   │
│  ├── Photo Strip (User photos + Google Places photos)  │
│  ├── Title (User name strictly) & Rating Stars         │
│  ├── Action Bar (Directions, View Maps, Call, Share)   │
│  ├── Schedule, Timings & Description                   │
│  ├── Address & Location Distance Info                  │
│  ├── Google Places Reviews (top 3-5 with attribution)  │
│  └── Maps Embed Preview (loaded on demand)             │
└────────────────────────────────────────────────────────┘
```

#### Core Data Structures
```typescript
interface MyLocation {
  id: string;
  name: string;             // Displayed exactly as written
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string;         // Optional Google Place ID
  description?: string;
  date?: string;
  time?: string;
  openingTime?: string;
  closingTime?: string;
  phone?: string;
  photos?: string[];
  googleMapsUrl?: string;
  distanceInfo?: string;
}

interface PujaLocation {
  locationId: string;       // Matches MyLocation.id
  shape: 'polygon' | 'rect';
  points: [number, number][];      // [[x%, y%], ...]
  maskPoints?: [number, number][];  // Optional cover expansion
  labelPosition?: [number, number]; // [x%, y%]
  labelSize?: number;              // Font size in px/pct
}
```

#### Verification & Delivery Plan
1. **Base Map & Transform Engine**: Mouse drag, touch pinch, scroll zoom, and rotation (0°, 90°, 180°, 270°).
2. **SVG Mask & Hatch Cover**: Pattern-filled polygons hiding old printed text and displaying outlined labels.
3. **Place Drawer Component**: Responsive layout with tabs, actions, photo strip, and fallback handling.
4. **Google Places Service**: Client-side fetcher with sessionStorage caching and fail-safe fallback.
5. **Interactive Edit Mode**: Coordinate HUD, click-to-point polygon builder, and ready-to-paste code exporter.
6. **Documentation & README**: Clear guide for coordinates, Place IDs, API keys, and deployment.
7. **Compilation Check**: Full build verification via `compile_applet`.
