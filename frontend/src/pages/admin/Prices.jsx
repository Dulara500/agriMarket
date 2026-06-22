import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Shield, Plus, Edit2, Check, X, Calendar, User, ShoppingBag } from 'lucide-react';
import { useAdminStore } from '../../store';

function AddProductModal({ onClose, onAdded }) {
  const [newProduct, setNewProduct] = useState({ name: '', description: '', category: 'Vegetables', unit: 'kg', image_url: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/products', newProduct);
      toast.success('Product added successfully!');
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-gray-100 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Add New Produce Type</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><XIcon className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})}
            placeholder="Vegetable name (e.g. Carrot)" required
            className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}
            placeholder="Description / details"
            className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="grid grid-cols-2 gap-2">
            <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}
              className="bg-white border border-gray-200 rounded-xl p-3 text-gray-900 text-sm focus:outline-none">
              <option>Vegetables</option>
              <option>Leafy Greens</option>
              <option>Fruits</option>
            </select>
            <select value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})}
              className="bg-white border border-gray-200 rounded-xl p-3 text-gray-900 text-sm focus:outline-none">
              <option value="kg">kg</option>
              <option value="piece">piece</option>
              <option value="bunch">bunch</option>
            </select>
          </div>
          <input value={newProduct.image_url} onChange={e => setNewProduct({...newProduct, image_url: e.target.value})}
            placeholder="Image URL"
            className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60">
              {loading ? 'Adding...' : 'Add Produce'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ApproveRequestModal({ request, onClose, onApproved }) {
  const [price, setPrice] = useState(request.suggested_price || '');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!price || parseFloat(price) <= 0) return toast.error('Please enter a valid price');
    setLoading(true);
    try {
      await api.patch(`/admin/product-requests/${request.id}/approve`, { final_price: parseFloat(price), image_url: imageUrl });
      toast.success('Crop request approved and created in standard price catalog!');
      onApproved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-gray-100 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold text-gray-900">Approve & Publish Crop</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><XIcon className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-2xl mb-4 text-xs space-y-1 text-blue-900">
          <p><strong>Request Details:</strong></p>
          <p>• Crop Name: <strong>{request.name}</strong></p>
          <p>• Category: {request.category} • Unit: {request.unit}</p>
          <p>• Suggested Price: <strong>Rs. {parseFloat(request.suggested_price).toFixed(2)}</strong></p>
          {request.description && <p>• Notes: {request.description}</p>}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Set Government Standard Price (per {request.unit})</label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="e.g. 180"
              className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="1"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Crop Catalog Image URL (optional)</label>
            <input
              type="text"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-green-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm disabled:opacity-60">
              {loading ? 'Approving...' : 'Approve & Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RejectRequestModal({ request, onClose, onRejected }) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch(`/admin/product-requests/${request.id}/reject`, { notes });
      toast.success('Crop request rejected.');
      onRejected();
      onClose();
    } catch {
      toast.error('Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-gray-100 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold text-gray-900">Reject Crop Request</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><XIcon className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Reason for Rejection</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Enter details explaining why this crop cannot be listed"
              className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              required
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-red-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-60">
              {loading ? 'Rejecting...' : 'Reject Request'}
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

export default function AdminPrices() {
  const { fetchPendingCount } = useAdminStore();
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('prices'); // 'prices' | 'requests'

  const [editingPrice, setEditingPrice] = useState({});
  const [priceInputs, setPriceInputs] = useState({});
  const [notes, setNotes] = useState({});
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedApproveRequest, setSelectedApproveRequest] = useState(null);
  const [selectedRejectRequest, setSelectedRejectRequest] = useState(null);

  const loadPrices = () => {
    setLoading(true);
    api.get('/admin/products').then(res => {
      setProducts(res.data.data);
      const init = {};
      res.data.data.forEach(p => { init[p.id] = p.government_price || ''; });
      setPriceInputs(init);
    }).finally(() => setLoading(false));
  };

  const loadRequests = () => {
    setRequestsLoading(true);
    api.get('/admin/product-requests').then(res => {
      setRequests(res.data.data);
      fetchPendingCount();
    }).finally(() => setRequestsLoading(false));
  };

  useEffect(() => {
    loadRequests();
    if (activeTab === 'prices') {
      loadPrices();
    }
  }, [activeTab]);

  const savePrice = async (productId) => {
    const price = parseFloat(priceInputs[productId]);
    if (!price || price <= 0) return toast.error('Enter a valid price');
    try {
      await api.post(`/admin/products/${productId}/price`, { price_per_unit: price, notes: notes[productId] });
      toast.success('Price updated and all users notified!');
      setEditingPrice(e => ({ ...e, [productId]: false }));
      loadPrices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Price & Crop Catalog</h1>
          <p className="text-gray-500 text-sm mt-1">Set government-controlled standard prices and review farmer crop requests</p>
        </div>
        {activeTab === 'prices' && (
          <button
            onClick={() => setShowAddProduct(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm animate-in fade-in"
          >
            <Plus className="w-4 h-4" /> Add Vegetable Type
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('prices')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'prices'
              ? 'border-blue-600 text-blue-900 bg-blue-50/10'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Active Produce Prices ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'requests'
              ? 'border-blue-600 text-blue-900 bg-blue-50/10'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Farmer Requests ({requests.filter(r => r.status === 'pending').length} pending)
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'prices' ? (
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl"/>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex gap-3 mb-3">
                  <img src={p.image_url} alt={p.name} className="w-14 h-14 rounded-xl object-cover shrink-0 bg-gray-50 border border-gray-100"
                    onError={e => e.target.src='https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100'} />
                  <div>
                    <h3 className="font-semibold text-gray-900">{p.name}</h3>
                    <p className="text-xs text-gray-500">{p.category} • per {p.unit}</p>
                    {p.price_effective_date && (
                      <p className="text-[10px] text-gray-450 mt-0.5">Effective: {new Date(p.price_effective_date).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>

                {/* Price display/edit */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl p-2.5">
                    <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                    {editingPrice[p.id] ? (
                      <input
                        type="number"
                        value={priceInputs[p.id]}
                        onChange={e => setPriceInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                        className="flex-1 bg-transparent text-gray-900 text-sm focus:outline-none"
                        placeholder="Enter price..."
                        min="0" step="0.01"
                      />
                    ) : (
                      <span className="text-sm font-bold text-gray-900">
                        {p.government_price ? `Rs. ${parseFloat(p.government_price).toFixed(2)}` : 'No price set'}
                      </span>
                    )}
                  </div>
                  {editingPrice[p.id] ? (
                    <div className="flex gap-1.5">
                      <button onClick={() => savePrice(p.id)} className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center hover:bg-green-700 transition-colors shadow-sm">
                        <Check className="w-4 h-4 text-white" />
                      </button>
                      <button onClick={() => setEditingPrice(e => ({ ...e, [p.id]: false }))} className="w-9 h-9 bg-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-300 transition-colors">
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingPrice(e => ({ ...e, [p.id]: true }))}
                      className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <Edit2 className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        requestsLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl"/>)}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <ShoppingBag className="w-14 h-14 mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-700">No requests found</p>
            <p className="text-sm text-gray-400 mt-1">Suggested crops submitted by farmers will show up here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${req.status !== 'pending' ? 'opacity-65' : ''}`}>
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-gray-900 text-base">{req.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        req.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                        req.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    {req.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{req.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 font-semibold">
                      <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Farmer: {req.farmer_name} ({req.farm_name})</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Requested: {new Date(req.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-3 shrink-0 pt-3 md:pt-0 border-t border-gray-50 md:border-none">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold tracking-wide uppercase text-left md:text-right">Suggested Price</p>
                    <p className="text-lg font-bold text-blue-900">Rs. {parseFloat(req.suggested_price).toFixed(2)} / {req.unit}</p>
                  </div>
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedRejectRequest(req)}
                        className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors shadow-sm"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => setSelectedApproveRequest(req)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                      >
                        Approve & Set Price
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {showAddProduct && <AddProductModal onClose={() => setShowAddProduct(false)} onAdded={loadPrices} />}
      {selectedApproveRequest && <ApproveRequestModal request={selectedApproveRequest} onClose={() => setSelectedApproveRequest(null)} onApproved={loadRequests} />}
      {selectedRejectRequest && <RejectRequestModal request={selectedRejectRequest} onClose={() => setSelectedRejectRequest(null)} onRejected={loadRequests} />}
    </div>
  );
}
