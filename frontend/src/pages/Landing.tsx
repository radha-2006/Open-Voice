import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brand, Particles, WaveBars } from '../components/UI'

export default function Landing() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'tech' | 'architecture'>('overview')

  return (
    <div className="relative min-h-screen bg-dark-900 flex flex-col items-center justify-between overflow-hidden p-4 md:p-8 font-sans selection:bg-brand-500 selection:text-white">
      <Particles/>
      
      {/* Futuristic Background Glows */}
      <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none"/>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-20 blur-[120px]"
        style={{ background: 'radial-gradient(circle, #6366f1 0%, #a855f7 50%, transparent 70%)' }}/>
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] rounded-full pointer-events-none opacity-15 blur-[100px]"
        style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }}/>

      {/* Navigation Header */}
      <header className="relative z-10 w-full max-w-6xl flex items-center justify-between py-4 border-b border-white/5">
        <Brand size="lg"/>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-dark-800/80 border border-white/10 rounded-full px-3.5 py-1 text-xs text-slate-300 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
            WebRTC P2P Direct Stream
          </div>
          <button onClick={() => navigate('/admin/login')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 transition-all shadow-lg shadow-brand-500/20">
            Admin Portal
          </button>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="relative z-10 w-full max-w-5xl my-auto py-12 flex flex-col items-center">
        
        {/* Futuristic Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 backdrop-blur-md text-brand-300 text-xs font-semibold mb-8 shadow-inner">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"/>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"/>
          </span>
          Next-Gen Live Audience Q&amp;A Architecture
        </div>

        {/* Hero Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-center tracking-tight leading-none mb-6">
          <span className="text-white">Every Phone is a </span><br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-brand-400 to-purple-400 animate-gradient">
            Live Networked Mic
          </span>
        </h1>

        <p className="text-slate-400 text-base md:text-xl text-center max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Transform audience smartphones into high-fidelity microphones. 
          Scan a QR code, manage real-time speaker queues, and stream crystal-clear audio directly to your venue PA.
        </p>

        {/* Primary Interactive Cards Section */}
        <div className="grid md:grid-cols-2 gap-6 w-full mb-12">
          
          {/* Admin / Moderator Portal Card */}
          <button onClick={() => navigate('/admin/login')}
            className="group relative p-8 rounded-3xl text-left transition-all duration-300 overflow-hidden glass border border-indigo-500/20 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"/>
            
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-indigo-500/15 border border-indigo-500/30 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Moderator Hub
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
              Admin &amp; Moderator
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 font-light">
              Create live events, monitor real-time queue counts, approve speakers, and pipe audio directly to your DI Box &amp; venue mixer.
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <span className="text-indigo-400 text-sm font-semibold flex items-center gap-2">
                Launch Command Center
                <svg className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7M3 12h18"/>
                </svg>
              </span>
              <span className="w-2 h-2 rounded-full bg-indigo-400"/>
            </div>
          </button>

          {/* Attendee Join Card */}
          <div className="relative p-8 rounded-3xl text-left glass border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"/>

            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30">
                <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Instant Join
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Attendee Portal</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 font-light">
              Scan the venue QR code or enter your 8-digit session code to join the queue. Zero app installs required.
            </p>

            <div className="flex gap-2">
              <input className="input-field flex-1 py-3 text-sm bg-dark-800/90 border-emerald-500/20 focus:border-emerald-400 font-mono uppercase tracking-wider"
                placeholder="ENTER CODE (e.g. A3F9B2E1)"
                value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={8}
                onKeyDown={e => e.key === 'Enter' && code.length >= 6 && navigate(`/join/${code}`)}/>
              <button onClick={() => code.length >= 6 && navigate(`/join/${code}`)}
                disabled={code.length < 6}
                className="px-5 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 flex items-center gap-1.5 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff' }}>
                Join
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Live System Capabilities Banner & Stats */}
        <div className="w-full glass p-6 rounded-2xl border border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-1">Latency</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">&lt; 100ms</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Ultra-Low WebRTC P2P</span>
          </div>
          <div className="flex flex-col items-center border-l border-white/5">
            <span className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-1">Queue Control</span>
            <span className="text-2xl font-black text-brand-400 font-mono">Live Counter</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Smart Realtime Order</span>
          </div>
          <div className="flex flex-col items-center border-l border-white/5">
            <span className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-1">Hardware</span>
            <span className="text-2xl font-black text-purple-400 font-mono">DI Box Ready</span>
            <span className="text-[11px] text-slate-500 mt-0.5">XLR / Mixer Balanced</span>
          </div>
          <div className="flex flex-col items-center border-l border-white/5">
            <span className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-1">Security</span>
            <span className="text-2xl font-black text-indigo-400 font-mono">Encrypted</span>
            <span className="text-[11px] text-slate-500 mt-0.5">DTLS-SRTP Audio Pipe</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl flex flex-col sm:flex-row items-center justify-between py-6 border-t border-white/5 text-xs text-slate-500 gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"/>
          <span>OpenVoice Engine v2.0 • Live Event Platform</span>
        </div>
        <div>
          Powered by Supabase Realtime &amp; WebRTC Audio Streams
        </div>
      </footer>
    </div>
  )
}
