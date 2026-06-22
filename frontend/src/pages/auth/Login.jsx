import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import toast from 'react-hot-toast';
import { Leaf, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { user } = await login(form);
      toast.success(`Welcome back, ${user.name}!`);
      const redirectMap = { buyer: '/', farmer: '/farmer', admin: '/admin/analytics' };
      navigate(redirectMap[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 gradient-green rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
          <Leaf className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">AgriMarket</h1>
        <p className="text-gray-500 text-sm mt-1">Fresh vegetables, fair prices</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-6 card-shadow">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Sign In</h2>
        <p className="text-gray-500 text-sm mb-6">Enter your credentials to continue</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all"
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-green text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
          >
            {loading ? 'Signing in...' : (<>Sign In <ArrowRight className="w-4 h-4" /></>)}
          </button>
        </form>

        {/* Demo accounts */}
        <div className="mt-6 p-3 bg-gray-50 rounded-2xl">
          <p className="text-xs font-semibold text-gray-500 mb-2">Demo Accounts</p>
          <div className="space-y-1">
            {[
              { label: 'Admin', email: 'admin@agrimarket.com', pass: 'password' },
            ].map(a => (
              <button
                key={a.email}
                onClick={() => setForm({ email: a.email, password: a.pass })}
                className="w-full text-left text-xs text-gray-600 hover:text-green-700 py-1 px-2 rounded-lg hover:bg-white transition-colors"
              >
                <span className="font-semibold">{a.label}:</span> {a.email} / {a.pass}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-green-600 font-semibold hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
