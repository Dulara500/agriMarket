import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { TrendingUp, Package, ShoppingBag, Star, DollarSign, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';

export default function FarmerDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/farmer/stats'),
      api.get('/orders?status=pending'),
    ]).then(([sRes, oRes]) => {
      setStats(sRes.data.data);
      setRecentOrders(oRes.data.data.slice(0, 3));
    }).finally(() => setLoading(false));
  }, []);

  const StatCard = ({ label, value, icon: Icon, color, sub }) => (
    <div className="bg-white rounded-2xl p-4 card-shadow">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-green-600 font-medium mt-1">{sub}</p>}
    </div>
  );

  if (loading) return (
    <div className="p-4 animate-pulse">
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="px-4 pt-4">
      {/* Header */}
      <div className="mb-5">
        <p className="text-gray-500 text-sm">Welcome back,</p>
        <h1 className="text-2xl font-bold text-gray-900">{user?.name} 🌾</h1>
        {stats?.profile?.rating_avg > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-sm font-semibold text-gray-700">{parseFloat(stats.profile.rating_avg).toFixed(1)}</span>
            <span className="text-xs text-gray-400">({stats.profile.total_ratings} ratings)</span>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Total Orders" value={stats?.orders?.total || 0} icon={ShoppingBag} color="bg-blue-500"
          sub={`${stats?.orders?.pending || 0} pending`} />
        <StatCard label="Active Products" value={stats?.products?.total || 0} icon={Package} color="bg-green-500" />
        <StatCard label="Monthly Revenue" value={`Rs. ${parseFloat(stats?.revenue?.monthly_revenue || 0).toFixed(0)}`} icon={TrendingUp} color="bg-amber-500" />
        <StatCard label="Total Revenue" value={`Rs. ${parseFloat(stats?.revenue?.total_revenue || 0).toFixed(0)}`} icon={DollarSign} color="bg-purple-500" />
      </div>

      {/* Pending orders */}
      {recentOrders.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Pending Orders</h2>
            <button onClick={() => navigate('/farmer/orders')} className="text-amber-600 text-sm font-semibold flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {recentOrders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl p-3 card-shadow flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">#{order.id.slice(0,8).toUpperCase()}</p>
                  <p className="text-xs text-gray-400">{order.buyer_name} • {order.items?.length} items</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-700">Rs. {parseFloat(order.total_amount).toFixed(2)}</p>
                  <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">Pending</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 pb-4">
        <button onClick={() => navigate('/farmer/products')}
          className="gradient-green text-white rounded-2xl p-4 text-left hover:opacity-90 active:scale-95 transition-all">
          <Package className="w-5 h-5 mb-2" />
          <p className="font-bold text-sm">Manage Products</p>
          <p className="text-xs text-green-100 mt-0.5">Update stock & listings</p>
        </button>
        <button onClick={() => navigate('/farmer/orders')}
          className="bg-amber-500 text-white rounded-2xl p-4 text-left hover:opacity-90 active:scale-95 transition-all">
          <ShoppingBag className="w-5 h-5 mb-2" />
          <p className="font-bold text-sm">View Orders</p>
          <p className="text-xs text-amber-100 mt-0.5">Accept or reject orders</p>
        </button>
      </div>
    </div>
  );
}
