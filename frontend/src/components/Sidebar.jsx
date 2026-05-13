import { Database, LogOut, Menu, ShieldCheck, Users, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { navModules, utilityPages } from '../data/modules';

const employeeModuleKeys = new Set([
  'sss_sales_entries',
  'availability_entries',
  'spot_promotion_entries',
  'retail_visit_entries',
  'pjp_entries'
]);

export default function Sidebar({ open, onClose, onToggle, onLogout, profile, session }) {
  const isAdmin = profile?.role === 'admin';
  const visibleModules = isAdmin ? navModules : navModules.filter((module) => employeeModuleKeys.has(module.key));
  const visibleUtilities = isAdmin ? utilityPages : utilityPages.filter((page) => page.path === '/help');
  const displayName = profile?.full_name || session?.user?.email || 'Signed in';

  return (
    <>
      <button
        className="fixed left-4 top-4 z-40 rounded-md bg-ink p-2 text-white shadow-soft lg:hidden"
        onClick={onToggle}
        aria-label="Toggle menu"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-slate-200 px-5 py-5">
          <NavLink to="/" className="flex items-center gap-3" onClick={onClose}>
            <img src="/logo/logo.png" alt="Support System" className="h-12 w-12 rounded-md object-contain" />
            <div>
              <h1 className="text-lg font-bold text-ink">Support System</h1>
              <p className="text-xs font-medium text-slate-500">Liquor sales reporting</p>
            </div>
          </NavLink>
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="truncate text-sm font-bold text-ink">{displayName}</p>
            <p className="truncate text-xs text-slate-500">{session?.user?.email}</p>
            <span className={`mt-2 inline-flex rounded px-2 py-1 text-xs font-bold uppercase ${isAdmin ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {isAdmin ? 'Admin' : 'Employee'}
            </span>
          </div>
        </div>

        <nav className="table-scroll flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <NavLink
            to="/"
            end
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold ${
                isActive ? 'bg-red-700 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`
            }
          >
            <ShieldCheck size={18} />
            Dashboard
          </NavLink>
          {visibleModules.map(({ key, path, shortTitle, icon: Icon }) => (
            <NavLink
              key={key}
              to={path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive ? 'bg-red-700 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              <Icon size={18} />
              {shortTitle}
            </NavLink>
          ))}

          <hr className="my-3 border-slate-200" />

          {visibleUtilities.map(({ path, shortTitle, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive ? 'bg-red-700 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              <Icon size={18} />
              {shortTitle}
            </NavLink>
          ))}

          {isAdmin ? (
            <>
              <NavLink
                to="/employees"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold ${
                    isActive ? 'bg-red-700 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <Users size={18} />
                Employees
              </NavLink>
              <NavLink
                to="/backup"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold ${
                    isActive ? 'bg-red-700 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <Database size={18} />
                Backup & Archive
              </NavLink>
            </>
          ) : null}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            onClick={onLogout}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
      {open ? <button className="fixed inset-0 z-20 bg-slate-950/40 lg:hidden" onClick={onClose} aria-label="Close menu" /> : null}
    </>
  );
}
