import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag } from 'lucide-react';

export default function FarmerEarnings() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/farmer/earnings'),
      api.get('/farmer/stats'),
    ]).then(([eRes, sRes]) => {
      setData(eRes.data.data.map(d => ({
        month: new Date(d.month).toLocaleDateString('en', { month: 'short', year: '2-digit' }),
        revenue: parseFloat(d.revenue),
        orders: parseInt(d.orders),
      })));
      setStats(sRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 animate-pulse space-y-3"><div className="h-48 bg-gray-200 rounded-2xl"/></div>;

  return (
    <div className="px-4 py-4">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Earnings</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-4 card-shadow col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">
                Rs. {parseFloat(stats?.revenue?.total_revenue || 0).toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 gradient-green rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <p className="text-xs text-gray-500">This Month</p>
          <p className="text-lg font-bold text-green-600 mt-0.5">
            Rs. {parseFloat(stats?.revenue?.monthly_revenue || 0).toFixed(0)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <p className="text-xs text-gray-500">Total Orders</p>
          <p className="text-lg font-bold text-blue-600 mt-0.5">{stats?.orders?.completed || 0}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h2 className="font-bold text-gray-900 mb-4">Monthly Revenue</h2>
        {data.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No earnings data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`Rs. ${v.toFixed(2)}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Monthly table */}
      {data.length > 0 && (
        <div className="bg-white rounded-2xl p-4 card-shadow mt-4">
          <h2 className="font-bold text-gray-900 mb-3">Monthly Breakdown</h2>
          <div className="space-y-2">
            {data.map((d, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-600">{d.month}</span>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">Rs. {d.revenue.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{d.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
