import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, ChevronDown, ShoppingBag, Phone, MessageCircle } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  accepted: { label: 'Accepted', color: 'bg-blue-100 text-blue-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
  preparing: { label: 'Preparing', color: 'bg-purple-100 text-purple-700' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Delivered', color: 'bg-teal-100 text-teal-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
};

export default function FarmerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [filter, setFilter] = useState('');

  const load = () => {
    const params = filter ? { status: filter } : {};
    api.get('/orders', { params }).then(res => setOrders(res.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const handleAction = async (orderId, status) => {
    setActionLoading(a => ({ ...a, [orderId]: status }));
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      toast.success(`Order ${status}!`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(a => ({ ...a, [orderId]: null }));
    }
  };

  return (
    <div className="px-4 py-4">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Orders</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {['', 'pending', 'accepted', 'completed', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === s ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === '' ? 'All' : STATUS_CONFIG[s]?.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-28 bg-gray-200 rounded-2xl"/>)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ShoppingBag className="w-14 h-14 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const isExpanded = expanded[order.id];
            const isLoading = actionLoading[order.id];
            return (
              <div key={order.id} className="bg-white rounded-2xl card-shadow overflow-hidden">
                <button
                  className="w-full p-4 text-left"
                  onClick={() => setExpanded(e => ({ ...e, [order.id]: !e[order.id] }))}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">#{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{order.buyer_name} • {new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-xs text-gray-500">{order.items?.length} item(s) • {order.payment_method?.toUpperCase()}</p>
                    <p className="text-sm font-bold text-green-700">Rs. {parseFloat(order.total_amount).toFixed(2)}</p>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-50">
                    <div className="space-y-2 pt-3 mb-3">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.product_name} × {item.quantity} {item.unit}</span>
                          <span className="font-medium">Rs. {(item.quantity * item.price_at_order).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    {order.delivery_address && (
                      <p className="text-xs text-gray-500 mb-3">📍 <span className="font-medium">Delivery Address:</span> {order.delivery_address}</p>
                    )}
                    <div className="bg-amber-50/45 border border-amber-100/60 rounded-xl p-3.5 mb-4 text-xs text-gray-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <p className="font-semibold text-gray-700">Buyer Contact Details:</p>
                        <p className="mt-0.5">Name: {order.buyer_name}</p>
                        {order.buyer_phone && <p className="mt-0.5">Phone: {order.buyer_phone}</p>}
                        {order.buyer_email && <p className="mt-0.5">Email: {order.buyer_email}</p>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {order.buyer_phone && (
                          <a
                            href={`tel:${order.buyer_phone}`}
                            className="px-3 py-1.5 border border-gray-200 text-gray-650 hover:text-amber-700 hover:bg-amber-55/40 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm bg-white"
                          >
                            <Phone className="w-3.5 h-3.5" /> Call Buyer
                          </a>
                        )}
                        {order.buyer_phone && (
                          <a
                            href={`https://wa.me/${order.buyer_phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 border border-gray-200 text-gray-650 hover:text-amber-700 hover:bg-amber-55/40 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm bg-white"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {order.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(order.id, 'rejected')}
                          disabled={!!isLoading}
                          className="flex-1 flex items-center justify-center gap-1 py-2.5 border-2 border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4" /> {isLoading === 'rejected' ? '...' : 'Reject'}
                        </button>
                        <button
                          onClick={() => handleAction(order.id, 'accepted')}
                          disabled={!!isLoading}
                          className="flex-1 flex items-center justify-center gap-1 py-2.5 gradient-green text-white rounded-xl text-sm font-semibold"
                        >
                          <CheckCircle className="w-4 h-4" /> {isLoading === 'accepted' ? '...' : 'Accept'}
                        </button>
                      </div>
                    )}
                    {order.status === 'accepted' && (
                      <button onClick={() => handleAction(order.id, 'preparing')}
                        className="w-full py-2.5 bg-purple-500 text-white rounded-xl text-sm font-semibold">
                        Mark as Preparing 📦
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button onClick={() => handleAction(order.id, 'out_for_delivery')}
                        className="w-full py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-semibold">
                        Mark Out for Delivery 🚚
                      </button>
                    )}
                    {order.status === 'out_for_delivery' && (
                      <button onClick={() => handleAction(order.id, 'delivered')}
                        className="w-full py-2.5 bg-teal-500 text-white rounded-xl text-sm font-semibold">
                        Mark as Delivered ✅
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
