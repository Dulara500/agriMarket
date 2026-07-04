import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useCartStore, useAuthStore } from '../../store';
import toast from 'react-hot-toast';
import { ArrowLeft, Star, MapPin, Package, ShoppingCart, BadgeCheck, Shield, Phone, MessageCircle, Navigation } from 'lucide-react';

function StarRating({ rating, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${sz} ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </div>
  );
}

function DistanceBadge({ distanceKm, hasLocation, navigate }) {
  if (hasLocation && distanceKm !== null) {
    const color = distanceKm <= 5 ? 'text-green-600' : distanceKm <= 10 ? 'text-amber-600' : 'text-orange-600';
    return (
      <span className={`flex items-center gap-1 text-xs ${color} font-semibold`}>
        <MapPin className="w-3 h-3" /> {distanceKm} km away
      </span>
    );
  }
  if (!hasLocation) {
    return (
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 transition-colors"
      >
        <Navigation className="w-3 h-3" /> Set location for distance
      </button>
    );
  }
  return null;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [product, setProduct] = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [adding, setAdding] = useState({});
  const [radius, setRadius] = useState(20);         // km; 0 = no limit
  const [customInput, setCustomInput] = useState(''); // controlled input for custom value
  const { addToCart } = useCartStore();

  const PRESETS = [5, 10, 20, 50, 100];

  const buyerLat = user?.location_lat ? parseFloat(user.location_lat) : null;
  const buyerLng = user?.location_lng ? parseFloat(user.location_lng) : null;
  const hasLocation = buyerLat !== null && buyerLng !== null;

  useEffect(() => {
    const params = {};
    if (hasLocation) {
      params.lat = buyerLat;
      params.lng = buyerLng;
      params.radius = radius; // 0 = no limit
    }
    Promise.all([
      api.get(`/products/${id}`),
      api.get(`/products/${id}/farmers`, { params }),
    ]).then(([pRes, fRes]) => {
      setProduct(pRes.data.data);
      setFarmers(fRes.data.data);
      const init = {};
      fRes.data.data.forEach(f => { init[f.farmer_product_id] = 1; });
      setQuantities(init);
    }).finally(() => setLoading(false));
  }, [id, buyerLat, buyerLng, radius]);

  const applyCustomRadius = (e) => {
    e.preventDefault();
    const val = parseFloat(customInput);
    if (!isNaN(val) && val >= 0) {
      setRadius(val);
      setCustomInput('');
    }
  };

  const handleAddToCart = async (farmer) => {
    setAdding(a => ({ ...a, [farmer.farmer_product_id]: true }));
    try {
      await addToCart(farmer.farmer_product_id, quantities[farmer.farmer_product_id] || 1);
      toast.success(`Added to cart! Reserved for 15 min 🛒`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAdding(a => ({ ...a, [farmer.farmer_product_id]: false }));
    }
  };

  if (loading) return (
    <div className="p-4 animate-pulse">
      <div className="h-48 bg-gray-200 rounded-2xl mb-4" />
      <div className="h-5 bg-gray-200 rounded w-1/2 mb-3" />
      {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl mb-3" />)}
    </div>
  );

  if (!product) return <div className="p-4 text-center text-gray-500">Product not found</div>;

  return (
    <div>
      {/* Hero image */}
      <div className="relative h-52">
        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover"
          onError={e => e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400'} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md">
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </button>
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-xl font-bold text-white">{product.name}</h1>
          {product.description && <p className="text-white/80 text-sm mt-0.5 line-clamp-1">{product.description}</p>}
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Government price badge */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 rounded-2xl border border-green-100">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-green-700 font-semibold">Government Fixed Price</p>
            <p className="text-lg font-bold text-green-800">
              Rs. {parseFloat(product.government_price || 0).toFixed(2)} / {product.unit}
            </p>
          </div>
        </div>

        {/* Proximity filter */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-gray-900">
              Available Farmers <span className="text-gray-400 font-normal text-sm">({farmers.length})</span>
            </h2>
            {hasLocation ? (
              <span className="text-xs text-gray-500 font-medium">
                {radius === 0 ? 'Showing all' : `Within ${radius} km`}
              </span>
            ) : (
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 hover:bg-amber-100 transition-colors"
              >
                <Navigation className="w-3 h-3" /> Set location
              </button>
            )}
          </div>

          {/* Radius picker — only show when buyer has location */}
          {hasLocation && (
            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
              {/* Preset chips */}
              <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                {PRESETS.map(km => (
                  <button
                    key={km}
                    onClick={() => { setRadius(km); setCustomInput(''); }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      radius === km
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-green-400 hover:text-green-700'
                    }`}
                  >
                    {km} km
                  </button>
                ))}
                <button
                  onClick={() => { setRadius(0); setCustomInput(''); }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    radius === 0
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400 hover:text-blue-700'
                  }`}
                >
                  Any distance
                </button>
              </div>

              {/* Custom input */}
              <form onSubmit={applyCustomRadius} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    placeholder="Custom distance…"
                    className="w-full pl-3 pr-10 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">km</span>
                </div>
                <button
                  type="submit"
                  disabled={!customInput}
                  className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </form>
            </div>
          )}
        </div>

        {farmers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No farmers available</p>
            <p className="text-sm mt-1">
              {hasLocation && radius > 0
                ? `No farmers within ${radius} km have stock.`
                : 'Check back later.'}
            </p>
            {hasLocation && radius > 0 && (
              <div className="flex flex-col items-center gap-2 mt-3">
                <button
                  onClick={() => setRadius(Math.min(radius * 2, 500))}
                  className="text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-full transition-colors"
                >
                  Try {Math.min(radius * 2, 500)} km instead
                </button>
                <button
                  onClick={() => setRadius(0)}
                  className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full transition-colors"
                >
                  Show all farmers
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {farmers.map(farmer => (
              <div key={farmer.farmer_product_id} className="bg-white rounded-2xl p-4 card-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-lg">
                    {farmer.farmer_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{farmer.farmer_name}</h3>
                      {farmer.is_verified && <BadgeCheck className="w-4 h-4 text-green-600" />}
                    </div>
                    <p className="text-xs text-gray-500">{farmer.farm_name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <StarRating rating={farmer.rating_avg || 0} />
                        <span className="text-xs text-gray-500">({farmer.total_ratings || 0})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <DistanceBadge
                        distanceKm={farmer.distance_km}
                        hasLocation={hasLocation}
                        navigate={navigate}
                      />
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Package className="w-3 h-3" /> {farmer.stock_quantity} {product.unit} left
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quantity + Add to cart */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                    <button
                      onClick={() => setQuantities(q => ({ ...q, [farmer.farmer_product_id]: Math.max(0.5, (q[farmer.farmer_product_id] || 1) - 0.5) }))}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 text-lg font-bold transition-colors"
                    >−</button>
                    <span className="w-10 text-center text-sm font-semibold">{quantities[farmer.farmer_product_id] || 1}</span>
                    <button
                      onClick={() => setQuantities(q => ({ ...q, [farmer.farmer_product_id]: Math.min(farmer.stock_quantity, (q[farmer.farmer_product_id] || 1) + 0.5) }))}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 text-lg font-bold transition-colors"
                    >+</button>
                  </div>
                  <button
                    onClick={() => handleAddToCart(farmer)}
                    disabled={adding[farmer.farmer_product_id]}
                    className="flex-1 gradient-green text-white py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {adding[farmer.farmer_product_id] ? 'Adding...' : 'Add to Cart'}
                  </button>
                  <div className="flex gap-1 shrink-0">
                    {farmer.farmer_phone && (
                      <a
                        href={`tel:${farmer.farmer_phone}`}
                        className="w-9 h-9 border border-gray-200 text-gray-500 rounded-xl flex items-center justify-center hover:text-green-600 hover:bg-green-50 transition-colors shadow-sm"
                        title="Call Farmer"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    {farmer.farmer_phone && (
                      <a
                        href={`https://wa.me/${farmer.farmer_phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 border border-gray-200 text-gray-500 rounded-xl flex items-center justify-center hover:text-green-600 hover:bg-green-50 transition-colors shadow-sm"
                        title="WhatsApp Farmer"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
