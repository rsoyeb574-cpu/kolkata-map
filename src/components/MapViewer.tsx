/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MyLocation, PujaLocation, MapName, computeCentroid } from '../data/pujaData';

export interface CenterTarget {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  zoom?: number;
  timestamp: number;
}

export interface MapViewerProps {
  mapImageSrc: string;
  rotation: number; // 0, 90, 180, 270
  myLocations: MyLocation[];
  pujaLocations: PujaLocation[];
  mapNames: MapName[];
  renderMapNames: boolean;
  selectedPujaId: string | null;
  onSelectPuja: (pujaId: string | null) => void;
  focusedMapNameId: string | null;
  centerTarget?: CenterTarget | null;
  // Edit mode props
  isEditMode: boolean;
  editModeTab?: 'puja' | 'names';
  editTargetId: string | null;
  editTargetField: 'points' | 'maskPoints' | 'labelPosition';
  selectedNameId?: string | null;
  onSelectName?: (nameId: string | null) => void;
  draftPoints: [number, number][];
  onDraftPointAdd: (point: [number, number]) => void;
  onAddNameAtCoords?: (coords: [number, number]) => void;
  onCursorMove?: (coords: { x: number; y: number } | null) => void;
}

export const MapViewer: React.FC<MapViewerProps> = ({
  mapImageSrc,
  rotation,
  myLocations,
  pujaLocations,
  mapNames,
  renderMapNames,
  selectedPujaId,
  onSelectPuja,
  focusedMapNameId,
  centerTarget,
  isEditMode,
  editModeTab = 'puja',
  editTargetId,
  editTargetField,
  selectedNameId,
  onSelectName,
  draftPoints,
  onDraftPointAdd,
  onAddNameAtCoords,
  onCursorMove,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Transform state: scale, panX, panY
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Touch pinch zoom state
  const touchDistanceRef = useRef<number | null>(null);

  // Hovered Puja state
  const [hoveredPujaId, setHoveredPujaId] = useState<string | null>(null);

  // Fallback image source if map.jpg fails to load
  const [actualImageSrc, setActualImageSrc] = useState<string>(mapImageSrc);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  useEffect(() => {
    setActualImageSrc(mapImageSrc);
  }, [mapImageSrc]);

  // Fast map lookup: locationId -> MyLocation
  const locationMap = useMemo(() => {
    const map = new Map<string, MyLocation>();
    for (const loc of myLocations) {
      map.set(loc.id, loc);
    }
    return map;
  }, [myLocations]);

  // Convert percentage points [[x%, y%], ...] to SVG polygon points string "x,y x,y ..."
  const formatPolygonPoints = useCallback((points: [number, number][]) => {
    return points.map(([x, y]) => `${x * 10},${y * 10}`).join(' ');
  }, []);

  // Helper to split long name into 2-3 lines
  const wrapText = useCallback((text: string, maxCharsPerLine = 14): string[] => {
    if (!text) return [];
    if (text.length <= maxCharsPerLine) return [text];

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    // Limit to max 3 lines to fit nicely inside the green area
    if (lines.length > 3) {
      return [lines[0], lines[1], lines.slice(2).join(' ')];
    }
    return lines;
  }, []);

  // Convert pointer event to percentage coordinates (0-100%) on the map image
  const getCoordinatesFromEvent = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const img = imageRef.current;
      if (!img) return null;
      const rect = img.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;

      const rawX = ((clientX - rect.left) / rect.width) * 100;
      const rawY = ((clientY - rect.top) / rect.height) * 100;

      // Clamp between 0% and 100%
      const x = Math.max(0, Math.min(100, Math.round(rawX * 10) / 10));
      const y = Math.max(0, Math.min(100, Math.round(rawY * 10) / 10));
      return { x, y };
    },
    []
  );

  // Center smoothly on a specific Puja when selected
  const centerOnPuja = useCallback((pujaLoc: PujaLocation) => {
    if (!containerRef.current || !imageRef.current) return;
    const [cx, cy] = pujaLoc.labelPosition || computeCentroid(pujaLoc.points);

    // Target scale: at least 2.0x for nice visibility
    const targetScale = 2.2;
    const container = containerRef.current.getBoundingClientRect();

    // Map image coordinate in pixels at targetScale
    const imgWidth = 1000 * targetScale; // standard normalized width
    const imgHeight = (1000 * (1200 / 1600)) * targetScale;

    // Center offset (leaving desktop right panel space into account)
    const targetX = -(cx / 100) * imgWidth + container.width / 2;
    const targetY = -(cy / 100) * imgHeight + container.height / 2;

    setScale(targetScale);
    setPan({ x: targetX, y: targetY });
  }, []);

  // Center when selected Puja changes externally
  useEffect(() => {
    if (selectedPujaId) {
      const found = pujaLocations.find((p) => p.locationId === selectedPujaId);
      if (found) {
        centerOnPuja(found);
      }
    }
  }, [selectedPujaId, pujaLocations, centerOnPuja]);

  // Center when centerTarget is requested (e.g. from Search bar for a Road or Puja)
  useEffect(() => {
    if (centerTarget && containerRef.current) {
      const targetScale = centerTarget.zoom || 2.2;
      const container = containerRef.current.getBoundingClientRect();
      const imgWidth = 1000 * targetScale;
      const imgHeight = (1000 * (1200 / 1600)) * targetScale;

      const targetX = -(centerTarget.x / 100) * imgWidth + container.width / 2;
      const targetY = -(centerTarget.y / 100) * imgHeight + container.height / 2;

      setScale(targetScale);
      setPan({ x: targetX, y: targetY });
    }
  }, [centerTarget]);

  // Mouse wheel zoom centered at cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newScale = Math.min(6.0, Math.max(0.6, scale * zoomFactor));

    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    // Maintain cursor focus point during zoom
    const newPanX = mouseX - (mouseX - pan.x) * (newScale / scale);
    const newPanY = mouseY - (mouseY - pan.y) * (newScale / scale);

    setScale(newScale);
    setPan({ x: newPanX, y: newPanY });
  };

  const isMouseDownRef = useRef<boolean>(false);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    isMouseDownRef.current = true;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Notify cursor coordinates for Edit Mode HUD
    if (onCursorMove) {
      const coords = getCoordinatesFromEvent(e.clientX, e.clientY);
      onCursorMove(coords);
    }

    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsDragging(false);
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;

    // Detect genuine click if drag was under 6px
    const dist = Math.hypot(e.clientX - dragStartRef.current.x, e.clientY - dragStartRef.current.y);
    if (dist < 6) {
      const coords = getCoordinatesFromEvent(e.clientX, e.clientY);
      if (coords) {
        if (isEditMode) {
          if (editModeTab === 'names') {
            onAddNameAtCoords?.([coords.x, coords.y]);
          } else {
            onDraftPointAdd([coords.x, coords.y]);
          }
        }
      }
    }
  };

  // Touch handlers for mobile pan & pinch-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { ...pan };
      touchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchDistanceRef.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
    } else if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);
      const factor = currentDist / touchDistanceRef.current;
      const newScale = Math.min(6.0, Math.max(0.6, scale * factor));
      setScale(newScale);
      touchDistanceRef.current = currentDist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchDistanceRef.current = null;
  };

  // Zoom controls
  const handleZoomIn = () => {
    setScale((s) => Math.min(6.0, s * 1.3));
  };

  const handleZoomOut = () => {
    setScale((s) => Math.max(0.6, s / 1.3));
  };

  const handleResetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    onSelectPuja(null);
  };

  // Handle clicking empty map
  const handleStageClick = (e: React.MouseEvent) => {
    // If not in edit mode and clicked on the background SVG (not a polygon)
    if (!isEditMode && e.target === e.currentTarget) {
      onSelectPuja(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-slate-900 select-none cursor-grab active:cursor-grabbing"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsDragging(false);
        if (onCursorMove) onCursorMove(null);
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Interactive Kolkata Street Map Viewer"
    >
      {/* Zoom and Navigation HUD Controls */}
      <div className="absolute left-4 bottom-6 z-20 flex flex-col gap-2 bg-white/95 backdrop-blur-md p-1.5 rounded-xl shadow-xl border border-slate-200">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-800 font-bold text-xl transition-colors cursor-pointer"
          title="Zoom In (+)"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-800 font-bold text-xl transition-colors cursor-pointer"
          title="Zoom Out (-)"
          aria-label="Zoom out"
        >
          −
        </button>
        <div className="w-full h-px bg-slate-200 my-0.5" />
        <button
          onClick={handleResetView}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          title="Reset View"
          aria-label="Reset map view"
        >
          Fit
        </button>
      </div>

      {/* Map Zoom Level Indicator */}
      <div className="absolute left-4 top-20 z-20 px-2.5 py-1 bg-slate-900/80 backdrop-blur-md rounded-md text-[11px] font-mono text-white/90 border border-slate-700 pointer-events-none tabular-nums">
        Zoom: {Math.round(scale * 100)}%
      </div>

      {/* Map Transform Stage */}
      <div
        className="absolute inset-0 flex items-center justify-center origin-center"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transition: isDragging ? 'none' : 'transform 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform',
        }}
      >
        {/* Rotation container (0, 90, 180, 270 deg) */}
        <div
          className="relative inline-block max-w-none transition-transform duration-300"
          style={{
            transform: `rotate(${rotation}deg)`,
          }}
        >
          {/* Base Scanned Map Image (The permanent visual base map) */}
          <img
            ref={imageRef}
            src={actualImageSrc}
            alt="Scanned Street Map of Kolkata"
            referrerPolicy="no-referrer"
            className="block max-w-none w-[1200px] md:w-[1440px] xl:w-[1600px] h-auto pointer-events-none shadow-2xl"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              if (actualImageSrc !== '/map.svg') {
                setActualImageSrc('/map.svg');
              }
            }}
          />

          {/* SVG Overlay Layer: Masks old printed text, shows user labels, handles clicks */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
            onClick={handleStageClick}
          >
            <defs>
              {/* OPAQUE Green Diagonal Hatch Cover Pattern */}
              {/* Exactly overlays green Puja areas, completely covering legacy printed text */}
              <pattern
                id="pujaGreenHatchCover"
                width="12"
                height="12"
                patternTransform="rotate(45 0 0)"
                patternUnits="userSpaceOnUse"
              >
                {/* Opaque solid light green fill to hide old printed text */}
                <rect width="12" height="12" fill="#bbf7d0" />
                {/* Clean dark green diagonal hatching lines */}
                <line x1="0" y1="0" x2="0" y2="12" stroke="#15803d" stroke-width="2.4" />
              </pattern>

              {/* Saffron Glow Filter for Selected Puja */}
              <filter id="saffronGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#ea580c" floodOpacity="0.85" />
              </filter>

              {/* Subtle hover shadow */}
              <filter id="hoverGlow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f97316" floodOpacity="0.6" />
              </filter>
            </defs>

            {/* Render all Puja Locations */}
            {pujaLocations.map((pujaLoc) => {
              const locationData = locationMap.get(pujaLoc.locationId);
              const displayName = locationData ? locationData.name : pujaLoc.locationId;
              const isSelected = selectedPujaId === pujaLoc.locationId;
              const isHovered = hoveredPujaId === pujaLoc.locationId;
              const isEditingThis = isEditMode && editTargetId === pujaLoc.locationId;

              // Use maskPoints if defined to cover extra sticking out text, else use click points
              const coverPoints =
                pujaLoc.maskPoints && pujaLoc.maskPoints.length >= 3
                  ? pujaLoc.maskPoints
                  : pujaLoc.points;

              // Polygon coordinates scaled to 1000x1000 SVG viewBox
              const coverPointsString = formatPolygonPoints(coverPoints);
              const clickPointsString = formatPolygonPoints(pujaLoc.points);

              // Centroid or custom label position
              const [cx, cy] =
                pujaLoc.labelPosition || computeCentroid(pujaLoc.points);
              const svgLabelX = cx * 10;
              const svgLabelY = cy * 10;

              // Text wrapping & auto sizing
              const fontSize = pujaLoc.labelSize || 13;
              const wrappedLines = wrapText(displayName, 14);
              const lineHeight = fontSize * 1.25;
              const startY = svgLabelY - ((wrappedLines.length - 1) * lineHeight) / 2;

              return (
                <g
                  key={pujaLoc.locationId}
                  className="transition-all duration-150"
                  onMouseEnter={() => setHoveredPujaId(pujaLoc.locationId)}
                  onMouseLeave={() => setHoveredPujaId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isEditMode) {
                      onSelectPuja(pujaLoc.locationId);
                    }
                  }}
                  style={{ cursor: isEditMode ? 'crosshair' : 'pointer' }}
                >
                  {/* 1. OPAQUE SVG COVER POLYGON: Hides old printed text */}
                  <polygon
                    points={coverPointsString}
                    fill="url(#pujaGreenHatchCover)"
                    stroke={
                      isSelected
                        ? '#ea580c'
                        : isHovered
                        ? '#f97316'
                        : isEditingThis
                        ? '#2563eb'
                        : '#166534'
                    }
                    strokeWidth={isSelected ? 4 : isHovered ? 3 : isEditingThis ? 3 : 1.5}
                    filter={isSelected ? 'url(#saffronGlow)' : isHovered ? 'url(#hoverGlow)' : undefined}
                    strokeDasharray={isEditingThis ? '4 2' : undefined}
                    className={isSelected ? 'animate-pulse' : ''}
                  />

                  {/* 2. INVISIBLE HITBOX POLYGON (Ensures crisp clickability even if mask differs) */}
                  <polygon
                    points={clickPointsString}
                    fill="transparent"
                    stroke="none"
                    pointerEvents="all"
                  />

                  {/* 3. USER PROVIDED LABEL ONLY: Bold dark text with clean white halo */}
                  <text
                    x={svgLabelX}
                    y={svgLabelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 800,
                      fontSize: `${fontSize}px`,
                      fill: '#0f172a',
                      paintOrder: 'stroke fill',
                      stroke: '#ffffff',
                      strokeWidth: '3.8px',
                      strokeLinejoin: 'round',
                      strokeLinecap: 'round',
                      pointerEvents: 'none',
                    }}
                  >
                    {wrappedLines.map((line, idx) => (
                      <tspan
                        key={idx}
                        x={svgLabelX}
                        y={startY + idx * lineHeight}
                      >
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              );
            })}

            {/* ============================================================== */}
            {/* 4. MAP NAMES (YELLOW / BLACK ROAD & LOCATION NAMES)           */}
            {/* Read from MAP_NAMES array.                                   */}
            {/* Config: RENDER_MAP_NAMES draws crisp yellow text with black   */}
            {/* outline that stays sharp at high zoom.                       */}
            {/* ============================================================== */}
            {mapNames.map((nameItem) => {
              const isFocused = focusedMapNameId === nameItem.id;
              const isSelectedInEditor =
                isEditMode && editModeTab === 'names' && selectedNameId === nameItem.id;
              const shouldRenderText =
                renderMapNames ||
                isSelectedInEditor ||
                (isEditMode && editModeTab === 'names');
              const svgX = nameItem.position[0] * 10;
              const svgY = nameItem.position[1] * 10;

              return (
                <g
                  key={nameItem.id}
                  onClick={(e) => {
                    if (isEditMode && editModeTab === 'names') {
                      e.stopPropagation();
                      onSelectName?.(nameItem.id);
                    }
                  }}
                  style={{
                    cursor:
                      isEditMode && editModeTab === 'names' ? 'pointer' : 'default',
                  }}
                >
                  {/* Spotlight pulse marker when focused from Search */}
                  {isFocused && (
                    <g transform={`translate(${svgX}, ${svgY})`}>
                      <circle
                        cx={0}
                        cy={0}
                        r={32}
                        fill="rgba(250, 204, 21, 0.3)"
                        stroke="#eab308"
                        strokeWidth={3}
                        className="animate-ping"
                      />
                      <circle
                        cx={0}
                        cy={0}
                        r={12}
                        fill="#eab308"
                        stroke="#ffffff"
                        strokeWidth={2.5}
                      />
                      <rect
                        x={-80}
                        y={-40}
                        width={160}
                        height={26}
                        rx={6}
                        fill="#0f172a"
                        stroke="#eab308"
                        strokeWidth={1.5}
                        opacity={0.95}
                      />
                      <text
                        x={0}
                        y={-24}
                        textAnchor="middle"
                        fontSize={12}
                        fontWeight="900"
                        fill="#facc15"
                        letterSpacing="0.05em"
                      >
                        {nameItem.text}
                      </text>
                    </g>
                  )}

                  {/* Visual editor selection box & anchor node */}
                  {isSelectedInEditor && (
                    <g
                      transform={`translate(${svgX}, ${svgY}) rotate(${nameItem.angle})`}
                    >
                      <rect
                        x={-75}
                        y={-nameItem.size - 6}
                        width={150}
                        height={nameItem.size * 2 + 12}
                        rx={6}
                        fill="rgba(37, 99, 235, 0.25)"
                        stroke="#2563eb"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                      />
                      <circle
                        cx={0}
                        cy={0}
                        r={4}
                        fill="#2563eb"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                      />
                    </g>
                  )}

                  {/* Sharp yellow text with solid black outline */}
                  {shouldRenderText && (
                    <g
                      transform={`translate(${svgX}, ${svgY}) rotate(${nameItem.angle})`}
                    >
                      <text
                        x={0}
                        y={0}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          fontFamily:
                            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          fontWeight: 900,
                          fontSize: `${nameItem.size}px`,
                          fill: '#facc15',
                          paintOrder: 'stroke fill',
                          stroke: '#000000',
                          strokeWidth: '3.6px',
                          strokeLinejoin: 'round',
                          strokeLinecap: 'round',
                          letterSpacing: '0.06em',
                          pointerEvents:
                            isEditMode && editModeTab === 'names' ? 'all' : 'none',
                          userSelect: 'none',
                        }}
                      >
                        {nameItem.text}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* EDIT MODE: Live preview of points being actively drawn */}
            {isEditMode && draftPoints.length > 0 && (
              <g pointerEvents="none">
                {/* Live polygon outline */}
                <polygon
                  points={formatPolygonPoints(draftPoints)}
                  fill="rgba(234, 88, 12, 0.25)"
                  stroke="#ea580c"
                  strokeWidth={2.5}
                  strokeDasharray="6 3"
                />
                {/* Vertex nodes */}
                {draftPoints.map(([px, py], index) => (
                  <g key={index}>
                    <circle
                      cx={px * 10}
                      cy={py * 10}
                      r={index === 0 ? 6 : 4.5}
                      fill={index === 0 ? '#16a34a' : '#ea580c'}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                    <text
                      x={px * 10 + 8}
                      y={py * 10 - 8}
                      fontSize={10}
                      fontWeight="bold"
                      fill="#0f172a"
                      style={{
                        paintOrder: 'stroke fill',
                        stroke: '#fff',
                        strokeWidth: '2.5px',
                      }}
                    >
                      P{index + 1}
                    </text>
                  </g>
                ))}
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};
