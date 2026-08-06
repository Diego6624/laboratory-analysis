import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { loginAdmin } from '../../services/labResultsApi.js'

export default function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      setStatus('loading')
      setError('')
      await loginAdmin(form.email, form.password)
      navigate(location.state?.from?.pathname || '/admin/resultados', { replace: true })
    } catch {
      setStatus('error')
      setError('Credenciales incorrectas o acceso no disponible.')
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-5 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
          Policlínico Palomino
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">Acceso intranet</h1>
        <p className="mt-2 text-sm text-slate-600">Gestion de resultados de laboratorio.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Correo</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
              placeholder='correo@gmail.com'
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Contraseña</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
              placeholder='********'
            />
          </label>

          {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="h-11 w-full rounded-md bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
          >
            {status === 'loading' ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </section>
    </main>
  )
}
