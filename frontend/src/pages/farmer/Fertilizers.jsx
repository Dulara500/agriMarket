import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import {
  Sprout, Calendar, MapPin, Package, Check, Clock,
  ChevronDown, ChevronUp, AlertTriangle, Navigation, ArrowRight
} from 'lucide-react';

const STATUS_BADGE = {
  upcoming: { label: 'Upcoming',  cls: 'bg-blue-100 text-blue-700' },
  open:     { label: 'Open Now',  cls: 'bg-green-100 text-green-700 animate-pulse' },
  closed:   { label: 'Closed',    cls: 'bg-gray-100 text-gray-500' },
};

const CLAIM_BADGE = {
  claimed:   { label: 'Claimed ✓',   cls: 'bg-amber-100 text-amber-700' },
  collected: { label: 'Collected ✓', cls: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled',   cls: 'bg-red-100 text-red-600' },
};

export default function FarmerFertilizers() {
  const [programs, setPrograms] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState({});
  const [expanded, setExpanded] = useState({});
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const hasLocation = user?.location_lat && user?.location_lng;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        api.get('/farmer/fertilizers'),
        api.get('/farmer/fertilizers/my-claims'),
      ]);
      setPrograms(pRes.data.data);
      setClaims(cRes.data.data);
    } catch { toast.error('Failed to load fertilizer programs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleClaim = async (programId) => {
    const ok = window.confirm("Are you sure you want to claim your subsidized fertilizer allocation? This claim can only be collected on the specified distribution day.");
    if (!ok) return;

    setClaiming(c => ({ ...c, [programId]: true }));
    try {
      await api.post(`/farmer/fertilizers/${programId}/claim`);
      toast.success('Allocation claimed! 🌱');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to claim');
    } finally {
      setClaiming(c => ({ ...c, [programId]: false }));
    }
  };

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  if (loading) return (
    <div className="px-4 py-4 space-y-4 animate-pulse">
      {[1, 2].map(i => <div key={i} className="h-48 bg-gray-200 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="px-4 py-4">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center">
            <Sprout className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Fertilizer Allocations</h1>
        </div>
        <p className="text-sm text-gray-500">Government-subsidized fertilizers available for monthly collection</p>
      </div>

      {/* No location warning */}
      {!hasLocation && (
        <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Set your location</p>
            <p className="text-xs text-amber-600">We use your location to show the nearest collection branch</p>
          </div>
          <button onClick={() => navigate('/farmer')} className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-full">
            Set now
          </button>
        </div>
      )}

      {/* Active / Upcoming Programs */}
      {programs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 mb-6">
          <Sprout className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-600">No programs available</p>
          <p className="text-sm text-gray-400 mt-1">Check back later for upcoming fertilizer distributions</p>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {programs.map(p => {
            const isClaimed = !!p.my_claim_id;
            const isOpen = p.status === 'open';
            const isUpcoming = p.status === 'upcoming';
            const pct = p.total_quantity > 0
              ? Math.round((parseFloat(p.available_quantity) / parseFloat(p.total_quantity)) * 100)
              : 0;
            const savings = p.market_price
              ? ((parseFloat(p.market_price) - parseFloat(p.subsidized_price)) * parseFloat(p.quantity_per_farmer)).toFixed(2)
              : null;

            return (
              <div key={p.id} className="bg-white rounded-2xl card-shadow overflow-hidden">
                {/* Status banner */}
                <div className={`px-4 py-2 flex items-center justify-between ${
                  isOpen ? 'bg-green-600' : isUpcoming ? 'bg-blue-600' : 'bg-gray-400'
                }`}>
                  <div className="flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-white" />
                    <span className="text-white text-sm font-bold">{p.fertilizer_name}</span>
                  </div>
                  <span className="text-white/80 text-xs font-semibold">
                    {STATUS_BADGE[p.status]?.label}
                  </span>
                </div>

                <div className="p-4">
                  {/* Distribution date */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[10px] text-blue-500 font-bold uppercase leading-tight">
                        {new Date(p.distribution_date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-lg font-extrabold text-blue-700 leading-tight">
                        {new Date(p.distribution_date).getDate()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {new Date(p.distribution_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-400">Collection date</p>
                    </div>
                  </div>

                  {/* Price comparison */}
                  <div className="flex items-center gap-4 bg-green-50 rounded-xl p-3 mb-3">
                    <div>
                      <p className="text-[10px] text-green-700 font-bold uppercase tracking-wide">You Pay</p>
                      <p className="text-lg font-extrabold text-green-700">
                        Rs. {parseFloat(p.subsidized_price).toFixed(2)} / {p.unit}
                      </p>
                    </div>
                    {p.market_price && (
                      <>
                        <div className="h-8 w-px bg-green-200" />
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Market Price</p>
                          <p className="text-sm font-semibold text-gray-400 line-through">
                            Rs. {parseFloat(p.market_price).toFixed(2)}
                          </p>
                        </div>
                        {savings && (
                          <>
                            <div className="h-8 w-px bg-green-200" />
                            <div>
                              <p className="text-[10px] text-green-700 font-bold uppercase tracking-wide">You Save</p>
                              <p className="text-sm font-bold text-green-600">Rs. {savings}</p>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>

                  {/* Allocation */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Your allocation</span>
                        <span className="text-xs font-bold text-gray-700">{p.quantity_per_farmer} {p.unit}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Quota remaining</span>
                        <span className="text-xs font-bold text-gray-700">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Collection Branch */}
                  <button onClick={() => toggleExpand(p.id)} className="w-full text-left">
                    <div className="flex items-center justify-between py-2.5 border-t border-b border-gray-50">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{p.branch_name}</p>
                          <p className="text-xs text-gray-400">{p.branch_address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.branch_distance_km !== null && (
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            {p.branch_distance_km} km
                          </span>
                        )}
                        {expanded[p.id] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>
                  </button>

                  {/* Expanded nearest branches */}
                  {expanded[p.id] && p.nearest_branches?.length > 0 && (
                    <div className="pt-2 space-y-1.5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Other nearby branches</p>
                      {p.nearest_branches.map(b => (
                        <div key={b.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50">
                          <MapPin className="w-3 h-3 text-gray-300 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-700 truncate">{b.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{b.address}</p>
                          </div>
                          {b.distance_km !== null && (
                            <span className="text-[10px] font-bold text-gray-400 flex-shrink-0">{b.distance_km} km</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {p.notes && (
                    <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-50">📌 {p.notes}</p>
                  )}

                  {/* CTA */}
                  <div className="mt-4">
                    {isClaimed ? (
                      <div className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold ${CLAIM_BADGE[p.my_claim_status]?.cls}`}>
                        <Check className="w-4 h-4" />
                        {CLAIM_BADGE[p.my_claim_status]?.label}
                      </div>
                    ) : p.status === 'closed' ? (
                      <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-400">
                        Program Closed
                      </div>
                    ) : p.status === 'upcoming' ? (
                      <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-blue-50 text-blue-500 border border-blue-100">
                        Upcoming Distribution
                      </div>
                    ) : (
                      <button
                        onClick={() => handleClaim(p.id)}
                        disabled={claiming[p.id] || parseFloat(p.available_quantity) < parseFloat(p.quantity_per_farmer)}
                        className="w-full gradient-green text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Sprout className="w-4 h-4" />
                        {claiming[p.id] ? 'Claiming…' : parseFloat(p.available_quantity) < parseFloat(p.quantity_per_farmer) ? 'Quota Full' : `Claim ${p.quantity_per_farmer} ${p.unit}`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* My Claims History */}
      {claims.length > 0 && (
        <div>
          <h2 className="font-bold text-gray-900 mb-3">My Claim History</h2>
          <div className="space-y-2">
            {claims.map(c => (
              <div key={c.id} className="bg-white rounded-2xl p-3 card-shadow flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sprout className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{c.fertilizer_name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {c.branch_name} · {new Date(c.distribution_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-400">{c.quantity} {c.unit} · Rs. {parseFloat(c.subsidized_price).toFixed(2)}/{c.unit}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${CLAIM_BADGE[c.status]?.cls}`}>
                  {CLAIM_BADGE[c.status]?.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
