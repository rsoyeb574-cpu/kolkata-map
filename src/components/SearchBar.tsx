/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, MapPin, Navigation, Compass } from 'lucide-react';
import { MyLocation, MapName } from '../data/pujaData';

export interface SearchBarProps {
  myLocations: MyLocation[];
  mapNames: MapName[];
  onSelectPuja: (pujaId: string) => void;
  onSelectMapName: (mapName: MapName) => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  myLocations,
  mapNames,
  onSelectPuja,
  onSelectMapName,
  className = '',
}) => {
  const [query, setQuery] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement !== inputRef.current &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter Puja and Map Names strictly from local data (never Google)
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Return top featured pandals and roads as quick jump items
      return {
        pujas: myLocations.slice(0, 4),
        roads: mapNames.slice(0, 4),
        total: Math.min(myLocations.length, 4) + Math.min(mapNames.length, 4),
      };
    }

    const filteredPujas = myLocations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        (loc.address && loc.address.toLowerCase().includes(q))
    );

    const filteredRoads = mapNames.filter((road) =>
      road.text.toLowerCase().includes(q)
    );

    return {
      pujas: filteredPujas,
      roads: filteredRoads,
      total: filteredPujas.length + filteredRoads.length,
    };
  }, [query, myLocations, mapNames]);

  // Flattened array for keyboard arrow navigation
  const flatList = useMemo(() => {
    const list: Array<{ type: 'puja'; item: MyLocation } | { type: 'road'; item: MapName }> = [];
    results.pujas.forEach((p) => list.push({ type: 'puja', item: p }));
    results.roads.forEach((r) => list.push({ type: 'road', item: r }));
    return list;
  }, [results]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPuja = (id: string) => {
    onSelectPuja(id);
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);
  };

  const handleSelectRoad = (road: MapName) => {
    onSelectMapName(road);
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setSelectedIndex((prev) => (prev < flatList.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatList.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flatList.length) {
        const sel = flatList[selectedIndex];
        if (sel.type === 'puja') {
          handleSelectPuja(sel.item.id);
        } else {
          handleSelectRoad(sel.item);
        }
      } else if (flatList.length > 0) {
        // Pick first result on enter
        const first = flatList[0];
        if (first.type === 'puja') {
          handleSelectPuja(first.item.id);
        } else {
          handleSelectRoad(first.item);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Bar Container */}
      <div className="relative flex items-center">
        <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
          <Search size={16} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search pandals or road names... (/)"
          className="w-full pl-9 pr-16 py-1.5 bg-slate-900/90 text-slate-100 text-xs sm:text-sm rounded-xl border border-slate-700/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-400 backdrop-blur-md shadow-sm"
        />

        <div className="absolute right-2.5 flex items-center gap-1.5">
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="text-slate-400 hover:text-slate-200 p-0.5 rounded cursor-pointer"
              title="Clear search"
            >
              <X size={14} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 rounded border border-slate-700">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown Results List */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900/95 text-slate-100 rounded-xl shadow-2xl border border-slate-700/80 backdrop-blur-xl overflow-hidden z-50 max-h-[75vh] flex flex-col"
        >
          <div className="px-3 py-1.5 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>
              {query
                ? `Results for "${query}" (${results.total})`
                : 'Quick Jump: Pandals & Roads'}
            </span>
            <span className="text-[10px] text-slate-500">Local Map Data Only</span>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-800/50">
            {results.total === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                <Compass className="w-8 h-8 mx-auto mb-2 text-slate-500 opacity-60" />
                <p className="font-semibold text-slate-300">No matching places or roads found</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Search strictly matches authentic map names and pandal titles.
                </p>
              </div>
            ) : (
              <>
                {/* 1. Green Puja Pandals Section */}
                {results.pujas.length > 0 && (
                  <div className="p-1.5">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Durga Puja Pandals ({results.pujas.length})
                    </div>
                    {results.pujas.map((puja) => {
                      const idx = flatList.findIndex(
                        (f) => f.type === 'puja' && f.item.id === puja.id
                      );
                      const isHighlighted = idx === selectedIndex;
                      return (
                        <button
                          key={puja.id}
                          onClick={() => handleSelectPuja(puja.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg flex items-start gap-2.5 transition-colors cursor-pointer ${
                            isHighlighted
                              ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-100'
                              : 'hover:bg-slate-800/80 text-slate-200'
                          }`}
                        >
                          <div className="mt-0.5 text-emerald-400 shrink-0">
                            <MapPin size={15} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs sm:text-sm truncate text-white">
                              {puja.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {puja.address}
                            </div>
                          </div>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 shrink-0 self-center">
                            Open Card
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 2. Yellow Map Road Names Section */}
                {results.roads.length > 0 && (
                  <div className="p-1.5">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                      Street & Location Signs ({results.roads.length})
                    </div>
                    {results.roads.map((road) => {
                      const idx = flatList.findIndex(
                        (f) => f.type === 'road' && f.item.id === road.id
                      );
                      const isHighlighted = idx === selectedIndex;
                      return (
                        <button
                          key={road.id}
                          onClick={() => handleSelectRoad(road)}
                          className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                            isHighlighted
                              ? 'bg-amber-950/60 border border-amber-500/40 text-amber-100'
                              : 'hover:bg-slate-800/80 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="text-amber-400 shrink-0">
                              <Navigation size={14} className="rotate-45" />
                            </div>
                            <div className="font-bold text-xs sm:text-sm tracking-wide text-amber-300 truncate">
                              {road.text}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded shrink-0 border border-slate-700">
                            {road.position[0]}%, {road.position[1]}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="px-3 py-1.5 bg-slate-950/90 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>↑↓ Navigate · Enter to zoom</span>
            <span>Esc to close</span>
          </div>
        </div>
      )}
    </div>
  );
};
