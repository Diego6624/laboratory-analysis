import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { logoutAdmin } from '../../services/labResultsApi.js'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/pacientes', label: 'Pacientes' },
  { to: '/admin/ordenes', label: 'Ordenes' },
]

export default function AdminLayout() {
  const navigate = useNavigate()

  function handleLogout() {
    logoutAdmin()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:flex">
      <aside className="border-b border-slate-200 bg-slate-950 text-white lg:min-h-screen lg:w-72 lg:border-b-0">
        <div className="flex items-center justify-between gap-4 px-5 py-5 lg:block">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">Intranet</p>
            <h1 className="mt-2 text-xl font-bold">Policlínico Palomino</h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 lg:hidden"
          >
            Salir
          </button>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-5 pb-5 lg:block lg:space-y-2 lg:overflow-visible">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-md px-4 py-3 text-sm font-semibold transition ${
                  isActive ? 'bg-teal-600 text-white' : 'text-slate-200 hover:bg-white/10'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto hidden px-5 py-5 lg:block">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-md border border-white/20 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Cerrar sesion
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-5 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
