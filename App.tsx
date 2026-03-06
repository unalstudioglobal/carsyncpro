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
import { NotFound } from './pages/NotFound';

// Protected Route Layout
const ProtectedLayout = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (checkOnboarding()) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
};

const App: React.FC = () => {
  // Initialize state based on localStorage to avoid flash of login screen if already in demo mode
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    const isDemo = getSetting('isDemoMode', false);
    return isDemo ? true : null;
  });

  useEffect(() => {
    // Firebase Auth Listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        saveSetting('isAuthenticated', true);
        syncLocalToFirestore();
      } else {
        // Fallback: Check if we are in demo mode (used when Firebase domain is unauthorized)
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

    return () => unsubscribe();
  }, []);

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
          <HashRouter>
            <Layout>
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
                </Route>

                {/* Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </HashRouter>
        </PremiumProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
