import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, API } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Brand, MicRing, WaveBars, Particles, ErrorBox, Spinner } from '../components/UI'
import { useWebRTC } from '../hooks/useWebRTC'

/* ─────────────────────────────────────────────────────────────
   JOIN PAGE  — attendee lands here after scanning QR code
───────────────────────────────────────────────────────────── */
export function AttendeeJoin() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { saveAttendeeSession } = useAuth()
  const [event, setEvent] = useState<any>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/events/${code}`)
      .then(r => r.json())
      .then(d => { if (d.event) setEvent(d.event); else setNotFound(true) })
      .catch(() => setNotFound(true))
      .finally(() => setPageLoading(false))
  }, [code])

  const join = async () => {
    if (!name.trim()) { setError('Enter your name to continue.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/api/events/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Could not join session'); return }
      saveAttendeeSession({
        attendeeId: d.attendee.id,
        eventId: d.attendee.event_id,
        name: name.trim(),
        code: code!
      })
      navigate(`/room/${code}`)
    } catch {
      setError('Network error. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <Spinner className="w-8 h-8 text-brand-400"/>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <Particles/>
      <div className="relative z-10 glass p-8 max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </div>
        <h2 className="font-bold text-white text-lg mb-2">Session not found</h2>
        <p className="text-slate-400 text-sm mb-5">This session may have ended or the code is incorrect.</p>
        <button onClick={() => navigate('/')} className="btn-primary py-2.5">Return home</button>
      </div>
    </div>
  )

  return (
    <div className="relative min-h-screen bg-dark-900 flex items-center justify-center overflow-hidden p-4">
      <Particles/>
      <div className="absolute inset-0 bg-grid pointer-events-none"/>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center,rgba(52,211,153,0.06) 0%,transparent 65%)' }}/>

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <button onClick={() => navigate('/')} className="inline-flex mb-6"><Brand/></button>
          {event ? (
            <>
              <div className="badge-live mx-auto mb-3 inline-flex"><span className="dot-live"/>Live now</div>
              <h1 className="text-xl font-bold text-white">{event.title}</h1>
              <p className="text-slate-400 text-sm mt-1">Moderated by {event.moderator_name}</p>
            </>
          ) : (
            <div className="h-12 bg-dark-600 rounded-xl animate-pulse mx-6"/>
          )}
        </div>

        <div className="glass p-7">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Your name</label>
          <input
            className="input-field"
            placeholder="Enter your name to join"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && join()}
            autoFocus
            autoComplete="name"
          />
          {error && <div className="mt-2"><ErrorBox msg={error}/></div>}
          <button className="btn-primary mt-4 py-3 flex items-center justify-center gap-2" onClick={join} disabled={loading || !event}>
            {loading ? <><Spinner/>Joining...</> : 'Join session'}
          </button>
        </div>

        <p className="text-center text-xs text-slate-600 mt-5">
          No app download · Works on any browser · Your mic is only activated when approved
        </p>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   ROOM PAGE  — attendee's main experience after joining
   Status flow:  idle → waiting → approved → (done | rejected) → idle
───────────────────────────────────────────────────────────── */
type Status = 'idle' | 'waiting' | 'approved' | 'done' | 'rejected'

export function AttendeeRoom() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { attendeeSession, clearAttendeeSession } = useAuth()
  const { attendeeId, eventId, name } = attendeeSession || {}

  const [status, setStatus]         = useState<Status>('idle')
  const [position, setPosition]     = useState<number | null>(null)
  const [question, setQuestion]     = useState('')
  const [showQ, setShowQ]           = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [isMuted, setIsMuted]       = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)
  const speakerStarted = useRef(false)

  const {
    isConnected, isMicActive, audioLevel, error: rtcErr,
    startSpeaker, stopSpeaker, muteMic
  } = useWebRTC(code!, attendeeId || 'anon', 'speaker')

  // Redirect if no session stored
  useEffect(() => {
    if (!attendeeId) navigate(`/join/${code}`)
  }, [attendeeId, code, navigate])

  // Subscribe to queue updates for this attendee
  useEffect(() => {
    if (!attendeeId || !eventId) return

    const ch = supabase.channel(`room:${attendeeId}`)
      // Watch MY specific queue row
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'speaker_queue',
        filter: `attendee_id=eq.${attendeeId}`
      }, async ({ new: row }) => {
        const s = row.status as Status

        if ((s === 'approved' || s === 'speaking') && !speakerStarted.current) {
          speakerStarted.current = true
          setStatus('approved')
          await startSpeaker()
        }

        if (s === 'done' || s === 'rejected') {
          setStatus(s)
          stopSpeaker()
          speakerStarted.current = false
          // Auto-reset to idle after 3 seconds so they can request again
          setTimeout(() => {
            setStatus('idle')
            setQuestion('')
            setShowQ(false)
            setError('')
          }, 3000)
        }
      })
      // Watch the whole event queue to update position number
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'speaker_queue',
        filter: `event_id=eq.${eventId}`
      }, updatePosition)
      // Watch for session ended
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'events',
        filter: `id=eq.${eventId}`
      }, ({ new: row }) => {
        if (row.status === 'ended') setSessionEnded(true)
      })
      .subscribe()

    return () => { ch.unsubscribe() }
  }, [attendeeId, eventId, startSpeaker, stopSpeaker])

  const updatePosition = async () => {
    const { data } = await supabase
      .from('speaker_queue')
      .select('attendee_id')
      .eq('event_id', eventId!)
      .eq('status', 'waiting')
      .order('created_at', { ascending: true })
    if (!data) return
    const pos = data.findIndex(r => r.attendee_id === attendeeId)
    setPosition(pos >= 0 ? pos + 1 : null)
  }

  const requestToSpeak = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/api/queue/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendee_id: attendeeId,
          event_id: eventId,
          question_text: question.trim() || null
        })
      })
      const d = await res.json()
      if (res.status === 409) { setError("You're already in the queue."); return }
      if (!res.ok) { setError(d.error || 'Could not join queue'); return }
      setStatus('waiting')
      setShowQ(false)
      await updatePosition()
    } catch {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleMute = () => {
    const next = !isMuted
    setIsMuted(next)
    muteMic(next)
  }

  const leaveSession = () => {
    stopSpeaker()
    clearAttendeeSession()
    navigate('/')
  }

  if (sessionEnded) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="glass p-8 max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-dark-500 border border-white/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3l14 9-14 9V3z"/>
          </svg>
        </div>
        <h2 className="font-bold text-white text-lg mb-2">Session ended</h2>
        <p className="text-slate-400 text-sm mb-5">The moderator has ended this Q&A session. Thank you for participating.</p>
        <button onClick={leaveSession} className="btn-primary py-2.5">Return home</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col relative overflow-hidden">
      {/* Subtle green tint when live */}
      {status === 'approved' && !isMuted && (
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{ background: 'radial-gradient(ellipse at center,rgba(52,211,153,0.04) 0%,transparent 70%)' }}/>
      )}

      {/* Header */}
      <div className="border-b border-white/5 bg-dark-800/60 backdrop-blur-lg px-4 py-3 flex items-center justify-between flex-shrink-0 relative z-10">
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="text-xs text-slate-500">
            Session <span className="font-mono text-slate-400">{code}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status === 'approved' && (
            <div className="badge-live text-xs">
              <span className="dot-live"/>
              {isConnected ? (isMuted ? 'Muted' : 'Mic live') : 'Connecting...'}
            </div>
          )}
          {status === 'idle' && (
            <button onClick={leaveSession} className="text-slate-600 hover:text-slate-400 text-xs transition-colors">Leave</button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-sm mx-auto w-full relative z-10">

        {/* ── IDLE ── */}
        {status === 'idle' && (
          <div className="w-full space-y-4">
            <div className="text-center mb-6">
              <MicRing active={false} level={0}/>
              <h2 className="text-xl font-bold text-white mt-4 mb-1">Ready to ask?</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Tap the button below to join the speaker queue. The moderator will approve you when it's your turn.
              </p>
            </div>

            {showQ && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Your question (optional)</label>
                <textarea
                  className="input-field resize-none text-sm"
                  rows={3}
                  placeholder="Type your question so the moderator can see it..."
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                />
              </div>
            )}

            {error && <ErrorBox msg={error}/>}

            <button
              className="btn-primary py-3.5 flex items-center justify-center gap-2"
              onClick={requestToSpeak}
              disabled={loading}
            >
              {loading ? (
                <><Spinner/>Joining queue...</>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-7a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                  </svg>
                  Request to speak
                </>
              )}
            </button>

            <button onClick={() => setShowQ(s => !s)} className="btn-ghost w-full text-sm">
              {showQ ? 'Hide question box' : 'Type a question instead'}
            </button>
          </div>
        )}

        {/* ── WAITING ── */}
        {status === 'waiting' && (
          <div className="text-center space-y-5 w-full">
            <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center relative"
              style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)' }}>
              <svg className="w-9 h-9 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
            <div>
              <div className="badge-wait mx-auto mb-3 inline-flex">In queue</div>
              {position !== null && (
                <div className="text-5xl font-bold text-amber-400 my-2"
                  style={{ textShadow:'0 0 20px rgba(245,158,11,0.4)' }}>
                  #{position}
                </div>
              )}
              <h2 className="text-lg font-bold text-white">Waiting for approval</h2>
              <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                Keep this page open. Your microphone will activate automatically when the moderator approves you.
              </p>
              {question && (
                <div className="mt-4 bg-dark-600 border border-white/10 rounded-xl p-3 text-sm text-slate-300 italic text-left">
                  "{question}"
                </div>
              )}
            </div>
            <p className="text-xs text-slate-600">Do not close or refresh this page</p>
          </div>
        )}

        {/* ── APPROVED / LIVE ── */}
        {status === 'approved' && (
          <div className="text-center space-y-5 w-full">
            <MicRing active={!isMuted} level={audioLevel} muted={isMuted}/>

            <div>
              <div className="badge-live mx-auto mb-3 inline-flex">
                <span className="dot-live"/>
                {isConnected
                  ? isMuted ? 'You are muted' : 'You are live'
                  : 'Connecting audio...'}
              </div>
              <h2 className="text-2xl font-bold text-white">
                {isMuted ? 'Tap to unmute' : "You're on air"}
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {isConnected
                  ? 'Your voice is streaming to the venue speakers via WebRTC'
                  : 'Establishing peer connection...'}
              </p>
              {rtcErr && <div className="mt-3"><ErrorBox msg={rtcErr}/></div>}
            </div>

            {/* Real audio level waveform */}
            <div className="flex justify-center">
              <WaveBars active={!isMuted && isConnected} level={audioLevel}/>
            </div>

            {/* Mute toggle */}
            <button
              onClick={toggleMute}
              className={`px-8 py-3.5 rounded-xl font-semibold text-sm border transition-all duration-200 ${
                isMuted
                  ? 'bg-red-500/12 border-red-500/30 text-red-400 hover:bg-red-500/20'
                  : 'bg-dark-500 border-white/10 text-white hover:border-brand-500/40 hover:bg-dark-400'
              }`}
            >
              {isMuted ? 'Tap to unmute' : 'Tap to mute'}
            </button>

            <div className="space-y-1 text-xs text-slate-600">
              <p>Hold your phone naturally and speak clearly</p>
              <p>Stay on this page — closing it will cut your audio</p>
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {status === 'done' && (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center"
              style={{ background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.2)' }}>
              <svg className="w-9 h-9 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Thank you!</h2>
            <p className="text-slate-400 text-sm">Your turn has ended. Returning to queue screen...</p>
          </div>
        )}

        {/* ── REJECTED ── */}
        {status === 'rejected' && (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center"
              style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)' }}>
              <svg className="w-9 h-9 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Not selected</h2>
            <p className="text-slate-400 text-sm">The moderator moved to another speaker. You can request again.</p>
          </div>
        )}

      </div>
    </div>
  )
}
