/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ============================================================================
// 1. GLOBAL MAP CONFIGURATION & NAMES CONFIG
// ============================================================================
export const MAP_IMAGE = "map.jpg";
export const MAP_ROTATION = 0; // 0, 90, 180, 270 degrees

export const SHOW_IMAGE_NAMES = true;   // true = keep original printed yellow names from the image
export const RENDER_MAP_NAMES = false;  // true = also draw the names from MAP NAMES on top as sharp yellow text with black outline (stays crisp at high zoom)

export interface MapName {
  id: string;
  text: string;                  // EXACT NAME AS PRINTED
  position: [number, number];   // [x%, y%] of the image
  angle: number;                 // rotation in degrees to follow road direction
  size: number;                  // font size in px (e.g. 12)
}

export interface MyLocation {
  id: string;
  name: string;          // shown exactly as written (also used as the green-area label)
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string;      // optional Google Place ID
  description?: string;
  date?: string;
  time?: string;
  openingTime?: string;
  closingTime?: string;
  phone?: string;
  photos?: string[];     // image URLs
  googleMapsUrl?: string;// optional; if empty build from lat/lng
  distanceInfo?: string; // e.g. "5 min walk from College Street"
}

export interface PujaLocation {
  locationId: string;              // must match an id in MY LOCATIONS
  shape?: "polygon" | "rect";
  points: [number, number][];      // click area [[x%, y%], ...]
  maskPoints?: [number, number][]; // optional, covers old printed text
  labelPosition?: [number, number] | null; // optional [x%, y%]
  labelSize?: number | null;       // optional font size
}

// ============================================================================
// 2. MY LOCATIONS (SOURCE OF TRUTH)
// Add 10, 20, 50+ locations here. My provided name is ALWAYS displayed.
// ============================================================================
export const MY_LOCATIONS: MyLocation[] = [
  {
    id: "puja-1",
    name: "College Square Sarbojanin",
    address: "53, College Street, College Square, Bowbazar, Kolkata, West Bengal 700073",
    latitude: 22.5744,
    longitude: 88.3639,
    placeId: "",
    description: "Renowned for its breathtaking luminous pandal reflected across the historical College Square water reservoir. Established in 1948, celebrated for classical lighting displays and heritage atmosphere.",
    date: "Maha Sasthi to Bijoya Dashami (October 2026)",
    time: "Open 24 Hours during Puja Days",
    openingTime: "06:00 AM",
    closingTime: "04:00 AM",
    phone: "+91 33 2241 1234",
    photos: [
      "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1000&q=80"
    ],
    googleMapsUrl: "https://maps.google.com/?cid=1234567890",
    distanceInfo: "2 min walk from Central Metro Station (Gate 4) or MG Road crossing."
  },
  {
    id: "puja-2",
    name: "Md. Ali Park Durga Puja",
    address: "Mahatma Gandhi Road, Chittaranjan Avenue Crossing, Bowbazar, Kolkata 700073",
    latitude: 22.5786,
    longitude: 88.3601,
    placeId: "",
    description: "Famous for architectural pandal replicas representing grand monuments, palaces, and temples from across the world with exquisite artisan craftsmanship.",
    date: "Maha Sasthi to Bijoya Dashami",
    time: "Open 24 Hours",
    openingTime: "08:00 AM",
    closingTime: "03:00 AM",
    phone: "+91 33 2219 5678",
    photos: [
      "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1000&q=80"
    ],
    googleMapsUrl: "",
    distanceInfo: "Directly located at the intersection of MG Road and Central Avenue."
  },
  {
    id: "puja-3",
    name: "Santosh Mitra Square",
    address: "Lebutala, 1, Rammohan Roy Sarani, Bowbazar, Kolkata, West Bengal 700012",
    latitude: 22.5678,
    longitude: 88.3664,
    placeId: "",
    description: "Known for extravagant theme-based pandal architecture, laser light extravaganzas, and mesmerizing jewelry adornment of the deity.",
    date: "Maha Sasthi to Dashami",
    time: "10:00 AM - 04:00 AM",
    openingTime: "10:00 AM",
    closingTime: "04:00 AM",
    phone: "+91 98301 23456",
    photos: [
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1000&q=80"
    ],
    googleMapsUrl: "",
    distanceInfo: "5 min walk from Sealdah Station or Central Metro."
  },
  {
    id: "puja-4",
    name: "Chaltabagan Sarbojanin",
    address: "Raja Rammohan Roy Sarani, Maniktala, Kolkata, West Bengal 700009",
    latitude: 22.5843,
    longitude: 88.3712,
    placeId: "",
    description: "Established in 1943. Known for creative eco-friendly idol themes, Dhunuchi dance competitions, and vibrant neighborhood community bonding.",
    date: "Maha Panchami to Dashami",
    time: "24 Hours Open",
    openingTime: "07:00 AM",
    closingTime: "02:00 AM",
    phone: "+91 98310 98765",
    photos: [
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1000&q=80"
    ],
    googleMapsUrl: "",
    distanceInfo: "Near Amherst Street post office & Vivekananda Road junction."
  },
  {
    id: "puja-5",
    name: "Simla Vyayam Samiti",
    address: "Vivekananda Road, Simla, Girish Park, Kolkata, West Bengal 700006",
    latitude: 22.5872,
    longitude: 88.3621,
    placeId: "",
    description: "Historic traditional Puja founded in 1926 by national freedom fighters. Features iconic traditional 'Ekchala' clay sculpture and spiritual grandeur.",
    date: "Maha Sasthi to Dashami",
    time: "06:00 AM - 02:00 AM",
    openingTime: "06:00 AM",
    closingTime: "02:00 AM",
    phone: "+91 33 2272 4567",
    photos: [],
    googleMapsUrl: "",
    distanceInfo: "2 min walk from Girish Park Metro Station."
  },
  {
    id: "puja-6",
    name: "Bagbazar Sarbojanin",
    address: "Bagbazar Ghat Road, Bagbazar, North Kolkata, Kolkata 700003",
    latitude: 22.6025,
    longitude: 88.3668,
    placeId: "",
    description: "Over a century old (celebrating over 105 years), representing quintessential Bengali heritage with authentic Daaker Saaj idol and historic carnivals.",
    date: "Maha Sasthi to Dashami",
    time: "Open 24 Hours",
    openingTime: "05:00 AM",
    closingTime: "03:00 AM",
    phone: "+91 33 2555 7890",
    photos: [],
    googleMapsUrl: "",
    distanceInfo: "Next to Bagbazar Launch Ghat and Circular Railway station."
  },
  {
    id: "puja-7",
    name: "Kumartuli Park Durgotsav",
    address: "Kumartuli, Sovabazar, Kolkata, West Bengal 700005",
    latitude: 22.5992,
    longitude: 88.3644,
    placeId: "",
    description: "Nestled beside the historic idol-makers' enclave of Kumartuli. Blends traditional artisan reverence with visionary experimental pandal art.",
    date: "Maha Sasthi to Dashami",
    time: "08:00 AM - 03:00 AM",
    openingTime: "08:00 AM",
    closingTime: "03:00 AM",
    phone: "+91 98302 34567",
    photos: [],
    googleMapsUrl: "",
    distanceInfo: "4 min walk from Sovabazar Sutanuti Metro Station."
  },
  {
    id: "puja-8",
    name: "Jagat Mukherjee Park",
    address: "Jatindra Mohan Avenue, Sovabazar, Kolkata, West Bengal 700005",
    latitude: 22.5977,
    longitude: 88.3689,
    placeId: "",
    description: "Renowned for innovative mechanical, electrical, and motion installation themes that delight visitors of all ages.",
    date: "Maha Sasthi to Dashami",
    time: "10:00 AM - 02:00 AM",
    openingTime: "10:00 AM",
    closingTime: "02:00 AM",
    phone: "+91 33 2554 1122",
    photos: [],
    googleMapsUrl: "",
    distanceInfo: "Walking distance from Central Avenue north extension."
  }
];

// ============================================================================
// 3. PUJA LOCATIONS (MAP LINKING & POLYGONS)
// Links each green area on the image to its data.
// Coordinates are in percentages of image width (x%) and height (y%).
// ============================================================================
export const PUJA_LOCATIONS: PujaLocation[] = [
  {
    locationId: "puja-1",
    shape: "polygon",
    points: [
      [53.8, 65.0],
      [60.6, 65.0],
      [60.6, 72.5],
      [53.8, 72.5]
    ],
    maskPoints: [
      [53.2, 64.2],
      [61.2, 64.2],
      [61.2, 73.2],
      [53.2, 73.2]
    ],
    labelPosition: [57.2, 68.7],
    labelSize: 12
  },
  {
    locationId: "puja-2",
    shape: "polygon",
    points: [
      [28.8, 55.8],
      [36.3, 55.8],
      [36.3, 63.3],
      [28.8, 63.3]
    ],
    maskPoints: [
      [28.2, 55.0],
      [36.9, 55.0],
      [36.9, 64.0],
      [28.2, 64.0]
    ],
    labelPosition: [32.5, 59.5],
    labelSize: 12
  },
  {
    locationId: "puja-3",
    shape: "polygon",
    points: [
      [61.9, 81.7],
      [70.6, 81.7],
      [70.6, 90.0],
      [61.9, 90.0]
    ],
    maskPoints: [
      [61.2, 81.0],
      [71.3, 81.0],
      [71.3, 90.8],
      [61.2, 90.8]
    ],
    labelPosition: [66.2, 85.8],
    labelSize: 12
  },
  {
    locationId: "puja-4",
    shape: "polygon",
    points: [
      [71.9, 41.7],
      [81.3, 41.7],
      [81.3, 50.0],
      [71.9, 50.0]
    ],
    maskPoints: [
      [71.2, 41.0],
      [82.0, 41.0],
      [82.0, 50.8],
      [71.2, 50.8]
    ],
    labelPosition: [76.6, 45.8],
    labelSize: 12
  },
  {
    locationId: "puja-5",
    shape: "polygon",
    points: [
      [36.3, 31.7],
      [45.0, 31.7],
      [45.0, 39.2],
      [36.3, 39.2]
    ],
    maskPoints: [
      [35.6, 31.0],
      [45.7, 31.0],
      [45.7, 40.0],
      [35.6, 40.0]
    ],
    labelPosition: [40.6, 35.4],
    labelSize: 12
  },
  {
    locationId: "puja-6",
    shape: "polygon",
    points: [
      [13.8, 15.0],
      [22.5, 15.0],
      [22.5, 22.5],
      [13.8, 22.5]
    ],
    maskPoints: [
      [13.1, 14.2],
      [23.2, 14.2],
      [23.2, 23.3],
      [13.1, 23.3]
    ],
    labelPosition: [18.1, 18.7],
    labelSize: 12
  },
  {
    locationId: "puja-7",
    shape: "polygon",
    points: [
      [23.8, 23.3],
      [32.5, 23.3],
      [32.5, 30.8],
      [23.8, 30.8]
    ],
    maskPoints: [
      [23.1, 22.5],
      [33.2, 22.5],
      [33.2, 31.6],
      [23.1, 31.6]
    ],
    labelPosition: [28.1, 27.0],
    labelSize: 12
  },
  {
    locationId: "puja-8",
    shape: "polygon",
    points: [
      [45.6, 15.8],
      [54.4, 15.8],
      [54.4, 23.3],
      [45.6, 23.3]
    ],
    maskPoints: [
      [45.0, 15.0],
      [55.0, 15.0],
      [55.0, 24.1],
      [45.0, 24.1]
    ],
    labelPosition: [50.0, 19.5],
    labelSize: 12
  }
];

// Centroid calculator helper
export function computeCentroid(points: [number, number][]): [number, number] {
  if (!points || points.length === 0) return [50, 50];
  let sumX = 0;
  let sumY = 0;
  for (const [x, y] of points) {
    sumX += x;
    sumY += y;
  }
  return [
    Math.round((sumX / points.length) * 10) / 10,
    Math.round((sumY / points.length) * 10) / 10
  ];
}

// ============================================================================
// 4. MAP NAMES (YELLOW / BLACK ROAD & LOCATION NAMES)
// Read from yellow/black printed text on the map scan.
// Exactly as printed - never translated, shortened or renamed.
// Yellow names are NOT clickable and have no Google data. They are only labels.
// ============================================================================
export const MAP_NAMES: MapName[] = [
  { id: "n1", text: "M. G. ROAD", position: [61.2, 59.1], angle: 0, size: 13 },
  { id: "n2", text: "C. R. AVENUE (CENTRAL)", position: [25.0, 66.7], angle: -90, size: 12 },
  { id: "n3", text: "COLLEGE STREET", position: [53.8, 76.2], angle: -90, size: 12 },
  { id: "n4", text: "BIDHAN SARANI", position: [49.4, 31.7], angle: -90, size: 12 },
  { id: "n5", text: "VIVEKANANDA ROAD", position: [59.7, 34.1], angle: 0, size: 13 },
  { id: "n6", text: "AMHERST STREET", position: [70.9, 58.3], angle: -90, size: 11 },
  { id: "n7", text: "B. B. GANGULY ST (BOWBAZAR)", position: [43.1, 86.6], angle: 0, size: 13 },
  { id: "n8", text: "BAGBAZAR STREET", position: [36.9, 17.3], angle: 0, size: 12 },
  { id: "n9", text: "A. P. C. ROAD", position: [88.4, 47.1], angle: -90, size: 12 }
];

