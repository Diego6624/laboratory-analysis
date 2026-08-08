import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createAnalysis, deleteOrder, getOrderById, updateOrderState } from '../../services/labResultsApi.js'
import { downloadOrderPdf } from '../../utils/pdfGenerator.js'
import { formatPeruDate, formatPeruDateTime } from '../../utils/dateFormat.js'
import { ANALYSIS_TYPES, BACILOSCOPY_TYPE } from '../../config/labOptions.js'

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  )
}

function canMoveTo(order, nextState) {
  if (order.estado === 'publicado' && nextState !== 'publicado') return false
  if (nextState === 'publicado') {
    if (order.analisis.length === 0) return false
    const todosCompletados = order.analisis.every((item) => item.estado === 'completado')
    const todosConResultados = order.analisis.every((item) => (item.resultados?.length || 0) > 0)
    return todosCompletados && todosConResultados
  }
  return true
}

export default function AdminOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [newAnalysis, setNewAnalysis] = useState({
    tipo: ANALYSIS_TYPES[0],
    observaciones: '',
    aspecto_macroscopico: '',
  })
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
    if (!newAnalysis.tipo) return
    await createAnalysis(order.id, {
      tipo: newAnalysis.tipo,
      observaciones: newAnalysis.observaciones.trim() || null,
      aspecto_macroscopico:
        newAnalysis.tipo === BACILOSCOPY_TYPE ? newAnalysis.aspecto_macroscopico.trim() || null : null,
    })
    setNewAnalysis({ tipo: ANALYSIS_TYPES[0], observaciones: '', aspecto_macroscopico: '' })
    await load()
  }

  async function changeState(nextState) {
    if (!canMoveTo(order, nextState)) {
      if (order.estado === 'publicado') {
        setMessage('Una orden publicada no puede volver a un estado anterior.')
        return
      }
      if (nextState === 'publicado') {
        const sinCompletar = order.analisis.filter((a) => a.estado !== 'completado')
        const sinResultados = order.analisis.filter((a) => (a.resultados?.length || 0) === 0)
        if (sinResultados.length > 0) {
          setMessage(`Los siguientes análisis no tienen resultados: ${sinResultados.map((a) => a.tipo).join(', ')}. Agréguele al menos un resultado o elimínelo(s).`)
          return
        }
        if (sinCompletar.length > 0) {
          setMessage(`Los siguientes análisis aún están pendientes: ${sinCompletar.map((a) => a.tipo).join(', ')}. Márcalos como completados antes de publicar.`)
          return
        }
      }
      setMessage('No se puede realizar ese cambio de estado.')
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
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#F26522]">Detalle de orden</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{order.pacientes?.nombre}</h1>
          <p className="mt-1 text-sm text-slate-600">DNI {order.pacientes?.dni} - Orden {formatPeruDate(order.fecha)}</p>
          <p className="mt-1 text-sm text-slate-600">Emitido: {formatPeruDateTime(order.created_at)}</p>
          <p className="mt-1 text-sm text-slate-600">HC N° {order.hc_numero || '-'} - N° orden {order.numero_orden || '-'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {order.estado === 'publicado' ? (
            <button onClick={() => downloadOrderPdf(order)} className="h-10 rounded-md border hover:bg-slate-50 px-4 text-sm font-semibold cursor-pointer" style={{ borderColor: '#35318240', color: '#353182' }}>Generar PDF</button>
          ) : null}
          <button onClick={removeOrder} className="h-10 rounded-md border border-red-200 px-4 text-sm font-semibold text-red-700 hover:bg-red-50 cursor-pointer">Eliminar orden</button>
        </div>
      </header>

      {message ? <p className="rounded-md bg-slate-950 p-3 text-sm text-white">{message}</p> : null}

      {order.observaciones ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Observaciones generales</p>
          <p className="mt-2 text-sm text-amber-900">{order.observaciones}</p>
        </section>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-950">Estado de orden</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {['pendiente', 'en_proceso', 'publicado'].map((state) => (
            <button key={state} onClick={() => changeState(state)} className={`cursor-pointer uppercase rounded-md px-4 py-2 text-sm font-semibold ${order.estado === state ? 'bg-[#353182] text-white' : 'border border-slate-300 text-slate-700'}`}>
              {state}
            </button>
          ))}
        </div>
      </section>

      <form onSubmit={addAnalysis} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-950">Agregar analisis</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Tipo de análisis">
            <select value={newAnalysis.tipo} onChange={(e) => setNewAnalysis({ ...newAnalysis, tipo: e.target.value })} className="h-11 w-full rounded-md border border-slate-300 px-3">
              {ANALYSIS_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </Field>
          {newAnalysis.tipo === BACILOSCOPY_TYPE ? (
            <Field label="Aspecto macroscópico">
              <input value={newAnalysis.aspecto_macroscopico} onChange={(e) => setNewAnalysis({ ...newAnalysis, aspecto_macroscopico: e.target.value })} placeholder="Aspecto macroscópico" className="h-11 w-full rounded-md border border-slate-300 px-3" />
            </Field>
          ) : null}
          <Field label="Observaciones del análisis" className="md:col-span-2">
            <textarea value={newAnalysis.observaciones} onChange={(e) => setNewAnalysis({ ...newAnalysis, observaciones: e.target.value })} placeholder="Observaciones del analisis" className="w-full rounded-md border border-slate-300 px-3 py-3" rows={3} />
          </Field>
          <button className="h-11 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white cursor-pointer">Agregar</button>
        </div>
      </form>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-bold text-slate-950">Analisis asignados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Tipo</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Resultados</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Estado</th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.analisis.map((analysis) => (
                <tr key={analysis.id}>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-950">
                    <Link to={`/admin/ordenes/${order.id}/analisis/${analysis.id}`} className="hover:text-teal-700">
                      {analysis.tipo}
                    </Link>
                    {analysis.observaciones ? <p className="mt-1 text-sm font-normal text-slate-600">Obs: {analysis.observaciones}</p> : null}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{analysis.resultados?.length || 0}</td>
                  <td className="px-5 py-4 text-sm">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${analysis.estado === 'completado'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                      }`}>
                      {analysis.estado}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link to={`/admin/ordenes/${order.id}/analisis/${analysis.id}`} className="text-sm font-semibold text-teal-700 hover:text-teal-800">
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
