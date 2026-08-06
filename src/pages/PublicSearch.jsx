import { useEffect, useState } from 'react'
import { createOrderPdfBlobUrl, downloadOrderPdf } from '../utils/pdfGenerator.js'
import { getLatestPublishedOrderByDni } from '../services/labResultsApi.js'
import { formatPeruDate, formatPeruDateTime } from '../utils/dateFormat.js'

function OrderPreview({ orden }) {
  const [pdfUrl, setPdfUrl] = useState('')

  useEffect(() => {
    let active = true
    let currentUrl = ''

    async function buildPreview() {
      const url = await createOrderPdfBlobUrl(orden)
      currentUrl = url
      if (active) setPdfUrl(url)
    }

    buildPreview()

    return () => {
      active = false
      if (currentUrl) URL.revokeObjectURL(currentUrl)
    }
  }, [orden])

  return (
    <section className="mt-8 w-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-teal-700">Ultima orden publicada</p>
          <h2 className="text-xl font-bold text-slate-900">{orden.pacientes?.nombre}</h2>
          <p className="text-sm text-slate-600 font-semibold">
            DNI {orden.pacientes?.dni} · Orden {formatPeruDate(orden.fecha)}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Emitido: {formatPeruDateTime(orden.created_at)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => downloadOrderPdf(orden)}
          className="inline-flex h-11 items-center justify-center rounded-md bg-teal-700 px-5 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          Descargar PDF
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {orden.analisis.map((analysis) => (
          <article key={analysis.id} className="rounded-md border border-slate-200">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h3 className="font-bold text-slate-950">{analysis.tipo}</h3>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold uppercase text-teal-700">
                {analysis.estado}
              </span>
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
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.parametro || 'Resultado'}</td>
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

      <div className="mt-4 h-[520px] overflow-hidden rounded-md border border-slate-200 bg-slate-100">
        {pdfUrl ? (
          <iframe title="Vista previa del PDF" src={pdfUrl} className="h-full w-full" />
        ) : (
          <div className="grid h-full place-items-center text-sm text-slate-500">Generando PDF...</div>
        )}
      </div>
    </section>
  )
}

export default function PublicSearch() {
  const [dni, setDni] = useState('')
  const [orden, setOrden] = useState(null)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const cleanDni = dni.replace(/\D/g, '')

    if (cleanDni.length < 8) {
      setMessage('Ingresa un DNI valido para realizar la busqueda.')
      setStatus('idle')
      setOrden(null)
      return
    }

    try {
      setStatus('loading')
      setMessage('')
      const latestOrder = await getLatestPublishedOrderByDni(cleanDni)
      setOrden(latestOrder)
      setStatus('done')
      if (!latestOrder) setMessage('No encontramos ordenes publicadas para el DNI ingresado.')
    } catch {
      setStatus('error')
      setOrden(null)
      setMessage('No se pudo consultar la informacion. Intentalo nuevamente.')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-5 py-12">
        <div className="w-full max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
            Policlínico Palomino
          </p>
          <h1 className="mt-4 text-4xl font-bold text-slate-950 sm:text-5xl">
            Consulta tus analisis de laboratorio
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            Busca por DNI y descarga la ultima orden publicada con sus analisis y resultados.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              inputMode="numeric"
              value={dni}
              onChange={(event) => setDni(event.target.value.replace(/\D/g, '').slice(0, 12))}
              placeholder="Numero de DNI"
              className="h-12 flex-1 rounded-md border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="h-12 rounded-md bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {status === 'loading' ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}
        </div>

        {orden ? <OrderPreview orden={orden} /> : null}
      </section>
    </main>
  )
}
