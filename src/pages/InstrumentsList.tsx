import React, { useState, useEffect } from 'react';
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
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Registration Form State
  const [newCategory, setNewCategory] = useState<InstrumentCategory>('NON_AUTOMATIC_WEIGHING');
  const [newManufacturer, setNewManufacturer] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newModelApproval, setNewModelApproval] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [newCapacity, setNewCapacity] = useState('');
  const [newScaleInterval, setNewScaleInterval] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newState, setNewState] = useState('Delhi');
  const [newDistrict, setNewDistrict] = useState('Central Delhi');

  useEffect(() => {
    const unsub = storage.subscribe(() => {
      setAllInstruments(storage.getInstruments());
      setUser(storage.getCurrentUser());
    });
    return unsub;
  }, []);

  // Role-based data filtering
  const instruments = user.role === 'BUSINESS'
    ? allInstruments.filter(i => i.ownerId === user.id)
    : (user.role === 'LMO' || user.role === 'GATC' || user.role === 'CONTROLLER' || user.role === 'STATE_ADMIN')
    ? allInstruments.filter(i => i.state === user.state)
    : allInstruments; // CENTRAL_ADMIN sees all

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

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newManufacturer || !newModel || !newSerial || !newCapacity) {
      alert('Please fill all mandatory technical specifications');
      return;
    }

    const user = storage.getCurrentUser();
    storage.registerInstrument({
      category: newCategory,
      categoryName: `${newCategory.replace(/_/g, ' ')} (${newModel})`,
      accuracyClass: 'CLASS_III',
      manufacturer: newManufacturer,
      model: newModel,
      modelApprovalNumber: newModelApproval || 'IND/09/2026/PROV',
      serialNumber: newSerial,
      capacity: newCapacity,
      scaleInterval: newScaleInterval || 'e = 10g',
      purchaseDate: new Date().toISOString().split('T')[0],
      installationDate: new Date().toISOString().split('T')[0],
      ownerId: user.id,
      ownerName: user.fullName,
      organization: user.organization,
      installationAddress: newAddress || `${user.address}, ${newDistrict}, ${newState}`,
      state: newState,
      district: newDistrict,
      nextVerificationDueDate: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
      photos: ['https://images.unsplash.com/photo-1584727638096-042c45049ebe?auto=format&fit=crop&w=600&q=80'],
    });

    setIsRegisterModalOpen(false);
    // Reset inputs
    setNewManufacturer('');
    setNewModel('');
    setNewSerial('');
    setNewCapacity('');
    setNewScaleInterval('');
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

        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="inline-flex items-center gap-2 bg-gov-700 hover:bg-gov-800 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          Register New Instrument
        </button>
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
                    <option value="NON_AUTOMATIC_WEIGHING">Non-Automatic Weighing Instrument</option>
                    <option value="COUNTER_MACHINE">Counter Machine (Class III)</option>
                    <option value="PLATFORM_SCALE">Platform Scale</option>
                    <option value="WEIGHBRIDGE">Road Pitless Weighbridge</option>
                    <option value="FUEL_DISPENSER_PETROL_DIESEL">Fuel Dispenser (Petrol/Diesel)</option>
                    <option value="FUEL_DISPENSER_CNG">CNG Dispenser</option>
                    <option value="WATER_METER">Bulk / Residential Water Meter</option>
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
                  <label className="block font-semibold text-slate-700 mb-1">Model Approval Certificate No.</label>
                  <input
                    type="text"
                    placeholder="e.g. IND/09/2023/184"
                    value={newModelApproval}
                    onChange={e => setNewModelApproval(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State Jurisdiction *</label>
                  <select
                    value={newState}
                    onChange={e => setNewState(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                  >
                    <option value="Delhi">Delhi (NCT)</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Karnataka">Karnataka</option>
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
                  Register &amp; Assign Digital UID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
