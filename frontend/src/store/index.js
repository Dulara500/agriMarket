import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('agrimarket_user') || 'null'),
  token: localStorage.getItem('agrimarket_token') || null,
  loading: false,

  login: async (credentials) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/login', credentials);
      const { user, token } = res.data.data;
      localStorage.setItem('agrimarket_token', token);
      localStorage.setItem('agrimarket_user', JSON.stringify(user));
      set({ user, token, loading: false });
      return { success: true, user };
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/register', data);
      const { user, token } = res.data.data;
      localStorage.setItem('agrimarket_token', token);
      localStorage.setItem('agrimarket_user', JSON.stringify(user));
      set({ user, token, loading: false });
      return { success: true, user };
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('agrimarket_token');
    localStorage.removeItem('agrimarket_user');
    set({ user: null, token: null });
  },

  refreshUser: async () => {
    try {
      const res = await api.get('/auth/me');
      const user = res.data.data;
      localStorage.setItem('agrimarket_user', JSON.stringify(user));
      set({ user });
    } catch {}
  },
}));

export const useCartStore = create((set, get) => ({
  items: [],
  total: 0,
  loading: false,

  fetchCart: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/cart');
      set({ items: res.data.data.items, total: res.data.data.total, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addToCart: async (farmer_product_id, quantity) => {
    const res = await api.post('/cart/items', { farmer_product_id, quantity });
    await get().fetchCart();
    return res.data;
  },

  removeFromCart: async (itemId) => {
    await api.delete(`/cart/items/${itemId}`);
    await get().fetchCart();
  },

  clearCart: async () => {
    await api.delete('/cart');
    set({ items: [], total: 0 });
  },
}));

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  fetch: async () => {
    try {
      const res = await api.get('/notifications');
      const notifications = res.data.data;
      set({
        notifications,
        unreadCount: notifications.filter(n => !n.is_read).length
      });
    } catch {}
  },

  markRead: async (id) => {
    await api.patch(`/notifications/${id}/read`);
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }));
  },

  markAllRead: async () => {
    await api.patch('/notifications/read-all');
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, is_read: true })),
      unreadCount: 0
    }));
  },

  addNotification: (notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  }
}));

export const useAdminStore = create((set) => ({
  pendingRequestsCount: 0,
  fetchPendingCount: async () => {
    try {
      const res = await api.get('/admin/product-requests');
      const pending = res.data.data.filter(r => r.status === 'pending').length;
      set({ pendingRequestsCount: pending });
    } catch {}
  }
}));
