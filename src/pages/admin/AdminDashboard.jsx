import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardData } from '../../services/labResultsApi.js'

function Badge({ estado }) {
  const colors = {
    pendiente: 'bg-amber-50 text-amber-700',
    en_proceso: 'bg-blue-50 text-blue-700',
    publicado: 'bg-teal-50 text-teal-700',
  }
  return <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${colors[estado]}`}>{estado}</span>
}

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    async function load() {
      try {
        setData(await getDashboardData())
        setStatus('done')
      } catch {
        setStatus('error')
      }
    }
    load()
  }, [])

  if (status === 'loading') return <p className="text-sm text-slate-600">Cargando dashboard...</p>
  if (status === 'error') return <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">No se pudo cargar el dashboard.</p>

  const cards = [
    ['Pacientes', data.patientsCount],
    ['Pendientes', data.pendingOrders],
    ['En proceso', data.inProcessOrders],
    ['Publicadas', data.publishedOrders],
  ]

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Panel</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Dashboard</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        {cards.map(([label, value]) => (
          <article key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-bold text-slate-950">Ordenes recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <tbody className="divide-y divide-slate-100">
              {data.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-900">{order.pacientes?.nombre}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{order.pacientes?.dni}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{new Date(order.fecha).toLocaleDateString()}</td>
                  <td className="px-5 py-4 text-sm"><Badge estado={order.estado} /></td>
                  <td className="px-5 py-4 text-right">
                    <Link to={`/admin/ordenes/${order.id}`} className="text-sm font-semibold text-teal-700 hover:text-teal-800">
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
