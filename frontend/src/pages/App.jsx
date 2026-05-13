import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ToastContainer from '../components/Toast';
import { navModules } from '../data/modules';
import { supabase } from '../lib/supabaseClient';
import Backup from './Backup';
import Dashboard from './Dashboard';
import EmployeeDashboard from './EmployeeDashboard';
import EmployeeManagement from './EmployeeManagement';
import Help from './Help';
import ImportData from './ImportData';
import ReportTemplates from './ReportTemplates';
import ReportPage from './ReportPage';

const employeeModuleKeys = new Set([
  'sss_sales_entries',
  'availability_entries',
  'spot_promotion_entries',
  'retail_visit_entries',
  'pjp_entries'
]);

export default function App() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadProfile(nextSession) {
      setSession(nextSession);
      setProfile(null);
      setProfileError('');

      if (!nextSession?.user?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,full_name,role,status')
        .eq('id', nextSession.user.id)
        .maybeSingle();

      if (error) {
        setProfileError(error.message);
      } else if (!data) {
        setProfileError('No profile is configured for this login. Please contact admin.');
      } else if (data.status !== 'active') {
        setProfileError('Your account is inactive. Please contact admin.');
      } else {
        setProfile(data);
      }
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => {
      loadProfile(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setLoading(true);
      loadProfile(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-red-700">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  if (profileError || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md rounded-lg border border-red-200 bg-white p-6 text-center shadow-soft">
          <h1 className="text-xl font-black text-ink">Access unavailable</h1>
          <p className="mt-2 text-sm text-slate-600">{profileError || 'Profile is loading.'}</p>
          <button onClick={logout} className="mt-5 rounded-md bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = profile.role === 'admin';
  const canAccessModule = (moduleKey) => isAdmin || employeeModuleKeys.has(moduleKey);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggle={() => setSidebarOpen((value) => !value)}
        onLogout={logout}
        profile={profile}
        session={session}
      />
      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-6 pt-20 sm:px-6 lg:px-8 lg:pt-8">
          <Routes>
            <Route path="/" element={isAdmin ? <Dashboard /> : <EmployeeDashboard profile={profile} />} />
            <Route path="/backup" element={isAdmin ? <Backup /> : <Navigate to="/" replace />} />
            <Route path="/employees" element={isAdmin ? <EmployeeManagement /> : <Navigate to="/" replace />} />
            <Route path="/import-data" element={isAdmin ? <ImportData /> : <Navigate to="/" replace />} />
            <Route path="/report-templates" element={isAdmin ? <ReportTemplates /> : <Navigate to="/" replace />} />
            <Route path="/help" element={<Help />} />
            {navModules.map((module) => (
              <Route
                key={module.key}
                path={module.path}
                element={canAccessModule(module.key) ? (
                  <ReportPage moduleKey={module.key} config={module} profile={profile} session={session} />
                ) : (
                  <Navigate to="/" replace />
                )}
              />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
