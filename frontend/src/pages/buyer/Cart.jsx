import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store';
import { ShoppingCart, Trash2, Clock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

function CountdownTimer({ reservedUntil }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(reservedUntil) - Date.now();
      if (diff <= 0) { setTimeLeft('Expired'); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setUrgent(diff < 3 * 60000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [reservedUntil]);

  return (
    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
      urgent ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
    }`}>
      <Clock className="w-3 h-3" /> {timeLeft}
    </span>
  );
}

export default function Cart() {
  const { items, total, loading, fetchCart, removeFromCart } = useCartStore();
  const navigate = useNavigate();
  const [removing, setRemoving] = useState({});

  useEffect(() => { fetchCart(); }, []);

  const handleRemove = async (id) => {
    setRemoving(r => ({ ...r, [id]: true }));
    try {
      await removeFromCart(id);
      toast.success('Item removed');
    } catch {
      toast.error('Failed to remove');
    } finally {
      setRemoving(r => ({ ...r, [id]: false }));
    }
  };

  if (loading) return (
    <div className="p-4 animate-pulse space-y-3">
      {[1,2].map(i => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="px-4 py-4">
      <h1 className="text-xl font-bold text-gray-900 mb-4">My Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart className="w-14 h-14 mx-auto text-gray-200 mb-4" />
          <p className="font-semibold text-gray-600">Your cart is empty</p>
          <p className="text-sm text-gray-400 mt-1">Browse fresh vegetables and add them to cart</p>
          <button
            onClick={() => navigate('/')}
            className="mt-5 gradient-green text-white px-6 py-2.5 rounded-xl font-semibold text-sm"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <>
          {/* Reservation notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4 flex items-start gap-2">
            <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">Items are reserved for you. Complete checkout before time runs out!</p>
          </div>

          <div className="space-y-3 mb-4">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-2xl p-4 card-shadow">
                <div className="flex gap-3">
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                    onError={e => e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100'}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{item.product_name}</h3>
                        <p className="text-xs text-gray-500">{item.farm_name || item.farmer_name}</p>
                      </div>
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={removing[item.id]}
                        className="p-1 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <CountdownTimer reservedUntil={item.reserved_until} />
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{item.quantity} {item.unit} × Rs. {parseFloat(item.price_per_unit).toFixed(2)}</p>
                        <p className="text-sm font-bold text-green-700">
                          Rs. {(item.quantity * item.price_per_unit).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl p-4 card-shadow mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Subtotal ({items.length} items)</span>
              <span>Rs. {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mb-3">
              <span>Delivery</span>
              <span className="text-green-600 font-medium">Free</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base pt-3 border-t border-gray-100">
              <span>Total</span>
              <span className="text-green-700">Rs. {total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full gradient-green text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all text-base"
          >
            Proceed to Checkout <ArrowRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}
