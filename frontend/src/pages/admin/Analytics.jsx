import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { ShoppingBag, Users, DollarSign, Package } from 'lucide-react';

const COLORS = ['#16a34a', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics').then(res => setData(res.data.data)).finally(() => setLoading(false));
  }, []);

  const StatCard = ({ label, value, icon: Icon, color, sub }) => (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-950 mt-1">{value}</p>
          {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-2xl"/>)}
      </div>
    </div>
  );

  const orderStatusData = [
    { name: 'Completed', value: parseInt(data?.orders?.completed || 0) },
    { name: 'Pending', value: parseInt(data?.orders?.pending || 0) },
    { name: 'Rejected', value: parseInt(data?.orders?.rejected || 0) },
  ].filter(d => d.value > 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Platform-wide activity and crop sales performance</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Revenue" value={`Rs. ${parseFloat(data?.revenue?.total_revenue || 0).toFixed(0)}`}
          icon={DollarSign} color="bg-green-600" sub="From completed orders" />
        <StatCard label="Total Orders" value={data?.orders?.total || 0}
          icon={ShoppingBag} color="bg-blue-600" sub={`${data?.orders?.completed || 0} completed`} />
        <StatCard label="Buyers" value={data?.users?.buyers || 0} icon={Users} color="bg-purple-600" />
        <StatCard label="Farmers" value={data?.users?.farmers || 0} icon={Package} color="bg-amber-600" />
      </div>

      {/* Monthly revenue chart */}
      {data?.monthly?.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-5">
          <h2 className="font-bold text-gray-900 mb-4">Monthly Revenue Trends</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.monthly.map(d => ({
              month: new Date(d.month).toLocaleDateString('en', { month: 'short' }),
              revenue: parseFloat(d.revenue || 0),
              orders: parseInt(d.orders || 0),
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '13px' }}
                labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                formatter={(v) => [`Rs. ${v.toFixed(2)}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#002d1e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Order status pie */}
        {orderStatusData.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">Order Breakdown</h2>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {orderStatusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ color: '#64748b', fontSize: '12px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top products */}
        {data?.top_products?.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">Top Selling Crops</h2>
            <div className="space-y-3">
              {data.top_products.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm font-semibold w-4">{i + 1}.</span>
                  <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded-lg object-cover bg-gray-50 shrink-0"
                    onError={e => e.target.src='https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100'} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500">{parseFloat(p.total_qty).toFixed(1)} {p.unit || 'kg'} sold</p>
                  </div>
                  <p className="text-sm font-bold text-[#1b5e20]">Rs. {parseFloat(p.revenue || 0).toFixed(0)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
