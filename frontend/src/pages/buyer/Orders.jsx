import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Package, ChevronDown, Star, Phone, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  accepted: { label: 'Accepted', color: 'bg-blue-100 text-blue-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
  preparing: { label: 'Preparing', color: 'bg-purple-100 text-purple-700' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Delivered', color: 'bg-teal-100 text-teal-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600' },
};

function ReviewModal({ orderId, farmerId, onClose, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post(`/orders/${orderId}/review`, { rating, comment });
      toast.success('Review submitted!');
      onSubmit();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-10">
        <h3 className="text-lg font-bold mb-1">Rate Your Farmer</h3>
        <p className="text-sm text-gray-500 mb-4">How was your experience?</p>
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} onClick={() => setRating(s)} className="text-3xl transition-transform hover:scale-110">
              {s <= rating ? '⭐' : '☆'}
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Write a comment (optional)..."
          rows={3}
          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none mb-4"
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 gradient-green text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-60">
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BuyerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [reviewOrder, setReviewOrder] = useState(null);

  const load = () => {
    api.get('/orders').then(res => setOrders(res.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleMarkCompleted = async (orderId) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'completed' });
      toast.success('Order marked as completed!');
      setReviewOrder(orderId);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <div className="p-4 space-y-3 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-28 bg-gray-200 rounded-2xl"/>)}</div>;

  return (
    <div className="px-4 py-4">
      <h1 className="text-xl font-bold text-gray-900 mb-4">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Package className="w-14 h-14 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const isExpanded = expanded[order.id];
            return (
              <div key={order.id} className="bg-white rounded-2xl card-shadow overflow-hidden">
                <button
                  className="w-full p-4 text-left"
                  onClick={() => setExpanded(e => ({ ...e, [order.id]: !e[order.id] }))}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">#{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{order.farm_name || order.farmer_name} • {new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-xs text-gray-500">{order.items?.length} item(s)</p>
                    <p className="text-sm font-bold text-green-700">Rs. {parseFloat(order.total_amount).toFixed(2)}</p>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-50">
                    <div className="space-y-2 pt-3">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <img src={item.product_image} alt={item.product_name} className="w-10 h-10 rounded-lg object-cover"
                            onError={e => e.target.src='https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100'} />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{item.product_name}</p>
                            <p className="text-xs text-gray-400">{item.quantity} {item.unit} × Rs. {parseFloat(item.price_at_order).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {order.delivery_address && (
                      <p className="text-xs text-gray-500 mt-3 flex items-start gap-1">
                        <span className="font-medium">Address:</span> {order.delivery_address}
                      </p>
                    )}
                    <div className="mt-3 pt-3 border-t border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="text-xs text-gray-500">
                        <p className="font-semibold text-gray-700">Farmer Contact Details:</p>
                        <p className="mt-0.5">Name: {order.farmer_name} {order.farm_name && `(${order.farm_name})`}</p>
                        {order.farmer_phone && <p className="mt-0.5">Phone: {order.farmer_phone}</p>}
                        {order.farmer_email && <p className="mt-0.5">Email: {order.farmer_email}</p>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {order.farmer_phone && (
                          <a
                            href={`tel:${order.farmer_phone}`}
                            className="px-3 py-1.5 border border-gray-200 text-gray-600 hover:text-green-700 hover:bg-green-55/40 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm bg-white"
                          >
                            <Phone className="w-3.5 h-3.5" /> Call Farmer
                          </a>
                        )}
                        {order.farmer_phone && (
                          <a
                            href={`https://wa.me/${order.farmer_phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 border border-gray-200 text-gray-600 hover:text-green-700 hover:bg-green-55/40 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm bg-white"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                    {order.status === 'delivered' && (
                      <button onClick={() => handleMarkCompleted(order.id)}
                        className="w-full mt-3 gradient-green text-white py-2.5 rounded-xl text-sm font-semibold">
                        Mark as Received ✓
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {reviewOrder && (
        <ReviewModal
          orderId={reviewOrder}
          onClose={() => setReviewOrder(null)}
          onSubmit={load}
        />
      )}
    </div>
  );
}
