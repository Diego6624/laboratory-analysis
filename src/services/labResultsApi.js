import { createClient } from '@supabase/supabase-js'
import {
  ADMIN_SESSION_KEY,
  ANALYSES_TABLE,
  ORDERS_TABLE,
  PATIENTS_TABLE,
  RESULTS_TABLE,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from '../config/supabase.js'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const orderSelect = `
  *,
  pacientes(*),
  analisis(
    *,
    resultados(*)
  )
`

const publicOrderSelect = `
  *,
  pacientes!inner(*),
  analisis(
    *,
    resultados(*)
  )
`

function throwIfError(error) {
  if (error) throw error
}

function sanitizeDni(dni) {
  return dni.replace(/\D/g, '').slice(0, 12)
}

function normalizeOrder(order) {
  if (!order) return null
  return {
    ...order,
    analisis: Array.isArray(order.analisis) ? order.analisis : [],
  }
}

export async function loginAdmin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  throwIfError(error)
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(data.session))
  return data.session
}

export async function logoutAdmin() {
  await supabase.auth.signOut()
  localStorage.removeItem(ADMIN_SESSION_KEY)
}

export function isAdminAuthenticated() {
  return Boolean(localStorage.getItem(ADMIN_SESSION_KEY))
}

export async function getLatestPublishedOrderByDni(dni) {
  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .select(publicOrderSelect)
    .eq('pacientes.dni', sanitizeDni(dni))
    .eq('estado', 'publicado')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error?.code === 'PGRST116') return null
  throwIfError(error)
  return normalizeOrder(data)
}

export async function getOrderById(orderId) {
  const { data, error } = await supabase.from(ORDERS_TABLE).select(orderSelect).eq('id', orderId).single()
  throwIfError(error)
  return normalizeOrder(data)
}

export async function getDashboardData() {
  const [{ count: patientsCount, error: patientsError }, { data: recentOrders, error: ordersError }] =
    await Promise.all([
      supabase.from(PATIENTS_TABLE).select('id', { count: 'exact', head: true }),
      supabase
        .from(ORDERS_TABLE)
        .select('*, pacientes(*)')
        .order('created_at', { ascending: false })
        .limit(8),
    ])

  throwIfError(patientsError)
  throwIfError(ordersError)

  const countByStatus = async (estado) => {
    const { count, error } = await supabase
      .from(ORDERS_TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('estado', estado)
    throwIfError(error)
    return count ?? 0
  }

  const [pendingOrders, inProcessOrders, publishedOrders] = await Promise.all([
    countByStatus('pendiente'),
    countByStatus('en_proceso'),
    countByStatus('publicado'),
  ])

  return {
    patientsCount: patientsCount ?? 0,
    pendingOrders,
    inProcessOrders,
    publishedOrders,
    recentOrders: recentOrders ?? [],
  }
}

export async function getPatients() {
  const { data, error } = await supabase.from(PATIENTS_TABLE).select('*').order('created_at', { ascending: false })
  throwIfError(error)
  return data
}

export async function getPatientByDni(dni) {
  const { data, error } = await supabase
    .from(PATIENTS_TABLE)
    .select('*')
    .eq('dni', sanitizeDni(dni))
    .maybeSingle()
  throwIfError(error)
  return data
}

export async function createPatient(payload) {
  const { data, error } = await supabase.from(PATIENTS_TABLE).insert(payload).select().single()
  throwIfError(error)
  return data
}

export async function updatePatient(id, payload) {
  const { data, error } = await supabase.from(PATIENTS_TABLE).update(payload).eq('id', id).select().single()
  throwIfError(error)
  return data
}

export async function deletePatient(id) {
  const { error } = await supabase.from(PATIENTS_TABLE).delete().eq('id', id)
  throwIfError(error)
}

export async function getOrders(status = 'todos') {
  let query = supabase
    .from(ORDERS_TABLE)
    .select(orderSelect)
    .order('created_at', { ascending: false })

  if (status !== 'todos') query = query.eq('estado', status)

  const { data, error } = await query
  throwIfError(error)
  return data.map(normalizeOrder)
}

export async function createOrder(payload) {
  const { data, error } = await supabase.from(ORDERS_TABLE).insert(payload).select().single()
  throwIfError(error)
  return data
}

export async function updateOrderState(orderId, estado) {
  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .update({ estado })
    .eq('id', orderId)
    .select()
    .single()
  throwIfError(error)
  return data
}

export async function deleteOrder(orderId) {
  const { error } = await supabase.from(ORDERS_TABLE).delete().eq('id', orderId)
  throwIfError(error)
}

export async function createAnalysis(orderId, tipo) {
  const { data, error } = await supabase
    .from(ANALYSES_TABLE)
    .insert({ orden_id: orderId, tipo, estado: 'pendiente' })
    .select()
    .single()
  throwIfError(error)
  return data
}

export async function updateAnalysisState(analysisId, estado) {
  const { data, error } = await supabase
    .from(ANALYSES_TABLE)
    .update({ estado })
    .eq('id', analysisId)
    .select()
    .single()
  throwIfError(error)
  return data
}

export async function deleteAnalysis(analysisId) {
  const { error } = await supabase.from(ANALYSES_TABLE).delete().eq('id', analysisId)
  throwIfError(error)
}

export async function getAnalysisById(analysisId, orderId) {
  const { data, error } = await supabase
    .from(ANALYSES_TABLE)
    .select(`
      *,
      ordenes(
        *,
        pacientes(*)
      ),
      resultados(*)
    `)
    .eq('id', analysisId)
    .eq('orden_id', orderId)
    .maybeSingle()
  throwIfError(error)
  if (!data) return null
  return { ...data, resultados: Array.isArray(data.resultados) ? data.resultados : [] }
}

export async function createResult(analysisId, payload) {
  const { data, error } = await supabase
    .from(RESULTS_TABLE)
    .insert({ ...payload, analisis_id: analysisId })
    .select()
    .single()
  throwIfError(error)
  return data
}

export async function updateResult(resultId, payload) {
  const { data, error } = await supabase.from(RESULTS_TABLE).update(payload).eq('id', resultId).select().single()
  throwIfError(error)
  return data
}

export async function deleteResult(resultId) {
  const { error } = await supabase.from(RESULTS_TABLE).delete().eq('id', resultId)
  throwIfError(error)
}
