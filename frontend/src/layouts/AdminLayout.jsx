import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore, useAdminStore } from '../store';
import { BarChart3, DollarSign, Users, LogOut, Shield, Menu, ChevronDown, Sprout } from 'lucide-react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';



export default function AdminLayout() {
  const { user, token, logout } = useAuthStore();
  const { pendingRequestsCount, fetchPendingCount } = useAdminStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchPendingCount();
  }, []);

  useEffect(() => {
    if (!token) return;
    const socket = io('/', { auth: { token }, transports: ['websocket', 'polling'] });
    socket.on('new_product_request', () => {
      fetchPendingCount();
      toast('New crop type request from a farmer!', { icon: '🌱' });
    });
    socket.on('connect_error', () => {});
    return () => socket.disconnect();
  }, [token]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/admin/prices', icon: DollarSign, label: 'Price Management' },
    { to: '/admin/users', icon: Users, label: 'User Management' },
    { to: '/admin/fertilizers', icon: Sprout, label: 'Fertilizers' },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#f5f6fa]">
      <div className="px-5 pt-6 pb-5 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-blue-950 font-bold text-base leading-tight">FarmDirect</p>
            <p className="text-gray-400 text-[10px] leading-tight">Admin Portal</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-gray-800 text-xs font-semibold">{user?.name}</p>
            <p className="text-gray-400 text-[10px]">Government Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `nav-item ${isActive ? '!text-blue-900 !bg-blue-100 font-semibold' : ''} flex items-center justify-between`
            }
          >
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </div>
            {label === 'Price Management' && pendingRequestsCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                {pendingRequestsCount} new
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <button onClick={handleLogout} className="nav-item w-full text-red-600 hover:text-red-700 hover:bg-red-50">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#fafafa]">
      {/* Desktop sidebar */}
      <aside className="sidebar hidden md:flex flex-col fixed left-0 top-0 h-full z-40">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="sidebar flex flex-col fixed left-0 top-0 h-full z-50 md:hidden">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col md:ml-[240px]">
        <header className="border-b border-gray-100 h-[60px] flex items-center px-5 gap-3 sticky top-0 z-30 bg-white">
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <p className="text-gray-500 text-xs font-medium mr-auto">Government Administration System</p>
          
          <div className="flex items-center gap-3">
            
          </div>
        </header>

        <main className="flex-1 p-5 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-gray-100 z-30 safe-pb bg-white">
          <div className="flex">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center pt-2 pb-1 gap-0.5 text-[10px] font-medium ${isActive ? 'text-blue-600' : 'text-gray-400'}`
                }
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {label === 'Price Management' && pendingRequestsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  )}
                  {label === 'Price Management' && pendingRequestsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </div>
                {label.split(' ')[0]}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
