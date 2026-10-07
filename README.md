# Kolkata Street Map – Interactive Durga Puja Viewer & Area Mapper

An interactive web application built specifically for physical scanned street maps of Kolkata. It keeps the scanned street map as the permanent visual base (retaining yellow/black road signage and pink route markings), uses SVG diagonal hatch covers to obscure old printed text over green Puja areas, overlays your custom names in crisp halo-outlined typography, and opens a Google-Maps-style place details drawer when clicked.

---

## Table of Contents
1. [Base Map Configuration (`map.jpg` & Orientation)](#1-base-map-configuration)
2. [Names System (`MAP_NAMES` & `PUJA_LOCATIONS`)](#2-names-system-yellow-names--green-puja-names)
3. [Local Search Engine (Zero Google Data)](#3-local-search-engine)
4. [How to Replace Placeholder Data](#4-how-to-replace-placeholder-data)
5. [How to Use Edit Mode (Polygons & Road Names)](#5-how-to-use-edit-mode)
6. [How to Find Latitude & Longitude](#6-how-to-find-latitude--longitude)
7. [How to Find Google Place IDs](#7-how-to-find-google-place-ids)
8. [Setting Up the Google API Key Safely](#8-setting-up-the-google-api-key-safely)
9. [Single-File Standalone HTML Export](#9-single-file-standalone-html-export)
10. [Deployment Guide](#10-deployment-guide)

---

## 1. Base Map Configuration

At the very top of `src/App.tsx` and `src/data/pujaData.ts`:
```typescript
export const MAP_IMAGE = "map.jpg";
export const MAP_ROTATION = 0; // 0, 90, 180, or 270
```

---

## 2. Names System (Yellow Names + Green Puja Names)

There are two kinds of names, both coming **ONLY** from your data / the reference scan:

### A) Yellow/Black Road & Location Names (`MAP_NAMES`)
Stored in `src/data/pujaData.ts`:
```typescript
export const SHOW_IMAGE_NAMES = true;   // Keep original printed yellow names from image
export const RENDER_MAP_NAMES = false;  // Draw sharp yellow vector text with black outline

export const MAP_NAMES: MapName[] = [
  { id: "n1", text: "M. G. ROAD", position: [61.2, 59.1], angle: 0, size: 13 },
  { id: "n2", text: "C. R. AVENUE (CENTRAL)", position: [25.0, 66.7], angle: -90, size: 12 },
  { id: "n3", text: "COLLEGE STREET", position: [53.8, 76.2], angle: -90, size: 12 }
];
```
- **text**: Exactly as printed on the map. Never translated, shortened, or renamed.
- **angle**: Rotation degrees following the road direction.
- **position**: `[x%, y%]` of the image so it stays locked at any zoom or screen size.
- **Not Clickable**: Yellow names have no Google data and are not clickable cards; they are purely labels and search targets.

### B) Green Puja Names (`PUJA_LOCATIONS` + `MY_LOCATIONS`)
- Draws an opaque SVG cover polygon filled with light green + diagonal hatch over the printed text to conceal it completely.
- Displays **only** your provided name in bold typography with a clean white halo/outline.

---

## 3. Local Search Engine

The search box at the top of the map searches **ONLY** your `MAP_NAMES` and Puja names:
- **Puja selection**: Smoothly centers the map on the pandal, highlights the green area, and opens the place details card.
- **Road selection**: Smoothly centers the map on the road position and shows a temporary spotlight pulse without triggering Google or opening a place card.
- **Zero Google calls**: Search results are 100% computed from your local arrays.


- **Placing Your Image**: Place your scanned street map file into the project's root or `/public` folder named `map.jpg`.
- **Rotating the Scan**: If your scanned map has the North arrow pointing to the left, set `MAP_ROTATION = 90` or `270` to align North upwards. You can also click the **Rotate ↻** button in the top navigation bar to test rotations in real time.
- **In-App Image Loader**: You can also click the gear/slider icon in the top bar to drop or upload any high-resolution scanned map file directly in your browser.

---

## 2. How to Replace Placeholder Data

All locations are defined in `src/data/pujaData.ts` under `MY_LOCATIONS`. You can add 10, 20, 50+ locations.

### Data Schema
```typescript
{
  id: "puja-1",
  name: "College Square Sarbojanin",     // SHOWN EXACTLY AS WRITTEN on the map & in the card
  address: "53, College Street, Bowbazar, Kolkata, WB 700073",
  latitude: 22.5744,
  longitude: 88.3639,
  placeId: "",                            // Optional Google Place ID (e.g. ChIJ...)
  description: "Famous for classical luminous pandal reflected across the reservoir.",
  date: "Maha Sasthi to Bijoya Dashami",
  time: "Open 24 Hours during Puja Days",
  openingTime: "06:00 AM",
  closingTime: "04:00 AM",
  phone: "+91 33 2241 1234",
  photos: [
    "https://example.com/pandal1.jpg"
  ],
  googleMapsUrl: "",                      // Optional; if empty, generated from lat/lng
  distanceInfo: "2 min walk from Central Metro Station (Gate 4)"
}
```

### Strict Data Priority
- **Your Name is Sovereign**: The name rendered on the map and header is **ALWAYS** your provided name, never translated, shortened, or overridden by Google.
- **Priority**: Your filled fields override Google's data; Google only enriches empty fields (ratings, weekly hours, additional photos).

---

## 3. How to Use Edit Mode

Press **`E`** on your keyboard or click the **Edit Mode (E)** button in the top bar.

1. **Live Coordinate HUD**: Moving your cursor across the map shows exact percentage coordinates (`X: 42.1% · Y: 68.3%`). Click the coordinates to copy `[x, y]` to your clipboard.
2. **Select Target Puja**: Pick which Puja you want to map from the dropdown.
3. **Select Layer**:
   - **Click Area (`points`)**: The interactive click polygon.
   - **Cover Mask (`maskPoints`)**: The opaque diagonal hatch polygon that conceals old printed text.
   - **Label Position (`labelPosition`)**: Click once on the map to place where the custom name label should center.
4. **Drawing Points**: Click on the map to add vertices. You will see a live orange dashed outline.
   - Use **Undo** to remove the last point.
   - Use **Clear** to restart.
   - Click **Save** to update the Puja in memory.
5. **Exporting Code**: Click **Copy Code** in the Edit Mode bar. Paste the generated `PUJA_LOCATIONS` array directly into `src/data/pujaData.ts`.

---

## 4. How to Find Latitude & Longitude

To get the exact latitude and longitude for any pandal:
1. Open [Google Maps](https://maps.google.com) in your web browser.
2. Search or zoom in to the exact location (e.g., *College Square Kolkata*).
3. **Right-click** on the pin or location on Google Maps.
4. The first menu item will display coordinates like `22.57440, 88.36391`. Click it to copy to your clipboard.
5. Paste `22.5744` into `latitude` and `88.3639` into `longitude`.

---

## 5. How to Find Google Place IDs

A Google Place ID allows fetching real Google star ratings, reviews, and opening hours for the selected pandal.

1. Visit the official Google Place ID Finder:  
   👉 [Google Place ID Finder Tool](https://developers.google.com/maps/documentation/places/web-service/place-id)
2. In the search box on the map, type the organization or park name (e.g., `College Square Kolkata` or `Md Ali Park Kolkata`).
3. Click on the result marker to view the Place ID (a string starting with `ChIJ...`).
4. Copy the Place ID and paste it into `placeId: "ChIJ..."` in your `MY_LOCATIONS` entry.
5. If a temporary pandal doesn't have a Google Place listing, simply leave `placeId: ""` empty. The app will smoothly display your data without any errors.

---

## 6. Setting Up the Google API Key Safely

Directions and "View on Google Maps" buttons **work 100% without any API key**.

If you wish to enable the Places API (New) for reviews and ratings:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and enable **Places API (New)** and **Maps Embed API**.
3. Create an API Key in **Credentials**.
4. **Restrict the Key (CRITICAL)**:
   - **Application restriction**: Restrict by *Websites / HTTP referrers* (e.g., `https://yourdomain.com/*` or `http://localhost:*`).
   - **API restriction**: Restrict the key to only *Places API (New)* and *Maps Embed API*.
5. **Configuring the Key**:
   - In `.env`: Add `VITE_GOOGLE_MAPS_API_KEY="AIzaSy..."`
   - Or in production `window.ENV = { GOOGLE_MAPS_API_KEY: "AIzaSy..." };`
   - Or in the app: Click the **Settings (Sliders)** icon in the top navigation bar and paste your key. It is saved securely in your browser's local storage and never exposed remotely.

### Serverless Proxy Option (Vercel / Netlify)
If you prefer not to expose any key to the client, you can create a serverless proxy endpoint `/api/place`:
```javascript
// api/place.js (Vercel / Netlify serverless function)
export default async function handler(req, res) {
  const { placeId } = req.query;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  const response = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "rating,userRatingCount,reviews,photos,regularOpeningHours"
    }
  });
  const data = await response.json();
  res.status(200).json(data);
}
```

---

## 7. Single-File Standalone HTML Export

You can export the entire application as a **zero-dependency, single-file HTML app**:
1. Click **Export HTML** in the top navigation bar.
2. Click **Download HTML File** (`kolkata-puja-map.html`).
3. Double-click the file to open it in any browser! All coordinates, zoom/pan handlers, opaque SVG hatch covers, and place cards work immediately without Node.js or any build tool.

---

## 8. Deployment Guide

### Option A: Netlify / Vercel (Vite Build)
1. Push your repository to GitHub.
2. Link your repository in Netlify or Vercel.
3. Build Settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Add environment variable `VITE_GOOGLE_MAPS_API_KEY` (optional).

### Option B: GitHub Pages
1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Deploy the `dist` folder to GitHub Pages using the `gh-pages` package or GitHub Actions.
3. Or simply rename the exported `kolkata-puja-map.html` to `index.html` and place it in the root of your `gh-pages` branch.
