import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Sprout, Plus, X, Edit2, MapPin, Calendar, Package,
  ChevronDown, ChevronUp, Users, Check, Minus, AlertTriangle,
  Building2, Leaf, BarChart3
} from 'lucide-react';

// ─────────────────────────── helpers ───────────────────────────
const STATUS_STYLES = {
  upcoming: 'bg-blue-100 text-blue-700',
  open:     'bg-green-100 text-green-700',
  closed:   'bg-gray-100 text-gray-500',
};

const fmt = (n) => parseFloat(n || 0).toFixed(2);

// ─────────────────────────── modals ────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl my-4">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500';

// ───────── Type Modal ─────────
function TypeModal({ onClose, onSaved, existing }) {
  const [form, setForm] = useState(existing || { name: '', description: '', unit: 'kg' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (existing) await api.patch(`/admin/fertilizers/types/${existing.id}`, form);
      else await api.post('/admin/fertilizers/types', form);
      toast.success(existing ? 'Type updated!' : 'Type created!');
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title={existing ? 'Edit Fertilizer Type' : 'Add Fertilizer Type'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name *">
          <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Urea" />
        </Field>
        <Field label="Description">
          <textarea className={inputCls} rows={2} value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Details about this fertilizer" />
        </Field>
        <Field label="Unit">
          <select className={inputCls + ' bg-white'} value={form.unit} onChange={e => set('unit', e.target.value)}>
            <option value="kg">kg</option>
            <option value="liter">liter</option>
            <option value="piece">piece</option>
            <option value="bag">bag</option>
          </select>
        </Field>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ───────── Branch Modal ─────────
function BranchModal({ onClose, onSaved, existing }) {
  const [form, setForm] = useState(existing || { name: '', address: '', phone: '', location_lat: '', location_lng: '' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, location_lat: form.location_lat || null, location_lng: form.location_lng || null };
      if (existing) await api.patch(`/admin/fertilizers/branches/${existing.id}`, payload);
      else await api.post('/admin/fertilizers/branches', payload);
      toast.success(existing ? 'Branch updated!' : 'Branch created!');
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title={existing ? 'Edit Branch' : 'Add Collection Branch'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Branch Name *"><input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Colombo Agricultural Office" /></Field>
        <Field label="Address *"><textarea className={inputCls} rows={2} value={form.address} onChange={e => set('address', e.target.value)} required placeholder="Full street address" /></Field>
        <Field label="Phone"><input className={inputCls} value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+94 77 000 0000" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude"><input type="number" step="any" className={inputCls} value={form.location_lat || ''} onChange={e => set('location_lat', e.target.value)} placeholder="6.9271" /></Field>
          <Field label="Longitude"><input type="number" step="any" className={inputCls} value={form.location_lng || ''} onChange={e => set('location_lng', e.target.value)} placeholder="79.8612" /></Field>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">{loading ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ───────── Program Modal ─────────
function ProgramModal({ onClose, onSaved, types, branches }) {
  const [form, setForm] = useState({
    fertilizer_type_id: '', month: '', distribution_date: '',
    total_quantity: '', quantity_per_farmer: '10',
    subsidized_price: '', market_price: '', branch_id: '', notes: ''
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Backend expects a full DATE for 'month' column — append -01
      const payload = { ...form, month: form.month ? form.month + '-01' : '' };
      await api.post('/admin/fertilizers/programs', payload);
      toast.success('Program created!');
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Create Monthly Program" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Fertilizer Type *">
          <select className={inputCls + ' bg-white'} value={form.fertilizer_type_id} onChange={e => set('fertilizer_type_id', e.target.value)} required>
            <option value="">-- Select type --</option>
            {types.map(t => <option key={t.id} value={t.id}>{t.name} ({t.unit})</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Month *"><input type="month" className={inputCls} value={form.month} onChange={e => set('month', e.target.value)} required /></Field>
          <Field label="Distribution Date *"><input type="date" className={inputCls} value={form.distribution_date} onChange={e => set('distribution_date', e.target.value)} required /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Total Quota (govt) *"><input type="number" className={inputCls} value={form.total_quantity} onChange={e => set('total_quantity', e.target.value)} placeholder="e.g. 5000" required /></Field>
          <Field label="Per Farmer (kg) *"><input type="number" className={inputCls} value={form.quantity_per_farmer} onChange={e => set('quantity_per_farmer', e.target.value)} required /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Subsidized Price (Rs/unit) *"><input type="number" step="0.01" className={inputCls} value={form.subsidized_price} onChange={e => set('subsidized_price', e.target.value)} required /></Field>
          <Field label="Market Price (Rs/unit)"><input type="number" step="0.01" className={inputCls} value={form.market_price} onChange={e => set('market_price', e.target.value)} /></Field>
        </div>
        <Field label="Collection Branch *">
          <select className={inputCls + ' bg-white'} value={form.branch_id} onChange={e => set('branch_id', e.target.value)} required>
            <option value="">-- Select branch --</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>
        <Field label="Notes"><textarea className={inputCls} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional instructions…" /></Field>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">{loading ? 'Creating…' : 'Create Program'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ───────── Allocations Panel ─────────
function AllocationsPanel({ program, onClose }) {
  const [farmers, setFarmers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAllocations = () => {
    setLoading(true);
    api.get(`/admin/fertilizers/programs/${program.id}/allocations`)
      .then(r => setFarmers(r.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAllocations();
  }, [program.id]);

  const handleMarkCollected = async (farmerId, allocationId) => {
    try {
      if (allocationId) {
        // Update existing allocation
        await api.patch(`/admin/fertilizers/allocations/${allocationId}/status`, { status: 'collected' });
        toast.success('Marked as collected');
      } else {
        // Create new allocation directly as collected
        await api.post(`/admin/fertilizers/programs/${program.id}/collect`, { farmer_id: farmerId });
        toast.success('Allocation created & marked collected');
      }
      fetchAllocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const filteredFarmers = farmers.filter(f =>
    f.farmer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.farmer_phone && f.farmer_phone.includes(searchQuery)) ||
    (f.farmer_email && f.farmer_email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Modal title={`Distribution Register — ${program.fertilizer_name}`} onClose={onClose}>
      <div className="space-y-3">
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search farmer by name or phone..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className={inputCls}
        />

        {loading ? (
          <div className="py-8 text-center text-gray-400">Loading…</div>
        ) : filteredFarmers.length === 0 ? (
          <div className="py-10 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No farmers found</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto -mx-6 px-6 divide-y divide-gray-50">
            {filteredFarmers.map(f => {
              const status = f.allocation_status;
              return (
                <div key={f.farmer_id} className="flex items-center gap-3 py-3 last:border-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                    {f.farmer_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{f.farmer_name}</p>
                    <p className="text-xs text-gray-400">{f.farmer_phone || f.farmer_email}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {status === 'collected' && (
                        <span className="text-green-600 font-medium">Collected: {new Date(f.collected_at).toLocaleDateString()}</span>
                      )}
                      {status === 'claimed' && (
                        <span className="text-amber-600 font-medium">Claimed online: {new Date(f.claimed_at).toLocaleDateString()}</span>
                      )}
                      {!status && (
                        <span className="text-gray-400">Not Claimed</span>
                      )}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {status === 'collected' ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                        <Check className="w-3 h-3" /> Collected
                      </span>
                    ) : status === 'claimed' ? (
                      <button
                        onClick={() => handleMarkCollected(f.farmer_id, f.allocation_id)}
                        className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-full transition-colors shadow-sm"
                      >
                        Collect Claim
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkCollected(f.farmer_id, null)}
                        className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
                      >
                        Mark Collected
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function AdminFertilizers() {
  const [tab, setTab] = useState('programs');
  const [programs, setPrograms] = useState([]);
  const [types, setTypes] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editType, setEditType] = useState(null);
  const [editBranch, setEditBranch] = useState(null);
  const [viewAllocs, setViewAllocs] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pR, tR, bR] = await Promise.all([
        api.get('/admin/fertilizers/programs'),
        api.get('/admin/fertilizers/types'),
        api.get('/admin/fertilizers/branches'),
      ]);
      setPrograms(pR.data.data);
      setTypes(tR.data.data);
      setBranches(bR.data.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const adjustQty = async (id, delta) => {
    try {
      const res = await api.patch(`/admin/fertilizers/programs/${id}/quantity`, { delta });
      setPrograms(ps => ps.map(p => p.id === id ? { ...p, available_quantity: res.data.data.available_quantity } : p));
    } catch { toast.error('Failed to adjust quantity'); }
  };

  const changeStatus = async (id, status) => {
    try {
      await api.patch(`/admin/fertilizers/programs/${id}`, { status });
      setPrograms(ps => ps.map(p => p.id === id ? { ...p, status } : p));
      toast.success(`Status updated to ${status}`);
    } catch { toast.error('Failed'); }
  };

  const TABS = [
    { id: 'programs', label: 'Programs', icon: Calendar },
    { id: 'branches', label: 'Branches', icon: Building2 },
    { id: 'types',    label: 'Types',    icon: Leaf },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Fertilizer Subsidy Programs</h1>
            <p className="text-xs text-gray-500">Government-subsidized fertilizer distribution management</p>
          </div>
        </div>
        <button
          onClick={() => {
            if (tab === 'programs') setShowProgramModal(true);
            else if (tab === 'types') { setEditType(null); setShowTypeModal(true); }
            else { setEditBranch(null); setShowBranchModal(true); }
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add {tab === 'programs' ? 'Program' : tab === 'types' ? 'Type' : 'Branch'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-6 gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === id ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* ─── PROGRAMS TAB ─── */}
          {tab === 'programs' && (
            <div className="space-y-8">
              {programs.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                  <Sprout className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-semibold text-gray-600">No programs yet</p>
                  <p className="text-sm text-gray-400 mt-1">Create a monthly fertilizer program to get started</p>
                </div>
              ) : (
                ['open', 'upcoming', 'closed'].map(statusKey => {
                  const list = programs.filter(p => p.status === statusKey);
                  const title = statusKey === 'open' ? 'Open Now' : statusKey === 'upcoming' ? 'Upcoming' : 'Closed';
                  const headerBg = statusKey === 'open' ? 'bg-green-50 text-green-700 border-green-100' : statusKey === 'upcoming' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-500 border-gray-100';

                  return (
                    <div key={statusKey} className="space-y-3">
                      <div className={`flex items-center justify-between px-4 py-2 rounded-xl border font-bold text-xs uppercase tracking-wider ${headerBg}`}>
                        <span>{title} Programs</span>
                        <span>{list.length}</span>
                      </div>
                      
                      {list.length === 0 ? (
                        <p className="text-xs text-gray-400 italic px-4 py-2">No programs in this category</p>
                      ) : (
                        <div className="space-y-4">
                          {list.map(p => {
                            const claimed = parseInt(p.total_claims || 0);
                            const pct = p.total_quantity > 0 ? Math.round(((p.total_quantity - p.available_quantity) / p.total_quantity) * 100) : 0;
                            return (
                              <div key={p.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                      <h3 className="font-bold text-gray-900">{p.fertilizer_name}</h3>
                                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${STATUS_STYLES[p.status]}`}>
                                        {p.status}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Distribution: <strong className="text-gray-700">{new Date(p.distribution_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {p.branch_name}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {claimed} claims
                                      </span>
                                    </div>

                                    {/* Price comparison */}
                                    <div className="flex items-center gap-4 mb-3">
                                      <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Subsidized</p>
                                        <p className="text-base font-extrabold text-green-700">Rs. {fmt(p.subsidized_price)} / {p.unit}</p>
                                      </div>
                                      {p.market_price && (
                                        <div>
                                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Market</p>
                                          <p className="text-sm font-semibold text-gray-400 line-through">Rs. {fmt(p.market_price)}</p>
                                        </div>
                                      )}
                                      <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Per Farmer</p>
                                        <p className="text-sm font-bold text-gray-700">{p.quantity_per_farmer} {p.unit}</p>
                                      </div>
                                    </div>

                                    {/* Quota bar */}
                                    <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                                      <span>Available quota</span>
                                      <span className="font-semibold">{parseFloat(p.available_quantity).toFixed(0)} / {parseFloat(p.total_quantity).toFixed(0)} {p.unit}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${100 - pct}%` }} />
                                    </div>

                                    {/* Quantity adjustment */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs text-gray-500 font-medium">Adjust quantity:</span>
                                      {[-100, -50, -10].map(d => (
                                        <button key={d} onClick={() => adjustQty(p.id, d)}
                                          className="text-xs bg-red-50 text-red-600 hover:bg-red-100 font-bold px-2.5 py-1 rounded-lg transition-colors">
                                          {d}
                                        </button>
                                      ))}
                                      {[10, 50, 100].map(d => (
                                        <button key={d} onClick={() => adjustQty(p.id, d)}
                                          className="text-xs bg-green-50 text-green-700 hover:bg-green-100 font-bold px-2.5 py-1 rounded-lg transition-colors">
                                          +{d}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Right actions */}
                                  <div className="flex flex-col gap-2 flex-shrink-0">
                                    <button
                                      onClick={() => setViewAllocs(p)}
                                      className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors"
                                    >
                                      <Users className="w-3.5 h-3.5" /> Claims
                                    </button>
                                    <select
                                      value={p.status}
                                      onChange={e => changeStatus(p.id, e.target.value)}
                                      className="text-xs border border-gray-200 rounded-xl px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                      <option value="upcoming">Upcoming</option>
                                      <option value="open">Open</option>
                                      <option value="closed">Closed</option>
                                    </select>
                                  </div>
                                </div>

                                {p.notes && (
                                  <div className="mt-3 pt-3 border-t border-gray-50">
                                    <p className="text-xs text-gray-500"><span className="font-semibold">Note:</span> {p.notes}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ─── BRANCHES TAB ─── */}
          {tab === 'branches' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {branches.length === 0 && (
                <div className="col-span-2 text-center py-20 bg-white rounded-3xl border border-gray-100">
                  <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-semibold text-gray-600">No branches yet</p>
                </div>
              )}
              {branches.map(b => (
                <div key={b.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">{b.name}</p>
                    </div>
                    <button onClick={() => { setEditBranch(b); setShowBranchModal(true); }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-1 flex items-start gap-1">
                    <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400" /> {b.address}
                  </p>
                  {b.phone && <p className="text-xs text-gray-400">{b.phone}</p>}
                  {b.location_lat && b.location_lng && (
                    <p className="text-[10px] text-gray-300 mt-1">{parseFloat(b.location_lat).toFixed(5)}°, {parseFloat(b.location_lng).toFixed(5)}°</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ─── TYPES TAB ─── */}
          {tab === 'types' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {types.length === 0 && (
                <div className="col-span-3 text-center py-20 bg-white rounded-3xl border border-gray-100">
                  <Leaf className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-semibold text-gray-600">No fertilizer types yet</p>
                </div>
              )}
              {types.map(t => (
                <div key={t.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Leaf className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    </div>
                    <button onClick={() => { setEditType(t); setShowTypeModal(true); }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase">{t.unit}</span>
                  {t.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{t.description}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showTypeModal && <TypeModal onClose={() => { setShowTypeModal(false); setEditType(null); }} onSaved={fetchAll} existing={editType} />}
      {showBranchModal && <BranchModal onClose={() => { setShowBranchModal(false); setEditBranch(null); }} onSaved={fetchAll} existing={editBranch} />}
      {showProgramModal && <ProgramModal onClose={() => setShowProgramModal(false)} onSaved={fetchAll} types={types} branches={branches} />}
      {viewAllocs && <AllocationsPanel program={viewAllocs} onClose={() => setViewAllocs(null)} />}
    </div>
  );
}
