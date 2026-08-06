import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPatient, deletePatient, getPatientByDni, getPatients, updatePatient } from '../../services/labResultsApi.js'

const emptyForm = { dni: '', nombre: '', telefono: '', fecha_nacimiento: '' }

export default function AdminPatients() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [filter, setFilter] = useState('')
  const [message, setMessage] = useState('')

  const filtered = useMemo(() => {
    const query = filter.toLowerCase().trim()
    if (!query) return patients
    return patients.filter((p) => [p.nombre, p.dni].some((v) => String(v ?? '').toLowerCase().includes(query)))
  }, [filter, patients])

  async function load() {
    setPatients(await getPatients())
  }

  useEffect(() => {
    let active = true

    async function loadPatients() {
      const data = await getPatients()
      if (active) setPatients(data)
    }

    loadPatients()

    return () => {
      active = false
    }
  }, [])

  async function submit(event) {
    event.preventDefault()
    const dni = form.dni.replace(/\D/g, '')
    const existing = await getPatientByDni(dni)
    if (existing && existing.id !== editingId) {
      setMessage('Ya existe un paciente con este DNI.')
      return
    }

    const payload = { ...form, dni, nombre: form.nombre.trim(), telefono: form.telefono.trim() || null }
    if (editingId) await updatePatient(editingId, payload)
    else await createPatient(payload)
    setForm(emptyForm)
    setEditingId(null)
    setMessage(editingId ? 'Paciente actualizado.' : 'Paciente creado.')
    await load()
  }

  async function remove(id) {
    if (!window.confirm('Deseas eliminar este paciente y sus ordenes asociadas?')) return
    await deletePatient(id)
    setPatients((current) => current.filter((p) => p.id !== id))
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Administracion</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Pacientes</h1>
        </div>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar por nombre o DNI" className="h-11 rounded-md border border-slate-300 bg-white px-3 sm:w-80" />
      </header>

      {message ? <p className="rounded-md bg-slate-950 p-3 text-sm text-white">{message}</p> : null}

      <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-950">{editingId ? 'Editar paciente' : 'Nuevo paciente'}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <input value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value.replace(/\D/g, '').slice(0, 12) })} placeholder="DNI" className="h-11 rounded-md border border-slate-300 px-3" required />
          <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="h-11 rounded-md border border-slate-300 px-3" required />
          <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="Telefono" className="h-11 rounded-md border border-slate-300 px-3" />
          <input type="date" value={form.fecha_nacimiento} onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })} className="h-11 rounded-md border border-slate-300 px-3" />
        </div>
        <button className="mt-4 h-11 rounded-md bg-teal-700 px-5 text-sm font-semibold text-white">{editingId ? 'Actualizar' : 'Guardar'}</button>
      </form>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <tbody className="divide-y divide-slate-100">
            {filtered.map((patient) => (
              <tr key={patient.id}>
                <td className="px-4 py-4 text-sm font-semibold">{patient.nombre}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{patient.dni}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{patient.telefono || '-'}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{patient.fecha_nacimiento || '-'}</td>
                <td className="px-4 py-4 text-right">
                  <button onClick={() => navigate(`/admin/ordenes?paciente_id=${patient.id}`)} className="mr-2 rounded-md border px-3 py-2 text-sm font-semibold">Nueva orden</button>
                  <button onClick={() => { setEditingId(patient.id); setForm(patient) }} className="mr-2 rounded-md border px-3 py-2 text-sm font-semibold">Editar</button>
                  <button onClick={() => remove(patient.id)} className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
