import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Brand, Particles, Spinner, ErrorBox } from '../components/UI'

// ── Password rules ────────────────────────────────────────────
const RULES = [
  { id: 'len',   label: 'At least 8 characters',          test: (p: string) => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter (A–Z)',      test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter (a–z)',      test: (p: string) => /[a-z]/.test(p) },
  { id: 'num',   label: 'One number (0–9)',                test: (p: string) => /[0-9]/.test(p) },
  { id: 'sym',   label: 'One special character (!@#$…)',   test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

function passwordStrength(p: string): { score: number; label: string; color: string } {
  const passed = RULES.filter(r => r.test(p)).length
  if (passed <= 1) return { score: passed, label: 'Very weak',  color: '#ef4444' }
  if (passed === 2) return { score: passed, label: 'Weak',       color: '#f97316' }
  if (passed === 3) return { score: passed, label: 'Fair',       color: '#eab308' }
  if (passed === 4) return { score: passed, label: 'Strong',     color: '#22c55e' }
  return             { score: passed, label: 'Very strong', color: '#6366f1' }
}

function PasswordChecklist({ password }: { password: string }) {
  if (!password) return null
  return (
    <ul className="space-y-1 mt-2">
      {RULES.map(r => {
        const ok = r.test(password)
        return (
          <li key={r.id} className={`flex items-center gap-2 text-xs transition-colors ${ok ? 'text-emerald-400' : 'text-slate-500'}`}>
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {ok
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>}
            </svg>
            {r.label}
          </li>
        )
      })}
    </ul>
  )
}

function StrengthBar({ password }: { password: string }) {
  if (!password) return null
  const { score, label, color } = passwordStrength(password)
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {RULES.map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i < score ? color : '#334155' }}/>
        ))}
      </div>
      <p className="text-xs" style={{ color }}>{label}</p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
type Tab = 'login' | 'signup' | 'forgot'

export default function AdminLogin() {
  const { signIn, signUp, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab]           = useState<Tab>('login')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [info, setInfo]         = useState('')

  const switchTab = (t: Tab) => { setTab(t); setError(''); setInfo('') }

  const passwordValid = RULES.every(r => r.test(password))

  const submit = async () => {
    setError(''); setInfo('')

    if (tab === 'forgot') {
      if (!email.trim()) { setError('Please enter your email address.'); return }
      setLoading(true)
      const err = await resetPassword(email.trim())
      setLoading(false)
      if (err) setError(err)
      else setInfo('Reset link sent! Check your email inbox (and spam folder).')
      return
    }

    if (tab === 'signup') {
      if (!name.trim())    { setError('Please enter your name.'); return }
      if (!email.trim())   { setError('Please enter your email.'); return }
      if (!passwordValid)  { setError('Password does not meet all requirements below.'); return }
      setLoading(true)
      const err = await signUp(email.trim(), password, name.trim())
      setLoading(false)
      if (err) setError(err)
      else { setInfo('Account created! Check your email to confirm, then sign in.'); switchTab('login') }
      return
    }

    // login
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return }
    setLoading(true)
    const err = await signIn(email.trim(), password)
    setLoading(false)
    if (err) setError(err)
    else navigate('/admin/dashboard')
  }

  return (
    <div className="relative min-h-screen bg-dark-900 flex items-center justify-center overflow-hidden p-4">
      <Particles/>
      <div className="absolute inset-0 bg-grid pointer-events-none"/>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center,rgba(99,102,241,0.1) 0%,transparent 65%)' }}/>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <button onClick={() => navigate('/')} className="inline-flex mb-6"><Brand/></button>
          <h1 className="text-2xl font-bold text-white mb-1">Admin portal</h1>
          <p className="text-slate-400 text-sm">Manage your live Q&amp;A sessions</p>
        </div>

        <div className="glass p-8">
          {/* Tab bar — only show for login/signup */}
          {tab !== 'forgot' && (
            <div className="flex bg-dark-700 rounded-xl p-1 mb-6">
              {(['login','signup'] as const).map(t => (
                <button key={t} onClick={() => switchTab(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    tab === t ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                  {t === 'login' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>
          )}

          {/* Forgot password heading */}
          {tab === 'forgot' && (
            <div className="mb-6">
              <button onClick={() => switchTab('login')}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-4 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                </svg>
                Back to sign in
              </button>
              <h2 className="text-white font-semibold text-lg">Reset your password</h2>
              <p className="text-slate-400 text-sm mt-1">We'll send a reset link to your email.</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Name — signup only */}
            {tab === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Full name</label>
                <input className="input-field" placeholder="Your name" value={name}
                  onChange={e => setName(e.target.value)}/>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
              <input className="input-field" type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)}/>
            </div>

            {/* Password — login + signup only */}
            {tab !== 'forgot' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    className="input-field pr-10"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submit()}
                  />
                  <button type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                    {showPw
                      ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                      : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>}
                  </button>
                </div>

                {/* Strength bar + checklist on signup */}
                {tab === 'signup' && (
                  <>
                    <StrengthBar password={password}/>
                    <PasswordChecklist password={password}/>
                  </>
                )}

                {/* Forgot password link on login */}
                {tab === 'login' && (
                  <div className="text-right mt-1.5">
                    <button onClick={() => switchTab('forgot')}
                      className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Error / info banners */}
            {error && <ErrorBox msg={error}/>}
            {info && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5 text-sm text-emerald-400">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                </svg>
                {info}
              </div>
            )}

            {/* Submit button */}
            <button onClick={submit} disabled={loading} className="btn-primary py-3 flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <><Spinner/>{tab === 'login' ? 'Signing in…' : tab === 'signup' ? 'Creating…' : 'Sending…'}</>
              ) : (
                tab === 'login' ? 'Sign in' : tab === 'signup' ? 'Create account' : 'Send reset link'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
