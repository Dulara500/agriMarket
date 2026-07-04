import React, { useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';
import { MapPin, Navigation, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

/**
 * LocationPicker — reusable component for both farmers and buyers.
 * Shows current saved location and provides a "Use My Location" button
 * that calls the browser Geolocation API + Nominatim reverse geocode.
 */
export default function LocationPicker() {
  const { user, refreshUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  const hasLocation = user?.location_lat && user?.location_lng;

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data?.display_name) {
        // Return a shortened version: city + state/country
        const parts = data.display_name.split(',');
        return parts.slice(0, 3).join(',').trim();
      }
    } catch {}
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  const handleSetLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoError('');
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const address = await reverseGeocode(lat, lng);
          await api.patch('/auth/location', { lat, lng, address });
          await refreshUser();
          toast.success('Location saved! 📍');
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to save location');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        if (err.code === 1) setGeoError('Location permission denied. Please allow access in your browser settings.');
        else if (err.code === 2) setGeoError('Location unavailable. Try again.');
        else setGeoError('Location request timed out. Try again.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="bg-white rounded-2xl card-shadow overflow-hidden mb-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
          <MapPin className="w-3.5 h-3.5 text-green-700" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">My Location</p>
          <p className="text-[11px] text-gray-500">Used to find nearby farmers/buyers</p>
        </div>
        {hasLocation && (
          <div className="ml-auto">
            <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" /> Set
            </span>
          </div>
        )}
      </div>

      <div className="px-4 py-3">
        {/* Current location display */}
        {hasLocation ? (
          <div className="flex items-start gap-2 mb-3">
            <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 font-medium">Current location</p>
              <p className="text-sm text-gray-800 font-medium leading-snug mt-0.5">
                {user.location_address || `${parseFloat(user.location_lat).toFixed(4)}, ${parseFloat(user.location_lng).toFixed(4)}`}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {parseFloat(user.location_lat).toFixed(5)}°, {parseFloat(user.location_lng).toFixed(5)}°
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-3 py-2 px-3 bg-amber-50 rounded-xl border border-amber-100">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700 font-medium">No location set. Buyers cannot find you by proximity.</p>
          </div>
        )}

        {/* Error message */}
        {geoError && (
          <div className="mb-3 py-2 px-3 bg-red-50 rounded-xl border border-red-100">
            <p className="text-xs text-red-600">{geoError}</p>
          </div>
        )}

        {/* Action button */}
        <button
          onClick={handleSetLocation}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-60
            bg-green-600 text-white hover:bg-green-700"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Detecting location…</>
          ) : hasLocation ? (
            <><Navigation className="w-4 h-4" /> Update Location</>
          ) : (
            <><Navigation className="w-4 h-4" /> Use My Current Location</>
          )}
        </button>
      </div>
    </div>
  );
}
