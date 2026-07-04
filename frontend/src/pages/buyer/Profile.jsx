import React from 'react';
import { useAuthStore } from '../../store';
import { User, Mail, Phone, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LocationPicker from '../../components/LocationPicker';

export default function BuyerProfile() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="px-4 py-4">
      {/* Avatar */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 gradient-green rounded-full flex items-center justify-center mx-auto mb-3 text-white text-3xl font-bold">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
        <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mt-1">Buyer</span>
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl p-4 card-shadow mb-4 space-y-3">
        {user?.email && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <Mail className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-800">{user.email}</p>
            </div>
          </div>
        )}
        {user?.phone && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <Phone className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Phone</p>
              <p className="text-sm font-medium text-gray-800">{user.phone}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Member since</p>
            <p className="text-sm font-medium text-gray-800">{new Date(user?.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
          </div>
        </div>
      </div>

      {/* Location */}
      <LocationPicker />

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-red-100 text-red-500 rounded-2xl font-semibold hover:bg-red-50 transition-colors"
      >
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </div>
  );
}
