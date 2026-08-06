import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { createOrder, getOrders, getPatients } from '../../services/labResultsApi.js'

const states = ['todos', 'pendiente', 'en_proceso', 'publicado']

function Badge({ estado }) {
  const colors = {
    pendiente: 'bg-amber-50 text-amber-700',
    en_proceso: 'bg-blue-50 text-blue-700',
    publicado: 'bg-teal-50 text-teal-700',
  }
  return <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${colors[estado]}`}>{estado}</span>
}

export default function AdminOrders() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [patients, setPatients] = useState([])
  const [statusFilter, setStatusFilter] = useState('todos')
  const [patientId, setPatientId] = useState(searchParams.get('paciente_id') || '')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [message, setMessage] = useState('')

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === patientId),
    [patientId, patients],
  )

  useEffect(() => {
    let active = true
    async function load() {
      const [ordersData, patientsData] = await Promise.all([getOrders(statusFilter), getPatients()])
      if (!active) return
      setOrders(ordersData)
      setPatients(patientsData)
    }
    load()
    return () => {
      active = false
    }
  }, [statusFilter])

  async function submit(event) {
    event.preventDefault()
    if (!patientId) {
      setMessage('Selecciona un paciente para crear la orden.')
      return
    }

    const order = await createOrder({ paciente_id: patientId, fecha: date, estado: 'pendiente' })
    navigate(`/admin/ordenes/${order.id}`)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Laboratorio</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Ordenes</h1>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="uppercase h-11 rounded-md border border-slate-300 bg-white px-3 sm:w-56">
          {states.map((state) => <option key={state} value={state}>{state}</option>)}
        </select>
      </header>

      {message ? <p className="rounded-md bg-slate-950 p-3 text-sm text-white">{message}</p> : null}

      <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-950">Crear orden</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px_auto]">
          <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="h-11 rounded-md border border-slate-300 px-3" required>
            <option value="">Seleccionar paciente</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.nombre} - DNI {patient.dni}
              </option>
            ))}
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-md border border-slate-300 px-3" required />
          <button className="h-11 rounded-md bg-teal-700 px-5 text-sm font-semibold text-white">Crear orden</button>
        </div>
        {selectedPatient ? <p className="mt-3 text-sm text-slate-600">Paciente seleccionado: {selectedPatient.nombre}</p> : null}
      </form>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-900">{order.pacientes?.nombre}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{new Date(order.fecha).toLocaleDateString()}</td>
                  <td className="px-4 py-4 text-sm"><Badge estado={order.estado} /></td>
                  <td className="px-4 py-4 text-sm text-slate-600">{order.analisis.length} analisis</td>
                  <td className="px-4 py-4 text-right">
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
