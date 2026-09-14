import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Brand, WaveBars } from '../components/UI'
import { useWebRTC } from '../hooks/useWebRTC'

/*
 * HostAudio — runs on the MODERATOR'S LAPTOP in a separate browser tab
 *
 * This page is the hardware bridge:
 *   Approved speaker's phone
 *     └─ WebRTC audio stream (peer-to-peer, ~100ms latency)
 *         └─ <audio id="ov-audio-out"> HTML element
 *             └─ setSinkId() routes to selected output device
 *                 └─ Laptop headphone jack  (3.5mm)
 *                     └─ 3.5mm → 6.35mm cable
 *                         └─ DI Box INPUT
 *                             └─ DI Box XLR OUTPUT (balanced)
 *                                 └─ XLR cable → Venue Mixer channel
 *                                     └─ Venue PA Speakers
 *
 * KEEP THIS TAB OPEN for the entire event.
 * Minimise it — never close it.
 */

export default function HostAudio() {
  const { code } = useParams<{ code: string }>()
  const hostId = useRef(`host-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`)

  const {
    isConnected,
    outputDevices,
    selectedOutputId,
    setOutputDevice,
    outputVolume,
    setOutputVolume,
    startHost,
  } = useWebRTC(code!, hostId.current, 'host')

  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null)
  const [signalLevel, setSignalLevel] = useState(0)
  const [sinkIdSupported, setSinkIdSupported] = useState(true)

  // Start the WebRTC host listener on mount
  useEffect(() => {
    startHost()
    // Check if setSinkId is supported (not available in Firefox)
    const audio = document.getElementById('ov-audio-out') as any
    if (audio && !audio.setSinkId) setSinkIdSupported(false)
  }, [startHost])

  // Watch for active speaker changes in the queue
  useEffect(() => {
    const ch = supabase.channel(`host-watch:${code}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'speaker_queue'
      }, async ({ new: row }) => {
        if (row.status === 'approved' || row.status === 'speaking') {
          const { data } = await supabase
            .from('attendees').select('name').eq('id', row.attendee_id).single()
          setActiveSpeaker(data?.name || 'Unknown')
        }
        if (row.status === 'done' || row.status === 'rejected') {
          setActiveSpeaker(null)
          setSignalLevel(0)
        }
      })
      .subscribe()
    return () => { ch.unsubscribe() }
  }, [code])

  // Fake audio level animation when connected (real level needs AudioWorklet on host side)
  useEffect(() => {
    if (!isConnected || !activeSpeaker) { setSignalLevel(0); return }
    const id = setInterval(() => setSignalLevel(Math.random() * 60 + 30), 120)
    return () => clearInterval(id)
  }, [isConnected, activeSpeaker])

  const status = isConnected && activeSpeaker ? 'live'
    : activeSpeaker ? 'connecting'
    : 'waiting'

  const statusCfg = {
    waiting:    { label: 'Waiting for speaker', dot: 'bg-slate-500', ring: 'border-slate-500/20', text: 'text-slate-400' },
    connecting: { label: 'Connecting audio…',   dot: 'bg-amber-400 animate-pulse', ring: 'border-amber-500/20', text: 'text-amber-400' },
    live:       { label: 'Audio streaming live', dot: 'bg-emerald-400 animate-pulse', ring: 'border-emerald-500/20', text: 'text-emerald-400' },
  }
  const st = statusCfg[status]

  return (
    <div className="min-h-screen bg-dark-900 text-white flex flex-col">
      {/*
        THE MOST IMPORTANT ELEMENT IN THE APP.
        This hidden <audio> element receives the WebRTC stream from the
        approved attendee's phone. setSinkId() routes its output to
        whatever physical audio device the admin selects in the dropdown
        below — which should be the headphone jack connected to your DI box.
      */}
      <audio id="ov-audio-out" autoPlay playsInline className="hidden"/>

      {/* Nav */}
      <nav className="border-b border-white/5 bg-dark-800/70 backdrop-blur-lg px-6 py-4 flex items-center justify-between">
        <Brand/>
        <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border ${st.ring} ${st.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}/>
          {st.label}
        </div>
        <code className="text-xs text-slate-500 font-mono">Session: {code}</code>
      </nav>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-5 mb-5">

          {/* Speaker panel */}
          <div className="glass p-6 flex flex-col items-center justify-center text-center min-h-52">
            {activeSpeaker ? (
              <>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl text-emerald-300 mb-4"
                  style={{ background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.2)' }}>
                  {activeSpeaker[0].toUpperCase()}
                </div>
                <p className="text-xl font-bold text-white mb-1">{activeSpeaker}</p>
                <p className="text-sm text-slate-400 mb-4">
                  {status === 'live' ? 'Audio streaming via WebRTC' : 'Approved — establishing connection'}
                </p>
                <WaveBars active={status === 'live'} level={signalLevel}/>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-dark-500 border border-white/5 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-7a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                  </svg>
                </div>
                <p className="text-slate-400 font-medium">No active speaker</p>
                <p className="text-xs text-slate-600 mt-1">Approve someone in the moderator dashboard</p>
              </>
            )}
          </div>

          {/* Hardware output controls */}
          <div className="glass p-6 space-y-5">
            <div>
              <p className="text-sm font-semibold text-white mb-1">Audio output device</p>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                Select your DI box or audio interface here. This is the physical device
                your laptop sends audio to — connect it to the venue mixer via XLR.
              </p>

              {!sinkIdSupported && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-xs text-amber-400 mb-3">
                  Output device selection requires Chrome or Edge. Firefox is not supported for this feature.
                </div>
              )}

              <select
                className="w-full bg-dark-600 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white
                           focus:outline-none focus:border-brand-500/50 transition-all"
                value={selectedOutputId}
                onChange={e => setOutputDevice(e.target.value)}
                disabled={!sinkIdSupported}
              >
                {outputDevices.length === 0 && (
                  <option value="">Default system output</option>
                )}
                {outputDevices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Audio device (${d.deviceId.slice(0, 8)})`}
                  </option>
                ))}
              </select>

              <p className="text-xs text-slate-600 mt-2">
                Plug your 3.5mm cable from the laptop headphone jack before selecting.
                If your DI box appears by name, select it directly.
              </p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <p className="text-sm font-semibold text-white">Volume</p>
                <p className="text-sm font-bold text-white">{outputVolume}%</p>
              </div>
              <input
                type="range" min={0} max={100} step={1}
                value={outputVolume}
                onChange={e => setOutputVolume(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
              <p className="text-xs text-slate-600 mt-1">
                Set this to 100% — control final volume on the mixer, not here.
              </p>
            </div>
          </div>
        </div>

        {/* Signal meter */}
        <div className="glass p-5 mb-5">
          <p className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">Signal monitor</p>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2.5 bg-dark-600 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-150"
                style={{
                  width: status === 'live' ? `${signalLevel}%` : '0%',
                  background: signalLevel > 80
                    ? 'linear-gradient(90deg,#6366f1,#f59e0b)'
                    : 'linear-gradient(90deg,#6366f1,#34d399)'
                }}/>
            </div>
            <span className="text-xs text-slate-500 w-24 text-right flex-shrink-0">
              {status === 'live' ? 'Signal active' : 'No signal'}
            </span>
          </div>
          {signalLevel > 85 && (
            <p className="text-xs text-amber-400 mt-2">Level is high — reduce mixer gain slightly</p>
          )}
        </div>

        {/* Hardware connection checklist */}
        <div className="glass p-5">
          <p className="text-sm font-semibold text-white mb-4">Hardware connection checklist</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { step: '1', text: 'Laptop 3.5mm jack → DI box INPUT (via 3.5mm to 6.35mm cable)', done: true },
              { step: '2', text: 'DI box XLR OUTPUT → Venue mixer channel (via XLR cable)', done: true },
              { step: '3', text: 'Select correct output device in dropdown above', done: !!selectedOutputId },
              { step: '4', text: 'Mixer channel MUTE = off, FADER = 0dB', done: false },
              { step: '5', text: 'Volume slider above = 100%', done: outputVolume === 100 },
              { step: '6', text: 'Keep this tab open — do not close during event', done: true },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-3 bg-dark-600 rounded-xl p-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${
                  item.done
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                    : 'bg-dark-400 border border-white/10 text-slate-500'
                }`}>
                  {item.done ? '✓' : item.step}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-amber-500/8 border border-amber-500/15 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-400 mb-1.5">If you hear a 50Hz hum from PA speakers</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Flip the <span className="text-white font-medium">Ground Lift</span> switch on the DI box to ON.
              This happens because the laptop charger and mixer share the same mains ground — the DI box isolates them.
              The hum stops the instant you flip the switch.
            </p>
          </div>

          <div className="mt-3 bg-red-500/8 border border-red-500/15 rounded-xl p-4">
            <p className="text-xs font-semibold text-red-400 mb-1.5">Critical: use Chrome or Edge on this laptop</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Only Chromium browsers support <code className="text-slate-300">setSinkId()</code> which routes audio
              to a specific output device. Firefox plays audio only through the system default — you cannot choose the DI box.
              Also ensure this page is served over HTTPS in production.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
