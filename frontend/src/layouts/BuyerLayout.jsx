import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useCartStore, useNotificationStore } from '../store';
import {
  Home, Package, ShoppingCart, User, Bell, LogOut,
  Leaf, Search, ChevronDown, X, Menu, Shield
} from 'lucide-react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';



export default function BuyerLayout() {
  const { user, token, logout } = useAuthStore();
  const { items, fetchCart } = useCartStore();
  const { notifications, unreadCount, fetch: fetchNotifications, addNotification, markAllRead } = useNotificationStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCart();
    fetchNotifications();
  }, []);

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

  useEffect(() => {
    if (location.pathname !== '/') {
      setSearch('');
    }
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (location.pathname === '/') {
      navigate(`/?search=${encodeURIComponent(val)}`, { replace: true });
    } else {
      navigate(`/?search=${encodeURIComponent(val)}`);
    }
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Marketplace', end: true },
    { to: '/orders', icon: Package, label: 'My Orders' },
    { to: '/cart', icon: ShoppingCart, label: 'Cart', badge: items.length },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#f5f6fa]">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#002d1e] rounded-lg flex items-center justify-center flex-shrink-0">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[#002d1e] font-bold text-base leading-tight">FarmDirect</p>
            <p className="text-gray-400 text-[10px] leading-tight">Managing Global Trade</p>
          </div>
        </div>
      </div>

      {/* User */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#002d1e] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-gray-800 text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-gray-400 text-[10px]">Certified Buyer</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''} relative`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {badge > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-200">
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
      {/* Desktop Sidebar */}
      <aside className="sidebar hidden md:flex flex-col fixed left-0 top-0 h-full z-40">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="sidebar flex flex-col fixed left-0 top-0 h-full z-50 md:hidden">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-[240px]">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-30 h-[60px] flex items-center px-4 gap-3">
          {/* Mobile menu btn */}
          <button
            className="md:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100 text-gray-600"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md mx-auto relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search vegetables, fruits, or grains..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002d1e] focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Role Switcher */}

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
                  <div className="absolute right-0 mt-1 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-sm text-gray-900">Notifications</p>
                      <button onClick={() => setShowNotifs(false)}><X className="w-4 h-4 text-gray-400" /></button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-5 text-sm text-gray-400 text-center">No notifications yet</p>
                      ) : notifications.slice(0, 10).map(n => (
                        <div key={n.id} className={`px-4 py-3 border-b border-gray-50 ${!n.is_read ? 'bg-green-50/50' : ''}`}>
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

            {/* Cart badge */}
            <NavLink to="/cart" className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              {items.length > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </NavLink>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 pb-20 md:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30 safe-pb">
          <div className="flex">
            {navItems.map(({ to, icon: Icon, label, end, badge }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center pt-2 pb-1 gap-0.5 text-[10px] font-medium transition-colors relative ${
                    isActive ? 'text-[#002d1e]' : 'text-gray-400'
                  }`
                }
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-3 h-3 rounded-full flex items-center justify-center">
                      {badge}
                    </span>
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
