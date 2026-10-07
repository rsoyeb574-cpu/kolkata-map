/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MyLocation } from '../data/pujaData';
import { fetchPlaceDetails, getGoogleApiKey, GooglePlaceDetails, getGooglePhotoUrl } from '../services/googlePlaces';
import {
  X,
  Navigation,
  ExternalLink,
  Phone,
  Share2,
  Copy,
  Check,
  Clock,
  Calendar,
  MapPin,
  Globe,
  Star,
  ChevronDown,
  ChevronUp,
  Compass,
} from 'lucide-react';

export interface PlaceInfoPanelProps {
  puja: MyLocation | null;
  onClose: () => void;
}

export const PlaceInfoPanel: React.FC<PlaceInfoPanelProps> = ({ puja, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'reviews' | 'about'>('overview');
  const [googleData, setGoogleData] = useState<GooglePlaceDetails | null>(null);
  const [loadingGoogle, setLoadingGoogle] = useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [showHours, setShowHours] = useState<boolean>(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [calculatingLocation, setCalculatingLocation] = useState<boolean>(false);

  // Mobile bottom-sheet height state: 'half' | 'full'
  const [sheetHeight, setSheetHeight] = useState<'half' | 'full'>('half');

  // Reset tab and active photo when puja changes
  useEffect(() => {
    setActiveTab('overview');
    setActivePhotoIndex(0);
    setShowHours(false);
  }, [puja?.id]);

  // Fetch Google Place details if placeId exists and API key is present
  useEffect(() => {
    if (!puja) {
      setGoogleData(null);
      return;
    }

    if (puja.placeId && puja.placeId.trim()) {
      setLoadingGoogle(true);
      fetchPlaceDetails(puja.placeId)
        .then((data) => {
          setGoogleData(data);
        })
        .catch(() => {
          setGoogleData(null);
        })
        .finally(() => {
          setLoadingGoogle(false);
        });
    } else {
      setGoogleData(null);
      setLoadingGoogle(false);
    }
  }, [puja?.id, puja?.placeId]);

  if (!puja) return null;

  // Directions and Maps links (Always work without API key)
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${puja.latitude},${puja.longitude}`;
  const mapsSearchUrl =
    puja.googleMapsUrl ||
    googleData?.googleMapsUri ||
    `https://www.google.com/maps/search/?api=1&query=${puja.latitude},${puja.longitude}`;

  // Combined photo list: user photos first, then Google photos (max 8)
  const apiKey = getGoogleApiKey();
  const googlePhotos =
    googleData?.photos?.slice(0, 8)?.map((p) => getGooglePhotoUrl(p.name, apiKey)) || [];
  const allPhotos = [...(puja.photos || []), ...googlePhotos].filter(Boolean).slice(0, 8);

  // Address priority: user address first, Google address if empty
  const displayAddress = puja.address || googleData?.formattedAddress || '';

  // Phone priority: user phone first, Google phone if empty
  const displayPhone = puja.phone || googleData?.internationalPhoneNumber || '';

  // Website from Google
  const displayWebsite = googleData?.websiteUri || '';

  // Rating and review count from Google
  const rating = googleData?.rating;
  const ratingCount = googleData?.userRatingCount;

  // Handle address copy
  const handleCopyAddress = () => {
    if (displayAddress) {
      navigator.clipboard.writeText(displayAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  // Handle share
  const handleShare = async () => {
    const shareData = {
      title: puja.name,
      text: `${puja.name} - Kolkata Durga Puja\nAddress: ${displayAddress}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Share dismissed
      }
    } else {
      navigator.clipboard.writeText(`${puja.name}\n${displayAddress}\n${directionsUrl}`);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  // Distance calculator via Geolocation
  const handleGetDistance = () => {
    if (!navigator.geolocation) return;
    setCalculatingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setCalculatingLocation(false);
      },
      () => {
        setCalculatingLocation(false);
      },
      { timeout: 10000 }
    );
  };

  // Calculate distance in kilometers using Haversine formula
  const getCalculatedDistance = () => {
    if (!userLocation) return null;
    const R = 6371; // Earth radius in km
    const dLat = ((puja.latitude - userLocation.lat) * Math.PI) / 180;
    const dLon = ((puja.longitude - userLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation.lat * Math.PI) / 180) *
        Math.cos((puja.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distKm = R * c;
    if (distKm < 1) {
      return `${Math.round(distKm * 1000)} m away from current location`;
    }
    return `${distKm.toFixed(1)} km away from current location`;
  };

  return (
    <aside
      className={`fixed z-30 transition-all duration-300 ease-out bg-white text-slate-900 shadow-2xl flex flex-col border-slate-200
        /* Desktop: Right-side panel ~380px-400px wide */
        md:top-0 md:right-0 md:bottom-0 md:w-[400px] md:border-l
        /* Mobile: Bottom sheet */
        max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:rounded-t-3xl max-md:border-t
        ${sheetHeight === 'half' ? 'max-md:h-[65vh]' : 'max-md:h-[92vh]'}
      `}
      aria-labelledby="puja-title"
    >
      {/* Mobile Drag Handle */}
      <div
        className="md:hidden w-full pt-3 pb-1 flex justify-center cursor-pointer touch-none"
        onClick={() => setSheetHeight(sheetHeight === 'half' ? 'full' : 'half')}
      >
        <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
      </div>

      {/* 1. Header Bar with Close Button */}
      <div className="relative flex items-center justify-between px-5 pt-3 pb-2 border-b border-slate-100">
        <div className="flex-1 min-w-0 pr-3">
          {/* ALWAYS USER'S NAME */}
          <h2
            id="puja-title"
            className="text-lg md:text-xl font-bold tracking-tight text-slate-900 truncate"
          >
            {puja.name}
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span className="text-orange-600 font-medium">Durga Puja 2026</span>
            {puja.distanceInfo && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate">{puja.distanceInfo.split('·')[0]}</span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-9 h-9 min-w-[36px] flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          aria-label="Close place details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Photo Carousel / Hero Strip (if photos exist) */}
      {allPhotos.length > 0 && (
        <div className="relative bg-slate-900 h-48 md:h-52 w-full overflow-hidden shrink-0">
          <img
            src={allPhotos[activePhotoIndex]}
            alt={`${puja.name} photo ${activePhotoIndex + 1}`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

          {/* Photo Navigation dots */}
          {allPhotos.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
              {allPhotos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    activePhotoIndex === idx ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Go to photo ${idx + 1}`}
                />
              ))}
            </div>
          )}

          <div className="absolute top-2 right-3 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[11px] font-mono text-white/90">
            {activePhotoIndex + 1} / {allPhotos.length}
          </div>
        </div>
      )}

      {/* 3. Rating & Key Meta (from Google if available) */}
      {(rating || ratingCount) && (
        <div className="px-5 pt-3 flex items-center gap-2">
          <div className="flex items-center text-amber-500">
            <Star className="w-4 h-4 fill-amber-400 stroke-amber-500" />
            <span className="ml-1 text-sm font-semibold text-slate-900">{rating?.toFixed(1)}</span>
          </div>
          {ratingCount && (
            <span className="text-xs text-slate-500">({ratingCount.toLocaleString()} reviews)</span>
          )}
        </div>
      )}

      {/* 4. Action Buttons Bar (Minimum 44px tap targets for mobile) */}
      <div className="px-5 py-3 grid grid-cols-4 gap-2 border-b border-slate-100">
        {/* Directions */}
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[44px] flex flex-col items-center justify-center p-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition-all shadow-sm active:scale-95"
          title="Get Directions"
        >
          <Navigation className="w-4 h-4" />
          <span className="text-[11px] font-medium mt-1">Directions</span>
        </a>

        {/* View on Google Maps */}
        <a
          href={mapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[44px] flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all active:scale-95"
          title="Open in Google Maps"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="text-[11px] font-medium mt-1">Maps</span>
        </a>

        {/* Call (if phone exists) */}
        {displayPhone ? (
          <a
            href={`tel:${displayPhone.replace(/\s+/g, '')}`}
            className="min-h-[44px] flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all active:scale-95"
            title="Call"
          >
            <Phone className="w-4 h-4" />
            <span className="text-[11px] font-medium mt-1">Call</span>
          </a>
        ) : (
          <button
            onClick={handleCopyAddress}
            className="min-h-[44px] flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all active:scale-95 cursor-pointer"
            title="Copy Address"
          >
            {copiedAddress ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span className="text-[11px] font-medium mt-1">{copiedAddress ? 'Copied' : 'Address'}</span>
          </button>
        )}

        {/* Share */}
        <button
          onClick={handleShare}
          className="min-h-[44px] flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all active:scale-95 cursor-pointer"
          title="Share Puja"
        >
          {copiedShare ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
          <span className="text-[11px] font-medium mt-1">{copiedShare ? 'Copied' : 'Share'}</span>
        </button>
      </div>

      {/* 5. Navigation Tabs */}
      <div className="flex border-b border-slate-200 px-5 text-sm font-medium">
        {(['overview', 'photos', 'reviews', 'about'] as const).map((tab) => {
          // If no photos or reviews, don't show tab or show count
          if (tab === 'photos' && allPhotos.length === 0) return null;
          if (tab === 'reviews' && (!googleData?.reviews || googleData.reviews.length === 0)) return null;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2.5 px-3 capitalize border-b-2 transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'border-orange-600 text-orange-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* 6. Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4 text-sm text-slate-700">
            {/* Description */}
            {puja.description && (
              <div className="leading-relaxed text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {puja.description}
              </div>
            )}

            {/* Puja Festival Schedule & Timings */}
            {(puja.date || puja.time || puja.openingTime) && (
              <div className="space-y-2 border-t border-slate-100 pt-3">
                {puja.date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900">Festival Dates</div>
                      <div className="text-xs text-slate-600">{puja.date}</div>
                    </div>
                  </div>
                )}
                {(puja.time || puja.openingTime) && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900">Visiting Hours</div>
                      <div className="text-xs text-slate-600">
                        {puja.openingTime && puja.closingTime
                          ? `${puja.openingTime} - ${puja.closingTime}`
                          : puja.time}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Address with copy affordance */}
            {displayAddress && (
              <div className="flex items-start gap-3 border-t border-slate-100 pt-3">
                <MapPin className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">Address</div>
                  <div className="text-xs text-slate-600 mt-0.5">{displayAddress}</div>
                </div>
                <button
                  onClick={handleCopyAddress}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Copy address"
                >
                  {copiedAddress ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* Distance / Route Information */}
            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-start gap-3">
                <Compass className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">Walking &amp; Route Guidance</div>
                  {puja.distanceInfo && (
                    <div className="text-xs text-slate-600 mt-0.5">{puja.distanceInfo}</div>
                  )}

                  {/* Geolocation Distance */}
                  {userLocation ? (
                    <div className="text-xs font-semibold text-emerald-700 mt-1">
                      {getCalculatedDistance()}
                    </div>
                  ) : (
                    <button
                      onClick={handleGetDistance}
                      disabled={calculatingLocation}
                      className="mt-1 text-xs text-orange-600 hover:text-orange-700 font-medium underline cursor-pointer"
                    >
                      {calculatingLocation ? 'Detecting current location...' : 'Calculate distance from my location'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Google Weekly Hours (if present) */}
            {googleData?.regularOpeningHours && (
              <div className="border-t border-slate-100 pt-3">
                <button
                  onClick={() => setShowHours(!showHours)}
                  className="w-full flex items-center justify-between text-xs font-medium text-slate-800 hover:text-slate-950 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        googleData.regularOpeningHours.openNow ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    {googleData.regularOpeningHours.openNow ? 'Open Now' : 'Closed Now'}
                  </span>
                  {showHours ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showHours && googleData.regularOpeningHours.weekdayDescriptions && (
                  <ul className="mt-2 space-y-1 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {googleData.regularOpeningHours.weekdayDescriptions.map((desc, i) => (
                      <li key={i}>{desc}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Phone & Website links */}
            {(displayPhone || displayWebsite) && (
              <div className="border-t border-slate-100 pt-3 space-y-2">
                {displayPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-orange-600 shrink-0" />
                    <a
                      href={`tel:${displayPhone.replace(/\s+/g, '')}`}
                      className="text-xs text-orange-600 hover:underline"
                    >
                      {displayPhone}
                    </a>
                  </div>
                )}
                {displayWebsite && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-orange-600 shrink-0" />
                    <a
                      href={displayWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-orange-600 hover:underline truncate"
                    >
                      {displayWebsite.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Small Map Preview (Maps Embed iframe loaded strictly on demand) */}
            <div className="border-t border-slate-100 pt-3">
              <div className="font-semibold text-slate-900 text-xs mb-2">Location Coordinates</div>
              <div className="w-full h-36 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative">
                <iframe
                  title={`Map preview for ${puja.name}`}
                  src={`https://www.google.com/maps?q=${puja.latitude},${puja.longitude}&hl=en&z=15&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
                Lat: {puja.latitude.toFixed(4)}, Lng: {puja.longitude.toFixed(4)}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PHOTOS */}
        {activeTab === 'photos' && (
          <div className="grid grid-cols-2 gap-2">
            {allPhotos.map((photoUrl, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => {
                  setActivePhotoIndex(i);
                  setActiveTab('overview');
                }}
              >
                <img
                  src={photoUrl}
                  alt={`${puja.name} photo ${i + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: REVIEWS (Top 3-5 Google Reviews with required attribution) */}
        {activeTab === 'reviews' && (
          <div className="space-y-3">
            {loadingGoogle ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="animate-pulse p-3 bg-slate-50 rounded-xl space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-200 rounded w-full" />
                    <div className="h-3 bg-slate-200 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : googleData?.reviews && googleData.reviews.length > 0 ? (
              <>
                {googleData.reviews.slice(0, 5).map((rev, i) => (
                  <div key={i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-xs text-slate-900">
                        {rev.authorAttribution?.displayName || 'Google Reviewer'}
                      </div>
                      {rev.rating && (
                        <div className="flex items-center text-amber-500 text-xs">
                          <Star className="w-3 h-3 fill-amber-400 stroke-amber-500 mr-0.5" />
                          <span>{rev.rating}</span>
                        </div>
                      )}
                    </div>
                    {rev.relativePublishTimeDescription && (
                      <div className="text-[10px] text-slate-400">
                        {rev.relativePublishTimeDescription}
                      </div>
                    )}
                    {rev.text?.text && (
                      <div className="text-xs text-slate-600 leading-relaxed">
                        {rev.text.text}
                      </div>
                    )}
                  </div>
                ))}

                <div className="pt-2 text-center">
                  <a
                    href={mapsSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-medium hover:underline"
                  >
                    <span>More reviews on Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">
                No Google reviews available for this pandal yet.
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ABOUT */}
        {activeTab === 'about' && (
          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <div>
              <div className="font-semibold text-slate-900 mb-1">About This Location</div>
              <p>
                {puja.description ||
                  `${puja.name} is one of the premier Durga Puja pandals in North/Central Kolkata, featuring traditional artistic idol displays and festive cultural celebrations.`}
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-amber-900">
              <div className="font-semibold mb-0.5">Crowd &amp; Route Notice</div>
              Follow pink directional route markings on the map for police-designated one-way pedestrian and vehicular flow during festival nights.
            </div>
            <div>
              <div className="font-semibold text-slate-900 mb-1">Source of Truth</div>
              <p>
                Information and pandal names are curated directly by the map administrator. External Google data is only referenced as secondary enrichment.
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
