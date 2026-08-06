import { Navigate, Route, Routes } from 'react-router-dom'
import PublicSearch from './pages/PublicSearch.jsx'
import ValidateCertificate from './pages/ValidateCertificate.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminLogin from './pages/admin/AdminLogin.jsx'
import AdminAnalysisDetail from './pages/admin/AdminAnalysisDetail.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminOrderDetail from './pages/admin/AdminOrderDetail.jsx'
import AdminOrders from './pages/admin/AdminOrders.jsx'
import AdminPatients from './pages/admin/AdminPatients.jsx'
import ProtectedAdmin from './routes/ProtectedAdmin.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicSearch />} />
      <Route path="/validar" element={<ValidateCertificate />} />
      <Route path="/validar/:id" element={<ValidateCertificate />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <ProtectedAdmin>
            <AdminLayout />
          </ProtectedAdmin>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="pacientes" element={<AdminPatients />} />
        <Route path="ordenes" element={<AdminOrders />} />
        <Route path="ordenes/:id" element={<AdminOrderDetail />} />
        <Route path="ordenes/:id/analisis/:analisis_id" element={<AdminAnalysisDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
