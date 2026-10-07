/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Download, Copy, Check, FileCode } from 'lucide-react';
import { MyLocation, PujaLocation, MapName } from '../data/pujaData';

export interface ExportHtmlModalProps {
  isOpen: boolean;
  onClose: () => void;
  myLocations: MyLocation[];
  pujaLocations: PujaLocation[];
  mapNames: MapName[];
  renderMapNames: boolean;
  rotation: number;
}

export const ExportHtmlModal: React.FC<ExportHtmlModalProps> = ({
  isOpen,
  onClose,
  myLocations,
  pujaLocations,
  mapNames,
  renderMapNames,
  rotation,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const buildStandaloneHtml = (): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Kolkata Street Map - Interactive Durga Puja Viewer</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #0f172a; overflow: hidden; height: 100vh; width: 100vw; }
    
    /* Top Bar */
    header { position: fixed; top: 0; left: 0; right: 0; height: 56px; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px); color: #fff; z-index: 40; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; border-bottom: 1px solid #334155; gap: 12px; }
    .brand { font-size: 15px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px; white-space: nowrap; }
    .brand-accent { color: #f97316; }
    .header-actions { display: flex; align-items: center; gap: 8px; }
    .btn { background: #1e293b; color: #e2e8f0; border: 1px solid #475569; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
    .btn:hover { background: #334155; color: #fff; }
    .btn-primary { background: #ea580c; border-color: #ea580c; color: #fff; }
    .btn-primary:hover { background: #c2410c; }
    
    /* Search Box */
    .search-container { position: relative; max-width: 380px; width: 100%; }
    .search-input { width: 100%; padding: 7px 12px 7px 32px; background: #1e293b; color: #fff; border: 1px solid #475569; border-radius: 10px; font-size: 12px; outline: none; }
    .search-input:focus { border-color: #f97316; }
    .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 12px; color: #94a3b8; pointer-events: none; }
    .search-results { position: absolute; top: 100%; left: 0; right: 0; margin-top: 6px; background: #0f172a; border: 1px solid #334155; border-radius: 10px; max-height: 320px; overflow-y: auto; z-index: 60; display: none; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .search-results.open { display: block; }
    .search-group-title { padding: 6px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: #1e293b; }
    .search-item { padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; border-bottom: 1px solid #1e293b; color: #e2e8f0; font-size: 12px; }
    .search-item:hover { background: #334155; color: #fff; }

    /* Map Container */
    #map-viewport { position: absolute; top: 56px; bottom: 0; left: 0; right: 0; overflow: hidden; background: #020617; cursor: grab; }
    #map-viewport:active { cursor: grabbing; }
    #map-stage { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; transform-origin: center center; will-change: transform; }
    #map-rotate-box { position: relative; display: inline-block; }
    #map-img { display: block; width: 1600px; height: auto; pointer-events: none; }
    #map-svg { position: absolute; inset: 0; width: 100%; height: 100%; }

    /* SVG Green Cover & Outlined Labels */
    .puja-polygon { cursor: pointer; transition: stroke 0.15s; }
    .puja-polygon:hover { stroke: #f97316; stroke-width: 3px; }
    .puja-polygon.selected { stroke: #ea580c; stroke-width: 4px; filter: drop-shadow(0 0 8px #ea580c); }
    .puja-label { font-family: ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 13px; fill: #0f172a; paint-order: stroke fill; stroke: #ffffff; stroke-width: 3.8px; stroke-linejoin: round; stroke-linecap: round; pointer-events: none; text-anchor: middle; dominant-baseline: middle; }
    
    /* Road Names Sharp Vector Overlay */
    .road-label { font-family: ui-sans-serif, system-ui, sans-serif; font-weight: 900; fill: #facc15; paint-order: stroke fill; stroke: #000000; stroke-width: 3.6px; stroke-linejoin: round; letter-spacing: 0.06em; pointer-events: none; text-anchor: middle; dominant-baseline: middle; user-select: none; }

    /* Spotlight Pin */
    @keyframes pulsePin { 0% { r: 12px; opacity: 1; } 100% { r: 40px; opacity: 0; } }
    .spotlight-circle { animation: pulsePin 1.5s infinite; }

    /* Zoom Controls HUD */
    .hud-controls { position: absolute; left: 16px; bottom: 20px; z-index: 30; display: flex; flex-direction: column; gap: 6px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px); padding: 6px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); border: 1px solid #cbd5e1; }
    .hud-btn { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; font-size: 18px; font-weight: bold; color: #1e293b; border-radius: 8px; cursor: pointer; }
    .hud-btn:hover { background: #f1f5f9; }

    /* Info Panel */
    #place-panel { position: fixed; top: 56px; right: 0; bottom: 0; width: 400px; background: #ffffff; color: #0f172a; box-shadow: -10px 0 30px rgba(0,0,0,0.3); z-index: 50; display: none; flex-direction: column; border-left: 1px solid #e2e8f0; }
    #place-panel.open { display: flex; animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    @media (max-width: 768px) {
      #place-panel { top: auto; left: 0; right: 0; bottom: 0; width: 100%; height: 75vh; border-radius: 24px 24px 0 0; border-top: 1px solid #e2e8f0; border-left: none; }
    }
    .panel-header { padding: 16px 20px 12px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
    .panel-title { font-size: 18px; font-weight: 700; color: #0f172a; }
    .panel-close { background: none; border: none; font-size: 20px; color: #64748b; cursor: pointer; padding: 4px; border-radius: 50%; }
    .panel-actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 12px 20px; border-bottom: 1px solid #f1f5f9; }
    .act-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px; border-radius: 10px; background: #f1f5f9; color: #0f172a; text-decoration: none; font-size: 11px; font-weight: 600; cursor: pointer; border: none; }
    .act-btn:hover { background: #e2e8f0; color: #ea580c; }
    .panel-body { padding: 20px; overflow-y: auto; flex: 1; font-size: 13px; line-height: 1.6; color: #334155; }
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; margin-bottom: 12px; }
    .info-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
  </style>
</head>
<body>

  <!-- Top Bar -->
  <header>
    <div class="brand">
      <span>🏛️ Kolkata <span class="brand-accent">Durga Puja</span> Map</span>
    </div>

    <!-- Search Box strictly for MAP_NAMES and Puja Names -->
    <div class="search-container">
      <span class="search-icon">🔍</span>
      <input type="text" id="map-search" class="search-input" placeholder="Search Puja pandal or street name...">
      <div id="search-dropdown" class="search-results"></div>
    </div>

    <div class="header-actions">
      <button class="btn" onclick="toggleRoadVectorNames()" id="btn-toggle-roads" title="Toggle Sharp Yellow Road Signs">
        🟡 Road Signs: <span id="road-toggle-state">${renderMapNames ? 'ON' : 'OFF'}</span>
      </button>
      <button class="btn" onclick="rotateMap()" title="Rotate Map 90°">
        🔄 <span id="rot-deg">${rotation}</span>°
      </button>
      <button class="btn btn-primary" onclick="resetView()">Reset View</button>
    </div>
  </header>

  <!-- Interactive Custom Map Viewport -->
  <div id="map-viewport">
    <div id="map-stage">
      <div id="map-rotate-box" style="transform: rotate(${rotation}deg);">
        <!-- Base Map Image (expects map.jpg in root or fallback to map.svg) -->
        <img id="map-img" src="map.jpg" onerror="this.onerror=null;this.src='map.svg';" alt="Kolkata Street Map" />

        <!-- Interactive Hotspots SVG Layer -->
        <svg id="map-svg" viewBox="0 0 1000 750" preserveAspectRatio="none">
          <defs>
            <!-- Authentic green diagonal hatch cover pattern identical to physical map -->
            <pattern id="greenHatchCover" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <rect width="10" height="10" fill="#d1fae5" />
              <line x1="0" y1="0" x2="0" y2="10" stroke="#16a34a" stroke-width="2.5" />
            </pattern>
          </defs>

          <!-- Puja Polygons & Labels Layer -->
          <g id="puja-layer"></g>

          <!-- Yellow Map Road Names Layer -->
          <g id="road-layer"></g>

          <!-- Spotlight Marker for Search Selection -->
          <g id="spotlight-layer"></g>
        </svg>
      </div>
    </div>
  </div>

  <!-- Zoom HUD Controls -->
  <div class="hud-controls">
    <button class="hud-btn" onclick="zoomIn()" title="Zoom In">+</button>
    <button class="hud-btn" onclick="zoomOut()" title="Zoom Out">−</button>
    <button class="hud-btn" onclick="resetView()" title="Fit to Screen" style="font-size: 13px;">⟲</button>
  </div>

  <!-- Place Info Panel -->
  <div id="place-panel">
    <div class="panel-header">
      <h2 id="p-name" class="panel-title">Puja Title</h2>
      <button class="panel-close" onclick="closePanel()">✕</button>
    </div>
    <div class="panel-actions">
      <a id="btn-dir" class="act-btn" target="_blank" rel="noopener">
        <span>🗺️</span>
        <span>Directions</span>
      </a>
      <a id="btn-maps" class="act-btn" target="_blank" rel="noopener">
        <span>📍</span>
        <span>Google Maps</span>
      </a>
      <a id="btn-call" class="act-btn">
        <span>📞</span>
        <span>Call</span>
      </a>
      <button class="act-btn" onclick="shareCurrent()">
        <span>↗️</span>
        <span>Share</span>
      </button>
    </div>
    <div class="panel-body">
      <div class="info-card">
        <div class="info-label">Description</div>
        <p id="p-desc">Pandal details and heritage notes.</p>
      </div>
      <div class="info-card">
        <div class="info-label">Schedule & Timings</div>
        <div id="p-date" style="font-weight: 600; margin-bottom: 4px;">Festival Schedule</div>
        <div id="p-time" style="color: #64748b;">Visiting Hours</div>
      </div>
      <div class="info-card">
        <div class="info-label">Address &amp; Metro Transit</div>
        <div id="p-addr" style="margin-bottom: 4px;">Street Address</div>
        <div id="p-dist" style="color: #64748b; font-size: 12px;">Distance guidance</div>
      </div>
    </div>
  </div>

  <script>
    // ===== SOURCE OF TRUTH DATA =====
    const MAP_IMAGE = "map.jpg";
    let MAP_ROTATION = ${rotation};
    const SHOW_IMAGE_NAMES = true;
    let RENDER_MAP_NAMES = ${renderMapNames};

    const MY_LOCATIONS = ${JSON.stringify(myLocations, null, 2)};
    const PUJA_LOCATIONS = ${JSON.stringify(pujaLocations, null, 2)};
    const MAP_NAMES = ${JSON.stringify(mapNames, null, 2)};

    let scale = 1, panX = 0, panY = 0, isDragging = false, startX = 0, startY = 0;
    let selectedPujaId = null;

    const viewport = document.getElementById('map-viewport');
    const stage = document.getElementById('map-stage');
    const rotateBox = document.getElementById('map-rotate-box');
    const pujaLayer = document.getElementById('puja-layer');
    const roadLayer = document.getElementById('road-layer');
    const spotlightLayer = document.getElementById('spotlight-layer');
    const panel = document.getElementById('place-panel');
    const searchInput = document.getElementById('map-search');
    const searchDropdown = document.getElementById('search-dropdown');

    function updateTransform() {
      stage.style.transform = "translate(" + panX + "px, " + panY + "px) scale(" + scale + ")";
    }

    function rotateMap() {
      MAP_ROTATION = (MAP_ROTATION + 90) % 360;
      document.getElementById('rot-deg').textContent = MAP_ROTATION;
      rotateBox.style.transform = "rotate(" + MAP_ROTATION + "deg)";
    }

    function toggleRoadVectorNames() {
      RENDER_MAP_NAMES = !RENDER_MAP_NAMES;
      document.getElementById('road-toggle-state').textContent = RENDER_MAP_NAMES ? 'ON' : 'OFF';
      renderRoadNames();
    }

    function zoomIn() { scale = Math.min(6, scale * 1.3); updateTransform(); }
    function zoomOut() { scale = Math.max(0.6, scale / 1.3); updateTransform(); }
    function resetView() { scale = 1; panX = 0; panY = 0; closePanel(); updateTransform(); }

    function centerOn(xPct, yPct, zoom) {
      scale = zoom || 2.2;
      const rect = viewport.getBoundingClientRect();
      const imgW = 1000 * scale;
      const imgH = 750 * scale;
      panX = -(xPct / 100) * imgW + rect.width / 2;
      panY = -(yPct / 100) * imgH + rect.height / 2;
      updateTransform();
    }

    // Render Polygons and Labels
    function renderPujas() {
      pujaLayer.innerHTML = '';
      PUJA_LOCATIONS.forEach(p => {
        const loc = MY_LOCATIONS.find(l => l.id === p.locationId) || { name: p.locationId };
        const pts = (p.maskPoints && p.maskPoints.length >= 3) ? p.maskPoints : p.points;
        const ptsStr = pts.map(pt => (pt[0]*10) + "," + (pt[1]*10)).join(" ");
        
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        poly.setAttribute('points', ptsStr);
        poly.setAttribute('fill', 'url(#greenHatchCover)');
        poly.setAttribute('stroke', '#166534');
        poly.setAttribute('stroke-width', '1.5');
        poly.setAttribute('class', 'puja-polygon');
        poly.id = 'poly-' + p.locationId;
        poly.onclick = (e) => { e.stopPropagation(); selectPuja(p.locationId); };

        // Outlined custom bold name label
        const cx = (p.labelPosition ? p.labelPosition[0] : pts.reduce((s, c) => s + c[0], 0) / pts.length) * 10;
        const cy = (p.labelPosition ? p.labelPosition[1] : pts.reduce((s, c) => s + c[1], 0) / pts.length) * 10;
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', cx);
        text.setAttribute('y', cy);
        text.setAttribute('class', 'puja-label');
        text.textContent = loc.name;

        g.appendChild(poly);
        g.appendChild(text);
        pujaLayer.appendChild(g);
      });
    }

    // Render Sharp Yellow Road Names (when RENDER_MAP_NAMES is true)
    function renderRoadNames() {
      roadLayer.innerHTML = '';
      if (!RENDER_MAP_NAMES) return;

      MAP_NAMES.forEach(road => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const sx = road.position[0] * 10;
        const sy = road.position[1] * 10;
        g.setAttribute('transform', 'translate(' + sx + ',' + sy + ') rotate(' + road.angle + ')');

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 0);
        text.setAttribute('y', 0);
        text.setAttribute('class', 'road-label');
        text.setAttribute('font-size', (road.size || 12) + 'px');
        text.textContent = road.text;

        g.appendChild(text);
        roadLayer.appendChild(g);
      });
    }

    function selectPuja(id) {
      selectedPujaId = id;
      document.querySelectorAll('.puja-polygon').forEach(el => el.classList.remove('selected'));
      const activePoly = document.getElementById('poly-' + id);
      if (activePoly) activePoly.classList.add('selected');

      const loc = MY_LOCATIONS.find(l => l.id === id);
      if (!loc) return;

      const pLoc = PUJA_LOCATIONS.find(p => p.locationId === id);
      if (pLoc) {
        const cx = pLoc.labelPosition ? pLoc.labelPosition[0] : pLoc.points.reduce((s, c) => s + c[0], 0) / pLoc.points.length;
        const cy = pLoc.labelPosition ? pLoc.labelPosition[1] : pLoc.points.reduce((s, c) => s + c[1], 0) / pLoc.points.length;
        centerOn(cx, cy, 2.3);
      }

      document.getElementById('p-name').textContent = loc.name;
      document.getElementById('p-desc').textContent = loc.description || 'Traditional Kolkata Durga Puja Festival.';
      document.getElementById('p-date').textContent = loc.date || 'Puja Festival Days';
      document.getElementById('p-time').textContent = loc.time || (loc.openingTime ? loc.openingTime + ' - ' + loc.closingTime : 'Open 24 hours');
      document.getElementById('p-addr').textContent = loc.address;
      document.getElementById('p-dist').textContent = loc.distanceInfo || 'Accessible via North/Central Kolkata transit.';

      document.getElementById('btn-dir').href = 'https://www.google.com/maps/dir/?api=1&destination=' + loc.latitude + ',' + loc.longitude;
      document.getElementById('btn-maps').href = loc.googleMapsUrl || 'https://www.google.com/maps/search/?api=1&query=' + loc.latitude + ',' + loc.longitude;
      document.getElementById('btn-call').href = loc.phone ? 'tel:' + loc.phone.replace(/\\s+/g, '') : '#';

      panel.classList.add('open');
    }

    function selectRoad(roadId) {
      closePanel();
      const road = MAP_NAMES.find(r => r.id === roadId);
      if (!road) return;

      centerOn(road.position[0], road.position[1], 2.4);

      // Trigger spotlight marker
      spotlightLayer.innerHTML = '';
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const sx = road.position[0] * 10;
      const sy = road.position[1] * 10;
      g.setAttribute('transform', 'translate(' + sx + ',' + sy + ')');

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', 0);
      circle.setAttribute('cy', 0);
      circle.setAttribute('r', 25);
      circle.setAttribute('fill', 'rgba(250, 204, 21, 0.4)');
      circle.setAttribute('stroke', '#eab308');
      circle.setAttribute('stroke-width', '3');
      circle.setAttribute('class', 'spotlight-circle');

      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', 0);
      dot.setAttribute('cy', 0);
      dot.setAttribute('r', 10);
      dot.setAttribute('fill', '#facc15');

      g.appendChild(circle);
      g.appendChild(dot);
      spotlightLayer.appendChild(g);

      setTimeout(() => { spotlightLayer.innerHTML = ''; }, 4000);
    }

    function closePanel() {
      selectedPujaId = null;
      document.querySelectorAll('.puja-polygon').forEach(el => el.classList.remove('selected'));
      panel.classList.remove('open');
    }

    function shareCurrent() {
      const loc = MY_LOCATIONS.find(l => l.id === selectedPujaId);
      if (!loc) return;
      if (navigator.share) {
        navigator.share({ title: loc.name, text: loc.name + ' - ' + loc.address, url: window.location.href });
      } else {
        navigator.clipboard.writeText(loc.name + '\\n' + loc.address);
        alert('Copied ' + loc.name + ' details to clipboard!');
      }
    }

    // Search Engine (strictly local data)
    function setupSearch() {
      searchInput.oninput = (e) => {
        const val = e.target.value.trim().toLowerCase();
        if (!val) { searchDropdown.classList.remove('open'); return; }

        const matchedPujas = MY_LOCATIONS.filter(p => p.name.toLowerCase().includes(val) || (p.address && p.address.toLowerCase().includes(val)));
        const matchedRoads = MAP_NAMES.filter(r => r.text.toLowerCase().includes(val));

        if (matchedPujas.length === 0 && matchedRoads.length === 0) {
          searchDropdown.innerHTML = '<div style="padding: 12px; font-size: 11px; color: #94a3b8; text-align: center;">No matches found in map data.</div>';
          searchDropdown.classList.add('open');
          return;
        }

        let html = '';
        if (matchedPujas.length > 0) {
          html += '<div class="search-group-title" style="color: #34d399;">🟢 Durga Puja Pandals (' + matchedPujas.length + ')</div>';
          matchedPujas.forEach(p => {
            html += '<div class="search-item" onclick="selectPuja(\\'' + p.id + '\\'); searchDropdown.classList.remove(\\'open\\'); searchInput.value=\\'\\';"><span>' + p.name + '</span><small style="color: #94a3b8; font-size: 10px;">Pandal</small></div>';
          });
        }
        if (matchedRoads.length > 0) {
          html += '<div class="search-group-title" style="color: #fbbf24;">🟡 Streets &amp; Locations (' + matchedRoads.length + ')</div>';
          matchedRoads.forEach(r => {
            html += '<div class="search-item" onclick="selectRoad(\\'' + r.id + '\\'); searchDropdown.classList.remove(\\'open\\'); searchInput.value=\\'\\';"><span style="color: #fde047; font-weight: bold;">' + r.text + '</span><small style="color: #94a3b8; font-size: 10px;">Road</small></div>';
          });
        }

        searchDropdown.innerHTML = html;
        searchDropdown.classList.add('open');
      };

      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
          searchDropdown.classList.remove('open');
        }
      });
    }

    // Pan & Zoom Listeners
    viewport.onwheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      scale = Math.min(6, Math.max(0.6, scale * factor));
      updateTransform();
    };

    viewport.onmousedown = (e) => {
      if (e.target.id === 'map-svg' || e.target.id === 'map-viewport') {
        closePanel();
      }
      isDragging = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
    };
    window.onmousemove = (e) => {
      if (!isDragging) return;
      panX = e.clientX - startX;
      panY = e.clientY - startY;
      updateTransform();
    };
    window.onmouseup = () => { isDragging = false; };

    // Keyboard ESC listener
    window.onkeydown = (e) => {
      if (e.key === 'Escape') {
        closePanel();
        searchDropdown.classList.remove('open');
      }
    };

    renderPujas();
    renderRoadNames();
    setupSearch();
  </script>
</body>
</html>`;
  };

  const handleDownload = () => {
    const html = buildStandaloneHtml();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kolkata-puja-map.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(buildStandaloneHtml());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-lg">Export Standalone Single-File HTML</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Generates a <strong>100% self-contained, zero-dependency HTML file</strong> with your exact
          coordinates, custom labels, road signs, and base map viewer. It runs anywhere without a server, Node.js,
          or build tools.
        </p>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
          <div>• File: <span className="text-emerald-400">kolkata-puja-map.html</span></div>
          <div>• Base map: <span className="text-orange-400">map.jpg</span> (or fallback SVG)</div>
          <div>• Puja Locations: <span className="text-white">{myLocations.length}</span></div>
          <div>• Polygons &amp; Covers: <span className="text-white">{pujaLocations.length}</span></div>
          <div>• Road Signs: <span className="text-amber-400">{mapNames.length}</span></div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied HTML!' : 'Copy Code'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl shadow-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download HTML File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
