import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store';

// Layouts
import BuyerLayout from './layouts/BuyerLayout';
import FarmerLayout from './layouts/FarmerLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Buyer Pages
import BuyerHome from './pages/buyer/Home';
import ProductDetail from './pages/buyer/ProductDetail';
import Cart from './pages/buyer/Cart';
import Checkout from './pages/buyer/Checkout';
import BuyerOrders from './pages/buyer/Orders';
import BuyerProfile from './pages/buyer/Profile';

// Farmer Pages
import FarmerDashboard from './pages/farmer/Dashboard';
import FarmerProducts from './pages/farmer/Products';
import FarmerOrders from './pages/farmer/Orders';
import FarmerEarnings from './pages/farmer/Earnings';

// Admin Pages
import AdminPrices from './pages/admin/Prices';
import AdminUsers from './pages/admin/Users';
import AdminAnalytics from './pages/admin/Analytics';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectMap = { buyer: '/', farmer: '/farmer', admin: '/admin/analytics' };
    return <Navigate to={redirectMap[user.role] || '/login'} replace />;
  }
  return children;
};

const RoleRedirect = () => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'farmer') return <Navigate to="/farmer" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/analytics" replace />;
  return <Navigate to="/" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { fontFamily: 'Inter, sans-serif', fontSize: '14px', borderRadius: '12px' }
        }}
      />
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/redirect" element={<RoleRedirect />} />

        {/* Buyer */}
        <Route path="/" element={<ProtectedRoute allowedRoles={['buyer']}><BuyerLayout /></ProtectedRoute>}>
          <Route index element={<BuyerHome />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="orders" element={<BuyerOrders />} />
          <Route path="profile" element={<BuyerProfile />} />
        </Route>

        {/* Farmer */}
        <Route path="/farmer" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerLayout /></ProtectedRoute>}>
          <Route index element={<FarmerDashboard />} />
          <Route path="products" element={<FarmerProducts />} />
          <Route path="orders" element={<FarmerOrders />} />
          <Route path="earnings" element={<FarmerEarnings />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
          <Route path="prices" element={<AdminPrices />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Route>

        <Route path="*" element={<Navigate to="/redirect" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
