import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Vehicles } from './pages/Vehicles';
import { Settings } from './pages/Settings';
import { Analytics } from './pages/Analytics';
import { AuditLogs } from './pages/AuditLogs';
import { Subscriptions } from './pages/Subscriptions';
import { UsersManagement } from './pages/UsersManagement';
import { Notifications } from './pages/Notifications';
import FirebaseSettings from './pages/FirebaseSettings';
import { UsersList } from './pages/UsersList';
import { Languages } from './pages/Languages';
import { WebHomeSettings } from './pages/WebHomeSettings';
import { Leaderboard } from './pages/Leaderboard';
import { AdminGuard } from './components/AdminGuard';
import { AdminLayout } from './layouts/AdminLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* Protected Admin Routes */}
        <Route element={<AdminGuard />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users-list" element={<UsersList />} />
            <Route path="/languages" element={<Languages />} />
            <Route path="/web-home-settings" element={<WebHomeSettings />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/users" element={<UsersManagement />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/firebase-settings" element={<FirebaseSettings />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
