import React, { useState, useEffect } from 'react';
import { ModelApprovalCheck } from '../components/common/ModelApprovalCheck';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LIVE_STATES, CATEGORY_LABELS, ACCURACY_CLASSES } from '../config/geo';
import { WorkflowError } from '../services/storage';
import { AccuracyClass } from '../types';
import { Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { Instrument, InstrumentCategory, InstrumentStatus } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  Scale, 
  Search, 
  Filter, 
  Plus, 
  MapPin, 
  Calendar, 
  ChevronRight, 
  FileCheck, 
  X,
  ExternalLink 
} from 'lucide-react';

export const InstrumentsList: React.FC = () => {
  const [allInstruments, setAllInstruments] = useState<Instrument[]>(storage.getInstruments());
  const [user, setUser] = useState(storage.getCurrentUser());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(searchParams.get('register') === '1');
  const [newClass, setNewClass] = useState<AccuracyClass>('CLASS_III');
  const [regError, setRegError] = useState<string | null>(null);
  const [siteGps, setSiteGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsNote, setGpsNote] = useState('');

  // Registration Form State
  const [newCategory, setNewCategory] = useState<InstrumentCategory>('NON_AUTOMATIC_WEIGHING');
  const [newManufacturer, setNewManufacturer] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newModelApproval, setNewModelApproval] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [newCapacity, setNewCapacity] = useState('');
  const [newScaleInterval, setNewScaleInterval] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newState, setNewState] = useState(storage.getCurrentUser().state in LIVE_STATES ? storage.getCurrentUser().state : 'Delhi');
  const [newDistrict, setNewDistrict] = useState(LIVE_STATES[storage.getCurrentUser().state]?.includes(storage.getCurrentUser().district) ? storage.getCurrentUser().district : LIVE_STATES.Delhi[0]);

  useEffect(() => {
    const unsub = storage.subscribe(() => {
      setAllInstruments(storage.getInstruments());
      setUser(storage.getCurrentUser());
    });
    return unsub;
  }, []);

  // Role-based data filtering
  const instruments = storage.getInstrumentsForUser(user);
  void allInstruments;

  const filteredInstruments = instruments.filter(inst => {
    const matchesSearch = 
      inst.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.district.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || inst.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || inst.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const captureSite = () => {
    if (!('geolocation' in navigator)) { setGpsNote('Location not available on this device.'); return; }
    setGpsNote('Getting location…');
    navigator.geolocation.getCurrentPosition(
      p => { setSiteGps({ lat: p.coords.latitude, lng: p.coords.longitude }); setGpsNote(`Saved: ${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`); },
      () => setGpsNote('Location permission denied. You can register without it.'),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    if (!newManufacturer.trim() || !newModel.trim() || !newSerial.trim() || !newCapacity.trim() || !newModelApproval.trim() || !newAddress.trim()) {
      setRegError('Fill every field marked *.');
      return;
    }
    const user = storage.getCurrentUser();
    try {
      const inst = await storage.registerInstrument({
        category: newCategory,
        categoryName: `${CATEGORY_LABELS[newCategory] || newCategory.replace(/_/g, ' ').toLowerCase()} ${newCapacity.trim()}`,
        accuracyClass: newClass,
        manufacturer: newManufacturer.trim(),
        model: newModel.trim(),
        modelApprovalNumber: newModelApproval.trim().toUpperCase(),
        serialNumber: newSerial.trim(),
        capacity: newCapacity.trim(),
        scaleInterval: newScaleInterval.trim() || 'not stated',
        purchaseDate: new Date().toISOString().slice(0, 10),
        installationDate: new Date().toISOString().slice(0, 10),
        ownerId: user.id,
        ownerName: user.fullName,
        organization: user.organization,
        installationAddress: newAddress.trim(),
        state: newState,
        district: newDistrict,
        latitude: siteGps?.lat,
        longitude: siteGps?.lng,
        nextVerificationDueDate: '',
        photos: [],
      });
      setIsRegisterModalOpen(false);
      setNewManufacturer(''); setNewModel(''); setNewSerial(''); setNewCapacity(''); setNewScaleInterval(''); setNewModelApproval(''); setNewAddress(''); setSiteGps(null); setGpsNote('');
      navigate(`/applications/new?instrumentId=${inst.id}`);
    } catch (err) {
      setRegError(err instanceof WorkflowError || err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Scale className="w-5 h-5 text-gov-700" />
            <span className="text-xs font-bold text-gov-800 uppercase tracking-wider">
              Legal Metrology Registry
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Weighing &amp; Measuring Instruments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Central repository of all weights and measures with immutable Digital Identity (UID) and complete lifecycle history.
          </p>
        </div>

        {user.role === 'BUSINESS' && (
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-gov-700 hover:bg-gov-800 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors shadow-xs shrink-0 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            Register an instrument
          </button>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by UID (e.g. LM-DL-2026), Serial No, Model, Organization..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-gov-600 focus:bg-white transition-all"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              aria-label="Filter by Status"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-gov-600 focus:bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active &amp; Verified</option>
              <option value="EXPIRING_SOON">Expiring Soon (&lt; 30 Days)</option>
              <option value="EXPIRED">Expired / Overdue</option>
              <option value="REGISTERED">Registered (Initial)</option>
              <option value="UNDER_VERIFICATION">Under Verification</option>
              <option value="REVOKED">Revoked / Suspended</option>
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              aria-label="Filter by Instrument Category"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-gov-600 focus:bg-white"
            >
              <option value="ALL">All Instrument Categories</option>
              <option value="NON_AUTOMATIC_WEIGHING">Non-Automatic Weighing (Class III)</option>
              <option value="COUNTER_MACHINE">Counter Machine</option>
              <option value="PLATFORM_SCALE">Platform Scale</option>
              <option value="WEIGHBRIDGE">Weighbridge (Road/Rail)</option>
              <option value="FUEL_DISPENSER_PETROL_DIESEL">Fuel Dispenser (Petrol/Diesel)</option>
              <option value="FUEL_DISPENSER_CNG">CNG Dispenser</option>
              <option value="WATER_METER">Water Meter</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs border-t border-slate-100">
          <span className="text-slate-500 font-medium text-[11px] mr-1">Status Quick Filters:</span>
          {['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'REGISTERED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-gov-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Instruments Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInstruments.map(inst => (
          <div
            key={inst.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-gov-800 bg-gov-50 px-2 py-0.5 rounded border border-gov-200">
                    {inst.id}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1.5 line-clamp-1">
                    {inst.categoryName}
                  </h3>
                </div>
                <StatusBadge status={inst.status} size="sm" />
              </div>

              {/* Technical Specifications */}
              <div className="space-y-1.5 text-xs text-slate-600 my-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Manufacturer:</span>
                  <span className="font-semibold text-slate-800">{inst.manufacturer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Model &amp; Serial:</span>
                  <span className="font-mono text-slate-800 font-medium">{inst.model} • {inst.serialNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nominal Capacity:</span>
                  <span className="font-bold text-slate-900">{inst.capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Model Approval:</span>
                  <span className="text-[11px] font-mono text-gov-800">{inst.modelApprovalNumber}</span>
                </div>
              </div>

              {/* Location & Organization */}
              <div className="text-xs text-slate-500 space-y-1 mb-4">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="line-clamp-1">{inst.installationAddress}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Due Date: <strong className={inst.status === 'EXPIRED' ? 'text-rose-700' : 'text-slate-800'}>{inst.nextVerificationDueDate}</strong></span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
              <Link
                to={`/instruments/${inst.id}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-gov-700 hover:text-gov-900 hover:underline"
              >
                <span>View Full Lifecycle</span>
                <ChevronRight className="w-4 h-4" />
              </Link>

              {inst.status === 'ACTIVE' && inst.currentCertificateId ? (
                <Link
                  to={`/certificates/${inst.currentCertificateId}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Certificate</span>
                </Link>
              ) : (
                <Link
                  to={`/applications/new?instrumentId=${inst.id}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-gov-50 text-gov-800 border border-gov-200 text-xs font-semibold hover:bg-gov-100"
                >
                  <span>Apply Now</span>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredInstruments.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Scale className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">No instruments matched your criteria</h3>
          <p className="text-xs text-slate-500 mt-1">Try refining your search keyword or clearing the status filters.</p>
        </div>
      )}

      {/* Registration Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
            <div className="bg-gov-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">Register New Instrument</h3>
                <p className="text-xs text-gov-200">Legal Metrology Instrument Identity Allocation</p>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1 rounded text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Instrument Category *</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as InstrumentCategory)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs focus:ring-2 focus:ring-gov-600"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Accuracy class *</label>
                  <select value={newClass} onChange={e => setNewClass(e.target.value as AccuracyClass)} className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs">
                    {ACCURACY_CLASSES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Manufacturer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Avery India Metrology Ltd"
                    value={newManufacturer}
                    onChange={e => setNewManufacturer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Model &amp; Series *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IND-9000-X"
                    value={newModel}
                    onChange={e => setNewModel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Serial Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SN-AVR-90412"
                    value={newSerial}
                    onChange={e => setNewSerial(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nominal Capacity *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 150 kg or 50,000 kg"
                    value={newCapacity}
                    onChange={e => setNewCapacity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scale Interval (e / d)</label>
                  <input
                    type="text"
                    placeholder="e.g. e = 20g, d = 5g"
                    value={newScaleInterval}
                    onChange={e => setNewScaleInterval(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Model approval number *</label>
                  <input
                    type="text"
                    placeholder="As on the nameplate, e.g. IND/09/25/235"
                    value={newModelApproval}
                    onChange={e => setNewModelApproval(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono"
                  />
                  {newModelApproval.trim().length >= 10 && (
                    <div className="mt-2"><ModelApprovalCheck mark={newModelApproval} manufacturer={newManufacturer} compact /></div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State Jurisdiction *</label>
                  <select
                    value={newState}
                    onChange={e => { setNewState(e.target.value); setNewDistrict(LIVE_STATES[e.target.value][0]); }}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                  >
                    {Object.keys(LIVE_STATES).map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">States with officers set up in the prototype</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">District *</label>
                  <select value={newDistrict} onChange={e => setNewDistrict(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs">
                    {LIVE_STATES[newState].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Installation Address / Premises *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Precise business premises or retail site address where instrument is located..."
                  value={newAddress}
                  onChange={e => setNewAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={captureSite} className="px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold min-h-[40px]">Use my current location as the site</button>
                <span className="text-[11px] text-slate-500">{gpsNote || 'Optional. Lets the inspector app confirm the officer is on site.'}</span>
              </div>
              {regError && <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">{regError}</p>}

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 rounded text-slate-700 bg-slate-100 hover:bg-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-gov-700 hover:bg-gov-800 text-white font-bold shadow-xs"
                >
                  Register and get Digital ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
