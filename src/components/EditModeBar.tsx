/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PujaLocation, MyLocation, MapName } from '../data/pujaData';
import {
  Copy,
  Check,
  Undo,
  Trash2,
  Code2,
  X,
  PlusCircle,
  Eye,
  RotateCw,
  Type,
  MapPin,
  Sliders,
} from 'lucide-react';

export interface EditModeBarProps {
  cursorCoords: { x: number; y: number } | null;
  editTab: 'puja' | 'names';
  onSetEditTab: (tab: 'puja' | 'names') => void;
  // Puja Polygons
  pujaLocations: PujaLocation[];
  myLocations: MyLocation[];
  selectedPujaId: string | null;
  onSelectPujaId: (id: string | null) => void;
  editTargetField: 'points' | 'maskPoints' | 'labelPosition';
  onSetEditTargetField: (field: 'points' | 'maskPoints' | 'labelPosition') => void;
  draftPoints: [number, number][];
  onUndoPoint: () => void;
  onClearPoints: () => void;
  onSavePointsToPuja: (pujaId: string, field: 'points' | 'maskPoints' | 'labelPosition') => void;
  // Map Road Names
  mapNames: MapName[];
  selectedNameId: string | null;
  onSelectNameId: (id: string | null) => void;
  onUpdateMapName: (updated: MapName) => void;
  onDeleteMapName: (id: string) => void;
  onAddMapName: (newName: MapName) => void;
  renderMapNames: boolean;
  onToggleRenderMapNames: (val: boolean) => void;
  // Close
  onCloseEditMode: () => void;
}

export const EditModeBar: React.FC<EditModeBarProps> = ({
  cursorCoords,
  editTab,
  onSetEditTab,
  pujaLocations,
  myLocations,
  selectedPujaId,
  onSelectPujaId,
  editTargetField,
  onSetEditTargetField,
  draftPoints,
  onUndoPoint,
  onClearPoints,
  onSavePointsToPuja,
  mapNames,
  selectedNameId,
  onSelectNameId,
  onUpdateMapName,
  onDeleteMapName,
  onAddMapName,
  renderMapNames,
  onToggleRenderMapNames,
  onCloseEditMode,
}) => {
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [codeModalType, setCodeModalType] = useState<'puja' | 'names' | 'all'>('all');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedCoords, setCopiedCoords] = useState<boolean>(false);

  // Selected Road Name
  const selectedRoad = mapNames.find((n) => n.id === selectedNameId);
  const currentPuja = pujaLocations.find((p) => p.locationId === selectedPujaId);
  const currentLocation = myLocations.find((l) => l.id === selectedPujaId);

  // Format code snippet generator
  const generateCodeSnippet = (type: 'puja' | 'names' | 'all') => {
    if (type === 'puja') {
      return `// ==========================================
// READY-TO-PASTE PUJA_LOCATIONS SNIPPET
// ==========================================
export const PUJA_LOCATIONS: PujaLocation[] = ${JSON.stringify(
        pujaLocations,
        null,
        2
      )};`;
    }
    if (type === 'names') {
      return `// ==========================================
// READY-TO-PASTE MAP_NAMES SNIPPET
// ==========================================
export const MAP_NAMES: MapName[] = ${JSON.stringify(
        mapNames,
        null,
        2
      )};`;
    }
    return `// ============================================================================
// READY-TO-PASTE MAP DATA CONFIGURATION
// ============================================================================

export const RENDER_MAP_NAMES = ${renderMapNames};

// ===== MAP NAMES (ROAD SIGNS) =====
export const MAP_NAMES: MapName[] = ${JSON.stringify(mapNames, null, 2)};

// ===== PUJA LOCATIONS (POLYGONS & MASKS) =====
export const PUJA_LOCATIONS: PujaLocation[] = ${JSON.stringify(pujaLocations, null, 2)};`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateCodeSnippet(codeModalType));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyCoords = () => {
    if (cursorCoords) {
      navigator.clipboard.writeText(`[${cursorCoords.x}, ${cursorCoords.y}]`);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    }
  };

  const handleAddNewRoadPrompt = () => {
    const coords: [number, number] = cursorCoords
      ? [cursorCoords.x, cursorCoords.y]
      : [50, 50];
    const newId = `n${Date.now().toString().slice(-4)}`;
    const newRoad: MapName = {
      id: newId,
      text: 'NEW ROAD NAME',
      position: coords,
      angle: 0,
      size: 12,
    };
    onAddMapName(newRoad);
    onSelectNameId(newId);
  };

  return (
    <>
      {/* Floating Edit Mode HUD Header Banner */}
      <div className="absolute top-16 left-3 right-3 sm:left-4 sm:right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto md:max-w-4xl z-30 bg-slate-900/95 text-white backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/80 p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Left Section: Badge & Coordinates */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Edit Mode
            </span>
            <div className="text-xs font-mono text-slate-300 ml-1 tabular-nums">
              {cursorCoords ? (
                <button
                  onClick={handleCopyCoords}
                  className="hover:text-emerald-300 hover:underline cursor-pointer"
                  title="Click to copy coordinates"
                >
                  X: {cursorCoords.x}% · Y: {cursorCoords.y}%
                </button>
              ) : (
                <span>Hover map</span>
              )}
            </div>
            {copiedCoords && (
              <span className="text-[10px] text-emerald-400 font-semibold">Copied!</span>
            )}
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => onSetEditTab('puja')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                editTab === 'puja'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Puja Polygons ({pujaLocations.length})
            </button>
            <button
              onClick={() => onSetEditTab('names')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                editTab === 'names'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Road Names ({mapNames.length})
            </button>
          </div>
        </div>

        {/* Right Section: Code Export & Close Button */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => {
              setCodeModalType(editTab === 'puja' ? 'puja' : 'names');
              setShowCodeModal(true);
            }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            title="Generate ready-to-paste snippet"
          >
            <Code2 size={14} />
            <span>Copy Code</span>
          </button>
          <button
            onClick={onCloseEditMode}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Exit Edit Mode (E)"
          >
            <X size={18} />
          </button>
        </div>

        {/* SUB-BAR ROW FOR PUJA MODE */}
        {editTab === 'puja' && (
          <div className="w-full pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
            {/* Puja Location Select */}
            <select
              value={selectedPujaId || ''}
              onChange={(e) => onSelectPujaId(e.target.value || null)}
              className="bg-slate-800 text-white rounded-lg px-2.5 py-1 border border-slate-700 text-xs focus:ring-1 focus:ring-emerald-500 outline-none max-w-[200px] truncate"
            >
              <option value="">-- Choose Puja to Edit --</option>
              {myLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>

            {/* Target Field Select */}
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => onSetEditTargetField('points')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  editTargetField === 'points'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Click Area
              </button>
              <button
                onClick={() => onSetEditTargetField('maskPoints')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  editTargetField === 'maskPoints'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mask (Cover)
              </button>
              <button
                onClick={() => onSetEditTargetField('labelPosition')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  editTargetField === 'labelPosition'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Label Center
              </button>
            </div>

            {/* Draft status & Drawing controls */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11px] text-slate-400">
                {draftPoints.length} pt{draftPoints.length === 1 ? '' : 's'} clicked
              </span>

              {draftPoints.length > 0 && (
                <>
                  <button
                    onClick={onUndoPoint}
                    className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors cursor-pointer"
                    title="Undo last point"
                  >
                    <Undo size={13} />
                  </button>
                  <button
                    onClick={onClearPoints}
                    className="p-1 bg-slate-800 hover:bg-red-950 text-red-400 rounded transition-colors cursor-pointer"
                    title="Clear points"
                  >
                    <Trash2 size={13} />
                  </button>
                  <button
                    disabled={!selectedPujaId || (editTargetField !== 'labelPosition' && draftPoints.length < 3)}
                    onClick={() => {
                      if (selectedPujaId) {
                        onSavePointsToPuja(selectedPujaId, editTargetField);
                      }
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Check size={13} />
                    <span>Apply</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* SUB-BAR ROW FOR ROAD NAMES MODE */}
        {editTab === 'names' && (
          <div className="w-full pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
            {/* Road Name Select */}
            <select
              value={selectedNameId || ''}
              onChange={(e) => onSelectNameId(e.target.value || null)}
              className="bg-slate-800 text-white rounded-lg px-2.5 py-1 border border-slate-700 text-xs focus:ring-1 focus:ring-amber-500 outline-none max-w-[200px] truncate"
            >
              <option value="">-- Select Road to Edit --</option>
              {mapNames.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.text} ({n.position[0]}%, {n.position[1]}%)
                </option>
              ))}
            </select>

            <button
              onClick={handleAddNewRoadPrompt}
              className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <PlusCircle size={13} />
              <span>Add Road at Cursor</span>
            </button>

            {/* Toggle Sharp Text Layer */}
            <label className="flex items-center gap-1.5 text-xs text-slate-300 ml-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={renderMapNames}
                onChange={(e) => onToggleRenderMapNames(e.target.checked)}
                className="rounded accent-amber-500 cursor-pointer"
              />
              <span>Render Sharp Vector Overlay</span>
            </label>

            {/* Editing Controls for Selected Road */}
            {selectedRoad && (
              <div className="w-full mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-3 bg-slate-950/60 p-2 rounded-xl">
                {/* Text input */}
                <div className="flex items-center gap-1.5 flex-1 min-w-[160px]">
                  <Type size={13} className="text-amber-400 shrink-0" />
                  <input
                    type="text"
                    value={selectedRoad.text}
                    onChange={(e) =>
                      onUpdateMapName({ ...selectedRoad, text: e.target.value })
                    }
                    placeholder="EXACT ROAD NAME"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-bold text-amber-300 uppercase focus:border-amber-500 outline-none"
                  />
                </div>

                {/* Angle Slider */}
                <div className="flex items-center gap-1.5">
                  <RotateCw size={13} className="text-slate-400 shrink-0" />
                  <span className="text-[11px] text-slate-400">Angle:</span>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="5"
                    value={selectedRoad.angle}
                    onChange={(e) =>
                      onUpdateMapName({
                        ...selectedRoad,
                        angle: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-16 sm:w-20 accent-amber-500 cursor-pointer"
                  />
                  <span className="font-mono text-[11px] w-9 text-slate-300 text-right">
                    {selectedRoad.angle}°
                  </span>
                  {/* Quick Angle Buttons */}
                  <button
                    onClick={() => onUpdateMapName({ ...selectedRoad, angle: 0 })}
                    className={`px-1 py-0.5 rounded text-[10px] ${
                      selectedRoad.angle === 0
                        ? 'bg-amber-500 text-slate-900 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    0°
                  </button>
                  <button
                    onClick={() => onUpdateMapName({ ...selectedRoad, angle: -90 })}
                    className={`px-1 py-0.5 rounded text-[10px] ${
                      selectedRoad.angle === -90
                        ? 'bg-amber-500 text-slate-900 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    -90°
                  </button>
                </div>

                {/* Size Slider */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Size:</span>
                  <input
                    type="range"
                    min="8"
                    max="22"
                    value={selectedRoad.size}
                    onChange={(e) =>
                      onUpdateMapName({
                        ...selectedRoad,
                        size: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-14 sm:w-16 accent-amber-500 cursor-pointer"
                  />
                  <span className="font-mono text-[11px] w-6 text-slate-300">
                    {selectedRoad.size}px
                  </span>
                </div>

                {/* Set Position to Cursor */}
                {cursorCoords && (
                  <button
                    onClick={() =>
                      onUpdateMapName({
                        ...selectedRoad,
                        position: [cursorCoords.x, cursorCoords.y],
                      })
                    }
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                    title="Move sign to current cursor coordinates"
                  >
                    <MapPin size={11} className="text-amber-400" />
                    <span>Set to Cursor</span>
                  </button>
                )}

                {/* Delete Road */}
                <button
                  onClick={() => onDeleteMapName(selectedRoad.id)}
                  className="p-1 hover:bg-red-950 text-red-400 rounded transition-colors ml-auto cursor-pointer"
                  title="Delete road sign"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CODE SNIPPET MODAL */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="text-emerald-400" size={20} />
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Copy-Paste Ready Code Snippet
                </h3>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sub-tabs inside code modal */}
            <div className="px-4 py-2 bg-slate-950 flex gap-2 border-b border-slate-800 text-xs">
              <button
                onClick={() => setCodeModalType('all')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  codeModalType === 'all'
                    ? 'bg-slate-800 text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All (MAP_NAMES + PUJA_LOCATIONS)
              </button>
              <button
                onClick={() => setCodeModalType('names')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  codeModalType === 'names'
                    ? 'bg-slate-800 text-amber-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                MAP_NAMES ({mapNames.length})
              </button>
              <button
                onClick={() => setCodeModalType('puja')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  codeModalType === 'puja'
                    ? 'bg-slate-800 text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                PUJA_LOCATIONS ({pujaLocations.length})
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs bg-slate-950/80 text-emerald-300">
              <pre className="whitespace-pre">{generateCodeSnippet(codeModalType)}</pre>
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900">
              <span className="text-xs text-slate-400">
                Paste directly into <code className="text-amber-400">src/data/pujaData.ts</code>
              </span>
              <button
                onClick={handleCopyCode}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-900/40"
              >
                {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Code Snippet'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
