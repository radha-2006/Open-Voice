import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

import { AuthProvider, useAuth } from './context/AuthContext'
import Landing        from './pages/Landing'
import AdminLogin     from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminSession   from './pages/AdminSession'
import { AttendeeJoin, AttendeeRoom } from './pages/Attendee'
import HostAudio      from './pages/HostAudio'
import ResetPassword  from './pages/ResetPassword'
import { Spinner }    from './components/UI'

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center gap-3">
      <Spinner className="w-8 h-8 text-brand-400"/>
      <p className="text-slate-500 text-sm">Loading OpenVoice…</p>
    </div>
  )
  return user ? <>{children}</> : <Navigate to="/admin/login" replace/>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"                       element={<Landing/>}/>
          <Route path="/admin/login"            element={<AdminLogin/>}/>
          <Route path="/admin/reset-password"   element={<ResetPassword/>}/>
          <Route path="/admin/dashboard"        element={<RequireAdmin><AdminDashboard/></RequireAdmin>}/>
          <Route path="/admin/session/:code"    element={<RequireAdmin><AdminSession/></RequireAdmin>}/>
          <Route path="/host/:code"             element={<RequireAdmin><HostAudio/></RequireAdmin>}/>
          <Route path="/join/:code"             element={<AttendeeJoin/>}/>
          <Route path="/room/:code"             element={<AttendeeRoom/>}/>
          <Route path="*"                       element={<Navigate to="/" replace/>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)
