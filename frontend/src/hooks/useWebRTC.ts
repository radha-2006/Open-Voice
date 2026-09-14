/**
 * useWebRTC — OpenVoice real audio streaming hook
 *
 * SPEAKER side (attendee phone):
 *   1. getUserMedia captures mic at 48kHz with echo/noise cancellation
 *   2. RTCPeerConnection sends audio directly to host laptop
 *   3. Signaling (SDP offer/answer + ICE candidates) travels via Supabase Realtime
 *
 * HOST side (moderator laptop connected to DI box):
 *   1. Receives the audio track from the speaker's phone
 *   2. Plays it through the HTML <audio> element
 *   3. setSinkId() routes it to whichever physical output the admin selects
 *      (the headphone jack → 3.5mm cable → DI box input → XLR → mixer → PA)
 */

import { useRef, useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
}

type Role = 'speaker' | 'host'

export interface WebRTCState {
  isConnected: boolean
  isMicActive: boolean
  audioLevel: number          // 0–100, driven by real AnalyserNode data
  error: string | null
  startSpeaker: () => Promise<void>
  stopSpeaker: () => void
  muteMic: (muted: boolean) => void
  // Host-only
  startHost: () => Promise<void>
  outputDevices: MediaDeviceInfo[]
  selectedOutputId: string
  setOutputDevice: (deviceId: string) => void
  outputVolume: number
  setOutputVolume: (v: number) => void
}

export function useWebRTC(sessionCode: string, peerId: string, role: Role): WebRTCState {
  const pcRef   = useRef<RTCPeerConnection | null>(null)
  const chanRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number>(0)

  const [isConnected, setIsConnected]   = useState(false)
  const [isMicActive, setIsMicActive]   = useState(false)
  const [audioLevel, setAudioLevel]     = useState(0)
  const [error, setError]               = useState<string | null>(null)
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedOutputId, setSelectedOutputId] = useState<string>('')
  const [outputVolume, setOutputVolume] = useState(100)

  const sigChannel = `ov-rtc:${sessionCode}`

  // ── Cleanup everything ───────────────────────────────────────
  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    pcRef.current?.close()
    chanRef.current?.unsubscribe()
    audioCtxRef.current?.close()
    pcRef.current = null
    streamRef.current = null
    audioCtxRef.current = null
    analyserRef.current = null
    setIsConnected(false)
    setIsMicActive(false)
    setAudioLevel(0)
  }, [])

  // ── Enumerate audio output devices (for host to pick DI box) ─
  useEffect(() => {
    if (role !== 'host') return
    const getDevices = async () => {
      const devs = await navigator.mediaDevices.enumerateDevices()
      const outs = devs.filter(d => d.kind === 'audiooutput')
      setOutputDevices(outs)
      if (outs.length > 0 && !selectedOutputId) setSelectedOutputId(outs[0].deviceId)
    }
    getDevices()
    navigator.mediaDevices.addEventListener('devicechange', getDevices)
    return () => navigator.mediaDevices.removeEventListener('devicechange', getDevices)
  }, [role, selectedOutputId])

  // ── Apply output device selection to the host audio element ──
  useEffect(() => {
    if (role !== 'host') return
    const audio = document.getElementById('ov-audio-out') as HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }
    if (audio && selectedOutputId && audio.setSinkId) {
      audio.setSinkId(selectedOutputId).catch(() => {})
    }
  }, [selectedOutputId, role])

  // ── Apply volume to host audio element ───────────────────────
  useEffect(() => {
    if (role !== 'host') return
    const audio = document.getElementById('ov-audio-out') as HTMLAudioElement
    if (audio) audio.volume = outputVolume / 100
  }, [outputVolume, role])

  // ── HOST: listen for offer, respond with answer ───────────────
  const startHost = useCallback(async () => {
    cleanup()
    const pc = new RTCPeerConnection(STUN_SERVERS)
    pcRef.current = pc

    // When audio arrives from the speaker's phone
    pc.ontrack = (event) => {
      const audio = document.getElementById('ov-audio-out') as HTMLAudioElement
      if (audio) {
        audio.srcObject = event.streams[0]
        audio.play().catch(() => {})
      }
      setIsConnected(true)
    }

    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState
      if (s === 'connected' || s === 'completed') setIsConnected(true)
      if (s === 'disconnected' || s === 'failed' || s === 'closed') setIsConnected(false)
    }

    const ch = supabase.channel(sigChannel, { config: { broadcast: { self: false } } })
    chanRef.current = ch

    // Receive offer from speaker's phone
    ch.on('broadcast', { event: 'offer' }, async ({ payload }: { payload: { from: string; sdp: RTCSessionDescriptionInit } }) => {
      if (payload.from === peerId) return
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        ch.send({ type: 'broadcast', event: 'answer', payload: { sdp: answer, to: payload.from, from: peerId } })
      } catch (e: any) { setError(`Host signaling error: ${e.message}`) }
    })

    // Receive ICE candidates from speaker
    ch.on('broadcast', { event: 'ice' }, async ({ payload }: { payload: { candidate: RTCIceCandidateInit; from: string } }) => {
      if (payload.from === peerId) return
      try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)) } catch {}
    })

    await ch.subscribe()
  }, [cleanup, sigChannel, peerId])

  // ── SPEAKER: capture mic, send offer ─────────────────────────
  const startSpeaker = useCallback(async () => {
    cleanup()
    setError(null)
    try {
      // Request microphone with professional audio settings
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
        },
        video: false,
      })
      streamRef.current = stream
      setIsMicActive(true)

      // Real-time audio level meter via Web Audio API AnalyserNode
      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)
      analyserRef.current = analyser
      const buf = new Uint8Array(analyser.frequencyBinCount)
      const measureLevel = () => {
        analyser.getByteFrequencyData(buf)
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length
        setAudioLevel(Math.min(100, avg * 2.2))
        rafRef.current = requestAnimationFrame(measureLevel)
      }
      measureLevel()

      // Create peer connection
      const pc = new RTCPeerConnection(STUN_SERVERS)
      pcRef.current = pc

      // Add mic track to the peer connection
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      const ch = supabase.channel(sigChannel, { config: { broadcast: { self: false } } })
      chanRef.current = ch

      // Send ICE candidates to host as they're discovered
      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          ch.send({ type: 'broadcast', event: 'ice', payload: { candidate: candidate.toJSON(), from: peerId } })
        }
      }

      pc.oniceconnectionstatechange = () => {
        const s = pc.iceConnectionState
        if (s === 'connected' || s === 'completed') setIsConnected(true)
        if (s === 'disconnected' || s === 'failed') {
          setIsConnected(false)
          setError('Connection lost. The moderator may have ended your turn.')
        }
      }

      // Receive answer from host
      ch.on('broadcast', { event: 'answer' }, async ({ payload }: { payload: { sdp: RTCSessionDescriptionInit; to: string } }) => {
        if (payload.to !== peerId) return
        try { await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp)) } catch {}
      })

      await ch.subscribe()

      // Create and send offer to host
      const offer = await pc.createOffer({ offerToReceiveAudio: false })
      await pc.setLocalDescription(offer)
      ch.send({ type: 'broadcast', event: 'offer', payload: { sdp: offer, from: peerId } })

    } catch (err: any) {
      setIsMicActive(false)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone permission denied. Tap the lock icon in your browser address bar and allow microphone access, then try again.')
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found on this device.')
      } else if (err.name === 'NotReadableError') {
        setError('Microphone is in use by another app. Close other apps and try again.')
      } else {
        setError(`Could not start microphone: ${err.message}`)
      }
    }
  }, [cleanup, sigChannel, peerId])

  const stopSpeaker = useCallback(() => cleanup(), [cleanup])

  const muteMic = useCallback((muted: boolean) => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => { t.enabled = !muted })
    }
  }, [])

  const setOutputDevice = useCallback((deviceId: string) => {
    setSelectedOutputId(deviceId)
  }, [])

  useEffect(() => { return cleanup }, [cleanup])

  return {
    isConnected, isMicActive, audioLevel, error,
    startSpeaker, stopSpeaker, muteMic,
    startHost,
    outputDevices, selectedOutputId, setOutputDevice,
    outputVolume, setOutputVolume: (v: number) => setOutputVolume(v),
  }
}
