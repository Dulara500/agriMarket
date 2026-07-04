import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { Search, ChevronRight, Leaf, TrendingUp, Star, Heart, MapPin, X } from 'lucide-react';
import { useAuthStore } from '../../store';

const CATEGORY_COLORS = {
  Vegetables: 'bg-green-100 text-green-700',
  'Leafy Greens': 'bg-emerald-100 text-emerald-700',
  Fruits: 'bg-orange-100 text-orange-700',
  default: 'bg-gray-100 text-gray-600',
};

export default function BuyerHome() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [locationBannerDismissed, setLocationBannerDismissed] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';

  const buyerLat = user?.location_lat ? parseFloat(user.location_lat) : null;
  const buyerLng = user?.location_lng ? parseFloat(user.location_lng) : null;
  const hasLocation = buyerLat !== null && buyerLng !== null;

  useEffect(() => {
    setLoading(true);
    const params = { search, category: activeCategory };
    if (hasLocation) {
      params.lat = buyerLat;
      params.lng = buyerLng;
    }
    Promise.all([
      api.get('/products', { params }),
      api.get('/products/categories'),
    ]).then(([pRes, cRes]) => {
      setProducts(pRes.data.data);
      setCategories(cRes.data.data);
    }).finally(() => setLoading(false));
  }, [search, activeCategory, buyerLat, buyerLng]);

  const handleMobileSearch = (e) => {
    const val = e.target.value;
    setSearchParams(val ? { search: val } : {});
  };

  return (
    <div className="px-4 py-5 max-w-6xl mx-auto">
      {/* Greeting banner */}
      <div className="gradient-green rounded-3xl p-6 mb-6 text-white relative overflow-hidden shadow-sm">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute -right-2 top-12 w-16 h-16 bg-white/5 rounded-full" />
        <p className="text-sm text-green-200 font-medium">Good morning 🌱</p>
        <h2 className="text-2xl font-bold mt-1">Welcome, {user?.name?.split(' ')[0]}!</h2>
        <p className="text-sm text-green-100 mt-1 max-w-md">Browse fresh farm-direct crops and buy directly at government-fixed fair prices.</p>
        <div className="flex items-center gap-3 mt-4">
          <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3.5 py-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Standard Pricing</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3.5 py-1">
            <Star className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Verified Farmers</span>
          </div>
          {hasLocation && (
            <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3.5 py-1">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">Within 20 km</span>
            </div>
          )}
        </div>
      </div>

      {/* No-location soft banner */}
      {!hasLocation && !locationBannerDismissed && (
        <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">Set your location</p>
            <p className="text-xs text-amber-600 mt-0.5">See only farmers within 20 km of you</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => navigate('/profile')}
              className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-full transition-colors"
            >
              Set now
            </button>
            <button
              onClick={() => setLocationBannerDismissed(true)}
              className="p-1 rounded-full text-amber-400 hover:text-amber-600 hover:bg-amber-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile-only Search */}
      <div className="relative mb-5 md:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search vegetables, fruits..."
          value={search}
          onChange={handleMobileSearch}
          className="w-full pl-9 pr-4 py-3 rounded-full border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#002d1e] text-sm shadow-sm"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
        <button
          onClick={() => setActiveCategory('')}
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
            !activeCategory
              ? 'bg-[#002d1e] text-white shadow-sm'
              : 'bg-[#ebedf7] text-[#002d1e] hover:bg-[#ebedf7]/80'
          }`}
        >
          All Crops
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat === activeCategory ? '' : cat)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeCategory === cat
                ? 'bg-[#002d1e] text-white shadow-sm'
                : 'bg-[#ebedf7] text-[#002d1e] hover:bg-[#ebedf7]/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product list header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          {activeCategory || 'Available Produce'} <span className="text-gray-400 font-normal text-sm">({products.length})</span>
        </h3>
        {hasLocation && (
          <span className="flex items-center gap-1 text-xs text-green-700 font-semibold bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
            <MapPin className="w-3 h-3" /> Nearby farmers
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
              <div className="h-44 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-10 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <Leaf className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-700">No products found</p>
          <p className="text-sm text-gray-400 mt-1">
            {hasLocation
              ? 'No farmers within 20 km have stock. Try again later.'
              : 'Try resetting the filters or check again later.'}
          </p>
          {hasLocation && (
            <button
              onClick={() => navigate('/profile')}
              className="mt-4 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-full transition-colors"
            >
              Change location
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div
              key={product.id}
              onClick={() => navigate(`/product/${product.id}`)}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div className="relative h-44 overflow-hidden bg-gray-50">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400'}
                />
                {/* Fresh Crop Badge */}
                <div className="absolute top-3 left-3">
                  <span className="bg-white/95 backdrop-blur-sm text-[#002d1e] text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                    Fresh Crop
                  </span>
                </div>
                {/* Category Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm ${CATEGORY_COLORS[product.category] || CATEGORY_COLORS.default}`}>
                    {product.category}
                  </span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-gray-900 text-base group-hover:text-[#002d1e] transition-colors">{product.name}</h4>
                    <Heart className="w-4 h-4 text-gray-400 hover:text-red-500 hover:fill-red-500 transition-colors shrink-0" />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Origin: Sri Lanka</p>
                </div>

                <div className="mt-3">
                  {/* Price Box */}
                  <div className="gov-price-box">
                    <p className="text-[9px] text-[#1b5e20] font-bold tracking-wider uppercase">GOVERNMENT FIXED PRICE</p>
                    <p className="text-[#1b5e20] text-base font-extrabold mt-0.5">
                      Rs. {product.government_price ? parseFloat(product.government_price).toFixed(2) : '0.00'} / {product.unit}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <span className="font-medium">
                      {product.available_farmers > 0
                        ? `${product.available_farmers} farmer${product.available_farmers > 1 ? 's' : ''} ${hasLocation ? 'nearby' : 'selling'}`
                        : hasLocation ? 'None within 20 km' : 'No active stock'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
