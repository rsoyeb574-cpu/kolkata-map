/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ============================================================================
// 1. EDITABLE BASE CONFIGURATION
// ============================================================================
export const MAP_IMAGE = "map.jpg";
export const MAP_ROTATION = 0; // 0, 90, 180, 270 degrees

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MY_LOCATIONS as INITIAL_MY_LOCATIONS,
  PUJA_LOCATIONS as INITIAL_PUJA_LOCATIONS,
  MAP_NAMES as INITIAL_MAP_NAMES,
  RENDER_MAP_NAMES as INITIAL_RENDER_MAP_NAMES,
  SHOW_IMAGE_NAMES,
  MyLocation,
  PujaLocation,
  MapName,
} from './data/pujaData';
import { MapViewer, CenterTarget } from './components/MapViewer';
import { PlaceInfoPanel } from './components/PlaceInfoPanel';
import { SearchBar } from './components/SearchBar';
import { EditModeBar } from './components/EditModeBar';
import { SettingsModal } from './components/SettingsModal';
import { ExportHtmlModal } from './components/ExportHtmlModal';
import {
  RotateCw,
  Edit3,
  Sliders,
  Download,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // Primary data states (editable and live-updated in Edit Mode)
  const [myLocations, setMyLocations] = useState<MyLocation[]>(INITIAL_MY_LOCATIONS);
  const [pujaLocations, setPujaLocations] = useState<PujaLocation[]>(INITIAL_PUJA_LOCATIONS);
  const [mapNames, setMapNames] = useState<MapName[]>(INITIAL_MAP_NAMES);
  const [renderMapNames, setRenderMapNames] = useState<boolean>(INITIAL_RENDER_MAP_NAMES);

  // Map view & rotation
  const [rotation, setRotation] = useState<number>(MAP_ROTATION);
  const [mapImageSrc, setMapImageSrc] = useState<string>(MAP_IMAGE);
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);

  // Selection & focus states
  const [selectedPujaId, setSelectedPujaId] = useState<string | null>(null);
  const [focusedMapNameId, setFocusedMapNameId] = useState<string | null>(null);
  const [centerTarget, setCenterTarget] = useState<CenterTarget | null>(null);

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editTab, setEditTab] = useState<'puja' | 'names'>('puja');
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [editTargetField, setEditTargetField] = useState<'points' | 'maskPoints' | 'labelPosition'>('points');
  const [draftPoints, setDraftPoints] = useState<[number, number][]>([]);
  const [selectedNameId, setSelectedNameId] = useState<string | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number } | null>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState<boolean>(true);

  // Selected MyLocation object
  const selectedPuja = useMemo(() => {
    if (!selectedPujaId) return null;
    return myLocations.find((loc) => loc.id === selectedPujaId) || null;
  }, [selectedPujaId, myLocations]);

  // Keyboard shortcut listener: 'E' for Edit Mode, 'Escape' to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when typing inside input / textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setIsEditMode((prev) => {
          const next = !prev;
          if (!next) {
            setDraftPoints([]);
          }
          return next;
        });
      } else if (e.key === 'Escape') {
        if (isEditMode && draftPoints.length > 0) {
          setDraftPoints([]);
        } else if (isEditMode) {
          setIsEditMode(false);
        } else if (selectedPujaId) {
          setSelectedPujaId(null);
        } else if (focusedMapNameId) {
          setFocusedMapNameId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, draftPoints.length, selectedPujaId, focusedMapNameId]);

  // Handle Search Selection: Puja
  const handleSelectPujaFromSearch = useCallback((pujaId: string) => {
    setFocusedMapNameId(null);
    setSelectedPujaId(pujaId);
  }, []);

  // Handle Search Selection: Road Name (gentle zoom, pulse indicator, NO Google call)
  const handleSelectRoadFromSearch = useCallback((road: MapName) => {
    setSelectedPujaId(null);
    setFocusedMapNameId(road.id);
    setCenterTarget({
      x: road.position[0],
      y: road.position[1],
      zoom: 2.3,
      timestamp: Date.now(),
    });

    // Automatically remove the ping spotlight after 4 seconds
    setTimeout(() => {
      setFocusedMapNameId((curr) => (curr === road.id ? null : curr));
    }, 4000);
  }, []);

  // Edit Mode: Add draft vertex
  const handleDraftPointAdd = useCallback(
    (point: [number, number]) => {
      if (editTargetField === 'labelPosition') {
        // Label position is a single point [x%, y%]
        setDraftPoints([point]);
      } else {
        setDraftPoints((prev) => [...prev, point]);
      }
    },
    [editTargetField]
  );

  // Edit Mode: Add / Move Road Name on Map Click
  const handleAddNameAtCoords = useCallback(
    (coords: [number, number]) => {
      if (selectedNameId) {
        // Update selected road's position to clicked coordinate
        setMapNames((prev) =>
          prev.map((n) => (n.id === selectedNameId ? { ...n, position: coords } : n))
        );
      } else {
        // Create a new road sign at this clicked coordinate
        const newId = `n${Date.now().toString().slice(-4)}`;
        const newRoad: MapName = {
          id: newId,
          text: 'NEW ROAD NAME',
          position: coords,
          angle: 0,
          size: 12,
        };
        setMapNames((prev) => [...prev, newRoad]);
        setSelectedNameId(newId);
      }
    },
    [selectedNameId]
  );

  const handleUndoPoint = () => {
    setDraftPoints((prev) => prev.slice(0, -1));
  };

  const handleClearPoints = () => {
    setDraftPoints([]);
  };

  // Edit Mode: Save Draft Points to Puja
  const handleSavePointsToPuja = (
    pujaId: string,
    field: 'points' | 'maskPoints' | 'labelPosition'
  ) => {
    if (draftPoints.length === 0) return;

    setPujaLocations((prev) =>
      prev.map((p) => {
        if (p.locationId === pujaId) {
          if (field === 'labelPosition') {
            return {
              ...p,
              labelPosition: draftPoints[0],
            };
          }
          return {
            ...p,
            [field]: draftPoints,
          };
        }
        return p;
      })
    );

    setDraftPoints([]);
  };

  // Road Name CRUD Handlers
  const handleUpdateMapName = (updated: MapName) => {
    setMapNames((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  const handleDeleteMapName = (id: string) => {
    setMapNames((prev) => prev.filter((n) => n.id !== id));
    if (selectedNameId === id) {
      setSelectedNameId(null);
    }
  };

  const handleAddMapName = (newName: MapName) => {
    setMapNames((prev) => [...prev, newName]);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 select-none">
      {/* 1. TOP BAR */}
      <header className="h-14 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-3 sm:px-5 z-40 shrink-0 gap-2 sm:gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-950 font-bold text-sm">
            KP
          </div>
          <span className="font-bold text-sm sm:text-base text-slate-100 tracking-tight hidden min-[440px]:inline">
            Kolkata <span className="text-orange-500 font-extrabold">Puja Map</span>
          </span>
        </div>

        {/* Zone 2: Search Bar strictly searches authentic map names & pandals */}
        <div className="flex-1 max-w-sm sm:max-w-md mx-1 sm:mx-2">
          <SearchBar
            myLocations={myLocations}
            mapNames={mapNames}
            onSelectPuja={handleSelectPujaFromSearch}
            onSelectMapName={handleSelectRoadFromSearch}
          />
        </div>

        {/* Zone 3: Navigation Controls & Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Toggle Sharp Yellow Road Vector Signs */}
          <button
            onClick={() => setRenderMapNames((prev) => !prev)}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              renderMapNames
                ? 'bg-amber-950/70 border-amber-500 text-amber-300 shadow-sm'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle sharp yellow vector road text on top of the map"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Yellow Signs: {renderMapNames ? 'ON' : 'OFF'}</span>
          </button>

          {/* Map Rotation Selector */}
          <button
            onClick={() => setRotation((prev) => ((prev + 90) % 360))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
            title="Rotate Map 90°"
          >
            <RotateCw className="w-3.5 h-3.5 text-orange-400" />
            <span>{rotation}°</span>
          </button>

          {/* Export HTML Modal Toggle */}
          <button
            onClick={() => setIsExportOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
            title="Export Standalone Single-File HTML"
          >
            <Download className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden lg:inline">Export HTML</span>
          </button>

          {/* Settings Modal Toggle */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
            title="Settings & Map Image"
          >
            <Sliders className="w-4 h-4 text-slate-300" />
          </button>

          {/* Primary Action: Edit Mode Toggle */}
          <button
            onClick={() => {
              setIsEditMode((prev) => !prev);
              setDraftPoints([]);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer ${
              isEditMode
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/50'
                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20'
            }`}
            title="Toggle Edit Mode (Press 'E')"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isEditMode ? 'Exit Editor' : 'Edit Mode (E)'}</span>
            <span className="sm:hidden">{isEditMode ? 'Done' : 'Edit'}</span>
          </button>
        </div>
      </header>

      {/* Notice Banner (Dismissible) */}
      {showWelcomeBanner && (
        <div className="absolute top-16 left-3 right-3 sm:left-6 sm:right-auto sm:max-w-md z-20 bg-slate-900/90 backdrop-blur-md text-slate-300 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
            <span>
              Click any <strong>green Puja area</strong> or search above to view details and transit guidance.
            </span>
          </div>
          <button
            onClick={() => setShowWelcomeBanner(false)}
            className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer shrink-0"
            aria-label="Dismiss banner"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. MAIN MAP VIEWPORT */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <MapViewer
          mapImageSrc={mapImageSrc}
          rotation={rotation}
          myLocations={myLocations}
          pujaLocations={pujaLocations}
          mapNames={mapNames}
          renderMapNames={renderMapNames}
          selectedPujaId={selectedPujaId}
          onSelectPuja={(id) => setSelectedPujaId(id)}
          focusedMapNameId={focusedMapNameId}
          centerTarget={centerTarget}
          isEditMode={isEditMode}
          editModeTab={editTab}
          editTargetId={editTargetId}
          editTargetField={editTargetField}
          selectedNameId={selectedNameId}
          onSelectName={(id) => setSelectedNameId(id)}
          draftPoints={draftPoints}
          onDraftPointAdd={handleDraftPointAdd}
          onAddNameAtCoords={handleAddNameAtCoords}
          onCursorMove={(coords) => setCursorCoords(coords)}
        />

        {/* EDIT MODE CONTROLS BAR (Appears when E is pressed) */}
        {isEditMode && (
          <EditModeBar
            cursorCoords={cursorCoords}
            editTab={editTab}
            onSetEditTab={(tab) => {
              setEditTab(tab);
              setDraftPoints([]);
            }}
            pujaLocations={pujaLocations}
            myLocations={myLocations}
            selectedPujaId={editTargetId}
            onSelectPujaId={(id) => {
              setEditTargetId(id);
              setSelectedPujaId(id);
              setDraftPoints([]);
            }}
            editTargetField={editTargetField}
            onSetEditTargetField={(field) => {
              setEditTargetField(field);
              setDraftPoints([]);
            }}
            draftPoints={draftPoints}
            onUndoPoint={handleUndoPoint}
            onClearPoints={handleClearPoints}
            onSavePointsToPuja={handleSavePointsToPuja}
            mapNames={mapNames}
            selectedNameId={selectedNameId}
            onSelectNameId={(id) => setSelectedNameId(id)}
            onUpdateMapName={handleUpdateMapName}
            onDeleteMapName={handleDeleteMapName}
            onAddMapName={handleAddMapName}
            renderMapNames={renderMapNames}
            onToggleRenderMapNames={(val) => setRenderMapNames(val)}
            onCloseEditMode={() => {
              setIsEditMode(false);
              setDraftPoints([]);
            }}
          />
        )}

        {/* 3. PLACE CARD / INFO PANEL (Desktop right slide-over, Mobile bottom sheet) */}
        {selectedPuja && !isEditMode && (
          <PlaceInfoPanel
            puja={selectedPuja}
            onClose={() => setSelectedPujaId(null)}
          />
        )}
      </main>

      {/* SETTINGS MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        rotation={rotation}
        onRotationChange={(deg) => setRotation(deg)}
        onImageUploaded={(dataUrl) => {
          setMapImageSrc(dataUrl);
          setIsUsingFallback(false);
        }}
        isUsingFallbackImage={isUsingFallback}
        renderMapNames={renderMapNames}
        onToggleRenderMapNames={(val) => setRenderMapNames(val)}
      />

      {/* EXPORT STANDALONE HTML MODAL */}
      <ExportHtmlModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        myLocations={myLocations}
        pujaLocations={pujaLocations}
        mapNames={mapNames}
        renderMapNames={renderMapNames}
        rotation={rotation}
      />
    </div>
  );
}
