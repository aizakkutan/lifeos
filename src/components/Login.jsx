import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signupDone, setSignupDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        // Clone template structure for the new user
        await cloneTemplateForNewUser(email)
        setSignupDone(true)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Clones the admin's org structure as a starting template for new users
  async function cloneTemplateForNewUser(newUserEmail) {
    try {
      // Find the admin user's orgs to use as template
      const { data: adminProfile } = await supabase.from('profiles').select('id').eq('is_admin', true).limit(1).single()
      if (!adminProfile) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: templateOrgs } = await supabase.from('orgs').select('*').eq('user_id', adminProfile.id)
      if (!templateOrgs?.length) return

      for (const org of templateOrgs) {
        const newOrgId = `${org.id}-${user.id.slice(0, 6)}`
        await supabase.from('orgs').insert([{
          id: newOrgId, name: org.name, tag: org.tag, color: org.color,
          sort_order: org.sort_order, user_id: user.id,
        }])

        const { data: templateSubs } = await supabase.from('subprojects').select('*').eq('org_id', org.id).eq('user_id', adminProfile.id)
        for (const sub of templateSubs || []) {
          await supabase.from('subprojects').insert([{
            org_id: newOrgId, name: sub.name, sort_order: sub.sort_order, user_id: user.id,
          }])
        }
      }
    } catch (e) {
      console.error('Template clone failed (non-fatal):', e)
    }
  }

  if (signupDone) {
    return (
      <Shell>
        <div style={{ fontSize: 40, marginBottom: 8 }}>✉️</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1C1C1E', marginBottom: 6 }}>Check your email</div>
        <div style={{ fontSize: 13, color: '#8E8E93', lineHeight: 1.5 }}>
          We've sent a confirmation link to <strong>{email}</strong>. Click it, then come back and sign in.
        </div>
        <button
          onClick={() => { setSignupDone(false); setMode('signin') }}
          style={{ marginTop: 16, background: 'none', border: 'none', color: '#007AFF', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}
        >
          Back to sign in
        </button>
      </Shell>
    )
  }

  return (
    <Shell>
      <div style={{
        width: 48, height: 48, borderRadius: 14, background: '#E5F1FF', color: '#007AFF',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 4px',
      }}>
        🔒
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#1C1C1E', letterSpacing: '-0.02em' }}>LifeOS</div>
      <div style={{ fontSize: 13, color: '#8E8E93', marginBottom: 4 }}>
        {mode === 'signin' ? 'Sign in to your workspace' : 'Create your account'}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        <input
          type="email"
          autoFocus
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          style={inputStyle}
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          style={inputStyle}
        />
        {error && <div style={{ fontSize: 12, color: '#FF3B30' }}>{error}</div>}
        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <button
        onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError('') }}
        style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter,sans-serif', marginTop: 4 }}
      >
        {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
    </Shell>
  )
}

function Shell({ children }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F2F2F7', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: '2rem',
    }}>
      <div style={{
        background: '#FFFFFF', borderRadius: 16, padding: '2.5rem 2rem', width: 340, maxWidth: '100%',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 14,
        textAlign: 'center', alignItems: 'center',
      }}>
        {children}
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', fontSize: 15, padding: '11px 14px', borderRadius: 10,
  border: '1px solid rgba(0,0,0,.1)', background: '#F2F2F7', color: '#1C1C1E',
  outline: 'none', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box',
}

const btnStyle = {
  background: '#007AFF', color: '#fff', border: 'none', borderRadius: 10,
  padding: '11px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  fontFamily: "'Inter', sans-serif",
}
