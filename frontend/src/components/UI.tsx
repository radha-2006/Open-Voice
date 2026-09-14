import { useEffect, useRef } from 'react'

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8"/><stop offset="1" stopColor="#6366f1"/>
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#lg)" opacity="0.15"/>
      <rect width="40" height="40" rx="10" fill="none" stroke="url(#lg)" strokeWidth="1"/>
      <path d="M20 8C15.58 8 12 11.58 12 16v6c0 4.42 3.58 8 8 8s8-3.58 8-8v-6c0-4.42-3.58-8-8-8z" fill="url(#lg)" opacity="0.9"/>
      <path d="M8 20c0 6.63 5.37 12 12 12s12-5.37 12-12" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <line x1="20" y1="32" x2="20" y2="36" stroke="#818cf8" strokeWidth="2" strokeLinecap="round"/>
      <line x1="15" y1="36" x2="25" y2="36" stroke="#818cf8" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function Brand({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 24 : size === 'lg' ? 44 : 32
  const ts = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-xl'
  return (
    <div className="flex items-center gap-2.5">
      <Logo size={sz}/>
      <span className={`${ts} font-bold tracking-tight`}>
        <span className="text-white">Open</span><span className="text-brand-400">Voice</span>
      </span>
    </div>
  )
}

export function Spinner({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}

export function WaveBars({ active = false, level = 0 }: { active?: boolean; level?: number }) {
  const bars = 10
  return (
    <div className="flex items-center gap-0.5 h-8">
      {Array.from({ length: bars }).map((_, i) => {
        const delay = (i * 0.12) % 1.2
        const h = active ? `${Math.max(20, Math.min(100, level + Math.sin(i * 0.9) * 28))}%` : '18%'
        return (
          <div key={i} className="wave-bar" style={{
            animationDelay: `${delay}s`,
            animationPlayState: active ? 'running' : 'paused',
            height: h,
            opacity: active ? 0.85 : 0.18,
            transition: 'height 0.08s ease, opacity 0.3s'
          }}/>
        )
      })}
    </div>
  )
}

export function MicRing({ active = false, level = 0, muted = false }: { active?: boolean; level?: number; muted?: boolean }) {
  const glow = active && !muted ? Math.round(15 + (level / 100) * 25) : 0
  const scale = active && !muted ? 1 + (level / 100) * 0.12 : 1
  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      {active && !muted && [1, 2].map(i => (
        <div key={i} className="absolute rounded-full border border-brand-500/25"
          style={{ width: `${64 + i * 26}px`, height: `${64 + i * 26}px`,
            opacity: Math.max(0, 0.7 - i * 0.28 - (level / 200)),
            animation: `ping2 ${1.2 + i * 0.4}s ease-out infinite`,
            animationDelay: `${i * 0.3}s`
          }}/>
      ))}
      <div className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-100"
        style={{
          background: active && !muted ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(30,30,53,0.9)',
          boxShadow: active && !muted ? `0 0 ${glow}px rgba(99,102,241,0.6)` : 'none',
          transform: `scale(${scale})`,
        }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M12 1C9.24 1 7 3.24 7 6v6c0 2.76 2.24 5 5 5s5-2.24 5-5V6c0-2.76-2.24-5-5-5z"
            fill={active && !muted ? 'white' : '#818cf8'}/>
          <path d="M3 11c0 4.97 4.03 9 9 9s9-4.03 9-9" stroke={active && !muted ? 'white' : '#818cf8'}
            strokeWidth="2" strokeLinecap="round" fill="none"/>
          <line x1="12" y1="20" x2="12" y2="23" stroke={active && !muted ? 'white' : '#818cf8'}
            strokeWidth="2" strokeLinecap="round"/>
          <line x1="8" y1="23" x2="16" y2="23" stroke={active && !muted ? 'white' : '#818cf8'}
            strokeWidth="2" strokeLinecap="round"/>
          {muted && <line x1="3" y1="3" x2="21" y2="21" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>}
        </svg>
      </div>
    </div>
  )
}

export function Particles() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    let W = window.innerWidth, H = window.innerHeight
    c.width = W; c.height = H
    const pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
      r: Math.random() * 1.4 + .4, o: Math.random() * .35 + .08
    }))
    let id: number
    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(99,102,241,${p.o})`; ctx.fill()
      })
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y)
        if (d < 90) {
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y)
          ctx.strokeStyle = `rgba(99,102,241,${(1 - d / 90) * .1})`; ctx.lineWidth = .5; ctx.stroke()
        }
      }
      id = requestAnimationFrame(draw)
    }
    draw()
    const onResize = () => { W = window.innerWidth; H = window.innerHeight; c.width = W; c.height = H }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', onResize) }
  }, [])
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-0"/>
}

export function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-sm text-red-400">
      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      {msg}
    </div>
  )
}
