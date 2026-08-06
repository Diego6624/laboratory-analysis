import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createAnalysis, deleteOrder, getOrderById, updateOrderState } from '../../services/labResultsApi.js'
import { downloadOrderPdf } from '../../utils/pdfGenerator.js'

function canMoveTo(order, nextState) {
  if (order.estado === 'publicado' && nextState !== 'publicado') return false
  if (nextState === 'publicado') return order.analisis.length > 0 && order.analisis.every((item) => item.estado === 'completado')
  return true
}

export default function AdminOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [newAnalysis, setNewAnalysis] = useState('')
  const [message, setMessage] = useState('')

  async function load() {
    setOrder(await getOrderById(id))
  }

  useEffect(() => {
    let active = true
    async function loadOrder() {
      const data = await getOrderById(id)
      if (active) setOrder(data)
    }
    loadOrder()
    return () => {
      active = false
    }
  }, [id])

  async function addAnalysis(event) {
    event.preventDefault()
    if (!newAnalysis.trim()) return
    await createAnalysis(order.id, newAnalysis.trim())
    setNewAnalysis('')
    await load()
  }

  async function changeState(nextState) {
    if (!canMoveTo(order, nextState)) {
      setMessage('Solo se puede publicar si todos los analisis estan completados; una orden publicada no vuelve a pendiente.')
      return
    }
    await updateOrderState(order.id, nextState)
    setMessage('Estado actualizado.')
    await load()
  }

  async function removeOrder() {
    if (!window.confirm('Deseas eliminar esta orden?')) return
    await deleteOrder(order.id)
    navigate('/admin/ordenes')
  }

  if (!order) return <p className="text-sm text-slate-600">Cargando orden...</p>

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Detalle de orden</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{order.pacientes?.nombre}</h1>
          <p className="mt-1 text-sm text-slate-600">DNI {order.pacientes?.dni} - {new Date(order.fecha).toLocaleDateString()}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {order.estado === 'publicado' ? (
            <button onClick={() => downloadOrderPdf(order)} className="h-10 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white">Generar PDF</button>
          ) : null}
          <button onClick={removeOrder} className="h-10 rounded-md border border-red-200 px-4 text-sm font-semibold text-red-700">Eliminar orden</button>
        </div>
      </header>

      {message ? <p className="rounded-md bg-slate-950 p-3 text-sm text-white">{message}</p> : null}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-950">Estado de orden</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {['pendiente', 'en_proceso', 'publicado'].map((state) => (
            <button key={state} onClick={() => changeState(state)} className={`rounded-md px-4 py-2 text-sm font-semibold ${order.estado === state ? 'bg-teal-700 text-white' : 'border border-slate-300 text-slate-700'}`}>
              {state}
            </button>
          ))}
        </div>
      </section>

      <form onSubmit={addAnalysis} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-950">Agregar analisis</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input value={newAnalysis} onChange={(e) => setNewAnalysis(e.target.value)} placeholder="Ej: Hemograma completo" className="h-11 flex-1 rounded-md border border-slate-300 px-3" />
          <button className="h-11 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white">Agregar</button>
        </div>
      </form>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-bold text-slate-950">Analisis asignados</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {order.analisis.map((analysis) => (
            <Link key={analysis.id} to={`/admin/ordenes/${order.id}/analisis/${analysis.id}`} className="block px-5 py-4 hover:bg-slate-50">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-950">{analysis.tipo}</p>
                  <p className="text-sm text-slate-600">{analysis.resultados?.length || 0} resultados</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">{analysis.estado}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
