import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../store';
import {
  LayoutDashboard, Package, ShoppingBag, TrendingUp,
  LogOut, Leaf, Bell, Menu, X, PlusCircle, Shield, ChevronDown
} from 'lucide-react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

function RoleSwitcher() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const switchRole = async (email, redirectPath) => {
    setOpen(false);
    const loadToast = toast.loading('Switching roles...');
    try {
      const { user } = await login({ email, password: 'password' });
      toast.success(`Logged in as ${user.name}!`, { id: loadToast });
      navigate(redirectPath);
    } catch (err) {
      toast.error('Failed to switch. Ensure demo account exists.', { id: loadToast });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => open ? setOpen(false) : setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
      >
        <Shield className="w-3.5 h-3.5 text-amber-600" />
        <span>Role Switcher</span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1">
            <button
              onClick={() => switchRole('bob@buyer.com', '/')}
              className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-green-50 hover:text-green-700 font-medium"
            >
              Buyer (Bob Buyer)
            </button>
            <button
              onClick={() => switchRole('john@farmer.com', '/farmer')}
              className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-amber-50 hover:text-amber-700 font-medium"
            >
              Farmer (John Farmer)
            </button>
            <button
              onClick={() => switchRole('admin@agrimarket.com', '/admin/prices')}
              className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium"
            >
              Admin (Government)
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function FarmerLayout() {
  const { user, token, logout } = useAuthStore();
  const { notifications, unreadCount, fetch: fetchNotifications, addNotification, markAllRead } = useNotificationStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => { fetchNotifications(); }, []);

  useEffect(() => {
    if (!token) return;
    const socket = io('/', { auth: { token }, transports: ['websocket', 'polling'] });
    socket.on('notification', (data) => {
      addNotification(data);
      toast(data.title, { icon: '🔔' });
    });
    socket.on('connect_error', () => {});
    return () => socket.disconnect();
  }, [token]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/farmer', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/farmer/products', icon: Package, label: 'My Crops' },
    { to: '/farmer/orders', icon: ShoppingBag, label: 'Orders' },
    { to: '/farmer/earnings', icon: TrendingUp, label: 'Earnings' },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#f5f6fa]">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-amber-950 font-bold text-base leading-tight">FarmDirect</p>
            <p className="text-gray-400 text-[10px] leading-tight">Managing Global Trade</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-gray-800 text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-gray-400 text-[10px]">{user?.farm_name || 'Farmer Portal'}</p>
          </div>
          {unreadCount > 0 && (
            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `nav-item ${isActive ? '!text-[#78350f] !bg-[#fef3c7] font-semibold' : ''}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Quick add */}
      <div className="p-3 space-y-1 border-t border-gray-200">
        <button
          onClick={() => { navigate('/farmer/products'); setSidebarOpen(false); }}
          className="flex items-center gap-2 w-full px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold transition-colors justify-center shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          List New Crop
        </button>
        <button
          onClick={handleLogout}
          className="nav-item w-full text-red-600 hover:text-red-700 hover:bg-red-50"
        >
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

      {/* Mobile overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="sidebar flex flex-col fixed left-0 top-0 h-full z-50 md:hidden">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-[240px]">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-30 h-[60px] flex items-center px-4 gap-3">
          <button className="md:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-gray-400 font-medium">Farmer Management Dashboard</p>
          </div>
          
          <div className="flex items-center gap-3">
            <RoleSwitcher />
            
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  const nextShow = !showNotifs;
                  setShowNotifs(nextShow);
                  if (nextShow && unreadCount > 0) {
                    markAllRead();
                  }
                }}
                className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                  <div className="absolute right-0 mt-1.5 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-sm text-gray-900">Notifications</p>
                      <button onClick={() => setShowNotifs(false)}><X className="w-4 h-4 text-gray-400" /></button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-5 text-sm text-gray-400 text-center">No notifications yet</p>
                      ) : notifications.slice(0, 10).map(n => (
                        <div key={n.id} className={`px-4 py-3 border-b border-gray-50 ${!n.is_read ? 'bg-amber-50/50' : ''}`}>
                          <p className="text-sm font-medium text-gray-800">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleTimeString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 pb-20 md:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30 safe-pb">
          <div className="flex">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center pt-2 pb-1 gap-0.5 text-[10px] font-medium transition-colors ${
                    isActive ? 'text-amber-600' : 'text-gray-400'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {label.split(' ')[0]}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
