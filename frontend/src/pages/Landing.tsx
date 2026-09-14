import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brand, Particles } from '../components/UI'

export default function Landing() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')

  return (
    <div className="relative min-h-screen bg-dark-900 flex flex-col items-center justify-center overflow-hidden p-4">
      <Particles/>
      <div className="absolute inset-0 bg-grid pointer-events-none"/>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center,rgba(99,102,241,0.12) 0%,transparent 70%)' }}/>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6"><Brand size="lg"/></div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-4">
            <span className="text-white">Every phone is a</span><br/>
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg,#818cf8,#6366f1)' }}>
              live microphone
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-lg mx-auto leading-relaxed">
            Attendees scan a QR code. You approve. Their voice streams through WebRTC to your DI box and venue PA. No hardware required for attendees.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Admin */}
          <button onClick={() => navigate('/admin/login')}
            className="glass-hover group p-8 text-left">
            <div className="w-14 h-14 rounded-2xl mb-5 flex items-center justify-center"
              style={{ background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.3)' }}>
              <svg className="w-7 h-7 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2 group-hover:text-brand-300 transition-colors">Admin / Moderator</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">
              Create events, manage the speaker queue, approve attendees, and route audio to your DI box and venue PA system.
            </p>
            <div className="flex items-center gap-2 text-brand-400 text-sm font-medium">
              Sign in or create account
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </button>

          {/* Attendee */}
          <div className="glass p-8" style={{ borderColor:'rgba(52,211,153,0.15)' }}>
            <div className="w-14 h-14 rounded-2xl mb-5 flex items-center justify-center"
              style={{ background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.2)' }}>
              <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Attendee</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">
              Scan the QR code displayed at the venue, or enter the session code below. No account or app needed.
            </p>
            <div className="flex gap-2">
              <input className="input-field flex-1 py-2.5 text-sm" placeholder="Session code  e.g. A3F9B2E1"
                value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={8}
                onKeyDown={e => e.key === 'Enter' && code.length >= 6 && navigate(`/join/${code}`)}/>
              <button onClick={() => code.length >= 6 && navigate(`/join/${code}`)}
                disabled={code.length < 6}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
                style={{ background:'rgba(52,211,153,0.12)', color:'#34d399', border:'1px solid rgba(52,211,153,0.25)' }}>
                Join
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
