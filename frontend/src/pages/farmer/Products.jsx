import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Package, ToggleLeft, ToggleRight, Edit2, Trash2, Shield, Calendar, AlertCircle } from 'lucide-react';

function AddProductModal({ onClose, onAdded }) {
  const [allProducts, setAllProducts] = useState([]);
  const [selected, setSelected] = useState('');
  const [stock, setStock] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/farmer/available-products').then(res => setAllProducts(res.data.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected || !stock) return toast.error('Please select product and enter stock');
    setLoading(true);
    try {
      await api.post('/farmer/products', { product_id: selected, stock_quantity: parseFloat(stock) });
      toast.success('Product listed!');
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Add Crop Listing</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><XIcon className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-750 mb-1.5">Select Vegetable</label>
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            >
              <option value="">-- Select crop --</option>
              {allProducts.map(p => (
                <option key={p.id} value={p.id} disabled={p.already_listed || !p.government_price}>
                  {p.name} {p.already_listed ? '(Already listed)' : ''} {!p.government_price ? '(Price not set by Admin)' : `— Rs. ${parseFloat(p.government_price).toFixed(2)}/${p.unit}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-750 mb-1.5">Initial Stock</label>
            <input
              type="number"
              value={stock}
              onChange={e => setStock(e.target.value)}
              min="0" step="0.5"
              placeholder="e.g. 50"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
          <div className="flex gap-2.5 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors shadow-sm">
              {loading ? 'Adding...' : 'List Crop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RequestCropModal({ onClose, onSubmitted }) {
  const [form, setForm] = useState({ name: '', description: '', category: 'Vegetables', unit: 'kg', suggested_price: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.suggested_price || parseFloat(form.suggested_price) <= 0) {
      return toast.error('Enter valid name and price');
    }
    setLoading(true);
    try {
      await api.post('/farmer/product-requests', { ...form, suggested_price: parseFloat(form.suggested_price) });
      toast.success('Crop request submitted to Admin!');
      onSubmitted();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Request New Crop Type</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><XIcon className="w-5 h-5 text-gray-400" /></button>
        </div>
        <p className="text-xs text-gray-500 mb-4">If a crop is not in the system, request the Admin to create it with a standard price.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-750 mb-1.5">Crop Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Garlic, Leeks, Pumpkin"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-750 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Brief details about the crop quality/variety"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 h-20 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-sm font-medium text-gray-750 mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option>Vegetables</option>
                <option>Leafy Greens</option>
                <option>Fruits</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-750 mb-1.5">Unit</label>
              <select
                value={form.unit}
                onChange={e => setForm({ ...form, unit: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="kg">kg</option>
                <option value="piece">piece</option>
                <option value="bunch">bunch</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-750 mb-1.5">Suggested Fair Price (per unit)</label>
            <input
              type="number"
              value={form.suggested_price}
              onChange={e => setForm({ ...form, suggested_price: e.target.value })}
              placeholder="e.g. 180"
              min="1"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
          <div className="flex gap-2.5 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors shadow-sm">
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function XIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function FarmerProducts() {
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'requests'
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReqModal, setShowReqModal] = useState(false);
  const [editingStock, setEditingStock] = useState({});
  const [stockValues, setStockValues] = useState({});

  const loadStock = () => {
    setLoading(true);
    api.get('/farmer/products').then(res => {
      setProducts(res.data.data);
      const init = {};
      res.data.data.forEach(p => { init[p.id] = p.stock_quantity; });
      setStockValues(init);
    }).finally(() => setLoading(false));
  };

  const loadRequests = () => {
    setRequestsLoading(true);
    api.get('/farmer/product-requests')
      .then(res => setRequests(res.data.data))
      .finally(() => setRequestsLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'stock') {
      loadStock();
    } else {
      loadRequests();
    }
  }, [activeTab]);

  const toggleAvailability = async (p) => {
    try {
      await api.patch(`/farmer/products/${p.id}/stock`, { is_available: !p.is_available });
      toast.success(`Product ${!p.is_available ? 'enabled' : 'disabled'}`);
      loadStock();
    } catch {
      toast.error('Failed to update');
    }
  };

  const saveStock = async (id) => {
    try {
      await api.patch(`/farmer/products/${id}/stock`, { stock_quantity: parseFloat(stockValues[id]) });
      toast.success('Stock updated!');
      setEditingStock(e => ({ ...e, [id]: false }));
      loadStock();
    } catch {
      toast.error('Failed to update stock');
    }
  };

  const removeProduct = async (id) => {
    if (!confirm('Remove this product from your listings?')) return;
    try {
      await api.delete(`/farmer/products/${id}`);
      toast.success('Product removed');
      loadStock();
    } catch {
      toast.error('Failed');
    }
  };

  const getStatusBadge = (status) => {
    const maps = {
      pending: 'bg-amber-50 text-amber-700 border border-amber-200',
      approved: 'bg-green-50 text-green-700 border border-green-200',
      rejected: 'bg-red-50 text-red-700 border border-red-200',
    };
    return maps[status] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="px-4 py-4 max-w-5xl mx-auto">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crop Stock Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">List crops and request new crop standard prices</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'stock' ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Produce Stock
            </button>
          ) : (
            <button
              onClick={() => setShowReqModal(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Request New Crop Type
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex-1 md:flex-none px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'stock'
              ? 'border-amber-600 text-amber-800 bg-amber-50/10'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          My Crop Stock ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 md:flex-none px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'requests'
              ? 'border-amber-600 text-amber-800 bg-amber-50/10'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Crop Type Requests
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'stock' ? (
        loading ? (
          <div className="p-4 space-y-3 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <Package className="w-14 h-14 mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-700">No crops listed</p>
            <p className="text-sm text-gray-400 mt-1">Select from government prices and add your stock.</p>
            <button onClick={() => setShowAddModal(true)} className="mt-4 bg-amber-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-amber-700 transition-colors shadow-sm">
              List Stock
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map(p => (
              <div key={p.id} className={`bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between ${!p.is_available ? 'opacity-60' : ''}`}>
                <div className="flex gap-3 mb-3">
                  <img src={p.image_url} alt={p.name} className="w-14 h-14 rounded-xl object-cover shrink-0 bg-gray-50 border border-gray-100"
                    onError={e => e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100'} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">{p.name}</h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Shield className="w-3.5 h-3.5 text-green-600" />
                          <p className="text-xs text-green-700 font-semibold">
                            Gov Price: Rs. {parseFloat(p.government_price || 0).toFixed(2)}/{p.unit}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => toggleAvailability(p)} className="text-gray-400 hover:text-green-600 transition-colors">
                          {p.is_available
                            ? <ToggleRight className="w-7 h-7 text-green-500" />
                            : <ToggleLeft className="w-7 h-7" />}
                        </button>
                        <button onClick={() => removeProduct(p.id)} className="text-red-400 hover:text-red-600 p-1 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock editor */}
                <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-1">
                  {editingStock[p.id] ? (
                    <div className="flex items-center gap-2 w-full justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={stockValues[p.id]}
                          onChange={e => setStockValues(s => ({ ...s, [p.id]: e.target.value }))}
                          className="w-24 border border-amber-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                          min="0" step="0.5"
                        />
                        <span className="text-xs text-gray-500">{p.unit}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => saveStock(p.id)} className="text-xs bg-amber-600 text-white font-semibold px-2.5 py-1 rounded-lg hover:bg-amber-700">Save</button>
                        <button onClick={() => setEditingStock(e => ({ ...e, [p.id]: false }))} className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs text-gray-500 font-medium">Available Stock: <strong className="text-gray-900 text-sm font-semibold">{p.stock_quantity} {p.unit}</strong></span>
                      <button onClick={() => setEditingStock(e => ({ ...e, [p.id]: true }))} className="text-gray-400 hover:text-amber-600 p-1 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        requestsLoading ? (
          <div className="p-4 space-y-3 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <AlertCircle className="w-14 h-14 mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-700">No requests submitted</p>
            <p className="text-sm text-gray-400 mt-1">Suggest crops to Admin to establish standard prices.</p>
            <button onClick={() => setShowReqModal(true)} className="mt-4 bg-amber-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-amber-700 transition-colors shadow-sm">
              Submit Request
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
                    <Package className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-gray-900 text-base">{req.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadge(req.status)}`}>
                        {req.status}
                      </span>
                    </div>
                    {req.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{req.description}</p>}
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400 font-medium">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Requested on: {new Date(req.created_at).toLocaleDateString()}</span>
                      <span>Category: {req.category}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 border-t border-gray-55 pt-3 md:border-none md:pt-0">
                  <p className="text-xs text-gray-400 font-medium">Suggested Price</p>
                  <p className="text-lg font-bold text-amber-900 mt-0.5">Rs. {parseFloat(req.suggested_price).toFixed(2)} / {req.unit}</p>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {showAddModal && <AddProductModal onClose={() => setShowAddModal(false)} onAdded={loadStock} />}
      {showReqModal && <RequestCropModal onClose={() => setShowReqModal(false)} onSubmitted={loadRequests} />}
    </div>
  );
}
