import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, ClipboardList, LogOut } from 'lucide-react'
import { logoutAdmin } from '../../services/labResultsApi.js'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/pacientes', label: 'Pacientes', icon: Users },
  { to: '/admin/ordenes', label: 'Órdenes', icon: ClipboardList },
]

export default function AdminLayout() {
  const navigate = useNavigate()

  function handleLogout() {
    logoutAdmin()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen text-slate-900 lg:flex" style={{ background: '#F4F6FB' }}>

      {/* SIDEBAR */}
      <aside
        className="border-b lg:border-b-0 lg:min-h-screen lg:w-64 lg:flex lg:flex-col"
        style={{ background: '#353182', borderColor: '#2a276a' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between gap-4 px-5 py-5 lg:flex-col lg:items-start lg:gap-0 lg:px-6 lg:pt-8 lg:pb-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
              style={{ background: 'linear-gradient(135deg, #F26522, #f59042)' }}
            >
              <img src="/logoBlanco.png" alt="Logo" className="h-6 w-6 object-contain" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#a8a8d4' }}>
                Intranet
              </p>
              <h1 className="text-sm font-bold text-white leading-tight">
                Policlínico Palomino
              </h1>
            </div>
          </div>

          {/* Botón salir móvil */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition lg:hidden"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#c4c4e0' }}
          >
            <LogOut size={14} />
            Salir
          </button>
        </div>

        {/* Separador */}
        <div className="mx-5 lg:mx-6" style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />

        {/* Nav */}
        <nav className="flex gap-1 overflow-x-auto px-4 py-3 lg:flex-col lg:overflow-visible lg:px-4 lg:py-4 lg:gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition whitespace-nowrap ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'hover:bg-white/10'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { background: 'linear-gradient(135deg, #F26522, #f59042)', color: 'white' }
                  : { color: '#b0b0d8' }
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Botón cerrar sesión desktop */}
        <div className="mt-auto hidden px-4 py-6 lg:block">
          <div className="mb-4 mx-1" style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          <button
            type="button"
            onClick={handleLogout}
            className="cursor-pointer flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition"
            style={{ color: '#b0b0d8' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="min-w-0 flex-1 p-5 lg:p-8">
        {/* Topbar decorativo */}
        <div
          className="mb-6 h-1 w-16 rounded-full"
          style={{ background: 'linear-gradient(to right, #353182, #F26522)' }}
        />
        <Outlet />
      </main>
    </div>
  )
}