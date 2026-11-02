import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { InventoryPage } from './pages/InventoryPage';
import { ForecastingPage } from './pages/ForecastingPage';
import { RestockPage } from './pages/RestockPage';
import { ShipmentsPage } from './pages/ShipmentsPage';
import { AnomaliesPage } from './pages/AnomaliesPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { ETLUploadPage } from './pages/ETLUploadPage';
import { ReportsPage } from './pages/ReportsPage';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/forecasting" element={<ForecastingPage />} />
              <Route path="/restock" element={<RestockPage />} />
              <Route path="/shipments" element={<ShipmentsPage />} />
              <Route path="/anomalies" element={<AnomaliesPage />} />
              <Route path="/suppliers" element={<SuppliersPage />} />
              <Route path="/etl" element={<ETLUploadPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;

