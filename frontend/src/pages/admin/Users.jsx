import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Search, UserCheck, UserX, BadgeCheck } from 'lucide-react';

const ROLE_COLORS = {
  buyer: 'bg-blue-100 text-blue-800',
  farmer: 'bg-green-100 text-green-800',
  admin: 'bg-purple-100 text-purple-800',
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const load = () => {
    api.get('/admin/users', { params: { search, role: roleFilter } })
      .then(res => setUsers(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search, roleFilter]);

  const toggleActive = async (user) => {
    try {
      await api.patch(`/admin/users/${user.id}`, { is_active: !user.is_active });
      toast.success(`User ${!user.is_active ? 'activated' : 'deactivated'}`);
      load();
    } catch {
      toast.error('Failed to change user status');
    }
  };

  const toggleVerified = async (user) => {
    try {
      await api.patch(`/admin/users/${user.id}`, { is_verified: !user.is_verified });
      toast.success(`Farmer ${!user.is_verified ? 'verified' : 'unverified'}`);
      load();
    } catch {
      toast.error('Failed to update verification');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500 text-sm mt-1">Activate users and verify farmers</p>
      </div>

      {/* Search & filter */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Roles</option>
          <option value="buyer">Buyers</option>
          <option value="farmer">Farmers</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-200 rounded-2xl"/>)}</div>
      ) : (
        <div className="space-y-2">
          {users.map(user => (
            <div key={user.id} className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm ${!user.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                  {user.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                    {user.is_verified && <BadgeCheck className="w-4 h-4 text-green-600" />}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role]}`}>{user.role}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email || user.phone} {user.id_number && `• ID: ${user.id_number}`}
                  </p>
                  {user.farm_name && <p className="text-xs text-green-700 font-medium mt-0.5">{user.farm_name} • Rating: ⭐ {parseFloat(user.rating_avg || 0).toFixed(1)}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {user.role === 'farmer' && (
                    <button
                      onClick={() => toggleVerified(user)}
                      title="Toggle verification"
                      className={`p-1.5 rounded-lg transition-colors ${user.is_verified ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-400 hover:text-green-600 hover:bg-gray-200'}`}
                    >
                      <BadgeCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => toggleActive(user)}
                    className={`p-1.5 rounded-lg transition-colors ${user.is_active ? 'bg-gray-100 text-gray-500 hover:text-red-600 hover:bg-red-50' : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'}`}
                  >
                    {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <p>No users found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
