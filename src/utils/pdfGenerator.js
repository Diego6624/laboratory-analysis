import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import { formatPeruDate, formatPeruDateTime } from './dateFormat.js'

const brand = {
  primary: '#05b1ae',
  gray: '#b3b3b3',
  black: '#373737',
  white: '#ffffff',
}

const logoPath = '/Clinica_Tataje_Logo_A.png'
const address = 'URB.Santa Rosa del Palmar - Mzn G Lte 26 Calle los zafiros'

async function imageToDataUrl(src) {
  const response = await fetch(src)
  const blob = await response.blob()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function drawHeader(doc) {
  let logoDataUrl

  try {
    logoDataUrl = await imageToDataUrl(logoPath)
  } catch {
    logoDataUrl = null
  }

  doc.setFillColor(brand.white)
  doc.rect(0, 0, 210, 48, 'F')
  doc.setFillColor(brand.primary)
  doc.rect(0, 0, 210, 6, 'F')

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', 14, 11, 34, 24)
  }

  doc.setTextColor(brand.primary)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('LABORATORIO CLINICO - POLICLINICO PALOMINO', 54, 17)
  doc.setTextColor(brand.black)
  doc.setFontSize(11)
  doc.text('RESULTADO DE ANALISIS CLINICOS', 54, 26)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(address, 54, 34, { maxWidth: 132 })

  doc.setDrawColor(brand.gray)
  doc.setLineWidth(0.3)
  doc.line(14, 44, 196, 44)
}

function drawField(doc, label, value, x, y, width = 70) {
  doc.setTextColor(brand.black)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(label.toUpperCase(), x, y)
  doc.setTextColor(brand.primary)
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
  doc.setTextColor(brand.primary)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(analysis.tipo || 'Analisis sin nombre', 14, y)
  y += 7

  doc.setFillColor(brand.primary)
  doc.setDrawColor(brand.primary)
  doc.roundedRect(14, y, 182, 10, 2, 2, 'FD')
  doc.setTextColor(brand.white)
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
    doc.setDrawColor(brand.gray)
    doc.line(14, y, 196, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(brand.black)
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
      dark: brand.primary,
      light: brand.white,
    },
  })

  await drawHeader(doc)

  doc.setFillColor(brand.white)
  doc.setDrawColor(brand.gray)
  doc.roundedRect(14, 56, 182, 45, 3, 3, 'S')
  drawField(doc, 'Paciente', paciente.nombre, 22, 63, 88)
  drawField(doc, 'DNI', paciente.dni, 120, 63, 38)
  drawField(doc, 'Fecha de orden', formatPeruDate(orden.fecha), 22, 77, 70)
  drawField(doc, 'Emitido', formatPeruDateTime(orden.created_at), 120, 77, 66)

  doc.setTextColor(brand.black)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('CODIGO DE VALIDACION', 22, 92)
  doc.setTextColor(brand.primary)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(String(orden.id || 'No registrado'), 72, 92, { maxWidth: 112 })

  let y = 116
  const analyses = orden.analisis?.length ? orden.analisis : []
  if (!analyses.length) {
    doc.setTextColor(brand.black)
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
  doc.setDrawColor(brand.gray)
  doc.roundedRect(14, y, 182, 46, 3, 3, 'S')
  doc.addImage(qrDataUrl, 'PNG', 22, y + 8, 28, 28)
  doc.setTextColor(brand.primary)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Documento generado automaticamente', 58, y + 14)
  doc.setTextColor(brand.black)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Codigo de validacion: ${orden.id}`, 58, y + 24, { maxWidth: 126 })
  doc.text(validationUrl, 58, y + 34, { maxWidth: 126 })

  doc.setFillColor(brand.primary)
  doc.rect(0, 282, 210, 15, 'F')
  doc.setTextColor(brand.white)
  doc.setFontSize(8)
  doc.text(`${address} - Verifique la autenticidad escaneando el codigo QR.`, 16, 291)

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
