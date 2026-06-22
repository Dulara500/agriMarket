import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useCartStore } from '../../store';
import toast from 'react-hot-toast';
import { ArrowLeft, Star, MapPin, Package, ShoppingCart, BadgeCheck, Shield, Phone, MessageCircle } from 'lucide-react';

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

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [adding, setAdding] = useState({});
  const { addToCart } = useCartStore();

  useEffect(() => {
    Promise.all([
      api.get(`/products/${id}`),
      api.get(`/products/${id}/farmers`),
    ]).then(([pRes, fRes]) => {
      setProduct(pRes.data.data);
      setFarmers(fRes.data.data);
      const init = {};
      fRes.data.data.forEach(f => { init[f.farmer_product_id] = 1; });
      setQuantities(init);
    }).finally(() => setLoading(false));
  }, [id]);

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

        {/* Farmers list */}
        <h2 className="text-base font-bold text-gray-900 mb-3">
          Available Farmers <span className="text-gray-400 font-normal text-sm">({farmers.length})</span>
        </h2>

        {farmers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No farmers available</p>
            <p className="text-sm">Check back later</p>
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
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" /> {farmer.distance_km} km
                      </span>
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
