import { Loader2, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    navigate('/', { replace: true });
  }

  return (
    <main className="min-h-screen bg-ink text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-between bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.28),_transparent_32%),linear-gradient(145deg,#111827,#7f1d1d)] p-8">
          <div className="flex items-center gap-3">
            <img src="/logo/logo.png" alt="Support System" className="h-14 w-14 rounded-md object-contain" />
            <div>
              <h1 className="text-2xl font-bold">Support System</h1>
              <p className="text-sm text-amber-100">Digital liquor sales reporting</p>
            </div>
          </div>
          <div className="max-w-2xl py-16">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-saffron">Sales executive dashboard</p>
            <h2 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
              Retail visits, sales entries, photos, and Excel reports in one place.
            </h2>
            <p className="mt-5 max-w-xl text-lg text-slate-200">
              Built for mobile shop visits and monthly reporting.
            </p>
          </div>

        </section>

        <section className="flex items-center justify-center bg-white p-5 text-ink">
          <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-md bg-red-700 p-3 text-white">
                <LockKeyhole size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Account Login</h2>
                <p className="text-sm text-slate-500">Sign in to your account.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label>Email</label>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
              </div>
              <div>
                <label>Password</label>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
              </div>
              {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
              <button className="flex w-full items-center justify-center gap-2 rounded-md bg-red-700 px-4 py-3 text-sm font-bold text-white hover:bg-red-800" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Login
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
