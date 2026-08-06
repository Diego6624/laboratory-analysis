import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

const brand = {
  navy: '#16324f',
  teal: '#0f766e',
  ink: '#1f2937',
  muted: '#64748b',
  line: '#d7dee8',
  soft: '#eef7f6',
}

function formatDate(date) {
  if (!date) return 'Sin fecha registrada'
  return new Date(date).toLocaleDateString()
}

function drawHeader(doc) {
  doc.setFillColor(brand.navy)
  doc.rect(0, 0, 210, 38, 'F')
  doc.setTextColor('#ffffff')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('LABORATORIO CLINICO - POLICLINICO PALOMINO', 14, 15)
  doc.setFontSize(11)
  doc.text('RESULTADO DE ANALISIS CLINICOS', 14, 26)
}

function drawField(doc, label, value, x, y, width = 70) {
  doc.setTextColor(brand.muted)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(label.toUpperCase(), x, y)
  doc.setTextColor(brand.ink)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(String(value || 'No registrado'), x, y + 7, { maxWidth: width })
}

function ensurePageSpace(doc, y, needed = 24) {
  if (y + needed <= 266) return y
  doc.addPage()
  return 22
}

function drawResultTable(doc, analysis, y) {
  y = ensurePageSpace(doc, y, 28)
  doc.setTextColor(brand.navy)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(analysis.tipo || 'Analisis sin nombre', 14, y)
  y += 7

  doc.setFillColor('#f8fafc')
  doc.setDrawColor(brand.line)
  doc.roundedRect(14, y, 182, 10, 2, 2, 'FD')
  doc.setTextColor(brand.muted)
  doc.setFontSize(8)
  doc.text('PARAMETRO', 18, y + 7)
  doc.text('RESULTADO', 72, y + 7)
  doc.text('UNIDAD', 118, y + 7)
  doc.text('REFERENCIA', 146, y + 7)
  y += 10

  const rows = analysis.resultados?.length ? analysis.resultados : [{ valor: null }]

  rows.forEach((row) => {
    const parameterLines = doc.splitTextToSize(row.parametro || 'Resultado', 46)
    const valueLines = doc.splitTextToSize(row.valor || 'Pendiente', 38)
    const unitLines = doc.splitTextToSize(row.unidad || '-', 20)
    const referenceLines = doc.splitTextToSize(row.referencia || '-', 42)
    const rowHeight = Math.max(
      12,
      Math.max(parameterLines.length, valueLines.length, unitLines.length, referenceLines.length) * 5 + 5,
    )

    y = ensurePageSpace(doc, y, rowHeight)
    doc.setDrawColor(brand.line)
    doc.line(14, y, 196, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(brand.ink)
    doc.setFontSize(9)
    doc.text(parameterLines, 18, y + 7)
    doc.text(valueLines, 72, y + 7)
    doc.text(unitLines, 118, y + 7)
    doc.text(referenceLines, 146, y + 7)
    y += rowHeight
  })

  doc.line(14, y, 196, y)
  return y + 12
}

export async function generarPDF(orden) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const paciente = orden.pacientes || {}
  const validationUrl = `${window.location.origin}/validar?id=${orden.id}`
  const qrDataUrl = await QRCode.toDataURL(validationUrl, {
    margin: 1,
    width: 180,
    color: {
      dark: brand.navy,
      light: '#ffffff',
    },
  })

  drawHeader(doc)

  doc.setFillColor(brand.soft)
  doc.roundedRect(14, 48, 182, 34, 3, 3, 'F')
  drawField(doc, 'Paciente', paciente.nombre, 22, 59, 88)
  drawField(doc, 'DNI', paciente.dni, 120, 59, 38)
  drawField(doc, 'Fecha', formatDate(orden.fecha), 22, 74, 70)
  drawField(doc, 'Codigo de validacion', orden.id, 120, 74, 66)

  let y = 98
  const analyses = orden.analisis?.length ? orden.analisis : []
  if (!analyses.length) {
    doc.setTextColor(brand.muted)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Esta orden no tiene analisis registrados.', 14, y)
    y += 14
  } else {
    analyses.forEach((analysis) => {
      y = drawResultTable(doc, analysis, y)
    })
  }

  y = ensurePageSpace(doc, y, 50)
  doc.roundedRect(14, y, 182, 46, 3, 3, 'S')
  doc.addImage(qrDataUrl, 'PNG', 22, y + 8, 28, 28)
  doc.setTextColor(brand.navy)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Documento generado automaticamente', 58, y + 14)
  doc.setTextColor(brand.muted)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Codigo de validacion: ${orden.id}`, 58, y + 24, { maxWidth: 126 })
  doc.text(validationUrl, 58, y + 34, { maxWidth: 126 })

  doc.setFillColor(brand.navy)
  doc.rect(0, 282, 210, 15, 'F')
  doc.setTextColor('#ffffff')
  doc.setFontSize(8)
  doc.text('Policlinico Palomino - Verifique la autenticidad escaneando el codigo QR.', 16, 291)

  return doc
}

export async function createOrderPdfBlobUrl(orden) {
  const doc = await generarPDF(orden)
  return URL.createObjectURL(doc.output('blob'))
}

export async function downloadOrderPdf(orden) {
  const doc = await generarPDF(orden)
  const dni = orden.pacientes?.dni || 'sin_dni'
  doc.save(`resultado_${dni}.pdf`)
}
