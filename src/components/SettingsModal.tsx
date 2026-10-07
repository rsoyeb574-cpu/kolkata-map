/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Key, RotateCw, Image as ImageIcon, ShieldCheck, Check } from 'lucide-react';
import { getGoogleApiKey } from '../services/googlePlaces';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rotation: number;
  onRotationChange: (deg: number) => void;
  onImageUploaded: (dataUrl: string) => void;
  isUsingFallbackImage: boolean;
  renderMapNames: boolean;
  onToggleRenderMapNames: (val: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  rotation,
  onRotationChange,
  onImageUploaded,
  isUsingFallbackImage,
  renderMapNames,
  onToggleRenderMapNames,
}) => {
  const [apiKey, setApiKey] = useState<string>(getGoogleApiKey());
  const [savedKey, setSavedKey] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSaveKey = () => {
    localStorage.setItem('google_maps_api_key', apiKey.trim());
    setSavedKey(true);
    setTimeout(() => setSavedKey(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onImageUploaded(result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col space-y-5 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-900">Map &amp; API Settings</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Map Orientation (Rotation) */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <RotateCw className="w-4 h-4 text-orange-600" />
            <span>Map Orientation / Rotation (North Arrow)</span>
          </label>
          <p className="text-xs text-slate-500">
            If the scanned map North arrow points left, rotate to 90° or 270° to orient North up.
          </p>
          <div className="grid grid-cols-4 gap-2 pt-1">
            {[0, 90, 180, 270].map((deg) => (
              <button
                key={deg}
                onClick={() => onRotationChange(deg)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  rotation === deg
                    ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>

        {/* 2. Sharp Vector Road Names Overlay (RENDER_MAP_NAMES) */}
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-900 inline-block" />
              <span>Render Sharp Yellow Names Overlay (RENDER_MAP_NAMES)</span>
            </label>
            <input
              type="checkbox"
              checked={renderMapNames}
              onChange={(e) => onToggleRenderMapNames(e.target.checked)}
              className="rounded accent-orange-600 w-4 h-4 cursor-pointer"
            />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Draws the names from <code className="text-amber-700 font-mono">MAP_NAMES</code> on top as sharp yellow text with black outline that stays crisp at high zoom. Original scanned map yellow names remain visible underneath (<code className="text-slate-600 font-mono">SHOW_IMAGE_NAMES = true</code>).
          </p>
        </div>

        {/* 2. Map Image Source */}
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-orange-600" />
            <span>Base Map Image</span>
          </label>
          <p className="text-xs text-slate-500">
            Default file expected: <code className="text-orange-700 font-mono">map.jpg</code> in the
            root/public directory. You can also pick or drop your scanned map image file below:
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
          />
        </div>

        {/* 3. Google Maps Places API Key */}
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Key className="w-4 h-4 text-orange-600" />
            <span>Google Maps API Key (Optional)</span>
          </label>
          <p className="text-xs text-slate-500 leading-relaxed">
            Directions and Maps links work <strong>without any API key</strong>. A key is only needed
            if you provide Google Place IDs for pandals to enrich reviews/photos.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-orange-500"
            />
            <button
              onClick={handleSaveKey}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {savedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
              <span>{savedKey ? 'Saved' : 'Save'}</span>
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Keys are never stored remotely. Restrict by HTTP referrer in Google Cloud Console.</span>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl shadow-md transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
