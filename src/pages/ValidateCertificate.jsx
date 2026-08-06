import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getOrderById } from '../services/labResultsApi.js'

function formatDate(date) {
  if (!date) return 'Sin fecha'
  return new Date(date).toLocaleDateString()
}

export default function ValidateCertificate() {
  const { id: pathId } = useParams()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('id') || pathId
  const [orden, setOrden] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setStatus('done')
        return
      }

      try {
        setOrden(await getOrderById(orderId))
        setStatus('done')
      } catch {
        setStatus('error')
      }
    }

    loadOrder()
  }, [orderId])

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-10">
      <section className="w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
          Policlínico Palomino
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">Validacion de certificado</h1>

        {status === 'loading' ? <p className="mt-6 text-slate-600">Validando certificado...</p> : null}
        {status === 'error' ? (
          <p className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
            No se pudo validar el certificado en este momento.
          </p>
        ) : null}
        {status === 'done' && !orden ? (
          <p className="mt-6 rounded-md bg-amber-50 p-4 text-sm text-amber-800">
            El certificado no existe o el codigo de validacion no fue enviado.
          </p>
        ) : null}

        {orden ? (
          <div className="mt-6 space-y-5">
            <div className="rounded-md bg-teal-50 p-4 text-sm font-semibold text-teal-800">
              Certificado valido. La informacion pertenece solo a esta orden.
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-bold uppercase text-slate-500">Paciente</dt>
                <dd className="mt-1 text-slate-900">{orden.pacientes?.nombre}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-slate-500">DNI</dt>
                <dd className="mt-1 text-slate-900">{orden.pacientes?.dni}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-slate-500">Fecha de orden</dt>
                <dd className="mt-1 text-slate-900">{formatDate(orden.fecha)}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-slate-500">Codigo</dt>
                <dd className="mt-1 break-all text-slate-900">{orden.id}</dd>
              </div>
            </dl>

            <div className="space-y-4">
              {orden.analisis.map((analysis) => (
                <article key={analysis.id} className="rounded-md border border-slate-200">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <h2 className="font-bold text-slate-950">{analysis.tipo}</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Parametro</th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Resultado</th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Unidad</th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Referencia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(analysis.resultados?.length ? analysis.resultados : [{ id: 'empty' }]).map((row) => (
                          <tr key={row.id}>
                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                              {row.parametro || 'Resultado'}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">{row.valor || 'Pendiente'}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{row.unidad || '-'}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{row.referencia || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        <Link
          to="/"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Volver a consulta
        </Link>
      </section>
    </main>
  )
}
