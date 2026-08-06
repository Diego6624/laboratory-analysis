import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createResult,
  deleteAnalysis,
  deleteResult,
  getAnalysisById,
  updateAnalysisState,
  updateResult,
} from '../../services/labResultsApi.js'

const emptyForm = { parametro: '', valor: '', unidad: '', referencia: '' }

export default function AdminAnalysisDetail() {
  const { id, analisis_id: analysisId } = useParams()
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState(null)
  const [status, setStatus] = useState('loading')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')

  async function load() {
    const data = await getAnalysisById(analysisId, id)
    setAnalysis(data)
    setStatus(data ? 'done' : 'not_found')
  }

  useEffect(() => {
    let active = true
    async function loadAnalysis() {
      try {
        setStatus('loading')
        const data = await getAnalysisById(analysisId, id)
        if (!active) return
        setAnalysis(data)
        setStatus(data ? 'done' : 'not_found')
      } catch {
        if (!active) return
        setAnalysis(null)
        setStatus('error')
      }
    }
    loadAnalysis()
    return () => {
      active = false
    }
  }, [analysisId, id])

  async function submit(event) {
    event.preventDefault()
    if (!analysis?.id) return
    const payload = {
      parametro: form.parametro.trim(),
      valor: form.valor.trim() || null,
      unidad: form.unidad.trim() || null,
      referencia: form.referencia.trim() || null,
    }

    if (editingId) await updateResult(editingId, payload)
    else await createResult(analysis.id, payload)
    setForm(emptyForm)
    setEditingId(null)
    setMessage(editingId ? 'Resultado actualizado.' : 'Resultado agregado.')
    await load()
  }

  async function markCompleted() {
    if (!analysis?.id) return
    await updateAnalysisState(analysis.id, 'completado')
    setMessage('Analisis marcado como completado.')
    await load()
  }

  async function removeAnalysis() {
    if (!analysis?.id) return
    if (!window.confirm('Deseas eliminar este analisis y sus resultados?')) return
    await deleteAnalysis(analysis.id)
    navigate(`/admin/ordenes/${id}`)
  }

  async function removeResult(resultId) {
    if (!window.confirm('Deseas eliminar este resultado?')) return
    await deleteResult(resultId)
    await load()
  }

  if (status === 'loading') return <p className="text-sm text-slate-600">Cargando analisis...</p>

  if (status === 'error') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        No se pudo cargar el analisis. Revisa la sesion o los permisos de Supabase.
      </div>
    )
  }

  if (status === 'not_found' || !analysis) {
    return (
      <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        <p>No se encontro este analisis dentro de la orden actual.</p>
        <Link to={`/admin/ordenes/${id}`} className="font-semibold text-amber-900">
          Volver a la orden
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to={`/admin/ordenes/${id}`} className="text-sm font-semibold text-teal-700">Volver a la orden</Link>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{analysis.tipo}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {analysis.ordenes?.pacientes?.nombre} - DNI {analysis.ordenes?.pacientes?.dni}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={markCompleted} className="h-10 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white">Marcar completado</button>
          <button onClick={removeAnalysis} className="h-10 rounded-md border border-red-200 px-4 text-sm font-semibold text-red-700">Eliminar analisis</button>
        </div>
      </header>

      {message ? <p className="rounded-md bg-slate-950 p-3 text-sm text-white">{message}</p> : null}

      <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-950">{editingId ? 'Editar resultado' : 'Agregar resultado'}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <input value={form.parametro} onChange={(e) => setForm({ ...form, parametro: e.target.value })} placeholder="Parametro" className="h-11 rounded-md border border-slate-300 px-3" required />
          <input value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="Valor" className="h-11 rounded-md border border-slate-300 px-3" />
          <input value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} placeholder="Unidad" className="h-11 rounded-md border border-slate-300 px-3" />
          <input value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} placeholder="Referencia" className="h-11 rounded-md border border-slate-300 px-3" />
        </div>
        <div className="mt-4 flex gap-2">
          <button className="h-11 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white">{editingId ? 'Actualizar' : 'Agregar'}</button>
          {editingId ? (
            <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm) }} className="h-11 rounded-md border border-slate-300 px-5 text-sm font-semibold">Cancelar</button>
          ) : null}
        </div>
      </form>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Parametro</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Valor</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Unidad</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Referencia</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {analysis.resultados.map((result) => (
              <tr key={result.id}>
                <td className="px-4 py-4 text-sm font-semibold">{result.parametro}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{result.valor || 'Pendiente'}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{result.unidad || '-'}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{result.referencia || '-'}</td>
                <td className="px-4 py-4 text-right">
                  <button onClick={() => { setEditingId(result.id); setForm(result) }} className="mr-2 rounded-md border px-3 py-2 text-sm font-semibold">Editar</button>
                  <button onClick={() => removeResult(result.id)} className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
