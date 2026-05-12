import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ToastContainer from '../components/Toast';
import { navModules } from '../data/modules';
import { supabase } from '../lib/supabaseClient';
import Backup from './Backup';
import Dashboard from './Dashboard';
import ReportPage from './ReportPage';

export default function App() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onToggle={() => setSidebarOpen((value) => !value)} onLogout={logout} />
      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-6 pt-20 sm:px-6 lg:px-8 lg:pt-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/backup" element={<Backup />} />
            {navModules.map((module) => (
              <Route key={module.key} path={module.path} element={<ReportPage moduleKey={module.key} config={module} />} />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
