import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  Navigation,
  Sparkles,
  Search
} from 'lucide-react';
import { api } from '../api/client';
import { Shipment, Supplier, Product } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';

export const ShipmentsPage: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // New Shipment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newShipment, setNewShipment] = useState({
    tracking_number: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
    supplier_id: 1,
    product_id: 1,
    quantity: 100,
    origin: 'Austin Hub, TX',
    destination: 'Central Depot, Chicago',
    carrier: 'FedEx Priority',
    order_date: new Date().toISOString(),
    estimated_delivery: new Date(Date.now() + 5 * 86400000).toISOString(),
    shipping_cost: 150.0,
    status: 'In Transit',
  });

  // Delay Simulator State
  const [simCarrier, setSimCarrier] = useState('Maersk Freight');
  const [simOrigin, setSimOrigin] = useState('Shenzhen Port, China');
  const [simDestination, setSimDestination] = useState('Port of Long Beach, CA');
  const [simTransitDays, setSimTransitDays] = useState(18);
  const [simVariance, setSimVariance] = useState(0.1);
  const [simResult, setSimResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ships, sups, prods] = await Promise.all([
        api.getShipments(),
        api.getSuppliers(),
        api.getInventory(),
      ]);
      setShipments(ships);
      setSuppliers(sups);
      setProducts(prods);
      if (sups.length > 0) setNewShipment((prev) => ({ ...prev, supplier_id: sups[0].id }));
      if (prods.length > 0) setNewShipment((prev) => ({ ...prev, product_id: prods[0].id }));
    } catch (err) {
      console.error('Error loading shipments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    runSimulator();
  }, []);

  const runSimulator = async () => {
    try {
      setSimulating(true);
      const res = await api.predictDelay({
        carrier: simCarrier,
        origin: simOrigin,
        destination: simDestination,
        transit_days: simTransitDays,
        supplier_lead_time_variance: simVariance,
      });
      setSimResult(res);
    } catch (err) {
      console.error('Simulator error:', err);
    } finally {
      setSimulating(false);
    }
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createShipment(newShipment);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create shipment');
    }
  };

  const handleStatusChange = async (shipmentId: number, newStatus: string) => {
    try {
      await api.updateShipment(shipmentId, { status: newStatus });
      loadData();
    } catch (err) {
      alert('Failed to update shipment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Shipment Tracking &amp; Delay Prediction</span>
          </h1>
          <p className="text-sm text-slate-400">
            Real-time logistics milestone tracking, predictive delay modeling, and route analytics.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-bold rounded-lg shadow-lg shadow-teal-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Dispatch New Shipment</span>
        </button>
      </div>

      {/* Interactive ML Delay Prediction Simulator */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-semibold text-white">Interactive ML Transit Delay Simulator</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Estimate carrier delay probability before dispatching based on route, carrier reliability, and supplier punctuality history.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-[11px] text-slate-400 uppercase font-semibold mb-1">Carrier</label>
            <select
              value={simCarrier}
              onChange={(e) => setSimCarrier(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            >
              <option value="DHL Express">DHL Express</option>
              <option value="FedEx Priority">FedEx Priority</option>
              <option value="UPS Supply Chain">UPS Supply Chain</option>
              <option value="Maersk Freight">Maersk Freight (Ocean)</option>
              <option value="BlueDart Logistics">BlueDart Logistics</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 uppercase font-semibold mb-1">Origin Hub</label>
            <input
              type="text"
              value={simOrigin}
              onChange={(e) => setSimOrigin(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 uppercase font-semibold mb-1">Destination</label>
            <input
              type="text"
              value={simDestination}
              onChange={(e) => setSimDestination(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <button
            onClick={runSimulator}
            disabled={simulating}
            className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-bold rounded-lg transition"
          >
            {simulating ? 'Calculating...' : 'Run Delay Simulation'}
          </button>
        </div>

        {simResult && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[11px] text-slate-500 block uppercase">Delay Risk Score</span>
                <span className={`text-2xl font-bold ${simResult.delay_probability >= 0.45 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {(simResult.delay_probability * 100).toFixed(0)}%
                </span>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <span className="text-[11px] text-slate-500 block uppercase">Predicted Delay</span>
                <span className="text-xl font-bold text-white">
                  +{simResult.predicted_delay_days} days
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Identified Risk Factors: </span>
              {simResult.risk_factors.length > 0 ? simResult.risk_factors.join(' ') : 'No critical bottlenecks detected on route.'}
            </div>
          </div>
        )}
      </div>

      {/* Shipments Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Tracking #</th>
                <th className="px-4 py-3">Carrier</th>
                <th className="px-4 py-3">Route (Origin → Dest)</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Promised Delivery</th>
                <th className="px-4 py-3">Delay Risk</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Loading shipment telemetry...
                  </td>
                </tr>
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No shipments tracked.
                  </td>
                </tr>
              ) : (
                shipments.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-850/50 transition">
                    <td className="px-4 py-3 font-mono font-semibold text-teal-400">
                      {s.tracking_number}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{s.carrier}</td>
                    <td className="px-4 py-3 text-slate-400">
                      <div className="flex items-center gap-1">
                        <span>{s.origin}</span>
                        <span>→</span>
                        <span>{s.destination}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">{s.quantity} units</td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {new Date(s.estimated_delivery).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${s.delay_probability >= 0.45 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {(s.delay_probability * 100).toFixed(0)}%
                        </span>
                        {s.predicted_delay_days > 0 && (
                          <span className="text-[10px] text-rose-400 font-mono">
                            (+{s.predicted_delay_days}d)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.status !== 'Delivered' && (
                        <button
                          onClick={() => handleStatusChange(s.id, 'Delivered')}
                          className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded text-[11px] font-medium transition"
                        >
                          Mark Delivered
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Shipment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Dispatch New Shipment"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateShipment} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Tracking Number *</label>
            <input
              type="text"
              required
              value={newShipment.tracking_number}
              onChange={(e) => setNewShipment({ ...newShipment, tracking_number: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Carrier *</label>
              <select
                value={newShipment.carrier}
                onChange={(e) => setNewShipment({ ...newShipment, carrier: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              >
                <option value="FedEx Priority">FedEx Priority</option>
                <option value="DHL Express">DHL Express</option>
                <option value="UPS Supply Chain">UPS Supply Chain</option>
                <option value="Maersk Freight">Maersk Freight</option>
                <option value="BlueDart Logistics">BlueDart Logistics</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Associated Supplier *</label>
              <select
                value={newShipment.supplier_id}
                onChange={(e) => setNewShipment({ ...newShipment, supplier_id: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              >
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Origin *</label>
              <input
                type="text"
                required
                value={newShipment.origin}
                onChange={(e) => setNewShipment({ ...newShipment, origin: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Destination *</label>
              <input
                type="text"
                required
                value={newShipment.destination}
                onChange={(e) => setNewShipment({ ...newShipment, destination: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Units Quantity</label>
              <input
                type="number"
                min="1"
                value={newShipment.quantity}
                onChange={(e) => setNewShipment({ ...newShipment, quantity: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Shipping Cost ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newShipment.shipping_cost}
                onChange={(e) => setNewShipment({ ...newShipment, shipping_cost: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
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
              Dispatch Shipment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

