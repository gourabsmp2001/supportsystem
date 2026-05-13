import { RefreshCw, Save, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from '../components/Toast';
import { supabase } from '../lib/supabaseClient';

export default function EmployeeManagement() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  async function loadProfiles() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id,email,full_name,role,status,created_at')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`Failed to load profiles: ${error.message}`);
      setProfiles([]);
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  function patchProfile(id, patch) {
    setProfiles((current) => current.map((profile) => (profile.id === id ? { ...profile, ...patch } : profile)));
  }

  async function saveProfile(profile) {
    setSavingId(profile.id);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        role: profile.role,
        status: profile.status
      })
      .eq('id', profile.id);

    if (error) toast.error(`Save failed: ${error.message}`);
    else toast.success('Employee profile updated.');
    setSavingId(null);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-red-700 p-3 text-white">
              <Users size={22} />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-saffron">Admin</p>
              <h1 className="text-2xl font-black text-ink">Employee Management</h1>
              <p className="mt-1 text-sm text-slate-500">Create auth users in Supabase, then manage their profile role and status here.</p>
            </div>
          </div>
          <button onClick={loadProfiles} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-bold">User creation stays in Supabase Authentication.</p>
        <p className="mt-1">Do not put a service role key in this app. Add the employee in Supabase Authentication, then set their profile to employee/active here.</p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-soft">
        <div className="table-scroll overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-ink text-white">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase">Name</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase">Email</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase">Role</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase">Status</th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-bold uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {profiles.length ? profiles.map((profile) => (
                <tr key={profile.id}>
                  <td className="min-w-56 px-4 py-3">
                    <input value={profile.full_name || ''} onChange={(event) => patchProfile(profile.id, { full_name: event.target.value })} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{profile.email || profile.id}</td>
                  <td className="min-w-36 px-4 py-3">
                    <select value={profile.role || 'employee'} onChange={(event) => patchProfile(profile.id, { role: event.target.value })}>
                      <option value="employee">employee</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="min-w-36 px-4 py-3">
                    <select value={profile.status || 'active'} onChange={(event) => patchProfile(profile.id, { status: event.target.value })}>
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      onClick={() => saveProfile(profile)}
                      disabled={savingId === profile.id}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-red-700 px-3 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50"
                    >
                      <Save size={16} />
                      Save
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">{loading ? 'Loading profiles...' : 'No profiles found.'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
