import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useCartStore } from '../../store';
import toast from 'react-hot-toast';
import { MapPin, CreditCard, Banknote, CheckCircle, ArrowLeft } from 'lucide-react';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, fetchCart, clearCart } = useCartStore();
  const [form, setForm] = useState({ delivery_address: '', payment_method: 'cod', notes: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => { fetchCart(); }, []);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!form.delivery_address) return toast.error('Delivery address is required');
    setLoading(true);
    try {
      await api.post('/orders', form);
      setSuccess(true);
      toast.success('🎉 Orders placed successfully!');
      await clearCart();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
        <div className="w-20 h-20 gradient-green rounded-full flex items-center justify-center mb-4 animate-bounce">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
        <p className="text-gray-500 text-sm mb-6">Your orders have been sent to the farmers. You'll be notified when they accept.</p>
        <button
          onClick={() => navigate('/orders')}
          className="gradient-green text-white px-8 py-3 rounded-2xl font-bold"
        >
          View My Orders
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <button onClick={() => navigate('/cart')} className="flex items-center gap-1 text-gray-500 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to cart
      </button>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Checkout</h1>

      <form onSubmit={handleCheckout} className="space-y-4">
        {/* Delivery address */}
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-600" /> Delivery Address
          </h2>
          <textarea
            value={form.delivery_address}
            onChange={e => setForm({ ...form, delivery_address: e.target.value })}
            placeholder="Enter your full delivery address..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            required
          />
          <input
            type="text"
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="Special notes for delivery (optional)"
            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mt-2"
          />
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-green-600" /> Payment Method
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'cod', label: 'Cash on Delivery', icon: Banknote },
              { value: 'digital', label: 'Digital Payment', icon: CreditCard },
            ].map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setForm({ ...form, payment_method: p.value })}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                  form.payment_method === p.value
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <p.icon className={`w-5 h-5 ${form.payment_method === p.value ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={`text-xs font-semibold ${form.payment_method === p.value ? 'text-green-700' : 'text-gray-600'}`}>
                  {p.label}
                </span>
              </button>
            ))}
          </div>
          {form.payment_method === 'digital' && (
            <div className="mt-3 p-3 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-600 font-medium">💳 Mock Payment — No real charges</p>
              <p className="text-xs text-blue-500 mt-0.5">Order will be confirmed automatically</p>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>
          {items.map(item => (
            <div key={item.id} className="flex justify-between text-sm py-1">
              <span className="text-gray-600">{item.product_name} × {item.quantity} {item.unit}</span>
              <span className="font-medium">Rs. {(item.quantity * item.price_per_unit).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-base pt-3 border-t border-gray-100 mt-2">
            <span>Total</span>
            <span className="text-green-700">Rs. {total.toFixed(2)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || items.length === 0}
          className="w-full gradient-green text-white py-4 rounded-2xl font-bold text-base hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
        >
          {loading ? 'Placing Orders...' : `Place Order • Rs. ${total.toFixed(2)}`}
        </button>
      </form>
    </div>
  );
}
