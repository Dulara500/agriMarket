import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import toast from 'react-hot-toast';
import { Leaf, Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, ShoppingBag, Sprout, Shield } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'buyer', farm_name: '', bio: '', id_number: '' });
  const [showPass, setShowPass] = useState(false);
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email && !form.phone) return toast.error('Email or phone required');
    try {
      const { user } = await register(form);
      toast.success('Account created!');
      const redirectMap = { buyer: '/', farmer: '/farmer', admin: '/admin/analytics' };
      navigate(redirectMap[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="mb-6 text-center">
        <div className="w-14 h-14 gradient-green rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
          <Leaf className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
        <p className="text-gray-500 text-sm mt-1">Join the AgriMarket community</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-6 card-shadow">
        {/* Role selector */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {[
            { value: 'buyer', label: 'Buyer', icon: ShoppingBag, desc: 'Buy fresh vegetables' },
            { value: 'farmer', label: 'Farmer', icon: Sprout, desc: 'Sell your produce' },
          ].map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => setForm({ ...form, role: r.value })}
              className={`p-3 rounded-2xl border-2 text-left transition-all ${
                form.role === r.value
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-100 bg-gray-50 hover:border-gray-200'
              }`}
            >
              <r.icon className={`w-5 h-5 mb-1 ${form.role === r.value ? 'text-green-600' : 'text-gray-400'}`} />
              <p className={`text-sm font-semibold ${form.role === r.value ? 'text-green-700' : 'text-gray-700'}`}>{r.label}</p>
              <p className="text-xs text-gray-400">{r.desc}</p>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              required
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="Email address"
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Phone */}
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone number"
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            />
          </div>

          {/* ID Number */}
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={form.id_number}
              onChange={e => setForm({ ...form, id_number: e.target.value })}
              placeholder="ID Number (NIC / Passport)"
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              required
            />
          </div>

          {/* Farmer-specific */}
          {form.role === 'farmer' && (
            <div className="relative">
              <Sprout className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.farm_name}
                onChange={e => setForm({ ...form, farm_name: e.target.value })}
                placeholder="Farm name"
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>
          )}

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Password (min 6 chars)"
              className="w-full pl-9 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              required
              minLength={6}
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-green text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
          >
            {loading ? 'Creating...' : (<>Create Account <ArrowRight className="w-4 h-4" /></>)}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-green-600 font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
