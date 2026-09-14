import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, API, getToken } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Brand, WaveBars } from '../components/UI'

interface QEntry { id: string; attendee_id: string; status: string; question_text: string | null; created_at: string; attendees: { name: string } }

export default function AdminSession() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [event, setEvent] = useState<any>(null)
  const [queue, setQueue] = useState<QEntry[]>([])
  const [joinCount, setJoinCount] = useState(0)
  const [actionId, setActionId] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState('')
  const [joinUrl, setJoinUrl] = useState('')
  const [showQR, setShowQR] = useState(true)

  const adminName = user?.user_metadata?.full_name || 'Admin'

  const fetchQueue = useCallback(async () => {
    const t = await getToken()
    const res = await fetch(`${API}/api/events/${code}/queue`, { headers: { Authorization: `Bearer ${t}` } })
    const d = await res.json()
    if (d.queue) setQueue(d.queue)
  }, [code])

  useEffect(() => {
    const init = async () => {
      const t = await getToken()
      // Load event
      const r1 = await fetch(`${API}/api/events/${code}`, { headers: { Authorization: `Bearer ${t}` } })
      const d1 = await r1.json()
      if (d1.event) setEvent(d1.event)
      // QR is generated server-side — fetch it from the backend
      const r3 = await fetch(`${API}/api/events/${code}/qr`, { headers: { Authorization: `Bearer ${t}` } })
      const d3 = await r3.json()
      if (d3.qrDataUrl) setQrUrl(d3.qrDataUrl)
      if (d3.joinUrl)   setJoinUrl(d3.joinUrl)
      // Attendee count
      const r2 = await fetch(`${API}/api/events/${code}/count`, { headers: { Authorization: `Bearer ${t}` } })
      const d2 = await r2.json()
      setJoinCount(d2.count || 0)
    }
    init(); fetchQueue()

    const ch = supabase.channel(`admin-session:${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'speaker_queue' }, fetchQueue)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendees' }, () => setJoinCount(c => c + 1))
      .subscribe()
    return () => { ch.unsubscribe() }
  }, [code, fetchQueue])

  const doAction = async (id: string, action: 'approve' | 'reject' | 'end') => {
    setActionId(id)
    const t = await getToken()
    await fetch(`${API}/api/queue/${id}/${action}`, { method: 'PATCH', headers: { Authorization: `Bearer ${t}` } })
    await fetchQueue()
    setActionId(null)
  }

  const endEvent = async () => {
    if (!confirm('End this session? Attendees will not be able to join after this.')) return
    const t = await getToken()
    await fetch(`${API}/api/events/${code}/end`, { method: 'PATCH', headers: { Authorization: `Bearer ${t}` } })
    navigate('/admin/dashboard')
  }

  const waiting = queue.filter(q => q.status === 'waiting')
  const active  = queue.find(q => q.status === 'approved' || q.status === 'speaking')

  return (
    <div className="min-h-screen bg-dark-900 bg-grid">
      {/* Hidden audio output — this is what plays through DI box */}
      <audio id="ov-audio-out" autoPlay playsInline className="hidden"/>

      {/* Nav */}
      <nav className="border-b border-white/5 bg-dark-800/80 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/admin/dashboard')} className="text-slate-500 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <Brand/>
          <div className="flex-1"/>
          <div className="badge-live text-xs"><span className="dot-live"/>Live</div>
          <code className="text-slate-500 text-xs font-mono hidden sm:block">{code}</code>
          <button
            onClick={() => window.open(`/host/${code}`, '_blank')}
            className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 18.364l-3.536-3.536a5 5 0 010-7.072L12 4.222"/>
            </svg>
            Audio host (DI box)
          </button>
          <button onClick={endEvent} className="btn-danger py-1.5 px-3 text-xs">End session</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label:'Attendees joined', val:joinCount, color:'text-brand-300' },
            { label:'In queue', val:waiting.length, color:'text-amber-400' },
            { label:'Speaking now', val:active ? 1 : 0, color:'text-emerald-400' },
          ].map(s => (
            <div key={s.label} className="glass p-4 text-center">
              <div className={`text-3xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Left column */}
          <div className="space-y-4">
            {/* QR */}
            {showQR && qrUrl && (
              <div className="glass p-5">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-sm font-medium text-white">Share with attendees</p>
                  <button onClick={() => setShowQR(false)} className="text-slate-600 hover:text-slate-400 text-xl leading-none">&times;</button>
                </div>
                <div className="bg-white rounded-xl p-3 inline-block mb-3">
                  <img src={qrUrl} alt="QR" className="w-36 h-36"/>
                </div>
                <p className="font-mono text-2xl font-bold text-brand-300 mb-1" style={{ textShadow:'0 0 15px rgba(99,102,241,0.5)' }}>{code}</p>
                {joinUrl && <p className="text-xs text-slate-600 break-all">{joinUrl}</p>}
              </div>
            )}

            {/* Active speaker */}
            <div className="glass p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Now speaking</p>
              {active ? (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-emerald-300 text-sm"
                      style={{ background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.2)' }}>
                      {active.attendees.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{active.attendees.name}</p>
                      {active.question_text && <p className="text-xs text-slate-400 line-clamp-1">"{active.question_text}"</p>}
                      <div className="badge-live mt-1 text-xs inline-flex"><span className="dot-live"/>Mic live</div>
                    </div>
                  </div>
                  <WaveBars active={true} level={55}/>
                  <button onClick={() => doAction(active.id, 'end')} disabled={!!actionId}
                    className="mt-3 w-full btn-danger py-2 text-xs justify-center">
                    End turn
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-10 h-10 rounded-xl bg-dark-500 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                    </svg>
                  </div>
                  <p className="text-slate-500 text-xs">No active speaker</p>
                </div>
              )}
            </div>
          </div>

          {/* Queue */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Speaker queue <span className="text-brand-400 ml-1">{waiting.length}</span>
              </p>
              {waiting.length > 0 && !active && (
                <button onClick={() => doAction(waiting[0].id, 'approve')} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                  Approve next →
                </button>
              )}
            </div>

            {waiting.length === 0 ? (
              <div className="glass p-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-dark-500 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <p className="text-slate-400 text-sm font-medium">Queue is empty</p>
                <p className="text-slate-600 text-xs mt-1">Attendees tap "Request to speak" on their phones</p>
              </div>
            ) : (
              <div className="space-y-2">
                {waiting.map((entry, idx) => (
                  <div key={entry.id} className="glass flex items-center gap-4 p-4"
                    style={{ borderColor: idx === 0 ? 'rgba(99,102,241,0.3)' : undefined }}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      idx === 0 ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'bg-dark-500 text-slate-500'}`}>
                      {idx + 1}
                    </div>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-sm flex-shrink-0 text-brand-300"
                      style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.15)' }}>
                      {entry.attendees.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm">{entry.attendees.name}</p>
                      {entry.question_text && <p className="text-xs text-slate-500 truncate">"{entry.question_text}"</p>}
                      <p className="text-xs text-slate-600 mt-0.5">
                        {new Date(entry.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => doAction(entry.id, 'approve')} disabled={!!actionId} className="btn-success">
                        {actionId === entry.id ? '...' : 'Approve'}
                      </button>
                      <button onClick={() => doAction(entry.id, 'reject')} disabled={!!actionId} className="btn-danger">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
