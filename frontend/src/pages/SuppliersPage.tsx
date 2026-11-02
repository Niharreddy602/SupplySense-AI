import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Star,
  Clock,
  Truck,
  CheckCircle2,
  Shield,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';
import { api } from '../api/client';
import { Supplier } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    phone: '',
    location: 'Domestic',
    lead_time_days: 7,
    on_time_delivery_rate: 0.95,
    quality_rating: 4.8,
    tier: 'Tier 1 (Preferred)',
  });

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.getSuppliers();
      setSuppliers(res);
    } catch (err) {
      console.error('Error loading suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSupplier(formData);
      setIsModalOpen(false);
      loadSuppliers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create supplier');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Supplier Performance Scorecard</span>
          </h1>
          <p className="text-sm text-slate-400">
            Fulfillment SLA compliance, on-time delivery rates, lead-time variance, and tier ranking.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-bold rounded-lg shadow-lg shadow-teal-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs">
            Calculating supplier fulfillment metrics...
          </div>
        ) : suppliers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs">
            No suppliers found.
          </div>
        ) : (
          suppliers.map((sup) => (
            <div
              key={sup.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">{sup.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{sup.location}</span>
                    </div>
                  </div>
                  <StatusBadge status={sup.tier} />
                </div>

                <div className="grid grid-cols-2 gap-3 my-4">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">On-Time Delivery</span>
                    <span className={`text-xl font-bold ${sup.on_time_delivery_rate >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {sup.on_time_delivery_rate}%
                    </span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Quality Score</span>
                    <div className="flex items-center gap-1 text-xl font-bold text-teal-400">
                      <span>{sup.quality_rating}</span>
                      <Star className="w-4 h-4 fill-teal-400 text-teal-400" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Promised Lead Time:</span>
                    <span className="text-slate-200 font-semibold">{sup.lead_time_days} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Catalog Products Supplied:</span>
                    <span className="text-slate-200 font-semibold">{sup.products_supplied} SKUs</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Shipments Dispatched:</span>
                    <span className="text-slate-200 font-semibold">{sup.total_shipments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recorded Delayed Shipments:</span>
                    <span className={sup.delayed_shipments > 0 ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
                      {sup.delayed_shipments}
                    </span>
                  </div>
                </div>
              </div>

              {(sup.contact_email || sup.phone) && (
                <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  {sup.contact_email && (
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{sup.contact_email}</span>
                    </span>
                  )}
                  {sup.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{sup.phone}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Vendor / Supplier"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Company / Supplier Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Contact Email</label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Location *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Promised Lead Time (Days)</label>
              <input
                type="number"
                min="1"
                value={formData.lead_time_days}
                onChange={(e) => setFormData({ ...formData, lead_time_days: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Quality Rating (1.0 to 5.0)</label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={formData.quality_rating}
                onChange={(e) => setFormData({ ...formData, quality_rating: parseFloat(e.target.value) || 4.0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Tier Classification</label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              >
                <option value="Tier 1 (Preferred)">Tier 1 (Preferred)</option>
                <option value="Tier 2 (Standard)">Tier 2 (Standard)</option>
                <option value="Tier 3 (Under Review)">Tier 3 (Under Review)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-lg transition"
            >
              Save Supplier
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

