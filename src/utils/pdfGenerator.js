import { jsPDF } from 'jspdf'
import { formatPeruDate } from './dateFormat.js'

const colors = {
  accent: '#05b1ae',
  blue: '#353182',
  dataFill: '#F1F0F8',
  resultFill: '#FFF7F1',
  referenceFill: '#EDF4FC',
  white: '#FFFFFF',
  black: '#1F1F1F',
  border: '#7F7F7F',
}

const imagePaths = {
  logoNombre: '/logoNombre.png',
  separacion: '/separacion.png',
  firma: '/Firma.png',
  piePagina: '/piePagina.png',
}
const page = { x: 14, w: 182, bottom: 222 }

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

function calculateAge(birthDate) {
  if (!birthDate) return '-'
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1
  return String(age)
}

function setStroke(doc) {
  doc.setDrawColor(colors.border)
  doc.setLineWidth(0.18)
}

function cell(doc, x, y, w, h, text = '', options = {}) {
  const {
    fill = colors.white,
    textColor = colors.black,
    bold = false,
    fontSize = 7.2,
    align = 'left',
    valign = 'middle',
    maxWidth = w - 3,
  } = options

  setStroke(doc)
  doc.setFillColor(fill)
  doc.rect(x, y, w, h, 'FD')
  doc.setTextColor(textColor)
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  doc.setFontSize(fontSize)

  if (!text) return

  const lines = doc.splitTextToSize(String(text), maxWidth)
  const textHeight = lines.length * fontSize * 0.36
  const textY = valign === 'top' ? y + 4 : y + h / 2 - textHeight / 2 + fontSize * 0.32
  const textX = align === 'center' ? x + w / 2 : align === 'right' ? x + w - 2 : x + 2
  doc.text(lines, textX, textY, { align, maxWidth })
}

function labelCell(doc, x, y, w, h, text) {
  cell(doc, x, y, w, h, text, {
    fill: colors.dataFill,
    bold: true,
    fontSize: 6.8,
    maxWidth: w - 2,
  })
}

function valueCell(doc, x, y, w, h, text) {
  cell(doc, x, y, w, h, text || '', {
    fill: colors.white,
    fontSize: 7.3,
    maxWidth: w - 3,
  })
}

function drawHeader(doc, orden, images) {
  if (images.logoNombre) {
    doc.addImage(images.logoNombre, 'PNG', page.x, 12, 76, 20.5)
  }

  cell(doc, 151, 10, 45, 26, `HC N°\n${orden.hc_numero || ''}`, {
    fill: colors.white,
    textColor: colors.blue,
    borderColor: colors.blue,
    bold: true,
    fontSize: 8.5,
    align: 'center',
  })

  if (images.separacion) {
    doc.addImage(images.separacion, 'PNG', page.x, 41, page.w, 2.3)
  }

  doc.setTextColor(colors.blue)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('RESULTADOS DE LABORATORIO', 105, 56, { align: 'center' })
}

function drawPatientData(doc, orden) {
  const paciente = orden.pacientes || {}

  let y = 62
  cell(doc, page.x, y, page.w, 6, 'DATOS DEL PACIENTE', {
    fill: colors.dataFill,
    bold: true,
    fontSize: 7,
  })
  y += 6

  labelCell(doc, page.x, y, 45, 6.5, 'APELLIDOS Y NOMBRES')
  valueCell(doc, page.x + 45, y, 137, 6.5, paciente.nombre)
  y += 6.5

  labelCell(doc, page.x, y, 45, 6.5, 'MÉDICO SOLICITANTE')
  valueCell(doc, page.x + 45, y, 137, 6.5, orden.medico_solicitante)
  y += 6.5

  labelCell(doc, page.x, y, 30, 6.5, 'DNI')
  valueCell(doc, page.x + 30, y, 31, 6.5, paciente.dni)
  labelCell(doc, page.x + 61, y, 28, 6.5, 'EDAD')
  valueCell(doc, page.x + 89, y, 31, 6.5, calculateAge(paciente.fecha_nacimiento))
  labelCell(doc, page.x + 120, y, 31, 6.5, 'SEXO')
  valueCell(doc, page.x + 151, y, 31, 6.5, paciente.sexo)
  y += 6.5

  labelCell(doc, page.x, y, 30, 6.5, 'F. NACIMIENTO')
  valueCell(doc, page.x + 30, y, 31, 6.5, formatPeruDate(paciente.fecha_nacimiento))
  labelCell(doc, page.x + 61, y, 36, 6.5, 'TIPO ATENCIÓN')
  valueCell(doc, page.x + 97, y, 23, 6.5, orden.tipo_atencion)
  labelCell(doc, page.x + 120, y, 31, 6.5, 'N° DE ORDEN')
  valueCell(doc, page.x + 151, y, 31, 6.5, orden.numero_orden)
  y += 6.5

  labelCell(doc, page.x, y, 30, 6.5, 'F. MUESTRA')
  valueCell(doc, page.x + 30, y, 31, 6.5, formatPeruDate(orden.fecha_muestra))
  labelCell(doc, page.x + 61, y, 36, 6.5, 'F. REPORTE')
  valueCell(doc, page.x + 97, y, 23, 6.5, formatPeruDate(orden.fecha_reporte))
  labelCell(doc, page.x + 120, y, 31, 6.5, 'TIPO DE MUESTRA')
  valueCell(doc, page.x + 151, y, 31, 6.5, orden.tipo_muestra)
  y += 6.5
  
  return y + 14
}

function drawPatientBlock(doc, orden, images) {
  drawHeader(doc, orden, images)
  return drawPatientData(doc, orden)
}

function beginTemplatePage(doc, orden, images, isFirstPage, showPatientData = true) {
  if (!isFirstPage) doc.addPage()
  doc.setFillColor(colors.white)
  doc.rect(0, 0, 210, 297, 'F')
  if (showPatientData) return drawPatientBlock(doc, orden, images)
  drawHeader(doc, orden, images)
  return 70
}

function resultRows(analysis) {
  return (analysis.resultados || []).map((row) => ({
    parametro: row.parametro || '',
    valor: row.valor || '',
    referencia: row.referencia || '',
  }))
}

function sectionTitle(doc, title, y) {
  doc.setTextColor(colors.black)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.text(title, page.x, y)
}

function drawStandardTable(doc, analysis, y) {
  const isBio = analysis.tipo === 'Pruebas bioquímicas'
  const title = isBio ? 'PRUEBAS BIOQUÍMICAS' : analysis.tipo.toUpperCase()
  const firstHeader = isBio ? 'ANÁLISIS' : 'EXAMEN'
  const thirdHeader = isBio ? 'VALORES REFERENCIALES' : 'VALORES DE REFERENCIA'
  const rows = resultRows(analysis)

  sectionTitle(doc, title, y)
  y += 4

  cell(doc, page.x, y, 62, 6.5, firstHeader, { fill: colors.blue, textColor: colors.white, bold: true, align: 'center', fontSize: 6.7 })
  cell(doc, page.x + 62, y, 58, 6.5, 'RESULTADO', { fill: colors.blue, textColor: colors.white, bold: true, align: 'center', fontSize: 6.7 })
  cell(doc, page.x + 120, y, 62, 6.5, thirdHeader, { fill: colors.blue, textColor: colors.white, bold: true, align: 'center', fontSize: 6.7 })
  y += 6.5

  rows.forEach((row) => {
    cell(doc, page.x, y, 62, 5.2, row.parametro, { fill: colors.white, fontSize: 6.6 })
    cell(doc, page.x + 62, y, 58, 5.2, row.valor || 'Pendiente', {
      fill: colors.resultFill,
      fontSize: 6.6,
      align: 'center',
    })
    cell(doc, page.x + 120, y, 62, 5.2, row.referencia, {
      fill: colors.referenceFill,
      fontSize: 6.6,
      align: 'center',
    })
    y += 5.2
  })

  return y + 5
}

function drawBloodGroupTable(doc, analysis, y) {
  sectionTitle(doc, 'GRUPO SANGUÍNEO Y FACTOR RH', y)
  y += 5
  cell(doc, page.x, y, 91, 8, 'EXAMEN', { fill: colors.blue, textColor: colors.white, bold: true, align: 'center' })
  cell(doc, page.x + 91, y, 91, 8, 'RESULTADO', { fill: colors.blue, textColor: colors.white, bold: true, align: 'center' })
  y += 8

  const rows = resultRows(analysis)
  rows.forEach((row) => {
    cell(doc, page.x, y, 91, 8, row.parametro, { fill: colors.white, fontSize: 7.5 })
    cell(doc, page.x + 91, y, 91, 8, row.valor || 'Pendiente', { fill: colors.resultFill, fontSize: 7.5, align: 'center' })
    y += 8
  })
  return y + 10
}

function drawBkTable(doc, analysis, y) {
  sectionTitle(doc, 'BACILOSCOPÍA', y)
  y += 7
  doc.setTextColor(colors.black)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Examen de baciloscopía (BK)', page.x, y)
  y += 6

  cell(doc, page.x, y, 62, 8, 'ANÁLISIS', { fill: colors.blue, textColor: colors.white, bold: true, align: 'center' })
  cell(doc, page.x + 62, y, 70, 8, 'ASPECTO MACROSCÓPICO', {
    fill: colors.blue,
    textColor: colors.white,
    bold: true,
    align: 'center',
  })
  cell(doc, page.x + 132, y, 50, 8, 'RESULTADO', { fill: colors.blue, textColor: colors.white, bold: true, align: 'center' })
  y += 8

  const rows = resultRows(analysis)
  rows.forEach((row) => {
    cell(doc, page.x, y, 62, 10, row.parametro, { fill: colors.white, fontSize: 7.4 })
    cell(doc, page.x + 62, y, 70, 10, analysis.aspecto_macroscopico || '', {
      fill: colors.resultFill,
      fontSize: 7.4,
      align: 'center',
    })
    cell(doc, page.x + 132, y, 50, 10, row.valor || 'Pendiente', {
      fill: colors.resultFill,
      fontSize: 7.4,
      align: 'center',
    })
    y += 10
  })
  return y + 8
}

function drawObservations(doc, title, text, y) {
  if (!String(text || '').trim()) return y

  doc.setTextColor(colors.black)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(title, page.x, y)
  y += 3
  cell(doc, page.x, y, page.w, 12, text, { fill: colors.white, fontSize: 7, valign: 'top' })
  return y + 17
}

function drawAnalysisSection(doc, analysis, y) {
  if (analysis.tipo === 'Grupo y factor RH') y = drawBloodGroupTable(doc, analysis, y)
  else if (analysis.tipo === 'Baciloscopía (BK)') y = drawBkTable(doc, analysis, y)
  else y = drawStandardTable(doc, analysis, y)

  return drawObservations(doc, 'OBSERVACIONES', analysis.observaciones, y)
}

function estimateSectionHeight(analysis) {
  if (analysis.tipo === 'Hemograma completo') return 106
  if (analysis.tipo === 'Pruebas bioquímicas') return 56
  if (analysis.tipo === 'Grupo y factor RH') return 44
  if (analysis.tipo === 'Baciloscopía (BK)') return 58
  return 62
}

function drawFooter(doc, images) {
  if (images.firma) {
    doc.addImage(images.firma, 'PNG', 71, 223, 68, 38)
  }

  doc.setDrawColor('#D9D9E8')
  doc.setLineWidth(0.25)

  if (images.piePagina) {
    doc.addImage(images.piePagina, 'PNG', page.x - 6, 264, page.w + 12, 31)
  }
}

export async function generarPDF(orden) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const images = {}
  await Promise.all(
    Object.entries(imagePaths).map(async ([key, path]) => {
      try {
        images[key] = await imageToDataUrl(path)
      } catch {
        images[key] = null
      }
    }),
  )

  const analyses = orden.analisis?.length ? orden.analisis : []

  // Primera página siempre con datos del paciente
  let y = beginTemplatePage(doc, orden, images, true)

  if (!analyses.length) {
    cell(doc, page.x, y, page.w, 10, 'Esta orden no tiene análisis registrados.', { fontSize: 8 })
    drawFooter(doc, images)
    return doc
  }

  // Todos los análisis juntos, sin separar por tipo
  // Solo salta de página cuando no hay espacio
  analyses.forEach((analysis) => {
    const height = estimateSectionHeight(analysis)
    if (y + height > page.bottom) {
      drawFooter(doc, images)
      y = beginTemplatePage(doc, orden, images, false, false)
    }
    y = drawAnalysisSection(doc, analysis, y)
  })

  drawFooter(doc, images)
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
