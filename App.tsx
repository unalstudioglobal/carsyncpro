import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import './services/toast'; // offline/online listener'ları başlat
import { Garage } from './pages/Garage';
import { Dashboard } from './pages/Dashboard';
import { Analytics } from './pages/Analytics';
import { AddRecord } from './pages/AddRecord';
import { TransferHistory, ScanImport } from './pages/ImportExport';
import { Settings } from './pages/Settings';
import { Settings as SettingsIcon } from 'lucide-react';
import { AddVehicle } from './pages/AddVehicle';
import { SmartNotifications } from './pages/SmartNotifications';
import { ThemeCustomizer } from './pages/ThemeCustomizer';
import { FuelReminder } from './pages/FuelReminder';
import { ServiceAppointment } from './pages/ServiceAppointment';
import { Login } from './pages/Login';
import { Onboarding, checkOnboarding } from './pages/Onboarding';
import { Premium } from './pages/Premium';
import { CarChat } from './pages/CarChat';
import { Logs } from './pages/Logs';
import { ThemeProvider } from './context/ThemeContext';
import { PremiumProvider } from './context/PremiumContext';
import { DataProvider } from './context/DataContext';
import { getSetting, saveSetting } from './services/settingsService';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { syncLocalToFirestore } from './services/firestoreService';
import { clearPremiumCache } from './services/premiumService';
import { Documents } from './pages/Documents';
import { Tires } from './pages/Tires';
import { TripPlanner } from './pages/TripPlanner';
import { PredictiveMaintenance } from './pages/PredictiveMaintenance';
import { DamageDetection } from './pages/DamageDetection';
import { BudgetGoals } from './pages/BudgetGoals';
import { VehicleComparison } from './pages/VehicleComparison';
import { InsuranceCalendar } from './pages/InsuranceCalendar';
import { VehicleQRCard } from './pages/VehicleQRCard';
import { ServiceHistoryReport } from './pages/ServiceHistoryReport';
import { FamilyGarage } from './pages/FamilyGarage';
import { FuelFinder } from './pages/FuelFinder';
import { AIInsights } from './pages/AIInsights';
import { NotFound } from './pages/NotFound';

// Protected Route Layout
const ProtectedLayout = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (checkOnboarding()) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
};

import { initNotifications } from './services/notificationService';
import { App as CapApp } from '@capacitor/app';

const App: React.FC = () => {
  // Initialize state based on localStorage to avoid flash of login screen if already in demo mode
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    const isDemo = getSetting('isDemoMode', false);
    return isDemo ? true : null;
  });
  const [globalConfig, setGlobalConfig] = useState<any>(null);

  useEffect(() => {
    // Fetch global config
    import('./services/firestoreService').then(({ getGlobalConfig }) => {
      getGlobalConfig().then(config => {
        setGlobalConfig(config);
      });
    });

    // Firebase Auth Listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        saveSetting('isAuthenticated', true);
        syncLocalToFirestore();
        // Login olunca bildirimleri ilklendir
        initNotifications().catch(console.error);
      } else {
        const isDemo = getSetting('isDemoMode', false);
        if (isDemo) {
          setIsAuthenticated(true);
          saveSetting('isAuthenticated', true);
        } else {
          setIsAuthenticated(false);
          saveSetting('isAuthenticated', false);
          clearPremiumCache();
        }
      }
    });

    // Deep Linking Listener
    CapApp.addListener('appUrlOpen', (data: any) => {
      const url = new URL(data.url);
      const path = url.pathname || url.hostname;
      if (path.includes('dashboard')) {
        const parts = path.split('/');
        const id = parts[parts.length - 1];
        if (id) window.location.hash = `#/dashboard/${id}`;
      } else if (path.includes('add-record')) {
        window.location.hash = `#/add-record`;
      }
    });

    return () => {
      unsubscribe();
      CapApp.removeAllListeners();
    };
  }, []);

  // Maintenance Mode Check
  if (globalConfig?.maintenanceMode) {
    return (
      <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-gold/10 rounded-[32px] flex items-center justify-center mb-8 border border-gold/20 shadow-[0_0_50px_rgba(212,175,55,0.1)]">
          <SettingsIcon size={48} className="text-gold animate-spin-slow" />
        </div>
        <h1 className="text-4xl font-black mb-4 tracking-tight">Sistem Bakımda</h1>
        <p className="text-slate-400 max-w-md leading-relaxed mb-8">
          Sizlere daha iyi bir deneyim sunmak için kısa süreli bir bakım çalışması yapıyoruz. Lütfen daha sonra tekrar deneyin.
        </p>
        <div className="px-6 py-2 bg-white/5 rounded-full border border-white/10 text-xs font-bold uppercase tracking-widest text-slate-500">
          CarSync Pro v2.0
        </div>
      </div>
    );
  }

  // Loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <PremiumProvider>
          <DataProvider>
          <HashRouter>
            <Layout announcement={globalConfig?.announcement}>
              <Routes>
                {/* Public Route */}
                <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
                <Route path="/onboarding" element={<Onboarding />} />

                {/* Protected Routes */}
                <Route element={<ProtectedLayout isAuthenticated={isAuthenticated} />}>
                  <Route path="/" element={<Garage />} />
                  <Route path="/dashboard/:id" element={<Dashboard />} />
                  <Route path="/chat/:id" element={<CarChat />} />
                  <Route path="/car-chat" element={<CarChat />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/logs" element={<Logs />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/theme" element={<ThemeCustomizer />} />
                  <Route path="/premium" element={<Premium />} />
                  <Route path="/notifications" element={<SmartNotifications />} />
                  <Route path="/fuel-reminder" element={<FuelReminder />} />
                  <Route path="/service-appointment" element={<ServiceAppointment />} />
                  <Route path="/add-record" element={<AddRecord />} />
                  <Route path="/add-vehicle" element={<AddVehicle />} />
                  <Route path="/edit-vehicle/:id" element={<AddVehicle />} />
                  <Route path="/transfer" element={<TransferHistory />} />
                  <Route path="/scan" element={<ScanImport />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/tires" element={<Tires />} />
                  <Route path="/trip-planner" element={<TripPlanner />} />
                  <Route path="/predictive-maintenance" element={<PredictiveMaintenance />} />
                  <Route path="/damage-detection" element={<DamageDetection />} />
                  <Route path="/budget-goals" element={<BudgetGoals />} />
                  <Route path="/vehicle-comparison" element={<VehicleComparison />} />
                  <Route path="/insurance-calendar" element={<InsuranceCalendar />} />
                  <Route path="/vehicle-qr" element={<VehicleQRCard />} />
                  <Route path="/vehicle-qr/:id" element={<VehicleQRCard />} />
                  <Route path="/service-report" element={<ServiceHistoryReport />} />
                  <Route path="/family-garage" element={<FamilyGarage />} />
                  <Route path="/fuel-finder" element={<FuelFinder />} />
                  <Route path="/ai-insights" element={<AIInsights />} />
                  <Route path="/ai-insights/:id" element={<AIInsights />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </HashRouter>
          </DataProvider>
        </PremiumProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
