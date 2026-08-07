import { useEffect, useState } from 'react'
import { createOrderPdfBlobUrl, downloadOrderPdf } from '../utils/pdfGenerator.js'
import { getLatestPublishedOrderByDni } from '../services/labResultsApi.js'
import { formatPeruDate, formatPeruDateTime } from '../utils/dateFormat.js'
import { FileText, MonitorSmartphone, ClipboardList } from 'lucide-react'


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
    <section className="mt-10 w-full">
      {/* Card info paciente */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(to right, #F26522, #F472B6)' }} />
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full shrink-0" style={{ background: 'linear-gradient(135deg, #F26522, #F472B6)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Última orden publicada</p>
              <h2 className="text-xl font-bold text-slate-900">{orden.pacientes?.nombre}</h2>
              <p className="text-sm text-slate-500">DNI {orden.pacientes?.dni} · {formatPeruDateTime(orden.created_at)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => downloadOrderPdf(orden)}
            className="cursor-pointer inline-flex h-11 items-center gap-2 justify-center rounded-xl px-6 text-sm font-semibold text-white shadow-sm transition"
            style={{ background: 'linear-gradient(to right, #F26522, #F472B6)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Descargar PDF
          </button>
        </div>
      </div>

      {/* Análisis */}
      <div className="mt-6 space-y-4">
        {orden.analisis.map((analysis) => (
          <div key={analysis.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full" style={{ background: 'linear-gradient(to right, #F26522, #F472B6)' }} />
                <h3 className="font-bold text-slate-900">{analysis.tipo}</h3>
              </div>
              <span className="rounded-full px-3 py-1 text-xs font-bold uppercase" style={{ background: 'linear-gradient(to right, #F26522, #F472B6)', color: 'white' }}>
                {analysis.estado}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Parámetro</th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Resultado</th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Referencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(analysis.resultados?.length ? analysis.resultados : [{ id: 'empty' }]).map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-sm font-semibold text-slate-900">{row.parametro || 'Resultado'}</td>
                      <td className="px-5 py-3 text-sm font-medium" style={{ color: row.valor ? '#F26522' : '#94a3b8' }}>{row.valor || 'Pendiente'}</td>
                      <td className="px-5 py-3 text-sm text-slate-400">{row.referencia || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Vista previa PDF */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-yellow-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
          <span className="ml-2 text-xs text-slate-400 font-medium">Vista previa del documento</span>
        </div>
        <div className="h-[560px] bg-slate-100">
          {pdfUrl ? (
            <iframe title="Vista previa del PDF" src={pdfUrl} className="h-full w-full" />
          ) : (
            <div className="grid h-full place-items-center text-sm text-slate-400">Generando vista previa...</div>
          )}
        </div>
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
      setMessage('Ingresa un DNI válido para realizar la búsqueda.')
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
      if (!latestOrder) setMessage('No encontramos órdenes publicadas para el DNI ingresado.')
    } catch {
      setStatus('error')
      setOrden(null)
      setMessage('No se pudo consultar la información. Inténtalo nuevamente.')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* Hero */}
      <section className="relative overflow-hidden bg-white border-b border-slate-100">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #F26522 0%, transparent 50%), radial-gradient(circle at 80% 50%, #F472B6 0%, transparent 50%)' }} />
        <div className="relative mx-auto max-w-5xl px-5 py-16 sm:py-24">
          <div className="flex flex-col items-center text-center">

            {/* Logo */}
            <div className="mb-8 flex items-center gap-3">
              <img src="/logo.png" alt="Policlínico Palomino" className="h-14 w-auto" />
              <div className="text-left">
                <p className="text-md font-semibold uppercase tracking-widest text-slate-400">Laboratorio Clínico</p>
                <p className="text-xl font-bold text-slate-900 tracking-widest uppercase">Policlínico Palomino</p>
              </div>
            </div>

            <h1 className="text-4xl font-bold text-slate-950 sm:text-5xl leading-tight">
              Consulta tus resultados
              <br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #F26522, #F472B6)' }}>
                de laboratorio
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-slate-500">
              Ingresa tu número de DNI para ver y descargar tu última orden publicada con todos tus análisis y resultados.
            </p>

            {/* Buscador */}
            <form onSubmit={handleSubmit} className="mt-10 flex w-full max-w-lg flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
                </svg>
                <input
                  type="text"
                  inputMode="numeric"
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="Número de DNI"
                  className="h-13 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-base shadow-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  style={{ height: '52px' }}
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="cursor-pointer h-13 rounded-xl px-7 text-sm font-bold text-white shadow-sm transition disabled:opacity-50"
                style={{ background: 'linear-gradient(to right, #F26522, #F472B6)', height: '52px' }}
              >
                {status === 'loading' ? 'Buscando...' : 'Buscar'}
              </button>
            </form>

            {message ? (
              <p className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600">{message}</p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Features si no hay orden */}
      {!orden && status === 'idle' && (
        <section className="mx-auto max-w-5xl px-5 py-16">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: <FileText className="h-5 w-5" style={{ color: '#F26522' }} />,
                title: 'Resultados digitales',
                desc: 'Accede a tus análisis clínicos desde cualquier dispositivo.',
              },
              {
                icon: <MonitorSmartphone className="h-5 w-5" style={{ color: '#F26522' }} />,
                title: 'Descarga tu PDF',
                desc: 'Genera y descarga tu documento oficial con firma y sello.',
              },
              {
                icon: <ClipboardList className="h-5 w-5" style={{ color: '#F26522' }} />,
                title: 'Historial de análisis',
                desc: 'Consulta todos los parámetros de tu última orden con sus valores de referencia.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #F2652215, #F472B615)' }}>
                  {item.icon}
                </div>
                <h3 className="font-bold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Resultados */}
      {orden ? (
        <div className="mx-auto max-w-5xl px-5 py-10">
          <OrderPreview orden={orden} />
        </div>
      ) : null}

    </main>
  )
}