import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { LeadsPage } from '@/pages/leads/LeadsPage';
import { LeadDetailPage } from '@/pages/leads/LeadDetailPage';
import { PipelinePage } from '@/pages/pipeline/PipelinePage';
import { TeamPage } from '@/pages/team/TeamPage';
import { PropertiesPage } from '@/pages/properties/PropertiesPage';
import { PropertyDetailPage } from '@/pages/properties/PropertyDetailPage';
import { CalendarPage } from '@/pages/calendar/CalendarPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { TemplatesPage } from '@/pages/templates/TemplatesPage';
import { NotificationsPage } from '@/pages/notifications/NotificationsPage';
import { IntegrationsPage } from '@/pages/integrations/IntegrationsPage';
import { FunnelSettingsPage } from '@/pages/settings/FunnelSettingsPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Routes>
      {/* Ruta pública */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />

      {/* Rutas protegidas */}
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard"   element={<DashboardPage />} />
        <Route path="/leads"       element={<LeadsPage />} />
        <Route path="/leads/:id"   element={<LeadDetailPage />} />
        <Route path="/pipeline"    element={<PipelinePage />} />
        <Route path="/calendario"  element={<CalendarPage />} />
        <Route path="/propiedades"     element={<PropertiesPage />} />
        <Route path="/propiedades/:id" element={<PropertyDetailPage />} />
        <Route path="/reportes"    element={<ReportsPage />} />
        <Route path="/team"        element={<TeamPage />} />
        <Route path="/plantillas"       element={<TemplatesPage />} />
        <Route path="/notificaciones"   element={<NotificationsPage />} />
        <Route path="/integraciones"    element={<IntegrationsPage />} />
        <Route path="/settings/funnel"  element={<FunnelSettingsPage />} />
        <Route path="/perfil"           element={<ProfilePage />} />
      </Route>

      {/* Fallback */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  );
}

export default App;
