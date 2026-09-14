import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Brand, Particles, Spinner, ErrorBox } from '../components/UI'

const RULES = [
  { id: 'len',   label: 'At least 8 characters',         test: (p: string) => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter (A–Z)',     test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter (a–z)',     test: (p: string) => /[a-z]/.test(p) },
  { id: 'num',   label: 'One number (0–9)',               test: (p: string) => /[0-9]/.test(p) },
  { id: 'sym',   label: 'One special character (!@#$…)',  test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)
  const [ready, setReady]         = useState(false)

  // Supabase puts the session tokens in the URL hash after redirect
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
      else setError('This reset link is invalid or has expired. Please request a new one.')
    })
  }, [])

  const passwordValid = RULES.every(r => r.test(password))

  const submit = async () => {
    setError('')
    if (!passwordValid) { setError('Password does not meet all requirements.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSuccess(true)
    setTimeout(() => navigate('/admin'), 3000)
  }

  return (
    <div className="relative min-h-screen bg-dark-900 flex items-center justify-center overflow-hidden p-4">
      <Particles/>
      <div className="absolute inset-0 bg-grid pointer-events-none"/>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center,rgba(99,102,241,0.1) 0%,transparent 65%)' }}/>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex mb-6"><Brand/></div>
          <h1 className="text-2xl font-bold text-white mb-1">Set new password</h1>
          <p className="text-slate-400 text-sm">Choose a strong password for your account.</p>
        </div>

        <div className="glass p-8">
          {success ? (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <p className="text-emerald-400 font-medium">Password updated!</p>
              <p className="text-slate-400 text-sm">Redirecting you to sign in…</p>
            </div>
          ) : (
            <div className="space-y-4">
              {error && !ready && <ErrorBox msg={error}/>}

              {ready && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">New password</label>
                    <div className="relative">
                      <input
                        className="input-field pr-10"
                        type={showPw ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                        {showPw
                          ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                          : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>}
                      </button>
                    </div>

                    {/* Strength bar */}
                    {password && (() => {
                      const passed = RULES.filter(r => r.test(password)).length
                      const colors = ['#ef4444','#ef4444','#f97316','#eab308','#22c55e','#6366f1']
                      const labels = ['','Very weak','Weak','Fair','Strong','Very strong']
                      const c = colors[passed]; const l = labels[passed]
                      return (
                        <div className="mt-2">
                          <div className="flex gap-1 mb-1">
                            {RULES.map((_,i) => (
                              <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                                style={{ background: i < passed ? c : '#334155' }}/>
                            ))}
                          </div>
                          <p className="text-xs" style={{ color: c }}>{l}</p>
                        </div>
                      )
                    })()}

                    {/* Checklist */}
                    {password && (
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
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirm password</label>
                    <input
                      className="input-field"
                      type="password"
                      placeholder="••••••••"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && submit()}
                    />
                    {confirm && password !== confirm && (
                      <p className="text-xs text-red-400 mt-1">Passwords do not match.</p>
                    )}
                  </div>

                  {error && <ErrorBox msg={error}/>}

                  <button onClick={submit} disabled={loading || !passwordValid || password !== confirm}
                    className="btn-primary py-3 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? <><Spinner/>Updating…</> : 'Set new password'}
                  </button>
                </>
              )}

              {!ready && !error && (
                <div className="flex justify-center py-4"><Spinner/></div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
