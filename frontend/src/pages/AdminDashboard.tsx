import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Brand, Spinner } from '../components/UI'
import { API, getToken } from '../lib/supabase'

interface Ev { id: string; title: string; session_code: string; status: string; created_at: string }

export default function AdminDashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState<Ev[]>([])
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [qrModal, setQrModal] = useState<{ code: string; qr: string; url: string } | null>(null)
  const [error, setError] = useState('')
  const [loadingList, setLoadingList] = useState(true)

  const adminName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin'

  useEffect(() => { loadEvents() }, [])

  const loadEvents = async () => {
    setLoadingList(true)
    const t = await getToken()
    const res = await fetch(`${API}/api/admin/events`, { headers: { Authorization: `Bearer ${t}` } })
    const d = await res.json()
    setEvents(d.events || [])
    setLoadingList(false)
  }

  const createEvent = async () => {
    if (!title.trim()) { setError('Enter an event title.'); return }
    setCreating(true); setError('')
    const t = await getToken()
    const res = await fetch(`${API}/api/events`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ title: title.trim(), moderator_name: adminName })
    })
    const d = await res.json()
    setCreating(false)
    if (!res.ok) { setError(d.error || 'Failed to create'); return }
    setQrModal({ code: d.event.session_code, qr: d.qrDataUrl, url: d.joinUrl })
    setTitle(''); setShowForm(false)
    loadEvents()
  }

  return (
    <div className="min-h-screen bg-dark-900 bg-grid">
      {/* The hidden audio element — ALWAYS present so host tab works */}
      <audio id="ov-audio-out" autoPlay playsInline className="hidden"/>

      {/* Nav */}
      <nav className="border-b border-white/5 bg-dark-800/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Brand/>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-white">{adminName}</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-300 font-bold text-sm">
              {adminName[0].toUpperCase()}
            </div>
            <button onClick={signOut} className="btn-ghost text-xs py-1.5 px-3">Sign out</button>
          </div>
        </div>
      </nav>

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:'rgba(5,5,8,0.88)', backdropFilter:'blur(12px)' }}>
          <div className="glass p-8 max-w-sm w-full text-center">
            <div className="badge-live mb-4 mx-auto inline-flex"><span className="dot-live"/>Session live</div>
            <h2 className="text-xl font-bold text-white mb-1">Event created</h2>
            <p className="text-slate-400 text-sm mb-6">Share this QR code — attendees scan it to join instantly</p>
            <div className="bg-white rounded-2xl p-4 inline-block mb-4">
              <img src={qrModal.qr} alt="QR" className="w-48 h-48"/>
            </div>
            <p className="text-xs text-slate-500 mb-1">Session code</p>
            <p className="font-mono text-3xl font-bold text-brand-300 mb-4" style={{ textShadow:'0 0 20px rgba(99,102,241,0.6)' }}>
              {qrModal.code}
            </p>
            <p className="text-xs text-slate-600 break-all bg-dark-600 rounded-lg px-3 py-2 mb-6">{qrModal.url}</p>
            <div className="flex gap-3">
              <button onClick={() => { navigate(`/admin/session/${qrModal.code}`); setQrModal(null) }} className="btn-primary flex-1 py-2.5">
                Open moderator panel
              </button>
              <button onClick={() => setQrModal(null)} className="btn-ghost flex-1 py-2.5">Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Your events</h1>
            <p className="text-slate-500 text-sm mt-0.5">Create and manage live Q&A sessions</p>
          </div>
          <button onClick={() => setShowForm(s => !s)} className="btn-primary w-auto px-5 py-2.5 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            New event
          </button>
        </div>

        {showForm && (
          <div className="glass p-6 mb-6">
            <p className="text-sm font-medium text-white mb-3">New event</p>
            <div className="flex gap-3">
              <input className="input-field flex-1" placeholder="Event title — e.g. Engineering Seminar Q&A"
                value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && createEvent()}
                autoFocus/>
              <button onClick={createEvent} disabled={creating}
                className="btn-primary w-auto px-6 flex items-center gap-2">
                {creating ? <Spinner/> : null}
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          </div>
        )}

        {loadingList ? (
          <div className="flex justify-center py-20"><Spinner className="w-8 h-8 text-brand-400"/></div>
        ) : events.length === 0 ? (
          <div className="glass p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <p className="text-white font-medium mb-1">No events yet</p>
            <p className="text-slate-500 text-sm">Create your first event to get a QR code</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(ev => (
              <div key={ev.id}
                className={`glass-hover p-5 group ${ev.status !== 'active' ? 'opacity-60' : ''}`}
                onClick={() => ev.status === 'active' && navigate(`/admin/session/${ev.session_code}`)}>
                <div className="flex items-start justify-between mb-3">
                  {ev.status === 'active'
                    ? <div className="badge-live"><span className="dot-live"/>Live</div>
                    : <div className="text-xs text-slate-500 border border-white/10 px-2.5 py-1 rounded-full">Ended</div>}
                  <span className="font-mono text-xs text-slate-500 bg-dark-600 px-2 py-0.5 rounded">{ev.session_code}</span>
                </div>
                <h3 className="font-semibold text-white text-sm mb-1 group-hover:text-brand-300 transition-colors line-clamp-2">{ev.title}</h3>
                <p className="text-xs text-slate-600">{new Date(ev.created_at).toLocaleDateString('en-IN',{ day:'numeric',month:'short',year:'numeric' })}</p>
                {ev.status === 'active' && (
                  <div className="mt-4 flex items-center gap-1 text-brand-400 text-xs font-medium">
                    Open moderator panel
                    <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
